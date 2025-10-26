const axios = require('axios');

class PesaPalService {
  constructor() {
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    this.baseURL = process.env.PESAPAL_ENV === 'production' 
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';
  }

  async getAccessToken() {
    try {
      const res = await axios.post(
        `${this.baseURL}/api/Auth/RequestToken`,
        {
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret,
        },
        {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          timeout: 30000
        }
      );
      return res.data.token;
    } catch (error) {
      console.error('❌ PesaPal Auth Error:', error.response?.data || error.message);
      throw new Error('Unable to authenticate with PesaPal');
    }
  }

  // NEW: Direct M-Pesa Payment
  async submitMpesaPayment(orderData) {
    try {
      const token = await this.getAccessToken();

      const payload = {
        id: orderData.orderId,
        currency: 'KES', // M-Pesa uses KES even for other countries
        amount: orderData.amount,
        description: orderData.description,
        callback_url: orderData.callbackUrl,
        phone_number: orderData.customerPhone,
        email_address: orderData.customerEmail,
        account_number: orderData.customerPhone, // Phone is account number
        payment_method: 'MPESA'
      };

      console.log('📱 Submitting M-Pesa payment:', payload);

      const res = await axios.post(
        `${this.baseURL}/api/Transactions/SubmitMpesaRequest`, 
        payload, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      return res.data;

    } catch (error) {
      console.error('❌ M-Pesa Payment Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // UPDATED: Generic order with payment method
  async submitOrder(orderData) {
    try {
      const token = await this.getAccessToken();

      const payload = {
        id: orderData.orderId,
        currency: orderData.currency || 'RWF',
        amount: orderData.amount,
        description: orderData.description,
        callback_url: orderData.callbackUrl,
        cancellation_url: orderData.cancellationUrl,
        notification_id: process.env.PESAPAL_IPN_ID,
        payment_method: orderData.paymentMethod || '', // ADD THIS
        billing_address: {
          email_address: orderData.customerEmail,
          phone_number: orderData.customerPhone,
          country_code: orderData.countryCode || 'RW',
          first_name: orderData.firstName,
          last_name: orderData.lastName,
        }
      };

      console.log('📦 Submitting order to PesaPal:', payload);

      const res = await axios.post(
        `${this.baseURL}/api/Transactions/SubmitOrderRequest`, 
        payload, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('📨 PesaPal Response:', res.data);

      if (!res.data || !res.data.order_tracking_id) {
        throw new Error('PesaPal returned invalid response');
      }

      return res.data;

    } catch (error) {
      console.error('❌ PesaPal Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getTransactionStatus(orderTrackingId) {
    try {
      const token = await this.getAccessToken();
      const res = await axios.get(
        `${this.baseURL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
          timeout: 30000
        }
      );
      return res.data;
    } catch (error) {
      console.error('❌ Status Check Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async registerIPN() {
    try {
      const token = await this.getAccessToken();
      const payload = {
        url: `${process.env.BASE_URL}/api/payment/ipn`,
        ipn_notification_type: 'POST'
      };

      const res = await axios.post(
        `${this.baseURL}/api/URLSetup/RegisterIPN`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ IPN Registered:', res.data);
      return res.data;

    } catch (error) {
      console.error('❌ IPN Registration Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new PesaPalService();