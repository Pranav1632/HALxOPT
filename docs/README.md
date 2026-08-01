# 📚 AeroOptima Master Technical Documentation Index
## AEROTHON 2026 — Team HAL × IIT Indore

Welcome to the complete technical documentation suite for **AeroOptima**, a state-of-the-art propulsion sizing and dynamic energy management optimization platform for a **1,000 kg MTOW Tactical Hybrid-Electric UAV**.

This directory contains masterclass theoretical guides, flight mechanics models, evolutionary algorithms, reinforcement learning integration roadmaps, airworthiness certification frameworks, and developer guides.

---

## 🗺️ Master Documentation Directory Tree

```
docs/
├── MASTER_DOCUMENTATION_INDEX.md        # Master index & rationale catalog for every file
├── doc_to_code_cross_reference.md       # Implementation guide mapping docs -> Python/React code
├── README.md                            # Main documentation portal (this file)
│
├── doc2_glossary/                       # Masterclass Theory & Concept Glossaries
│   ├── domain_glossary.md               # Flight dynamics, ISA troposphere, GA, RL & STANAG theory
│   ├── component_glossary.md            # Hardware Specs: EMRAX motor, 800V DC bus, Rotax ICE, Li-NMC
│   ├── mission_phase_glossary.md        # 6-phase operational flight manual & silent stealth loiter
│   └── flight_envelope_constraints.md   # Coupled physics rules, stall boundaries & Pydantic validators
│
├── project_analysis/                    # Architecture, Hardware Specs, Audits & Developer Guides
│   ├── system_architecture_and_dataflow_guide.md # High-level architecture & 9-step execution flow
│   ├── codebase_walkthrough_and_developer_guide.md# Local setup guide, line-by-line code map & FAQ
│   ├── hardware_components_and_expected_outputs.md# Detailed hardware specs, power & telemetry outputs
│   ├── full_realism_validation_report.md# 50-check physics & realism validation audit (92% score)
│   ├── realism_gap_analysis.md          # 3 critical gaps: altitude derating, cold battery, wind
│   ├── project_evaluation_report.md     # Weight fraction validation (We/W0 = 0.45) & GA status
│   ├── ga_modularization_plan.md        # Refactoring plan to split optimizer.py into package
│   ├── rl_testing_and_data_flow_guide.md# 9D observation vector flow & test_rl.py script
│   ├── rl_training_hardware_roadmap.md  # CPU parallel training benchmarks & FastAPI serving
│   ├── reinforcement_learning_and_ai_innovations.md# Wind disturbance RL & safety overrides
│   └── component_and_battery_recommendations.md# SOTA component selection matrix
│
├── aerospace_physics/                   # Mathematical Models & Environmental Physics
│   ├── README.md                        # Physics directory overview
│   ├── aerospace_engineering_report.md  # High-altitude flight physics & Gagg-Ferrar derating
│   ├── battery_thermal_analysis.md      # Low-temp voltage sag & thermal management trade-offs
│   ├── formula_sheet.md                 # Complete governing differential & algebraic equations
│   └── silent_loiter_analysis.md        # Aerodynamic power & loiter battery SoC drain rate math
│
├── rl_ml_strategy/                      # AI Control & Competition Presentation Innovations
│   ├── deep_innovations_and_pitch.md    # 8 core technical innovations & judge pitch masterclass
│   ├── deep_unnoticed_codebase_audit.md # Line-by-line audit: phantom climb fix & 9D obs space
│   ├── rl_ml_integration_roadmap.md     # 8 SOTA RL/ML ideas ranked by impact vs buildability
│   ├── rl_utility_parameter_analysis.md # Justification of closed-loop RL vs static heuristics
│   └── unnoticed_and_future_rl_ml.md    # XAI/SHAP auditability & dynamic cruise-climb tasks
│
├── project_plan/                        # Masterplan & Phase Roadmaps
│   ├── README.md                        # Planning index
│   ├── end_to_end_project_masterplan.md # Architectural vision & 5-phase breakdown
│   └── phase_implementation_roadmap.md  # Technical equations & milestone roadmap
│
└── presentations/                       # Pitch Decks & Slideshow Templates
    ├── README.md                        # Presentation index
    ├── aerothon_presentation_structure.md# Slide layouts, 3D visualizer & visual templates
    └── aerothon_presentation_content_slides.md# Slide-by-slide bullet points & presentation scripts
```

---

## 🚀 Navigation Guide by Role

