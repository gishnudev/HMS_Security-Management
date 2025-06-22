import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import hospitalRecordsABI from "../abi/HospitalRecords.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const roleMap = {
  0: "None",
  1: "Patient",
  2: "Nurse",
  3: "Doctor",
  4: "Receptionist",
  5: "Admin"
};

const ReceptionistDashboard = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleId, setRoleId] = useState(0); // default to None

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");

  const [searchAddress, setSearchAddress] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return alert("Please connect MetaMask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const c = new ethers.Contract(contractAddress, hospitalRecordsABI.abi, signer);

      setAccount(addr);
      setContract(c);

      const fetchedRoleId = await c.roles(addr);
      console.log();
      
      setRoleId(Number(fetchedRoleId));

      if (Number(fetchedRoleId) === 4) {
        await fetchAllPatients(c);
        await fetchAllDoctors(c);
      }

      setLoading(false);
    };

    init();
  }, []);

  const fetchAllDoctors = async (c) => {
    try {
      const doctorAddrs = await c.viewAllDoctors();  // Call returns a single array
      const docList = [];
      for (const addr of doctorAddrs) {
        const info = await c.doctorDetails(addr);
        docList.push({
          address: addr,
          name: info.name,
          id: info.id,
          department: info.department
        });
      }
      setDoctors(docList);
      console.log(docList);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };
  
  
  const fetchAllPatients = async (c) => {
    try {
      const patientAddrs = await c.viewAllPatients();
      const plist = [];
      for (const addr of patientAddrs) {
        const info = await c.patientDetails(addr);
        plist.push({ address: addr, ...info });
      }
      setPatients(plist);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const handleRegister = async () => {
    try {
      const tx = await contract.registerPatient(
        wallet,
        name,
        id,
        parseInt(age),
        gender,
        contact,
        selectedDoctor || ethers.ZeroAddress
      );
      await tx.wait();
      alert("Patient registered successfully");
      await fetchAllPatients(contract);
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  };

  const handleUpdate = async () => {
    try {
      const tx = await contract.updatePatientDetails(
        wallet,
        name,
        id,
        parseInt(age),
        gender,
        contact
      );
      await tx.wait();
      alert("Patient updated");
      await fetchAllPatients(contract);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const handleRefer = async (pAddr, dAddr) => {
    try {
      const tx = await contract.referPatient(pAddr, dAddr);
      await tx.wait();
      alert("Referral successful");
    } catch (err) {
      console.error(err);
      alert("Referral failed");
    }
  };

  const handleSearch = async () => {
    try {
      const data = await contract.searchPatient(searchAddress);
      setSearchResult(data);
    } catch (err) {
      console.error(err);
      alert("Search failed");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (roleId !== 4)
    return (
      <div className="p-6 text-red-600">
        ❌ Access Denied. This page is for Receptionist only. Your role: {roleMap[roleId]}
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Receptionist Dashboard</h1>
      <p className="text-gray-500 mb-4">Connected: {account} ({roleMap[roleId]})</p>
      {/* --- Patient registration/update form --- */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Register / Update Patient</h2>
        <input className="w-full border p-2 mb-2" placeholder="Wallet" value={wallet} onChange={e => setWallet(e.target.value)} />
        <input className="w-full border p-2 mb-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border p-2 mb-2" placeholder="ID" value={id} onChange={e => setId(e.target.value)} />
        <input className="w-full border p-2 mb-2" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} />
        <input className="w-full border p-2 mb-2" placeholder="Gender" value={gender} onChange={e => setGender(e.target.value)} />
        <input className="w-full border p-2 mb-2" placeholder="Contact" value={contact} onChange={e => setContact(e.target.value)} />

        <select className="w-full border p-2 mb-2" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
          <option value="">-- Assign Doctor --</option>
          {doctors.map(d => (
            <option key={d.address} value={d.address}>
              {d.name} ({d.id}) - {d.department}
            </option>
          ))}
        </select>

        <div>
          <button onClick={handleRegister} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">Register</button>
          <button onClick={handleUpdate} className="bg-yellow-600 text-white px-4 py-2 rounded">Update</button>
        </div>
      </div>

      {/* --- Patient search --- */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Search Patient</h2>
        <input className="w-full border p-2 mb-2" placeholder="Patient Address" value={searchAddress} onChange={e => setSearchAddress(e.target.value)} />
        <button onClick={handleSearch} className="bg-green-600 text-white px-4 py-2 rounded">Search</button>
        {searchResult && (
          <div className="mt-2 p-2 border rounded">
            <p><strong>Name:</strong> {searchResult[0]}</p>
            <p><strong>ID:</strong> {searchResult[1]}</p>
            <p><strong>Age:</strong> {searchResult[2].toString()}</p>
            <p><strong>Gender:</strong> {searchResult[3]}</p>
            <p><strong>Contact:</strong> {searchResult[4]}</p>
            <p><strong>Records:</strong> {searchResult[5].length}</p>
          </div>
        )}
      </div>

      {/* --- List of patients + refer --- */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Registered Patients</h2>
        {patients.length === 0 ? (
          <p>No patients found.</p>
        ) : (
          <ul className="list-disc pl-5">
            {patients.map(p => (
              <li key={p.address}>
                {p.name} ({p.id}) - {p.address}
                <select className="border p-1 ml-2" onChange={e => handleRefer(p.address, e.target.value)}>
                  <option value="">-- Refer to Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.address} value={d.address}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
