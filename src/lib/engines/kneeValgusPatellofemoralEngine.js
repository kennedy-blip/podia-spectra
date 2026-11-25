/**
 * PODIA-SPECTRA — Module 3: Dynamic Knee-Valgus (FPPA), Q-Angle & PFJRF/ACL Vector Engine
 */

export const KNEE_PRESETS = {
	neutral: {
		id: 'neutral',
		label: 'Neutral Hip-Knee-Ankle Alignment (FPPA 4.2°, Q-Angle 13.5°)',
		qAngleDeg: 13.5,
		fppaDeg: 4.2,
		calcanealPronationDeg: 5.5,
		kneeFlexionDeg: 45.0,
		bodyMassKg: 70.0
	},
	valgus_collapse: {
		id: 'valgus_collapse',
		label: 'Severe Dynamic Knee Valgus Collapse (FPPA 21.8° — High ACL & PFPS Risk!)',
		qAngleDeg: 19.8,
		fppaDeg: 21.8,
		calcanealPronationDeg: 13.2,
		kneeFlexionDeg: 52.0,
		bodyMassKg: 74.0
	},
	overpronation: {
		id: 'overpronation',
		label: 'Excessive Rearfoot Calcaneal Eversion (β 14.6° + Internal Tibial Torsion)',
		qAngleDeg: 16.4,
		fppaDeg: 13.5,
		calcanealPronationDeg: 14.6,
		kneeFlexionDeg: 38.0,
		bodyMassKg: 78.0
	},
	deep_squat: {
		id: 'deep_squat',
		label: 'Deep Squat High-Flexion Patellofemoral Load (105° Flexion, PFJRF 6.8× BW)',
		qAngleDeg: 14.2,
		fppaDeg: 7.4,
		calcanealPronationDeg: 6.8,
		kneeFlexionDeg: 105.0,
		bodyMassKg: 76.0
	}
};

export function solveKneeValgusPatellofemoral(params) {
	const {
		qAngleDeg = 13.5,
		fppaDeg = 4.2,
		calcanealPronationDeg = 5.5,
		kneeFlexionDeg = 45,
		bodyMassKg = 70
	} = params;

	const bwN = bodyMassKg * 9.80665;
	const flexRad = (kneeFlexionDeg * Math.PI) / 180;

	// External knee extensor moment scales with sin(flexion)
	const mExtNm = bwN * 0.42 * Math.sin(Math.max(0.15, flexRad));
	const dPtM = 0.044 - 0.008 * Math.sin(flexRad);
	const fQuadN = mExtNm / dPtM;

	// Effective patellofemoral compression angle
	const effAngleRad = ((kneeFlexionDeg * 0.88 + 12) * Math.PI) / 180;
	const pfjrfN = 2 * fQuadN * Math.sin(effAngleRad / 2);
	const pfjrfBW = pfjrfN / bwN;

	// Contact area (mm^2) increases with flexion
	const contactAreaMm2 = 160 + kneeFlexionDeg * 2.4;
	const cartilageStressMPa = pfjrfN / contactAreaMm2;

	// Lateral bowstring force & ACL anterior tibial shear
	const totalValgusRad = ((qAngleDeg + fppaDeg) * Math.PI) / 180;
	const lateralBowstringN = fQuadN * Math.sin(totalValgusRad);
	const aclShearN = fQuadN * Math.sin(((22 - kneeFlexionDeg * 0.15) * Math.PI) / 180) * 0.45;

	let aclRisk = 'ok';
	let aclLabel = 'Low Non-Contact ACL Risk';
	if (fppaDeg > 15 || qAngleDeg > 20) {
		aclRisk = 'danger';
		aclLabel = 'High Medial Valgus / ACL & PFPS Risk';
	} else if (fppaDeg > 10 || calcanealPronationDeg > 10) {
		aclRisk = 'warn';
		aclLabel = 'Moderate Valgus / Pronation';
	}

	return {
		qAngleDeg: Number(qAngleDeg.toFixed(1)),
		fppaDeg: Number(fppaDeg.toFixed(1)),
		calcanealPronationDeg: Number(calcanealPronationDeg.toFixed(1)),
		kneeFlexionDeg: Number(kneeFlexionDeg.toFixed(0)),
		pfjrfN: Number(pfjrfN.toFixed(0)),
		pfjrfBW: Number(pfjrfBW.toFixed(2)),
		cartilageStressMPa: Number(cartilageStressMPa.toFixed(2)),
		lateralBowstringN: Number(lateralBowstringN.toFixed(0)),
		aclShearN: Number(Math.max(0, aclShearN).toFixed(0)),
		aclRisk,
		aclLabel
	};
}
