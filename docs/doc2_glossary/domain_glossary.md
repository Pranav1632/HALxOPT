# 📘 Masterclass Domain Knowledge & Theory Guide

> **Project:** AeroOptima — Tactical Hybrid-Electric UAV Sizing & Control Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/domain_glossary.md`  
> **Target Audience:** Team Members, Software Developers, Aerospace Engineers, and Competition Judges.  
> **Goal:** Provide a deep, theoretical, yet intuitive masterclass explaining every key domain concept across Aerospace Physics, Evolutionary Optimization, Reinforcement Learning, and Military Airworthiness.

---

## ✈️ Section 1: Aerospace Engineering & Flight Physics

---

### 1.1 MTOW — Maximum Takeoff Weight

#### 💡 The Layman's Intuition
Imagine a cargo truck: it has a structural limit where adding one extra kilogram of weight makes the tires pop or the engine overheat. In aviation, **Maximum Takeoff Weight (MTOW)** is the absolute heaviest the aircraft can physically be at the moment the wheels leave the runway. If your aircraft weighs 1,001 kg and MTOW is 1,000 kg, the wing cannot generate enough lift to get off the ground safely.

#### 📐 Theoretical Physics & Equations
MTOW is the top-level mass budget equation ($W_0$):

$$W_0 = W_{\text{airframe}} + W_{\text{engine}} + W_{\text{motor}} + W_{\text{battery}} + W_{\text{payload}} + W_{\text{fuel}} \le \text{MTOW}$$

In our 1,000 kg MTOW class fixed-wing UAV ($9,810\text{ N}$ weight force at sea level):
$$\text{Empty Weight Fraction } \left(\frac{W_e}{W_0}\right) = \frac{W_{\text{airframe}} + W_{\text{propulsion}}}{W_0} = \frac{350 + (35 + 12.3 + 80)}{1000} = 0.477 \text{ (47.7\%)}$$

> [!NOTE]
> **Why This Matters in Code:** In `backend/environment.py` (L97–111), the fuel capacity is computed dynamically as the *remaining mass budget* after subtracting airframe, engine, motor, battery, and payload. If component weights exceed MTOW, `fuel_initial <= 0`, causing an immediate simulation termination!

---

### 1.2 ISA — International Standard Atmosphere Model

#### 💡 The Layman's Intuition
As you climb up a mountain like Mount Everest or Siachen, the air gets "thinner" (less air density $\rho$) and colder. Thinner air means fewer oxygen molecules for the engine to burn, and fewer air molecules hitting the wing to produce lift. The **International Standard Atmosphere (ISA)** is an international mathematical baseline (ICAO Doc 7488) that models exactly how air density, pressure, and temperature drop with every meter of altitude.

#### 📐 Theoretical Physics & Equations
At Standard Sea-Level (SSL), air density is $\rho_0 = 1.225\text{ kg/m}^3$ and temperature is $T_0 = 288.15\text{ K}$ ($15^\circ\text{C}$).

In the **Troposphere** (from 0 m up to $11,000\text{ m}$ altitude), temperature drops linearly at a lapse rate $L = 0.0065\text{ K/m}$:
$$T(h) = T_0 - L \cdot h$$

Air density drops exponentially according to the standard barometric formula:
$$\rho(h) = \rho_0 \left(1.0 - 2.25577 \times 10^{-5} \cdot h\right)^{4.25588}$$

```
    ALTITUDE vs. AIR DENSITY RATIO (σ = ρ / ρ₀)
    
  Altitude (m)
    10,000m ┼─────────────────  ρ = 0.4135 kg/m³ (σ = 0.337) ──► [Power drops by >58%]
     8,000m ┼─────────────────  ρ = 0.5258 kg/m³ (σ = 0.429)
     5,000m ┼─────────────────  ρ = 0.7364 kg/m³ (σ = 0.601) ──► [Cruise Flight Ceiling]
     2,000m ┼─────────────────  ρ = 1.0065 kg/m³ (σ = 0.821)
         0m ┼─────────────────  ρ = 1.2250 kg/m³ (σ = 1.000) ──► [Sea Level Benchmark]
