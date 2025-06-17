import React from "react";

export const Input = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full p-2 border border-gray-300 rounded"
  />
);
