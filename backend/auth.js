const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const router = express.Router();

/* ---------------- REGISTER ---------------- */

router.post("/register", async (req, res) => {

const { name, email, password } = req.body;

if (!name || !email || !password) {
return res.status(400).json({
message: "All fields are required"
});
}

try {


const checkSql = "SELECT * FROM users WHERE email = ?";

db.query(checkSql, [email], async (err, results) => {

  if (results.length > 0) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertSql =
    "INSERT INTO users (name,email,password) VALUES (?,?,?)";

  db.query(
    insertSql,
    [name, email, hashedPassword],
    (err, result) => {

      if (err) {
        return res.status(500).json({
          message: "Database error"
        });
      }

      res.json({
        message: "User registered successfully"
      });

    }
  );

});


} catch (error) {


res.status(500).json({
  message: "Server error"
});


}

});

/* ---------------- LOGIN ---------------- */

router.post("/login", (req, res) => {

const { email, password } = req.body;

const sql = "SELECT * FROM users WHERE email = ?";

db.query(sql, [email], async (err, results) => {


if (err) {
  return res.status(500).json({
    message: "Database error"
  });
}

if (results.length === 0) {
  return res.status(400).json({
    message: "User not found"
  });
}

const user = results[0];

const match = await bcrypt.compare(password, user.password);

if (!match) {
  return res.status(400).json({
    message: "Invalid password"
  });
}

res.json({
  message: "Login successful",
  user: {
    id: user.id,
    name: user.name,
    email: user.email
  }
});


});

});

module.exports = router;
