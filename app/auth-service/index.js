const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

// ❌ Hardcoded secret (intentional vulnerability)
const SECRET_KEY = "my-super-secret-key";
const AWS_SECRET_ACCESS_KEY = "AKIA1234567890EXAMPLE";
// In-memory DB
const db = new sqlite3.Database(':memory:');

// Create table
db.serialize(() => {
  db.run("CREATE TABLE users (id INT, username TEXT, password TEXT)");
  db.run("INSERT INTO users VALUES (1, 'Saurabh', 'Saurabh123')");
});

// ❌ SQL Injection vulnerability
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(query, (err, row) => {
    if (row) {
      res.json({ message: "Login successful", secret: SECRET_KEY });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
});

// Protected route (weak auth)
app.get('/data', (req, res) => {
  const auth = req.headers.authorization;

  if (auth === SECRET_KEY) {
    res.json({ data: "Sensitive Data" });
  } else {
    res.status(403).json({ message: "Forbidden" });
  }
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});