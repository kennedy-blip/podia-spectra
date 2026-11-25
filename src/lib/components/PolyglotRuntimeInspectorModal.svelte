<script>
	import { X, Cpu } from 'lucide-svelte';

	let { open = false, onClose = () => {} } = $props();
</script>

{#if open}
	<div style="position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; padding: 1rem;">
		<div class="glass-modal" style="max-width: 720px; width: 100%; padding: 1.5rem; max-height: 85vh; overflow-y: auto;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
				<div style="display: flex; align-items: center; gap: 0.5rem;">
					<Cpu size={20} color="var(--accent-secondary)" />
					<h3 style="font-size: 1.1rem; font-weight: 700;">Polyglot Runtime Inspector (0.0% TypeScript)</h3>
				</div>
				<button class="tactile-btn" onclick={onClose}><X size={16} /></button>
			</div>

			<div style="display: grid; gap: 0.65rem; font-size: 0.82rem;">
				<div class="metric-chip">
					<span class="metric-label">Svelte 5 + Pure ES2024 JavaScript (~74%)</span>
					<span class="metric-sub">5 Biomechanical Engines + IndexedDB Offline Vault + Zero TypeScript (.ts/.tsx = 0)</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Python 3.12 Scientific Backend (~13%)</span>
					<span class="metric-sub">api/podia_biomechanics_solver.py · python_biomechanics/spring_mass_tibial_shock.py · plantar_knee_kinetics.py</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">Native Android Kotlin Capacitor Plugins (~7%)</span>
					<span class="metric-sub">HighGImpactTibialImuPlugin.kt (±16g 200–400 Hz) · VibrotactilePlantarCameraPlugin.kt (128 Hz + Camera2)</span>
				</div>
				<div class="metric-chip">
					<span class="metric-label">WebGL2 GLSL Shaders + Liquid Glass CSS (~6%)</span>
					<span class="metric-sub">plantarIsobarWaveBackground.glsl · baropodometricFootprintShader.glsl · 4-Theme Glassmorphism</span>
				</div>
			</div>
		</div>
	</div>
{/if}
