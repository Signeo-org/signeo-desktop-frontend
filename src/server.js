// server.js
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Adjust this path to where your AudioTranscriptionTool.exe is located
const pathTool = path.join(__dirname, "../resources", "AudioTranscriptionTool.exe");

app.use(cors());
app.use(express.json());

const server = app.listen(port, () => {
  console.log(`✅ HTTP server running on http://localhost:${port}`);
});

// WebSocket server for live transcription output
const wss = new WebSocketServer({ server });
let clients = [];

wss.on("connection", (ws) => {
  console.log("📡 WebSocket client connected");
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
  });
});

let toolProcess = null;

app.post("/start", (req, res) => {
  if (toolProcess) {
    return res.status(409).send("Tool is already running.");
  }

  try {
    console.log("🚀 Launching AudioTranscriptionTool...");
    toolProcess = spawn(pathTool, [], {
        windowsHide: true, // optionally hide the console window on Windows
        cwd: path.dirname(pathTool), // set current working directory to the exe's folder
    });

    toolProcess.stdout.on("data", (data) => {
      const lines = data.toString().split(/\r?\n/);
      lines.forEach((line) => {
        if (line.trim().length > 0) {
          console.log(">>", line);
          // Broadcast transcription line to all connected WS clients
          clients.forEach((ws) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(line);
            }
          });
        }
      });
    });

    toolProcess.stderr.on("data", (data) => {
      console.error("❌ Tool error:", data.toString());
    });

    toolProcess.on("exit", (code) => {
      console.log(`🛑 Tool exited with code ${code}`);
      toolProcess = null;
    });

    return res.status(200).send("Started");
  } catch (err) {
    console.error("❌ Failed to start tool:", err);
    return res.status(500).send("Error");
  }
});

app.post("/stop", (req, res) => {
  if (toolProcess) {
    toolProcess.kill();
    toolProcess = null;
    return res.status(200).send("Stopped");
  } else {
    return res.status(404).send("Tool not running");
  }
});
