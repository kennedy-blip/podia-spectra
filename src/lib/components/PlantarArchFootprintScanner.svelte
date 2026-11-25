<script>
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { Footprints, Camera, Save, Activity, Sparkles } from 'lucide-svelte';
	import {
		PLANTAR_PRESETS,
		solvePlantarArchMorphometry
	} from '$lib/engines/plantarArchMorphometryEngine.js';
	import { saveBiomechanicsRecord } from '$lib/db/podiaVaultDb.js';
	import footprintFragShader from '../../shaders/baropodometricFootprintShader.glsl?raw';

	let { role = 'standard', onSave = () => {} } = $props();

	let selectedPresetId = $state('normal_rectus');
	let params = $state({ ...PLANTAR_PRESETS.normal_rectus });
	let result = $derived(solvePlantarArchMorphometry(params));

	let canvasEl;
	let savedMsg = $state('');
	let cameraActive = $state(false);
	let videoEl;

	const animCsi = spring(34.2, { stiffness: 0.18, damping: 0.65 });
	$effect(() => {
		animCsi.set(result.csiPercent);
	});

	function applyPreset(id) {
		selectedPresetId = id;
		params = { ...PLANTAR_PRESETS[id] };
	}

	async function toggleCamera() {
		if (cameraActive) {
			if (videoEl?.srcObject) {
				videoEl.srcObject.getTracks().forEach((t) => t.stop());
				videoEl.srcObject = null;
			}
			cameraActive = false;
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
			});
			cameraActive = true;
			setTimeout(() => {
				if (videoEl) videoEl.srcObject = stream;
			}, 50);
		} catch {
			cameraActive = false;
		}
	}

	async function handleSave() {
		await saveBiomechanicsRecord('plantar_arch_scans', {
			preset: selectedPresetId,
			params,
			result
		});
		savedMsg = 'Saved to IndexedDB Vault';
		onSave();
		setTimeout(() => (savedMsg = ''), 2500);
	}

	onMount(() => {
		if (!canvasEl) return;
		const gl = canvasEl.getContext('webgl2');
		if (!gl) return;

		const vsSrc = `#version 300 es
		in vec2 a_pos;
		out vec2 v_uv;
		void main() {
			v_uv = a_pos * 0.5 + 0.5;
			gl_Position = vec4(a_pos, 0.0, 1.0);
		}`;

		const compile = (type, src) => {
			const s = gl.createShader(type);
			gl.shaderSource(s, src);
			gl.compileShader(s);
			return s;
		};

		const prog = gl.createProgram();
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, footprintFragShader));
		gl.linkProgram(prog);
		gl.useProgram(prog);

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			gl.STATIC_DRAW
		);
		const loc = gl.getAttribLocation(prog, 'a_pos');
		gl.enableVertexAttribArray(loc);
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

		const uTime = gl.getUniformLocation(prog, 'u_time');
		const uCsi = gl.getUniformLocation(prog, 'u_csi');
		const uSai = gl.getUniformLocation(prog, 'u_sai');
		const uHallux = gl.getUniformLocation(prog, 'u_hallux_angle');
		const uMtp = gl.getUniformLocation(prog, 'u_mtp_flex');

		let raf;
		const render = (t) => {
			gl.viewport(0, 0, canvasEl.width, canvasEl.height);
			gl.uniform1f(uTime, t * 0.001);
			gl.uniform1f(uCsi, result.csiPercent);
			gl.uniform1f(uSai, result.sai);
			gl.uniform1f(uHallux, result.halluxValgusDeg);
			gl.uniform1f(uMtp, params.mtpDorsiflexionDeg);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			raf = requestAnimationFrame(render);
		};
		raf = requestAnimationFrame(render);
		return () => cancelAnimationFrame(raf);
	});
</script>

