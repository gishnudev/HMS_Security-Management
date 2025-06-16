import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import HospitalRecords from "../abi/HospitalRecords.json";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import  Input  from "../components/Input";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function ReceptionistDashboard() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);
  const [isReceptionist, setIsReceptionist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patients, setPatients] = useState([]);
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const address = accounts[0];
        setWallet(address);
        localStorage.setItem("walletAddress", address);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);
        setContract(contractInstance);

        const role = await contractInstance.getRole(address);

        if (Number(role) !== 5) {
          setError("❌ Access denied. You are not a receptionist.");
          return;
        }

        setIsReceptionist(true);

        const users = await contractInstance.getAllUsers();
        const patientData = [];

        for (const user of users) {
          const userRole = await contractInstance.getRole(user);
          if (Number(userRole) === 1) {
            const [pname, pid] = await contractInstance.getPatientDetails(user);
            patientData.push({ address: user, name: pname, id: pid });
          }
        }

        setPatients(patientData);
      } catch (err) {
        console.error("Error loading receptionist dashboard:", err);
        setError("❌ Failed to load receptionist dashboard.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleAddPatient = async () => {
    if (!name || !patientId) {
      alert("Please enter name and patient ID.");
      return;
    }

    try {
      const tx = await contract.addPatient(wallet, name, patientId);
      await tx.wait();
      alert("✅ Patient added successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error adding patient:", err);
      alert("Failed to add patient.");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">⏳ Loading Receptionist Dashboard...</div>;
  if (error) return <div className="p-6 text-red-500 font-bold">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Receptionist Dashboard</h1>
      <p className="mb-6 text-gray-500">👛 Wallet: {wallet}</p>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">➕ Add New Patient</h2>
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Patient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          <Button onClick={handleAddPatient}>Add Patient</Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">📋 Registered Patients</h2>
      {patients.length === 0 ? (
        <Card><CardContent className="p-4">No patients found.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {patients.map((p, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <p><strong>👤 Name:</strong> {p.name}</p>
                <p><strong>🆔 Patient ID:</strong> {p.id}</p>
                <p><strong>🔗 Address:</strong> {p.address}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
