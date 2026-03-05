import torch
import torch.nn as nn
import pandas as pd
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

class HealthRiskNN(nn.Module):
    """
    A simple Feed-Forward Neural Network to classify health risk based on 
    5 continuous/integer EHR features.
    """
    def __init__(self, input_size=5):
        super(HealthRiskNN, self).__init__()
        self.fc1 = nn.Linear(input_size, 16)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(16, 8)
        self.fc3 = nn.Linear(8, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        out = self.relu(out)
        out = self.fc3(out)
        out = self.sigmoid(out)
        return out
        
def load_data(data_path):
    """Loads a hospital's synthetic CSV and returning train/test PyTorch DataLoaders."""
    df = pd.read_csv(data_path)
    # Features match those generated in SYNTHETIC_GEN.py
    feature_cols = ['age', 'bmi', 'blood_pressure', 'health_marker_1', 'health_marker_2']
    X = df[feature_cols].values
    y = df['target_diagnosis'].values
    
    # Standardize data locally (Prevents schema mismatch / exploding gradients)
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    train_tensor_x = torch.tensor(X_train, dtype=torch.float32)
    train_tensor_y = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
    
    test_tensor_x = torch.tensor(X_test, dtype=torch.float32)
    test_tensor_y = torch.tensor(y_test, dtype=torch.float32).unsqueeze(1)
    
    train_dataset = TensorDataset(train_tensor_x, train_tensor_y)
    test_dataset = TensorDataset(test_tensor_x, test_tensor_y)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=32)
    
    return train_loader, test_loader, len(X_train), len(X_test)
