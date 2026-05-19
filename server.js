const express = require("express");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
});

let onlinePlayers = [];
let activeServers = {};

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SN API Running"
    });
});

app.post("/heartbeat", (req, res) => {
    const data = req.body;

    console.log("HEARTBEAT RECEIVED");
    console.log(data);

    const jobId = data.job_id || "unknown";

    activeServers[jobId] = {
        job_id: jobId,
        place_id: data.place_id || "unknown",
        player_count: data.player_count || 0,
        last_ping: Date.now()
    };

    onlinePlayers = data.players || [];

    res.json({
        success: true,
        message: "Heartbeat saved",
        online_players: onlinePlayers.length,
        active_servers: Object.keys(activeServers).length
    });
});

app.get("/api/stats", (req, res) => {
    res.json({
        success: true,
        online_players: onlinePlayers.length,
        active_servers: Object.keys(activeServers).length,
        pending_commands: 0,
        total_commands: 0
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
        servers: Object.values(activeServers)
    });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
