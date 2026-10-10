
/* =========================================================
   FRIENDCHAT — SERVER HOME
   FIXED BACKEND-CONNECTED VERSION
   ========================================================= */

const API_BASE = "";

/* =========================================================
   ELEMENTS
   ========================================================= */

const topServerName = document.getElementById("topServerName");
const topServerIcon = document.getElementById("topServerIcon");
const topServerIconText = document.getElementById("topServerIconText");

const serverName = document.getElementById("serverName");
const serverDescription = document.getElementById("serverDescription");
const serverIcon = document.getElementById("serverIcon");
const serverIconText = document.getElementById("serverIconText");
const serverID = document.getElementById("serverID");

const previewIcon = document.getElementById("previewIcon");
const previewIconText = document.getElementById("previewIconText");
const previewName = document.getElementById("previewName");
const previewChannelList = document.getElementById("previewChannelList");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

/* Channel elements */
const createChannelButton = document.getElementById("createChannelButton");
const channelModal = document.getElementById("channelModal");
const channelModalBackdrop = document.getElementById("channelModalBackdrop");
const closeChannelModal = document.getElementById("closeChannelModal");
const cancelChannelButton = document.getElementById("cancelChannelButton");
const saveChannelButton = document.getElementById("saveChannelButton");
const channelNameInput = document.getElementById("channelNameInput");
const channelFormError = document.getElementById("channelFormError");
const textChannelOption = document.getElementById("textChannelOption");
const voiceChannelOption = document.getElementById("voiceChannelOption");
const textChannelList = document.getElementById("textChannelList");
const voiceChannelList = document.getElementById("voiceChannelList");

/* State */
let currentServer = null;
let selectedChannelID = null;
let toastTimer = null;

/* =========================================================
   CURRENT USER
   ========================================================= */

function getCurrentUserID() {
    const possibleKeys = [
        "friendchat_user_id",
        "userID",
        "userId",
        "currentUserID",
        "currentUserId",
        "fc_user_id"
    ];

    try {
        for (const key of possibleKeys) {
            const value = localStorage.getItem(key);

            if (value && String(value).trim()) {
                return String(value).trim().toUpperCase();
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
                if (!obj) continue;

                const id = obj.userID || obj.userId || obj.id || obj.ID;

                if (id && String(id).trim()) {
                    return String(id).trim().toUpperCase();
                }
            } catch (_) {}
        }
    } catch (error) {
        console.error("FriendChat: Could not read current user:", error);
    }

    return "";
}

/* =========================================================
   SERVER ID
   ========================================================= */

function getCurrentServerID() {
    try {
        const params = new URLSearchParams(window.location.search);
        const urlID = params.get("server") || params.get("serverID") || "";

        if (urlID.trim()) {
            return urlID.trim();
        }
    } catch (error) {
        console.warn("FriendChat: URL server ID read failed:", error);
    }

    try {
        const saved = localStorage.getItem("friendchat_current_server");

        if (saved && saved.trim()) {
            return saved.trim();
        }
    } catch (error) {
        console.warn("FriendChat: saved server ID read failed:", error);
    }

    return "";
}

