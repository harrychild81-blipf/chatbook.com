```javascript
/* =========================================================
   FRIENDCHAT — SERVER CUSTOMIZATION
   Simple Mode + Advanced Design Studio
   Fixes:
   - Correct background image logic
   - Opens settings from the top-bar button and settings card
   - Saves server changes through saveServerToBackend()
   - Applies saved appearance after loading server data
   - Preserves Simple Mode and Advanced Mode
   ========================================================= */

let serverSettingsOverlay = null;
let fc3AppearanceTimer = null;

const FC_DEFAULTS = {
    accentColor: "#6c63ff",
    backgroundColor: "#070a10",
    panelColor: "#0d121b",
    sidebarColor: "#111824",
    textColor: "#f4f5ff",
    borderColor: "#252d3a",
    fontFamily: "system",
    fontScale: "normal",
    spacing: "normal",
    corners: "rounded",
    channelDisplay: "list",
    pageWidth: "standard",
    shadow: "medium"
};

/* ------------------------- HELPERS ------------------------- */

function phase3Escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function phase3SafeImageURL(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    try {
        const parsed = new URL(text, window.location.href);

        if (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:"
        ) {
            return parsed.href;
        }
    } catch (_) {}

    return "";
}

function phase3ValidColor(value, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ""))
        ? value
        : fallback;
}

function phase3Toast(message) {
    if (typeof showToast === "function") {
        showToast(message);
    } else {
        console.log("[FriendChat]", message);
    }
}

function getServerSettings() {
    if (!currentServer) return {};

    if (
        !currentServer.settings ||
        typeof currentServer.settings !== "object"
    ) {
        currentServer.settings = {};
    }

    return currentServer.settings;
}

function getServerCreationMode() {
    if (!currentServer) return "simple";

    const settings = getServerSettings();

    const mode = String(
        currentServer.creationMode ||
        settings.creationMode ||
        settings.mode ||
        "simple"
    ).toLowerCase();

    return mode === "advanced" ? "advanced" : "simple";
}

function settingsBaseValues() {
    const settings = getServerSettings();
    const isLight = settings.theme === "light";

    return {
        accentColor: phase3ValidColor(
            settings.accentColor,
            FC_DEFAULTS.accentColor
        ),
        backgroundColor: phase3ValidColor(
            settings.backgroundColor,
            isLight ? "#f3f5fb" : FC_DEFAULTS.backgroundColor
        ),
        panelColor: phase3ValidColor(
            settings.panelColor,
            isLight ? "#ffffff" : FC_DEFAULTS.panelColor
        ),
        sidebarColor: phase3ValidColor(
            settings.sidebarColor,
            isLight ? "#eef1f8" : FC_DEFAULTS.sidebarColor
        ),
        textColor: phase3ValidColor(
            settings.textColor,
            isLight ? "#182033" : FC_DEFAULTS.textColor
        ),
        borderColor: phase3ValidColor(
            settings.borderColor,
            isLight ? "#d9dfeb" : FC_DEFAULTS.borderColor
        )
    };
}

/* --------------------- APPLY APPEARANCE --------------------- */

function applyServerAppearance() {
    if (!currentServer || !document.documentElement || !document.body) {
        return;
    }

    const settings = getServerSettings();

    const layout =
        settings.advancedLayout &&
        typeof settings.advancedLayout === "object"
            ? settings.advancedLayout
            : {};

    const root = document.documentElement;
    const isLight = settings.theme === "light";

    const colors = {
        accent: phase3ValidColor(
            settings.accentColor,
            FC_DEFAULTS.accentColor
        ),
        background: phase3ValidColor(
            settings.backgroundColor,
            isLight ? "#f3f5fb" : FC_DEFAULTS.backgroundColor
        ),
        panel: phase3ValidColor(
            settings.panelColor,
            isLight ? "#ffffff" : FC_DEFAULTS.panelColor
        ),
        sidebar: phase3ValidColor(
            settings.sidebarColor,
            isLight ? "#eef1f8" : FC_DEFAULTS.sidebarColor
        ),
        text: phase3ValidColor(
            settings.textColor,
            isLight ? "#182033" : FC_DEFAULTS.textColor
        ),
        border: phase3ValidColor(
            settings.borderColor,
            isLight ? "#d9dfeb" : FC_DEFAULTS.borderColor
        )
    };

    /* CSS variables */

    root.style.setProperty("--fc-accent", colors.accent);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--fc-bg", colors.background);
    root.style.setProperty("--fc-panel", colors.panel);
    root.style.setProperty("--fc-panel-2", colors.sidebar);
    root.style.setProperty("--fc-panel-3", colors.sidebar);
    root.style.setProperty("--fc-text", colors.text);
    root.style.setProperty("--fc-border", colors.border);

    const fontMap = {
        system:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        rounded:
            "'Trebuchet MS', 'Segoe UI', sans-serif",
        mono:
            "ui-monospace, SFMono-Regular, Consolas, monospace",
        serif:
            "Georgia, 'Times New Roman', serif"
    };

    root.style.setProperty(
        "--fc-font-family",
        fontMap[settings.fontFamily] || fontMap.system
    );

    root.style.setProperty(
        "--fc-font-scale",
        settings.fontScale === "small"
            ? "0.92"
            : settings.fontScale === "large"
                ? "1.08"
                : "1"
    );

    root.style.setProperty(
        "--fc-space-scale",
        settings.spacing === "compact"
            ? "0.78"
            : settings.spacing === "relaxed"
                ? "1.2"
                : "1"
    );

    root.style.setProperty(
        "--fc-shadow-strength",
        settings.shadow === "none"
            ? "0"
            : settings.shadow === "strong"
                ? "0.42"
                : "0.20"
    );

    root.style.setProperty(
        "--fc-radius",
        settings.corners === "square"
            ? "3px"
            : settings.corners === "soft"
                ? "18px"
                : "12px"
    );

    /* Page background and optional image */

    const backgroundURL = phase3SafeImageURL(settings.background);

    const backgroundImage = backgroundURL
        ? `url("${backgroundURL.replace(/["\\]/g, "\\$&")}")`
        : "none";

    root.style.setProperty(
        "--fc-server-background-image",
        backgroundImage
    );

    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
    document.body.style.fontFamily =
        fontMap[settings.fontFamily] || fontMap.system;

    document.body.style.backgroundImage = backgroundImage;
    document.body.style.backgroundSize =
        backgroundURL ? "cover" : "";
    document.body.style.backgroundPosition =
        backgroundURL ? "center center" : "";
    document.body.style.backgroundRepeat =
        backgroundURL ? "no-repeat" : "";
    document.body.style.backgroundAttachment =
        backgroundURL ? "fixed" : "";

    /* Advanced layout classes */

    const app = document.querySelector(".server-app");

    if (app) {
        app.dataset.creationMode = getServerCreationMode();

        app.classList.toggle(
            "fc-advanced-layout-wide",
            layout.pageWidth === "wide"
        );

        app.classList.toggle(
            "fc-advanced-layout-compact",
            layout.pageWidth === "compact"
        );

        app.classList.toggle(
            "fc-advanced-channels-grid",
            layout.channelDisplay === "cards"
        );

        app.classList.toggle(
            "fc-advanced-square-corners",
            layout.corners === "square"
        );

        app.classList.toggle(
            "fc-advanced-soft-corners",
            layout.corners === "soft"
        );

        app.classList.toggle(
            "fc-advanced-spacing-compact",
            layout.spacing === "compact"
        );

        app.classList.toggle(
            "fc-advanced-spacing-relaxed",
            layout.spacing === "relaxed"
        );

        app.classList.toggle(
            "fc-advanced-hide-hero",
            layout.showHero === false
        );

        app.classList.toggle(
            "fc-advanced-hide-preview",
            layout.showPreview === false
        );

        app.classList.toggle(
            "fc-advanced-hide-server-id",
            layout.showServerID === false
        );

        app.classList.toggle(
            "fc-advanced-no-shadows",
            layout.shadow === "none"
        );
    }

    /* Preview visibility */

    const previewBox = document.querySelector(".preview-box");

    if (previewBox && previewBox.closest(".section")) {
        previewBox.closest(".section").style.display =
            layout.showPreview === false ? "none" : "";
    }

    /* Server hero and banner */

    const hero = document.querySelector(".server-hero");

    if (hero) {
        hero.style.display = layout.showHero === false ? "none" : "";

        const bannerURL = phase3SafeImageURL(currentServer.banner);

        hero.style.backgroundImage = bannerURL
            ? `linear-gradient(90deg, rgba(7,10,16,.88), rgba(7,10,16,.40)), url("${bannerURL.replace(/["\\]/g, "\\$&")}")`
            : "";

        hero.style.backgroundSize = bannerURL ? "cover" : "";
        hero.style.backgroundPosition = bannerURL ? "center" : "";
        hero.style.borderColor = colors.accent;
    }
}

