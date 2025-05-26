const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 5000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/api/transcription", (req, res) => {
  const filePath = "../backend/transcription.txt";
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).json({ error: "Failed to read file" });
      return;
    }
    res.json({ transcription: data });
  });
});

const filePath = "transcription.txt";
const signos = [
  "all",
  "ask",
  "away",
  "business",
  "but",
  "count",
  "effective",
  "excited",
  "few",
  "i",
  "joining",
  "might",
  "number",
  "read",
  "school",
  "sentence",
  "situacion",
  "talk",
  "that",
  "this",
  "cultural",
  "down",
  "give",
  "gonna",
  "hard",
  "hearing",
  "language",
  "let",
  "make",
  "media",
  "never",
  "people",
  "say",
  "sign",
  "social",
  "subtitles",
  "tell",
  "up",
  "you",
];

app.get("/api/sign", (req, res) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(500).json({ error: "Failed to read file" });
      return;
    }

    let words = data.split(" ");
    // replace \n and special characters
    words = words.map((word) => word.replace(/[^a-zA-Z ]/g, ""));
    console.log("Words:", words); // Optional: Log words to server
    const signFounded = words.filter((word) => signos.includes(word));

    console.log("Signs Found:", signFounded); // Optional: Log found signs to server console

    res.json({ sign: signFounded });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
