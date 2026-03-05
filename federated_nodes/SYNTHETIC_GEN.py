import os
import uuid
import pandas as pd
import numpy as np

# Set fixed seed for reproducibility across execution
np.random.seed(42)

# Define the three hospital environments (The "Beginner" Domain Data Scopes)
HOSPITALS = {
    "bhopal_city_hospital": {
        "num_patients": 5000,
        "age_mean": 45, "age_std": 12,
        "bmi_mean": 26, "bmi_std": 4,
        "bp_mean": 120, "bp_std": 15,
        "risk_factor_base": 0.3
    },
    "balaghat_clinic": {
        "num_patients": 2500,
        "age_mean": 52, "age_std": 10,  # Older demographic
        "bmi_mean": 28, "bmi_std": 5,
        "bp_mean": 130, "bp_std": 18,
        "risk_factor_base": 0.45
    },
    "indore_medical_center": {
        "num_patients": 8000,
        "age_mean": 38, "age_std": 15,  # Younger, larger demographic
        "bmi_mean": 24, "bmi_std": 4,
        "bp_mean": 115, "bp_std": 12,
        "risk_factor_base": 0.2
    }
}

def generate_hospital_data(hospital_name, params):
    """Generates synthetic tabular EHR data mirroring schema requirements."""
    n = params["num_patients"]
    
    # Generate Patient IDs
    patient_ids = [str(uuid.uuid4()) for _ in range(n)]
    
    # Generate Features with localized distributions
    ages = np.random.normal(params["age_mean"], params["age_std"], n).clip(18, 90).astype(int)
    bmis = np.random.normal(params["bmi_mean"], params["bmi_std"], n).clip(15, 50).round(1)
    blood_pressures = np.random.normal(params["bp_mean"], params["bp_std"], n).clip(80, 200).astype(int)
    
    # Generate Abstract Health Markers (Continuous features for PyTorch to learn)
    health_marker_1 = np.random.uniform(0, 100, n).round(2)
    health_marker_2 = np.random.normal(50, 20, n).round(2)
    
    # Calculate Target Diagnosis (0 or 1) based on risk factors to simulate pattern
    # The neural network will learn this hidden relationship
    risk_scores = (
        (ages / 90) * 0.3 + 
        (bmis / 50) * 0.2 + 
        (blood_pressures / 200) * 0.2 + 
        (health_marker_1 / 100) * 0.15 + 
        (health_marker_2 / 100) * 0.15 + 
        np.random.normal(params["risk_factor_base"], 0.1, n)
    )
    
    # Threshold risk to create binary outcome
    target_diagnosis = (risk_scores > 0.65).astype(int)
    
    # Create DataFrame
    df = pd.DataFrame({
        "patient_id": patient_ids,
        "age": ages,
        "bmi": bmis,
        "blood_pressure": blood_pressures,
        "health_marker_1": health_marker_1,
        "health_marker_2": health_marker_2,
        "target_diagnosis": target_diagnosis
    })
    
    return df

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("\n[+] Initiating Synthetic Data Generation for Edge Nodes...")
    
    for hospital_name, params in HOSPITALS.items():
        # Create isolated edge node directory
        hospital_dir = os.path.join(base_dir, hospital_name)
        os.makedirs(hospital_dir, exist_ok=True)
        
        # Generate Data
        print(f"    -> Generating {params['num_patients']} EHR records for {hospital_name}...")
        df = generate_hospital_data(hospital_name, params)
        
        # Save securely in the local edge node
        output_path = os.path.join(hospital_dir, "local_dataset.csv")
        df.to_csv(output_path, index=False)
        
        # Verify
        assert os.path.exists(output_path), f"Failed to save data for {hospital_name}"
        
    print("[+] All Edge Node local datasets generated successfully.")
    print("[+] Data is ready for Federated Learning Phase.\n")

if __name__ == "__main__":
    main()
