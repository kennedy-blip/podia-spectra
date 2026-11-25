#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_valr_norm;     // Normalized VALR (0.0 - 1.5)
uniform float u_cadence_hz;    // Step cadence in Hz (~2.5 - 3.3 Hz)
uniform float u_theme_mode;    // 0: obsidian, 1: daylight, 2: thermal, 3: eco

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Heel-to-forefoot Center of Pressure (CoP) dual-lobe isobar field
    vec2 heelCenter = vec2(-0.35, -0.18);
    vec2 forefootCenter = vec2(0.32, 0.22);

    float pulse = 0.5 + 0.5 * sin(u_time * u_cadence_hz * 3.14159);
    float dHeel = length(uv - heelCenter);
    float dFore = length(uv - forefootCenter);

    float field = exp(-dHeel * 3.2) * (0.7 + 0.3 * pulse) +
                  exp(-dFore * 2.8) * (0.7 + 0.3 * (1.0 - pulse));
    field += 0.14 * noise(uv * 3.5 + vec2(u_time * 0.15, -u_time * 0.1));

    // Isobar contour rings (10 kPa - 350 kPa)
    float contours = abs(fract(field * 10.0 - u_time * 0.25) - 0.5);
    float line = smoothstep(0.06, 0.01, contours) * (0.35 + 0.45 * u_valr_norm);

    vec3 bg = vec3(0.016, 0.035, 0.078);
    vec3 c1 = vec3(0.063, 0.725, 0.506); // Kinetic Emerald
    vec3 c2 = vec3(0.220, 0.741, 0.973); // Isobar Cyan
    vec3 c3 = vec3(0.957, 0.247, 0.369); // Peak Pressure Crimson

    if (u_theme_mode > 0.5 && u_theme_mode < 1.5) {
        // Daylight Frost
        bg = vec3(0.886, 0.910, 0.941);
        c1 = vec3(0.020, 0.588, 0.412);
        c2 = vec3(0.008, 0.518, 0.780);
    } else if (u_theme_mode >= 1.5 && u_theme_mode < 2.5) {
        // Thermal Infrared
        bg = vec3(0.027, 0.008, 0.078);
        c1 = vec3(0.961, 0.620, 0.043);
        c2 = vec3(0.925, 0.286, 0.600);
    }

    vec3 glow = mix(c2, c1, clamp(field, 0.0, 1.0));
    glow = mix(glow, c3, smoothstep(0.65, 1.15, field) * u_valr_norm);

    vec3 col = bg + glow * (field * 0.22 + line * 0.32);
    fragColor = vec4(col, 1.0);
}
