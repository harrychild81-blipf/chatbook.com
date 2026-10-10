
/* =========================================================
   FRIENDCHAT SERVER HOME
   Server loading, channels, backend saving, and navigation
   ========================================================= */

"use strict";

const API_BASE = "";

let currentServer = null;
let selectedChannelID = null;
let toastTimer = null;

const DEFAULT_SERVER = {
    id: "",
    name: "My Server",
    description: "",
    icon: "",
    banner: "",
    channels: [
        {
            id: "general",
            name: "General",
            type: "text"
        }
    ],
    settings: {
        creationMode: "simple",
        theme: "dark",
        accent: "#6c63ff",
        background: "#070a10",
        privacy: "private"
    }
};

/* -------------------------
   GENERAL HELPERS
------------------------- */

function getServerId() {
    const params = new URLSearchParams(window.location.search);

    return (
        params.get("id") ||
        params.get("serverId") ||
        localStorage.getItem("friendchat_current_server") ||
        ""
    );
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

function showToast(message) {
    let toast = document.getElementById("fcToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "fcToast";
        toast.setAttribute("role", "status");

        Object.assign(toast.style, {
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "100000",
            background: "#171e2b",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "10px",
            border: "1px solid #30394b",
            boxShadow: "0 8px 30px #0006",
            fontSize: "14px",
            maxWidth: "90vw"
        });

        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 2800);
}

async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed (${response.status})`
        );
    }

    return data;
}

/* -------------------------
   LOAD SERVER FROM BACKEND
------------------------- */

async function loadServerFromBackend() {
    const serverId = getServerId();

    if (!serverId) {
        throw new Error(
            "No server ID found. Open this page using your server's ID."
        );
    }

    const response = await fetch(
        `${API_BASE}/api/servers/${encodeURIComponent(serverId)}`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        }
    );

    const data = await readResponse(response);

    currentServer = data.server || data;

    if (!currentServer || typeof currentServer !== "object") {
        throw new Error("The server data returned by the backend is invalid.");
    }

    if (!currentServer.id) {
        currentServer.id = serverId;
    }

    if (!Array.isArray(currentServer.channels)) {
        currentServer.channels = [];
    }

    if (!currentServer.channels.length) {
        currentServer.channels.push({
            id: "general",
            name: "General",
            type: "text"
        });
    }

    if (!currentServer.settings || typeof currentServer.settings !== "object") {
        currentServer.settings = {};
    }

    return currentServer;
}

/* -------------------------
   SAVE SERVER TO BACKEND
------------------------- */

async function saveServerToBackend() {
    if (!currentServer) {
        showToast("No server is loaded.");
        return false;
    }

    const serverId = currentServer.id || getServerId();

    if (!serverId) {
        showToast("Server ID is missing.");
        return false;
    }

    try {
        /*
         * This uses PUT /api/servers/:id.
         * Your backend must support this route and save the submitted fields.
         */
        const response = await fetch(
            `${API_BASE}/api/servers/${encodeURIComponent(serverId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(currentServer)
            }
        );

        const data = await readResponse(response);

        if (data.server && typeof data.server === "object") {
            currentServer = {
                ...currentServer,
                ...data.server
            };
        }

        paintServerDetails();
        applyServerAppearance();

        return true;
    } catch (error) {
        console.error("FriendChat: Server save failed:", error);
        showToast(`Save failed: ${error.message}`);
        return false;
    }
}

/* -------------------------
   PAINT SERVER INFORMATION
------------------------- */

function paintServerDetails() {
    if (!currentServer) return;

    const name = currentServer.name || "My Server";
    const description = currentServer.description || "";
    const icon = currentServer.icon || "";

    const nameTargets = [
        "#serverName",
        "#serverTitle",
        "#serverNameLabel",
        "[data-server-name]"
    ];

    nameTargets.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            if ("value" in element && element.tagName === "INPUT") {
                element.value = name;
            } else {
                element.textContent = name;
            }
        });
    });

    const descriptionTargets = [
        "#serverDescription",
        "#serverDescriptionLabel",
        "[data-server-description]"
    ];

    descriptionTargets.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.textContent = description;
        });
    });

    const iconTargets = [
        "#serverIcon",
        "#serverIconPreview",
        "#serverAvatar",
        "[data-server-icon]"
    ];

    iconTargets.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            if (element.tagName === "IMG") {
                element.src = icon;
                element.alt = `${name} icon`;
                element.onerror = () => {
                    element.style.display = "none";
                };
                element.style.display = icon ? "" : "none";
            } else if (!icon) {
                element.textContent = "FC";
            } else {
                element.textContent = "";
                element.style.backgroundImage = `url("${icon.replace(/["\\]/g, "")}")`;
                element.style.backgroundSize = "cover";
                element.style.backgroundPosition = "center";
            }
        });
    });

    const status = document.getElementById("serverStatus");

    if (status) {
        status.textContent = "Your server";
    }

    document.title = `${name} | FriendChat`;
}

