const crypto = require("crypto");

const base64UrlDecode = (value) =>
  JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

const verifyUserToken = (token, secret) => {
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

const requireUser = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.headers["x-user-token"];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "User token required",
    });
  }

  const secret = process.env.USER_TOKEN_SECRET;

  if (!secret) {
    return res.status(500).json({
      success: false,
      message: "User token secret is not configured",
    });
  }

  const payload = verifyUserToken(token, secret);

  if (!payload || payload.role !== "user") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired user token",
    });
  }

  req.user = payload;
  next();
};

module.exports = {
  requireUser,
};
