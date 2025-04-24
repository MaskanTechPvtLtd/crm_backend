export const DB_NAME = "videostreaming";
export const PORT = process.env.PORT;
export const cloudinary_cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
export const cloudinary_api_key = process.env.CLOUDINARY_API_KEY;
export const cloudinary_api_secret = process.env.CLOUDINARY_API_SECRET;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
// variables to connect with the database
export const username = String(process.env.USER_NAME);
export const password = String(process.env.PASSWORD);
export const database = String(process.env.DATABASE_NAME);
export const host = String(process.env.HOST);
export const dialect = String(process.env.DILECT);


// emailTemplates.js

// Function to generate the HTML with dynamic OTP
export const getVerificationEmailTemplate = ({ otp, companyName = 'Your Company Name', supportEmail = 'support@yourcompany.com', website = 'https://yourcompany.com', }) =>
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset styles */
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
      color: #333333;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    /* Container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    /* Header */
    .header {
      background-color: #0066cc;
      padding: 20px;
      text-align: center;
      color: #ffffff;
    }
    /* Content */
    .content {
      padding: 30px;
      text-align: center;
    }
    .otp-box {
      background-color: #f8f9fa;
      display: inline-block;
      padding: 15px 25px;
      border-radius: 5px;
      margin: 20px 0;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #0066cc;
    }
    /* Footer */
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px;
      }
      .otp-box {
        font-size: 20px;
        padding: 10px 20px;
      }
    }
  </style>
