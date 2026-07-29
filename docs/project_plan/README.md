# Project Plan & Milestones Directory
## AEROTHON 2026 — Team HAL × IIT Indore

This directory documents the end-to-end masterplan, multi-phase technical implementation roadmaps, and compliance verification criteria for the **AeroOptima** Hybrid-Electric UAV Propulsion Sizing Platform.

### Index of Planning Deliverables:
1. **[end_to_end_project_masterplan.md](file:///d:/project/HAL/docs/project_plan/end_to_end_project_masterplan.md)**: High-level architectural overview, mission specifications (1,000 kg MTOW, 200 kg payload), multi-tier tech stack (FastAPI + Gymnasium + DEAP + Next.js / Three.js), and 5-phase breakdown.
2. **[phase_implementation_roadmap.md](file:///d:/project/HAL/docs/project_plan/phase_implementation_roadmap.md)**: Detailed phase-by-phase implementation deliverables, mathematical equations, flight environment parameters, and CPU parallel RL training milestones.

---

### Military Compliance Benchmarks:
* **STANAG 4671 Compliance:** Single-fault redundancy checks (engine-only cruise margin and battery-only emergency loiter margin).
* **MIL-HDBK-516C Airworthiness:** Mass budget clipping enforcing $W_{\text{actual}} \le 1,000\text{ kg}$ MTOW constraint at initialization.
