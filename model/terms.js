const mongoose = require("mongoose");

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

   

   

   
  },
  {
    timestamps: true,
  }
);

// Automatically change title based on gender
pledgeSchema.pre("save", function (next) {
  this.title = this.gender === "Male" ? "Mr" : "Mrs";
  next();
});

module.exports = mongoose.model("terms", pledgeSchema);