export const genericWGSL = /* wgsl */`
    const PI: f32 = radians(180.0);
    const TAU: f32 = radians(360.0);

    struct Cell {
        @location(1) BlockA: u32,
        @location(2) BlockB: u32,
    }
    struct CellData {
        Height: i32,
        PlateID: u32,
        PlateVelocity: vec3i,
        Boundaries: i32,
        VolcanicActivity: u32,
        Biome: u32,
        WaterLevel: i32,
        OreType: u32,
        OreRichness: u32,
        Temperature: i32,
        Humidity: u32
    }

    //  0 | Height -> 15 bits
    // 15 | Plate ID -> 6 bits
    // 21 | Plate Velocity -> 9 bits
    // 30 |     -> 2 bits
    // 32 
    

    //  0 | Convergent/Divergent Intensity -> 5 bits
    //  5 | Biome -> 4 bits
    //  9 |     -> 5 bits
    // 14 | Ore Type -> 2 bits
    // 16 | Ore Richness -> 2 bits
    // 18 | Temperature -> 7 bits
    // 25 | Humidity -> 7 bits
    // 32 

    //#region Bit Storage

    fn getBitHeight(BlockA: u32) -> i32 {
        let bitHeight: i32 = i32((BlockA >> 0) & u32(32767));
        return (bitHeight - 10000);
    }
    fn setBitHeight(_inBlock: u32, height: i32) -> u32 {
        let bitHeight = u32(height + 10000);

        var inBlock = _inBlock & ~(u32(32767) << 0);
        inBlock = inBlock | (bitHeight << 0);

        return inBlock;
    }

    fn getBitPlateID(BlockA: u32) -> u32 {
        return (BlockA >> 15) & u32(63);
    }
    fn setBitPlateID(_inBlock: u32, PlateID: u32) -> u32 {
        var inBlock = _inBlock & ~(u32(63) << 15);
        inBlock = inBlock | (PlateID << 15);

        return inBlock;
    }

    fn getBitPlateVelocity(BlockA: u32) -> vec3i {
        let bitVelocityX: i32 = i32((BlockA >> 21) & u32(7));
        let bitVelocityY: i32 = i32((BlockA >> 24) & u32(7));
        let bitVelocityZ: i32 = i32((BlockA >> 27) & u32(7));

        return vec3i(bitVelocityX - 3, bitVelocityY - 3, bitVelocityZ - 3);
    }
    fn setBitPlateVelocity(_inBlock: u32, plateVelocity: vec3i) -> u32 {
        let bitVelocityX = u32(plateVelocity.x + 3);
        let bitVelocityY = u32(plateVelocity.y + 3);
        let bitVelocityZ = u32(plateVelocity.z + 3);

        var inBlock = _inBlock & ~(u32(7) << 21);
        inBlock = inBlock | (bitVelocityX << 21);

             inBlock = inBlock & ~(u32(7) << 24);
        inBlock = inBlock | (bitVelocityY << 24);

             inBlock = inBlock & ~(u32(7) << 27);
        inBlock = inBlock | (bitVelocityZ << 27);

        return inBlock;
    }

    fn getBitBoundaries(BlockB: u32) -> i32 {
        let bitBoundaries: i32 = i32((BlockB >> 0) & u32(31));
        return (bitBoundaries - 16);
    }
    fn setBitBoundaries(_inBlock: u32, boundary: i32) -> u32 {
        let bitBoundaries = u32(boundary + 16);

        var inBlock = _inBlock & ~(u32(31) << 0);
        inBlock = inBlock | (bitBoundaries << 0);

        return inBlock;
    }

    fn getBitBiome(BlockB: u32) -> u32 {
        let bitBiome: u32 = (BlockB >> 5) & u32(15);
        return (bitBiome);
    }
    fn setBitBiome(_inBlock: u32, biome: u32) -> u32 {
        var inBlock = _inBlock & ~(u32(15) << 5);
        inBlock = inBlock | (biome << 5);

        return inBlock;
    }

    fn getBitTemperature(BlockB: u32) -> i32 {
        let bitTemperature: i32 = i32((BlockB >> 18) & u32(127));
        return (bitTemperature - 64);
    }
    fn setBitTemperature(_inBlock: u32, temperature: i32) -> u32 {
        let bitTemperature = u32(temperature + 64);

        var inBlock = _inBlock & ~(u32(127) << 18);
        inBlock = inBlock | (bitTemperature << 18);

        return inBlock;
    }

    fn getBitOreType(BlockB: u32) -> u32 {
        let bitOreType: u32 = (BlockB >> 14) & u32(3);
        return (bitOreType);
    }
    fn setBitOreType(_inBlock: u32, oreType: u32) -> u32 {
        var inBlock = _inBlock & ~(u32(3) << 14);
        inBlock = inBlock | (oreType << 14);

        return inBlock;
    }

    fn getBitOreRichness(BlockB: u32) -> u32 {
        let bitOreRichness: u32 = (BlockB >> 16) & u32(3);
        return (bitOreRichness);
    }
    fn setBitOreRichness(_inBlock: u32, oreRichness: u32) -> u32 {
        var inBlock = _inBlock & ~(u32(3) << 16);
        inBlock = inBlock | (oreRichness << 16);

        return inBlock;
    }

    fn getBitHumidity(BlockB: u32) -> u32 {
        return (BlockB >> 25) & u32(127);
    }
    fn setBitHumidity(_inBlock: u32, temperature: u32) -> u32 {
        var inBlock = _inBlock & ~(u32(127) << 25);
        inBlock = inBlock | (temperature << 25);

        return inBlock;
    }

    fn deconstructCell(cellData: CellData) -> Cell {
        var blockA: u32;
        var blockB: u32;

        blockA = setBitHeight(blockA, cellData.Height);
        blockA = setBitPlateID(blockA, cellData.PlateID);
        blockA = setBitPlateVelocity(blockA, cellData.PlateVelocity);

        blockB = setBitBoundaries(blockB, cellData.Boundaries);
        blockB = setBitBiome(blockB, cellData.Biome);
        blockB = setBitOreType(blockB, cellData.OreType);
        blockB = setBitOreRichness(blockB, cellData.OreRichness);
        blockB = setBitTemperature(blockB, cellData.Temperature);
        blockB = setBitHumidity(blockB, cellData.Humidity);

        var cell: Cell;
        cell.BlockA = blockA;
        cell.BlockB = blockB;
        return cell;
    }

    fn constructCell(cell: Cell) -> CellData {
        return constructCellFromBlocks(cell.BlockA, cell.BlockB);
    }

    fn constructCellFromBlocks(BlockA: u32, BlockB: u32) -> CellData {
        var cellData: CellData;
        
        cellData.Height = getBitHeight(BlockA);
        cellData.PlateID = getBitPlateID(BlockA);
        cellData.PlateVelocity = getBitPlateVelocity(BlockA);

        cellData.Boundaries = getBitBoundaries(BlockB);
        cellData.Biome = getBitBiome(BlockB);
        cellData.OreType = getBitOreType(BlockB);
        cellData.OreRichness = getBitOreRichness(BlockB);
        cellData.Temperature = getBitTemperature(BlockB);
        cellData.Humidity = getBitHumidity(BlockB);

        return cellData;
    }

    //#region Positions

    fn getCellWorldPosition(cellPosition: vec2u, size: vec2u) -> vec3f {
        return getWorldPosition(cellPosition.x, cellPosition.y, size);
    }

    fn ease(x: f32) -> f32 {
        var out: f32 = x;
        if(x < 0.5) {
            out = (0.5 * sqrt(1 - pow(((2 * x) - 1), 2)));
        } else {
            out = 1 - (0.5 * sqrt(1 - pow((2 * x) - 1, 2)));
        }

        return (out + out + x) / 3;
    }

    fn getWorldPosition(_x: u32, _y: u32, size: vec2u) -> vec3f {
        
        let inclination: f32 = ease(f32(_x) / f32(size.y)) * PI;
        let azimuth: f32 =  (f32(_y) / f32(size.x)) * PI * 2;

        let x: f32 = sin(inclination) * cos(azimuth);
        let z: f32 = sin(inclination) * sin(azimuth);
        let y: f32 = cos(inclination);

        var cellVertexPosition: vec3f = vec3f(x, y, z);

        return cellVertexPosition;
    }

    fn getRelativeCell(cellPosition: vec2u, x: i32, y: i32, size: vec2u) -> vec2u {
        return getRelativePosition(cellPosition.x, cellPosition.y, x, y, size);
    }
    fn getRelativePosition(startX: u32, startY: u32, _x: i32, _y: i32, size: vec2u) -> vec2u {
        var x: i32 = i32(startX) + _x;
        var y: i32 = i32(startY) + _y;

        if(x < 0) { x = 0; }
        if(x >= i32(size.x)) { x = i32(size.x) - 1; }

        if(y < 0) { y = i32(size.y) + y; }
        if(y > i32(size.y)) { y = y - i32(size.y); }

        return vec2u(u32(x), u32(y));
    }

    fn getCellIndex(cellPosition: vec2u, size: vec2u) -> u32 {
        return getPositionIndex(cellPosition.x, cellPosition.y, size);
    }
    fn getPositionIndex(x: u32, y: u32, size: vec2u) -> u32 {
        return (x * size.x) + y;
    }
    fn getPosition(index: u32, size: vec2u) -> vec2u {
        return vec2u(u32(index / size.x), index % size.x);
    }

    //#region Math

    fn mag2(vec: vec2f) -> f32 {
        return sqrt((vec.x * vec.x) + (vec.y * vec.y));
    }

    fn mag3(vec: vec3f) -> f32 {
        return sqrt((vec.x * vec.x) + (vec.y * vec.y) + (vec.z * vec.z));
    }
`
export const cellStructBytes = 
    4 + // Block A
    4;  // Block B

export const cellBufferLayout = {
    label: "Cell Buffer Description",
    arrayStride: cellStructBytes,
    stepMode: 'instance',
    attributes: [
        {
            label: "Block A",
            format: 'uint32',
            offset: 0,
            shaderLocation: 0
        },
        {
            label: "Block B",
            format: 'uint32',
            offset: 4,
            shaderLocation: 1
        }
    ],
};