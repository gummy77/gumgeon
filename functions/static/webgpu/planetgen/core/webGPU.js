import { SetupRendering, Render3D } from "./rendering3d.js";
import { setupCells } from "./cells.js";
import { setupPlates } from "../generation/plateSetup.js";
import { setupWorldNoise } from "../generation/worldNoiseSetup.js";
import { getInput, keyPressHandler, mouseMoveHandler, mouseOutHandler, mouseOverHandler, mousePressHandler, mouseReleaseHandler, mouseScrollHandler, updateInput } from "./input.js";
import { setupTectonics, tickTectonics } from "../generation/Tectonics.js";
import { setupClimate, tickClimate } from "../generation/Climate.js";
import { RenderStars, SetupStars } from "../rendering/stars.js";
import { PerfStatMonitor } from "../util/perfStat.js";
import { Render2D, SetupRendering2d } from "./rendering2d.js";

//#region WebGPU Setup
const canvas = document.querySelector("canvas");
if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
const adapterOptions = {}
const adapter = await navigator.gpu.requestAdapter(adapterOptions);
if (!adapter) throw new Error("No appropriate GPUAdapter found.");
export const device = await adapter.requestDevice();

//#region Logging
console.log("\nGPU Details")
if(adapter.isFallcakAdapter) console.log("FALLBACK ADAPTER");
console.log("   architecture: " + adapter.info.architecture);
console.log("   description: " + adapter.info.architecture);
console.log("   device: " + device.adapterInfo.device);
console.log("   vendor: " + device.adapterInfo.vendor);

var cellStateStorage;

var setupData = {
    device: device,
    canvas: canvas,
    navigator: navigator,
    resolution: 1700,
    blockSize: 256,
    seed: Math.random() * 10000
}

var tickData = {
    device: device,
    cellStateStorage: null,
    resolution: setupData.resolution,
    blockSize: setupData.blockSize,
    step: 0,
    displayType: 0,
    seed: setupData.seed
}

//#region Inputs
canvas.addEventListener("keydown", keyPressHandler);
canvas.addEventListener("keyup", keyPressHandler);
canvas.addEventListener('mousedown', mousePressHandler);
canvas.addEventListener('mouseup', mouseReleaseHandler);
canvas.addEventListener('mouseover', mouseOverHandler);
canvas.addEventListener('mouseout', mouseOutHandler);
canvas.addEventListener("mousemove", mouseMoveHandler);
canvas.addEventListener("wheel", mouseScrollHandler);

//#region HTML Inputs
window.updateSettings = () => {
    tickData.displayType = document.getElementById("displayType").value;
}

//#region Setup
async function setup() {
    console.log("\nStarting Setup\n")
    updateSettings();
    var setupStartTIme = performance.now();

    if((setupData.resolution * setupData.resolution * 96) >= device.limits.maxStorageBufferBindingSize) { // Max buffer size :/
        setupData.resolution = (Math.round(Math.sqrt(device.limits.maxStorageBufferBindingSize / 96) / 4) - 1) * 4;
        tickData.resolution = setupData.resolution;
    }

    

    await SetupRendering(setupData);
    await SetupRendering2d(setupData);
    await SetupStars(setupData);
    cellStateStorage = await setupCells(setupData);
    await setupPlates(setupData, cellStateStorage);
    await setupWorldNoise(setupData, cellStateStorage);
    await setupTectonics(setupData, cellStateStorage);
    await setupClimate(setupData, cellStateStorage);
    
    tickData.cellStateStorage = cellStateStorage;

    console.log("Setup Complete - " + Math.round((performance.now() - setupStartTIme) * 100) / 100 + "ms (" + Math.round((performance.now() - setupStartTIme) / 10) / 100 + "s)");
    console.log("\nStarting Simulation");

    requestAnimationFrame(main);
}

//#region Main Loop
let step = 1;
var tickStart = performance.now();
var tickEnd = performance.now();
var frameKeepingCounter = 0;

var perfStats = new PerfStatMonitor();

// Run Time
var tectonicStep = 0;
var tectonicStepCount = 1500; // 1500

async function main() {
    perfStats.EndTracker("frame");
    perfStats.StartTracker("frame");

    perfStats.StartTracker("input");
    await updateInput();

    tickData.device = device;
    tickData.resolution = setupData.resolution;
    tickData.step = step;
    tickData.Input = getInput();
    perfStats.EndTracker("input");

    if(tectonicStep < tectonicStepCount) {
        
        perfStats.StartTracker("tectonic");
        await tickTectonics(tickData);
        perfStats.EndTracker("tectonic");

        perfStats.StartTracker("climate");
        await tickClimate(tickData);
        perfStats.EndTracker("climate");

        tectonicStep ++;
    } else if (tectonicStep == tectonicStepCount) {
        console.log("   Tectonic Simulation run with: " + tectonicStep + " steps");
        perfStats.WipeTimer("tectonic");
        perfStats.WipeTimer("climate");
        tectonicStep ++;
    }
    
    // Rendering
    perfStats.StartTracker("render");
    const encoder = device.createCommandEncoder();
    tickData.encoder = encoder;

    if(document.getElementById("3d").checked) {
        perfStats.StartTracker("render_star");
        await RenderStars(tickData);
        perfStats.EndTracker("render_star");

        perfStats.StartTracker("render_planet");
        await Render3D(tickData);
        perfStats.EndTracker("render_planet");
    } else {

        await Render2D(tickData);

        perfStats.WipeTimer("render_star");
        perfStats.WipeTimer("render_planet");
    }

    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();

    perfStats.EndTracker("render");

    step++;

    document.getElementById("fps").innerText = "FPS: " + Math.round(1000 / perfStats.GetTimerMicro("frame"));
    document.getElementById("sim").innerText = "Simulation: " + Math.round(tectonicStep / tectonicStepCount * 100) + "%";

    if(document.getElementById("stats")) {
        document.getElementById("perf").innerText =               "Frame: \t\t" +     Math.round(perfStats.GetTimerMicro("frame")        * 100) / 100 + "      \t ms";
        document.getElementById("perf_input").innerText =         "Input: \t\t" +     Math.round(perfStats.GetTimerMicro("input")        * 100) / 100 + "      \t ms";
        document.getElementById("perf_tectonic").innerText =      "Tectonic: \t" +    Math.round(perfStats.GetTimerMicro("tectonic")     * 100) / 100 + "      \t ms";
        document.getElementById("perf_climate").innerText =       "Climate: \t\t" +   Math.round(perfStats.GetTimerMicro("climate")      * 100) / 100 + "      \t ms";
        document.getElementById("perf_render").innerText =        "Render: \t\t" +    Math.round(perfStats.GetTimerMicro("render")       * 100) / 100 + "      \t ms";
        document.getElementById("perf_render_star").innerText =   "   Star: \t\t" +   Math.round(perfStats.GetTimerMicro("render_star")  * 100) / 100 + "      \t ms";
        document.getElementById("perf_render_planet").innerText = "   Planet: \t\t" + Math.round(perfStats.GetTimerMicro("render_planet")* 100) / 100 + "      \t ms";
    }
    // frameKeepingCounter ++;
    // if(frameKeepingCounter > 5) {
    //     frameKeepingCounter = 0
    //     tickEnd = performance.now();
    //     document.getElementById("perf").innerText = "FPS: " + Math.round(5000 / (tickEnd - tickStart));
    //     tickStart = performance.now();
    // }
    
    requestAnimationFrame(main);
}

setup();