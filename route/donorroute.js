const express = require("express");

const {
  createDonor,
  getAllDonors,
  getDashboard,
  updateStatus,
  deleteDonor,
} = require("../controller/eyecontroller");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/", createDonor);

router.get("/", requireAdmin, getAllDonors);

router.get("/dashboard", requireAdmin, getDashboard);

router.put("/:id", requireAdmin, updateStatus);

router.delete("/:id", requireAdmin, deleteDonor);

module.exports = router;
