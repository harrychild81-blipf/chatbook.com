/* =========================================================
   FRIENDCHAT CUSTOM UI v5.1
   COMPLETE FIXED VERSION

   FIXES:
   - Left navigation arrow
   - Sliding sidebar
   - Bottom dock
   - Discovery
   - Theme system
   - Theme persistence
   - Theme button always works
   - Theme window always created
   - Theme window scroll FIXED
   - 20 themes
   - Theme above sidebar/dock
   - Spotify cleanup
   - Navigation visibility
   - Existing sidebar does not break initialization
   - MutationObserver loop FIXED
   - Duplicate listeners FIXED
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     20 THEMES
     ========================================================= */

  const themes = {

    midnight: {
      name: "🌌 Midnight Blue",
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
      name: "🟣 Purple Neon",
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
      name: "🔵 Ocean",
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
      name: "🌲 Forest",
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
      name: "🌸 Cherry Blossom",
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
      name: "🔥 Crimson",
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
      name: "🌅 Sunset",
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
      name: "🧊 Arctic",
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
      name: "🟢 Cyber Green",
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
      name: "🟡 Golden",
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
      name: "🩷 Cyber Pink",
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
      name: "🖤 Pure Black",
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
      name: "🤍 Clean White",
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
      name: "🌌 Galaxy",
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
      name: "💜 Aurora",
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
      name: "🩵 Discord-style Blue",
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
      name: "🟠 Cyber Orange",
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
      name: "🩶 Graphite",
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
      name: "🧛 Dark Gothic",
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
      name: "💎 Glass Crystal",
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


  const esc = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char])
    );


  function create(tag, className, parent) {

    const element =
      document.createElement(tag);

    if (className) {
      element.className =
        className;
    }

    if (parent) {
      parent.appendChild(element);
    }

    return element;
  }


  /* =========================================================
     THEME CSS
     ========================================================= */

  function installThemeStyles() {

    let style =
      $("friendchat-theme-guaranteed-style");


    if (!style) {

      style =
        document.createElement("style");

      style.id =
        "friendchat-theme-guaranteed-style";

      document.head.appendChild(style);

    }


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


      html,
      body {

        background:
          var(--fc-bg) !important;

        color:
          var(--fc-text) !important;
      }


      body {

        margin: 0;
      }


      .app {

        background:
          var(--fc-bg) !important;

        color:
          var(--fc-text) !important;
      }


      .screen {

        background:
          var(--fc-bg) !important;

        color:
          var(--fc-text) !important;
      }


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
          rgba(255,255,255,.10) !important;
      }


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
          rgba(100,120,255,.15) !important;
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
         SIDEBAR
         ===================================================== */

      #fcCustomSidebar {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;

        border-color:
          rgba(255,255,255,.10) !important;
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
          rgba(255,255,255,.06) !important;
      }


      .fc-nav-item.active {

        background:
          rgba(100,120,255,.15) !important;

        color:
          var(--fc-accent) !important;
      }


      #fcNavToggle {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;
      }


      /* =====================================================
         BOTTOM DOCK
         DO NOT CHANGE BEHAVIOR / LAYOUT
         ===================================================== */

      .fc-bottom-dock {

        background:
          var(--fc-panel) !important;
      }


      /* =====================================================
         DISCOVERY
         ===================================================== */

      .fc-discovery {

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;
      }


      .fc-user-suggestion {

        background:
          var(--fc-panel-2) !important;

        color:
          var(--fc-text) !important;
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
         THEME OVERLAY
         THE OVERLAY ITSELF IS THE SCROLL CONTAINER
         ===================================================== */

      html body #fcThemeOverlay {

        position:
          fixed !important;

        inset:
          0 !important;

        width:
          100vw !important;

        height:
          100vh !important;

        min-height:
          100vh !important;

        max-height:
          100vh !important;

        display:
          none !important;

        box-sizing:
          border-box !important;

        padding:
          20px !important;

        background:
          rgba(0,0,0,.78) !important;

        overflow-x:
          hidden !important;

        overflow-y:
          auto !important;

        -webkit-overflow-scrolling:
          touch !important;

        overscroll-behavior:
          contain !important;

        touch-action:
          pan-y !important;

        scrollbar-gutter:
          stable !important;

        z-index:
          2147483647 !important;
      }


      html body #fcThemeOverlay.open {

        display:
          block !important;

        visibility:
          visible !important;

        opacity:
          1 !important;

        pointer-events:
          auto !important;
      }


      /* =====================================================
         THEME PANEL
         MUST BE INSIDE OVERLAY
         ===================================================== */

      html body #fcThemeOverlay #fcThemePanel {

        position:
          relative !important;

        display:
          block !important;

        width:
          min(760px, calc(100vw - 40px)) !important;

        min-width:
          0 !important;

        min-height:
          auto !important;

        height:
          auto !important;

        max-height:
          none !important;

        margin:
          20px auto 60px auto !important;

        padding:
          22px !important;

        box-sizing:
          border-box !important;

        overflow:
          visible !important;

        background:
          var(--fc-panel) !important;

        color:
          var(--fc-text) !important;

        border:
          1px solid
          rgba(255,255,255,.12) !important;

        border-radius:
          22px !important;

        box-shadow:
          0 25px 80px
          rgba(0,0,0,.65) !important;

        z-index:
          2147483647 !important;

        transform:
          none !important;
      }


      html body #fcThemeOverlay.open #fcThemePanel {

        display:
          block !important;

        visibility:
          visible !important;

        opacity:
          1 !important;

        pointer-events:
          auto !important;
      }


      /* =====================================================
         THEME HEADER
         ===================================================== */

      .fc-theme-head {

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          space-between !important;

        gap:
          15px !important;

        margin-bottom:
          20px !important;
      }


      .fc-theme-head strong {

        color:
          var(--fc-text) !important;

        font-size:
          22px !important;

        font-weight:
          800 !important;
      }


      .fc-theme-close {

        flex:
          0 0 auto !important;

        width:
          40px !important;

        height:
          40px !important;

        border:
          1px solid
          rgba(255,255,255,.12) !important;

        border-radius:
          12px !important;

        background:
          var(--fc-panel-2) !important;

        color:
          var(--fc-text) !important;

        cursor:
          pointer !important;

        font-size:
          20px !important;
      }


      .fc-theme-close:hover {

        background:
          var(--fc-accent) !important;

        color:
          #fff !important;
      }


      /* =====================================================
         THEME BODY
         ===================================================== */

      .fc-theme-body {

        width:
          100% !important;

        height:
          auto !important;

        min-height:
          0 !important;

        max-height:
          none !important;

        overflow:
          visible !important;
      }


      .fc-theme-grid {

        display:
          grid !important;

        grid-template-columns:
          repeat(2, minmax(0,1fr)) !important;

        gap:
          12px !important;

        width:
          100% !important;

        height:
          auto !important;

        min-height:
          0 !important;

        max-height:
          none !important;

        overflow:
          visible !important;
      }


      /* =====================================================
         THEME BUTTON
         ===================================================== */

      .fc-theme-choice {

        width:
          100% !important;

        min-width:
          0 !important;

        min-height:
          112px !important;

        padding:
          14px !important;

        box-sizing:
          border-box !important;

        border:
          1px solid
          rgba(255,255,255,.10) !important;

        border-radius:
          16px !important;

        background:
          var(--fc-panel-2) !important;

        color:
          var(--fc-text) !important;

        cursor:
          pointer !important;

        text-align:
          left !important;

        transition:
          transform .15s ease,
          border-color .15s ease,
          box-shadow .15s ease !important;
      }


      .fc-theme-choice:hover {

        transform:
          translateY(-2px) !important;

        border-color:
          var(--fc-accent) !important;
      }


      .fc-theme-choice:active {

        transform:
          translateY(0) !important;
      }


      .fc-theme-choice.selected {

        border:
          2px solid
          var(--fc-accent) !important;

        box-shadow:
          0 0 20px
          rgba(100,120,255,.22) !important;
      }


      .fc-theme-swatch {

        width:
          100% !important;

        height:
          42px !important;

        border-radius:
          10px !important;

        margin-bottom:
          10px !important;
      }


      .fc-theme-name {

        color:
          var(--fc-text) !important;

        font-size:
          15px !important;

        font-weight:
          700 !important;
      }


      .fc-theme-desc {

        color:
          var(--fc-muted) !important;

        font-size:
          12px !important;

        margin-top:
          4px !important;
      }


      /* =====================================================
         MOBILE THEME
         ===================================================== */

      @media(max-width:600px) {

        html body #fcThemeOverlay {

          padding:
            10px !important;
        }


        html body #fcThemeOverlay
        #fcThemePanel {

          width:
            calc(100vw - 20px) !important;

          margin:
            10px auto 40px auto !important;

          padding:
            16px !important;

          border-radius:
            18px !important;
        }


        .fc-theme-grid {

          grid-template-columns:
            1fr !important;
        }


        .fc-theme-choice {

          min-height:
            76px !important;
        }

      }

    `;

  }


  /* =========================================================
     NAVIGATION CSS
     ========================================================= */

  function installNavigationStyles() {

    let style =
      $("friendchat-nav-guaranteed-style");


    if (!style) {

      style =
        document.createElement("style");

      style.id =
        "friendchat-nav-guaranteed-style";

      document.head.appendChild(style);

    }


    style.textContent = `

      #fcNavToggle {

        position:
          fixed !important;

        left:
          0 !important;

        top:
          50% !important;

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

        cursor:
          pointer !important;

        visibility:
          visible !important;

        transition:
          left .22s ease !important;
      }


      #fcNavToggle.is-open {

        left:
          185px !important;
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


      #fcCustomSidebar {

        position:
          fixed !important;

        left:
          0 !important;

        top:
          50% !important;

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


      #bottomNav {

        display:
          none !important;
      }


      @media(max-width:600px) {

        #fcNavToggle {

          width:
            24px !important;

          height:
            44px !important;
        }


        #fcNavToggle.is-open {

          left:
            178px !important;
        }


        #fcCustomSidebar {

          width:
            178px !important;
        }

      }

    `;

  }


  /* =========================================================
     CREATE / REUSE NAVIGATION
     ========================================================= */

  function ensureNavigation() {

    let toggle =
      $("fcNavToggle");


    let sidebar =
      $("fcCustomSidebar");


    /* =======================================================
       CREATE ARROW
       ======================================================= */

    if (!toggle) {

      toggle =
        create(
          "button",
          "fc-nav-toggle",
          document.body
        );


      toggle.id =
        "fcNavToggle";


      toggle.type =
        "button";


      toggle.title =
        "Open navigation";


      toggle.setAttribute(
        "aria-label",
        "Open navigation"
      );


      toggle.innerHTML =
        '<span class="fc-chevron">›</span>';

    }


    /* =======================================================
       CREATE SIDEBAR
       ======================================================= */

    if (!sidebar) {

      sidebar =
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

    }


    /* =======================================================
       ARROW LISTENER
       ======================================================= */

    if (
      toggle.dataset.fcBound !== "1"
    ) {

      toggle.dataset.fcBound =
        "1";


      toggle.addEventListener(
        "click",
        event => {

          event.preventDefault();
          event.stopPropagation();


          const isOpen =
            sidebar.classList.toggle(
              "open"
            );


          toggle.classList.toggle(
            "is-open",
            isOpen
          );


          toggle.title =
            isOpen
              ? "Close navigation"
              : "Open navigation";

        }
      );

    }


    /* =======================================================
       SIDEBAR BUTTON LISTENERS
       ======================================================= */

    sidebar
      .querySelectorAll(
        ".fc-nav-item"
      )
      .forEach(button => {

        if (
          button.dataset.fcBound === "1"
        ) {

          return;

        }


        button.dataset.fcBound =
          "1";


        button.addEventListener(
          "click",
          event => {

            event.preventDefault();
            event.stopPropagation();


            const action =
              button.dataset.nav;


            /* ---------------------------------------------
               THEME
               --------------------------------------------- */

            if (
              action === "theme"
            ) {

              closeSidebar();

              openThemePanel();

              return;

            }


            /* ---------------------------------------------
               SETTINGS
               --------------------------------------------- */

            if (
              action === "settings"
            ) {

              closeSidebar();

              openThemePanel();

              return;

            }


            /* ---------------------------------------------
               CHATS
               --------------------------------------------- */

            if (
              action === "chats"
            ) {

              goHome();

              closeSidebar();

              return;

            }


            /* ---------------------------------------------
               FRIENDS
               --------------------------------------------- */

            if (
              action === "friends"
            ) {

              if (
                typeof window.showAdd ===
                "function"
              ) {

                window.showAdd();

              }


              closeSidebar();

              return;

            }


            /* ---------------------------------------------
               MUSIC
               --------------------------------------------- */

            if (
              action === "music"
            ) {

              if (
                typeof window.openSpotifyPanel ===
                "function"
              ) {

                window.openSpotifyPanel();

              }
              else if (
                typeof window.toggleSpotifyPanel ===
                "function"
              ) {

                window.toggleSpotifyPanel();

              }


              closeSidebar();

              return;

            }


            /* ---------------------------------------------
               PROFILE
               --------------------------------------------- */

            if (
              action === "profile"
            ) {

              if (
                typeof window.showProfile ===
                "function"
              ) {

                window.showProfile();

              }


              closeSidebar();

            }

          }
        );

      });


    return {
      toggle,
      sidebar
    };

  }


  /* =========================================================
     CLOSE SIDEBAR
     ========================================================= */

  function closeSidebar() {

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


      toggle.title =
        "Open navigation";

    }

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

    }
    catch (error) {

      console.warn(
        "FriendChat showHome failed:",
        error
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

  }


 /* =========================================================
   BOTTOM DOCK
   ========================================================= */

function addBottomDock() {

  /*
     IMPORTANT:
     If the dock already exists, DO NOT create another one.
     Instead, repair/rebind its buttons.
  */

  let dock =
    document.querySelector(".fc-bottom-dock");


  /* =========================================================
     CREATE DOCK IF IT DOES NOT EXIST
     ========================================================= */

  if (!dock) {

    dock =
      create(
        "div",
        "fc-bottom-dock",
        document.body
      );

  }


  /* =========================================================
     FIND EXISTING BUTTONS
     ========================================================= */

  let chats =
    dock.querySelector(
      '[data-fc-dock="chats"]'
    );

  let center =
    dock.querySelector(
      '[data-fc-dock="suggestions"]'
    );

  let profile =
    dock.querySelector(
      '[data-fc-dock="profile"]'
    );


  /* =========================================================
     CREATE CHATS BUTTON IF MISSING
     ========================================================= */

  if (!chats) {

    chats =
      create(
        "button",
        "fc-dock-btn",
        dock
      );

    chats.dataset.fcDock =
      "chats";

  }


  chats.type =
    "button";

  chats.title =
    "Chats";

  chats.innerHTML =
    "<span>💬</span><span>Chats</span>";


  /* =========================================================
     CREATE FC SUGGESTIONS BUTTON IF MISSING
     ========================================================= */

  if (!center) {

    center =
      create(
        "button",
        "fc-dock-btn fc-dock-center",
        dock
      );

    center.dataset.fcDock =
      "suggestions";

  }


  center.type =
    "button";

  center.title =
    "Discover FriendChat users";

  center.innerHTML =
    "<span>FC</span><span>Suggestions</span>";


  /* =========================================================
     CREATE PROFILE BUTTON IF MISSING
     ========================================================= */

  if (!profile) {

    profile =
      create(
        "button",
        "fc-dock-btn",
        dock
      );

    profile.dataset.fcDock =
      "profile";

  }


  profile.type =
    "button";

  profile.title =
    "Profile";

  profile.innerHTML =
    "<span>👤</span><span>Profile</span>";


  /* =========================================================
     REMOVE OLD CLICK LISTENERS
     ========================================================= */

  chats.onclick = null;
  center.onclick = null;
  profile.onclick = null;


  /* =========================================================
     CHATS
     ========================================================= */

  chats.onclick =
    function(event) {

      event.preventDefault();
      event.stopPropagation();

      if (
        typeof window.goHome ===
        "function"
      ) {

        window.goHome();

      }

    };


  /* =========================================================
     FC SUGGESTIONS
     ========================================================= */

  center.onclick =
    function(event) {

      event.preventDefault();
      event.stopPropagation();


      /*
         Use the global function created
         by this script.
      */

      if (
        typeof window.openDiscovery ===
        "function"
      ) {

        window.openDiscovery();

        return;

      }


      /*
         Fallback:
         directly open the discovery overlay.
      */

      const overlay =
        document.getElementById(
          "fcDiscoveryOverlay"
        );


      if (overlay) {

        const isOpen =
          overlay.classList.contains(
            "open"
          );


        if (isOpen) {

          overlay.classList.remove(
            "open"
          );

          overlay.style.display =
            "none";

        }
        else {

          overlay.classList.add(
            "open"
          );

          overlay.style.display =
            "block";


          if (
            typeof window.renderDiscovery ===
            "function"
          ) {

            window.renderDiscovery();

          }

        }

        return;

      }


      /*
         Last fallback:
         create the discovery panel.
      */

      if (
        typeof addDiscovery ===
        "function"
      ) {

        addDiscovery();


        const newOverlay =
          document.getElementById(
            "fcDiscoveryOverlay"
          );


        if (newOverlay) {

          newOverlay.classList.add(
            "open"
          );

          newOverlay.style.display =
            "block";

        }

      }

    };


  /* =========================================================
     PROFILE
     ========================================================= */

  profile.onclick =
    function(event) {

      event.preventDefault();
      event.stopPropagation();


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

    if (
      $("fcDiscovery") &&
      $("fcDiscoveryOverlay")
    ) {

      return;

    }


    $("fcDiscovery")?.remove();

    $("fcDiscoveryOverlay")?.remove();


    const overlay =
      create(
        "div",
        "fc-overlay",
        document.body
      );


    overlay.id =
      "fcDiscoveryOverlay";


    overlay.style.cssText = `

      position:fixed;
      inset:0;
      display:none;
      background:rgba(0,0,0,.72);
      z-index:2147483640;
      overflow-y:auto;
      overflow-x:hidden;
      padding:20px;
      box-sizing:border-box;

    `;


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
        overlay
      );


    panel.id =
      "fcDiscovery";


    panel.style.cssText = `

      position:relative;

      width:min(
        760px,
        calc(100vw - 40px)
      );

      margin:20px auto 50px;

      padding:22px;

      box-sizing:border-box;

      border-radius:20px;

      background:var(--fc-panel);

      color:var(--fc-text);

      border:1px solid
        rgba(255,255,255,.12);

    `;


    panel.innerHTML = `

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:20px;
        "
      >

        <div>

          <strong
            style="
              font-size:21px;
              color:var(--fc-text);
            "
          >
            ✨ Discover People
          </strong>

          <div
            class="fc-sidebar-sub"
            style="margin-top:5px;"
          >
            Find people and friends on FriendChat.
          </div>

        </div>


        <button
          id="fcDiscoveryClose"
          type="button"
          style="
            width:40px;
            height:40px;
            border-radius:12px;
            border:1px solid
              rgba(255,255,255,.12);
            background:var(--fc-panel-2);
            color:var(--fc-text);
            cursor:pointer;
            font-size:20px;
          "
        >
          ×
        </button>

      </div>


      <div
        id="fcDiscoveryList"
      ></div>

    `;


    const close =
      $("fcDiscoveryClose");


    if (close) {

      close.onclick =
        closeDiscovery;

    }

  }


 function toggleDiscovery() {

  /*
     Make sure the discovery window exists
  */
  addDiscovery();


  const overlay =
    document.getElementById(
      "fcDiscoveryOverlay"
    );


  const panel =
    document.getElementById(
      "fcDiscovery"
    );


  if (!overlay || !panel) {
    return;
  }


  /*
     If already open -> close it
  */
  if (
    overlay.classList.contains("open")
  ) {

    closeDiscovery();

    return;

  }


  /*
     Render the people list first
  */
  if (
    typeof renderDiscovery ===
    "function"
  ) {

    renderDiscovery();

  }


  /*
     FORCE the overlay to be visible
  */
  overlay.style.setProperty(
    "display",
    "block",
    "important"
  );

  overlay.style.setProperty(
    "visibility",
    "visible",
    "important"
  );

  overlay.style.setProperty(
    "opacity",
    "1",
    "important"
  );

  overlay.style.setProperty(
    "pointer-events",
    "auto",
    "important"
  );

  overlay.style.setProperty(
    "z-index",
    "2147483646",
    "important"
  );


  /*
     FORCE the actual discovery panel
     to appear above the blur
  */
  panel.style.setProperty(
    "display",
    "block",
    "important"
  );

  panel.style.setProperty(
    "visibility",
    "visible",
    "important"
  );

  panel.style.setProperty(
    "opacity",
    "1",
    "important"
  );

  panel.style.setProperty(
    "position",
    "relative",
    "important"
  );

  panel.style.setProperty(
    "z-index",
    "2147483647",
    "important"
  );


  /*
     Open state
  */
  overlay.classList.add(
    "open"
  );

}
  function closeDiscovery() {

    const overlay =
      $("fcDiscoveryOverlay");


    if (!overlay) {

      return;

    }


    overlay.classList.remove(
      "open"
    );


    overlay.style.display =
      "none";

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


    if (
      !friendSource.length
    ) {

      list.innerHTML = `

        <div
          style="
            padding:25px;
            text-align:center;
            color:var(--fc-muted);
          "
        >
          No suggestions available yet.
        </div>

      `;

      return;

    }


    list.innerHTML =
      "";


    friendSource.forEach(
      user => {

        const row =
          create(
            "div",
            "fc-user-suggestion",
            list
          );


        row.style.cssText = `

          display:flex;
          align-items:center;
          gap:12px;

          padding:12px;

          margin-bottom:8px;

          border-radius:14px;

          background:
            var(--fc-panel-2);

        `;


        const avatar =
          create(
            "div",
            "fc-user-avatar",
            row
          );


        avatar.style.cssText = `

          width:42px;
          height:42px;

          border-radius:50%;

          display:flex;
          align-items:center;
          justify-content:center;

          flex:0 0 auto;

          font-weight:800;
          color:white;

        `;


        avatar.textContent =
          String(
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


        info.style.flex =
          "1";


        info.innerHTML = `

          <div
            class="fc-user-name"
            style="font-weight:700;"
          >
            ${esc(
              user.name ||
              "Unknown"
            )}
          </div>

          <div
            class="fc-user-id"
            style="font-size:12px;"
          >
            ${esc(
              user.id ||
              ""
            )}
          </div>

        `;


        const chat =
          create(
            "button",
            "fc-user-add",
            row
          );


        chat.type =
          "button";


        chat.textContent =
          "Chat";


        chat.onclick =
          () => {

            if (
              typeof window.openChat ===
              "function"
            ) {

              window.openChat(
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

    /*
       If both already exist,
       keep them.
    */

    const existingOverlay =
      $("fcThemeOverlay");


    const existingPanel =
      $("fcThemePanel");


    if (
      existingOverlay &&
      existingPanel &&
      existingPanel.parentElement ===
        existingOverlay
    ) {

      return;

    }


    /*
       Remove broken/incomplete versions.
    */

    existingOverlay?.remove();

    existingPanel?.remove();


    /* =======================================================
       CREATE OVERLAY
       ======================================================= */

    const overlay =
      create(
        "div",
        "",
        document.body
      );


    overlay.id =
      "fcThemeOverlay";


    overlay.setAttribute(
      "aria-hidden",
      "true"
    );


    /* =======================================================
       CREATE PANEL INSIDE OVERLAY
       IMPORTANT FOR SCROLLING
       ======================================================= */

    const panel =
      create(
        "section",
        "",
        overlay
      );


    panel.id =
      "fcThemePanel";


    panel.setAttribute(
      "role",
      "dialog"
    );


    panel.setAttribute(
      "aria-modal",
      "true"
    );


    /* =======================================================
       HEADER
       ======================================================= */

    const header =
      create(
        "div",
        "fc-theme-head",
        panel
      );


    const titleArea =
      create(
        "div",
        "",
        header
      );


    titleArea.innerHTML = `

      <strong>
        🎨 Customize FriendChat
      </strong>

      <div
        class="fc-sidebar-sub"
        style="margin-top:5px;"
      >
        Choose your FriendChat theme
      </div>

    `;


    const close =
      create(
        "button",
        "fc-theme-close",
        header
      );


    close.type =
      "button";


    close.textContent =
      "×";


    close.title =
      "Close themes";


    close.setAttribute(
      "aria-label",
      "Close themes"
    );


    close.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        closeThemePanel();

      }
    );


    /* =======================================================
       THEME BODY
       ======================================================= */

    const themeBody =
      create(
        "div",
        "fc-theme-body",
        panel
      );


    const grid =
      create(
        "div",
        "fc-theme-grid",
        themeBody
      );


    grid.id =
      "fcThemeGrid";


    /* =======================================================
       CREATE 20 THEME BUTTONS
       ======================================================= */

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


        button.setAttribute(
          "aria-label",
          `Use ${theme.name} theme`
        );


        const swatch =
          create(
            "div",
            "fc-theme-swatch",
            button
          );


        swatch.style.background =
          `linear-gradient(
            135deg,
            ${theme.accent},
            ${theme.accent2}
          )`;


        const name =
          create(
            "div",
            "fc-theme-name",
            button
          );


        name.textContent =
          theme.name;


        const desc =
          create(
            "div",
            "fc-theme-desc",
            button
          );


        desc.textContent =
          theme.desc;


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


    /* =======================================================
       CLICK BACKGROUND TO CLOSE
       ======================================================= */

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

  }


  /* =========================================================
     OPEN THEME PANEL
     ========================================================= */

  function openThemePanel() {

    /*
       Always create/reuse it.
    */

    addThemePanel();


    const overlay =
      $("fcThemeOverlay");


    const panel =
      $("fcThemePanel");


    if (
      !overlay ||
      !panel
    ) {

      console.error(
        "FriendChat: Could not create theme panel."
      );

      return;

    }


    /*
       Ensure panel is correctly inside overlay.
    */

    if (
      panel.parentElement !==
      overlay
    ) {

      overlay.appendChild(
        panel
      );

    }


    overlay.classList.add(
      "open"
    );


    panel.classList.add(
      "open"
    );


    overlay.setAttribute(
      "aria-hidden",
      "false"
    );


    overlay.style.setProperty(
      "display",
      "block",
      "important"
    );


    overlay.style.setProperty(
      "visibility",
      "visible",
      "important"
    );


    overlay.style.setProperty(
      "opacity",
      "1",
      "important"
    );


    overlay.style.setProperty(
      "pointer-events",
      "auto",
      "important"
    );


    overlay.style.setProperty(
      "z-index",
      "2147483647",
      "important"
    );


    overlay.style.setProperty(
      "overflow-y",
      "auto",
      "important"
    );


    panel.style.setProperty(
      "display",
      "block",
      "important"
    );


    panel.style.setProperty(
      "visibility",
      "visible",
      "important"
    );


    panel.style.setProperty(
      "opacity",
      "1",
      "important"
    );


    panel.style.setProperty(
      "pointer-events",
      "auto",
      "important"
    );


    panel.style.setProperty(
      "z-index",
      "2147483647",
      "important"
    );


    /*
       Lock only the main page.
       Theme overlay itself can still scroll.
    */

    if (
      !document.body.dataset
        .fcThemeWasOverflow
    ) {

      document.body.dataset
        .fcThemeWasOverflow =
        document.body.style.overflow ||
        "";

    }


    document.body.style.overflow =
      "hidden";


    /*
       Always start from top.
    */

    overlay.scrollTop =
      0;


    /*
       Highlight saved theme.
    */

    updateThemeSelection(
      getSavedTheme()
    );

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

      overlay.classList.remove(
        "open"
      );


      overlay.setAttribute(
        "aria-hidden",
        "true"
      );


      overlay.style.setProperty(
        "display",
        "none",
        "important"
      );


      overlay.style.setProperty(
        "visibility",
        "hidden",
        "important"
      );


      overlay.style.setProperty(
        "opacity",
        "0",
        "important"
      );


      overlay.style.setProperty(
        "pointer-events",
        "none",
        "important"
      );

    }


    if (panel) {

      panel.classList.remove(
        "open"
      );


      panel.style.setProperty(
        "display",
        "none",
        "important"
      );


      panel.style.setProperty(
        "visibility",
        "hidden",
        "important"
      );


      panel.style.setProperty(
        "pointer-events",
        "none",
        "important"
      );

    }


    /*
       Restore body overflow.
    */

    if (
      document.body.dataset
        .fcThemeWasOverflow !==
      undefined
    ) {

      document.body.style.overflow =
        document.body.dataset
          .fcThemeWasOverflow;


      delete document.body.dataset
        .fcThemeWasOverflow;

    }
    else {

      document.body.style.removeProperty(
        "overflow"
      );

    }

  }


  /* =========================================================
     THEME STORAGE
     ========================================================= */

  function getSavedTheme() {

    let saved =
      null;


    try {

      saved =
        localStorage.getItem(
          "friendchat_theme"
        );

    }
    catch (_) {

      saved =
        null;

    }


    if (
      !saved ||
      !themes[saved]
    ) {

      saved =
        "midnight";

    }


    return saved;

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


    try {

      localStorage.setItem(
        "friendchat_theme",
        key
      );

    }
    catch (_) {}


    updateThemeSelection(
      key
    );

  }


  /* =========================================================
     UPDATE SELECTED THEME
     ========================================================= */

  function updateThemeSelection(
    selectedKey
  ) {

    document
      .querySelectorAll(
        ".fc-theme-choice"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "selected",
            button.dataset.theme ===
              selectedKey
          );

        }
      );

  }


  /* =========================================================
     APPLY SAVED THEME
     ========================================================= */

  function applySavedTheme() {

    setTheme(
      getSavedTheme()
    );

  }


  /* =========================================================
     KEYBOARD
     ========================================================= */

  function installKeyboard() {

    if (
      document.body.dataset
        .fcKeyboardBound ===
      "1"
    ) {

      return;

    }


    document.body.dataset
      .fcKeyboardBound =
      "1";


    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key !==
          "Escape"
        ) {

          return;

        }


        const theme =
          $("fcThemeOverlay");


        if (
          theme &&
          theme.classList.contains(
            "open"
          )
        ) {

          closeThemePanel();

          return;

        }


        const discovery =
          $("fcDiscoveryOverlay");


        if (
          discovery &&
          discovery.classList.contains(
            "open"
          )
        ) {

          closeDiscovery();

        }

      }
    );

  }


  /* =========================================================
     SAFE STYLE HELPER
     Prevents MutationObserver loops.
     ========================================================= */

  function setStyleIfDifferent(
    element,
    property,
    value
  ) {

    if (!element) {

      return;

    }


    const current =
      element.style.getPropertyValue(
        property
      );


    if (
      current !==
      value
    ) {

      element.style.setProperty(
        property,
        value,
        "important"
      );

    }

  }


  /* =========================================================
     VISIBILITY
     ========================================================= */

  function setupVisibility() {

    const sync =
      () => {

        const login =
          $("loginScreen");


        const signup =
          $("signupScreen");


        let authenticated =
          true;


        /*
           Login screen exists?
        */

        if (login) {

          const loginHidden =
            login.classList.contains(
              "hidden"
            ) ||
            login.style.display ===
              "none";


          authenticated =
            loginHidden;

        }


        /*
           Signup screen exists?
        */

        if (
          authenticated &&
          signup
        ) {

          const signupHidden =
            signup.classList.contains(
              "hidden"
            ) ||
            signup.style.display ===
              "none";


          authenticated =
            signupHidden;

        }


        const toggle =
          $("fcNavToggle");


        const sidebar =
          $("fcCustomSidebar");


        /*
           Navigation visibility
        */

        if (toggle) {

          const display =
            authenticated
              ? "flex"
              : "none";


          const visibility =
            authenticated
              ? "visible"
              : "hidden";


          setStyleIfDifferent(
            toggle,
            "display",
            display
          );


          setStyleIfDifferent(
            toggle,
            "visibility",
            visibility
          );

        }


        if (sidebar) {

          const display =
            authenticated
              ? "block"
              : "none";


          const visibility =
            authenticated
              ? "visible"
              : "hidden";


          setStyleIfDifferent(
            sidebar,
            "display",
            display
          );


          setStyleIfDifferent(
            sidebar,
            "visibility",
            visibility
          );

        }


        /*
           If logged out, close extra panels.
        */

        if (!authenticated) {

          const theme =
            $("fcThemeOverlay");


          if (
            theme &&
            theme.classList.contains(
              "open"
            )
          ) {

            closeThemePanel();

          }


          const discovery =
            $("fcDiscoveryOverlay");


          if (
            discovery &&
            discovery.classList.contains(
              "open"
            )
          ) {

            closeDiscovery();

          }

        }

      };


    sync();


    /*
       Only create one observer.
    */

    if (
      document.body.dataset
        .fcVisibilityObserver ===
      "1"
    ) {

      return;

    }


    document.body.dataset
      .fcVisibilityObserver =
      "1";


    const observer =
      new MutationObserver(
        mutations => {

          let relevant =
            false;


          for (
            const mutation
            of mutations
          ) {

            /*
               Ignore our own navigation
               style changes where possible.
            */

            if (
              mutation.type ===
              "attributes"
            ) {

              relevant =
                true;

              break;

            }

          }


          if (!relevant) {

            return;

          }


          sync();


          /*
             Make sure navigation still exists.
          */

          ensureNavigation();

        }
      );


    observer.observe(
      document.body,
      {
        subtree: true,
        attributes: true,
        attributeFilter: [
          "class",
          "style"
        ]
      }
    );

  }


  /* =========================================================
     SPOTIFY CLEANUP
     ========================================================= */

  function hideOldSpotifyButton() {

    const hide =
      () => {

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

        clearInterval(
          timer
        );

      },
      15000
    );

  }


  /* =========================================================
     GLOBAL FUNCTIONS
     ========================================================= */

  window.openThemePanel =
    openThemePanel;


  window.closeThemePanel =
    closeThemePanel;


  window.changeTheme =
    function(key) {

      if (
        key &&
        themes[key]
      ) {

        setTheme(
          key
        );

      }
      else {

        openThemePanel();

      }

    };


  window.toggleTheme =
    function() {

      const overlay =
        $("fcThemeOverlay");


      if (
        overlay &&
        overlay.classList.contains(
          "open"
        )
      ) {

        closeThemePanel();

      }
      else {

        openThemePanel();

      }

    };


  window.openDiscovery =
    toggleDiscovery;


  window.closeDiscovery =
    closeDiscovery;


  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {

    /*
       IMPORTANT:
       NEVER RETURN EARLY JUST BECAUSE
       THE SIDEBAR ALREADY EXISTS.
    */

    installThemeStyles();

    installNavigationStyles();

    ensureNavigation();

    addBottomDock();

    addDiscovery();

    addThemePanel();

    applySavedTheme();

    hideOldSpotifyButton();

    installKeyboard();

    setupVisibility();

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
      init,
      {
        once: true
      }
    );

  }
  else {

    init();

  }

})();
