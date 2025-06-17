// src/pages/Record.jsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "../components/card.jsx";
import { Button } from "../components/Button";
import { ethers } from "ethers";
import HospitalRecords from "../abi/HospitalRecords.json"; // make sure ABI path is correct

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function Record() {
  const { recordId } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      try {
        setLoading(true);

        if (!window.ethereum) return alert("Please install MetaMask");

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);

        // Smart contract call using recordId
        const data = await contract.getRecord(recordId);

        setRecord({
          id: recordId,
          patientName: data.name,
          ipfsHash: data.ipfsHash,
          assignedDoctor: data.doctor,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          referralPending: data.referralPending,
        });
      } catch (error) {
        console.error("Error fetching record:", error);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [recordId]);

  if (loading) return <p className="p-6">Loading record...</p>;

  if (!record)
    return <p className="p-6 text-red-500">Record not found or error occurred.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Record Details - ID {record.id}</h1>
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-3">
          <p><strong>Patient Name:</strong> {record.patientName}</p>
          <p><strong>IPFS Hash:</strong> {record.ipfsHash}</p>
          <p><strong>Assigned Doctor:</strong> {record.assignedDoctor}</p>
          <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
          <p><strong>Treatment:</strong> {record.treatment}</p>
          <p>
            <strong>Referral Status:</strong>{" "}
            {record.referralPending ? (
              <span className="text-red-600 font-semibold">Pending</span>
            ) : (
              <span className="text-green-600">None</span>
            )}
          </p>

          <div className="mt-4">
            <Button onClick={() => alert("Edit feature coming soon!")}>Edit Record</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
