import os
import sys
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

import torch
import flwr as fl
from collections import OrderedDict
from model import HealthRiskNN, load_data
from opacus import PrivacyEngine

def test(model, test_loader):
    """Evaluate the local model to understand how well the global recipe works here."""
    criterion = torch.nn.BCELoss()
    correct = 0
    total = 0
    loss = 0.0
    
    model.eval()
    with torch.no_grad():
        for data, target in test_loader:
            outputs = model(data)
            loss += criterion(outputs, target).item()
            predicted = (outputs > 0.5).float()
            total += target.size(0)
            correct += (predicted == target).sum().item()
            
    accuracy = correct / total
    return loss / len(test_loader), accuracy

class SovereignHealthClient(fl.client.NumPyClient):
    """The local hospital node that trains without sharing data."""
    def __init__(self, model, train_loader, test_loader, num_examples_train, num_examples_test, hospital_name):
        self.model = model
        self.test_loader = test_loader
        self.num_examples_train = num_examples_train
        self.num_examples_test = num_examples_test
        self.hospital_name = hospital_name

        # Differential Privacy setup (The Shield)
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.privacy_engine = PrivacyEngine()
        
        self.model, self.optimizer, self.train_loader = self.privacy_engine.make_private(
            module=self.model,
            optimizer=self.optimizer,
            data_loader=train_loader,
            noise_multiplier=1.0,
            max_grad_norm=1.0,
        )

    def get_parameters(self, config):
        """Extract model weights to send to the central Aggregator."""
        model_to_extract = self.model._module if hasattr(self.model, '_module') else self.model
        return [val.cpu().numpy() for _, val in model_to_extract.state_dict().items()]

    def set_parameters(self, parameters):
        """Receive updated 'Master Brain' recipe from Aggregator."""
        model_to_set = self.model._module if hasattr(self.model, '_module') else self.model
        params_dict = zip(model_to_set.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        model_to_set.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        """Locally train using Differential Privacy."""
        self.set_parameters(parameters)
        
        criterion = torch.nn.BCELoss()
        self.model.train()
        for _ in range(1):
            for data, target in self.train_loader:
                self.optimizer.zero_grad()
                output = self.model(data)
                loss = criterion(output, target)
                loss.backward()
                self.optimizer.step()
        
        print(f"[Node {self.hospital_name}]  DP-Training complete. Sending noised gradients to Aggregator.")
        return self.get_parameters(config={}), self.num_examples_train, {}

    def evaluate(self, parameters, config):
        """Evaluate the updated global model."""
        self.set_parameters(parameters)
        model_to_evaluate = self.model._module if hasattr(self.model, '_module') else self.model
        loss, accuracy = test(model_to_evaluate, self.test_loader)
        print(f"[Node {self.hospital_name}]  Evaluation -> Loss: {loss:.4f}  Accuracy: {accuracy:.2%}")
        return float(loss), self.num_examples_test, {"accuracy": float(accuracy)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python FedNode.py <hospital_directory_name>")
        sys.exit(1)
        
    hospital_name = sys.argv[1]
    base_dir = os.path.dirname(os.path.abspath(__file__))
    hospital_dir = os.path.join(base_dir, hospital_name)
    data_path = os.path.join(hospital_dir, "local_dataset.csv")
    
    if not os.path.exists(data_path):
        print(f"[Node {hospital_name}] ERROR: Dataset not found at {data_path}")
        sys.exit(1)
    
    friendly_name = hospital_name.replace("_", " ").title()
    print(f"[Node {friendly_name}] ──────────────────────────────────────")
    print(f"[Node {friendly_name}] Preparing local data isolation...")
    
    train_loader, test_loader, num_train, num_test = load_data(data_path)
    print(f"[Node {friendly_name}] Training samples: {num_train}, Test samples: {num_test}")
    
    model = HealthRiskNN()
    
    print(f"[Node {friendly_name}] Connecting to FL Aggregator on 127.0.0.1:8080...")
    print(f"[Node {friendly_name}] Differential Privacy: noise=1.0, clip=1.0")
    print(f"[Node {friendly_name}] ──────────────────────────────────────")
    
    try:
        fl.client.start_numpy_client(
            server_address="127.0.0.1:8080",
            client=SovereignHealthClient(model, train_loader, test_loader, num_train, num_test, friendly_name)
        )
        print(f"[Node {friendly_name}] ✓ All FL rounds complete.")
    except Exception as e:
        print(f"[Node {friendly_name}] Connection failed: {e}")
        
    os._exit(0)
