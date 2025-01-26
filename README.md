# Twilio OpenAI Realtime Media Stream

This project demonstrates a Node.js application that acts as a middleware to connect Twilio Media Streams with OpenAI's Realtime API for an interactive AI-powered voice assistant. 

## Features
- Twilio integration with Node.js via WebSocket for handling real-time audio streams.
- Node.js connects to OpenAI's Realtime API over WebSocket for AI-generated responses.
- Bi-directional audio streaming between Twilio and OpenAI:
  - Twilio sends audio stream buffers to Node.js.
  - Node.js forwards these buffers to OpenAI and relays OpenAI's audio response back to Twilio.
- Twilio webhook `/incoming-call` for initializing the connection.

---

## Process Flow

### 1. Twilio Integration with Node.js
- Twilio Media Stream is connected to the Node.js server using the `/incoming-call` webhook.
- Twilio sends audio stream data to the Node.js server via WebSocket.

### 2. Node.js Server Connects to OpenAI Realtime API
- The Node.js server establishes a WebSocket connection with OpenAI's Realtime API.
- A session is initialized with specific configurations like:
  - Turn detection.
  - Input and output audio format.
  - Voice model and instructions for the assistant.

### 3. Real-Time Audio Streaming
- **Twilio to OpenAI:**  
  - Twilio streams audio buffers (`g711_ulaw` format) to the Node.js server.
  - The Node.js server forwards the buffers to OpenAI's Realtime API.
- **OpenAI to Twilio:**  
  - OpenAI processes the audio input, generates a response, and streams audio buffers back to the Node.js server.
  - The Node.js server sends these audio response buffers back to Twilio, completing the real-time interaction.

### 4. Twilio Webhook for Call Initialization
- A webhook endpoint `/incoming-call` is added in Twilio.
- This webhook provides an initial response to Twilio, enabling the media stream and setting up the WebSocket connection between Twilio and the Node.js server.

---

## Installation and Setup

### Prerequisites
- Node.js (v18+ recommended).
- Twilio account and phone number.
- OpenAI account with access to the Realtime API (ensure API key is valid).
- SSL certificate for HTTPS.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/twilio-openai-realtime.git
   cd twilio-openai-realtime
   
2. Install dependencies:
   ```bash
   npm install

3. Create a .env file:
   ```bash
     OPENAI_API_KEY = your-openai-api-key
    ```
    Replace your-openai-api-key with your OpenAI API key.

4. Add your SSL certificate files (if hosting on HTTPS):
    - ca_bundle.crt
    - private.key
    - certificate.crt

5. Start the server:
   ```bash
     node server.js

6. Configure the Twilio webhook:
   - Navigate to your Twilio console.
   - Under the phone number settings, set the "Voice & Fax" webhook to:
   ```bash
     https://your-domain.com/incoming-call

## How It Works

1. A call is made to your Twilio number.
2. Twilio connects to the `/incoming-call` endpoint, initializing the media stream.
3. Node.js connects to OpenAI's Realtime API and establishes the session.
4. Twilio audio buffers are forwarded to OpenAI in real-time.
5. OpenAI processes the input and generates a real-time audio response, which is sent back to Twilio.
6. The conversation continues seamlessly until the call ends.

## Connection Diagram

  ```mermaid
  graph LR;
      Caller["📞 Caller"]
      Twilio["🔗 Twilio Number"]
      Endpoint["🌐 /incoming-call Endpoint"]
      NodeServer["🖥️ Node.js Server"]
      OpenAI["🤖 OpenAI Realtime API"]
      
      Caller -->|Makes a call| Twilio
      Twilio -->|Connects to| Endpoint
      Endpoint -->|Forwards audio stream| NodeServer
      NodeServer -->|Sends stream| OpenAI
      OpenAI -->|Returns AI response| NodeServer
      NodeServer -->|Sends response| Twilio
      Twilio -->|Plays audio| Caller
  ```

---

## Tech Stack

- **Node.js**: Backend server for WebSocket connections and audio stream processing.
- **Twilio**: Handles incoming calls and streams audio to the Node.js server.
- **OpenAI**: Processes the audio input and generates AI-driven responses.

## Contributing

Feel free to open issues or create pull requests to contribute to this project.
