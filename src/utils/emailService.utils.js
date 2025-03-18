// Load environment variables from a .env file (for development)
import nodemailer from 'nodemailer';
// Check for required environment variables to prevent runtime errors
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create a reusable transporter object for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,         // e.g., smtp.gmail.com
  port: process.env.SMTP_PORT,         // e.g., 587 for TLS, 465 for SSL
  secure: process.env.SMTP_SECURE === 'true', // true for port 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,       // SMTP username (e.g., your email)
    pass: process.env.SMTP_PASS,       // SMTP password or app-specific password
  },
  tls: {
    // Ensure certificate verification for security (optional customization)
    rejectUnauthorized: true,
  },
});

// Function to send an email
export async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,      // Sender address (e.g., "Your Name <your_email@gmail.com>")
    to: to,                            // Recipient email address
    subject: subject,                  // Email subject
    text: text,                        // Plain text body
    html: html,                        // HTML body (optional)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: ' + info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error; // Allow the caller to handle the error
  }
}

// // Example usage
// (async () => {
//   try {
//     await sendEmail(
//       'recipient@example.com',
//       'Test Email',
//       'This is a test email sent using Nodemailer.',
//       '<p>This is a <b>test email</b> sent using Nodemailer.</p>'
//     );
//   } catch (error) {
//     console.error('Failed to send email:', error);
//   }
// })();