### 👨‍💻 For Software Developers & Team Members
1. Start with [`system_architecture_and_dataflow_guide.md`](./project_analysis/system_architecture_and_dataflow_guide.md) to understand the high-level system components and HTTP data flows.
2. Follow [`codebase_walkthrough_and_developer_guide.md`](./project_analysis/codebase_walkthrough_and_developer_guide.md) to set up the Python backend (`uvicorn main:app`) and Next.js frontend (`npm run dev`) locally.
3. Reference [`doc_to_code_cross_reference.md`](./doc_to_code_cross_reference.md) to see where each theoretical equation is implemented in Python code.

### ✈️ For Aerospace & Hardware Engineers
1. Read [`domain_glossary.md`](./doc2_glossary/domain_glossary.md) for masterclass explanations of ISA troposphere models, Oswald drag polars, and SFC partial-load fuel penalties.
2. Inspect [`hardware_components_and_expected_outputs.md`](./project_analysis/hardware_components_and_expected_outputs.md) for specs and expected outputs of the Rotax ICE, EMRAX 228 motor, 800V DC bus, and MT-Propeller system.
3. Review [`flight_envelope_constraints.md`](./doc2_glossary/flight_envelope_constraints.md) for coupled physics rules (altitude ceilings, stall speeds, and MTOW mass locks).

### 🤖 For AI / Reinforcement Learning Researchers
1. Read [`rl_ml_integration_roadmap.md`](./rl_ml_strategy/rl_ml_integration_roadmap.md) and [`deep_unnoticed_codebase_audit.md`](./rl_ml_strategy/deep_unnoticed_codebase_audit.md) for the 9D observation vector and dense reward shaping formulation.
2. Review [`rl_training_hardware_roadmap.md`](./project_analysis/rl_training_hardware_roadmap.md) to understand CPU parallel training benchmarks using `SubprocVecEnv`.
3. Check [`unnoticed_and_future_rl_ml.md`](./rl_ml_strategy/unnoticed_and_future_rl_ml.md) for Explainable AI (XAI / SHAP) military airworthiness compliance.

### 🏆 For Competition Judges & Evaluators
1. Start with [`deep_innovations_and_pitch.md`](./rl_ml_strategy/deep_innovations_and_pitch.md) for the 8 core innovations (Dual-Loop GA+Gym architecture, 800V DC bus, NATO STANAG 4671 silent loiter, non-linear SFC penalty).
2. Inspect [`full_realism_validation_report.md`](./project_analysis/full_realism_validation_report.md) for our 50-check physics realism audit (92% realism score).
3. Review [`aerothon_presentation_structure.md`](./presentations/aerothon_presentation_structure.md) for the slide-by-slide pitch deck structure.

---

## ⚡ Aircraft Baseline Specifications Summary

| Sizing Parameter | Value / Specification | Reference |
| :--- | :--- | :--- |
| **Maximum Takeoff Weight (MTOW)** | **1,000.0 kg** ($9,810\text{ N}$) | Boundary constraint in GA |
| **Empty Weight Fraction ($W_e / W_0$)** | **0.477 (47.7%)** (Airframe + Propulsion = 477 kg) | Gold-standard composite MALE UAV |
| **Structural Airframe Mass** | **350.0 kg** (Carbon Fiber CFRP Composite) | 35% of MTOW |
| **Tactical Payload Capacity** | **200.0 kg** (L3Harris EO/IR + IMSAR SAR Radar Pod) | 20% of MTOW |
| **Electric Drive Motor** | **EMRAX 228 MV Axial-Flux PMSM** (12.3 kg, 55 kW cont / 109 kW peak) | 96% peak efficiency |
| **Thermal Powerplant** | **Rotax 916 iS / Scalable Turboshaft ICE** (30–120 kW continuous) | $0.38\text{ kg/kWh}$ base SFC |
| **Energy Storage System** | **20 kWh High-Density Li-NMC 811 Pack** ($80.0\text{ kg}$ @ $250\text{ Wh/kg}$) | 800V High-Voltage DC Bus |
| **Aerodynamic Wing Geometry** | **Wingspan $b=15.0\text{m}$, Area $S=14.0\text{m}^2$, Aspect Ratio $AR=16.07$** | $C_{D0}=0.025$, $e=0.85$ |
| **Flight Ceiling & Performance** | **5,000m ASL Cruise, 250 km/h TAS ($69.4\text{ m/s}$), 20+ Hours Endurance** | Leh-Ladakh / Himalayan Envelope |
| **Acoustic Stealth Capability** | **34–42 Minutes Pure Electric Silent Loiter ($<45\text{ dB}$ ground noise)** | 1.5s in-flight engine restart |

---

*Documentation curated and maintained by Team HAL × IIT Indore for AEROTHON 2026.*
