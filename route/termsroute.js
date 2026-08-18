const express = require("express");

const {
  createPledge,
  getAllPledges,
  getPledgeById,
  downloadPledgesPdf,
  downloadPledgePdfById,
} = require("../controller/termscontroller");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/createterms", createPledge);
router.get("/getall", getAllPledges);
router.get("/gettermsbyid/:id", getPledgeById);
router.get("/download/pdf", requireAdmin, downloadPledgesPdf);
router.get("/download/pdf/:id", requireAdmin, downloadPledgePdfById);


module.exports = router;
