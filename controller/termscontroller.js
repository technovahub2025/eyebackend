const Pledge = require("../model/terms");
const { buildTermsPdf } = require("../utils/pdf");

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

// Download all pledges as a PDF report
exports.downloadPledgesPdf = async (req, res) => {
  try {
    const pledges = await Pledge.find().sort({ createdAt: -1 }).lean();
    const pdfBuffer = buildTermsPdf(pledges);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="terms-data-${new Date().toISOString().slice(0, 10)}.pdf"`
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

// Download single pledge by ID as PDF
exports.downloadPledgePdfById = async (req, res) => {
  try {
    const pledge = await Pledge.findById(req.params.id).lean();

    if (!pledge) {
      return res.status(404).json({
        success: false,
        message: "Pledge not found.",
      });
    }

    const pdfBuffer = buildTermsPdf([pledge]);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="terms-data-${pledge._id}.pdf"`
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

// Download multiple pledges by IDs as a single PDF
exports.downloadMultiplePledgesPdf = async (req, res) => {
  try {
    const idsParam = req.query.ids || req.params.ids;
    if (!idsParam) {
      return res.status(400).json({
        success: false,
        message: "ids query parameter is required (comma-separated).",
      });
    }

    const ids = String(idsParam)
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    const pledges = await Pledge.find({ _id: { $in: ids } })
      .sort({ createdAt: 1 })
      .lean();

    if (pledges.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pledges found for the provided IDs.",
      });
    }

    const pdfBuffer = buildTermsPdf(pledges);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="terms-data-${new Date().toISOString().slice(0, 10)}.pdf"`
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
