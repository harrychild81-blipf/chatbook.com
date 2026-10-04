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

  function init() {

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

    sidebar.id = "fcCustomSidebar";

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
          sidebar.classList.toggle("open");

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
      .querySelectorAll(".fc-nav-item")
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () => {

            const action =
              btn.dataset.nav;

            if (action === "chats") {

              if (
                typeof showHome ===
                "function"
              ) {
                showHome();
              }

            }

            if (action === "friends") {

              if (
                typeof showHome ===
                "function"
              ) {
                showHome();
              }

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
                typeof showProfile ===
                "function"
              ) {
                showProfile();
              }

            }

            if (action === "theme") {
              openThemePanel();
            }

            if (action === "settings") {
              openThemePanel();
            }

            sidebar.classList.remove("open");

            toggle.classList.remove("is-open");

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

    const add =
      create(
        "button",
        "fc-quick add",
        box
      );

    add.title = "Add friend";

    add.textContent = "＋";

    add.onclick = () => {

      if (
        typeof showAdd ===
        "function"
      ) {
        showAdd();
      }

    };

    const media =
      create(
        "button",
        "fc-quick media",
        box
      );

    media.title =
      "Upload profile media";

    media.textContent = "▧";

    media.onclick = () => {

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

    chats.title = "Chats";

    chats.innerHTML =
      '<span class="fc-dock-icon">💬</span><span class="fc-dock-label">Chats</span>';

    chats.onclick = () => {

      if (
        typeof showHome ===
        "function"
      ) {
        showHome();
      }

    };

    /* FC SUGGESTIONS */

    const center =
      create(
        "button",
        "fc-dock-btn fc-dock-center",
        dock
      );

    center.title =
      "Discover FriendChat users";

    center.innerHTML =
      '<span class="fc-dock-icon">FC</span><span class="fc-dock-label">Suggestions</span>';

    center.onclick = () => {

      toggleDiscovery();

    };

    /* PROFILE */

    const profile =
      create(
        "button",
        "fc-dock-btn",
        dock
      );

    profile.title = "Profile";

    profile.innerHTML =
      '<span class="fc-dock-icon">👤</span><span class="fc-dock-label">Profile</span>';

    profile.onclick = () => {

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
        "fc-discovery-panel",
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
      p.classList.contains("open")
    ) {

      closeDiscovery();

    } else {

      renderDiscovery();

      p.classList.add("open");

      o.classList.add("open");

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

      }
    );

    const source =
      [...map.values()]
        .filter(user => {

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

        add.textContent = "Chat";

        add.onclick = () => {

          if (
            typeof openChat ===
            "function"
          ) {

            openChat(user);

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

        button.type = "button";

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

            setTheme(key);

          };

      }
    );

  }

  function openThemePanel() {

    $("fcThemePanel")
      ?.classList.add("open");

    $("fcThemeOverlay")
      ?.classList.add("open");

  }

  function closeThemePanel() {

    $("fcThemePanel")
      ?.classList.remove("open");

    $("fcThemeOverlay")
      ?.classList.remove("open");

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

    setTheme(saved);

  }

  /* =========================================================
     VISIBILITY
     ========================================================= */

  function setupVisibility() {

    const managed = [
      $("fcNavToggle"),
      $("fcCustomSidebar"),
      document.querySelector(
        ".fc-quick-actions"
      ),
      document.querySelector(
        ".fc-bottom-dock"
      )
    ].filter(Boolean);

    const sync = () => {

      const login =
        $("loginScreen");

      const signup =
        $("signupScreen");

      const loggedOut =
        (
          login &&
          !login.classList.contains(
            "hidden"
          )
        ) ||
        (
          signup &&
          !signup.classList.contains(
            "hidden"
          )
        );

      managed.forEach(
        el => {

          el.style.display =
            loggedOut
              ? "none"
              : "flex";

        }
      );

      const sidebar =
        $("fcCustomSidebar");

      if (
        sidebar &&
        loggedOut
      ) {

        sidebar.classList.remove(
          "open"
        );

      }

      const toggle =
        $("fcNavToggle");

      if (
        toggle &&
        loggedOut
      ) {

        toggle.classList.remove(
          "is-open"
        );

      }

    };

    sync();

    const app =
      document.querySelector(
        ".app"
      );

    if (app) {

      new MutationObserver(
        sync
      ).observe(
        app,
        {
          subtree: true,
          attributes: true,
          attributeFilter: [
            "class"
          ]
        }
      );

    }

    new MutationObserver(
      sync
    ).observe(
      document.body,
      {
        subtree: true,
        attributes: true,
        attributeFilter: [
          "class"
        ]
      }
    );

  }

  /* =========================================================
     REMOVE OLD SPOTIFY BUTTON
     ========================================================= */

  function hideOldSpotifyButton() {

    const hide = () => {

      document
        .querySelectorAll(
          ".spotify-side-button,.spotify-side-bar"
        )
        .forEach(
          e => e.remove()
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
