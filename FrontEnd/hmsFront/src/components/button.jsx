// src/components/ui/button.jsx

import React from "react";

export function Button({ children, onClick, variant = "default", className = "", ...props }) {
  let baseClasses = "px-4 py-2 rounded font-semibold transition ";

  // Simple variants, you can expand this as needed
  let variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  let classes = baseClasses + (variantClasses[variant] || variantClasses.default) + " " + className;

  return (
    <button className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
