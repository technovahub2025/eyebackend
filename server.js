require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const donorRoutes = require("./route/donorroute");
const adminRoutes = require("./route/adminroute");
const userRoutes = require("./route/userroute");

const app = express();

connectDB();

// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3001",
     "https://eyedonorfrontend.vercel.app/"
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/donors", donorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VisionGift API Running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});