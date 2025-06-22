import React from "react";

const DeleteButton = ({ userObj, onDelete }) => {
  const handleClick = () => {
    if (
      window.confirm(`Are you sure you want to remove this ${userObj.role}?`)
    ) {
      if (onDelete) {
        onDelete(userObj.user, userObj.role);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Delete
    </button>
  );
};

export default DeleteButton;
