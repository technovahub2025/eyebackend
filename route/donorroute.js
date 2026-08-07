const express = require("express");

const { createDonor, getAllDonors } = require("../controller/eyecontroller");

const router = express.Router();

router.post("/", createDonor);
router.get("/", getAllDonors);

module.exports = router;
