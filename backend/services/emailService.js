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
  host: "smtp.gmail.com",
  port: 587, // MUST use 587 on Render
  secure: false, // false for port 587
  requireTLS: true, // Enable TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Render-specific settings:
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 30000, // 30 seconds
  // Add TLS options:
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Allow self-signed certs
  },
});

transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email connection failed:', {
      error: error.message,
      code: error.code,
      port: process.env.EMAIL_PORT || 587
    });
    
    // Try alternative port if 587 fails
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('⚠️ Trying alternative SMTP configurations...');
    }
  } else {
    console.log('✅ Email server is ready to send messages');
  }
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
          &copy; ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.
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
          &copy; ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// RESET PASSWORD EMAIL
const sendPasswordResetEmail = async (to, resetLink, lang = "en") => {
  const locale = locales[lang] || locales["en"];
  const pr = locale.passwordReset || locales["en"].passwordReset;

  const mailOptions = {
    from: `"Oliviuus" <${process.env.EMAIL_USER}>`,
    to,
    subject: pr.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                  border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;
                    border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #2c3e50; margin: 0;">Oliviuus Team</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #2c3e50;">${pr.title}</h2>
          <p style="font-size: 16px;">${pr.body}</p>
          <a href="${resetLink}" style="display: inline-block; margin: 20px 0; 
             padding: 12px 24px; background-color: #BC8BBC; color: #fff;
             text-decoration: none; border-radius: 4px; font-weight: bold;">
            ${pr.button_text}
          </a>
          <p style="font-size: 14px; color: #555;">${pr.expiry_notice}</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center;
                    border-top: 1px solid #e0e0e0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ACCOUNT CREATED EMAIL (for admin-created users)
const sendAccountCreatedEmail = async (to, resetLink, lang = "en") => {
  const locale = locales[lang] || locales["en"];
  const ac = locale.accountCreated || locales["en"].accountCreated;

  const mailOptions = {
    from: `"Oliviuus" <${process.env.EMAIL_USER}>`,
    to,
    subject: ac.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #2c3e50; margin: 0;">Oliviuus Team</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #2c3e50;">${ac.title}</h2>
          <p style="font-size: 16px;">${ac.body}</p>
          <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #BC8BBC; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">
            ${ac.button_text}
          </a>
          <p style="font-size: 14px; color: #555;">${ac.note}</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// REPLY TO CONTACT EMAIL
const sendContactReplyEmail = async (to, replyMessage, originalSubject) => {
  const mailOptions = {
    from: `"Oliviuus Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Re: ${originalSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #2c3e50; margin: 0;">Oliviuus Team</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; white-space: pre-wrap;">${replyMessage}</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ADMIN MESSAGE EMAIL
const sendAdminMessageEmail = async (to, subject, message, userName) => {
  const mailOptions = {
    from: `"Oliviuus Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #2c3e50; margin: 0;">Oliviuus Team</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #2c3e50;">${subject}</h2>
          <p style="font-size: 16px; color: #333; white-space: pre-wrap; line-height: 1.6;">${message}</p>
          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              This is an important message from the Oliviuus administration team.
            </p>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// FAMILY INVITATION EMAIL
const sendFamilyInvitationEmail = async (to, ownerEmail, invitationToken, lang = "en", memberRole = "child", hasActiveSubscription = false, currentPlan = null, isFamilyPlan = false) => {
  const locale = locales[lang] || locales["en"];
  const fi = locale.familyInvitation || locales["en"].familyInvitation;

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const acceptLink = `${clientUrl}/account/settings#family-invitations`;

  // Enhanced message based on subscription status
  let subscriptionNotice = '';

  if (hasActiveSubscription) {
    if (isFamilyPlan) {
      subscriptionNotice = `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0;">
          <p><strong>⚠️ Important Notice:</strong> You currently have an active ${currentPlan || 'family plan'}.</p>
          <p>Users with active family plans cannot join other families. You would need to cancel your current family plan to accept this invitation.</p>
        </div>`;
    } else {
      subscriptionNotice = `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0;">
          <p><strong>📋 Important Note:</strong> You currently have an active ${currentPlan || 'subscription'}.</p>
          <p>When you accept this family invitation, your current subscription will be paused and you'll use the family plan instead.</p>
        </div>`;
    }
  }

  const mailOptions = {
    from: `"Oliviuus Family" <${process.env.EMAIL_USER}>`,
    to,
    subject: fi.subject.replace("{{owner}}", ownerEmail),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #2c3e50; margin: 0;">Oliviuus Family</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #2c3e50;">${fi.title.replace("{{owner}}", ownerEmail)}</h2>
          <p style="font-size: 16px;">${fi.body.replace("{{owner}}", ownerEmail).replace("{{role}}", memberRole)}</p>
          
          ${subscriptionNotice}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptLink}" style="display: inline-block; padding: 12px 30px; background-color: #BC8BBC; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
              ${fi.button_text}
            </a>
          </div>

          <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 12px; margin-top: 20px;">
            <p><strong>${fi.note_title}</strong></p>
            <p>${fi.note_body}</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            ${fi.expiry_notice}
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.
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
  sendPasswordResetEmail,
  sendAccountCreatedEmail,
  sendContactReplyEmail,
  sendAdminMessageEmail,
  sendFamilyInvitationEmail,
};
