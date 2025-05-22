const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("HospitalRecordsModule", (m) => {
  const hospitalRecords = m.contract("HospitalRecords");

  return { hospitalRecords };
});
