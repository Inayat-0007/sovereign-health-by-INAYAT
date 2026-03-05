import flwr as fl
import sys
import os
import threading
import warnings
import logging

# ── Suppress noisy Flower deprecation warnings & gRPC shutdown errors ──
warnings.filterwarnings("ignore")
logging.getLogger("flwr").setLevel(logging.ERROR)
logging.getLogger("grpc").setLevel(logging.ERROR)

def _patch_threading():
    _orig = threading.excepthook
    def _hook(args):
        if args.exc_type == RuntimeError and "new futures" in str(args.exc_value):
            return
        _orig(args)
    threading.excepthook = _hook
_patch_threading()


# ── Evaluate function for FedAvg ──
def evaluate_fn(server_round: int, parameters: fl.common.NDArrays, config: dict):
    """Server-side evaluation — returns dummy metrics for the demo."""
    return 0.5, {"accuracy": 0.85 + (server_round * 0.02)}


if __name__ == "__main__":
    print("[Aggregator] ══════════════════════════════════════════")
    print("[Aggregator] Central FL Aggregator initializing...")
    print("[Aggregator] Strategy  : FedAvg (Federated Averaging)")
    print("[Aggregator] Rounds    : 3")
    print("[Aggregator] Min nodes : 3 hospitals")
    print("[Aggregator] ══════════════════════════════════════════")
    
    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=3,
        min_evaluate_clients=3,
        min_available_clients=3,
        evaluate_fn=evaluate_fn,       # <-- direct callable, not the wrapper
    )

    fl.server.start_server(
        server_address="0.0.0.0:8080",
        config=fl.server.ServerConfig(num_rounds=3),
        strategy=strategy,
    )
    
    print("[Aggregator] ✓ All rounds complete. Shutting down cleanly.")
    os._exit(0)
