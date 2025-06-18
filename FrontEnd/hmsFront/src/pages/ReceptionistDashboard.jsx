// import { useEffect, useState } from "react";
// import { ethers } from "ethers";
// import { useNavigate } from "react-router-dom";
// import HospitalRecords from "../abi/HospitalRecords.json";
// import { Button } from "../components/button";
// import { Card, CardContent } from "../components/card";
// import Input from "../components/Input";

// const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// export default function ReceptionistDashboard() {
//   const [wallet, setWallet] = useState("");
//   const [contract, setContract] = useState(null);
//   const [isReceptionist, setIsReceptionist] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [patients, setPatients] = useState([]);
//   const [name, setName] = useState("");
//   const [patientId, setPatientId] = useState("");
//   const [patientAddress, setPatientAddress] = useState("");

//   const navigate = useNavigate();

//   useEffect(() => {
//     const init = async () => {
//       if (!window.ethereum) {
//         alert("Please install MetaMask.");
//         return;
//       }

//       try {
//         const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
//         const address = accounts[0];
//         setWallet(address);
//         localStorage.setItem("walletAddress", address);

//         const provider = new ethers.BrowserProvider(window.ethereum);
//         const signer = await provider.getSigner();
//         const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);
//         setContract(contractInstance);

//         const role = await contractInstance.getRole(address);

//         if (Number(role) !== 5) {
//           setError("❌ Access denied. You are not a receptionist.");
//           return;
//         }

//         setIsReceptionist(true);

//         const users = await contractInstance.getAllUsers();
//         const patientData = [];

//         for (const user of users) {
//           const userRole = await contractInstance.getRole(user);
//           if (Number(userRole) === 1) {
//             const [pname, pid] = await contractInstance.getPatientDetails(user);
//             patientData.push({ address: user, name: pname, id: pid });
//           }
//         }

//         setPatients(patientData);
//       } catch (err) {
//         console.error("Error loading receptionist dashboard:", err);
//         setError("❌ Failed to load receptionist dashboard.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     init();
//   }, [navigate]);

//   const handleAddPatient = async () => {
//     if (!name || !patientId || !patientAddress) {
//       alert("Please enter all patient details.");
//       return;
//     }

//     if (wallet.toLowerCase() === patientAddress.toLowerCase()) {
//       alert("Receptionist cannot register themselves as a patient.");
//       return;
//     }

//     try {
//       const tx = await contract.addPatient(patientAddress, name, patientId);
//       await tx.wait();
//       alert("✅ Patient added successfully!");
//       window.location.reload();
//     } catch (err) {
//       console.error("Error adding patient:", err);
//       alert("Failed to add patient.");
//     }
//   };

//   if (loading) return <div className="p-6 text-gray-500">⏳ Loading Receptionist Dashboard...</div>;
//   if (error) return <div className="p-6 text-red-500 font-bold">{error}</div>;

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Receptionist Dashboard</h1>
//       <p className="mb-6 text-gray-500">👛 Wallet: {wallet}</p>

//       <div className="mb-6">
//         <h2 className="text-lg font-semibold mb-2">➕ Add New Patient</h2>
//         <div className="flex flex-col md:flex-row gap-2">
//           <Input
//             placeholder="Patient Wallet Address"
//             value={patientAddress}
//             onChange={(e) => setPatientAddress(e.target.value)}
//           />
//           <Input
//             placeholder="Patient Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />
//           <Input
//             placeholder="Patient ID"
//             value={patientId}
//             onChange={(e) => setPatientId(e.target.value)}
//           />
//           <Button onClick={handleAddPatient}>Add Patient</Button>
//         </div>
//       </div>

//       <h2 className="text-lg font-semibold mb-2">📋 Registered Patients</h2>
//       {patients.length === 0 ? (
//         <Card><CardContent className="p-4">No patients found.</CardContent></Card>
//       ) : (
//         <div className="grid gap-4 md:grid-cols-2">
//           {patients.map((p, index) => (
//             <Card key={index}>
//               <CardContent className="p-4">
//                 <p><strong>👤 Name:</strong> {p.name}</p>
//                 <p><strong>🆔 Patient ID:</strong> {p.id}</p>
//                 <p><strong>🔗 Address:</strong> {p.address}</p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import hospitalRecordsABI from "../abi/HospitalRecords.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with actual address

const ReceptionistDashboard = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReceptionist, setIsReceptionist] = useState(false);

  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [wallet, setWallet] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const c = new ethers.Contract(contractAddress, hospitalRecordsABI.abi, signer);

      setAccount(addr);
      setContract(c);

      const role = await c.getRole(addr);

      if (role == 5) { // Role.Receptionist
        setIsReceptionist(true);

        // Load doctors
        const doctorCount = await c.getDoctorCount();
        const dlist = [];
        for (let i = 0; i < doctorCount; i++) {
          const dAddr = await c.getDoctorByIndex(i);
          const [docName, docId] = await c.getDoctorDetails(dAddr);
          dlist.push({ address: dAddr, name: docName, id: docId });
        }
        setDoctors(dlist);

        // Load patients
        const allUsers = await c.getAllUsers();
        const pList = [];
        for (const user of allUsers) {
          const role = await c.getRole(user);
          if (role == 1) {
            const [pname, pid] = await c.getPatientDetails(user);
            pList.push({ address: user, name: pname, id: pid });
          }
        }
        setPatients(pList);
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleAddPatient = async () => {
    try {
      const tx = await contract.addPatient(wallet, name, id);
      await tx.wait();
      alert("Patient added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add patient.");
    }
  };

  const handleAddPatientWithDoctor = async () => {
    try {
      const tx = await contract.addPatientWithDoctor(wallet, name, id, selectedDoctor);
      await tx.wait();
      alert("Patient with doctor assigned successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add patient with doctor.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Checking access...
      </div>
    );
  }

  if (!isReceptionist) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        ❌ Access Denied: You are not authorized to view this page.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Receptionist Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Connected as: {account}</p>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Register New Patient</h2>
        <input
          className="block w-full border p-2 mb-2"
          type="text"
          placeholder="Patient Wallet Address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
        />
        <input
          className="block w-full border p-2 mb-2"
          type="text"
          placeholder="Patient Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="block w-full border p-2 mb-2"
          type="text"
          placeholder="Patient ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        <button
          onClick={handleAddPatient}
          className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
        >
          Register Without Doctor
        </button>
        
        <select
          className="block mt-4 border p-2 w-full"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
        >
          <option value="">-- Assign Doctor (Optional) --</option>
          {doctors.map((doc) => (
            <option key={doc.address} value={doc.address}>
              {doc.name} ({doc.id})
            </option>
          ))}
        </select>

        <button
          onClick={handleAddPatientWithDoctor}
          className="bg-green-600 text-white px-4 py-2 rounded mt-2"
        >
          Register With Doctor
        </button>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Registered Patients</h2>
        {patients.length === 0 ? (
          <p>No patients found.</p>
        ) : (
          <ul className="list-disc list-inside">
            {patients.map((p) => (
              <li key={p.address}>
                {p.name} ({p.id}) - {p.address}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
