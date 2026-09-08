// Deploy in Google Apps Script, never as browser JavaScript.
// Store configuration in Project Settings > Script properties.
function doPost(e) {
  const parameters = (e && e.parameter) || {};
  const reply = (success, kind) => pressResponse(success, kind, parameters);
  const reject = (stage) => {
    console.warn('Press form failure: ' + stage);
    return reply(false);
  };
  let stage = 'configuration';
  try {
    const p = (e && e.parameter) || {};
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('TURNSTILE_SECRET_KEY');
    const recipient = props.getProperty('CONTACT_EMAIL');
    if (!secret || !recipient) throw new Error('Missing configuration');
    stage = 'form-validation';
    const kind = p.kind;
    if (!['contact', 'newsletter', 'order'].includes(kind)) return reject(stage);
    const token = p['cf-turnstile-response'] || '';
    if (!token || token.length > 2048 || p.website) return reject(stage);
    const email = (p.email || '').trim();
    const name = (p.name || '').trim();
    const message = (p.message || '').trim();
    const address = (p.address || '').trim();
    const quantity = Number(p.quantity);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reject(stage);
    if (kind !== 'newsletter' && (!name || name.length > 150)) return reject(stage);
    if (kind === 'contact' && (!message || message.length > 5000 || !['General inquiry', 'Submission inquiry'].includes(p.topic))) return reject(stage);
    if (kind === 'order' && (!['Chasing Stars', 'Inevitable Constellations'].includes(p.book) || !address || address.length > 1000 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || (p.book === 'Inevitable Constellations' && !['Hardcover', 'Paperback'].includes(p.format)))) return reject(stage);
    stage = 'turnstile-request';
    const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', payload: { secret: secret, response: token }, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return reject(stage);
    const verification = JSON.parse(response.getContentText());
    if (!verification.success) return reject('turnstile-rejected');
    if (!['reynstarpress.com', 'www.reynstarpress.com'].includes(verification.hostname)) return reject('turnstile-hostname');
    if (verification.action !== 'press_form') return reject('turnstile-action');
      let subject, body;
      if (kind === 'contact') {
        subject = 'Reynstar Press: ' + p.topic;
        body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message;
      } else if (kind === 'newsletter') {
        subject = 'Reynstar Press: newsletter signup'; body = 'Email: ' + email;
      } else {
        subject = 'Reynstar Press: book order request';
        body = 'Book: ' + p.book + '\nName: ' + name + '\nEmail: ' + email + '\nAddress: ' + address + '\nQuantity: ' + quantity + (p.book === 'Inevitable Constellations' ? '\nFormat: ' + p.format : '');
      }
      stage = 'email-send';
      MailApp.sendEmail({ to: recipient, replyTo: email, subject: subject, body: body });
    return reply(true, kind);
  } catch (error) {
    // Never expose configuration, email addresses, or submitted personal details.
    return reject(stage);
  }
}

function pressResponse(success, kind, parameters) {
  const heading = success ? 'Thank you.' : 'Your request could not be saved.';
  const detail = !success ? 'Please return to the form and try again.' :
    kind === 'order' ? 'Your order request has been received. We’ll follow up by email to confirm the details.' :
    kind === 'newsletter' ? 'Your signup request has been received.' : 'Your message has been received. Thank you for getting in touch.';
  const origins = ['https://reynstarpress.com', 'https://www.reynstarpress.com'];
  let bridge = '';
  if (origins.includes(parameters.reply_origin) && /^[a-f0-9]{32}$/.test(parameters.request_id || '')) {
    const payload = JSON.stringify({ type: 'press-form-result', requestId: parameters.request_id, success: success, message: detail });
    bridge = '<script>window.top.postMessage(' + payload + ',' + JSON.stringify(parameters.reply_origin) + ');</script>';
  }
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reynstar Press</title></head><body><h1>' + heading + '</h1><p>' + detail + '</p><a href="https://reynstarpress.com/" target="_top">Return to Reynstar Press</a>' + bridge + '</body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Run manually from the Apps Script editor; no messages or sheet rows are sent.
function diagnoseSetup() {
  const props = PropertiesService.getScriptProperties();
  ['TURNSTILE_SECRET_KEY', 'CONTACT_EMAIL'].forEach(key => {
    console.log(key + ': ' + (props.getProperty(key) ? 'present' : 'MISSING'));
  });
  try {
    console.log('Email permission/quota: ' + (MailApp.getRemainingDailyQuota() > 0 ? 'available' : 'quota exhausted'));
  } catch (error) { console.log('Email check failed: authorize email permissions.'); }
  console.log('Secret must match the website widget. Presence alone does not verify it.');
}
