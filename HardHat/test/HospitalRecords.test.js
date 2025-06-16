const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HospitalRecords', function () {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  async function deployFixture() {
    const [admin, doctor1, doctor2, nurse, patient] = await ethers.getSigners();

    const Hospital = await ethers.getContractFactory('HospitalRecords');
    const hospital = await Hospital.deploy();

    await hospital.assignRole(doctor1.address, 3); // Doctor
    await hospital.assignRole(doctor2.address, 3); // Doctor
    await hospital.assignRole(nurse.address, 2);   // Nurse

    return { hospital, admin, doctor1, doctor2, nurse, patient };
  }

  it('Should assign roles correctly', async () => {
    const { hospital, doctor1 } = await loadFixture(deployFixture);
    const role = await hospital.roles(doctor1.address);
    expect(role).to.equal(3); // Doctor
  });

  it('Should auto-register patient and assign doctor', async () => {
    const { hospital, patient } = await loadFixture(deployFixture);

    const tx = await hospital.connect(patient).addRecordWithPreference("ipfsHash1", ZERO_ADDRESS);
    await expect(tx).to.emit(hospital, 'RecordAdded');

    const rec = await hospital.records(1);
    expect(rec.patient).to.equal(patient.address);
    expect(rec.ipfsHash).to.equal("ipfsHash1");

    const role = await hospital.roles(patient.address);
    expect(role).to.equal(1); // Patient
  });

  it('Should assign preferred doctor when valid', async () => {
    const { hospital, patient, doctor2 } = await loadFixture(deployFixture);

    await hospital.connect(patient).addRecordWithPreference("ipfsPreferred", doctor2.address);
    const rec = await hospital.records(1);
    expect(rec.assignedDoctor).to.equal(doctor2.address);
  });

  it('Should prevent nurse from referring', async () => {
    const { hospital, nurse, patient } = await loadFixture(deployFixture);

    await hospital.connect(patient).addRecordWithPreference("ipfs123", ZERO_ADDRESS);
    await expect(hospital.connect(nurse).referToAnotherDoctor(1, nurse.address))
      .to.be.revertedWith("Only doctor");
  });

  it('Should emit RoleAssigned', async () => {
    const { hospital, nurse, admin } = await loadFixture(deployFixture);

    await expect(hospital.connect(admin).assignRole(nurse.address, 2))
      .to.emit(hospital, 'RoleAssigned')
      .withArgs(nurse.address, 2);
  });

  it('Should allow patient to reject referral', async () => {
    const { hospital, patient, doctor1, doctor2 } = await loadFixture(deployFixture);

    await hospital.connect(patient).addRecordWithPreference("Qm123", ZERO_ADDRESS);
    await hospital.connect(doctor1).referToAnotherDoctor(1, doctor2.address);

    await hospital.connect(patient).respondToReferral(0, false);

    const updated = await hospital.records(1);
    expect(updated.assignedDoctor).to.not.equal(doctor2.address);
  });
});
