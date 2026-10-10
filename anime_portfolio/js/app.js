/**
 * Main Application Coordinator - Anime Cinematic SPA
 * Vanilla JS SPA Router, Event Delegation, and Form Validations
 */
(function(global) {
  'use strict';

  var validScenes = ['project', 'about', 'contact', 'login', 'registration'];
  var currentScene = 'project';

  // --- Router & Scene Management ---
  function getSceneFromHash() {
    var hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (hash.startsWith('scene-')) {
      hash = hash.replace('scene-', '');
    }
    return validScenes.indexOf(hash) !== -1 ? hash : 'project';
  }

  function updateNavActive(sceneId) {
    var navLinks = document.querySelectorAll('.nav-link, [data-scene]');
    navLinks.forEach(function(link) {
      var linkScene = link.getAttribute('data-scene') || (link.getAttribute('href') || '').replace('#', '');
      if (linkScene === sceneId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function navigateTo(targetScene, pushHistory) {
    if (validScenes.indexOf(targetScene) === -1) {
      targetScene = 'project';
    }

    if (targetScene === currentScene) {
      return;
    }

    if (global.TransitionController && global.TransitionController.isTransitioning) {
      return;
    }

    var nextScene = targetScene;

    if (pushHistory !== false) {
      try {
        history.pushState({ scene: nextScene }, '', '#' + nextScene);
      } catch (e) {
        window.location.hash = '#' + nextScene;
      }
    }

    if (global.TransitionController && typeof global.TransitionController.playTransition === 'function') {
      global.TransitionController.playTransition(nextScene, function() {
        currentScene = nextScene;
        updateNavActive(nextScene);
      });
    } else {
      // Direct DOM swap fallback
      var allSections = document.querySelectorAll('.scene-section');
      allSections.forEach(function(sec) {
        sec.classList.remove('active');
      });
      var targetEl = document.getElementById('scene-' + nextScene);
      if (targetEl) {
        targetEl.classList.add('active');
      }
      currentScene = nextScene;
      updateNavActive(nextScene);
      window.scrollTo(0, 0);
    }
  }

  function setupNavigationDelegation() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="#"], [data-scene]');
      if (!link) return;

      var href = link.getAttribute('href');
      var dataScene = link.getAttribute('data-scene');

      var target = dataScene;
      if (!target && href && href.startsWith('#')) {
        target = href.replace(/^#\/?/, '').replace('scene-', '');
      }

      if (target && validScenes.indexOf(target) !== -1) {
        e.preventDefault();
        navigateTo(target, true);
      }
    });

    window.addEventListener('popstate', function() {
      var target = getSceneFromHash();
      if (target !== currentScene) {
        navigateTo(target, false);
      }
    });

    window.addEventListener('hashchange', function() {
      var target = getSceneFromHash();
      if (target !== currentScene) {
        navigateTo(target, false);
      }
    });
  }

  // --- Form Validation Modules ---

  function setupContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var nameInput = document.getElementById('contact-name');
      var emailInput = document.getElementById('contact-email');
      var messageInput = document.getElementById('contact-message');
      var alertBox = document.getElementById('contact-form-alert');

      var isValid = true;

      // Validate Name
      if (!nameInput.value.trim()) {
        nameInput.classList.add('is-invalid');
        isValid = false;
      } else {
        nameInput.classList.remove('is-invalid');
        nameInput.classList.add('is-valid');
      }

      // Validate Email
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('is-invalid');
        isValid = false;
      } else {
        emailInput.classList.remove('is-invalid');
        emailInput.classList.add('is-valid');
      }

      // Validate Message
      if (!messageInput.value.trim()) {
        messageInput.classList.add('is-invalid');
        isValid = false;
      } else {
        messageInput.classList.remove('is-invalid');
        messageInput.classList.add('is-valid');
      }

      if (alertBox) {
        if (isValid) {
          alertBox.className = 'form-alert-banner success';
          alertBox.innerHTML = '✨ <strong>Message Sent!</strong> Thank you, ' + escapeHtml(nameInput.value.trim()) + '. Dibyaranjan will respond shortly!';
          alertBox.style.display = 'flex';
          form.reset();
          setTimeout(function() {
            var valids = form.querySelectorAll('.is-valid');
            valids.forEach(function(v) { v.classList.remove('is-valid'); });
          }, 3000);
        } else {
          alertBox.className = 'form-alert-banner error';
          alertBox.innerHTML = '⚠️ Please fill out all required fields with valid information.';
          alertBox.style.display = 'flex';
        }
      }
    });
  }

  function setupNewsletterForm() {
    var form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var emailInput = document.getElementById('newsletter-email');
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (emailInput && emailRegex.test(emailInput.value.trim())) {
        alert('🌸 Subscribed! Welcome to the Chronicles newsletter.');
        emailInput.value = '';
      } else {
        alert('Please enter a valid email address.');
      }
    });
  }

  function setupLoginForm() {
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var user = document.getElementById('login-username');
        var pass = document.getElementById('login-password');
        var alertBox = document.getElementById('login-alert');

        if (!user.value.trim() || !pass.value.trim()) {
          if (alertBox) {
            alertBox.className = 'form-alert-banner error';
            alertBox.innerHTML = '⚠️ Please enter both username and password.';
            alertBox.style.display = 'flex';
          }
        } else {
          if (alertBox) {
            alertBox.className = 'form-alert-banner success';
            alertBox.innerHTML = '🌸 Welcome back, <strong>' + escapeHtml(user.value.trim()) + '</strong>!';
            alertBox.style.display = 'flex';
          }
        }
      });
    }

    var signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('signup-email');
        var pass = document.getElementById('signup-password');
        var alertBox = document.getElementById('signup-alert');

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim()) || pass.value.length < 6) {
          if (alertBox) {
            alertBox.className = 'form-alert-banner error';
            alertBox.innerHTML = '⚠️ Please enter a valid email and minimum 6-character password.';
            alertBox.style.display = 'flex';
          }
        } else {
          if (alertBox) {
            alertBox.className = 'form-alert-banner success';
            alertBox.innerHTML = '✨ Account created! You can now explore Chronicles.';
            alertBox.style.display = 'flex';
          }
        }
      });
    }
  }

  function setupRegistrationForm() {
    var form = document.getElementById('registration-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var firstName = document.getElementById('reg-firstname');
      var lastName = document.getElementById('reg-lastname');
      var username = document.getElementById('reg-username');
      var email = document.getElementById('reg-email');
      var password = document.getElementById('reg-password');
      var confirmPassword = document.getElementById('reg-confirmpassword');
      var city = document.getElementById('reg-city');
      var state = document.getElementById('reg-state');
      var pincode = document.getElementById('reg-pincode');
      var terms = document.getElementById('reg-terms');
      var alertBox = document.getElementById('registration-alert');

      var errors = [];

      function checkField(el, condition, msg) {
        if (!condition) {
          el.classList.add('is-invalid');
          el.classList.remove('is-valid');
          errors.push(msg);
        } else {
          el.classList.remove('is-invalid');
          el.classList.add('is-valid');
        }
      }

      checkField(firstName, firstName.value.trim().length > 0, 'First Name is required');
      checkField(lastName, lastName.value.trim().length > 0, 'Last Name is required');
      checkField(username, username.value.trim().length >= 3, 'Username must be at least 3 characters');

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      checkField(email, emailRegex.test(email.value.trim()), 'Valid email address is required');

      checkField(password, password.value.length >= 6, 'Password must be at least 6 characters');
      checkField(confirmPassword, confirmPassword.value.length >= 6 && confirmPassword.value === password.value, 'Passwords do not match');

      checkField(city, city.value.trim().length > 0, 'City is required');
      checkField(state, state.value && state.value !== 'Choose...', 'Please select a valid state');

      var pinRegex = /^[0-9]{5,6}$/;
      checkField(pincode, pinRegex.test(pincode.value.trim()), 'Pin code must be 5 or 6 digits');
      checkField(terms, terms.checked, 'You must agree to terms and conditions');

      if (alertBox) {
        if (errors.length === 0) {
          alertBox.className = 'form-alert-banner success';
          alertBox.innerHTML = '🎉 <strong>Registration Successful!</strong> Welcome to the Chronicles community, ' +
            escapeHtml(firstName.value.trim()) + ' ' + escapeHtml(lastName.value.trim()) + ' (@' +
            escapeHtml(username.value.trim()) + ')!';
          alertBox.style.display = 'flex';
          form.reset();
          setTimeout(function() {
            var valids = form.querySelectorAll('.is-valid');
            valids.forEach(function(v) { v.classList.remove('is-valid'); });
          }, 4000);
        } else {
          alertBox.className = 'form-alert-banner error';
          alertBox.innerHTML = '⚠️ <strong>Validation Error:</strong> ' + errors[0];
          alertBox.style.display = 'flex';
        }
      }
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- App Initialization ---
  function initApp() {
    // 1. Initialize Cinematic Transitions
    if (global.TransitionController && typeof global.TransitionController.init === 'function') {
      global.TransitionController.init();
    }

    // 2. Initialize Three.js WebGL Scene
    if (global.ThreeSceneController && typeof global.ThreeSceneController.init === 'function') {
      global.ThreeSceneController.init('webgl-canvas');
    }

    // 3. Initialize 2D Parallax
    if (global.ParallaxController && typeof global.ParallaxController.init === 'function') {
      global.ParallaxController.init();
    }

    // 4. Setup SPA Router & Event Delegation
    setupNavigationDelegation();

    // 5. Setup Forms
    setupContactForm();
    setupNewsletterForm();
    setupLoginForm();
    setupRegistrationForm();

    // 6. Resolve Initial Scene from URL Hash
    var initialScene = getSceneFromHash();
    currentScene = initialScene;
    updateNavActive(initialScene);

    var allSections = document.querySelectorAll('.scene-section');
    allSections.forEach(function(sec) {
      sec.classList.remove('active');
    });
    var initialEl = document.getElementById('scene-' + initialScene);
    if (initialEl) {
      initialEl.classList.add('active');
    }
  }

  // Start on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  global.SPAApp = {
    navigateTo: navigateTo,
    getCurrentScene: function() { return currentScene; }
  };
})(typeof window !== 'undefined' ? window : this);
