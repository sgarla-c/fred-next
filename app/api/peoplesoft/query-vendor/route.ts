import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    console.log('API Route called: /api/peoplesoft/query-vendor');
    
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
    const { setId, vendorId } = await request.json();
    console.log('Request params:', { setId, vendorId });

    if (!setId || !vendorId) {
      return NextResponse.json(
        { error: "Set ID and Vendor ID are required" },
        { status: 400 }
      );
    }

    // Construct the dynamic URL with variables
    const username = 'X_WS_MULESOFT';
    const password = 'TxDOT#123TxDOT#123';
    const baseUrl = 'https://psfindv.txdot.gov:8021/PSIGW/RESTListeningConnector/PSFT_EP/ExecuteQuery.v1/PUBLIC';
    const url = `${baseUrl}/X_WS_VENDOR/JSON/NONFILE?isconnectedquery=n&maxrows=0&prompt_uniquepromptname=SETID,VENDOR&prompt_fieldvalue=${setId},${vendorId}&json_resp=true`;

    console.log('Calling PeopleSoft Vendor API:', url);

    // Create Basic Auth header
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('PeopleSoft Vendor API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PeopleSoft Vendor API error:', errorText);
      return NextResponse.json(
        { error: `PeopleSoft API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);

    const data = await response.json();
    console.log('Vendor data received, numrows:', data?.data?.query?.numrows);

    // Check if vendor was found
    if (!data.data?.query?.rows || data.data.query.rows.length === 0) {
      return NextResponse.json(
        { error: "Vendor not found in PeopleSoft" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error querying PeopleSoft vendor:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to query PeopleSoft vendor" },
      { status: 500 }
    );
  }
}
