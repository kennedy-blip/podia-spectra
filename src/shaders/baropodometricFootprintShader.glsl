#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_csi;          // Chippaux-Smirnak Index (%)
uniform float u_sai;          // Staheli Arch Index
uniform float u_hallux_angle; // Hallux Valgus Angle (deg)
uniform float u_mtp_flex;     // 1st MTP dorsiflexion (deg) for Windlass tension

// Signed distance to a capsule
float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

void main() {
    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= 0.62;

    // Heel, Midfoot Isthmus, and Forefoot pressure lobes
    float heel = exp(-length(p - vec2(0.0, -0.58)) * 5.2);
    float fore = exp(-length(p - vec2(0.02, 0.38)) * 4.2);

    // Midfoot isthmus width modulated by CSI
    float archWidth = clamp(u_csi / 100.0, 0.08, 0.75);
    float midfoot = exp(-pow((p.x + 0.14 * (1.0 - archWidth)) / (0.12 + 0.35 * archWidth), 2.0)) *
                    exp(-pow(p.y / 0.32, 2.0));

    // Hallux pressure lobe deflected by Hallux Valgus angle
    float hvRad = radians(u_hallux_angle - 10.0);
    vec2 halluxPos = vec2(-0.14 + sin(hvRad) * 0.12, 0.72);
    float hallux = exp(-length(p - halluxPos) * 8.5);

    // Windlass plantar fascia tension increases forefoot/hallux load
    float windlassBoost = 1.0 + (u_mtp_flex / 65.0) * 0.35;
    float kPa = (heel * 0.92 + midfoot * (0.35 + archWidth * 0.65) + fore * 0.95 * windlassBoost + hallux * 0.78);

    // Isobar contour lines
    float iso = smoothstep(0.03, 0.0, abs(fract(kPa * 6.0) - 0.5));

    // False-color baropodometric colormap (kPa)
    vec3 col = vec3(0.03, 0.06, 0.12);
    col = mix(col, vec3(0.06, 0.45, 0.85), smoothstep(0.15, 0.35, kPa));
    col = mix(col, vec3(0.06, 0.82, 0.52), smoothstep(0.35, 0.58, kPa));
    col = mix(col, vec3(0.96, 0.72, 0.08), smoothstep(0.58, 0.82, kPa));
    col = mix(col, vec3(0.96, 0.22, 0.36), smoothstep(0.82, 1.10, kPa));
    col += vec3(0.9, 0.95, 1.0) * iso * 0.22 * smoothstep(0.12, 0.3, kPa);

    fragColor = vec4(col, 1.0);
}
