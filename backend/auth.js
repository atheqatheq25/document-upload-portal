const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const router = express.Router();


// REGISTER USER
router.post("/register", async (req, res) => {

  const { name, email, password } = req.body;

  try {

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name,email,password) VALUES (?,?,?)";

    db.query(sql, [name, email, hashedPassword], (err, result) => {

      if (err) {
        return res.status(400).json({ message: "User already exists" });
      }

      res.json({ message: "User registered successfully" });

    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }

});


// LOGIN USER
router.post("/login", (req, res) => {

  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {

    if (results.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      userId: user.id
    });

  });

});

module.exports = router;