const crypto = require("crypto");

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const base64UrlDecode = (value) =>
  JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

const verifyAdminToken = (token, secret) => {
  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadPart)
    .digest("base64url");

  if (
    signaturePart.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signaturePart),
      Buffer.from(expectedSignature)
    )
  ) {
    return null;
  }

  const payload = base64UrlDecode(payloadPart);

  if (!payload.exp || Date.now() > payload.exp) {
    return null;
  }

  return payload;
};

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.headers["x-admin-token"];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin token required",
    });
  }

  const secret = process.env.ADMIN_TOKEN_SECRET;

  if (!secret) {
    return res.status(500).json({
      success: false,
      message: "Admin token secret is not configured",
    });
  }

  const payload = verifyAdminToken(token, secret);

  if (!payload || payload.role !== "admin") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token",
    });
  }

  req.admin = payload;
  next();
};

module.exports = {
  requireAdmin,
};
