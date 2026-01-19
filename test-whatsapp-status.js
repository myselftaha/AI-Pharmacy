import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000'; // Change to your local or Vercel URL
const TOKEN = 'YOUR_TEST_TOKEN'; // You might need a valid token if you run this locally

async function testStatus() {
    console.log('--- Testing WhatsApp Status Synchronization ---');
    console.log(`Checking status at ${API_URL}/api/whatsapp/status...`);

    const startTime = Date.now();
    try {
        const res = await fetch(`${API_URL}/api/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();
        const duration = Date.now() - startTime;

        console.log(`Response received in ${duration}ms`);
        console.log('Status Response:', JSON.stringify(data, null, 2));

        if (data.status === 'CONNECTING' && duration < 4000) {
            console.warn('⚠️ Warning: Status returned CONNECTING too quickly. Wait logic might be too short or server restarted.');
        } else if (data.status === 'AUTHENTICATED' || data.status === 'READY') {
            console.log('✅ Success: WhatsApp is connected.');
        } else {
            console.log(`Current status: ${data.status}`);
        }
    } catch (err) {
        console.error('❌ Error testing status:', err.message);
    }
}

testStatus();
