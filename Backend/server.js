const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fetch = require("node-fetch"); 

const app = express();
app.use(cors());
app.use(express.json());

// DATABASE SETUP

const db = new sqlite3.Database("database.db");

// Students table
db.run(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    student_class TEXT NOT NULL,
    age INTEGER NOT NULL
  )
`);

// Marks table (fixed subjects)
db.run(`
  CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE,
    math INTEGER,
    science INTEGER,
    english INTEGER
  )
`);


// STUDENT API


// CREATE student
app.post("/add-student", (req, res) => {
  const { name, roll_no, student_class, age } = req.body;

  if (!name || !roll_no || !student_class || !age) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.run(
    "INSERT INTO students (name, roll_no, student_class, age) VALUES (?, ?, ?, ?)",
    [name, roll_no, student_class, age],
    function (err) {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Student added successfully", id: this.lastID });
    }
  );
});

// READ all students
app.get("/students", (req, res) => {
  db.all("SELECT * FROM students", (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(rows);
  });
});

// READ single student
app.get("/student/:id", (req, res) => {
  db.get(
    "SELECT * FROM students WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(row);
    }
  );
});

// UPDATE student
app.put("/student/:id", (req, res) => {
  const { name, roll_no, student_class, age } = req.body;

  db.run(
    "UPDATE students SET name=?, roll_no=?, student_class=?, age=? WHERE id=?",
    [name, roll_no, student_class, age, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Database error" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Student not found" });
      res.json({ message: "Student updated successfully" });
    }
  );
});

// DELETE student
app.delete("/student/:id", (req, res) => {
  db.run(
    "DELETE FROM students WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Student deleted successfully" });
    }
  );
});


// MARKS APIs

// ADD or UPDATE marks
app.post("/marks", (req, res) => {
  const { student_id, math, science, english } = req.body;

  db.run(
    `
    INSERT INTO marks (student_id, math, science, english)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(student_id)
    DO UPDATE SET
      math = excluded.math,
      science = excluded.science,
      english = excluded.english
    `,
    [student_id, math, science, english],
    function (err) {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Marks saved successfully" });
    }
  );
});

// GET marks for a student
app.get("/marks/:studentId", (req, res) => {
  db.get(
    "SELECT * FROM marks WHERE student_id = ?",
    [req.params.studentId],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(row || {});
    }
  );
});



// AI SUGGESTIONS (OLLAMA - LOCAL)

app.post("/ai-suggestions", async (req, res) => {
  const { math, science, english } = req.body;

  const prompt = `A student has the following marks:
Math: ${math}
Science: ${science}
English: ${english}

Give 3 short, clear suggestions to improve weak subjects.`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:3b",   // change if you installed a different model
        prompt: prompt,
        stream: false
      })
    });

    // handle both JSON and non-JSON safely
    const text = await response.text();
    console.log("OLLAMA RAW RESPONSE:", text);

    let suggestion = "AI could not generate suggestions.";
    try {
      const parsed = JSON.parse(text);
      // Ollama returns { response: "..." } or similar
      if (parsed?.response) suggestion = parsed.response;
      else if (parsed?.output) suggestion = parsed.output;
      else suggestion = JSON.stringify(parsed);
    } catch {
      // not JSON → fallback rule-based text
      suggestion = `
Based on the marks:
• Strengthen Math fundamentals with daily practice.
• Revise Science concepts using diagrams and examples.
• Continue improving English through reading and writing.
`;
    }

    res.json({ suggestion });
  } catch (err) {
    console.error("Ollama call error:", err);
    // guaranteed fallback so UI never breaks
    res.json({
      suggestion: `
Based on the marks:
• Strengthen Math fundamentals with daily practice.
• Revise Science concepts using diagrams and examples.
• Continue improving English through reading and writing.
`
    });
  }
});


// START SERVER

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
