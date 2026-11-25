/**
 * PODIA-SPECTRA — Module 4: Midsole Foam (EVA/TPU/PEBA) Viscoelastic Hysteresis Engine
 * Kelvin-Voigt viscoelastic model, logarithmic decrement, loss tangent tan(delta),
 * energy return (%), and outsole wear-zone forensics.
 */

export const MIDSOLE_PRESETS = {
	fresh_peba: {
		id: 'fresh_peba',
		label: 'Fresh PEBA Carbon-Plated Super-Shoe (83.5% Return, tan δ 0.11, 40 km)',
		foamType: 'PEBA (Pebax)',
		mileageKm: 40,
		reboundRatio: 0.914,
		creaseDensityPerCm: 0.4,
		compressionSetPct: 2.1,
		wearZone: 'posterolateral_heel'
	},
	healthy_eva: {
		id: 'healthy_eva',
		label: 'Healthy Daily Trainer EVA/Olefin (66.2% Return, tan δ 0.24, 220 km)',
		foamType: 'EVA / Olefin Blend',
		mileageKm: 220,
		reboundRatio: 0.814,
		creaseDensityPerCm: 2.1,
		compressionSetPct: 9.5,
		wearZone: 'posterolateral_heel'
	},
	dead_eva: {
		id: 'dead_eva',
		label: 'Compressed "Dead" EVA Midsole at 780 km (44.8% Return, +38% Shock — Retire!)',
		foamType: 'Compressed EVA',
		mileageKm: 780,
		reboundRatio: 0.669,
		creaseDensityPerCm: 6.8,
		compressionSetPct: 29.0,
		wearZone: 'medial_forefoot'
	},
	work_boot_pu: {
		id: 'work_boot_pu',
		label: 'Rigid Work/Safety Boot Polyurethane Midsole (52.0% Return)',
		foamType: 'Polyurethane (PU)',
		mileageKm: 450,
		reboundRatio: 0.721,
		creaseDensityPerCm: 1.5,
		compressionSetPct: 6.0,
		wearZone: 'lateral_border'
	}
};

export function solveMidsoleViscoelasticity(params) {
	const {
		foamType = 'EVA / Olefin Blend',
		mileageKm = 220,
		reboundRatio = 0.814,
		creaseDensityPerCm = 2.1,
		compressionSetPct = 9.5,
		wearZone = 'posterolateral_heel'
	} = params;

	const energyReturnPct = Math.pow(reboundRatio, 2) * 100;
	const logDecrement = Math.max(0.05, -Math.log(Math.max(0.2, reboundRatio)));
	const lossTangent = logDecrement / Math.PI;
	const hysteresisLossPct = 100 - energyReturnPct;

	// Remaining safe cushioning life (km)
	const maxSafeKm = foamType.includes('PEBA') ? 450 : foamType.includes('PU') ? 1100 : 650;
	const degradationFactor = Math.min(1, compressionSetPct / 30);
	const remainingKm = Math.max(0, Math.round(maxSafeKm * (1 - degradationFactor) - mileageKm * 0.15));

	let status = 'ok';
	let verdict = 'Healthy Viscoelastic Cushioning';
	if (energyReturnPct < 50 || compressionSetPct > 24 || remainingKm <= 40) {
		status = 'danger';
		verdict = 'Midsole Collapsed — Retire Immediately (+35% Tibial Shock)';
	} else if (energyReturnPct < 60 || compressionSetPct > 15) {
		status = 'warn';
		verdict = 'Moderate Foam Fatigue — Monitor Tibial Shock';
	}

	const wearDiagnostics = {
		posterolateral_heel: 'Normal Initial Contact Wear',
		medial_forefoot: 'Overpronation / Medial Push-Off Overload',
		lateral_border: 'Underpronation / Supination — Stress Fracture Warning',
		asymmetric_lr: 'Asymmetric L/R Wear — Screen for Leg-Length Discrepancy'
	};

	return {
		foamType,
		energyReturnPct: Number(energyReturnPct.toFixed(1)),
		hysteresisLossPct: Number(hysteresisLossPct.toFixed(1)),
		logDecrement: Number(logDecrement.toFixed(3)),
		lossTangent: Number(lossTangent.toFixed(3)),
		creaseDensityPerCm: Number(creaseDensityPerCm.toFixed(1)),
		compressionSetPct: Number(compressionSetPct.toFixed(1)),
		remainingKm,
		wearDiagnosis: wearDiagnostics[wearZone] || wearDiagnostics.posterolateral_heel,
		status,
		verdict
	};
}
