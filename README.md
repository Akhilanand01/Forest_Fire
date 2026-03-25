# 🌲 Forest Fire & Smoke Monitoring — IoT Dashboard

A full-stack IoT web application that receives real-time sensor data from an Arduino (or any IoT device), stores it in MongoDB, and displays it on a live dashboard that auto-refreshes every 5 seconds.

---

## 📁 Folder Structure

```
Forest_Fire/
├── models/
│   └── SensorData.js      # Mongoose schema
├── routes/
│   └── sensorData.js      # POST & GET API routes
├── public/
│   ├── index.html         # Dashboard UI
│   ├── style.css          # Dark-theme responsive styles
│   └── script.js          # Fetch + Chart.js logic
├── server.js              # Express entry point
├── package.json
├── .env.example           # Environment variable template
└── .gitignore
```

---

## ⚙️ Tech Stack

| Layer     | Technology                      |
|-----------|---------------------------------|
| Frontend  | HTML, CSS, Vanilla JS, Chart.js |
| Backend   | Node.js, Express                |
| Database  | MongoDB (Mongoose)              |
| CORS      | cors npm package                |
| Config    | dotenv                          |

---

## 🚀 Running Locally

### 1. Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas cluster)

### 2. Clone & Install

```bash
git clone https://github.com/Akhilanand01/Forest_Fire.git
cd Forest_Fire
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your MONGODB_URI
```

### 4. Start the Server

```bash
npm start          # production
npm run dev        # development with auto-reload (nodemon)
```

Open **http://localhost:3000** in your browser.

---

## 🔌 API Reference

### `POST /api/data`

Store a new sensor reading from the IoT device.

**Request body (JSON):**

```json
{
  "temperature": 35.5,
  "smoke": 120,
  "flame": "NO",
  "humidity": 60.0,
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Success response (201):**

```json
{
  "success": true,
  "message": "Sensor data stored successfully",
  "data": { ... }
}
```

---

### `GET /api/data`

Retrieve the latest 20 sensor readings (newest first).

**Success response (200):**

```json
{
  "success": true,
  "count": 20,
  "data": [ ... ]
}
```

---

## 🔌 Arduino / IoT Integration

Use the `WiFiEsp` or `ESP8266HTTPClient` library to send a POST request from your Arduino:

```cpp
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

void sendData(float temp, int smoke, bool flame, float humidity, float lat, float lon) {
  WiFiClient client;
  HTTPClient http;
  http.begin(client, "http://<YOUR-SERVER-URL>/api/data");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["smoke"]       = smoke;
  doc["flame"]       = flame ? "YES" : "NO";
  doc["humidity"]    = humidity;
  doc["latitude"]    = lat;
  doc["longitude"]   = lon;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  http.end();
}
```

---

## ☁️ Deployment

### Backend → Render

1. Push the repo to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variable `MONGODB_URI` (your Atlas connection string).
6. Render will give you a public URL like `https://forest-fire.onrender.com`.

### Frontend

The frontend is served by the same Express server from the `public/` folder, so no separate deployment is needed. If you want to host it independently on Vercel:

1. Set `API_URL` in `public/script.js` to your full Render backend URL.
2. Deploy the `public/` folder via `vercel --prod`.

---

## 📊 Dashboard Features

- 🌡️ **Temperature** card with color indicator (green/yellow/red)
- 💨 **Smoke Level** card with ppm reading
- 🔥 **Flame Status** — pulses red alert banner when flame is detected
- 💧 **Humidity** card
- 📍 **Location** card with Google Maps link
- 📈 **Line chart** — Temperature & Humidity trend (last 20 readings)
- 📊 **Bar chart** — Smoke levels (last 20 readings)
- 📋 **Recent readings table**
- ⏱️ Auto-refresh every **5 seconds**

---

## 🎨 Color Indicators

| Condition         | Color  | Meaning       |
|-------------------|--------|---------------|
| Temperature < 40°C| 🟢 Green | Safe         |
| Temperature 40–60°C| 🟡 Yellow | Warning     |
| Temperature > 60°C| 🔴 Red | Danger        |
| Smoke < 300 ppm   | 🟢 Green | Safe         |
| Smoke 300–600 ppm | 🟡 Yellow | Warning     |
| Smoke > 600 ppm   | 🔴 Red | Danger        |
| Flame = NO        | 🟢 Green | Safe         |
| Flame = YES       | 🔴 Red | **DANGER!**  |