/* ----------------------- OPEN / CLOSE ----------------------- */

function closeServerSettings() {
    if (serverSettingsOverlay) {
        serverSettingsOverlay.remove();
        serverSettingsOverlay = null;
    }

    document.removeEventListener(
        "keydown",
        handleServerSettingsEscape
    );
}

function handleServerSettingsEscape(event) {
    if (event.key === "Escape") {
        closeServerSettings();
    }
}

/*
 * Keep this function globally accessible to server-home.js.
 * Both the top-bar Settings button and the settings card can call it.
 */
function openServerSettings() {
    if (!currentServer) {
        phase3Toast("Please wait for your server to load.");
        return;
    }

    closeServerSettings();

    if (getServerCreationMode() === "advanced") {
        openAdvancedServerSettings();
    } else {
        openSimpleServerSettings();
    }
}

/* -------------------------- SIMPLE MODE -------------------------- */

function openSimpleServerSettings() {
    const settings = getServerSettings();
    const colors = settingsBaseValues();
    const icon = phase3SafeImageURL(currentServer.icon);

    const overlay = document.createElement("div");
    overlay.className = "fc3-overlay";

    overlay.innerHTML = `
      <section class="fc3-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fc3Title">

        <header class="fc3-head">
          <div>
            <h2 id="fc3Title">Customize your server</h2>
            <div class="fc3-sub">
              Simple Mode · Change the basics without complicated controls.
            </div>
          </div>
          <button class="fc3-close" type="button" aria-label="Close">×</button>
        </header>

        <form class="fc3-form">
          <div class="fc3-field">
            <label for="fc3Name">Server name</label>
            <input id="fc3Name" maxlength="40" required
              value="${phase3Escape(currentServer.name || "")}">
          </div>

          <div class="fc3-field">
            <label for="fc3Description">Description</label>
            <textarea id="fc3Description" maxlength="200">${phase3Escape(currentServer.description || "")}</textarea>
            <div class="fc3-help">
              A short description for your community · 200 characters max.
            </div>
          </div>

          <div class="fc3-field">
            <label for="fc3Icon">Server photo URL</label>
            <input id="fc3Icon" type="url"
              placeholder="https://example.com/server-icon.png"
              value="${phase3Escape(icon)}">
            <div class="fc3-help">
              Use a direct image URL starting with https:// or http://.
            </div>
          </div>

          <div class="fc3-two">
            <div class="fc3-field">
              <label for="fc3BackgroundColor">Background color</label>
              <div class="fc3-colorrow">
                <input id="fc3BackgroundColor" type="color"
                  value="${colors.backgroundColor}">
                <span id="fc3BackgroundText">${colors.backgroundColor}</span>
              </div>
            </div>

            <div class="fc3-field">
              <label for="fc3Accent">Accent color</label>
              <div class="fc3-colorrow">
                <input id="fc3Accent" type="color"
                  value="${colors.accentColor}">
                <span id="fc3AccentText">${colors.accentColor}</span>
              </div>
            </div>
          </div>

          <div class="fc3-field">
            <label for="fc3Theme">Theme preset</label>
            <select id="fc3Theme">
              <option value="dark" ${settings.theme !== "light" ? "selected" : ""}>Dark</option>
              <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light</option>
            </select>
          </div>

          <div class="fc3-actions">
            <button class="fc3-btn fc3-cancel" type="button">Cancel</button>
            <button class="fc3-btn fc3-save" type="submit">Save changes</button>
          </div>
        </form>
      </section>`;

    document.body.appendChild(overlay);
    serverSettingsOverlay = overlay;

    wireCommonOverlay(overlay);

    wireColorLabel(
        overlay,
        "#fc3BackgroundColor",
        "#fc3BackgroundText"
    );

    wireColorLabel(
        overlay,
        "#fc3Accent",
        "#fc3AccentText"
    );

    overlay.querySelector("form").addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const saveButton = overlay.querySelector(".fc3-save");
            const name = overlay.querySelector("#fc3Name").value.trim();
            const description =
                overlay.querySelector("#fc3Description").value.trim();
            const iconValue =
                overlay.querySelector("#fc3Icon").value.trim();

            if (name.length < 2) {
                phase3Toast("Server name must be at least 2 characters.");
                return;
            }

            if (iconValue && !phase3SafeImageURL(iconValue)) {
                phase3Toast(
                    "Server photo must be a valid http or https image URL."
                );
                return;
            }

            const oldServer = JSON.parse(JSON.stringify(currentServer));
            const themeValue = overlay.querySelector("#fc3Theme").value;

            currentServer.name = name;
            currentServer.description = description;
            currentServer.icon = iconValue
                ? phase3SafeImageURL(iconValue)
                : null;

            currentServer.settings = {
                ...getServerSettings(),
                theme: themeValue,
                backgroundColor:
                    overlay.querySelector("#fc3BackgroundColor").value,
                accentColor:
                    overlay.querySelector("#fc3Accent").value
            };

            await persistServerChanges(
                saveButton,
                oldServer,
                "Save changes",
                "Server customization saved."
            );
        }
    );
}

