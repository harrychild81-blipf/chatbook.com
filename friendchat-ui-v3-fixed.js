/* =========================================================
   FRIENDCHAT CUSTOM UI v5
   COMPLETE FIXED VERSION
   - 20 themes
   - Theme button works
   - Theme panel always created
   - Theme panel scrolls properly
   - Theme overlay above sidebar/dock
   - Sidebar arrow preserved
   - Bottom dock behavior preserved
   - Discovery preserved
   - Spotify old button hidden
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  const $ = (id) => document.getElementById(id);

  const waitForBody = (callback) => {
    if (document.body) {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    }
  };

  /* =========================================================
     20 THEMES
     ========================================================= */

  const themes = {
    midnight: {
      name: "🌌 Midnight Blue",
      bg: "#07111f",
      panel: "#0d1b2e",
      card: "#12243a",
      input: "#0b1728",
      text: "#f5f7ff",
      muted: "#91a4bd",
      accent: "#4d8dff",
      accent2: "#76a9ff",
      border: "#213b5c",
      message: "#17345a",
      messageMine: "#255da8"
    },

    purple: {
      name: "🟣 Purple Neon",
      bg: "#12091d",
      panel: "#1d0e2d",
      card: "#29143d",
      input: "#160b24",
      text: "#ffffff",
      muted: "#bca9cf",
      accent: "#a855f7",
      accent2: "#d084ff",
      border: "#51217a",
      message: "#321a4c",
      messageMine: "#6b2ca8"
    },

    ocean: {
      name: "🔵 Ocean",
      bg: "#061820",
      panel: "#0b2732",
      card: "#103542",
      input: "#081f29",
      text: "#effcff",
      muted: "#91bac4",
      accent: "#00a8d6",
      accent2: "#49d7ff",
      border: "#1b5365",
      message: "#134555",
      messageMine: "#147c9b"
    },

    forest: {
      name: "🌲 Forest",
      bg: "#07130c",
      panel: "#0d2114",
      card: "#12331d",
      input: "#0a1b10",
      text: "#f2fff5",
      muted: "#9eb8a4",
      accent: "#39b86a",
      accent2: "#73df99",
      border: "#245d35",
      message: "#164323",
      messageMine: "#267b42"
    },

    cherry: {
      name: "🌸 Cherry Blossom",
      bg: "#1b0c14",
      panel: "#2a111c",
      card: "#3a1827",
      input: "#21101a",
      text: "#fff5fa",
      muted: "#d2aab9",
      accent: "#ff6fa8",
      accent2: "#ff9bc3",
      border: "#71314c",
      message: "#4a1d32",
      messageMine: "#a63868"
    },

    crimson: {
      name: "🔥 Crimson",
      bg: "#180608",
      panel: "#28090c",
      card: "#390d12",
      input: "#20070a",
      text: "#fff3f4",
      muted: "#d0a0a4",
      accent: "#ef3340",
      accent2: "#ff6670",
      border: "#702027",
      message: "#4b1117",
      messageMine: "#a82430"
    },

    sunset: {
      name: "🌅 Sunset",
      bg: "#1c0c09",
      panel: "#2c1510",
      card: "#402016",
      input: "#25110d",
      text: "#fff7ef",
      muted: "#d1b09c",
      accent: "#ff7a18",
      accent2: "#ffb347",
      border: "#754022",
      message: "#522514",
      messageMine: "#a94c19"
    },

    arctic: {
      name: "🧊 Arctic",
      bg: "#07151d",
      panel: "#10242e",
      card: "#183540",
      input: "#0b2029",
      text: "#f4fcff",
      muted: "#9ebbc5",
      accent: "#62d7ff",
      accent2: "#a6ecff",
      border: "#2b5a69",
      message: "#194653",
      messageMine: "#287f98"
    },

    cybergreen: {
      name: "🟢 Cyber Green",
      bg: "#020d08",
      panel: "#06170e",
      card: "#092419",
      input: "#04140c",
      text: "#eafff2",
      muted: "#83ae96",
      accent: "#00ff73",
      accent2: "#6affae",
      border: "#125e37",
      message: "#0b3a21",
      messageMine: "#087a42"
    },

    golden: {
      name: "🟡 Golden",
      bg: "#171208",
      panel: "#261d0b",
      card: "#382b10",
      input: "#211907",
      text: "#fff9df",
      muted: "#c7b987",
      accent: "#e5b93f",
      accent2: "#ffe083",
      border: "#66531c",
      message: "#47360d",
      messageMine: "#80631a"
    },

    cyberpink: {
      name: "🩷 Cyber Pink",
      bg: "#160712",
      panel: "#250b20",
      card: "#36102f",
      input: "#1e0919",
      text: "#fff2fb",
      muted: "#d0a1c2",
      accent: "#ff2bd6",
      accent2: "#ff7be9",
      border: "#742260",
      message: "#481542",
      messageMine: "#9f287f"
    },

    black: {
      name: "🖤 Pure Black",
      bg: "#000000",
      panel: "#050505",
      card: "#0d0d0d",
      input: "#080808",
      text: "#ffffff",
      muted: "#999999",
      accent: "#ffffff",
      accent2: "#cccccc",
      border: "#242424",
      message: "#171717",
      messageMine: "#292929"
    },

    white: {
      name: "🤍 Clean White",
      bg: "#f5f7fa",
      panel: "#ffffff",
      card: "#ffffff",
      input: "#f0f2f5",
      text: "#111827",
      muted: "#667085",
      accent: "#2563eb",
      accent2: "#4f7cff",
      border: "#d9dee7",
      message: "#e9eef8",
      messageMine: "#dbeafe"
    },

    galaxy: {
      name: "🌌 Galaxy",
      bg: "#080616",
      panel: "#120d27",
      card: "#1c123b",
      input: "#0e0920",
      text: "#f7f2ff",
      muted: "#aaa0c7",
      accent: "#8b5cf6",
      accent2: "#c084fc",
      border: "#4b327e",
      message: "#281958",
      messageMine: "#5630a5"
    },

    aurora: {
      name: "💜 Aurora",
      bg: "#061014",
      panel: "#0c1b20",
      card: "#112c2e",
      input: "#08181c",
      text: "#effffd",
      muted: "#9bb8b5",
      accent: "#67e8f9",
      accent2: "#a78bfa",
      border: "#28575a",
      message: "#164144",
      messageMine: "#38589a"
    },

    discord: {
      name: "🩵 Discord-style Blue",
      bg: "#313338",
      panel: "#2b2d31",
      card: "#1e1f22",
      input: "#383a40",
      text: "#f2f3f5",
      muted: "#b5bac1",
      accent: "#5865f2",
      accent2: "#7983f5",
      border: "#45474d",
      message: "#3b3d43",
      messageMine: "#4c55a8"
    },

    orange: {
      name: "🟠 Cyber Orange",
      bg: "#140a03",
      panel: "#211005",
      card: "#321707",
      input: "#1b0c04",
      text: "#fff6ed",
      muted: "#c9a88f",
      accent: "#ff6a00",
      accent2: "#ff9a4d",
      border: "#6b3010",
      message: "#461d09",
      messageMine: "#963f0d"
    },

    graphite: {
      name: "🩶 Graphite",
      bg: "#101214",
      panel: "#181a1d",
      card: "#222529",
      input: "#141619",
      text: "#f2f4f7",
      muted: "#9ba1a9",
      accent: "#9aa3ad",
      accent2: "#c4cbd2",
      border: "#3a3f45",
      message: "#292d32",
      messageMine: "#41474f"
    },

    gothic: {
      name: "🧛 Dark Gothic",
      bg: "#08060b",
      panel: "#120d16",
      card: "#1d1421",
      input: "#0e0911",
      text: "#f4edf7",
      muted: "#a99cac",
      accent: "#9b59b6",
      accent2: "#c084d8",
      border: "#4a2d55",
      message: "#2b1834",
      messageMine: "#573167"
    },

    crystal: {
      name: "💎 Glass Crystal",
      bg: "#071018",
      panel: "rgba(18,35,50,.88)",
      card: "rgba(38,66,88,.65)",
      input: "rgba(8,24,36,.75)",
      text: "#effaff",
      muted: "#a7c4d3",
      accent: "#72d9ff",
      accent2: "#b2eeff",
      border: "rgba(125,215,255,.35)",
      message: "rgba(38,88,116,.65)",
      messageMine: "rgba(58,133,170,.72)"
    }
  };

  /* =========================================================
     SAFE STORAGE
     ========================================================= */

  function saveTheme(name) {
    try {
      localStorage.setItem("friendchat_theme", name);
    } catch (_) {}
  }

  function loadTheme() {
    try {
      return localStorage.getItem("friendchat_theme") || "midnight";
    } catch (_) {
      return "midnight";
    }
  }

  /* =========================================================
     THEME CSS
     ========================================================= */

  function installThemeStyles() {
    let style = $("fcCustomThemeStyles");

    if (!style) {
      style = document.createElement("style");
      style.id = "fcCustomThemeStyles";
      document.head.appendChild(style);
    }

    style.textContent = `
      :root {
        --fc-bg: #07111f;
        --fc-panel: #0d1b2e;
        --fc-card: #12243a;
        --fc-input: #0b1728;
        --fc-text: #f5f7ff;
        --fc-muted: #91a4bd;
        --fc-accent: #4d8dff;
        --fc-accent2: #76a9ff;
        --fc-border: #213b5c;
        --fc-message: #17345a;
        --fc-message-mine: #255da8;
      }

      html {
        --fc-bg: #07111f;
      }

      body {
        background: var(--fc-bg) !important;
        color: var(--fc-text) !important;
      }

      body,
      body * {
        box-sizing: border-box;
      }

      input,
      textarea,
      select {
        color: var(--fc-text) !important;
        background: var(--fc-input) !important;
        border-color: var(--fc-border) !important;
      }

      button {
        border-color: var(--fc-border);
      }

      /* =====================================================
         THEME MODAL
         IMPORTANT:
         Overlay itself is the scroll container.
         This works even when body scrolling is locked.
         ===================================================== */

      html body #fcThemeOverlay {
        position: fixed !important;
        inset: 0 !important;

        display: none !important;

        width: 100vw !important;
        height: 100vh !important;

        padding: 20px !important;

        overflow-x: hidden !important;
        overflow-y: auto !important;

        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: contain !important;
        touch-action: pan-y !important;

        background: rgba(0, 0, 0, .78) !important;

        z-index: 2147483647 !important;
      }

      html body #fcThemeOverlay.open {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }

      html body #fcThemePanel {
        position: relative !important;

        display: block !important;

        width: min(760px, calc(100vw - 40px)) !important;

        min-height: auto !important;
        height: auto !important;
        max-height: none !important;

        margin: 20px auto 60px !important;

        padding: 22px !important;

        overflow: visible !important;

        background: var(--fc-panel) !important;
        color: var(--fc-text) !important;

        border: 1px solid var(--fc-border) !important;
        border-radius: 22px !important;

        box-shadow:
          0 25px 80px rgba(0,0,0,.65),
          0 0 40px rgba(0,0,0,.25) !important;

        z-index: 2147483647 !important;
      }

      html body #fcThemePanel .fc-theme-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px !important;

        margin-bottom: 20px !important;
      }

      html body #fcThemePanel .fc-theme-title {
        margin: 0 !important;
        font-size: 22px !important;
        font-weight: 800 !important;
        color: var(--fc-text) !important;
      }

      html body #fcThemePanel .fc-theme-subtitle {
        margin: 5px 0 0 !important;
        color: var(--fc-muted) !important;
        font-size: 13px !important;
      }

      html body #fcThemePanel .fc-theme-close {
        flex: 0 0 auto !important;

        width: 40px !important;
        height: 40px !important;

        border: 1px solid var(--fc-border) !important;
        border-radius: 12px !important;

        background: var(--fc-card) !important;
        color: var(--fc-text) !important;

        cursor: pointer !important;
        font-size: 20px !important;
      }

      html body #fcThemePanel .fc-theme-close:hover {
        background: var(--fc-accent) !important;
        color: #fff !important;
      }

      html body #fcThemePanel .fc-theme-grid {
        display: grid !important;

        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

        gap: 12px !important;

        width: 100% !important;

        max-height: none !important;
        height: auto !important;

        overflow: visible !important;
      }

      html body #fcThemePanel .fc-theme-option {
        width: 100% !important;

        min-height: 82px !important;

        padding: 14px !important;

        display: flex !important;
        align-items: center !important;
        gap: 12px !important;

        border: 1px solid var(--fc-border) !important;
        border-radius: 16px !important;

        background: var(--fc-card) !important;
        color: var(--fc-text) !important;

        cursor: pointer !important;

        text-align: left !important;

        transition:
          transform .15s ease,
          border-color .15s ease,
          background .15s ease !important;
      }

      html body #fcThemePanel .fc-theme-option:hover {
        transform: translateY(-2px) !important;
        border-color: var(--fc-accent) !important;
      }

      html body #fcThemePanel .fc-theme-option.active {
        border: 2px solid var(--fc-accent) !important;

        box-shadow:
          0 0 0 2px rgba(255,255,255,.04),
          0 0 18px color-mix(in srgb, var(--fc-accent) 35%, transparent) !important;
      }

      html body #fcThemePanel .fc-theme-preview {
        flex: 0 0 auto !important;

        width: 46px !important;
        height: 46px !important;

        border-radius: 13px !important;

        border: 1px solid rgba(255,255,255,.2) !important;

        box-shadow: inset 0 0 12px rgba(255,255,255,.08) !important;
      }

      html body #fcThemePanel .fc-theme-name {
        font-size: 14px !important;
        font-weight: 700 !important;
        color: var(--fc-text) !important;
      }

      html body #fcThemePanel .fc-theme-check {
        margin-left: auto !important;

        font-size: 17px !important;

        color: var(--fc-accent) !important;

        opacity: 0 !important;
      }

      html body #fcThemePanel .fc-theme-option.active .fc-theme-check {
        opacity: 1 !important;
      }

      /* =====================================================
         SIDEBAR
         ===================================================== */

      html body #fcCustomSidebar {
        position: fixed !important;

        left: 0 !important;
        top: 50% !important;

        transform: translateY(-50%) !important;

        width: 185px !important;

        padding: 10px !important;

        background: var(--fc-panel) !important;

        border: 1px solid var(--fc-border) !important;

        border-left: none !important;

        border-radius: 0 18px 18px 0 !important;

        box-shadow: 0 15px 40px rgba(0,0,0,.35) !important;

        z-index: 2147483645 !important;
      }

      html body #fcCustomSidebar.fc-sidebar-hidden {
        transform:
          translateX(-100%)
          translateY(-50%) !important;
      }

      html body #fcCustomSidebar .fc-nav-button {
        width: 100% !important;

        display: flex !important;
        align-items: center !important;

        gap: 10px !important;

        padding: 11px 12px !important;
        margin: 3px 0 !important;

        border: 1px solid transparent !important;
        border-radius: 12px !important;

        background: transparent !important;
        color: var(--fc-text) !important;

        cursor: pointer !important;

        font-size: 14px !important;

        text-align: left !important;
      }

      html body #fcCustomSidebar .fc-nav-button:hover {
        background: var(--fc-card) !important;
        border-color: var(--fc-border) !important;
      }

      html body #fcCustomSidebar .fc-nav-icon {
        width: 24px !important;
        text-align: center !important;
        font-size: 18px !important;
      }

      html body #fcNavToggle {
        position: fixed !important;

        left: 0 !important;
        top: 50% !important;

        transform: translateY(-50%) !important;

        width: 28px !important;
        height: 48px !important;

        display: flex !important;
        align-items: center !important;
        justify-content: center !important;

        border: 1px solid var(--fc-border) !important;
        border-left: none !important;

        border-radius: 0 12px 12px 0 !important;

        background: var(--fc-panel) !important;
        color: var(--fc-text) !important;

        cursor: pointer !important;

        z-index: 2147483646 !important;

        transition: left .2s ease !important;
      }

      html body #fcNavToggle.fc-nav-open {
        left: 185px !important;
      }

      /* =====================================================
         DISCOVERY
         ===================================================== */

      html body #fcDiscoveryOverlay {
        position: fixed !important;
        inset: 0 !important;

        display: none !important;

        overflow-y: auto !important;

        padding: 20px !important;

        background: rgba(0,0,0,.75) !important;

        z-index: 2147483640 !important;
      }

      html body #fcDiscoveryOverlay.open {
        display: block !important;
      }

      html body #fcDiscoveryPanel {
        width: min(760px, calc(100vw - 40px)) !important;

        margin: 30px auto 60px !important;

        padding: 22px !important;

        background: var(--fc-panel) !important;
        color: var(--fc-text) !important;

        border: 1px solid var(--fc-border) !important;

        border-radius: 20px !important;
      }

      /* =====================================================
         MOBILE
         ===================================================== */

      @media (max-width: 650px) {

        html body #fcThemeOverlay {
          padding: 10px !important;
        }

        html body #fcThemePanel {
          width: calc(100vw - 20px) !important;

          margin: 10px auto 40px !important;

          padding: 16px !important;

          border-radius: 18px !important;
        }

        html body #fcThemePanel .fc-theme-grid {
          grid-template-columns: 1fr !important;
        }

        html body #fcThemePanel .fc-theme-option {
          min-height: 72px !important;
        }

        html body #fcCustomSidebar {
          width: 178px !important;
        }

        html body #fcNavToggle.fc-nav-open {
          left: 178px !important;
        }
      }

      @media (max-width: 380px) {

        html body #fcThemePanel .fc-theme-option {
          min-height: 66px !important;
          padding: 10px !important;
        }

        html body #fcThemePanel .fc-theme-preview {
          width: 40px !important;
          height: 40px !important;
        }
      }
    `;
  }

  /* =========================================================
     APPLY THEME
     ========================================================= */

  function setTheme(themeName) {
    const theme = themes[themeName];

    if (!theme) return;

    const root = document.documentElement;

    root.style.setProperty("--fc-bg", theme.bg);
    root.style.setProperty("--fc-panel", theme.panel);
    root.style.setProperty("--fc-card", theme.card);
    root.style.setProperty("--fc-input", theme.input);
    root.style.setProperty("--fc-text", theme.text);
    root.style.setProperty("--fc-muted", theme.muted);
    root.style.setProperty("--fc-accent", theme.accent);
    root.style.setProperty("--fc-accent2", theme.accent2);
    root.style.setProperty("--fc-border", theme.border);
    root.style.setProperty("--fc-message", theme.message);
    root.style.setProperty("--fc-message-mine", theme.messageMine);

    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;

    saveTheme(themeName);

    document.documentElement.style.colorScheme =
      themeName === "white" ? "light" : "dark";

    updateThemeSelection(themeName);
  }

  function updateThemeSelection(themeName) {
    document
      .querySelectorAll("#fcThemePanel .fc-theme-option")
      .forEach((button) => {
        const active = button.dataset.theme === themeName;

        button.classList.toggle("active", active);

        const check = button.querySelector(".fc-theme-check");

        if (check) {
          check.textContent = active ? "✓" : "";
        }
      });
  }

  function applySavedTheme() {
    const saved = loadTheme();

    if (themes[saved]) {
      setTheme(saved);
    } else {
      setTheme("midnight");
    }
  }

  /* =========================================================
     THEME PANEL
     ========================================================= */

  function addThemePanel() {
    let overlay = $("fcThemeOverlay");
    let panel = $("fcThemePanel");

    /*
      If an old broken version exists, remove it.
      This also fixes the situation where overlay exists
      but panel does not, or vice versa.
    */

    if (overlay && !panel) {
      overlay.remove();
      overlay = null;
    }

    if (panel && !overlay) {
      panel.remove();
      panel = null;
    }

    if (overlay && panel) {
      updateThemeSelection(loadTheme());
      return;
    }

    overlay = document.createElement("div");
    overlay.id = "fcThemeOverlay";

    panel = document.createElement("div");
    panel.id = "fcThemePanel";

    const head = document.createElement("div");
    head.className = "fc-theme-head";

    const titleWrap = document.createElement("div");

    const title = document.createElement("h2");
    title.className = "fc-theme-title";
    title.textContent = "Choose Theme";

    const subtitle = document.createElement("div");
    subtitle.className = "fc-theme-subtitle";
    subtitle.textContent = "Select a theme for your FriendChat";

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    const closeButton = document.createElement("button");
    closeButton.className = "fc-theme-close";
    closeButton.type = "button";
    closeButton.textContent = "✕";
    closeButton.title = "Close";

    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeThemePanel();
    });

    head.appendChild(titleWrap);
    head.appendChild(closeButton);

    const grid = document.createElement("div");
    grid.className = "fc-theme-grid";

    Object.entries(themes).forEach(([key, theme]) => {
      const option = document.createElement("button");

      option.type = "button";
      option.className = "fc-theme-option";
      option.dataset.theme = key;

      const preview = document.createElement("div");
      preview.className = "fc-theme-preview";

      preview.style.background =
        `linear-gradient(135deg, ${theme.accent}, ${theme.bg})`;

      const name = document.createElement("div");
      name.className = "fc-theme-name";
      name.textContent = theme.name;

      const check = document.createElement("div");
      check.className = "fc-theme-check";
      check.textContent = "";

      option.appendChild(preview);
      option.appendChild(name);
      option.appendChild(check);

      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        setTheme(key);
      });

      grid.appendChild(option);
    });

    panel.appendChild(head);
    panel.appendChild(grid);

    /*
      IMPORTANT:
      Panel is INSIDE overlay.
      Overlay handles scrolling.
    */

    overlay.appendChild(panel);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeThemePanel();
      }
    });

    document.body.appendChild(overlay);

    updateThemeSelection(loadTheme());
  }

  function openThemePanel() {
    addThemePanel();

    const overlay = $("fcThemeOverlay");
    const panel = $("fcThemePanel");

    if (!overlay || !panel) return;

    if (!overlay.dataset.fcThemeWasOverflow) {
      overlay.dataset.fcThemeWasOverflow =
        document.body.style.overflow || "";
    }

    document.body.style.overflow = "hidden";

    /*
      Force visibility in case another CSS file has old rules.
    */

    overlay.classList.add("open");

    overlay.style.display = "block";
    overlay.style.visibility = "visible";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    overlay.style.zIndex = "2147483647";

    panel.style.display = "block";
    panel.style.visibility = "visible";
    panel.style.opacity = "1";
    panel.style.pointerEvents = "auto";
    panel.style.zIndex = "2147483647";

    updateThemeSelection(loadTheme());

    /*
      Put the user at the top whenever the panel opens.
    */

    requestAnimationFrame(() => {
      overlay.scrollTop = 0;
    });
  }

  function closeThemePanel() {
    const overlay = $("fcThemeOverlay");

    if (!overlay) return;

    overlay.classList.remove("open");

    overlay.style.display = "none";
    overlay.style.visibility = "hidden";
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";

    const oldOverflow =
      overlay.dataset.fcThemeWasOverflow || "";

    document.body.style.overflow = oldOverflow;

    delete overlay.dataset.fcThemeWasOverflow;
  }

  /* =========================================================
     SIDEBAR
     ========================================================= */

  function createSidebar() {
    let toggle = $("fcNavToggle");
    let sidebar = $("fcCustomSidebar");

    if (!toggle) {
      toggle = document.createElement("button");

      toggle.id = "fcNavToggle";
      toggle.type = "button";
      toggle.title = "Open menu";
      toggle.textContent = "›";

      document.body.appendChild(toggle);
    }

    if (!sidebar) {
      sidebar = document.createElement("div");

      sidebar.id = "fcCustomSidebar";

      sidebar.innerHTML = `
        <button class="fc-nav-button" type="button" data-nav="home">
          <span class="fc-nav-icon">🏠</span>
          <span>Home</span>
        </button>

        <button class="fc-nav-button" type="button" data-nav="chats">
          <span class="fc-nav-icon">💬</span>
          <span>Chats</span>
        </button>

        <button class="fc-nav-button" type="button" data-nav="discover">
          <span class="fc-nav-icon">✨</span>
          <span>Suggestions</span>
        </button>

        <button class="fc-nav-button" type="button" data-nav="theme">
          <span class="fc-nav-icon">🎨</span>
          <span>Theme</span>
        </button>

        <button class="fc-nav-button" type="button" data-nav="profile">
          <span class="fc-nav-icon">👤</span>
          <span>Profile</span>
        </button>
      `;

      document.body.appendChild(sidebar);
    }

    bindSidebar(toggle, sidebar);

    return {
      toggle,
      sidebar
    };
  }

  function bindSidebar(toggle, sidebar) {
    if (toggle.dataset.fcBound !== "1") {
      toggle.dataset.fcBound = "1";

      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        toggleSidebar();
      });
    }

    sidebar
      .querySelectorAll(".fc-nav-button")
      .forEach((button) => {
        if (button.dataset.fcBound === "1") return;

        button.dataset.fcBound = "1";

        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();

          const action = button.dataset.nav;

          handleNavigation(action);
        });
      });
  }

  function toggleSidebar() {
    const sidebar = $("fcCustomSidebar");
    const toggle = $("fcNavToggle");

    if (!sidebar || !toggle) return;

    const hidden =
      sidebar.classList.toggle("fc-sidebar-hidden");

    toggle.classList.toggle("fc-nav-open", !hidden);

    toggle.textContent = hidden ? "›" : "‹";

    toggle.title = hidden ? "Open menu" : "Close menu";
  }

  function closeSidebar() {
    const sidebar = $("fcCustomSidebar");
    const toggle = $("fcNavToggle");

    if (!sidebar || !toggle) return;

    sidebar.classList.add("fc-sidebar-hidden");
    toggle.classList.remove("fc-nav-open");

    toggle.textContent = "›";
    toggle.title = "Open menu";
  }

  function openSidebar() {
    const sidebar = $("fcCustomSidebar");
    const toggle = $("fcNavToggle");

    if (!sidebar || !toggle) return;

    sidebar.classList.remove("fc-sidebar-hidden");
    toggle.classList.add("fc-nav-open");

    toggle.textContent = "‹";
    toggle.title = "Close menu";
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function handleNavigation(action) {
    switch (action) {
      case "home":
        closeThemePanel();
        closeDiscovery();
        goHome();
        closeSidebar();
        break;

      case "chats":
        closeThemePanel();
        closeDiscovery();
        showChats();
        closeSidebar();
        break;

      case "discover":
        closeThemePanel();
        openDiscovery();
        closeSidebar();
        break;

      case "theme":
        closeSidebar();

        /*
          IMPORTANT:
          Always create panel BEFORE opening it.
        */

        addThemePanel();
        openThemePanel();
        break;

      case "profile":
        closeThemePanel();
        closeDiscovery();
        openProfile();
        closeSidebar();
        break;
    }
  }

  /* =========================================================
     HOME
     ========================================================= */

  function goHome() {
    closeThemePanel();
    closeDiscovery();

    const screens = document.querySelectorAll(
      ".screen, .page, [data-screen]"
    );

    screens.forEach((screen) => {
      if (
        screen.id === "homeScreen" ||
        screen.id === "home" ||
        screen.dataset.screen === "home"
      ) {
        screen.style.display = "";
        screen.classList.remove("hidden");
      }
    });

    if (typeof window.showHome === "function") {
      try {
        window.showHome();
      } catch (_) {}
    }

    if (typeof window.showScreen === "function") {
      try {
        window.showScreen("home");
      } catch (_) {}
    }
  }

  function showChats() {
    if (typeof window.showChats === "function") {
      try {
        window.showChats();
        return;
      } catch (_) {}
    }

    const home = $("homeScreen");

    if (home) {
      home.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function openProfile() {
    if (typeof window.showProfile === "function") {
      try {
        window.showProfile();
        return;
      } catch (_) {}
    }

    if (typeof window.openProfile === "function") {
      /*
        Prevent recursion if this function is our own function.
      */
    }

    const profile = $("profileScreen");

    if (profile) {
      profile.style.display = "";
      profile.classList.remove("hidden");

      profile.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  /* =========================================================
     DISCOVERY
     ========================================================= */

  function addDiscovery() {
    if ($("fcDiscoveryOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "fcDiscoveryOverlay";

    const panel = document.createElement("div");
    panel.id = "fcDiscoveryPanel";

    panel.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-bottom:18px;
      ">
        <div>
          <h2 style="
            margin:0;
            color:var(--fc-text);
            font-size:22px;
          ">
            ✨ FriendChat Suggestions
          </h2>

          <div style="
            margin-top:5px;
            color:var(--fc-muted);
            font-size:13px;
          ">
            Discover people and groups.
          </div>
        </div>

        <button
          id="fcDiscoveryClose"
          type="button"
          style="
            width:40px;
            height:40px;
            border-radius:12px;
            border:1px solid var(--fc-border);
            background:var(--fc-card);
            color:var(--fc-text);
            cursor:pointer;
            font-size:18px;
          "
        >
          ✕
        </button>
      </div>

      <div id="fcDiscoveryContent">
        <div style="
          padding:20px;
          border:1px solid var(--fc-border);
          border-radius:16px;
          background:var(--fc-card);
          color:var(--fc-muted);
          text-align:center;
        ">
          Friend suggestions will appear here.
        </div>
      </div>
    `;

    overlay.appendChild(panel);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeDiscovery();
      }
    });

    document.body.appendChild(overlay);

    const close = $("fcDiscoveryClose");

    if (close) {
      close.addEventListener("click", (event) => {
        event.preventDefault();
        closeDiscovery();
      });
    }
  }

  function openDiscovery() {
    addDiscovery();

    const overlay = $("fcDiscoveryOverlay");

    if (!overlay) return;

    overlay.classList.add("open");

    overlay.style.display = "block";
    overlay.style.visibility = "visible";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
  }

  function closeDiscovery() {
    const overlay = $("fcDiscoveryOverlay");

    if (!overlay) return;

    overlay.classList.remove("open");

    overlay.style.display = "none";
    overlay.style.visibility = "hidden";
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  }

  /* =========================================================
     BOTTOM DOCK
     IMPORTANT:
     DO NOT CHANGE ITS BEHAVIOR.
     ========================================================= */

  function addBottomDock() {
    if ($("fcBottomDock")) return;

    const dock = document.createElement("div");

    dock.id = "fcBottomDock";
    dock.className = "fc-bottom-dock";

    dock.innerHTML = `
      <button type="button" data-dock="chats">
        <span>💬</span>
        <small>Chats</small>
      </button>

      <button type="button" data-dock="suggestions">
        <span>✨</span>
        <small>Suggestions</small>
      </button>

      <button type="button" data-dock="profile">
        <span>👤</span>
        <small>Profile</small>
      </button>
    `;

    /*
      Only add behavior.
      Existing CSS/layout is left alone.
    */

    dock
      .querySelectorAll("button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.dataset.dock;

          if (action === "chats") {
            closeThemePanel();
            closeDiscovery();
            showChats();
          }

          if (action === "suggestions") {
            closeThemePanel();
            openDiscovery();
          }

          if (action === "profile") {
            closeThemePanel();
            closeDiscovery();
            openProfile();
          }
        });
      });

    document.body.appendChild(dock);

    /*
      Only visual fallback if the user's CSS doesn't already
      style the dock.
    */

    if (!$("fcBottomDockStyles")) {
      const style = document.createElement("style");

      style.id = "fcBottomDockStyles";

      style.textContent = `
        html body #fcBottomDock {
          position: fixed;
          left: 50%;
          bottom: 10px;
          transform: translateX(-50%);

          z-index: 2147483645;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          padding: 5px;

          background: var(--fc-panel);
          border: 1px solid var(--fc-border);

          border-radius: 14px;

          box-shadow: 0 12px 35px rgba(0,0,0,.35);
        }

        html body #fcBottomDock button {
          border: 0;
          background: transparent;

          color: var(--fc-text);

          border-radius: 10px;

          padding: 7px 10px;

          cursor: pointer;

          display: flex;
          align-items: center;
          gap: 5px;
        }

        html body #fcBottomDock button:hover {
          background: var(--fc-card);
        }

        html body #fcBottomDock span {
          font-size: 17px;
        }

        html body #fcBottomDock small {
          font-size: 11px;
          color: var(--fc-muted);
        }

        @media (max-width:650px) {
          html body #fcBottomDock {
            bottom: 8px;
          }

          html body #fcBottomDock small {
            display: none;
          }
        }
      `;

      document.head.appendChild(style);
    }
  }

  /* =========================================================
     NAVIGATION STYLE
     ========================================================= */

  function installNavigationStyles() {
    let style = $("fcNavigationStyles");

    if (!style) {
      style = document.createElement("style");
      style.id = "fcNavigationStyles";
      document.head.appendChild(style);
    }

    style.textContent += `
      html body #fcCustomSidebar {
        transition:
          transform .2s ease,
          background .2s ease,
          border-color .2s ease !important;
      }

      html body #fcNavToggle {
        transition:
          left .2s ease,
          background .2s ease !important;
      }
    `;
  }

  /* =========================================================
     VISIBILITY
     ========================================================= */

  function setupVisibility() {
    const sidebar = $("fcCustomSidebar");
    const toggle = $("fcNavToggle");

    if (!sidebar || !toggle) return;

    /*
      Start hidden.
    */

    sidebar.classList.add("fc-sidebar-hidden");
    toggle.classList.remove("fc-nav-open");
    toggle.textContent = "›";

    /*
      Keep sidebar available while user is logged in.
    */

    const update = () => {
      const login =
        $("loginScreen") ||
        $("loginPage") ||
        $("login");

      const signup =
        $("signupScreen") ||
        $("signupPage") ||
        $("signup");

      const loggedIn =
        (!login || login.style.display === "none" ||
          login.classList.contains("hidden")) &&
        (!signup || signup.style.display === "none" ||
          signup.classList.contains("hidden"));

      if (loggedIn) {
        toggle.style.display = "flex";
      } else {
        toggle.style.display = "none";
        sidebar.classList.add("fc-sidebar-hidden");

        closeThemePanel();
        closeDiscovery();
      }
    };

    update();

    /*
      Avoid duplicate observer.
    */

    if (document.body.dataset.fcVisibilityBound !== "1") {
      document.body.dataset.fcVisibilityBound = "1";

      const observer = new MutationObserver(() => {
        update();

        /*
          If another script recreates sidebar buttons,
          bind them again.
        */

        const currentSidebar = $("fcCustomSidebar");

        if (currentSidebar) {
          bindSidebar(toggle, currentSidebar);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "class",
          "style"
        ]
      });
    }
  }

  /* =========================================================
     HIDE OLD SPOTIFY BUTTON
     ========================================================= */

  function hideOldSpotifyButton() {
    const removeSpotify = () => {
      document
        .querySelectorAll(
          '[id*="spotify" i], ' +
          '[class*="spotify" i], ' +
          'button'
        )
        .forEach((element) => {
          const text =
            (element.textContent || "")
              .trim()
              .toLowerCase();

          if (
            text === "spotify" ||
            text === "🎵 spotify" ||
            text === "open spotify"
          ) {
            /*
              Don't remove our custom UI.
            */

            if (
              element.id === "fcBottomDock" ||
              element.closest("#fcBottomDock") ||
              element.closest("#fcCustomSidebar")
            ) {
              return;
            }

            element.style.display = "none";
          }
        });
    };

    removeSpotify();

    let count = 0;

    const interval = setInterval(() => {
      removeSpotify();

      count++;

      if (count >= 30) {
        clearInterval(interval);
      }
    }, 500);
  }

  /* =========================================================
     GLOBAL KEYBOARD HANDLING
     ========================================================= */

  function installKeyboard() {
    if (document.body.dataset.fcKeyboardBound === "1") {
      return;
    }

    document.body.dataset.fcKeyboardBound = "1";

    document.addEventListener("keydown", (event) => {
      /*
        ESC closes overlays.
      */

      if (event.key === "Escape") {
        const theme = $("fcThemeOverlay");

        if (
          theme &&
          theme.classList.contains("open")
        ) {
          closeThemePanel();
          return;
        }

        const discovery = $("fcDiscoveryOverlay");

        if (
          discovery &&
          discovery.classList.contains("open")
        ) {
          closeDiscovery();
          return;
        }
      }
    });
  }

  /* =========================================================
     GLOBAL FUNCTIONS
     ========================================================= */

  window.openThemePanel = openThemePanel;
  window.closeThemePanel = closeThemePanel;
  window.changeTheme = setTheme;

  window.toggleTheme = () => {
    const overlay = $("fcThemeOverlay");

    if (
      overlay &&
      overlay.classList.contains("open")
    ) {
      closeThemePanel();
    } else {
      openThemePanel();
    }
  };

  window.openDiscovery = openDiscovery;
  window.closeDiscovery = closeDiscovery;

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {
    /*
      IMPORTANT FIX:
      NEVER return early just because the sidebar already exists.

      The old version did this:

        if (sidebar exists) return;

      That caused the Theme panel to never be created.
    */

    installThemeStyles();
    installNavigationStyles();

    createSidebar();

    addBottomDock();

    addDiscovery();

    addThemePanel();

    hideOldSpotifyButton();

    applySavedTheme();

    installKeyboard();

    setupVisibility();
  }

  /* =========================================================
     START
     ========================================================= */

  waitForBody(() => {
    init();
  });

})();
