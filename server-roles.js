
(() => {
  "use strict";

  const STORAGE_KEY = "friendchat_roles_preview_v1";

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
      permissions: Object.fromEntries(ALL_PERMISSION_KEYS.map(key => [key, true]))
    },
    {
      id: "admin",
      name: "Admin",
      color: "#ff6f91",
      permissions: Object.fromEntries(ALL_PERMISSION_KEYS.map(key => [key, true]))
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

  let roles = loadRoles();
  let selectedId = roles[0]?.id || null;
  let toastTimer;

  const $ = id => document.getElementById(id);

  function makeId() {
    return "role-" + Date.now().toString(36) +
      "-" + Math.random().toString(36).slice(2, 8);
  }

  function emptyPermissions() {
    return Object.fromEntries(ALL_PERMISSION_KEYS.map(key => [key, false]));
  }

  function normalizeRole(role) {
    const permissions = emptyPermissions();

    if (role.permissions && typeof role.permissions === "object") {
      ALL_PERMISSION_KEYS.forEach(key => {
        permissions[key] = role.permissions[key] === true;
      });
    }

    return {
      id: String(role.id || makeId()),
      name: String(role.name || "New Role").slice(0, 32),
      color: /^#[0-9a-f]{6}$/i.test(role.color || "")
        ? role.color
        : "#8b7bff",
      protected: role.protected === true,
      permissions
    };
  }

  function loadRoles() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map(normalizeRole);
        }
      }
    } catch (error) {
      console.warn("Could not load preview roles:", error);
    }

    return SEED_ROLES.map(role => normalizeRole(role));
  }

  function saveRoles() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
      return true;
    } catch (error) {
      console.error("Could not save roles:", error);
      showToast("Could not save. Check browser storage settings.");
      return false;
    }
  }

  function getSelectedRole() {
    return roles.find(role => role.id === selectedId) || null;
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

  function renderRoles() {
    const list = $("roleList");
    list.replaceChildren();

    roles.forEach(role => {
      const item = document.createElement("div");
      item.className = "role-item" + (role.id === selectedId ? " selected" : "");
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-pressed", String(role.id === selectedId));
      item.setAttribute("aria-label", "Select " + role.name + " role");

      item.innerHTML = `
        <span class="role-color" style="background:${role.color}"></span>
        <span class="role-item-info">
          <strong>${escapeHTML(role.name)}</strong>
          <span>${role.protected ? "Protected role" : "Custom role"}</span>
        </span>
        <span class="role-count">0</span>
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
    $("memberCount").textContent = "0";
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
        checkbox.disabled = role.protected;
        checkbox.setAttribute("aria-label", name);

        const track = document.createElement("span");
        track.className = "switch-track";

        checkbox.addEventListener("change", () => {
          const currentRole = getSelectedRole();
          if (!currentRole || currentRole.protected) return;

          currentRole.permissions[key] = checkbox.checked;

          if (saveRoles()) {
            showToast(name + (checkbox.checked ? " enabled" : " disabled"));
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

    $("editorTitle").textContent = role.protected
      ? "Protected role"
      : "Edit role";

    $("roleStatus").textContent = role.protected ? "Protected" : "Editable";
    $("roleName").value = role.name;
    $("roleName").disabled = role.protected;
    $("roleColor").value = role.color;
    $("roleColor").disabled = role.protected;
    $("colorSwatch").style.background = role.color;
    $("colorText").textContent = role.color.toUpperCase();

    $("deleteRoleBtn").disabled = role.protected;
    $("resetRoleBtn").disabled = role.protected;
    $("clearPermissions").disabled = role.protected;

    $("deleteRoleBtn").style.opacity = role.protected ? ".45" : "1";
    $("resetRoleBtn").style.opacity = role.protected ? ".45" : "1";
    $("clearPermissions").style.opacity = role.protected ? ".45" : "1";

    renderPermissionGroups(role);
  }

  function renderAll() {
    renderRoles();
    renderEditor();
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function openCreateModal() {
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
    if (event.target === $("createModal")) closeCreateModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("createModal").hidden) {
      closeCreateModal();
    }
  });

  $("createRoleForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("newRoleName").value.trim();
    const color = $("newRoleColor").value;

    if (!name) {
      showToast("Enter a role name first.");
      return;
    }

    if (roles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
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

    if (!saveRoles()) {
      roles.pop();
      return;
    }

    closeCreateModal();
    renderAll();
    showToast("Role created successfully.");
  });

  $("roleForm").addEventListener("submit", event => {
    event.preventDefault();

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

    if (!saveRoles()) {
      role.name = previous.name;
      role.color = previous.color;
      return;
    }

    renderAll();
    showToast("Role settings saved.");
  });

  $("roleColor").addEventListener("input", () => {
    $("colorSwatch").style.background = $("roleColor").value;
    $("colorText").textContent = $("roleColor").value.toUpperCase();
  });

  $("colorPresets").addEventListener("click", event => {
    const button = event.target.closest("[data-color]");
    if (!button) return;

    const role = getSelectedRole();
    if (!role || role.protected) return;

    $("roleColor").value = button.dataset.color;
    $("colorSwatch").style.background = button.dataset.color;
    $("colorText").textContent = button.dataset.color.toUpperCase();
  });

  $("clearPermissions").addEventListener("click", () => {
    const role = getSelectedRole();
    if (!role || role.protected) return;

    role.permissions = emptyPermissions();

    if (saveRoles()) {
      renderEditor();
      showToast("All permissions cleared.");
    }
  });

  $("resetRoleBtn").addEventListener("click", () => {
    const role = getSelectedRole();
    if (!role || role.protected) return;

    const defaults = SEED_ROLES.find(item => item.id === role.id);
    if (defaults) {
      role.name = defaults.name;
      role.color = defaults.color;
      role.permissions = normalizeRole(defaults).permissions;
    } else {
      role.permissions = emptyPermissions();
    }

    if (saveRoles()) {
      renderAll();
      showToast("Role reset to its defaults.");
    }
  });

  $("deleteRoleBtn").addEventListener("click", () => {
    const role = getSelectedRole();
    if (!role || role.protected) return;

    if (!confirm(`Delete the "${role.name}" role? This cannot be undone in this preview.`)) {
      return;
    }

    const previousRoles = roles;
    roles = roles.filter(item => item.id !== role.id);
    selectedId = roles[0]?.id || null;

    if (!saveRoles()) {
      roles = previousRoles;
      selectedId = role.id;
      return;
    }

    renderAll();
    showToast("Role deleted.");
  });

  // Show a server name if the existing preview saved one.
  try {
    const savedServer = JSON.parse(
      localStorage.getItem("friendchat_current_server") || "null"
    );

    if (savedServer && typeof savedServer === "object" && savedServer.name) {
      $("serverName").textContent = String(savedServer.name).slice(0, 80);
    } else if (typeof savedServer === "string" && savedServer.trim()) {
      $("serverName").textContent = savedServer.slice(0, 80);
    }
  } catch (_) {
    // Keep the default server name if no usable preview value exists.
  }

  renderAll();
})();
