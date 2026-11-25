<script>
	import { Activity, Save, Zap, Radio } from 'lucide-svelte';
	import {
		GAIT_PRESETS,
		solveSpringMassTibialShock
	} from '$lib/engines/tibialShockSpringMassEngine.js';
	import { saveBiomechanicsRecord } from '$lib/db/podiaVaultDb.js';

	let { role = 'standard', onSave = () => {} } = $props();

	let selectedPresetId = $state('overstrider');
	let params = $state({ ...GAIT_PRESETS.overstrider });
	let result = $derived(solveSpringMassTibialShock(params));
	let imuActive = $state(false);
	let savedMsg = $state('');

	function applyPreset(id) {
		selectedPresetId = id;
		params = { ...GAIT_PRESETS[id] };
	}

	function toggleImu() {
		imuActive = !imuActive;
		if (imuActive && typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
			const handler = (e) => {
				if (!imuActive) {
					window.removeEventListener('devicemotion', handler);
					return;
				}
				const a = e.acceleration;
				if (a && (a.x !== null || a.y !== null || a.z !== null)) {
					const gMag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2) / 9.80665;
					if (gMag > 1.5) {
						params.peakTibialShockG = Number(Math.min(16, Math.max(2, gMag)).toFixed(1));
					}
				}
			};
			window.addEventListener('devicemotion', handler);
		}
	}

	async function handleSave() {
		await saveBiomechanicsRecord('tibial_shock_runs', {
			preset: selectedPresetId,
			params,
			result
		});
		savedMsg = 'Saved Run';
		onSave();
		setTimeout(() => (savedMsg = ''), 2500);
	}

	// Build SVG polyline for vGRF
	let totalPath = $derived(
		result.samples
			.map((s, i) => `${(i / (result.samples.length - 1)) * 360},${150 - s.totalBW * 42}`)
			.join(' ')
	);
	let activePath = $derived(
		result.samples
			.map((s, i) => `${(i / (result.samples.length - 1)) * 360},${150 - s.activeBW * 42}`)
			.join(' ')
	);
</script>

<section class="glass-deck" style="padding: 1.25rem;">
	<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
		<div>
			<div style="display: flex; align-items: center; gap: 0.5rem;">
				<Zap size={20} color="var(--accent-secondary)" />
				<h2 style="font-size: 1.15rem; font-weight: 700;">
					Module 2: Tibial Impact Shock (VALR) &amp; Spring-Mass Gait Lab
				</h2>
			</div>
			<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
				Blickhan-McMahon Two-Mass vGRF · Passive Impact F1 (10–35 Hz) vs. Active F2 · Carter-Caler Bone Fatigue
			</p>
		</div>
		<div style="display: flex; gap: 0.5rem;">
			<button class="tactile-btn" onclick={toggleImu}>
				<Radio size={15} />
				{imuActive ? 'IMU Streaming (200 Hz)' : 'Start Live 3-Axis IMU'}
			</button>
			<button class="tactile-btn primary" onclick={handleSave}>
				<Save size={15} />
				{savedMsg || 'Save Gait Run'}
			</button>
		</div>
	</div>

	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
		{#each Object.values(GAIT_PRESETS) as preset}
			<button
				class="tactile-btn"
				style={selectedPresetId === preset.id ? 'border-color: var(--accent-secondary); background: rgba(56,189,248,0.16);' : ''}
				onclick={() => applyPreset(preset.id)}
			>
				{preset.id.replace('_', ' ').toUpperCase()}
			</button>
		{/each}
	</div>

	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem;">
		<!-- Dual-Trace vGRF Oscilloscope -->
		<div class="glass-deck-elevated" style="padding: 0.9rem;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
				<span class="metric-label">Dual-Mass vGRF Oscilloscope (BW)</span>
				<span class="badge badge-{result.riskStatus}">{result.riskLabel}</span>
			</div>
			<svg viewBox="0 0 360 165" style="width: 100%; height: 170px; background: rgba(0,0,0,0.28); border-radius: 12px;">
				<line x1="0" y1="150" x2="360" y2="150" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
				<line x1="0" y1="66" x2="360" y2="66" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 4" />
				<polyline fill="none" stroke="rgba(56,189,248,0.5)" stroke-width="2" stroke-dasharray="4 3" points={activePath} />
				<polyline fill="none" stroke="var(--accent-primary)" stroke-width="2.8" points={totalPath} />
			</svg>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.65rem; font-size: 0.75rem;">
				<div>
					<span>Cadence: <strong>{params.cadenceSpm} SPM</strong></span>
					<input type="range" min="130" max="200" bind:value={params.cadenceSpm} />
				</div>
				<div>
					<span>GCT: <strong>{params.gctMs} ms</strong></span>
					<input type="range" min="170" max="600" bind:value={params.gctMs} />
				</div>
			</div>
		</div>

		<!-- Spring-Mass Metrics -->
		<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem;">
			<div class="metric-chip">
				<span class="metric-label">VALR (Loading Rate)</span>
				<span class="metric-value" style="color: {result.valrBWs > 80 ? 'var(--accent-danger)' : 'var(--accent-primary)'};">
					{result.valrBWs} BW/s
				</span>
				<span class="metric-sub">VILR: {result.vilrBWs} BW/s</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Peak Tibial Shock</span>
				<span class="metric-value">{params.peakTibialShockG} g</span>
				<span class="metric-sub">Safe Zone: &lt; 8.0 g</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Leg Stiffness (k_leg)</span>
				<span class="metric-value">{result.kLegKNm} kN/m</span>
				<span class="metric-sub">k_vert: {result.kVertKNm} kN/m</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">CoM Excursion (Δy)</span>
				<span class="metric-value">{result.deltaYcMm} mm</span>
				<span class="metric-sub">Flight: {result.flightTimeMs} ms</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Carter-Caler Fatigue</span>
				<span class="metric-value">{result.carterDamageIndex}</span>
				<span class="metric-sub">Cumulative Bone Index</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">L/R Asymmetry</span>
				<span class="metric-value">{params.lrAsymmetryPct}%</span>
				<span class="metric-sub">Target: &lt; 5.0%</span>
			</div>
		</div>
	</div>
</section>
