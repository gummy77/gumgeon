import { createGPUBuffer } from "../util/renderUtil.js";

import { starWGSL } from "./starShader.js";

import { genericWGSL, cellBufferLayout } from "../core/generic.js";

let context;
let canvasFormat;

let starShader;

let starPipelineLayout;
let starPipeline;

let vertexBuffer;

let uniformBindGroup;

let depthTexture;

var transformationMatrixUniformBuffer;
var projectionMatrixUniformBuffer;

var vertices = new Float32Array([
    0.0, 2.0, 0.0, 0.0,
    -2.0, -1.0, 0.0, 0.0,
    2.0, -1.0, 0.0, 0.0,

    -2, 1, 0, 0,
    2, 1, 0, 0,
    0, -2, 0, 0
]);

const starCount = 1000;

var starPositions = new Float32Array();
var starBuffer;

export async function SetupStars(setupData) {
    // Timer
    var starSetupTime = performance.now();

    context = setupData.canvas.getContext("webgpu");
    canvasFormat = setupData.navigator.gpu.getPreferredCanvasFormat();

    //#region Star Position Setup
    starPositions = new Float32Array((starCount * 4));
    for(let i = 0; i <= starPositions.length; i += 4)
    {
        starPositions[i] = (Math.random() - 0.5) * 1000;
        starPositions[i + 1] = (Math.random() - 0.5) * 1000;
        starPositions[i + 2] = (Math.random() - 0.5) * 1000;
    }

    //#region Shaders
    starShader = setupData.device.createShaderModule({
        label: "Star Shader",
        code: starWGSL + genericWGSL
    });

    //#region Buffer Layouts
    const starBufferLayout = {
        label: "Star Buffer Description",
        arrayStride: 16,
        stepMode: 'instance',
        attributes: [
            {
                label: "StarPosition",
                format: 'float32x3',
                offset: 0,
                shaderLocation: 0
            }
        ],
    };

    //#region Vertex Buffer
    vertexBuffer = createGPUBuffer(setupData.device, vertices, GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX);

    //#region Uniform Bind Groups
    starBuffer = setupData.device.createBuffer({
            label: "Star Buffer",
            size: starPositions.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        }
    );
    new Float32Array(starBuffer.getMappedRange()).set(starPositions);
    starBuffer.unmap();

    let transformationMatrix = glMatrix.mat4.lookAt(
        glMatrix.mat4.create(),
        glMatrix.vec3.fromValues(10, 1, 10),
        glMatrix.vec3.fromValues(0, 0, 0),
        glMatrix.vec3.fromValues(0, 1, 0)
    );
    let projectionMatrix = glMatrix.mat4.perspective(glMatrix.mat4.create(), 
        1.4,
        16.0 / 9.0,
        0.1,
        -1
    );
    transformationMatrixUniformBuffer = createGPUBuffer(setupData.device, transformationMatrix, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    projectionMatrixUniformBuffer = createGPUBuffer(setupData.device, projectionMatrix, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

    let uniformBindGroupLayout = setupData.device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: "read-only-storage" }
        }, {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
        }, {
            binding: 2,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
        }]
    });
    uniformBindGroup = setupData.device.createBindGroup({
        layout: uniformBindGroupLayout,
        entries: [{
            binding: 0,
            resource: {
                buffer: vertexBuffer
            }
        }, {
            binding: 1,
            resource: {
                buffer: transformationMatrixUniformBuffer
            }
        }, {
            binding: 2,
            resource: {
                buffer: projectionMatrixUniformBuffer
            }
        }]
    });

    //#region Depth Buffer
    depthTexture = setupData.device.createTexture({
        size: [setupData.canvas.width, setupData.canvas.height, 1],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT 
    });

    //#region Pipeline Layout
    starPipelineLayout = setupData.device.createPipelineLayout({
        label: "Star Pipeline Layout",
        bindGroupLayouts: [ uniformBindGroupLayout ]
    });

    //#region Pipeline
    starPipeline = setupData.device.createRenderPipeline({
        label: "Star Pipeline",
        layout: starPipelineLayout,
        vertex: {
            module: starShader,
            buffers: [ starBufferLayout ]
        },
        fragment: {
            module: starShader,
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: {
            topology: 'triangle-list',
            frontFace: 'ccw',
            cullMode: 'none'
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal',
            format: 'depth24plus'
        }
    });

    await setupData.device.queue.onSubmittedWorkDone();
    console.log("   Star Setup Complete - " + Math.round((performance.now() - starSetupTime) * 100) / 100 + "ms");
}

var angleX = 0;
var angleY = 0;
var zoom = 1.8;

//#region Render Function
export async function RenderStars(renderData) {
    var spinSpeed = 0;

    if(renderData.Input.mouseDown) {
        if(renderData.Input.middleMouseDown) {
            zoom -= renderData.Input.mouseYDiff / 500;
        } else {
            angleX += (renderData.Input.mouseXDiff / 1500) * Math.pow(zoom, 3);
            angleY -= (renderData.Input.mouseYDiff / 1500) * Math.pow(zoom, 3);

            angleY = Math.min(Math.max(angleY, -1.5), 1.5);
        }
    }
    angleX += spinSpeed * 0.01;

    zoom += renderData.Input.scrollDelta / 700;
    zoom = Math.min(Math.max(zoom, 0.9), 2);

    let transformationMatrix = glMatrix.mat4.lookAt(
        glMatrix.mat4.create(),
        glMatrix.vec3.fromValues(Math.cos(angleY) * Math.sin(angleX) * zoom,  Math.sin(angleY) * zoom, Math.cos(angleY) * Math.cos(angleX) * zoom),
        glMatrix.vec3.fromValues(0, 0, 0),
        glMatrix.vec3.fromValues(0, 1, 0)
    );
    let projectionMatrix = glMatrix.mat4.perspective(glMatrix.mat4.create(), 
        1.4,
        16.0 / 9.0,
        0.0001,
        -1
    );

    renderData.device.queue.writeBuffer(
        transformationMatrixUniformBuffer,
        0,
        transformationMatrix
    );
    renderData.device.queue.writeBuffer(
        projectionMatrixUniformBuffer,
        0,
        projectionMatrix
    );

    const pass = renderData.encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            storeOp: "store",
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store'
        }
    });

    // Draw Stars
    pass.setPipeline(starPipeline);
    pass.setVertexBuffer(0, starBuffer)
    pass.setBindGroup(0, uniformBindGroup);
    pass.draw(6, starCount);

    pass.end();
} 


// https://shi-yan.github.io/webgpuunleashed/Basics/depth_testing.html