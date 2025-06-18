// export default Admin;

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom"; // ✅ For redirect
import hospitalRecordsABI from "../abi/HospitalRecords.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const Admin = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const roleMap = ["None", "Patient", "Nurse", "Doctor", "Admin", "Receptionist"];
  const [formData, setFormData] = useState({
    user: "",
    name: "",
    id: "",
    role: "Doctor",
  });

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAccount(addr);

        const hospitalContract = new ethers.Contract(
          contractAddress,
          hospitalRecordsABI.abi,
          signer
        );
        setContract(hospitalContract);

        const roleId = await hospitalContract.getRole(addr);
        if (roleMap[roleId] !== "Admin") {
          alert("Unauthorized access: Admins only");
          navigate("/"); // Redirect to home or login
          return;
        }

        setIsAdmin(true);
        fetchAllUsers(hospitalContract);
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchAllUsers = async (contract) => {
    const addresses = await contract.getAllUsers();
    const data = await Promise.all(
      addresses.map(async (user) => {
        const roleId = await contract.getRole(user);
        const role = roleMap[roleId];
        let name = "", id = "";

        try {
          if (role === "Doctor") [name, id] = await contract.getDoctorDetails(user);
          else if (role === "Patient") [name, id] = await contract.getPatientDetails(user);
          else if (role === "Nurse") [name, id] = await contract.getNurseDetails(user);
          else if (role === "Admin") [name, id] = await contract.getAdminDetails(user);
          else if (role === "Receptionist") [name, id] = await contract.getReceptionistDetails(user);
        } catch (err) {
          console.warn(`Error fetching details for ${user}: ${err.message}`);
        }

        return { user, role, name, id };
      })
    );
    setUsers(data);
  };

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssignRole = async () => {
    if (!contract) return;

    const { user, name, id, role } = formData;
    try {
      if (role === "Doctor") await contract.addDoctor(user, name, id);
      else if (role === "Nurse") await contract.addNurse(user, name, id);
      else if (role === "Admin") await contract.addAdmin(user, name, id);
      else if (role === "Receptionist") await contract.addReceptionist(user, name, id);
      else return alert("Invalid role");

      alert(`${role} added successfully`);
      fetchAllUsers(contract);
    } catch (err) {
      alert("Transaction failed: " + err.message);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!isAdmin) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-2">Connected account: <span className="font-mono">{account}</span></p>

      <div className="border p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Assign Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="user"
            value={formData.user}
            onChange={handleInput}
            placeholder="User Address"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInput}
            placeholder="Name"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleInput}
            placeholder="ID"
            className="border p-2 rounded"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleInput}
            className="border p-2 rounded"
          >
            <option>Doctor</option>
            <option>Nurse</option>
            <option>Admin</option>
            <option>Receptionist</option>
          </select>
        </div>
        <button
          onClick={handleAssignRole}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Assign Role
        </button>
      </div>

      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userObj, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border font-mono text-xs">{userObj.user}</td>
                <td className="p-2 border">{userObj.role}</td>
                <td className="p-2 border">{userObj.name}</td>
                <td className="p-2 border">{userObj.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
