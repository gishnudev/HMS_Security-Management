import React, { useState } from "react";
import { ethers } from "ethers";
import { Button } from "../components/button";
import HospitalRecords from "../abi/HospitalRecords.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function RegisterRecord() {
  const [ipfsHash, setIpfsHash] = useState('');
  const [preferredDoctor, setPreferredDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submitRecord = async () => {
    if (!ipfsHash.trim()) {
      setMessage("⚠️ IPFS hash is required.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      if (!window.ethereum) throw new Error("MetaMask not detected.");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);

      const doctorAddress = preferredDoctor.trim() || ethers.ZeroAddress;
      const tx = await contract.addRecordWithPreference(ipfsHash.trim(), doctorAddress);
      await tx.wait();

      setMessage("✅ Record submitted successfully!");
      setIpfsHash("");
      setPreferredDoctor("");
    } catch (err) {
      console.error("Transaction error:", err);
      setMessage("❌ Error submitting record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Register Medical Record</h2>

      <input
        type="text"
        value={ipfsHash}
        onChange={(e) => setIpfsHash(e.target.value)}
        placeholder="IPFS Hash"
        className="border border-gray-300 p-2 w-full rounded mb-3"
      />

      <input
        type="text"
        value={preferredDoctor}
        onChange={(e) => setPreferredDoctor(e.target.value)}
        placeholder="Preferred Doctor (optional)"
        className="border border-gray-300 p-2 w-full rounded mb-3"
      />

      <Button
        onClick={submitRecord}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Submitting..." : "Submit"}
      </Button>

      {message && (
        <p className="mt-4 text-sm text-center text-gray-700">{message}</p>
      )}
    </div>
  );
}
