import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RegisterRecord from "./pages/RegisterRecord";
import Referral from "./pages/Referral";
import VerifyReferral from "./pages/VerifyReferral";
import Admin from "./pages/Admin";
import Records from "./pages/Records";
import Navbar from "./components/Navbar";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterRecord />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/verify" element={<VerifyReferral />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/records" element={<Records />} />
        <Route path="/register-record" element={<RegisterRecord />} />
        <Route path="/patient" element={<PatientDashboard/>}/>
        <Route path="/doctor" element={<DoctorDashboard/>}/>
        <Route path="/receptionist" element={<ReceptionistDashboard/>}/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
