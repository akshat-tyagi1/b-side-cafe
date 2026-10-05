/*
  B-SIDE CAFÉ — interaction layer

  Plain JavaScript handles the crate interactions.
  GSAP + ScrollTrigger handle the animations.
*/

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const touchDevice = window.matchMedia("(hover: none)");

const hero = document.querySelector(".hero");
const heroRecord = document.querySelector(".hero-record");
const heroSleeve = document.querySelector(".hero-sleeve");
const heroSticker = document.querySelector(".now-spinning-sticker");
const noSkipsSticker = document.querySelector(".no-skips-sticker");

const cards = document.querySelectorAll(".record-card");
const nowPlaying = document.querySelector("#now-playing");
const nowPlayingTime = document.querySelector("#now-playing-time");

let stickerTween = null;
let heroIntroTimeline = null;
let heroScrollTimeline = null;
let heroIntroSafetyTimer = null;

let heroIntroCompleted = false;
let heroScrollReady = false;
let crateEntranceReady = false;

/* =========================================
   RECORD ACCENTS
   ========================================= */

const recordAccents = {
  "is-this-it": "--yellow",
  "either-or": "--teal",
  "this-old-dog": "--yellow",
  bloom: "--pink",
  "random-access-memories": "--teal",
  "4-eyez-only": "--pink",
};

/* =========================================
   HERO SCROLL
   ========================================= */

/*
  Creates the main scroll-driven hero animation.

  Important:
  This is created BEFORE the decorative intro animation.
  That prevents the intro from delaying ScrollTrigger initialization.
*/
function setupHeroScroll() {
  if (heroScrollReady) return;
  if (reducedMotion.matches) return;
  if (!hero || !heroRecord || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  heroScrollReady = true;

  /* Initial positions. */
  gsap.set(heroRecord, {
    x: -42,
    rotation: 0,
  });

  if (heroSleeve) {
    gsap.set(heroSleeve, {
      x: 0,
      rotation: -3,
    });
  }

  if (noSkipsSticker) {
    gsap.set(noSkipsSticker, {
      y: 0,
      rotation: 8,
    });
  }

  /*
    Timeline groups several animations together.

    ScrollTrigger connects the timeline's progress to scrolling.
  */
  heroScrollTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: hero,

      /* Start when the top of the hero reaches the top of the viewport. */
      start: "top top",

      /* The animation lasts for one additional viewport-sized scroll distance. */
      end: "+=100%",

      /* Keep the hero visually fixed while the animation runs. */
      pin: true,

      /* Directly connect animation progress to scroll progress. */
      scrub: true,

      /* Helps prevent a visible jump when pinning begins. */
      anticipatePin: 1,

      /*
        Recalculate function-based values whenever ScrollTrigger refreshes.
      */
      invalidateOnRefresh: true,
    },
  });

  /*
    STEP 1:
    Move the record out from behind the sleeve.
  */
  heroScrollTimeline.to(heroRecord, {
    x: 150,
    duration: 0.35,
    ease: "none",
  });

  /*
    STEP 2:
    Rotate the record twice.
    360deg = one rotation
    720deg = two rotations
  */
  heroScrollTimeline.to(heroRecord, {
    rotation: 720,
    duration: 0.65,
    ease: "none",
  });

  /*
    The sleeve moves slightly at the same time as the record.
  */
  if (heroSleeve) {
    heroScrollTimeline.to(
      heroSleeve,
      {
        x: -10,
        rotation: -5,
        duration: 1,
        ease: "none",
      },
      0,
    );
  }

  /*
    NO SKIPS moves upward through the same scroll timeline.

    The function is important because hero.offsetHeight can change
    between mobile, tablet and desktop layouts.
  */
  if (noSkipsSticker) {
    heroScrollTimeline.fromTo(
      noSkipsSticker,

      /* Starting state */
      {
        y: 0,
        rotation: 8,
      },

      /* Ending state */
      {
        y: () => -hero.offsetHeight,
        rotation: 8,
        duration: 1,
        ease: "none",
      },

      /* Start at the beginning of the timeline. */
      0,
    );
  }
}

/* =========================================
   HERO INTRO
   ========================================= */

/*
  Finishes the decorative load animation.

  This is intentionally separate from ScrollTrigger.
*/
function finishHeroIntro(force = false) {
  if (heroIntroCompleted) return;

  if (force && heroIntroTimeline) {
    heroIntroTimeline.kill();
    heroIntroTimeline = null;
  }

  if (heroIntroSafetyTimer) {
    window.clearTimeout(heroIntroSafetyTimer);
    heroIntroSafetyTimer = null;
  }

  const titleLines = document.querySelectorAll(".hero-title-line");
  const revealItems = document.querySelectorAll(".hero-reveal-item");

  /*
    Return everything to its final CSS state.
  */
  gsap.set(titleLines, {
    yPercent: 0,
    clearProps: "transform",
  });

  gsap.set(revealItems, {
    y: 0,
    opacity: 1,
    clearProps: "opacity,transform",
  });

  hero.classList.remove("intro-running");
  hero.classList.add("intro-complete");

  heroIntroCompleted = true;
}

