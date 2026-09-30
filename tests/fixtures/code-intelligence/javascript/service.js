const express = require("express");
const app = express();

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "healthy", timestamp: Date.now() });
});

app.post("/api/v1/orders", async (req, res) => {
  try {
    const order = req.body;
    res.status(201).json({ id: "ord_123", ...order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { app };