/* --------------------- ADVANCED DESIGN STUDIO -------------------- */

function openAdvancedServerSettings() {
    const settings = getServerSettings();

    const layout =
        settings.advancedLayout &&
        typeof settings.advancedLayout === "object"
            ? settings.advancedLayout
            : {};

    const colors = settingsBaseValues();
    const icon = phase3SafeImageURL(currentServer.icon);
    const banner = phase3SafeImageURL(currentServer.banner);
    const background = phase3SafeImageURL(settings.background);

    const select = (key, fallback, value) => {
        const currentValue = layout[key] ?? settings[key] ?? fallback;
        return currentValue === value ? "selected" : "";
    };

    const checked = (key, fallback = true) => {
        const value = layout[key] === undefined
            ? fallback
            : layout[key];

        return value ? "checked" : "";
    };

    const overlay = document.createElement("div");
    overlay.className = "fc3-overlay fc-advanced-overlay";

    overlay.innerHTML = `
      <section class="fc3-modal fc-advanced-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fcAdvTitle">

        <header class="fc3-head">
          <div>
            <div class="fc-advanced-kicker">FRIENDCHAT / DESIGN STUDIO</div>
            <h2 id="fcAdvTitle">Build your server design</h2>
            <div class="fc3-sub">
              Advanced Mode · Control colors, layout, typography and details.
            </div>
          </div>
          <button class="fc3-close" type="button" aria-label="Close">×</button>
        </header>

        <form class="fc3-form fc-advanced-form">

          <div class="fc-advanced-section-title">
            <span>01</span>
            <div><strong>Server identity</strong><small>Name, description and images</small></div>
          </div>

          <div class="fc3-field">
            <label for="fcAdvName">Server name</label>
            <input id="fcAdvName" maxlength="40" required
              value="${phase3Escape(currentServer.name || "")}">
          </div>

          <div class="fc3-field">
            <label for="fcAdvDescription">Description</label>
            <textarea id="fcAdvDescription" maxlength="200">${phase3Escape(currentServer.description || "")}</textarea>
          </div>

          <div class="fc3-field">
            <label for="fcAdvIcon">Server icon URL</label>
            <input id="fcAdvIcon" type="url"
              placeholder="https://example.com/icon.png"
              value="${phase3Escape(icon)}">
          </div>

          <div class="fc3-field">
            <label for="fcAdvBanner">Server banner URL</label>
            <input id="fcAdvBanner" type="url"
              placeholder="https://example.com/banner.jpg"
              value="${phase3Escape(banner)}">
          </div>

          <div class="fc3-field">
            <label for="fcAdvBackground">Page background image URL (optional)</label>
            <input id="fcAdvBackground" type="url"
              placeholder="https://example.com/background.jpg"
              value="${phase3Escape(background)}">
          </div>

          <div class="fc-advanced-section-title">
            <span>02</span>
            <div><strong>Color designer</strong><small>Customize each major surface</small></div>
          </div>

          <div class="fc3-two">
            ${colorField("fcAdvBackgroundColor", "Page background", colors.backgroundColor, "fcAdvBackgroundColorText")}
            ${colorField("fcAdvAccent", "Accent / highlight", colors.accentColor, "fcAdvAccentText")}
            ${colorField("fcAdvPanelColor", "Panel color", colors.panelColor, "fcAdvPanelColorText")}
            ${colorField("fcAdvSidebarColor", "Sidebar / secondary panels", colors.sidebarColor, "fcAdvSidebarColorText")}
            ${colorField("fcAdvTextColor", "Text color", colors.textColor, "fcAdvTextColorText")}
            ${colorField("fcAdvBorderColor", "Border color", colors.borderColor, "fcAdvBorderColorText")}
          </div>

          <div class="fc-advanced-section-title">
            <span>03</span>
            <div><strong>Layout and shape</strong><small>Choose how the server is arranged</small></div>
          </div>

          <div class="fc3-two">
            <div class="fc3-field">
              <label for="fcAdvWidth">Page width</label>
              <select id="fcAdvWidth">
                <option value="standard" ${select("pageWidth", "standard", "standard")}>Standard</option>
                <option value="wide" ${select("pageWidth", "standard", "wide")}>Wide</option>
                <option value="compact" ${select("pageWidth", "standard", "compact")}>Compact</option>
              </select>
            </div>

            <div class="fc3-field">
              <label for="fcAdvCorners">Corner style</label>
              <select id="fcAdvCorners">
                <option value="rounded" ${select("corners", "rounded", "rounded")}>Rounded</option>
                <option value="soft" ${select("corners", "rounded", "soft")}>Extra soft</option>
                <option value="square" ${select("corners", "rounded", "square")}>Square / sharp</option>
              </select>
            </div>

            <div class="fc3-field">
              <label for="fcAdvChannelDisplay">Channel layout</label>
              <select id="fcAdvChannelDisplay">
                <option value="list" ${select("channelDisplay", "list", "list")}>Classic list</option>
                <option value="cards" ${select("channelDisplay", "list", "cards")}>Grid cards</option>
              </select>
            </div>

            <div class="fc3-field">
              <label for="fcAdvSpacing">Spacing</label>
              <select id="fcAdvSpacing">
                <option value="compact" ${select("spacing", "normal", "compact")}>Compact</option>
                <option value="normal" ${select("spacing", "normal", "normal")}>Balanced</option>
                <option value="relaxed" ${select("spacing", "normal", "relaxed")}>Relaxed</option>
              </select>
            </div>
          </div>

          <div class="fc-advanced-section-title">
            <span>04</span>
            <div><strong>Typography and effects</strong><small>Change the personality of the interface</small></div>
          </div>

          <div class="fc3-two">
            <div class="fc3-field">
              <label for="fcAdvFont">Font style</label>
              <select id="fcAdvFont">
                <option value="system" ${select("fontFamily", "system", "system")}>System / modern</option>
                <option value="rounded" ${select("fontFamily", "system", "rounded")}>Rounded</option>
                <option value="mono" ${select("fontFamily", "system", "mono")}>Monospace</option>
                <option value="serif" ${select("fontFamily", "system", "serif")}>Serif</option>
              </select>
            </div>

            <div class="fc3-field">
              <label for="fcAdvFontScale">Text size</label>
              <select id="fcAdvFontScale">
                <option value="small" ${select("fontScale", "normal", "small")}>Small</option>
                <option value="normal" ${select("fontScale", "normal", "normal")}>Normal</option>
                <option value="large" ${select("fontScale", "normal", "large")}>Large</option>
              </select>
            </div>

            <div class="fc3-field">
              <label for="fcAdvShadow">Shadows</label>
              <select id="fcAdvShadow">
                <option value="none" ${select("shadow", "medium", "none")}>Off</option>
                <option value="medium" ${select("shadow", "medium", "medium")}>Soft</option>
                <option value="strong" ${select("shadow", "medium", "strong")}>Strong</option>
              </select>
            </div>

            <div class="fc3-field">
              <label for="fcAdvTheme">Base theme</label>
              <select id="fcAdvTheme">
                <option value="dark" ${settings.theme !== "light" ? "selected" : ""}>Dark</option>
                <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light</option>
              </select>
            </div>
          </div>

          <div class="fc-advanced-section-title">
            <span>05</span>
            <div><strong>Page elements</strong><small>Show or hide sections</small></div>
          </div>

          <div class="fc-advanced-toggles">
            <label>
              <span><strong>Server hero</strong><small>Icon, name and description area</small></span>
              <input id="fcAdvShowHero" type="checkbox" ${checked("showHero")}>
            </label>
            <label>
              <span><strong>Server ID</strong><small>Show the server ID</small></span>
              <input id="fcAdvShowServerID" type="checkbox" ${checked("showServerID")}>
            </label>
            <label>
              <span><strong>Server preview</strong><small>Show the preview section</small></span>
              <input id="fcAdvShowPreview" type="checkbox" ${checked("showPreview")}>
            </label>
          </div>

          <div class="fc-advanced-preview-note">
            <span>✦</span>
            <div>
              <strong>Custom server design</strong>
              <p>These settings are saved with this server. Your core FriendChat features remain unchanged.</p>
            </div>
          </div>

          <div class="fc-advanced-live-preview" id="fcAdvLivePreview">
            <div class="fc-adv-preview-top">
              <span></span><span></span><span></span><b>DESIGN PREVIEW</b>
            </div>
            <div class="fc-adv-preview-body">
              <aside></aside>
              <div class="fc-adv-preview-main"><div></div><div></div><div></div></div>
            </div>
          </div>

          <div class="fc3-actions">
            <button class="fc3-btn fc3-cancel" type="button">Cancel</button>
            <button class="fc3-btn fc3-save" type="submit">Save server design</button>
          </div>
        </form>
      </section>`;

    document.body.appendChild(overlay);
    serverSettingsOverlay = overlay;

    wireCommonOverlay(overlay);

    [
        ["#fcAdvBackgroundColor", "#fcAdvBackgroundColorText"],
        ["#fcAdvAccent", "#fcAdvAccentText"],
        ["#fcAdvPanelColor", "#fcAdvPanelColorText"],
        ["#fcAdvSidebarColor", "#fcAdvSidebarColorText"],
        ["#fcAdvTextColor", "#fcAdvTextColorText"],
        ["#fcAdvBorderColor", "#fcAdvBorderColorText"]
    ].forEach(([input, text]) => {
        wireColorLabel(overlay, input, text);
    });

    const preview = overlay.querySelector("#fcAdvLivePreview");

    const updatePreview = () => {
        preview.style.setProperty(
            "--preview-accent",
            overlay.querySelector("#fcAdvAccent").value
        );
        preview.style.setProperty(
            "--preview-bg",
            overlay.querySelector("#fcAdvBackgroundColor").value
        );
        preview.style.setProperty(
            "--preview-panel",
            overlay.querySelector("#fcAdvPanelColor").value
        );
        preview.style.setProperty(
            "--preview-sidebar",
            overlay.querySelector("#fcAdvSidebarColor").value
        );
        preview.style.setProperty(
            "--preview-text",
            overlay.querySelector("#fcAdvTextColor").value
        );
        preview.style.setProperty(
            "--preview-border",
            overlay.querySelector("#fcAdvBorderColor").value
        );

        preview.dataset.display =
            overlay.querySelector("#fcAdvChannelDisplay").value;

        preview.dataset.corners =
            overlay.querySelector("#fcAdvCorners").value;
    };

    overlay.querySelectorAll(
        'input[type="color"], #fcAdvChannelDisplay, #fcAdvCorners'
    ).forEach(control => {
        control.addEventListener("input", updatePreview);
        control.addEventListener("change", updatePreview);
    });

    updatePreview();

    overlay.querySelector("form").addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const saveButton = overlay.querySelector(".fc3-save");
            const name = overlay.querySelector("#fcAdvName").value.trim();
            const description =
                overlay.querySelector("#fcAdvDescription").value.trim();
            const iconValue =
                overlay.querySelector("#fcAdvIcon").value.trim();
            const bannerValue =
                overlay.querySelector("#fcAdvBanner").value.trim();
            const backgroundValue =
                overlay.querySelector("#fcAdvBackground").value.trim();

            if (name.length < 2) {
                phase3Toast("Server name must be at least 2 characters.");
                return;
            }

            for (const [label, value] of [
                ["Icon", iconValue],
                ["Banner", bannerValue],
                ["Background", backgroundValue]
            ]) {
                if (value && !phase3SafeImageURL(value)) {
                    phase3Toast(
                        `${label} must be a valid http or https image URL.`
                    );
                    return;
                }
            }

            const oldServer = JSON.parse(JSON.stringify(currentServer));

            const newSettings = {
                ...getServerSettings(),

                creationMode: "advanced",
                theme: overlay.querySelector("#fcAdvTheme").value,

                accentColor:
                    overlay.querySelector("#fcAdvAccent").value,

                backgroundColor:
                    overlay.querySelector("#fcAdvBackgroundColor").value,

                panelColor:
                    overlay.querySelector("#fcAdvPanelColor").value,

                sidebarColor:
                    overlay.querySelector("#fcAdvSidebarColor").value,

                textColor:
                    overlay.querySelector("#fcAdvTextColor").value,

                borderColor:
                    overlay.querySelector("#fcAdvBorderColor").value,

                fontFamily:
                    overlay.querySelector("#fcAdvFont").value,

                fontScale:
                    overlay.querySelector("#fcAdvFontScale").value,

                spacing:
                    overlay.querySelector("#fcAdvSpacing").value,

                shadow:
                    overlay.querySelector("#fcAdvShadow").value,

                background: backgroundValue
                    ? phase3SafeImageURL(backgroundValue)
                    : null,

                advancedLayout: {
                    ...layout,

                    pageWidth:
                        overlay.querySelector("#fcAdvWidth").value,

                    channelDisplay:
                        overlay.querySelector("#fcAdvChannelDisplay").value,

                    corners:
                        overlay.querySelector("#fcAdvCorners").value,

                    spacing:
                        overlay.querySelector("#fcAdvSpacing").value,

                    shadow:
                        overlay.querySelector("#fcAdvShadow").value,

                    showHero:
                        overlay.querySelector("#fcAdvShowHero").checked,

                    showServerID:
                        overlay.querySelector("#fcAdvShowServerID").checked,

                    showPreview:
                        overlay.querySelector("#fcAdvShowPreview").checked
                }
            };

            currentServer.name = name;
            currentServer.description = description;
            currentServer.icon = iconValue
                ? phase3SafeImageURL(iconValue)
                : null;
            currentServer.banner = bannerValue
                ? phase3SafeImageURL(bannerValue)
                : null;
            currentServer.creationMode = "advanced";
            currentServer.settings = newSettings;

            await persistServerChanges(
                saveButton,
                oldServer,
                "Save server design",
                "Your server design was saved."
            );
        }
    );
}

