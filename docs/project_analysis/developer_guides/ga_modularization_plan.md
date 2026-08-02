# Genetic Algorithm (GA) Code Base Modularization Plan
## AEROTHON 2026 — Team HAL × IIT Indore

---

## 1. Current State Assessment

Currently, the Genetic Algorithm sizing engine is contained in a single 257-line file: **[`backend/optimizer.py`](file:///d:/project/HAL/backend/optimizer.py)**.

While functional, having DEAP type registrations, JSON bounds loading, simulation evaluation, bound clipping, and the generational loop in a single file makes the code harder to unit test and maintain.

---

## 2. Recommended Modular File Architecture

We can split `optimizer.py` into a clean, modular package (`backend/ga/`):

```
backend/
├── optimizer.py                    # Main facade interface (keeps FastAPI main.py working seamlessly)
└── ga/
    ├── __init__.py                 # Exports ga_engine package
    ├── bounds.py                   # Module 1: Load & validate search bounds from JSON
    ├── evaluator.py                # Module 2: Run simulation & evaluate individual fitness
    ├── operators.py                # Module 3: DEAP toolbox setup, mutation & clipping helpers
    └── engine.py                   # Module 4: Main generational evolution loop
```

---

## 3. Detailed Responsibilities of Each Sub-Module

### Module 1: `backend/ga/bounds.py`
* **Purpose:** Loads component sizing constraints (`engine_size_kw`, `battery_capacity_kwh`) from `/data/*.json`.
* **Key Functions:** `load_bounds(data_dir)`

---

### Module 2: `backend/ga/evaluator.py`
* **Purpose:** Instantiates the Gymnasium environment (`UAVHybridEnv`), executes the 6-phase mission profile, checks MTOW constraints, and returns fitness tuples `(endurance_hours,)`.
* **Key Functions:** `evaluate_individual()`

---

### Module 3: `backend/ga/operators.py`
* **Purpose:** Defines DEAP population creation, `cxBlend` crossover, `mutGaussian` mutation, `selTournament` selection, and bound-clipping functions (`clip_individual`).
* **Key Functions:** `setup_toolbox()`, `clip_individual()`

---

### Module 4: `backend/ga/engine.py`
* **Purpose:** Coordinates the population evolution across $N$ generations, tracks Hall of Fame (`hof`), logs generational metrics, and returns the optimal sizing dict.
* **Key Functions:** `run_ga_optimization()`

---

### Facade Interface: `backend/optimizer.py`
* **Purpose:** Acts as a backward-compatible wrapper so that `main.py` (FastAPI) and external test scripts can continue calling `optimize_propulsion()` without breaking changes:

```python
# Facade wrapper in backend/optimizer.py
from ga.engine import run_ga_optimization

def optimize_propulsion(**kwargs):
    return run_ga_optimization(**kwargs)
```

---

## 4. Software Engineering Benefits

1. **Unit Testing Isolation:** Test mutation operators or bound clipping without running heavy 6-phase flight simulations.
2. **Algorithm Swapping:** Easily swap single-objective DEAP GA for multi-objective **NSGA-II** without modifying the evaluation or bounds code.
3. **Clean Codebase Structure:** High readability for AEROTHON technical judges.
