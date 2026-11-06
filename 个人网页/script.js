(() => {
  "use strict";

  /* =========================================
     1. HOME PAGE — INTERACTIVE CIRCLE ANIMATION
  ========================================= */

  const hero = document.getElementById("home");
  const canvas = document.getElementById("morphCanvas");

  if (hero && canvas) {
    const ctx = canvas.getContext("2d");

    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d", {
      willReadFrequently: true
    });

    const SETTINGS = {
      size: 0.135,
      dwellTime: 2000,
      transitionTime: 450,
      holdTime: 950,
      floatSpeedX: 0.00027,
      floatSpeedY: 0.00021,
      morphSpeed: 0.16,
      convergeSpeed: 0.14,
      floatingOpacity: 0.80,
      mergedOpacity: 1,
      opacitySpeed: 0.08,
      blur: 6,
      threshold: 85
    };

    let width = 1;
    let height = 1;

    let pointerInside = false;
    let collapsed = false;

    let lastMovementTime = performance.now();
    let animationStart = performance.now();
    let currentOpacity = SETTINGS.floatingOpacity;

    const mouse = { x: 0, y: 0 };
    const particles = [];

    const FORMATIONS = [
      [
        [-0.90, -0.68, 0.38],
        [-0.48, -0.35, 0.38],
        [0, 0, 0.38],
        [0.48, 0.35, 0.38],
        [0.90, 0.68, 0.38]
      ],
      [
        [0, 0, 0.38],
        [-0.47, -0.43, 0.38],
        [0.47, -0.43, 0.38],
        [-0.47, 0.43, 0.38],
        [0.47, 0.43, 0.38]
      ],
      [
        [-1.02, 0.02, 0.38],
        [-0.51, -0.18, 0.38],
        [0, 0.10, 0.38],
        [0.51, -0.18, 0.38],
        [1.02, 0.02, 0.38]
      ],
      [
        [0, -0.75, 0.38],
        [0.71, -0.23, 0.38],
        [0.44, 0.61, 0.38],
        [-0.44, 0.61, 0.38],
        [-0.71, -0.23, 0.38]
      ],
      [
        [-0.75, -0.55, 0.38],
        [-0.18, -0.62, 0.38],
        [0.28, -0.06, 0.38],
        [-0.15, 0.51, 0.38],
        [0.72, 0.60, 0.38]
      ],
      [
        [-0.42, -0.30, 0.38],
        [0.38, -0.38, 0.38],
        [0, 0.05, 0.38],
        [-0.35, 0.43, 0.38],
        [0.45, 0.39, 0.38]
      ],
      [
        [-0.12, -1, 0.38],
        [0.21, -0.51, 0.38],
        [-0.15, 0, 0.38],
        [0.21, 0.51, 0.38],
        [-0.12, 1, 0.38]
      ],
      [
        [-0.88, -0.56, 0.38],
        [0.02, -0.78, 0.38],
        [0.75, -0.19, 0.38],
        [-0.48, 0.57, 0.38],
        [0.57, 0.70, 0.38]
      ]
    ];

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function smoothstep(t) {
      t = clamp(t, 0, 1);
      return t * t * (3 - 2 * t);
    }

    function getScale() {
      return Math.min(width, height) * SETTINGS.size;
    }

    function getCircleRadius() {
      return getScale() * 0.38;
    }

    /* RESIZE CANVAS */

    function resize() {
      const rect = hero.getBoundingClientRect();

      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.5
      );

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buffer.width = Math.max(
        1,
        Math.round(width * 0.4)
      );

      buffer.height = Math.max(
        1,
        Math.round(height * 0.4)
      );

      if (particles.length === 0) {
        const centerX = width * 0.65;
        const centerY = height * 0.48;
        const scale = getScale();

        FORMATIONS[0].forEach(point => {
          particles.push({
            x: centerX + point[0] * scale,
            y: centerY + point[1] * scale,
            r: getCircleRadius(),
            tx: centerX,
            ty: centerY,
            tr: getCircleRadius()
          });
        });

        mouse.x = centerX;
        mouse.y = centerY;
      }
    }

    /* CIRCLE FORMATION */

    function getFormation(now) {
      const cycle =
        SETTINGS.transitionTime + SETTINGS.holdTime;

      const elapsed = Math.max(
        0,
        now - animationStart
      );

      const index = Math.floor(elapsed / cycle);
      const phase = elapsed % cycle;

      const previous =
        FORMATIONS[index % FORMATIONS.length];

      const next =
        FORMATIONS[(index + 1) % FORMATIONS.length];

      const blend = smoothstep(
        phase / SETTINGS.transitionTime
      );

      return previous.map((point, i) => {
        const target = next[i];

        return [
          lerp(point[0], target[0], blend),
          lerp(point[1], target[1], blend),
          lerp(point[2], target[2], blend)
        ];
      });
    }

    /* AUTONOMOUS MOVEMENT */

    function getFloatingCenter(now) {
      const t = now - animationStart;

      const marginX = Math.min(width * 0.19, 155);
      const marginY = Math.min(height * 0.20, 130);

      const x =
        width * 0.5 +
        Math.sin(t * SETTINGS.floatSpeedX) *
          width * 0.25 +
        Math.sin(t * 0.00013 + 1.5) *
          width * 0.10;

      const y =
        height * 0.5 +
        Math.cos(t * SETTINGS.floatSpeedY) *
          height * 0.22 +
        Math.sin(t * 0.00031) *
          height * 0.08;

      return {
        x: clamp(x, marginX, width - marginX),
        y: clamp(y, marginY, height - marginY)
      };
    }

    /* UPDATE TARGETS */

    function updateTargets(now) {
      const scale = getScale();

      if (collapsed) {
        particles.forEach(p => {
          p.tx = mouse.x;
          p.ty = mouse.y;
          p.tr = getCircleRadius();
        });

        return;
      }

      const formation = getFormation(now);
      const center = getFloatingCenter(now);

      particles.forEach((p, i) => {
        const point = formation[i];

        p.tx = center.x + point[0] * scale;
        p.ty = center.y + point[1] * scale;
        p.tr = point[2] * scale;
      });
    }

    /* MOUSE INTERACTION */

    function updateMousePosition(event) {
      const rect = hero.getBoundingClientRect();

      mouse.x = clamp(
        event.clientX - rect.left,
        0,
        width
      );

      mouse.y = clamp(
        event.clientY - rect.top,
        0,
        height
      );
    }

    function handlePointerMove(event) {
      updateMousePosition(event);

      lastMovementTime = performance.now();

      if (collapsed) {
        collapsed = false;
        animationStart = performance.now();
      }
    }

    hero.addEventListener("pointerenter", event => {
      pointerInside = true;
      collapsed = false;

      updateMousePosition(event);
      lastMovementTime = performance.now();
    });

    hero.addEventListener(
      "pointermove",
      handlePointerMove
    );

    hero.addEventListener("pointerleave", () => {
      pointerInside = false;
      collapsed = false;
    });

    /* OPACITY */

    function updateOpacity() {
      const target = collapsed
        ? SETTINGS.mergedOpacity
        : SETTINGS.floatingOpacity;

      currentOpacity = lerp(
        currentOpacity,
        target,
        SETTINGS.opacitySpeed
      );

      canvas.style.opacity =
        currentOpacity.toFixed(3);
    }

    /* DRAW FIVE CIRCLES */

    function drawMetaballs() {
      const bw = buffer.width;
      const bh = buffer.height;

      const sx = bw / width;
      const sy = bh / height;

      bctx.clearRect(0, 0, bw, bh);
      bctx.fillStyle = "#ffffff";
      bctx.filter = `blur(${SETTINGS.blur}px)`;

      const speed = collapsed
        ? SETTINGS.convergeSpeed
        : SETTINGS.morphSpeed;

      particles.forEach(p => {
        p.x = lerp(p.x, p.tx, speed);
        p.y = lerp(p.y, p.ty, speed);
        p.r = lerp(p.r, p.tr, speed);

        bctx.beginPath();

        bctx.arc(
          p.x * sx,
          p.y * sy,
          p.r * sx,
          0,
          Math.PI * 2
        );

        bctx.fill();
      });

      bctx.filter = "none";

      const image = bctx.getImageData(
        0, 0, bw, bh
      );

      const pixels = image.data;

      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];

        pixels[i] = 223;
        pixels[i + 1] = 255;
        pixels[i + 2] = 0;

        pixels[i + 3] = clamp(
          (alpha - SETTINGS.threshold) * 3,
          0,
          255
        );
      }

      bctx.putImageData(image, 0, 0);

      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;

      ctx.drawImage(
        buffer,
        0,
        0,
        width,
        height
      );
    }

    /* ANIMATION LOOP */

    function frame(now) {
      if (
        pointerInside &&
        !collapsed &&
        now - lastMovementTime >= SETTINGS.dwellTime
      ) {
        collapsed = true;
      }

      updateTargets(now);
      updateOpacity();
      drawMetaballs();

      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);

    resize();

    canvas.style.opacity =
      String(SETTINGS.floatingOpacity);

    requestAnimationFrame(frame);
  }

  /* =========================================
     2. NAVIGATION ACTIVE STATE
  ========================================= */

  const navLinks = [
    ...document.querySelectorAll(
      ".site-header nav a"
    )
  ];

  const sections = [
    "home",
    "about",
    "portfolio"
  ]
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function updateNavigation() {
    const header =
      document.querySelector(".site-header");

    const offset = header
      ? header.offsetHeight + 20
      : 20;

    let current = "home";

    sections.forEach(section => {
      if (
        section.getBoundingClientRect().top <= offset
      ) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      const active =
        link.dataset.nav === current;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener(
    "scroll",
    updateNavigation,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    updateNavigation
  );

  updateNavigation();

  /* =========================================
     3. PROJECT DETAILS
  ========================================= */

  const details = {
    racing: {
      tag: "01 / VR · VISUAL ATTENTION",

      title: "Beat the Clock",

      content: `
        <header class="project-detail-header">
          <p class="section-kicker">
            01 / VR · VISUAL ATTENTION
          </p>

          <h1>
            Beat the Clock<span style="color:var(--acid)">.</span>
          </h1>

          <p class="project-detail-intro">
            An interactive VR experience exploring how
            time pressure can narrow visual attention,
            and how visual feedback might help people
            notice events around them.
          </p>
        </header>

        <div class="project-meta-grid">
          <div class="project-meta-item">
            <span>Project type</span>
            <strong>Research-led VR prototype</strong>
          </div>

          <div class="project-meta-item">
            <span>Core theme</span>
            <strong>Time pressure &amp; attention</strong>
          </div>

          <div class="project-meta-item">
            <span>Design approach</span>
            <strong>Visual feedback</strong>
          </div>

          <div class="project-meta-item">
            <span>Tools</span>
            <strong>Unity · VR prototyping</strong>
          </div>
        </div>

        <section class="project-detail-section">
          <p class="detail-kicker">
            01 / PROJECT OVERVIEW
          </p>

          <h2>
            What do we miss when we are in a hurry?
          </h2>

          <p>
            The player must reach an important interview
            before time runs out. Along the route, people
            who may need help appear in the environment.
            The project explores whether interactive
            visual feedback can make these events more
            noticeable without removing the player's
            freedom to decide what to do.
          </p>
        </section>

        <section class="project-detail-section">
          <p class="detail-kicker">
            02 / STORYBOARD
          </p>

          <h2>From urgency to awareness</h2>

          <p>
            The storyboard presents six moments: the
            interview deadline, goal-focused movement,
            a person in need appearing, the person
            regaining colour when noticed, the player's
            decision to help, and the journey continuing
            towards the interview.
          </p>

          <figure class="storyboard-frame">
            <img
              src="assets/beat-the-clock-storyboard.png"
              alt="Six-panel storyboard for Beat the Clock, showing the interview deadline, movement through the city, noticing a person in need, visual colour feedback, choosing to help, and continuing to the interview."
              loading="lazy"
            >
          </figure>

          <div class="storyboard-caption">
            <span>STORYBOARD / SIX KEY MOMENTS</span>
            <span>CONCEPT DEVELOPMENT</span>
          </div>
        </section>

        <section class="project-detail-section">
          <p class="detail-kicker">
            03 / INTERACTION DESIGN
          </p>

          <h2>How the experience works</h2>

          <div class="interaction-flow">
            <article class="interaction-step">
              <span class="step-number">STEP 01</span>
              <h3>Time pressure</h3>
              <p>
                A countdown and a clear destination
                establish the player's immediate goal.
              </p>
            </article>

            <article class="interaction-step">
              <span class="step-number">STEP 02</span>
              <h3>Notice an event</h3>
              <p>
                A person who may need assistance appears
                along the player's route.
              </p>
            </article>

            <article class="interaction-step">
              <span class="step-number">STEP 03</span>
              <h3>Visual feedback</h3>
              <p>
                When the player looks towards the
                character, colour gradually returns.
              </p>
            </article>

            <article class="interaction-step">
              <span class="step-number">STEP 04</span>
              <h3>Choose to act</h3>
              <p>
                The player decides whether to help
                or continue towards the interview.
              </p>
            </article>
          </div>
        </section>

        <section class="project-detail-section">
          <p class="detail-kicker">
            04 / VISUAL SYSTEM
          </p>

          <h2>Attention becomes visible</h2>

          <div class="detail-two-column">
            <div class="detail-panel">
              <h3>Black and white → colour</h3>
              <p>
                The desaturated environment establishes
                the initial visual language. A noticed
                character gradually regains colour,
                making the attentional shift visible.
              </p>
            </div>

            <div class="detail-panel">
              <h3>Character → environment</h3>
              <p>
                After a helping interaction is completed,
                colour can return to the surrounding
                area, visually connecting the player's
                action with a change in the environment.
              </p>
            </div>
          </div>
        </section>

        <section class="project-detail-section">
          <p class="detail-kicker">
            05 / RESEARCH FOCUS
          </p>

          <h2>Noticing comes before helping</h2>

          <p>
            The project distinguishes noticing an event
            from deciding to help. It explores whether
            time pressure limits the events a player
            notices, and whether visual feedback can
            encourage attention beyond the immediate goal.
          </p>
        </section>

        <section class="project-detail-section">
          <p class="detail-kicker">
            06 / PROCESS &amp; REFLECTION
          </p>

          <h2>Designing for a real experience</h2>

          <p>
            Eye-tracking calibration and hardware
            reliability presented practical constraints
            during development. The interaction was
            adapted to use a centre-screen gaze point,
            making the prototype easier to operate but
            reducing the precision of natural eye-gaze
            measurement.
          </p>

          <p class="project-detail-endnote">
            The prototype provides a basis for further
            investigation. Additional user testing would
            be needed to establish whether the visual
            feedback changes attention or helping decisions.
          </p>
        </section>
      `
    },

    gaze: {
      tag: "02 / UNITY · EYE TRACKING",
      title: "Attention Prototype",
      description:
        "A desktop first-person prototype exploring gaze-related interaction through time to first fixation, fixation count and total fixation duration."
    },

    design: {
      tag: "03 / PRODUCT DESIGN",
      title: "Selected Product Design",
      description:
        "A selection of undergraduate product design and cultural-creative design projects."
    },

    media: {
      tag: "04 / CREATIVE TECHNOLOGY",
      title: "Interactive Experiments",
      description:
        "Experiments in real-time media, interaction and creative coding, including projects connecting digital systems across screens."
    }
  };

  /* =========================================
     4. OPEN PROJECTS — EVENT DELEGATION
  ========================================= */

  const dialog =
    document.getElementById("projectDialog");

  const dialogContent =
    document.getElementById("dialogContent");

  /*
   * Listen on the document rather than individual
   * cards, so the click handler continues to work
   * even if card contents change.
   */

  document.addEventListener("click", event => {
    const card = event.target.closest(".project-card");

    if (!card) return;

    event.preventDefault();

    if (!dialog || !dialogContent) {
      console.error(
        "Cannot open project: #projectDialog or #dialogContent is missing."
      );
      return;
    }

    const projectId = card.dataset.project;
    const detail = details[projectId];

    if (!detail) {
      console.error(
        "Project details not found for:",
        projectId
      );
      return;
    }

    if (detail.content) {
      dialogContent.innerHTML = detail.content;
    } else {
      dialogContent.innerHTML = `
        <header class="project-detail-header">
          <p class="section-kicker">
            ${detail.tag}
          </p>

          <h1>${detail.title}</h1>

          <p class="project-detail-intro">
            ${detail.description}
          </p>
        </header>
      `;
    }

    dialog.scrollTop = 0;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      console.error(
        "This browser does not support HTML dialog.showModal()."
      );
    }
  });

  /* =========================================
     5. CLOSE PROJECT DIALOG
  ========================================= */

  const closeButton =
    document.querySelector(".dialog-close");

  if (closeButton && dialog) {
    closeButton.addEventListener("click", () => {
      dialog.close();
    });
  }

  if (dialog) {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }

})();