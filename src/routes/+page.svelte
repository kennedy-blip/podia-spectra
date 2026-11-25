<script>
	import { onMount } from 'svelte';
	import {
		Footprints,
		Zap,
		Compass,
		Layers,
		Vibrate,
		Smartphone,
		Monitor,
		Cpu,
		RefreshCw,
		Download
	} from 'lucide-svelte';
	import bgFragShader from '../shaders/plantarIsobarWaveBackground.glsl?raw';
	import PlantarArchFootprintScanner from '$lib/components/PlantarArchFootprintScanner.svelte';
	import TibialShockSpringMassLab from '$lib/components/TibialShockSpringMassLab.svelte';
	import KneeValgusAclKinematics from '$lib/components/KneeValgusAclKinematics.svelte';
	import MidsoleFoamHysteresisTester from '$lib/components/MidsoleFoamHysteresisTester.svelte';
	import CadenceEntrainmentNeuropathyDeck from '$lib/components/CadenceEntrainmentNeuropathyDeck.svelte';
	import HardwarePermissionGatekeeper from '$lib/components/HardwarePermissionGatekeeper.svelte';
	import PolyglotRuntimeInspectorModal from '$lib/components/PolyglotRuntimeInspectorModal.svelte';
	import ApkReleaseDownloadModal from '$lib/components/ApkReleaseDownloadModal.svelte';
	import { getSyncQueueCount, flushSyncQueue } from '$lib/db/podiaVaultDb.js';

	let activeModule = $state(0);
	let theme = $state('obsidian');
	let role = $state('standard');
	let viewportMode = $state('desktop');
	let showApkModal = $state(false);
	let showPolyglotModal = $state(false);
	let syncCount = $state(0);
	let bgCanvas;

	const MODULES = [
		{ id: 0, label: 'Plantar Arch', icon: Footprints },
		{ id: 1, label: 'Tibial VALR', icon: Zap },
		{ id: 2, label: 'Knee Valgus', icon: Compass },
		{ id: 3, label: 'Midsole Foam', icon: Layers },
		{ id: 4, label: 'Cadence & 128Hz', icon: Vibrate }
	];

	function setTheme(t) {
		theme = t;
		if (typeof document !== 'undefined') {
			document.body.setAttribute('data-theme', t);
		}
	}

	async function refreshSyncCount() {
		syncCount = await getSyncQueueCount();
	}

	async function handleSync() {
		await flushSyncQueue();
		await refreshSyncCount();
	}

	onMount(() => {
		refreshSyncCount();
		if (!bgCanvas) return;
		const gl = bgCanvas.getContext('webgl2');
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
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, bgFragShader));
		gl.linkProgram(prog);
		gl.useProgram(prog);

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const loc = gl.getAttribLocation(prog, 'a_pos');
		gl.enableVertexAttribArray(loc);
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

		const uTime = gl.getUniformLocation(prog, 'u_time');
		const uRes = gl.getUniformLocation(prog, 'u_resolution');
		const uValr = gl.getUniformLocation(prog, 'u_valr_norm');
		const uCad = gl.getUniformLocation(prog, 'u_cadence_hz');
		const uTheme = gl.getUniformLocation(prog, 'u_theme_mode');

		let raf;
		const render = (t) => {
			if (theme === 'eco') {
				raf = requestAnimationFrame(render);
				return;
			}
			bgCanvas.width = window.innerWidth;
			bgCanvas.height = window.innerHeight;
			gl.viewport(0, 0, bgCanvas.width, bgCanvas.height);
			gl.uniform1f(uTime, t * 0.001);
			gl.uniform2f(uRes, bgCanvas.width, bgCanvas.height);
			gl.uniform1f(uValr, 0.75);
			gl.uniform1f(uCad, 2.8);
			const themeIdx = theme === 'daylight' ? 1.0 : theme === 'thermal' ? 2.0 : 0.0;
			gl.uniform1f(uTheme, themeIdx);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			raf = requestAnimationFrame(render);
		};
		raf = requestAnimationFrame(render);
		return () => cancelAnimationFrame(raf);
	});
</script>

<!-- Layer 0: WebGL2 Baropodometric Isobar Underlay -->
<canvas
	bind:this={bgCanvas}
	style="position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none;"
></canvas>

<!-- Inline SVG Gooey Metaball Filter -->
<svg style="position: absolute; width: 0; height: 0;">
	<defs>
		<filter id="podia-gooey-dock">
			<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
			<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
		</filter>
	</defs>
</svg>

