/**
 * Parallax Engine - Anime Cinematic SPA
 * Dual-Engine 2D Multi-Layer Depth Scrolling (GSAP ScrollTrigger + Vanilla JS RAF Fallback)
 * 
 * Layer Multipliers:
 * - Layer 0 (Sky / Atmosphere): 0.1x
 * - Layer 1 (Far Clouds): 0.3x
 * - Layer 2 (Anime Banners): 0.55x
 * - Layer 3 (Foreground Clouds): 0.8x
 * - Layer 4 (Foreground Content): 1.0x (natural scroll)
 * - Layer 5 (Sakura Petals): -0.4x (reverse parallax)
 */
(function(global) {
  'use strict';

  var ParallaxController = {
    isGsapAvailable: false,
    triggers: [],
    rafId: null,
    layers: {},

    init: function() {
      var self = this;
      self.cacheLayers();

      // Check for GSAP and ScrollTrigger availability
      if (global.gsap && global.ScrollTrigger) {
        try {
          global.gsap.registerPlugin(global.ScrollTrigger);
          self.initGsapParallax();
          self.isGsapAvailable = true;
        } catch (e) {
          self.initVanillaParallax();
        }
      } else {
        self.initVanillaParallax();
      }

      // Hero mouse movement tilt effect
      self.initMouseParallax();

      // Ensure manual scroll restoration to prevent inconsistent initial offsets
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    },

    cacheLayers: function() {
      this.layers = {
        sky: document.querySelector('.layer-sky'),
        cloudFar: document.querySelector('.layer-cloud-far'),
        banner: document.querySelector('.layer-banner'),
        cloudNear: document.querySelector('.layer-cloud-near'),
        petals: document.querySelector('.layer-petals')
      };
    },

    initGsapParallax: function() {
      var self = this;
      var gsap = global.gsap;
      var ScrollTrigger = global.ScrollTrigger;

      var heroWrapper = document.querySelector('.parallax-hero-wrapper');
      if (!heroWrapper) return;

      function updateLayer(layer, y) {
        if (!layer) return;
        if (gsap && typeof gsap.set === 'function') {
          try {
            gsap.set(layer, { y: y, force3D: true });
            return;
          } catch (e) {
            // Fall back to style transform if gsap.set throws
          }
        }
        if (layer.style) {
          layer.style.transform = 'translate3d(0, ' + y + 'px, 0)';
        }
      }

      // Layer 0: Sky (0.1x)
      if (self.layers.sky) {
        ScrollTrigger.create({
          trigger: heroWrapper,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: function(st) {
            var y = st.progress * 80; // 0.1x depth
            updateLayer(self.layers.sky, y);
          }
        });
      }

      // Layer 1: Far Clouds (0.3x)
      if (self.layers.cloudFar) {
        ScrollTrigger.create({
          trigger: heroWrapper,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: function(st) {
            var y = st.progress * 180; // 0.3x depth
            updateLayer(self.layers.cloudFar, y);
          }
        });
      }

      // Layer 2: Anime Banners (0.55x)
      if (self.layers.banner) {
        ScrollTrigger.create({
          trigger: heroWrapper,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: function(st) {
            var y = st.progress * 260; // 0.55x depth
            updateLayer(self.layers.banner, y);
          }
        });
      }

      // Layer 3: Foreground Clouds (0.8x)
      if (self.layers.cloudNear) {
        ScrollTrigger.create({
          trigger: heroWrapper,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: function(st) {
            var y = st.progress * 380; // 0.8x depth
            updateLayer(self.layers.cloudNear, y);
          }
        });
      }

      // Layer 5: Sakura Petals (-0.4x reverse parallax)
      if (self.layers.petals) {
        ScrollTrigger.create({
          trigger: heroWrapper,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: function(st) {
            var y = -st.progress * 220; // -0.4x reverse
            updateLayer(self.layers.petals, y);
          }
        });
      }
    },

    initVanillaParallax: function() {
      var self = this;

      function onScroll() {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

        if (self.layers.sky) {
          self.layers.sky.style.transform = 'translate3d(0, ' + (scrollY * 0.1) + 'px, 0)';
        }
        if (self.layers.cloudFar) {
          self.layers.cloudFar.style.transform = 'translate3d(0, ' + (scrollY * 0.3) + 'px, 0)';
        }
        if (self.layers.banner) {
          self.layers.banner.style.transform = 'translate3d(0, ' + (scrollY * 0.55) + 'px, 0)';
        }
        if (self.layers.cloudNear) {
          self.layers.cloudNear.style.transform = 'translate3d(0, ' + (scrollY * 0.8) + 'px, 0)';
        }
        if (self.layers.petals) {
          self.layers.petals.style.transform = 'translate3d(0, ' + (-scrollY * 0.4) + 'px, 0)';
        }
      }

      window.addEventListener('scroll', function() {
        if (self.rafId) cancelAnimationFrame(self.rafId);
        self.rafId = requestAnimationFrame(onScroll);
      }, { passive: true });

      // Run initially
      onScroll();
    },

    initMouseParallax: function() {
      var self = this;
      var hero = document.querySelector('.parallax-hero-wrapper');
      if (!hero) return;

      var currentX = 0, currentY = 0;
      var targetX = 0, targetY = 0;

      hero.addEventListener('mousemove', function(e) {
        var rect = hero.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = x * 20; // +/- 10px tilt
        targetY = y * 15;
      });

      hero.addEventListener('mouseleave', function() {
        targetX = 0;
        targetY = 0;
      });

      function updateMouseTilt() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        var farClouds = self.layers.cloudFar || document.querySelector('.layer-cloud-far');
        var nearClouds = self.layers.cloudNear || document.querySelector('.layer-cloud-near');

        if (farClouds) {
          farClouds.style.marginLeft = (currentX * 0.5) + 'px';
        }
        if (nearClouds) {
          nearClouds.style.marginLeft = (-currentX * 1.2) + 'px';
        }

        requestAnimationFrame(updateMouseTilt);
      }

      requestAnimationFrame(updateMouseTilt);
    },

    refresh: function() {
      this.cacheLayers();
      if (global.ScrollTrigger && typeof global.ScrollTrigger.refresh === 'function') {
        try {
          global.ScrollTrigger.refresh();
        } catch (e) {
          // Safeguard against ScrollTrigger refresh errors
        }
      }
    }
  };

  global.ParallaxController = ParallaxController;
})(typeof window !== 'undefined' ? window : this);
