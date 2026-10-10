/**
 * Test Suite: Form Fields & Client-Side Validation Behavior
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite, test, assert, assertEqual, createTestEnvironment } = require('./test-framework.js');

const rootDir = path.resolve(__dirname, '..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const appJsContent = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');

function setupAppEnvironment() {
  const env = createTestEnvironment(htmlContent);
  const context = {
    window: env.window,
    document: env.document,
    history: env.window.history,
    location: env.window.location,
    console: console,
    alert: () => {},
    setTimeout: env.window.setTimeout,
    clearTimeout: env.window.clearTimeout,
    requestAnimationFrame: env.window.requestAnimationFrame,
    cancelAnimationFrame: env.window.cancelAnimationFrame
  };
  context.global = context;
  vm.createContext(context);
  vm.runInContext(appJsContent, context);
  return env;
}

suite('Form Fields Existence & Validation Behavior', () => {

  test('F5.1: Contact Form - All fields exist in DOM', () => {
    const env = setupAppEnvironment();
    assert(env.document.getElementById('contact-form'), '#contact-form element exists');
    assert(env.document.getElementById('contact-name'), '#contact-name input exists');
    assert(env.document.getElementById('contact-email'), '#contact-email input exists');
    assert(env.document.getElementById('contact-message'), '#contact-message textarea exists');
    assert(env.document.getElementById('contact-form-alert'), '#contact-form-alert container exists');
  });

  test('F5.2: Contact Form - Empty submission rejected with error alert', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('contact-form');
    const alertBox = env.document.getElementById('contact-form-alert');

    // Submit with empty inputs
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('error'), 'Alert banner has .error class');
    assertEqual(alertBox.style.display, 'flex', 'Alert banner is displayed');
  });

  test('F5.3: Contact Form - Invalid email rejected with error alert', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('contact-form');
    const nameInput = env.document.getElementById('contact-name');
    const emailInput = env.document.getElementById('contact-email');
    const msgInput = env.document.getElementById('contact-message');
    const alertBox = env.document.getElementById('contact-form-alert');

    nameInput.value = 'Chihiro Ogino';
    emailInput.value = 'invalid-email-without-domain';
    msgInput.value = 'Looking forward to visiting the spirit realm!';

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('error'), 'Alert banner indicates error');
    assert(emailInput.classList.contains('is-invalid'), 'Email input marked .is-invalid');
  });

  test('F5.4: Contact Form - Valid submission shows success banner and resets fields', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('contact-form');
    const nameInput = env.document.getElementById('contact-name');
    const emailInput = env.document.getElementById('contact-email');
    const msgInput = env.document.getElementById('contact-message');
    const alertBox = env.document.getElementById('contact-form-alert');

    nameInput.value = 'San of the Wolf Clan';
    emailInput.value = 'san@mononoke.jp';
    msgInput.value = 'We must protect the ancient cedar grove.';

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('success'), 'Alert banner has .success class');
    assert(alertBox.innerHTML.includes('San of the Wolf Clan'), 'Alert banner mentions user name');
    assertEqual(nameInput.value, '', 'Form inputs reset after successful submission');
  });

  test('F5.5: Login Form - Validation of empty vs valid credentials', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('login-form');
    const user = env.document.getElementById('login-username');
    const pass = env.document.getElementById('login-password');
    const alertBox = env.document.getElementById('login-alert');

    // Empty credentials
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(alertBox.classList.contains('error'), 'Login alert indicates error for empty credentials');

    // Valid credentials
    user.value = 'howl_pendragon';
    pass.value = 'sophie_hatter';
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(alertBox.classList.contains('success'), 'Login alert indicates success for valid credentials');
    assert(alertBox.innerHTML.includes('howl_pendragon'), 'Success banner greets user');
  });

  test('F5.6: Signup Form - Rejects short passwords and accepts valid credentials', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('signup-form');
    const email = env.document.getElementById('signup-email');
    const pass = env.document.getElementById('signup-password');
    const alertBox = env.document.getElementById('signup-alert');

    // Password less than 6 characters
    email.value = 'kiki@delivery.jp';
    pass.value = '123';
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(alertBox.classList.contains('error'), 'Short password rejected');

    // Valid signup
    pass.value = 'bakery1234';
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    assert(alertBox.classList.contains('success'), 'Valid signup accepted');
  });

  test('F5.7: Registration Form - Complete 10-field specification in DOM', () => {
    const env = setupAppEnvironment();
    const fields = [
      'reg-firstname',
      'reg-lastname',
      'reg-username',
      'reg-email',
      'reg-password',
      'reg-confirmpassword',
      'reg-city',
      'reg-state',
      'reg-pincode',
      'reg-terms'
    ];

    fields.forEach(f => {
      assert(env.document.getElementById(f) !== null, `Registration field #${f} exists in DOM`);
    });
    assert(env.document.getElementById('registration-alert') !== null, '#registration-alert exists');
  });

  test('F5.8: Registration Form - Password mismatch validation', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('registration-form');
    const alertBox = env.document.getElementById('registration-alert');

    env.document.getElementById('reg-firstname').value = 'Nausicaa';
    env.document.getElementById('reg-lastname').value = 'Valley';
    env.document.getElementById('reg-username').value = 'windrider';
    env.document.getElementById('reg-email').value = 'nausicaa@valley.org';
    env.document.getElementById('reg-password').value = 'secret123';
    env.document.getElementById('reg-confirmpassword').value = 'wrongpassword';
    env.document.getElementById('reg-city').value = 'Valley of the Wind';
    env.document.getElementById('reg-state').value = 'Tokyo';
    env.document.getElementById('reg-pincode').value = '100001';
    env.document.getElementById('reg-terms').checked = true;

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('error'), 'Alert shows error');
    assert(alertBox.innerHTML.includes('Passwords do not match'), 'Error message reports password mismatch');
  });

  test('F5.9: Registration Form - Unchecked terms checkbox validation', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('registration-form');
    const alertBox = env.document.getElementById('registration-alert');

    env.document.getElementById('reg-firstname').value = 'Nausicaa';
    env.document.getElementById('reg-lastname').value = 'Valley';
    env.document.getElementById('reg-username').value = 'windrider';
    env.document.getElementById('reg-email').value = 'nausicaa@valley.org';
    env.document.getElementById('reg-password').value = 'secret123';
    env.document.getElementById('reg-confirmpassword').value = 'secret123';
    env.document.getElementById('reg-city').value = 'Valley of the Wind';
    env.document.getElementById('reg-state').value = 'Tokyo';
    env.document.getElementById('reg-pincode').value = '100001';
    env.document.getElementById('reg-terms').checked = false; // Unchecked terms

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('error'), 'Alert shows error');
    assert(alertBox.innerHTML.includes('terms and conditions'), 'Error message reports terms agreement required');
  });

  test('F5.10: Registration Form - Fully valid 10-field submission succeeds', () => {
    const env = setupAppEnvironment();
    const form = env.document.getElementById('registration-form');
    const alertBox = env.document.getElementById('registration-alert');

    env.document.getElementById('reg-firstname').value = 'Ashitaka';
    env.document.getElementById('reg-lastname').value = 'Emishi';
    env.document.getElementById('reg-username').value = 'ashitaka_prince';
    env.document.getElementById('reg-email').value = 'ashitaka@emishi.jp';
    env.document.getElementById('reg-password').value = 'iron_town_pass';
    env.document.getElementById('reg-confirmpassword').value = 'iron_town_pass';
    env.document.getElementById('reg-city').value = 'Emishi Village';
    env.document.getElementById('reg-state').value = 'Kyoto';
    env.document.getElementById('reg-pincode').value = '602001';
    env.document.getElementById('reg-terms').checked = true;

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    assert(alertBox.classList.contains('success'), 'Registration alert shows success');
    assert(alertBox.innerHTML.includes('Ashitaka Emishi'), 'Success banner mentions full name');
    assert(alertBox.innerHTML.includes('ashitaka_prince'), 'Success banner mentions username');
  });

});
