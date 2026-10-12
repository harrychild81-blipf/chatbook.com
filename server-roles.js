
/* =========================================================
   FRIENDCHAT — SERVER ROLES
   BACKEND CONNECTED VERSION
   Role counts + role editing + permissions + saving
   ========================================================= */

(() => {
  "use strict";

  const API_BASE = "";

  const PERMISSION_GROUPS = [
    {
      title: "General permissions",
      permissions: [
        ["viewChannels", "View channels", "See channels available to this role."],
        ["manageServer", "Manage server", "Change general server settings."],
        ["manageRoles", "Manage roles", "Create and edit server roles."],
        ["viewAuditLog", "View audit log", "View server activity records."]
      ]
    },
    {
      title: "Membership permissions",
      permissions: [
        ["inviteMembers", "Invite members", "Create invitations for the server."],
        ["manageMembers", "Manage members", "Manage member access and roles."],
        ["kickMembers", "Remove members", "Remove members from the server."],
        ["banMembers", "Ban members", "Block members from rejoining."]
      ]
    },
    {
      title: "Text & messaging",
      permissions: [
        ["sendMessages", "Send messages", "Send messages in text channels."],
        ["manageMessages", "Manage messages", "Delete other members' messages."],
        ["attachFiles", "Attach files", "Share images and other attachments."],
        ["useReactions", "Use reactions", "React to messages with emojis."],
        ["mentionEveryone", "Mention everyone", "Use everyone-wide mentions."]
      ]
    },
    {
      title: "Channels & voice",
      permissions: [
        ["manageChannels", "Manage channels", "Create, edit and remove channels."],
        ["connectVoice", "Connect to voice", "Join voice channels."],
        ["speakVoice", "Speak in voice", "Speak when connected to voice."],
        ["manageVoice", "Manage voice sessions", "Manage other members in voice."]
      ]
    }
  ];

  const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(group =>
    group.permissions.map(permission => permission[0])
  );

  const SEED_ROLES = [
    {
      id: "owner",
      name: "Owner",
      color: "#ffbd59",
      protected: true,
      permissions: Object.fromEntries(
        ALL_PERMISSION_KEYS.map(key => [key, true])
      )
    },
    {
      id: "admin",
      name: "Admin",
      color: "#ff6f91",
      permissions: Object.fromEntries(
        ALL_PERMISSION_KEYS.map(key => [key, true])
      )
    },
    {
      id: "moderator",
      name: "Moderator",
      color: "#48a7ff",
      permissions: {
        viewChannels: true,
        viewAuditLog: true,
        inviteMembers: true,
        manageMembers: true,
        kickMembers: true,
        sendMessages: true,
        manageMessages: true,
        attachFiles: true,
        useReactions: true,
        connectVoice: true,
        speakVoice: true
      }
    },
    {
      id: "member",
      name: "Member",
      color: "#45d6a1",
      permissions: {
        viewChannels: true,
        sendMessages: true,
        attachFiles: true,
        useReactions: true,
        connectVoice: true,
        speakVoice: true
      }
    }
  ];

  const $ = id => document.getElementById(id);

  let roles = [];
  let selectedId = null;
  let currentServer = null;
  let toastTimer = null;
  let saving = false;
  let loadFailed = false;

  function makeId() {
    return "role-" + Date.now().toString(36) +
      "-" + Math.random().toString(36).slice(2, 8);
  }

  function emptyPermissions() {
    return Object.fromEntries(
      ALL_PERMISSION_KEYS.map(key => [key, false])
    );
  }

  function normalizeRole(role) {
    const permissions = emptyPermissions();

    if (Array.isArray(role.permissions)) {
      role.permissions.forEach(key => {
        if (ALL_PERMISSION_KEYS.includes(key)) {
          permissions[key] = true;
        }
      });
    } else if (
      role.permissions &&
      typeof role.permissions === "object"
    ) {
      ALL_PERMISSION_KEYS.forEach(key => {
        permissions[key] = role.permissions[key] === true;
      });
    }

    const id = String(
      role.id || role.roleID || role.roleId || makeId()
    );

    return {
      id,
      name: String(role.name || "New Role").slice(0, 32),
      color: /^#[0-9a-f]{6}$/i.test(role.color || "")
        ? role.color
        : "#8b7bff",
      protected: role.protected === true || id.toLowerCase() === "owner",
      permissions
    };
  }

  function rolesForBackend() {
    return roles.map(role => ({
      roleID: role.id,
      name: role.name,
      color: role.color,
      permissions: ALL_PERMISSION_KEYS.filter(
        key => role.permissions[key] === true
      )
    }));
  }

  function getCurrentUserID() {
    const directKeys = [
      "friendchat_user_id",
      "userID",
      "userId",
      "currentUserID",
      "currentUserId",
      "fc_user_id"
    ];

    try {
      for (const key of directKeys) {
        const value = localStorage.getItem(key);
        if (value && value.trim()) {
          return value.trim().toUpperCase();
        }
      }

      const objectKeys = [
        "friendchat_user",
        "friendchat_current_user",
        "currentUser",
        "user",
        "friendchat_account"
      ];

      for (const key of objectKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        try {
          const obj = JSON.parse(raw);
          const id = obj &&
            (obj.userID || obj.userId || obj.id || obj.ID);

          if (id) return String(id).trim().toUpperCase();
        } catch (_) {}
      }
    } catch (error) {
      console.error("Could not read current user ID:", error);
    }

    return "";
  }

  function getCurrentServerID() {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromURL = params.get("server") || params.get("serverID");

      if (fromURL && fromURL.trim()) return fromURL.trim();

      const saved = localStorage.getItem("friendchat_current_server");

      if (saved && saved.trim()) {
        try {
          const parsed = JSON.parse(saved);

          if (parsed && typeof parsed === "object") {
            return String(
              parsed.serverID || parsed.serverId || parsed.id || ""
            ).trim();
          }
        } catch (_) {}

        return saved.trim();
      }
    } catch (error) {
      console.error("Could not read server ID:", error);
    }

    return "";
  }

  async function apiRequest(url, options = {}) {
    const userID = getCurrentUserID();

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (userID) {
      headers["x-friendchat-user-id"] = userID;
    }

    let response;

    try {
      response = await fetch(API_BASE + url, {
        ...options,
        headers
      });
    } catch (error) {
      console.error("FriendChat API connection failed:", error);
      throw new Error("Cannot connect to the FriendChat backend.");
    }

    let data = null;

    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        (data && data.error) || "The backend rejected the request."
      );
    }

    return data;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function showToast(message) {
    const toast = $("toast");

    if (!toast) {
      console.log("FriendChat:", message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
      () => toast.classList.remove("show"),
      2600
    );
  }

  function getSelectedRole() {
    return roles.find(role => role.id === selectedId) || null;
  }

  /* =========================================================
     ROLE MEMBER COUNT FIX

     Reads common role-assignment formats from server members.
     Returns null when the backend does not provide enough data.
     ========================================================= */

  function getMemberRoleIDs(member) {
    if (!member || typeof member !== "object") return [];

    const result = [];

    // Common formats: roles: ["member", "moderator"]
    if (Array.isArray(member.roles)) {
      member.roles.forEach(role => {
        if (typeof role === "string" || typeof role === "number") {
          result.push(String(role));
        } else if (role && typeof role === "object") {
          const id = role.roleID || role.roleId || role.id;
          if (id != null) result.push(String(id));
        }
      });
    }

    // Common single-role formats
    [
      "roleID",
      "roleId",
      "role",
      "serverRoleID",
      "serverRoleId"
    ].forEach(key => {
      const value = member[key];

      if (typeof value === "string" || typeof value === "number") {
        result.push(String(value));
      } else if (value && typeof value === "object") {
        const id = value.roleID || value.roleId || value.id;
        if (id != null) result.push(String(id));
      }
    });

    // Alternative role ID arrays
    [
      "roleIDs",
      "roleIds",
      "serverRoles"
    ].forEach(key => {
      if (Array.isArray(member[key])) {
        member[key].forEach(value => {
          if (typeof value === "string" || typeof value === "number") {
            result.push(String(value));
          } else if (value && typeof value === "object") {
            const id = value.roleID || value.roleId || value.id;
            if (id != null) result.push(String(id));
          }
        });
      }
    });

    return [...new Set(result)];
  }

  function getRoleMemberCount(role) {
    const members = currentServer?.members;

    // Do not falsely report zero when member data is unavailable.
    if (!Array.isArray(members)) return null;

    // Owner may be stored separately from ordinary member roles.
    if (role.id.toLowerCase() === "owner") {
      const ownerID =
        currentServer.ownerID ||
        currentServer.ownerId ||
        currentServer.owner ||
        currentServer.createdBy ||
        currentServer.createdByID;

      const ownerKey = typeof ownerID === "object" && ownerID
        ? String(ownerID.userID || ownerID.userId || ownerID.id || "")
        : String(ownerID || "");

      const ownerIsInMembers = ownerKey && members.some(member => {
        const memberID = String(
          member?.userID ||
          member?.userId ||
          member?.memberID ||
          member?.memberId ||
          member?.id ||
          ""
        );

        return memberID.toUpperCase() === ownerKey.toUpperCase();
      });

      // Owner is counted through the role assignment when available.
      const assignedCount = members.filter(member =>
        getMemberRoleIDs(member).some(id =>
          id.toLowerCase() === role.id.toLowerCase()
        )
      ).length;

      if (assignedCount > 0) return assignedCount;
      if (ownerKey && !ownerIsInMembers) return 1;
      if (ownerKey && ownerIsInMembers) return 1;
    }

    return members.filter(member =>
      getMemberRoleIDs(member).some(id =>
        id.toLowerCase() === role.id.toLowerCase()
      )
    ).length;
  }

  async function loadRolesFromBackend() {
    const serverID = getCurrentServerID();
    const userID = getCurrentUserID();

    if (!serverID) {
      throw new Error(
        "Server ID is missing. Open Roles from your server page."
      );
    }

    if (!userID) {
      throw new Error(
        "Your FriendChat user ID is missing. Please log in again."
      );
    }

    const data = await apiRequest(
      "/api/servers/" + encodeURIComponent(serverID) +
      "?user=" + encodeURIComponent(userID),
      { method: "GET" }
    );

    if (!data || !data.server) {
      throw new Error("The backend did not return the server.");
    }

    currentServer = data.server;

    if (
      String(currentServer.serverID || "").toUpperCase() !==
      String(serverID).toUpperCase()
    ) {
      console.warn("Returned server ID differs from the requested ID.");
    }

    $("serverName").textContent =
      String(currentServer.name || "FriendChat Server").slice(0, 80);

    const backendRoles = Array.isArray(currentServer.roles)
      ? currentServer.roles
      : [];

    if (backendRoles.length) {
      roles = backendRoles.map(normalizeRole);
    } else {
      roles = SEED_ROLES.map(normalizeRole);
    }

    if (!roles.length) {
      roles = SEED_ROLES.map(normalizeRole);
    }

    selectedId = roles[0]?.id || null;
    loadFailed = false;

    renderAll();
  }

  async function saveRoles() {
    if (saving) {
      showToast("Please wait for the current save to finish.");
      return false;
    }

    if (loadFailed || !currentServer) {
      showToast("Roles were not loaded. Reload the page and try again.");
      return false;
    }

    const serverID = currentServer.serverID || getCurrentServerID();
    const userID = getCurrentUserID();

    if (!serverID || !userID) {
      showToast("Server ID or user ID is missing.");
      return false;
    }

    saving = true;

    try {
      const data = await apiRequest(
        "/api/servers/" + encodeURIComponent(serverID),
        {
          method: "PUT",
          body: JSON.stringify({
            requesterID: userID,
            roles: rolesForBackend()
          })
        }
      );

      if (!data || !data.server) {
        throw new Error("The backend did not confirm the saved roles.");
      }

      currentServer = {
        ...currentServer,
        ...data.server
      };

      if (Array.isArray(data.server.roles)) {
        roles = data.server.roles.map(normalizeRole);
      }

      return true;
    } catch (error) {
      console.error("Could not save FriendChat roles:", error);
      showToast(error.message || "Could not save roles.");
      return false;
    } finally {
      saving = false;
    }
  }

  function renderRoles() {
    const list = $("roleList");
    list.replaceChildren();

    roles.forEach(role => {
      const item = document.createElement("div");

      item.className =
        "role-item" + (role.id === selectedId ? " selected" : "");

      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-pressed", String(role.id === selectedId));
      item.setAttribute("aria-label", "Select " + role.name + " role");

      const count = getRoleMemberCount(role);
      const countText = count === null ? "—" : String(count);

      item.innerHTML = `
        <span class="role-color"
          style="background:${role.color}"></span>

        <span class="role-item-info">
          <strong>${escapeHTML(role.name)}</strong>
          <span>${role.protected ? "Protected role" : "Custom role"}</span>
        </span>

        <span class="role-count" title="Members assigned to this role">
          ${countText}
        </span>

        <span class="role-arrow">›</span>
      `;

      const select = () => {
        selectedId = role.id;
        renderRoles();
        renderEditor();
      };

      item.addEventListener("click", select);

      item.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });

      list.appendChild(item);
    });

    $("roleCount").textContent = roles.length;

    $("memberCount").textContent =
      Array.isArray(currentServer?.members)
        ? currentServer.members.length
        : "—";
  }

  function renderPermissionGroups(role) {
    const container = $("permissionGroups");
    container.replaceChildren();

    PERMISSION_GROUPS.forEach(group => {
      const section = document.createElement("section");
      section.className = "permission-group";

      const heading = document.createElement("div");
      heading.className = "permission-group-title";
      heading.textContent = group.title;
      section.appendChild(heading);

      group.permissions.forEach(([key, name, description]) => {
        const row = document.createElement("div");
        row.className = "permission-row";

        const info = document.createElement("div");

        info.innerHTML = `
          <strong>${escapeHTML(name)}</strong>
          <small>${escapeHTML(description)}</small>
        `;

        const label = document.createElement("label");
        label.className = "switch";
        label.title = name;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = role.permissions[key] === true;
        checkbox.disabled = role.protected || saving;
        checkbox.setAttribute("aria-label", name);

        const track = document.createElement("span");
        track.className = "switch-track";

        checkbox.addEventListener("change", async () => {
          const currentRole = getSelectedRole();

          if (!currentRole || currentRole.protected || saving) return;

          const previous = currentRole.permissions[key];
          currentRole.permissions[key] = checkbox.checked;

          if (await saveRoles()) {
            renderAll();
            showToast(
              name + (checkbox.checked ? " enabled." : " disabled.")
            );
          } else {
            currentRole.permissions[key] = previous;
            renderAll();
          }
        });

        label.append(checkbox, track);
        row.append(info, label);
        section.appendChild(row);
      });

      container.appendChild(section);
    });
  }

  function renderEditor() {
    const role = getSelectedRole();
    const editor = $("roleEditor");
    const empty = $("emptyEditor");

    if (!role) {
      editor.hidden = true;
      empty.hidden = false;
      return;
    }

    editor.hidden = false;
    empty.hidden = true;

    $("editorTitle").textContent =
      role.protected ? "Protected role" : "Edit role";

    $("roleStatus").textContent =
      role.protected ? "Protected" : "Editable";

    $("roleName").value = role.name;
    $("roleName").disabled = role.protected || saving;

    $("roleColor").value = role.color;
    $("roleColor").disabled = role.protected || saving;

    $("colorSwatch").style.background = role.color;
    $("colorText").textContent = role.color.toUpperCase();

    $("deleteRoleBtn").disabled = role.protected || saving;
    $("resetRoleBtn").disabled = role.protected || saving;
    $("clearPermissions").disabled = role.protected || saving;

    $("deleteRoleBtn").style.opacity = role.protected ? ".45" : "1";
    $("resetRoleBtn").style.opacity = role.protected ? ".45" : "1";
    $("clearPermissions").style.opacity = role.protected ? ".45" : "1";

    renderPermissionGroups(role);
  }

  function renderAll() {
    renderRoles();
    renderEditor();
  }

  function openCreateModal() {
    if (loadFailed || !currentServer) {
      showToast("Load your server before creating roles.");
      return;
    }

    $("createRoleForm").reset();
    $("newRoleColor").value = "#8b7bff";
    $("createModal").hidden = false;
    $("newRoleName").focus();
  }

  function closeCreateModal() {
    $("createModal").hidden = true;
    $("addRoleBtn").focus();
  }

  $("addRoleBtn").addEventListener("click", openCreateModal);
  $("closeModal").addEventListener("click", closeCreateModal);
  $("cancelCreate").addEventListener("click", closeCreateModal);

  $("createModal").addEventListener("click", event => {
    if (event.target === $("createModal")) {
      closeCreateModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("createModal").hidden) {
      closeCreateModal();
    }
  });

  $("createRoleForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (saving) return;

    const name = $("newRoleName").value.trim();
    const color = $("newRoleColor").value;

    if (!name) {
      showToast("Enter a role name first.");
      return;
    }

    if (name.length > 32) {
      showToast("Role names must be 32 characters or fewer.");
      return;
    }

    if (roles.length >= 200) {
      showToast("This server has reached the role limit.");
      return;
    }

    if (roles.some(role =>
      role.name.toLowerCase() === name.toLowerCase()
    )) {
      showToast("A role with that name already exists.");
      return;
    }

    const role = {
      id: makeId(),
      name,
      color,
      protected: false,
      permissions: emptyPermissions()
    };

    roles.push(role);
    selectedId = role.id;

    if (await saveRoles()) {
      closeCreateModal();
      renderAll();
      showToast("Role created and saved.");
    } else {
      roles = roles.filter(item => item.id !== role.id);
      selectedId = roles[0]?.id || null;
      renderAll();
    }
  });

  $("roleForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (saving) return;

    const role = getSelectedRole();

    if (!role || role.protected) {
      showToast("This role cannot be edited.");
      return;
    }

    const name = $("roleName").value.trim();
    const color = $("roleColor").value;

    if (!name) {
      showToast("Enter a role name first.");
      return;
    }

    if (name.length > 32) {
      showToast("Role names must be 32 characters or fewer.");
      return;
    }

    if (roles.some(other =>
      other.id !== role.id &&
      other.name.toLowerCase() === name.toLowerCase()
    )) {
      showToast("A role with that name already exists.");
      return;
    }

    const previous = {
      name: role.name,
      color: role.color
    };

    role.name = name;
    role.color = color;

    if (await saveRoles()) {
      renderAll();
      showToast("Role settings saved.");
    } else {
      role.name = previous.name;
      role.color = previous.color;
      renderAll();
    }
  });

  $("roleColor").addEventListener("input", () => {
    $("colorSwatch").style.background = $("roleColor").value;
    $("colorText").textContent = $("roleColor").value.toUpperCase();
  });

  $("colorPresets").addEventListener("click", event => {
    const button = event.target.closest("[data-color]");
    if (!button) return;

    const role = getSelectedRole();

    if (!role || role.protected || saving) return;

    $("roleColor").value = button.dataset.color;
    $("colorSwatch").style.background = button.dataset.color;
    $("colorText").textContent = button.dataset.color.toUpperCase();
  });

  $("clearPermissions").addEventListener("click", async () => {
    const role = getSelectedRole();

    if (!role || role.protected || saving) return;

    const previous = { ...role.permissions };
    role.permissions = emptyPermissions();

    if (await saveRoles()) {
      renderAll();
      showToast("All permissions cleared and saved.");
    } else {
      role.permissions = previous;
      renderAll();
    }
  });

  $("resetRoleBtn").addEventListener("click", async () => {
    const role = getSelectedRole();

    if (!role || role.protected || saving) return;

    const previous = {
      name: role.name,
      color: role.color,
      permissions: { ...role.permissions }
    };

    const defaults = SEED_ROLES.find(item => item.id === role.id);

    if (defaults) {
      role.name = defaults.name;
      role.color = defaults.color;
      role.permissions = normalizeRole(defaults).permissions;
    } else {
      role.permissions = emptyPermissions();
    }

    if (await saveRoles()) {
      renderAll();
      showToast("Role reset and saved.");
    } else {
      Object.assign(role, previous);
      renderAll();
    }
  });

  $("deleteRoleBtn").addEventListener("click", async () => {
    const role = getSelectedRole();

    if (!role || role.protected || saving) return;

    if (!confirm(
      `Delete the "${role.name}" role? This cannot be undone.`
    )) {
      return;
    }

    const previousRoles = roles;
    const previousSelectedId = selectedId;

    roles = roles.filter(item => item.id !== role.id);
    selectedId = roles[0]?.id || null;

    if (await saveRoles()) {
      renderAll();
      showToast("Role deleted and saved.");
    } else {
      roles = previousRoles;
      selectedId = previousSelectedId;
      renderAll();
    }
  });

  // Load the selected server.
  (async function init() {
    try {
      $("serverName").textContent = "Loading server…";
      await loadRolesFromBackend();
    } catch (error) {
      loadFailed = true;
      console.error("Could not load roles:", error);
      $("serverName").textContent = "Could not load server";
      showToast(error.message || "Could not load server roles.");
    }
  })();

})();
