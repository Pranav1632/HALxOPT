# 📊 Project Analysis, Sizing & Developer Index
## AEROTHON 2026 — Team HAL × IIT Indore

This directory documents the technical assessments, validation reports, reinforcement learning audits, CPU training paths, GA refactoring blueprints, and component recommendations of the AeroOptima project. The documentation is organized into 4 logical subdirectories:

---

## 📂 Subdirectory Sitemap & File Index

### 1. 👨‍💻 [Developer Guides](./developer_guides/)
Guides, code walkthroughs, refactoring plans, and training pipelines for software developers:
- **[codebase_walkthrough_and_developer_guide.md](./developer_guides/codebase_walkthrough_and_developer_guide.md):** Local installation quickstart, file-by-line codebase tour, and developer FAQ.
- **[system_architecture_and_dataflow_guide.md](./developer_guides/system_architecture_and_dataflow_guide.md):** High-level component interactions, API requests, and data flow.
- **[ga_modularization_plan.md](./developer_guides/ga_modularization_plan.md):** Blueprint for refactoring the 257-line `optimizer.py` into a modular package.
- **[rl_testing_and_data_flow_guide.md](./developer_guides/rl_testing_and_data_flow_guide.md):** Maps the RL 9D observation vector flow, integration loop, and `test_rl.py` script.
- **[rl_training_hardware_roadmap.md](./developer_guides/rl_training_hardware_roadmap.md):** Parallel CPU training benchmarks using multiprocessing and FastAPI model serving.

---

### 2. ⚡ [Hardware & Sizing](./hardware_and_sizing/)
Detailed specifications, weight allocations, and expected telemetry streams:
- **[hardware_components_and_expected_outputs.md](./hardware_and_sizing/hardware_components_and_expected_outputs.md):** Telemetry streams, voltages, weights, and ratings for all 10 hardware subsystems.
- **[component_and_battery_recommendations.md](./hardware_and_sizing/component_and_battery_recommendations.md):** SOTA aviation components matrix, 800V DC high-voltage bus trade-offs, and mass balance.

---

### 3. 🛡️ [Validation & Realism](./validation_and_realism/)
Physical model auditing, aerospace correctness checks, and gap analyses:
- **[full_realism_validation_report.md](./validation_and_realism/full_realism_validation_report.md):** 50-check physics and operational realism audit against ISA tables (92% score).
- **[realism_gap_analysis.md](./validation_and_realism/realism_gap_analysis.md):** Altitude derating engine lapses, low-temp battery capacity degradation, and wind gaps.
- **[project_evaluation_report.md](./validation_and_realism/project_evaluation_report.md):** Audit of AI framework status (GA vs RL), functional completeness, and composite weight fractions.

---

### 4. 🧠 [Advanced Knowledge](./advanced_knowledge/)
Academic bibliography, aerospace case studies, and advanced RL control concepts:
- **[extra_knowledge_and_uav_case_studies.md](./advanced_knowledge/extra_knowledge_and_uav_case_studies.md):** Case studies of existing platforms (Hermes 900, TAPAS-BH-201, Reaper, NASA X-57) and defense concepts.
- **[technical_references_and_data_sources.md](./advanced_knowledge/technical_references_and_data_sources.md):** Bibliography of textbooks (Raymer, Anderson), EMRAX motor datasheets, NMC battery papers, and military standards (STANAG 4671).
- **[reinforcement_learning_and_ai_innovations.md](./advanced_knowledge/reinforcement_learning_and_ai_innovations.md):** Deep-dive on RL state-actions, wind disturbance handling, and innovations like PINNs and RL-MPC.

---

## ⚡ Aircraft Sizing Benchmarks
- **MTOW Constraint:** Locked at **$1,000\text{ kg}$**.
- **Empty Weight Ratio ($W_e/W_0$):** Sized at **$0.477$**, aligning with high-end composite aerospace structures.
- **Functional Completeness:** Full 6-phase mission profile tracking implemented inside [environment.py](../../backend/environment.py).
