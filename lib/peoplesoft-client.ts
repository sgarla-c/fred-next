/**
 * TxDOT PeopleSoft API Client
 * Provides functions to query PO data from PeopleSoft
 */

interface PeopleSoftPOResponse {
  status: string;
  data: {
    query: {
      numrows: number;
      queryname: string;
      rows: PeopleSoftPO[];
    };
  };
}

interface PeopleSoftPO {
  'attr:rownumber': number;
  'A.BUSINESS_UNIT': string;
  'A.PO_ID': string;
  'A.PO_TYPE': string;
  'A.PO_STATUS': string;
  'A.PO_DT': string;
  'A.VENDOR_ID': string;
  'A.BUYER_ID': string;
  'A.APPROVAL_DT': string;
  'A.LAST_DTTM_UPDATE': string;
  'B.INV_ITEM_ID': string;
  'B.DESCR254_MIXED': string;
  'B.CATEGORY_ID': string;
  'C.QTY_PO': number;
  'C.MERCHANDISE_AMT': number;
  'D.MERCHANDISE_AMT': number;
  'D.ACCOUNT': string;
  'D.DEPTID': string;
  'D.FUND_CODE': string;
  'D.PROJECT_ID': string;
  'A.X_PO_CNTRCT_AMT': number;
  [key: string]: any;
}

export class PeopleSoftClient {
  private username = 'X_WS_MULESOFT';
  private password = 'TxDOT#123TxDOT#123';
  private baseUrl = 'https://psfindv.txdot.gov:8021/PSIGW/RESTListeningConnector/PSFT_EP/ExecuteQuery.v1/PUBLIC';

  /**
   * Get authorization header for Basic Auth
   */
  private getAuthHeader(): string {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${auth}`;
  }

  /**
   * Query PO by Business Unit and PO ID
   */
  async queryPO(businessUnit: string, poId: string): Promise<PeopleSoftPOResponse> {
    const url = `${this.baseUrl}/X_WS_PO/JSON/NONFILE?isconnectedquery=n&maxrows=999&prompt_uniquepromptname=BU,PO&prompt_fieldvalue=${businessUnit},${poId}&json_resp=true`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`PeopleSoft API returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error querying PeopleSoft:', error);
      throw error;
    }
  }

  /**
   * Transform PeopleSoft PO data to FRED format
   */
  transformPOData(psPO: PeopleSoftPO) {
    return {
      poId: parseInt(psPO['A.PO_ID']),
      poRlseNbr: psPO['A.PO_ID'],
      vendrNm: psPO['A.VENDOR_ID'], // Will need vendor lookup
      poBuNbr: psPO['A.BUSINESS_UNIT'],
      poStatus: this.mapPOStatus(psPO['A.PO_STATUS']),
      poStartDt: psPO['A.PO_DT'] ? new Date(psPO['A.PO_DT']) : null,
      poType: this.mapPOType(psPO['A.PO_TYPE']),
      mnthEqRate: psPO['C.MERCHANDISE_AMT'] || psPO['D.MERCHANDISE_AMT'] || 0,
      lastUpdtDt: psPO['A.LAST_DTTM_UPDATE'] ? new Date(psPO['A.LAST_DTTM_UPDATE']) : null,
      // Additional fields
      chartFieldsFlg: !!(psPO['D.FUND_CODE'] || psPO['D.PROJECT_ID']),
      userRqstViaPurchFlg: false,
      txdotGps: false,
    };
  }

  /**
   * Map PeopleSoft status to FRED status
   */
  private mapPOStatus(psStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'Dispatched': 'Active',
      'Approved': 'Open',
      'Pending': 'Draft',
      'Closed': 'Closed',
      'Cancelled': 'Cancelled',
    };
    return statusMap[psStatus] || 'Draft';
  }

  /**
   * Map PeopleSoft PO type to FRED type
   */
  private mapPOType(psType: string): string {
    const typeMap: { [key: string]: string } = {
      'GEN': 'Standard',
      'REG': 'Standard',
      'STD': 'Standard',
    };
    return typeMap[psType] || psType;
  }

  /**
   * Get PO details with formatted output
   */
  async getPODetails(businessUnit: string, poId: string) {
    console.log(`\n🔍 Querying PO: ${businessUnit} - ${poId}`);
    
    const response = await this.queryPO(businessUnit, poId);
    
    if (response.status !== 'success') {
      throw new Error('PeopleSoft API returned non-success status');
    }

    const rows = response.data.query.rows;
    
    if (!rows || rows.length === 0) {
      console.log('❌ No PO found');
      return null;
    }

    const po = rows[0];
    
    console.log('\n✅ PO Found:');
    console.log(`   Business Unit: ${po['A.BUSINESS_UNIT']}`);
    console.log(`   PO ID: ${po['A.PO_ID']}`);
    console.log(`   Status: ${po['A.PO_STATUS']}`);
    console.log(`   Type: ${po['A.PO_TYPE']}`);
    console.log(`   Date: ${po['A.PO_DT']}`);
    console.log(`   Vendor ID: ${po['A.VENDOR_ID']}`);
    console.log(`   Amount: $${po['C.MERCHANDISE_AMT']?.toLocaleString() || 0}`);
    console.log(`   Description: ${po['B.DESCR254_MIXED']}`);
    
    return {
      raw: po,
      transformed: this.transformPOData(po)
    };
  }
}

// Example usage
async function testClient() {
  const client = new PeopleSoftClient();
  
  try {
    const result = await client.getPODetails('60144', '0000079262');
    
    if (result) {
      console.log('\n📊 Transformed Data (FRED format):');
      console.log(JSON.stringify(result.transformed, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  testClient();
}

export default PeopleSoftClient;