/*
  Plays the visual intro after the scroll system already exists.
*/
function setupHeroIntro() {
  if (heroIntroCompleted) return;
  if (reducedMotion.matches) return;
  if (!window.gsap || !hero) return;

  const titleLines = document.querySelectorAll(".hero-title-line");
  const revealItems = document.querySelectorAll(".hero-reveal-item");

  if (!titleLines.length) {
    finishHeroIntro(true);
    return;
  }

  hero.classList.add("intro-running");

  heroIntroTimeline = gsap.timeline({
    onComplete: () => {
      finishHeroIntro();
    },
  });

  /*
    Headline slides upward from underneath its mask.
  */
  heroIntroTimeline.fromTo(
    titleLines,

    {
      yPercent: 100,
    },

    {
      yPercent: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "expo.out",
      clearProps: "transform",
    },
  );

  /*
    Supporting text and button fade/rise into place.
  */
  heroIntroTimeline.fromTo(
    revealItems,

    {
      y: 18,
      opacity: 0,
    },

    {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
      clearProps: "opacity,transform",
    },

    0.2,
  );

  /*
    Safety net in case something prevents the animation from completing.
  */
  heroIntroSafetyTimer = window.setTimeout(() => {
    finishHeroIntro(true);
  }, 2000);
}

/* =========================================
   NOW SPINNING STICKER
   ========================================= */

/*
  Creates the sticker's continuous rotation.
*/
function setupStickerSpin() {
  if (stickerTween) return;
  if (reducedMotion.matches) return;
  if (!heroSticker || !window.gsap || !window.ScrollTrigger) return;

  stickerTween = gsap.to(heroSticker, {
    rotation: "+=360",
    duration: 14,
    repeat: -1,
    ease: "none",
  });

  /*
    Slightly speed it up when scrolling starts.
  */
  ScrollTrigger.addEventListener("scrollStart", () => {
    if (!stickerTween) return;

    stickerTween.timeScale(1.05);
  });

  /*
    Return smoothly to normal speed after scrolling stops.
  */
  ScrollTrigger.addEventListener("scrollEnd", () => {
    if (!stickerTween) return;

    gsap.to(stickerTween, {
      timeScale: 1,
      duration: 0.35,
      ease: "power2.out",
      overwrite: true,
    });
  });
}

/* =========================================
   STICKER SCROLL VELOCITY
   ========================================= */

/*
  Makes the sticker spin faster when the user scrolls faster.
*/
function connectStickerToScrollVelocity() {
  if (reducedMotion.matches) return;
  if (!stickerTween || !hero || !window.ScrollTrigger) return;

  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "+=100%",

    onUpdate: (self) => {
      const velocity = Math.abs(self.getVelocity());

      /*
        Convert scroll velocity into a speed multiplier.

        Minimum: 1x
        Maximum: 2.5x
      */
      const targetSpeed = gsap.utils.clamp(1, 2.5, 1 + velocity / 2500);

      gsap.to(stickerTween, {
        timeScale: targetSpeed,
        duration: 0.18,
        ease: "power2.out",
        overwrite: true,
      });
    },
  });
}

/* =========================================
   CRATE ENTRANCE
   ========================================= */

function setupCrateEntrance() {
  if (crateEntranceReady) return;
  if (reducedMotion.matches) return;
  if (!cards.length || !window.gsap || !window.ScrollTrigger) return;

  crateEntranceReady = true;

  /*
    Start cards slightly lower and invisible.
  */
  gsap.set(cards, {
    y: 48,
    opacity: 0,
  });

  /*
    ScrollTrigger.batch groups cards that enter the viewport together.
  */
  ScrollTrigger.batch(cards, {
    start: "top 88%",
    once: true,

    onEnter: (batch) => {
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    },
  });
}

/* =========================================
   TIME OF DAY
   ========================================= */

function getTimeOfDay() {
  const hour = new Date().getHours();

  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  if (hour < 21) return "EVENING";

  return "NIGHT";
}

/* =========================================
   RECORD SELECTION
   ========================================= */

