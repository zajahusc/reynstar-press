# Protected forms setup

All book orders, contact/submission inquiries, and newsletter signup requests now
route to the press inbox via MailApp. No spreadsheet is required or written to.
Existing spreadsheet records are untouched. The old SHEET_ID property may remain
but is no longer used.

## Activate the inbox routing update

1. Replace the entire Code.gs in the existing Apps Script project with
   `server/Code.gs`, including `pressResponse` and the functions at the bottom.
2. Keep Script properties TURNSTILE_SECRET_KEY and CONTACT_EMAIL private.
   Keep the existing public site key and deployment URL in forms-config.js.
3. Save and update the existing web app: Deploy > Manage deployments > pencil >
   New version > Deploy. Execute as Me; access Anyone. Existing permissions for
   sending email and external requests must be granted to the deploying account.
4. Publish the matching website files after updating Apps Script.
5. Test both book order forms and contact/newsletter forms in Safari. Confirm
   the inline success appears and the corresponding email reaches the press inbox.

The frontend submits into a hidden iframe. The response uses a random request ID
and restricted destination origin to confirm receipt without navigating away.
The website checks the Google response origin and request ID. An unconfirmed
request shows an unknown-delivery message and is not automatically retried.
The old troubleshooting ResponseHelpers file is no longer called by Code.gs.

Turnstile validation checks token success, hostname, and action before sending
email. No secrets or submitted personal details are included in responses.
MailApp is subject to the deploying Google account's sending quota. Newsletter
requests are emailed; this does not enroll people in a separate mailing service.

Local validation: mocked both book email routes with no SHEET_ID configured;
static navigation/link checks. No live emails were sent during these checks.
Live delivery requires the Apps Script update above.
