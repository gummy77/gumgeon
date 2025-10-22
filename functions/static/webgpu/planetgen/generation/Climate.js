import { createGPUBuffer } from "../util/renderUtil.js";
import { noiseWGSL } from "../util/noise.js";
import { genericWGSL } from "../core/generic.js";

var climateShader;

var climateBindGroup;

var climatePipelineLayout;

var climateTickPipeline;
var tempuratureTickPipeline;
var humidityTickPipeline;
var biomeTickPipeline;


export async function setupClimate(setupData, cellStateStorage) {
    // Timer
    var climateSetupTime = performance.now();

    //#region Shader
    climateShader = setupData.device.createShaderModule({label: "Climate Compute Shader", code: ClimateWGSL + genericWGSL + noiseWGSL});

    //#region Bind Group Layout
    var climateBindGroupLayout = setupData.device.createBindGroupLayout({
        label: "Climate Bind Group Layout",
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage"}
            }, {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage"}
            }
        ]
    });

    //#region Size Buffer
    var size = new Uint32Array([setupData.resolution, setupData.resolution]);
    var sizeBuffer = createGPUBuffer(setupData.device, size, GPUBufferUsage.UNIFORM)

    //#region Bind Group
    climateBindGroup = setupData.device.createBindGroup({
        label: "Climate Bind Group",
        layout: climateBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: sizeBuffer } },
            { binding: 1, resource: { buffer: cellStateStorage[0] } },
            { binding: 2, resource: { buffer: cellStateStorage[1] } },
        ]
    });

    //#region Pipeline Layout
    climatePipelineLayout = setupData.device.createPipelineLayout({
        label: "Climate Pipleline Layout",
        bindGroupLayouts: [ climateBindGroupLayout ]
    });

    //#region Climate Setup Pipeline
    var climateSetupPipeline = setupData.device.createComputePipeline({
        label: "Climate Setup Pipeline",
        layout: climatePipelineLayout,
        compute: {
            module: climateShader,
            entryPoint: "setup",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    //#region Pipelines
    var climateSetupPipeline = setupData.device.createComputePipeline({
        label: "Climate Setup Pipeline",
        layout: climatePipelineLayout,
        compute: {
            module: climateShader,
            entryPoint: "setup",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });
    climateTickPipeline = setupData.device.createComputePipeline({
        label: "Climate Tick Pipeline",
        layout: climatePipelineLayout,
        compute: {
            module: climateShader,
            entryPoint: "tickClimate",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });
    tempuratureTickPipeline = setupData.device.createComputePipeline({
        label: "Temperature Tick Pipeline",
        layout: climatePipelineLayout,
        compute: {
            module: climateShader,
            entryPoint: "tickTemperature",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });
    humidityTickPipeline = setupData.device.createComputePipeline({
        label: "Humidity Tick Pipeline",
        layout: climatePipelineLayout,
        compute: {
            module: climateShader,
            entryPoint: "tickHumidity",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });
    biomeTickPipeline = setupData.device.createComputePipeline({
        label: "Biome Tick Pipeline",
        layout: climatePipelineLayout,
        compute: {
            module: climateShader,
            entryPoint: "tickBiome",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });


    var encoder = setupData.device.createCommandEncoder();

    var climateComputePass = encoder.beginComputePass();
    climateComputePass.setPipeline(climateSetupPipeline);
    climateComputePass.setBindGroup(0, climateBindGroup);
    climateComputePass.dispatchWorkgroups(
        (setupData.resolution * setupData.resolution * 6) / setupData.blockSize
    );
    climateComputePass.end();
    setupData.device.queue.submit([encoder.finish()]);

    await setupData.device.queue.onSubmittedWorkDone();
    console.log("   Climate Setup Complete - " + Math.round((performance.now() - climateSetupTime) * 100) / 100 + "ms");
}

export async function tickClimate(tickData) {
    var encoder = tickData.device.createCommandEncoder();

    // climateTickPipeline = tickData.device.createComputePipeline({
    //     label: "Climate Tick Pipeline",
    //     layout: climatePipelineLayout,
    //     compute: {
    //         module: climateShader,
    //         entryPoint: "tickClimate",
    //         constants: {
    //             blockSize: tickData.blockSize,
    //             tick: tickData.step
    //         },
    //     }
    // });


    var climateTickComputePass = encoder.beginComputePass();
    switch(tickData.step % 4) {
        case 0:
            climateTickComputePass.setPipeline(tempuratureTickPipeline);
            break;
        case 1:
            climateTickComputePass.setPipeline(humidityTickPipeline);
            break;
        case 2:
            climateTickComputePass.setPipeline(biomeTickPipeline);
            break;
        default:
            return;
    }
    climateTickComputePass.setBindGroup(0, climateBindGroup);
    climateTickComputePass.dispatchWorkgroups(
        (tickData.resolution * tickData.resolution * 6) / tickData.blockSize
    );
    climateTickComputePass.end();
    tickData.device.queue.submit([encoder.finish()]);

    await tickData.device.queue.onSubmittedWorkDone();

}

const ClimateWGSL = /* wgsl */`
    @group(0) @binding(0) var<uniform> size: vec2u; 
    @group(0) @binding(1) var<storage, read_write> cellStatesIN: array<Cell>;
    @group(0) @binding(2) var<storage, read_write> cellStatesOUT: array<Cell>;

    override blockSize = 16;
    override tick: f32 = 0;


    @compute
    @workgroup_size(blockSize)
    fn setup(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cell: Cell = cellStatesIN[cellIndex];
        var cellData: CellData = constructCell(cell);

        let cellPosition = getPosition(cellIndex, size);

        cellData.Temperature = calculateTemperature(cellPosition, cellData.Height, size);
        cellData.Humidity = calculateHumidity(cellPosition, cellData.Height, size);;

        cellStatesIN[cellIndex] = deconstructCell(cellData);
    }

    @compute
    @workgroup_size(blockSize)
    fn tickClimate(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cell: Cell = cellStatesIN[cellIndex];
        var cellData: CellData = constructCell(cell);

        let cellPosition = getPosition(cellIndex, size);

        cellData.Temperature = calculateTemperature(cellPosition, cellData.Height, size);

        cellData.Humidity = calculateHumidity(cellPosition, cellData.Height, size);

        cellData.Biome = calculateBiome(cellData.Height, cellData.Temperature, cellData.Humidity);

        cellStatesIN[cellIndex] = deconstructCell(cellData);
    }
    @compute
    @workgroup_size(blockSize)
    fn tickTemperature(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cellData: CellData = constructCell(cellStatesIN[cellIndex]);

        let cellPosition = getPosition(cellIndex, size);
        cellData.Temperature = calculateTemperature(cellPosition, cellData.Height, size);

        cellStatesIN[cellIndex] = deconstructCell(cellData);
    }
    @compute
    @workgroup_size(blockSize)
    fn tickHumidity(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cellData: CellData = constructCell(cellStatesIN[cellIndex]);

        let cellPosition = getPosition(cellIndex, size);
        cellData.Humidity = calculateHumidity(cellPosition, cellData.Height, size);

        cellStatesIN[cellIndex] = deconstructCell(cellData);
    }
    @compute
    @workgroup_size(blockSize)
    fn tickBiome(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cellData: CellData = constructCell(cellStatesIN[cellIndex]);

        let cellPosition = getPosition(cellIndex, size);
        cellData.Biome = calculateBiome(cellData.Height, cellData.Temperature, cellData.Humidity);

        cellStatesIN[cellIndex] = deconstructCell(cellData);
    }

    /* -- Biomes --

     0 - Polar
     1 - Ocean
     2 - Tundra
     3 - Boreal Forest
     4 - Rainforest
     5 - Forest
     6 - Plains
     7 - Savanna
     8 - Desert

    */

    fn calculateBiome(height: i32, temperature: i32, humidity: u32) -> u32 {
        if(temperature < 5) {
            return 0;
        }
        if(height < 0) {
            return 1;
        }

        if(temperature < 10) {
            if(humidity < 15) {
                return 6;
            } else {
                return 3;
            }

        } else if(temperature < 20) {
            if(humidity < 25) {
                return 6;
            } else if(humidity < 50) {
                return 5;
            } else {
                return 4;
            }

        } else {
            if(humidity < 15) {
                return 8;
            } else if(humidity < 75) {
                return 7;
            } else {
                return 4;
            }
        }
    }

    fn calculateHumidity(cellPosition: vec2u, cellHeight: i32, size: vec2u) -> u32 {
        var humidity: u32 = 0;

        let poleMult: f32 = 1 - abs((f32(cellPosition.x) - f32(size.y/2)) / (f32(size.y/2)));
        humidity = u32((40 * pow(poleMult, 0.35)) - 20);

        let cellWorldPosition: vec3f = getCellWorldPosition(cellPosition, size) * vec3f(1, 0.5, 1);
        var noise1: f32 = Noise3(cellWorldPosition * 5) * 20;
        var noise2: f32 = Noise3(cellWorldPosition * 20) * 10;
        var noise3: f32 = Noise3(cellWorldPosition * 50) * 5;
        var noise4: f32 = Noise3(cellWorldPosition * 75) * 5;
        humidity += u32(noise1 + noise2 + noise3 + noise4);

        // humidity -= u32(((f32(cellHeight) / 3000)) * 10);

        let searchSize: i32 = i32(size.x) / 50;
    
        var count: f32 = 1;
        var oceanDist: f32 = 0;
        for(var x: i32 = -searchSize; x < searchSize; x += 1) {
            for(var y: i32 = -searchSize; y < searchSize; y += 1) {

                let otherCellPosition: vec2u = getRelativeCell(cellPosition, x, y, size);
                let otherIndex = getCellIndex(otherCellPosition, size);
                let other: Cell = cellStatesIN[otherIndex];
                let otherHeight: i32 = getBitHeight(other.BlockA);
                let otherTemp: i32 = getBitTemperature(other.BlockB);

                if(otherHeight <= 0 && otherTemp > 5 && otherTemp < 40) {
                    oceanDist += 1;
                }
                count += 1;
            }
        }
        humidity += u32((oceanDist / count) * 150);

        return clamp(humidity, 1, 99);
    }

    fn calculateTemperature(cellPosition: vec2u, cellHeight: i32, size: vec2u) -> i32 {
        var temperature: f32 = 0;


        let poleMult = 1 - abs((f32(cellPosition.x) - f32(size.y/2)) / (f32(size.y/2)));
        temperature = (50 * pow(poleMult, 0.35)) - 25;

        temperature -= (max(f32(cellHeight), 0) / 1500) * 4;

        let cellWorldPosition: vec3f = getCellWorldPosition(cellPosition, size);
        var noise1 = Noise3(cellWorldPosition * 5) * 15;
        var noise2 = Noise3(cellWorldPosition * 20) * 5;

        temperature += noise1 + noise2;

        return clamp(i32(temperature), -64, 64);
    }
`