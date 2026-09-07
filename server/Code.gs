// Deploy in Google Apps Script, never as browser JavaScript.
// Store configuration in Project Settings > Script properties.
function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('TURNSTILE_SECRET_KEY');
    const recipient = props.getProperty('CONTACT_EMAIL');
    const sheetId = props.getProperty('SHEET_ID');
    if (!secret || !recipient || !sheetId) throw new Error('Missing configuration');
    const kind = p.kind;
    if (!['contact', 'newsletter', 'order'].includes(kind)) return resultPage(false);
    const token = p['cf-turnstile-response'] || '';
    if (!token || token.length > 2048 || p.website) return resultPage(false);
    const email = (p.email || '').trim();
    const name = (p.name || '').trim();
    const message = (p.message || '').trim();
    const address = (p.address || '').trim();
    const quantity = Number(p.quantity);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return resultPage(false);
    if (kind !== 'newsletter' && (!name || name.length > 150)) return resultPage(false);
    if (kind === 'contact' && (!message || message.length > 5000 || !['General inquiry', 'Submission inquiry'].includes(p.topic))) return resultPage(false);
    if (kind === 'order' && (!['Chasing Stars', 'Inevitable Constellations'].includes(p.book) || !address || address.length > 1000 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || !['Hardcover', 'Paperback'].includes(p.format))) return resultPage(false);
    const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', payload: { secret: secret, response: token }, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return resultPage(false);
    const verification = JSON.parse(response.getContentText());
    if (!verification.success || !['reynstarpress.com', 'www.reynstarpress.com'].includes(verification.hostname) || verification.action !== 'press_form') return resultPage(false);
    if (kind === 'order' && p.book === 'Chasing Stars') {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
        const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Orders');
        const safe = value => /^[=+\-@\t\r\n]/.test(value) ? "'" + value : value;
        sheet.appendRow([new Date(), safe(name), safe(email), safe(address), quantity, p.format]);
        SpreadsheetApp.flush();
      } finally { if (lock.hasLock()) lock.releaseLock(); }
    } else {
      let subject, body;
      if (kind === 'contact') {
        subject = 'Reynstar Press: ' + p.topic;
        body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message;
      } else if (kind === 'newsletter') {
        subject = 'Reynstar Press: newsletter signup'; body = 'Email: ' + email;
      } else {
        subject = 'Reynstar Press: book order request';
        body = 'Book: ' + p.book + '\nName: ' + name + '\nEmail: ' + email + '\nAddress: ' + address + '\nQuantity: ' + quantity + '\nFormat: ' + p.format;
      }
      MailApp.sendEmail({ to: recipient, replyTo: email, subject: subject, body: body });
    }
    return resultPage(true, kind);
  } catch (error) {
    // Never expose configuration, email addresses, or submitted personal details.
    return resultPage(false);
  }
}

function resultPage(success, kind) {
  const heading = success ? 'Thank you.' : 'Your request could not be saved.';
  const detail = !success ? 'Please go back, complete a fresh verification, and try again.' :
    kind === 'order' ? 'Your order request has been received. We’ll follow up to confirm availability, pricing, shipping, and payment. No payment has been collected.' :
    kind === 'newsletter' ? 'Your signup request has been received.' : 'Your message has been received.';
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reynstar Press</title></head><body style="background:#0d0b0a;color:#f3ede7;font:18px/1.7 sans-serif;max-width:650px;margin:60px auto;padding:24px"><h1>' + heading + '</h1><p>' + detail + '</p><a style="color:#d6b78a" href="https://reynstarpress.com/" target="_top">Return to Reynstar Press</a></body></html>');
}
