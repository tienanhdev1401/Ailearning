import nodemailer from "nodemailer";

// Brevo (Sendinblue) SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,  // Login email từ Brevo
    pass: process.env.SMTP_KEY,   // SMTP Key từ Brevo
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

export default transporter;
