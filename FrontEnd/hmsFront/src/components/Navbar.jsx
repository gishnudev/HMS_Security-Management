// src/components/Navbar.jsx

import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Patient Dashboard", path: "/patient" },
    { name: "Doctor Dashboard", path: "/doctor" },
    { name: "Nurse Dashboard", path: "/nurse" },
    { name: "Receptionist Dashboard", path: "/receptionist" },
    { name: "Admin Dashboard", path: "/admin" },
  ];

  return (
    <nav className="bg-black text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">Hospital Security DApp</div>
      <ul className="flex space-x-6">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`hover:underline ${
                location.pathname === item.path ? "underline font-semibold" : ""
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
