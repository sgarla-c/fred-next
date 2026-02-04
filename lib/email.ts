import nodemailer from "nodemailer";

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@txdot.gov";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;
let testAccount: any = null;

async function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // If SMTP is not configured, create a test account with Ethereal Email
  if (!process.env.SMTP_USER) {
    console.log("📧 SMTP not configured. Creating Ethereal test account...");
    
    try {
      // Create a test account with Ethereal (fake SMTP service)
      testAccount = await nodemailer.createTestAccount();
      
      console.log("✅ Ethereal test account created:");
      console.log("   Email:", testAccount.user);
      console.log("   Password:", testAccount.pass);
      console.log("   Preview URL: https://ethereal.email/messages");
      
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      return transporter;
    } catch (error) {
      console.error("Failed to create Ethereal test account:", error);
      return null;
    }
  }

  // Use configured SMTP
  transporter = nodemailer.createTransport(EMAIL_CONFIG);
  return transporter;
}

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
 */
export async function sendRentalApprovalNotification(
  toEmails: string[],
  rentalData: RentalNotificationData
) {
  const transporter = await getTransporter();

  if (!transporter) {
    console.error("❌ Failed to create email transporter");
    return { success: false, error: "Email service unavailable" };
  }

  const subject = `New Rental Request #${rentalData.rentalId} - Approval Required`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #003366; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #003366; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #003366; }
        .button { display: inline-block; padding: 12px 24px; background-color: #003366; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FRED - New Rental Request</h1>
        </div>
        
        <div class="content">
          <p>A new equipment rental request has been submitted and requires your approval.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Rental ID:</span> #${rentalData.rentalId}
            </div>
            <div class="detail-row">
              <span class="label">Requested By:</span> ${rentalData.requestedBy}
            </div>
            <div class="detail-row">
              <span class="label">District:</span> ${rentalData.district}
            </div>
            <div class="detail-row">
              <span class="label">Section:</span> ${rentalData.section}
            </div>
            <div class="detail-row">
              <span class="label">Equipment Type:</span> ${rentalData.equipmentType}
            </div>
            ${rentalData.deliveryDate ? `
            <div class="detail-row">
              <span class="label">Delivery Date:</span> ${rentalData.deliveryDate}
            </div>
            ` : ''}
            ${rentalData.deliveryLocation ? `
            <div class="detail-row">
              <span class="label">Delivery Location:</span> ${rentalData.deliveryLocation}
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="${rentalData.approvalLink}" class="button">
              Review & Approve Request
            </a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Click the button above to view the full rental details and process the approval.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from the FRED system.</p>
          <p>TxDOT Fleet Rental Equipment Database</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Rental Request #${rentalData.rentalId} - Approval Required

A new equipment rental request has been submitted and requires your approval.

Rental Details:
- Rental ID: #${rentalData.rentalId}
- Requested By: ${rentalData.requestedBy}
- District: ${rentalData.district}
- Section: ${rentalData.section}
- Equipment Type: ${rentalData.equipmentType}
${rentalData.deliveryDate ? `- Delivery Date: ${rentalData.deliveryDate}` : ''}
${rentalData.deliveryLocation ? `- Delivery Location: ${rentalData.deliveryLocation}` : ''}

To review and approve this request, please visit:
${rentalData.approvalLink}

---
This is an automated notification from the FRED system.
TxDOT Fleet Rental Equipment Database
  `;

  try {
    const info = await transporter.sendMail({
      from: `FRED System <${FROM_EMAIL}>`,
      to: toEmails.join(", "),
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    
    // If using Ethereal (test account), show preview URL
    if (testAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("📬 Preview email at:", previewUrl);
      return { success: true, messageId: info.messageId, previewUrl };
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConnection() {
  const transporter = await getTransporter();
  
  if (!transporter) {
    return { success: false, error: "Failed to create transporter" };
  }

  try {
    await transporter.verify();
    return { success: true, testAccount: testAccount?.user };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
