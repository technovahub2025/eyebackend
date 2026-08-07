const Pledge = require("../model/terms");

// Create pledge
exports.createPledge = async (req, res) => {
  try {
    const { name, age, gender } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({
        success: false,
        message: "Name, age and gender are required.",
      });
    }

    if (!["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be Male or Female.",
      });
    }

    const pledge = await Pledge.create({
      name,
      age,
      gender,
    });

    return res.status(201).json({
      success: true,
      message: "Pledge created successfully.",
      data: pledge,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all pledges
exports.getAllPledges = async (req, res) => {
  try {
    const pledges = await Pledge.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pledges.length,
      data: pledges,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get one pledge
exports.getPledgeById = async (req, res) => {
  try {
    const pledge = await Pledge.findById(req.params.id);

    if (!pledge) {
      return res.status(404).json({
        success: false,
        message: "Pledge not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: pledge,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
