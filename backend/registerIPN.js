require('dotenv').config(); // Load from .env file

const registerIPN = async () => {
  try {
    console.log('🚀 Starting IPN registration...');
    console.log('==========================================');
    
    // Determine environment
    const isProduction = process.env.PESAPAL_ENV === 'production';
    const environment = isProduction ? 'PRODUCTION' : 'SANDBOX';
    
    console.log(`🔧 Environment: ${environment}`);
    
    // Check if required environment variables are set
    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      throw new Error('PesaPal credentials are not set in environment variables');
    }
    
    if (!process.env.BASE_URL) {
      throw new Error('BASE_URL is not set in environment variables');
    }

    console.log('📋 Environment Check:');
    console.log('   - PESAPAL_CONSUMER_KEY:', process.env.PESAPAL_CONSUMER_KEY ? '✅ Set' : '❌ Missing');
    console.log('   - PESAPAL_CONSUMER_SECRET:', process.env.PESAPAL_CONSUMER_SECRET ? '✅ Set' : '❌ Missing');
    console.log('   - BASE_URL:', process.env.BASE_URL);
    console.log('   - PESAPAL_ENV:', process.env.PESAPAL_ENV || 'sandbox');
    console.log('   - FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
    
    console.log('\n🔗 IPN URL to be registered:');
    console.log('   ', `${process.env.BASE_URL}/api/payment/ipn`);
    
    if (isProduction) {
      console.log('\n⚠️  WARNING: Using PRODUCTION PesaPal credentials!');
      console.log('   Real money transactions will be processed!');
    } else {
      console.log('\nℹ️  Using SANDBOX environment - Test mode');
    }
    
    // Confirm before proceeding in production
    if (isProduction) {
      console.log('\n⏳ Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('\n⏳ Registering IPN with PesaPal...');
    
    const pesapalService = require('./services/pesapalService');
    const result = await pesapalService.registerIPN();
    
    console.log('\n🎉 IPN REGISTERED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('📝 IPN ID:', result.ipn_id);
    console.log('🔗 IPN URL:', result.url);
    console.log('📅 Created:', result.created_date);
    console.log('📊 Status:', result.ipn_status_decription);
    console.log('🌍 Environment:', environment);
    
    console.log('\n💾 ADD THIS TO YOUR .env FILE:');
    console.log('PESAPAL_IPN_ID=' + result.ipn_id);
    
    if (isProduction) {
      console.log('\n✅ Ready for PRODUCTION payments!');
      console.log('⚠️  Remember: These are REAL money transactions!');
    } else {
      console.log('\n✅ Ready for SANDBOX testing!');
    }
    
    return result;
    
  } catch (error) {
    console.error('\n💥 IPN REGISTRATION FAILED:');
    console.error('   Error:', error.message);
    
    if (error.response) {
      console.error('   PesaPal Response:', error.response.data);
    }
    
    process.exit(1);
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  registerIPN();
}

module.exports = registerIPN;