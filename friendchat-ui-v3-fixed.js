/* FRIENDCHAT CUSTOM UI v3 */
(() => {
  "use strict";

  const themes = {
    midnight: {
      name: "Midnight",
      desc: "Dark blue and purple",
      bg: "#070a10",
      panel: "#0d121b",
      accent: "#6c7cff",
      accent2: "#8b5cf6"
    },
    emerald: {
      name: "Emerald",
      desc: "Dark green glass",
      bg: "#06100d",
      panel: "#0c1713",
      accent: "#22c55e",
      accent2: "#14b8a6"
    },
    ocean: {
      name: "Ocean",
      desc: "Deep blue",
      bg: "#061019",
      panel: "#0b1722",
      accent: "#22a6f2",
      accent2: "#6366f1"
    },
    sunset: {
      name: "Sunset",
      desc: "Warm orange glow",
      bg: "#120a08",
      panel: "#1b100d",
      accent: "#ff7a45",
      accent2: "#ef4444"
    },
    rose: {
      name: "Rose",
      desc: "Pink and violet",
      bg: "#100810",
      panel: "#190e19",
      accent: "#ec4899",
      accent2: "#8b5cf6"
    },
    graphite: {
      name: "Graphite",
      desc: "Minimal monochrome",
      bg: "#090909",
      panel: "#121212",
      accent: "#d1d5db",
      accent2: "#6b7280"
    }
  };

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
     MAIN INITIALIZATION
     ========================================================= */

  function installNavigationStyles() {
    if ($("friendchat-nav-guaranteed-style")) return;

    const style = document.createElement("style");
    style.id = "friendchat-nav-guaranteed-style";

    style.textContent = `
      /* LEFT ARROW */
      #fcNavToggle {
        position: fixed !important;
        left: 14px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 2147483646 !important;
        width: 28px !important;
        height: 48px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        border-radius: 14px !important;
        background: rgba(20,25,38,.96) !important;
        color: #fff !important;
        cursor: pointer !important;
        visibility: visible !important;
      }

      #fcNavToggle.is-open {
        left: 202px !important;
      }

      #fcNavToggle .fc-chevron {
        font-size: 24px !important;
        line-height: 1 !important;
      }

      /* SIDEBAR */
      #fcCustomSidebar {
        position: fixed !important;
        left: 12px !important;
        top: 50% !important;
        transform: translateY(-50%) translateX(-115%) !important;
        width: 185px !important;
        z-index: 2147483645 !important;
        box-sizing: border-box !important;
      }

      #fcCustomSidebar.open {
        transform: translateY(-50%) translateX(0) !important;
      }

      /* FINAL COMPACT BOTTOM DOCK */
      .fc-bottom-dock {
        position: fixed !important;
        left: 50% !important;
        right: auto !important;
        top: auto !important;
        bottom: 10px !important;
        transform: translateX(-50%) !important;

        width: 150px !important;
        min-width: 150px !important;
        max-width: 150px !important;

        height: 44px !important;
        min-height: 44px !important;
        max-height: 44px !important;

        padding: 3px 5px !important;
        margin: 0 !important;
        box-sizing: border-box !important;

        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 2px !important;

        border-radius: 14px !important;
        background: rgba(10,14,22,.98) !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        box-shadow: 0 8px 25px rgba(0,0,0,.45) !important;

        z-index: 2147483647 !important;
      }

      .fc-bottom-dock .fc-dock-btn {
        flex: 0 0 38px !important;
        width: 38px !important;
        min-width: 38px !important;
        max-width: 38px !important;
        height: 38px !important;
        min-height: 38px !important;
        max-height: 38px !important;

        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        border-radius: 10px !important;

        background: transparent !important;
        color: #fff !important;

        display: flex !important;
        align-items: center !important;
        justify-content: center !important;

        cursor: pointer !important;
        box-sizing: border-box !important;
      }

      /* Icons only — remove Chats/Suggestions/Profile text */
      .fc-bottom-dock .fc-dock-btn span:last-child {
        display: none !important;
      }

      .fc-bottom-dock .fc-dock-btn span:first-child {
        display: block !important;
        font-size: 18px !important;
        line-height: 1 !important;
      }

      /* FC = smooth square, NOT circle */
      .fc-bottom-dock .fc-dock-center {
        flex: 0 0 38px !important;
        width: 38px !important;
        min-width: 38px !important;
        max-width: 38px !important;
        height: 38px !important;
        min-height: 38px !important;
        max-height: 38px !important;

        border-radius: 10px !important;
        background: linear-gradient(135deg,#6855ff,#ad4de3) !important;
        color: #fff !important;
        box-shadow: 0 4px 14px rgba(110,80,240,.35) !important;
      }

      .fc-bottom-dock .fc-dock-center span:first-child {
        display: block !important;
        font-size: 14px !important;
        font-weight: 900 !important;
      }

      .fc-bottom-dock .fc-dock-btn:not(.fc-dock-center):hover {
        background: rgba(255,255,255,.08) !important;
      }

      .fc-bottom-dock .fc-dock-center:hover {
        transform: scale(1.04) !important;
      }

      /* NEVER show the dock while chat is open */
      body.fc-chat-open .fc-bottom-dock {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Hide old bottom navigation */
      #bottomNav {
        display: none !important;
      }

      @media(max-width:600px) {
        #fcNavToggle {
          left: 4px !important;
          width: 24px !important;
        }

        #fcNavToggle.is-open {
          left: 190px !important;
        }

        #fcCustomSidebar {
          width: 178px !important;
          left: 8px !important;
        }

        .fc-bottom-dock {
          width: 140px !important;
          min-width: 140px !important;
          max-width: 140px !important;
          height: 42px !important;
          min-height: 42px !important;
          max-height: 42px !important;
          bottom: 8px !important;
        }

        .fc-bottom-dock .fc-dock-btn,
        .fc-bottom-dock .fc-dock-center {
          flex-basis: 36px !important;
          width: 36px !important;
          min-width: 36px !important;
          max-width: 36px !important;
          height: 36px !important;
          min-height: 36px !important;
          max-height: 36px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }


  function init() {

    installNavigationStyles();

    if ($("fcCustomSidebar")) {
      return;
    }


    /* =======================================================
       NAVIGATION ARROW
       ======================================================= */

    const toggle =
      create(
        "button",
        "fc-nav-toggle",
        document.body
      );

    toggle.id = "fcNavToggle";

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
       SIDEBAR OPEN / CLOSE
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


            /* CLOSE SIDEBAR */

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


    /* =======================================================
       OTHER UI
       ======================================================= */

    addQuickActions();

    addBottomDock();

    addDiscovery();

    addThemePanel();

    hideOldSpotifyButton();

    applySavedTheme();

    setupVisibility();

  }


  /* =========================================================
     QUICK ACTION BUTTONS
     ========================================================= */

  function addQuickActions() {

    const box =
      create(
        "div",
        "fc-quick-actions",
        document.body
      );


    /* ADD FRIEND */

    const add =
      create(
        "button",
        "fc-quick add",
        box
      );

    add.title =
      "Add friend";

    add.textContent =
      "＋";


    add.onclick =
      () => {

        if (
          typeof showAdd ===
          "function"
        ) {

          showAdd();

        }

      };


    /* PROFILE MEDIA */

    const media =
      create(
        "button",
        "fc-quick media",
        box
      );

    media.title =
      "Upload profile media";

    media.textContent =
      "▧";


    media.onclick =
      () => {

        const input =
          $("profileMediaInput");


        if (input) {

          input.click();

        } else if (
          typeof showProfile ===
          "function"
        ) {

          showProfile();

        }

      };

  }


  /* =========================================================
     SAFE SCREEN NAVIGATION
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


    /* Always provide a fallback so the dock button works even if
       app.js did not expose showHome globally. */

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
      document.getElementById(
        "homeScreen"
      );


    if (home) {

      home.classList.remove(
        "hidden"
      );

    }


    const chat =
      document.getElementById(
        "chatScreen"
      );


    if (chat) {

      chat.classList.add(
        "hidden"
      );

    }


    const add =
      document.getElementById(
        "addScreen"
      );


    if (add) {

      add.classList.add(
        "hidden"
      );

    }


    const profile =
      document.getElementById(
        "profileScreen"
      );


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
      document.getElementById(
        "fcCustomSidebar"
      );


    const toggle =
      document.getElementById(
        "fcNavToggle"
      );


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


    chats.title =
      "Chats";


    chats.innerHTML =
      '<span>💬</span><span>Chats</span>';


    chats.onclick =
      () => {

        goHome();

      };


    /* DISCOVER */

    const center =
      create(
        "button",
        "fc-dock-btn fc-dock-center",
        dock
      );


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

      list.innerHTML =
        `
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

        <strong>
          Customize FriendChat
        </strong>


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
     THEME
     ========================================================= */

  function setTheme(key) {

    const theme =
      themes[key];


    if (!theme) {

      return;

    }


    const root =
      document.documentElement;


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
      theme.panel
    );


    root.style.setProperty(
      "--fc-accent",
      theme.accent
    );


    root.style.setProperty(
      "--fc-accent-2",
      theme.accent2
    );


    localStorage.setItem(
      "friendchat_theme",
      key
    );


    closeThemePanel();

  }


  function applySavedTheme() {

    const saved =
      localStorage.getItem(
        "friendchat_theme"
      ) ||
      "midnight";


    setTheme(
      saved
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


      const ids = [
        "fcNavToggle",
        "fcCustomSidebar"
      ];


      ids.forEach(
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


      /*
       * The bottom dock belongs to the main navigation.
       * Never show it while a chat is open, because it overlaps
       * the message composer at the bottom of the chat screen.
       */

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


      /*
       * Quick actions can remain available on authenticated screens.
       */

      document
        .querySelectorAll(
          ".fc-quick-actions"
        )
        .forEach(
          el => {

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
     REMOVE OLD SPOTIFY BUTTON
     ========================================================= */

  function hideOldSpotifyButton() {

    const hide =
      () => {

        document
          .querySelectorAll(
            ".spotify-side-button,.spotify-side-bar"
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
