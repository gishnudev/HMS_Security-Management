import React from "react";

const UpdateButton = ({ userObj, onUpdate }) => {
  const handleClick = () => {
    if (onUpdate) {
      onUpdate(userObj);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
    >
      Update
    </button>
  );
};

export default UpdateButton;
