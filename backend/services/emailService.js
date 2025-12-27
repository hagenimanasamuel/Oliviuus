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
    locales[lang] = {};
  }
});

// Configure transporter with production-ready settings
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
});

// Professional greeting alternatives
const getProfessionalGreeting = (email = null, lang = "en") => {
  const emailUsername = email ? email.split('@')[0] : null;
  
  // Try to extract name from email if it looks like a name
  if (emailUsername && emailUsername.length > 2 && emailUsername.length < 20) {
    // Check if email username looks like a name (not numbers/random)
    const looksLikeName = /^[a-zA-Z]+$/.test(emailUsername) && !/\d/.test(emailUsername);
    if (looksLikeName) {
      return `Hello ${emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)},`;
    }
  }
  
  // Language-specific greetings
  const greetingsByLang = {
    en: [
      "Hello valued member,",
      "Greetings from Oliviuus,",
      "Hello esteemed viewer,",
      "Dear premium member,",
      "Hello and welcome,",
    ],
    rw: [
      "Muraho Neza,",
      "Ikaze kuri Oliviuus,",
      "Muraho,",
      "Murakaza neza,",
    ],
    fr: [
      "Bonjour cher membre,",
      "Salutations d'Oliviuus,",
      "Bonjour et bienvenue,",
      "Cher utilisateur,",
    ],
    sw: [
      "Habari mwanachama,",
      "Karibu Oliviuus,",
      "Hujambo,",
      "Salama,",
    ]
  };
  
  const greetings = greetingsByLang[lang] || greetingsByLang.en;
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex];
};

// Professional closing alternatives
const getProfessionalClosing = (lang = "en") => {
  const closingsByLang = {
    en: [
      "Best regards,",
      "Sincerely,",
      "With appreciation,",
      "Happy streaming,",
      "Your friends at Oliviuus,",
    ],
    rw: [
      "Amahoro,",
      "Murakoze,",
      "Tuzajya tubonana,",
    ],
    fr: [
      "Cordialement,",
      "Sincèrement,",
      "Avec nos meilleures salutations,",
    ],
    sw: [
      "Kwa hisani,",
      "Kwa upendo,",
      "Ahsante,",
    ]
  };
  
  const closings = closingsByLang[lang] || closingsByLang.en;
  const randomIndex = Math.floor(Math.random() * closings.length);
  return closings[randomIndex];
};