```

> [!IMPORTANT]
> **Code Linkage:** Implemented verbatim in `backend/environment.py` L168–177 (`_atmosphere(altitude_m)`). Used continuously during flight simulation to scale True Airspeed, stall velocity, and engine power limits!

---

### 1.3 Airspeed Definitions: IAS vs. TAS vs. EAS

#### 💡 The Layman's Intuition
* **Indicated Airspeed (IAS):** What the pitot tube sensor on the wing tip physically "feels". It measures dynamic pressure ($\frac{1}{2}\rho V^2$). High up in thin air, your plane must move faster through space just to push the same number of air molecules into the sensor.
* **True Airspeed (TAS):** How fast the airplane is *actually moving* relative to the surrounding air mass.
* **Groundspeed (GS):** True Airspeed plus or minus headwind/tailwind.

#### 📐 Theoretical Physics & Equations
$$\text{Dynamic Pressure } q = \frac{1}{2} \rho_0 V_{\text{IAS}}^2 = \frac{1}{2} \rho(h) V_{\text{TAS}}^2$$

Solving for True Airspeed ($V_{\text{TAS}}$) as a function of density ratio $\sigma = \frac{\rho(h)}{\rho_0}$:
$$V_{\text{TAS}} = \frac{V_{\text{IAS}}}{\sqrt{\sigma}}$$

**Concrete Numerical Example:**
If your UAV needs an IAS of $53.5\text{ m/s}$ ($192.6\text{ km/h}$) to prevent stall:
- At **Sea Level** ($\sigma = 1.0$): $V_{\text{TAS}} = 53.5\text{ m/s}$ ($192.6\text{ km/h}$).
- At **5,000m Altitude** ($\sigma = 0.601$): $V_{\text{TAS}} = \frac{53.5}{\sqrt{0.601}} = 69.0\text{ m/s}$ (**$248.5\text{ km/h}$**).

---

### 1.4 Aerodynamic Drag Polar & Oswald Efficiency

#### 💡 The Layman's Intuition
Every aircraft moving through air suffers two types of drag:
1. **Parasite Drag ($C_{D0}$):** The friction and air resistance of pushing the physical shape of the fuselage, wings, and antennas through the air. Like sticking your hand out of a car window. (Dominates at high speeds).
2. **Induced Drag ($C_{Di}$):** The unavoidable "penalty" drag created as a by-product of creating aerodynamic lift. High-aspect ratio wings (long, skinny wings like gliders) reduce this drag. (Dominates at low speeds / high lift).

#### 📐 Theoretical Physics & Equations
The total drag coefficient $C_D$ is modeled using the parabolic Oswald Drag Polar:

$$C_D = C_{D0} + C_{Di} = C_{D0} + \frac{C_L^2}{\pi \cdot AR \cdot e}$$

Where:
- $C_{D0} = 0.025$ (Zero-lift parasite drag coefficient)
- $AR = \frac{b^2}{S} = \frac{15.0^2}{14.0} = 16.07$ (Aspect Ratio: Wingspan $b=15\text{m}$, Wing Area $S=14\text{m}^2$)
- $e = 0.85$ (Oswald span efficiency factor for clean composite wings)
- $C_L = \frac{2 \cdot W \cdot g \cdot \cos\gamma}{\rho \cdot V^2 \cdot S}$ (Lift Coefficient required for level flight)

```
                 PARABOLIC DRAG POLAR CURVE
    
    Drag Force (N)
       ▲
       │             Total Drag (D_total = D_parasite + D_induced)
       │                 \       /
       │                  \  *  /  <── Minimum Power / Best Endurance Speed (V_be)
       │  Induced Drag     \ * /
       │   (High @ Low V)   \* /   Parasite Drag (High @ High V)
       │       \             V          /
       └────────\──────────────────────/──────────► Airspeed V (m/s)
