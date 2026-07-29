# AeroOptima Technical Documentation
## AEROTHON 2026 — Team HAL × IIT Indore

This directory contains the complete technical reports, slides content, mathematical formulations, battery recommendations, RL architecture audits, GA refactoring blueprints, and CPU hardware training paths compiled for the **AEROTHON 2026** competition.

### Directory Structure

```
docs/
├── README.md                          # Main documentation index
├── aerospace_physics/                 # Physics models and formulations
│   ├── README.md                      # Index of physics documents
│   ├── aerospace_engineering_report.md# High-altitude flight physics & topologies
│   ├── battery_thermal_analysis.md    # Low-temp battery capacity degradation
│   ├── formula_sheet.md               # Governing formulas & integrations
│   └── silent_loiter_analysis.md      # Aerodynamic power & loiter drain math
│
├── project_analysis/                  # Assessments, RL audit, & recommendations
│   ├── README.md                      # Index of validation documents
│   ├── ga_modularization_plan.md      # Refactoring plan to split optimizer.py
│   ├── rl_testing_and_data_flow_guide.md # 5D data vector, insertion loop & test_rl.py
│   ├── rl_training_hardware_roadmap.md # CPU vs GPU training roadmap & FastAPI path
│   ├── component_and_battery_recommendations.md # SOTA component matrix & 800V bus
│   ├── reinforcement_learning_and_ai_innovations.md # RL safety & disturbance control
│   ├── project_evaluation_report.md   # AI structure, weight fractions, completeness
│   └── realism_gap_analysis.md        # Physical limitations vs perfect reality
│
└── presentations/                     # Pitch decks and slideshow scripts
    ├── README.md                      # Index of presentation files
    ├── aerothon_presentation_structure.md # Slide layouts, visualizations & templates
    └── aerothon_presentation_content_slides.md # Presentation bullet points & text blocks
```

---

### Sizing Parameters Summary
* **Maximum Takeoff Weight (MTOW):** 1,000 kg
* **Structural Airframe Weight:** 350 kg (35% fraction)
* **Payload Weight:** 200 kg (tactical sensor suite + gimbal)
* **Energy Architecture:** Parallel/Series-Parallel Heavy Fuel ICE + EMRAX Axial-Flux Motor + 800V NMC Battery Pack
