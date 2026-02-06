import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    console.log('API Route called: /api/peoplesoft/query-receipt');
    
    // Check authentication
    const session = await auth();
    const role = session?.user?.role ?? "";
    const userLabel = session?.user?.name || session?.user?.id || "unknown";
    console.log('Session:', session ? `User: ${userLabel}, Role: ${role}` : 'No session');

    if (!session || !["FIN", "RC", "Manager", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { businessUnit, receiptId } = await request.json();
    console.log('Request params:', { businessUnit, receiptId });

    if (!businessUnit || !receiptId) {
      return NextResponse.json(
        { error: "Business Unit and Receipt ID are required" },
        { status: 400 }
      );
    }

    // Pad receipt ID with leading zeros to make it 10 characters
    const paddedReceiptId = receiptId.toString().padStart(10, '0');
    console.log('Padded Receipt ID:', paddedReceiptId);

    // Construct the dynamic URL with variables
    const username = 'X_WS_MULESOFT';
    const password = 'TxDOT#123TxDOT#123';
    const baseUrl = 'https://psfindv.txdot.gov:8021/PSIGW/RESTListeningConnector/PSFT_EP/ExecuteQuery.v1/PUBLIC';
    const url = `${baseUrl}/X_WS_RECV/JSON/NONFILE?isconnectedquery=n&maxrows=999&prompt_uniquepromptname=BU,RECV&prompt_fieldvalue=${businessUnit},${paddedReceiptId}&json_resp=true`;

    console.log('Calling PeopleSoft Receipt API:', url);

    // Create Basic Auth header
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('PeopleSoft Receipt API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PeopleSoft Receipt API error:', errorText);
      return NextResponse.json(
        { error: `PeopleSoft API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);

    const data = await response.json();
    console.log('Data received, numrows:', data?.data?.query?.numrows);

    // Check if Receipt was found
    if (!data.data?.query?.rows || data.data.query.rows.length === 0) {
      return NextResponse.json(
        { error: "Receipt not found in PeopleSoft" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error querying PeopleSoft Receipt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to query PeopleSoft Receipt" },
      { status: 500 }
    );
  }
}
