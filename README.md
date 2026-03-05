<div align="center">
  
# 🏥 Sovereign-Health

**A Privacy-Preserving Federated Learning Platform with Blockchain Verification**

[![Status: Alpha](https://img.shields.io/badge/Status-Alpha%20(Simulation)-orange.svg)](https://github.com/Inayat-0007/sovereign-health-by-INAYAT)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.13+](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![React + Vite](https://img.shields.io/badge/React_+-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

*Decentralizing healthcare AI without compromising patient privacy.*

---

</div>

## 🚀 The Problem We Are Solving

Healthcare institutions possess vast amounts of medical data that could revolutionize AI-assisted diagnostics and patient care. However, strict privacy laws (like HIPAA and GDPR) and the proprietary nature of medical records prevent hospitals from centralizing this data to train robust, generalized machine learning models.

**Sovereign-Health** solves this data-silo problem by utilizing **Federated Learning** coupled with **Differential Privacy** and **Blockchain immutability**. 

Instead of sending patient records to a central server, the AI models *travel* to the hospitals. The models train locally on sensitive data, apply differential privacy (noise) to prevent data reverse-engineering, and only send abstract mathematical gradient updates back to the aggregator. The entire lifecycle is then recorded on an Ethereum blockchain as an immutable, mathematically verifiable ledger.

---

## 🛠️ Technical Stack

This project is built using a modern, scalable microservice architecture:

### 🧠 Edge Layer (Federated Learning)
*   **Python 3.13+**: Core ML language.
*   **PyTorch**: Defining and training the local `HealthRiskNN` models.
*   **Opacus (Differential Privacy)**: Applying gradient clipping and noise injection to mathematically guarantee privacy.
*   **Flower (flwr)**: The Federated Learning orchestration framework (Aggregator/Node architecture).
*   **Pandas & Scikit-Learn**: Synthetic data generation and preprocessing.

### 🌐 Aggregation Layer (Backend & Dashboard)
*   **Node.js & Express.js**: Asynchronous backend handling real-time API routes.
*   **Socket.io**: Real-time bidirectional event streaming from Python background processes to the React interface.
*   **React 18 + Vite**: Lightning-fast, modern frontend dashboard.
*   **TailwindCSS v4**: Next-gen utility-first styling for a sleek, dark-mode-first aesthetic.
*   **Lucide React**: Premium iconography.

### ⛓️ Sovereign Layer (Blockchain)
*   **Hardhat**: Local Ethereum node environment for rapid contract development.
*   **Solidity (0.8.x)**: Smart contract definitions (`ModelRegistry.sol`).
*   **Ethers.js v6**: Interfacing the Node.js backend with the local blockchain.

---

## 🚧 Current Version Scope (v1.0 - Simulation/Mock)

*Important: This initial release is a technical proof-of-concept and simulation.*

**What IS currently implemented:**
*   ✅ **End-to-End Pipeline**: A fully functional pipeline connecting React -> Express -> Hardhat -> Flower Aggregator -> Local PyTorch Nodes.
*   ✅ **Synthetic Data**: Nodes (`bhopal_city_hospital`, `balaghat_clinic`, `indore_medical_center`) use programmatically generated synthetic EHR (Electronic Health Record) data logic.
*   ✅ **Simulated Federated Rounds**: Triggering an FL round seamlessly boots aggregator and nodes.
*   ✅ **Live Terminal Logs**: The dashboard reads raw `stdout`/`stderr` from Python and streams it via WebSockets.
*   ✅ **Blockchain Verification**: Model hashes are generated and successfully mined into local Hardhat blocks.
*   ✅ **One-Click Launcher**: A robust PowerShell script (`run_all.ps1`) manages all port conflicts and service startups automatically.

**What is NOT currently implemented:**
*   ❌ Real patient data pipelines (due to privacy constraints of the demo).
*   ❌ Cryptographic verification of model weights (the hashes currently generated are representative timestamps/random bytes rather than purely deterministic weight checksums).
*   ❌ Multi-machine deployment (all nodes run on localhost via separate processes, not physically distributed).
*   ❌ Complex Neural Networks (currently using a small Feed-Forward NN as a proof-of-concept).

---

## 🔮 Future Roadmap (v2.0)

Our next iteration aims to transition from a sophisticated simulation to a highly accurate, production-ready framework:

1.  **Real Data Integration**: Support for OMOP Common Data Model and HL7 FHIR to ingest real, anonymized hospital datasets.
2.  **Distributed Deployment**: Utilizing Docker Swarm or Kubernetes to deploy nodes across physically separated cloud instances.
3.  **Deterministic Model Hashing**: Generating pure SHA-256 hashes of the PyTorch `state_dict` tensors to mathematically prove the model weights matching the blockchain ledger without exposing raw IP.
4.  **Advanced Privacy**: Integrating Secure Multi-Party Computation (SMPC) alongside Differential Privacy.

---

## 💻 Getting Started

You can run the entire infrastructure locally with a single script!

### Prerequisites
*   Node.js (v18+)
*   Python (3.12 or 3.13)
*   Windows PowerShell

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Inayat-0007/sovereign-health-by-INAYAT.git
    cd sovereign-health-by-INAYAT
    ```
2.  **Run the orchestrator:**
    ```powershell
    .\run_all.ps1
    ```
    This script will:
    *   Clean up old hanging processes.
    *   Boot the Hardhat Blockchain node.
    *   Deploy the `ModelRegistry.sol` smart contract.
    *   Start the Express backend.
    *   Start the Vite frontend.
3.  **Access the Dashboard:**
    Open `http://localhost:5173` in your browser.
4.  **Trigger Training:**
    Click the **"Trigger Federated Round"** button in the dashboard to watch the orchestrator spin up the Python aggregator and 3 hospital nodes in real time!

---

## 🧠 Challenges Faced During Development

Building a decentralized AI system connecting UI, Web3, and Machine Learning was highly complex. Key challenges we overcame:

1.  **Python 3.13 gRPC Shutdown Errors**: Flower (`flwr`) daemon threads generated massive `RuntimeError: cannot schedule new futures after interpreter shutdown` stack traces upon completion. **Solution**: We injected a custom `threading.excepthook` patch to cleanly swallow the future termination exception and used `os._exit(0)` for abrupt, clean process death.
2.  **Flower API Deprecations**: Heavy transition warnings cluttered the beautiful console output. **Solution**: Aggressive Python `warnings` and `logging` filters were applied to ensure only actual errors surfaced.
3.  **Port Collisions & Orchestration**: Frontend, Backend, Blockchain, and FL Aggregator all compete for parallel resources. If one crashed, ports remained locked (`ECONNREFUSED`). **Solution**: Built an aggressive port-sweeping architecture directly into the `run_all.ps1` boot script that identifies and terminates orphaned processes before launch.
4.  **UI Content Overflow**: Real-time terminal logs caused infinite page scraping/scrolling in the dashboard. **Solution**: Refactored the core React interface using strict `100vh` flex layouts with internal custom-scrollbar overflows and maximize/minimize window states.

---

<div align="center">
  <p>Built with ❤️ for privacy-preserving Artificial Intelligence.</p>
</div>
