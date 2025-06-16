// import { useEffect, useState } from "react";
// import { ethers } from "ethers";
// import { useNavigate } from "react-router-dom";
// import HospitalRecords from "../abi/HospitalRecords.json";
// import { Button } from "../components/button";
// import { Card, CardContent } from "../components/card";

// const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// export default function PatientDashboard() {
//   const [wallet, setWallet] = useState("");
//   const [records, setRecords] = useState([]);
//   const [referrals, setReferrals] = useState([]);
//   const [contract, setContract] = useState(null);
//   const [isPatient, setIsPatient] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
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

//         if (Number(role) !== 1) {
//           setError("❌ Access denied. You are not a patient.");
//           return;
//         }

//         setIsPatient(true);

//         // Fetch patient records
//         const recordIds = await contractInstance.getPatientRecords(address);
//         const recordsData = [];

//         for (const id of recordIds) {
//           const record = await contractInstance.records(id);
//           recordsData.push({
//             id: record.id.toString(),
//             ipfsHash: record.ipfsHash,
//             assignedDoctor: record.assignedDoctor,
//           });
//         }

//         setRecords(recordsData);

//         // Fetch patient referrals
//         const referralList = await contractInstance.getMyReferrals();
//         const pendingReferrals = referralList
//           .filter((r) => r.status === 0) // 0 = Pending
//           .map((r) => ({
//             fromDoctor: r.fromDoctor,
//             toDoctor: r.toDoctor,
//             recordId: r.recordId.toString(),
//             status: r.status,
//           }));

//         setReferrals(pendingReferrals);
//       } catch (err) {
//         console.error("Error loading patient dashboard:", err);
//         setError("❌ Failed to load patient dashboard.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     init();
//   }, [navigate]);

//   const handleReferralResponse = async (index, accept) => {
//     try {
//       const tx = await contract.respondToReferral(index, accept);
//       await tx.wait();
//       alert(`Referral ${accept ? "accepted" : "rejected"} ✅`);
//       window.location.reload();
//     } catch (err) {
//       console.error("Error responding to referral:", err);
//       alert("Failed to respond to referral.");
//     }
//   };

//   if (loading) return <div className="p-6 text-gray-500">⏳ Loading Patient Dashboard...</div>;
//   if (error) return <div className="p-6 text-red-500 font-bold">{error}</div>;

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>
//       <p className="mb-6 text-gray-500">👛 Wallet: {wallet}</p>

//       <div className="grid gap-4 md:grid-cols-2">
//         {records.length === 0 ? (
//           <Card><CardContent className="p-4">No medical records found.</CardContent></Card>
//         ) : (
//           records.map((record) => {
//             const referral = referrals.find((r) => r.recordId === record.id);
//             const referralIndex = referrals.findIndex((r) => r.recordId === record.id);

//             return (
//               <Card key={record.id} className="shadow-md">
//                 <CardContent className="p-4">
//                   <p><strong>🆔 Record ID:</strong> {record.id}</p>
//                   <p><strong>🔗 IPFS Hash:</strong> {record.ipfsHash}</p>
//                   <p><strong>🩺 Assigned Doctor:</strong> {record.assignedDoctor}</p>

