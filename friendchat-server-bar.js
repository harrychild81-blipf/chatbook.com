(function () {
  "use strict";

  const SERVERS_KEY = "friendchat_servers";

  let nav = null;

  /* =========================================
     READ LOCAL DATA
     ========================================= */

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "null"
      );

      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  /* =========================================
     CURRENT ACCOUNT
     ========================================= */

  function currentAccount() {
    if (
      typeof currentUser !== "undefined" &&
      currentUser
    ) {
      return currentUser;
    }

    return readJSON("friendchat_session", {}) || {};
  }

  function userID() {
    const user = currentAccount();

    return String(
      user.id ||
      user.userID ||
      user.userId ||
      user.uid ||
      ""
    ).trim().toLowerCase();
  }

  /* =========================================
     SERVER HELPERS
     ========================================= */

  function serverID(server) {
    return String(
      server &&
      (server.serverID || server.id) ||
      ""
    ).trim();
  }

  function serverName(server) {
    return String(
      server && server.name ||
      "Server"
    ).trim();
  }

  function safe(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  /* =========================================
     GET USER ROLE
     ========================================= */

  function roleFor(server, uid) {
    if (!server || !uid) {
      return "";
    }

    const owner = String(
      server.ownerID ||
      server.ownerId ||
      ""
    ).trim().toLowerCase();

    if (owner && owner === uid) {
      return "owner";
    }

    const members = Array.isArray(server.members)
      ? server.members
      : [];

    const found = members.find(member =>
      String(
        member &&
        (
          member.userID ||
          member.userId ||
          member.id ||
          member.uid
        ) ||
        ""
      ).trim().toLowerCase() === uid
    );

    if (!found) {
      return "";
    }

    return String(
      found.role || "member"
    ).trim().toLowerCase();
  }

  /* =========================================
     REGULAR MEMBER SERVERS
     ========================================= */

  function allowedMemberServers() {
    const uid = userID();

    const servers = readJSON(
      SERVERS_KEY,
      []
    );

    if (!uid || !Array.isArray(servers)) {
      return [];
    }

    return servers.filter(server => {
      const role = roleFor(server, uid);

      // Regular members only.
      // Owners, admins and moderators use the
      // existing full server management sidebar.

      return (
        role === "member" &&
        !!serverID(server)
      );
    });
  }

  /* =========================================
     SERVER ICON
     ========================================= */

  function iconMarkup(server) {
    const icon =
      server &&
      typeof server.icon === "string"
        ? server.icon.trim()
        : "";

    if (icon) {
      return (
        '<img src="' +
        safe(icon) +
        '" alt="">'
      );
    }

    const words = serverName(server)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return safe(
      words
        .map(word => word[0] || "")
        .join("")
        .toUpperCase() || "S"
    );
  }

  /* =========================================
     RENDER SERVER BAR
     ========================================= */

  function render() {
    if (!nav) {
      return;
    }

    const list = nav.querySelector(
      ".fc-server-list"
    );

    if (!list) {
      return;
    }

    const servers =
      allowedMemberServers();

    nav.classList.toggle(
      "fc-server-visible",
      servers.length > 0
    );

    if (!servers.length) {
      list.innerHTML = "";
      return;
    }

    list.innerHTML = servers
      .map(server => {
        const id = serverID(server);

        return `
          <button
            type="button"
            class="fc-server-item"
            title="${safe(serverName(server))}"
            aria-label="Open messages for ${safe(serverName(server))}"
            data-server-id="${safe(id)}"
          >
            <span class="fc-server-icon">
              ${iconMarkup(server)}
            </span>

            <span class="fc-server-name">
              ${safe(serverName(server))}
            </span>
          </button>
        `;
      })
      .join("");

    list
      .querySelectorAll(".fc-server-item")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset.serverId;

            if (!id) {
              return;
            }

            localStorage.setItem(
              "friendchat_current_server",
              id
            );

            window.location.href =
              "server-home.html?serverID=" +
              encodeURIComponent(id) +
              "&view=messages";
          }
        );
      });
  }

  /* =========================================
     INITIALIZE
     ========================================= */

  function init() {
    if (nav) {
      render();
      return;
    }

    nav = document.getElementById(
      "fcServerNav"
    );

    if (!nav) {
      nav = document.createElement("aside");

      nav.id = "fcServerNav";

      nav.setAttribute(
        "aria-label",
        "Your joined servers"
      );

      nav.innerHTML = `
        <div class="fc-server-nav-head">
          SERVERS
        </div>

        <div class="fc-server-list"></div>
      `;

      document.body.appendChild(nav);
    }

    render();
  }

  /* =========================================
     UPDATE EVENTS
     ========================================= */

  window.addEventListener(
    "friendchat-server-list-updated",
    render
  );

  window.addEventListener(
    "storage",
    event => {
      if (
        !event.key ||
        event.key === SERVERS_KEY ||
        event.key === "friendchat_session"
      ) {
        render();
      }
    }
  );

  window.addEventListener(
    "focus",
    render
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        render();
      }
    }
  );

  /* =========================================
     START
     ========================================= */

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

  // Refresh after login/account data loads.
  setTimeout(render, 400);
  setTimeout(render, 1400);

})();
