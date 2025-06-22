import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button } from "../components/Button";
import { Card, CardContent } from "../components/card";
import HospitalRecords from "../abi/HospitalRecords.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const roleMap = {
  0: "None",
  1: "Patient",
  2: "Nurse",
  3: "Doctor",
  4: "Receptionist",
  5: "Admin",
};

export default function NurseDashboard() {
  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState("");
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [vitals, setVitals] = useState({
    ecg: "",
    bp: "",
    heartRate: "",
    temperature: "",
  });
  const [notesInput, setNotesInput] = useState("");

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);

      const userRoleNum = await contract.roles(address);
      const userRole = roleMap[Number(userRoleNum)];
      setRole(userRole);

      if (userRole !== "Nurse") {
        alert(`Unauthorized: You are a ${userRole}, not a Nurse.`);
        return;
      }

      const allRecords = await contract.viewAllRecords();
      const filteredRecords = allRecords.filter(r => r.patient !== ethers.ZeroAddress);

      const uniquePatients = [...new Set(filteredRecords.map(r => r.patient))];
      const uniqueDoctors = [...new Set(filteredRecords.map(r => r.doctor))];

      const patientNames = {};
      const doctorNames = {};

      await Promise.all(uniquePatients.map(async (p) => {
        const info = await contract.patientDetails(p);
        patientNames[p] = info.name;
      }));

      await Promise.all(uniqueDoctors.map(async (d) => {
        try {
          const [name] = await contract.getDoctorDetails(d);
          doctorNames[d] = name;
        } catch {
          doctorNames[d] = "Unknown";
        }
      }));

      const enhancedRecords = filteredRecords.map(r => ({
        ...r,
        id: r.id.toNumber ? r.id.toNumber() : Number(r.id),
        patient: r.patient.toString(),   // Ensure address string
        doctor: r.doctor.toString(),     // Ensure address string
        patientName: patientNames[r.patient] || "Unknown",
        doctorName: doctorNames[r.doctor] || "Unknown",
      }));
      

      setRecords(enhancedRecords);
    };

    init();
  }, []);

  const updateVitals = async () => {
    if (!selectedRecordId) {
      alert("Select a record first.");
      return;
    }

    const vitalsStr = `ECG: ${vitals.ecg}, BP: ${vitals.bp}, HR: ${vitals.heartRate}, Temp: ${vitals.temperature}`;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);

      const tx = await contract.updateVitals(selectedRecordId, vitalsStr, notesInput);
      await tx.wait();

      alert("Vitals updated!");

      const allRecords = await contract.viewAllRecords();
      const filteredRecords = allRecords.filter(r => r.patient !== ethers.ZeroAddress);
      setRecords(filteredRecords);

      setSelectedRecordId(null);
      setVitals({ ecg: "", bp: "", heartRate: "", temperature: "" });
      setNotesInput("");
    } catch (err) {
      console.error("Error updating vitals:", err);
      alert("Failed to update vitals.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nurse Dashboard</h1>
      <p className="mb-2 text-gray-500">Wallet: {wallet}</p>
      <p className="mb-6 text-gray-500">Role: {role}</p>

      {role === "Nurse" ? (
        records.length === 0 ? (
          <p>No accessible records found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {records.map((rec) => (
              <Card key={`${rec.id}-${rec.patient}-${rec.doctor}`} className="shadow-md">
                <CardContent className="p-4">
                  <p><strong>Record ID:</strong> {rec.id}</p>
                  <p><strong>Patient:</strong> {rec.patientName} ({rec.patient})</p>
                  <p><strong>Doctor:</strong> {rec.doctorName} ({rec.doctor})</p>
                  <p><strong>Vitals:</strong> {rec.vitals}</p>
                  <p><strong>Prescription:</strong> {rec.prescription}</p>
                  <p><strong>Notes:</strong> {rec.notes}</p>
                  <Button 
                    className="mt-2"
                    onClick={() => setSelectedRecordId(rec.id)}
                  >
                    Update Vitals
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <p className="text-red-500">Access denied. This dashboard is for nurses only.</p>
      )}

      {role === "Nurse" && selectedRecordId !== null && (
        <div className="mt-6 border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Update Vitals for Record {selectedRecordId}</h2>
          
          <input 
            type="text"
            placeholder="ECG"
            value={vitals.ecg}
            onChange={(e) => setVitals({ ...vitals, ecg: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input 
            type="text"
            placeholder="Blood Pressure"
            value={vitals.bp}
            onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input 
            type="text"
            placeholder="Heart Rate"
            value={vitals.heartRate}
            onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input 
            type="text"
            placeholder="Temperature"
            value={vitals.temperature}
            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />

          <textarea
            placeholder="Notes (optional)"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          ></textarea>

          <Button onClick={updateVitals}>Submit Vitals Update</Button>
        </div>
      )}
    </div>
  );
}
