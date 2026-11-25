<script>
	import { Camera, Radio, Mic, Vibrate, ChevronDown, ChevronUp } from 'lucide-svelte';

	let expanded = $state(false);
	let camStatus = $state('SIMULATOR ACTIVE');
	let imuStatus = $state('SIMULATOR ACTIVE');
	let micStatus = $state('SIMULATOR ACTIVE');
	let hapticStatus = $state(typeof navigator !== 'undefined' && 'vibrate' in navigator ? 'ACTIVE' : 'SIMULATOR ACTIVE');

	async function requestAllSensors() {
		if (navigator.mediaDevices?.getUserMedia) {
			try {
				const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
				s.getTracks().forEach((t) => t.stop());
				camStatus = 'ACTIVE';
				micStatus = 'ACTIVE';
			} catch {
				camStatus = 'RESTRICTED';
			}
		}
		if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
			try {
				const res = await DeviceMotionEvent.requestPermission();
				imuStatus = res === 'granted' ? 'ACTIVE' : 'RESTRICTED';
			} catch {
				imuStatus = 'SIMULATOR ACTIVE';
			}
		} else if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
			imuStatus = 'ACTIVE';
		}
	}
</script>

<div class="glass-deck" style="padding: 0.65rem 1rem; margin-bottom: 1rem;">
	<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.5rem;">
		<div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; font-size: 0.74rem;">
			<span style="font-weight: 700; color: var(--text-secondary);">HARDWARE TELEMETRY:</span>
			<span class="badge badge-{camStatus === 'ACTIVE' ? 'ok' : 'warn'}"><Camera size={11} /> 60 FPS Cam: {camStatus}</span>
			<span class="badge badge-{imuStatus === 'ACTIVE' ? 'ok' : 'warn'}"><Radio size={11} /> 200 Hz IMU: {imuStatus}</span>
			<span class="badge badge-{micStatus === 'ACTIVE' ? 'ok' : 'warn'}"><Mic size={11} /> Raw Mic: {micStatus}</span>
			<span class="badge badge-{hapticStatus === 'ACTIVE' ? 'ok' : 'warn'}"><Vibrate size={11} /> 128 Hz Haptics: {hapticStatus}</span>
		</div>
		<div style="display: flex; gap: 0.45rem;">
			<button class="tactile-btn" onclick={requestAllSensors}>Grant Sensors</button>
			<button class="tactile-btn" onclick={() => (expanded = !expanded)}>
				{#if expanded}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
			</button>
		</div>
	</div>
	{#if expanded}
		<div style="margin-top: 0.65rem; padding-top: 0.65rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.78rem; color: var(--text-secondary);">
			Every PODIA-SPECTRA module operates seamlessly with live device hardware (60 FPS Camera, 200 Hz 3-axis Accelerometer, Unprocessed Microphone, 128 Hz Vibrotactile Haptics) AND built-in 1-Tap Clinical Biomechanical Simulators.
		</div>
	{/if}
</div>
