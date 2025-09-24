const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Load all locale files
const locales = {};
["en", "rw", "fr", "sw"].forEach((lang) => {
  try {
    locales[lang] = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../locales", `${lang}.json`), "utf8")
    );
  } catch (err) {
    console.error(`❌ Error loading locale file for ${lang}:`, err);
    locales[lang] = {}; // fallback empty
  }
});

// Configure transporter (reused across all email types)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// VERIFICATION EMAIL
const sendVerificationEmail = async (to, code, lang = "en") => {
  const locale = locales[lang] || locales["en"];
  const ev = locale.emailVerification || locales["en"].emailVerification;

  const mailOptions = {
    from: `"Oliviuus" <${process.env.EMAIL_USER}>`,
    to,
    subject: ev.verification_subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #2c3e50; margin: 0;">Oliviuus Team</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #2c3e50;">${ev.verification_subject}</h2>
          <p style="font-size: 16px;">${ev.verification_body.replace("{{code}}", code)}</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #e74c3c;"><strong>Note:</strong> ${ev.code_expires}</p>
          <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 12px; margin-top: 20px;">
            <p><strong>${ev.security_notice_title}</strong></p>
            <ul>
              <li>${ev.security_notice_li1}</li>
              <li>${ev.security_notice_li2}</li>
              <li>${ev.security_notice_li3}</li>
            </ul>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Oliviuus. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// WELCOME EMAIL
const sendWelcomeEmail = async (to, lang = "en") => {
  // Load locale safely
  const locale = locales[lang] || locales["en"];
  const we = locale.welcomeEmail || locales["en"].welcomeEmail;

  const mailOptions = {
    from: `"Oliviuus" <${process.env.EMAIL_USER}>`,
    to,
    subject: we.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #2c3e50; margin: 0;">${we.title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px;">${we.body}</p>
          <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 12px; margin-top: 20px;">
            <p><strong>${we.tip_title}</strong></p>
            <ul>
              ${we.tips.map((tip) => `<li>${tip}</li>`).join("")}
            </ul>
          </div>
          <p style="margin-top: 20px; font-size: 16px; font-weight: bold; color: #2c3e50;">
            ${we.closing}
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Oliviuus. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};



// ✅ EXPORT
module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
};
