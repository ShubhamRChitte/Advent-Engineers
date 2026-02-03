const Employee = require("../models/Employee");

// GET all
const getEmployees = async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
};

// ADD
const addEmployee = async (req, res) => {
  const employee = new Employee(req.body);
  const saved = await employee.save();
  res.status(201).json(saved);
};

// DELETE
const deleteEmployee = async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.json({ message: "Employee deleted" });
};

// UPDATE
const updateEmployee = async (req, res) => {
  const updated = await Employee.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
};

module.exports = {
  getEmployees,
  addEmployee,
  deleteEmployee,
  updateEmployee,
};
