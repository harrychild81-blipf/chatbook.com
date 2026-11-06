
/* =========================================================
   FRIENDCHAT - SERVER BAR
   File: friendchat-server-bar.js
   ========================================================= */

(function () {
  "use strict";

  
  /* ---------- Helpers ---------- */

  function readJSON(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("[FriendChat Server Bar] Storage read error:", error);
      return fallback;
    }
  }

  function getCurrentUser() {
    const possibleKeys = [
      "friendchat_session",
      "friendchat_current_user",
      "friendchat_user",
      "currentUser",
      "user"
    ];

    for (const key of possibleKeys) {
      const value = readJSON(key);

      if (value && typeof value === "object") {
        return value.user || value.currentUser || value;
      }
    }

    return null;
  }

  function getUserID(user) {
    if (!user) return "";

    return String(
      user.id ||
      user.userID ||
      user.userId ||
      user.uid ||
      user.username ||
      user.email ||
      ""
    );
  }

  function getServerID(server) {
    if (!server) return "";

    return String(
      server.id ||
      server.serverID ||
      server.serverId ||
      server._id ||
      ""
    );
  }

  function getServerName(server) {
    return (
      server.name ||
      server.serverName ||
      server.title ||
      "Unnamed Server"
    );
  }

  function getServerIcon(server) {
    return (
      server.icon ||
      server.iconURL ||
      server.image ||
      server.avatar ||
      ""
    );
  }

  /* ---------- Server list ---------- */

  function getServers() {
    const data = readJSON(SERVER_STORAGE_KEY, []);

    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.servers)) {
      return data.servers;
    }

    return [];
  }

  /*
   * IMPORTANT:
   * Do not filter by role here.
   * Owners, admins, moderators and members can all appear.
   */
  function getVisibleServers() {
    return getServers().filter(function (server) {
      return !!getServerID(server);
    });
  }

  /* ---------- CSS fallback ---------- */

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${NAV_ID} {
        position: fixed;
        top: 0;
        left: 76px;
        bottom: 0;
        width: 76px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #111111;
        border-right: 1px solid rgba(255,255,255,.08);
        padding: 12px 0;
        box-sizing: border-box;
        overflow-y: auto;
        overflow-x: hidden;
      }

      #${NAV_ID}.fc-server-hidden {
        display: none !important;
      }

      #${NAV_ID} .fc-server-list {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        width: 100%;
      }

      #${NAV_ID} .fc-server-item {
        position: relative;
        width: 52px;
        height: 52px;
        min-width: 52px;
        border: 0;
        border-radius: 16px;
        background: #242424;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
        transition: border-radius .18s ease, background .18s ease;
      }

      #${NAV_ID} .fc-server-item:hover {
        border-radius: 12px;
        background: #5865f2;
      }

      #${NAV_ID} .fc-server-item.active {
        border-radius: 12px;
        background: #5865f2;
      }

      #${NAV_ID} .fc-server-icon {
        width: 100%;
        height: 100%;
        border-radius: inherit;
        object-fit: cover;
      }

      #${NAV_ID} .fc-server-letter {
        font-size: 20px;
        font-weight: 700;
        color: #fff;
      }

      #${NAV_ID} .fc-server-tooltip {
        position: absolute;
        left: 62px;
        top: 50%;
        transform: translateY(-50%);
        background: #080808;
        color: #fff;
        padding: 8px 12px;
        border-radius: 7px;
        font-size: 13px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        z-index: 100000;
      }

      #${NAV_ID} .fc-server-item:hover .fc-server-tooltip {
        opacity: 1;
        visibility: visible;
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------- Create navigation ---------- */

  function createNav() {
    let nav = document.getElementById(NAV_ID);

    if (nav) return nav;

    nav = document.createElement("aside");
    nav.id = NAV_ID;

    const list = document.createElement("div");
    list.id = LIST_ID;
    list.className = "fc-server-list";

    nav.appendChild(list);
    document.body.appendChild(nav);

    return nav;
  }

  /* ---------- Open server ---------- */

  function openServer(server) {
    const id = getServerID(server);

    if (!id) return;

    try {
      localStorage.setItem(CURRENT_SERVER_KEY, id);
    } catch (error) {
      console.warn("[FriendChat Server Bar] Could not save current server:", error);
    }

    const destination =
      "server-home.html?serverID=" +
      encodeURIComponent(id) +
      "&view=messages";

    window.location.href = destination;
  }

  /* ---------- Render server icons ---------- */

  function render() {
    if (!document.body || !document.head) return;

    injectStyle();

    const nav = createNav();
    const list = document.getElementById(LIST_ID);

    if (!list) return;

    const servers = getVisibleServers();
    const currentServer = String(
      localStorage.getItem(CURRENT_SERVER_KEY) || ""
    );

    list.replaceChildren();

    nav.classList.remove("fc-server-hidden");

    servers.forEach(function (server) {
      const serverID = getServerID(server);
      const serverName = getServerName(server);
      const serverIcon = getServerIcon(server);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "fc-server-item";

      if (serverID === currentServer) {
        button.classList.add("active");
      }

      button.setAttribute("aria-label", serverName);
      button.title = serverName;

      if (serverIcon) {
        const image = document.createElement("img");
        image.className = "fc-server-icon";
        image.src = serverIcon;
        image.alt = serverName;

        image.onerror = function () {
          image.remove();

          const letter = document.createElement("span");
          letter.className = "fc-server-letter";
          letter.textContent = serverName.charAt(0).toUpperCase();

          button.prepend(letter);
        };

        button.appendChild(image);
      } else {
        const letter = document.createElement("span");
        letter.className = "fc-server-letter";
        letter.textContent = serverName.charAt(0).toUpperCase();

        button.appendChild(letter);
      }

      const tooltip = document.createElement("span");
      tooltip.className = "fc-server-tooltip";
      tooltip.textContent = serverName;

      button.appendChild(tooltip);

      button.addEventListener("click", function () {
        openServer(server);
      });

      list.appendChild(button);
    });
  }

  /* ---------- Start ---------- */

  function start() {
    render();

    // Re-render when the user returns to the page.
    window.addEventListener("focus", render);

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) render();
    });

    // Refresh if another tab changes server storage.
    window.addEventListener("storage", function (event) {
      if (
        event.key === SERVER_STORAGE_KEY ||
        event.key === CURRENT_SERVER_KEY
      ) {
        render();
      }
    });

    // Re-render after a short delay for apps that load servers late.
    setTimeout(render, 1000);
    setTimeout(render, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
