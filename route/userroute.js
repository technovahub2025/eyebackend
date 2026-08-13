const express = require("express");

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controller/authcontroller");
const { requireUser } = require("../middleware/userAuth");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/me", requireUser, getUserProfile);

module.exports = router;
