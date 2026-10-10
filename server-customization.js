/* Inject customization styles directly so the modal never depends on a separate CSS file. */
(function ensureFriendChatCustomizationStyles() {
    const styleId = "fc3-customization-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `/* =========================================================
   FRIENDCHAT — SERVER CUSTOMIZATION PANEL
   Loaded by server-home.html
   ========================================================= */

.fc3-overlay,
.fc3-overlay * {
    box-sizing: border-box;
}

.fc3-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow-y: auto;
    background:
        radial-gradient(ellipse at 15% 15%, rgba(108, 99, 255, .20), transparent 42%),
        radial-gradient(ellipse at 90% 85%, rgba(54, 190, 255, .10), transparent 38%),
        rgba(3, 5, 12, .78);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    animation: fc3FadeIn .22s ease-out;
}

.fc3-modal {
    position: relative;
    width: min(100%, 760px);
    max-height: min(90vh, 900px);
    overflow-y: auto;
    isolation: isolate;
    color: #f4f5ff;
    background:
        linear-gradient(145deg, rgba(22, 27, 45, .98), rgba(10, 14, 25, .98));
    border: 1px solid rgba(154, 146, 255, .30);
    border-radius: 24px;
    box-shadow:
        0 32px 100px rgba(0, 0, 0, .62),
        0 0 0 1px rgba(255, 255, 255, .035) inset,
        0 0 70px rgba(108, 99, 255, .15);
    animation: fc3RiseIn .28s cubic-bezier(.2, .8, .2, 1);
}

.fc3-modal::before {
    content: "";
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 0;
    height: 4px;
    background: linear-gradient(90deg, #6c63ff, #a78bfa, #55d6ff);
}

.fc3-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 28px 30px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, .08);
    background:
        radial-gradient(ellipse at 0% 0%, rgba(108, 99, 255, .14), transparent 65%);
}

.fc3-head h2 {
    margin: 0;
    color: #fff;
    font-size: clamp(22px, 3vw, 29px);
    font-weight: 750;
    letter-spacing: -.7px;
    line-height: 1.2;
}

.fc3-sub {
    margin-top: 9px;
    color: #aeb6ce;
    font-size: 14px;
    line-height: 1.5;
}

.fc3-close {
    display: grid;
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    place-items: center;
    padding: 0;
    color: #cbd1e5;
    font: inherit;
    font-size: 25px;
    line-height: 1;
    cursor: pointer;
    background: rgba(255, 255, 255, .055);
    border: 1px solid rgba(255, 255, 255, .10);
    border-radius: 12px;
    transition: background .18s ease, color .18s ease, transform .18s ease;
}

.fc3-close:hover {
    color: #fff;
    background: rgba(255, 100, 125, .18);
    transform: rotate(90deg);
}

.fc3-form {
    display: grid;
    gap: 20px;
    padding: 26px 30px 30px;
}

.fc3-field {
    display: grid;
    min-width: 0;
    gap: 9px;
}

.fc3-field label {
    color: #e5e8f8;
    font-size: 13px;
    font-weight: 650;
    letter-spacing: .15px;
}

.fc3-field input:not([type="color"]),
.fc3-field textarea,
.fc3-field select {
    display: block;
    width: 100%;
    min-height: 47px;
    padding: 12px 14px;
    color: #f6f7ff;
    font: inherit;
    font-size: 14px;
    background: rgba(5, 8, 17, .72);
    border: 1px solid rgba(164, 173, 206, .20);
    border-radius: 12px;
    outline: none;
    box-shadow: 0 1px 0 rgba(255, 255, 255, .025) inset;
    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.fc3-field input:not([type="color"])::placeholder,
.fc3-field textarea::placeholder {
    color: #737d99;
}

.fc3-field textarea {
    min-height: 94px;
    resize: vertical;
    line-height: 1.5;
}

.fc3-field select {
    cursor: pointer;
}

.fc3-field select option {
    color: #f6f7ff;
    background: #111827;
}

.fc3-field input:not([type="color"]):focus,
.fc3-field textarea:focus,
.fc3-field select:focus {
    background: rgba(8, 11, 24, .96);
    border-color: var(--fc3-accent, #8178ff);
    box-shadow: 0 0 0 3px rgba(108, 99, 255, .18);
}

.fc3-help {
    margin-top: -2px;
    color: #858eaa;
    font-size: 12px;
    line-height: 1.45;
}

.fc3-two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 18px;
}

.fc3-colorrow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 47px;
    padding: 6px 12px;
    background: rgba(5, 8, 17, .72);
    border: 1px solid rgba(164, 173, 206, .20);
    border-radius: 12px;
}

