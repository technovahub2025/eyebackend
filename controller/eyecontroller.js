const Donor = require("../model/eyemodel");

exports.createDonor = async (req, res) => {
  try {
    const { name, age, gender } = req.body;

    if (!name || age === undefined || !gender) {
      return res.status(400).json({
        success: false,
        message: "name, age, and gender are required",
      });
    }

    const donor = await Donor.create({
      name,
      age,
      gender,
    });

    res.status(201).json({
      success: true,
      data: donor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: donors.length,
      data: donors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
