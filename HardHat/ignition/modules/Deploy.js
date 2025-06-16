const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("HospitalRecordsModule", (m) => {
  const hospitalRecords = m.contract("HospitalRecords"); // Default deployer will be used (account[0])
  return { hospitalRecords };
});
