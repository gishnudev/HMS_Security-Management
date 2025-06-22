import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import hospitalRecordsABI from "../abi/HospitalRecords.json";
import UpdateButton from "../components/UpdateButton";
import DeleteButton from "../components/DeleteButton";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const Admin = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const roleMap = ["None", "Patient", "Nurse", "Doctor", "Receptionist", "Admin"];

  const [formData, setFormData] = useState({
    user: "",
    name: "",
    id: "",
    department: "",
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

        const roleId = await hospitalContract.roles(addr);
        if (roleMap[roleId] !== "Admin") {
          alert("Unauthorized access: Admins only");
          navigate("/");
          return;
        }

        setIsAdmin(true);
        await fetchAllUsers(hospitalContract);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const fetchAllUsers = async (contract) => {
    const [admins, doctors, nurses, receptionists] = await contract.viewAllStaff();
    const addresses = [...admins, ...doctors, ...nurses, ...receptionists];
  
    const uniqueUsers = new Map();  // Address => userObj
  
    for (const user of addresses) {
      if (uniqueUsers.has(user)) continue; // Skip if already processed
  
      const roleId = await contract.roles(user);
      const role = roleMap[roleId];
  
      let name = "", id = "", department = "";
  
      try {
        if (role === "Doctor") {
          const info = await contract.doctorDetails(user);
          name = info.name;
          id = info.id;
          department = info.department;
        } else if (role === "Nurse") {
          const info = await contract.nurseDetails(user);
          name = info.name;
          id = info.id;
        } else if (role === "Receptionist") {
          const info = await contract.receptionistDetails(user);
          name = info.name;
          id = info.id;
        } else if (role === "Admin") {
          const info = await contract.adminDetails(user);
          name = info.name;
          id = info.id;
        }
      } catch (err) {
        console.warn(`Error fetching details for ${user}: ${err.message}`);
      }
  
      uniqueUsers.set(user, { user, role, name, id, department });
    }
  
    // Convert back to array
    setUsers(Array.from(uniqueUsers.values()));
  };
  

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssignRole = async () => {
    if (!contract) return;

    const { user, name, id, department, role } = formData;

    try {
      if (role === "Doctor") {
        await contract.addDoctor(user, name, id, department);
      } else if (role === "Nurse") {
        await contract.addNurse(user, name, id);
      } else if (role === "Receptionist") {
        await contract.addReceptionist(user, name, id);
      } else if (role === "Admin") {
        await contract.addAdmin(user);
      } else {
        return alert("Invalid role");
      }

      alert(`${role} added successfully`);
      await fetchAllUsers(contract);
    } catch (err) {
      alert("Transaction failed: " + err.message);
    }
  };

  const handleUpdateUser = async (userObj) => {
    try {
      if (userObj.role === "Doctor") {
        const name = prompt("Enter new name:", userObj.name);
        const id = prompt("Enter new ID:", userObj.id);
        const department = prompt("Enter new department:", userObj.department);
        if (name && id && department) {
          await contract.updateDoctor(userObj.user, name, id, department);
          alert("Doctor updated successfully");
        }
      }
      await fetchAllUsers(contract);
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const handleDeleteUser = async (userAddr, role) => {
    try {
      if (role === "Doctor") {
        await contract.removeDoctor(userAddr);
      } else if (role === "Nurse") {
        await contract.removeNurse(userAddr);
      } else if (role === "Receptionist") {
        await contract.removeReceptionist(userAddr);
      } else {
        alert("Delete not supported for this role");
        return;
      }
      alert(`${role} removed successfully`);
      await fetchAllUsers(contract);
    } catch (err) {
      alert("Delete failed: " + err.message);
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
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleInput}
            placeholder="Department (for Doctor)"
            className="border p-2 rounded"
            disabled={formData.role !== "Doctor"}
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleInput}
            className="border p-2 rounded"
          >
            <option>Doctor</option>
            <option>Nurse</option>
            <option>Receptionist</option>
            <option>Admin</option>
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
        <h2 className="text-xl font-semibold mb-4">All Staff</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border font-mono text-xs">{u.user}</td>
                <td className="p-2 border">{u.role}</td>
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.id}</td>
                <td className="p-2 border">{u.department}</td>
                <td className="p-2 border">
                  {u.role === "None" ? (
                    <span className="text-gray-400 italic">Removed</span>
                  ) : u.role === "Admin" && idx === 0 ? (
                    <span className="text-gray-400 italic">Main Admin</span>
                  ) : (
                    <>
                      <UpdateButton userObj={u} onUpdate={handleUpdateUser} />
                      <DeleteButton userObj={u} onDelete={handleDeleteUser} />
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
