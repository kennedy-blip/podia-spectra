<script>
	import { Layers, Save } from 'lucide-svelte';
	import {
		MIDSOLE_PRESETS,
		solveMidsoleViscoelasticity
	} from '$lib/engines/midsoleViscoelasticFoamEngine.js';
	import { saveBiomechanicsRecord } from '$lib/db/podiaVaultDb.js';

	let { role = 'standard', onSave = () => {} } = $props();

	let selectedPresetId = $state('healthy_eva');
	let params = $state({ ...MIDSOLE_PRESETS.healthy_eva });
	let result = $derived(solveMidsoleViscoelasticity(params));
	let savedMsg = $state('');

	function applyPreset(id) {
		selectedPresetId = id;
		params = { ...MIDSOLE_PRESETS[id] };
	}

	async function handleSave() {
		await saveBiomechanicsRecord('footwear_midsole_audits', {
			preset: selectedPresetId,
			params,
			result
		});
		savedMsg = 'Saved Audit';
		onSave();
		setTimeout(() => (savedMsg = ''), 2500);
	}

	// Hysteresis loop SVG path
	let loopWidth = $derived(Math.min(55, result.hysteresisLossPct * 0.95));
</script>

<section class="glass-deck" style="padding: 1.25rem;">
	<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
		<div>
			<div style="display: flex; align-items: center; gap: 0.5rem;">
				<Layers size={20} color="var(--accent-primary)" />
				<h2 style="font-size: 1.15rem; font-weight: 700;">
					Module 4: Midsole Foam Viscoelastic Hysteresis &amp; Outsole Wear Lab
				</h2>
			</div>
			<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
				Kelvin-Voigt Energy Return (%) · Loss Tangent (tan δ) · Cell-Crease Density &amp; Remaining Safe Mileage
			</p>
		</div>
		<button class="tactile-btn primary" onclick={handleSave}>
			<Save size={15} />
			{savedMsg || 'Save Shoe Audit'}
		</button>
	</div>

	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
		{#each Object.values(MIDSOLE_PRESETS) as preset}
			<button
				class="tactile-btn"
				style={selectedPresetId === preset.id ? 'border-color: var(--accent-primary); background: rgba(16,185,129,0.16);' : ''}
				onclick={() => applyPreset(preset.id)}
			>
				{preset.id.replace('_', ' ').toUpperCase()}
			</button>
		{/each}
	</div>

	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem;">
		<!-- Stress-Strain Viscoelastic Hysteresis Loop -->
		<div class="glass-deck-elevated" style="padding: 0.9rem;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
				<span class="metric-label">Kelvin-Voigt Stress–Strain Hysteresis</span>
				<span class="badge badge-{result.status}">{result.status === 'danger' ? 'RETIRE SHOE' : result.status === 'warn' ? 'FATIGUED' : 'HEALTHY'}</span>
			</div>
			<svg viewBox="0 0 260 165" style="width: 100%; height: 165px; background: rgba(0,0,0,0.28); border-radius: 12px;">
				<path
					d={`M 30 140 Q ${120 - loopWidth} 55, 225 25 Q ${135 + loopWidth} 105, 30 140 Z`}
					fill="rgba(244, 63, 94, 0.22)"
					stroke="var(--accent-primary)"
					stroke-width="2.5"
				/>
				<text x="85" y="92" fill="var(--text-primary)" font-size="11" font-weight="bold">
					Loss: {result.hysteresisLossPct}%
				</text>
			</svg>
			<div style="margin-top: 0.65rem; font-size: 0.75rem;">
				<div style="display: flex; justify-content: space-between;">
					<span>Logged Mileage: <strong>{params.mileageKm} km</strong></span>
					<span>Compression Set: <strong>{params.compressionSetPct}%</strong></span>
				</div>
				<input type="range" min="0" max="1000" step="10" bind:value={params.mileageKm} />
			</div>
		</div>

		<!-- Foam Metrics -->
		<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem;">
			<div class="metric-chip">
				<span class="metric-label">Energy Return</span>
				<span class="metric-value" style="color: {result.energyReturnPct < 50 ? 'var(--accent-danger)' : 'var(--accent-primary)'};">
					{result.energyReturnPct}%
				</span>
				<span class="metric-sub">{result.foamType}</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Loss Tangent (tan δ)</span>
				<span class="metric-value">{result.lossTangent}</span>
				<span class="metric-sub">Log Dec δ: {result.logDecrement}</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Remaining Safe Life</span>
				<span class="metric-value">{result.remainingKm} km</span>
				<span class="metric-sub">~{Math.round(result.remainingKm * 0.621)} miles</span>
			</div>
			<div class="metric-chip">
				<span class="metric-label">Crease Density</span>
				<span class="metric-value">{result.creaseDensityPerCm} /cm</span>
				<span class="metric-sub">{result.wearDiagnosis}</span>
			</div>
		</div>
	</div>
</section>
