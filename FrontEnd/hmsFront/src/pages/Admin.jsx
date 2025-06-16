import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import hospitalRecordsABI from "../abi/HospitalRecords.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed address

const Admin = () => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [newUserAddress, setNewUserAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("doctor");
  const [name, setName] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [txStatus, setTxStatus] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }
    const [selectedAccount] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(selectedAccount);
    setIsConnected(true);
    console.log("hi");
    
  };

  useEffect(() => {
    if (!isConnected || !account) return;

    const initContract = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const _contract = new ethers.Contract(
          contractAddress,
          hospitalRecordsABI.abi,
          signer
        );
        setContract(_contract);
        console.log('_contract',_contract);

        const role = await _contract.getRole(account);
        console.log(role);
        
        if (role === 4) {
          setIsAdmin(true);
          fetchUsers(_contract);
        } else {
          setError("❌ Access denied. You are not an admin.");
        }
      } catch (err) {
        console.error("Error loading contract:", err);
        setError("❌ Failed to load contract.");
      }
    };

    initContract();
  }, [isConnected, account]);

  const fetchUsers = async (_contract) => {
    try {
      const addresses = await _contract.getAllUsers();
      const userList = await Promise.all(
        addresses.map(async (addr) => {
          const role = await _contract.getRole(addr);
          return { address: addr, role };
        })
      );
      setUsers(userList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("❌ Failed to load users");
    }
  };

  const getRoleLabel = (value) => {
    const roleNames = ["None", "Patient", "Nurse", "Doctor", "Admin"];
    return roleNames[value] || "Unknown";
  };

  const handleAddUser = async () => {
    if (!contract || !newUserAddress || !name || !uniqueId) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setTxStatus("pending");
      let tx;

      switch (selectedRole) {
        case "doctor":
          tx = await contract.addDoctor(newUserAddress, name, uniqueId);
          break;
        case "nurse":
          tx = await contract.addNurse(newUserAddress, name, uniqueId);
          break;
        case "admin":
          tx = await contract.addAdmin(newUserAddress, name, uniqueId);
          break;
        case "patient":
          alert("❌ Admin cannot add patients. Please assign a receptionist.");
          return;
        default:
          return alert("Invalid role selected.");
      }
      

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setTxStatus("success");
        alert(`✅ ${selectedRole} added!\nTx: ${receipt.transactionHash}`);
        setNewUserAddress("");
        setName("");
        setUniqueId("");
        fetchUsers(contract);
      } else {
        setTxStatus("error");
        alert("❌ Transaction failed on-chain.");
      }
    } catch (err) {
      console.error("Error adding user:", err);
      setTxStatus("error");
      alert("❌ Failed to add user. See console.");
    }
  };

  // UI States
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">🛡️ Admin Dashboard</h1>
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-700 rounded-lg text-lg"
        >
          🔗 Connect Wallet
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">🛡️ Admin Dashboard</h1>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-700 rounded-lg"
        >
          🔄 Reload
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🛡️ Admin Dashboard</h1>

      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">➕ Add New User</h2>

        <input
          type="text"
          placeholder="Wallet Address"
          value={newUserAddress}
          onChange={(e) => setNewUserAddress(e.target.value)}
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white"
        />
        <input
          type="text"
          placeholder="Unique ID"
          value={uniqueId}
          onChange={(e) => setUniqueId(e.target.value)}
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white"
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white"
        >
          <option value="doctor">Doctor 🩺</option>
          <option value="nurse">Nurse 🩹</option>
          <option value="admin">Admin 🛡️</option>
        </select>

        <button
          onClick={handleAddUser}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
        >
          ✅ Add User
        </button>

        {/* Transaction Status Feedback */}
        {txStatus === "pending" && (
          <p className="text-yellow-400 mt-2">⏳ Transaction pending...</p>
        )}
        {txStatus === "success" && (
          <p className="text-green-500 mt-2">✅ Transaction confirmed!</p>
        )}
        {txStatus === "error" && (
          <p className="text-red-500 mt-2">❌ Transaction failed.</p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">👥 All Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.address}
            className="bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <p className="font-bold">{user.address}</p>
            <p className="text-sm text-gray-400">
              Role: {getRoleLabel(user.role)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
