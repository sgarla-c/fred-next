/**
 * Test script to verify PeopleSoft Receipt API
 * Usage: npx tsx scripts/test-receipt-api.ts
 */

const USERNAME = 'X_WS_MULESOFT';
const PASSWORD = 'TxDOT#123TxDOT#123';
const BASE_URL = 'https://psfindv.txdot.gov:8021/PSIGW/RESTListeningConnector/PSFT_EP/ExecuteQuery.v1/PUBLIC';

async function testReceiptAPI(businessUnit: string, receiptId: string) {
  console.log('\n🧪 Testing PeopleSoft Receipt API');
  console.log('=====================================');
  console.log(`Business Unit: ${businessUnit}`);
  console.log(`Receipt ID: ${receiptId}`);

  // Pad receipt ID with leading zeros to make it 10 characters
  const paddedReceiptId = receiptId.toString().padStart(10, '0');
  console.log(`Padded Receipt ID: ${paddedReceiptId}`);

  const url = `${BASE_URL}/X_WS_RECV/JSON/NONFILE?isconnectedquery=n&maxrows=999&prompt_uniquepromptname=BU,RECV&prompt_fieldvalue=${businessUnit},${paddedReceiptId}&json_resp=true`;

  console.log('\n📡 Request URL:');
  console.log(url);

  try {
    const authHeader = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

    console.log('\n⏳ Sending request...');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('\n✅ Response received!');
    console.log(`Status: ${data.status}`);
    console.log(`Query Name: ${data.data?.query?.queryname}`);
    console.log(`Number of rows: ${data.data?.query?.numrows || 0}`);

    if (data.data?.query?.rows && data.data.query.rows.length > 0) {
      console.log('\n📋 Receipt Data:');
      data.data.query.rows.forEach((row: any, index: number) => {
        console.log(`\n--- Row ${index + 1} ---`);
        console.log(`Receiver ID: ${row["A.RECEIVER_ID"]}`);
        console.log(`PO ID: ${row["A.PO_ID"]}`);
        console.log(`Business Unit: ${row["A.BUSINESS_UNIT"]}`);
        console.log(`Receipt Date: ${row["A.RECV_DT"]}`);
        console.log(`Item ID: ${row["A.INV_ITEM_ID"]}`);
        console.log(`Description: ${row["A.DESCR254_MIXED"]}`);
        console.log(`Quantity Received: ${row["A.QTY_RCVD"]}`);
        console.log(`Unit Price: ${row["A.UNIT_PRICE"]}`);
        console.log(`Merchandise Amount: ${row["A.MERCHANDISE_AMT"]}`);
      });

      console.log('\n📊 Full JSON Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n⚠️ No receipt data found');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n💥 Exception occurred:');
    console.error(error);
  }
}

// Test with the example data from the user
testReceiptAPI('60144', '24584');
