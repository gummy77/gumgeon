export const fragmentWGSL = /* wgsl */`
    struct VertexOutput {
        @builtin(position) clip_posiiton: vec4f,
        @location(0) color: vec4f
    }
    
    @fragment
    fn frag(
        fragData: VertexOutput,
    ) -> @location(0) vec4f {
        return fragData.color;
    }
`