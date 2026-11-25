"""
PODIA-SPECTRA — Plantar Arch Morphometry, Hicks Windlass & Patellofemoral Kinetics
"""
import math
from typing import Dict, Any


def solve_windlass_and_arch(
    forefoot_max_mm: float = 95.0,
    midfoot_isthmus_mm: float = 32.5,
    calcaneal_heel_mm: float = 52.4,
    navicular_drop_mm: float = 5.8,
    body_mass_kg: float = 72.0,
    mtp_dorsiflexion_deg: float = 35.0,
) -> Dict[str, Any]:
    csi_pct = (midfoot_isthmus_mm / max(1.0, forefoot_max_mm)) * 100.0
    sai = midfoot_isthmus_mm / max(1.0, calcaneal_heel_mm)

    r_sesamoid_mm = 11.0
    theta_rad = math.radians(mtp_dorsiflexion_deg)
    fascia_shortening_mm = r_sesamoid_mm * theta_rad

    bw_n = body_mass_kg * 9.80665
    fascia_tension_n = bw_n * 0.42 * (1.0 + 0.65 * math.sin(theta_rad)) * (1.24 if navicular_drop_mm > 10.0 else 1.0)

    return {
        "csi_percent": round(csi_pct, 1),
        "sai": round(sai, 2),
        "fascia_shortening_mm": round(fascia_shortening_mm, 2),
        "fascia_tension_n": round(fascia_tension_n, 1),
    }


def solve_patellofemoral_kinetics(
    knee_flexion_deg: float = 45.0,
    q_angle_deg: float = 13.5,
    fppa_deg: float = 4.2,
    body_mass_kg: float = 70.0,
) -> Dict[str, Any]:
    bw_n = body_mass_kg * 9.80665
    flex_rad = math.radians(knee_flexion_deg)
    m_ext_nm = bw_n * 0.42 * math.sin(max(0.15, flex_rad))
    d_pt_m = 0.044 - 0.008 * math.sin(flex_rad)
    f_quad_n = m_ext_nm / d_pt_m

    eff_angle_rad = math.radians(knee_flexion_deg * 0.88 + 12.0)
    pfjrf_n = 2.0 * f_quad_n * math.sin(eff_angle_rad / 2.0)
    contact_area_mm2 = 160.0 + knee_flexion_deg * 2.4
    cartilage_stress_mpa = pfjrf_n / contact_area_mm2

    return {
        "pfjrf_n": round(pfjrf_n, 0),
        "pfjrf_bw": round(pfjrf_n / bw_n, 2),
        "cartilage_stress_mpa": round(cartilage_stress_mpa, 2),
        "valgus_total_deg": round(q_angle_deg + fppa_deg, 1),
    }
