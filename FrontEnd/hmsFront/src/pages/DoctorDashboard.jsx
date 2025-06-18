// import React, { useEffect, useState } from "react";
// import { ethers } from "ethers";
// import axios from "axios";
// import hospitalRecordsABI from "../abi/HospitalRecords.json";
// import { Button } from "../components/Button";
// import { Input } from "../components/input";
// import { Card, CardContent } from "../components/card";
// import { Textarea } from "../components/textarea";

// const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // replace with deployed address

// const DoctorDashboard = () => {
//   const [account, setAccount] = useState(null);
//   const [contract, setContract] = useState(null);
//   const [doctorPatients, setDoctorPatients] = useState([]);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [record, setRecord] = useState(null);
//   const [prescription, setPrescription] = useState("");
//   const [notes, setNotes] = useState("");
//   const [ipfsFileHash, setIpfsFileHash] = useState("");
//   const [referralDoctor, setReferralDoctor] = useState("");

//   const pinataApiKey = "6961566623be7fbc663e";
//   const pinataSecretApiKey = "49ccd98f360549c546c49ec98fa79ab74fb6dd4ee9583b268a34d5a0034e9c1b";

//   useEffect(() => {
//     const init = async () => {
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const signer = await provider.getSigner();
//       const userAddress = await signer.getAddress();
//       setAccount(userAddress);

//       const contract = new ethers.Contract(
//         contractAddress,
//         hospitalRecordsABI.abi,
//         signer
//       );
//       setContract(contract);

//       const allUsers = await contract.getAllUsers();
//       const patients = [];

//       for (const addr of allUsers) {
//         const role = await contract.getRole(addr);
//         if (role === 1n) { // Role.Patient
//           const assigned = await contract.assignedDoctor(addr);
//           if (assigned.toLowerCase() === userAddress.toLowerCase()) {
//             const [name, id] = await contract.getPatientDetails(addr);
//             patients.push({ address: addr, name, id });
//           }
//         }
//       }

//       setDoctorPatients(patients);
//     };

//     init();
//   }, []);

//   const handlePatientSelect = async (patientAddress) => {
//     setSelectedPatient(patientAddress);
//     const recordIds = await contract.getPatientRecords(patientAddress);
//     if (recordIds.length === 0) return;
//     const latestRecordId = recordIds[recordIds.length - 1];
//     const record = await contract.viewRecord(latestRecordId);
//     setRecord({ ...record, id: latestRecordId });
//     setPrescription(record.prescription);
//     setNotes(record.notes);
//   };

//   const handleUpdatePrescription = async () => {
//     await contract.updatePrescription(record.id, prescription, notes);
//     alert("Prescription updated");
//   };

//   const handleRefer = async () => {
//     await contract.referToAnotherDoctor(record.id, referralDoctor);
//     alert("Referral sent");
//   };

//   const handleFileUpload = async (e) => {
//     const file = e.target.files[0];
//     const formData = new FormData();
//     formData.append("file", file);

//     const metadata = JSON.stringify({
//       name: file.name,
//     });
//     formData.append("pinataMetadata", metadata);

//     const options = JSON.stringify({
//       cidVersion: 0,
//     });
//     formData.append("pinataOptions", options);

//     try {
//       const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
//         maxContentLength: "Infinity",
//         headers: {
//           "Content-Type": `multipart/form-data`,
//           pinata_api_key: pinataApiKey,
//           pinata_secret_api_key: pinataSecretApiKey,
//         },
//       });

//       setIpfsFileHash(res.data.IpfsHash);
//       alert("File uploaded to IPFS!");
//     } catch (err) {
//       console.error("Pinata upload error", err);
//     }
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <h2 className="text-2xl font-bold">Doctor Dashboard</h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <h3 className="text-xl font-semibold mb-2">Assigned Patients</h3>
//           {doctorPatients.length === 0 && <p>No patients assigned.</p>}
//           {doctorPatients.map((patient) => (
//             <Card key={patient.address} className="mb-2 cursor-pointer" onClick={() => handlePatientSelect(patient.address)}>
//               <CardContent>
//                 <p><strong>Name:</strong> {patient.name}</p>
//                 <p><strong>ID:</strong> {patient.id}</p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {record && (
//           <div>
//             <h3 className="text-xl font-semibold mb-2">Patient Record</h3>
//             <Card className="mb-4">
//               <CardContent>
//                 <p><strong>Vitals:</strong> {record.vitals}</p>
//                 <p><strong>Prescription:</strong> {record.prescription}</p>
//                 <p><strong>Notes:</strong> {record.notes}</p>
//                 <p><strong>Timestamp:</strong> {new Date(record.timestamp * 1000).toLocaleString()}</p>
//               </CardContent>
//             </Card>

