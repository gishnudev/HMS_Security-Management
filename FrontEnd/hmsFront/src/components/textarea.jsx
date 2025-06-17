import React from "react";

export const Textarea = ({ value, onChange, placeholder }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full p-2 border border-gray-300 rounded min-h-[100px]"
  />
);
