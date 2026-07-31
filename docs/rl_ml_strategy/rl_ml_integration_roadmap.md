# 🧠 RL & ML Integration Roadmap — AeroOptima (HAL × IIT Indore)

> **Context:** The project already possesses a custom Gymnasium environment (`environment.py`), a DEAP Genetic Algorithm outer loop (`optimizer.py`), and a full 6-phase flight physics simulation. This roadmap outlines 8 state-of-the-art RL and ML integration ideas ranked by **hackathon impact × buildability**.

---

## 🏆 Tier 1 — High Impact, Directly Buildable

### 1. 🎮 Replace Heuristic PSR with a Trained RL Agent (PPO / SAC)

**What it replaces:** The `_heuristic_psr()` function in `environment.py` — a fixed rule-based policy from Zhang et al.

**What RL does instead:**  
Train a Proximal Policy Optimization (PPO) or Soft Actor-Critic (SAC) agent that *learns* the optimal Power Split Ratio (PSR) at every 10-second timestep. The agent receives the observation `[altitude, speed, SoC, fuel, P_required]` and outputs a continuous $PSR \in [0, 1]$.

**Why it's genuinely useful & practical:**
- The heuristic is a static lookup table that cannot adapt if the battery degrades, the engine operates off-spec, or wind changes.
- A trained SAC agent finds PSR schedules that the heuristic cannot discover (e.g., partial battery charging during descent, micro-burst motor assist during cruise turbulence).
- **Real-world parallel:** Airbus E-Fan X, Rolls-Royce research aircraft, and NASA X-57 Maxwell use RL for Energy Management Strategy (EMS).

**Implementation hooks:**
```python
# environment.py already supports use_heuristic_policy=False:
if self.use_heuristic_policy:
    psr = self._heuristic_psr(...)
else:
    psr = float(np.clip(action[0], 0.0, 1.0))  # RL agent action

# Train with stable-baselines3:
from stable_baselines3 import SAC
env = UAVHybridEnv(..., use_heuristic_policy=False)
model = SAC("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=500_000)
```

**Expected improvement:** 5–15% endurance gain over the Zhang et al. heuristic.

---

### 2. 🌪️ Wind & Climate Disturbance Adaptive Control (Robust RL)

**What it is:**  
Inject stochastic wind disturbances (gusts, updrafts, tailwinds, headwinds) into the simulation physics, then train an RL agent that adaptively adjusts power split in real-time to compensate for aerodynamic perturbations.

**Physics Addition:**
```python
# In environment.py _compute_power_required():
wind_ms = np.random.normal(0, sigma_wind)  # σ = 3–8 m/s gusts
effective_speed = max(1.0, speed + wind_ms)
# Headwind → drag increase → RL surges motor instantly
# Updraft → free lift → RL reduces PSR temporarily
```

**Wind Scenarios:**
| Scenario | Effect | RL Challenge |
|---|---|---|
| **Headwind gust** | +20–40% $P_{req}$ spike | Motor surges instantly |
| **Tailwind** | Reduced power needed | Conserve battery |
| **Turbulence (random)** | Rapid $P_{req}$ oscillation | Smooth PSR, prevent C-rate breach |
| **Downdraft** | Sudden altitude loss | Phase re-entry compensation |

**Hackathon Impact:**
- Aligns directly with **STANAG 4671 fail-safe** requirements.
- Show side-by-side demo: **heuristic crashes on gust**, **RL agent recovers**.

---

### 3. 🔄 Bayesian Optimization / Surrogate-Assisted GA

**What it replaces:** The DEAP GA's brute-force random search in `optimizer.py`.

**What it does:**  
Fit a **Gaussian Process (GP) surrogate model** on evaluated `(engine_kw, battery_kwh) → endurance_hours` points. Use Expected Improvement (EI) acquisition to query only high-potential candidates.

**Advantage:**
- GA with Pop=40, Gen=15 evaluates **~600 simulations**.
- Bayesian Optimization (BO) requires only **~30–50 evaluations** (10–15× speedup).

```python
from skopt import gp_minimize
result = gp_minimize(
    func=lambda x: -evaluate_individual(x, ...)[0],
    dimensions=[(30.0, 120.0), (5.0, 50.0)],
    n_calls=40,
    acq_func="EI"
)
```

---

## 🥈 Tier 2 — High Impact, Moderate Effort

### 4. 🔮 Multi-Objective Pareto Optimization (NSGA-II)
Extend GA to multi-objective Pareto optimization evaluating trade-offs between:
1. Maximize Endurance
2. Minimize Infrared (IR) Thermal Signature (engine usage proxy)
3. Minimize Total Propulsion Mass

### 5. 🛡️ Anomaly Detection for Component Failure
Train an **Isolation Forest** on normal flight telemetry (`flight_log`). Monitor streams in real-time to trigger alerts on battery thermal degradation or engine partial failure (STANAG 4671 single-fault compliance).

### 6. ⚡ Imitation Learning / Behavioral Cloning
Use Behavioral Cloning (BC) on GA-optimal trajectories to train a microsecond-latency MLP policy for real-time onboard UAV deployment.

---

## 🥉 Tier 3 — Cutting-Edge Research

### 7. 🧬 Neuroevolution (GA × RL Hybrid)
Evolve neural network policy weights directly using GA (NEAT / CMA-ES).

### 8. 🌐 Physics-Informed Neural Network (PINN)
Train a PINN as a fast differentiable aerodynamic surrogate model.

---

## 📊 Summary & Build Strategy

| # | Idea | Type | Hackathon Impact | Buildability |
|---|---|---|---|---|
| 1 | RL Power-Split Agent (SAC/PPO) | Deep RL | 🔥🔥🔥🔥🔥 | ✅✅✅✅ |
| 2 | Wind/Climate Disturbance RL | Robust RL | 🔥🔥🔥🔥🔥 | ✅✅✅ |
| 3 | Bayesian Surrogate-Assisted GA | ML + Opt | 🔥🔥🔥🔥 | ✅✅✅✅ |
| 4 | Multi-Objective Pareto (NSGA-II) | Evolutionary | 🔥🔥🔥🔥 | ✅✅✅ |
| 5 | Anomaly Detection (Isolation Forest) | Unsupervised | 🔥🔥🔥 | ✅✅✅✅ |

**Recommended Build Pipeline:**
1. **Phase 1:** Train SAC agent → replace heuristic (`stable-baselines3`).
2. **Phase 2:** Inject wind disturbance → demo RL gust recovery vs heuristic crash.
3. **Phase 3:** Deploy Isolation Forest telemetry monitor to dashboard.
