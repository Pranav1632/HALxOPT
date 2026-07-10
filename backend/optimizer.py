"""
optimizer.py — DEAP Genetic Algorithm for Hybrid-Electric UAV Component Sizing.

Outer Loop: Optimizes two design variables:
  1. engine_size_kw  — Turboshaft shaft power rating (scales weight from reference spec)
  2. battery_capacity_kwh — Battery pack energy (scales weight from energy density)

The electric motor is a FIXED off-the-shelf component (EMRAX 228, 12.3 kg).

For each candidate individual the GA:
  1. Computes total weight (airframe + payload + engine + motor + battery + fuel)
  2. Checks MTOW ≤ 1000 kg constraint (fuel = remaining budget)
  3. Runs a full flight simulation through UAVHybridEnv with heuristic power management
  4. Returns endurance (hours) as the fitness value to MAXIMIZE
"""

import os
import json
import random
import numpy as np
from deap import base, creator, tools
from environment import UAVHybridEnv

# ---- DEAP Type Registration (idempotent) ---- #
if not hasattr(creator, "FitnessMax"):
    creator.create("FitnessMax", base.Fitness, weights=(1.0,))
if not hasattr(creator, "Individual"):
    creator.create("Individual", list, fitness=creator.FitnessMax)


def load_bounds(data_dir: str) -> dict:
    """Load component sizing bounds dynamically from /data JSON files."""
    with open(os.path.join(data_dir, "turboshaft_specs.json"), "r") as f:
        engine_specs = json.load(f)
    with open(os.path.join(data_dir, "battery_specs.json"), "r") as f:
        battery_specs = json.load(f)

    return {
        "engine": (engine_specs.get("min_size_kw", 30.0), engine_specs.get("max_size_kw", 120.0)),
        "battery": (battery_specs.get("min_capacity_kwh", 5.0), battery_specs.get("max_capacity_kwh", 50.0)),
    }


def evaluate_individual(
    individual,
    target_speed_kmh: float,
    target_altitude: float,
    payload_weight: float,
    data_dir: str,
    bounds: dict,
):
    """
    Evaluate a single GA individual by running a full flight simulation.
    Returns (endurance_hours,) as a single-objective fitness tuple.
    """
    engine_kw, battery_kwh = individual

    # Clip to physical bounds
    engine_kw = max(bounds["engine"][0], min(engine_kw, bounds["engine"][1]))
    battery_kwh = max(bounds["battery"][0], min(battery_kwh, bounds["battery"][1]))

    # Instantiate the Gymnasium environment
    try:
        env = UAVHybridEnv(
            engine_size_kw=engine_kw,
            battery_capacity_kwh=battery_kwh,
            target_speed_kmh=target_speed_kmh,
            target_altitude=target_altitude,
            payload_weight=payload_weight,
            data_dir=data_dir,
            use_heuristic_policy=True,
            dt=60.0,  # 60-second steps for fast evaluation
        )
    except Exception:
        return (0.0,)

    # MTOW constraint check: fuel_initial ≤ 0 means weight budget exceeded
    if env.fuel_initial <= 0.0:
        return (0.0,)  # Massive penalty

    # Run simulation
    obs, info = env.reset()
    terminated, truncated = False, False
    while not (terminated or truncated):
        obs, reward, terminated, truncated, info = env.step([0.5])  # action ignored by heuristic

    # Fitness = total flight time in hours
    endurance_hours = env.time_elapsed / 3600.0

    # Penalize non-successful missions (didn't complete full profile to landing)
    reason = info.get("reason", "")
    if "Landed" not in reason and "Mission completed" not in reason:
        endurance_hours *= 0.4  # 60% penalty for incomplete mission

    return (endurance_hours,)


