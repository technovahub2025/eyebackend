const express = require("express");

const {
  loginAdmin,
  getAdminProfile,
} = require("../controller/authcontroller");
const {
  getPledgePdfById,
} = require("../controller/termscontroller");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/login", loginAdmin);

router.get("/me", requireAdmin, getAdminProfile);
router.get("/terms/:id/pdf", requireAdmin, getPledgePdfById);

module.exports = router;
