
/* =========================================================
   FRIENDCHAT — COMPLETE SERVER CUSTOMIZATION
   SIMPLE MODE + ADVANCED MODE
   File: server-customization.js
   ========================================================= */

(() => {
    "use strict";

    const STYLE_ID = "fc-server-customization-styles";
    const OVERLAY_ID = "fc-server-settings-overlay";

    let activeTab = "general";
    let saving = false;

    /* -----------------------------------------------------
       1. CSS
    ----------------------------------------------------- */

    function addStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;

        style.textContent = `
            #${OVERLAY_ID} {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(0, 0, 0, .78);
                backdrop-filter: blur(8px);
                overflow-y: auto;
            }

            .fc-settings-modal {
                width: min(100%, 950px);
                max-height: 92vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                color: #edf0f7;
                background: #0d121b;
                border: 1px solid #273143;
                border-radius: 18px;
                box-shadow: 0 25px 100px rgba(0, 0, 0, .5);
                font-family: inherit;
            }

            .fc-settings-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                padding: 20px 24px;
                border-bottom: 1px solid #222c3b;
            }

            .fc-settings-header h2 {
                margin: 0;
                font-size: 21px;
            }

            .fc-settings-subtitle {
                margin: 5px 0 0;
                color: #929eb1;
                font-size: 13px;
            }

            .fc-settings-close {
                width: 38px;
                height: 38px;
                flex-shrink: 0;
                color: #dce3f0;
                background: #171f2c;
                border: 1px solid #293549;
                border-radius: 10px;
                font-size: 22px;
                cursor: pointer;
            }

            .fc-settings-close:hover {
                background: #263247;
            }

            .fc-settings-body {
                min-height: 0;
                overflow-y: auto;
                padding: 24px;
            }

            .fc-settings-footer {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 10px;
                padding: 16px 24px;
                border-top: 1px solid #222c3b;
                background: #0b1018;
            }

            .fc-settings-btn {
                min-height: 40px;
                padding: 10px 16px;
                color: #edf0f7;
                background: #171f2c;
                border: 1px solid #303c50;
                border-radius: 9px;
                font: inherit;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }

            .fc-settings-btn:hover {
                filter: brightness(1.15);
            }

            .fc-settings-btn.primary {
                color: white;
                background: #6c63ff;
                border-color: #6c63ff;
            }

            .fc-settings-btn.danger {
                color: #ff9a9a;
                border-color: #6e303b;
                background: #27151c;
            }

            .fc-settings-layout {
                display: grid;
                grid-template-columns: 190px minmax(0, 1fr);
                gap: 24px;
                min-height: 350px;
            }

            .fc-settings-nav {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .fc-settings-nav button {
                padding: 12px;
                text-align: left;
                color: #aab5c7;
                background: transparent;
                border: 1px solid transparent;
                border-radius: 9px;
                font: inherit;
                font-size: 13px;
                cursor: pointer;
            }

            .fc-settings-nav button:hover {
                color: white;
                background: #151e2b;
            }

            .fc-settings-nav button.active {
                color: white;
                background: #211f42;
                border-color: #4841a0;
            }

            .fc-settings-section h3 {
                margin: 0 0 7px;
                font-size: 19px;
            }

            .fc-settings-section > p {
                margin: 0 0 22px;
                color: #929eb1;
                font-size: 13px;
                line-height: 1.6;
            }

            .fc-settings-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 19px;
            }

            .fc-settings-field label {
                color: #dce3f0;
                font-size: 13px;
                font-weight: 600;
            }

            .fc-settings-field input,
            .fc-settings-field textarea,
            .fc-settings-field select {
                box-sizing: border-box;
                width: 100%;
                padding: 11px 12px;
                color: #edf0f7;
                background: #080d14;
                border: 1px solid #303c50;
                border-radius: 9px;
                font: inherit;
                font-size: 13px;
                outline: none;
            }

            .fc-settings-field input:focus,
            .fc-settings-field textarea:focus,
            .fc-settings-field select:focus {
                border-color: #6c63ff;
                box-shadow: 0 0 0 2px rgba(108, 99, 255, .15);
            }

            .fc-settings-field textarea {
                min-height: 95px;
                resize: vertical;
            }

            .fc-settings-field input[type="color"] {
                height: 46px;
                padding: 4px;
                cursor: pointer;
            }

            .fc-settings-help {
                color: #7f8ca2;
                font-size: 12px;
                line-height: 1.5;
            }

            .fc-settings-card {
                padding: 15px;
                margin-bottom: 12px;
                background: #111824;
                border: 1px solid #283347;
                border-radius: 12px;
            }

            .fc-settings-card-title {
                margin-bottom: 5px;
                font-size: 13px;
                font-weight: 700;
            }

            .fc-settings-card-description {
                color: #929eb1;
                font-size: 12px;
                line-height: 1.5;
            }

            .fc-settings-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 14px;
            }

            .fc-settings-check {
                width: 18px;
                height: 18px;
                accent-color: #6c63ff;
                cursor: pointer;
                flex-shrink: 0;
            }

            .fc-settings-list-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 13px;
                margin-top: 8px;
                background: #111824;
                border: 1px solid #283347;
                border-radius: 10px;
                font-size: 13px;
            }

            .fc-settings-pill {
                display: inline-block;
                padding: 5px 8px;
                color: #c9c5ff;
                background: #242147;
                border-radius: 6px;
                font-size: 11px;
            }

            .fc-settings-notice {
                padding: 12px 14px;
                margin-bottom: 18px;
                color: #e7d4a2;
                background: #292316;
                border: 1px solid #5a4825;
                border-radius: 9px;
                font-size: 12px;
                line-height: 1.6;
            }

            .fc-settings-empty {
                padding: 22px;
                color: #929eb1;
                text-align: center;
                background: #111824;
                border: 1px dashed #344158;
                border-radius: 10px;
                font-size: 13px;
            }

            .fc-settings-simple {
                max-width: 620px;
                margin: 0 auto;
            }

            .fc-settings-simple .fc-settings-section {
                padding: 4px 0;
            }

            .fc-settings-banner-preview {
                width: 100%;
                height: 105px;
                margin-bottom: 15px;
                overflow: hidden;
                background: #171f2c;
                border: 1px solid #303c50;
                border-radius: 10px;
            }

            .fc-settings-banner-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            @media (max-width: 650px) {
                #${OVERLAY_ID} {
                    padding: 8px;
                    align-items: flex-start;
                }

                .fc-settings-modal {
                    max-height: 96vh;
                    margin: auto 0;
                }

                .fc-settings-header {
                    padding: 16px;
                }

                .fc-settings-body {
                    padding: 16px;
                }

                .fc-settings-footer {
                    padding: 12px 16px;
                }

                .fc-settings-layout {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .fc-settings-nav {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .fc-settings-nav button {
                    padding: 10px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* -----------------------------------------------------
       2. SERVER HELPERS
    ----------------------------------------------------- */

    function getServer() {
        return window.currentServer || null;
    }

    function getSettings(server) {
        if (!server.settings || typeof server.settings !== "object") {
            server.settings = {};
        }

        return server.settings;
    }

    function getCreationMode(server) {
        const settings = getSettings(server);

        const mode = server.creationMode || settings.creationMode;

        return mode === "advanced" ? "advanced" : "simple";
    }

    function getServerId(server) {
        return server.id || server._id || server.serverId || "";
    }

    function getChannels(server) {
        return Array.isArray(server.channels) ? server.channels : [];
    }

    function getRoles(server) {
        return Array.isArray(server.roles) ? server.roles : [];
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function safeColor(value, fallback = "#6c63ff") {
        return /^#[0-9a-fA-F]{6}$/.test(String(value || ""))
            ? value
            : fallback;
    }

    function getAccent(server) {
        return safeColor(
            getSettings(server).accentColor ||
            server.accentColor ||
            "#6c63ff"
        );
    }

    function getTheme(server) {
        const theme = getSettings(server).theme || "dark";

        return ["dark", "midnight", "light"].includes(theme)
            ? theme
            : "dark";
    }

    function showMessage(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        } else {
            alert(message);
        }
    }

    function applyServerAppearance() {
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

        document.documentElement.dataset.serverTheme = getTheme(server);

        if (settings.background) {
            document.documentElement.style.setProperty(
                "--fc-server-background",
                `url("${String(settings.background).replace(/["\\]/g, "")}")`
            );
        } else {
            document.documentElement.style.removeProperty(
                "--fc-server-background"
            );
        }

        document.dispatchEvent(new CustomEvent("friendchat:server-appearance", {
            detail: {
                serverId: getServerId(server),
                settings: { ...settings }
            }
        }));
    }

    /* -----------------------------------------------------
       3. MODAL HELPERS
    ----------------------------------------------------- */

    function closeSettings() {
        document.getElementById(OVERLAY_ID)?.remove();
    }

    function createModal(server, mode) {
        closeSettings();

        activeTab = "general";

        const overlay = document.createElement("div");
        overlay.id = OVERLAY_ID;

        overlay.innerHTML = `
            <div class="fc-settings-modal" role="dialog"
                 aria-modal="true"
                 aria-label="Server settings">

                <div class="fc-settings-header">
                    <div>
                        <h2>Server Settings</h2>
                        <p class="fc-settings-subtitle">
                            ${mode === "advanced"
                                ? "Advanced server control panel"
                                : "Customize your server"}
                        </p>
                    </div>

                    <button class="fc-settings-close"
                            type="button"
                            data-close
                            aria-label="Close settings">×</button>
                </div>

                <div class="fc-settings-body">
                    <div id="fc-settings-content"></div>
                </div>

                <div class="fc-settings-footer">
                    <button class="fc-settings-btn"
                            type="button"
                            data-close>Cancel</button>

                    <button class="fc-settings-btn primary"
                            type="button"
                            id="fc-settings-save">Save Changes</button>
                </div>
            </div>
        `;

        overlay.addEventListener("click", event => {
            if (
                event.target === overlay ||
                event.target.closest("[data-close]")
            ) {
                closeSettings();
            }
        });

        document.body.appendChild(overlay);

        overlay.querySelector("#fc-settings-save")
            .addEventListener("click", saveSettings);

        if (mode === "advanced") {
            renderAdvanced(server, "general");
        } else {
            renderSimple(server);
        }

        return overlay;
    }

    function field(label, id, value, type = "text", help = "") {
        return `
            <div class="fc-settings-field">
                <label for="${id}">${escapeHTML(label)}</label>
                <input id="${id}"
                       type="${type}"
                       value="${escapeHTML(value)}">
                ${help
                    ? `<div class="fc-settings-help">${escapeHTML(help)}</div>`
                    : ""}
            </div>
        `;
    }

    function textareaField(label, id, value, help = "") {
        return `
            <div class="fc-settings-field">
                <label for="${id}">${escapeHTML(label)}</label>
                <textarea id="${id}">${escapeHTML(value)}</textarea>
                ${help
                    ? `<div class="fc-settings-help">${escapeHTML(help)}</div>`
                    : ""}
            </div>
        `;
    }

    function selectField(label, id, value, options) {
        return `
            <div class="fc-settings-field">
                <label for="${id}">${escapeHTML(label)}</label>
                <select id="${id}">
                    ${options.map(option => `
                        <option value="${escapeHTML(option.value)}"
                            ${option.value === value ? "selected" : ""}>
                            ${escapeHTML(option.label)}
                        </option>
                    `).join("")}
                </select>
            </div>
        `;
    }

    /* -----------------------------------------------------
       4. SIMPLE SETTINGS
    ----------------------------------------------------- */

    function renderSimple(server) {
        const settings = getSettings(server);
        const content = document.getElementById("fc-settings-content");

        content.className = "fc-settings-simple";

        content.innerHTML = `
            <div class="fc-settings-section">
                <h3>Basic Customization</h3>
                <p>Change the main details and appearance of your server.</p>

                ${field("Server Name", "fc-server-name",
                    server.name || "")}

                ${textareaField("Description", "fc-server-description",
                    server.description || "")}

                ${field("Icon Image URL", "fc-server-icon",
                    server.icon || "")}

                ${field("Banner Image URL", "fc-server-banner",
                    server.banner || "")}

                ${field("Background Image URL", "fc-server-background",
                    settings.background || "")}

                ${selectField("Theme", "fc-server-theme",
                    getTheme(server), [
                        { value: "dark", label: "Dark" },
                        { value: "midnight", label: "Midnight" },
                        { value: "light", label: "Light" }
                    ])}

                <div class="fc-settings-field">
                    <label for="fc-server-accent">Accent Color</label>
                    <input id="fc-server-accent"
                           type="color"
                           value="${getAccent(server)}">
                </div>

                <div class="fc-settings-help">
                    Image fields accept image URLs. Make sure the image
                    is accessible to the people using your server.
                </div>
            </div>
        `;
    }

    /* -----------------------------------------------------
       5. ADVANCED SETTINGS NAVIGATION
    ----------------------------------------------------- */

    const advancedTabs = [
        { id: "general", label: "General" },
        { id: "appearance", label: "Appearance" },
        { id: "channels", label: "Channels" },
        { id: "roles", label: "Roles" },
        { id: "safety", label: "Safety & Privacy" }
    ];

    function renderAdvanced(server, tab) {
        activeTab = tab;

        const content = document.getElementById("fc-settings-content");
        if (!content) return;

        content.className = "";

        content.innerHTML = `
            <div class="fc-settings-layout">
                <nav class="fc-settings-nav" aria-label="Settings sections">
                    ${advancedTabs.map(item => `
                        <button type="button"
                                data-tab="${item.id}"
                                class="${item.id === tab ? "active" : ""}">
                            ${escapeHTML(item.label)}
                        </button>
                    `).join("")}
                </nav>

                <div class="fc-settings-section" id="fc-settings-panel">
                    ${renderAdvancedPanel(server, tab)}
                </div>
            </div>
        `;

        content.querySelectorAll("[data-tab]").forEach(button => {
            button.addEventListener("click", () => {
                renderAdvanced(server, button.dataset.tab);
            });
        });
    }

    /* -----------------------------------------------------
       6. ADVANCED SETTINGS PANELS
    ----------------------------------------------------- */

    function renderAdvancedPanel(server, tab) {
        const settings = getSettings(server);

        if (tab === "general") {
            return `
                <h3>General</h3>
                <p>Manage your server identity and core preferences.</p>

                ${field("Server Name", "fc-server-name", server.name || "")}

                ${textareaField("Description", "fc-server-description",
                    server.description || "")}

                ${field("Server Icon URL", "fc-server-icon",
                    server.icon || "")}

                <div class="fc-settings-card">
                    <div class="fc-settings-card-title">Server ID</div>
                    <div class="fc-settings-card-description">
                        ${escapeHTML(getServerId(server) || "Not available")}
                    </div>
                </div>

                <div class="fc-settings-card">
                    <div class="fc-settings-card-title">Creation Mode</div>
                    <div class="fc-settings-card-description">
                        Advanced
                    </div>
                </div>
            `;
        }

        if (tab === "appearance") {
            return `
                <h3>Appearance</h3>
                <p>Control the visual identity of your server.</p>

                <div class="fc-settings-banner-preview" id="fc-banner-preview">
                    ${server.banner
                        ? `<img src="${escapeHTML(server.banner)}"
                                alt="Server banner preview">`
                        : ""}
                </div>

                ${field("Banner Image URL", "fc-server-banner",
                    server.banner || "")}

                ${field("Background Image URL", "fc-server-background",
                    settings.background || "")}

                ${selectField("Color Theme", "fc-server-theme",
                    getTheme(server), [
                        { value: "dark", label: "Dark" },
                        { value: "midnight", label: "Midnight" },
                        { value: "light", label: "Light" }
                    ])}

                <div class="fc-settings-field">
                    <label for="fc-server-accent">Accent Color</label>
                    <input id="fc-server-accent"
                           type="color"
                           value="${getAccent(server)}">
                </div>

                <div class="fc-settings-card">
                    <div class="fc-settings-card-title">Appearance Preview</div>
                    <div class="fc-settings-card-description">
                        The accent color is applied to the page CSS variables.
                        Additional pages must use those variables to reflect
                        the selected theme consistently.
                    </div>
                </div>
            `;
        }

        if (tab === "channels") {
            const channels = getChannels(server);

            return `
                <h3>Channels</h3>
                <p>Review the channels currently saved for this server.</p>

                <div class="fc-settings-notice">
                    This panel is a channel overview. Channel creation,
                    deletion, permissions, and reordering must be handled
                    by your server-home channel management code.
                </div>

                ${channels.length
                    ? channels.map(channel => `
                        <div class="fc-settings-list-item">
                            <span>
                                ${channel.type === "voice" ? "🔊" : "#"}
                                ${escapeHTML(channel.name || "Unnamed channel")}
                            </span>
                            <span class="fc-settings-pill">
                                ${escapeHTML(channel.type || "text")}
                            </span>
                        </div>
                    `).join("")
                    : `<div class="fc-settings-empty">
                        No channels have been added yet.
                    </div>`
                }
            `;
        }

        if (tab === "roles") {
            const roles = getRoles(server);

            return `
                <h3>Roles</h3>
                <p>Review the roles currently saved for this server.</p>

                <div class="fc-settings-notice">
                    This panel displays saved roles only. Creating roles,
                    assigning members, and enforcing permissions require
                    backend support.
                </div>

                ${roles.length
                    ? roles.map(role => `
                        <div class="fc-settings-list-item">
                            <span>${escapeHTML(role.name || "Unnamed role")}</span>
                            <span class="fc-settings-pill">
                                ${escapeHTML(role.id || role.color || "Role")}
                            </span>
                        </div>
                    `).join("")
                    : `<div class="fc-settings-empty">
                        No roles have been added yet.
                    </div>`
                }
            `;
        }

        if (tab === "safety") {
            const privacy = settings.privacy || {};

            return `
                <h3>Safety & Privacy</h3>
                <p>Save your server's intended privacy and moderation preferences.</p>

                <div class="fc-settings-notice">
                    Important: these options are saved as preferences.
                    They do not secure or restrict your server by themselves.
                    Your backend must enforce access rules for them to work.
                </div>

                ${checkboxCard(
                    "Private Server",
                    "fc-private-server",
                    privacy.privateServer,
                    "Mark this server as intended for invited members only."
                )}

                ${checkboxCard(
                    "Require Join Approval",
                    "fc-require-approval",
                    privacy.requireApproval,
                    "Indicate that new membership should require approval."
                )}

                ${checkboxCard(
                    "Require Verification",
                    "fc-require-verification",
                    privacy.requireVerification,
                    "Indicate that new members should complete verification."
                )}

                ${selectField(
                    "Moderation Preference",
                    "fc-moderation-level",
                    settings.moderationLevel || "standard",
                    [
                        { value: "relaxed", label: "Relaxed" },
                        { value: "standard", label: "Standard" },
                        { value: "strict", label: "Strict" }
                    ]
                )}
            `;
        }

        return "";
    }

    function checkboxCard(title, id, checked, description) {
        return `
            <div class="fc-settings-card">
                <div class="fc-settings-row">
                    <div>
                        <div class="fc-settings-card-title">
                            ${escapeHTML(title)}
                        </div>
                        <div class="fc-settings-card-description">
                            ${escapeHTML(description)}
                        </div>
                    </div>

                    <input class="fc-settings-check"
                           type="checkbox"
                           id="${id}"
                           ${checked ? "checked" : ""}>
                </div>
            </div>
        `;
    }

    /* -----------------------------------------------------
       7. READ FORM VALUES
    ----------------------------------------------------- */

    function readValue(id, fallback = "") {
        const element = document.getElementById(id);

        return element ? element.value.trim() : fallback;
    }

    function readChecked(id, fallback = false) {
        const element = document.getElementById(id);

        return element ? element.checked : fallback;
    }

    function collectFormValues(server) {
        const settings = getSettings(server);

        const result = {
            name: readValue("fc-server-name", server.name || ""),
            description: readValue(
                "fc-server-description",
                server.description || ""
            ),
            icon: readValue("fc-server-icon", server.icon || ""),
            banner: readValue("fc-server-banner", server.banner || ""),
            background: readValue(
                "fc-server-background",
                settings.background || ""
            ),
            theme: readValue("fc-server-theme", getTheme(server)),
            accentColor: safeColor(
                readValue("fc-server-accent", getAccent(server)),
                getAccent(server)
            )
        };

        return result;
    }

    function validateImageURL(value, label) {
        if (!value) return true;

        try {
            const url = new URL(value);

            if (!["http:", "https:"].includes(url.protocol)) {
                showMessage(label + " must use an HTTP or HTTPS URL.");
                return false;
            }

            return true;
        } catch {
            showMessage("Please enter a valid URL for " + label + ".");
            return false;
        }
    }

    /* -----------------------------------------------------
       8. SAVE SETTINGS
    ----------------------------------------------------- */

    async function saveSettings() {
        if (saving) return;

        const server = getServer();

        if (!server) {
            showMessage("Could not find the current server.");
            return;
        }

        const values = collectFormValues(server);

        if (!values.name) {
            showMessage("Please enter a server name.");
            return;
        }

        if (values.name.length > 80) {
            showMessage("Server name must be 80 characters or fewer.");
            return;
        }

        if (values.description.length > 1000) {
            showMessage("Description must be 1000 characters or fewer.");
            return;
        }

        if (
            !validateImageURL(values.icon, "server icon") ||
            !validateImageURL(values.banner, "server banner") ||
            !validateImageURL(values.background, "server background")
        ) {
            return;
        }

        const previousServer = JSON.parse(JSON.stringify(server));
        const settings = getSettings(server);
        const mode = getCreationMode(server);

        server.name = values.name;
        server.description = values.description;
        server.icon = values.icon;
        server.banner = values.banner;

        settings.theme = values.theme;
        settings.accentColor = values.accentColor;
        settings.background = values.background;
        settings.creationMode = mode;

        server.creationMode = mode;

        if (mode === "advanced") {
            settings.privacy = {
                privateServer: readChecked(
                    "fc-private-server",
                    settings.privacy?.privateServer || false
                ),
                requireApproval: readChecked(
                    "fc-require-approval",
                    settings.privacy?.requireApproval || false
                ),
                requireVerification: readChecked(
                    "fc-require-verification",
                    settings.privacy?.requireVerification || false
                )
            };

            settings.moderationLevel = readValue(
                "fc-moderation-level",
                settings.moderationLevel || "standard"
            );
        }

        const saveButton = document.getElementById("fc-settings-save");

        saving = true;

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        try {
            if (typeof window.saveServerToBackend !== "function") {
                throw new Error(
                    "saveServerToBackend() is not available. Check server-home.js."
                );
            }

            const success = await window.saveServerToBackend();

            if (success === false) {
                throw new Error("The server could not be saved.");
            }

            applyServerAppearance();
            closeSettings();
            showMessage("Server settings saved successfully.");
        } catch (error) {
            console.error("FriendChat server settings save failed:", error);

            window.currentServer = previousServer;

            showMessage(
                "Could not save settings. Check your server connection and try again."
            );
        } finally {
            saving = false;
        }
    }

    /* -----------------------------------------------------
       9. OPEN SETTINGS
    ----------------------------------------------------- */

    function openServerSettings() {
        const server = getServer();

        if (!server) {
            showMessage("Please wait for the server to finish loading.");
            return;
        }

        const mode = getCreationMode(server);

        createModal(server, mode);
    }

    /* -----------------------------------------------------
       10. CONNECT EXISTING SETTINGS BUTTONS
    ----------------------------------------------------- */

    function attachSettingsButton() {
        const button = document.getElementById("settingsButton");

        if (!button || button.dataset.fcSettingsAttached === "true") {
            return;
        }

        button.dataset.fcSettingsAttached = "true";

        button.addEventListener("click", event => {
            event.preventDefault();
            openServerSettings();
        });
    }

    function init() {
        addStyles();
        attachSettingsButton();
        applyServerAppearance();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

    /* -----------------------------------------------------
       11. PUBLIC FUNCTIONS
    ----------------------------------------------------- */

    window.openServerSettings = openServerSettings;
    window.closeServerSettings = closeSettings;
    window.applyServerAppearance = applyServerAppearance;

    // Allow server-home.js to call this after loading server data.
    window.initServerCustomization = init;

})();
