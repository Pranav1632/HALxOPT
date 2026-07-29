# Aerospace Physics and Mathematical Models Reference Directory
## AEROTHON 2026 — Team HAL × IIT Indore

This directory documents the core aerodynamic, atmospheric, and electro-chemical physics models utilized in the optimization engine of the hybrid-electric UAV.

### Contents:
1. **[formula_sheet.md](file:///d:/project/HAL/docs/aerospace_physics/formula_sheet.md)**: A complete list of all active mathematical equations used within the Gymnasium simulation loops (`environment.py`).
2. **[aerospace_engineering_report.md](file:///d:/project/HAL/docs/aerospace_physics/aerospace_engineering_report.md)**: A comprehensive report highlighting density altitude power lapses, SOTA hybrid layouts, and aerodynamic trade-off curves.
3. **[silent_loiter_analysis.md](file:///d:/project/HAL/docs/aerospace_physics/silent_loiter_analysis.md)**: Physical derivations and battery drain tables mapping SoC usage per minute for silent loitering missions.
4. **[battery_thermal_analysis.md](file:///d:/project/HAL/docs/aerospace_physics/battery_thermal_analysis.md)**: Deep-dive analysis of low-temperature capacity penalties and engine cooling limitations.

### Highlighted Physics Categories:
- **Atmospheric Model:** International Standard Atmosphere (ISA) Troposphere and Stratosphere density lapse rates.
- **Aerodynamics:** Lift-coefficient and Oswald-polar Drag estimation.
- **Propulsion splitting:** Specific fuel consumption load degradation curves, battery voltage sag under discharge, and C-rate thresholds.