function saveCurrentServerID(id) {
    if (!id) return;

    try {
        localStorage.setItem("friendchat_current_server", String(id));
    } catch (error) {
        console.error("FriendChat: Could not save server ID:", error);
    }
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {
    if (!toast || !toastMessage) {
        console.log("FriendChat:", message);
        return;
    }

    toastMessage.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(url, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const userID = getCurrentUserID();

    if (userID) {
        headers["x-friendchat-user-id"] = userID;
    }

    console.log(
        "FriendChat API:",
        options.method || "GET",
        API_BASE + url,
        "User:",
        userID
    );

    let response;

    try {
        response = await fetch(API_BASE + url, {
            ...options,
            headers
        });
    } catch (error) {
        console.error("FriendChat network error:", error);
        throw new Error("Cannot connect to FriendChat server.");
    }

    let data = null;

    try {
        data = await response.json();
    } catch (_) {}

    console.log("FriendChat API response:", response.status, data);

    if (!response.ok) {
        throw new Error(
            data && data.error
                ? data.error
                : "Server request failed."
        );
    }

    return data;
}

/* =========================================================
   LOAD SERVER FROM BACKEND
   ========================================================= */

async function loadServerFromBackend() {
    const id = getCurrentServerID();
    const userID = getCurrentUserID();

    console.log("FriendChat loading server:", id, "User:", userID);

    if (!id) {
        showToast("Server ID is missing.");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);

        return null;
    }

    let requestURL = "/api/servers/" + encodeURIComponent(id);

    if (userID) {
        requestURL += "?user=" + encodeURIComponent(userID);
    }

    try {
        const data = await apiRequest(requestURL, { method: "GET" });

        if (!data || !data.server) {
            throw new Error("Server was not returned by the backend.");
        }

        currentServer = data.server;

        if (!currentServer.serverID) {
            currentServer.serverID = id;
        }

        saveCurrentServerID(currentServer.serverID);
        normalizeChannels(currentServer);

        console.log("FriendChat server loaded successfully:", currentServer);

        return currentServer;
    } catch (error) {
        console.error("FriendChat server loading failed:", error);
        showToast(error.message || "Server not found.");
        return null;
    }
}

/* =========================================================
   CHANNEL DATA
   ========================================================= */

function normalizeChannels(server) {
    if (!server || typeof server !== "object") {
        return [];
    }

    if (!Array.isArray(server.channels)) {
        server.channels = [];
    }

    return server.channels;
}

function getChannels() {
    if (!currentServer) return [];
    return normalizeChannels(currentServer);
}

/* =========================================================
   SERVER INITIALS AND IMAGES
   ========================================================= */

function getServerInitials(name) {
    if (!name) return "FC";

    const words = String(name).trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
}

function setServerImage(imageElement, textElement, icon, initials) {
    if (
        imageElement &&
        textElement &&
        typeof icon === "string" &&
        icon.trim()
    ) {
        imageElement.src = icon;
        imageElement.style.display = "block";
        textElement.style.display = "none";

        imageElement.onerror = () => {
            imageElement.removeAttribute("src");
            imageElement.style.display = "none";
            textElement.textContent = initials;
            textElement.style.display = "block";
        };

        return;
    }

    if (imageElement) {
        imageElement.removeAttribute("src");
        imageElement.style.display = "none";
    }

    if (textElement) {
        textElement.textContent = initials;
        textElement.style.display = "block";
    }
}

/* =========================================================
   CHANNEL IDS AND SAVED SELECTION
   ========================================================= */

function generateChannelID() {
    return (
        "CH-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random().toString(36).substring(2, 8).toUpperCase()
    );
}

function getSavedChannelID() {
    try {
        const raw = localStorage.getItem("friendchat_current_channel");
        if (!raw) return null;

        try {
            const data = JSON.parse(raw);

            if (data && typeof data === "object") {
                if (
                    data.serverID &&
                    currentServer &&
                    String(data.serverID) !== String(currentServer.serverID)
                ) {
                    return null;
                }

                return data.channelID || null;
            }
        } catch (_) {
            return raw;
        }
    } catch (_) {}

    return null;
}

function saveSelectedChannel(channel) {
    if (!currentServer || !channel) return;

    try {
        localStorage.setItem(
            "friendchat_current_channel",
            JSON.stringify({
                serverID: currentServer.serverID,
                channelID: channel.channelID
            })
        );
    } catch (error) {
        console.error("FriendChat: Could not save channel:", error);
    }
}

function getChannelFromURL() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get("channel") || params.get("channelID") || null;
    } catch (_) {
        return null;
    }
}

/* =========================================================
   LOAD SERVER UI
   ========================================================= */