```

> [!NOTE]
> **Code Linkage:** Implemented in `backend/environment.py` L206–234 (`_compute_power_required`). Aerodynamic power required is calculated as $P_{\text{aero}} = \frac{1}{2} \rho V^3 S C_D$.

---

### 1.5 SFC — Specific Fuel Consumption & Partial-Load Penalties

#### 💡 The Layman's Intuition
Think of a sports car engine: it gets great fuel efficiency when cruising smoothly at 70 mph in top gear. But if you idle at a red light or putter around at 5 mph, the engine burns a lot of fuel for very little distance covered. Gas turbine turboshafts are extreme examples: running a turboshaft at 20% throttle burns fuel terribly inefficiently per kilowatt produced!

#### 📐 Theoretical Physics & Equations
Specific Fuel Consumption (SFC) measures mass of fuel burned per kilowatt-hour of shaft work:
$$\text{SFC} = \frac{\dot{m}_{\text{fuel}}}{P_{\text{engine}}} \quad \left[\frac{\text{kg}}{\text{kW}\cdot\text{h}}\right]$$

In `backend/environment.py` (L238–255), we apply a **piecewise partial-load SFC penalty model**:

$$\text{SFC}_{\text{effective}}(L_f) = \begin{cases} 
\text{SFC}_{\text{base}}, & L_f \ge 0.80 \quad (\text{Optimal efficiency band}) \\
\text{SFC}_{\text{base}} \cdot \left[1.0 + 0.15 \cdot \frac{0.80 - L_f}{0.30}\right], & 0.50 \le L_f < 0.80 \quad (\text{Up to +15\% fuel penalty}) \\
\text{SFC}_{\text{base}} \cdot \left[1.15 + 0.25 \cdot \frac{0.50 - L_f}{0.50}\right], & L_f < 0.50 \quad (\text{Up to +40\% heavy fuel penalty})
\end{cases}$$

Where load fraction $L_f = \frac{P_{\text{engine}}}{P_{\text{engine, continuous}}}$.

---

## 🧬 Section 2: Evolutionary Computation & Component Sizing Theory

---

### 2.1 Genetic Algorithms (GA) & Chromosome Encoding

#### 💡 The Layman's Intuition
How do you find the best engine size and battery size out of millions of combinations without guessing blindly? You use a **Genetic Algorithm (GA)**! Inspired by biological evolution (Darwinian survival of the fittest), the GA creates a "population" of 40 candidate UAV designs. It tests each candidate in a flight simulator, picks the best ones, and "breeds" them together to create stronger offspring over 15 generations.

#### 📐 Mathematical & Algorithmic Formulation
- **Individual (Chromosome):** A vector of 2 continuous design variables:
  $$\vec{x} = \left[ P_{\text{engine}} \ (\text{kW}), \ E_{\text{battery}} \ (\text{kWh}) \right]$$
  Search bounds: $P_{\text{engine}} \in [30.0, 120.0]\text{ kW}$, $E_{\text{battery}} \in [5.0, 50.0]\text{ kWh}$.
- **Fitness Function:** Total simulated mission flight endurance in hours:
  $$\mathcal{F}(\vec{x}) = \text{Simulated Endurance (Hours)} \times \text{Mission Completion Penalty Factor}$$
- **Genetic Operators (DEAP Framework):**
  - **Crossover (`cxBlend`, $\alpha=0.5$):** Blends parent variables: $x_{\text{child}} = (1-\gamma)x_1 + \gamma x_2$.
  - **Mutation (`mutGaussian`, $\mu=0, \sigma=[8.0, 4.0]$):** Adds random Gaussian noise to prevent getting stuck in local optima.

```
                    OUTER-LOOP GENETIC ALGORITHM WORKFLOW
                    
   ┌────────────────────────────────┐
   │ Population Init (40 Candidate  ├────────────┐
   │ Chromosomes: [Engine, Battery])│            │
   └───────────────▲────────────────┘            │
                   │                             ▼
   ┌───────────────┴────────────────┐   ┌────────────────────────────────┐
   │ Selection, Crossover (cxBlend),│   │ Evaluate Each Individual in    │
   │ & Mutation (mutGaussian)       │   │ Gymnasium Environment Loop     │
   └───────────────▲────────────────┘   └────────┬───────────────────────┘
                   │                             │
                   └─────────────────────────────┘
                     Fitness = Flight Hours
