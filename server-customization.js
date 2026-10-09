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
    const settingsButton = document.getElementById("settingsButton");
    const settingsCard = document.getElementById("serverSettingsCard");
    if (settingsButton) settingsButton.addEventListener("click", openServerSettings);
    if (settingsCard) settingsCard.addEventListener("click", openServerSettings);
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
