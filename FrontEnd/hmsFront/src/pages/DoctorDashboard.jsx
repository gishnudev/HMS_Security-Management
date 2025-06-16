import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import HospitalRecords from "../abi/HospitalRecords.json";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function DoctorDashboard() {
  const [records, setRecords] = useState([]);
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = accounts[0];
        setWallet(account);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const _contract = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);
        setContract(_contract);

        const role = await _contract.getRole(account); // Returns uint256
        console.log(role);
        

        if (Number(role) === 3) { // 2 = doctor
          setIsDoctor(true);

          const total = await _contract.recordCount();
          const fetched = [];

          for (let i = 1; i <= total; i++) {
            const r = await _contract.records(i);
            if (r.assignedDoctor.toLowerCase() === account.toLowerCase()) {
              fetched.push({
                id: r.id.toString(),
                ipfsHash: r.ipfsHash,
                patient: r.patient,
                referralPending: false, // Optional: Add referral logic
              });
            }
          }

          setRecords(fetched);
        } else {
          setError("❌ Access denied. You are not a doctor.");
        }
      } catch (err) {
        console.error("Contract load error:", err);
        setError("❌ Failed to load contract.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const referToAnotherDoctor = async (recordId) => {
    if (!contract) return;

    try {
      const toDoctor = prompt("Enter the address of the doctor:");
      if (!toDoctor || !ethers.isAddress(toDoctor)) {
        alert("Invalid address.");
        return;
      }

      const tx = await contract.referToAnotherDoctor(recordId, toDoctor);
      await tx.wait();

      alert(`✅ Referred! Tx: ${tx.hash}`);
      window.location.reload();
    } catch (err) {
      console.error("Referral error:", err);
      alert("❌ Referral failed.");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">⏳ Loading Doctor Dashboard...</div>;
  if (error) return <div className="p-6 text-red-500 font-bold">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>
      <p className="mb-6 text-gray-500">🩺 Logged in as: {wallet}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {records.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-gray-500">
              No records assigned to you.
            </CardContent>
          </Card>
        ) : (
          records.map((r) => (
            <Card key={r.id} className="shadow-md">
              <CardContent className="p-4">
                <p><strong>📁 Record ID:</strong> {r.id}</p>
                <p><strong>🔗 IPFS Hash:</strong> {r.ipfsHash}</p>
                <p><strong>👤 Patient:</strong> {r.patient}</p>

                {!r.referralPending && (
                  <Button className="mt-4" onClick={() => referToAnotherDoctor(r.id)}>
                    Refer to another doctor
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
