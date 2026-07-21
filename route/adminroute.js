const express = require("express");

const {
  loginAdmin,
  getAdminProfile,
} = require("../controller/authcontroller");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/login", loginAdmin);

router.get("/me", requireAdmin, getAdminProfile);

module.exports = router;
