require('dotenv').config();
const mtnService = require('./services/mtnService');

async function testMTN() {
    console.log('🧪 Testing MTN Service...\n');
    
    // Check current status
    const status = mtnService.getStatus();
    console.log('📊 Current Status:', status);
    
    if (!status.isInitialized) {
        console.log('❌ Service not initialized. Please run:');
        console.log('   curl -X POST http://localhost:3000/api/mtn/initialize');
        return;
    }
    
    try {
        // Test getting token
        console.log('\n🔐 Testing API token...');
        const token = await mtnService.getApiToken();
        console.log('✅ Token test successful');
        
        // Test payment request
        console.log('\n💸 Testing payment request...');
        const paymentResult = await mtnService.requestToPay(
            '100',
            '0788880266', // Test number
            'test_' + Date.now(),
            'Test Payment'
        );
        console.log('✅ Payment request successful:', paymentResult);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testMTN();