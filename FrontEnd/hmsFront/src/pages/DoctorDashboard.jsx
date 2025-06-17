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
        setAccount(address);

        const instance = new ethers.Contract(
          contractAddress,
          hospitalRecordsABI.abi,
          signer
        );
        setContract(instance);
        console.log(instance);
        

        try {
          const allUsers = await instance.getAllUsers();
          console.log("getAllUsers",allUsers);
          
          const doctorPatients = [];

          for (const user of allUsers) {
            const role = await instance.getRole(user);
            console.log('role',role);
            

            if (role == 1) {
              const assigned = await instance.assignedDoctor(user);
              console.log("assigned",assigned);
              
              if (assigned.toLowerCase() === address.toLowerCase()) {
                const details = await instance.getPatientDetails(user);
                console.log("details",details);
                
                if (details && details.length >= 2) {
                  doctorPatients.push({
                    address: user,
                    name: details[0],
                    id: details[1],
                  });
                }
              }
            }

            if (user.toLowerCase() == address.toLowerCase() && role == 2) {
              const docDetails = await instance.getDoctorDetails(user);
              console.log("hi",docDetails);
              
              if (docDetails && docDetails.length >= 2) {
                setDoctorDetails({ name: docDetails[0], id: docDetails[1] });
              }
            }
          }

          setPatients(doctorPatients);
        } catch (err) {
          console.error("Error loading data", err);
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
      console.error("Error uploading file:", error);
      setUploading(false);
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
      console.error("Error fetching records:", err);
    }
  };

  const updateVitals = async () => {
    if (!contract || recordId === 0) return;
    await contract.updateVitals(recordId, vitals);
    alert("Vitals updated");
  };

  const updatePrescription = async () => {
    if (!contract || recordId === 0) return;
    await contract.updatePrescription(recordId, prescription, notes);
    alert("Prescription updated");
  };

  const editRecord = async () => {
    if (!contract || recordId === 0) return;
    const ipfsHash = await handleFileUpload();
    if (!ipfsHash) return;
    await contract.editRecord(recordId, ipfsHash);
    alert("Record image updated on IPFS");
  };

  const referDoctor = async () => {
    if (!contract || recordId === 0) return;
    await contract.referToAnotherDoctor(recordId, referralDoctor);
    alert("Patient referred successfully");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Logged-in Doctor Info */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-2xl font-bold">👨‍⚕️ Doctor Details</h2>
          <p><strong>Metamask ID:</strong> {account}</p>
          {doctorDetails.name && (
            <>
              <p><strong>Name:</strong> {doctorDetails.name}</p>
              <p><strong>ID:</strong> {doctorDetails.id}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Patient List */}
      <div>
        <h3 className="text-xl font-bold mb-2">📋 Assigned Patients</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {patients.map((p, idx) => (
            <Card key={idx}>
              <CardContent className="space-y-2 p-4">
                <p className="font-semibold">👤 Name: {p.name}</p>
                <p className="text-gray-600">🆔 ID: {p.id}</p>
                <Button onClick={() => fetchRecords(p.address)}>
                  📄 Select Patient
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Patient Data Section */}
      {selectedPatient && (
        <div>
          <h3 className="text-xl font-bold mt-4 mb-2">📁 Patient Data Upload</h3>
          <p className="font-medium mb-2">Record ID: {recordId}</p>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
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
              <Button onClick={editRecord}>🖼️ Upload ECG/X-Ray Image</Button>
            </div>

            {/* Vitals Input */}
            <div>
              <Textarea
                placeholder="Enter Vitals"
                value={vitals}
                onChange={(e) => setVitals(e.target.value)}
              />
              <Button onClick={updateVitals}>💓 Update Vitals</Button>
            </div>

            {/* Prescription Input */}
            <div>
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
            </div>

            {/* Refer Another Doctor */}
            <div>
              <Input
                placeholder="Referral Doctor Wallet Address"
                value={referralDoctor}
                onChange={(e) => setReferralDoctor(e.target.value)}
              />
              <Button onClick={referDoctor}>🔁 Refer to Another Doctor</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
