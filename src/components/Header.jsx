function Header({ onAddApplicant, onLogout }) {

  return (
    <div className="header-wrapper">

      <div className="header-top">

        <h1 className="title">Document Upload</h1>

        <div style={{ display: "flex", gap: "10px" }}>

          <button
            className="primary-btn"
            onClick={onAddApplicant}
          >
            + Add Applicant
          </button>

          <button
            className="cancel-btn"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </div>

      <div className="header-divider"></div>

    </div>
  );
}

export default Header;