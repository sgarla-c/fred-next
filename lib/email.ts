// EMAIL FUNCTIONALITY DISABLED
// Nodemailer has been temporarily disabled due to module resolution issues with Turbopack
// All email functions are stubbed out and will log instead of sending emails

// Types for email notifications
export interface RentalNotificationData {
  rentalId: number;
  requestedBy: string;
  district: string;
  section: string;
  equipmentType: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  approvalLink: string;
}

/**
 * Send rental approval notification to RC users
 * CURRENTLY DISABLED - Only logs the email that would be sent
 */
export async function sendRentalApprovalNotification(
  toEmails: string[],
  rentalData: RentalNotificationData
) {
  console.log("📧 [EMAIL DISABLED] Would have sent rental approval notification:");
  console.log("   To:", toEmails.join(", "));
  console.log("   Rental ID:", rentalData.rentalId);
  console.log("   Requested By:", rentalData.requestedBy);
  console.log("   Equipment:", rentalData.equipmentType);
  console.log("   District/Section:", `${rentalData.district} - ${rentalData.section}`);
  
  return {
    success: true,
    message: "Email functionality is disabled - notification logged only",
    messageId: "disabled",
    previewUrl: null,
  };
}

/**
 * Send rental denial notification
 * CURRENTLY DISABLED - Only logs the email that would be sent
 */
export async function sendRentalDenialNotification(
  toEmail: string,
  rentalData: any
) {
  console.log("📧 [EMAIL DISABLED] Would have sent rental denial notification:");
  console.log("   To:", toEmail);
  console.log("   Rental ID:", rentalData.rentalId);
  
  return {
    success: true,
    message: "Email functionality is disabled - notification logged only",
  };
}

/**
 * Send rental approval confirmation
 * CURRENTLY DISABLED - Only logs the email that would be sent
 */
export async function sendRentalApprovalConfirmation(
  toEmail: string,
  rentalData: any
) {
  console.log("📧 [EMAIL DISABLED] Would have sent rental approval confirmation:");
  console.log("   To:", toEmail);
  console.log("   Rental ID:", rentalData.rentalId);
  
  return {
    success: true,
    message: "Email functionality is disabled - notification logged only",
  };
}

// Note: To re-enable email functionality in the future:
// 1. Install nodemailer: npm install nodemailer @types/nodemailer
// 2. Restore the original implementation with proper email templates
// 3. Configure SMTP settings in .env file
// 4. Add nodemailer to next.config.ts serverExternalPackages if needed