</head>
<body>
  <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Email Verification</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; font-size: 20px;">Verify Your Email Address</h2>
            <p style="line-height: 1.6;">Thank you for registering with ${companyName}! Please use the OTP below to verify your email address:</p>
            <div class="otp-box">${otp}</div>
            <p style="line-height: 1.6;">This OTP will expire in <strong>15 minutes</strong>.</p>
            <p style="line-height: 1.6;">If you didn't request this, please ignore this email or contact our support team.</p>
          </div>
          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            <p style="margin: 5px 0 0;">
              <a href="mailto:${supportEmail}">Contact Support</a> | 
              <a href="${website}/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const getForgotPasswordTemplate = ({ otp, companyName = 'Your Company Name', supportEmail = 'support@yourcompany.com', website = 'https://yourcompany.com', email }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Reset styles */
      body {
        margin: 0;
        padding: 0;
        font-family: 'Arial', sans-serif;
        background-color: #f4f4f4;
        color: #333333;
      }
      a {
        color: #0066cc;
        text-decoration: none;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .header {
        background-color: #0066cc;
        padding: 20px;
        text-align: center;
        color: #ffffff;
      }
      .content {
        padding: 30px;
        text-align: center;
      }
      .otp-box {
        background-color: #f8f9fa;
        display: inline-block;
        padding: 15px 25px;
        border-radius: 5px;
        margin: 20px 0;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 5px;
        color: #0066cc;
      }
      .footer {
        background-color: #f8f9fa;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666666;
      }
      @media only screen and (max-width: 600px) {
        .container {
          width: 100%;
          margin: 0;
          border-radius: 0;
        }
        .content {
          padding: 20px;
        }
        .otp-box {
          font-size: 20px;
          padding: 10px 20px;
        }
      }
    </style>
  </head>
  <body>
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
      <tr>
        <td align="center">
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Password Reset</h1>
            </div>
            <div class="content">
              <h2 style="margin-top: 0; font-size: 20px;">Reset Your Password</h2>
              <p style="line-height: 1.6;">We received a request to reset your password for your ${email} account. Use the OTP below to proceed:</p>
              <div class="otp-box">${otp}</div>
              <p style="line-height: 1.6;">This OTP will expire in <strong>15 minutes</strong>.</p>
              <p style="line-height: 1.6;">If you didn’t request a password reset, please ignore this email or contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
            </div>
            <div class="footer">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p style="margin: 5px 0 0;">
                <a href="mailto:${supportEmail}">Contact Support</a> | 
                <a href="${website}/privacy">Privacy Policy</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;
export const getEmployeeCredentialEmailTemplate = ({
  first_name,
  role,
  username,
  password,
  companyName = "Mobile CRM",
  supportEmail = "support@yourcrm.com",
  website = "https://yourcrm.com",
}) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <h2 style="color: #4CAF50;">Welcome to ${companyName}, ${first_name}!</h2>
      <p>You have been successfully added as a <strong>${role}</strong>.</p>

      <h3 style="color: #333;">Login Credentials</h3>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>

      <p>You can use your <strong>email</strong>, <strong>phone number</strong>, or <strong>username</strong> to log in.</p>
      <p><strong>Please update your password after your first login for security purposes.</strong></p>

      <p>If you have any issues, feel free to reach out to us at 
        <a href="mailto:${supportEmail}">${supportEmail}</a>.
      </p>

      <p>Visit our website: <a href="${website}" target="_blank">${website}</a></p>

      <br />
      <p>Regards,</p>
      <p><strong>${companyName} Team</strong></p>
    </div>
  `;
};

export const predefinedStatuses = [
  { status_id: 1, status_name: "active" },
  { status_id: 2, status_name: "pending" },
  { status_id: 3, status_name: "completed" },
  { status_id: 4, status_name: "cancelled" },
  { status_id: 5, status_name: "in_progress" },
  { status_id: 6, status_name: "archived" },
  { status_id: 7, status_name: "inactive" },
  { status_id: 8, status_name: "sold" },
];

export const predefinedLeadSources = [
  { source_id: 1, source_name: "website" },
  { source_id: 2, source_name: "social media" },
  { source_id: 3, source_name: "referral" },
  { source_id: 4, source_name: "cold call" },
  { source_id: 5, source_name: "email_campaign" },
  { source_id: 6, source_name: "walk_in" },
];

export const predefinedPropertyTypes = [
  { property_type_id: 1, type_name: "apartment" },
  { property_type_id: 2, type_name: "house" },
  { property_type_id: 3, type_name: "villa" },
  { property_type_id: 4, type_name: "commercial" },
  { property_type_id: 5, type_name: "land" },
  { property_type_id: 6, type_name: "townhouse" },
];


export const predefinedLeadStatuses = [
  { status_id: 1, status_name: "new_lead" },
  { status_id: 2, status_name: "contacted" },
  { status_id: 3, status_name: "interested" },
  { status_id: 4, status_name: "under_negotiation" },
  { status_id: 5, status_name: "finalized" },
  { status_id: 6, status_name: "closed" },
  { status_id: 7, status_name: "not_interested" },
];

export const predefinedPropertyAmenities = [
  { amenity_id: 1, amenity_name: "swimming_pool" },
  { amenity_id: 2, amenity_name: "gymnasium" },
  { amenity_id: 3, amenity_name: "parking" },
  { amenity_id: 4, amenity_name: "24x7_security" },
  { amenity_id: 5, amenity_name: "power_backup" },
  { amenity_id: 6, amenity_name: "lift_elevator" },
  { amenity_id: 7, amenity_name: "clubhouse" },
  { amenity_id: 8, amenity_name: "garden_park" },
  { amenity_id: 9, amenity_name: "childrens_play_area" },
  { amenity_id: 10, amenity_name: "gated_community" },
  { amenity_id: 11, amenity_name: "cctv_surveillance" },
  { amenity_id: 12, amenity_name: "intercom" },
  { amenity_id: 13, amenity_name: "rainwater_harvesting" },
  { amenity_id: 14, amenity_name: "wifi_connectivity" },
  { amenity_id: 15, amenity_name: "air_conditioning" },
  { amenity_id: 16, amenity_name: "fire_fighting_systems" },
  { amenity_id: 17, amenity_name: "visitor_parking" },
  { amenity_id: 18, amenity_name: "indoor_games" },
  { amenity_id: 19, amenity_name: "maintenance_staff" },
  { amenity_id: 20, amenity_name: "jogging_track" },
];


export const generateStrongPassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + symbols;

  let password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  return password.sort(() => 0.5 - Math.random()).join('');
};
export const predefinepropertyStatuses = [
  { status_id: 1, status_name: "ready_to_move" },
  { status_id: 2, status_name: "under_construction" },
  { status_id: 3, status_name: "sold" },
  { status_id: 4, status_name: "available" },
  { status_id: 5, status_name: "rented" },
  { status_id: 6, status_name: "off_market" },
  { status_id: 7, status_name: "under_renovation" }
];

