
/* =========================================================
   FRIENDCHAT — SERVER CUSTOMIZATION
   Simple Mode + Advanced Design Studio
   Includes:
   - Settings mode chooser popup
   - Blurred dashboard background
   - No page navigation
   - Simple and Advanced customization forms
   - Live design preview
   - Backend saving and rollback on failure
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

/* =========================================================
   STYLES
   ========================================================= */

function installCustomizationStyles() {
    if (document.getElementById("fc-customization-popup-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "fc-customization-popup-styles";

    style.textContent = `
        .fc3-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
            background: rgba(3, 6, 12, .64);
            -webkit-backdrop-filter: blur(12px);
            backdrop-filter: blur(12px);
            animation: fcPopupFadeIn .18s ease;
        }

        .fc3-modal {
            position: relative;
            width: min(760px, 100%);
            max-height: min(88vh, 900px);
            overflow-y: auto;
            color: #f4f5ff;
            background: #0d121b;
            border: 1px solid #293246;
            border-radius: 20px;
            box-shadow: 0 24px 90px rgba(0, 0, 0, .55);
            padding: 25px;
            animation: fcPopupRise .22s ease;
        }

        .fc-advanced-modal {
            width: min(920px, 100%);
        }

        .fc3-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 24px;
        }

        .fc3-head h2 {
            margin: 0 0 8px;
            font-size: clamp(21px, 3vw, 29px);
            line-height: 1.2;
            color: #f4f5ff;
        }

        .fc3-sub {
            color: #9da9be;
            font-size: 13px;
            line-height: 1.6;
        }

        .fc3-close {
            flex-shrink: 0;
            width: 38px;
            height: 38px;
            border: 1px solid #30394b;
            border-radius: 11px;
            background: #151d29;
            color: #f4f5ff;
            font-size: 26px;
            cursor: pointer;
        }

        .fc3-close:hover {
            background: #252f40;
        }

        .fc3-form {
            display: flex;
            flex-direction: column;
            gap: 17px;
        }

        .fc3-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
        }

        .fc3-field label {
            color: #dce3f2;
            font-size: 13px;
            font-weight: 600;
        }

        .fc3-field input:not([type="color"]),
        .fc3-field textarea,
        .fc3-field select {
            width: 100%;
            box-sizing: border-box;
            padding: 12px 13px;
            border: 1px solid #30394b;
            border-radius: 10px;
            background: #080d15;
            color: #f4f5ff;
            font: inherit;
            font-size: 14px;
            outline: none;
        }

        .fc3-field input:focus,
        .fc3-field textarea:focus,
        .fc3-field select:focus {
            border-color: #6c63ff;
            box-shadow: 0 0 0 3px rgba(108, 99, 255, .13);
        }

        .fc3-field textarea {
            min-height: 85px;
            resize: vertical;
        }

        .fc3-help {
            color: #8995aa;
            font-size: 12px;
            line-height: 1.5;
        }

        .fc3-two {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 17px;
        }

        .fc3-colorrow {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 42px;
            padding: 7px 10px;
            background: #080d15;
            border: 1px solid #30394b;
            border-radius: 10px;
        }

        .fc3-colorrow input[type="color"] {
            width: 38px;
            height: 30px;
            padding: 0;
            border: 0;
            background: transparent;
            cursor: pointer;
        }

        .fc3-colorrow span {
            color: #cbd4e5;
            font-size: 12px;
            font-family: monospace;
        }

        .fc3-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding-top: 10px;
            border-top: 1px solid #252d3a;
            margin-top: 4px;
        }

        .fc3-btn {
            padding: 11px 17px;
            border: 1px solid #30394b;
            border-radius: 10px;
            background: #151d29;
            color: #f4f5ff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }

        .fc3-btn:hover {
            filter: brightness(1.15);
        }

        .fc3-btn:disabled {
            opacity: .6;
            cursor: wait;
        }

        .fc3-save {
            background: #6c63ff;
            border-color: #6c63ff;
            color: white;
        }

        .fc-advanced-kicker {
            color: #9c95ff;
            font-size: 10px;
            letter-spacing: 2px;
            font-weight: 800;
            margin-bottom: 8px;
        }

        .fc-advanced-section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 13px;
            padding-bottom: 12px;
            border-bottom: 1px solid #252d3a;
        }

        .fc-advanced-section-title > span {
            display: grid;
            place-items: center;
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            color: #c4beff;
            background: rgba(108, 99, 255, .16);
            font-size: 12px;
            font-weight: 800;
        }

        .fc-advanced-section-title strong,
        .fc-advanced-section-title small {
            display: block;
        }

        .fc-advanced-section-title strong {
            color: #f4f5ff;
            font-size: 14px;
        }

        .fc-advanced-section-title small {
            margin-top: 4px;
            color: #8995aa;
            font-size: 12px;
        }

        .fc-advanced-toggles {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }

        .fc-advanced-toggles label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 13px;
            border: 1px solid #293246;
            border-radius: 12px;
            background: #101722;
            cursor: pointer;
        }

        .fc-advanced-toggles strong,
        .fc-advanced-toggles small {
            display: block;
        }

        .fc-advanced-toggles strong {
            color: #f4f5ff;
            font-size: 13px;
        }

        .fc-advanced-toggles small {
            margin-top: 4px;
            color: #8995aa;
            font-size: 12px;
        }

        .fc-advanced-toggles input {
            width: 18px;
            height: 18px;
            accent-color: #6c63ff;
        }

        .fc-advanced-preview-note {
            display: flex;
            gap: 12px;
            padding: 15px;
            border: 1px solid rgba(108, 99, 255, .3);
            border-radius: 13px;
            background: rgba(108, 99, 255, .08);
        }

        .fc-advanced-preview-note > span {
            color: #a49dff;
            font-size: 23px;
        }

        .fc-advanced-preview-note strong {
            color: #f4f5ff;
            font-size: 13px;
        }

        .fc-advanced-preview-note p {
            margin: 6px 0 0;
            color: #a5b0c4;
            font-size: 12px;
            line-height: 1.6;
        }

        .fc-advanced-live-preview {
            overflow: hidden;
            border: 1px solid var(--preview-border, #252d3a);
            border-radius: 13px;
            background: var(--preview-bg, #070a10);
            color: var(--preview-text, #f4f5ff);
        }

        .fc-adv-preview-top {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 12px;
            border-bottom: 1px solid var(--preview-border, #252d3a);
        }

        .fc-adv-preview-top > span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--preview-accent, #6c63ff);
        }

        .fc-adv-preview-top b {
            margin-left: auto;
            color: var(--preview-text, #f4f5ff);
            font-size: 9px;
            letter-spacing: 1.5px;
        }

        .fc-adv-preview-body {
            display: grid;
            grid-template-columns: 26% 1fr;
            min-height: 95px;
        }

        .fc-adv-preview-body aside {
            background: var(--preview-sidebar, #111824);
            border-right: 1px solid var(--preview-border, #252d3a);
        }

        .fc-adv-preview-main {
            display: flex;
            flex-direction: column;
            gap: 9px;
            padding: 15px;
            background: var(--preview-panel, #0d121b);
        }

        .fc-adv-preview-main > div {
            height: 9px;
            width: 72%;
            border-radius: 5px;
            background: var(--preview-border, #252d3a);
        }

        .fc-adv-preview-main > div:first-child {
            width: 45%;
            background: var(--preview-accent, #6c63ff);
        }

        .fc-advanced-live-preview[data-display="cards"] .fc-adv-preview-main {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-content: center;
        }

        .fc-advanced-live-preview[data-corners="square"] {
            border-radius: 2px;
        }

        .fc-advanced-live-preview[data-corners="soft"] {
            border-radius: 22px;
        }

        /* Mode chooser */

        .fc-mode-chooser {
            width: min(680px, 100%);
            padding: 28px;
            border: 1px solid #293246;
            border-radius: 22px;
            background: #0d121b;
            color: #f4f5ff;
            box-shadow: 0 25px 90px rgba(0, 0, 0, .55);
            animation: fcPopupRise .22s ease;
        }

        .fc-mode-heading {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
        }

        .fc-mode-eyebrow {
            color: #a49dff;
            font-size: 10px;
            letter-spacing: 2px;
            font-weight: 800;
            margin-bottom: 9px;
        }

        .fc-mode-heading h2 {
            margin: 0;
            font-size: clamp(23px, 4vw, 30px);
        }

        .fc-mode-description {
            color: #9da9be;
            font-size: 13px;
            line-height: 1.65;
            margin: 10px 0 23px;
        }

        .fc-mode-options {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        .fc-mode-option {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-height: 190px;
            padding: 20px;
            text-align: left;
            color: #f4f5ff;
            background: #111824;
            border: 1px solid #293246;
            border-radius: 16px;
            cursor: pointer;
            transition: border-color .18s, transform .18s, background .18s;
        }

        .fc-mode-option:hover {
            transform: translateY(-3px);
            border-color: #6c63ff;
            background: #171e2d;
        }

        .fc-mode-icon {
            display: grid;
            place-items: center;
            width: 43px;
            height: 43px;
            margin-bottom: 17px;
            border-radius: 13px;
            color: #c4beff;
            background: rgba(108, 99, 255, .16);
            font-size: 22px;
        }

        .fc-mode-option strong {
            font-size: 16px;
            margin-bottom: 8px;
        }

        .fc-mode-option small {
            color: #9da9be;
            font-size: 12px;
            line-height: 1.6;
        }

        .fc-mode-tag {
            margin-top: auto;
            padding-top: 15px;
            color: #a49dff;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
        }

        .fc-mode-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 20px;
            padding-top: 17px;
            border-top: 1px solid #252d3a;
            color: #8995aa;
            font-size: 11px;
        }

        @keyframes fcPopupFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fcPopupRise {
            from { opacity: 0; transform: translateY(9px) scale(.99); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 560px) {
            .fc3-overlay {
                padding: 10px;
                align-items: center;
            }

            .fc3-modal,
            .fc-mode-chooser {
                padding: 18px;
                border-radius: 16px;
                max-height: 94vh;
            }

            .fc3-two,
            .fc-mode-options {
                grid-template-columns: 1fr;
            }

            .fc-mode-option {
                min-height: 150px;
            }

            .fc3-actions {
                flex-wrap: wrap;
            }

            .fc3-actions .fc3-btn {
                flex: 1;
            }
        }
    `;

    document.head.appendChild(style);
}

/* =========================================================
   HELPERS
   ========================================================= */

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

/* =========================================================
   APPLY APPEARANCE
   ========================================================= */

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
    document.body.style.backgroundSize = backgroundURL ? "cover" : "";
    document.body.style.backgroundPosition = backgroundURL ? "center center" : "";
    document.body.style.backgroundRepeat = backgroundURL ? "no-repeat" : "";
    document.body.style.backgroundAttachment = backgroundURL ? "fixed" : "";

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

    const previewBox = document.querySelector(".preview-box");

    if (previewBox && previewBox.closest(".section")) {
        previewBox.closest(".section").style.display =
            layout.showPreview === false ? "none" : "";
    }

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

/* =========================================================
   OPEN / CLOSE SETTINGS
   ========================================================= */

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
 * Settings now always opens the chooser first.
 * The user's original server creation mode no longer
 * decides which settings form opens automatically.
 */
function openServerSettings() {
    if (!currentServer) {
        phase3Toast("Please wait for your server to load.");
        return;
    }

    closeServerSettings();
    installCustomizationStyles();
    openServerModeChooser();
}

function openServerModeChooser() {
    const overlay = document.createElement("div");
    overlay.className = "fc3-overlay fc-mode-chooser-overlay";

    overlay.innerHTML = `
        <section class="fc-mode-chooser"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fcModeTitle">

            <div class="fc-mode-heading">
                <div>
                    <div class="fc-mode-eyebrow">FRIENDCHAT / SETTINGS</div>
                    <h2 id="fcModeTitle">Customize your server</h2>
                </div>

                <button class="fc3-close"
                    type="button"
                    aria-label="Close">×</button>
            </div>

            <p class="fc-mode-description">
                Choose how you want to customize your server.
                You can change its appearance and design without
                leaving this page.
            </p>

            <div class="fc-mode-options">

                <button class="fc-mode-option"
                    type="button"
                    data-open-mode="simple">

                    <span class="fc-mode-icon">⚙</span>
                    <strong>Simple Mode</strong>

                    <small>
                        Change your server name, description,
                        icon, theme and main colors with easy controls.
                    </small>

                    <span class="fc-mode-tag">EASY CUSTOMIZATION →</span>
                </button>

                <button class="fc-mode-option"
                    type="button"
                    data-open-mode="advanced">

                    <span class="fc-mode-icon">✦</span>
                    <strong>Advanced Mode</strong>

                    <small>
                        Design your server with detailed colors,
                        backgrounds, banners, typography, layout
                        and display settings.
                    </small>

                    <span class="fc-mode-tag">DESIGN STUDIO →</span>
                </button>

            </div>

            <div class="fc-mode-footer">
                <span>Your server · Customize your way</span>
                <span>Press Esc to close</span>
            </div>
        </section>
    `;

    document.body.appendChild(overlay);
    serverSettingsOverlay = overlay;

    overlay.querySelector(".fc3-close").addEventListener(
        "click",
        closeServerSettings
    );

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeServerSettings();
        }
    });

    overlay.querySelectorAll("[data-open-mode]").forEach(button => {
        button.addEventListener("click", () => {
            const mode = button.dataset.openMode;

            closeServerSettings();

            if (mode === "advanced") {
                openAdvancedServerSettings();
            } else {
                openSimpleServerSettings();
            }
        });
    });

    document.addEventListener(
        "keydown",
        handleServerSettingsEscape
    );

    const firstOption = overlay.querySelector("[data-open-mode='simple']");
    firstOption?.focus();
}

/* =========================================================
   SIMPLE MODE
   ========================================================= */

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

            currentServer.creationMode = "simple";

            currentServer.settings = {
                ...getServerSettings(),
                creationMode: "simple",
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

/* =========================================================
   ADVANCED DESIGN STUDIO
   ========================================================= */

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

/* =========================================================
   COLOR INPUT BUILDER
   ========================================================= */

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

/* =========================================================
   EVENT HELPERS
   ========================================================= */

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

/* =========================================================
   SAVE CHANGES
   ========================================================= */

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

    /*
     * This keeps the original saveServerToBackend() contract:
     * it must resolve to a truthy value when saving succeeds.
     */
    if (!saved) {
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

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initServerCustomization() {
    installCustomizationStyles();

    const settingsButtons = [
        document.getElementById("settingsButton"),
        document.getElementById("serverSettingsCard")
    ].filter(Boolean);

    settingsButtons.forEach(button => {
        if (button.dataset.fcCustomizationBound === "true") {
            return;
        }

        button.dataset.fcCustomizationBound = "true";

        /*
         * Capture the click before ordinary target/bubble handlers
         * so the settings button does not navigate away.
         */
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            openServerSettings();
        }, true);
    });

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

/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

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