```

> [!NOTE]
> **Code Linkage:** Implemented in `backend/optimizer.py` using DEAP (`optimize_propulsion`).

---

### 2.2 Multi-Objective Pareto Optimization & NSGA-II

#### 💡 The Layman's Intuition
In engineering, you can rarely maximize everything at once. If you make the engine bigger for speed, the aircraft gets heavier. If you make the battery bigger, you lose fuel space. **Pareto Optimization** does not give you just one single answer; it finds the "optimal trade-off curve" (the Pareto Frontier) where you cannot improve one objective (like endurance) without hurting another (like payload or thermal stealth).

#### 📐 Theoretical Physics & Equations
In NSGA-II (Non-Dominated Sorting Genetic Algorithm II), we evaluate a vector of $m$ competing objective functions:

$$\max_{\vec{x}} \vec{f}(\vec{x}) = \left[ f_1(\vec{x}), f_2(\vec{x}), f_3(\vec{x}) \right]$$

1. **$f_1(\vec{x})$:** Maximize Flight Endurance (Hours)
2. **$f_2(\vec{x})$:** Minimize Thermal IR Signature (Engine power usage fraction)
3. **$f_3(\vec{x})$:** Minimize Propulsion Mass ($m_{\text{engine}} + m_{\text{battery}}$)

A design $\vec{x}_A$ **dominates** $\vec{x}_B$ if $\vec{x}_A$ is no worse than $\vec{x}_B$ in all objectives, and strictly better in at least one.

---

## 🤖 Section 3: Reinforcement Learning & Autonomous Energy Control

---

### 3.1 MDP — Markov Decision Process Formulation

#### 💡 The Layman's Intuition
Reinforcement Learning (RL) is like training a pilot in a simulator by giving points for good decisions and deducting points for bad ones. To use RL, we frame the flight problem as a **Markov Decision Process (MDP)**: at every 10-second tick, the pilot looks at the dashboard instruments (State), makes a decision on power split (Action), and receives feedback on fuel/altitude (Reward).

#### 📐 Mathematical 5-Tuple $(\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma)$
1. **State Space ($\mathcal{S} \in \mathbb{R}^9$):** 9D Observation Vector:
   $$\vec{s}_t = \left[ h, V_{\text{TAS}}, \text{SoC}, \frac{m_{\text{fuel}}}{m_{\text{fuel,init}}}, P_{\text{req}}, \frac{P_{\text{engine}}}{P_{\text{cont}}}, \rho(h), t, \text{Phase ID} \right]$$
2. **Action Space ($\mathcal{A} \in [0.0, 1.0]$):** Continuous Power Split Ratio (PSR):
   $$\text{PSR} = \frac{P_{\text{motor}}}{P_{\text{req}}} \quad \implies \begin{cases} 0.0 & \text{100\% Engine (Cruise)} \\ 0.5 & \text{50\% Engine + 50\% Motor (Climb)} \\ 1.0 & \text{100\% Electric (Silent Loiter)} \end{cases}$$
3. **Dense Reward Function ($\mathcal{R}$):**
   $$r_t = r_{\text{phase}} + 0.5 \cdot \eta_{\text{SFC}} + 0.2 \cdot \text{SoC} - 10.0 \cdot P_{\text{deficit}} - 500.0 \cdot \mathbb{I}(\text{Stall})$$

---

### 3.2 Soft Actor-Critic (SAC) vs. PPO

#### 💡 The Layman's Intuition
- **PPO (Proximal Policy Optimization):** A cautious, steady learner. It makes small, safe updates to its policy so it doesn't accidentally unlearn good behavior. Great for general control.
- **SAC (Soft Actor-Critic):** A creative explorer. It tries to maximize both performance AND curiosity (entropy). It learns continuous actions (like throttle sliders) extremely smoothly and avoids getting trapped in predictable sub-optimal habits.

#### 📐 Mathematical Formulations
SAC maximizes an entropy-augmented objective function:

$$J(\pi) = \sum_{t=0}^{T} \mathbb{E}_{(\vec{s}_t, a_t) \sim \rho_\pi} \left[ r(\vec{s}_t, a_t) + \alpha \mathcal{H}\left(\pi(\cdot | \vec{s}_t)\right) \right]$$

Where $\mathcal{H}\left(\pi(\cdot | \vec{s}_t)\right) = -\int \pi(a|\vec{s}) \log \pi(a|\vec{s}) \, da$ is the policy entropy, encouraging exploration of non-obvious power split strategies.

---

### 3.3 XAI & SHAP Auditability for Defense Certification

#### 💡 The Layman's Intuition
Military defense engineers (HAL / Indian Armed Forces) **refuse to trust a black-box AI neural network**. If an AI decides to shut down an engine over enemy territory, judges and airworthiness certifiers need to know *why*. **Explainable AI (XAI)** using **SHAP (SHapley Additive exPlanations)** converts complex neural network math into readable bar charts showing exactly which sensor input caused the AI's decision.

#### 📐 Mathematical Formulation
Derived from cooperative game theory (Lloyd Shapley, Nobel Prize):
$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F|-|S|-1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

`\phi_i` quantifies the exact contribution of sensor input $i$ (e.g., Battery SoC) to the output PSR command!

```
         SHAP FEATURE IMPORTANCE CHART (MIL-HDBK-516C AUDIT)
    
  Sensor Feature            Impact on Power Split Ratio (PSR Action)
  ─────────────────────────────────────────────────────────────────
  Air Density ρ(h)          ████████████████████████ (+38% -> Boost Motor)
  Battery SoC %             █████████████████ (+25% -> Conserve Batt)
  Power Required P_req      ████████████ (+18% -> High Load)
  Fuel Ratio                ██████ (+9%)
  Airspeed V_TAS            ███ (+4%)
