const express = require("express");

const {
  createPledge,
  deletePledge,
  getAllPledges,
  getPledgesPaginated,
  getPledgeById,
} = require("../controller/termscontroller");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/createterms", createPledge);
router.get("/getall", getAllPledges);
router.get("/getall/paginated", requireAdmin, getPledgesPaginated);
router.get("/gettermsbyid/:id", getPledgeById);
router.delete("/:id", requireAdmin, deletePledge);


module.exports = router;
