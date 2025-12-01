/**
 * 📘 LMBTech PaymentSystem - Node.js Version (CommonJS)
 * Author: HAGENIMANA Samuel (Oliviuus Project)
 * Description: Node.js class to handle payment, disbursement, and callback
 * integration with LMBTech API. Sends exact requested amounts.
 */

const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");

class PaymentSystem {
  constructor(appKey = null, secretKey = null) {
    // 🔐 Authentication setup
    this.appKey = appKey || process.env.APP_KEY || "";
    this.secretKey = secretKey || process.env.SECRET_KEY || "";
    this.authHeader = `Basic ${Buffer.from(`${this.appKey}:${this.secretKey}`).toString("base64")}`;

    // 🌍 Base API endpoint
    this.apiUrl = "https://pay.lmbtech.rw/pay/config/api";

    // 🧾 Optional: Card URL (if needed)
    this.card_url = "https://pay.lmbtech.rw/pay/card/process";

    // ⏱ Axios timeout in ms
    this.timeout = 40000; // 40s

    // 📂 Log file paths
    this.logPath = "./payment_log.txt";
    this.callbackLogPath = "./callback_log.txt";

    console.log("✅ PaymentSystem initialized with app_key:", this.appKey);
  }

  // 📝 Logging utility
  log(message, path = this.logPath) {
    const entry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(path, entry);
  }

  // 🔧 Signature generator (if API requires)
  generateSignature(data) {
    const payload = JSON.stringify(data);
    return crypto.createHash("sha256").update(payload + this.secretKey).digest("hex");
  }

  // 📤 Generic HTTP request handler
  async makeRequest(method, data = {}) {
    try {
      const config = {
        method: method.toUpperCase(),
        url: this.apiUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        timeout: this.timeout,
        data,
      };

      // GET request sends params instead of data
      if (method.toUpperCase() === "GET") {
        config.params = data;
        delete config.data;
      }

      const response = await axios(config);
      this.log(`✅ API ${method.toUpperCase()} request successful. Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data || error.message;
      this.log(`❌ API Request Error: ${JSON.stringify(errMsg)}`);
      return { status: "unknown", message: "no_returned_amount", rawResponse: errMsg };
    }
  }

  // 🟢 Create Payment (MoMo)
  async createPayment({ email, name, amount, payer_phone, callback_url }) {
    const reference_id = `REF-${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const data = {
      email,
      name,
      payment_method: "MoMo",
      amount: amount, // exact amount
      price: amount,  // exact amount
      currency: "RWF",
      payer_phone,
      service_paid: "test", // must use 'test' service
      callback_url,
      reference_id,
      action: "pay",
      meta: {
        expectedAmount: amount, // original amount intended
        createdBy: "Oliviuus-PaymentSystem",
      },
    };

    data.signature = this.generateSignature(data);

    this.log(`📤 Sending payment request: ${JSON.stringify(data)}`);
    return await this.makeRequest("POST", data);
  }

  // 💸 Create Disbursement (Send Money)
  async createDisbursement({ email, name, amount, payer_phone, callback_url }) {
    const reference_id = `REF-${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const data = {
      email,
      name,
      payment_method: "MoMo",
      amount,
      payer_phone,
      service_paid: "disbursement",
      reference_id,
      callback_url,
      action: "disbursement",
    };

    this.log(`💰 Creating disbursement: ${JSON.stringify(data)}`);
    return await this.makeRequest("POST", data);
  }

  // 🟢 Check Payment Status
  async checkStatus(reference_id) {
    this.log(`🔍 Checking payment status for: ${reference_id}`);
    return await this.makeRequest("GET", { reference_id });
  }

  // 🟠 Update Payment Status
  async updateStatus(reference_id, status) {
    this.log(`🟠 Updating payment status: ${reference_id}, status: ${status}`);
    return await this.makeRequest("PUT", { reference_id, status, action: "update" });
  }

  // 🔴 Cancel/Delete Payment
  async deletePayment(reference_id) {
    this.log(`🔴 Deleting payment: ${reference_id}`);
    return await this.makeRequest("DELETE", { reference_id, action: "delete" });
  }

  // 🔁 Handle Callback
  async receiveCallback(reqBody) {
    const logEntry = `[${new Date().toISOString()}] 📥 Callback received: ${JSON.stringify(reqBody)}\n`;
    fs.appendFileSync(this.callbackLogPath, logEntry);

    const { reference_id, transaction_id, status } = reqBody;
    if (!reference_id || !transaction_id || !status) {
      const errorLog = `[${new Date().toISOString()}] ❌ Invalid callback data\n`;
      fs.appendFileSync(this.callbackLogPath, errorLog);
      return { success: false, message: "Missing required callback data" };
    }

    const successLog = `[${new Date().toISOString()}] ✅ Callback valid. reference_id: ${reference_id}, transaction_id: ${transaction_id}, status: ${status}\n`;
    fs.appendFileSync(this.callbackLogPath, successLog);

    return { success: true, message: "Callback processed successfully" };
  }
}

// 🧪 Quick Test Section
if (require.main === module) {
  (async () => {
    const paymentSystem = new PaymentSystem();

    // Example: Create MoMo Payment
    const payment = await paymentSystem.createPayment({
      email: "smlhagenimana@gmail.com",
      name: "Samuel",
      amount: 100, // user pays exactly 100 RWF
      payer_phone: "0732884888",
      callback_url: "http://example.com/callback",
    });

    console.log("💸 Payment Response:", payment);
  })();
}

// ✅ Export the class
module.exports = PaymentSystem;
