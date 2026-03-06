const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { OAuth2Client } = require("google-auth-library");

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- GOOGLE CLIENT ---------------- */

const client = new OAuth2Client(
  "1088209349644-scrmrf3r7h8nopukmr58jd4d1sf9ah3f.apps.googleusercontent.com"
);

/* ---------------- DATABASE CONNECTION ---------------- */

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect((err) => {
  if (err) {
    console.log("Database connection error:", err);
  } else {

    console.log("MySQL Connected");

    /* ---------- CREATE TABLES AUTOMATICALLY ---------- */

    db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255)
      )
    `);

    db.query(`
      CREATE TABLE IF NOT EXISTS applicants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255)
      )
    `);

    db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        applicant_id INT,
        title VARCHAR(255)
      )
    `);

    db.query(`
      CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT,
        file_name VARCHAR(255),
        file_path VARCHAR(255)
      )
    `);

    console.log("Tables ensured");

  }
});

/* ---------------- FILE STORAGE CONFIG ---------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

/* ---------------- BASIC TEST ROUTE ---------------- */

app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ---------------- GOOGLE LOGIN ---------------- */

app.post("/api/auth/google", async (req, res) => {

  const { token } = req.body;

  try {

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "1088209349644-scrmrf3r7h8nopukmr58jd4d1sf9ah3f.apps.googleusercontent.com"
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;

    db.query(
      "SELECT * FROM users WHERE email=?",
      [email],
      (err, results) => {

        if (results.length > 0) {

          const user = results[0];

          return res.json({
            message: "Google login successful",
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          });

        }

        db.query(
          "INSERT INTO users (name,email,password) VALUES (?,?,?)",
          [name, email, "google_login"],
          (err, result) => {

            if (err) {
              return res.status(500).json({
                message: "Database error"
              });
            }

            res.json({
              message: "Google account created",
              user: {
                id: result.insertId,
                name,
                email
              }
            });

          }
        );

      }
    );

  } catch (error) {

    res.status(401).json({
      message: "Invalid Google token"
    });

  }

});

/* ---------------- REGISTER USER ---------------- */

app.post("/api/auth/register", async (req, res) => {

  const { name, email, password } = req.body;

  try {

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name,email,password) VALUES (?,?,?)",
      [name, email, hashedPassword],
      (err) => {

        if (err) {
          return res.status(400).json({
            message: "User already exists",
          });
        }

        res.json({
          message: "User registered successfully",
        });

      }
    );

  } catch (error) {

    res.status(500).json({
      message: "Server error",
    });

  }

});

/* ---------------- LOGIN USER ---------------- */

app.post("/api/auth/login", (req, res) => {

  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, results) => {

      if (err) {
        return res.status(500).json({
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(400).json({
          message: "User not found",
        });
      }

      const user = results[0];

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(400).json({
          message: "Invalid password",
        });
      }

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });

    }
  );

});

/* ---------------- ADD APPLICANT ---------------- */

app.post("/api/applicants", (req, res) => {

  const { user_id, name } = req.body;

  const sql = "INSERT INTO applicants (user_id,name) VALUES (?,?)";

  db.query(sql, [user_id, name], (err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      message: "Applicant added",
      id: result.insertId,
    });

  });

});

/* ---------------- GET APPLICANTS ---------------- */

app.get("/api/applicants/:userId", (req, res) => {

  const userId = req.params.userId;

  const sql = "SELECT * FROM applicants WHERE user_id=?";

  db.query(sql, [userId], (err, results) => {

    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json(results);

  });

});

/* ---------------- DELETE APPLICANT ---------------- */

app.delete("/api/applicants/:id", (req, res) => {

  const applicantId = req.params.id;

  db.query(
    "SELECT file_path FROM files WHERE document_id IN (SELECT id FROM documents WHERE applicant_id=?)",
    [applicantId],
    (err, files) => {

      files.forEach(file => {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }
      });

      db.query("DELETE FROM files WHERE document_id IN (SELECT id FROM documents WHERE applicant_id=?)",[applicantId]);

      db.query("DELETE FROM documents WHERE applicant_id=?",[applicantId]);

      db.query(
        "DELETE FROM applicants WHERE id=?",
        [applicantId],
        (err) => {

          if (err) {
            return res.status(500).json({
              message: "Database error"
            });
          }

          res.json({
            message: "Applicant deleted"
          });

        }
      );

    }
  );

});

/* ---------------- ADD DOCUMENT ---------------- */

app.post("/api/documents", (req, res) => {

  const { applicant_id, title } = req.body;

  const sql =
    "INSERT INTO documents (applicant_id,title) VALUES (?,?)";

  db.query(sql, [applicant_id, title], (err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      message: "Document created",
      id: result.insertId,
    });

  });

});

/* ---------------- GET DOCUMENTS ---------------- */

app.get("/api/documents/:applicantId", (req, res) => {

  const applicantId = req.params.applicantId;

  const sql =
    "SELECT * FROM documents WHERE applicant_id=?";

  db.query(sql, [applicantId], (err, results) => {

    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json(results);

  });

});

/* ---------------- DELETE DOCUMENT ---------------- */

app.delete("/api/documents/:id", (req, res) => {

  const docId = req.params.id;

  db.query(
    "SELECT file_path FROM files WHERE document_id=?",
    [docId],
    (err, files) => {

      files.forEach(file => {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }
      });

      db.query("DELETE FROM files WHERE document_id=?",[docId]);

      db.query(
        "DELETE FROM documents WHERE id=?",
        [docId],
        (err) => {

          if (err) {
            return res.status(500).json({
              message: "Database error"
            });
          }

          res.json({
            message: "Document deleted"
          });

        }
      );

    }
  );

});

/* ---------------- FILE UPLOAD ---------------- */

app.post("/api/upload", upload.single("file"), (req, res) => {

  const { document_id } = req.body;

  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  const fileName = req.file.filename;
  const filePath = req.file.path;

  const sql =
    "INSERT INTO files (document_id,file_name,file_path) VALUES (?,?,?)";

  db.query(sql, [document_id, fileName, filePath], (err) => {

    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      message: "File uploaded successfully",
      file: fileName,
      path: filePath,
    });

  });

});

/* ---------------- GET FILES ---------------- */

app.get("/api/files/:documentId", (req, res) => {

  const documentId = req.params.documentId;

  const sql =
    "SELECT * FROM files WHERE document_id=?";

  db.query(sql, [documentId], (err, results) => {

    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json(results);

  });

});

/* ---------------- DELETE FILE ---------------- */

app.delete("/api/files/:id", (req, res) => {

  const fileId = req.params.id;

  db.query(
    "SELECT file_path FROM files WHERE id=?",
    [fileId],
    (err, result) => {

      if (result.length === 0) {
        return res.status(404).json({
          message: "File not found"
        });
      }

      const filePath = result[0].file_path;

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      db.query(
        "DELETE FROM files WHERE id=?",
        [fileId],
        (err) => {

          if (err) {
            return res.status(500).json({
              message: "Database error"
            });
          }

          res.json({
            message: "File deleted"
          });

        }
      );

    }
  );

});

/* ---------------- SERVER START ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port 5000", PORT);
});