async function loadServer() {
    const server = await loadServerFromBackend();

    if (!server) {
        console.error("FriendChat: Server could not be loaded.");
        return null;
    }

    const name = currentServer.name || "Unnamed Server";
    const description =
        currentServer.description || "Welcome to your FriendChat server.";
    const initials = getServerInitials(name);

    if (topServerName) {
        topServerName.textContent = name;
    }

    setServerImage(topServerIcon, topServerIconText, currentServer.icon, initials);

    if (serverName) {
        serverName.textContent = name;
    }

    if (serverDescription) {
        serverDescription.textContent = description;
    }

    if (serverID) {
        serverID.textContent = currentServer.serverID || "—";
    }

    setServerImage(serverIcon, serverIconText, currentServer.icon, initials);
    setServerImage(previewIcon, previewIconText, currentServer.icon, initials);

    if (previewName) {
        previewName.textContent = name;
    }

    const urlChannel = getChannelFromURL();
    const savedChannel = getSavedChannelID();
    const possibleChannel = urlChannel || savedChannel;

    selectedChannelID = null;

    if (possibleChannel) {
        const found = getChannels().find(channel =>
            String(channel.channelID) === String(possibleChannel)
        );

        if (found) {
            selectedChannelID = found.channelID;
        }
    }

    if (!selectedChannelID && getChannels().length) {
        selectedChannelID = getChannels()[0].channelID;
    }

    renderChannels();

    console.log("FriendChat server home ready.", currentServer);

    return currentServer;
}

/* =========================================================
   RENDER CHANNELS
   ========================================================= */

function renderChannels() {
    if (!currentServer) return;

    const channels = getChannels();

    const textChannels = channels.filter(channel => channel.type === "text");
    const voiceChannels = channels.filter(channel => channel.type === "voice");

    if (textChannelList) {
        textChannelList.innerHTML = "";

        if (!textChannels.length) {
            textChannelList.innerHTML =
                '<div class="channel-empty">No text channels yet.</div>';
        } else {
            textChannels.forEach(channel => {
                textChannelList.appendChild(createChannelElement(channel));
            });
        }
    }

    if (voiceChannelList) {
        voiceChannelList.innerHTML = "";

        if (!voiceChannels.length) {
            voiceChannelList.innerHTML =
                '<div class="channel-empty">No voice channels yet.</div>';
        } else {
            voiceChannels.forEach(channel => {
                voiceChannelList.appendChild(createChannelElement(channel));
            });
        }
    }

    renderPreviewChannels();
}

/* =========================================================
   CREATE CHANNEL ELEMENT
   FIXED: Removed the duplicated, invalid if statement.
   ========================================================= */

function createChannelElement(channel) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "channel-item";
    button.dataset.channelId = channel.channelID;

    if (String(channel.channelID) === String(selectedChannelID)) {
        button.classList.add("active");
    }

    const icon = channel.type === "voice" ? "🔊" : "#";

    const description =
        channel.description ||
        (channel.type === "voice" ? "Voice channel" : "Text channel");

    button.innerHTML = `
        <div class="channel-icon">${icon}</div>
        <div class="channel-info">
            <div class="channel-name">${escapeHTML(channel.name)}</div>
            <div class="channel-description">${escapeHTML(description)}</div>
        </div>
        <div class="channel-arrow">→</div>
    `;

    button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        selectChannel(channel);
    });

    return button;
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   SELECT CHANNEL
   ========================================================= */

function selectChannel(channel) {
    if (!currentServer || !channel || !channel.channelID) {
        showToast("Channel is unavailable.");
        return;
    }

    selectedChannelID = channel.channelID;
    saveSelectedChannel(channel);

    if (channel.type === "voice") {
        showToast("🔊 " + channel.name + " selected");
        renderChannels();
        return;
    }

    const targetURL =
        "channel-chat.html" +
        "?server=" + encodeURIComponent(String(currentServer.serverID)) +
        "&channel=" + encodeURIComponent(String(channel.channelID));

    console.log("FriendChat opening channel:", targetURL);
    window.location.href = targetURL;
}

/* =========================================================
   PREVIEW CHANNELS
   ========================================================= */

function renderPreviewChannels() {
    if (!previewChannelList) return;

    previewChannelList.innerHTML = "";

    const channels = getChannels();

    if (!channels.length) {
        previewChannelList.innerHTML =
            '<div class="preview-channel muted">No channels</div>';
        return;
    }

    channels.slice(0, 8).forEach(channel => {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "preview-channel";
        item.dataset.channelId = channel.channelID;

        if (String(channel.channelID) === String(selectedChannelID)) {
            item.classList.add("active");
        }

        item.textContent =
            channel.type === "voice"
                ? "🔊 " + channel.name
                : "# " + channel.name;

        item.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            selectChannel(channel);
        });

        previewChannelList.appendChild(item);
    });
}

