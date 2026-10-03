/* FRIENDCHAT CUSTOM UI v3 — FULL SCREEN + SIDEBAR + DISCOVERY + AUTH FIX */
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


  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = id => document.getElementById(id);

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
     FULL SCREEN / VIEWPORT FIX
  ========================================================= */

  function fixFullScreen() {
    const html = document.documentElement;
    const body = document.body;

    if (!html || !body) {
      return;
    }

    html.style.width = "100%";
    html.style.minWidth = "100%";
    html.style.minHeight = "100%";
    html.style.height = "100%";

    body.style.width = "100%";
    body.style.minWidth = "100%";
    body.style.minHeight = "100vh";
    body.style.height = "100%";
    body.style.margin = "0";
    body.style.padding = "0";
    body.style.overflowX = "hidden";

    const app = document.querySelector(".app");

    if (app) {
      app.style.width = "100%";
      app.style.minWidth = "0";
      app.style.maxWidth = "none";
      app.style.minHeight = "100vh";
      app.style.height = "100vh";
      app.style.margin = "0";
      app.style.boxSizing = "border-box";
    }
  }


  /* =========================================================
     SIDEBAR STATE
  ========================================================= */

  function closeNavigation() {
    const sidebar = $("fcCustomSidebar");
    const toggle = $("fcNavToggle");

    if (sidebar) {
      sidebar.classList.remove("open");
    }

    if (toggle) {
      toggle.classList.remove("is-open");

      toggle.title = "Open navigation";

      toggle.setAttribute(
        "aria-label",
        "Open navigation"
      );
    }
  }


  function openNavigation() {
    const sidebar = $("fcCustomSidebar");
    const toggle = $("fcNavToggle");

    if (sidebar) {
      sidebar.classList.add("open");
    }

    if (toggle) {
      toggle.classList.add("is-open");

      toggle.title = "Close navigation";

      toggle.setAttribute(
        "aria-label",
        "Close navigation"
      );
    }
  }


  function toggleNavigation() {
    const sidebar = $("fcCustomSidebar");

    if (!sidebar) {
      return;
    }

    if (
      sidebar.classList.contains("open")
    ) {
      closeNavigation();
    } else {
      openNavigation();
    }
  }


  /* =========================================================
     INIT
  ========================================================= */

  function init() {

    /* Full screen immediately */
    fixFullScreen();


    /*
      Do not create the custom UI twice.
    */
    if ($("fcCustomSidebar")) {
      setupVisibility();
      return;
    }


    /* =======================================================
       SLIDE BUTTON
    ======================================================= */

    const toggle = create(
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
        type="button"
      >
        <span class="fc-nav-icon">
          💬
        </span>

        <span>
          Chats
        </span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="friends"
        type="button"
      >
        <span class="fc-nav-icon">
          👥
        </span>

        <span>
          Friends
        </span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="music"
        type="button"
      >
        <span class="fc-nav-icon">
          🎵
        </span>

        <span>
          Music
        </span>
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

        <span>
          Change theme
        </span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="settings"
        type="button"
      >
        <span class="fc-nav-icon">
          ⚙️
        </span>

        <span>
          Settings
        </span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="profile"
        type="button"
      >
        <span class="fc-nav-icon">
          👤
        </span>

        <span>
          Profile
        </span>
      </button>
    `;


    /* =======================================================
       SIDEBAR SLIDE CONTROL
    ======================================================= */

    toggle.addEventListener(
      "click",
      event => {

        event.preventDefault();

        toggleNavigation();

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


            /* CHATS */

            if (
              action === "chats"
            ) {

              if (
                typeof showHome ===
                "function"
              ) {

                showHome();

              }

            }


            /* FRIENDS */

            if (
              action === "friends"
            ) {

              if (
                typeof showHome ===
                "function"
              ) {

                showHome();

              }

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

              }

              else if (
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


            /* Close sidebar */

            closeNavigation();

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

    fixFullScreen();


    /* Recheck after layout is ready */

    requestAnimationFrame(() => {
      fixFullScreen();
    });

    setTimeout(() => {
      fixFullScreen();
    }, 250);

  }


  /* =========================================================
     QUICK ACTIONS
  ========================================================= */

  function addQuickActions() {

    if (
      document.querySelector(
        ".fc-quick-actions"
      )
    ) {
      return;
    }


    const box = create(
      "div",
      "fc-quick-actions",
      document.body
    );


    /* ADD FRIEND */

    const add = create(
      "button",
      "fc-quick add",
      box
    );

    add.type = "button";

    add.title = "Add friend";

    add.setAttribute(
      "aria-label",
      "Add friend"
    );

    add.textContent = "＋";


    add.onclick = () => {

      if (
        typeof showAdd ===
        "function"
      ) {

        showAdd();

      }

    };


    /* MEDIA */

    const media = create(
      "button",
      "fc-quick media",
      box
    );

    media.type = "button";

    media.title =
      "Upload profile media";

    media.setAttribute(
      "aria-label",
      "Upload profile media"
    );

    media.textContent = "▧";


    media.onclick = () => {

      const input =
        $("profileMediaInput");


      if (input) {

        input.click();

      }

      else if (
        typeof showProfile ===
        "function"
      ) {

        showProfile();

      }

    };

  }


  /* =========================================================
     BOTTOM SMALL BAR
  ========================================================= */

  function addBottomDock() {

    if (
      document.querySelector(
        ".fc-bottom-dock"
      )
    ) {
      return;
    }


    const dock = create(
      "div",
      "fc-bottom-dock",
      document.body
    );


    /* CHATS */

    const chats = create(
      "button",
      "fc-dock-btn",
      dock
    );

    chats.type = "button";

    chats.title = "Chats";

    chats.setAttribute(
      "aria-label",
      "Chats"
    );

    chats.textContent = "💬";


    chats.onclick = () => {

      if (
        typeof showHome ===
        "function"
      ) {

        showHome();

      }

    };


    /* FC DISCOVERY */

    const center = create(
      "button",
      "fc-dock-btn fc-dock-center",
      dock
    );

    center.type = "button";

    center.title =
      "Discover FriendChat users";

    center.setAttribute(
      "aria-label",
      "Discover FriendChat users"
    );

    center.textContent = "FC";


    center.onclick = () => {

      toggleDiscovery();

    };


    /* PROFILE */

    const profile = create(
      "button",
      "fc-dock-btn",
      dock
    );

    profile.type = "button";

    profile.title = "Profile";

    profile.setAttribute(
      "aria-label",
      "Profile"
    );

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


  /* =========================================================
     DISCOVERY WINDOW
  ========================================================= */

  function addDiscovery() {

    if (
      $("fcDiscovery")
    ) {
      return;
    }


    const overlay = create(
      "div",
      "fc-overlay",
      document.body
    );

    overlay.id =
      "fcDiscoveryOverlay";


    overlay.onclick = () => {

      closeDiscovery();

    };


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
            FriendChat accounts
          </div>

        </div>


        <button
          class="fc-dock-btn"
          data-close
          type="button"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <div class="fc-discovery-search">

        <input
          id="fcDiscoverySearch"
          type="text"
          placeholder="Search people..."
          autocomplete="off"
        >

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


    const search =
      $("fcDiscoverySearch");


    if (search) {

      search.addEventListener(
        "input",
        () => {

          filterDiscovery(
            search.value
          );

        }
      );

    }

  }


  async function toggleDiscovery() {

    const panel =
      $("fcDiscovery");

    const overlay =
      $("fcDiscoveryOverlay");


    if (
      !panel ||
      !overlay
    ) {

      return;

    }


    if (
      panel.classList.contains(
        "open"
      )
    ) {

      closeDiscovery();

      return;

    }


    if (
      !isLoggedInScreen()
    ) {

      return;

    }


    panel.classList.add(
      "open"
    );

    overlay.classList.add(
      "open"
    );


    await loadDiscoveryUsers();

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


  /* =========================================================
     GET CURRENT USER ID
  ========================================================= */

  function getMyUserId() {

    /* Global currentUser */

    if (
      window.currentUser &&
      window.currentUser.id
    ) {

      return String(
        window.currentUser.id
      )
        .trim()
        .toUpperCase();

    }


    /* localStorage */

    const possibleKeys = [

      "currentUser",

      "friendchat_user",

      "friendChatUser",

      "user",

      "friendchat_account"

    ];


    for (
      const key of possibleKeys
    ) {

      try {

        const value =
          localStorage.getItem(
            key
          );


        if (!value) {

          continue;

        }


        const parsed =
          JSON.parse(value);


        if (
          parsed &&
          parsed.id
        ) {

          return String(
            parsed.id
          )
            .trim()
            .toUpperCase();

        }

      }

      catch {}

    }


    /* Page elements */

    const idElement =
      $("myId");


    if (
      idElement &&
      idElement.textContent
    ) {

      const match =
        idElement.textContent.match(
          /FC-[A-Z0-9]+/i
        );


      if (match) {

        return String(
          match[0]
        ).toUpperCase();

      }

    }


    const idLabel =
      $("myIdLabel");


    if (
      idLabel &&
      idLabel.textContent
    ) {

      const match =
        idLabel.textContent.match(
          /FC-[A-Z0-9]+/i
        );


      if (match) {

        return String(
          match[0]
        ).toUpperCase();

      }

    }


    return "";

  }


  /* =========================================================
     CHECK LOGIN STATE
     
     IMPORTANT:
     This function existed twice in the old file.
     It now exists ONLY ONCE.
  ========================================================= */

  function isLoggedInScreen() {

    const login =
      $("loginScreen");

    const signup =
      $("signupScreen");

    const home =
      $("homeScreen");

    const chat =
      $("chatScreen");

    const profile =
      $("profileScreen");


    /* Login visible */

    if (
      login &&
      !login.classList.contains(
        "hidden"
      )
    ) {

      return false;

    }


    /* Signup visible */

    if (
      signup &&
      !signup.classList.contains(
        "hidden"
      )
    ) {

      return false;

    }


    /* Home */

    if (
      home &&
      !home.classList.contains(
        "hidden"
      )
    ) {

      return true;

    }


    /* Chat */

    if (
      chat &&
      !chat.classList.contains(
        "hidden"
      )
    ) {

      return true;

    }


    /* Profile */

    if (
      profile &&
      !profile.classList.contains(
        "hidden"
      )
    ) {

      return true;

    }


    return false;

  }


  /* =========================================================
     LOAD USERS FROM SERVER
  ========================================================= */

  async function loadDiscoveryUsers() {

    const list =
      $("fcDiscoveryList");


    if (!list) {

      return;

    }


    list.innerHTML = `

      <div class="fc-discovery-loading">

        <div class="fc-discovery-spinner"></div>

        <div>
          Loading FriendChat users...
        </div>

      </div>

    `;


    const myId =
      getMyUserId();


    try {

      let endpoint =
        "/api/users";


      if (myId) {

        endpoint +=
          "?exclude=" +
          encodeURIComponent(
            myId
          );

      }


      const response =
        await fetch(
          endpoint,
          {
            method: "GET",
            cache: "no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          "Server returned " +
          response.status
        );

      }


      const data =
        await response.json();


      const users =
        Array.isArray(
          data.users
        )
          ? data.users
          : [];


      renderDiscoveryUsers(
        users
      );

    }


    catch (error) {

      console.error(
        "FriendChat discovery error:",
        error
      );


      list.innerHTML = `

        <div class="fc-discovery-empty">

          <div class="fc-discovery-empty-icon">
            ⚠️
          </div>


          <strong>
            Could not load users
          </strong>


          <div>
            Make sure the FriendChat server is running.
          </div>


          <button
            id="fcDiscoveryRetry"
            type="button"
            class="fc-discovery-retry"
          >
            Try again
          </button>

        </div>

      `;


      $("fcDiscoveryRetry")
        ?.addEventListener(
          "click",
          loadDiscoveryUsers
        );

    }

  }


  /* =========================================================
     RENDER USERS
  ========================================================= */

  let discoveryUsers = [];


  function renderDiscoveryUsers(
    users
  ) {

    const list =
      $("fcDiscoveryList");


    if (!list) {

      return;

    }


    const myId =
      getMyUserId();


    discoveryUsers =
      users.filter(
        user => {

          if (
            !user ||
            !user.id
          ) {

            return false;

          }


          const id =
            String(
              user.id
            )
              .trim()
              .toUpperCase();


          if (
            myId &&
            id === myId
          ) {

            return false;

          }


          return true;

        }
      );


    drawDiscoveryList(
      discoveryUsers
    );

  }


  /* =========================================================
     FILTER
  ========================================================= */

  function filterDiscovery(
    query
  ) {

    const text =
      String(
        query || ""
      )
        .trim()
        .toLowerCase();


    if (!text) {

      drawDiscoveryList(
        discoveryUsers
      );

      return;

    }


    const filtered =
      discoveryUsers.filter(
        user => {

          const name =
            String(
              user.name || ""
            ).toLowerCase();


          const id =
            String(
              user.id || ""
            ).toLowerCase();


          return (
            name.includes(text) ||
            id.includes(text)
          );

        }
      );


    drawDiscoveryList(
      filtered
    );

  }


  /* =========================================================
     DRAW DISCOVERY LIST
  ========================================================= */

  function drawDiscoveryList(
    users
  ) {

    const list =
      $("fcDiscoveryList");


    if (!list) {

      return;

    }


    list.innerHTML = "";


    if (!users.length) {

      list.innerHTML = `

        <div class="fc-discovery-empty">

          <div class="fc-discovery-empty-icon">
            👥
          </div>


          <strong>
            No other users found
          </strong>


          <div>
            No other FriendChat accounts are available.
          </div>

        </div>

      `;


      return;

    }


    users.forEach(
      user => {

        const row =
          create(
            "div",
            "fc-user-suggestion",
            list
          );


        row.dataset.userId =
          String(
            user.id || ""
          ).toUpperCase();


        /* AVATAR */

        const avatar =
          create(
            "div",
            "fc-user-avatar",
            row
          );


        avatar.textContent =
          String(
            user.name || "?"
          )
            .charAt(0)
            .toUpperCase();


        /* INFO */

        const info =
          create(
            "div",
            "fc-user-info",
            row
          );


        const name =
          create(
            "div",
            "fc-user-name",
            info
          );


        name.textContent =
          user.name ||
          "Unknown";


        const id =
          create(
            "div",
            "fc-user-id",
            info
          );


        id.textContent =
          user.id || "";


        /* STATUS */

        const status =
          create(
            "div",
            "fc-user-status",
            info
          );


        const statusValue =
          String(
            user.status || ""
          )
            .trim()
            .toLowerCase();


        const online =
          user.online === true ||
          statusValue === "online" ||
          statusValue === "active" ||
          statusValue === "busy";


        status.className =
          online
            ? "fc-user-status online"
            : "fc-user-status offline";


        status.innerHTML =
          online
            ? `
                <span class="fc-status-dot"></span>
                Online
              `
            : `
                <span class="fc-status-dot"></span>
                Offline
              `;


        /* CHAT BUTTON */

        const chat =
          create(
            "button",
            "fc-user-add",
            row
          );


        chat.type = "button";


        chat.textContent =
          "Chat";


        chat.onclick =
          event => {

            event.stopPropagation();

            openDiscoveredUser(
              user
            );

          };


        /* ROW CLICK */

        row.onclick =
          () => {

            openDiscoveredUser(
              user
            );

          };

      }
    );

  }


  /* =========================================================
     OPEN DISCOVERED USER
  ========================================================= */

  function openDiscoveredUser(
    user
  ) {

    if (!user) {

      return;

    }


    closeDiscovery();


    if (
      typeof window.openChat ===
      "function"
    ) {

      try {

        window.openChat({
          id: user.id,
          name: user.name
        });


        return;

      }


      catch (error) {

        console.error(
          "openChat failed:",
          error
        );

      }

    }


    if (
      typeof window.showProfile ===
      "function"
    ) {

      try {

        window.showProfile(
          user
        );

      }

      catch {}

    }

  }


  /* =========================================================
     THEME PANEL
  ========================================================= */

  function addThemePanel() {

    if (
      $("fcThemePanel")
    ) {

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
      closeThemePanel;


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
          aria-label="Close theme panel"
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
        closeThemePanel;

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
            ${esc(theme.name)}
          </div>


          <div class="fc-theme-desc">
            ${esc(theme.desc)}
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

  function setTheme(
    key
  ) {

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

    setTheme(
      localStorage.getItem(
        "friendchat_theme"
      ) ||
      "midnight"
    );

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

      const loggedIn =
        isLoggedInScreen();


      managed.forEach(
        element => {

          if (loggedIn) {

            element.style.setProperty(
              "display",
              "",
              "important"
            );

          }

          else {

            element.style.setProperty(
              "display",
              "none",
              "important"
            );

          }

        }
      );


      if (!loggedIn) {

        closeNavigation();

        closeDiscovery();

        closeThemePanel();

      }

    };


    sync();


    /* APP OBSERVER */

    const app =
      document.querySelector(
        ".app"
      );


    if (app) {

      new MutationObserver(
        () => {

          sync();

        }
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


    /* BODY OBSERVER */

    new MutationObserver(
      () => {

        sync();

      }
    ).observe(
      document.body,
      {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          "class"
        ]
      }
    );


    setTimeout(
      sync,
      100
    );


    setTimeout(
      sync,
      500
    );


    setTimeout(
      sync,
      1000
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
          element => {

            element.remove();

          }
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
     WINDOW RESIZE
     
     Keeps the app full-screen if browser size changes.
  ========================================================= */

  window.addEventListener(
    "resize",
    () => {

      fixFullScreen();

    }
  );


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

  }

  else {

    init();

  }

})();
