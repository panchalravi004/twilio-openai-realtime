const https = require("https");
const fs = require("fs");
const express = require("express");
const WebSocket = require("ws");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();

const { OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
    console.error("Missing OpenAI API key. Please set it in the .env file.");
    process.exit(1);
}else{
    console.log('Loading API Key: '+ OPENAI_API_KEY);
}

const app = express();
const PORT = 8443;

const https_options = {
        ca: fs.readFileSync("ca_bundle.crt"),
        key: fs.readFileSync("private.key"),
        cert: fs.readFileSync("certificate.crt")
}

// Constants
const SYSTEM_MESSAGE = "You are a helpful and bubbly AI assistant who loves to chat about anything the user is interested about and is prepared to offer them facts.";
const VOICE = "alloy";
const LOG_EVENT_TYPES = [
    "response.content.done",
    "rate_limits.updated",
    "response.done",
    "input_audio_buffer.committed",
    "input_audio_buffer.speech_stopped",
    "input_audio_buffer.speech_started",
    "session.created"
];

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Root Route
app.get("/", (req, res) => {
    res.json({ message: "Twilio Media Stream Server is running!" });
});

// Route for Twilio to handle incoming calls
app.all("/incoming-call", (req, res) => {
    console.log('incoming-call :: '+req.headers.host);
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Connect>
                                  <Stream url="wss://${req.headers.host}/media-stream" />
                              </Connect>
                          </Response>`;
    res.set("Content-Type", "text/xml");
    res.send(twimlResponse);
});

// WebSocket Server for media-stream
const server = https.createServer(https_options, app);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});

const wss = new WebSocket.Server({ server, path: "/media-stream" });

wss.on("connection", (connection, req) => {
    console.log("Client connected");

    const openAiWs = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17", {
        headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1"
        }
    });

    let streamSid = null;

    const sendSessionUpdate = () => {
        const sessionUpdate = {
            type: "session.update",
            session: {
                turn_detection: { type: "server_vad" },
                input_audio_format: "g711_ulaw",
                output_audio_format: "g711_ulaw",
                voice: VOICE,
                instructions: SYSTEM_MESSAGE,
                modalities: ["text", "audio"],
                temperature: 0.8,
            }
        };
        console.log("Sending session update:", JSON.stringify(sessionUpdate));
        openAiWs.send(JSON.stringify(sessionUpdate));
    };

    openAiWs.on("open", () => {
        console.log("Connected to the OpenAI Realtime API");
        setTimeout(sendSessionUpdate, 200); // Ensure connection stability, send after .25 seconds
    });

    openAiWs.on("message", (data) => {
        try {
            const response = JSON.parse(data);
            console.log('openAiWs : MSG : '+response.type);
            if (LOG_EVENT_TYPES.includes(response.type) || response.type == 'error') {
                console.log(`Received event: ${response.type}`, response);
            }
            if (response.type === "session.updated") {
                console.log("Session updated successfully:", response);
            }
            if (response.type === "response.audio.delta" && response.delta) {
                const audioDelta = {
                    event: "media",
                    streamSid: streamSid,
                    media: { payload: Buffer.from(response.delta, "base64").toString("base64") }
                };
                connection.send(JSON.stringify(audioDelta));
            }
        } catch (error) {
            console.error("Error processing OpenAI message:", error, "Raw message:", data);
        }
    });

    connection.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.event) {
                case "media":
                    if (openAiWs.readyState === WebSocket.OPEN) {
                        const audioAppend = {
                            type: "input_audio_buffer.append",
                            audio: data.media.payload
                        };
                        openAiWs.send(JSON.stringify(audioAppend));
                    }
                    break;
                case "start":
                    streamSid = data.start.streamSid;
                    console.log("Incoming stream has started", streamSid);
                    break;
                default:
                    console.log("Received non-media event:", data.event);
                    break;
            }
        } catch (error) {
            console.error("Error parsing message:", error, "Message:", message);
        }
    });

    connection.on("close", () => {
        if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
        console.log("Client disconnected.");
    });

    openAiWs.on("close", () => {
        console.log("Disconnected from the OpenAI Realtime API");
    });

    openAiWs.on("error", (error) => {
        console.error("Error in the OpenAI WebSocket:", error);
    });
});
