"""
PODIA-SPECTRA — Blickhan-McMahon Spring-Mass & Tibial Shock (VALR/VILR) Solver
"""
import math
from typing import Dict, Any


def solve_spring_mass_model(
    body_mass_kg: float = 72.0,
    speed_ms: float = 3.4,
    cadence_spm: float = 162.0,
    gct_ms: float = 258.0,
    peak_tibial_shock_g: float = 11.4,
    f1_impact_bw: float = 1.95,
    f2_active_bw: float = 2.55,
) -> Dict[str, Any]:
    g = 9.80665
    bw_n = body_mass_kg * g
    tc = gct_ms / 1000.0
    t_impact_s = tc * 0.12
    peak_impact = max(0.9, f1_impact_bw if f1_impact_bw > 0 else f2_active_bw * 0.55)

    valr_bws = (0.6 * peak_impact) / max(0.008, 0.6 * t_impact_s)
    vilr_bws = valr_bws * 1.28

    f_max_n = max(f1_impact_bw, f2_active_bw) * bw_n
    delta_yc = max(0.025, (f_max_n / bw_n) * ((tc ** 2 * g) / (math.pi ** 2)) * 0.42)
    k_vert_kn_m = (f_max_n / delta_yc) / 1000.0

    l0 = 0.96
    half_swept = (speed_ms * tc) / 2.0
    delta_l = l0 - math.sqrt(max(0.1, l0 ** 2 - half_swept ** 2)) + delta_yc
    k_leg_kn_m = (f_max_n / max(0.03, delta_l)) / 1000.0

    carter_damage = ((peak_tibial_shock_g / 6.0) ** 7) * (cadence_spm / 180.0) * 12.5

    return {
        "valr_bws": round(valr_bws, 1),
        "vilr_bws": round(vilr_bws, 1),
        "k_vert_kn_m": round(k_vert_kn_m, 1),
        "k_leg_kn_m": round(k_leg_kn_m, 1),
        "carter_damage_index": round(carter_damage, 2),
    }