function selectRecord(card) {
  const recordKey = card.dataset.record;
  const title = card.dataset.title;
  const artist = card.dataset.artist;

  const accentVariable = recordAccents[recordKey] || "--yellow";

  /*
    Read the actual CSS variable value from :root.
  */
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue(accentVariable)
    .trim();

  document.documentElement.style.setProperty("--accent", accent);

  /*
    Update the Now Playing information.
  */
  nowPlaying.textContent = `${artist} — ${title}`;
  nowPlayingTime.textContent = getTimeOfDay();

  /*
    Only one record can be selected at a time.
  */
  cards.forEach((item) => {
    const selected = item === card;

    item.classList.toggle("is-selected", selected);

    item.setAttribute("aria-pressed", String(selected));
  });
}

/* =========================================
   RECORD TILT
   ========================================= */

function resetTilt(card) {
  const sleeve = card.querySelector(".sleeve");
  const glare = card.querySelector(".sleeve-glare");

  if (!sleeve) return;

  sleeve.style.setProperty("--tilt-x", "0deg");
  sleeve.style.setProperty("--tilt-y", "0deg");

  if (glare) {
    glare.style.setProperty("--glare-x", "-55px");

    glare.style.setProperty("--glare-y", "-55px");
  }
}

/*
  Calculates a small 3D tilt based on pointer position.
*/
function tiltRecord(event, card) {
  if (reducedMotion.matches) return;
  if (touchDevice.matches) return;

  const sleeve = card.querySelector(".sleeve");
  const glare = card.querySelector(".sleeve-glare");

  if (!sleeve) return;

  const rect = sleeve.getBoundingClientRect();

  /*
    Convert pointer coordinates into a range of -1 to +1.
  */
  const xRatio = ((event.clientX - rect.left) / rect.width) * 2 - 1;

  const yRatio = ((event.clientY - rect.top) / rect.height) * 2 - 1;

  /*
    Maximum tilt is 9 degrees.
  */
  const rotateY = xRatio * 9;
  const rotateX = yRatio * -9;

  /*
    JavaScript changes only the CSS variables.
    CSS combines them with the selected-card transform.
  */
  sleeve.style.setProperty("--tilt-x", `${rotateX}deg`);

  sleeve.style.setProperty("--tilt-y", `${rotateY}deg`);

  if (glare) {
    const glareX = ((xRatio + 1) / 2) * rect.width - 55;

    const glareY = ((yRatio + 1) / 2) * rect.height - 55;

    glare.style.setProperty("--glare-x", `${glareX}px`);

    glare.style.setProperty("--glare-y", `${glareY}px`);
  }
}

/* =========================================
   CARD EVENTS
   ========================================= */

function setupCardInteractions() {
  cards.forEach((card) => {
    /*
      Desktop hover tilt.
    */
    card.addEventListener("pointermove", (event) => {
      tiltRecord(event, card);
    });

    card.addEventListener("pointerleave", () => {
      resetTilt(card);
    });

    /*
      Mouse/touch selection.
    */
    card.addEventListener("click", () => {
      selectRecord(card);
    });

    /*
      Keyboard accessibility.
    */
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRecord(card);
      }
    });
  });
}

/* =========================================
   INITIALIZATION
   ========================================= */

/*
  Main initialization order:

  1. Register GSAP.
  2. Create ScrollTrigger immediately.
  3. Create sticker animation.
  4. Create crate animation.
  5. Refresh once after layout is painted.
  6. Play the decorative hero intro.

  The important change is that the intro no longer controls
  when the scroll animation is created.
*/
function init() {
  /*
    If GSAP fails to load, the site still works as a normal page.
  */
  if (!window.gsap || !window.ScrollTrigger) {
    setupCardInteractions();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  setupCardInteractions();

  /*
    Reduced-motion users get the final static state.
  */
  if (reducedMotion.matches) {
    if (noSkipsSticker) {
      gsap.set(noSkipsSticker, {
        y: 0,
        rotation: 8,
      });
    }

    return;
  }

  /*
    IMPORTANT:
    Create all scroll-based systems immediately.
  */
  setupHeroScroll();
  setupStickerSpin();
  connectStickerToScrollVelocity();
  setupCrateEntrance();

  /*
    Wait for the browser to finish the current layout/paint,
    then let ScrollTrigger measure the final positions.
  */
  window.requestAnimationFrame(() => {
    ScrollTrigger.refresh(true);

    /*
      Now that the scroll system is ready, play the visual intro.
    */
    setupHeroIntro();
  });
}

/* =========================================
   PAGE SHOW / BROWSER RESTORATION
   ========================================= */

/*
  pageshow is useful when returning to the page through browser
  back/forward navigation or the back-forward cache.

  It is NOT responsible for normal initialization anymore.
*/
window.addEventListener("pageshow", (event) => {
  if (!window.ScrollTrigger) return;
  if (reducedMotion.matches) return;

  /*
    Only perform an extra refresh for restored pages.
  */
  if (event.persisted) {
    ScrollTrigger.refresh(true);
  }
});

init();
