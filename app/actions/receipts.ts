'use server';

import PeopleSoftClient from '@/lib/peoplesoft-client';

/**
 * Server action to look up a receipt from PeopleSoft
 */
export async function lookupReceipt(businessUnit: string, receiptId: string) {
  try {
    // Validate inputs
    if (!businessUnit || !receiptId) {
      return {
        success: false,
        error: 'Business Unit and Receipt ID are required',
      };
    }

    console.log('🔍 Looking up receipt:', { businessUnit, receiptId });

    // Query PeopleSoft
    const client = new PeopleSoftClient();
    const result = await client.getReceiptDetails(businessUnit, receiptId);

    if (!result) {
      console.log('❌ Receipt not found');
      return {
        success: false,
        error: 'Receipt not found in PeopleSoft',
      };
    }

    console.log('✅ Receipt found:', {
      receiverId: result.summary?.receiverId,
      itemCount: result.summary?.items?.length
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ Error looking up receipt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: `Failed to lookup receipt: ${errorMessage}`,
    };
  }
}