/* -------------------------
   CHANNELS
------------------------- */

function renderChannels() {
    if (!currentServer) return;

    const channelContainer =
        document.getElementById("channelList") ||
        document.getElementById("channelsList") ||
        document.querySelector("[data-channel-list]");

    if (!channelContainer) {
        console.warn(
            "FriendChat: Could not find the channel list container."
        );
        return;
    }

    const channels = currentServer.channels || [];

    if (
        !selectedChannelID ||
        !channels.some(channel => String(channel.id) === String(selectedChannelID))
    ) {
        selectedChannelID = channels[0]?.id || null;
    }

    channelContainer.innerHTML = "";

    channels.forEach(channel => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "channel-item";
        button.dataset.channelId = channel.id;

        if (String(channel.id) === String(selectedChannelID)) {
            button.classList.add("active");
        }

        const symbol = channel.type === "voice" ? "🔊" : "#";

        button.textContent = `${symbol} ${channel.name || "Channel"}`;

        button.addEventListener("click", () => {
            selectedChannelID = channel.id;

            renderChannels();

            document.dispatchEvent(
                new CustomEvent("friendchat:channel-selected", {
                    detail: { channel }
                })
            );
        });

        channelContainer.appendChild(button);
    });
}

function addChannel(name, type = "text") {
    if (!currentServer) {
        showToast("Load a server first.");
        return;
    }

    const cleanName = String(name || "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 40);

    if (!cleanName) {
        showToast("Enter a channel name.");
        return;
    }

    const exists = currentServer.channels.some(
        channel => channel.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (exists) {
        showToast("A channel with that name already exists.");
        return;
    }

    const channel = {
        id: `channel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        type: type === "voice" ? "voice" : "text"
    };

    currentServer.channels.push(channel);
    selectedChannelID = channel.id;

    renderChannels();

    saveServerToBackend().then(success => {
        if (success) {
            showToast("Channel created.");
        }
    });
}

/* -------------------------
   APPEARANCE
------------------------- */

function applyServerAppearance() {
    const settings = currentServer?.settings || {};

    const accent = settings.accent || "#6c63ff";
    const background = settings.background || "#070a10";
    const theme = settings.theme || "dark";

    document.documentElement.style.setProperty("--fc-accent", accent);
    document.documentElement.style.setProperty("--fc-accent-color", accent);
    document.documentElement.style.setProperty("--fc-bg", background);

    document.documentElement.dataset.serverTheme = theme;
    document.body.dataset.serverTheme = theme;

    document.dispatchEvent(
        new CustomEvent("friendchat:appearance-changed", {
            detail: { settings }
        })
    );
}

/* -------------------------
   NAVIGATION
------------------------- */

function goBackToServers() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = "index.html";
    }
}

/* -------------------------
   PAGE INITIALIZATION
------------------------- */

async function loadServer() {
    try {
        await loadServerFromBackend();

        paintServerDetails();
        renderChannels();
        applyServerAppearance();

        document.dispatchEvent(
            new CustomEvent("friendchat:server-loaded", {
                detail: { server: currentServer }
            })
        );

        return currentServer;
    } catch (error) {
        console.error("FriendChat: Could not load server:", error);
        showToast(error.message || "Could not load server.");
        throw error;
    }
}

function initializeServerHome() {
    const backButton =
        document.getElementById("backButton") ||
        document.getElementById("backToServers");

    if (backButton) {
        backButton.addEventListener("click", goBackToServers);
    }

    const addChannelButton =
        document.getElementById("addChannelButton") ||
        document.getElementById("createChannelButton");

    if (addChannelButton) {
        addChannelButton.addEventListener("click", () => {
            const name = window.prompt("Enter a channel name:");

            if (name === null) return;

            const type = window.confirm(
                "Create a voice channel?\n\nOK = Voice channel\nCancel = Text channel"
            ) ? "voice" : "text";

            addChannel(name, type);
        });
    }

    loadServer().catch(() => {
        // The error has already been logged and shown to the user.
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeServerHome);
} else {
    initializeServerHome();
}
