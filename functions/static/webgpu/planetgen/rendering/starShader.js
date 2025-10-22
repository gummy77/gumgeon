export const starWGSL = /* wgsl */`
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

    @vertex
    fn vert(
        @builtin(vertex_index) inVertexIndex: u32,
        @builtin(instance_index) instanceIndex: u32,

        @location(0) starPosition: vec3f

    ) -> VertexOutput {
        var out: VertexOutput;

        var vertexPosition: vec3f = vertexPositions[inVertexIndex ];

        out.position = (projection * transform * vec4f(starPosition, 0)) + vec4f(vertexPosition, 0);

        out.color = vec4f(1, 1, 1, 1);

        return out;
    }

    @fragment
    fn frag(
        fragData: VertexOutput,
    ) -> @location(0) vec4f {
        return fragData.color;
    }
`