const crypto = require("crypto");
const Donor = require("../model/eyemodel");

const mobileNumberPattern = /^[6-9]\d{9}$/;

const isValidMobileNumber = (value) => mobileNumberPattern.test(`${value || ""}`.trim());

const createSignedToken = (payload, secret) => {
  const tokenPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  const signature = crypto
    .createHmac("sha256", secret)
    .update(tokenPayload)
    .digest("base64url");

  return `${tokenPayload}.${signature}`;
};

exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminSecret = process.env.ADMIN_TOKEN_SECRET;

    if (!adminUsername || !adminPassword || !adminSecret) {
      return res.status(500).json({
        success: false,
        message: "Admin credentials are not configured",
      });
    }

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = createSignedToken(
      {
        username: adminUsername,
        role: "admin",
        exp: Date.now() + 12 * 60 * 60 * 1000,
      },
      adminSecret
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        username: adminUsername,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAdminProfile = async (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, notes } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and phone are required",
      });
    }

    if (!isValidMobileNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.",
      });
    }

    const existingDonor = await Donor.findOne({
      email: email.toLowerCase(),
      phone,
    });

    if (existingDonor) {
      return res.status(409).json({
        success: false,
        message: "A donor with this email and phone already exists",
      });
    }

    const donor = await Donor.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      notes: notes || "",
      status: "Pending",
      isActive: true,
    });

    const userSecret = process.env.USER_TOKEN_SECRET;

    if (!userSecret) {
      return res.status(500).json({
        success: false,
        message: "User token secret is not configured",
      });
    }

    const token = createSignedToken(
      {
        userId: donor._id.toString(),
        email: donor.email,
        role: "user",
        exp: Date.now() + 12 * 60 * 60 * 1000,
      },
      userSecret
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        phone: donor.phone,
        status: donor.status,
        notes: donor.notes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email and phone are required",
      });
    }

    if (!isValidMobileNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.",
      });
    }

    const donor = await Donor.findOne({
      email: email.toLowerCase(),
      phone,
    });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "User record not found",
      });
    }

    const userSecret = process.env.USER_TOKEN_SECRET;

    if (!userSecret) {
      return res.status(500).json({
        success: false,
        message: "User token secret is not configured",
      });
    }

    const token = createSignedToken(
      {
        userId: donor._id.toString(),
        email: donor.email,
        role: "user",
        exp: Date.now() + 12 * 60 * 60 * 1000,
      },
      userSecret
    );

    res.json({
      success: true,
      message: "User login successful",
      token,
      user: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        phone: donor.phone,
        status: donor.status,
        notes: donor.notes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.userId);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "User record not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        phone: donor.phone,
        status: donor.status,
        notes: donor.notes,
        isActive: donor.isActive,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
