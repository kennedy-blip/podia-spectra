/**
 * PODIA-SPECTRA — Module 1: Plantar Arch Morphometry & Hicks Windlass Engine (Pure ES2024 JS)
 * Computes Chippaux-Smirnak Index (CSI %), Staheli Arch Index (SAI), Clarke's Angle,
 * Hallux Valgus Angle, Brody Navicular Drop (mm), and Hicks Windlass Fascia Tension (N).
 */

export const PLANTAR_PRESETS = {
	normal_rectus: {
		id: 'normal_rectus',
		label: 'Normal Rectus Arch (CSI 34.2%, SAI 0.62, Clarke 46°)',
		forefootMaxMm: 95.0,
		midfootIsthmusMm: 32.5,
		calcanealHeelMm: 52.4,
		clarkeAngleDeg: 46.0,
		halluxValgusDeg: 11.2,
		navicularUnloadedMm: 44.0,
		navicularLoadedMm: 38.2,
		bodyMassKg: 72.0,
		mtpDorsiflexionDeg: 35.0
	},
	pes_planus: {
		id: 'pes_planus',
		label: 'Flexible Pes Planus / Flat Foot Overpronation (CSI 58.5%, Drop 13.5 mm)',
		forefootMaxMm: 98.0,
		midfootIsthmusMm: 57.3,
		calcanealHeelMm: 53.0,
		clarkeAngleDeg: 24.0,
		halluxValgusDeg: 16.5,
		navicularUnloadedMm: 41.5,
		navicularLoadedMm: 28.0,
		bodyMassKg: 78.0,
		mtpDorsiflexionDeg: 42.0
	},
	pes_cavus: {
		id: 'pes_cavus',
		label: 'Rigid Pes Cavus / High Supinated Arch (CSI 14.0%, Clarke 58°)',
		forefootMaxMm: 92.0,
		midfootIsthmusMm: 12.9,
		calcanealHeelMm: 51.6,
		clarkeAngleDeg: 58.0,
		halluxValgusDeg: 9.0,
		navicularUnloadedMm: 52.0,
		navicularLoadedMm: 49.5,
		bodyMassKg: 68.0,
		mtpDorsiflexionDeg: 28.0
	},
	hallux_valgus: {
		id: 'hallux_valgus',
		label: 'Hallux Valgus Bunion (θ_HV 28.5°) + 2nd Metatarsalgia Overload',
		forefootMaxMm: 102.0,
		midfootIsthmusMm: 41.8,
		calcanealHeelMm: 53.5,
		clarkeAngleDeg: 36.5,
		halluxValgusDeg: 28.5,
		navicularUnloadedMm: 43.0,
		navicularLoadedMm: 34.0,
		bodyMassKg: 70.0,
		mtpDorsiflexionDeg: 48.0
	}
};

export function solvePlantarArchMorphometry(params) {
	const {
		forefootMaxMm = 95,
		midfootIsthmusMm = 32.5,
		calcanealHeelMm = 52.4,
		clarkeAngleDeg = 46,
		halluxValgusDeg = 11.2,
		navicularUnloadedMm = 44,
		navicularLoadedMm = 38.2,
		bodyMassKg = 72,
		mtpDorsiflexionDeg = 35
	} = params;

	const csiPercent = (midfootIsthmusMm / Math.max(1, forefootMaxMm)) * 100;
	const sai = midfootIsthmusMm / Math.max(1, calcanealHeelMm);
	const navicularDropMm = Math.max(0, navicularUnloadedMm - navicularLoadedMm);

	let archClass = 'Normal Rectus Arch';
	let archSeverity = 'ok';
	if (csiPercent >= 45.0 || sai > 0.8 || clarkeAngleDeg < 30) {
		archClass = 'Pes Planus (Flat Foot)';
		archSeverity = 'danger';
	} else if (csiPercent >= 40.0) {
		archClass = 'Mild Lowered Arch';
		archSeverity = 'warn';
	} else if (csiPercent < 30.0 || sai < 0.35 || clarkeAngleDeg > 55) {
		archClass = 'Pes Cavus (High Rigid Arch)';
		archSeverity = 'warn';
	}

	// Hicks Windlass Mechanism:
	// Shortening dL = r_sesamoid * theta_MTP_rad
	const rSesamoidMm = 11.0;
	const thetaRad = (mtpDorsiflexionDeg * Math.PI) / 180;
	const fasciaShorteningMm = rSesamoidMm * thetaRad;
	const archElevationMm = fasciaShorteningMm * 0.68;

	// Plantar fascia tensile force T_pf (Newtons)
	// Truss equilibrium: T_pf = (W * 0.55 * L_arch) / (2 * h_arch) * (1 + 0.45 * sin(theta))
	const bodyWeightN = bodyMassKg * 9.80665;
	const fasciaTensionN =
		bodyWeightN * 0.42 * (1 + 0.65 * Math.sin(thetaRad)) * (navicularDropMm > 10 ? 1.24 : 1.0);
	const fasciaTensionBW = fasciaTensionN / bodyWeightN;

	// Evidence-Based Non-Commercial Orthotic Prescription
	const prescription = {
		heelToToeDropMm: archClass.includes('Cavus') ? 10 : archClass.includes('Planus') ? 8 : 6,
		medialPostWedgeDeg: navicularDropMm > 10 ? 4.0 : navicularDropMm > 7 ? 2.0 : 0.0,
		metatarsalDomePad: halluxValgusDeg > 20 || archClass.includes('Cavus') ? 'Yes (2nd–3rd Met Shaft)' : 'Not Required',
		toeBoxWidth: halluxValgusDeg > 18 ? 'Anatomical Wide Splay' : 'Standard'
	};

	return {
		csiPercent: Number(csiPercent.toFixed(1)),
		sai: Number(sai.toFixed(2)),
		clarkeAngleDeg: Number(clarkeAngleDeg.toFixed(1)),
		halluxValgusDeg: Number(halluxValgusDeg.toFixed(1)),
		navicularDropMm: Number(navicularDropMm.toFixed(1)),
		excessivePronation: navicularDropMm > 10.0,
		archClass,
		archSeverity,
		fasciaShorteningMm: Number(fasciaShorteningMm.toFixed(2)),
		archElevationMm: Number(archElevationMm.toFixed(2)),
		fasciaTensionN: Number(fasciaTensionN.toFixed(1)),
		fasciaTensionBW: Number(fasciaTensionBW.toFixed(2)),
		prescription
	};
}
