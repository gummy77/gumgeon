import { createGPUBuffer } from "../util/renderUtil.js";

import { vertexWGSL } from "../rendering/vertex.js";
import { fragmentWGSL } from "../rendering/fragment.js";

import { genericWGSL, cellBufferLayout } from "./generic.js";

let context;
let canvasFormat;

let vertexShader;
let fragmentShader;

let renderPipelineLayout;
let renderPipeline;

let depthTexture;

let vertexBuffer;
let sizeBuffer;

let displaySettingsBuffer;

let uniformBindGroup;

var transformationMatrixUniformBuffer;
var projectionMatrixUniformBuffer;

var vertices = new Float32Array();

function ease(x) {
    var out = 0;
    if(x <= 0.5) {
        out = (0.5 * Math.sqrt(1 - Math.pow(((2 * x) - 1), 2)));
    } else {
        out = 1 - (0.5 * Math.sqrt(1 - Math.pow((2 * x) - 1, 2)));
    }

    return (out + out + x) / 3;
}

export async function SetupRendering(setupData) {
    // Timer
    var renderSetupTime = performance.now();

    //#region Configure Canvas
    context = setupData.canvas.getContext("webgpu");
    canvasFormat = setupData.navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device: setupData.device,
        format: canvasFormat,
        alphaMode: 'opaque'
    });

    //#region Shaders
    vertexShader = setupData.device.createShaderModule({
        label: "Vertex Shader",
        code: vertexWGSL + genericWGSL
    });
    fragmentShader = setupData.device.createShaderModule({
        label: "Fragment Shader",
        code: fragmentWGSL + genericWGSL
    });

    //#region Generate Sphere Vertices
    var verts = new Array(setupData.resolution * setupData.resolution * 6 * 4);

    var index = 0;
    for(var y = 0; y < setupData.resolution; y++) {
        for(var x = 0; x < setupData.resolution; x++) {
            for(var vertIndex = 0; vertIndex < 6; vertIndex++) {

                var vertX;
                var vertY;
                var cellStretch = 0.1;

                switch(vertIndex) {
                    case (0): { // Top Left
                        vertX = x - cellStretch;
                        vertY = y - cellStretch;
                        break;
                    }
                    case (1): { // Bottom Right
                        vertX = x + 1 + cellStretch;
                        vertY = y + 1 + cellStretch;
                        break;
                    }
                    case (2): { // Bottom Left
                        vertX = x - cellStretch;
                        vertY = y + 1 + cellStretch;
                        break;
                    }
                    case (3): { // Top Left
                        vertX = x - cellStretch;
                        vertY = y - cellStretch;
                        break;
                    }
                    case (4): { // Top Right
                        vertX = x + 1 + cellStretch;
                        vertY = y - cellStretch;
                        break;
                    }
                    case (5): { // Bottom Right
                        vertX = x + 1 + cellStretch;
                        vertY = y + 1 + cellStretch;
                        break;
                    }
                }

                let inlc = vertY / (setupData.resolution)
                let inclination = ease(inlc) * Math.PI;
                let azimuth = vertX / (setupData.resolution) * Math.PI * 2;

                let cellX = Math.sin(inclination) * Math.cos(azimuth);
                let cellZ = Math.sin(inclination) * Math.sin(azimuth);
                let cellY = Math.cos(inclination);

                verts[index + 0] = cellX;
                verts[index + 1] = cellY + 0.01;
                verts[index + 2] = cellZ;
                verts[index + 3] = 0;

                index += 4;
            }
        }
    }
    vertices = new Float32Array(verts);

    //#region Vertex Buffer
    vertexBuffer = createGPUBuffer(setupData.device, vertices, GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX);
    
    //#region Size Buffer
    var size = new Uint32Array([setupData.resolution, setupData.resolution]);
    sizeBuffer = createGPUBuffer(setupData.device, size, GPUBufferUsage.UNIFORM | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST)

    //#region Display Settings Buffer
    var displayBufferSize = new Uint32Array(1);
    displaySettingsBuffer = createGPUBuffer(setupData.device, displayBufferSize, GPUBufferUsage.UNIFORM | GPUBufferUsage.VERTEX| GPUBufferUsage.COPY_DST);


    //#region Uniform Bind Groups
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
        }, {
            binding: 3,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
        }, {
            binding: 4,
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
        }, {
            binding: 3,
            resource: {
                buffer: sizeBuffer
            }
        }, {
            binding: 4,
            resource: {
                buffer: displaySettingsBuffer
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
    renderPipelineLayout = setupData.device.createPipelineLayout({
        label: "Render Pipeline Layout",
        bindGroupLayouts: [ uniformBindGroupLayout ]
    });

    //#region Pipeline
    renderPipeline = setupData.device.createRenderPipeline({
        label: "Render Pipeline",
        layout: renderPipelineLayout,
        vertex: {
            module: vertexShader,
            buffers: [cellBufferLayout]
        },
        fragment: {
            module: fragmentShader,
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: {
            topology: 'triangle-list',
            frontFace: 'ccw',
            cullMode: 'back'
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal',
            format: 'depth24plus'
        }
    });

    await setupData.device.queue.onSubmittedWorkDone();
    console.log("   3D Rendering Setup Complete - " + Math.round((performance.now() - renderSetupTime) * 100) / 100 + "ms");
    // console.log("       rendering with: " + (setupData.resolution * setupData.resolution * 6 * 4) + " tris");
    console.log("       rendering with: " + (vertices.length / 3) + " tris");
}

var angleX = 0;
var angleY = 0;
var zoom = 1.8;

//#region Render Function
export async function Render3D(renderData) {
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

    renderData.device.queue.writeBuffer(
        displaySettingsBuffer,
        0,
        new Uint32Array([renderData.displayType])
    );

    const pass = renderData.encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "load",
            storeOp: "store",
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store'
        }
    });

    // Draw Planet
    pass.setPipeline(renderPipeline);
    pass.setVertexBuffer(0, renderData.cellStateStorage[0])
    pass.setBindGroup(0, uniformBindGroup);
    pass.draw(6, renderData.resolution * renderData.resolution);

    pass.end();
} 


// https://shi-yan.github.io/webgpuunleashed/Basics/depth_testing.html