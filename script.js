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

  /* ---------- Shoelace: laces up the page as you scroll ----------
     Anchor points hug alternating page edges at each section boundary
     (grommet eyelets), joined by smooth curves. stroke-dashoffset draws
     the cord in sync with scroll; the aglet rides the drawn tip.      */
  var laceSvg = document.getElementById("lace");
  var lacePath = document.getElementById("laceBody");        // geometry + length reference
  var laceMaskPath = document.getElementById("laceMaskPath"); // animated reveal stroke
  var laceLayers = ["laceGlowOuter", "laceGlowInner", "laceEdge", "laceBody", "laceRibs", "laceSheen", "laceMaskPath"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var laceEyelets = document.getElementById("laceEyelets");
  var laceAglet = document.getElementById("laceAglet");
  var laceLen = 0;
  var laceSamples = null;   // Y -> length lookup, so the tip tracks the viewport
  var laceWaypoints = [];   // labelled markers that light up as the lace reaches them

  function buildLace() {
    if (!laceSvg || !lacePath) return;
    var docH = document.documentElement.scrollHeight;
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    [laceSvg, document.getElementById("laceMarkers")].forEach(function (svg) {
      if (!svg) return;
      svg.setAttribute("width", vw);
      svg.setAttribute("height", docH);
      svg.setAttribute("viewBox", "0 0 " + vw + " " + docH);
    });

    var xL = Math.max(vw * 0.06, 22);
    var xR = vw - xL;

    // anchors: every section, plus a labelled stop at each category card
    var anchors = [];
    document.querySelectorAll("main section").forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      var top = r.top + window.pageYOffset;
      anchors.push({ y: top + 46, label: sec.getAttribute("data-lace") || "", small: false });
      // tall sections without their own card stops get a plain mid-pass
      if (r.height > vh * 1.2 && !sec.querySelector(".card[data-lace]")) {
        anchors.push({ y: top + r.height * 0.6, label: "", small: false });
      }
    });
    document.querySelectorAll(".card[data-lace]").forEach(function (card) {
      var r = card.getBoundingClientRect();
      anchors.push({ y: r.top + window.pageYOffset - 12, label: card.getAttribute("data-lace"), small: true });
    });
    anchors.sort(function (a, b) { return a.y - b.y; });

    // strictly descending path so each scroll position maps to one lace point
    var pts = [{ x: -30, y: Math.max(20, vh * 0.14) }];
    var side = 1; // 1 = right edge next, -1 = left
    anchors.forEach(function (a, i) {
      a.y = Math.max(a.y, pts[pts.length - 1].y + 90);
      a.x = side > 0 ? xR : xL;
      a.eyelet = i > 0;
      pts.push(a);
      side = -side;
    });
    pts.push({ x: side > 0 ? vw + 30 : -30, y: docH - 40 });

    var d = "M " + pts[0].x + " " + pts[0].y;
    for (var i = 1; i < pts.length; i++) {
      var cy = (pts[i - 1].y + pts[i].y) / 2;
      d += " C " + pts[i - 1].x + " " + cy + " " + pts[i].x + " " + cy + " " + pts[i].x + " " + pts[i].y;
    }
    laceLayers.forEach(function (el) { el.setAttribute("d", d); });

    // ribbon width scales down a little on small screens
    var scale = vw < 700 ? 0.72 : 1;
    var widths = { laceGlowOuter: 44, laceGlowInner: 27, laceEdge: 16, laceBody: 12.5, laceRibs: 12.5, laceSheen: 3.5, laceMaskPath: 52 };
    laceLayers.forEach(function (el) {
      el.setAttribute("stroke-width", (widths[el.id] * scale).toFixed(1));
    });

    laceLen = lacePath.getTotalLength();
    // only the mask stroke animates; the woven layers keep their own textures
    laceMaskPath.style.strokeDasharray = laceLen;

    // sample the path once so any page Y maps to a length along the lace
    var N = 600, lens = new Float32Array(N + 1), ys = new Float32Array(N + 1);
    for (var s = 0; s <= N; s++) {
      var sp = lacePath.getPointAtLength(laceLen * s / N);
      lens[s] = laceLen * s / N; ys[s] = sp.y;
    }
    laceSamples = { lens: lens, ys: ys };

    // grommets + labelled waypoint markers that light up when reached
    var mk = "";
    pts.forEach(function (p) {
      if (!p.eyelet) return;
      var r = (p.small ? 9 : 13) * scale;
      var ring = '<circle class="wp-ring" cx="' + p.x + '" cy="' + p.y + '" r="' + r.toFixed(1) + '" fill="#0c1223" stroke-width="' + (3.5 * scale).toFixed(1) + '"/>';
      if (!p.label) { mk += ring; return; }
      var left = p.x < vw / 2;
      var tx = left ? p.x + r + 14 : p.x - r - 14;
      mk += '<g class="wp' + (p.small ? " wp--sm" : "") + '" data-len="' + lenAtY(p.y).toFixed(1) + '">' + ring +
        '<circle class="wp-pulse" cx="' + p.x + '" cy="' + p.y + '" r="' + (r + 9).toFixed(1) + '"/>' +
        '<text class="wp-label" x="' + tx + '" y="' + p.y + '" dominant-baseline="middle" text-anchor="' + (left ? "start" : "end") + '">' + p.label + '</text></g>';
    });
    laceEyelets.innerHTML = mk;
    laceWaypoints = [];
    laceEyelets.querySelectorAll("g.wp").forEach(function (g) {
      laceWaypoints.push({ el: g, len: parseFloat(g.getAttribute("data-len")) });
    });

    updateLace(window.pageYOffset || 0);
  }

  // map a page Y to the lace length at that height (path Y only ever descends)
  function lenAtY(ty) {
    if (!laceSamples) return 0;
    var ys = laceSamples.ys, lens = laceSamples.lens, lo = 0, hi = ys.length - 1;
    if (ty <= ys[0]) return lens[0];
    if (ty >= ys[hi]) return laceLen;
    while (hi - lo > 1) { var mid = (hi + lo) >> 1; if (ys[mid] < ty) lo = mid; else hi = mid; }
    var f = (ty - ys[lo]) / ((ys[hi] - ys[lo]) || 1);
    return lens[lo] + (lens[hi] - lens[lo]) * f;
  }

  function updateLace(y) {
    if (!laceLen || !laceSamples) return;
    var docH = document.documentElement.scrollHeight;
    var vh = window.innerHeight;
    // the tip tracks a fixed line ~80% down the viewport, so the lace moves
    // 1:1 with scrolling; snaps fully laced at the page bottom
    var drawn = (reduceMotion || y + vh >= docH - 2) ? laceLen
      : Math.max(60, lenAtY(y + vh * 0.8));
    laceMaskPath.style.strokeDashoffset = laceLen - drawn;
    var tip = lacePath.getPointAtLength(drawn);
    var back = lacePath.getPointAtLength(Math.max(0, drawn - 16));
    var ang = Math.atan2(tip.y - back.y, tip.x - back.x) * 180 / Math.PI;
    laceAglet.setAttribute("transform", "translate(" + tip.x + " " + tip.y + ") rotate(" + ang + ")");
    // light up every waypoint the lace has reached
    for (var i = 0; i < laceWaypoints.length; i++) {
      laceWaypoints[i].el.classList.toggle("is-lit", drawn >= laceWaypoints[i].len - 2);
    }
  }

  // (re)build once now, again when everything has loaded, and on layout changes
  var laceRebuildTimer;
  function queueLaceRebuild() {
    clearTimeout(laceRebuildTimer);
    laceRebuildTimer = setTimeout(buildLace, 200);
  }
  buildLace();
  window.addEventListener("load", buildLace);
  if ("ResizeObserver" in window) {
    new ResizeObserver(queueLaceRebuild).observe(document.body);
  } else {
    window.addEventListener("resize", queueLaceRebuild);
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

      // lace up the page
      updateLace(y);

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