def optimize_propulsion(
    target_speed_kmh: float = 250.0,
    target_altitude: float = 5000.0,
    payload_weight: float = 200.0,
    data_dir: str = None,
    pop_size: int = 40,
    n_gen: int = 15,
):
    """
    Run the DEAP Genetic Algorithm to find the optimal propulsion sizing.
    Returns a dict with the best engine_size_kw, battery_capacity_kwh, and fitness.
    """
    if data_dir is None:
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

    bounds = load_bounds(data_dir)

    # ---- DEAP Toolbox Setup ---- #
    toolbox = base.Toolbox()

    # Attribute generators for 2 design variables
    toolbox.register("attr_engine", random.uniform, bounds["engine"][0], bounds["engine"][1])
    toolbox.register("attr_battery", random.uniform, bounds["battery"][0], bounds["battery"][1])

    # Individual = [engine_kw, battery_kwh]
    toolbox.register(
        "individual",
        tools.initCycle,
        creator.Individual,
        (toolbox.attr_engine, toolbox.attr_battery),
        n=1,
    )
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)

    # Evaluation function
    toolbox.register(
        "evaluate",
        evaluate_individual,
        target_speed_kmh=target_speed_kmh,
        target_altitude=target_altitude,
        payload_weight=payload_weight,
        data_dir=data_dir,
        bounds=bounds,
    )

    # Genetic operators
    toolbox.register("mate", tools.cxBlend, alpha=0.5)
    toolbox.register("mutate", tools.mutGaussian, mu=0.0, sigma=[8.0, 4.0], indpb=0.35)
    toolbox.register("select", tools.selTournament, tournsize=3)

    # ---- Bound-clipping helper ---- #
    def clip_individual(ind):
        ind[0] = max(bounds["engine"][0], min(ind[0], bounds["engine"][1]))
        ind[1] = max(bounds["battery"][0], min(ind[1], bounds["battery"][1]))

    # ---- Initialize Population ---- #
    pop = toolbox.population(n=pop_size)
    hof = tools.HallOfFame(1)

    # GA Hyperparameters
    CXPB, MUTPB = 0.6, 0.35

    # Evaluate initial population
    fitnesses = list(map(toolbox.evaluate, pop))
    for ind, fit in zip(pop, fitnesses):
        ind.fitness.values = fit
    hof.update(pop)

    # ---- Generational Loop ---- #
    for gen in range(1, n_gen + 1):
        offspring = toolbox.select(pop, len(pop))
        offspring = list(map(toolbox.clone, offspring))

        # Crossover
        for c1, c2 in zip(offspring[::2], offspring[1::2]):
            if random.random() < CXPB:
                toolbox.mate(c1, c2)
                clip_individual(c1)
                clip_individual(c2)
                del c1.fitness.values
                del c2.fitness.values

        # Mutation
        for mutant in offspring:
            if random.random() < MUTPB:
                toolbox.mutate(mutant)
                clip_individual(mutant)
                del mutant.fitness.values

        # Evaluate invalid individuals
        invalid = [ind for ind in offspring if not ind.fitness.valid]
        fitnesses = list(map(toolbox.evaluate, invalid))
        for ind, fit in zip(invalid, fitnesses):
            ind.fitness.values = fit

        pop[:] = offspring
        hof.update(pop)

    # ---- Return Best ---- #
    best = hof[0]
    return {
        "engine_size_kw": float(best[0]),
        "battery_capacity_kwh": float(best[1]),
        "fitness": float(best.fitness.values[0]),
    }


if __name__ == "__main__":
    print("Running GA optimizer (2-variable: engine_kw, battery_kwh)...")
    result = optimize_propulsion(
        target_speed_kmh=250.0,
        target_altitude=5000.0,
        payload_weight=200.0,
    )
    print("Optimization complete!")
    print(f"  Engine:    {result['engine_size_kw']:.2f} kW")
    print(f"  Battery:   {result['battery_capacity_kwh']:.2f} kWh")
    print(f"  Endurance: {result['fitness']:.2f} hours")
