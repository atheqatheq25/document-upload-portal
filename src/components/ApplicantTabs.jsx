import { Trash2 } from "lucide-react";

function ApplicantTabs({
applicants,
selectedApplicantId,
setSelectedApplicantId,
onAddDocument,
onDeleteApplicant,
}) {

const handleDelete = (id) => {


const confirmDelete = window.confirm(
  "Are you sure you want to delete this applicant?"
);

if (confirmDelete) {
  onDeleteApplicant(id);
}


};

return (


<div className="sidebar">

  {applicants.map((applicant) => (

    <div
      key={applicant.id}
      className={`applicant-item ${
        selectedApplicantId === applicant.id ? "active" : ""
      }`}
    >

      <span
        className="applicant-name"
        onClick={() => setSelectedApplicantId(applicant.id)}
      >
        {applicant.name}
      </span>

      <button
        className="delete-btn"
        onClick={() => handleDelete(applicant.id)}
      >
        <Trash2 size={18} />
      </button>

    </div>

  ))}

  {selectedApplicantId && (

    <button
      className="add-doc-btn"
      onClick={onAddDocument}
    >
      + Add Document
    </button>

  )}

</div>


);

}

export default ApplicantTabs;
