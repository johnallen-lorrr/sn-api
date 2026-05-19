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

const TIMEOUT = 30000; // 30 seconds

function cleanOldData() {
    const now = Date.now();

    for (const jobId in activeServers) {
        if (now - activeServers[jobId].last_ping > TIMEOUT) {
            delete activeServers[jobId];
        }
    }

    onlinePlayers = onlinePlayers.filter(player => {
        return now - player.last_seen <= TIMEOUT;
    });
}

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SN API Running"
    });
});

app.post("/heartbeat", (req, res) => {
    const data = req.body;
    const now = Date.now();

    console.log("HEARTBEAT RECEIVED");
    console.log(data);

    const jobId = data.job_id || "unknown";

    activeServers[jobId] = {
        job_id: jobId,
        place_id: data.place_id || "unknown",
        player_count: data.player_count || 0,
        last_ping: now
    };

    onlinePlayers = (data.players || []).map(player => {
        return {
            user_id: player.user_id,
            username: player.username,
            display_name: player.display_name,
            job_id: jobId,
            last_seen: now
        };
    });

    cleanOldData();

    res.json({
        success: true,
        message: "Heartbeat saved",
        online_players: onlinePlayers.length,
        active_servers: Object.keys(activeServers).length
    });
});

app.get("/api/stats", (req, res) => {
    cleanOldData();

    res.json({
        success: true,
        online_players: onlinePlayers.length,
        active_servers: Object.keys(activeServers).length,
        pending_commands: 0,
        total_commands: 0
    });
});

app.get("/api/players", (req, res) => {
    cleanOldData();

    res.json({
        success: true,
        players: onlinePlayers
    });
});

app.get("/api/servers", (req, res) => {
    cleanOldData();

    res.json({
        success: true,
        servers: Object.values(activeServers)
    });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