// Base HTML template function with professional design
const getBaseTemplate = (content, lang = "en", showActionButton = true, buttonText = "Visit Oliviuus", buttonUrl = "https://oliviuus.com", emailType = "general") => {
  const logoUrl = "https://oliviuus.com/oliviuus_logo_transparent.png";
  const baseUrl = process.env.CLIENT_URL || "https://oliviuus.com";
  
  // Email type specific styling
  const getEmailTheme = (type) => {
    const themes = {
      verification: {
        headerGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        buttonGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        buttonShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
        icon: "🔐"
      },
      welcome: {
        headerGradient: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
        buttonGradient: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
        buttonShadow: "0 4px 20px rgba(72, 187, 120, 0.3)",
        icon: "🎉"
      },
      security: {
        headerGradient: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
        buttonGradient: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
        buttonShadow: "0 4px 20px rgba(237, 137, 54, 0.3)",
        icon: "🛡️"
      },
      family: {
        headerGradient: "linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)",
        buttonGradient: "linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)",
        buttonShadow: "0 4px 20px rgba(159, 122, 234, 0.3)",
        icon: "👨‍👩‍👧‍👦"
      },
      support: {
        headerGradient: "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)",
        buttonGradient: "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)",
        buttonShadow: "0 4px 20px rgba(66, 153, 225, 0.3)",
        icon: "📧"
      },
      admin: {
        headerGradient: "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
        buttonGradient: "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
        buttonShadow: "0 4px 20px rgba(74, 85, 104, 0.3)",
        icon: "📢"
      },
      general: {
        headerGradient: "linear-gradient(135deg, #BC8BBC 0%, #9C7A9C 100%)",
        buttonGradient: "linear-gradient(135deg, #BC8BBC 0%, #9C7A9C 100%)",
        buttonShadow: "0 4px 20px rgba(188, 139, 188, 0.3)",
        icon: "🎬"
      }
    };
    
    return themes[type] || themes.general;
  };
  
  const theme = getEmailTheme(emailType);
  
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oliviuus</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
        }
        
        .email-header {
            background: ${theme.headerGradient};
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .logo-container {
            margin-bottom: 20px;
        }
        
        .logo {
            height: 48px;
            width: auto;
            filter: brightness(0) invert(1);
        }
        
        .email-header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }
        
        .email-content {
            padding: 40px 30px;
            background: white;
        }
        
        .content-section {
            margin-bottom: 32px;
        }
        
        .content-section h2 {
            color: #1a202c;
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .content-section p {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 16px;
        }
        
        .code-display {
            background: linear-gradient(135deg, #f6f8ff 0%, #f1f5ff 100%);
            border: 2px dashed #667eea;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
        }
        
        .verification-code {
            font-size: 32px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: 8px;
            margin: 0;
        }
        
        .button-primary {
            display: inline-block;
            background: ${theme.buttonGradient};
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: ${theme.buttonShadow};
        }
        
        .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
        }
        
        .button-action {
            display: inline-block;
            background: linear-gradient(135deg, #BC8BBC 0%, #9C7A9C 100%);
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(188, 139, 188, 0.3);
            margin: 20px 0;
        }
        
        .button-action:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(188, 139, 188, 0.4);
        }
        
        .info-box {
            background: #f0f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
        }
        
        .info-box h3 {
            color: #2d3748;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .info-box ul {
            margin-left: 20px;
            color: #4a5568;
        }
        
        .info-box li {
            margin-bottom: 8px;
        }
        
        .warning-box {
            background: #fffaf0;
            border-left: 4px solid #ed8936;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
        }
        
        .tip-box {
            background: linear-gradient(135deg, #f6fff0 0%, #f0fff4 100%);
            border-left: 4px solid #48bb78;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
        }
        
        .footer {
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
            padding: 40px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-logo {
            height: 36px;
            width: auto;
            margin-bottom: 20px;
            opacity: 0.9;
        }
        
        .footer-text {
            color: #cbd5e0;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 24px;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 24px 0 32px;
        }
        
        .social-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            color: white;
            text-decoration: none;
            font-size: 18px;
            transition: all 0.3s ease;
        }
        
        .social-link:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .social-link.instagram { color: #E1306C; }
        .social-link.twitter { color: #1DA1F2; }
        .social-link.linkedin { color: #0077B5; }
        .social-link.globe { color: #48bb78; }
        
        .footer-links {
            margin-top: 16px;
            display: flex;
            justify-content: center;
            gap: 24px;
            flex-wrap: wrap;
        }
        
        .footer-links a {
            color: #a0aec0;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s ease;
        }
        
        .footer-links a:hover {
            color: white;
        }
        
        .action-section {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #f6f8ff 0%, #f1f5ff 100%);
            border-radius: 12px;
            margin: 32px 0;
            border: 1px solid #e2e8f0;
        }
        
        .action-section h3 {
            color: #2d3748;
            font-size: 20px;
            margin-bottom: 16px;
        }
        
        .action-section p {
            color: #4a5568;
            margin-bottom: 24px;
            font-size: 16px;
        }
        
        .brand-marker {
            display: inline-block;
            padding: 4px 12px;
            background: linear-gradient(135deg, #BC8BBC 0%, #9C7A9C 100%);
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .professional-signature {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #4a5568;
            font-size: 15px;
        }
        
        .signature-name {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 5px;
        }
        
        .signature-title {
            color: #718096;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 640px) {
            .email-content {
                padding: 30px 20px;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .button-primary, .button-action, .button-secondary {
                display: block;
                width: 100%;
                text-align: center;
                margin: 10px 0;
            }
            
            .verification-code {
                font-size: 24px;
                letter-spacing: 4px;
            }
            
            .social-links {
                gap: 15px;
            }
            
            .footer-links {
                gap: 15px;
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo-container">
                <img src="${logoUrl}" alt="Oliviuus Logo" class="logo">
            </div>
            ${content}
        </div>
        ${showActionButton ? `
        <div class="action-section">
            <div class="brand-marker">Oliviuus Premium</div>
            <h3>Ready to get started?</h3>
            <p>Experience premium features and exclusive content on Oliviuus</p>
            <a href="${buttonUrl}" class="button-action">
                ${buttonText}
            </a>
        </div>
        ` : ''}
        <div class="footer">
            <img src="${logoUrl}" alt="Oliviuus Logo" class="footer-logo">
            <p class="footer-text">
                © ${new Date().getFullYear()} Oliviuus Ltd. All rights reserved.<br>
                Premium streaming and content platform
            </p>
            
            <div class="social-links">
                <a href="https://www.instagram.com/oliviuusoriginal" class="social-link instagram" title="Follow us on Instagram">📷</a>
                <a href="https://x.com/oliviuusrwanda" class="social-link twitter" title="Follow us on X (Twitter)">🐦</a>
                <a href="https://www.linkedin.com/in/oliviuus" class="social-link linkedin" title="Connect on LinkedIn">💼</a>
                <a href="${baseUrl}" class="social-link globe" title="Visit Oliviuus Website">🌐</a>
            </div>
            
            <div class="footer-links">
                <a href="${baseUrl}">Home</a>
                <a href="${baseUrl}/browse">Browse Content</a>
                <a href="${baseUrl}/movies">Movies</a>
                <a href="${baseUrl}/tv">TV Shows</a>
                <a href="${baseUrl}/library">My Library</a>
                <a href="${baseUrl}/profile">Profile</a>
                <a href="${baseUrl}/help">Help Center</a>
                <a href="${baseUrl}/privacy">Privacy Policy</a>
                <a href="${baseUrl}/terms">Terms of Service</a>
            </div>
            
            <p style="color: #718096; font-size: 12px; margin-top: 24px;">
                You received this email because you have an account with Oliviuus.<br>
                If you believe this was sent in error, please <a href="${baseUrl}/help" style="color: #a0aec0;">visit our help center</a>.
            </p>
        </div>
    </div>
</body>
</html>`;
};

// Professional verification email template
const sendVerificationEmail = async (to, code, lang = "en") => {
  const locale = locales[lang] || locales["en"];
  const ev = locale.emailVerification || locales["en"].emailVerification;
  const greeting = getProfessionalGreeting(to, lang);
  const closing = getProfessionalClosing(lang);

  const content = `
        <h1>Email Verification</h1>
        <div class="email-content">
            <div class="content-section">
                <h2>${greeting}</h2>
                <p>${ev.verification_body.replace("{{code}}", "your verification code below")}</p>
                
                <div class="code-display">
                    <p class="verification-code">${code}</p>
                    <p style="color: #718096; font-size: 14px; margin-top: 12px;">This code will expire in 15 minutes</p>
                </div>
            </div>
            
            <div class="info-box">
                <h3>🔒 ${ev.security_notice_title}</h3>
                <ul>
                    <li>${ev.security_notice_li1}</li>
                    <li>${ev.security_notice_li2}</li>
                    <li>${ev.security_notice_li3}</li>
                </ul>
            </div>
            
            <p style="text-align: center; color: #718096; font-size: 14px; margin-top: 32px;">
                If you didn't request this code, please ignore this email or <a href="${process.env.CLIENT_URL || 'https://oliviuus.com'}/help">contact support</a>.
            </p>
            
            <div class="professional-signature">
                <div class="signature-name">${closing}</div>
                <div class="signature-title">The Oliviuus Security Team</div>
            </div>
        </div>
    `;

  const mailOptions = {
    from: `"Oliviuus Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 ${ev.verification_subject}`,
    html: getBaseTemplate(content, lang, true, "Start Watching", "https://oliviuus.com", "verification"),
  };

  await transporter.sendMail(mailOptions);
};

// Professional welcome email template
const sendWelcomeEmail = async (to, lang = "en") => {
  const locale = locales[lang] || locales["en"];
  const we = locale.welcomeEmail || locales["en"].welcomeEmail;
  const greeting = getProfessionalGreeting(to, lang);
  const closing = getProfessionalClosing(lang);
  const baseUrl = process.env.CLIENT_URL || "https://oliviuus.com";

  const content = `
        <h1>Welcome to Oliviuus</h1>
        <div class="email-content">
            <div class="content-section">
                <h2>${greeting}</h2>
                <p>${we.body}</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${baseUrl}/browse" class="button-primary">
                        Browse Content
                    </a>
                </div>
            </div>
            
            <div class="tip-box">
                <h3>💡 ${we.tip_title}</h3>
                <ul>
                    ${we.tips.map((tip) => `<li>${tip}</li>`).join("")}
                </ul>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                <a href="${baseUrl}/movies" style="display: inline-block; padding: 12px 20px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0;">🎬 Movies</a>
                <a href="${baseUrl}/tv" style="display: inline-block; padding: 12px 20px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0;">📺 TV Shows</a>
                <a href="${baseUrl}/new" style="display: inline-block; padding: 12px 20px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0;">🔥 New & Popular</a>
            </div>
            
            <div class="professional-signature">
                <div class="signature-name">${closing}</div>
                <div class="signature-title">The Oliviuus Welcome Team</div>
            </div>
        </div>
    `;

  const mailOptions = {
    from: `"Oliviuus Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎉 ${we.subject}`,
    html: getBaseTemplate(content, lang, true, "Start Watching", baseUrl, "welcome"),
  };

  await transporter.sendMail(mailOptions);
};

// Professional password reset email template
const sendPasswordResetEmail = async (to, resetLink, lang = "en") => {
  const locale = locales[lang] || locales["en"];
  const pr = locale.passwordReset || locales["en"].passwordReset;
  const greeting = getProfessionalGreeting(to, lang);
  const closing = getProfessionalClosing(lang);
  const baseUrl = process.env.CLIENT_URL || "https://oliviuus.com";

  const content = `
        <h1>Password Reset</h1>
        <div class="email-content">
            <div class="content-section">
                <h2>${greeting}</h2>
                <p>${pr.body}</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetLink}" class="button-primary">
                        ${pr.button_text}
                    </a>
                </div>
                
                <div class="warning-box">
                    <h3>⚠️ Important</h3>
                    <p>${pr.expiry_notice}</p>
                </div>
                
                <p style="color: #718096; font-size: 14px; text-align: center;">
                    If you didn't request a password reset, please <a href="${baseUrl}/help">contact support</a> to secure your account.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${baseUrl}/account/settings" style="color: #667eea; text-decoration: none; font-size: 14px;">
                        🔧 Go to Account Settings
                    </a>
                </div>
                
                <div class="professional-signature">
                    <div class="signature-name">${closing}</div>
                    <div class="signature-title">The Oliviuus Security Team</div>
                </div>
            </div>
        </div>
    `;

  const mailOptions = {
    from: `"Oliviuus Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 ${pr.subject}`,
    html: getBaseTemplate(content, lang, true, "Visit Oliviuus", baseUrl, "security"),
  };

  await transporter.sendMail(mailOptions);
};

// Professional account creation email template
const sendAccountCreatedEmail = async (to, resetLink, lang = "en") => {
  const locale = locales[lang] || locales["en"];
  const ac = locale.accountCreated || locales["en"].accountCreated;
  const greeting = getProfessionalGreeting(to, lang);
  const closing = getProfessionalClosing(lang);
  const baseUrl = process.env.CLIENT_URL || "https://oliviuus.com";

  const content = `
        <h1>Account Created</h1>
        <div class="email-content">
            <div class="content-section">
                <h2>${greeting}</h2>
                <p>${ac.body}</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetLink}" class="button-primary">
                        ${ac.button_text}
                    </a>
                </div>
                
                <div class="info-box">
                    <h3>📝 Note</h3>
                    <p>${ac.note}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #4a5568; margin-bottom: 15px;">Quick links to get started:</p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <a href="${baseUrl}/onboarding" style="display: inline-block; padding: 10px 18px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0; font-size: 14px;">📚 Onboarding</a>
                        <a href="${baseUrl}/library" style="display: inline-block; padding: 10px 18px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0; font-size: 14px;">📁 My Library</a>
                        <a href="${baseUrl}/account/settings" style="display: inline-block; padding: 10px 18px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0; font-size: 14px;">⚙️ Settings</a>
                    </div>
                </div>
                
                <div class="professional-signature">
                    <div class="signature-name">${closing}</div>
                    <div class="signature-title">The Oliviuus Administration Team</div>
                </div>
            </div>
        </div>
    `;

  const mailOptions = {
    from: `"Oliviuus Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: `👋 ${ac.subject}`,
    html: getBaseTemplate(content, lang, true, "Start Watching", baseUrl, "welcome"),
  };

  await transporter.sendMail(mailOptions);
};

// Professional contact reply email template
const sendContactReplyEmail = async (to, replyMessage, originalSubject, agentName = "Oliviuus Support") => {
  const baseUrl = process.env.CLIENT_URL || "https://oliviuus.com";
  const greeting = getProfessionalGreeting(to, 'en');
  const closing = getProfessionalClosing('en');

  const content = `
        <h1>Support Response</h1>
        <div class="email-content">
            <div class="content-section">
                <h2>${greeting}</h2>
                <p>Thank you for contacting Oliviuus support. Here's our response to your inquiry:</p>
                
                <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <p style="color: #4a5568; white-space: pre-wrap; line-height: 1.8;">${replyMessage}</p>
                </div>
                
                <div class="info-box" style="margin-top: 30px;">
                    <h3>💡 Need more help?</h3>
                    <p>Visit our <a href="${baseUrl}/help" style="color: #667eea;">Help Center</a> for more resources or check our <a href="${baseUrl}/faq" style="color: #667eea;">FAQ</a>.</p>
                </div>
                
                <div class="professional-signature">
                    <div class="signature-name">${closing}</div>
                    <div class="signature-title">The Oliviuus Support Team</div>
                    <p style="color: #718096; font-size: 14px; margin-top: 10px;">
                        Your support agent: <strong>${agentName}</strong>
                    </p>
                </div>
            </div>
        </div>
    `;

  const mailOptions = {
    from: `"Oliviuus Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: `📨 Re: ${originalSubject}`,
    html: getBaseTemplate(content, 'en', true, "Visit Help Center", `${baseUrl}/help`, "support"),
  };

  await transporter.sendMail(mailOptions);
};

// Professional admin message email template
const sendAdminMessageEmail = async (to, subject, message) => {
  const baseUrl = process.env.CLIENT_URL || "https://oliviuus.com";
  const greeting = getProfessionalGreeting(to, 'en');
  const closing = getProfessionalClosing('en');

  const content = `
        <h1>Important Message</h1>
        <div class="email-content">
            <div class="content-section">
                <h2>${greeting}</h2>
                <p style="color: #718096; margin-bottom: 24px;">This is an important message from the Oliviuus administration team:</p>
                
                <div style="background: #fffaf0; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <p style="color: #4a5568; white-space: pre-wrap; line-height: 1.8;">${message}</p>
                </div>
                
                <div class="info-box">
                    <h3>ℹ️ Official Communication</h3>
                    <p>This message contains important information regarding your account or our services.</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #4a5568; margin-bottom: 15px;">For account-related matters:</p>
                    <a href="${baseUrl}/account/settings" style="display: inline-block; padding: 12px 24px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0; margin: 0 10px;">
                        ⚙️ Account Settings
                    </a>
                </div>
                
                <div class="professional-signature">
                    <div class="signature-name">${closing}</div>
                    <div class="signature-title">The Oliviuus Administration Team</div>
                </div>
            </div>
        </div>
    `;

  const mailOptions = {
    from: `"Oliviuus Administration" <${process.env.EMAIL_USER}>`,
    to,
    subject: `📢 ${subject}`,
    html: getBaseTemplate(content, 'en', true, "Visit Oliviuus", baseUrl, "admin"),
  };

  await transporter.sendMail(mailOptions);
};

// Professional family invitation email template
const sendFamilyInvitationEmail = async (to, ownerEmail, invitationToken, lang = "en", memberRole = "child", hasActiveSubscription = false, currentPlan = null, isFamilyPlan = false) => {
  const locale = locales[lang] || locales["en"];
  const fi = locale.familyInvitation || locales["en"].familyInvitation;
  const greeting = getProfessionalGreeting(to, lang);
  const closing = getProfessionalClosing(lang);

  const baseUrl = process.env.CLIENT_URL || "https://oliviuus.com";
  const acceptLink = `${baseUrl}/account/settings#family-invitations`;
  const roleEmoji = memberRole === "parent" ? "👨‍👩‍👧‍👦" : "👶";

  let subscriptionNotice = '';
  if (hasActiveSubscription) {
    if (isFamilyPlan) {
      subscriptionNotice = `
        <div class="warning-box">
            <h3>⚠️ Subscription Conflict</h3>
            <p>You currently have an active <strong>${currentPlan || 'Family Plan'}</strong> subscription.</p>
            <p>Users with active family plans cannot join other families. To accept this invitation, you would need to cancel your current family plan first.</p>
        </div>`;
    } else {
      subscriptionNotice = `
        <div class="info-box">
            <h3>📋 Subscription Note</h3>
            <p>You currently have an active <strong>${currentPlan || 'subscription'}</strong>.</p>
            <p>Accepting this family invitation will pause your current subscription and you'll use the family plan instead.</p>
        </div>`;
    }
  }

  const content = `
        <h1>Family Invitation</h1>
        <div class="email-content">
            <div class="content-section">
                <h2>${greeting}</h2>
                <p>${fi.body.replace("{{owner}}", ownerEmail).replace("{{role}}", memberRole)}</p>
                
                ${subscriptionNotice}
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${acceptLink}" class="button-primary">
                        ${fi.button_text}
                    </a>
                </div>
                
                <div class="tip-box">
                    <h3>📌 ${fi.note_title}</h3>
                    <p>${fi.note_body}</p>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px; flex-wrap: wrap;">
                    <a href="${baseUrl}/account/settings" style="display: inline-block; padding: 10px 18px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0; font-size: 14px;">⚙️ Family Settings</a>
                    <a href="${baseUrl}/subscription" style="display: inline-block; padding: 10px 18px; background: #f7fafc; color: #4a5568; text-decoration: none; border-radius: 8px; font-weight: 500; border: 1px solid #e2e8f0; font-size: 14px;">💰 Subscription</a>
                </div>
                
                <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
                    ${fi.expiry_notice}
                </p>
                
                <div class="professional-signature">
                    <div class="signature-name">${closing}</div>
                    <div class="signature-title">The Oliviuus Family Team</div>
                </div>
            </div>
        </div>
    `;

  const mailOptions = {
    from: `"Oliviuus Family" <${process.env.EMAIL_USER}>`,
    to,
    subject: `👨‍👩‍👧‍👦 ${fi.subject.replace("{{owner}}", ownerEmail)}`,
    html: getBaseTemplate(content, lang, true, "Manage Family", acceptLink, "family"),
  };

  await transporter.sendMail(mailOptions);
};

// Export all email functions
module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAccountCreatedEmail,
  sendContactReplyEmail,
  sendAdminMessageEmail,
  sendFamilyInvitationEmail,
};