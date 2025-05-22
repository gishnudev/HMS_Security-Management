// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HospitalRecords {
    enum Role { None, Patient, Nurse, Doctor, Admin }
    enum ReferralStatus { Pending, Accepted, Rejected }

    struct Record {
        uint id;
        string ipfsHash;
        address patient;
        address assignedDoctor;
    }

    struct Referral {
        address fromDoctor;
        address toDoctor;
        uint recordId;
        ReferralStatus status;
    }

    uint public recordCount;
    uint public doctorIndex;

    mapping(address => Role) public roles;
    mapping(uint => Record) public records;
    mapping(address => uint[]) public patientRecords;
    mapping(address => Referral[]) public referrals;
    mapping(address => bool) public isRegisteredPatient;

    address[] public doctorList;

    event RoleAssigned(address indexed user, Role role);
    event RecordAdded(uint indexed id, address indexed doctor, address indexed patient);
    event RecordEdited(uint indexed id, string newHash);
    event ReferralMade(address indexed patient, address indexed fromDoctor, address indexed toDoctor, uint recordId);
    event ReferralResponded(address indexed patient, uint indexed referralIndex, ReferralStatus status);

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin");
        _;
    }

    modifier onlyDoctor() {
        require(roles[msg.sender] == Role.Doctor, "Only doctor");
        _;
    }

    modifier onlyPatient() {
        require(roles[msg.sender] == Role.Patient, "Only patient");
        _;
    }

    modifier canEdit(uint id) {
        require(
            roles[msg.sender] == Role.Doctor || 
            (roles[msg.sender] == Role.Nurse && records[id].patient == msg.sender),
            "No edit permission"
        );
        _;
    }

    modifier canView(uint id) {
        require(roles[msg.sender] != Role.None, "Unauthorized");
        _;
    }

    constructor() {
        roles[msg.sender] = Role.Admin;
        emit RoleAssigned(msg.sender, Role.Admin);
    }

    // Role Management
    function assignRole(address user, Role role) external onlyAdmin {
        roles[user] = role;
        emit RoleAssigned(user, role);
        if (role == Role.Doctor) {
            doctorList.push(user);
        }
    }

    // Internal auto-registration
    function registerIfNeeded(address user) internal {
        if (!isRegisteredPatient[user]) {
            roles[user] = Role.Patient;
            isRegisteredPatient[user] = true;
            emit RoleAssigned(user, Role.Patient);
        }
    }

    // Auto doctor assignment (round-robin)
    function assignDoctorAutomatically() internal returns (address) {
        require(doctorList.length > 0, "No doctors available");
        address selectedDoctor = doctorList[doctorIndex % doctorList.length];
        doctorIndex++;
        return selectedDoctor;
    }

    // Add record (with optional preferred doctor)
    function addRecordWithPreference(string memory ipfsHash, address preferredDoctor) external {
        registerIfNeeded(msg.sender);

        address assignedDoctor = preferredDoctor;
        if (preferredDoctor == address(0) || roles[preferredDoctor] != Role.Doctor) {
            assignedDoctor = assignDoctorAutomatically();
        }

        uint id = ++recordCount;
        records[id] = Record(id, ipfsHash, msg.sender, assignedDoctor);
        patientRecords[msg.sender].push(id);
        emit RecordAdded(id, assignedDoctor, msg.sender);
    }

    // Edit record
    function editRecord(uint id, string memory newIpfsHash) external canEdit(id) {
        records[id].ipfsHash = newIpfsHash;
        emit RecordEdited(id, newIpfsHash);
    }

    // View record
    function viewRecord(uint id) external view canView(id) returns (string memory, address) {
        Record memory rec = records[id];
        return (rec.ipfsHash, rec.assignedDoctor);
    }

    // List patient records
    function getPatientRecords(address patient) external view returns (uint[] memory) {
        return patientRecords[patient];
    }

    // Doctor refers patient to another doctor
    function referToAnotherDoctor(uint recordId, address toDoctor) external onlyDoctor {
        require(records[recordId].patient != address(0), "Invalid record");
        require(roles[toDoctor] == Role.Doctor, "Target must be doctor");

        address patient = records[recordId].patient;
        referrals[patient].push(Referral(msg.sender, toDoctor, recordId, ReferralStatus.Pending));

        emit ReferralMade(patient, msg.sender, toDoctor, recordId);
    }

    // Patient responds to referral
    function respondToReferral(uint index, bool accept) external onlyPatient {
        require(index < referrals[msg.sender].length, "Invalid index");

        Referral storage ref = referrals[msg.sender][index];
        require(ref.status == ReferralStatus.Pending, "Already handled");

        ref.status = accept ? ReferralStatus.Accepted : ReferralStatus.Rejected;

        if (accept) {
            records[ref.recordId].assignedDoctor = ref.toDoctor;
        }

        emit ReferralResponded(msg.sender, index, ref.status);
    }

    // View patient referrals
    function getMyReferrals() external view onlyPatient returns (Referral[] memory) {
        return referrals[msg.sender];
    }

    // Utility: Get total number of doctors
    function getDoctorCount() external view returns (uint) {
        return doctorList.length;
    }

    // Utility: Get doctor by index
    function getDoctorByIndex(uint index) external view returns (address) {
        require(index < doctorList.length, "Index out of bounds");
        return doctorList[index];
    }
}
