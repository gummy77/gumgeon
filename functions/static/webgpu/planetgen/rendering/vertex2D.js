export const vertexWGSL = /* wgsl */`
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f
    }
    struct DisplayOutput {
        height: f32,
        color: vec4f
    }

    @group(0) @binding(0)
    var<storage, read> vertexPositions: array<vec3f>;
    @group(0) @binding(1)
    var<uniform> transform: mat4x4<f32>;
    @group(0) @binding(2)
    var<uniform> projection: mat4x4<f32>;
    @group(0) @binding(3)
    var<uniform> size: vec2u;
    @group(0) @binding(4)
    var<uniform> displaySettings: u32;

    @vertex
    fn vert(
        @builtin(vertex_index) inVertexIndex: u32,
        @builtin(instance_index) instanceIndex: u32,

        @location(0) BlockA: u32,
        @location(1) BlockB: u32

    ) -> VertexOutput {
        var out: VertexOutput;
        var cellVertexPosition: vec3f = vertexPositions[inVertexIndex];

        let cellHeight: i32 = getBitHeight(BlockA);
        let cellPlateID: u32 = getBitPlateID(BlockA);

        let cellPosition: vec2u = getPosition(instanceIndex, size);

        let cellBoundaries: i32 = getBitBoundaries(BlockB);
        let cellBiome: u32 = getBitBiome(BlockB);
        let cellTemperature: i32 = getBitTemperature(BlockB);
        let cellOreType: u32 = getBitOreType(BlockB);
        let cellOreRichness: u32 = getBitOreRichness(BlockB);
        let cellHumidity: u32 = getBitHumidity(BlockB);

        var output: DisplayOutput;

        switch (displaySettings) {
            case(0) {
                output = plates(cellHeight, cellPlateID);
            }
            case(1) {
                output = heightMap(cellHeight);
            }
            case(2) {
                output = tempuratureMap(cellHeight, cellTemperature);
            }
            case(3) {
                output = humidityMap(cellHeight, cellHumidity);
            }
            case(4) {
                output = boundaries(cellHeight, cellTemperature, cellHumidity, cellBoundaries);
            }
            case(5) {
                output = ores(cellHeight, cellTemperature, cellHumidity, cellOreType, cellOreRichness);
            }
            case(6) {
                output = Biomes(cellHeight, cellBiome);
            }
            case(7) {
                output = rendered(cellHeight, cellTemperature, cellHumidity);
            }
            default {
                out.color = vec4f(1, 0.25, 0.25, 1);
            }
        }

        cellVertexPosition /= 100;
        cellVertexPosition.x /= 2;

        cellVertexPosition.y += output.height * 7;
        out.color = output.color;

        let x = ((f32(cellPosition.x) - f32(size.x/2)) / 100) / 2;
        let y = ((f32(cellPosition.y) - f32(size.y/2)) / 100);

        cellVertexPosition += vec3f(x, -7, y);

        out.position = projection * transform * vec4f(cellVertexPosition, 1.0);

        return out;
    }

    const HeightIntensity = 200000;

    fn plates(
        cellHeight: i32,
        plateID: u32
    ) -> DisplayOutput {
        var out: DisplayOutput;

        out.height = 1 + (f32(cellHeight) / HeightIntensity);

        let c = (f32(plateID) / 75) / 2;
        
        if(plateID % 3 == 0) {
            out.color = vec4f(c + 0.3, c + 0.2, c + 0, 1);
            out.height -= 0.025;
        } else {
            out.color = vec4f(c + 0.3, c + 0.2, c + 0.5, 1);
            out.height -= 0.035;
        }

        out.color += f32(cellHeight) / 25000;

        return out;
    }

    fn heightMap(
        cellHeight: i32
    ) -> DisplayOutput {
        var out: DisplayOutput;

        out.height = 1 + (f32(cellHeight) / HeightIntensity);

        out.color = vec4f(0.5, 0.5, 0.5, 1);
        
        out.color += f32(cellHeight) / 20000;

        return out;
    }

    fn tempuratureMap(
        cellHeight: i32,
        cellTemperature: i32
    ) -> DisplayOutput {
        var out: DisplayOutput;

        out.height = 1 + (f32(cellHeight) / HeightIntensity);

        
        if(cellTemperature < -10) {
            out.color = vec4f(0.2, 0.2, 0.5, 1);    
        } else if(cellTemperature < 0) {
            out.color = vec4f(0.5, 0.5, 0.7, 1); 
        } else if(cellTemperature < 10) {
            out.color = vec4f(0.7, 0.7, 0.5, 1); 
        } else if(cellTemperature < 20) {
            out.color = vec4f(0.8, 0.5, 0.5, 1); 
        } else {
            out.color = vec4f(0.5, 0.2, 0.2, 1); 
        }
        
        out.color -= f32(cellTemperature) / 128;

        return out;
    }

    fn humidityMap(
        cellHeight: i32,
        cellHumidity: u32
    ) -> DisplayOutput {
        var out: DisplayOutput;

        out.height = 1 + (f32(cellHeight) / HeightIntensity);

        out.color = vec4f(0.5, 0.5, (f32(cellHumidity) / 100), 1);
        
        out.color += f32(cellHeight) / 25000;

        return out;
    }

    fn boundaries(
        cellHeight: i32,
        cellTemperature: i32,
        cellHumidity: u32,
        boundaries: i32
    ) -> DisplayOutput {
        var out: DisplayOutput = rendered(cellHeight, cellTemperature, cellHumidity);

        if(abs(boundaries) > 0) {
            let c: f32 = f32(boundaries) / 16;
            out.color += vec4f(c, -c, -c, 1);
        }

        return out;
    }

    fn ores(
        cellHeight: i32,
        cellTemperature: i32,
        cellHumidity: u32,
        cellOreType: u32,
        cellOreRichness: u32
    ) -> DisplayOutput {
        var out: DisplayOutput = rendered(cellHeight, cellTemperature, cellHumidity);

        switch(cellOreType) {
            case(0) {} // Empty
            case(1) { // Copper
                out.color = vec4f(1, 0.7, 0.2, 1);
                out.color *= 0.3 + (f32(cellOreRichness) / 5);
            }
            case(2) {} // Gold
            case(3) {} // Iron
            default {}
        }

        return out;
    }

    fn Biomes(
        cellHeight: i32,
        cellBiome: u32
    ) -> DisplayOutput {
        var out: DisplayOutput;

        out.height = 1 + (max(f32(cellHeight), 0) / HeightIntensity);

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

        switch(cellBiome) {
            case 0 {
                out.color = vec4f(0.8, 0.9, 1, 1); // Ice
            }
            case 1 {
                out.color = vec4f(0, 0.1, 0.3, 1); // Ocean
            }
            case 2 {
                out.color = vec4f(0.75, 0.9, 1, 1); // Tundra
            }
            case 3 {
                out.color = vec4f(0.4, 0.8, 0.5, 1); // Boreal Forest
            }
            case 4 {
                out.color = vec4f(0.1, 0.8, 0.1, 2); // Rainforest
            }
            case 5 {
                out.color = vec4f(0, 0.6, 0, 1); // Forest
            }
            case 6 {
                out.color = vec4f(0.8, 1, 0.5, 1); // Grassland
                }
            case 7 {
                out.color = vec4f(1, 0.7, 0.2, 1); // Savanna
            }
            case 8 {
                out.color = vec4f(1, 0.9, 0.5, 1); // Desert
            }
            default {
                out.color = vec4f(1, 0, 0, 1); // Failure
            }
        }

        out.color += f32(cellHeight) / 25000;

        return out;
    }

    fn rendered(
        cellHeight: i32,
        cellTemperature: i32,
        cellHumidity: u32
    ) -> DisplayOutput {
        var out: DisplayOutput;

        out.height = 1 + (max(f32(cellHeight), 0) / HeightIntensity);

        let humidityMod: f32 = (f32(cellHumidity) / 100) * 0.2;

        if(cellHeight < -500) {
            out.color = vec4f(0.2, 0.4, 0.6, 1); // Deep Ocean
        } else if (cellHeight <= 0) {
            out.color = vec4f(0.2, 0.45, 0.7, 1); // Shallow Ocean
        } else if (cellHeight < 200) {
            out.color = vec4f(0.7, 0.7, 0.5, 1); // Beach
        } else if (cellHeight < 5000) {

            if(cellHumidity > 45) {
                out.color = vec4f(0.5 + humidityMod, 0.6 + humidityMod, 0.4, 1); // Savanna
            } else if(cellHumidity > 25) {
                out.color = vec4f(0.45, 0.6 + humidityMod, 0.35, 1); // Plains
            } else if(cellHumidity > 5) {
                out.color = vec4f(0.5, 0.55 + humidityMod, 0.4, 1); // Tundra
            } else {
                out.color = vec4f(0.8, 0.45 + humidityMod, 0.2, 1); // desert
            }

        } else {
            out.color = vec4f(0.5, 0.5, 0.6, 1); // Mountain
        }

        if(cellTemperature < 5) {
            out.color = vec4f(0.7, 0.7, 0.9, 1); // Snowy / Icy
        }
        
        out.color += f32(cellHeight) / 25000;

        return out;
    }
`