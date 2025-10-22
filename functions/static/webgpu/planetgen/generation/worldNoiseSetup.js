import { createGPUBuffer } from "../util/renderUtil.js";
import { noiseWGSL } from "../util/noise.js";
import { genericWGSL } from "../core/generic.js";

var cellStateStorage;

export async function setupWorldNoise(setupData, cellStateStorage) {
    // Timer
    var noiseSetupTime = performance.now();

    //#region Shader
    var noiseSetupShader = setupData.device.createShaderModule({label: "Noise Setup Compute Shader", code: noiseSetupWGSL + genericWGSL + noiseWGSL});

    //#region Bind Group Layout
    var setupBindGroupLayout = setupData.device.createBindGroupLayout({
        label: "World Noise Setup Bind Group Layout",
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
    var noiseBindGroup = setupData.device.createBindGroup({
        label: "Noise Setup Bind Group",
        layout: setupBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: sizeBuffer } },
            { binding: 1, resource: { buffer: cellStateStorage[0] } },
            { binding: 2, resource: { buffer: cellStateStorage[1] } },
        ]
    });

    //#region Pipeline Layout
    var noisePipelineLayout = setupData.device.createPipelineLayout({
        label: "Noise Setup Pipleline Layout",
        bindGroupLayouts: [ setupBindGroupLayout ]
    });

    //#region Cell Setup Pipeline
    var noiseSetupPipeline = setupData.device.createComputePipeline({
        label: "Noise Setup Pipeline",
        layout: noisePipelineLayout,
        compute: {
            module: noiseSetupShader,
            entryPoint: "setup",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    //#region Cell Setup Pipeline
    var smoothSetupPipeline = setupData.device.createComputePipeline({
        label: "Smooth Pipeline",
        layout: noisePipelineLayout,
        compute: {
            module: noiseSetupShader,
            entryPoint: "blur",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    //#region Cell Setup Pipeline
    var swapBufferPipeline = setupData.device.createComputePipeline({
        label: "Swap Buffer Pipeline",
        layout: noisePipelineLayout,
        compute: {
            module: noiseSetupShader,
            entryPoint: "swap",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    var encoder = setupData.device.createCommandEncoder();

    // var swapComputePass = encoder.beginComputePass();
    // swapComputePass.setPipeline(swapBufferPipeline);
    // swapComputePass.setBindGroup(0, noiseBindGroup);
    // swapComputePass.dispatchWorkgroups(
    //     (setupData.resolution * setupData.resolution * 6) / setupData.blockSize
    // );
    // swapComputePass.end();
    // setupData.device.queue.submit([encoder.finish()]);

    encoder = setupData.device.createCommandEncoder();
    var smoothComputePass = encoder.beginComputePass();
    smoothComputePass.setPipeline(smoothSetupPipeline);
    smoothComputePass.setBindGroup(0, noiseBindGroup);
    smoothComputePass.dispatchWorkgroups(
        (setupData.resolution * setupData.resolution * 6) / setupData.blockSize
    );
    smoothComputePass.end();
    setupData.device.queue.submit([encoder.finish()]);

    encoder = setupData.device.createCommandEncoder();
    var noiseComputePass = encoder.beginComputePass();
    noiseComputePass.setPipeline(noiseSetupPipeline);
    noiseComputePass.setBindGroup(0, noiseBindGroup);
    noiseComputePass.dispatchWorkgroups(
        (setupData.resolution * setupData.resolution * 6) / setupData.blockSize
    );
    noiseComputePass.end();
    setupData.device.queue.submit([encoder.finish()]);
    
    await setupData.device.queue.onSubmittedWorkDone();
    console.log("   World Noise Setup Complete - " + Math.round((performance.now() - noiseSetupTime) * 100) / 100 + "μs");
}

const noiseSetupWGSL = /* wgsl */`
    @group(0) @binding(0) var<uniform> size: vec2u; 
    @group(0) @binding(1) var<storage, read_write> cellStatesIN: array<Cell>;
    @group(0) @binding(2) var<storage, read_write> cellStatesOUT: array<Cell>;

    override blockSize = 16;

    @compute
    @workgroup_size(blockSize)
    fn setup(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cell: Cell = cellStatesOUT[cellIndex];
        var cellData: CellData = constructCell(cell);

        let cellPosition = getPosition(cellIndex, size);

        // Basic Height Gen for now
        let cellWorldPosition: vec3f = getCellWorldPosition(cellPosition, size);
        var noise1 = Noise3(cellWorldPosition * 5) * 0.8;
        var noise2 = Noise3(cellWorldPosition * 20) * 0.3;
        var noise3 = Noise3(cellWorldPosition * 30) * 0.2;
        var noise4 = Noise3(cellWorldPosition * 500) * 0.2;

        let noiseTotal = 2 * ((noise1 + noise2 + noise3 + noise4));
        cellData.Height += i32(noiseTotal * 1500);

        cell = deconstructCell(cellData);
        cellStatesIN[cellIndex] = cell;
    }

    @compute
    @workgroup_size(blockSize)
    fn blur(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cell: Cell = cellStatesIN[cellIndex];
        var cellData: CellData = constructCell(cell);

        let cellPosition = getPosition(cellIndex, size);

        var searchDist: i32 = i32(size.x) / 50;
        var total: i32 = 0;
        var count: i32 = 0;
        for(var y: i32 = -searchDist; y < searchDist; y++) {
            for(var x: i32 = -searchDist; x < searchDist; x++) {
                var newPos: vec2u = getRelativeCell(cellPosition, x, y, size);
                let otherCellHeight: i32 = getBitHeight(cellStatesIN[getCellIndex(newPos, size)].BlockA);
                
                total += otherCellHeight;

                count ++;
            }
        }
        let resultHeight = total / count;

        cellData.Height = resultHeight;

        cell = deconstructCell(cellData);
        cellStatesOUT[cellIndex] = cell;
    }

    @compute
    @workgroup_size(blockSize)
    fn swap(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;

        cellStatesOUT[cellIndex] = cellStatesIN[cellIndex];
    }
`