
/* =========================================================
   FRIENDCHAT SERVER CUSTOMIZATION
   Settings button + simple/advanced customization
   ========================================================= */

(function () {
    "use strict";

    let activeTab = "general";
    let modalCreated = false;

    function getServer() {
        return typeof currentServer !== "undefined"
            ? currentServer
            : null;
    }

    function toast(message) {
        if (typeof showToast === "function") {
            showToast(message);
        } else {
            alert(message);
        }
    }

    function getSettings() {
        const server = getServer();

        if (!server) return {};

        if (!server.settings || typeof server.settings !== "object") {
            server.settings = {};
        }

        return server.settings;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function addCustomizationCSS() {
        if (document.getElementById("fcCustomizationCSS")) return;

        const style = document.createElement("style");
        style.id = "fcCustomizationCSS";

        style.textContent = `
            #fcCustomizationOverlay {
                position: fixed;
                inset: 0;
                z-index: 99990;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(0, 0, 0, .72);
                backdrop-filter: blur(7px);
            }

            #fcCustomizationOverlay.fc-open {
                display: flex;
            }

            #fcCustomizationModal {
                width: min(900px, 100%);
                max-height: min(800px, 92vh);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                color: #f3f5fa;
                background: #0d121b;
                border: 1px solid #283244;
                border-radius: 16px;
                box-shadow: 0 25px 90px #0009;
                font-family: inherit;
            }

            #fcCustomizationModal * {
                box-sizing: border-box;
            }

            .fc-c-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                padding: 18px 22px;
                border-bottom: 1px solid #263044;
            }

            .fc-c-head h2 {
                margin: 0;
                font-size: 20px;
            }

            .fc-c-close {
                border: 0;
                border-radius: 8px;
                padding: 8px 12px;
                background: #202938;
                color: #fff;
                cursor: pointer;
                font-size: 20px;
            }

            .fc-c-layout {
                display: grid;
                grid-template-columns: 185px minmax(0, 1fr);
                min-height: 0;
                overflow: auto;
            }

            .fc-c-nav {
                padding: 14px 10px;
                border-right: 1px solid #263044;
                background: #0a0f17;
            }

            .fc-c-nav button {
                display: block;
                width: 100%;
                margin-bottom: 5px;
                padding: 11px 12px;
                text-align: left;
                border: 0;
                border-radius: 8px;
                color: #bfc9d9;
                background: transparent;
                cursor: pointer;
                font: inherit;
            }

            .fc-c-nav button.active,
            .fc-c-nav button:hover {
                color: #fff;
                background: #222b3c;
            }

            .fc-c-content {
                padding: 22px;
                overflow: auto;
                min-width: 0;
            }

            .fc-c-content h3 {
                margin: 0 0 8px;
                font-size: 19px;
            }

            .fc-c-help {
                margin: 0 0 22px;
                color: #98a5b8;
                font-size: 13px;
                line-height: 1.5;
            }

            .fc-c-field {
                display: block;
                margin-bottom: 18px;
            }

            .fc-c-field > span {
                display: block;
                margin-bottom: 7px;
                color: #dce4f0;
                font-size: 13px;
                font-weight: 600;
            }

            .fc-c-field input,
            .fc-c-field textarea,
            .fc-c-field select {
                display: block;
                width: 100%;
                min-width: 0;
                padding: 11px 12px;
                color: #f4f6fb;
                background: #090e16;
                border: 1px solid #303b4e;
                border-radius: 8px;
                outline: none;
                font: inherit;
            }

            .fc-c-field input:focus,
            .fc-c-field textarea:focus,
            .fc-c-field select:focus {
                border-color: var(--fc-accent, #6c63ff);
            }

            .fc-c-field textarea {
                min-height: 90px;
                resize: vertical;
            }

            .fc-c-row {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 14px;
            }

            .fc-c-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 10px;
                padding: 14px 22px;
                border-top: 1px solid #263044;
                background: #0a0f17;
            }

            .fc-c-footer small {
                color: #96a2b5;
            }

            .fc-c-actions {
                display: flex;
                gap: 9px;
            }

            .fc-c-btn {
                padding: 10px 15px;
                border: 1px solid #344056;
                border-radius: 8px;
                color: #f5f6fa;
                background: #1b2433;
                cursor: pointer;
                font: inherit;
            }

            .fc-c-btn.primary {
                color: white;
                background: var(--fc-accent, #6c63ff);
                border-color: transparent;
            }

            .fc-c-btn:disabled {
                opacity: .6;
                cursor: wait;
            }

            .fc-c-list {
                display: grid;
                gap: 9px;
            }

            .fc-c-list-item {
                padding: 12px;
                background: #151d29;
                border: 1px solid #2b3547;
                border-radius: 9px;
            }

            .fc-c-list-item strong {
                display: block;
                margin-bottom: 4px;
            }

            .fc-c-list-item small {
                color: #98a5b8;
            }

            .fc-c-warning {
                padding: 12px;
                margin: 0 0 16px;
                border: 1px solid #6c5530;
                background: #302719;
                border-radius: 8px;
                color: #f3d9a6;
                font-size: 13px;
                line-height: 1.5;
            }

            @media (max-width: 620px) {
                #fcCustomizationOverlay {
                    padding: 8px;
                }

                #fcCustomizationModal {
                    max-height: 96vh;
                    border-radius: 12px;
                }

                .fc-c-layout {
                    grid-template-columns: 1fr;
                }

                .fc-c-nav {
                    display: flex;
                    gap: 5px;
                    overflow-x: auto;
                    border-right: 0;
                    border-bottom: 1px solid #263044;
                }

                .fc-c-nav button {
                    width: auto;
                    flex: 0 0 auto;
                    margin: 0;
                }

                .fc-c-content {
                    padding: 16px;
                }

                .fc-c-row {
                    grid-template-columns: 1fr;
                    gap: 0;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function ensureModal() {
        if (modalCreated) return;

        addCustomizationCSS();

        const overlay = document.createElement("div");
        overlay.id = "fcCustomizationOverlay";

        overlay.innerHTML = `
            <section id="fcCustomizationModal"
                     role="dialog"
                     aria-modal="true"
                     aria-labelledby="fcCustomizationTitle">

                <header class="fc-c-head">
                    <h2 id="fcCustomizationTitle">Server Settings</h2>
                    <button type="button"
                            class="fc-c-close"
                            id="fcCustomizationClose"
                            aria-label="Close settings">×</button>
                </header>

                <div class="fc-c-layout">
                    <nav class="fc-c-nav" aria-label="Server settings">
                        <button type="button" data-tab="general" class="active">
                            General
                        </button>
                        <button type="button" data-tab="appearance">
                            Appearance
                        </button>
                        <button type="button" data-tab="channels">
                            Channels
                        </button>
                        <button type="button" data-tab="roles">
                            Roles
                        </button>
                        <button type="button" data-tab="privacy">
                            Safety &amp; Privacy
                        </button>
                    </nav>

                    <main class="fc-c-content" id="fcCustomizationContent"></main>
                </div>

                <footer class="fc-c-footer">
                    <small id="fcCustomizationStatus">
                        Changes are saved to your server.
                    </small>

                    <div class="fc-c-actions">
                        <button type="button" class="fc-c-btn"
                                id="fcCustomizationCancel">
                            Cancel
                        </button>
                        <button type="button" class="fc-c-btn primary"
                                id="fcCustomizationSave">
                            Save Changes
                        </button>
                    </div>
                </footer>
            </section>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeServerSettings();
        });

        overlay.querySelector("#fcCustomizationClose")
            .addEventListener("click", closeServerSettings);

        overlay.querySelector("#fcCustomizationCancel")
            .addEventListener("click", closeServerSettings);

        overlay.querySelector("#fcCustomizationSave")
            .addEventListener("click", saveCustomization);

        overlay.querySelectorAll("[data-tab]").forEach(button => {
            button.addEventListener("click", () => {
                activeTab = button.dataset.tab;

                overlay.querySelectorAll("[data-tab]").forEach(tab => {
                    tab.classList.toggle("active", tab === button);
                });

                renderTab();
            });
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") closeServerSettings();
        });

        modalCreated = true;
    }

    function openServerSettings() {
        const server = getServer();

        if (!server) {
            toast("Please wait for the server to load, then try again.");
            return;
        }

        ensureModal();

        activeTab = "general";

        const overlay = document.getElementById("fcCustomizationOverlay");
        overlay.classList.add("fc-open");

        overlay.querySelectorAll("[data-tab]").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.tab === activeTab
            );
        });

        renderTab();
    }

    function closeServerSettings() {
        const overlay = document.getElementById("fcCustomizationOverlay");

        if (overlay) {
            overlay.classList.remove("fc-open");
        }
    }

    function field(label, id, value, placeholder = "", type = "text") {
        return `
            <label class="fc-c-field">
                <span>${escapeHTML(label)}</span>
                <input id="${id}"
                       type="${type}"
                       value="${escapeHTML(value)}"
                       placeholder="${escapeHTML(placeholder)}">
            </label>
        `;
    }

    function renderTab() {
        const server = getServer();

        if (!server) return;

        const settings = getSettings();
        const content = document.getElementById("fcCustomizationContent");

        if (!content) return;

        if (activeTab === "general") {
            content.innerHTML = `
                <h3>General settings</h3>
                <p class="fc-c-help">
                    Change the server name, icon, and description.
                </p>

                ${field("Server name", "fcServerName",
                    server.name || "", "Enter server name")}

                ${field("Server icon URL", "fcServerIcon",
                    server.icon || "", "https://example.com/icon.png", "url")}

                <label class="fc-c-field">
                    <span>Server description</span>
                    <textarea id="fcServerDescription"
                              placeholder="Describe your server">${escapeHTML(
                                  server.description || ""
                              )}</textarea>
                </label>

                ${field("Banner image URL", "fcServerBanner",
                    server.banner || "", "https://example.com/banner.png", "url")}

                <div class="fc-c-warning">
                    Icon and banner fields expect image URLs. They do not upload
                    local files. Anyone who can access this server may be able
                    to see its public details.
                </div>
            `;
            return;
        }

        if (activeTab === "appearance") {
            content.innerHTML = `
                <h3>Appearance</h3>
                <p class="fc-c-help">
                    Personalize your server's colors and visual theme.
                </p>

                <div class="fc-c-row">
                    <label class="fc-c-field">
                        <span>Accent color</span>
                        <input id="fcServerAccent"
                               type="color"
                               value="${escapeHTML(settings.accent || "#6c63ff")}">
                    </label>

                    <label class="fc-c-field">
                        <span>Background color</span>
                        <input id="fcServerBackground"
                               type="color"
                               value="${escapeHTML(settings.background || "#070a10")}">
                    </label>
                </div>

                <label class="fc-c-field">
                    <span>Theme</span>
                    <select id="fcServerTheme">
                        <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>
                            Dark
                        </option>
                        <option value="light" ${settings.theme === "light" ? "selected" : ""}>
                            Light
                        </option>
                        <option value="midnight" ${settings.theme === "midnight" ? "selected" : ""}>
                            Midnight
                        </option>
                    </select>
                </label>

                <div class="fc-c-warning">
                    The accent and background colors are applied through CSS
                    variables. Other pages or elements may need matching CSS
                    rules to reflect every theme change.
                </div>
            `;
            return;
        }

        if (activeTab === "channels") {
            const channels = server.channels || [];

            content.innerHTML = `
                <h3>Channels</h3>
                <p class="fc-c-help">
                    These are the channels currently stored for this server.
                </p>

                <div class="fc-c-list">
                    ${channels.length ? channels.map(channel => `
                        <div class="fc-c-list-item">
                            <strong>
                                ${channel.type === "voice" ? "🔊" : "#"}
                                ${escapeHTML(channel.name)}
                            </strong>
                            <small>
                                ${escapeHTML(channel.type || "text")} channel
                                · ID: ${escapeHTML(channel.id)}
                            </small>
                        </div>
                    `).join("") : `
                        <div class="fc-c-list-item">
                            No channels have been created yet.
                        </div>
                    `}
                </div>

                <p class="fc-c-help" style="margin-top:16px">
                    Use your server's channel creation button to add channels.
                </p>
            `;
            return;
        }

        if (activeTab === "roles") {
            const roles = Array.isArray(settings.roles) ? settings.roles : [];

            content.innerHTML = `
                <h3>Roles</h3>
                <p class="fc-c-help">
                    Roles can be configured here, but permissions must also
                    be implemented and checked by your backend.
                </p>

                <div class="fc-c-list">
                    ${roles.length ? roles.map(role => `
                        <div class="fc-c-list-item">
                            <strong>${escapeHTML(role.name || "Unnamed role")}</strong>
                            <small>${escapeHTML(role.description || "No description")}</small>
                        </div>
                    `).join("") : `
                        <div class="fc-c-list-item">
                            <strong>Default member</strong>
                            <small>No custom roles are configured.</small>
                        </div>
                    `}
                </div>

                <div class="fc-c-warning" style="margin-top:16px">
                    This screen does not create secure permissions by itself.
                    Do not rely on frontend role settings to protect server data.
                </div>
            `;
            return;
        }

        if (activeTab === "privacy") {
            content.innerHTML = `
                <h3>Safety &amp; Privacy</h3>
                <p class="fc-c-help">
                    Choose a privacy preference for this server.
                </p>

                <label class="fc-c-field">
                    <span>Server visibility preference</span>
                    <select id="fcServerPrivacy">
                        <option value="private" ${settings.privacy === "private" ? "selected" : ""}>
                            Private
                        </option>
                        <option value="invite-only" ${settings.privacy === "invite-only" ? "selected" : ""}>
                            Invite only
                        </option>
                        <option value="public" ${settings.privacy === "public" ? "selected" : ""}>
                            Public
                        </option>
                    </select>
                </label>

                <div class="fc-c-warning">
                    This saves a preference only. Your backend must enforce
                    membership, invitations, access control, and permissions
                    for the setting to provide real privacy.
                </div>
            `;
        }
    }

    async function saveCustomization() {
        const server = getServer();

        if (!server) {
            toast("No server is loaded.");
            return;
        }

        const saveButton = document.getElementById("fcCustomizationSave");
        const status = document.getElementById("fcCustomizationStatus");

        const readValue = id => {
            const element = document.getElementById(id);
            return element ? element.value.trim() : null;
        };

        if (activeTab === "general") {
            const name = readValue("fcServerName");

            if (!name) {
                toast("Server name cannot be empty.");
                return;
            }

            server.name = name;
            server.icon = readValue("fcServerIcon") || "";
            server.description = readValue("fcServerDescription") || "";
            server.banner = readValue("fcServerBanner") || "";
        }

        if (activeTab === "appearance") {
            const settings = getSettings();

            settings.accent =
                readValue("fcServerAccent") || "#6c63ff";

            settings.background =
                readValue("fcServerBackground") || "#070a10";

            settings.theme =
                readValue("fcServerTheme") || "dark";
        }

        if (activeTab === "privacy") {
            getSettings().privacy =
                readValue("fcServerPrivacy") || "private";
        }

        if (activeTab === "channels" || activeTab === "roles") {
            toast("There are no changes to save on this tab.");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
        status.textContent = "Saving to server...";

        try {
            if (typeof saveServerToBackend !== "function") {
                throw new Error("saveServerToBackend() was not found.");
            }

            const success = await saveServerToBackend();

            if (success === false) {
                throw new Error("The backend could not save your changes.");
            }

            if (typeof paintServerDetails === "function") {
                paintServerDetails();
            }

            if (typeof applyServerAppearance === "function") {
                applyServerAppearance();
            }

            status.textContent = "Changes saved.";
            toast("Server settings saved.");
            closeServerSettings();
        } catch (error) {
            console.error("FriendChat customization save failed:", error);
            status.textContent = "Save failed.";
            toast(error.message || "Could not save settings.");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    }

    function initServerCustomization() {
        ensureModal();

        const settingsButton = document.getElementById("settingsButton");
        const settingsCard = document.getElementById("serverSettingsCard");

        if (settingsButton && !settingsButton.dataset.fcSettingsConnected) {
            settingsButton.dataset.fcSettingsConnected = "true";

            settingsButton.addEventListener("click", event => {
                event.preventDefault();
                openServerSettings();
            });
        }

        if (settingsCard && !settingsCard.dataset.fcSettingsConnected) {
            settingsCard.dataset.fcSettingsConnected = "true";

            settingsCard.addEventListener("click", event => {
                event.preventDefault();
                openServerSettings();
            });
        }
    }

    // Make these functions available to other classic scripts.
    window.openServerSettings = openServerSettings;
    window.closeServerSettings = closeServerSettings;
    window.initServerCustomization = initServerCustomization;

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initServerCustomization,
            { once: true }
        );
    } else {
        initServerCustomization();
    }
})();
