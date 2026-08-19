/* PerimeterAI. Progressive enhancement only: every section reads and every
   link works with this file blocked. No scroll listeners anywhere, all
   position work is done by IntersectionObserver. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mobile menu ---------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("primary-nav");

  function closeMenu() {
    if (!toggle || !links) return;
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      links.classList.toggle("open", !open);
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    });

    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (!links.classList.contains("open")) return;
      if (!links.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });

    window.matchMedia("(min-width: 901px)").addEventListener("change", function (m) {
      if (m.matches) closeMenu();
    });
  }

  /* ---------- 2. Scroll reveal --------------------------------------
     Motivation: stages each section as it enters, so the page reads in
     order instead of arriving all at once. Disabled outright under
     reduced motion, and skipped entirely without IntersectionObserver. */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add("in"); });
  } else {
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    Array.prototype.forEach.call(revealEls, function (el) { revealObs.observe(el); });
  }

  /* ---------- 3. Nav highlight (IntersectionObserver, not scroll) ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav.links a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 4. Enquiry form --------------------------------------- */
  var form = document.getElementById("enquiry");
  if (form) {
    var status = document.getElementById("fstatus");
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var rules = [
      { id: "f-name",    err: "e-name",    test: function (v) { return v.length > 1; },
        msg: "Please enter your name." },
      { id: "f-email",   err: "e-email",   test: function (v) { return EMAIL.test(v); },
        msg: "Please enter a valid email address." },
      { id: "f-message", err: "e-message", test: function (v) { return v.length > 4; },
        msg: "Tell us a little about your site or fleet." }
    ];

    function setError(rule, message) {
      var input = document.getElementById(rule.id);
      var slot = document.getElementById(rule.err);
      var field = input.closest(".field");
      slot.textContent = message;
      field.classList.toggle("bad", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("bad") && rule.test(input.value.trim())) {
          setError(rule, "");
        }
      });
    });

    function say(message, isError) {
      status.textContent = message;
      status.classList.add("show");
      status.classList.toggle("bad", Boolean(isError));
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      /* Honeypot: a real person never fills a field they cannot see. */
      if (form.website.value !== "") return;

      var firstBad = null;
      rules.forEach(function (rule) {
        var value = document.getElementById(rule.id).value.trim();
        var ok = rule.test(value);
        setError(rule, ok ? "" : rule.msg);
        if (!ok && !firstBad) firstBad = document.getElementById(rule.id);
      });

      if (firstBad) { firstBad.focus(); return; }

      var button = form.querySelector('button[type="submit"]');
      var label = button.textContent;
      button.disabled = true;
      button.textContent = "Sending";
      status.classList.remove("show");

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          say("Thanks. We will come back to you shortly.", false);
        })
        .catch(function () {
          /* Never strand an enquiry. If the endpoint is unreachable, hand
             the visitor the address so the lead is not silently lost. */
          say("That did not send. Please email info@perimeterai.com.au and we will pick it up.", true);
        })
        .then(function () {
          button.disabled = false;
          button.textContent = label;
        });
    });
  }

  /* ---------- 5. Footer year ---------------------------------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