/* =========================================================
   CHANNEL MODAL
   ========================================================= */

function openChannelModal() {
    if (!channelModal) return;

    clearChannelForm();
    channelModal.classList.add("open");
    channelModal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
        if (channelNameInput) channelNameInput.focus();
    }, 100);
}

function closeChannelModalWindow() {
    if (!channelModal) return;

    channelModal.classList.remove("open");
    channelModal.setAttribute("aria-hidden", "true");
    clearChannelForm();
}

function clearChannelForm() {
    if (channelNameInput) {
        channelNameInput.value = "";
    }

    if (channelFormError) {
        channelFormError.textContent = "";
    }

    const textRadio = document.querySelector(
        'input[name="channelType"][value="text"]'
    );

    if (textRadio) {
        textRadio.checked = true;
    }

    updateChannelTypeUI();
}

function getSelectedChannelType() {
    const selected = document.querySelector(
        'input[name="channelType"]:checked'
    );

    return selected ? selected.value : "text";
}

function updateChannelTypeUI() {
    const type = getSelectedChannelType();

    if (textChannelOption) {
        textChannelOption.classList.toggle("selected", type === "text");
    }

    if (voiceChannelOption) {
        voiceChannelOption.classList.toggle("selected", type === "voice");
    }
}

function showChannelError(message) {
    if (channelFormError) {
        channelFormError.textContent = message;
    }
}

/* =========================================================
   SAVE SERVER TO BACKEND
   ========================================================= */

async function saveServerToBackend() {
    if (!currentServer) return false;

    const userID = getCurrentUserID();

    try {
        const data = await apiRequest(
            "/api/servers/" + encodeURIComponent(currentServer.serverID),
            {
                method: "PUT",
                body: JSON.stringify({
                    ...currentServer,
                    requesterID: userID,
                    userID: userID
                })
            }
        );

        if (data && data.server) {
            currentServer = data.server;
        }

        return true;
    } catch (error) {
        console.error("FriendChat: Server save failed:", error);
        showToast(error.message || "Could not save server.");
        return false;
    }
}

/* =========================================================
   CREATE CHANNEL
   ========================================================= */

async function createChannel() {
    if (!currentServer) {
        showChannelError("No server is currently selected.");
        return;
    }

    const name = channelNameInput
        ? channelNameInput.value.trim().replace(/\s+/g, " ")
        : "";

    if (!name) {
        showChannelError("Please enter a channel name.");
        return;
    }

    if (name.length < 2) {
        showChannelError("Channel name must be at least 2 characters.");
        return;
    }

    if (name.length > 40) {
        showChannelError("Channel name must be 40 characters or less.");
        return;
    }

    const type = getSelectedChannelType();

    const duplicate = getChannels().some(channel =>
        String(channel.name || "").trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        showChannelError("A channel with this name already exists.");
        return;
    }

    const newChannel = {
        channelID: generateChannelID(),
        name,
        type,
        description: type === "voice" ? "Voice channel" : "Text channel",
        createdAt: new Date().toISOString()
    };

    if (saveChannelButton) {
        saveChannelButton.disabled = true;
        saveChannelButton.textContent = "Creating...";
    }

    const previousChannels = [...getChannels()];

    try {
        currentServer.channels = [...previousChannels, newChannel];

        const saved = await saveServerToBackend();

        if (!saved) {
            currentServer.channels = previousChannels;
            renderChannels();
            return;
        }

        selectedChannelID = newChannel.channelID;
        saveSelectedChannel(newChannel);

        renderChannels();
        closeChannelModalWindow();

        showToast(
            type === "voice"
                ? "Voice channel created"
                : "Text channel created"
        );
    } catch (error) {
        currentServer.channels = previousChannels;
        renderChannels();

        console.error("FriendChat: Create channel failed:", error);
        showChannelError(error.message || "Could not create channel.");
    } finally {
        if (saveChannelButton) {
            saveChannelButton.disabled = false;
            saveChannelButton.textContent = "Create Channel";
        }
    }
}