/* Creates a color input row for Advanced Mode. */

function colorField(id, label, value, textId) {
    return `
      <div class="fc3-field">
        <label for="${id}">${label}</label>
        <div class="fc3-colorrow">
          <input id="${id}" type="color" value="${value}">
          <span id="${textId}">${value}</span>
        </div>
      </div>`;
}

/* ------------------------ EVENT HELPERS ------------------------ */

function wireCommonOverlay(overlay) {
    overlay.querySelector(".fc3-close")?.addEventListener(
        "click",
        closeServerSettings
    );

    overlay.querySelector(".fc3-cancel")?.addEventListener(
        "click",
        closeServerSettings
    );

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeServerSettings();
        }
    });

    document.addEventListener(
        "keydown",
        handleServerSettingsEscape
    );
}

function wireColorLabel(overlay, inputSelector, textSelector) {
    const input = overlay.querySelector(inputSelector);
    const text = overlay.querySelector(textSelector);

    if (!input || !text) return;

    input.addEventListener("input", () => {
        text.textContent = input.value.toUpperCase();
    });
}

/* ------------------------- SAVE CHANGES ------------------------- */

async function persistServerChanges(
    saveButton,
    oldServer,
    defaultButtonText,
    successMessage
) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving…";

    let saved = false;

    try {
        if (typeof saveServerToBackend === "function") {
            saved = await saveServerToBackend();
        }
    } catch (error) {
        console.error(
            "Could not save server customization:",
            error
        );
    }

    if (!saved) {
        /*
         * Restore the original object's contents rather than only
         * replacing the variable. This helps if other functions
         * still hold a reference to the same server object.
         */
        if (currentServer && oldServer) {
            for (const key of Object.keys(currentServer)) {
                delete currentServer[key];
            }

            Object.assign(currentServer, oldServer);
        } else {
            currentServer = oldServer;
        }

        applyServerAppearance();

        saveButton.disabled = false;
        saveButton.textContent = defaultButtonText;

        phase3Toast(
            "Could not save changes. Please try again."
        );
        return;
    }

    closeServerSettings();
    applyServerAppearance();

    try {
        if (typeof loadServer === "function") {
            await loadServer();
        }
    } catch (error) {
        console.warn(
            "Server saved, but reloading the page data failed:",
            error
        );
    }

    applyServerAppearance();
    phase3Toast(successMessage);
}

