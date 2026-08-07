const express = require("express");

const {
  createPledge,
  getAllPledges,
  getPledgeById,
  updatePledge,
  deletePledge,
} = require("../controller/termscontroller");

const router = express.Router();

router.post("createterms/", createPledge);
router.get("getall/", getAllPledges);
router.get("gettermsbyid/:id", getPledgeById);


module.exports = router;