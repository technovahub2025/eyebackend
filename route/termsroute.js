const express = require("express");

const {
  createPledge,
  getAllPledges,
  getPledgesPaginated,
  getPledgeById,
  downloadPledgesPdf,
  downloadPledgePdfById,
  downloadMultiplePledgesPdf,
} = require("../controller/termscontroller");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/createterms", createPledge);
router.get("/getall", getAllPledges);
router.get("/getall/paginated", requireAdmin, getPledgesPaginated);
router.get("/gettermsbyid/:id", getPledgeById);
router.get("/download/pdf", requireAdmin, downloadPledgesPdf);
router.get("/download/my", downloadMultiplePledgesPdf);
router.get("/download/my/:id", downloadPledgePdfById);


module.exports = router;
