# Email Notification Setup

## Overview
The FRED application sends email notifications to RC (Rental Coordinator) users when ES users submit new rental requests.

## Email Configuration

### Development Mode (Default - No Setup Required!)
If SMTP is not configured, the system automatically uses **Ethereal Email** - a free, fake SMTP service perfect for testing. 

**You don't need to expose your Gmail or personal email!**

When a rental is submitted, you'll see:
```
📧 SMTP not configured. Creating Ethereal test account...
✅ Ethereal test account created:
   Email: [random]@ethereal.email
   Password: [random]
   Preview URL: https://ethereal.email/messages
✅ Email sent successfully: <message-id>
📬 Preview email at: https://ethereal.email/message/[id]
```

Click the preview URL to see the actual email in your browser - no real email account needed!

### Production Setup
To enable actual email sending, configure the following environment variables in your `.env.local` file:

```env
SMTP_HOST="smtp.gmail.com"          # Your SMTP server
SMTP_PORT="587"                      # Usually 587 for TLS
SMTP_SECURE="false"                  # Use "true" for port 465
SMTP_USER="your-email@example.com"   # SMTP username
SMTP_PASSWORD="your-app-password"    # SMTP password or app-specific password
SMTP_FROM="noreply@txdot.gov"       # From email address (optional)
```

### Common SMTP Providers

#### Gmail
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Secure**: `false`
- **Note**: You need to create an [App Password](https://support.google.com/accounts/answer/185833) for your Gmail account

#### Office 365 / Outlook
- **Host**: `smtp.office365.com`
- **Port**: `587`
- **Secure**: `false`

#### SendGrid
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **User**: `apikey`
- **Password**: Your SendGrid API key

## Notification Flow

1. **ES User** submits a rental request
2. System creates the rental in database
3. System queries for all RC users with email addresses
4. Email notification is sent to all RC users containing:
   - Rental ID
   - Requester name
   - District and Section
   - Equipment type
   - Delivery date and location
   - Direct link to approve the rental
5. If email fails, it's logged but doesn't fail the rental submission

## Email Content

### Subject
```
New Rental Request #[RENTAL_ID] - Approval Required
```

### Body Includes
- Professional HTML layout with TxDOT branding
- Complete rental details
- Call-to-action button linking to rental detail page
- Plain text fallback for email clients that don't support HTML

## Testing

### View Emails with Ethereal (Development - Default)
1. **No configuration needed!** Just don't set SMTP variables
2. Submit a rental request as an ES user
3. Check Docker logs: `docker compose logs app-dev`
4. Copy the preview URL from the logs (looks like `https://ethereal.email/message/...`)
5. Open the URL in your browser to see the email exactly as it would appear
6. **No spam, no real emails, no exposing credentials!**

### Test Actual Email Sending (Production)
1. Configure SMTP variables in `.env.local`
2. Restart the app: `docker compose restart app-dev`
3. Submit a rental request
4. Check that RC users receive the email
5. Verify the approval link works correctly

## Troubleshooting

### Email Not Sending
1. Check Docker logs for error messages: `docker compose logs app-dev | grep -i "email"`
2. Verify SMTP credentials are correct
3. Check if your email provider requires app-specific passwords
4. Ensure port 587 (or 465) is not blocked by firewall

### RC Users Not Receiving Emails
1. Verify RC users have email addresses in the database
2. Check the console logs to see how many recipients were found
3. Query the database: 
   ```sql
   SELECT usr_id, usr_email FROM "USERS" WHERE usr_role = 'RC';
   ```

### Authentication Errors
- Gmail: Use App Password instead of regular password
- Office 365: May require enabling SMTP authentication in admin console
- Check that username/password don't have trailing spaces

## Database Requirements

RC users must have valid email addresses in the `usr_email` field:
```sql
UPDATE "USERS" 
SET usr_email = 'coordinator@txdot.gov' 
WHERE usr_id = 'rcuser1';
```

## Code References

- Email service: `lib/email.ts`
- Rental submission action: `app/actions/rental.ts` (submitRental function)
- Email template: HTML and text versions in `sendRentalApprovalNotification`
