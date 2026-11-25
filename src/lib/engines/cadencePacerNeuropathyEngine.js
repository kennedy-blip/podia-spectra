/**
 * PODIA-SPECTRA — Module 5: Heiderscheit Cadence Entrainment & 128 Hz Neuropathy Engine
 */

export const DERMATOME_SITES = [
	{ id: 'hallux', label: 'Plantar Hallux (L5)', x: 38, y: 18 },
	{ id: 'toe3', label: '3rd Toe Pad (L5)', x: 56, y: 21 },
	{ id: 'toe5', label: '5th Toe Pad (S1)', x: 72, y: 28 },
	{ id: 'met1', label: '1st Met Head (L4/L5)', x: 36, y: 36 },
	{ id: 'met3', label: '3rd Met Head (L5)', x: 54, y: 38 },
	{ id: 'met5', label: '5th Met Head (S1)', x: 70, y: 42 },
	{ id: 'mid_med', label: 'Medial Midfoot (L4)', x: 36, y: 58 },
	{ id: 'mid_lat', label: 'Lateral Midfoot (S1)', x: 64, y: 60 },
	{ id: 'heel', label: 'Calcaneal Heel (S1)', x: 50, y: 82 },
	{ id: 'dorsal_web', label: 'Dorsal 1st Webspace (L5)', x: 46, y: 27 }
];

export function solveHeiderscheitCadence(baseSpm = 164, boostPct = 7.5, speedMs = 3.3) {
	const targetSpm = baseSpm * (1 + boostPct / 100);
	const baseStepLenM = speedMs / (baseSpm / 60);
	const newStepLenM = speedMs / (targetSpm / 60);
	const comExcursionReductionPct = (1 - Math.pow(baseSpm / targetSpm, 2)) * 100;
	const jointLoadReductionPct = Math.min(24, boostPct * 1.95);

	return {
		baseSpm: Math.round(baseSpm),
		targetSpm: Math.round(targetSpm),
		baseStepLenCm: Number((baseStepLenM * 100).toFixed(1)),
		newStepLenCm: Number((newStepLenM * 100).toFixed(1)),
		comExcursionReductionPct: Number(comExcursionReductionPct.toFixed(1)),
		jointLoadReductionPct: Number(jointLoadReductionPct.toFixed(1))
	};
}

export function scoreNeuropathyScreener(vptVolts = 12, siteResults = {}) {
	const totalSites = DERMATOME_SITES.length;
	let insensateCount = 0;
	for (const site of DERMATOME_SITES) {
		if (siteResults[site.id] === false) insensateCount++;
	}

	let iwgdfCategory = 0;
	let riskLabel = 'Category 0 — Intact Protective Sensation';
	let status = 'ok';

	if (insensateCount >= 2 || vptVolts >= 25) {
		iwgdfCategory = 2;
		riskLabel = 'Category 2/3 — Loss of Protective Sensation (LOPS)';
		status = 'danger';
	} else if (insensateCount === 1 || vptVolts >= 15) {
		iwgdfCategory = 1;
		riskLabel = 'Category 1 — Mild Vibrotactile / Monofilament Deficit';
		status = 'warn';
	}

	return {
		vptVolts,
		insensateCount,
		intactCount: totalSites - insensateCount,
		iwgdfCategory,
		riskLabel,
		status
	};
}
