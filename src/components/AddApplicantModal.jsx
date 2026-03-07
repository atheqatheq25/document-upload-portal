import { useState } from "react";

function AddApplicantModal({ onClose, onSave }) {

const [name, setName] = useState("");

const handleSave = () => {


if (!name.trim()) {
  alert("Applicant name is required");
  return;
}

onSave(name.trim());
setName("");


};

const handleKeyPress = (e) => {


if (e.key === "Enter") {
  handleSave();
}


};

return (

<div className="modal-overlay">

  <div className="modal-card">

    <span
      className="close-btn"
      onClick={onClose}
    >
      ×
    </span>

    <div className="modal-title">
      Add Applicant
    </div>

    <input
      type="text"
      className="modal-input"
      placeholder="Enter applicant name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={handleKeyPress}
    />

    <div className="modal-actions">

      <button
        className="cancel-btn"
        onClick={onClose}
      >
        Cancel
      </button>

      <button
        className="primary-btn"
        onClick={handleSave}
      >
        Save
      </button>

    </div>

  </div>

</div>


);

}

export default AddApplicantModal;
