// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HospitalRecords {
    enum Role { None, Patient, Nurse, Doctor, Admin, Receptionist }
    enum ReferralStatus { Pending, Accepted, Rejected }

    struct Record {
        uint32 id;
        string ipfsHash;
        address patient;
        address assignedDoctor;
    }

    struct Referral {
        address fromDoctor;
        address toDoctor;
        uint32 recordId;
        ReferralStatus status;
    }

    struct Identity {
        string name;
        string id;
    }

    uint32 public recordCount;
    uint32 private doctorIndex;

    mapping(address => Role) public roles;
    mapping(uint32 => Record) public records;
    mapping(address => uint32[]) public patientRecords;
    mapping(address => Referral[]) public referrals;
    mapping(address => bool) public isRegisteredPatient;

    address[] private doctorList;
    address[] private userList;
    mapping(address => bool) private isUserAdded;

    mapping(address => Identity) public doctorDetails;
    mapping(address => Identity) public patientDetails;
    mapping(address => Identity) public nurseDetails;
    mapping(address => Identity) public adminDetails;
    mapping(address => Identity) public receptionistDetails;

    event RoleAssigned(address indexed user, Role role);
    event RecordAdded(uint32 indexed id, address indexed doctor, address indexed patient);
    event RecordEdited(uint32 indexed id, string newHash);
    event ReferralMade(address indexed patient, address indexed fromDoctor, address indexed toDoctor, uint32 recordId);
    event ReferralResponded(address indexed patient, uint indexed referralIndex, ReferralStatus status);

    modifier only(Role r) {
        require(roles[msg.sender] == r, "Unauthorized");
        _;
    }

    modifier canEdit(uint32 id) {
        require(
            roles[msg.sender] == Role.Doctor || 
            (roles[msg.sender] == Role.Nurse && records[id].patient == msg.sender),
            "No edit permission"
        );
        _;
    }

    constructor() {
        roles[msg.sender] = Role.Admin;
        adminDetails[msg.sender] = Identity("Default Admin", "admin-001");
        isUserAdded[msg.sender] = true;
        userList.push(msg.sender);
        emit RoleAssigned(msg.sender, Role.Admin);
    }

    function _addUser(address user, Role role, Identity memory data) internal {
        roles[user] = role;
        emit RoleAssigned(user, role);

        if (!isUserAdded[user]) {
            userList.push(user);
            isUserAdded[user] = true;
        }

        if (role == Role.Doctor) {
            doctorList.push(user);
            doctorDetails[user] = data;
        } else if (role == Role.Patient) {
            isRegisteredPatient[user] = true;
            patientDetails[user] = data;
        } else if (role == Role.Nurse) {
            nurseDetails[user] = data;
        } else if (role == Role.Admin) {
            adminDetails[user] = data;
        } else if (role == Role.Receptionist) {
            receptionistDetails[user] = data;
        }
    }

    function addDoctor(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] != Role.Doctor, "Already a doctor");
        _addUser(user, Role.Doctor, Identity(name, id));
    }

    function addPatient(address user, string memory name, string memory id) external only(Role.Receptionist) {
        require(roles[user] != Role.Patient, "Already a patient");
        _addUser(user, Role.Patient, Identity(name, id));
    }

    function addNurse(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] != Role.Nurse, "Already a nurse");
        _addUser(user, Role.Nurse, Identity(name, id));
    }

    function addAdmin(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] != Role.Admin, "Already an admin");
        _addUser(user, Role.Admin, Identity(name, id));
    }

    function addReceptionist(address user, string memory name, string memory id) external only(Role.Admin) {
        require(roles[user] != Role.Receptionist, "Already a receptionist");
        _addUser(user, Role.Receptionist, Identity(name, id));
    }

    function registerIfNeeded(address user) internal {
        if (roles[user] == Role.None) {
            roles[user] = Role.Patient;
            emit RoleAssigned(user, Role.Patient);
        }

        if (!isRegisteredPatient[user]) {
            isRegisteredPatient[user] = true;

            if (!isUserAdded[user]) {
                userList.push(user);
                isUserAdded[user] = true;
            }

            if (bytes(patientDetails[user].id).length == 0) {
                patientDetails[user] = Identity("AutoRegistered", "AUTO-ID");
            }
        }
    }

    function assignDoctorAutomatically() internal returns (address) {
        require(doctorList.length > 0, "No doctors");
        address selected = doctorList[doctorIndex++ % doctorList.length];
        return selected;
    }

    function addRecordWithPreference(string memory ipfsHash, address preferredDoctor) external {
        registerIfNeeded(msg.sender);

        address assignedDoctor = (preferredDoctor == address(0) || roles[preferredDoctor] != Role.Doctor)
            ? assignDoctorAutomatically()
            : preferredDoctor;

        uint32 id = ++recordCount;
        records[id] = Record(id, ipfsHash, msg.sender, assignedDoctor);
        patientRecords[msg.sender].push(id);
        emit RecordAdded(id, assignedDoctor, msg.sender);
    }

    function editRecord(uint32 id, string memory newIpfsHash) external canEdit(id) {
        records[id].ipfsHash = newIpfsHash;
        emit RecordEdited(id, newIpfsHash);
    }

    function viewRecord(uint32 id) external view returns (string memory, address) {
        require(roles[msg.sender] != Role.None, "Unauthorized");
        Record memory rec = records[id];
        return (rec.ipfsHash, rec.assignedDoctor);
    }

    function getPatientRecords(address patient) external view returns (uint32[] memory) {
        return patientRecords[patient];
    }

    function referToAnotherDoctor(uint32 recordId, address toDoctor) external only(Role.Doctor) {
        require(records[recordId].patient != address(0), "Invalid record");
        require(roles[toDoctor] == Role.Doctor, "Target must be doctor");

        address patient = records[recordId].patient;
        referrals[patient].push(Referral(msg.sender, toDoctor, recordId, ReferralStatus.Pending));
        emit ReferralMade(patient, msg.sender, toDoctor, recordId);
    }

    function respondToReferral(uint index, bool accept) external only(Role.Patient) {
        require(index < referrals[msg.sender].length, "Invalid index");

        Referral storage ref = referrals[msg.sender][index];
        require(ref.status == ReferralStatus.Pending, "Already handled");

        ref.status = accept ? ReferralStatus.Accepted : ReferralStatus.Rejected;

        if (accept) {
            records[ref.recordId].assignedDoctor = ref.toDoctor;
        }

        emit ReferralResponded(msg.sender, index, ref.status);
    }

    function getMyReferrals() external view only(Role.Patient) returns (Referral[] memory) {
        return referrals[msg.sender];
    }

    function getDoctorCount() external view returns (uint) {
        return doctorList.length;
    }

    function getDoctorByIndex(uint index) external view returns (address) {
        require(index < doctorList.length, "Out of bounds");
        return doctorList[index];
    }

    function getAllUsers() external view returns (address[] memory) {
        return userList;
    }

    function getRole(address user) external view returns (Role) {
        return roles[user];
    }

    function getDoctorDetails(address user) external view returns (string memory, string memory) {
        require(roles[user] == Role.Doctor, "Not a doctor");
        Identity memory d = doctorDetails[user];
        return (d.name, d.id);
    }

    function getPatientDetails(address user) external view returns (string memory, string memory) {
        require(roles[user] == Role.Patient, "Not a patient");
        Identity memory p = patientDetails[user];
        return (p.name, p.id);
    }

    function getNurseDetails(address user) external view returns (string memory, string memory) {
        require(roles[user] == Role.Nurse, "Not a nurse");
        Identity memory n = nurseDetails[user];
        return (n.name, n.id);
    }

    function getAdminDetails(address user) external view returns (string memory, string memory) {
        require(roles[user] == Role.Admin, "Not an admin");
        Identity memory a = adminDetails[user];
        return (a.name, a.id);
    }

    function getReceptionistDetails(address user) external view returns (string memory, string memory) {
        require(roles[user] == Role.Receptionist, "Not a receptionist");
        Identity memory r = receptionistDetails[user];
        return (r.name, r.id);
    }

    function completePatientRegistration(address user, string memory name, string memory id) external only(Role.Receptionist) {
        require(roles[user] == Role.Patient, "Not a patient");
        patientDetails[user] = Identity(name, id);
    }
}