//                   {referral && (
//                     <>
//                       <p className="text-red-500 mt-2">📨 Referral Pending!</p>
//                       <div className="mt-4 flex gap-2">
//                         <Button onClick={() => handleReferralResponse(referralIndex, true)}>Accept</Button>
//                         <Button variant="outline" onClick={() => handleReferralResponse(referralIndex, false)}>Reject</Button>
//                       </div>
//                     </>
//                   )}
//                 </CardContent>
//               </Card>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import HospitalRecords from "../abi/HospitalRecords.json";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function PatientDashboard() {
  const [wallet, setWallet] = useState("");
  const [records, setRecords] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [contract, setContract] = useState(null);
  const [isPatient, setIsPatient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newHash, setNewHash] = useState("");
  const [preferredDoctor, setPreferredDoctor] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const address = accounts[0];
        setWallet(address);
        localStorage.setItem("walletAddress", address);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, HospitalRecords.abi, signer);
        setContract(contractInstance);

        const role = await contractInstance.getRole(address);

        if (Number(role) !== 1) {
          setError("❌ Access denied. You are not a patient.");
          return;
        }

        setIsPatient(true);
        await loadRecords(contractInstance, address);
        await loadReferrals(contractInstance);
        await loadDoctors(contractInstance);
      } catch (err) {
        console.error("Error loading patient dashboard:", err);
        setError("❌ Failed to load patient dashboard.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const loadRecords = async (contractInstance, address) => {
    const recordIds = await contractInstance.getPatientRecords(address);
    const recordsData = [];

    for (const id of recordIds) {
      const record = await contractInstance.records(id);
      recordsData.push({
        id: record.id.toString(),
        ipfsHash: record.ipfsHash,
        assignedDoctor: record.assignedDoctor,
      });
    }

    setRecords(recordsData);
  };

  const loadReferrals = async (contractInstance) => {
    const referralList = await contractInstance.getMyReferrals();
    const pendingReferrals = referralList
      .filter((r) => r.status === 0)
      .map((r) => ({
        fromDoctor: r.fromDoctor,
        toDoctor: r.toDoctor,
        recordId: r.recordId.toString(),
        status: r.status,
      }));

    setReferrals(pendingReferrals);
  };

  const loadDoctors = async (contractInstance) => {
    const count = await contractInstance.getDoctorCount();
    const doctorList = [];

    for (let i = 0; i < count; i++) {
      const addr = await contractInstance.doctorList(i);
      doctorList.push(addr);
    }

    setDoctors(doctorList);
  };

  const handleReferralResponse = async (index, accept) => {
    try {
      const tx = await contract.respondToReferral(index, accept);
      await tx.wait();
      alert(`Referral ${accept ? "accepted" : "rejected"} ✅`);
      await loadRecords(contract, wallet);
      await loadReferrals(contract);
    } catch (err) {
      console.error("Error responding to referral:", err);
      alert("Failed to respond to referral.");
    }
  };

  const handleAddRecord = async () => {
    if (!newHash) return alert("Please enter IPFS hash");
    try {
      const tx = await contract.addRecordWithPreference(newHash, preferredDoctor || ethers.ZeroAddress);
      await tx.wait();
      alert("✅ Record added successfully!");
      setNewHash("");
      setPreferredDoctor("");
      await loadRecords(contract, wallet);
    } catch (err) {
      console.error("Error adding record:", err);
      alert("Failed to add record.");
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      const tx = await contract.completePatientRegistration(wallet, name, id);
      await tx.wait();
      alert("✅ Registration completed!");
    } catch (err) {
      console.error("Error completing registration:", err);
      alert("Failed to complete registration.");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">⏳ Loading Patient Dashboard...</div>;
  if (error) return <div className="p-6 text-red-500 font-bold">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>
      <p className="mb-4 text-gray-500">👛 Wallet: {wallet}</p>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">➕ Add Medical Record</h2>
        <input
          type="text"
          placeholder="Enter IPFS Hash"
          className="border p-2 mr-2 rounded"
          value={newHash}
          onChange={(e) => setNewHash(e.target.value)}
        />
        <select
          className="border p-2 mr-2 rounded"
          value={preferredDoctor}
          onChange={(e) => setPreferredDoctor(e.target.value)}
        >
          <option value="">Auto Assign Doctor</option>
          {doctors.map((doc, idx) => (
            <option key={idx} value={doc}>
              {doc}
            </option>
          ))}
        </select>
        <Button onClick={handleAddRecord}>Upload Record</Button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">📝 Complete Registration</h2>
        <input
          type="text"
          placeholder="Enter Name"
          className="border p-2 mr-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Patient ID"
          className="border p-2 mr-2 rounded"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <Button variant="outline" onClick={handleCompleteRegistration}>
          Complete Info
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {records.length === 0 ? (
          <Card>
            <CardContent className="p-4">No medical records found.</CardContent>
          </Card>
        ) : (
          records.map((record) => {
            const referral = referrals.find((r) => r.recordId === record.id);
            const referralIndex = referrals.findIndex((r) => r.recordId === record.id);

            return (
              <Card key={record.id} className="shadow-md">
                <CardContent className="p-4">
                  <p><strong>🆔 Record ID:</strong> {record.id}</p>
                  <p><strong>🔗 IPFS Hash:</strong> {record.ipfsHash}</p>
                  <p><strong>🩺 Assigned Doctor:</strong> {record.assignedDoctor}</p>

                  {referral && (
                    <>
                      <p className="text-red-500 mt-2">📨 Referral Pending!</p>
                      <div className="mt-4 flex gap-2">
                        <Button onClick={() => handleReferralResponse(referralIndex, true)}>Accept</Button>
                        <Button variant="outline" onClick={() => handleReferralResponse(referralIndex, false)}>Reject</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