/* ------------------------- INITIALIZATION ------------------------- */

function initServerCustomization() {
    /*
     * Connect the settings controls without overwriting
     * server-home.js handlers.
     */
    const settingsButtons = [
        document.getElementById("settingsButton"),
        document.getElementById("serverSettingsCard")
    ].filter(Boolean);

    settingsButtons.forEach(button => {
        if (button.dataset.fcCustomizationBound === "true") {
            return;
        }

        button.dataset.fcCustomizationBound = "true";

        button.addEventListener("click", event => {
            event.preventDefault();
            openServerSettings();
        });
    });

    /*
     * Apply appearance after the initial server data becomes available.
     * The timer stops once the server loads or after a limited wait.
     */
    if (currentServer) {
        applyServerAppearance();
        return;
    }

    if (fc3AppearanceTimer) {
        clearInterval(fc3AppearanceTimer);
    }

    let attempts = 0;

    fc3AppearanceTimer = setInterval(() => {
        attempts += 1;

        if (currentServer) {
            applyServerAppearance();
            clearInterval(fc3AppearanceTimer);
            fc3AppearanceTimer = null;
        } else if (attempts >= 100) {
            clearInterval(fc3AppearanceTimer);
            fc3AppearanceTimer = null;
        }
    }, 100);
}

/*
 * Expose functions for other classic scripts, including server-home.js.
 */
window.openServerSettings = openServerSettings;
window.closeServerSettings = closeServerSettings;
window.applyServerAppearance = applyServerAppearance;

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initServerCustomization,
        { once: true }
    );
} else {
    initServerCustomization();
}
```
