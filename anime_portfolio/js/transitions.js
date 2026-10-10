/**
 * Transitions Controller - Anime Cinematic SPA
 * 4-Phase Cinematic Aperture & Speedline Shutter Transition
 * 
 * Timeline:
 * Phase 1 (t=0ms): Shutter begins closing, speedlines activate, outgoing scene fades.
 * Phase 2 (t=260ms): Full coverage; callback executes to swap DOM active classes & reset scroll.
 * Phase 3 (t=320ms): Shutter begins retracting, incoming scene reveals with smooth entrance.
 * Phase 4 (t=560ms): Transition complete, interactions unlocked.
 */
(function(global) {
  'use strict';

  var TransitionController = {
    isTransitioning: false,
    shutterEl: null,

    init: function() {
      this.shutterEl = document.getElementById('cinematic-shutter');
    },

    playTransition: function(targetSceneId, swapCallback) {
      var self = this;

      if (self.isTransitioning) {
        return Promise.resolve(false);
      }

      self.isTransitioning = true;
      var shutter = self.shutterEl || document.getElementById('cinematic-shutter');

      return new Promise(function(resolve) {
        // Find outgoing scene
        var currentActive = document.querySelector('.scene-section.active');

        // --- Phase 1: t = 0ms ---
        // Shutter activates and letterbox curtains slide in
        if (shutter) {
          shutter.classList.add('animating');
          // Trigger closed state on next tick to allow CSS transition to run
          requestAnimationFrame(function() {
            shutter.classList.add('shutter-closed');
          });
        }

        if (currentActive) {
          currentActive.classList.add('scene-exiting');
        }

        // --- Phase 2: t = 260ms ---
        // Under cover of closed shutter, swap active DOM sections
        setTimeout(function() {
          if (currentActive) {
            currentActive.classList.remove('active');
            currentActive.classList.remove('scene-exiting');
          }

          if (typeof swapCallback === 'function') {
            try {
              swapCallback();
            } catch (err) {
              console.error('Transition swap error:', err);
            }
          }

          var targetSection = document.getElementById('scene-' + targetSceneId);
          if (targetSection) {
            targetSection.classList.add('scene-entering');
            targetSection.classList.add('active');
          }

          // Reset scroll to top
          window.scrollTo(0, 0);

          // --- Phase 3: t = 320ms ---
          // Retract curtains and reveal target scene
          setTimeout(function() {
            if (shutter) {
              shutter.classList.remove('shutter-closed');
            }

            if (targetSection) {
              targetSection.classList.remove('scene-entering');
              targetSection.classList.add('scene-entered');
            }

            // --- Phase 4: t = 560ms ---
            // Cleanup and unlock
            setTimeout(function() {
              if (shutter) {
                shutter.classList.remove('animating');
              }
              if (targetSection) {
                targetSection.classList.remove('scene-entered');
              }
              self.isTransitioning = false;

              // Refresh parallax triggers if available
              if (window.ParallaxController && typeof window.ParallaxController.refresh === 'function') {
                try {
                  window.ParallaxController.refresh();
                } catch (e) {
                  console.error('Parallax refresh error:', e);
                }
              }

              resolve(true);
            }, 240); // 320ms + 240ms = 560ms

          }, 60); // 260ms + 60ms = 320ms

        }, 260); // 260ms
      });
    }
  };

  global.TransitionController = TransitionController;
})(typeof window !== 'undefined' ? window : this);
