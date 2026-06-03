document.documentElement.classList.add("js");

const interactiveCards = document.querySelectorAll(".interactive-card");
const interactiveLinks = document.querySelectorAll("a, button");
const themeToggle = document.querySelector(".theme-toggle");
const themeToggleLabel = document.querySelector(".theme-toggle-label");
const dotCanvas = document.querySelector(".dot-canvas");
const typewriterElement = document.querySelector(".typewriter");
const typewriterShell = document.querySelector(".typewriter-shell");
const typewriterSizer = document.querySelector(".typewriter-sizer");
const typewriterCaret = document.querySelector(".typewriter-caret");
const isFinePointer = window.matchMedia("(pointer: fine)").matches;
const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Theme ──
const savedTheme = localStorage.getItem("isha-theme");
const initialTheme = savedTheme === "dark" ? "dark" : "light";

let pointerTargetX = window.innerWidth / 2;
let pointerTargetY = window.innerHeight / 2;
let pointerCurrentX = pointerTargetX;
let pointerCurrentY = pointerTargetY;
let pointerVelocityX = 0;
let pointerVelocityY = 0;

const setTheme = (theme) => {
  document.body.classList.toggle("theme-dark", theme === "dark");
  if (themeToggle) themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  if (themeToggleLabel) themeToggleLabel.textContent = theme === "dark" ? "Dark" : "Light";
  localStorage.setItem("isha-theme", theme);
};

setTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    setTheme(next);
  });
}

// ── Scroll state ──
const syncScrollState = () => {
  document.body.classList.toggle("is-scrolled", window.scrollY > 60);
};
syncScrollState();
window.addEventListener("scroll", syncScrollState, { passive: true });

// ── Typewriter ──
if (typewriterElement) {
  const phrases = [
    "builds things that ship",
    "finds the signal in the noise",
    "makes the data prove it",
    "turns messy problems into clean systems",
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let activeChars = [];

  const buildPhraseFragment = (phrase, { revealChars = false } = {}) => {
    const fragment = document.createDocumentFragment();
    const chars = [];
    const words = phrase.split(" ");

    words.forEach((word, wi) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "type-word";
      for (const ch of word) {
        const span = document.createElement("span");
        span.className = "type-char";
        span.textContent = ch;
        if (revealChars) chars.push(span);
        else span.classList.add("is-visible");
        wordSpan.appendChild(span);
      }
      fragment.appendChild(wordSpan);
      if (wi < words.length - 1) fragment.appendChild(document.createTextNode(" "));
    });

    return { fragment, chars };
  };

  const renderPhrase = (phrase) => {
    const { fragment, chars } = buildPhraseFragment(phrase, { revealChars: true });
    activeChars = chars;
    typewriterElement.replaceChildren(fragment);
  };

  const paintPhrase = () => {
    activeChars.forEach((span, i) => span.classList.toggle("is-visible", i < charIndex));

    if (!typewriterCaret || !typewriterElement) return;

    const anchor = charIndex > 0
      ? activeChars[Math.max(charIndex - 1, 0)]
      : typewriterElement.querySelector(".type-word");

    if (!(anchor instanceof HTMLElement)) return;

    const ar = anchor.getBoundingClientRect();
    const pr = typewriterElement.getBoundingClientRect();
    typewriterCaret.style.transform = `translate3d(${ar.right - pr.left + 2}px, ${ar.top - pr.top + ar.height * 0.08}px, 0)`;
    typewriterCaret.style.height = `${ar.height * 0.82}px`;
  };

  const tick = () => {
    const phrase = phrases[phraseIndex];
    isDeleting ? charIndex-- : charIndex++;
    paintPhrase();

    let delay = isDeleting ? 34 : 58;

    if (!isDeleting && charIndex === phrase.length) {
      delay = 1600;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      renderPhrase(phrases[phraseIndex]);
      delay = 300;
    }

    setTimeout(tick, delay);
  };

  if (typewriterSizer) {
    const longest = phrases.reduce((a, b) => b.length > a.length ? b : a);
    const { fragment } = buildPhraseFragment(longest);
    typewriterSizer.replaceChildren(fragment);
  }

  renderPhrase(phrases[phraseIndex]);
  paintPhrase();
  setTimeout(tick, 500);

  const lockShell = () => {
    if (!typewriterShell || !typewriterSizer) return;
    typewriterShell.style.height = `${Math.ceil(typewriterSizer.getBoundingClientRect().height)}px`;
  };
  lockShell();
  window.addEventListener("resize", lockShell);
  window.addEventListener("load", lockShell);
}

