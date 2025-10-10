const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto"); // for token generation
const nodemailer = require("nodemailer"); // for sending emails

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Use either environment variable or fallback to your Atlas URI
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://KingCharmerStreeming:Asdf0909@cluster0.il7ja6v.mongodb.net/kc_streaming?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// 1. Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  dob: String,
  password: String,
  balance: { type: Number, default: 0 },
  investment: { type: String, default: null },
  isVerified: { type: Boolean, default: false }, // ✅ New field
  verificationToken: String, // ✅ Token for email verification
});

const User = mongoose.model("User", userSchema);

// 2. Configure Nodemailer
// 👉 Swap out with your own Gmail/SMTP or use services like SendGrid/Resend later
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "yourgmail@gmail.com",
    pass: process.env.EMAIL_PASS || "yourgmailpassword",
  },
});

// 3. API Route: Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, dob, password } = req.body;

    // check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // generate token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // save user
    const newUser = new User({
      name,
      email,
      phone,
      dob,
      password,
      verificationToken,
    });
    await newUser.save();

    // send verification email
    const verifyUrl = `http://localhost:5000/api/verify/${verificationToken}`;
    await transporter.sendMail({
      from: `"KC Bank" <${process.env.EMAIL_USER || "yourgmail@gmail.com"}>`,
      to: email,
      subject: "Verify your KC Bank account",
      html: `
        <h2>Welcome to KC Bank, ${name}!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
    });

    res.json({ message: "🎉 Account created! Please check your email to verify." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Try again later." });
  }
});

// 4. API Route: Verify Email
app.get("/api/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).send("Invalid or expired token.");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send("✅ Email verified! You can now log in to your KC Bank account.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
});

// 5. Start server
app.listen(5000, () =>
  console.log("🚀 Server running on http://localhost:5000")
);