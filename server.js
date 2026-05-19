const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_SECRET = "SNIGHTSHIFT_OWNER_API_7F2xQ9#Lm28@Secure";

let onlinePlayers = [];
let activeServers = [];

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SN API Running"
    });
});

app.post("/api/heartbeat", (req, res) => {

    const apiKey = req.headers["x-api-key"];

    if (apiKey !== API_SECRET) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    const data = req.body;

    console.log("Heartbeat Received:", data);

    activeServers.push({
        job_id: data.job_id,
        place_id: data.place_id,
        player_count: data.player_count
    });

    onlinePlayers = data.players || [];

    res.json({
        success: true,
        message: "Heartbeat received",
        players: onlinePlayers.length
    });
});

app.get("/api/players", (req, res) => {
    res.json({
        success: true,
        players: onlinePlayers
    });
});

app.get("/api/servers", (req, res) => {
    res.json({
        success: true,
        servers: activeServers
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});