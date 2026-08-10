"""
DEAP Type Registration and Genetic Operators Setup.
"""
import random
from deap import base, creator, tools

if not hasattr(creator, "FitnessMax"):
    creator.create("FitnessMax", base.Fitness, weights=(1.0,))
if not hasattr(creator, "Individual"):
    creator.create("Individual", list, fitness=creator.FitnessMax)


def create_toolbox(bounds: dict, evaluate_func) -> base.Toolbox:
    """Create and configure DEAP Toolbox for 2-variable propulsion sizing."""
    toolbox = base.Toolbox()

    toolbox.register("attr_engine", random.uniform, bounds["engine"][0], bounds["engine"][1])
    toolbox.register("attr_battery", random.uniform, bounds["battery"][0], bounds["battery"][1])

    toolbox.register(
        "individual",
        tools.initCycle,
        creator.Individual,
        (toolbox.attr_engine, toolbox.attr_battery),
        n=1,
    )
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", evaluate_func)
    toolbox.register("mate", tools.cxBlend, alpha=0.5)
    toolbox.register("mutate", tools.mutGaussian, mu=0.0, sigma=[8.0, 4.0], indpb=0.35)
    toolbox.register("select", tools.selTournament, tournsize=3)

    return toolbox


def clip_individual(ind, bounds: dict):
    """Enforce hardware min/max search bounds on individual."""
    ind[0] = max(bounds["engine"][0], min(ind[0], bounds["engine"][1]))
    ind[1] = max(bounds["battery"][0], min(ind[1], bounds["battery"][1]))
