# Activate protected forms

The local website configuration now has the public site key and `backendReady`
set to true following the supplied deployment confirmation. Live verification and
delivery remain untested. The setup below documents the required server settings.

1. In Cloudflare > Turnstile > Add widget, name it Reynstar Press, allow
   `reynstarpress.com` and `www.reynstarpress.com`, choose Managed, and create it.
   No DNS or nameserver change is needed for Turnstile.
2. Open the existing Google Sheet's Extensions > Apps Script. Replace the old
   script with `server/Code.gs`. Keep the sheet tab named `Orders`, with columns
   Timestamp, Name, Email, Address, Quantity, Format.
3. In Apps Script > Project Settings > Script properties, set:
   - `TURNSTILE_SECRET_KEY`: your private Turnstile secret key.
   - `CONTACT_EMAIL`: the private inbox that should receive inquiries and signups.
   - `SHEET_ID`: `1npsheMRgTcTakVOMIaLAYBoWOPn45LDlZwF4lj7Nyq4`.
   Never place the secret key or inbox address in browser code or this repository.
4. Save. Choose Deploy > Manage deployments > edit the existing web app >
   Version: New version > Deploy. Keep Execute as: Me and access: Anyone.
   Authorize the additional email and external-request permissions when asked.
   Updating the existing deployment preserves its `/exec` URL.
5. Archive any other active deployments of the OLD unprotected order script.
   Old versions still accepting requests can bypass the new verification.
6. Put only the PUBLIC site key in `forms-config.js`. Verify its endpoint matches
   the updated `/exec` URL. Set `backendReady` to true only after the updated backend
   is deployed. Then publish the website.
7. On the live domain, submit a test contact inquiry, newsletter signup, and each
   order form. Verify inbox delivery for inquiries, signups, and Inevitable
   Constellations orders, and a new sheet row for Chasing Stars. Confirm reply-to
   points to the supplied sender. No payment is collected by these forms.

Chasing Stars orders continue to write only to the Sheet. Contact messages,
submission inquiries, newsletter signups, and Inevitable Constellations orders
are emailed through the Apps Script owner's Google account using MailApp.
Email is subject to that account's Apps Script sending quotas. Newsletter
requests do not automatically enroll anyone in a separate mailing platform.

The backend requires a valid, unexpired Turnstile token with a permitted hostname
and the `press_form` action before any email or spreadsheet write. Missing
configuration or service errors fail closed. No private values are embedded in
success/error pages. There is no public read endpoint for the Sheet.

Verification performed locally: mocked server calls for valid inquiries, both
order routes, and signups; rejection of missing/invalid tokens, wrong hostname,
wrong action, honeypot content, invalid email, and invalid quantity; spreadsheet
formula escaping; static form/link checks. These do not verify live delivery.

References:
- https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.google.com/apps-script/guides/properties
- https://developers.google.com/apps-script/concepts/deployments
- https://developers.google.com/apps-script/reference/mail/mail-app
