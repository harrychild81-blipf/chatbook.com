
/* =========================================================
   FRIENDCHAT — SERVER ROLES
   Backend connected • Default roles • Member counts
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

  function allPermissions(value) {
    return Object.fromEntries(
      ALL_PERMISSION_KEYS.map(key => [key, value])
    );
  }

  const SEED_ROLES = [
    {
      id: "owner",
      name: "Owner",
      color: "#806cff",
      protected: true,
      permissions: allPermissions(true)
    },
    {
      id: "admin",
      name: "Admin",
      color: "#ff6f91",
      permissions: allPermissions(true)
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
      color: "#a0a7b4",
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
    return allPermissions(false);
  }

  function normalizeRole(role) {
    role = role && typeof role === "object" ? role : {};

    const permissions = emptyPermissions();

    if (Array.isArray(role.permissions)) {
      role.permissions.forEach(key => {
        if (ALL_PERMISSION_KEYS.includes(key)) {
          permissions[key] = true;
        }
      });
    } else if (role.permissions && typeof role.permissions === "object") {
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
        : "#806cff",
      protected: role.protected === true ||
        id.toLowerCase() === "owner",
      permissions
    };
  }

  function rolesForBackend() {
    return roles.map(role => ({
      roleID: role.id,
      name: role.name,
      color: role.color,
      protected: role.protected,
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
        if (value && value.trim()) return value.trim().toUpperCase();
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

    if (userID) headers["x-friendchat-user-id"] = userID;

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
      2800
    );
  }

  function getSelectedRole() {
    return roles.find(role => role.id === selectedId) || null;
  }

  /*
   * Merge default roles into existing roles.
   * Never delete or replace a user's custom roles.
   */
  function mergeDefaultRoles(existingRoles) {
    const result = existingRoles.map(normalizeRole);

    for (const defaultRole of SEED_ROLES) {
      const exists = result.some(role =>
        role.id.toLowerCase() === defaultRole.id.toLowerCase() ||
        role.name.trim().toLowerCase() ===
          defaultRole.name.trim().toLowerCase()
      );

      if (!exists) {
        result.push(normalizeRole(defaultRole));
      }
    }

    return result;
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

    $("serverName").textContent =
      String(currentServer.name || "FriendChat Server").slice(0, 80);

    const backendRoles = Array.isArray(currentServer.roles)
      ? currentServer.roles
      : [];

    const oldSelectedID = selectedId;
    roles = mergeDefaultRoles(backendRoles);

    selectedId = roles.some(role => role.id === oldSelectedID)
      ? oldSelectedID
      : roles.find(role => role.id.toLowerCase() === "member")?.id ||
        roles[0]?.id ||
        null;

    loadFailed = false;
    renderAll();

    // Save newly added default roles so they can persist after refresh.
    const defaultsWereAdded = roles.length !== backendRoles.length;

    if (defaultsWereAdded) {
      const saved = await saveRoles();

      if (!saved) {
        showToast(
          "Default roles are shown, but the backend did not save them."
        );
      }
    }
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

    const serverID =
      currentServer.serverID ||
      currentServer.serverId ||
      getCurrentServerID();

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

      /*
       * Only accept the response's role array if it includes
       * all roles we attempted to save. This prevents an incomplete
       * response from silently removing defaults from the UI.
       */
      if (Array.isArray(data.server.roles)) {
        const returnedRoles = data.server.roles.map(normalizeRole);

        const allReturned = roles.every(role =>
          returnedRoles.some(savedRole =>
            savedRole.id === role.id ||
            savedRole.name.toLowerCase() === role.name.toLowerCase()
          )
        );

        if (allReturned) roles = returnedRoles;
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

  /*
   * Count members assigned to each role.
   * A dash is displayed when member data is unavailable.
   */
  function getMemberRoleIDs(member) {
    if (!member || typeof member !== "object") return [];

    const ids = [];

    function addRole(value) {
      if (typeof value === "string" || typeof value === "number") {
        ids.push(String(value));
      } else if (value && typeof value === "object") {
        const id = value.roleID || value.roleId || value.id;
        if (id != null) ids.push(String(id));
      }
    }

    if (Array.isArray(member.roles)) member.roles.forEach(addRole);
    if (Array.isArray(member.roleIDs)) member.roleIDs.forEach(addRole);
    if (Array.isArray(member.roleIds)) member.roleIds.forEach(addRole);
    if (Array.isArray(member.serverRoles)) member.serverRoles.forEach(addRole);

    [
      "roleID",
      "roleId",
      "serverRoleID",
      "serverRoleId"
    ].forEach(key => {
      if (member[key] != null) addRole(member[key]);
    });

    return [...new Set(ids)];
  }

  function getRoleMemberCount(role) {
    const members = currentServer?.members;

    if (!Array.isArray(members)) return null;

    const roleID = String(role.id).toLowerCase();

    let count = members.filter(member =>
      getMemberRoleIDs(member).some(id =>
        id.toLowerCase() === roleID
      )
    ).length;

    // Some backends store the owner separately from member roles.
    if (roleID === "owner" && count === 0) {
      const owner = currentServer.ownerID ||
        currentServer.ownerId ||
        currentServer.owner ||
        currentServer.createdBy ||
        currentServer.createdByID;

      if (owner) count = 1;
    }

    return count;
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
    $("newRoleColor").value = "#806cff";
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
    if (event.target === $("createModal")) closeCreateModal();
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

    const previous = { name: role.name, color: role.color };

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

    const defaults = SEED_ROLES.find(item =>
      item.id === role.id
    );

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
    )) return;

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

  // Start by loading the selected server from the backend.
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
