const Donor = require("../model/eyemodel");

const mobileNumberPattern = /^[6-9]\d{9}$/;

const isValidMobileNumber = (value) => mobileNumberPattern.test(`${value || ""}`.trim());

exports.createDonor = async (req, res) => {
  try {
    const { fullName, email, phone, notes } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, and phone are required",
      });
    }

    if (!isValidMobileNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.",
      });
    }

    const donor = await Donor.create({
      fullName,
      email,
      phone,
      notes,
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

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await Donor.countDocuments();

    const totalAccepted = await Donor.countDocuments({
      status: "Accepted",
    });

    const totalDeclined = await Donor.countDocuments({
      status: "Declined",
    });

    const totalPending = await Donor.countDocuments({
      status: "Pending",
    });

    const totalActive = await Donor.countDocuments({
      isActive: true,
    });

    const totalInactive = await Donor.countDocuments({
      isActive: false,
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAccepted,
        totalDeclined,
        totalPending,
        totalActive,
        totalInactive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Accepted", "Declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be Pending, Accepted, or Declined",
      });
    }

    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    res.json({
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

exports.deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    res.json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
