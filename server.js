const express = require("express");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
});

let activeServers = {};
let playersByServer = {};

let commandQueue = [];
let commandLogs = [];
let commandId = 1;

let availableItems = [];

const TIMEOUT = 30000;

function cleanOldData() {
    const now = Date.now();

    for (const jobId in activeServers) {
        if (now - activeServers[jobId].last_ping > TIMEOUT) {
            delete activeServers[jobId];
            delete playersByServer[jobId];
        }
    }
}

function getAllPlayers() {
    let allPlayers = [];

    for (const jobId in playersByServer) {
        allPlayers = allPlayers.concat(playersByServer[jobId]);
    }

    return allPlayers;
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

    const jobId = data.job_id || "unknown";

    activeServers[jobId] = {
        job_id: jobId,
        place_id: data.place_id || "unknown",
        player_count: data.player_count || 0,
        last_ping: now
    };

    playersByServer[jobId] = (data.players || []).map(player => ({
        user_id: player.user_id,
        username: player.username,
        display_name: player.display_name,
        job_id: jobId,
        last_seen: now
    }));

    if (data.items && Array.isArray(data.items)) {
        availableItems = data.items;
    }

    cleanOldData();

    res.json({
        success: true,
        message: "Heartbeat saved",
        online_players: getAllPlayers().length,
        active_servers: Object.keys(activeServers).length
    });
});

app.get("/api/stats", (req, res) => {
    cleanOldData();

    res.json({
        success: true,
        online_players: getAllPlayers().length,
        active_servers: Object.keys(activeServers).length,
        pending_commands: commandQueue.filter(cmd => cmd.status === "pending").length,
        total_commands: commandQueue.length
    });
});

app.get("/api/players", (req, res) => {
    cleanOldData();

    res.json({
        success: true,
        players: getAllPlayers()
    });
});

app.get("/api/servers", (req, res) => {
    cleanOldData();

    res.json({
        success: true,
        servers: Object.values(activeServers)
    });
});

app.get("/api/items", (req, res) => {
    res.json({
        success: true,
        items: availableItems
    });
});

app.post("/api/commands", (req, res) => {
    const data = req.body;

    const command = {
        id: commandId++,
        type: data.type,
        target_user_id: data.target_user_id || null,
        target_username: data.target_username || null,
        job_id: data.job_id || "all",
        item_name: data.item_name || null,
        message: data.message || null,
        status: "pending",
        created_at: Date.now()
    };

    commandQueue.push(command);

    res.json({
        success: true,
        message: "Command added",
        command
    });
});

app.get("/api/commands/pending/:jobId", (req, res) => {
    const jobId = req.params.jobId;

    const commands = commandQueue.filter(cmd =>
        cmd.status === "pending" &&
        (cmd.job_id === jobId || cmd.job_id === "all")
    );

    res.json({
        success: true,
        commands
    });
});

app.post("/api/commands/complete", (req, res) => {
    const data = req.body;

    const command = commandQueue.find(cmd => cmd.id == data.id);

    if (!command) {
        return res.json({
            success: false,
            message: "Command not found"
        });
    }

    command.status = "completed";
    command.completed_at = Date.now();
    command.result = data.result || "Completed";

    commandLogs.push(command);

    res.json({
        success: true,
        message: "Command completed"
    });
});

app.get("/api/commands/logs", (req, res) => {
    res.json({
        success: true,
        logs: commandLogs
    });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
