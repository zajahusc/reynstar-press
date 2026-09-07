const protectedForms = document.querySelectorAll('[data-protected-form]');
const formConfig = window.PRESS_FORMS || {};

protectedForms.forEach((form) => {
  const status = form.querySelector('[role="status"]');
  form.addEventListener('submit', (event) => {
    if (!formConfig.backendReady || !formConfig.siteKey || !formConfig.endpoint || !form.querySelector('[name="cf-turnstile-response"]')?.value) {
      event.preventDefault();
      status.textContent = 'Please complete the verification before sending.';
    }
  });
});

window.initializePressForms = () => {
  protectedForms.forEach((form) => {
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('[role="status"]');
    form.action = formConfig.endpoint;
    window.turnstile.render(form.querySelector('.verification'), {
      sitekey: formConfig.siteKey,
      action: 'press_form',
      theme: 'dark',
      size: 'flexible',
      callback: () => { button.disabled = false; status.textContent = ''; },
      'expired-callback': () => { button.disabled = true; status.textContent = 'Please complete verification again.'; },
      'error-callback': () => { button.disabled = true; status.textContent = 'Verification could not load. Please refresh and try again.'; }
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