<div style="position: relative; z-index: 1; min-height: 100vh; padding-bottom: 5.5rem;">
	<!-- Top Navigation Bar -->
	<header class="glass-deck" style="margin: 0.75rem auto; max-width: 1280px; padding: 0.75rem 1.1rem; border-radius: 18px;">
		<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem;">
			<div>
				<h1 style="font-size: 1.2rem; font-weight: 800; letter-spacing: 0.04em;">
					PODIA-SPECTRA <span style="font-size: 0.72rem; color: var(--accent-primary); font-weight: 600;">v1.23.0</span>
				</h1>
				<p style="font-size: 0.72rem; color: var(--text-secondary);">
					Podiatry · Spring-Mass Tibial Shock · Dynamic Knee-Valgus · Viscoelastic Footwear · 128 Hz Neuropathy
				</p>
			</div>

			<div style="display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: center;">
				<!-- Viewport Switcher -->
				<button
					class="tactile-btn"
					onclick={() => (viewportMode = viewportMode === 'desktop' ? 'mobile' : 'desktop')}
				>
					{#if viewportMode === 'desktop'}
						<Monitor size={14} /> Desktop Workstation
					{:else}
						<Smartphone size={14} /> Mobile APK Preview
					{/if}
				</button>

				<!-- 4-Theme Switcher -->
				<select
					class="tactile-btn"
					value={theme}
					onchange={(e) => setTheme(e.target.value)}
					aria-label="Theme Switcher"
				>
					<option value="obsidian">Force-Plate Obsidian</option>
					<option value="daylight">Clinic Daylight Frost</option>
					<option value="thermal">Thermal Baropodometry</option>
					<option value="eco">Eco-Glass Low-GPU</option>
				</select>

				<!-- 3-Tier RBAC Switcher -->
				<select
					class="tactile-btn"
					value={role}
					onchange={(e) => (role = e.target.value)}
					aria-label="Role Switcher"
				>
					<option value="standard">Runner / Patient</option>
					<option value="pro">DPM / Physical Therapist</option>
					<option value="admin">Systems Architect (Admin)</option>
				</select>

				{#if role === 'admin'}
					<button class="tactile-btn" onclick={() => (showPolyglotModal = true)}>
						<Cpu size={14} /> Polyglot Inspector
					</button>
				{/if}

				<button class="tactile-btn" onclick={handleSync}>
					<RefreshCw size={14} /> Sync ({syncCount})
				</button>

				<button class="tactile-btn primary" onclick={() => (showApkModal = true)}>
					<Download size={14} /> Download .APK
				</button>
			</div>
		</div>
	</header>

	<!-- Main Workspace -->
	<main class={viewportMode === 'mobile' ? 'mobile-apk-frame' : ''} style="max-width: {viewportMode === 'mobile' ? '430px' : '1280px'}; margin: 0 auto; padding: 0 0.75rem;">
		<HardwarePermissionGatekeeper />

		{#if activeModule === 0}
			<PlantarArchFootprintScanner {role} onSave={refreshSyncCount} />
		{:else if activeModule === 1}
			<TibialShockSpringMassLab {role} onSave={refreshSyncCount} />
		{:else if activeModule === 2}
			<KneeValgusAclKinematics {role} onSave={refreshSyncCount} />
		{:else if activeModule === 3}
			<MidsoleFoamHysteresisTester {role} onSave={refreshSyncCount} />
		{:else}
			<CadenceEntrainmentNeuropathyDeck {role} onSave={refreshSyncCount} />
		{/if}
	</main>

	<!-- Gooey Bottom Navigation Dock -->
	<nav
		class="glass-deck-elevated"
		style="position: fixed; bottom: 0.9rem; left: 50%; transform: translateX(-50%); z-index: 40; padding: 0.45rem 0.65rem; border-radius: 999px; display: flex; gap: 0.35rem;"
	>
		{#each MODULES as mod}
			{@const Icon = mod.icon}
			<button
				class="tactile-btn"
				style="border-radius: 999px; padding: 0.5rem 0.85rem; {activeModule === mod.id
					? 'background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); color: #040914; border-color: transparent;'
					: 'background: transparent; border-color: transparent;'}"
				onclick={() => (activeModule = mod.id)}
			>
				<Icon size={16} />
				<span style="font-size: 0.76rem;">{mod.label}</span>
			</button>
		{/each}
	</nav>
</div>

<ApkReleaseDownloadModal open={showApkModal} onClose={() => (showApkModal = false)} />
<PolyglotRuntimeInspectorModal open={showPolyglotModal} onClose={() => (showPolyglotModal = false)} />
