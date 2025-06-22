import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import hospitalRecordsABI from "../abi/HospitalRecords.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with actual contract address

const PatientDashboard = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [records, setRecords] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [name, setName] = useState("");

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);
        const contractInstance = new ethers.Contract(
          contractAddress,
          hospitalRecordsABI.abi,
          signer
        );
        setContract(contractInstance);
        await fetchInitialData(contractInstance, userAddress);
      } else {
        alert("Please install MetaMask!");
      }
    };

    init();
  }, []);

  const fetchInitialData = async (contract, userAddress) => {
    try {
      const role = await contract.roles(userAddress);
      if (role === 1n) { // Patient role
        const patientRecords = await contract.viewPatientRecords(userAddress);
        setRecords(patientRecords);

        const patientReferrals = [];
        let index = 0;
        while (true) {
          try {
            const ref = await contract.referrals(userAddress, index);
            patientReferrals.push(ref);
            index++;
          } catch (err) {
            break;
          }
        }
        setReferrals(patientReferrals);

        // Initialize selected status per referral
        const statusMap = {};
        patientReferrals.forEach((ref, idx) => {
          statusMap[idx] = ref.status; // current status
        });
        setSelectedStatuses(statusMap);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleSelfRegister = async () => {
    if (name.trim() === "") {
      alert("Please enter your name");
      return;
    }
    const tx = await contract.selfRegister(name);
    await tx.wait();
    alert("Self-registration successful");
    await fetchInitialData(contract, account);
  };

  const handleRespondToReferral = async (index, selectedStatus) => {
    const accept = selectedStatus === 1; // 1 = Accepted
    let newDoctor = ethers.ZeroAddress;
    if (!accept) {
      const input = prompt("Enter new doctor address (or leave blank to skip):");
      if (input && ethers.isAddress(input)) {
        newDoctor = input;
      }
    }
    const tx = await contract.respondToReferral(index, accept, newDoctor);
    await tx.wait();
    alert("Response submitted");
    await fetchInitialData(contract, account);
  };

  const handleStatusChange = (idx, value) => {
    setSelectedStatuses({
      ...selectedStatuses,
      [idx]: parseInt(value)
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>
      {!account && <p>Connect your wallet to continue.</p>}
      {account && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter your name for self-registration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 mr-2"
            />
            <button
              onClick={handleSelfRegister}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Self Register
            </button>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-2">Your Records</h2>
          {records.length === 0 ? (
            <p>No records found.</p>
          ) : (
            <ul className="space-y-2">
              {records.map((rec) => (
                <li key={rec.id} className="border p-2 rounded">
                  <p><strong>Record ID:</strong> {rec.id.toString()}</p>
                  <p><strong>Doctor:</strong> {rec.doctor}</p>
                  <p><strong>Prescription:</strong> {rec.prescription}</p>
                  <p><strong>Notes:</strong> {rec.notes}</p>
                  <p><strong>Vitals:</strong> {rec.vitals}</p>
                  <p><strong>IPFS Hash:</strong> {rec.ipfsHash}</p>
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-xl font-semibold mt-6 mb-2">Your Referrals</h2>
          {referrals.length === 0 ? (
            <p>No referrals found.</p>
          ) : (
            <ul className="space-y-2">
              {referrals.map((ref, idx) => (
                <li key={idx} className="border p-2 rounded">
                  <p><strong>From:</strong> {ref.fromDoctor}</p>
                  <p><strong>To:</strong> {ref.toDoctor}</p>
                  <p><strong>Record ID:</strong> {ref.recordId.toString()}</p>
                  <p><strong>Current Status:</strong> {["Pending", "Accepted", "Rejected"][ref.status]}</p>

                  {ref.status === 0n && (
                    <div className="mt-2 space-y-2">
                      <select
                        value={selectedStatuses[idx]}
                        onChange={(e) => handleStatusChange(idx, e.target.value)}
                        className="border p-1 rounded"
                      >
                        <option value={0}>Pending</option>
                        <option value={1}>Accept</option>
                        <option value={2}>Reject</option>
                      </select>
                      <button
                        onClick={() => handleRespondToReferral(idx, selectedStatuses[idx])}
                        className="bg-blue-500 text-white p-1 rounded ml-2"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
