// cardPayment.js

const axios = require("axios");
const crypto = require("crypto");

class CardPayment {
  constructor() {
    console.log("✅ LMBTech CardPayment Initialized");
  }

  async initiateCardPayment(data) {
    try {
      const referenceId = `pay_${crypto.randomBytes(5).toString("hex")}`;

      const payload = {
        email: data.email,
        name: `${data.first_name} ${data.last_name}`,
        phone_number: data.phone_number,
        first_name: data.first_name,
        last_name: data.last_name,

        payment_method: "Card",
        card_url: "https://pay.lmbtech.rw/pay/pesapal/iframe.php",

        api_key: process.env.LMB_API_KEY,
        secret_key: process.env.LMB_SECRET_KEY,

        amount: String(data.amount),
        currency: "RWF",

        reference_id: referenceId,
        service_paid: data.service_paid || "Oliviuus Premium Subscription",

        narration: data.narration || "Oliviuus Card Payment",
        account_number: data.account_number || "Oliviuus",

        callback_url: process.env.CARD_CALLBACK_URL,
        cancel_url: process.env.CARD_CANCEL_URL,

        country_code: "RW",
        action: "pay",
      };

      console.log("📤 Sending Card Payment Payload:");
      console.log(JSON.stringify(payload, null, 2));

      const response = await axios.post(
        "https://pay.lmbtech.rw/api/card-payment",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 Card Payment Response Received");
      return response.data; // THIS WILL BE IFRAME HTML

    } catch (error) {
      console.error("❌ Card Payment Error:", error.response?.data || error.message);
      throw new Error("Failed to initiate card payment");
    }
  }
}

module.exports = new CardPayment();
