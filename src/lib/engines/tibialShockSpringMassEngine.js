/**
 * PODIA-SPECTRA — Module 2: Tibial Shock (VALR/VILR) & Blickhan-McMahon Spring-Mass Engine
 * Reconstructs dual-mass vGRF, calculates VALR/VILR (BW/s), leg stiffness k_leg (kN/m),
 * vertical stiffness k_vert, Ground Contact Time (GCT), and Carter-Caler bone fatigue.
 */

export const GAIT_PRESETS = {
	overstrider: {
		id: 'overstrider',
		label: 'Overstriding Rearfoot Heel-Striker (VALR 108 BW/s, 11.4 g — Stress Fracture Risk)',
		bodyMassKg: 72.0,
		speedMs: 3.4,
		cadenceSpm: 162,
		gctMs: 258,
		peakTibialShockG: 11.4,
		f1ImpactBW: 1.95,
		f2ActiveBW: 2.55,
		lrAsymmetryPct: 4.2
	},
	efficient_midfoot: {
		id: 'efficient_midfoot',
		label: 'Efficient Midfoot Cadence Runner (VALR 48 BW/s, 5.2 g, GCT 218 ms)',
		bodyMassKg: 68.0,
		speedMs: 3.6,
		cadenceSpm: 180,
		gctMs: 218,
		peakTibialShockG: 5.2,
		f1ImpactBW: 0.0,
		f2ActiveBW: 2.48,
		lrAsymmetryPct: 2.1
	},
	asymmetric_limp: {
		id: 'asymmetric_limp',
		label: 'Asymmetric Post-Injury Limp (L/R GCT Imbalance 14.5%, Peak Shock +38%)',
		bodyMassKg: 75.0,
		speedMs: 2.8,
		cadenceSpm: 156,
		gctMs: 285,
		peakTibialShockG: 8.9,
		f1ImpactBW: 1.68,
		f2ActiveBW: 2.25,
		lrAsymmetryPct: 14.5
	},
	rucking_march: {
		id: 'rucking_march',
		label: 'Loaded Backpack Rucking March (+20 kg Load)',
		bodyMassKg: 94.0,
		speedMs: 1.8,
		cadenceSpm: 124,
		gctMs: 540,
		peakTibialShockG: 4.6,
		f1ImpactBW: 1.35,
		f2ActiveBW: 1.52,
		lrAsymmetryPct: 3.0
	}
};

export function solveSpringMassTibialShock(params) {
	const {
		bodyMassKg = 72,
		speedMs = 3.4,
		cadenceSpm = 162,
		gctMs = 258,
		peakTibialShockG = 11.4,
		f1ImpactBW = 1.95,
		f2ActiveBW = 2.55,
		lrAsymmetryPct = 4.2
	} = params;

	const g = 9.80665;
	const bwN = bodyMassKg * g;
	const stepPeriodS = 60 / Math.max(60, cadenceSpm);
	const tc = gctMs / 1000;
	const tf = Math.max(0.02, stepPeriodS - tc);

	// Dual-mass vGRF waveform (120 samples over stance)
	const samples = [];
	const nPts = 100;
	for (let i = 0; i <= nPts; i++) {
		const u = i / nPts; // normalized stance 0..1
		// Active propulsive half-sine F2 (1-5 Hz)
		const active = f2ActiveBW * Math.sin(Math.PI * u);
		// Passive heel-strike impact transient F1 (10-35 Hz) peaking around u = 0.12
		const passive =
			f1ImpactBW > 0 ? f1ImpactBW * Math.exp(-Math.pow((u - 0.12) / 0.055, 2)) : 0;
		const totalBW = active + passive * 0.65;
		samples.push({
			u,
			tMs: u * gctMs,
			totalBW: Number(totalBW.toFixed(3)),
			passiveBW: Number((passive * 0.65).toFixed(3)),
			activeBW: Number(active.toFixed(3))
		});
	}

	// VALR & VILR (BW/s) from 20% to 80% of impact peak
	const tImpactS = tc * 0.12;
	const peakImpact = Math.max(0.9, f1ImpactBW > 0 ? f1ImpactBW : f2ActiveBW * 0.55);
	const valrBWs = (0.6 * peakImpact) / Math.max(0.008, 0.6 * tImpactS);
	const vilrBWs = valrBWs * 1.28;

	// Blickhan-McMahon Spring-Mass Stiffness
	const fMaxN = Math.max(f1ImpactBW, f2ActiveBW) * bwN;
	const deltaYc = Math.max(0.025, (fMaxN / bwN) * ((tc * tc * g) / (Math.PI * Math.PI)) * 0.42);
	const kVertKNm = fMaxN / deltaYc / 1000;

	const L0 = 0.96; // nominal leg length (m)
	const halfSwept = (speedMs * tc) / 2;
	const deltaL = L0 - Math.sqrt(Math.max(0.1, L0 * L0 - halfSwept * halfSwept)) + deltaYc;
	const kLegKNm = fMaxN / Math.max(0.03, deltaL) / 1000;

	// Carter-Caler Cumulative Tibial Bone Fatigue Index (normalized)
	const carterDamageIndex = Math.pow(peakTibialShockG / 6.0, 7) * (cadenceSpm / 180) * 12.5;

	let riskStatus = 'ok';
	let riskLabel = 'Low Bone Stress Risk';
	if (valrBWs > 80 || peakTibialShockG > 9.0) {
		riskStatus = 'danger';
		riskLabel = 'High Tibial Stress Fracture Risk';
	} else if (valrBWs > 65 || lrAsymmetryPct > 10) {
		riskStatus = 'warn';
		riskLabel = 'Elevated Loading Rate / Asymmetry';
	}

	return {
		samples,
		valrBWs: Number(valrBWs.toFixed(1)),
		vilrBWs: Number(vilrBWs.toFixed(1)),
		kVertKNm: Number(kVertKNm.toFixed(1)),
		kLegKNm: Number(kLegKNm.toFixed(1)),
		deltaYcMm: Number((deltaYc * 1000).toFixed(1)),
		deltaLMm: Number((deltaL * 1000).toFixed(1)),
		flightTimeMs: Number((tf * 1000).toFixed(0)),
		carterDamageIndex: Number(carterDamageIndex.toFixed(2)),
		riskStatus,
		riskLabel
	};
}