.fc3-colorrow input[type="color"] {
    width: 42px;
    height: 34px;
    padding: 3px;
    cursor: pointer;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, .20);
    border-radius: 8px;
}

.fc3-colorrow span {
    color: #dce0f5;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 13px;
    letter-spacing: .3px;
}

.fc3-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 5px;
    padding-top: 22px;
    border-top: 1px solid rgba(255, 255, 255, .08);
}

.fc3-btn {
    min-height: 44px;
    padding: 0 20px;
    color: #e9ecfb;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border-radius: 12px;
    transition: transform .16s ease, background .16s ease, box-shadow .16s ease;
}

.fc3-btn:active {
    transform: translateY(1px);
}

.fc3-cancel {
    background: rgba(255, 255, 255, .055);
    border: 1px solid rgba(255, 255, 255, .13);
}

.fc3-cancel:hover {
    background: rgba(255, 255, 255, .10);
}

.fc3-save {
    color: #fff;
    background: linear-gradient(135deg, var(--fc3-accent, #6c63ff), #8b5cf6);
    border: 1px solid rgba(255, 255, 255, .15);
    box-shadow: 0 8px 24px rgba(108, 99, 255, .25);
}

.fc3-save:hover {
    filter: brightness(1.10);
    box-shadow: 0 10px 30px rgba(108, 99, 255, .34);
}

.fc3-save:disabled {
    opacity: .65;
    cursor: wait;
    filter: none;
    box-shadow: none;
}

@keyframes fc3FadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fc3RiseIn {
    from { opacity: 0; transform: translateY(12px) scale(.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 620px) {
    .fc3-overlay {
        align-items: start;
        padding: 12px;
    }

    .fc3-modal {
        max-height: none;
        margin: auto 0;
        border-radius: 18px;
    }

    .fc3-head {
        padding: 22px 20px 18px;
    }

    .fc3-form {
        gap: 17px;
        padding: 20px;
    }

    .fc3-two {
        grid-template-columns: 1fr;
        gap: 17px;
    }

    .fc3-actions {
        position: sticky;
        bottom: -20px;
        padding: 15px 0 0;
        background: linear-gradient(180deg, rgba(10, 14, 25, .88), #0a0e19 35%);
    }

    .fc3-btn {
        flex: 1;
        padding: 0 12px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .fc3-overlay,
    .fc3-modal {
        animation: none;
    }

    .fc3-close,
    .fc3-btn,
    .fc3-field input,
    .fc3-field textarea,
    .fc3-field select {
        transition: none;
    }
}
`;
    (document.head || document.documentElement).appendChild(style);
})();

/* =========================================================
   FRIENDCHAT PHASE 3 — SERVER CUSTOMIZATION
   Depends on server-home.js globals: currentServer,
   saveServerToBackend(), loadServer(), and showToast().
   ========================================================= */
let serverSettingsOverlay = null;

function phase3Escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function phase3SafeImageURL(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    try {
        const parsed = new URL(text, window.location.href);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
    } catch (_) {}
    return "";
}
function getServerSettings() {
    if (!currentServer) return {};
    if (!currentServer.settings || typeof currentServer.settings !== "object") currentServer.settings = {};
    return currentServer.settings;
}
function applyServerAppearance() {
    if (!currentServer) return;
    const settings = getServerSettings();
    const root = document.documentElement;
    const accent = /^#[0-9a-fA-F]{6}$/.test(settings.accentColor || "") ? settings.accentColor : "#6c63ff";
    root.style.setProperty("--fc-accent", accent);
    root.style.setProperty("--accent", accent);
    const isLight = settings.theme === "light";
    root.style.setProperty("--fc-bg", isLight ? "#f3f5fb" : "#070a10");
    root.style.setProperty("--fc-panel", isLight ? "#ffffff" : "#0d121b");
    root.style.setProperty("--fc-panel-2", isLight ? "#eef1f8" : "#111824");
    root.style.setProperty("--fc-panel-3", isLight ? "#e3e8f2" : "#151d29");
    document.body.style.backgroundColor = isLight ? "#f3f5fb" : "#070a10";
    document.body.style.color = isLight ? "#182033" : "";
    const bgURL = phase3SafeImageURL(settings.background);
    if (bgURL) {
        document.body.style.backgroundImage = `linear-gradient(rgba(${isLight ? "243,245,251" : "7,10,16"},${isLight ? "0.84" : "0.78"}), rgba(${isLight ? "243,245,251" : "7,10,16"},${isLight ? "0.92" : "0.9"})), url(${JSON.stringify(bgURL)})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
    } else {
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundSize = "";
        document.body.style.backgroundPosition = "";
        document.body.style.backgroundAttachment = "";
    }
    const hero = document.querySelector(".server-hero");
    const bannerURL = phase3SafeImageURL(currentServer.banner);
    if (hero) {
        hero.style.backgroundImage = bannerURL ? `linear-gradient(90deg, rgba(7,10,16,.92), rgba(7,10,16,.48)), url(${JSON.stringify(bannerURL)})` : "";
        hero.style.backgroundSize = bannerURL ? "cover" : "";
        hero.style.backgroundPosition = bannerURL ? "center" : "";
        hero.style.borderColor = accent;
    }
}
function closeServerSettings() {
    if (serverSettingsOverlay) { serverSettingsOverlay.remove(); serverSettingsOverlay = null; }
    document.removeEventListener("keydown", handleServerSettingsEscape);
}
function handleServerSettingsEscape(event) { if (event.key === "Escape") closeServerSettings(); }
function openServerSettings() {
    if (!currentServer) { showToast("Please wait for your server to load."); return; }
    closeServerSettings();
    const settings = getServerSettings();
    const accent = /^#[0-9a-fA-F]{6}$/.test(settings.accentColor || "") ? settings.accentColor : "#6c63ff";
    const theme = settings.theme === "light" ? "light" : "dark";
    const background = phase3SafeImageURL(settings.background);
    const banner = phase3SafeImageURL(currentServer.banner);
    const icon = phase3SafeImageURL(currentServer.icon);
    const overlay = document.createElement("div");
    overlay.className = "fc3-overlay";
    overlay.innerHTML = `
      <section class="fc3-modal" role="dialog" aria-modal="true" aria-labelledby="fc3Title">
        <header class="fc3-head"><div><h2 id="fc3Title">Server customization</h2><div class="fc3-sub">Change the look and details of your server.</div></div><button class="fc3-close" type="button" aria-label="Close">×</button></header>
        <form class="fc3-form">
          <div class="fc3-field"><label for="fc3Name">Server name</label><input id="fc3Name" maxlength="40" required value="${phase3Escape(currentServer.name || "")}"></div>
          <div class="fc3-field"><label for="fc3Description">Description</label><textarea id="fc3Description" maxlength="200">${phase3Escape(currentServer.description || "")}</textarea><div class="fc3-help">Up to 200 characters.</div></div>
          <div class="fc3-field"><label for="fc3Icon">Server icon image URL</label><input id="fc3Icon" type="url" placeholder="https://example.com/icon.png" value="${phase3Escape(icon)}"></div>
          <div class="fc3-field"><label for="fc3Banner">Server banner image URL</label><input id="fc3Banner" type="url" placeholder="https://example.com/banner.jpg" value="${phase3Escape(banner)}"><div class="fc3-help">Use a direct image link beginning with http:// or https://.</div></div>
          <div class="fc3-field"><label for="fc3Background">Page background image URL</label><input id="fc3Background" type="url" placeholder="https://example.com/background.jpg" value="${phase3Escape(background)}"></div>
          <div class="fc3-two">
            <div class="fc3-field"><label for="fc3Theme">Appearance</label><select id="fc3Theme"><option value="dark" ${theme === "dark" ? "selected" : ""}>Dark</option><option value="light" ${theme === "light" ? "selected" : ""}>Light</option></select></div>
            <div class="fc3-field"><label for="fc3Accent">Accent color</label><div class="fc3-colorrow"><input id="fc3Accent" type="color" value="${accent}"><span id="fc3AccentText">${accent}</span></div></div>
          </div>
          <div class="fc3-actions"><button class="fc3-btn fc3-cancel" type="button">Cancel</button><button class="fc3-btn fc3-save" type="submit">Save changes</button></div>
        </form>
      </section>`;
    document.body.appendChild(overlay);
    serverSettingsOverlay = overlay;
    const colorInput = overlay.querySelector("#fc3Accent");
    colorInput.addEventListener("input", () => { overlay.querySelector("#fc3AccentText").textContent = colorInput.value; });
    overlay.querySelector(".fc3-close").addEventListener("click", closeServerSettings);
    overlay.querySelector(".fc3-cancel").addEventListener("click", closeServerSettings);
    overlay.addEventListener("click", event => { if (event.target === overlay) closeServerSettings(); });
    document.addEventListener("keydown", handleServerSettingsEscape);
    overlay.querySelector("form").addEventListener("submit", async event => {
        event.preventDefault();
        const saveButton = overlay.querySelector(".fc3-save");
        const name = overlay.querySelector("#fc3Name").value.trim();
        const description = overlay.querySelector("#fc3Description").value.trim();
        const iconValue = overlay.querySelector("#fc3Icon").value.trim();
        const bannerValue = overlay.querySelector("#fc3Banner").value.trim();
        const backgroundValue = overlay.querySelector("#fc3Background").value.trim();
        const themeValue = overlay.querySelector("#fc3Theme").value;
        const accentValue = colorInput.value;
        if (name.length < 2) { showToast("Server name must be at least 2 characters."); return; }
        for (const [label, value] of [["Icon", iconValue], ["Banner", bannerValue], ["Background", backgroundValue]]) {
            if (value && !phase3SafeImageURL(value)) { showToast(label + " must be a valid http or https image URL."); return; }
        }
        const oldServer = { ...currentServer, settings: { ...getServerSettings() } };
        currentServer.name = name;
        currentServer.description = description;
        currentServer.icon = iconValue ? phase3SafeImageURL(iconValue) : null;
        currentServer.banner = bannerValue ? phase3SafeImageURL(bannerValue) : null;
        currentServer.settings = { ...getServerSettings(), theme: themeValue, accentColor: accentValue, background: backgroundValue ? phase3SafeImageURL(backgroundValue) : null };
        saveButton.disabled = true; saveButton.textContent = "Saving…";
        let saved = false;
        try { saved = await saveServerToBackend(); } catch (error) { console.error("Could not save customization", error); }
        if (!saved) {
            currentServer = oldServer; applyServerAppearance();
            saveButton.disabled = false; saveButton.textContent = "Save changes";
            showToast("Could not save changes. Please try again.");
            return;
        }
        closeServerSettings();
        applyServerAppearance();
        await loadServer();
        applyServerAppearance();
        showToast("Server customization saved.");
    });
}
function initServerCustomization() {
    const settingsButtonPhase3 = document.getElementById("settingsButton");
    const settingsCardPhase3 = document.getElementById("serverSettingsCard");
    if (settingsButtonPhase3) settingsButtonPhase3.addEventListener("click", openServerSettings);
    if (settingsCardPhase3) settingsCardPhase3.addEventListener("click", openServerSettings);
    // Reapply saved theme/background after the main page has loaded its server data.
    const originalLoadServer = window.__fc3OriginalLoadServer;
    if (!originalLoadServer && typeof loadServer === "function") {
        window.__fc3OriginalLoadServer = loadServer;
        // Keep the app's existing loader; customization is applied after its promise resolves.
        window.loadServer = async function (...args) {
            const result = await window.__fc3OriginalLoadServer.apply(this, args);
            applyServerAppearance();
            return result;
        };
    }
    if (currentServer) applyServerAppearance();
    // The main page starts loading its server before this file executes.
    // Apply the saved appearance once that first server load finishes.
    let attempts = 0;
    const startupAppearanceTimer = setInterval(() => {
        attempts += 1;
        if (currentServer) {
            applyServerAppearance();
            clearInterval(startupAppearanceTimer);
        } else if (attempts >= 100) {
            clearInterval(startupAppearanceTimer);
        }
    }, 100);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initServerCustomization, { once: true });
else initServerCustomization();
