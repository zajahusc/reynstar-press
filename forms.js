const protectedForms = document.querySelectorAll('[data-protected-form]');
const formConfig = window.PRESS_FORMS || {};
const states = new Map();

protectedForms.forEach((form) => {
  const status = form.querySelector('[role="status"]');
  const button = form.querySelector('[type="submit"]');
  const state = { pending: false, complete: false, message: '', widget: null, requestId: null };
  states.set(form, state);
  status.tabIndex = -1;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.pending || state.complete) return;
    if (!formConfig.backendReady || !formConfig.siteKey || !formConfig.endpoint || !form.querySelector('[name="cf-turnstile-response"]')?.value) {
      status.textContent = 'Please complete the verification before sending.';
      return;
    }
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    state.requestId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const frame = document.createElement('iframe');
    frame.name = 'press-response-' + state.requestId;
    frame.hidden = true;
    frame.title = 'Form submission response';
    document.body.appendChild(frame);
    state.frame = frame;
    for (const [name, value] of Object.entries({ request_id: state.requestId, reply_origin: location.origin })) {
      let input = form.querySelector(`[name="${name}"]`);
      if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = name; form.appendChild(input); }
      input.value = value;
    }
    form.target = frame.name;
    form.action = formConfig.endpoint;
    state.pending = true;
    state.message = '';
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending…';
    state.timeout = setTimeout(() => {
      // Delivery may have happened even if the confirmation was blocked. Do not auto-retry.
      status.textContent = 'We haven’t received confirmation yet. Your request may have arrived. Please wait before sending again to avoid a duplicate.';
      form.removeAttribute('aria-busy');
    }, 45000);
    HTMLFormElement.prototype.submit.call(form);
  });
});

window.addEventListener('message', (event) => {
  let origin;
  try { origin = new URL(event.origin); } catch { return; }
  if (origin.protocol !== 'https:' || !(origin.hostname === 'script.google.com' || origin.hostname === 'script.googleusercontent.com' || origin.hostname.endsWith('-script.googleusercontent.com'))) return;
  const data = event.data;
  if (!data || data.type !== 'press-form-result' || typeof data.success !== 'boolean') return;
  for (const [form, state] of states) {
    // Google nests its response inside another frame; correlate with a random per-request ID.
    if (!state.pending || data.requestId !== state.requestId) continue;
    clearTimeout(state.timeout);
    state.pending = false;
    state.complete = data.success;
    state.frame.remove();
    form.removeAttribute('aria-busy');
    const kind = form.querySelector('[name="kind"]').value;
    state.message = data.success
      ? (kind === 'order' ? 'Thank you. Your order request has been received. We’ll follow up by email to confirm the details.' : kind === 'newsletter' ? 'Thank you. Your signup request has been received.' : 'Thank you. Your message has been received.')
      : 'Your request could not be saved. Your details are still here. Complete verification again, then retry.';
    const status = form.querySelector('[role="status"]');
    status.textContent = state.message;
    status.focus();
    form.querySelector('[type="submit"]').disabled = true;
    if (data.success) {
      form.querySelector('[type="submit"]').textContent = 'Sent';
      form.querySelectorAll('input, textarea, select').forEach((input) => { input.disabled = true; });
      form.querySelector('.verification').hidden = true;
    } else {
      window.turnstile.reset(state.widget);
    }
  }
});

window.initializePressForms = () => {
  protectedForms.forEach((form) => {
    const state = states.get(form);
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('[role="status"]');
    state.widget = window.turnstile.render(form.querySelector('.verification'), {
      sitekey: formConfig.siteKey, action: 'press_form', theme: 'dark', size: 'flexible',
      callback: () => {
        if (state.pending || state.complete) return;
        button.disabled = false;
        status.textContent = state.message;
      },
      'expired-callback': () => {
        if (state.pending || state.complete) return;
        button.disabled = true;
        status.textContent = state.message || 'Please complete verification again.';
      },
      'error-callback': () => {
        if (state.pending || state.complete) return;
        button.disabled = true;
        status.textContent = 'Verification could not load. Please refresh and try again.';
      }
    });
  });
};

if (protectedForms.length && formConfig.backendReady && formConfig.siteKey && formConfig.endpoint) {
  protectedForms.forEach((form) => { form.querySelector('[role="status"]').textContent = 'Loading verification…'; });
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=initializePressForms&render=explicit';
  script.async = true;
  script.onerror = () => protectedForms.forEach((form) => {
    form.querySelector('[role="status"]').textContent = 'Verification could not load. Please refresh and try again.';
  });
  document.head.appendChild(script);
}