// ── Interactive cards (expand/collapse) ──
interactiveCards.forEach((card) => {
  const toggle = () => {
    card.classList.toggle("is-expanded");
    // Always snap back to neutral — prevents magnetic drift staying after click
    if (typeof gsap !== "undefined") {
      gsap.to(card, { x: 0, y: 0, duration: 0.35, ease: "power2.out" });
    }
  };

  card.addEventListener("click", (e) => {
    if (e.target instanceof HTMLAnchorElement) return;
    toggle();
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  card.addEventListener("mouseenter", () => document.body.classList.add("is-hovering-card"));
  card.addEventListener("mouseleave", () => document.body.classList.remove("is-hovering-card"));
});

interactiveLinks.forEach((el) => {
  el.addEventListener("mouseenter", () => document.body.classList.add("is-hovering-link"));
  el.addEventListener("mouseleave", () => document.body.classList.remove("is-hovering-link"));
});

// ── Custom cursor & pointer sync ──
const syncPointerVars = (x, y) => {
  document.documentElement.style.setProperty("--mouse-x-px", `${x}px`);
  document.documentElement.style.setProperty("--mouse-y-px", `${y}px`);
  document.documentElement.style.setProperty("--mouse-x", `${x}px`);
  document.documentElement.style.setProperty("--mouse-y", `${y}px`);
};

if (isFinePointer) {
  const animatePointer = () => {
    pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.3;
    pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.3;
    pointerVelocityX *= 0.7;
    pointerVelocityY *= 0.7;
    syncPointerVars(pointerCurrentX, pointerCurrentY);
    requestAnimationFrame(animatePointer);
  };

  window.addEventListener("pointermove", (e) => {
    pointerVelocityX = e.clientX - pointerTargetX;
    pointerVelocityY = e.clientY - pointerTargetY;
    pointerTargetX = e.clientX;
    pointerTargetY = e.clientY;
  });

  syncPointerVars(pointerCurrentX, pointerCurrentY);
  requestAnimationFrame(animatePointer);
}

// ── Dot canvas ──
if (dotCanvas && isFinePointer && !isReducedMotion) {
  const ctx = dotCanvas.getContext("2d");
  const dots = [];
  const spacing = 36;
  const influenceR = 120;
  const flowR = 160;

  const getColors = () => {
    const s = getComputedStyle(document.body);
    return {
      idle: s.getPropertyValue("--dot-idle").trim(),
      active: s.getPropertyValue("--dot-active").trim(),
      secondary: s.getPropertyValue("--dot-secondary").trim(),
    };
  };

  const rebuild = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const r = window.devicePixelRatio || 1;
    dotCanvas.width = Math.floor(w * r);
    dotCanvas.height = Math.floor(h * r);
    dotCanvas.style.width = `${w}px`;
    dotCanvas.style.height = `${h}px`;
    ctx.setTransform(r, 0, 0, r, 0, 0);
    dots.length = 0;
    for (let y = spacing / 2; y < h; y += spacing)
      for (let x = spacing / 2; x < w; x += spacing)
        dots.push({ homeX: x, homeY: y, x, y, vx: 0, vy: 0, active: 0, ripple: 0 });
  };

  const render = () => {
    const { idle, active, secondary } = getColors();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    dots.forEach((d) => {
      const dx = d.homeX - pointerCurrentX, dy = d.homeY - pointerCurrentY;
      const dist = Math.hypot(dx, dy);
      const inf = Math.max(0, 1 - dist / influenceR);
      const flow = Math.max(0, 1 - dist / flowR);

      if (flow > 0) {
        d.vx += pointerVelocityX * flow * 0.024;
        d.vy += pointerVelocityY * flow * 0.024;
      }

      d.vx += (d.homeX - d.x) * 0.016;
      d.vy += (d.homeY - d.y) * 0.016;
      d.vx *= 0.82;
      d.vy *= 0.82;
      d.x += d.vx;
      d.y += d.vy;
      d.active += (inf - d.active) * 0.14;
      d.ripple += ((flow * Math.min(Math.hypot(pointerVelocityX, pointerVelocityY), 26) / 26) - d.ripple) * 0.1;

      const size = 0.8 + d.active * 3.8 + d.ripple * 1.1;

      ctx.beginPath();
      ctx.fillStyle = d.active > 0.1 ? active : idle;
      ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
      ctx.fill();

      if (d.active > 0.3) {
        ctx.beginPath();
        ctx.fillStyle = secondary;
        ctx.arc(d.x, d.y, size * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    requestAnimationFrame(render);
  };

  rebuild();
  window.addEventListener("resize", rebuild);
  requestAnimationFrame(render);
}

// ── GSAP animations ──
if (typeof gsap !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // Horizontal scroll — Research section
  const trackWrapper = document.querySelector(".horizontal-scroll-wrapper");
  const track = document.querySelector(".horizontal-track");
  if (track && trackWrapper) {
    gsap.to(track, {
      x: () => -(track.scrollWidth - trackWrapper.offsetWidth + 40),
      ease: "none",
      scrollTrigger: {
        trigger: trackWrapper,
        start: "center center",
        end: () => `+=${track.scrollWidth}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  // Heading parallax
  gsap.utils.toArray(".gsap-heading").forEach((el) => {
    gsap.to(el, {
      y: 36,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  });

  // Cards fade up
  gsap.utils.toArray(".gsap-fade-up").forEach((el) => {
    gsap.from(el, {
      y: 80,
      rotationX: 6,
      scale: 0.96,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 96%",
        toggleActions: "play none none reverse",
      },
    });
  });

  // Magnetic hover on magnetic elements
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * 0.12,
        y: (e.clientY - r.top - r.height / 2) * 0.12,
        duration: 0.4,
        ease: "power2.out",
      });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.35)" });
    });
  });
}