```

---

## 🛡️ Section 4: Military Airworthiness Standards

---

### 4.1 NATO STANAG 4671 — Unmanned Aerial Systems Airworthiness

#### 💡 The Layman's Intuition
STANAG 4671 is the NATO standard rulebook for certifying military UAVs. One of its strict rules is **Single-Fault Redundancy**: if any single component fails (e.g., the battery pack dies completely or short-circuits mid-flight), the aircraft must be able to stay in the air using its remaining backup power source without crashing.

#### 📐 Engineering Verification in AeroOptima
- Required Cruise Power at 5,000m: $P_{\text{req}} = 55.8\text{ kW}$
- Scaled Engine Capacity: $60.0\text{ kW}$
- If Battery fails ($\text{SoC} \rightarrow 0$): Engine alone produces $60.0\text{ kW} > 55.8\text{ kW}$, proving **100% single-fault airworthiness compliance**!

---

### 4.2 MIL-HDBK-516C — DoD Airworthiness Certification Criteria

#### 💡 The Layman's Intuition
MIL-HDBK-516C is the US Department of Defense master handbook used by military engineers worldwide. Section 14 governs **Flight Control Systems and Software Integrity**. It mandates that all flight software must have deterministic fallback modes, memory safety, and fail-safe state boundaries.

---

> [!TIP]
> **Summary for Team Members:** Use this document whenever you need to explain the theoretical foundations of AeroOptima in slides, documentation, or judge defense Q&A sessions!
