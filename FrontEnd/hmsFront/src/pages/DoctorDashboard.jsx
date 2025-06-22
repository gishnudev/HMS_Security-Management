import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import hospitalRecordsABI from "../abi/HospitalRecords.json";
import { Button } from "../components/Button";
import { Textarea } from "../components/textarea";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const DoctorDashboard = () => {
  const [account, setAccount] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientRecords, setSelectedPatientRecords] = useState([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showUpdateSection, setShowUpdateSection] = useState(false);
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImageHash, setUploadedImageHash] = useState("");
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorForReferral, setSelectedDoctorForReferral] = useState("");
  const recordsPerPage = 2;

  const navigate = useNavigate();

  const PINATA_API_KEY = "6961566623be7fbc663e";
  const PINATA_SECRET = "49ccd98f360549c546c49ec98fa79ab74fb6dd4ee9583b268a34d5a0034e9c1b";

  const roleMap = { 0: "None", 1: "Patient", 2: "Nurse", 3: "Doctor", 4: "Receptionist", 5: "Admin" };

  const formatTimestamp = (timestamp) => {
    const ts = Number(timestamp);
    if (!ts) return "N/A";
    return new Date(ts * 1000).toLocaleString();
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

  const fetchReferredPatients = async (c) => {
    const referred = await c.viewReferredPatients();
    const result = [];
    for (const ref of referred) {
      const record = await c.records(ref.recordId);
      const patientAddr = record.patient;
      const info = await c.patientDetails(patientAddr);
      result.push({
        address: patientAddr,
        name: info.name,
        id: info.id,
      });
    }
    setPatients(result);
  };

  const fetchPatientRecords = async (patientAddress) => {
    const recs = await contract.viewPatientRecords(patientAddress);
    const arrayRecs = recs.map((r) => ({
      id: r.id,
      patient: r.patient,
      doctor: r.doctor,
      ipfsHash: r.ipfsHash,
      prescription: r.prescription,
      notes: r.notes,
      vitals: r.vitals,
      createdAt: Number(r.createdAt),
      lastUpdated: Number(r.lastUpdated),
    }));
    setSelectedPatientRecords(arrayRecs);
    setCurrentPage(1);
  };

  const fetchAvailableDoctors = async () => {
    try {
      const doctorAddrs = await contract.viewAllDoctors();
      const details = [];
      for (const addr of doctorAddrs) {
        const [name, id, department] = await contract.getDoctorDetails(addr);
        details.push({
          address: addr,
          name,
          department
        });
      }
      setAvailableDoctors(details);
    } catch (err) {
      console.error(err);
      alert("Failed to load doctors");
    }
  };

  const handleAddMedicalRecord = async () => {
    const ipfsHash = uploadedImageHash || "";
    try {
      await contract.createMedicalRecord(
        selectedPatient.address,
        ipfsHash,
        prescription,
        notes
      );
      alert("Medical record created!");
      await fetchPatientRecords(selectedPatient.address);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error creating record");
    }
  };

  const handleUpdatePrescription = async (recordId) => {
    const ipfsHash = uploadedImageHash || selectedPatientRecords.find(r => r.id === recordId)?.ipfsHash || "";
    try {
      await contract.addPrescription(recordId, prescription, notes, ipfsHash);
      alert("Prescription updated!");
      await fetchPatientRecords(selectedPatient.address);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error updating prescription");
    }
  };

  const handleReferDoctor = async (recordId) => {
    if (!selectedDoctorForReferral) {
      alert("Please select a doctor to refer");
      return;
    }
    try {
      await contract.referAnotherDoctor(recordId, selectedDoctorForReferral);
      alert("Referral successful!");
      await fetchPatientRecords(selectedPatient.address);
    } catch (err) {
      console.error(err);
      alert("Referral failed");
    }
  };

  const resetForm = () => {
    setPrescription("");
    setNotes("");
    setUploadedImageHash("");
    setSelectedFiles([]);
    setShowAddSection(false);
    setShowUpdateSection(false);
  };

  const handleUploadImageToPinata = async () => {
    if (selectedFiles.length === 0) {
      alert("Select an image first.");
      return;
    }
    setImageUploadLoading(true);
    try {
      const hash = await uploadToIPFS(selectedFiles[0]);
      setUploadedImageHash(hash);
      alert(`Uploaded: ${hash}`);
    } catch {
      alert("Upload failed");
    }
    setImageUploadLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);
      const c = new ethers.Contract(contractAddress, hospitalRecordsABI.abi, signer);
      setContract(c);

      const role = await c.roles(addr);
      if (roleMap[Number(role)] !== "Doctor") {
        alert("Unauthorized");
        navigate("/");
        return;
      }

      await fetchReferredPatients(c);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const paginatedRecords = selectedPatientRecords.slice(indexOfFirst, indexOfLast);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Doctor Dashboard</h1>
      <p className="mb-6 text-gray-600">Connected as: <strong>{account}</strong></p>

      {loading ? <p>Loading...</p> : (
        <>
          <h2 className="text-xl font-semibold mb-2">Patients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {patients.map((p, idx) => (
              <div key={idx} className="p-4 border rounded-xl shadow cursor-pointer"
                onClick={async () => {
                  setSelectedPatient(p);
                  await fetchPatientRecords(p.address);
                  await fetchAvailableDoctors();
                  resetForm();
                }}>
                <p><strong>{p.name}</strong></p>
                <p>ID: {p.id}</p>
                <p>{p.address}</p>
              </div>
            ))}
          </div>

          {selectedPatient && (
            <>
              <h3 className="text-lg font-semibold mb-2">Records for {selectedPatient.name}</h3>

              {selectedPatientRecords.length === 0 ? (
                <div>
                  <p>No records found for this patient.</p>
                  <Button onClick={() => setShowAddSection(true)}>Add New Record</Button>
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {paginatedRecords.map((r) => (
                      <li key={r.id} className="border p-2 rounded">
                        <p>IPFS: <a href={`https://gateway.pinata.cloud/ipfs/${r.ipfsHash}`} target="_blank" rel="noopener noreferrer">{r.ipfsHash}</a></p>
                        <p>Vitals: {r.vitals || "N/A"}</p>
                        <p>Prescription: {r.prescription || "N/A"}</p>
                        <p>Notes: {r.notes || "N/A"}</p>
                        <p>Added: {formatTimestamp(r.createdAt)}</p>
                        <p>Last Updated: {formatTimestamp(r.lastUpdated)}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between mt-4">
                    <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</Button>
                    <span>Page {currentPage} of {Math.ceil(selectedPatientRecords.length / recordsPerPage)}</span>
                    <Button onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(selectedPatientRecords.length / recordsPerPage)))} disabled={currentPage === Math.ceil(selectedPatientRecords.length / recordsPerPage)}>Next</Button>
                  </div>

                  <div className="mt-4 space-x-2">
                    <Button onClick={() => setShowAddSection(true)}>Add New Record</Button>
                    <Button onClick={() => setShowUpdateSection(true)}>Update Latest Record</Button>
                  </div>

                  {selectedPatientRecords.length > 0 && (
                    <div className="border p-4 rounded mt-4 space-y-2">
                      <h4 className="font-semibold">Refer to Another Doctor</h4>
                      <select
                        className="border rounded p-2 w-full"
                        value={selectedDoctorForReferral}
                        onChange={(e) => setSelectedDoctorForReferral(e.target.value)}
                      >
                        <option value="">Select a doctor</option>
                        {availableDoctors.map((doc, idx) => (
                          <option key={idx} value={doc.address}>
                            {doc.name} - {doc.department}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={() => handleReferDoctor(selectedPatientRecords[selectedPatientRecords.length - 1].id)}
                        disabled={!selectedDoctorForReferral}
                      >
                        Refer Doctor
                      </Button>
                    </div>
                  )}
                </>
              )}

              {(showAddSection || showUpdateSection) && (
                <div className="border p-4 rounded mt-4 space-y-2">
                  <Textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Prescription" />
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
                  <input type="file" accept="image/*" onChange={(e) => setSelectedFiles(Array.from(e.target.files))} />
                  <Button onClick={handleUploadImageToPinata} disabled={imageUploadLoading}>
                    {imageUploadLoading ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Uploading...</span> : "Upload Image"}
                  </Button>
                  {uploadedImageHash && <p>✅ {uploadedImageHash}</p>}
                  {showAddSection && (
                    <Button onClick={handleAddMedicalRecord}>
                      Create Medical Record
                    </Button>
                  )}
                  {showUpdateSection && selectedPatientRecords.length > 0 && (
                    <Button onClick={() => handleUpdatePrescription(selectedPatientRecords[selectedPatientRecords.length - 1].id)}>
                      Update Latest Record
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