/* =========================================================
   CHANNEL BUTTONS
   ========================================================= */

if (createChannelButton) {
    createChannelButton.addEventListener("click", openChannelModal);
}

if (closeChannelModal) {
    closeChannelModal.addEventListener("click", closeChannelModalWindow);
}

if (cancelChannelButton) {
    cancelChannelButton.addEventListener("click", closeChannelModalWindow);
}

if (channelModalBackdrop) {
    channelModalBackdrop.addEventListener("click", closeChannelModalWindow);
}

if (saveChannelButton) {
    saveChannelButton.addEventListener("click", createChannel);
}

if (channelNameInput) {
    channelNameInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            createChannel();
        }
    });
}

/* Channel type selectors */
document.querySelectorAll('input[name="channelType"]').forEach(radio => {
    radio.addEventListener("change", updateChannelTypeUI);
});

/* Escape closes the channel modal */
document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        channelModal &&
        channelModal.classList.contains("open")
    ) {
        closeChannelModalWindow();
    }
});

/* =========================================================
   COPY SERVER ID
   ========================================================= */

const copyServerIDButton = document.getElementById("copyServerID");

if (copyServerIDButton) {
    copyServerIDButton.addEventListener("click", async () => {
        if (!serverID) return;

        const id = serverID.textContent.trim();

        if (!id || id === "—") return;

        try {
            await navigator.clipboard.writeText(id);
            showToast("Server ID copied");
        } catch (error) {
            console.error("Copy failed:", error);
            showToast("Could not copy server ID");
        }
    });
}

/* =========================================================
   BACK BUTTON
   ========================================================= */

const backButton = document.getElementById("backButton");

if (backButton) {
    backButton.addEventListener("click", () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "index.html";
        }
    });
}

/* =========================================================
   OPEN MEMBERS
   ========================================================= */

function openServerMembers() {
    if (!currentServer) {
        showToast("Server is not loaded yet.");
        return;
    }

    saveCurrentServerID(currentServer.serverID);

    const targetURL =
        "server-members.html?server=" +
        encodeURIComponent(currentServer.serverID);

    console.log("FriendChat opening Members:", targetURL);
    window.location.href = targetURL;
}

const membersCard = document.getElementById("membersCard");
const membersButton = document.getElementById("membersButton");

if (membersCard) {
    membersCard.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openServerMembers();
    });
}

if (membersButton) {
    membersButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openServerMembers();
    });
}

/* =========================================================
   OTHER SERVER CARDS
   ========================================================= */

const rulesCard = document.getElementById("rulesCard");
const rolesCard = document.getElementById("rolesCard");
const aiCard = document.getElementById("aiCard");
const musicCard = document.getElementById("musicCard");
const activityCard = document.getElementById("activityCard");
const channelsCard = document.getElementById("channelsCard");

/*
   IMPORTANT:
   Do not add "coming soon" click handlers to settingsButton
   or serverSettingsCard here. server-customization.js handles
   those elements and opens the customization modal.
*/

if (channelsCard) {
    channelsCard.addEventListener("click", () => {
        const section = document.getElementById("channelsSection");

        if (section) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

if (rulesCard) {
    rulesCard.addEventListener("click", () => {
        showToast("Rules system coming soon.");
    });
}

if (rolesCard) {
    rolesCard.addEventListener("click", () => {
        showToast("Roles will be added later.");
    });
}

if (aiCard) {
    aiCard.addEventListener("click", () => {
        showToast("FriendChat AI will be added later.");
    });
}

if (musicCard) {
    musicCard.addEventListener("click", () => {
        showToast("Music system will be added later.");
    });
}

if (activityCard) {
    activityCard.addEventListener("click", () => {
        showToast("Activity will be added later.");
    });
}

/* =========================================================
   START
   ========================================================= */

console.log("FriendChat server-home.js loaded.");
console.log("Current User:", getCurrentUserID());
console.log("Current Server ID:", getCurrentServerID());

loadServer();
