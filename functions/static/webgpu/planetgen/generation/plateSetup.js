import { createGPUBuffer } from "../util/renderUtil.js";
import { noiseWGSL } from "../util/noise.js";
import { genericWGSL } from "../core/generic.js";

var cellStateStorage;

export async function setupPlates(setupData, cellStateStorage) {
    // Timer
    var plateSetupTime = performance.now();

    //#region Shader
    var plateSetupShader = setupData.device.createShaderModule({label: "Plate Setup Compute Shader", code: plateSetupWGSL + genericWGSL + noiseWGSL});

    //#region Plate Position Buffer
    var plateCount = 50;
    var platePositions = new Float32Array(plateCount * 3);

    for(var i = 0; i < plateCount; i++) {
        var x = (2 * (Math.random() - 0.5));
        var y = (2 * (Math.random() - 0.5));
        var z = (2 * (Math.random() - 0.5));

        var magnitude = Math.sqrt((x * x) + (y * y) + (z * z));

        // x = x * magnitude;
        // y = y * magnitude;
        // z = z * magnitude;

        x *= magnitude;
        y *= magnitude;
        z *= magnitude;

        platePositions[i    ] = x;
        platePositions[i + 1] = y;
        platePositions[i + 2] = z;
    }

    var platePositionBuffer = createGPUBuffer(setupData.device, platePositions, GPUBufferUsage.STORAGE);

    //#region Bind Group Layout
    var setupBindGroupLayout = setupData.device.createBindGroupLayout({
        label: "Plate Setup Bind Group Layout",
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
                buffer: { type: "read-only-storage"}
            }
        ]
    });

    //#region Size Buffer
    var size = new Uint32Array([setupData.resolution, setupData.resolution]);
    var sizeBuffer = createGPUBuffer(setupData.device, size, GPUBufferUsage.UNIFORM)

    //#region Bind Group
    var setupBindGroup = setupData.device.createBindGroup({
        label: "Plate Setup Bind Group",
        layout: setupBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: sizeBuffer } },
            { binding: 1, resource: { buffer: cellStateStorage[0] } },
            { binding: 2, resource: { buffer: platePositionBuffer } }
        ]
    });

    //#region Pipeline Layout
    var setupPipelineLayout = setupData.device.createPipelineLayout({
        label: "Plate Setup Pipleline Layout",
        bindGroupLayouts: [ setupBindGroupLayout ]
    });

    //#region Cell Setup Pipeline
    var plateSetupPipeline = setupData.device.createComputePipeline({
        label: "Plate Setup Pipeline",
        layout: setupPipelineLayout,
        compute: {
            module: plateSetupShader,
            entryPoint: "setup",
            constants: {
                blockSize: setupData.blockSize,
                seed: setupData.seed
            },
        }
    });

    var encoder = setupData.device.createCommandEncoder();
    const setupComputePass = encoder.beginComputePass();
    
    setupComputePass.setPipeline(plateSetupPipeline);
    setupComputePass.setBindGroup(0, setupBindGroup);
    setupComputePass.dispatchWorkgroups(
        (setupData.resolution * setupData.resolution * 6) / setupData.blockSize
    );
    setupComputePass.end();
    setupData.device.queue.submit([encoder.finish()]);

    await setupData.device.queue.onSubmittedWorkDone();
    console.log("   Plate Setup Complete - " + Math.round((performance.now() - plateSetupTime) * 100) / 100 + "ms");
}

const plateSetupWGSL = /* wgsl */`
    @group(0) @binding(0) var<uniform> size: vec2u; 
    @group(0) @binding(1) var<storage, read_write> cellStates: array<Cell>;
    @group(0) @binding(2) var<storage, read> platePositions: array<vec3f>; 

    override blockSize = 16;
    override seed: u32 = 1;

    @compute
    @workgroup_size(blockSize)
    fn setup(@builtin(global_invocation_id) GlobalInvocationID: vec3u) {
        let cellIndex = GlobalInvocationID.x;
        var cell: Cell = cellStates[cellIndex];
        var cellData: CellData = constructCell(cell);

        var plateCount: u32 = arrayLength(&platePositions);

        let cellPosition = getPosition(cellIndex, size);

        var minPlate: u32 = 0;
        var minDistance: f32 = 999;

        for (var i: u32 = 0; i < plateCount; i++) {
            let platePos: vec3f = platePositions[i];
            let cellPos: vec3f = getCellWorldPosition(cellPosition, size);

            let distVec: vec3f = cellPos - platePos;
            let distMag = mag3(distVec);

            let layer1 = Noise3(cellPos * 3) * 0.1;
            let layer2 = Noise3(cellPos * 10) * 0.05; // TODO tune these
            let noise = layer1 + layer2 ;

            if(distMag + noise < minDistance) {
                minPlate = i;
                minDistance = distMag;
            }
        }

        cellData.PlateID = minPlate;

        cellData.Height = 0;

        if(minPlate % 3 == 0) { // Continental (Land)
            cellData.Height += 150;
        } else { // Oceanic
            cellData.Height -= 3600;
        }

        let plateNoisePosition = platePositions[minPlate] * f32(seed);

        let velX: i32 = clamp(i32((Noise3(plateNoisePosition * -2) - 0.5) * 7), -3, 3);
        let velY: i32 = clamp(i32((Noise3(plateNoisePosition *  1) - 0.5) * 7), -3, 3);
        let velZ: i32 = clamp(i32((Noise3(plateNoisePosition *  2) - 0.5) * 7), -3, 3);
        cellData.PlateVelocity = vec3i(velX, velY, velZ);

        cellStates[cellIndex] = deconstructCell(cellData);
    }
`