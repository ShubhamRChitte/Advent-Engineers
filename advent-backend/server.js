// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB (local or Atlas)
mongoose.connect("mongodb+srv://kbtug23012_db_user:rAY0NkNtASnVZCkH@cluster0.0jqskhd.mongodb.net/?appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));
// Define a schema
const OrderSchema = new mongoose.Schema({
  jobId: String,
  status: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
});

// Create a model
const Order = mongoose.model("Order", OrderSchema);

// Routes
app.get("/orders", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

app.post("/orders", async (req, res) => {
  const newOrder = new Order(req.body);
  await newOrder.save();
  res.json(newOrder);
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));