"""
GA Parameter Bounds Loader.
"""
import os
import json


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
