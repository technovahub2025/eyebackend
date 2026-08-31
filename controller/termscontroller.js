const Pledge = require("../model/terms");
const { buildTermsPdf } = require("../utils/pdf");

const mobileNumberPattern = /^[6-9]\d{9}$/;

const isValidMobileNumber = (value) => mobileNumberPattern.test(`${value || ""}`.trim());

// Create pledge
exports.createPledge = async (req, res) => {
  try {
    const { name, age, gender, place, phone, batchId } = req.body;
    const ageValue = Number(age);

    if (!name || !age || !gender || !place || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, age, gender, place, and phone are required.",
      });
    }

    if (!["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be Male or Female.",
      });
    }

    if (!Number.isFinite(ageValue) || ageValue < 1 || ageValue > 99) {
      return res.status(400).json({
        success: false,
        message: "Age must be between 1 and 99.",
      });
    }

    if (phone && !isValidMobileNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.",
      });
    }

    const pledge = await Pledge.create({
      name,
      age: ageValue,
      gender,
      place,
      phone,
      batchId,
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

// Get pledges with pagination
exports.getPledgesPaginated = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [pledges, total] = await Promise.all([
      Pledge.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Pledge.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: pledges,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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

// Get one pledge as a PDF for admin use
exports.getPledgePdfById = async (req, res) => {
  try {
    const pledge = await Pledge.findById(req.params.id);

    if (!pledge) {
      return res.status(404).json({
        success: false,
        message: "Pledge not found.",
      });
    }

    const pdfBuffer = buildTermsPdf([pledge]);
    const safeName = (pledge.name || "pledge")
      .toString()
      .trim()
      .replace(/[^\w.-]+/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="terms-pledge-${safeName}-${pledge._id}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a pledge by ID
exports.deletePledge = async (req, res) => {
  try {
    const pledge = await Pledge.findByIdAndDelete(req.params.id);

    if (!pledge) {
      return res.status(404).json({
        success: false,
        message: "Pledge not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pledge deleted successfully.",
      data: pledge,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export pledges as PDF
exports.exportPledgesPdf = async (req, res) => {
  try {
    const incomingRows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const rows = incomingRows.length > 0 ? incomingRows : await Pledge.find().sort({ createdAt: -1 });
    const pdfBuffer = buildTermsPdf(rows);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="terms-entries-export.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
