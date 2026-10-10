
/* =========================================================
   FRIENDCHAT — SERVER CUSTOMIZATION FIX
   Simple + Advanced Settings
   File: server-customization.js
   ========================================================= */

(() => {
    "use strict";

    const STYLE_ID = "fc-customization-fixed-css";
    const MODAL_ID = "fc-customization-modal";

    let isSaving = false;

    /* ---------- SERVER ACCESS ---------- */

    function getServer() {
        try {
            if (typeof currentServer !== "undefined" && currentServer) {
                return currentServer;
            }
        } catch (error) {
            console.warn("FriendChat: currentServer unavailable.", error);
        }

        return window.currentServer || null;
    }

    function getSettings(server) {
        if (!server.settings || typeof server.settings !== "object") {
            server.settings = {};
        }

        return server.settings;
    }

    function getMode(server) {
        const settings = getSettings(server);
        return (settings.creationMode || server.creationMode) === "advanced"
            ? "advanced"
            : "simple";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function notify(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        } else {
            console.log("[FriendChat]", message);
        }
    }

    function getAccent(server) {
        const color = getSettings(server).accentColor || "#6c63ff";
        return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#6c63ff";
    }

    /* ---------- APPEARANCE ---------- */

    function applyAppearance() {
        const server = getServer();
        if (!server) return;

        const settings = getSettings(server);

        document.documentElement.style.setProperty(
            "--fc-accent",
            getAccent(server)
        );

        document.documentElement.style.setProperty(
            "--fc-accent-color",
            getAccent(server)
        );

        document.documentElement.dataset.serverTheme =
            settings.theme || "dark";

        document.dispatchEvent(new CustomEvent(
            "friendchat:server-appearance",
            { detail: { serverId: server.id, settings } }
        ));
    }

    /* ---------- CSS ---------- */

    function addCSS() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;

        style.textContent = `
            #${MODAL_ID} {
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 16px;
                background: rgba(0,0,0,.78);
                backdrop-filter: blur(7px);
                overflow-y: auto;
            }

            .fc-cm-window {
                width: min(900px, 100%);
                max-height: 92vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                color: #edf0f7;
                background: #0d121b;
                border: 1px solid #293449;
                border-radius: 16px;
                box-shadow: 0 25px 90px #0009;
                font-family: inherit;
            }

            .fc-cm-header, .fc-cm-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 18px 22px;
                border-bottom: 1px solid #273143;
            }

            .fc-cm-footer {
                justify-content: flex-end;
                border-top: 1px solid #273143;
                border-bottom: 0;
            }

            .fc-cm-header h2 {
                margin: 0;
                font-size: 21px;
            }

            .fc-cm-subtitle {
                margin: 5px 0 0;
                color: #96a2b5;
                font-size: 12px;
            }

            .fc-cm-body {
                padding: 22px;
                overflow-y: auto;
            }

            .fc-cm-close, .fc-cm-btn {
                padding: 10px 14px;
                color: #edf0f7;
                background: #182131;
                border: 1px solid #344158;
                border-radius: 9px;
                cursor: pointer;
                font: inherit;
                font-size: 13px;
            }

            .fc-cm-close {
                font-size: 20px;
            }

            .fc-cm-btn.primary {
                background: #6c63ff;
                border-color: #6c63ff;
            }

            .fc-cm-layout {
                display: grid;
                grid-template-columns: 175px minmax(0, 1fr);
                gap: 22px;
            }

            .fc-cm-nav {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .fc-cm-nav button {
                padding: 12px;
                text-align: left;
                color: #aeb8c9;
                background: transparent;
                border: 1px solid transparent;
                border-radius: 8px;
                cursor: pointer;
            }

            .fc-cm-nav button.active {
                color: white;
                background: #252247;
                border-color: #4942a1;
            }

            .fc-cm-panel h3 {
                margin: 0 0 8px;
                font-size: 19px;
            }

            .fc-cm-panel > p {
                margin: 0 0 20px;
                color: #96a2b5;
                font-size: 13px;
                line-height: 1.6;
            }

            .fc-cm-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 17px;
            }

            .fc-cm-field label {
                font-size: 13px;
                font-weight: 600;
            }

            .fc-cm-field input,
            .fc-cm-field textarea,
            .fc-cm-field select {
                box-sizing: border-box;
                width: 100%;
                padding: 11px;
                color: #edf0f7;
                background: #080d14;
                border: 1px solid #344158;
                border-radius: 8px;
                font: inherit;
                font-size: 13px;
            }

            .fc-cm-field input[type="color"] {
                height: 44px;
                padding: 4px;
            }

            .fc-cm-field textarea {
                min-height: 90px;
                resize: vertical;
            }

            .fc-cm-card {
                padding: 14px;
                margin-bottom: 10px;
                background: #121a27;
                border: 1px solid #293449;
                border-radius: 10px;
                font-size: 13px;
            }

            .fc-cm-card small {
                display: block;
                margin-top: 6px;
                color: #96a2b5;
                line-height: 1.5;
            }

            .fc-cm-notice {
                padding: 12px;
                margin-bottom: 16px;
                color: #e9d8a7;
                background: #292316;
                border: 1px solid #584824;
                border-radius: 9px;
                font-size: 12px;
                line-height: 1.5;
            }

            .fc-cm-check {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 14px;
                padding: 14px;
                background: #121a27;
                border: 1px solid #293449;
                border-radius: 10px;
                font-size: 13px;
            }

            .fc-cm-check input {
                width: 18px;
                height: 18px;
                accent-color: #6c63ff;
            }

            @media(max-width:600px) {
                .fc-cm-layout {
                    grid-template-columns: 1fr;
                }

                .fc-cm-nav {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .fc-cm-body {
                    padding: 15px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ---------- FORM HELPERS ---------- */

    function inputField(label, id, value, type = "text") {
        return `
            <div class="fc-cm-field">
                <label for="${id}">${escapeHTML(label)}</label>
                <input id="${id}" type="${type}"
                       value="${escapeHTML(value)}">
            </div>
        `;
    }

    function textareaField(label, id, value) {
        return `
            <div class="fc-cm-field">
                <label for="${id}">${escapeHTML(label)}</label>
                <textarea id="${id}">${escapeHTML(value)}</textarea>
            </div>
        `;
    }

    function selectField(label, id, value, options) {
        return `
            <div class="fc-cm-field">
                <label for="${id}">${escapeHTML(label)}</label>
                <select id="${id}">
                    ${options.map(option => `
                        <option value="${option.value}"
                            ${value === option.value ? "selected" : ""}>
                            ${option.label}
                        </option>
                    `).join("")}
                </select>
            </div>
        `;
    }

    function read(id, fallback = "") {
        const element = document.getElementById(id);
        return element ? element.value.trim() : fallback;
    }

    function checked(id, fallback = false) {
        const element = document.getElementById(id);
        return element ? element.checked : fallback;
    }

    /* ---------- SIMPLE MODE ---------- */

    function simplePanel(server) {
        const settings = getSettings(server);

        return `
            <div class="fc-cm-panel">
                <h3>Basic Customization</h3>
                <p>Change your server's name, details, and appearance.</p>

                ${inputField("Server Name", "fc-cm-name", server.name || "")}
                ${textareaField("Description", "fc-cm-description",
                    server.description || "")}
                ${inputField("Icon URL", "fc-cm-icon", server.icon || "")}
                ${inputField("Banner URL", "fc-cm-banner",
                    server.banner || "")}
                ${inputField("Background Image URL", "fc-cm-background",
                    settings.background || "")}

                ${selectField("Theme", "fc-cm-theme",
                    settings.theme || "dark", [
                        { value: "dark", label: "Dark" },
                        { value: "midnight", label: "Midnight" },
                        { value: "light", label: "Light" }
                    ])}

                <div class="fc-cm-field">
                    <label for="fc-cm-accent">Accent Color</label>
                    <input id="fc-cm-accent" type="color"
                           value="${getAccent(server)}">
                </div>
            </div>
        `;
    }

    /* ---------- ADVANCED MODE ---------- */

    const tabs = [
        ["general", "General"],
        ["appearance", "Appearance"],
        ["channels", "Channels"],
        ["roles", "Roles"],
        ["privacy", "Safety & Privacy"]
    ];

    function advancedPanel(server, tab) {
        const settings = getSettings(server);
        const privacy = settings.privacy || {};
        const channels = Array.isArray(server.channels) ? server.channels : [];
        const roles = Array.isArray(server.roles) ? server.roles : [];

        if (tab === "general") {
            return `
                <h3>General Settings</h3>
                <p>Manage your server identity and description.</p>

                ${inputField("Server Name", "fc-cm-name", server.name || "")}
                ${textareaField("Description", "fc-cm-description",
                    server.description || "")}
                ${inputField("Icon URL", "fc-cm-icon", server.icon || "")}

                <div class="fc-cm-card">
                    <strong>Server ID</strong>
                    <small>${escapeHTML(server.id || server._id || "Unavailable")}</small>
                </div>

                <div class="fc-cm-card">
                    <strong>Mode: Advanced</strong>
                    <small>Use the navigation to access additional settings.</small>
                </div>
            `;
        }

        if (tab === "appearance") {
            return `
                <h3>Appearance</h3>
                <p>Customize your server's visual style.</p>

                ${inputField("Banner URL", "fc-cm-banner", server.banner || "")}
                ${inputField("Background Image URL", "fc-cm-background",
                    settings.background || "")}

                ${selectField("Theme", "fc-cm-theme",
                    settings.theme || "dark", [
                        { value: "dark", label: "Dark" },
                        { value: "midnight", label: "Midnight" },
                        { value: "light", label: "Light" }
                    ])}

                <div class="fc-cm-field">
                    <label for="fc-cm-accent">Accent Color</label>
                    <input id="fc-cm-accent" type="color"
                           value="${getAccent(server)}">
                </div>
            `;
        }

        if (tab === "channels") {
            return `
                <h3>Channel Overview</h3>
                <p>Review the channels stored on your server.</p>

                <div class="fc-cm-notice">
                    This is a read-only overview. Your existing channel
                    management code remains responsible for editing channels.
                </div>

                ${channels.length ? channels.map(channel => `
                    <div class="fc-cm-card">
                        ${channel.type === "voice" ? "🔊" : "#"}
                        ${escapeHTML(channel.name || "Unnamed channel")}
                        <small>${escapeHTML(channel.type || "text")}</small>
                    </div>
                `).join("") : `
                    <div class="fc-cm-card">No channels found.</div>
                `}
            `;
        }

        if (tab === "roles") {
            return `
                <h3>Role Overview</h3>
                <p>Review the roles stored on your server.</p>

                <div class="fc-cm-notice">
                    Role editing and permission enforcement need backend support.
                </div>

                ${roles.length ? roles.map(role => `
                    <div class="fc-cm-card">
                        ${escapeHTML(role.name || "Unnamed role")}
                    </div>
                `).join("") : `
                    <div class="fc-cm-card">No roles found.</div>
                `}
            `;
        }

        return `
            <h3>Safety & Privacy</h3>
            <p>Configure the privacy preferences for your server.</p>

            <div class="fc-cm-notice">
                These preferences are saved as settings only. Your backend
                must enforce them to prevent unauthorized access.
            </div>

            ${checkRow("Private Server", "fc-cm-private",
                privacy.privateServer,
                "Intended for invited members.")}

            ${checkRow("Require Join Approval", "fc-cm-approval",
                privacy.requireApproval,
                "New members should be approved.")}

            ${checkRow("Require Verification", "fc-cm-verification",
                privacy.requireVerification,
                "New members should complete verification.")}

            ${selectField("Moderation Preference", "fc-cm-moderation",
                settings.moderationLevel || "standard", [
                    { value: "relaxed", label: "Relaxed" },
                    { value: "standard", label: "Standard" },
                    { value: "strict", label: "Strict" }
                ])}
        `;
    }

    function checkRow(label, id, value, description) {
        return `
            <label class="fc-cm-check">
                <input id="${id}" type="checkbox"
                       ${value ? "checked" : ""}>
                <span>
                    <strong>${escapeHTML(label)}</strong>
                    <small>${escapeHTML(description)}</small>
                </span>
            </label>
        `;
    }

    function renderAdvanced(server, tab) {
        const content = document.getElementById("fc-cm-content");
        if (!content) return;

        content.innerHTML = `
            <div class="fc-cm-layout">
                <nav class="fc-cm-nav">
                    ${tabs.map(([id, label]) => `
                        <button type="button"
                                data-cm-tab="${id}"
                                class="${id === tab ? "active" : ""}">
                            ${label}
                        </button>
                    `).join("")}
                </nav>

                <div class="fc-cm-panel" id="fc-cm-panel">
                    ${advancedPanel(server, tab)}
                </div>
            </div>
        `;

        content.querySelectorAll("[data-cm-tab]").forEach(button => {
            button.addEventListener("click", () => {
                renderAdvanced(server, button.dataset.cmTab);
            });
        });
    }

    /* ---------- OPEN MODAL ---------- */

    function openSettings() {
        const server = getServer();

        if (!server) {
            console.error(
                "FriendChat: no current server. Wait for server-home.js to load it."
            );
            notify("Server is still loading. Please try again.");
            return;
        }

        addCSS();

        document.getElementById(MODAL_ID)?.remove();

        const mode = getMode(server);
        const overlay = document.createElement("div");
        overlay.id = MODAL_ID;

        overlay.innerHTML = `
            <section class="fc-cm-window"
                     role="dialog" aria-modal="true"
                     aria-label="Server Settings">

                <header class="fc-cm-header">
                    <div>
                        <h2>Server Settings</h2>
                        <p class="fc-cm-subtitle">
                            ${mode === "advanced"
                                ? "Advanced customization"
                                : "Simple customization"}
                        </p>
                    </div>
                    <button class="fc-cm-close" type="button"
                            data-cm-close aria-label="Close">×</button>
                </header>

                <main class="fc-cm-body">
                    <div id="fc-cm-content"></div>
                </main>

                <footer class="fc-cm-footer">
                    <button class="fc-cm-btn" type="button"
                            data-cm-close>Cancel</button>
                    <button class="fc-cm-btn primary" type="button"
                            id="fc-cm-save">Save Changes</button>
                </footer>
            </section>
        `;

        overlay.addEventListener("click", event => {
            if (event.target === overlay ||
                event.target.closest("[data-cm-close]")) {
                overlay.remove();
            }
        });

        document.body.appendChild(overlay);

        if (mode === "advanced") {
            renderAdvanced(server, "general");
        } else {
            document.getElementById("fc-cm-content").innerHTML =
                simplePanel(server);
        }

        overlay.querySelector("#fc-cm-save")
            .addEventListener("click", saveSettings);

        const escapeHandler = event => {
            if (event.key === "Escape") {
                overlay.remove();
                document.removeEventListener("keydown", escapeHandler);
            }
        };

        document.addEventListener("keydown", escapeHandler);
    }

    /* ---------- SAVE ---------- */

    async function saveSettings() {
        if (isSaving) return;

        const server = getServer();
        if (!server) {
            notify("Could not find the current server.");
            return;
        }

        const name = read("fc-cm-name", server.name || "");
        const description = read(
            "fc-cm-description",
            server.description || ""
        );

        if (!name) {
            notify("Please enter a server name.");
            return;
        }

        if (name.length > 80 || description.length > 1000) {
            notify("Server name or description is too long.");
            return;
        }

        const icon = read("fc-cm-icon", server.icon || "");
        const banner = read("fc-cm-banner", server.banner || "");
        const background = read(
            "fc-cm-background",
            getSettings(server).background || ""
        );

        for (const [label, value] of [
            ["icon", icon],
            ["banner", banner],
            ["background", background]
        ]) {
            if (value) {
                try {
                    const url = new URL(value);
                    if (!["http:", "https:"].includes(url.protocol)) {
                        throw new Error("Invalid protocol");
                    }
                } catch {
                    notify("Please enter a valid URL for the server " + label + ".");
                    return;
                }
            }
        }

        const settings = getSettings(server);

        server.name = name;
        server.description = description;
        server.icon = icon;
        server.banner = banner;

        settings.theme = read("fc-cm-theme", settings.theme || "dark");
        settings.accentColor = read(
            "fc-cm-accent",
            getAccent(server)
        );
        settings.background = background;

        if (getMode(server) === "advanced") {
            settings.privacy = {
                privateServer: checked(
                    "fc-cm-private",
                    settings.privacy?.privateServer || false
                ),
                requireApproval: checked(
                    "fc-cm-approval",
                    settings.privacy?.requireApproval || false
                ),
                requireVerification: checked(
                    "fc-cm-verification",
                    settings.privacy?.requireVerification || false
                )
            };

            settings.moderationLevel = read(
                "fc-cm-moderation",
                settings.moderationLevel || "standard"
            );
        }

        isSaving = true;

        const saveButton = document.getElementById("fc-cm-save");
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        try {
            if (typeof window.saveServerToBackend !== "function") {
                throw new Error(
                    "saveServerToBackend() is missing from server-home.js"
                );
            }

            const result = await window.saveServerToBackend();

            if (result === false) {
                throw new Error("Backend rejected the save.");
            }

            applyAppearance();
            document.getElementById(MODAL_ID)?.remove();
            notify("Server settings saved!");
        } catch (error) {
            console.error("FriendChat settings save error:", error);
            notify("Settings could not be saved. Check the server connection.");
        } finally {
            isSaving = false;
        }
    }

    /* ---------- CONNECT BUTTON ---------- */

    function connectButton() {
        const button = document.getElementById("settingsButton");

        if (!button || button.dataset.fcCustomizationConnected === "yes") {
            return;
        }

        button.dataset.fcCustomizationConnected = "yes";

        button.addEventListener("click", event => {
            event.preventDefault();
            openSettings();
        });
    }

    function init() {
        addCSS();
        connectButton();
        applyAppearance();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

    // Public functions for existing FriendChat scripts.
    window.openServerSettings = openSettings;
    window.closeServerSettings = () => {
        document.getElementById(MODAL_ID)?.remove();
    };
    window.applyServerAppearance = applyAppearance;
    window.initServerCustomization = init;

})();
