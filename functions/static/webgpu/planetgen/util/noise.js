export const noiseWGSL = /* wgsl */`
    // MIT License. © Stefan Gustavson, Munrocket
    //

        // https://www.pcg-random.org/
    fn hash11(n: u32) -> u32 {
        var h = n * 747796405u + 2891336453u;
        h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;
        return (h >> 22u) ^ h;
    }

    fn hash22(p: vec2u) -> vec2u {
        var v = p * 1664525u + 1013904223u;
        v.x += v.y * 1664525u; v.y += v.x * 1664525u;
        v ^= v >> vec2u(16u);
        v.x += v.y * 1664525u; v.y += v.x * 1664525u;
        v ^= v >> vec2u(16u);
        return v;
    }

    // http://www.jcgt.org/published/0009/03/02/
    fn hash33(p: vec3u) -> vec3u {
        var v = p * 1664525u + 1013904223u;
        v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
        v ^= v >> vec3u(16u);
        v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
        return v;
    }

    // http://www.jcgt.org/published/0009/03/02/
    fn hash44(p: vec4u) -> vec4u {
        var v = p * 1664525u + 1013904223u;
        v.x += v.y*v.w; v.y += v.z*v.x; v.z += v.x*v.y; v.w += v.y*v.z;
        v ^= v >> vec4u(16u);
        v.x += v.y*v.w; v.y += v.z*v.x; v.z += v.x*v.y; v.w += v.y*v.z;
        return v;
    }

    fn rand11(f: f32) -> f32 { return f32(hash11(bitcast<u32>(f))) / f32(0xffffffff); }
    fn rand22(f: vec2f) -> vec2f { return vec2f(hash22(bitcast<vec2u>(f))) / f32(0xffffffff); }
    fn rand33(f: vec3f) -> vec3f { return vec3f(hash33(bitcast<vec3u>(f))) / f32(0xffffffff); }
    fn rand44(f: vec4f) -> vec4f { return vec4f(hash44(bitcast<vec4u>(f))) / f32(0xffffffff); }

    fn Noise2(n: vec2f) -> f32 {
        let d = vec2f(0., 1.);
        let b = floor(n);
        let f = smoothstep(vec2f(0.), vec2f(1.), fract(n));
        return (mix(mix(rand22(b), rand22(b + d.yx), f.x), mix(rand22(b + d.xy), rand22(b + d.yy), f.x), f.y)).x;
    }

    fn mod289(x: vec4f) -> vec4f { return x - floor(x * (1. / 289.)) * 289.; }
    fn perm4(x: vec4f) -> vec4f { return mod289(((x * 34.) + 1.) * x); }

    fn Noise3(p: vec3f) -> f32 {
        let a = floor(p);
        var d: vec3f = p - a;
        d = d * d * (3. - 2. * d);

        let b = a.xxyy + vec4f(0., 1., 0., 1.);
        let k1 = perm4(b.xyxy);
        let k2 = perm4(k1.xyxy + b.zzww);

        let c = k2 + a.zzzz;
        let k3 = perm4(c);
        let k4 = perm4(c + 1.);

        let o1 = fract(k3 * (1. / 41.));
        let o2 = fract(k4 * (1. / 41.));

        let o3 = o2 * d.z + o1 * (1. - d.z);
        let o4 = o3.yw * d.x + o3.xz * (1. - d.x);

        return o4.y * d.y + o4.x * (1. - d.y);
    }
`