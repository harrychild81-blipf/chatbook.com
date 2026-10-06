/* =========================================================
   FRIENDCHAT CUSTOM UI v4
   FIXED COMPLETE VERSION

   - Left navigation arrow
   - Sliding sidebar
   - Bottom dock
   - Discovery
   - Theme system
   - Theme persistence
   - Theme window FIXED
   - Theme window scrolling FIXED
   - 20 themes
   - Spotify button cleanup
   - Navigation visibility control
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     20 THEMES
     ========================================================= */

  const themes = {

    midnight: {
      name: "Midnight Blue",
      desc: "Deep blue night",
      bg: "#070a10",
      panel: "#0d121b",
      panel2: "#111827",
      accent: "#6c7cff",
      accent2: "#8b5cf6",
      text: "#ffffff",
      muted: "#9ca3af"
    },

    purple: {
      name: "Purple Neon",
      desc: "Neon purple glow",
      bg: "#090511",
      panel: "#14091f",
      panel2: "#21102f",
      accent: "#a855f7",
      accent2: "#ec4899",
      text: "#ffffff",
      muted: "#b8a4c9"
    },

    ocean: {
      name: "Ocean",
      desc: "Deep ocean blue",
      bg: "#041018",
      panel: "#091a27",
      panel2: "#102a3d",
      accent: "#0ea5e9",
      accent2: "#2563eb",
      text: "#ffffff",
      muted: "#94a9b8"
    },

    forest: {
      name: "Forest",
      desc: "Deep natural green",
      bg: "#061008",
      panel: "#0c1b11",
      panel2: "#14291b",
      accent: "#22c55e",
      accent2: "#84cc16",
      text: "#ffffff",
      muted: "#9caf9f"
    },

    cherry: {
      name: "Cherry Blossom",
      desc: "Pink cherry glow",
      bg: "#12070d",
      panel: "#1d0c15",
      panel2: "#2b1220",
      accent: "#f472b6",
      accent2: "#ec4899",
      text: "#ffffff",
      muted: "#c8a5b7"
    },

    crimson: {
      name: "Crimson",
      desc: "Dark red power",
      bg: "#100405",
      panel: "#1c080a",
      panel2: "#2b0d10",
      accent: "#ef4444",
      accent2: "#b91c1c",
      text: "#ffffff",
      muted: "#c59b9e"
    },

    sunset: {
      name: "Sunset",
      desc: "Orange sunset glow",
      bg: "#120805",
      panel: "#1d0e09",
      panel2: "#2b1610",
      accent: "#fb923c",
      accent2: "#ef4444",
      text: "#ffffff",
      muted: "#c9aaa0"
    },

    arctic: {
      name: "Arctic",
      desc: "Cold icy blue",
      bg: "#071017",
      panel: "#0d1b24",
      panel2: "#142b38",
      accent: "#67e8f9",
      accent2: "#38bdf8",
      text: "#ffffff",
      muted: "#9bb8c3"
    },

    cybergreen: {
      name: "Cyber Green",
      desc: "Futuristic green",
      bg: "#020805",
      panel: "#06130a",
      panel2: "#0b2111",
      accent: "#00ff88",
      accent2: "#00c853",
      text: "#ffffff",
      muted: "#91b7a0"
    },

    golden: {
      name: "Golden",
      desc: "Dark gold luxury",
      bg: "#0d0a03",
      panel: "#191205",
      panel2: "#281d08",
      accent: "#facc15",
      accent2: "#f59e0b",
      text: "#ffffff",
      muted: "#c7b989"
    },

    cyberpink: {
      name: "Cyber Pink",
      desc: "Hot pink neon",
      bg: "#0c0209",
      panel: "#180612",
      panel2: "#28091c",
      accent: "#ff1493",
      accent2: "#d946ef",
      text: "#ffffff",
      muted: "#c59bb8"
    },

    black: {
      name: "Pure Black",
      desc: "Maximum black",
      bg: "#000000",
      panel: "#000000",
      panel2: "#080808",
      accent: "#ffffff",
      accent2: "#a3a3a3",
      text: "#ffffff",
      muted: "#888888"
    },

    white: {
      name: "Clean White",
      desc: "Bright clean interface",
      bg: "#f5f7fa",
      panel: "#ffffff",
      panel2: "#edf0f4",
      accent: "#4f46e5",
      accent2: "#7c3aed",
      text: "#111827",
      muted: "#6b7280"
    },

    galaxy: {
      name: "Galaxy",
      desc: "Deep space colors",
      bg: "#050414",
      panel: "#0c0822",
      panel2: "#151035",
      accent: "#7c3aed",
      accent2: "#06b6d4",
      text: "#ffffff",
      muted: "#aaa6c5"
    },

    aurora: {
      name: "Aurora",
      desc: "Northern lights",
      bg: "#03100f",
      panel: "#071b18",
      panel2: "#0d2b28",
      accent: "#2dd4bf",
      accent2: "#8b5cf6",
      text: "#ffffff",
      muted: "#9db8b4"
    },

    discord: {
      name: "Discord Blue",
      desc: "Blue community style",
      bg: "#202225",
      panel: "#2f3136",
      panel2: "#36393f",
      accent: "#5865f2",
      accent2: "#7289da",
      text: "#ffffff",
      muted: "#b9bbbe"
    },

    cyberorange: {
      name: "Cyber Orange",
      desc: "Orange neon",
      bg: "#0d0602",
      panel: "#1a0c04",
      panel2: "#291307",
      accent: "#ff7a00",
      accent2: "#ff3d00",
      text: "#ffffff",
      muted: "#c9a18b"
    },

    graphite: {
      name: "Graphite",
      desc: "Clean monochrome",
      bg: "#090909",
      panel: "#121212",
      panel2: "#1c1c1c",
      accent: "#d1d5db",
      accent2: "#6b7280",
      text: "#ffffff",
      muted: "#a1a1aa"
    },

    gothic: {
      name: "Dark Gothic",
      desc: "Dark red gothic",
      bg: "#050303",
      panel: "#100707",
      panel2: "#1b0b0b",
      accent: "#991b1b",
      accent2: "#7f1d1d",
      text: "#f5f5f5",
      muted: "#a99a9a"
    },

    crystal: {
      name: "Glass Crystal",
      desc: "Blue glass effect",
      bg: "#061018",
      panel: "rgba(18,35,50,.82)",
      panel2: "rgba(30,55,75,.82)",
      accent: "#67e8f9",
      accent2: "#818cf8",
      text: "#ffffff",
      muted: "#a8c2ce"
    }

  };


  /* =========================================================
     HELPERS
     ========================================================= */

  const $ = id => document.getElementById(id);

  const esc = s =>
    String(s ?? "").replace(
      /[&<>"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m])
    );

  function create(tag, cls, parent) {
    const e = document.createElement(tag);

    if (cls) {
      e.className = cls;
    }

    if (parent) {
      parent.appendChild(e);
    }

    return e;
  }


  /* =========================================================
     THEME CSS
     ========================================================= */

  function installThemeStyles() {

    if ($("friendchat-theme-guaranteed-style")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "friendchat-theme-guaranteed-style";

    style.textContent = `

      :root {
        --fc-bg: #070a10;
        --fc-panel: #0d121b;
        --fc-panel-2: #111827;
        --fc-accent: #6c7cff;
        --fc-accent-2: #8b5cf6;
        --fc-text: #ffffff;
        --fc-muted: #9ca3af;
      }


      body {
        background: var(--fc-bg) !important;
        color: var(--fc-text) !important;
      }


      .app {
        background: var(--fc-bg) !important;
        color: var(--fc-text) !important;
      }


      .screen {
        background: var(--fc-bg);
        color: var(--fc-text);
      }


      .card,
      .panel,
      .modal,
      .profile-card,
      .friend-card,
      .chat-card,
      .settings-card {
        background: var(--fc-panel) !important;
        color: var(--fc-text) !important;
        border-color: rgba(255,255,255,.10) !important;
      }


      input,
      textarea,
      select {
        background: var(--fc-panel-2) !important;
        color: var(--fc-text) !important;
        border-color: rgba(255,255,255,.12) !important;
      }


      input::placeholder,
      textarea::placeholder {
        color: var(--fc-muted) !important;
      }


      input:focus,
      textarea:focus,
      select:focus {
        border-color: var(--fc-accent) !important;
        box-shadow: 0 0 0 2px rgba(100,120,255,.15) !important;
      }


      .primary,
      .primaryButton,
      .mainButton,
      .sendButton,
      .loginButton,
      .signupButton {
        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;

        color: #fff !important;
      }


      #fcCustomSidebar {
        background: var(--fc-panel) !important;
        color: var(--fc-text) !important;
        border-color: rgba(255,255,255,.10) !important;
      }


      .fc-sidebar-logo {
        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;

        color: #fff !important;
      }


      .fc-sidebar-title {
        color: var(--fc-text) !important;
      }


      .fc-sidebar-sub {
        color: var(--fc-muted) !important;
      }


      .fc-nav-item {
        color: var(--fc-text) !important;
      }


      .fc-nav-item:hover {
        background: rgba(255,255,255,.06) !important;
      }


      .fc-nav-item.active {
        background: rgba(100,120,255,.15) !important;
        color: var(--fc-accent) !important;
      }


      #fcNavToggle {
        background: var(--fc-panel) !important;
        color: var(--fc-text) !important;
      }


      /* Do not change bottom dock layout.
         Only allow its existing theme colors. */

      .fc-bottom-dock {
        background: var(--fc-panel) !important;
      }


      .fc-discovery {
        background: var(--fc-panel) !important;
        color: var(--fc-text) !important;
      }


      .fc-user-suggestion {
        background: var(--fc-panel-2) !important;
        color: var(--fc-text) !important;
      }


      .fc-user-avatar {
        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;
      }


      .fc-user-name {
        color: var(--fc-text) !important;
      }


      .fc-user-id {
        color: var(--fc-muted) !important;
      }


      .fc-user-add {
        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;

        color: white !important;
      }


      /* =====================================================
         THEME OVERLAY
         ===================================================== */

      #fcThemeOverlay {
        position: fixed !important;
        inset: 0 !important;

        width: 100vw !important;
        height: 100vh !important;

        display: none !important;

        background: rgba(0,0,0,.72) !important;

        z-index: 2147483000 !important;

        overflow-y: auto !important;
        overflow-x: hidden !important;

        padding: 20px !important;

        box-sizing: border-box !important;

        -webkit-overflow-scrolling: touch !important;
      }


      #fcThemeOverlay.open {
        display: block !important;
      }


      /* =====================================================
         THEME PANEL
         ===================================================== */

      #fcThemePanel {
        position: relative !important;

        display: none !important;

        width: min(760px, calc(100vw - 40px)) !important;

        margin: 20px auto 50px auto !important;

        padding: 20px !important;

        box-sizing: border-box !important;

        background: var(--fc-panel) !important;

        color: var(--fc-text) !important;

        border: 1px solid rgba(255,255,255,.12) !important;

        border-radius: 22px !important;

        box-shadow:
          0 25px 80px rgba(0,0,0,.60) !important;

        z-index: 2147483001 !important;

        overflow: visible !important;
      }


      #fcThemePanel.open {
        display: block !important;
      }


      .fc-theme-head {
        display: flex !important;

        align-items: center !important;

        justify-content: space-between !important;

        gap: 15px !important;

        margin-bottom: 20px !important;
      }


      .fc-theme-head strong {
        font-size: 21px !important;
        color: var(--fc-text) !important;
      }


      .fc-theme-body {
        width: 100% !important;
        overflow: visible !important;
      }


      .fc-theme-grid {
        display: grid !important;

        grid-template-columns:
          repeat(2, minmax(0,1fr)) !important;

        gap: 12px !important;

        width: 100% !important;

        max-height: none !important;

        overflow: visible !important;
      }


      .fc-theme-choice {
        width: 100% !important;

        min-height: 115px !important;

        padding: 14px !important;

        box-sizing: border-box !important;

        border-radius: 16px !important;

        border:
          1px solid
          rgba(255,255,255,.10) !important;

        background:
          var(--fc-panel-2) !important;

        color:
          var(--fc-text) !important;

        cursor: pointer !important;

        text-align: left !important;

        transition:
          transform .18s ease,
          border-color .18s ease !important;
      }


      .fc-theme-choice:hover {
        transform: translateY(-2px) !important;

        border-color:
          var(--fc-accent) !important;
      }


      .fc-theme-choice.selected {
        border:
          2px solid
          var(--fc-accent) !important;

        box-shadow:
          0 0 20px
          rgba(100,120,255,.20) !important;
      }


      .fc-theme-swatch {
        width: 100% !important;

        height: 42px !important;

        border-radius: 10px !important;

        margin-bottom: 10px !important;
      }


      .fc-theme-name {
        color: var(--fc-text) !important;

        font-size: 15px !important;

        font-weight: 700 !important;
      }


      .fc-theme-desc {
        color: var(--fc-muted) !important;

        font-size: 12px !important;

        margin-top: 4px !important;
      }


      /* =====================================================
         LIGHT THEME
         ===================================================== */

      html[data-fc-theme="white"],
      html[data-fc-theme="light"] {
        color-scheme: light;
      }


      html[data-fc-theme="white"] body,
      html[data-fc-theme="white"] .app,
      html[data-fc-theme="white"] .screen {
        color: #111827 !important;
      }


      /* =====================================================
         MOBILE
         ===================================================== */

      @media(max-width:600px) {

        #fcThemeOverlay {
          padding: 10px !important;
        }


        #fcThemePanel {
          width: calc(100vw - 20px) !important;

          margin:
            10px auto 30px auto !important;

          padding: 15px !important;

          border-radius: 18px !important;
        }


        .fc-theme-grid {
          grid-template-columns:
            1fr !important;
        }

      }

    `;

    document.head.appendChild(style);
  }


  /* =========================================================
     NAVIGATION CSS
     ========================================================= */

  function installNavigationStyles() {

    if ($("friendchat-nav-guaranteed-style")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "friendchat-nav-guaranteed-style";

    style.textContent = `

      #fcNavToggle {
        position: fixed !important;

        left: 0 !important;
        top: 50% !important;

        transform:
          translateY(-50%) !important;

        z-index: 2147483646 !important;

        width: 28px !important;
        height: 48px !important;

        display: flex !important;

        align-items: center !important;
        justify-content: center !important;

        padding: 0 !important;
        margin: 0 !important;

        border: 0 !important;

        border-radius:
          0 14px 14px 0 !important;

        cursor: pointer !important;

        visibility: visible !important;
      }


      #fcNavToggle.is-open {
        left: 185px !important;
      }


      #fcNavToggle .fc-chevron {
        font-size: 24px !important;

        line-height: 1 !important;

        display: block !important;

        transition:
          transform .22s ease !important;
      }


      #fcNavToggle.is-open
      .fc-chevron {
        transform:
          rotate(180deg) !important;
      }


      #fcCustomSidebar {
        position: fixed !important;

        left: 0 !important;
        top: 50% !important;

        transform:
          translateY(-50%)
          translateX(-110%) !important;

        width: 185px !important;

        z-index: 2147483645 !important;

        box-sizing: border-box !important;

        transition:
          transform .22s ease !important;
      }


      #fcCustomSidebar.open {
        transform:
          translateY(-50%)
          translateX(0) !important;
      }


      #bottomNav {
        display: none !important;
      }


      @media(max-width:600px) {

        #fcNavToggle {
          width: 24px !important;
          height: 44px !important;
        }


        #fcNavToggle.is-open {
          left: 178px !important;
        }


        #fcCustomSidebar {
          width: 178px !important;
        }

      }

    `;

    document.head.appendChild(style);
  }


  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {

    installThemeStyles();

    installNavigationStyles();


    if ($("fcCustomSidebar")) {

      setupVisibility();

      return;
    }


    /* =======================================================
       ARROW
       ======================================================= */

    const toggle =
      create(
        "button",
        "fc-nav-toggle",
        document.body
      );

    toggle.id = "fcNavToggle";

    toggle.type = "button";

    toggle.title = "Open navigation";

    toggle.setAttribute(
      "aria-label",
      "Open navigation"
    );

    toggle.innerHTML =
      '<span class="fc-chevron">›</span>';


    /* =======================================================
       SIDEBAR
       ======================================================= */

    const sidebar =
      create(
        "aside",
        "fc-sidebar",
        document.body
      );

    sidebar.id =
      "fcCustomSidebar";

    sidebar.innerHTML = `

      <div class="fc-sidebar-brand">

        <div class="fc-sidebar-logo">
          FC
        </div>

        <div>

          <div class="fc-sidebar-title">
            FriendChat
          </div>

          <div class="fc-sidebar-sub">
            Your private space
          </div>

        </div>

      </div>


      <button
        class="fc-nav-item active"
        data-nav="chats"
        type="button"
      >
        <span class="fc-nav-icon">💬</span>
        Chats
      </button>


      <button
        class="fc-nav-item"
        data-nav="friends"
        type="button"
      >
        <span class="fc-nav-icon">👥</span>
        Friends
      </button>


      <button
        class="fc-nav-item"
        data-nav="music"
        type="button"
      >
        <span class="fc-nav-icon">🎵</span>
        Music
      </button>


      <div class="fc-nav-divider"></div>


      <button
        class="fc-nav-item fc-nav-theme"
        data-nav="theme"
        type="button"
      >
        <span class="fc-nav-icon">🎨</span>
        Change theme
      </button>


      <button
        class="fc-nav-item"
        data-nav="settings"
        type="button"
      >
        <span class="fc-nav-icon">⚙️</span>
        Settings
      </button>


      <button
        class="fc-nav-item"
        data-nav="profile"
        type="button"
      >
        <span class="fc-nav-icon">👤</span>
        Profile
      </button>

    `;


    /* =======================================================
       ARROW OPEN/CLOSE
       ======================================================= */

    toggle.addEventListener(
      "click",
      () => {

        const open =
          sidebar.classList.toggle("open");

        toggle.classList.toggle(
          "is-open",
          open
        );

        toggle.title =
          open
            ? "Close navigation"
            : "Open navigation";

      }
    );


    /* =======================================================
       SIDEBAR BUTTONS
       ======================================================= */

    sidebar
      .querySelectorAll(".fc-nav-item")
      .forEach(btn => {

        btn.addEventListener(
          "click",
          event => {

            event.preventDefault();
            event.stopPropagation();

            const action =
              btn.dataset.nav;


            if (action === "chats") {
              goHome();
            }


            if (action === "friends") {
              goHome();
            }


            if (action === "music") {

              if (
                typeof window.openSpotifyPanel ===
                "function"
              ) {

                window.openSpotifyPanel();

              } else if (
                typeof window.toggleSpotifyPanel ===
                "function"
              ) {

                window.toggleSpotifyPanel();

              }

            }


            if (action === "profile") {

              if (
                typeof window.showProfile ===
                "function"
              ) {

                window.showProfile();

              }

            }


            /* =================================================
               THEME
               ================================================= */

            if (action === "theme") {

              /*
                 IMPORTANT:
                 Open the theme panel FIRST.
              */

              addThemePanel();

              openThemePanel();

              return;
            }


            /*
               Settings currently opens theme panel.
               Change this later if you add a real settings page.
            */

            if (action === "settings") {

              addThemePanel();

              openThemePanel();

              return;
            }


            sidebar.classList.remove("open");

            toggle.classList.remove("is-open");

          }
        );

      });


    addBottomDock();

    addDiscovery();

    addThemePanel();

    hideOldSpotifyButton();

    applySavedTheme();

    setupVisibility();

  }


  /* =========================================================
     HOME
     ========================================================= */

  function goHome() {

    try {

      if (
        typeof window.showHome ===
        "function"
      ) {

        window.showHome();

      }

    } catch (e) {

      console.warn(
        "FriendChat showHome failed:",
        e
      );

    }


    document
      .querySelectorAll(".screen")
      .forEach(
        screen =>
          screen.classList.add("hidden")
      );


    const home = $("homeScreen");

    if (home) {
      home.classList.remove("hidden");
    }


    const chat = $("chatScreen");

    if (chat) {
      chat.classList.add("hidden");
    }


    const add = $("addScreen");

    if (add) {
      add.classList.add("hidden");
    }


    const profile = $("profileScreen");

    if (profile) {
      profile.classList.add("hidden");
    }


    closeDiscovery();

    closeThemePanel();


    document.body.classList.remove(
      "fc-chat-open"
    );


    const sidebar =
      $("fcCustomSidebar");

    const toggle =
      $("fcNavToggle");


    if (sidebar) {
      sidebar.classList.remove("open");
    }


    if (toggle) {
      toggle.classList.remove("is-open");
    }

  }


  /* =========================================================
     BOTTOM DOCK
     ========================================================= */

  function addBottomDock() {

    if (
      document.querySelector(
        ".fc-bottom-dock"
      )
    ) {
      return;
    }


    const dock =
      create(
        "div",
        "fc-bottom-dock",
        document.body
      );


    const chats =
      create(
        "button",
        "fc-dock-btn",
        dock
      );

    chats.type = "button";

    chats.title = "Chats";

    chats.innerHTML =
      '<span>💬</span><span>Chats</span>';

    chats.onclick = () => {
      goHome();
    };


    const center =
      create(
        "button",
        "fc-dock-btn fc-dock-center",
        dock
      );

    center.type = "button";

    center.title =
      "Discover FriendChat users";

    center.innerHTML =
      '<span>FC</span><span>Suggestions</span>';

    center.onclick = () => {
      toggleDiscovery();
    };


    const profile =
      create(
        "button",
        "fc-dock-btn",
        dock
      );

    profile.type = "button";

    profile.title = "Profile";

    profile.innerHTML =
      '<span>👤</span><span>Profile</span>';

    profile.onclick = () => {

      if (
        typeof window.showProfile ===
        "function"
      ) {

        window.showProfile();

      }

    };

  }


  /* =========================================================
     DISCOVERY
     ========================================================= */

  function addDiscovery() {

    if ($("fcDiscovery")) {
      return;
    }


    const overlay =
      create(
        "div",
        "fc-overlay",
        document.body
      );

    overlay.id =
      "fcDiscoveryOverlay";


    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target === overlay
        ) {

          closeDiscovery();

        }

      }
    );


    const panel =
      create(
        "section",
        "fc-discovery",
        document.body
      );

    panel.id =
      "fcDiscovery";


    panel.innerHTML = `

      <div class="fc-discovery-head">

        <div>

          <strong>
            Discover people
          </strong>

          <div class="fc-sidebar-sub">
            Everyone currently known to FriendChat
          </div>

        </div>


        <button
          class="fc-dock-btn"
          data-close
          type="button"
        >
          ×
        </button>

      </div>


      <div
        class="fc-discovery-list"
        id="fcDiscoveryList"
      ></div>

    `;


    const closeButton =
      panel.querySelector(
        "[data-close]"
      );


    if (closeButton) {

      closeButton.onclick =
        closeDiscovery;

    }

  }


  function toggleDiscovery() {

    const panel =
      $("fcDiscovery");

    const overlay =
      $("fcDiscoveryOverlay");


    if (!panel || !overlay) {
      return;
    }


    if (
      panel.classList.contains("open")
    ) {

      closeDiscovery();

    } else {

      renderDiscovery();

      panel.classList.add("open");

      overlay.classList.add("open");

    }

  }


  function closeDiscovery() {

    $("fcDiscovery")
      ?.classList.remove("open");

    $("fcDiscoveryOverlay")
      ?.classList.remove("open");

  }


  function renderDiscovery() {

    const list =
      $("fcDiscoveryList");


    if (!list) {
      return;
    }


    const friendSource =
      Array.isArray(window.friends)
        ? window.friends
        : [];


    const presence =
      window.friendChatPresence || {};


    const map =
      new Map();


    friendSource.forEach(user => {

      map.set(
        String(user.id || "").toUpperCase(),
        user
      );

    });


    Object.keys(presence).forEach(id => {

      const key =
        String(id).toUpperCase();


      if (!map.has(key)) {

        map.set(
          key,
          {
            id: key,
            name: key
          }
        );

      }

    });


    const source =
      [...map.values()].filter(user => {

        const myId =
          window.currentUser?.id;


        return (
          !myId ||
          String(user.id).toUpperCase() !==
          String(myId).toUpperCase()
        );

      });


    if (!source.length) {

      list.innerHTML = `

        <div
          style="
            padding:24px;
            text-align:center;
            color:var(--fc-muted);
          "
        >
          No users available yet.
        </div>

      `;

      return;
    }


    list.innerHTML = "";


    source.forEach(user => {

      const row =
        create(
          "div",
          "fc-user-suggestion",
          list
        );


      const avatar =
        create(
          "div",
          "fc-user-avatar",
          row
        );


      avatar.textContent =
        (
          user.name || "?"
        )
          .charAt(0)
          .toUpperCase();


      const info =
        create(
          "div",
          "fc-user-info",
          row
        );


      info.innerHTML = `

        <div class="fc-user-name">
          ${esc(user.name || "Unknown")}
        </div>

        <div class="fc-user-id">
          ${esc(user.id || "")}
        </div>

      `;


      const add =
        create(
          "button",
          "fc-user-add",
          row
        );


      add.type = "button";

      add.textContent = "Chat";


      add.onclick = () => {

        if (
          typeof window.openChat ===
          "function"
        ) {

          window.openChat(user);

        }

        closeDiscovery();

      };

    });

  }


  /* =========================================================
     THEME PANEL
     ========================================================= */

  function addThemePanel() {

    if (
      $("fcThemePanel") &&
      $("fcThemeOverlay")
    ) {
      return;
    }


    /* -------------------------------------------------------
       REMOVE BROKEN OLD PANEL IF ONE EXISTS
       ------------------------------------------------------- */

    $("fcThemePanel")?.remove();

    $("fcThemeOverlay")?.remove();


    /* -------------------------------------------------------
       OVERLAY
       ------------------------------------------------------- */

    const overlay =
      create(
        "div",
        "fc-overlay",
        document.body
      );

    overlay.id =
      "fcThemeOverlay";


    /* IMPORTANT:
       clicking the dark background closes it,
       clicking the panel does NOT.
    */

    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target === overlay
        ) {

          closeThemePanel();

        }

      }
    );


    /* -------------------------------------------------------
       PANEL
       ------------------------------------------------------- */

    const panel =
      create(
        "section",
        "fc-theme-panel",
        document.body
      );

    panel.id =
      "fcThemePanel";


    panel.innerHTML = `

      <div class="fc-theme-head">

        <div>

          <strong>
            Customize FriendChat
          </strong>

          <div class="fc-sidebar-sub">
            Choose your FriendChat theme
          </div>

        </div>


        <button
          class="fc-dock-btn"
          data-close
          type="button"
          aria-label="Close themes"
        >
          ×
        </button>

      </div>


      <div class="fc-theme-body">

        <div
          class="fc-theme-grid"
          id="fcThemeGrid"
        ></div>

      </div>

    `;


    const closeButton =
      panel.querySelector(
        "[data-close]"
      );


    if (closeButton) {

      closeButton.addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();

          closeThemePanel();

        }
      );

    }


    const grid =
      panel.querySelector(
        "#fcThemeGrid"
      );


    if (!grid) {
      return;
    }


    Object.entries(themes).forEach(
      ([key, theme]) => {

        const button =
          create(
            "button",
            "fc-theme-choice",
            grid
          );


        button.type = "button";

        button.dataset.theme = key;


        button.innerHTML = `

          <div
            class="fc-theme-swatch"
            style="
              background:
                linear-gradient(
                  135deg,
                  ${theme.accent},
                  ${theme.accent2}
                );
            "
          ></div>


          <div class="fc-theme-name">
            ${theme.name}
          </div>


          <div class="fc-theme-desc">
            ${theme.desc}
          </div>

        `;


        button.addEventListener(
          "click",
          event => {

            event.preventDefault();

            event.stopPropagation();

            setTheme(key);

          }
        );

      }
    );

  }


  /* =========================================================
     OPEN THEME PANEL
     ========================================================= */

  function openThemePanel() {

    /*
       Make absolutely sure the panel exists.
    */

    if (
      !$("fcThemePanel") ||
      !$("fcThemeOverlay")
    ) {

      addThemePanel();

    }


    const overlay =
      $("fcThemeOverlay");

    const panel =
      $("fcThemePanel");


    if (!overlay || !panel) {

      console.error(
        "FriendChat: Theme panel could not be created."
      );

      return;

    }


    /*
       FORCE OPEN.
       This avoids conflicts with old CSS.
    */

    overlay.classList.add("open");

    panel.classList.add("open");


    overlay.style.setProperty(
      "display",
      "block",
      "important"
    );


    panel.style.setProperty(
      "display",
      "block",
      "important"
    );


    overlay.style.setProperty(
      "visibility",
      "visible",
      "important"
    );


    panel.style.setProperty(
      "visibility",
      "visible",
      "important"
    );


    overlay.style.setProperty(
      "opacity",
      "1",
      "important"
    );


    panel.style.setProperty(
      "opacity",
      "1",
      "important"
    );


    overlay.style.setProperty(
      "pointer-events",
      "auto",
      "important"
    );


    panel.style.setProperty(
      "pointer-events",
      "auto",
      "important"
    );


    /*
       Put theme panel above everything.
    */

    overlay.style.setProperty(
      "z-index",
      "2147483000",
      "important"
    );


    panel.style.setProperty(
      "z-index",
      "2147483001",
      "important"
    );


    /*
       Lock normal page scrolling.
       The theme overlay itself scrolls.
    */

    document.body.dataset.fcThemeWasOverflow =
      document.body.style.overflow || "";

    document.body.style.overflow = "hidden";


    /*
       Scroll to top when opened.
    */

    overlay.scrollTop = 0;

  }


  /* =========================================================
     CLOSE THEME PANEL
     ========================================================= */

  function closeThemePanel() {

    const overlay =
      $("fcThemeOverlay");

    const panel =
      $("fcThemePanel");


    if (overlay) {

      overlay.classList.remove("open");

      overlay.style.setProperty(
        "display",
        "none",
        "important"
      );

      overlay.style.setProperty(
        "pointer-events",
        "none",
        "important"
      );

    }


    if (panel) {

      panel.classList.remove("open");

      panel.style.setProperty(
        "display",
        "none",
        "important"
      );

      panel.style.setProperty(
        "pointer-events",
        "none",
        "important"
      );

    }


    if (
      document.body.dataset.fcThemeWasOverflow !==
      undefined
    ) {

      document.body.style.overflow =
        document.body.dataset.fcThemeWasOverflow;

      delete document.body.dataset.fcThemeWasOverflow;

    } else {

      document.body.style.removeProperty(
        "overflow"
      );

    }

  }


  /* =========================================================
     THEME APPLY
     ========================================================= */

  function setTheme(key) {

    const theme =
      themes[key];


    if (!theme) {
      return;
    }


    const root =
      document.documentElement;


    root.setAttribute(
      "data-fc-theme",
      key
    );


    root.style.setProperty(
      "--fc-bg",
      theme.bg
    );


    root.style.setProperty(
      "--fc-panel",
      theme.panel
    );


    root.style.setProperty(
      "--fc-panel-2",
      theme.panel2
    );


    root.style.setProperty(
      "--fc-accent",
      theme.accent
    );


    root.style.setProperty(
      "--fc-accent-2",
      theme.accent2
    );


    root.style.setProperty(
      "--fc-text",
      theme.text
    );


    root.style.setProperty(
      "--fc-muted",
      theme.muted
    );


    localStorage.setItem(
      "friendchat_theme",
      key
    );


    document
      .querySelectorAll(
        ".fc-theme-choice"
      )
      .forEach(button => {

        button.classList.toggle(
          "selected",
          button.dataset.theme === key
        );

      });

  }


  function applySavedTheme() {

    let saved =
      localStorage.getItem(
        "friendchat_theme"
      );


    if (!saved || !themes[saved]) {
      saved = "midnight";
    }


    setTheme(saved);

  }


  /* =========================================================
     ESC KEY
     ========================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeThemePanel();

        closeDiscovery();

      }

    }
  );


  /* =========================================================
     VISIBILITY
     ========================================================= */

  function setupVisibility() {

    const sync = () => {

      const login =
        $("loginScreen");

      const signup =
        $("signupScreen");


      const authenticated =
        !!(
          login &&
          login.classList.contains("hidden") &&
          (
            !signup ||
            signup.classList.contains("hidden")
          )
        );


      [
        "fcNavToggle",
        "fcCustomSidebar"
      ].forEach(id => {

        const el = $(id);

        if (!el) {
          return;
        }


        el.style.setProperty(
          "display",
          authenticated
            ? (
                id === "fcNavToggle"
                  ? "flex"
                  : "block"
              )
            : "none",
          "important"
        );


        el.style.setProperty(
          "visibility",
          authenticated
            ? "visible"
            : "hidden",
          "important"
        );


        el.style.setProperty(
          "opacity",
          authenticated
            ? "1"
            : "0",
          "important"
        );

      });


      const chatScreen =
        $("chatScreen");


      const chatOpen =
        !!(
          chatScreen &&
          !chatScreen.classList.contains(
            "hidden"
          )
        );


      document.body.classList.toggle(
        "fc-chat-open",
        chatOpen
      );


      document
        .querySelectorAll(
          ".fc-bottom-dock"
        )
        .forEach(el => {

          const showDock =
            authenticated &&
            !chatOpen;


          el.style.setProperty(
            "display",
            showDock
              ? "flex"
              : "none",
            "important"
          );


          el.style.setProperty(
            "visibility",
            showDock
              ? "visible"
              : "hidden",
            "important"
          );


          el.style.setProperty(
            "opacity",
            showDock
              ? "1"
              : "0",
            "important"
          );

        });

    };


    sync();


    const observer =
      new MutationObserver(
        sync
      );


    observer.observe(
      document.body,
      {
        subtree: true,
        attributes: true,
        attributeFilter: [
          "class"
        ]
      }
    );


    window.setInterval(
      sync,
      500
    );

  }


  /* =========================================================
     SPOTIFY CLEANUP
     ========================================================= */

  function hideOldSpotifyButton() {

    const hide = () => {

      document
        .querySelectorAll(
          ".spotify-side-button, .spotify-side-bar"
        )
        .forEach(
          element =>
            element.remove()
        );

    };


    hide();


    const timer =
      setInterval(
        hide,
        250
      );


    setTimeout(
      () => {
        clearInterval(timer);
      },
      15000
    );

  }


  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }


  /* =========================================================
     GLOBAL FUNCTIONS
     ========================================================= */

  /*
     These make the theme system available to your
     HTML and other FriendChat scripts.
  */

  window.openThemePanel =
    openThemePanel;

  window.closeThemePanel =
    closeThemePanel;

  window.changeTheme =
    openThemePanel;

  window.toggleTheme =
    openThemePanel;

})();
