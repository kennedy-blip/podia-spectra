<script>
	import { Volume2, VolumeX, Save, Vibrate } from 'lucide-svelte';
	import {
		DERMATOME_SITES,
		solveHeiderscheitCadence,
		scoreNeuropathyScreener
	} from '$lib/engines/cadencePacerNeuropathyEngine.js';
	import { saveBiomechanicsRecord } from '$lib/db/podiaVaultDb.js';

	let { role = 'standard', onSave = () => {} } = $props();

	let baseSpm = $state(164);
	let boostPct = $state(7.5);
	let vptVolts = $state(12);
	let siteResults = $state(Object.fromEntries(DERMATOME_SITES.map((s) => [s.id, true])));
	let pacerRunning = $state(false);
	let savedMsg = $state('');

	let cadenceResult = $derived(solveHeiderscheitCadence(baseSpm, boostPct, 3.3));
	let neuroResult = $derived(scoreNeuropathyScreener(vptVolts, siteResults));

	let audioCtx = null;
	let timerId = null;

	function togglePacer() {
		if (pacerRunning) {
			clearInterval(timerId);
			pacerRunning = false;
			return;
		}
		pacerRunning = true;
		if (typeof window !== 'undefined') {
			audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
			const intervalMs = (60 / cadenceResult.targetSpm) * 1000;
			const tick = () => {
				if (!audioCtx) return;
				const osc = audioCtx.createOscillator();
				const gain = audioCtx.createGain();
				osc.frequency.value = 800;
				gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.045);
				osc.connect(gain);
				gain.connect(audioCtx.destination);
				osc.start();
				osc.stop(audioCtx.currentTime + 0.05);
				if (navigator.vibrate) navigator.vibrate(15);
			};
			tick();
			timerId = setInterval(tick, intervalMs);
		}
	}

	function trigger128HzPulse() {
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			navigator.vibrate([120, 40, 120]);
		}
	}

	function toggleSite(id) {
		siteResults = { ...siteResults, [id]: !siteResults[id] };
	}

	async function handleSave() {
		await saveBiomechanicsRecord('cadence_neuropathy_logs', {
			cadenceResult,
			neuroResult
		});
		savedMsg = 'Saved Log';
		onSave();
		setTimeout(() => (savedMsg = ''), 2500);
	}
</script>

<section class="glass-deck" style="padding: 1.25rem;">
	<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
		<div>
			<div style="display: flex; align-items: center; gap: 0.5rem;">
				<Vibrate size={20} color="var(--accent-secondary)" />
				<h2 style="font-size: 1.15rem; font-weight: 700;">
					Module 5: Cadence Entrainment Pacer &amp; 128 Hz Plantar Neuropathy Screener
				</h2>
			</div>
			<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
				Heiderscheit +5%/+10% Joint-Unloading Metronome · 10-Site Semmes-Weinstein Dermatome Map &amp; VPT
			</p>
		</div>
		<div style="display: flex; gap: 0.5rem;">
			<button class="tactile-btn" onclick={togglePacer}>
				{#if pacerRunning}
					<VolumeX size={15} /> Stop Pacer ({cadenceResult.targetSpm} SPM)
				{:else}
					<Volume2 size={15} /> Start Entrainment ({cadenceResult.targetSpm} SPM)
				{/if}
			</button>
			<button class="tactile-btn primary" onclick={handleSave}>
				<Save size={15} />
				{savedMsg || 'Save Log'}
			</button>
		</div>
	</div>

	<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem;">
		<!-- Cadence Entrainment -->
		<div class="glass-deck-elevated" style="padding: 0.9rem;">
			<span class="metric-label">Heiderscheit Cadence Optimization</span>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-top: 0.65rem;">
				<div class="metric-chip">
					<span class="metric-label">Target Cadence</span>
					<span class="metric-value">{cadenceResult.targetSpm} SPM</span>
					<span class="metric-sub">Base: {cadenceResult.baseSpm} SPM (+{boostPct}%)</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Joint Load Drop</span>
					<span class="metric-value" style="color: var(--accent-primary);">-{cadenceResult.jointLoadReductionPct}%</span>
					<span class="metric-sub">CoM Δy: -{cadenceResult.comExcursionReductionPct}%</span>
				</div>
			</div>
			<div style="margin-top: 0.75rem; font-size: 0.76rem;">
				<span>Baseline Cadence: <strong>{baseSpm} SPM</strong></span>
				<input type="range" min="140" max="185" bind:value={baseSpm} />
				<span style="display: block; margin-top: 0.45rem;">Cadence Boost: <strong>+{boostPct}%</strong></span>
				<input type="range" min="5" max="10" step="0.5" bind:value={boostPct} />
			</div>
		</div>

		<!-- 10-Site Plantar Neuropathy Map -->
		<div class="glass-deck-elevated" style="padding: 0.9rem;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
				<span class="metric-label">10-Site Plantar Dermatome Map</span>
				<span class="badge badge-{neuroResult.status}">IWGDF Cat {neuroResult.iwgdfCategory}</span>
			</div>
			<div style="display: flex; gap: 0.75rem; align-items: center;">
				<svg viewBox="0 0 100 100" style="width: 110px; height: 140px; background: rgba(0,0,0,0.28); border-radius: 12px; flex-shrink: 0;">
					{#each DERMATOME_SITES as site}
						<circle
							cx={site.x}
							cy={site.y}
							r="5.5"
							fill={siteResults[site.id] ? 'var(--accent-primary)' : 'var(--accent-danger)'}
							style="cursor: pointer;"
							onclick={() => toggleSite(site.id)}
						/>
					{/each}
				</svg>
				<div style="flex: 1; font-size: 0.76rem;">
					<p style="color: var(--text-secondary); margin-bottom: 0.4rem;">
						Tap sites to toggle intact (green) vs. insensate (red).
					</p>
					<div>128 Hz VPT: <strong>{vptVolts} V</strong> ({neuroResult.intactCount}/10 intact)</div>
					<input type="range" min="5" max="45" bind:value={vptVolts} />
					<button class="tactile-btn" style="margin-top: 0.5rem; width: 100%;" onclick={trigger128HzPulse}>
						<Vibrate size={14} /> Trigger 128 Hz Haptic Sweep
					</button>
				</div>
			</div>
		</div>
	</div>
</section>
