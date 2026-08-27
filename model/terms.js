const mongoose = require("mongoose");

const mobileNumberPattern = /^[6-9]\d{9}$/;

const pledgeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      enum: ["Mr", "Mrs"],
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female"],
    },
    place: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [mobileNumberPattern, "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9."],
    },

    batchId: {
      type: String,
      trim: true,
      index: true,
    },

   
  },
  {
    timestamps: true,
  }
);

// Automatically change title based on gender.
// Mongoose 9 no longer passes `next()` into pre hooks, so use sync/async style.
pledgeSchema.pre("save", function () {
  this.title = this.gender === "Male" ? "Mr" : "Mrs";
});

module.exports = mongoose.model("terms", pledgeSchema);
