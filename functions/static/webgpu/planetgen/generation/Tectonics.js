import { createGPUBuffer } from "../util/renderUtil.js";
import { noiseWGSL } from "../util/noise.js";
import { genericWGSL } from "../core/generic.js";

var tectonicShader;

var tectonicBindGroup;

var tectonicPipelineLayout;

var tectonicTickPipeline;
var erosionTickPipeline;
var swapPipeline;

export async function setupTectonics(setupData, cellStateStorage) {
    // Timer
    var tectonicSetupTime = performance.now();

    //#region Shader
    tectonicShader = setupData.device.createShaderModule({label: "Tectonic Compute Shader", code: TectonicWGSL + genericWGSL + noiseWGSL});

    //#region Bind Group Layout
    var tectonicBindGroupLayout = setupData.device.createBindGroupLayout({
        label: "Tectonic Bind Group Layout",
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
    tectonicBindGroup = setupData.device.createBindGroup({
        label: "Tectonic Bind Group",
        layout: tectonicBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: sizeBuffer } },
            { binding: 1, resource: { buffer: cellStateStorage[0] } },
            { binding: 2, resource: { buffer: cellStateStorage[1] } },
        ]
    });

    //#region Pipeline Layout
    tectonicPipelineLayout = setupData.device.createPipelineLayout({
        label: "Tectonic Pipleline Layout",
        bindGroupLayouts: [ tectonicBindGroupLayout ]
    });

    //#region Tectonic Setup Pipeline
    var tectonicSetupPipeline = setupData.device.createComputePipeline({
        label: "Tectonic Setup Pipeline",
        layout: tectonicPipelineLayout,
        compute: {
            module: tectonicShader,
            entryPoint: "setup",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    //#region Tectonic Tick Pipeline
    tectonicTickPipeline = setupData.device.createComputePipeline({
        label: "Tectonic Tick Pipeline",
        layout: tectonicPipelineLayout,
        compute: {
            module: tectonicShader,
            entryPoint: "tickTectonic",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    //#region Erosion Tick Pipeline
    erosionTickPipeline = setupData.device.createComputePipeline({
        label: "Tectonic Tick Pipeline",
        layout: tectonicPipelineLayout,
        compute: {
            module: tectonicShader,
            entryPoint: "tickErosion",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    //#region Swap Pipeline
    swapPipeline = setupData.device.createComputePipeline({
        label: "Swap Pipeline",
        layout: tectonicPipelineLayout,
        compute: {
            module: tectonicShader,
            entryPoint: "swap",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    var encoder = setupData.device.createCommandEncoder();

    var tectonicComputePass = encoder.beginComputePass();
    tectonicComputePass.setPipeline(tectonicSetupPipeline);
    tectonicComputePass.setBindGroup(0, tectonicBindGroup);
    tectonicComputePass.dispatchWorkgroups(
        (setupData.resolution * setupData.resolution * 6) / setupData.blockSize
    );
    tectonicComputePass.end();
    setupData.device.queue.submit([encoder.finish()]);

    await setupData.device.queue.onSubmittedWorkDone();
    console.log("   Tectonic Setup Complete - " + Math.round((performance.now() - tectonicSetupTime) * 100) / 100 + "ms");
}

export async function tickTectonics(tickData) {
    if(tickData.step % 8 == 0) {
    
        var encoder = tickData.device.createCommandEncoder();

        // tectonicTickPipeline = tickData.device.createComputePipeline({
        //     label: "Tectonic Tick Pipeline",
        //     layout: tectonicPipelineLayout,
        //     compute: {
        //         module: tectonicShader,
        //         entryPoint: "tickTectonic",
        //         constants: {
        //             blockSize: tickData.blockSize,
        //             tick: tickData.step
        //         },
        //     }
        // });

        var tectonicComputePass = encoder.beginComputePass();
        tectonicComputePass.setPipeline(tectonicTickPipeline);
        tectonicComputePass.setBindGroup(0, tectonicBindGroup);
        tectonicComputePass.dispatchWorkgroups(
            (tickData.resolution * tickData.resolution * 6) / tickData.blockSize
        );
        tectonicComputePass.end();
        tickData.device.queue.submit([encoder.finish()]);

        encoder = tickData.device.createCommandEncoder();
        var erosionComputePass = encoder.beginComputePass();
        erosionComputePass.setPipeline(erosionTickPipeline);
        erosionComputePass.setBindGroup(0, tectonicBindGroup);
        erosionComputePass.dispatchWorkgroups(
            (tickData.resolution * tickData.resolution * 6) / tickData.blockSize
        );
        erosionComputePass.end();
        tickData.device.queue.submit([encoder.finish()]);

        // encoder = tickData.device.createCommandEncoder();
        // var swapComputePass = encoder.beginComputePass();
        // swapComputePass.setPipeline(swapPipeline);
        // swapComputePass.setBindGroup(0, tectonicBindGroup);
        // swapComputePass.dispatchWorkgroups(
        //     (tickData.resolution * tickData.resolution * 6) / tickData.blockSize
        // );
        // swapComputePass.end();
        // tickData.device.queue.submit([encoder.finish()]);

        await tickData.device.queue.onSubmittedWorkDone();
    }
}

const TectonicWGSL = /* wgsl */`
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

        let cellWorldPosition: vec3f = getCellWorldPosition(cellPosition, size);
        var noise1: f32 = (Noise3(cellWorldPosition * 20)) * 0.6;
        var noise2: f32 = (Noise3(cellWorldPosition * 50)) * 0.4;
        var noise: f32 = noise1 + noise2;

        let boundaryValue: f32 = clamp(getBoundarys(cellData, cellPosition, cellData.PlateVelocity) * noise * 30, -16, 16);

        cellData.Boundaries = i32(boundaryValue);

        // Ores
        if(cellData.Boundaries > 0) { // converging plate boundaries -> creates copper & Gold
            let noise: f32 = Noise3(cellWorldPosition * 10) + Noise3(cellWorldPosition * 5);

            if((noise + (f32(cellData.Boundaries) / 64)) >= 1) {
                cellData.OreType = 1;
                cellData.OreRichness = u32((cellData.Boundaries + i32(noise * 3)) / 5);
            }
        }

        cellData.OreRichness = clamp(cellData.OreRichness, 0, 3);

        // cellData.Height += i32(boundaryValue * 60);

        cellStatesIN[cellIndex] = deconstructCell(cellData);
    }

    @compute
    @workgroup_size(blockSize)
    fn tickTectonic(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cell: Cell = cellStatesIN[cellIndex];
        var cellData: CellData = constructCell(cell);
        let cellPosition = getPosition(cellIndex, size);

        let landAdditionVolume: i32 = i32(cellData.Boundaries);

        if (cellData.Boundaries < 0) { // Diverging Plates

            if(cellData.Height < 50) { // Under Ocean -> creates ridges
                cellData.Height += landAdditionVolume * -1;
            } else { // On Land -> creates Rift Valleys
                cellData.Height += landAdditionVolume * 1;
            }

        } else { // Converging Plates

            if(cellData.Height < 50) { // Under Ocean
                cellData.Height += landAdditionVolume * 2;
            } else { // On Land
                cellData.Height += landAdditionVolume * 5;
            }
        }

        cellStatesOUT[cellIndex] = deconstructCell(cellData);
    }

    @compute
    @workgroup_size(blockSize)
    fn tickErosion(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cellData: CellData = constructCell(cellStatesOUT[cellIndex]);

        let cellPosition = getPosition(cellIndex, size);

        var searchDist: i32 = max(1, i32(size.x) / 1000);
        var total: f32 = 0;
        var count: f32 = 0;
        for(var y: i32 = -searchDist; y <= searchDist; y++) {
            for(var x: i32 = -searchDist; x <= searchDist; x++) {

                var newPos: vec2u = getRelativeCell(cellPosition, x, y, size);
                let otherCellHeight: i32 = getBitHeight(cellStatesIN[getCellIndex(newPos, size)].BlockA);
                
                total += f32(cellData.Height - otherCellHeight);

                count += 1;
            }
        }
        let result: f32 = total / count;

        if(cellData.Height < 20) {
            cellData.Height -= i32(result * 0.1);
        } else {
            cellData.Height -= i32(result * 0.05);
        }

        cellStatesIN[cellIndex] = deconstructCell(cellData);
    }

    fn getBoundarys(cell: CellData, cellPosition: vec2u, plateVelocity: vec3i) -> f32 {
        let plateID = cell.PlateID;
    
        let searchSize: i32 = i32(size.x) / 75;
        var difference: f32 = 0;
    
        var count: f32 = 1;
        for(var x: i32 = -searchSize; x < searchSize; x += 1) {
            for(var y: i32 = -searchSize; y < searchSize; y += 1) {
    
                let thisPosition: vec3f = getCellWorldPosition(cellPosition, size);

                let otherCellPosition: vec2u = getRelativeCell(cellPosition, x, y, size);
                let otherCellWorldPosition: vec3f = getCellWorldPosition(otherCellPosition, size);
                let otherIndex = getCellIndex(otherCellPosition, size);
                let other: Cell = cellStatesIN[otherIndex];
                let otherID: u32 = getBitPlateID(other.BlockA);
                let otherPlateVelocity: vec3i = getBitPlateVelocity(other.BlockA);
                
                if(plateID != otherID) {
                    let positionDifference: vec3f = (thisPosition * 1000000) - (otherCellWorldPosition * 1000000);
                    let positionDifferenceMagnitude: f32 = mag3(positionDifference);

                    let velocityDifference: vec3f = positionDifference + (vec3f(plateVelocity) - vec3f(otherPlateVelocity));
                    let velocityDifferenceMagnitude: f32 = mag3(velocityDifference);
    
                    difference -= (velocityDifferenceMagnitude - positionDifferenceMagnitude) / 3;
                }
                count += 1; 
            }
        }
        let result = (difference / count);

        return result;
    }

    @compute
    @workgroup_size(blockSize)
    fn swap(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;

        cellStatesIN[cellIndex] = cellStatesOUT[cellIndex];
    }
`