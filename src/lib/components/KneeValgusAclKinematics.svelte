<script>
	import { Compass, Save } from 'lucide-svelte';
	import {
		KNEE_PRESETS,
		solveKneeValgusPatellofemoral
	} from '$lib/engines/kneeValgusPatellofemoralEngine.js';
	import { saveBiomechanicsRecord } from '$lib/db/podiaVaultDb.js';

	let { role = 'standard', onSave = () => {} } = $props();

	let selectedPresetId = $state('neutral');
	let params = $state({ ...KNEE_PRESETS.neutral });
	let result = $derived(solveKneeValgusPatellofemoral(params));
	let savedMsg = $state('');

	function applyPreset(id) {
		selectedPresetId = id;
		params = { ...KNEE_PRESETS[id] };
	}

	async function handleSave() {
		await saveBiomechanicsRecord('knee_valgus_studies', {
			preset: selectedPresetId,
			params,
			result
		});
		savedMsg = 'Saved Study';
		onSave();
		setTimeout(() => (savedMsg = ''), 2500);
	}

	// Interactive goniometer knee medial shift
	let kneeShiftX = $derived(130 - params.fppaDeg * 1.9);
</script>

<section class="glass-deck" style="padding: 1.25rem;">
	<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
		<div>
			<div style="display: flex; align-items: center; gap: 0.5rem;">
				<Compass size={20} color="var(--accent-warning)" />
				<h2 style="font-size: 1.15rem; font-weight: 700;">
					Module 3: Dynamic Knee-Valgus (FPPA), Q-Angle &amp; ACL / PFJRF Vector Lab
				</h2>
			</div>
			<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
				ASIS–Patella–Tibia Goniometer · Rearfoot Calcaneal Eversion (β) · Patellofemoral Contact Stress (MPa)
			</p>
		</div>
		<button class="tactile-btn primary" onclick={handleSave}>
			<Save size={15} />
			{savedMsg || 'Save Knee Study'}
		</button>
	</div>

	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
		{#each Object.values(KNEE_PRESETS) as preset}
			<button
				class="tactile-btn"
				style={selectedPresetId === preset.id ? 'border-color: var(--accent-warning); background: rgba(245,158,11,0.16);' : ''}
				onclick={() => applyPreset(preset.id)}
			>
				{preset.id.replace('_', ' ').toUpperCase()}
			</button>
		{/each}
	</div>

	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem;">
		<!-- Interactive Lower-Extremity Vector Goniometer -->
		<div class="glass-deck-elevated" style="padding: 0.9rem;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
				<span class="metric-label">Frontal-Plane Vector Goniometer</span>
				<span class="badge badge-{result.aclRisk}">{result.aclLabel}</span>
			</div>
			<svg viewBox="0 0 260 200" style="width: 100%; height: 185px; background: rgba(0,0,0,0.28); border-radius: 12px;">
				<!-- Neutral Reference Axis -->
				<line x1="130" y1="22" x2="130" y2="178" stroke="rgba(255,255,255,0.16)" stroke-dasharray="4 4" />
				<!-- Femur & Tibia Vectors -->
				<line x1="142" y1="24" x2={kneeShiftX} y2="100" stroke="var(--accent-secondary)" stroke-width="4" stroke-linecap="round" />
				<line x1={kneeShiftX} y1="100" x2="130" y2="176" stroke="var(--accent-primary)" stroke-width="4" stroke-linecap="round" />
				<!-- Landmarks -->
				<circle cx="142" cy="24" r="6" fill="var(--accent-secondary)" />
				<text x="152" y="28" fill="var(--text-secondary)" font-size="10">ASIS</text>
				<circle cx={kneeShiftX} cy="100" r="7" fill={result.aclRisk === 'danger' ? 'var(--accent-danger)' : 'var(--accent-warning)'} />
				<text x={kneeShiftX - 48} y="104" fill="var(--text-primary)" font-size="10">Patella</text>
				<circle cx="130" cy="176" r="6" fill="var(--accent-primary)" />
				<text x="140" y="180" fill="var(--text-secondary)" font-size="10">Ankle</text>
			</svg>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.65rem; font-size: 0.75rem;">
				<div>
					<span>FPPA Valgus: <strong>{params.fppaDeg}°</strong></span>
					<input type="range" min="0" max="30" step="0.5" bind:value={params.fppaDeg} />
				</div>
				<div>
					<span>Knee Flexion: <strong>{params.kneeFlexionDeg}°</strong></span>
					<input type="range" min="5" max="115" step="1" bind:value={params.kneeFlexionDeg} />
				</div>
			</div>
		</div>

		<!-- Kinetics Metrics -->
		<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem;">
			<div class="metric-chip">
				<span class="metric-label">FPPA (Valgus Collapse)</span>
				<span class="metric-value" style="color: {params.fppaDeg > 15 ? 'var(--accent-danger)' : 'var(--accent-primary)'};">
					{result.fppaDeg}°
				</span>
				<span class="metric-sub">Alert Threshold: &gt; 12°</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Quadriceps Q-Angle</span>
				<span class="metric-value">{result.qAngleDeg}°</span>
				<span class="metric-sub">Normal: 10°–18°</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">PFJRF (Joint Force)</span>
				<span class="metric-value">{result.pfjrfBW}× BW</span>
				<span class="metric-sub">{result.pfjrfN} N</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Cartilage Stress</span>
				<span class="metric-value">{result.cartilageStressMPa} MPa</span>
				<span class="metric-sub">Patellofemoral Contact</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Calcaneal Pronation (β)</span>
				<span class="metric-value">{result.calcanealPronationDeg}°</span>
				<span class="metric-sub">Normal: 4°–8°</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">ACL Anterior Shear</span>
				<span class="metric-value">{result.aclShearN} N</span>
				<span class="metric-sub">Lat Bowstring: {result.lateralBowstringN} N</span>
			</div>
		</div>
	</div>
</section>
