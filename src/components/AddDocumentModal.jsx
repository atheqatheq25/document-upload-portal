import { useState } from "react";

function AddDocumentModal({ onClose, onSave }) {

const [docName, setDocName] = useState("");

const handleSave = () => {


if (!docName.trim()) {
  alert("Document name is required");
  return;
}

onSave(docName.trim());
setDocName("");


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
      Add Document
    </div>

    <input
      type="text"
      className="modal-input"
      placeholder="Enter document name"
      value={docName}
      onChange={(e) => setDocName(e.target.value)}
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

export default AddDocumentModal;