//             <div className="space-y-2">
//               <Textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Update prescription" />
//               <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Update notes" />
//               <Button onClick={handleUpdatePrescription}>Update Prescription</Button>

//               <Input value={referralDoctor} onChange={(e) => setReferralDoctor(e.target.value)} placeholder="Refer to doctor address" />
//               <Button onClick={handleRefer}>Send Referral</Button>

//               <Input type="file" onChange={handleFileUpload} />
//               {ipfsFileHash && (
//                 <p>
//                   Uploaded to IPFS:{" "}
//                   <a href={`https://gateway.pinata.cloud/ipfs/${ipfsFileHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
//                     {ipfsFileHash}
//                   </a>
//                 </p>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DoctorDashboard;

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import hospitalRecordsABI from "../abi/HospitalRecords.json";
import { Button } from "../components/Button";
import { Input } from "../components/input";
import { Textarea } from "../components/textarea";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update to your deployed address

const DoctorDashboard = () => {
  const [account, setAccount] = useState("");
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [existingRecordImage, setExistingRecordImage] = useState(null);
  const [newRecordImage, setNewRecordImage] = useState(null);
  const [referTo, setReferTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const navigate = useNavigate();

  const PINATA_API_KEY = "6961566623be7fbc663e";
  const PINATA_SECRET = "49ccd98f360549c546c49ec98fa79ab74fb6dd4ee9583b268a34d5a0034e9c1b";

  const fetchAssignedPatients = async (contract, doctorAddress) => {
    const patients = [];
    const allUsers = await contract.getAllUsers();
    for (const user of allUsers) {
      const role = await contract.getRole(user);
      if (Number(role) === 1) {
        const assignedDoc = await contract.assignedDoctor(user);
        if (assignedDoc.toLowerCase() === doctorAddress.toLowerCase()) {
          const [name, id] = await contract.getPatientDetails(user);
          patients.push({ address: user, name, id });
        }
      }
    }
    return patients;
  };

  const fetchPatientRecords = async (patientAddress) => {
    const ids = await contract.getPatientRecords(patientAddress);
    const fullRecords = await Promise.all(
      ids.map(async (id) => {
        const r = await contract.viewRecord(id);
        return { ...r, id };
      })
    );
    setRecords(fullRecords);
  };

  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.IpfsHash;
  };

  const handleAddPrescription = async () => {
    if (!selectedPatient || records.length === 0) return;
    const latestRecord = records[records.length - 1];
    await contract.updatePrescription(latestRecord.id, prescription, notes);
    alert("Prescription updated!");
    await fetchPatientRecords(selectedPatient.address);
  };

  const handleCreateNewRecord = async () => {
    if (!selectedPatient || !newRecordImage) {
      alert("Please select a patient and upload an image.");
      return;
    }
    try {
      const ipfsHash = await uploadToIPFS(newRecordImage);
      await contract.addRecordWithPreference(ipfsHash, selectedPatient.address);
      alert("Record created successfully!");
      await fetchPatientRecords(selectedPatient.address);
      setPrescription("");
      setNotes("");
      setNewRecordImage(null);
    } catch (error) {
      console.error(error);
      alert("Failed to create record.");
    }
  };
  
  

  const handleRefer = async () => {
    if (!selectedPatient || records.length === 0 || !referTo) return;
    const latestRecord = records[records.length - 1];
    await contract.referToAnotherDoctor(latestRecord.id, referTo);
    alert("Referral sent!");
  };

  const handleUploadImageToExistingRecord = async () => {
    if (!selectedPatient || records.length === 0 || !existingRecordImage) return;
    const ipfsHash = await uploadToIPFS(existingRecordImage);
    const latestRecord = records[records.length - 1];
    await contract.editRecord(latestRecord.id, ipfsHash);
    alert("Image uploaded and record updated!");
    await fetchPatientRecords(selectedPatient.address);
    setExistingRecordImage(null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          alert("Please install MetaMask.");
          return;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);

        const contractInstance = new ethers.Contract(contractAddress, hospitalRecordsABI.abi, signer);
        setContract(contractInstance);

        const roleId = await contractInstance.getRole(userAddress);
        if (Number(roleId) !== 3) {
          alert("Unauthorized access: Doctors only");
          navigate("/");
          return;
        }

        const patients = await fetchAssignedPatients(contractInstance, userAddress);
        setAssignedPatients(patients);
        setLoading(false);
      } catch (err) {
        console.error("Init error:", err);
        alert("Error loading dashboard.");
        navigate("/");
      }
    };

    init();
  }, [navigate]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Doctor Dashboard</h1>
      <p className="mb-6 text-gray-600">Connected as: <strong>{account}</strong></p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {assignedPatients.map((patient, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-xl shadow-md cursor-pointer ${
                  selectedPatient?.address === patient.address ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onClick={async () => {
                  setSelectedPatient(patient);
                  await fetchPatientRecords(patient.address);
                }}
              >
                <p><strong>{patient.name}</strong></p>
                <p>ID: {patient.id}</p>
                <p>{patient.address}</p>
              </div>
            ))}
          </div>

          {selectedPatient && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Selected Patient: {selectedPatient.name}</h2>

              {/* Previous Records */}
              <div>
                <h3 className="font-semibold mb-2">Previous Records:</h3>
                {records.length === 0 ? (
                  <p className="text-gray-500">No records found.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-2">
                    {records.map((r, i) => (
                      <li key={i} className="border p-2 rounded">
                        <p>📦 IPFS: <a href={`https://gateway.pinata.cloud/ipfs/${r.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{r.ipfsHash}</a></p>
                        <p>Vitals: {r.vitals || "N/A"}</p>
                        <p>Prescription: {r.prescription || "N/A"}</p>
                        <p>Notes: {r.notes || "N/A"}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Update Prescription Section */}
              <div className="p-4 border rounded space-y-2">
                <h3 className="font-semibold mb-2">Update Prescription (Latest Record)</h3>
                <Textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Enter prescription..." />
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter notes..." />
                <Button onClick={handleAddPrescription} className="mt-2">Update Prescription</Button>
              </div>

              {/* Upload Image to Existing Record */}
              <div className="p-4 border rounded space-y-2">
                <h3 className="font-semibold mb-2">Upload Image to Latest Record</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setExistingRecordImage(e.target.files[0])}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {existingRecordImage && (
                  <div className="flex justify-between items-center mt-1 text-sm text-gray-700">
                    <span>{existingRecordImage.name}</span>
                    <Trash2 className="w-5 h-5 cursor-pointer text-red-500" onClick={() => setExistingRecordImage(null)} />
                  </div>
                )}
                <Button onClick={handleUploadImageToExistingRecord} className="mt-2">Upload to Existing Record</Button>
              </div>

              <div className="p-4 border rounded mt-4 bg-gray-50">
  <h3 className="font-semibold mb-2 text-lg">🆕 Create New Record</h3>
  <Textarea
    value={prescription}
    onChange={(e) => setPrescription(e.target.value)}
    placeholder="Enter prescription..."
  />
  <Textarea
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Enter notes..."
  />
  <Input
    type="file"
    accept="image/*"
    onChange={(e) => setNewRecordImage(e.target.files[0])}
    className="mt-2"
  />
  {newRecordImage && (
    <div className="mt-2 flex items-center">
      <p className="text-sm text-gray-600 truncate max-w-xs">{newRecordImage.name}</p>
      <button onClick={() => setNewRecordImage(null)} className="ml-3 text-red-600 hover:text-red-800">
        <Trash2 size={16} />
      </button>
    </div>
  )}
  <Button onClick={handleCreateNewRecord} className="mt-3">Create Record</Button>
</div>


              {/* Refer Section */}
              <div className="p-4 border rounded">
                <h3 className="font-semibold mb-2">Refer to Doctor</h3>
                <Input type="text" placeholder="Doctor wallet address" value={referTo} onChange={(e) => setReferTo(e.target.value)} />
                <Button onClick={handleRefer} className="mt-2">Send Referral</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
