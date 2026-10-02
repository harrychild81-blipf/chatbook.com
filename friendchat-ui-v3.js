/* =========================================================
   FRIENDCHAT CUSTOM UI v3
   Sidebar + Themes + Bottom Dock + User Discovery
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     THEMES
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */

  const $ = (id) => document.getElementById(id);

  function createElement(tag, className, parent) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (parent) {
      parent.appendChild(element);
    }

    return element;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  /* ---------------------------------------------------------
     INITIALIZATION
     --------------------------------------------------------- */

  function initialize() {

    if ($("fcCustomSidebar")) {
      return;
    }

    createSidebarButton();

    createSidebar();

    createQuickActions();

    createBottomDock();

    createDiscoveryWindow();

    createThemeWindow();

    hideOldSpotifyUI();

    applySavedTheme();

    setupScreenVisibility();
  }


  /* ---------------------------------------------------------
     SIDEBAR BUTTON
     --------------------------------------------------------- */

  function createSidebarButton() {

    const button = createElement(
      "button",
      "fc-nav-toggle",
      document.body
    );

    button.id = "fcNavToggle";

    button.type = "button";

    button.title = "Open navigation";

    button.innerHTML = `
      <span class="fc-chevron">›</span>
    `;

    button.addEventListener("click", toggleSidebar);
  }


  /* ---------------------------------------------------------
     SIDEBAR
     --------------------------------------------------------- */

  function createSidebar() {

    const sidebar = createElement(
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
        <span class="fc-nav-icon">💬</span>
        <span>Chats</span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="friends"
        type="button"
      >
        <span class="fc-nav-icon">👥</span>
        <span>Friends</span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="music"
        type="button"
      >
        <span class="fc-nav-icon">🎵</span>
        <span>Music</span>
      </button>


      <div class="fc-nav-divider"></div>


      <button
        class="fc-nav-item fc-nav-theme"
        data-nav="theme"
        type="button"
      >
        <span class="fc-nav-icon">🎨</span>
        <span>Change theme</span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="settings"
        type="button"
      >
        <span class="fc-nav-icon">⚙️</span>
        <span>Settings</span>
      </button>


      <button
        class="fc-nav-item"
        data-nav="profile"
        type="button"
      >
        <span class="fc-nav-icon">👤</span>
        <span>Profile</span>
      </button>

    `;


    sidebar
      .querySelectorAll(".fc-nav-item")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            const action =
              button.dataset.nav;


            if (
              action === "chats" ||
              action === "friends"
            ) {

              if (
                typeof window.showHome ===
                "function"
              ) {
                window.showHome();
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
                typeof window.showProfile ===
                "function"
              ) {

                window.showProfile();

              }

            }


            if (action === "theme") {

              openThemeWindow();

            }


            if (action === "settings") {

              openThemeWindow();

            }


            closeSidebar();

          }
        );

      });
  }


  function toggleSidebar() {

    const sidebar =
      $("fcCustomSidebar");

    const button =
      $("fcNavToggle");


    if (!sidebar) {
      return;
    }


    const isOpen =
      sidebar.classList.contains("open");


    if (isOpen) {

      closeSidebar();

    } else {

      openSidebar();

    }
  }


  function openSidebar() {

    const sidebar =
      $("fcCustomSidebar");

    const button =
      $("fcNavToggle");


    sidebar.classList.add("open");

    button.classList.add("is-open");
  }


  function closeSidebar() {

    const sidebar =
      $("fcCustomSidebar");

    const button =
      $("fcNavToggle");


    if (sidebar) {
      sidebar.classList.remove("open");
    }

    if (button) {
      button.classList.remove("is-open");
    }
  }


  /* ---------------------------------------------------------
     QUICK ACTIONS
     --------------------------------------------------------- */

  function createQuickActions() {

    const box = createElement(
      "div",
      "fc-quick-actions",
      document.body
    );


    const addButton = createElement(
      "button",
      "fc-quick add",
      box
    );

    addButton.type = "button";

    addButton.title = "Add friend";

    addButton.textContent = "＋";


    addButton.addEventListener(
      "click",
      () => {

        if (
          typeof window.showAdd ===
          "function"
        ) {

          window.showAdd();

        }

      }
    );


    const mediaButton = createElement(
      "button",
      "fc-quick media",
      box
    );

    mediaButton.type = "button";

    mediaButton.title = "Profile media";

    mediaButton.textContent = "▧";


    mediaButton.addEventListener(
      "click",
      () => {

        const input =
          $("profileMediaInput");


        if (input) {

          input.click();

          return;

        }


        if (
          typeof window.showProfile ===
          "function"
        ) {

          window.showProfile();

        }

      }
    );
  }


  /* ---------------------------------------------------------
     BOTTOM DOCK
     --------------------------------------------------------- */

  function createBottomDock() {

    const dock = createElement(
      "div",
      "fc-bottom-dock",
      document.body
    );


    const chats = createElement(
      "button",
      "fc-dock-btn",
      dock
    );

    chats.type = "button";

    chats.title = "Chats";

    chats.textContent = "💬";


    chats.addEventListener(
      "click",
      () => {

        if (
          typeof window.showHome ===
          "function"
        ) {

          window.showHome();

        }

      }
    );


    /*
       CENTER FC BUTTON
       Opens user discovery window.
    */

    const discover = createElement(
      "button",
      "fc-dock-btn fc-dock-center",
      dock
    );

    discover.type = "button";

    discover.title =
      "Discover FriendChat users";

    discover.textContent = "FC";


    discover.addEventListener(
      "click",
      toggleDiscovery
    );


    const profile = createElement(
      "button",
      "fc-dock-btn",
      dock
    );

    profile.type = "button";

    profile.title = "Profile";

    profile.textContent = "👤";


    profile.addEventListener(
      "click",
      () => {

        if (
          typeof window.showProfile ===
          "function"
        ) {

          window.showProfile();

        }

      }
    );
  }


  /* ---------------------------------------------------------
     USER DISCOVERY WINDOW
     --------------------------------------------------------- */

  function createDiscoveryWindow() {

    const overlay = createElement(
      "div",
      "fc-overlay",
      document.body
    );

    overlay.id =
      "fcDiscoveryOverlay";


    overlay.addEventListener(
      "click",
      closeDiscovery
    );


    const panel = createElement(
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
            FriendChat users
          </div>

        </div>


        <button
          class="fc-dock-btn"
          type="button"
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
      .addEventListener(
        "click",
        closeDiscovery
      );
  }


  function toggleDiscovery() {

    const panel =
      $("fcDiscovery");

    const overlay =
      $("fcDiscoveryOverlay");


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

    const panel =
      $("fcDiscovery");

    const overlay =
      $("fcDiscoveryOverlay");


    if (panel) {

      panel.classList.remove("open");

    }


    if (overlay) {

      overlay.classList.remove("open");

    }
  }


  /*
     Try several places because FriendChat versions
     may store the friend list differently.
  */

  function getUsers() {

    const users = [];


    if (
      Array.isArray(window.friends)
    ) {

      users.push(
        ...window.friends
      );

    }


    if (
      Array.isArray(window.users)
    ) {

      users.push(
        ...window.users
      );

    }


    if (
      Array.isArray(window.allUsers)
    ) {

      users.push(
        ...window.allUsers
      );

    }


    /*
       Search localStorage for arrays of users.
    */

    try {

      for (
        let i = 0;
        i < localStorage.length;
        i++
      ) {

        const key =
          localStorage.key(i);

        const value =
          localStorage.getItem(key);


        if (!value) {
          continue;
        }


        try {

          const parsed =
            JSON.parse(value);


          if (
            Array.isArray(parsed)
          ) {

            parsed.forEach((item) => {

              if (
                item &&
                typeof item === "object" &&
                (
                  item.id ||
                  item.userId ||
                  item.name ||
                  item.email
                )
              ) {

                users.push(item);

              }

            });

          }

        } catch (_) {}

      }

    } catch (_) {}


    /*
       Remove duplicates.
    */

    const map =
      new Map();


    users.forEach((user) => {

      const id =
        String(
          user.id ||
          user.userId ||
          user.uid ||
          ""
        ).toUpperCase();


      const name =
        user.name ||
        user.username ||
        user.displayName ||
        "";


      if (!id && !name) {
        return;
      }


      const key =
        id ||
        String(name).toUpperCase();


      if (!map.has(key)) {

        map.set(
          key,
          {
            ...user,
            id:
              id ||
              user.id ||
              user.userId ||
              "",
            name:
              name ||
              "Friend"
          }
        );

      }

    });


    return [...map.values()];
  }


  function renderDiscovery() {

    const list =
      $("fcDiscoveryList");


    if (!list) {
      return;
    }


    const users =
      getUsers();


    /*
       Try to remove current user.
    */

    let currentUser = null;


    try {

      currentUser =
        window.currentUser ||
        JSON.parse(
          localStorage.getItem(
            "currentUser"
          ) || "null"
        );

    } catch (_) {}


    const currentId =
      currentUser &&
      (
        currentUser.id ||
        currentUser.userId
      );


    const filtered =
      users.filter(
        (user) => {

          if (!currentId) {
            return true;
          }


          return (
            String(
              user.id ||
              user.userId ||
              ""
            ).toUpperCase()
            !==
            String(currentId).toUpperCase()
          );

        }
      );


    list.innerHTML = "";


    if (!filtered.length) {

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


    filtered.forEach(
      (user) => {

        const row =
          createElement(
            "div",
            "fc-user-suggestion",
            list
          );


        const avatar =
          createElement(
            "div",
            "fc-user-avatar",
            row
          );


        /*
           Support profile photos.
        */

        const image =
          user.photoURL ||
          user.photo ||
          user.avatar ||
          user.profileImage ||
          user.profilePhoto;


        if (image) {

          const img =
            document.createElement(
              "img"
            );

          img.src = image;

          img.alt = "";

          avatar.innerHTML = "";

          avatar.appendChild(img);

        } else {

          avatar.textContent =
            String(
              user.name ||
              "?"
            )
              .charAt(0)
              .toUpperCase();

        }


        const info =
          createElement(
            "div",
            "fc-user-info",
            row
          );


        const name =
          user.name ||
          user.username ||
          "Friend";


        const id =
          user.id ||
          user.userId ||
          "";


        info.innerHTML = `

          <div class="fc-user-name">
            ${escapeHTML(name)}
          </div>

          <div class="fc-user-id">
            ${escapeHTML(id)}
          </div>

        `;


        const chat =
          createElement(
            "button",
            "fc-user-add",
            row
          );


        chat.type = "button";

        chat.textContent = "Chat";


        chat.addEventListener(
          "click",
          () => {

            /*
               Use your existing openChat function
               if your app has it.
            */

            if (
              typeof window.openChat ===
              "function"
            ) {

              window.openChat(user);

              closeDiscovery();

              return;

            }


            /*
               Alternative function names
               used by some FriendChat versions.
            */

            if (
              typeof window.startChat ===
              "function"
            ) {

              window.startChat(user);

              closeDiscovery();

              return;

            }


            /*
               If there is no function,
               close the window rather than
               breaking the application.
            */

            closeDiscovery();

          }
        );

      }
    );
  }


  /* ---------------------------------------------------------
     THEME WINDOW
     --------------------------------------------------------- */

  function createThemeWindow() {

    const overlay = createElement(
      "div",
      "fc-overlay",
      document.body
    );

    overlay.id =
      "fcThemeOverlay";


    overlay.addEventListener(
      "click",
      closeThemeWindow
    );


    const panel = createElement(
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
          type="button"
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
      .addEventListener(
        "click",
        closeThemeWindow
      );


    const grid =
      $("fcThemeGrid");


    Object.entries(themes)
      .forEach(
        ([key, theme]) => {

          const button =
            createElement(
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
            () => {

              setTheme(key);

            }
          );

        }
      );
  }


  function openThemeWindow() {

    const panel =
      $("fcThemePanel");

    const overlay =
      $("fcThemeOverlay");


    if (panel) {

      panel.classList.add("open");

    }


    if (overlay) {

      overlay.classList.add("open");

    }
  }


  function closeThemeWindow() {

    const panel =
      $("fcThemePanel");

    const overlay =
      $("fcThemeOverlay");


    if (panel) {

      panel.classList.remove("open");

    }


    if (overlay) {

      overlay.classList.remove("open");

    }
  }


  /* ---------------------------------------------------------
     CHANGE THEME
     --------------------------------------------------------- */

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
      "--fc-panel-3",
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


    closeThemeWindow();
  }


  function applySavedTheme() {

    const saved =
      localStorage.getItem(
        "friendchat_theme"
      ) || "midnight";


    setThemeWithoutClosing(
      saved
    );
  }


  function setThemeWithoutClosing(
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
      "--fc-panel-3",
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
  }


  /* ---------------------------------------------------------
     HIDE OLD SPOTIFY SIDE BUTTON
     --------------------------------------------------------- */

  function hideOldSpotifyUI() {

    const hide = () => {

      const oldButton =
        document.querySelector(
          ".spotify-side-button"
        );


      if (oldButton) {

        oldButton.style.display =
          "none";

      }


      const oldSidebar =
        document.querySelector(
          ".spotify-side-bar"
        );


      if (oldSidebar) {

        oldSidebar.style.display =
          "none";

      }

    };


    hide();


    /*
       Spotify JS may create its old
       button after this script loads.
       Keep checking briefly.
    */

    const timer =
      setInterval(
        hide,
        500
      );


    setTimeout(
      () => {
        clearInterval(timer);
      },
      15000
    );
  }


  /* ---------------------------------------------------------
     SHOW CUSTOM UI ONLY ON APP SCREENS
     --------------------------------------------------------- */

  function setupScreenVisibility() {

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


    function sync() {

      const screenIds = [

        "homeScreen",
        "chatScreen",
        "profileScreen",
        "addScreen"

      ];


      const active =
        screenIds.some(
          (id) => {

            const screen =
              $(id);


            return (
              screen &&
              !screen.classList.contains(
                "hidden"
              )
            );

          }
        );


      managed.forEach(
        (element) => {

          element.style.display =
            active
              ? ""
              : "none";

        }
      );


      /*
         If another screen is active,
         automatically close sidebar.
      */

      if (!active) {

        closeSidebar();

        closeDiscovery();

        closeThemeWindow();

      }

    }


    sync();


    /*
       Watch FriendChat's existing
       screen switching.
    */

    const app =
      document.querySelector(
        ".app"
      );


    if (app) {

      const observer =
        new MutationObserver(
          sync
        );


      observer.observe(
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


    /*
       Also run once shortly after
       page startup.
    */

    setTimeout(
      sync,
      500
    );

    setTimeout(
      sync,
      1500
    );

  }


  /* ---------------------------------------------------------
     START
     --------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }

})();