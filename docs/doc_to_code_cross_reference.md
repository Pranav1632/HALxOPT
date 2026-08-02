# 📚 Complete Documentation → Code Cross-Reference & Implementation Guide

> **Purpose:** Maps **every documentation file → its code implementation status** in the AeroOptima repository so developers understand what is implemented, what is partially implemented, and what remains to be built.

---

## 🗂️ SECTION A: Glossary Docs (`docs/doc2_glossary/`) — Reference Only

These docs serve as **theoretical references** for the team and evaluators. They define the physics, terms, and specifications that the codebase follows.

| Document | Purpose | Implementation Status |
| :--- | :--- | :--- |
| [`domain_glossary.md`](file:///d:/project/HAL/docs/doc2_glossary/domain_glossary.md) | Full forms & definitions: MTOW, ISA, TAS/IAS, SFC, MDP, SAC, SHAP, STANAG 4671, MIL-HDBK-516C | ✅ Reference only — domain concepts defined |
| [`component_glossary.md`](file:///d:/project/HAL/docs/doc2_glossary/component_glossary.md) | Hardware specs: EMRAX 228 MV, turboshaft scaling, 800V DC bus, composite airframe | ✅ Reference only — specs mirrored in `/data/*.json` |
| [`mission_phase_glossary.md`](file:///d:/project/HAL/docs/doc2_glossary/mission_phase_glossary.md) | 6-phase mission profile: PSR values, speeds, climb rates per phase | ✅ Implemented in `environment.py` (L398–425) |
| [`flight_envelope_constraints.md`](file:///d:/project/HAL/docs/doc2_glossary/flight_envelope_constraints.md) | 5 coupled constraint scenarios + Pydantic validator code | ⚠️ Rules 1–2 in `backend/main.py`; Rules 3–5 pending |

---

## 🔬 SECTION B: Aerospace Physics Docs (`docs/aerospace_physics/`) — Implementation Targets

These docs contain **physics formulas that govern the flight simulator**.

### B1. [`aerospace_engineering_report.md`](file:///d:/project/HAL/docs/aerospace_physics/aerospace_engineering_report.md)

| Concept from Doc | Target File | Implementation Status | Action Required |
| :--- | :--- | :--- | :--- |
| ISA Atmosphere $\rho(h)$ | `environment.py` (L168–177) | ✅ **Implemented** — exact ICAO troposphere model | None |
| Gagg-Ferrar Engine Altitude Lapse | `environment.py` (L445) | ❌ **NOT implemented** — engine max power is currently altitude-independent | **P0: Scale `engine_max` by $\rho(h)/\rho_0$** |
| Cold Battery Derating ($R_{\text{int}}(T)$) | `environment.py` | ❌ **NOT implemented** — thermal state missing | **P3: Add `battery_temp_c` & sub-zero penalty** |
| TAS / IAS Scaling | `environment.py` | ⚠️ **Partial** — speed set by phase, not dynamic IAS→TAS conversion | Low priority |
| Series-Parallel Hybrid Topology | Architecture | ✅ **Implemented** — combined motor + engine shaft model | None |
| NSGA-II Multi-Objective Pareto | `optimizer.py` | ❌ **NOT implemented** — single-objective DEAP GA only | Future roadmap / PPT claim |

### B2. [`silent_loiter_analysis.md`](file:///d:/project/HAL/docs/aerospace_physics/silent_loiter_analysis.md)

| Concept from Doc | Target File | Implementation Status | Action Required |
| :--- | :--- | :--- | :--- |
| Silent Loiter Mode (ICE OFF, PSR=1.0) | `environment.py` (L296–302) | ⚠️ **Partial** — loiter phase defaults to engine-only (PSR=0.0) | Add toggle for Mode B Silent Stealth Loiter |
| Battery Drain: ~2.11% SoC/min @ 20 kWh | `environment.py` | ✅ **Physics verified** — matches $25.3\text{ kW}$ power draw | None |
| 1.5s In-Flight Engine Restart | `environment.py` | ❌ **NOT modeled** — no mode-transition energy penalty | Future enhancement |

### B3. [`battery_thermal_analysis.md`](file:///d:/project/HAL/docs/aerospace_physics/battery_thermal_analysis.md)

| Concept from Doc | Target File | Implementation Status | Action Required |
| :--- | :--- | :--- | :--- |
| Ground Cold-Soak Voltage Sag | `environment.py` | ❌ **NOT implemented** | Phase 2 thermal extension |
| Climb Phase Joule Heating ($I^2 R$) | `environment.py` | ❌ **NOT implemented** | Phase 2 thermal extension |
| 800V DC Bus Wiring Loss Reduction | Architecture | ❌ **NOT coded** — analytical claim | PPT / Report claim |

### B4. [`formula_sheet.md`](file:///d:/project/HAL/docs/aerospace_physics/formula_sheet.md)

| Formula | Implementation Status |
| :--- | :--- |
| ISA Density Lapse $\rho(h)$ | ✅ Implemented |
| Lift Coefficient $C_L = \frac{2 W g \cos\gamma}{\rho V^2 S}$ | ✅ Implemented (L222) |
| Oswald Drag Polar $C_D = C_{D0} + \frac{C_L^2}{\pi AR e}$ | ✅ Implemented (L224) |
| Stall Speed $V_s = \sqrt{\frac{2 W g}{\rho S C_{L,\max}}}$ | ✅ Implemented (L185) |
| Shaft Power $P_{\text{shaft}} = P_{\text{prop}} / \eta_{\text{prop}}$ | ✅ Implemented (L231) |
| SFC Partial-Load Penalty Model | ✅ Implemented (L238–255) |
| Battery SoC Integration | ✅ Implemented (L480–484) |

---

## 🤖 SECTION C: RL & ML Strategy Docs (`docs/rl_ml_strategy/`) — Build Targets

### C1. [`deep_unnoticed_codebase_audit.md`](file:///d:/project/HAL/docs/rl_ml_strategy/deep_unnoticed_codebase_audit.md) — 🔴 HIGHEST PRIORITY AUDIT

| Issue / Flaw ID | Description | Fix Code Available? | Status | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Bug 1.1** | Phantom Climb — altitude increases during power deficit | ✅ Yes (excess-power RoC) | ❌ **Pending** | 🔴 P0 |
| **Bug 1.2** | Engine power not derated for altitude | ✅ Yes ($\rho(h)$ scaling) | ❌ **Pending** | 🔴 P0 |
| **Bug 1.3** | Phase-based propeller efficiency, not advance ratio $J$ | ✅ Yes (J-lookup table) | ❌ **Pending** | 🟡 P3 |
| **Bug 1.4** | Loiter speed fixed at 0.76× cruise instead of $V_{be}$ | ✅ Yes ($V_{be}$ drag formula) | ❌ **Pending** | 🟡 P3 |
| **Flaw 2.1** | Observation space 5D → needs 9D | ✅ Yes (expanded Box) | ❌ **Pending** | 🔴 P1 |
| **Flaw 2.2** | Sparse reward horizon, no fuel economy signal | ✅ Yes (dense reward code) | ❌ **Pending** | 🔴 P1 |
| **Gap 3.1** | Missing `/api/simulate_rl` endpoint | ✅ Yes (FastAPI code) | ❌ **Pending** | 🟠 P2 |
| **Opp 4.1** | Regenerative descent energy recovery (~8.25 kWh) | ✅ Yes (generator model) | ❌ **Pending** | 🟠 P2 |

### C2. [`rl_ml_integration_roadmap.md`](file:///d:/project/HAL/docs/rl_ml_strategy/rl_ml_integration_roadmap.md)

| Task # | RL/ML Task | Build Time | Status |
| :--- | :--- | :--- | :--- |
| 1 | PPO / SAC Power Split Agent (replace heuristic) | 2–3 hours | ❌ Pending — requires `train_rl.py` |
| 2 | Wind & Turbulence Disturbance Adaptive Control | 1–2 hours | ❌ Pending |
| 3 | Bayesian Optimization / GP Surrogate GA | 1 hour | ❌ Pending |
| 4 | Anomaly Detection (Isolation Forest on Telemetry) | 1 hour | ❌ Pending |

### C3. [`unnoticed_and_future_rl_ml.md`](file:///d:/project/HAL/docs/rl_ml_strategy/unnoticed_and_future_rl_ml.md)

| Task | Category | Build Time | Status |
| :--- | :--- | :--- | :--- |
| **Task E: Dense Reward Shaping** | Quick Win 🚀 | 30 mins | ❌ Pending (Code provided in doc) |
| **Task A: XAI / SHAP for MIL-HDBK-516C** | Quick Win | 1.5 hours | ❌ Pending |
| **Task B: Dynamic Cruise-Climb** | Aerodynamic Gem | 2 hours | ❌ Pending |
| **Task C: Battery SoH Protection** | Hardware Safety | 2 hours | ❌ Pending |

---

## 📊 SECTION D: Project Analysis Docs (`docs/project_analysis/`)

| Document | Key Purpose | Implementation Action |
| :--- | :--- | :--- |
| [`validation_and_realism/full_realism_validation_report.md`](file:///d:/project/HAL/docs/project_analysis/validation_and_realism/full_realism_validation_report.md) | Full 50-check audit report | ✅ Pushed to repo (92% realism score) |
| [`hardware_and_sizing/hardware_components_and_expected_outputs.md`](file:///d:/project/HAL/docs/project_analysis/hardware_and_sizing/hardware_components_and_expected_outputs.md) | Specs & expected outputs for all 10 systems | ✅ Pushed to repo |
| [`validation_and_realism/project_evaluation_report.md`](file:///d:/project/HAL/docs/project_analysis/validation_and_realism/project_evaluation_report.md) | Realism & weight budget evaluation | Confirms empty weight fraction $W_e/W_0 = 0.45$ |
| [`validation_and_realism/realism_gap_analysis.md`](file:///d:/project/HAL/docs/project_analysis/validation_and_realism/realism_gap_analysis.md) | 3 gaps: altitude derating, battery cold, wind | **Gap A (P0), Gap B (P3), Gap C (P2)** |
| [`developer_guides/rl_testing_and_data_flow_guide.md`](file:///d:/project/HAL/docs/project_analysis/developer_guides/rl_testing_and_data_flow_guide.md) | 9D state vector flow & `test_rl.py` script | Needs creation of `backend/test_rl.py` |
| [`developer_guides/rl_training_hardware_roadmap.md`](file:///d:/project/HAL/docs/project_analysis/developer_guides/rl_training_hardware_roadmap.md) | CPU parallel training & `train_rl.py` | Needs creation of `backend/train_rl.py` |


---

## 🎯 RECOMMENDED 3-PHASE BUILD ORDER

```
                            3-PHASE IMPLEMENTATION PIPELINE
                            
 ┌───────────────────────────────────┐      ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
 │ PHASE 1: Critical Physics Fixes   │─────►│ PHASE 2: RL Training Pipeline     │─────►│ PHASE 3: Advanced Features        │
 │ • Engine Altitude Derating (P0)   │      │ • backend/train_rl.py (PPO/SAC)   │      │ • Wind Disturbance Model (P2)     │
 │ • Excess-Power Climb RoC (P0)     │      │ • backend/test_rl.py Benchmark    │      │ • Regenerative Descent Recovery   │
 │ • Expanded 9D Observation (P1)    │      │ • /api/simulate_rl Endpoint       │      │ • XAI / SHAP Airworthiness        │
 │ • Dense Reward Shaping (P1)       │      │                                   │      │ • Frontend Dynamic Slider Ceiling │
 └───────────────────────────────────┘      └───────────────────────────────────┘      └───────────────────────────────────┘
```

---

> [!NOTE]
> **Summary:** This cross-reference maps all 25+ markdown files in `docs/` directly to python lines in `backend/` and react components in `frontend/`.
