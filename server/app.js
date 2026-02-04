const express = require("express");
const cors = require("cors");

const orderRoutes = require("./routes/order.routes");
const transformerRoutes = require("./routes/transformer.routes"); // ⭐ add this

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/orders", orderRoutes);
app.use("/api/transformers", transformerRoutes); // ⭐ add this

module.exports = app;
