import { useState, useEffect } from "react";
import Header from "./components/Header";
import ApplicantTabs from "./components/ApplicantTabs";
import UploadPanel from "./components/UploadPanel";
import AddApplicantModal from "./components/AddApplicantModal";
import AddDocumentModal from "./components/AddDocumentModal";
import LoginPage from "./pages/LoginPage";
import "./styles/layout.css";

/* BACKEND URL */
const API_URL = "https://document-backend-f8bg.onrender.com";

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const [applicants, setApplicants] = useState([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);

  const selectedApplicant = applicants.find(
    (a) => a.id === selectedApplicantId
  );

  /* ---------------- CHECK LOGIN ---------------- */

  useEffect(() => {

    const user = localStorage.getItem("user");

    if (user) {
      setIsLoggedIn(true);
    }

  }, []);

  /* ---------------- LOAD APPLICANTS ---------------- */

  useEffect(() => {

    if (!isLoggedIn) return;

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    const loadApplicants = async () => {

      try {

        const res = await fetch(
          `${API_URL}/api/applicants/${user.id}`
        );

        const data = await res.json();

        const formatted = data.map((app) => ({
          id: app.id,
          name: app.name,
          documents: []
        }));

        setApplicants(formatted);

        if (formatted.length > 0) {
          setSelectedApplicantId(formatted[0].id);
        }

      } catch (err) {

        console.log("Applicant load error:", err);

      }

    };

    loadApplicants();

  }, [isLoggedIn]);

  /* ---------------- LOAD DOCUMENTS ---------------- */

  useEffect(() => {

    if (!selectedApplicantId) return;

    const loadDocuments = async () => {

      try {

        const res = await fetch(
          `${API_URL}/api/documents/${selectedApplicantId}`
        );

        const docs = await res.json();

        const formattedDocs = docs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          files: []
        }));

        setApplicants((prev) =>
          prev.map((app) =>
            app.id === selectedApplicantId
              ? { ...app, documents: formattedDocs }
              : app
          )
        );

      } catch (err) {

        console.log("Document load error:", err);

      }

    };

    loadDocuments();

  }, [selectedApplicantId]);

  /* ---------------- ADD APPLICANT ---------------- */

  const addApplicant = async (name) => {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("User not logged in");
      return;
    }

    try {

      const res = await fetch(
        `${API_URL}/api/applicants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: user.id,
            name: name
          })
        }
      );

      const data = await res.json();

      const newApplicant = {
        id: data.id,
        name: name,
        documents: []
      };

      setApplicants((prev) => [...prev, newApplicant]);

      setSelectedApplicantId(data.id);

      setShowApplicantModal(false);

    } catch (error) {

      console.log("Add applicant error:", error);

      alert("Failed to add applicant");

    }

  };

  /* ---------------- DELETE APPLICANT ---------------- */

  const deleteApplicant = async (id) => {

    try {

      await fetch(
        `${API_URL}/api/applicants/${id}`,
        {
          method: "DELETE"
        }
      );

      const updated = applicants.filter(
        (a) => a.id !== id
      );

      setApplicants(updated);

      if (updated.length > 0) {
        setSelectedApplicantId(updated[0].id);
      } else {
        setSelectedApplicantId(null);
      }

    } catch (error) {

      console.log("Delete applicant error:", error);

    }

  };

  /* ---------------- ADD DOCUMENT ---------------- */

  const addDocument = async (docName) => {

    try {

      const res = await fetch(
        `${API_URL}/api/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            applicant_id: selectedApplicantId,
            title: docName
          })
        }
      );

      const data = await res.json();

      const newDoc = {
        id: data.id,
        title: docName,
        files: []
      };

      setApplicants((prev) =>
        prev.map((app) =>
          app.id === selectedApplicantId
            ? {
                ...app,
                documents: [...app.documents, newDoc]
              }
            : app
        )
      );

      setShowDocumentModal(false);

    } catch (error) {

      console.log("Add document error:", error);

      alert("Failed to add document");

    }

  };

  /* ---------------- LOGIN PAGE ---------------- */

  if (!isLoggedIn) {

    return (
      <LoginPage
        onLogin={() => setIsLoggedIn(true)}
      />
    );

  }

  /* ---------------- DASHBOARD ---------------- */

  return (

    <div className="dashboard">

      <Header
        onAddApplicant={() =>
          setShowApplicantModal(true)
        }
        onLogout={() => {

          localStorage.removeItem("user");

          setIsLoggedIn(false);

          setApplicants([]);

          setSelectedApplicantId(null);

        }}
      />

      <div className="content">

        <ApplicantTabs
          applicants={applicants}
          selectedApplicantId={selectedApplicantId}
          setSelectedApplicantId={setSelectedApplicantId}
          onAddDocument={() =>
            setShowDocumentModal(true)
          }
          onDeleteApplicant={deleteApplicant}
        />

        {selectedApplicant && (
          <UploadPanel
            documents={selectedApplicant.documents}
          />
        )}

      </div>

      {showApplicantModal && (

        <AddApplicantModal
          onClose={() =>
            setShowApplicantModal(false)
          }
          onSave={addApplicant}
        />

      )}

      {showDocumentModal && (

        <AddDocumentModal
          onClose={() =>
            setShowDocumentModal(false)
          }
          onSave={addDocument}
        />

      )}

    </div>

  );

}

export default App;