// src/pages/NurseDashboard.jsx

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import HospitalRecords from "../abi/HospitalRecords.json"; // Make sure path is correct

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function NurseDashboard() {
  const [wallet, setWallet] = useState("");
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const savedWallet = localStorage.getItem("walletAddress");
        if (savedWallet) setWallet(savedWallet);

        if (!window.ethereum) return alert("MetaMask not found");

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);

        // Call the smart contract to fetch accessible patients
        const patientIds = await contract.getAccessiblePatientIds(await signer.getAddress());

        const patientPromises = patientIds.map((id) => contract.getPatient(id));
        const patientData = await Promise.all(patientPromises);

        const formattedPatients = patientData.map((p, i) => ({
          id: patientIds[i].toNumber(),
          name: p.name,
          condition: p.condition,
          status: p.status,
        }));

        setPatients(formattedPatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };

    fetchPatients();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nurse Dashboard</h1>
      <p className="mb-6 text-gray-500">Wallet: {wallet}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {patients.length === 0 ? (
          <p>No accessible patients found.</p>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id} className="shadow-md">
              <CardContent className="p-4">
                <p><strong>Patient Name:</strong> {patient.name}</p>
                <p><strong>Condition:</strong> {patient.condition}</p>
                <p><strong>Status:</strong> {patient.status}</p>
                <Button className="mt-3" onClick={() => alert(`Details for patient ${patient.id}`)}>
                  View Record
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
