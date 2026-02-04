/**
 * Test script to call TxDOT PeopleSoft API
 * Tests connection and retrieves PO data
 */

async function testPeopleSoftAPI() {
  console.log('🔄 Testing TxDOT PeopleSoft API...\n');

  const username = 'X_WS_MULESOFT';
  const password = 'TxDOT#123TxDOT#123';
  const url = 'https://psfindv.txdot.gov:8021/PSIGW/RESTListeningConnector/PSFT_EP/ExecuteQuery.v1/PUBLIC/X_WS_PO/JSON/NONFILE?isconnectedquery=n&maxrows=999&prompt_uniquepromptname=BU,PO&prompt_fieldvalue=60144,0000079262&json_resp=true';

  try {
    console.log('📡 Connecting to PeopleSoft...');
    console.log(`   URL: ${url}\n`);

    // Create Basic Auth header
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Response Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:');
      console.error(errorText);
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Successfully retrieved data!\n');
    console.log('📊 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    // Additional analysis
    if (data && typeof data === 'object') {
      console.log('\n📈 Data Summary:');
      console.log(`   Type: ${Array.isArray(data) ? 'Array' : 'Object'}`);
      
      if (Array.isArray(data)) {
        console.log(`   Records: ${data.length}`);
        if (data.length > 0) {
          console.log(`   Sample Record Keys: ${Object.keys(data[0]).join(', ')}`);
        }
      } else {
        console.log(`   Keys: ${Object.keys(data).join(', ')}`);
      }
    }

    return data;

  } catch (error) {
    console.error('\n❌ Error calling PeopleSoft API:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    throw error;
  }
}

testPeopleSoftAPI()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed!');
    process.exit(1);
  });
