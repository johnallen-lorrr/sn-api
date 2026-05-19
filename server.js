const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SN API Running"
    });
});

app.post("/heartbeat", (req, res) => {

    console.log("HEARTBEAT RECEIVED");
    console.log(req.body);

    res.json({
        success: true,
        message: "Heartbeat received"
    });

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
