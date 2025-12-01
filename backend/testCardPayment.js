/**
 * 📘 Test Card Payment - LMBTech PaymentSystem (Node.js)
 * Author: HAGENIMANA Samuel (Oliviuus Project)
 * Description: Testing card payments only.
 */

const PaymentSystem = require("./PaymentSystem"); // Your existing PaymentSystem.js

(async () => {
  try {
    const paymentSystem = new PaymentSystem();

    // --- Card Payment Data ---
    const cardPaymentData = {
      email: "smlhagenimana@gmail.com",
      name: "Samuel",
      payment_method: "Card",
      phone_number: "078 888 0266",            // required for card
      amount: 500,                            // amount to charge
      currency: "RWF",
      service_paid: "test",                   // always use "test" for testing
      callback_url: "http://example.com/callback",
      action: "pay",                          // ✅ Required for card payments
    };

    // Generate reference ID
    const reference_id = `REF-${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    cardPaymentData.reference_id = reference_id;
    cardPaymentData.card_url = paymentSystem.card_url;

    console.log("📤 Sending card payment request:", cardPaymentData);

    // Make request
    const response = await paymentSystem.makeRequest("POST", cardPaymentData);

    // Log results
    if (response && response.postData && response.postData.card_url) {
      console.log("✅ Card payment initiated successfully!");
      console.log("💳 Card URL:", response.postData.card_url);
      console.log("🆔 Reference ID:", reference_id);
      console.log("💰 Amount:", cardPaymentData.amount);
    } else {
      console.error("❌ Card payment initiation failed:", response);
    }

  } catch (err) {
    console.error("❌ Error during card payment test:", err.message);
  }
})();