<section class="glass-deck p-5" style="padding: 1.25rem;">
	<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
		<div>
			<div style="display: flex; align-items: center; gap: 0.5rem;">
				<Footprints size={20} color="var(--accent-primary)" />
				<h2 style="font-size: 1.15rem; font-weight: 700;">
					Module 1: Baropodometric Plantar Arch &amp; Windlass Fascia Scanner
				</h2>
			</div>
			<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
				60 FPS WebGL2 kPa Pressure Contour Shader · CSI, SAI, Clarke's Angle, Navicular Drop &amp; Hicks Windlass Tension
			</p>
		</div>
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
			<button class="tactile-btn" onclick={toggleCamera}>
				<Camera size={15} />
				{cameraActive ? 'Stop Camera' : 'Live Barefoot Scan'}
			</button>
			<button class="tactile-btn primary" onclick={handleSave}>
				<Save size={15} />
				{savedMsg || 'Save Scan'}
			</button>
		</div>
	</div>

	<!-- 1-Tap Clinical Presets -->
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
		{#each Object.values(PLANTAR_PRESETS) as preset}
			<button
				class="tactile-btn"
				style={selectedPresetId === preset.id ? 'border-color: var(--accent-primary); background: rgba(16,185,129,0.16);' : ''}
				onclick={() => applyPreset(preset.id)}
			>
				<Sparkles size={13} />
				{preset.id.replace('_', ' ').toUpperCase()}
			</button>
		{/each}
	</div>

	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem;">
		<!-- WebGL2 Baropodometric Canvas -->
		<div class="glass-deck-elevated" style="padding: 0.9rem; display: flex; flex-direction: column; align-items: center;">
			<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
				<span class="metric-label">WebGL2 Baropodometric kPa Map</span>
				<span class="badge badge-{result.archSeverity}">{result.archClass}</span>
			</div>
			{#if cameraActive}
				<video bind:this={videoEl} autoplay playsinline muted style="width: 100%; max-height: 300px; border-radius: 14px; object-fit: cover;"></video>
			{:else}
				<canvas bind:this={canvasEl} width="320" height="340" style="width: 100%; max-width: 320px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.12);"></canvas>
			{/if}
			<div style="width: 100%; margin-top: 0.75rem;">
				<div style="display: flex; justify-content: space-between; font-size: 0.76rem; margin-bottom: 0.25rem;">
					<span>1st MTP Dorsiflexion (Windlass): <strong>{params.mtpDorsiflexionDeg}°</strong></span>
					<span>Fascia Tension: <strong>{result.fasciaTensionN} N</strong></span>
				</div>
				<input type="range" min="0" max="65" step="1" bind:value={params.mtpDorsiflexionDeg} />
			</div>
		</div>

		<!-- Clinical Metrics & Hicks Windlass -->
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem;">
				<div class="metric-chip">
					<span class="metric-label">Chippaux-Smirnak (CSI)</span>
					<span class="metric-value">{$animCsi.toFixed(1)}%</span>
					<span class="metric-sub">Normal: 30.0–39.9%</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Staheli Arch Index (SAI)</span>
					<span class="metric-value">{result.sai}</span>
					<span class="metric-sub">Normal: 0.50–0.70</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Clarke's Angle (α)</span>
					<span class="metric-value">{result.clarkeAngleDeg}°</span>
					<span class="metric-sub">Normal: 42°–54°</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Navicular Drop</span>
					<span class="metric-value" style="color: {result.excessivePronation ? 'var(--accent-danger)' : 'var(--accent-primary)'};">
						{result.navicularDropMm} mm
					</span>
					<span class="metric-sub">{result.excessivePronation ? 'Excessive Pronation (>10mm)' : 'Within Normal (<10mm)'}</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Hallux Valgus (θ_HV)</span>
					<span class="metric-value">{result.halluxValgusDeg}°</span>
					<span class="metric-sub">Normal: &lt; 15°</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Windlass Tension (T_pf)</span>
					<span class="metric-value">{result.fasciaTensionN} N</span>
					<span class="metric-sub">{result.fasciaTensionBW}× BW · ΔL {result.fasciaShorteningMm} mm</span>
				</div>
			</div>

			{#if role !== 'standard'}
				<div class="glass-deck-elevated" style="padding: 0.85rem;">
					<div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem;">
						<Activity size={15} color="var(--accent-secondary)" />
						<span class="metric-label">Evidence-Based Orthotic &amp; Footwear Prescription</span>
					</div>
					<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; font-size: 0.78rem; color: var(--text-secondary);">
						<div>Heel-to-Toe Drop: <strong style="color: var(--text-primary);">{result.prescription.heelToToeDropMm} mm</strong></div>
						<div>Medial Post Wedge: <strong style="color: var(--text-primary);">{result.prescription.medialPostWedgeDeg}°</strong></div>
						<div>Metatarsal Pad: <strong style="color: var(--text-primary);">{result.prescription.metatarsalDomePad}</strong></div>
						<div>Toe-Box Geometry: <strong style="color: var(--text-primary);">{result.prescription.toeBoxWidth}</strong></div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
