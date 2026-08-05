# AeroOptima — `explain_files` Technical Documentation & Presentation Suite

Welcome to the **`explain_files`** technical documentation repository for **AeroOptima** (IIT Indore × HAL Hackathon PS-1: Hybrid-Electric UAV Propulsion Architecture Sizing and Optimization Platform).

This folder contains exhaustive technical documentation, interactive Mermaid diagrams, math formulations, code linkages, and a **friendly presentation guide designed to easily explain the project to friends, classmates, and judges**.

---

## 📂 Documentation Sitemap & Reading Guide

| File Name | Target Audience | Description & Key Focus Areas |
| :--- | :--- | :--- |
| [**`00_friend_presentation_guide.md`**](file:///d:/project/HAL/explain_files/00_friend_presentation_guide.md) | 🌟 **Friends & Presenters** | **Start Here!** 30-second pitch, simple analogies (Prius, Mario AI), ELI5 tables, presentation script, and Q&A cheat sheet. |
| [**`01_phases_overview.md`**](file:///d:/project/HAL/explain_files/01_phases_overview.md) | ✈️ **Overview & Visuals** | 6 flight phases explained with **What**, **Why**, and **How**, plus State Machine & Sequence Diagrams. |
| [**`02_concepts_and_formulae.md`**](file:///d:/project/HAL/explain_files/02_concepts_and_formulae.md) | 📐 **Aerospace & AI Engineers** | Exhaustive mathematical catalog of equations, atmospheric models, aerodynamics, thermal derating, GA sizing, and PPO RL policy equations. |
| [**`03_phase_details.md`**](file:///d:/project/HAL/explain_files/03_phase_details.md) | 🛠️ **Developers & Code Audit** | In-depth operational mechanics for each individual phase: speed envelopes, climb rate targets, power-split dynamics, battery preservation guards, silent loiter mode, and decision flowcharts. |
| [**`04_rl_workflow_and_results.md`**](file:///d:/project/HAL/explain_files/04_rl_workflow_and_results.md) | 🤖 **Data Science & ML Experts** | Neural PPO workflow, Actor-Critic architecture, comparison matrix vs Heuristic & GA, output differences, SHAP feature audit, and quantitative performance specs. |

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
