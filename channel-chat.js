
/* =========================================================
   FRIENDCHAT — CHANNEL CHAT
   Backend connected + natural message bubbles
   Server appearance + owner identity
   ========================================================= */

(() => {
    "use strict";

    /* ================= CONFIG ================= */

    const API_BASE = "";

    const CURRENT_SERVER_KEY = "friendchat_current_server";
    const CURRENT_CHANNEL_KEY = "friendchat_current_channel";

    const USER_ID_KEYS = [
        "friendchat_user_id",
        "userId",
        "userID",
        "currentUserId",
        "currentUserID"
    ];

    const USER_NAME_KEYS = [
        "friendchat_user_name",
        "userName",
        "username",
        "currentUserName"
    ];

    let currentUserID = "";
    let currentUserName = "";
    let currentServerID = "";
    let currentChannelID = "";
    let currentServer = null;
    let currentChannel = null;
    let messages = [];

    let socket = null;
    let reconnectTimer = null;
    let messagePollTimer = null;
    let isSending = false;
    let isLoadingMessages = false;

    /* ================= DOM ================= */

    const $ = id => document.getElementById(id);

    const backButton = $("backButton");
    const channelIcon = $("channelIcon");
    const channelName = $("channelName");
    const channelType = $("channelType");
    const channelDescription = $("channelDescription");
    const serverName = $("serverName");
    const serverButton = $("serverButton");

    const messagesBox = $("messages");
    const emptyState = $("emptyState");
    const emptyChannelName = $("emptyChannelName");

    const messageInput = $("messageInput");
    const sendButton = $("sendButton");
    const attachButton = $("attachButton");
    const emojiButton = $("emojiButton");
    const characterCount = $("characterCount");
    const toast = $("toast");

    /* ================= HELPERS ================= */

    function clean(value) {
        return String(value ?? "").trim();
    }

    function normalizeID(value) {
        return clean(value).toUpperCase();
    }

    function showToast(message, duration = 3000) {
        if (!toast) {
            console.log("FriendChat:", message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, duration);
    }

    function getStorageValue(keys) {
        for (const key of keys) {
            try {
                const value = localStorage.getItem(key);
                if (value && clean(value)) return clean(value);
            } catch (_) {}
        }

        return "";
    }

    function getUserFromStorage() {
        let id = getStorageValue(USER_ID_KEYS);
        let name = getStorageValue(USER_NAME_KEYS);

        const objectKeys = [
            "friendchat_user",
            "currentUser",
            "user",
            "friendchat_current_user"
        ];

        for (const key of objectKeys) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;

                const parsed = JSON.parse(raw);

                if (!parsed || typeof parsed !== "object") continue;

                id = id || clean(
                    parsed.userID ||
                    parsed.userId ||
                    parsed.id ||
                    parsed.uid
                );

                name = name || clean(
                    parsed.name ||
                    parsed.username ||
                    parsed.userName ||
                    parsed.displayName
                );
            } catch (_) {}
        }

        return {
            id: normalizeID(id),
            name: name || "FriendChat User"
        };
    }

    function saveCurrentLocation() {
        try {
            if (currentServerID) {
                localStorage.setItem(
                    CURRENT_SERVER_KEY,
                    currentServerID
                );
            }

            if (currentChannelID) {
                localStorage.setItem(
                    CURRENT_CHANNEL_KEY,
                    currentChannelID
                );
            }
        } catch (_) {}
    }

    function getURLParams() {
        const params = new URLSearchParams(location.search);

        return {
            serverID:
                clean(params.get("server")) ||
                clean(params.get("serverID")) ||
                clean(params.get("serverId")),

            channelID:
                clean(params.get("channel")) ||
                clean(params.get("channelID")) ||
                clean(params.get("channelId"))
        };
    }

    function validColor(value, fallback) {
        const color = clean(value);

        if (/^#[0-9a-f]{3}$/i.test(color)) {
            return "#" + color[1] + color[1] +
                color[2] + color[2] +
                color[3] + color[3];
        }

        return /^#[0-9a-f]{6}$/i.test(color)
            ? color
            : fallback;
    }

    function getReadableTextColor(hexColor) {
        const hex = validColor(hexColor, "#6c63ff").slice(1);

        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        const brightness =
            (r * 299 + g * 587 + b * 114) / 1000;

        return brightness >= 155 ? "#151525" : "#ffffff";
    }

    /* ================= SERVER APPEARANCE ================= */

    function safeImageURL(value) {
        const text = clean(value);
        if (!text) return "";

        if (/^data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(text)) {
            return text;
        }

        try {
            const url = new URL(text, location.href);

            if (
                url.protocol === "https:" ||
                url.protocol === "http:"
            ) {
                return url.href;
            }
        } catch (_) {}

        return "";
    }

    function getBackgroundImageSetting(settings) {
        const keys = [
            "background",
            "backgroundImage",
            "backgroundImageUrl",
            "backgroundImageURL",
            "backgroundUrl",
            "backgroundURL",
            "customBackground",
            "backgroundImageData",
            "backgroundDataURL",
            "backgroundImageDataURL",
            "serverBackground",
            "wallpaper",
            "wallpaperUrl"
        ];

        for (const key of keys) {
            const url = safeImageURL(settings?.[key]);
            if (url) return url;
        }

        return "";
    }

    function getFontFamily(settings) {
        const fonts = {
            system: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
            rounded: "'Trebuchet MS', 'Segoe UI', sans-serif",
            mono: "ui-monospace, Consolas, monospace",
            serif: "Georgia, 'Times New Roman', serif"
        };

        return fonts[settings.fontFamily] || fonts.system;
    }

    function applyServerAppearance() {
        if (!document.documentElement || !document.body) return;

        const settings =
            currentServer?.settings &&
            typeof currentServer.settings === "object"
                ? currentServer.settings
                : {};

        const isLight = settings.theme === "light";

        const colors = {
            accent: validColor(settings.accentColor, "#6c63ff"),
            background: validColor(
                settings.backgroundColor,
                isLight ? "#f3f5fb" : "#070a10"
            ),
            panel: validColor(
                settings.panelColor,
                isLight ? "#ffffff" : "#0d121b"
            ),
            sidebar: validColor(
                settings.sidebarColor,
                isLight ? "#eef1f8" : "#111824"
            ),
            text: validColor(
                settings.textColor,
                isLight ? "#182033" : "#f4f5ff"
            ),
            border: validColor(
                settings.borderColor,
                isLight ? "#d9dfeb" : "#252d3a"
            )
        };

        const fontFamily = getFontFamily(settings);
        const fontScale =
            settings.fontScale === "small" ? 0.92 :
            settings.fontScale === "large" ? 1.08 : 1;

        const spacingScale =
            settings.spacing === "compact" ? 0.78 :
            settings.spacing === "relaxed" ? 1.2 : 1;

        const radius =
            settings.corners === "square" ? "3px" :
            settings.corners === "soft" ? "18px" : "12px";

        const ownText = getReadableTextColor(colors.accent);

        const shadowOpacity =
            settings.shadow === "none" ? "0" :
            settings.shadow === "strong" ? "0.42" : "0.20";

        const backgroundURL = getBackgroundImageSetting(settings);

        const overlay = isLight
            ? "rgba(243,245,251,0.18)"
            : "rgba(7,10,16,0.18)";

        const overlayEnd = isLight
            ? "rgba(243,245,251,0.30)"
            : "rgba(7,10,16,0.32)";

        const root = document.documentElement;

        const variables = {
            "--fc-accent": colors.accent,
            "--accent": colors.accent,
            "--fc-bg": colors.background,
            "--fc-background": colors.background,
            "--fc-panel": colors.panel,
            "--fc-panel-2": colors.sidebar,
            "--fc-panel-3": colors.sidebar,
            "--fc-text": colors.text,
            "--fc-border": colors.border,
            "--fc-font-family": fontFamily,
            "--fc-font-scale": String(fontScale),
            "--fc-space-scale": String(spacingScale),
            "--fc-shadow-strength": shadowOpacity,
            "--fc-radius": radius,
            "--fc-chat-background": colors.background,
            "--fc-chat-panel": colors.panel,
            "--fc-chat-own-message": colors.accent,
            "--fc-chat-own-text": ownText,
            "--fc-chat-other-message": colors.sidebar,
            "--fc-chat-other-text": colors.text,
            "--fc-chat-text": colors.text,
            "--fc-chat-border": colors.border
        };

        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        document.body.style.backgroundColor = colors.background;
        document.body.style.backgroundImage = backgroundURL
            ? `linear-gradient(${overlay}, ${overlayEnd}), url("${backgroundURL}")`
            : "none";

        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center center";
        document.body.style.backgroundRepeat = "no-repeat";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.color = colors.text;
        document.body.style.fontFamily = fontFamily;

        document.body.dataset.serverTheme = isLight ? "light" : "dark";

        let style = $("fc-chat-server-appearance");

        if (!style) {
            style = document.createElement("style");
            style.id = "fc-chat-server-appearance";
            document.head.appendChild(style);
        }

        const cssSafeURL = backgroundURL
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/[\n\r\f]/g, "");

        const backgroundImage = backgroundURL
            ? `linear-gradient(${overlay}, ${overlayEnd}), url("${cssSafeURL}")`
            : "none";

        style.textContent = `
            :root {
                --fc-accent: ${colors.accent};
                --accent: ${colors.accent};
                --fc-bg: ${colors.background};
                --fc-background: ${colors.background};
                --fc-panel: ${colors.panel};
                --fc-panel-2: ${colors.sidebar};
                --fc-panel-3: ${colors.sidebar};
                --fc-text: ${colors.text};
                --fc-border: ${colors.border};
                --fc-font-family: ${fontFamily};
                --fc-font-scale: ${fontScale};
                --fc-space-scale: ${spacingScale};
                --fc-radius: ${radius};
                --fc-shadow-strength: ${shadowOpacity};
                --fc-chat-background: ${colors.background};
                --fc-chat-panel: ${colors.panel};
                --fc-chat-own-message: ${colors.accent};
                --fc-chat-own-text: ${ownText};
                --fc-chat-other-message: ${colors.sidebar};
                --fc-chat-other-text: ${colors.text};
                --fc-chat-text: ${colors.text};
                --fc-chat-border: ${colors.border};
            }

            html, body {
                background-color: ${colors.background};
                color: ${colors.text};
                font-family: ${fontFamily};
            }

            body {
                background-image: ${backgroundImage};
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                background-attachment: fixed;
            }

            .channel-app,
            .channel-main,
            #messages,
            .messages,
            .message-list,
            #messageList,
            .chat-messages {
                background-color: transparent !important;
                background-image: none !important;
            }

            .chat-layout,
            .chat-shell,
            .chat-container,
            .chat-main,
            .chat-content,
            .chat-area,
            .chat-panel,
            .messages-area,
            .chat-messages-wrapper {
                color: ${colors.text};
                border-color: ${colors.border};
            }

            .channel-topbar,
            .chat-header,
            .channel-header,
            .chat-topbar,
            .composer-area,
            .composer,
            .chat-input-area,
            .message-composer,
            .message-input-area {
                color: ${colors.text};
                background-color: ${colors.panel};
                border-color: ${colors.border};
            }

            /* NATURAL MESSAGE WIDTH — main fix */
            #messages .message,
            .messages .message {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                width: 100%;
                min-width: 0;
                box-sizing: border-box;
                margin-top: calc(8px * ${spacingScale});
                margin-bottom: calc(8px * ${spacingScale});
            }

            #messages .message-content,
            .messages .message-content {
                display: block !important;
                flex: 0 1 auto !important;
                width: fit-content !important;
                max-width: min(75%, 700px) !important;
                min-width: 0 !important;
                box-sizing: border-box;
                align-self: flex-start;
                border-radius: ${radius};
                overflow-wrap: anywhere;
                padding: calc(10px * ${spacingScale})
                         calc(12px * ${spacingScale});
            }

            #messages .message-text,
            .messages .message-text {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                color: inherit;
            }

            #messages .message.other .message-content,
            #messages .message.received .message-content,
            .messages .message.other .message-content,
            .messages .message.received .message-content {
                background: ${colors.sidebar} !important;
                color: ${colors.text} !important;
                border: 1px solid ${colors.border};
            }

            #messages .message.own .message-content,
            #messages .message.sent .message-content,
            .messages .message.own .message-content,
            .messages .message.sent .message-content {
                background: ${colors.accent} !important;
                color: ${ownText} !important;
                border: 1px solid ${colors.accent};
            }

            .message-sender {
                color: ${colors.text};
                font-family: ${fontFamily};
            }

            .message-time {
                display: block;
                margin-top: 8px;
                color: inherit;
                font-size: 11px;
                opacity: 0.75;
            }

            #messageInput,
            .message-input,
            textarea {
                color: ${colors.text};
                border-color: ${colors.border};
                font-family: ${fontFamily};
            }

            #messageInput,
            .message-input {
                background-color: ${colors.panel};
            }

            #messageInput::placeholder,
            .message-input::placeholder,
            textarea::placeholder {
                color: ${colors.text};
                opacity: 0.6;
            }

            #messages .message-sender.role-owner,
            .messages .message-sender.role-owner {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 7px;
                color: #ffd166 !important;
                font-weight: 800;
                text-shadow: 0 0 10px rgba(255,209,102,.3);
            }

            #messages .owner-badge,
            .messages .owner-badge {
                display: inline-flex;
                align-items: center;
                padding: 3px 7px;
                border: 1px solid rgba(255,209,102,.55);
                border-radius: 6px;
                background: rgba(255,209,102,.12);
                color: #ffd166;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: .5px;
                text-shadow: none;
            }

            #messages,
            .messages {
                scrollbar-color: ${colors.accent} transparent;
            }

            @media (max-width: 600px) {
                #messages .message-content,
                .messages .message-content {
                    max-width: 88% !important;
                }
            }
        `;

        if (messageInput) {
            messageInput.style.color = colors.text;
            messageInput.style.borderColor = colors.border;
            messageInput.style.fontFamily = fontFamily;
        }
    }

    /* ================= API ================= */

    async function apiRequest(path, options = {}) {
        const headers = { ...(options.headers || {}) };

        if (currentUserID) {
            headers["x-friendchat-user-id"] = currentUserID;
        }

        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        let url = API_BASE + path;
        const separator = path.includes("?") ? "&" : "?";

        if (currentUserID && !/[?&]user=/.test(url)) {
            url += separator + "user=" + encodeURIComponent(currentUserID);
        }

        const response = await fetch(url, {
            method: options.method || "GET",
            headers,
            body: options.body
        });

        const contentType = response.headers.get("content-type") || "";
        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const raw = await response.text();

            try {
                data = JSON.parse(raw);
            } catch (_) {
                data = { ok: response.ok, text: raw };
            }
        }

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                data?.text ||
                `Request failed (${response.status})`
            );
        }

        return data;
    }

    /* ================= SERVER LOADING ================= */

    async function loadServer() {
        if (!currentServerID) {
            throw new Error("Server ID is missing.");
        }

        const data = await apiRequest(
            `/api/servers/${encodeURIComponent(currentServerID)}`
        );

        const server = data?.server || data?.data || data;

        if (!server) {
            throw new Error("Server could not be found.");
        }

        currentServer = server;

        currentServerID = clean(
            server.serverID || server.serverId || server.id || currentServerID
        );

        saveCurrentLocation();
        applyServerAppearance();

        return currentServer;
    }

    function getServerChannels(server) {
        if (!server) return [];

        if (Array.isArray(server.channels)) {
            return server.channels;
        }

        if (server.channels && typeof server.channels === "object") {
            return Object.values(server.channels);
        }

        return [];
    }

    function findChannel(server, channelID) {
        const channels = getServerChannels(server);
        const wanted = clean(channelID);

        return channels.find(channel =>
            clean(channel.channelID || channel.channelId || channel.id) === wanted
        ) || channels.find(channel =>
            normalizeID(channel.channelID || channel.channelId || channel.id) ===
            normalizeID(wanted)
        ) || null;
    }

    async function loadChannel() {
        if (!currentServer) throw new Error("Server is not loaded.");
        if (!currentChannelID) throw new Error("Channel ID is missing.");

        currentChannel = findChannel(currentServer, currentChannelID);

        if (!currentChannel) {
            throw new Error("Channel could not be found.");
        }

        currentChannelID = clean(
            currentChannel.channelID ||
            currentChannel.channelId ||
            currentChannel.id ||
            currentChannelID
        );

        saveCurrentLocation();
        updateChannelHeader();

        return currentChannel;
    }

    /* ================= CHANNEL HEADER ================= */

    function updateChannelHeader() {
        if (!currentChannel) return;

        const type = clean(
            currentChannel.type || currentChannel.channelType || "text"
        ).toLowerCase();

        const name = clean(currentChannel.name) || "Channel";

        if (channelName) channelName.textContent = name;

        if (channelDescription) {
            channelDescription.textContent =
                clean(currentChannel.description) || `Welcome to #${name}`;
        }

        if (serverName) {
            serverName.textContent =
                clean(currentServer?.name) || "FriendChat Server";
        }

        if (channelType) {
            channelType.textContent =
                type === "voice" ? "Voice Channel" : "Text Channel";
        }

        if (channelIcon) {
            channelIcon.textContent = type === "voice" ? "🔊" : "#";
        }

        if (emptyChannelName) {
            emptyChannelName.textContent = name;
        }

        if (messageInput) {
            messageInput.disabled = type === "voice";
            messageInput.placeholder =
                type === "voice" ? "Voice channel" : `Message #${name}`;
        }

        if (sendButton) {
            sendButton.disabled = type === "voice" || isSending;
        }
    }

    /* ================= MESSAGE NORMALIZATION ================= */

    function normalizeMessage(message) {
        if (!message) return null;

        const id =
            message.id ||
            message.messageID ||
            message.messageId ||
            `${message.serverID || currentServerID}-${message.channelID || currentChannelID}-${message.createdAt || message.time || Date.now()}`;

        return {
            id: String(id),

            serverID: clean(
                message.serverID || message.serverId || currentServerID
            ),

            channelID: clean(
                message.channelID || message.channelId || currentChannelID
            ),

            from: clean(
                message.from ||
                message.senderID ||
                message.senderId ||
                message.userID ||
                message.userId
            ),

            senderName: clean(
                message.senderName ||
                message.name ||
                message.fromName ||
                ""
            ),

            text: String(message.text ?? message.message ?? ""),

            createdAt:
                message.createdAt ||
                message.time ||
                message.timestamp ||
                Date.now(),

            edited: Boolean(message.edited),
            reaction: message.reaction || null
        };
    }

    /* ================= LOAD MESSAGES ================= */

    async function loadMessages() {
        if (isLoadingMessages || !currentServerID || !currentChannelID) {
            return;
        }

        isLoadingMessages = true;

        const serverAtStart = currentServerID;
        const channelAtStart = currentChannelID;

        const path =
            `/api/servers/${encodeURIComponent(currentServerID)}/messages` +
            `?channel=${encodeURIComponent(currentChannelID)}`;

        try {
            const data = await apiRequest(path);

            if (
                serverAtStart !== currentServerID ||
                channelAtStart !== currentChannelID
            ) {
                return;
            }

            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.messages)
                    ? data.messages
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];

            messages = list
                .map(normalizeMessage)
                .filter(Boolean)
                .filter(message =>
                    normalizeID(message.serverID) === normalizeID(currentServerID) &&
                    clean(message.channelID) === clean(currentChannelID)
                );

            sortMessages();
            renderMessages();
        } catch (error) {
            console.error("FriendChat: Could not load messages:", error);
            showToast(error.message || "Could not load messages.");
        } finally {
            isLoadingMessages = false;
        }
    }

    function getMessageTime(message) {
        const time = new Date(message.createdAt || message.time || 0).getTime();
        return Number.isFinite(time) ? time : 0;
    }

    function sortMessages() {
        messages.sort((a, b) => getMessageTime(a) - getMessageTime(b));
    }

    function formatTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    /* ================= OWNER DETECTION ================= */

    function getServerOwnerID() {
        if (!currentServer) return "";

        return normalizeID(
            currentServer.ownerID ||
            currentServer.ownerId ||
            currentServer.ownerUserID ||
            currentServer.ownerUserId ||
            currentServer.createdBy ||
            currentServer.creatorID ||
            currentServer.creatorId ||
            currentServer.userID ||
            currentServer.userId ||
            ""
        );
    }

    /* ================= RENDER MESSAGES ================= */

    function renderMessages() {
        if (!messagesBox) return;

        messagesBox.innerHTML = "";

        if (!messages.length) {
            if (emptyState) emptyState.style.display = "";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        const fragment = document.createDocumentFragment();
        const ownerID = getServerOwnerID();

        messages.forEach(message => {
            const wrapper = document.createElement("div");
            wrapper.className = "message";

            const senderID = normalizeID(message.from);
            const isOwn = senderID === normalizeID(currentUserID);
            const isOwner = Boolean(ownerID && senderID === ownerID);

            wrapper.classList.add(
                isOwn ? "own" : "other",
                isOwn ? "sent" : "received"
            );

            if (isOwner) wrapper.classList.add("owner-message");

            wrapper.dataset.messageId = message.id;

            const sender = document.createElement("div");
            sender.className = "message-sender";

            sender.textContent =
                (isOwn && currentUserName) ||
                message.senderName ||
                "FriendChat User";

            if (isOwner) {
                sender.classList.add("role-owner");

                const badge = document.createElement("span");
                badge.className = "owner-badge";
                badge.textContent = "♛ OWNER";
                badge.setAttribute("aria-label", "Server owner");

                sender.appendChild(badge);
            }

            const content = document.createElement("div");
            content.className = "message-content";

            // Prevent a short message from stretching to full width.
            content.style.width = "fit-content";
            content.style.maxWidth = "min(75%, 700px)";
            content.style.minWidth = "0";
            content.style.boxSizing = "border-box";
            content.style.flex = "0 1 auto";

            const text = document.createElement("div");
            text.className = "message-text";
            text.textContent = message.text || "";

            const time = document.createElement("span");
            time.className = "message-time";
            time.textContent = formatTime(message.createdAt);

            content.appendChild(text);
            content.appendChild(time);

            wrapper.appendChild(sender);
            wrapper.appendChild(content);

            if (message.reaction) {
                const reaction = document.createElement("div");
                reaction.className = "message-reaction";
                reaction.textContent = message.reaction;
                wrapper.appendChild(reaction);
            }

            fragment.appendChild(wrapper);
        });

        messagesBox.appendChild(fragment);
        scrollMessagesToBottom();
    }

    function scrollMessagesToBottom() {
        if (!messagesBox) return;

        requestAnimationFrame(() => {
            messagesBox.scrollTop = messagesBox.scrollHeight;
        });
    }

    /* ================= SEND MESSAGE ================= */

    async function sendMessage() {
        if (isSending) return;

        if (!currentServerID) return showToast("Server is missing.");
        if (!currentChannelID) return showToast("Channel is missing.");
        if (!currentChannel) return showToast("Channel is not loaded.");

        const type = clean(
            currentChannel.type || currentChannel.channelType || "text"
        ).toLowerCase();

        if (type === "voice") {
            return showToast("Voice channels cannot receive text messages.");
        }

        const text = clean(messageInput?.value);

        if (!text) return;
        if (text.length > 5000) return showToast("Message is too long.");
        if (!currentUserID) return showToast("You are not logged in.");

        isSending = true;
        if (sendButton) sendButton.disabled = true;

        try {
            const body = {
                requesterID: currentUserID,
                userID: currentUserID,
                senderID: currentUserID,
                serverID: currentServerID,
                channelID: currentChannelID,
                text
            };

            const data = await apiRequest(
                `/api/servers/${encodeURIComponent(currentServerID)}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify(body)
                }
            );

            const result = data?.message || data?.data || data;

            if (result) {
                const message = normalizeMessage(result);

                if (message) addOrUpdateMessage(message);
            }

            if (messageInput) messageInput.value = "";

            updateCharacterCount();
            scrollMessagesToBottom();
        } catch (error) {
            console.error("FriendChat: Send message failed:", error);
            showToast(error.message || "Could not send message.");
        } finally {
            isSending = false;

            if (sendButton && clean(
                currentChannel?.type || currentChannel?.channelType || "text"
            ).toLowerCase() !== "voice") {
                sendButton.disabled = false;
            }

            if (messageInput) messageInput.focus();
        }
    }

    function addOrUpdateMessage(message) {
        if (!message) return;

        if (normalizeID(message.serverID) !== normalizeID(currentServerID)) {
            return;
        }

        if (clean(message.channelID) !== clean(currentChannelID)) {
            return;
        }

        const index = messages.findIndex(
            item => String(item.id) === String(message.id)
        );

        if (index >= 0) {
            messages[index] = { ...messages[index], ...message };
        } else {
            messages.push(message);
        }

        sortMessages();
        renderMessages();
    }

    /* ================= DELETE MESSAGE ================= */

    async function deleteMessage(messageID) {
        if (!messageID) return;

        try {
            await apiRequest(
                `/api/servers/${encodeURIComponent(currentServerID)}/messages/${encodeURIComponent(messageID)}`,
                {
                    method: "DELETE",
                    body: JSON.stringify({
                        requesterID: currentUserID,
                        userID: currentUserID,
                        senderID: currentUserID
                    })
                }
            );

            removeMessage(messageID);
        } catch (error) {
            console.error("FriendChat: Delete failed:", error);
            showToast(error.message || "Could not delete message.");
        }
    }

    function removeMessage(messageID) {
        messages = messages.filter(
            message => String(message.id) !== String(messageID)
        );

        renderMessages();
    }

    /* ================= WEBSOCKET ================= */

    function getWebSocketURL() {
        const protocol = location.protocol === "https:" ? "wss:" : "ws:";
        return `${protocol}//${location.host}`;
    }

    function connectWebSocket() {
        if (!currentUserID) return;

        if (
            socket &&
            (
                socket.readyState === WebSocket.OPEN ||
                socket.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        try {
            socket = new WebSocket(getWebSocketURL());
        } catch (error) {
            console.error("FriendChat WebSocket error:", error);
            scheduleWebSocketReconnect();
            return;
        }

        socket.addEventListener("open", () => {
            clearTimeout(reconnectTimer);

            sendSocket({
                type: "register",
                userId: currentUserID,
                userID: currentUserID,
                name: currentUserName
            });

            sendSocket({
                type: "server_open",
                serverID: currentServerID
            });
        });

        socket.addEventListener("message", event => {
            handleSocketMessage(event.data);
        });

        socket.addEventListener("close", scheduleWebSocketReconnect);

        socket.addEventListener("error", error => {
            console.warn("FriendChat WebSocket error:", error);
        });
    }

    function scheduleWebSocketReconnect() {
        clearTimeout(reconnectTimer);

        reconnectTimer = setTimeout(() => {
            connectWebSocket();
        }, 3000);
    }

    function sendSocket(payload) {
        if (!socket || socket.readyState !== WebSocket.OPEN) return false;

        try {
            socket.send(JSON.stringify(payload));
            return true;
        } catch (error) {
            console.error("FriendChat WebSocket send failed:", error);
            return false;
        }
    }

    function handleSocketMessage(rawData) {
        let data;

        try {
            data = typeof rawData === "string"
                ? JSON.parse(rawData)
                : rawData;
        } catch (_) {
            console.warn("FriendChat: Invalid WebSocket data.");
            return;
        }

        if (!data) return;

        const type = clean(data.type).toLowerCase();

        if ([
            "server_message",
            "server_chat",
            "channel_message"
        ].includes(type)) {
            const message = normalizeMessage(
                data.message || data.data || data
            );

            if (message) addOrUpdateMessage(message);
            return;
        }

        if ([
            "server_message_deleted",
            "server_message_delete"
        ].includes(type)) {
            const id =
                data.messageID ||
                data.messageId ||
                data.id ||
                data.message?.id;

            if (id) removeMessage(id);
            return;
        }

        if (["server_updated", "server_update"].includes(type)) {
            const incoming = data.server || data.data;

            if (!incoming || typeof incoming !== "object") return;

            const incomingID = clean(
                incoming.serverID || incoming.serverId || incoming.id
            );

            if (
                incomingID &&
                normalizeID(incomingID) !== normalizeID(currentServerID)
            ) {
                return;
            }

            const previous = currentServer || {};

            currentServer = {
                ...previous,
                ...incoming,
                settings: {
                    ...(previous.settings || {}),
                    ...(incoming.settings || {})
                },
                channels: incoming.channels !== undefined
                    ? incoming.channels
                    : previous.channels
            };

            currentServerID = clean(
                currentServer.serverID ||
                currentServer.serverId ||
                currentServer.id ||
                currentServerID
            );

            currentChannel = findChannel(currentServer, currentChannelID);

            applyServerAppearance();
            updateChannelHeader();
            renderMessages();
            return;
        }

        if ([
            "server_removed",
            "server_deleted",
            "server_delete"
        ].includes(type)) {
            const id = clean(
                data.serverID ||
                data.serverId ||
                data.id ||
                data.server?.serverID
            );

            if (normalizeID(id) === normalizeID(currentServerID)) {
                showToast("This server is no longer available.");
                setTimeout(goToServer, 1200);
            }
        }
    }

    /* ================= POLLING FALLBACK ================= */

    function startMessagePolling() {
        clearInterval(messagePollTimer);

        messagePollTimer = setInterval(async () => {
            if (!currentServerID || !currentChannelID) return;

            if (socket && socket.readyState === WebSocket.OPEN) return;

            await loadMessages();
        }, 5000);
    }

    /* ================= CHARACTER COUNT ================= */

    function updateCharacterCount() {
        if (!characterCount) return;

        const length = messageInput?.value?.length || 0;
        characterCount.textContent = `${length}/5000`;
    }

    /* ================= EMOJI PICKER ================= */

    function setupEmojiButton() {
        if (!emojiButton) return;

        emojiButton.addEventListener("click", event => {
            event.preventDefault();

            const existing = document.querySelector(".emoji-picker");

            if (existing) {
                existing.remove();
                return;
            }

            const emojis = [
                "😀", "😂", "😍", "😎", "😮",
                "😢", "😡", "👍", "❤️", "🔥"
            ];

            const picker = document.createElement("div");
            picker.className = "emoji-picker";

            Object.assign(picker.style, {
                position: "fixed",
                bottom: "80px",
                right: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                maxWidth: "240px",
                padding: "10px",
                background: "var(--fc-panel, #111824)",
                color: "var(--fc-text, #f4f5ff)",
                border: "1px solid var(--fc-border, #252d3a)",
                borderRadius: "var(--fc-radius, 12px)",
                zIndex: "9999"
            });

            emojis.forEach(emoji => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = emoji;

                Object.assign(button.style, {
                    border: "0",
                    background: "transparent",
                    color: "inherit",
                    fontSize: "22px",
                    cursor: "pointer"
                });

                button.addEventListener("click", () => {
                    insertEmoji(emoji);
                    picker.remove();
                });

                picker.appendChild(button);
            });

            document.body.appendChild(picker);

            setTimeout(() => {
                const closePicker = event => {
                    if (
                        !picker.contains(event.target) &&
                        event.target !== emojiButton
                    ) {
                        picker.remove();
                        document.removeEventListener("click", closePicker);
                    }
                };

                document.addEventListener("click", closePicker);
            }, 0);
        });
    }

    function insertEmoji(emoji) {
        if (!messageInput) return;

        const start = messageInput.selectionStart ?? messageInput.value.length;
        const end = messageInput.selectionEnd ?? messageInput.value.length;
        const value = messageInput.value;

        messageInput.value =
            value.slice(0, start) + emoji + value.slice(end);

        messageInput.focus();

        const cursor = start + emoji.length;
        messageInput.setSelectionRange(cursor, cursor);

        updateCharacterCount();
    }

    /* ================= ATTACHMENT BUTTON ================= */

    function setupAttachmentButton() {
        if (!attachButton) return;

        attachButton.addEventListener("click", event => {
            event.preventDefault();

            const existing = document.querySelector('input[type="file"]');

            if (existing) {
                existing.click();
                return;
            }

            showToast("Attachments are coming soon.");
        });
    }

    /* ================= NAVIGATION ================= */

    function goToServer() {
        if (!currentServerID) {
            location.href = "index.html";
            return;
        }

        try {
            localStorage.setItem(CURRENT_SERVER_KEY, currentServerID);
        } catch (_) {}

        location.href =
            `server-home.html?server=${encodeURIComponent(currentServerID)}`;
    }

    function setupNavigation() {
        if (backButton) {
            backButton.addEventListener("click", goToServer);
        }

        if (serverButton) {
            serverButton.addEventListener("click", goToServer);
        }
    }

    /* ================= INPUT EVENTS ================= */

    function setupInput() {
        if (!messageInput) return;

        messageInput.addEventListener("input", updateCharacterCount);

        messageInput.addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    function setupSendButton() {
        if (!sendButton) return;

        sendButton.addEventListener("click", event => {
            event.preventDefault();
            sendMessage();
        });
    }

    /* ================= MESSAGE ACTIONS ================= */

    function setupMessageActions() {
        if (!messagesBox) return;

        messagesBox.addEventListener("contextmenu", event => {
            const element = event.target.closest(".message");
            if (!element) return;

            event.preventDefault();

            const id = element.dataset.messageId;

            const message = messages.find(
                item => String(item.id) === String(id)
            );

            if (!message) return;

            if (normalizeID(message.from) !== normalizeID(currentUserID)) {
                showToast("You can only delete your own messages.");
                return;
            }

            if (window.confirm("Delete this message?")) {
                deleteMessage(id);
            }
        });
    }

    /* ================= INITIALIZATION ================= */

    async function initialize() {
        console.log("FriendChat channel chat starting...");

        const user = getUserFromStorage();

        currentUserID = normalizeID(user.id);
        currentUserName = user.name;

        const params = getURLParams();

        currentServerID =
            clean(params.serverID) ||
            getStorageValue([CURRENT_SERVER_KEY]);

        currentChannelID =
            clean(params.channelID) ||
            getStorageValue([CURRENT_CHANNEL_KEY]);

        saveCurrentLocation();

        if (!currentUserID) {
            console.error("FriendChat: User ID missing.");
            showToast("Please log in again.");
            return;
        }

        if (!currentServerID) {
            console.error("FriendChat: Server ID missing.");
            showToast("Server ID is missing.");
            return;
        }

        if (!currentChannelID) {
            console.error("FriendChat: Channel ID missing.");
            showToast("Channel ID is missing.");
            return;
        }

        try {
            await loadServer();
            await loadChannel();
            await loadMessages();

            connectWebSocket();
            startMessagePolling();

            console.log("FriendChat channel ready:", {
                userID: currentUserID,
                serverID: currentServerID,
                channelID: currentChannelID,
                ownerID: getServerOwnerID()
            });
        } catch (error) {
            console.error("FriendChat channel initialization failed:", error);
            showToast(error.message || "Could not load this channel.", 5000);
        }
    }

    /* ================= CLEANUP ================= */

    window.addEventListener("beforeunload", () => {
        clearTimeout(reconnectTimer);
        clearInterval(messagePollTimer);

        if (socket) {
            try {
                socket.close();
            } catch (_) {}
        }
    });

    /* ================= START ================= */

    setupNavigation();
    setupInput();
    setupSendButton();
    setupEmojiButton();
    setupAttachmentButton();
    setupMessageActions();
    updateCharacterCount();

    initialize();
})();
