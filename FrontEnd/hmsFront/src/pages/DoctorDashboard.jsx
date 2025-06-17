import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import hospitalRecordsABI from "../abi/HospitalRecords.json";
import { Button } from "../components/Button";
import { Input } from "../components/input";
import { Card, CardContent } from "../components/card";
import { Textarea } from "../components/textarea";
import axios from "axios";

const DoctorDashboard = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [vitals, setVitals] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [referralDoctor, setReferralDoctor] = useState("");
  const [recordId, setRecordId] = useState(0);
  const [formData, setFormData] = useState({ file: null });
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState({ name: "", id: "" });

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  useEffect(() => {
    const load = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log(address);
        
        setAccount(address);

        const instance = new ethers.Contract(
          contractAddress,
          hospitalRecordsABI.abi,
          signer
        );
        setContract(instance);
        console.log(instance);
        

        // Get doctor details if available
        try {
          const allUsers = await instance.getAllUsers();
          const doctorPatients = [];

          for (const user of allUsers) {
            const role = await instance.getRole(user);

            // Patient = 1
            if (role == 1) {
              const assigned = await instance.assignedDoctor(user);
              if (assigned.toLowerCase() === address.toLowerCase()) {
                try {
                  const details = await instance.getPatientDetails(user);
                  console.log(details);
                  
                  if (details && details.length >= 2) {
                    doctorPatients.push({
                      address: user,
                      name: details[0],
                      id: details[1],
                    });
                  }
                } catch (err) {
                  console.warn(`Failed to get patient details for ${user}`, err);
                }
              }
            }

            // Also fetch doctor name/id if this is a doctor
            if (user.toLowerCase() === address.toLowerCase() && role == 2) {
              try {
                const docDetails = await instance.getDoctorDetails(user);
                console.log("hi",docDetails);
                
                if (docDetails && docDetails.length >= 2) {
                  setDoctorDetails({ name: docDetails[0], id: docDetails[1] });
                }
              } catch (err) {
                console.warn("Doctor details not available", err);
              }
            }
          }

          setPatients(doctorPatients);
        } catch (err) {
          console.error("Error loading contract data", err);
        }
      }
    };

    load();
  }, []);

  const handleFileUpload = async () => {
    if (!formData.file) {
      alert("Please upload a file");
      return null;
    }

    try {
      setUploading(true);
      const fileData = new FormData();
      fileData.append("file", formData.file);

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        fileData,
        {
          headers: {
            pinata_api_key: "6f28a0aae06dadd1c2ea",
            pinata_secret_api_key:
              "46bc155031365444b927538250d3476d7a81fdb5238c04b12f940af1dfbabba2",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      setFileUrl(url);
      setUploading(false);
      return ipfsHash;
    } catch (error) {
      console.error("Error uploading file to IPFS:", error);
      setUploading(false);
      alert("File upload failed. Please try again.");
      return null;
    }
  };

  const fetchRecords = async (patientAddr) => {
    if (!contract) return;

    try {
      const ids = await contract.getPatientRecords(patientAddr);

      if (ids.length === 0) {
        const ipfsHash = await handleFileUpload();
        if (!ipfsHash) return alert("Upload failed");
        const tx = await contract.addMedicalRecord(patientAddr, ipfsHash);
        await tx.wait();
      }

      const updatedIds = await contract.getPatientRecords(patientAddr);
      const recordList = await Promise.all(
        updatedIds.map(async (id) => {
          const rec = await contract.viewRecord(id);
          return { ...rec, id: id.toNumber() };
        })
      );

      setRecords(recordList);
      setSelectedPatient(patientAddr);
      setRecordId(recordList[0]?.id || 0);
    } catch (err) {
      console.error("Error fetching/creating records:", err);
    }
  };

  const updateVitals = async () => {
    if (!contract || recordId === 0) return alert("Select record");
    await contract.updateVitals(recordId, vitals);
    alert("Vitals updated");
  };

  const updatePrescription = async () => {
    if (!contract || recordId === 0) return alert("Select record");
    await contract.updatePrescription(recordId, prescription, notes);
    alert("Prescription updated");
  };

  const editRecord = async () => {
    if (!contract || recordId === 0) return alert("Select record");
    const ipfsHash = await handleFileUpload();
    if (!ipfsHash) return;
    await contract.editRecord(recordId, ipfsHash);
    alert("Record IPFS hash updated");
  };

  const referDoctor = async () => {
    if (!contract || recordId === 0) return alert("Select record");
    await contract.referToAnotherDoctor(recordId, referralDoctor);
    alert("Referred to another doctor");
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Doctor Dashboard</h2>

      {/* Doctor Info */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-xl font-bold">👨‍⚕️ Logged-in Doctor</h3>
          <p><strong>Wallet:</strong> {account}</p>
          {doctorDetails.name && (
            <>
              <p><strong>Name:</strong> {doctorDetails.name}</p>
              <p><strong>ID:</strong> {doctorDetails.id}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.map((p, idx) => (
          <Card key={idx}>
            <CardContent className="space-y-2 p-4">
              <p className="font-semibold text-lg">👤 Name: {p.name}</p>
              <p className="text-sm text-gray-600">🆔 ID: {p.id}</p>
              <Button onClick={() => fetchRecords(p.address)}>
                📄 View Medical Records
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records & Actions */}
      {records.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">📁 Patient Records</h3>
          <p className="font-bold mb-4">Selected Record ID: {recordId}</p>

          {records.map((rec, i) => (
            <Card key={i} className="mb-4">
              <CardContent className="space-y-2 p-4">
                <p><strong>ID:</strong> {rec.id}</p>
                <p>
                  <strong>IPFS:</strong>{" "}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${rec.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {rec.ipfsHash}
                  </a>
                </p>
                <p><strong>Vitals:</strong> {rec.vitals}</p>
                <p><strong>Prescription:</strong> {rec.prescription}</p>
                <p><strong>Notes:</strong> {rec.notes}</p>
                <Button onClick={() => setRecordId(rec.id)}>✏️ Select</Button>
              </CardContent>
            </Card>
          ))}

          {/* Actions */}
          <div className="space-y-4 mt-4">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, file: e.target.files[0] }))
              }
            />
            {uploading && <p className="text-blue-600">Uploading...</p>}
            {fileUrl && (
              <p className="text-green-600">
                Uploaded ✅: <a href={fileUrl}>{fileUrl}</a>
              </p>
            )}
            <Button onClick={editRecord}>🔄 Upload Image & Update IPFS</Button>

            <Textarea
              placeholder="Vitals"
              value={vitals}
              onChange={(e) => setVitals(e.target.value)}
            />
            <Button onClick={updateVitals}>💓 Update Vitals</Button>

            <Textarea
              placeholder="Prescription"
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
            />
            <Textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={updatePrescription}>📋 Update Prescription</Button>

            <Input
              placeholder="Referral Doctor Address"
              value={referralDoctor}
              onChange={(e) => setReferralDoctor(e.target.value)}
            />
            <Button onClick={referDoctor}>🔁 Refer</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
