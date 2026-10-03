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

  function init() {

    if ($("fcCustomSidebar")) {
      return;
    }

    /* =====================================================
       SIDEBAR ARROW
       ===================================================== */

    const toggle = create(
      "button",
      "fc-nav-toggle",
      document.body
    );

    toggle.id = "fcNavToggle";
    toggle.title = "Open navigation";

    toggle.innerHTML =
      '<span class="fc-chevron">›</span>';


    /* =====================================================
       SIDEBAR
       ===================================================== */

    const sidebar = create(
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
      >
        <span class="fc-nav-icon">
          💬
        </span>
        Chats
      </button>


      <button
        class="fc-nav-item"
        data-nav="friends"
      >
        <span class="fc-nav-icon">
          👥
        </span>
        Friends
      </button>


      <button
        class="fc-nav-item"
        data-nav="music"
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
      >
        <span class="fc-nav-icon">
          🎨
        </span>
        Change theme
      </button>


      <button
        class="fc-nav-item"
        data-nav="settings"
      >
        <span class="fc-nav-icon">
          ⚙️
        </span>
        Settings
      </button>


      <button
        class="fc-nav-item"
        data-nav="profile"
      >
        <span class="fc-nav-icon">
          👤
        </span>
        Profile
      </button>
    `;


    /* =====================================================
       SIDEBAR OPEN / CLOSE
       ===================================================== */

    toggle.addEventListener("click", () => {

      const open =
        sidebar.classList.toggle("open");

      toggle.classList.toggle(
        "is-open",
        open
      );

    });


    /* =====================================================
       SIDEBAR BUTTONS
       ===================================================== */

    sidebar
      .querySelectorAll(".fc-nav-item")
      .forEach(btn => {

        btn.addEventListener("click", () => {

          const action =
            btn.dataset.nav;


          if (
            action === "chats" ||
            action === "friends"
          ) {

            if (
              typeof showHome === "function"
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


          if (
            action === "profile" &&
            typeof showProfile ===
            "function"
          ) {

            showProfile();

          }


          if (action === "theme") {

            openThemePanel();

          }


          if (action === "settings") {

            openThemePanel();

          }


          sidebar.classList.remove(
            "open"
          );

          toggle.classList.remove(
            "is-open"
          );

        });

      });


    /*
      IMPORTANT:

      The old addQuickActions() function has
      been removed.

      This removes the bottom:
      + button
      ▧ button

      The main header + button remains
      because it belongs to index.html.
    */


    addBottomDock();

    addDiscovery();

    addThemePanel();

    hideOldSpotifyButton();

    applySavedTheme();

    setupVisibility();

  }


  /* =====================================================
     BOTTOM DOCK
     ===================================================== */

  function addBottomDock() {

    const dock = create(
      "div",
      "fc-bottom-dock",
      document.body
    );


    const chats = create(
      "button",
      "fc-dock-btn",
      dock
    );

    chats.title = "Chats";

    chats.textContent = "💬";

    chats.onclick = () => {

      if (
        typeof showHome ===
        "function"
      ) {

        showHome();

      }

    };


    const center = create(
      "button",
      "fc-dock-btn fc-dock-center",
      dock
    );

    center.title =
      "Discover FriendChat users";

    center.textContent = "FC";

    center.onclick = () =>
      toggleDiscovery();


    const profile = create(
      "button",
      "fc-dock-btn",
      dock
    );

    profile.title = "Profile";

    profile.textContent = "👤";

    profile.onclick = () => {

      if (
        typeof showProfile ===
        "function"
      ) {

        showProfile();

      }

    };

  }


  /* =====================================================
     DISCOVERY
     ===================================================== */

  function addDiscovery() {

    const overlay = create(
      "div",
      "fc-overlay",
      document.body
    );

    overlay.id =
      "fcDiscoveryOverlay";

    overlay.onclick =
      () => closeDiscovery();


    const panel = create(
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
        >
          ×
        </button>

      </div>


      <div
        class="fc-discovery-list"
        id="fcDiscoveryList"
      ></div>
    `;


    panel
      .querySelector("[data-close]")
      .onclick =
      closeDiscovery;

  }


  function toggleDiscovery() {

    const p =
      $("fcDiscovery");

    const o =
      $("fcDiscoveryOverlay");


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
      ?.classList
      .remove("open");

    $("fcDiscoveryOverlay")
      ?.classList
      .remove("open");

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
      window.friendChatPresence ||
      {};


    const map =
      new Map();


    friendSource.forEach(user => {

      map.set(
        String(
          user.id || ""
        ).toUpperCase(),
        user
      );

    });


    Object.keys(presence)
      .forEach(id => {

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

      list.innerHTML =
        '<div style="padding:24px;text-align:center;color:var(--fc-muted)">No users available yet.</div>';

      return;

    }


    list.innerHTML = "";


    source.forEach(user => {

      const row = create(
        "div",
        "fc-user-suggestion",
        list
      );


      const avatar = create(
        "div",
        "fc-user-avatar",
        row
      );

      avatar.textContent =
        (user.name || "?")
          .charAt(0)
          .toUpperCase();


      const info = create(
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


      const add = create(
        "button",
        "fc-user-add",
        row
      );

      add.textContent =
        "Chat";


      add.onclick = () => {

        if (
          typeof openChat ===
          "function"
        ) {

          openChat(user);

        }

        closeDiscovery();

      };

    });

  }


  /* =====================================================
     THEME PANEL
     ===================================================== */

  function addThemePanel() {

    const overlay = create(
      "div",
      "fc-overlay",
      document.body
    );

    overlay.id =
      "fcThemeOverlay";

    overlay.onclick =
      closeThemePanel;


    const panel = create(
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


    panel
      .querySelector("[data-close]")
      .onclick =
      closeThemePanel;


    const grid =
      panel.querySelector(
        "#fcThemeGrid"
      );


    Object.entries(themes)
      .forEach(([key, t]) => {

        const b = create(
          "button",
          "fc-theme-choice",
          grid
        );


        b.innerHTML = `
          <div
            class="fc-theme-swatch"
            style="background:linear-gradient(135deg,${t.accent},${t.accent2})"
          ></div>

          <div class="fc-theme-name">
            ${t.name}
          </div>

          <div class="fc-theme-desc">
            ${t.desc}
          </div>
        `;


        b.onclick =
          () => setTheme(key);

      });

  }


  function openThemePanel() {

    $("fcThemePanel")
      ?.classList
      .add("open");

    $("fcThemeOverlay")
      ?.classList
      .add("open");

  }


  function closeThemePanel() {

    $("fcThemePanel")
      ?.classList
      .remove("open");

    $("fcThemeOverlay")
      ?.classList
      .remove("open");

  }


  /* =====================================================
     THEMES
     ===================================================== */

  function setTheme(key) {

    const t =
      themes[key];

    if (!t) {
      return;
    }


    const root =
      document.documentElement;


    root.style.setProperty(
      "--fc-bg",
      t.bg
    );


    root.style.setProperty(
      "--fc-panel",
      t.panel
    );


    root.style.setProperty(
      "--fc-panel-2",
      t.panel
    );


    root.style.setProperty(
      "--fc-accent",
      t.accent
    );


    root.style.setProperty(
      "--fc-accent-2",
      t.accent2
    );


    localStorage.setItem(
      "friendchat_theme",
      key
    );


    closeThemePanel();

  }


  function applySavedTheme() {

    setTheme(
      localStorage.getItem(
        "friendchat_theme"
      ) || "midnight"
    );

  }


  /* =====================================================
     SCREEN VISIBILITY
     ===================================================== */

  function setupVisibility() {

    const managed = [

      document.getElementById(
        "fcNavToggle"
      ),

      document.getElementById(
        "fcCustomSidebar"
      ),

      /*
        fc-quick-actions removed
      */

      document.querySelector(
        ".fc-bottom-dock"
      )

    ].filter(Boolean);


    const sync = () => {

      const active = [
        "homeScreen",
        "chatScreen",
        "profileScreen",
        "addScreen"
      ].some(id => {

        const e = $(id);

        return (
          e &&
          !e.classList.contains(
            "hidden"
          )
        );

      });


      managed.forEach(e => {

        e.style.display =
          active
            ? ""
            : "none";

      });

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

  }


  /* =====================================================
     HIDE OLD SPOTIFY BUTTON
     ===================================================== */

  function hideOldSpotifyButton() {

    const hide = () => {

      document
        .querySelectorAll(
          ".spotify-side-button,.spotify-side-bar"
        )
        .forEach(e =>
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
      () =>
        clearInterval(timer),
      15000
    );

  }


  /* =====================================================
     START
     ===================================================== */

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
