const express = require("express");
const router = express.Router();

const {
  getEmployees,
  addEmployee,
  deleteEmployee,
  updateEmployee,
} = require("../controllers/employeeController");

router.get("/", getEmployees);
router.post("/", addEmployee);
router.delete("/:id", deleteEmployee);
router.put("/:id", updateEmployee);

module.exports = router;
