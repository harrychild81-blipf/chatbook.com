/* =========================================================
   FRIENDCHAT CUSTOM UI v3
   COMPLETE VERSION
   - Left navigation arrow
   - Sliding sidebar
   - Bottom dock
   - Discovery
   - 12 themes
   - Theme persistence
   - Spotify button cleanup
   - Navigation visibility control
   ========================================================= */

(() => {

  "use strict";


  /* =========================================================
     THEMES
     ========================================================= */

  const themes = {

    midnight: {
      name: "Midnight",
      desc: "Dark blue and purple",
      bg: "#070a10",
      panel: "#0d121b",
      panel2: "#111827",
      accent: "#6c7cff",
      accent2: "#8b5cf6",
      text: "#ffffff",
      muted: "#9ca3af"
    },

    emerald: {
      name: "Emerald",
      desc: "Dark green glass",
      bg: "#06100d",
      panel: "#0c1713",
      panel2: "#10221a",
      accent: "#22c55e",
      accent2: "#14b8a6",
      text: "#ffffff",
      muted: "#9ca3af"
    },

    ocean: {
      name: "Ocean",
      desc: "Deep blue",
      bg: "#061019",
      panel: "#0b1722",
      panel2: "#102435",
      accent: "#22a6f2",
      accent2: "#6366f1",
      text: "#ffffff",
      muted: "#9ca3af"
    },

    sunset: {
      name: "Sunset",
      desc: "Warm orange glow",
      bg: "#120a08",
      panel: "#1b100d",
      panel2: "#291611",
      accent: "#ff7a45",
      accent2: "#ef4444",
      text: "#ffffff",
      muted: "#c0a8a2"
    },

    rose: {
      name: "Rose",
      desc: "Pink and violet",
      bg: "#100810",
      panel: "#190e19",
      panel2: "#281329",
      accent: "#ec4899",
      accent2: "#8b5cf6",
      text: "#ffffff",
      muted: "#c0a5bb"
    },

    graphite: {
      name: "Graphite",
      desc: "Minimal monochrome",
      bg: "#090909",
      panel: "#121212",
      panel2: "#1b1b1b",
      accent: "#d1d5db",
      accent2: "#6b7280",
      text: "#ffffff",
      muted: "#a1a1aa"
    },

    light: {
      name: "Light",
      desc: "Clean bright interface",
      bg: "#f4f6f8",
      panel: "#ffffff",
      panel2: "#eef1f5",
      accent: "#4f46e5",
      accent2: "#7c3aed",
      text: "#111827",
      muted: "#6b7280"
    },

    lavender: {
      name: "Lavender",
      desc: "Soft purple",
      bg: "#110d1c",
      panel: "#1b1429",
      panel2: "#251b38",
      accent: "#a78bfa",
      accent2: "#c084fc",
      text: "#ffffff",
      muted: "#b8abc9"
    },

    cyber: {
      name: "Cyber",
      desc: "Futuristic neon",
      bg: "#050509",
      panel: "#0b0b14",
      panel2: "#111122",
      accent: "#00f5ff",
      accent2: "#ff00c8",
      text: "#ffffff",
      muted: "#9292aa"
    },

    forest: {
      name: "Forest",
      desc: "Deep natural green",
      bg: "#07110a",
      panel: "#0d1c11",
      panel2: "#142719",
      accent: "#84cc16",
      accent2: "#22c55e",
      text: "#ffffff",
      muted: "#9eb09f"
    },

    cherry: {
      name: "Cherry",
      desc: "Deep red and pink",
      bg: "#110609",
      panel: "#1c0b10",
      panel2: "#2a1017",
      accent: "#f43f5e",
      accent2: "#fb7185",
      text: "#ffffff",
      muted: "#c49da5"
    },

    amoled: {
      name: "AMOLED",
      desc: "Pure black",
      bg: "#000000",
      panel: "#000000",
      panel2: "#0a0a0a",
      accent: "#ffffff",
      accent2: "#737373",
      text: "#ffffff",
      muted: "#8b8b8b"
    }

  };


  /* =========================================================
     HELPERS
     ========================================================= */

  const $ = id =>
    document.getElementById(id);


  const esc = s =>
    String(s ?? "").replace(
      /[&<>"']/g,
      m =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[m])
    );


  function create(tag, cls, parent) {

    const e =
      document.createElement(tag);

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


    const style =
      document.createElement("style");

    style.id =
      "friendchat-theme-guaranteed-style";


    style.textContent = `

      /* =====================================================
         FRIENDCHAT THEME VARIABLES
         ===================================================== */

      :root {

        --fc-bg: #070a10;
        --fc-panel: #0d121b;
        --fc-panel-2: #111827;
        --fc-accent: #6c7cff;
        --fc-accent-2: #8b5cf6;
        --fc-text: #ffffff;
        --fc-muted: #9ca3af;

      }


      /* =====================================================
         MAIN BACKGROUND
         ===================================================== */

      body {

        background:
          var(--fc-bg) !important;

        color:
          var(--fc-text);

      }


      .app {

        background:
          var(--fc-bg) !important;

        color:
          var(--fc-text);

      }


      .screen {

        background:
          var(--fc-bg);

        color:
          var(--fc-text);

      }


      /* =====================================================
         COMMON PANELS
         ===================================================== */

      .card,
      .panel,
      .modal,
      .profile-card,
      .friend-card,
      .chat-card,
      .settings-card {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;

        border-color:
          color-mix(
            in srgb,
            var(--fc-accent) 20%,
            transparent
          ) !important;

      }


      /* =====================================================
         INPUTS
         ===================================================== */

      input,
      textarea,
      select {

        background:
          var(--fc-panel-2) !important;

        color:
          var(--fc-text) !important;

        border-color:
          rgba(255,255,255,.12) !important;

      }


      input::placeholder,
      textarea::placeholder {

        color:
          var(--fc-muted) !important;

      }


      input:focus,
      textarea:focus,
      select:focus {

        border-color:
          var(--fc-accent) !important;

        box-shadow:
          0 0 0 2px
          color-mix(
            in srgb,
            var(--fc-accent) 15%,
            transparent
          ) !important;

      }


      /* =====================================================
         COMMON BUTTONS
         ===================================================== */

      button {

        --button-accent:
          var(--fc-accent);

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

        color:
          #fff !important;

      }


      /* =====================================================
         LEFT SIDEBAR
         ===================================================== */

      #fcCustomSidebar {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;

        border:
          1px solid
          rgba(255,255,255,.10) !important;

        box-shadow:
          8px 0 35px
          rgba(0,0,0,.45) !important;

      }


      .fc-sidebar-logo {

        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;

        color:
          #fff !important;

      }


      .fc-sidebar-title {

        color:
          var(--fc-text) !important;

      }


      .fc-sidebar-sub {

        color:
          var(--fc-muted) !important;

      }


      .fc-nav-item {

        color:
          var(--fc-text) !important;

      }


      .fc-nav-item:hover {

        background:
          color-mix(
            in srgb,
            var(--fc-accent) 12%,
            transparent
          ) !important;

      }


      .fc-nav-item.active {

        background:
          color-mix(
            in srgb,
            var(--fc-accent) 18%,
            transparent
          ) !important;

        color:
          var(--fc-accent) !important;

      }


      /* =====================================================
         ARROW
         ===================================================== */

      #fcNavToggle {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;

        border:
          1px solid
          rgba(255,255,255,.10) !important;

      }


      #fcNavToggle:hover {

        background:
          color-mix(
            in srgb,
            var(--fc-accent) 18%,
            var(--fc-panel)
          ) !important;

      }


      /* =====================================================
         BOTTOM DOCK
         ===================================================== */

      .fc-bottom-dock {

        background:
          var(--fc-panel) !important;

        border-color:
          rgba(255,255,255,.12) !important;

      }


      .fc-bottom-dock
      .fc-dock-btn {

        color:
          var(--fc-text) !important;

      }


      .fc-bottom-dock
      .fc-dock-btn:hover {

        background:
          color-mix(
            in srgb,
            var(--fc-accent) 12%,
            transparent
          ) !important;

      }


      .fc-bottom-dock
      .fc-dock-center {

        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;

      }


      /* =====================================================
         DISCOVERY
         ===================================================== */

      .fc-discovery {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;

        border-color:
          rgba(255,255,255,.10) !important;

      }


      .fc-user-suggestion {

        background:
          var(--fc-panel-2) !important;

        color:
          var(--fc-text) !important;

      }


      .fc-user-suggestion:hover {

        border-color:
          color-mix(
            in srgb,
            var(--fc-accent) 45%,
            transparent
          ) !important;

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

        color:
          var(--fc-text) !important;

      }


      .fc-user-id {

        color:
          var(--fc-muted) !important;

      }


      .fc-user-add {

        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;

        color:
          #fff !important;

      }


      /* =====================================================
         THEME PANEL
         ===================================================== */

      .fc-theme-panel {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;

        border-color:
          rgba(255,255,255,.12) !important;

      }


      .fc-theme-choice {

        background:
          var(--fc-panel-2) !important;

        color:
          var(--fc-text) !important;

        border:
          1px solid
          rgba(255,255,255,.08) !important;

      }


      .fc-theme-choice:hover {

        border-color:
          var(--fc-accent) !important;

        transform:
          translateY(-2px);

      }


      .fc-theme-name {

        color:
          var(--fc-text) !important;

      }


      .fc-theme-desc {

        color:
          var(--fc-muted) !important;

      }


      /* =====================================================
         THEME PANEL ANIMATION
         ===================================================== */

      .fc-theme-choice {

        transition:
          transform .18s ease,
          border-color .18s ease,
          background .18s ease;

      }


      /* =====================================================
         LIGHT THEME SPECIAL TEXT
         ===================================================== */

      html[data-fc-theme="light"] {

        color-scheme:
          light;

      }


      html[data-fc-theme="light"] body,
      html[data-fc-theme="light"] .app,
      html[data-fc-theme="light"] .screen {

        color:
          #111827 !important;

      }


      html[data-fc-theme="light"]
      .fc-bottom-dock {

        box-shadow:
          0 8px 30px
          rgba(0,0,0,.16) !important;

      }


      /* =====================================================
         AMOLED
         ===================================================== */

      html[data-fc-theme="amoled"]
      body,
      html[data-fc-theme="amoled"]
      .app,
      html[data-fc-theme="amoled"]
      .screen {

        background:
          #000 !important;

      }


      html[data-fc-theme="amoled"]
      #fcCustomSidebar,
      html[data-fc-theme="amoled"]
      .fc-bottom-dock {

        background:
          #000 !important;

        border-color:
          #222 !important;

      }


      /* =====================================================
         MOBILE THEME PANEL
         ===================================================== */

      @media(max-width:600px) {

        .fc-theme-panel {

          width:
            calc(100vw - 24px) !important;

          max-width:
            420px !important;

        }

        .fc-theme-grid {

          grid-template-columns:
            repeat(2, minmax(0,1fr)) !important;

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


    const style =
      document.createElement("style");

    style.id =
      "friendchat-nav-guaranteed-style";


    style.textContent = `

      /* =====================================================
         LEFT ARROW
         ===================================================== */

      #fcNavToggle {

        position: fixed !important;

        left: 0 !important;

        top: 50% !important;

        transform:
          translateY(-50%) !important;

        z-index:
          2147483646 !important;

        width:
          28px !important;

        height:
          48px !important;

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          center !important;

        padding:
          0 !important;

        margin:
          0 !important;

        border:
          0 !important;

        border-radius:
          0 14px 14px 0 !important;

        background:
          rgba(20,25,38,.97) !important;

        color:
          #fff !important;

        cursor:
          pointer !important;

        visibility:
          visible !important;

        box-shadow:
          3px 0 12px
          rgba(0,0,0,.25) !important;

        transition:
          left .22s ease,
          background .18s ease !important;

      }


      #fcNavToggle:hover {

        background:
          rgba(35,42,60,.99) !important;

      }


      #fcNavToggle.is-open {

        left:
          185px !important;

        border-radius:
          0 14px 14px 0 !important;

      }


      #fcNavToggle .fc-chevron {

        font-size:
          24px !important;

        line-height:
          1 !important;

        display:
          block !important;

        transition:
          transform .22s ease !important;

      }


      #fcNavToggle.is-open
      .fc-chevron {

        transform:
          rotate(180deg) !important;

      }


      /* =====================================================
         SIDEBAR
         ===================================================== */

      #fcCustomSidebar {

        position: fixed !important;

        left: 0 !important;

        top: 50% !important;

        transform:
          translateY(-50%)
          translateX(-110%) !important;

        width:
          185px !important;

        z-index:
          2147483645 !important;

        box-sizing:
          border-box !important;

        transition:
          transform .22s ease !important;

      }


      #fcCustomSidebar.open {

        transform:
          translateY(-50%)
          translateX(0) !important;

      }


      /* =====================================================
         BOTTOM DOCK
         ===================================================== */

      .fc-bottom-dock {

        position: fixed !important;

        left: 50% !important;

        right: auto !important;

        top: auto !important;

        bottom: 10px !important;

        transform:
          translateX(-50%) !important;

        width:
          150px !important;

        min-width:
          150px !important;

        max-width:
          150px !important;

        height:
          44px !important;

        min-height:
          44px !important;

        max-height:
          44px !important;

        padding:
          3px 5px !important;

        margin:
          0 !important;

        box-sizing:
          border-box !important;

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          space-between !important;

        gap:
          2px !important;

        border-radius:
          14px !important;

        background:
          rgba(10,14,22,.98) !important;

        border:
          1px solid
          rgba(255,255,255,.14) !important;

        box-shadow:
          0 8px 25px
          rgba(0,0,0,.45) !important;

        z-index:
          2147483647 !important;

      }


      .fc-bottom-dock
      .fc-dock-btn {

        flex:
          0 0 38px !important;

        width:
          38px !important;

        min-width:
          38px !important;

        max-width:
          38px !important;

        height:
          38px !important;

        min-height:
          38px !important;

        max-height:
          38px !important;

        padding:
          0 !important;

        margin:
          0 !important;

        border:
          0 !important;

        border-radius:
          10px !important;

        background:
          transparent !important;

        color:
          #fff !important;

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          center !important;

        cursor:
          pointer !important;

        box-sizing:
          border-box !important;

      }


      /* =====================================================
         DOCK ICONS
         ===================================================== */

      .fc-bottom-dock
      .fc-dock-btn span:first-child {

        display:
          block !important;

        font-size:
          18px !important;

        line-height:
          1 !important;

      }


      .fc-bottom-dock
      .fc-dock-btn
      span:last-child {

        display:
          none !important;

      }


      /* =====================================================
         FC CENTER
         ===================================================== */

      .fc-bottom-dock
      .fc-dock-center {

        flex:
          0 0 38px !important;

        width:
          38px !important;

        min-width:
          38px !important;

        max-width:
          38px !important;

        height:
          38px !important;

        min-height:
          38px !important;

        max-height:
          38px !important;

        border-radius:
          10px !important;

        background:
          linear-gradient(
            135deg,
            var(--fc-accent),
            var(--fc-accent-2)
          ) !important;

        color:
          #fff !important;

        box-shadow:
          0 4px 14px
          rgba(110,80,240,.35) !important;

      }


      .fc-bottom-dock
      .fc-dock-center
      span:first-child {

        display:
          block !important;

        font-size:
          14px !important;

        font-weight:
          900 !important;

      }


      .fc-bottom-dock
      .fc-dock-btn:not(.fc-dock-center):hover {

        background:
          rgba(255,255,255,.08) !important;

      }


      .fc-bottom-dock
      .fc-dock-center:hover {

        transform:
          scale(1.04) !important;

      }


      /* =====================================================
         CHAT OPEN
         ===================================================== */

      body.fc-chat-open
      .fc-bottom-dock {

        display:
          none !important;

        visibility:
          hidden !important;

        opacity:
          0 !important;

        pointer-events:
          none !important;

      }


      /* =====================================================
         OLD NAVIGATION
         ===================================================== */

      #bottomNav {

        display:
          none !important;

      }


      /* =====================================================
         MOBILE
         ===================================================== */

      @media(max-width:600px) {

        #fcNavToggle {

          left:
            0 !important;

          width:
            24px !important;

          height:
            44px !important;

          border-radius:
            0 12px 12px 0 !important;

        }


        #fcNavToggle.is-open {

          left:
            178px !important;

        }


        #fcCustomSidebar {

          width:
            178px !important;

          left:
            0 !important;

        }


        .fc-bottom-dock {

          width:
            140px !important;

          min-width:
            140px !important;

          max-width:
            140px !important;

          height:
            42px !important;

          min-height:
            42px !important;

          max-height:
            42px !important;

          bottom:
            8px !important;

        }


        .fc-bottom-dock
        .fc-dock-btn,

        .fc-bottom-dock
        .fc-dock-center {

          flex-basis:
            36px !important;

          width:
            36px !important;

          min-width:
            36px !important;

          max-width:
            36px !important;

          height:
            36px !important;

          min-height:
            36px !important;

          max-height:
            36px !important;

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


    /* Prevent duplicate navigation */

    if ($("fcCustomSidebar")) {

      setupVisibility();

      return;

    }


    /* =======================================================
       LEFT NAVIGATION ARROW
       ======================================================= */

    const toggle =
      create(
        "button",
        "fc-nav-toggle",
        document.body
      );


    toggle.id =
      "fcNavToggle";


    toggle.title =
      "Open navigation";


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

        <span class="fc-nav-icon">
          💬
        </span>

        Chats

      </button>


      <button
        class="fc-nav-item"
        data-nav="friends"
        type="button"
      >

        <span class="fc-nav-icon">
          👥
        </span>

        Friends

      </button>


      <button
        class="fc-nav-item"
        data-nav="music"
        type="button"
      >

        <span class="fc-nav-icon">
          🎵
        </span>

        Music

      </button>


      <div class="fc-nav-divider"></div>


      <button
        class="fc-nav-item fc-nav-theme"
        data-nav="theme"
        type="button"
      >

        <span class="fc-nav-icon">
          🎨
        </span>

        Change theme

      </button>


      <button
        class="fc-nav-item"
        data-nav="settings"
        type="button"
      >

        <span class="fc-nav-icon">
          ⚙️
        </span>

        Settings

      </button>


      <button
        class="fc-nav-item"
        data-nav="profile"
        type="button"
      >

        <span class="fc-nav-icon">
          👤
        </span>

        Profile

      </button>

    `;


    /* =======================================================
       OPEN / CLOSE SIDEBAR
       ======================================================= */

    toggle.addEventListener(
      "click",
      () => {

        const open =
          sidebar.classList.toggle(
            "open"
          );


        toggle.classList.toggle(
          "is-open",
          open
        );


        toggle.title =
          open
            ? "Close navigation"
            : "Open navigation";


        toggle.setAttribute(
          "aria-label",
          open
            ? "Close navigation"
            : "Open navigation"
        );

      }
    );


    /* =======================================================
       SIDEBAR BUTTONS
       ======================================================= */

    sidebar
      .querySelectorAll(
        ".fc-nav-item"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () => {

            const action =
              btn.dataset.nav;


            /* CHATS */

            if (
              action === "chats"
            ) {

              goHome();

            }


            /* FRIENDS */

            if (
              action === "friends"
            ) {

              goHome();

            }


            /* MUSIC */

            if (
              action === "music"
            ) {

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


            /* PROFILE */

            if (
              action === "profile"
            ) {

              if (
                typeof showProfile ===
                "function"
              ) {

                showProfile();

              }

            }


            /* THEME */

            if (
              action === "theme"
            ) {

              openThemePanel();

            }


            /* SETTINGS */

            if (
              action === "settings"
            ) {

              openThemePanel();

            }


            sidebar.classList.remove(
              "open"
            );


            toggle.classList.remove(
              "is-open"
            );


            toggle.title =
              "Open navigation";


            toggle.setAttribute(
              "aria-label",
              "Open navigation"
            );

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
     SAFE HOME NAVIGATION
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


    const screens =
      document.querySelectorAll(
        ".screen"
      );


    screens.forEach(
      screen =>
        screen.classList.add(
          "hidden"
        )
    );


    const home =
      $("homeScreen");


    if (home) {

      home.classList.remove(
        "hidden"
      );

    }


    const chat =
      $("chatScreen");


    if (chat) {

      chat.classList.add(
        "hidden"
      );

    }


    const add =
      $("addScreen");


    if (add) {

      add.classList.add(
        "hidden"
      );

    }


    const profile =
      $("profileScreen");


    if (profile) {

      profile.classList.add(
        "hidden"
      );

    }


    closeDiscovery();

    closeThemePanel();


    const dock =
      document.querySelector(
        ".fc-bottom-dock"
      );


    if (dock) {

      dock.style.setProperty(
        "display",
        "flex",
        "important"
      );


      dock.style.setProperty(
        "visibility",
        "visible",
        "important"
      );


      dock.style.setProperty(
        "opacity",
        "1",
        "important"
      );

    }


    const sidebar =
      $("fcCustomSidebar");


    const toggle =
      $("fcNavToggle");


    if (sidebar) {

      sidebar.classList.remove(
        "open"
      );

    }


    if (toggle) {

      toggle.classList.remove(
        "is-open"
      );

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


    /* CHATS */

    const chats =
      create(
        "button",
        "fc-dock-btn",
        dock
      );


    chats.type =
      "button";


    chats.title =
      "Chats";


    chats.innerHTML =
      '<span>💬</span><span>Chats</span>';


    chats.onclick =
      () => {

        goHome();

      };


    /* FC DISCOVER */

    const center =
      create(
        "button",
        "fc-dock-btn fc-dock-center",
        dock
      );


    center.type =
      "button";


    center.title =
      "Discover FriendChat users";


    center.innerHTML =
      '<span>FC</span><span>Suggestions</span>';


    center.onclick =
      () => {

        toggleDiscovery();

      };


    /* PROFILE */

    const profile =
      create(
        "button",
        "fc-dock-btn",
        dock
      );


    profile.type =
      "button";


    profile.title =
      "Profile";


    profile.innerHTML =
      '<span>👤</span><span>Profile</span>';


    profile.onclick =
      () => {

        if (
          typeof showProfile ===
          "function"
        ) {

          showProfile();

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


    overlay.onclick =
      () => {

        closeDiscovery();

      };


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
        () => {

          closeDiscovery();

        };

    }

  }


  function toggleDiscovery() {

    const p =
      $("fcDiscovery");


    const o =
      $("fcDiscoveryOverlay");


    if (!p || !o) {
      return;
    }


    if (
      p.classList.contains(
        "open"
      )
    ) {

      closeDiscovery();

    } else {

      renderDiscovery();


      p.classList.add(
        "open"
      );


      o.classList.add(
        "open"
      );

    }

  }


  function closeDiscovery() {

    $("fcDiscovery")
      ?.classList.remove(
        "open"
      );


    $("fcDiscoveryOverlay")
      ?.classList.remove(
        "open"
      );

  }


  function renderDiscovery() {

    const list =
      $("fcDiscoveryList");


    if (!list) {
      return;
    }


    const friendSource =
      Array.isArray(
        window.friends
      )
        ? window.friends
        : [];


    const presence =
      window.friendChatPresence ||
      {};


    const map =
      new Map();


    friendSource.forEach(
      user => {

        map.set(
          String(
            user.id || ""
          ).toUpperCase(),
          user
        );

      }
    );


    Object.keys(
      presence
    ).forEach(
      id => {

        const key =
          String(id)
            .toUpperCase();


        if (
          !map.has(key)
        ) {

          map.set(
            key,
            {
              id: key,
              name: key
            }
          );

        }

      }
    );


    const source =
      [...map.values()]
        .filter(
          user => {

            const myId =
              window.currentUser?.id;


            return (
              !myId ||
              String(
                user.id
              ).toUpperCase() !==
              String(
                myId
              ).toUpperCase()
            );

          }
        );


    if (
      !source.length
    ) {

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


    list.innerHTML =
      "";


    source.forEach(
      user => {

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
            user.name ||
            "?"
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

            ${esc(
              user.name ||
              "Unknown"
            )}

          </div>


          <div class="fc-user-id">

            ${esc(
              user.id ||
              ""
            )}

          </div>

        `;


        const add =
          create(
            "button",
            "fc-user-add",
            row
          );


        add.type =
          "button";


        add.textContent =
          "Chat";


        add.onclick =
          () => {

            if (
              typeof openChat ===
              "function"
            ) {

              openChat(
                user
              );

            }

            closeDiscovery();

          };

      }
    );

  }


  /* =========================================================
     THEME PANEL
     ========================================================= */

  function addThemePanel() {

    if ($("fcThemePanel")) {
      return;
    }


    const overlay =
      create(
        "div",
        "fc-overlay",
        document.body
      );


    overlay.id =
      "fcThemeOverlay";


    overlay.onclick =
      () => {

        closeThemePanel();

      };


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

      closeButton.onclick =
        () => {

          closeThemePanel();

        };

    }


    const grid =
      panel.querySelector(
        "#fcThemeGrid"
      );


    if (!grid) {
      return;
    }


    Object.entries(
      themes
    ).forEach(
      ([key, theme]) => {

        const button =
          create(
            "button",
            "fc-theme-choice",
            grid
          );


        button.type =
          "button";


        button.dataset.theme =
          key;


        button.innerHTML = `

          <div
            class="fc-theme-swatch"
            style="
              background:
                linear-gradient(
                  135deg,
                  ${theme.accent},
                  ${theme.accent2}
                )
            "
          ></div>


          <div class="fc-theme-name">
            ${theme.name}
          </div>


          <div class="fc-theme-desc">
            ${theme.desc}
          </div>

        `;


        button.onclick =
          () => {

            setTheme(
              key
            );

          };

      }
    );

  }


  function openThemePanel() {

    $("fcThemePanel")
      ?.classList.add(
        "open"
      );


    $("fcThemeOverlay")
      ?.classList.add(
        "open"
      );

  }


  function closeThemePanel() {

    $("fcThemePanel")
      ?.classList.remove(
        "open"
      );


    $("fcThemeOverlay")
      ?.classList.remove(
        "open"
      );

  }


  /* =========================================================
     APPLY THEME
     ========================================================= */

  function setTheme(key) {

    const theme =
      themes[key];


    if (!theme) {
      return;
    }


    const root =
      document.documentElement;


    /* Theme attribute */

    root.setAttribute(
      "data-fc-theme",
      key
    );


    /* CSS variables */

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


    /* Save */

    localStorage.setItem(
      "friendchat_theme",
      key
    );


    /* Highlight selected theme */

    document
      .querySelectorAll(
        ".fc-theme-choice"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "selected",
            button.dataset.theme === key
          );

        }
      );

  }


  function applySavedTheme() {

    const saved =
      localStorage.getItem(
        "friendchat_theme"
      ) ||
      "midnight";


    setTheme(
      themes[saved]
        ? saved
        : "midnight"
    );

  }


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
          login.classList.contains(
            "hidden"
          ) &&
          (
            !signup ||
            signup.classList.contains(
              "hidden"
            )
          )
        );


      /* =====================================================
         LEFT NAV
         ===================================================== */

      [
        "fcNavToggle",
        "fcCustomSidebar"
      ].forEach(
        id => {

          const el =
            $(id);


          if (!el) {
            return;
          }


          el.style.setProperty(
            "display",
            authenticated
              ? "flex"
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

        }
      );


      /* =====================================================
         CHAT STATUS
         ===================================================== */

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


      /* =====================================================
         BOTTOM DOCK
         ===================================================== */

      document
        .querySelectorAll(
          ".fc-bottom-dock"
        )
        .forEach(
          el => {

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

          }
        );

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
     REMOVE OLD SPOTIFY BUTTONS
     ========================================================= */

  function hideOldSpotifyButton() {

    const hide =
      () => {

        document
          .querySelectorAll(
            ".spotify-side-button,"
            + ".spotify-side-bar"
          )
          .forEach(
            e =>
              e.remove()
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

        clearInterval(
          timer
        );

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

})();
