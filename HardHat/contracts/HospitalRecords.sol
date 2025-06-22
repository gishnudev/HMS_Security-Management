// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract HospitalRecords {
    enum Role { None, Patient, Nurse, Doctor, Receptionist, Admin }
    enum ReferralStatus { Pending, Accepted, Rejected }

    struct DoctorInfo {
        string name;
        string id;
        string department;
    }

    struct NurseInfo {
        string name;
        string id;
    }

    struct ReceptionistInfo {
        string name;
        string id;
    }

    struct PatientInfo {
        string name;
        string id;
        uint age;
        string gender;
        string contact;
    }

    struct Record {
        uint32 id;
        address patient;
        address doctor;
        string ipfsHash;
        string prescription;
        string notes;
        string vitals;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    struct Referral {
        address fromDoctor;
        address toDoctor;
        uint32 recordId;
        ReferralStatus status;
    }

    uint32 public recordCount;

    mapping(address => PatientInfo) public patientDetails;
    mapping(address => Role) public roles;
    mapping(address => DoctorInfo) public doctorDetails;
    mapping(address => NurseInfo) public nurseDetails;
    mapping(address => ReceptionistInfo) public receptionistDetails;

    mapping(uint32 => Record) public records;
    mapping(address => uint32[]) public patientRecordIds;
    mapping(address => Referral[]) public referrals;

    address[] public admins;
    address[] public doctors;
    address[] public nurses;
    address[] public receptionists;
    address[] public patients;

    uint32[] public allRecordIds;

    event StaffAdded(address indexed user, Role role);
    event StaffUpdated(address indexed user, Role role);
    event StaffRemoved(address indexed user, Role role);
    event PatientRegistered(address indexed patient, string name, address indexed doctor);
    event PatientSelfRegistered(address indexed patient, string name);
    event ReferralCreated(address indexed patient, address indexed fromDoctor, address indexed toDoctor, uint32 recordId);
    event PrescriptionAdded(uint32 indexed recordId, string ipfsHash, uint256 timestamp);
    event VitalsUpdated(uint32 indexed recordId, string vitals);

    modifier only(Role r) {
        require(roles[msg.sender] == r, "Unauthorized");
        _;
    }

    constructor() {
        roles[msg.sender] = Role.Admin;
        admins.push(msg.sender);
    }

    // ===== Admin =====
    function addDoctor(address user, string memory name, string memory id, string memory department) external only(Role.Admin) {
        require(roles[user] != Role.Doctor, "Already a doctor");
        roles[user] = Role.Doctor;
        doctorDetails[user] = DoctorInfo(name, id, department);
        doctors.push(user);
        emit StaffAdded(user, Role.Doctor);
    }

    function updateDoctor(address user, string memory name, string memory id, string memory department) external only(Role.Admin) {
        require(roles[user] == Role.Doctor, "Not a doctor");
        doctorDetails[user] = DoctorInfo(name, id, department);
        emit StaffUpdated(user, Role.Doctor);
    }

    function removeDoctor(address user) external only(Role.Admin) {
        require(roles[user] == Role.Doctor, "Not a doctor");
        roles[user] = Role.None;
        emit StaffRemoved(user, Role.Doctor);
    }

    function addNurse(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] != Role.Nurse, "Already a nurse");
        roles[user] = Role.Nurse;
        nurseDetails[user] = NurseInfo(name, id);
        nurses.push(user);
        emit StaffAdded(user, Role.Nurse);
    }

    function updateNurse(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] == Role.Nurse, "Not a nurse");
        nurseDetails[user] = NurseInfo(name, id);
        emit StaffUpdated(user, Role.Nurse);
    }

    function removeNurse(address user) external only(Role.Admin) {
        require(roles[user] == Role.Nurse, "Not a nurse");
        roles[user] = Role.None;
        emit StaffRemoved(user, Role.Nurse);
    }

    function addReceptionist(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] != Role.Receptionist, "Already a receptionist");
        roles[user] = Role.Receptionist;
        receptionistDetails[user] = ReceptionistInfo(name, id);
        receptionists.push(user);
        emit StaffAdded(user, Role.Receptionist);
    }

    function updateReceptionist(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] == Role.Receptionist, "Not a receptionist");
        receptionistDetails[user] = ReceptionistInfo(name, id);
        emit StaffUpdated(user, Role.Receptionist);
    }

    function removeReceptionist(address user) external only(Role.Admin) {
        require(roles[user] == Role.Receptionist, "Not a receptionist");
        roles[user] = Role.None;
        emit StaffRemoved(user, Role.Receptionist);
    }

    function addAdmin(address user) external only(Role.Admin) {
        require(roles[user] != Role.Admin, "Already admin");
        roles[user] = Role.Admin;
        admins.push(user);
        emit StaffAdded(user, Role.Admin);
    }

    // ===== Receptionist =====
    function registerPatient(address patient, string memory name, string memory id, uint age, string memory gender, string memory contact, address preferredDoctor) external only(Role.Receptionist) {
        require(roles[patient] == Role.None, "Already registered");
        roles[patient] = Role.Patient;
        patientDetails[patient] = PatientInfo(name, id, age, gender, contact);
        patients.push(patient);

        if (preferredDoctor != address(0) && roles[preferredDoctor] == Role.Doctor) {
            _createReferral(address(0), preferredDoctor, patient);
        }

        emit PatientRegistered(patient, name, preferredDoctor);
    }

    function updatePatientDetails(address patient, string memory name, string memory id, uint age, string memory gender, string memory contact) external only(Role.Receptionist) {
        require(roles[patient] == Role.Patient, "Not a patient");
        patientDetails[patient] = PatientInfo(name, id, age, gender, contact);
        emit StaffUpdated(patient, Role.Patient);
    }

    function referPatient(address patient, address toDoctor) external only(Role.Receptionist) {
        require(roles[patient] == Role.Patient, "Not a patient");
        require(roles[toDoctor] == Role.Doctor, "Not a doctor");
        _createReferral(address(0), toDoctor, patient);
    }

    function searchPatient(address patient) external view only(Role.Receptionist) returns (string memory, string memory, uint, string memory, string memory, uint32[] memory) {
        require(roles[patient] == Role.Patient, "Not a patient");
        PatientInfo memory info = patientDetails[patient];
        return (info.name, info.id, info.age, info.gender, info.contact, patientRecordIds[patient]);
    }

    function viewAllPatients() external view only(Role.Receptionist) returns (address[] memory) {
        return patients;
    }

    function viewAllDoctors() external view returns (address[] memory) {
        return doctors;
    }


    // ===== Doctor =====
    function viewReferredPatients() external view only(Role.Doctor) returns (Referral[] memory) {
        uint total = 0;
        for (uint i = 0; i < patients.length; i++) {
            Referral[] memory refs = referrals[patients[i]];
            for (uint j = 0; j < refs.length; j++) {
                if (refs[j].toDoctor == msg.sender && refs[j].status == ReferralStatus.Pending) {
                    total++;
                }
            }
        }

        Referral[] memory result = new Referral[](total);
        uint k = 0;
        for (uint i = 0; i < patients.length; i++) {
            Referral[] memory refs = referrals[patients[i]];
            for (uint j = 0; j < refs.length; j++) {
                if (refs[j].toDoctor == msg.sender && refs[j].status == ReferralStatus.Pending) {
                    result[k++] = refs[j];
                }
            }
        }
        return result;
    }

    function addPrescription(uint32 recordId, string memory prescription, string memory notes, string memory ipfsHash) external only(Role.Doctor) {
        Record storage rec = records[recordId];
        require(rec.patient != address(0), "Invalid record");
        rec.prescription = prescription;
        rec.notes = notes;
        rec.ipfsHash = ipfsHash;
        rec.lastUpdated = block.timestamp;
        emit PrescriptionAdded(recordId, ipfsHash, block.timestamp);
    }

    function createMedicalRecord(address patient, string memory ipfsHash, string memory prescription, string memory notes) external only(Role.Doctor) {
        require(roles[patient] == Role.Patient, "Not a valid patient");
        uint32 id = ++recordCount;
        records[id] = Record({
            id: id,
            patient: patient,
            doctor: msg.sender,
            ipfsHash: ipfsHash,
            prescription: prescription,
            notes: notes,
            vitals: "",
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });
        patientRecordIds[patient].push(id);
        allRecordIds.push(id);
        emit PrescriptionAdded(id, ipfsHash, block.timestamp);
    }

    function referAnotherDoctor(uint32 recordId, address toDoctor) external only(Role.Doctor) {
        require(records[recordId].patient != address(0), "Invalid record");
        require(roles[toDoctor] == Role.Doctor, "Not a doctor");
        _createReferral(msg.sender, toDoctor, records[recordId].patient);
    }

    // ===== Nurse =====
    function updateVitals(uint32 recordId, string memory vitals, string memory notes) external only(Role.Nurse) {
        Record storage rec = records[recordId];
        require(rec.patient != address(0), "Invalid record");
        rec.vitals = vitals;
        rec.notes = notes;
        rec.lastUpdated = block.timestamp;
        emit VitalsUpdated(recordId, vitals);
    }

    // ===== Patient =====
    function selfRegister(string memory name) external {
        require(roles[msg.sender] == Role.None, "Already registered");
        roles[msg.sender] = Role.Patient;
        patientDetails[msg.sender] = PatientInfo(name, "", 0, "", "");
        patients.push(msg.sender);
        emit PatientSelfRegistered(msg.sender, name);
    }

    function viewPatientRecords(address patient) external view returns (Record[] memory) {
        require((roles[msg.sender] == Role.Patient && msg.sender == patient) || roles[msg.sender] == Role.Doctor || roles[msg.sender] == Role.Nurse, "Unauthorized");
        uint32[] memory ids = patientRecordIds[patient];
        Record[] memory recs = new Record[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            recs[i] = records[ids[i]];
        }
        return recs;
    }

    function viewAllRecords() external view returns (Record[] memory) {
        Record[] memory recs = new Record[](allRecordIds.length);
        for (uint i = 0; i < allRecordIds.length; i++) {
            recs[i] = records[allRecordIds[i]];
        }
        return recs;
    }

    function respondToReferral(uint index, bool accept, address newDoctorIfReject) external only(Role.Patient) {
        require(index < referrals[msg.sender].length, "Invalid index");
        Referral storage ref = referrals[msg.sender][index];
        require(ref.status == ReferralStatus.Pending, "Already handled");

        if (accept) {
            ref.status = ReferralStatus.Accepted;
        } else {
            ref.status = ReferralStatus.Rejected;
            if (newDoctorIfReject != address(0) && roles[newDoctorIfReject] == Role.Doctor) {
                _createReferral(ref.fromDoctor, newDoctorIfReject, msg.sender);
            }
        }
    }

    function viewAllStaff() external view only(Role.Admin) returns (address[] memory, address[] memory, address[] memory, address[] memory) {
        return (admins, doctors, nurses, receptionists);
    }

    function getDoctorDetails(address user) external view returns (string memory, string memory, string memory) {
        require(roles[user] == Role.Doctor, "Not a doctor");
        DoctorInfo memory d = doctorDetails[user];
        return (d.name, d.id, d.department);
    }

    function getNurseDetails(address user) external view returns (string memory, string memory) {
        require(roles[user] == Role.Nurse, "Not a nurse");
        NurseInfo memory n = nurseDetails[user];
        return (n.name, n.id);
    }

    function getReceptionistDetails(address user) external view returns (string memory, string memory) {
        require(roles[user] == Role.Receptionist, "Not a receptionist");
        ReceptionistInfo memory r = receptionistDetails[user];
        return (r.name, r.id);
    }

    function _createReferral(address fromDoctor, address toDoctor, address patient) internal {
        uint32 id = ++recordCount;
        records[id] = Record(id, patient, toDoctor, "", "", "", "", block.timestamp, block.timestamp);
        patientRecordIds[patient].push(id);
        allRecordIds.push(id);
        referrals[patient].push(Referral(fromDoctor, toDoctor, id, ReferralStatus.Pending));
        emit ReferralCreated(patient, fromDoctor, toDoctor, id);
    }
}
