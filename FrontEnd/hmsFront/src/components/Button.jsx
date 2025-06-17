// src/components/Button.jsx
export const Button = ({ children, onClick, variant = "solid", className = "" }) => {
  const base = "px-4 py-2 rounded text-white font-semibold";
  const style =
    variant === "outline"
      ? "border border-blue-500 text-blue-500 bg-transparent hover:bg-blue-100"
      : "bg-blue-600 hover:bg-blue-700";
  return (
    <button className={`${base} ${style} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};
