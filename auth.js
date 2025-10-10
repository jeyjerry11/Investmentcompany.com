const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Forgot password (send email with token)
router.post("/forgot", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "No account with that email" });

  // Generate reset token
  const token = crypto.randomBytes(20).toString("hex");
  user.resetToken = token;
  user.resetTokenExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  // Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetLink = `http://localhost:5500/reset.html?token=${token}`; // change to your frontend URL

  await transporter.sendMail({
    from: `"Divine Wallet" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset",
    text: `Click here to reset your password: ${resetLink}`
  });

  res.json({ message: "Reset link sent to email" });
});

// Reset password
router.post("/reset/:token", async (req, res) => {
  const { password } = req.body;
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

