const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const loaderEl = document.getElementById("siteLoader");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const lowPowerDevice = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
const usePerformanceMode = prefersReducedMotion || isCoarsePointer || lowPowerDevice;

if (usePerformanceMode) {
  document.body.classList.add("is-performance-mode");
}

function revealSite() {
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-ready");

  if (!loaderEl) return;

  loaderEl.classList.add("is-hidden");
  window.setTimeout(() => {
    loaderEl.remove();
  }, 500);
}

if (document.body.classList.contains("is-loading")) {
  if (window.location.hash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  window.scrollTo(0, 0);
}

window.addEventListener("load", () => {
  const delay = prefersReducedMotion ? 180 : 850;
  window.scrollTo(0, 0);
  window.setTimeout(revealSite, delay);
});

const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
const headerEl = document.querySelector(".site-header");

function scrollToSection(targetId) {
  const target = document.querySelector(targetId);
  if (!target) return;

  const headerHeight = headerEl instanceof HTMLElement ? headerEl.offsetHeight : 0;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - 10;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || !targetId.startsWith("#")) return;

    event.preventDefault();
    scrollToSection(targetId);
    window.history.replaceState(null, "", targetId);
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".section").forEach((section) => revealObserver.observe(section));

const projectDeck = document.getElementById("projectDeck");
const cards = projectDeck ? Array.from(projectDeck.querySelectorAll(".stack-card")) : [];
const prevBtn = document.getElementById("projectPrev");
const nextBtn = document.getElementById("projectNext");
const dotsWrap = document.getElementById("projectDots");

let activeIndex = 0;
const autoSlideEnabled = prefersReducedMotion === false;
const autoSlideMs = 4800;
let autoSlideTimer = 0;

function getRelativeDistance(index, active, total) {
  const raw = index - active;
  const wrapped = ((raw + total + total / 2) % total) - total / 2;
  return Math.trunc(wrapped);
}

function getCardPosition(distance) {
  if (distance === 0) return "active";
  if (distance === -1) return "left";
  if (distance === 1) return "right";
  return distance < 0 ? "hidden-left" : "hidden-right";
}

function renderDots() {
  if (!dotsWrap) return;
  const dots = Array.from(dotsWrap.querySelectorAll(".project-dot"));
  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
    dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
  });
}

function renderCardStack() {
  const total = cards.length;
  cards.forEach((card, index) => {
    const distance = getRelativeDistance(index, activeIndex, total);
    card.setAttribute("data-pos", getCardPosition(distance));
    card.setAttribute("aria-hidden", distance === 0 ? "false" : "true");
  });
  renderDots();
}

function goToSlide(index) {
  if (cards.length < 1) return;
  const total = cards.length;
  activeIndex = ((index % total) + total) % total;
  renderCardStack();
}

function moveStack(direction = 1) {
  goToSlide(activeIndex + direction);
}

function stopAutoSlide() {
  if (!autoSlideTimer) return;
  clearInterval(autoSlideTimer);
  autoSlideTimer = 0;
}

function startAutoSlide() {
  if (!autoSlideEnabled || cards.length < 2) return;
  stopAutoSlide();
  autoSlideTimer = window.setInterval(() => moveStack(1), autoSlideMs);
}

if (cards.length > 0) {
  if (dotsWrap) {
    dotsWrap.innerHTML = cards
      .map(
        (_card, index) =>
          `<button type="button" class="project-dot" data-index="${index}" aria-label="Go to project ${index + 1}">${
            index + 1
          }</button>`
      )
      .join("");
  }

  renderCardStack();

  prevBtn?.addEventListener("click", () => moveStack(-1));
  nextBtn?.addEventListener("click", () => moveStack(1));

  dotsWrap?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const dot = target.closest(".project-dot");
    if (!(dot instanceof HTMLButtonElement)) return;
    const dotIndex = Number(dot.dataset.index);
    if (Number.isNaN(dotIndex)) return;
    goToSlide(dotIndex);
    startAutoSlide();
  });

  window.addEventListener("keydown", (event) => {
    const isTyping =
      event.target instanceof HTMLElement &&
      (event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable);

    if (isTyping) return;

    if (event.key === "ArrowRight") {
      moveStack(1);
      startAutoSlide();
    }

    if (event.key === "ArrowLeft") {
      moveStack(-1);
      startAutoSlide();
    }
  });

  projectDeck?.addEventListener("mouseenter", stopAutoSlide);
  projectDeck?.addEventListener("mouseleave", startAutoSlide);
  projectDeck?.addEventListener("focusin", stopAutoSlide);
  projectDeck?.addEventListener("focusout", startAutoSlide);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoSlide();
      return;
    }
    startAutoSlide();
  });

  startAutoSlide();
}

const heroCard = document.querySelector(".hero-media");

if (heroCard instanceof HTMLElement && prefersReducedMotion === false && isCoarsePointer === false) {
  const heroImage = heroCard.querySelector("img");
  let dragging = false;
  let startY = 0;
  let startX = 0;
  let lastY = 0;
  let lastTime = 0;
  let springAnim = 0;
  let velocity = 0;
  let tiltX = 0;
  let tiltY = 0;
  let pull = 0;

  const applyCardState = () => {
    heroCard.style.setProperty("--id-tilt-x", `${tiltX}deg`);
    heroCard.style.setProperty("--id-tilt-y", `${tiltY}deg`);
    heroCard.style.setProperty("--id-pull", `${pull}px`);
  };

  heroCard.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (springAnim) {
      cancelAnimationFrame(springAnim);
      springAnim = 0;
    }
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    lastY = event.clientY;
    lastTime = performance.now();
    velocity = 0;
    heroCard.classList.add("is-dragging");
    heroCard.setPointerCapture(event.pointerId);
  });

  heroCard.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    const dyFrame = event.clientY - lastY;

    tiltY = Math.max(-16, Math.min(16, dx * 0.1));
    tiltX = Math.max(-11, Math.min(11, -dy * 0.06));
    pull = Math.max(-14, Math.min(62, dy * 0.24));
    velocity = (dyFrame / dt) * 14;

    lastY = event.clientY;
    lastTime = now;
    applyCardState();
  });

  const startSpring = () => {
    const stiffness = 0.09;
    const damping = 0.84;
    velocity += Math.min(0, -Math.abs(pull) * 0.18 - 2.4);

    const step = () => {
      const acceleration = -stiffness * pull;
      velocity += acceleration;
      velocity *= damping;
      pull += velocity;

      tiltX *= 0.9;
      tiltY *= 0.9;
      applyCardState();

      if (Math.abs(pull) < 0.12 && Math.abs(velocity) < 0.12) {
        pull = 0;
        tiltX = 0;
        tiltY = 0;
        applyCardState();
        springAnim = 0;
        return;
      }

      springAnim = requestAnimationFrame(step);
    };

    springAnim = requestAnimationFrame(step);
  };

  const releaseCard = () => {
    dragging = false;
    heroCard.classList.remove("is-dragging");
    startSpring();
  };

  heroCard.addEventListener("pointerup", releaseCard);
  heroCard.addEventListener("pointercancel", releaseCard);
  heroCard.addEventListener("pointerleave", () => {
    if (dragging) {
      releaseCard();
    }
  });

  heroImage?.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
}
