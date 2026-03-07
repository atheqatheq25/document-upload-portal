import { useState, useEffect } from "react";
import { X } from "lucide-react";

/* BACKEND URL */
const API_URL = "https://document-backend-f8bg.onrender.com";

function UploadPanel({ documents }) {

const [docState, setDocState] = useState([]);

/* ---------------- LOAD FILES FROM BACKEND ---------------- */

useEffect(() => {


const loadFiles = async () => {

  const updatedDocs = await Promise.all(

    documents.map(async (doc) => {

      try {

        const res = await fetch(
          `${API_URL}/api/files/${doc.id}`
        );

        const files = await res.json();

        const formattedFiles = files.map((f) => ({
          id: f.id,
          name: f.file_name,
          size: "",
          status: "completed",
          path: f.file_path
        }));

        return {
          ...doc,
          files: formattedFiles
        };

      } catch (err) {

        console.log("File load error:", err);

        return {
          ...doc,
          files: []
        };

      }

    })

  );

  setDocState(updatedDocs);

};

loadFiles();


}, [documents]);

/* ---------------- CHOOSE FILE ---------------- */

const handleChoose = (docId, e) => {


const selected = e.target.files[0];

if (!selected) return;

setDocState((prev) =>
  prev.map((doc) =>
    doc.id === docId
      ? {
          ...doc,
          files: [
            ...doc.files,
            {
              id: Date.now(),
              fileObject: selected,
              name: selected.name,
              size: (selected.size / 1024).toFixed(2) + " KB",
              status: "pending",
            },
          ],
        }
      : doc
  )
);


};

/* ---------------- UPLOAD FILE ---------------- */

const handleUpload = async (docId) => {


const doc = docState.find((d) => d.id === docId);

const pendingFiles = doc.files.filter(
  (f) => f.status === "pending"
);

for (const file of pendingFiles) {

  const formData = new FormData();

  formData.append("file", file.fileObject);
  formData.append("document_id", docId);

  try {

    await fetch(
      `${API_URL}/api/upload`,
      {
        method: "POST",
        body: formData
      }
    );

  } catch (err) {

    console.log("Upload error:", err);

  }

}

/* reload files after upload */

try {

  const res = await fetch(
    `${API_URL}/api/files/${docId}`
  );

  const files = await res.json();

  const formatted = files.map((f) => ({
    id: f.id,
    name: f.file_name,
    size: "",
    status: "completed",
    path: f.file_path
  }));

  setDocState((prev) =>
    prev.map((d) =>
      d.id === docId
        ? { ...d, files: formatted }
        : d
    )
  );

} catch (err) {

  console.log("Reload file error:", err);

}


};

/* ---------------- DELETE FILE ---------------- */

const handleDeleteFile = async (docId, fileId) => {


try {

  await fetch(
    `${API_URL}/api/files/${fileId}`,
    {
      method: "DELETE"
    }
  );

  setDocState((prev) =>
    prev.map((doc) =>
      doc.id === docId
        ? {
            ...doc,
            files: doc.files.filter(
              (file) => file.id !== fileId
            ),
          }
        : doc
    )
  );

} catch (err) {

  console.log("Delete file error:", err);

}


};

return (


<div className="upload-panel">

  {docState.map((doc) => (

    <div key={doc.id} className="document-block">

      <div className="document-title">
        {doc.title}
      </div>

      <div className="upload-box">

        <div className="upload-buttons">

          <label className="choose-btn">
            + Choose
            <input
              type="file"
              hidden
              onChange={(e) =>
                handleChoose(doc.id, e)
              }
            />
          </label>

          <button
            className="upload-btn"
            disabled={
              !doc.files.some(
                (f) => f.status === "pending"
              )
            }
            onClick={() =>
              handleUpload(doc.id)
            }
          >
            Upload
          </button>

          <button className="cancel-btn">
            Cancel
          </button>

        </div>

        <div className="divider"></div>

        {doc.files.length === 0 && (

          <p className="no-doc-text">
            Drag and Drop files here.
          </p>

        )}

        {doc.files.map((file) => (

          <div key={file.id} className="file-row">

            <div>

              <div className="file-name">
                {file.name}
              </div>

              <div className="file-meta">

                {file.size}

                <span
                  className={
                    file.status === "pending"
                      ? "badge pending"
                      : "badge completed"
                  }
                >
                  {file.status === "pending"
                    ? "Pending"
                    : "Completed"}
                </span>

              </div>

            </div>

            <div style={{display:"flex",gap:"10px"}}>

              {/* VIEW FILE */}
              <a
                href={`${API_URL}/${file.path}`}
                target="_blank"
                rel="noreferrer"
                className="upload-btn"
                style={{padding:"5px 10px"}}
              >
                View
              </a>

              {/* DOWNLOAD FILE */}
              <a
                href={`${API_URL}/${file.path}`}
                download
                className="choose-btn"
                style={{padding:"5px 10px"}}
              >
                Download
              </a>

              {/* DELETE FILE */}
              <button
                className="delete-file-btn"
                onClick={() =>
                  handleDeleteFile(doc.id, file.id)
                }
              >
                <X size={18} />
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  ))}

</div>


);

}

export default UploadPanel;
