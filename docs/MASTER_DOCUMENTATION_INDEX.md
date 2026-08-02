# 📚 AeroOptima Master Documentation Index & Purpose Catalog

> **Project:** AeroOptima — Hybrid-Electric Tactical UAV Optimization Platform (HAL × IIT Indore)  
> **Location:** `docs/MASTER_DOCUMENTATION_INDEX.md`  
> **Purpose:** Comprehensive index mapping every `.md` documentation file in the repository, explaining **why each document exists**, its technical purpose, and key contents.

---

## 🗂️ 1. Glossaries & Parameter Constraints (`docs/doc2_glossary/`)

| File Path | Why This `.md` Exists (Rationale & Purpose) | Key Technical Contents |
| :--- | :--- | :--- |
| [`domain_glossary.md`](file:///d:/project/HAL/docs/doc2_glossary/domain_glossary.md) | Created to provide a unified reference for all complex acronyms (MTOW, ISA, TAS/IAS, SFC, MDP, SAC, SHAP, STANAG) so team members and judges have clear domain definitions across aerospace, RL, GA, and defense certification. | Full forms, definitions, mathematical derivations of ISA density lapse $\rho(h)$, Oswald drag polar $C_D$, SFC load degradation formulas, and STANAG 4671 single-fault standards. |
| [`component_glossary.md`](file:///d:/project/HAL/docs/doc2_glossary/component_glossary.md) | Created to document the exact hardware specifications, mass scaling equations, and mechanical roles of every physical component in the powertrain and airframe. | EMRAX 228 MV PMSM motor specs (12.3 kg, 55 kW cont, 96% eff), scalable turboshaft ICE mass model, 800V DC bus architecture (75% thermal wire loss reduction), composite wing parameters ($AR=16.07$). |
| [`mission_phase_glossary.md`](file:///d:/project/HAL/docs/doc2_glossary/mission_phase_glossary.md) | Created to break down the physical operations, velocity targets, climb rates, and Power Split Ratio (PSR) policies across all 6 mission phases. | Phase-by-phase operational parameters (Takeoff, Climb, Cruise, Loiter, Descent, Landing), mode switching logic (Mode A Endurance vs Mode B Silent Loiter at $<45\text{ dB}$), and landing success criteria. |
| [`flight_envelope_constraints.md`](file:///d:/project/HAL/docs/doc2_glossary/flight_envelope_constraints.md) | Created to explain why mission parameters are physically coupled (e.g. altitude ceiling vs payload limit) and document the dynamic backend Pydantic validators implemented in `main.py`. | 5 real-world coupled constraint scenarios (e.g., payload capped at $\le 200\text{ kg}$ above 8,000m due to air density lapse), stall speed scaling, MTOW mass lock, and Pydantic validator code. |

---

## 🧠 2. RL & ML Strategy (`docs/rl_ml_strategy/`)

| File Path | Why This `.md` Exists (Rationale & Purpose) | Key Technical Contents |
| :--- | :--- | :--- |
| [`deep_innovations_and_pitch.md`](file:///d:/project/HAL/docs/rl_ml_strategy/deep_innovations_and_pitch.md) | Created as the master presentation pitch masterclass for AEROTHON 2026 judges, detailing the 8 core technical and architectural innovations. | Dual-loop GA+Gymnasium architecture, 800V DC power bus, STANAG 4671 silent loiter, non-linear SFC penalty model, Gym+XAI SHAP airworthiness framework, and judge pitch cards. |
| [`deep_unnoticed_codebase_audit.md`](file:///d:/project/HAL/docs/rl_ml_strategy/deep_unnoticed_codebase_audit.md) | Created as an exhaustive code review of all Python files (`environment.py`, `optimizer.py`, `main.py`) to discover hidden physics bugs, RL architecture flaws, and missed optimization opportunities. | Discovery of the Phantom Climb bug (L492), missing altitude engine derating, 5D vs 9D observation space flaw, sparse reward fix, and regenerative descent recovery energy model (~8.25 kWh). |
| [`rl_ml_integration_roadmap.md`](file:///d:/project/HAL/docs/rl_ml_strategy/rl_ml_integration_roadmap.md) | Created to establish a clear build order for integrating Machine Learning and Reinforcement Learning into the existing Gymnasium simulator. | 8 SOTA RL/ML ideas ranked by impact vs buildability (SAC/PPO power split, wind disturbance control, Bayesian GP surrogate GA, Isolation Forest anomaly detection). |
| [`rl_utility_parameter_analysis.md`](file:///d:/project/HAL/docs/rl_ml_strategy/rl_utility_parameter_analysis.md) | Created to answer whether RL is genuinely useful for this project by mapping state space parameters to physical environmental disturbances. | Detailed analysis proving why static heuristics fail under coupled density lapse, sub-zero battery thermal sag, and 15-knot crosswinds, justifying closed-loop continuous RL control. |
| [`unnoticed_and_future_rl_ml.md`](file:///d:/project/HAL/docs/rl_ml_strategy/unnoticed_and_future_rl_ml.md) | Created to categorize complex RL tasks into quick hackathon demo wins vs long-term future roadmap items for PPT slides. | Identification of hard tasks (PINNs, Neuroevolution), 5 unnoticed aerospace RL opportunities (XAI, dynamic cruise-climb, battery SoH protection, variable prop pitch), and slide roadmap outlines. |

---

## 🔬 3. Aerospace Physics & Mechanics (`docs/aerospace_physics/`)

| File Path | Why This `.md` Exists (Rationale & Purpose) | Key Technical Contents |
| :--- | :--- | :--- |
| [`aerospace_engineering_report.md`](file:///d:/project/HAL/docs/aerospace_physics/aerospace_engineering_report.md) | Created to establish aerospace credibility for HAL evaluators by modeling Indian tactical flight corridors (Leh-Ladakh / Siachen). | Gagg-Ferrar altitude engine lapse, True Airspeed density scaling, high-altitude loiter endurance physics, parallel vs series-parallel hybrid topologies, and NSGA-II fitness formulations. |
| [`battery_thermal_analysis.md`](file:///d:/project/HAL/docs/aerospace_physics/battery_thermal_analysis.md) | Created to analyze sub-zero battery performance, cold-soak launch risks, and engine waste-heat recovery dynamics. | Ground cold-soak voltage sag derivations ($V_{\text{cell}} = V_{\text{oc}} - I \cdot R_{\text{int}}$), silent loiter engine-off cooling risks, chemistry selection matrix (Li-NMC 811 vs SSB), and 800V DC bus efficiency. |
| [`formula_sheet.md`](file:///d:/project/HAL/docs/aerospace_physics/formula_sheet.md) | Created as a mathematical registry detailing all governing differential and algebraic equations implemented in `environment.py`. | ISA atmosphere equations, Lift coefficient $C_L$, Stall speed $V_{\text{stall}}$, Oswald drag polar $C_D$, mechanical shaft power $P_{\text{shaft}}$, partial-load SFC penalty, and SoC integration functions. |
| [`silent_loiter_analysis.md`](file:///d:/project/HAL/docs/aerospace_physics/silent_loiter_analysis.md) | Created to evaluate the real-world operational feasibility and battery SoC drain rate during engine-off acoustic stealth loiter. | Aerodynamic drag power derivation in loiter ($19.1\text{ kW}$ mechanical $\implies 25.3\text{ kW}$ battery draw), exact SoC % drain table across battery pack sizes (2.11%/min for 20 kWh pack), and 1.5s in-flight ICE restart. |

---

## 📊 4. Project Analysis & Development Guides (`docs/project_analysis/`)

| File Path | Why This `.md` Exists (Rationale & Purpose) | Key Technical Contents |
| :--- | :--- | :--- |
| [`developer_guides/ga_modularization_plan.md`](file:///d:/project/HAL/docs/project_analysis/developer_guides/ga_modularization_plan.md) | Created to outline a clean refactoring plan for splitting `optimizer.py` into a modular package (`backend/ga/`). | Code base assessment, 4-module architecture (`bounds.py`, `evaluator.py`, `operators.py`, `engine.py`), and backward-compatible facade interface. |
| [`developer_guides/rl_testing_and_data_flow_guide.md`](file:///d:/project/HAL/docs/project_analysis/developer_guides/rl_testing_and_data_flow_guide.md) | Created to explain data flow, observation vectors, action vectors, and evaluation scripts for testing trained RL models. | 9D state vector definition, closed-loop simulation step execution, continuous PSR output mapping, and complete `test_rl.py` test script implementation. |
| [`developer_guides/rl_training_hardware_roadmap.md`](file:///d:/project/HAL/docs/project_analysis/developer_guides/rl_training_hardware_roadmap.md) | Created to demonstrate why GPU hardware is unnecessary and outline CPU parallel multiprocessing benchmarks for RL training. | PCIe bus vs CPU cache latency bottleneck analysis, CPU training benchmarks (~3-5 mins on quad-core CPU via `SubprocVecEnv`), and FastAPI model serving code. |
| [`hardware_and_sizing/component_and_battery_recommendations.md`](file:///d:/project/HAL/docs/project_analysis/hardware_and_sizing/component_and_battery_recommendations.md) | Created to specify SOTA off-the-shelf component choices for the 1,000 kg MTOW UAV propulsion system. | Battery mass budget breakdown across pack sizes, EMRAX 228/268 motor recommendation, Rotax 916 iS turbocharged engine recommendation, and 1,000 kg MTOW mass balance table. |
| [`validation_and_realism/project_evaluation_report.md`](file:///d:/project/HAL/docs/project_analysis/validation_and_realism/project_evaluation_report.md) | Created as an honest audit answering 4 core project readiness questions regarding ML usage, system completeness, mass budgeting, and physical realism. | Verification of GA usage, identification of kinematic climb constraint gap, empty weight fraction validation ($0.45$), and tier-1 missing physics recommendations. |
| [`validation_and_realism/realism_gap_analysis.md`](file:///d:/project/HAL/docs/project_analysis/validation_and_realism/realism_gap_analysis.md) | Created to identify critical gaps between textbook design and environmentally derated military tactical reality. | Verification matrix of power split, drag polar, density altitude gap, cold battery gap, zero-wind gap, and concrete Python code corrections. |
| [`advanced_knowledge/reinforcement_learning_and_ai_innovations.md`](file:///d:/project/HAL/docs/project_analysis/advanced_knowledge/reinforcement_learning_and_ai_innovations.md) | Created to audit existing Gym environment compatibility in `environment.py` and propose next-generation AI control architectures. | Gym API audit, wind shear rejection architecture, engine failure safety override, MLP surrogate GA acceleration, and LSTM Remaining Useful Life (RUL) twin. |

