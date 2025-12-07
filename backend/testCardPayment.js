/**
 * Test LMBTech Card Payment with Official Format
 * Usage: node test-lmbtech-card.js [options]
 * 
 * Options:
 *   --email <email>        Customer email (default: elyssa001ely@gmail.com)
 *   --name <name>          Customer name (default: IRANKUNDA Elyssa)
 *   --phone <phone>        Phone number (default: 0798263057)
 *   --amount <amount>      Amount in RWF (default: 1000.0)
 *   --currency <currency>  Currency RWF or USD (default: RWF)
 *   --generate-html        Generate HTML test file
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// ANSI color codes for console output
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Configuration - UPDATE THESE WITH YOUR CREDENTIALS
const LMBTECH_APP_KEY = process.env.LMBTECH_APP_KEY || 'app_69131a1eaf50617628595504173';
const LMBTECH_SECRET_KEY = process.env.LMBTECH_SECRET_KEY || 'scrt_69131a1eaf51a1762859550';

class LMBTechCardTest {
  constructor() {
    this.options = this.parseArguments();
  }

  parseArguments() {
    const args = process.argv.slice(2);
    const options = {
      email: 'elyssa001ely@gmail.com',
      name: 'IRANKUNDA Elyssa',
      phone: '0798263057',
      amount: 1000.0,
      currency: 'RWF',
      generateHtml: false
    };

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--email':
          options.email = args[++i];
          break;
        case '--name':
          options.name = args[++i];
          break;
        case '--phone':
          options.phone = args[++i];
          break;
        case '--amount':
          options.amount = parseFloat(args[++i]);
          break;
        case '--currency':
          options.currency = args[++i];
          break;
        case '--generate-html':
          options.generateHtml = true;
          break;
      }
    }

    return options;
  }

  log(message, color = '') {
    console.log(`${color}${message}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(message, colors.success);
  }

  logError(message) {
    this.log(message, colors.error);
  }

  logWarning(message) {
    this.log(message, colors.warning);
  }

  logInfo(message) {
    this.log(message, colors.info);
  }

  normalizePhone(phone) {
    let normalized = phone.trim().replace(/[\s-]/g, '');
    
    if (normalized.startsWith('0')) {
      normalized = '+250' + normalized.substring(1);
    } else if (normalized.startsWith('250')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+250' + normalized;
    }
    
    return normalized;
  }

  generateReferenceId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'pay_';
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  buildPaymentData() {
    const { email, name, phone, amount, currency } = this.options;
    
    // Normalize phone
    const phoneNormalized = this.normalizePhone(phone);
    
    // Extract first and last name
    const nameParts = name.trim().split(/\s+/, 2);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts[1] || 'User';
    
    // Generate reference ID
    const referenceId = this.generateReferenceId();
    
    // Card URL (PesaPal iframe)
    const cardUrl = 'https://pay.lmbtech.rw/pay/pesapal/iframe.php';
    
    // Callback URLs
    const callbackUrl = 'https://webhook.site/your-unique-id';
    const cancelUrl = 'https://webhook.site/your-unique-id';
    
    // Build payment data exactly as LMBTech specified
    const paymentData = {
      email: email,
      name: name,
      phone_number: phoneNormalized,
      first_name: firstName,
      last_name: lastName,
      payment_method: 'Card',
      card_url: cardUrl,
      api_key: LMBTECH_APP_KEY,        // Note: "api_key" not "app_key"
      secrate_key: LMBTECH_SECRET_KEY, // Note: "secrate_key" (their typo!)
      amount: parseFloat(amount),
      reference_id: referenceId,
      callback_url: callbackUrl,
      cancel_url: cancelUrl,
      currency: currency,
      country_code: 'RW',
      action: 'pay',
      service_paid: 'test',
      created_at: new Date().toISOString()
    };
    
    return {
      paymentData,
      cardUrl,
      referenceId,
      phoneNormalized,
      firstName,
      lastName
    };
  }

  async testDirectPost(cardUrl, paymentData) {
    this.log('\n' + '='.repeat(80));
    this.logInfo('🧪 Test 1: Direct POST to Card URL');
    this.log('='.repeat(80));

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(paymentData);
      const url = new URL(cardUrl);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      this.log('   ⏳ Sending POST request...');

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          this.log(`   📥 Status Code: ${res.statusCode}`);

          try {
            const responseData = JSON.parse(body);
            this.log('   📥 Response (JSON):');
            console.log(JSON.stringify(responseData, null, 6));

            const status = (responseData.status || '').toLowerCase();
            const message = responseData.message || '';

            if (status === 'success') {
              this.logSuccess('   ✅ SUCCESS!');

              // Check for redirect URL
              ['redirect_url', 'payment_url', 'url', 'iframe_url'].forEach(key => {
                if (responseData[key]) {
                  this.logSuccess(`   🔗 ${key}: ${responseData[key]}`);
                }
              });
            } else {
              this.logError(`   ❌ FAILED: ${message}`);
            }
            
            resolve(responseData);
          } catch (e) {
            // Might be HTML response
            this.log('   📥 Response (HTML/Text):');
            console.log(body.substring(0, 500));

            if (body.toLowerCase().includes('<html')) {
              this.logWarning('   ⚠️  Received HTML response (might be payment page)');
            }
            
            resolve({ body, isHtml: true });
          }
        });
      });

      req.on('error', (error) => {
        this.logError(`   ❌ Request error: ${error.message}`);
        reject(error);
      });

      req.setTimeout(30000, () => {
        req.destroy();
        this.logError('   ❌ Request timeout');
        reject(new Error('Request timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  generateHtmlTest(cardUrl, paymentData, referenceId) {
    this.log('\n' + '='.repeat(80));
    this.logInfo('🧪 Test 2: Generate HTML Test File');
    this.log('='.repeat(80));

    const htmlFile = `test_card_payment_${referenceId}.html`;

    // Generate form inputs
    const formInputs = Object.entries(paymentData)
      .map(([key, value]) => `        <input type="hidden" name="${key}" value="${value}" />`)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMBTech Card Payment Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: white;
            color: #333;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .info {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info strong {
            color: #667eea;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        .countdown {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        #debugInfo {
            background: #f9f9f9;
            border: 1px solid #ddd;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 LMBTech Card Payment Test</h1>
        <p>Official format provided by LMBTech</p>
        
        <div class="info">
            <strong>Reference ID:</strong> ${referenceId}<br>
            <strong>Amount:</strong> ${paymentData.amount} ${paymentData.currency}<br>
            <strong>Phone:</strong> ${paymentData.phone_number}<br>
            <strong>Email:</strong> ${paymentData.email}
        </div>
        
        <form id="paymentForm" method="POST" action="${cardUrl}">
${formInputs}
            <button type="submit">💳 Pay with Card</button>
        </form>
        
        <div class="countdown" id="countdown">
            Auto-submitting in <span id="timer">3</span> seconds... (or click button above)
        </div>
        
        <div id="debugInfo">
            <strong>Payment Data:</strong><br>
            ${JSON.stringify(paymentData, null, 2)}
        </div>
    </div>
    
    <script>
        // Auto-submit countdown
        let timeLeft = 3;
        const timerElement = document.getElementById('timer');
        const countdownElement = document.getElementById('countdown');
        
        const countdown = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                countdownElement.innerHTML = '<strong>Redirecting to payment gateway...</strong>';
                document.getElementById('paymentForm').submit();
            }
        }, 1000);
        
        // Log form data
        console.log('Payment form ready');
        console.log('Card URL:', '${cardUrl}');
        console.log('Reference:', '${referenceId}');
    </script>
</body>
</html>`;

    fs.writeFileSync(htmlFile, htmlContent, 'utf-8');
    const filePath = path.resolve(htmlFile);

    this.logSuccess(`   ✅ HTML file created: ${htmlFile}`);
    this.log(`\n   📂 Full path: ${filePath}`);
    this.log('\n   💡 To test:');
    this.log('      1. Open the HTML file in your browser');
    this.log('      2. It will auto-submit in 3 seconds');
    this.log('      3. You should be redirected to card payment page');

    // Try to open in browser (cross-platform)
    try {
      const { exec } = require('child_process');
      const command = process.platform === 'darwin' ? 'open' :
                     process.platform === 'win32' ? 'start' : 'xdg-open';
      
      exec(`${command} "${filePath}"`, (error) => {
        if (!error) {
          this.logSuccess('\n   🌐 Opening in browser...');
        }
      });
    } catch (e) {
      // Silent fail
    }
  }

  async run() {
    this.logSuccess('='.repeat(80));
    this.logSuccess('🧪 LMBTech Card Payment - Official Format Test');
    this.logSuccess('='.repeat(80));

    // Check credentials
    if (!LMBTECH_APP_KEY || LMBTECH_APP_KEY === 'your_app_key_here' ||
        !LMBTECH_SECRET_KEY || LMBTECH_SECRET_KEY === 'your_secret_key_here') {
      this.logError('❌ Missing credentials. Please set LMBTECH_APP_KEY and LMBTECH_SECRET_KEY');
      this.log('\nYou can either:');
      this.log('1. Edit the script and replace the placeholder values');
      this.log('2. Set environment variables:');
      this.log('   export LMBTECH_APP_KEY="your_key"');
      this.log('   export LMBTECH_SECRET_KEY="your_secret"');
      process.exit(1);
    }

    // Build payment data
    const { paymentData, cardUrl, referenceId, phoneNormalized, firstName, lastName } = 
      this.buildPaymentData();

    // Display parameters
    this.log('\n📋 Test Parameters:');
    this.log(`   Email: ${this.options.email}`);
    this.log(`   Name: ${this.options.name}`);
    this.log(`   Phone (original): ${this.options.phone}`);
    this.log(`   Phone (normalized): ${phoneNormalized}`);
    this.log(`   First Name: ${firstName}`);
    this.log(`   Last Name: ${lastName}`);
    this.log(`   Amount: ${this.options.amount} ${this.options.currency}`);
    this.log(`   Reference: ${referenceId}`);

    this.log('\n📤 Payment Data:');
    Object.entries(paymentData).forEach(([key, value]) => {
      if (key === 'api_key' || key === 'secrate_key') {
        const masked = String(value).substring(0, 15) + '...';
        this.log(`   ${key}: ${masked} (length: ${String(value).length})`);
      } else {
        this.log(`   ${key}: ${value}`);
      }
    });

    // Test 1: Direct API call
    try {
      await this.testDirectPost(cardUrl, paymentData);
    } catch (error) {
      this.logError(`Test 1 failed: ${error.message}`);
    }

    // Test 2: Generate HTML file
    if (this.options.generateHtml) {
      this.generateHtmlTest(cardUrl, paymentData, referenceId);
    }
  }
}

// Run the test
const test = new LMBTechCardTest();
test.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});