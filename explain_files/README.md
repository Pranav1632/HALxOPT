# AeroOptima — `explain_files` Technical Documentation Suite

Welcome to the **`explain_files`** technical documentation repository for **AeroOptima** (IIT Indore × HAL Hackathon PS-1: Hybrid-Electric UAV Propulsion Architecture Sizing and Optimization Platform).

This folder contains exhaustive technical documentation detailing the physics, equations, flight phase operational logic, optimization strategies, and Reinforcement Learning (RL) control mechanisms governing the 1000 kg tactical fixed-wing UAV platform.

---

## 📂 Documentation Sitemap & Structure

| File Name | Description | Key Focus Areas |
| :--- | :--- | :--- |
| [**`01_phases_overview.md`**](file:///d:/project/HAL/explain_files/01_phases_overview.md) | **High-Level Mission Phase Overview** | High-level summary of all 6 flight phases (Takeoff, Climb, Cruise, Loiter, Descent, Landing), explaining **What**, **Why**, and **How**. |
| [**`02_concepts_and_formulae.md`**](file:///d:/project/HAL/explain_files/02_concepts_and_formulae.md) | **Aerospace, Propulsion, GA & RL Physics Engine** | Exhaustive mathematical catalog of equations, atmospheric models, aerodynamics, thermal derating, GA sizing, and PPO RL policy equations explained with **What**, **Why**, and **How**. |
| [**`03_phase_details.md`**](file:///d:/project/HAL/explain_files/03_phase_details.md) | **Deep-Dive Flight Phase Specifications** | In-depth operational mechanics for each individual phase: speed envelopes, climb rate targets, power-split dynamics, battery preservation guards, silent loiter mode, and regenerative glide recovery. |
| [**`04_rl_workflow_and_results.md`**](file:///d:/project/HAL/explain_files/04_rl_workflow_and_results.md) | **RL Workflow, Comparison & Performance Specifications** | Neural PPO workflow, Actor-Critic architecture, comparison matrix vs Heuristic & GA, output differences, SHAP feature audit, and quantitative performance specs. |

---

## 🎯 Architectural Highlights & Key Takeaways

1. **6-Phase Full Mission Profile**: From ground roll takeoff ($0\text{ m}$) up to cruise altitude ($5000\text{ m}$) and emergency silent loiter, compliant with STANAG 4671 military airworthiness rules.
2. **Hybrid Power-Split Optimization**: Dynamic power distribution between the EMRAX electric motor and reference turboshaft engine governed by continuous power-split ratio $\alpha = P_{\text{motor}} / P_{\text{req}} \in [0.0, 1.0]$.
3. **Dual Optimization Loop**:
   - **Outer Optimization Loop**: DEAP Genetic Algorithm for global sizing of turboshaft rating ($30 - 120\text{ kW}$) and battery pack ($5 - 50\text{ kWh}$).
   - **Inner Optimization Loop**: Proximal Policy Optimization (PPO) neural RL agent for real-time continuous energy management and battery thermal protection.
4. **Energy Recovery & Stealth Loiter**: Regenerative kinetic energy extraction during glideslope descent ($P_{\text{regen}}$) and zero-noise pure-electric silent loiter ($ICE\text{ OFF}, \alpha = 1.0$) for covert tactical reconnaissance.

---

## 🔗 Quick Reference Links to Workspace Source Code

- Environment & Flight Simulator: [`backend/env/uav_env.py`](file:///d:/project/HAL/backend/env/uav_env.py)
- Aerodynamics Engine: [`backend/physics/aerodynamics.py`](file:///d:/project/HAL/backend/physics/aerodynamics.py)
- Atmosphere & ISA Engine: [`backend/physics/atmosphere.py`](file:///d:/project/HAL/backend/physics/atmosphere.py)
- Propulsion & SFC Engine: [`backend/physics/propulsion.py`](file:///d:/project/HAL/backend/physics/propulsion.py)
- Battery & Thermal Derating: [`backend/physics/battery.py`](file:///d:/project/HAL/backend/physics/battery.py)
- Genetic Algorithm Optimizer: [`backend/ga/engine.py`](file:///d:/project/HAL/backend/ga/engine.py)
- Neural PPO Policy Trainer: [`backend/rl/ppo_agent.py`](file:///d:/project/HAL/backend/rl/ppo_agent.py)
