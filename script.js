/* ============================================================
   STEEMLITE — script.js
   Vanilla JS: nav, scroll reveal, count-up, back-to-top.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Current year in footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    // Close when a link is tapped
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Sticky nav background on scroll ---------- */
  var nav = document.getElementById("nav");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", y > 40);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Back to top ---------- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Live background: parallax + marquee skew + progress ----------
     One requestAnimationFrame loop drives everything the scroll touches:
     - .bg-scene orbs/watermark words drift at their data-speed
     - marquee strips skew with scroll velocity, then ease back
     - top progress bar tracks how far down the page you are            */
  var parallaxEls = document.querySelectorAll(".bg-scene [data-speed]");
  var marquees = document.querySelectorAll(".marquee");
  var progress = document.getElementById("scrollProgress");

  if (!reduceMotion && (parallaxEls.length || marquees.length || progress)) {
    var lastY = window.pageYOffset;
    var skew = 0;

    var tick = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;

      // parallax drift
      parallaxEls.forEach(function (el) {
        var s = parseFloat(el.getAttribute("data-speed")) || 0;
        el.style.transform = "translate3d(" + (y * s) + "px," + (y * s * 0.35) + "px,0)";
      });

      // marquee skew follows scroll velocity, eased back to 0
      var vel = y - lastY;
      lastY = y;
      skew += ((Math.max(-14, Math.min(14, vel * 0.45))) - skew) * 0.12;
      if (Math.abs(skew) < 0.01) skew = 0;
      marquees.forEach(function (m) {
        m.style.transform = "skewX(" + skew.toFixed(2) + "deg)";
      });

      // progress bar
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Scroll reveal via IntersectionObserver ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach(function (el, i) {
      // subtle stagger for groups of siblings
      el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + "ms";
      io.observe(el);
    });
  }

  /* ---------- Animated count-up for stats ---------- */
  var statNums = document.querySelectorAll(".stat__num");

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }

    var duration = 1600;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && statNums.length) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach(function (el) { statIO.observe(el); });
  } else {
    statNums.forEach(function (el) {
      el.textContent = (el.getAttribute("data-target") || "") + (el.getAttribute("data-suffix") || "");
    });
  }
})();
