import { createGPUBuffer } from "../util/renderUtil.js";
import { noiseWGSL } from "../util/noise.js";
import { genericWGSL, cellStructBytes } from "./generic.js";

var cellStateStorage;

export async function setupCells(setupData) {
    // Timer
    var cellSetupTime = performance.now();

    //#region Cell Buffers
    var cellArray = new Float32Array(new ArrayBuffer(cellStructBytes * setupData.resolution * setupData.resolution));
    cellStateStorage = [
        setupData.device.createBuffer({
            label: "Cell State A",
            size: cellArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.FRAGMENT,
        }),
        setupData.device.createBuffer({
            label: "Cell State B",
            size: cellArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.FRAGMENT,
        })
    ]

    //#region Shader
    var cellSetupShader = setupData.device.createShaderModule({label: "Cell Setup Compute Shader", code: cellSetupWGSL + genericWGSL + noiseWGSL});

    //#region Bind Group Layout
    var setupBindGroupLayout = setupData.device.createBindGroupLayout({
        label: "Cell Setup Bind Group Layout",
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage"}
            }
        ]
    });

    //#region Size Buffer
    var size = new Uint32Array([setupData.resolution, setupData.resolution]);
    var sizeBuffer = createGPUBuffer(setupData.device, size, GPUBufferUsage.UNIFORM)

    //#region Bind Group
    var setupBindGroup = setupData.device.createBindGroup({
        label: "Cell Setup Bind Group A",
        layout: setupBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: sizeBuffer } },
            { binding: 1, resource: { buffer: cellStateStorage[0] } }
        ]
    });

    //#region Pipeline Layout
    var setupPipelineLayout = setupData.device.createPipelineLayout({
        label: "Cell Setup Pipleline Layout",
        bindGroupLayouts: [ setupBindGroupLayout ]
    });

    //#region Cell Setup Pipeline
    var cellSetupPipeline = setupData.device.createComputePipeline({
        label: "Cell Setup Pipeline",
        layout: setupPipelineLayout,
        compute: {
            module: cellSetupShader,
            entryPoint: "setup",
            constants: {
                blockSize: setupData.blockSize
            },
        }
    });

    var encoder = setupData.device.createCommandEncoder();
    const setupComputePass = encoder.beginComputePass();
    
    setupComputePass.setPipeline(cellSetupPipeline);
    setupComputePass.setBindGroup(0, setupBindGroup);
    setupComputePass.dispatchWorkgroups(
        (setupData.resolution * setupData.resolution) / setupData.blockSize
    );
    setupComputePass.end();
    setupData.device.queue.submit([encoder.finish()]);

    await setupData.device.queue.onSubmittedWorkDone();
    console.log("   Cell Setup Complete - " + Math.round((performance.now() - cellSetupTime) * 100) / 100 + "ms");
    console.log("       Running with a resolution of: " + setupData.resolution + "x" + setupData.resolution +
              "\n       making: " + (setupData.resolution * setupData.resolution) + " cells");
    return cellStateStorage;
}

const cellSetupWGSL = /* wgsl */`
    @group(0) @binding(0) var<uniform> size: vec2u; 
    @group(0) @binding(1) var<storage, read_write> cellStates: array<Cell>;

    override blockSize = 16;

    @compute
    @workgroup_size(blockSize)
    fn setup(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cellData: CellData;

        cellData.Height = 0;
        cellData.PlateID = 0;
        cellData.PlateVelocity = vec3i(0, 0, 0);
        cellData.Boundaries = 0;
        cellData.VolcanicActivity = 0;

        cellData.WaterLevel = 0;
        cellData.OreType = 0;
        cellData.OreRichness = 0;
        cellData.Temperature = 0;
        cellData.Humidity = 0;

        cellStates[cellIndex] = deconstructCell(cellData);
    }
`