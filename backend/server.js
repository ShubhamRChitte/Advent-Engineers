const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/employees", employeeRoutes);

// connect database
connectDB();

// start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
