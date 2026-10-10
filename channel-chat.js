
/* =========================================================
   FRIENDCHAT - CHANNEL CHAT
   BACKEND CONNECTED + SERVER APPEARANCE FIX
   ========================================================= */

(() => {
    "use strict";

    /* =========================================================
       CONFIG
       ========================================================= */

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

    /* =========================================================
       DOM
       ========================================================= */

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

    /* =========================================================
       BASIC HELPERS
       ========================================================= */

    function clean(value) {
        return String(value ?? "").trim();
    }

    function normalizeID(value) {
        return clean(value).toUpperCase();
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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

        const possibleObjects = [
            "friendchat_user",
            "currentUser",
            "user",
            "friendchat_current_user"
        ];

        for (const key of possibleObjects) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;

                const parsed = JSON.parse(raw);

                if (parsed && typeof parsed === "object") {
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
                }
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

    /* =========================================================
       IMAGE URL VALIDATION
       Supports uploaded data URLs and HTTP/HTTPS URLs.
       ========================================================= */

    function safeImageURL(value) {
        const text = clean(value);

        if (!text) return "";

        // Support common uploaded image formats stored as data URLs.
        if (
            /^data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(text)
        ) {
            return text;
        }

        // Support normal absolute URLs and relative server paths.
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

    /* =========================================================
       APPEARANCE HELPERS
       ========================================================= */

    function getFontScale(settings) {
        const value = settings.fontScale;

        if (value === "small") return 0.92;
        if (value === "large") return 1.08;

        return 1;
    }

    function getSpacingScale(settings) {
        const value = settings.spacing;

        if (value === "compact") return 0.78;
        if (value === "relaxed") return 1.2;

        return 1;
    }

    function getCornerRadius(settings) {
        if (settings.corners === "square") return "3px";
        if (settings.corners === "soft") return "18px";

        return "12px";
    }

    function getFontFamily(settings) {
        const fonts = {
            system:
                "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

            rounded:
                "'Trebuchet MS', 'Segoe UI', sans-serif",

            mono:
                "ui-monospace, SFMono-Regular, Consolas, monospace",

            serif:
                "Georgia, 'Times New Roman', serif"
        };

        return fonts[settings.fontFamily] || fonts.system;
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

    /*
     * Customization versions may use different names for the
     * same background image setting. Check the known aliases.
     */
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
            const image = safeImageURL(settings?.[key]);

            if (image) return image;
        }

        return "";
    }

    /* =========================================================
       SERVER APPEARANCE
       ========================================================= */

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
        const fontScale = getFontScale(settings);
        const spacingScale = getSpacingScale(settings);
        const radius = getCornerRadius(settings);
        const ownMessageText = getReadableTextColor(colors.accent);

        const shadowOpacity =
            settings.shadow === "none"
                ? "0"
                : settings.shadow === "strong"
                    ? "0.42"
                    : "0.20";

        const backgroundURL = getBackgroundImageSetting(settings);

        const overlayColor = isLight
            ? "rgba(243,245,251,0.18)"
            : "rgba(7,10,16,0.18)";

        const overlayEnd = isLight
            ? "rgba(243,245,251,0.30)"
            : "rgba(7,10,16,0.32)";

        /*
         * Shared CSS variables.
         */
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
            "--fc-chat-own-text": ownMessageText,
            "--fc-chat-other-message": colors.sidebar,
            "--fc-chat-other-text": colors.text,
            "--fc-chat-text": colors.text,
            "--fc-chat-border": colors.border
        };

        const root = document.documentElement;

        Object.entries(variables).forEach(([name, value]) => {
            root.style.setProperty(name, value);
        });

        /*
         * Apply background image to the page.
         * CSS backgrounds on inner containers are handled below.
         */
        document.body.style.backgroundColor = colors.background;
        document.body.style.backgroundImage = backgroundURL
            ? `linear-gradient(${overlayColor}, ${overlayEnd}), url("${backgroundURL}")`
            : "none";

        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center center";
        document.body.style.backgroundRepeat = "no-repeat";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.color = colors.text;
        document.body.style.fontFamily = fontFamily;
        document.body.style.fontSize = `${fontScale}rem`;
        document.body.style.minHeight = "100vh";

        document.documentElement.style.backgroundColor = colors.background;

        document.body.dataset.serverTheme = isLight ? "light" : "dark";
        document.body.dataset.serverCorners = settings.corners || "rounded";
        document.body.dataset.serverSpacing = settings.spacing || "normal";

        /*
         * Use one stylesheet so repeated WebSocket updates do not
         * create duplicate style elements.
         */
        let style = document.getElementById("fc-chat-server-appearance");

        if (!style) {
            style = document.createElement("style");
            style.id = "fc-chat-server-appearance";
            document.head.appendChild(style);
        }

        /*
         * URL is validated by safeImageURL().
         * Escape CSS-string characters before inserting the URL.
         */
        const cssSafeURL = backgroundURL
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/[\n\r\f]/g, "");

        const cssBackgroundImage = backgroundURL
            ? `linear-gradient(${overlayColor}, ${overlayEnd}), url("${cssSafeURL}")`
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
                --fc-chat-own-text: ${ownMessageText};
                --fc-chat-other-message: ${colors.sidebar};
                --fc-chat-other-text: ${colors.text};
                --fc-chat-text: ${colors.text};
                --fc-chat-border: ${colors.border};
            }

            html {
                min-height: 100%;
                background-color: ${colors.background} !important;
            }

            body {
                min-height: 100vh !important;
                color: ${colors.text} !important;
                font-family: ${fontFamily} !important;
                font-size: ${fontScale}rem !important;
                background-color: ${colors.background} !important;
                background-image: ${cssBackgroundImage} !important;
                background-size: cover !important;
                background-position: center center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
            }

            /*
             * IMPORTANT:
             * These are the actual channel-chat layout selectors.
             * Keep them transparent so the body wallpaper is visible.
             */
            .channel-app,
            .channel-main,
            #messages,
            .messages {
                background-color: transparent !important;
                background-image: none !important;
            }

            /*
             * Other possible chat layout containers.
             */
            .chat-layout,
            .chat-shell,
            .chat-container,
            .chat-main,
            .chat-content,
            .chat-area,
            .chat-panel,
            .messages-area,
            .chat-messages-wrapper {
                background-color: transparent !important;
                color: ${colors.text} !important;
                border-color: ${colors.border} !important;
            }

            /*
             * Keep the header and composer readable.
             */
            .channel-topbar,
            .chat-header,
            .channel-header,
            .chat-topbar,
            .composer-area,
            .composer,
            .chat-input-area,
            .message-composer,
            .message-input-area {
                color: ${colors.text} !important;
                background-color: ${colors.panel} !important;
                border-color: ${colors.border} !important;
            }

            /*
             * The message list must not cover the page image.
             */
            #messages,
            .messages,
            .message-list,
            #messageList,
            .chat-messages {
                background-color: transparent !important;
                background-image: none !important;
                color: ${colors.text} !important;
                border-color: ${colors.border} !important;
            }

            .message {
                color: ${colors.text};
                margin-top: calc(8px * ${spacingScale});
                margin-bottom: calc(8px * ${spacingScale});
                border-radius: ${radius};
            }

            /*
             * Received messages.
             */
            .message.other .message-content,
            .message.received .message-content {
                background-color: ${colors.sidebar} !important;
                color: ${colors.text} !important;
                border: 1px solid ${colors.border};
                border-radius: ${radius};
                padding: calc(10px * ${spacingScale})
                         calc(12px * ${spacingScale});
            }

            .message.other .message-text,
            .message.received .message-text {
                color: ${colors.text} !important;
            }

            /*
             * Sent messages.
             */
            .message.own .message-content,
            .message.sent .message-content {
                background-color: ${colors.accent} !important;
                color: ${ownMessageText} !important;
                border: 1px solid ${colors.accent};
                border-radius: ${radius};
                padding: calc(10px * ${spacingScale})
                         calc(12px * ${spacingScale});
            }

            .message.own .message-text,
            .message.sent .message-text {
                color: ${ownMessageText} !important;
            }

            .message-sender {
                color: ${colors.text} !important;
                font-family: ${fontFamily} !important;
            }

            .message-time {
                color: ${colors.text} !important;
                opacity: 0.72;
            }

            .message.own .message-time,
            .message.sent .message-time {
                color: ${ownMessageText} !important;
                opacity: 0.82;
            }

            .message-reaction {
                color: ${colors.text} !important;
            }

            /*
             * Inputs.
             */
            #messageInput,
            .message-input,
            textarea,
            input[type="text"] {
                font-family: ${fontFamily} !important;
                color: ${colors.text} !important;
                border-color: ${colors.border} !important;
            }

            #messageInput,
            .message-input {
                background-color: ${colors.panel} !important;
            }

            #messageInput::placeholder,
            .message-input::placeholder,
            textarea::placeholder {
                color: ${colors.text} !important;
                opacity: 0.60;
            }

            #sendButton,
            .send-button {
                border-color: ${colors.accent} !important;
            }

            button:focus-visible,
            input:focus-visible,
            textarea:focus-visible,
            select:focus-visible {
                outline-color: ${colors.accent} !important;
            }

            a,
            .accent,
            .channel-active,
            .active-channel {
                --fc-accent: ${colors.accent};
            }

            .message-content,
            .chat-header,
            .channel-header,
            .channel-topbar,
            .composer-area,
            .composer,
            .chat-input-area,
            .message-composer,
            #messageInput,
            .message-input,
            .emoji-picker {
                border-radius: ${radius};
            }

            .message-content,
            .message-text,
            .message-sender,
            .message-time,
            #messageInput {
                font-family: ${fontFamily} !important;
            }

            #messages,
            .messages,
            .message-list,
            #messageList {
                scrollbar-color: ${colors.accent} transparent;
            }
        `;

        /*
         * Update input styles without replacing event handlers.
         */
        if (messageInput) {
            messageInput.style.color = colors.text;
            messageInput.style.borderColor = colors.border;
            messageInput.style.fontFamily = fontFamily;
        }

        console.log("FriendChat appearance applied:", {
            theme: settings.theme || "dark",
            backgroundImageConfigured: Boolean(backgroundURL),
            backgroundImageURL: backgroundURL || "(none)"
        });
    }

    /* =========================================================
       API
       ========================================================= */

    async function apiRequest(path, options = {}) {
        const method = options.method || "GET";
        const headers = { ...(options.headers || {}) };

        if (currentUserID) {
            headers["x-friendchat-user-id"] = currentUserID;
        }

        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        let requestURL = API_BASE + path;
        const separator = path.includes("?") ? "&" : "?";

        if (
            currentUserID &&
            !/[?&]user=/.test(requestURL)
        ) {
            requestURL += separator +
                "user=" + encodeURIComponent(currentUserID);
        }

        const response = await fetch(requestURL, {
            method,
            headers,
            body: options.body
        });

        let data;
        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const responseText = await response.text();

            try {
                data = JSON.parse(responseText);
            } catch (_) {
                data = {
                    ok: response.ok,
                    text: responseText
                };
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

    /* =========================================================
       SERVER LOADING
       ========================================================= */

    async function loadServer() {
        if (!currentServerID) {
            throw new Error("Server ID is missing.");
        }

        const data = await apiRequest(
            `/api/servers/${encodeURIComponent(currentServerID)}`
        );

        if (!data) {
            throw new Error("Empty server response.");
        }

        const server = data.server || data.data || data;

        if (!server) {
            throw new Error("Server could not be found.");
        }

        currentServer = server;

        currentServerID = clean(
            server.serverID ||
            server.serverId ||
            server.id ||
            currentServerID
        );

        saveCurrentLocation();

        applyServerAppearance();

        return currentServer;
    }

    /* =========================================================
       CHANNEL FINDER
       ========================================================= */

    function getServerChannels(server) {
        if (!server) return [];

        if (Array.isArray(server.channels)) {
            return server.channels;
        }

        if (
            server.channels &&
            typeof server.channels === "object"
        ) {
            return Object.values(server.channels);
        }

        return [];
    }

    function findChannel(server, channelID) {
        const channels = getServerChannels(server);
        const wanted = clean(channelID);

        return (
            channels.find(channel =>
                clean(
                    channel.channelID ||
                    channel.channelId ||
                    channel.id
                ) === wanted
            ) ||
            channels.find(channel =>
                normalizeID(
                    channel.channelID ||
                    channel.channelId ||
                    channel.id
                ) === normalizeID(wanted)
            ) ||
            null
        );
    }

    /* =========================================================
       LOAD CHANNEL
       ========================================================= */

    async function loadChannel() {
        if (!currentServer) {
            throw new Error("Server is not loaded.");
        }

        if (!currentChannelID) {
            throw new Error("Channel ID is missing.");
        }

        currentChannel = findChannel(
            currentServer,
            currentChannelID
        );

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

    /* =========================================================
       CHANNEL HEADER
       ========================================================= */

    function updateChannelHeader() {
        if (!currentChannel) return;

        const type = clean(
            currentChannel.type ||
            currentChannel.channelType ||
            "text"
        ).toLowerCase();

        const name = clean(currentChannel.name) || "Channel";
        const description = clean(currentChannel.description);

        if (channelName) channelName.textContent = name;

        if (channelDescription) {
            channelDescription.textContent =
                description || `Welcome to #${name}`;
        }

        if (serverName) {
            serverName.textContent =
                clean(currentServer?.name) ||
                "FriendChat Server";
        }

        if (channelType) {
            channelType.textContent =
                type === "voice"
                    ? "Voice Channel"
                    : "Text Channel";
        }

        if (channelIcon) {
            channelIcon.textContent =
                type === "voice" ? "🔊" : "#";
        }

        if (emptyChannelName) {
            emptyChannelName.textContent = name;
        }

        if (type === "voice") {
            if (messageInput) {
                messageInput.disabled = true;
                messageInput.placeholder = "Voice channel";
            }

            if (sendButton) sendButton.disabled = true;
        } else {
            if (messageInput) {
                messageInput.disabled = false;
                messageInput.placeholder = `Message #${name}`;
            }

            if (sendButton && !isSending) {
                sendButton.disabled = false;
            }
        }
    }

    /* =========================================================
       MESSAGE NORMALIZATION
       ========================================================= */

    function normalizeMessage(message) {
        if (!message) return null;

        const id =
            message.id ||
            message.messageID ||
            message.messageId ||
            `${message.serverID || currentServerID}-${message.channelID || currentChannelID}-${message.time || message.createdAt || Date.now()}`;

        return {
            id: String(id),

            serverID: clean(
                message.serverID ||
                message.serverId ||
                currentServerID
            ),

            channelID: clean(
                message.channelID ||
                message.channelId ||
                currentChannelID
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
                "FriendChat User"
            ),

            text: String(message.text || message.message || ""),

            createdAt:
                message.createdAt ||
                message.time ||
                message.timestamp ||
                Date.now(),

            edited: Boolean(message.edited),
            reaction: message.reaction || null
        };
    }

    /* =========================================================
       LOAD MESSAGES
       ========================================================= */

    async function loadMessages() {
        if (
            isLoadingMessages ||
            !currentServerID ||
            !currentChannelID
        ) {
            return;
        }

        isLoadingMessages = true;

        const serverIDAtStart = currentServerID;
        const channelIDAtStart = currentChannelID;

        const path =
            `/api/servers/${encodeURIComponent(currentServerID)}/messages` +
            `?channel=${encodeURIComponent(currentChannelID)}`;

        try {
            const data = await apiRequest(path);

            if (
                serverIDAtStart !== currentServerID ||
                channelIDAtStart !== currentChannelID
            ) {
                return;
            }

            let serverMessages = [];

            if (Array.isArray(data)) {
                serverMessages = data;
            } else if (Array.isArray(data.messages)) {
                serverMessages = data.messages;
            } else if (Array.isArray(data.data)) {
                serverMessages = data.data;
            }

            messages = serverMessages
                .map(normalizeMessage)
                .filter(Boolean)
                .filter(message =>
                    normalizeID(message.serverID) ===
                        normalizeID(currentServerID) &&
                    clean(message.channelID) ===
                        clean(currentChannelID)
                );

            sortMessages();
            renderMessages();
        } catch (error) {
            console.error(
                "FriendChat: Could not load messages:",
                error
            );

            showToast(
                error.message || "Could not load messages."
            );
        } finally {
            isLoadingMessages = false;
        }
    }

    /* =========================================================
       MESSAGE SORTING
       ========================================================= */

    function getMessageTime(message) {
        const value = message.createdAt || message.time || 0;
        const time = new Date(value).getTime();

        return Number.isFinite(time) ? time : 0;
    }

    function sortMessages() {
        messages.sort(
            (a, b) => getMessageTime(a) - getMessageTime(b)
        );
    }

    /* =========================================================
       MESSAGE RENDERING
       ========================================================= */

    function formatTime(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function renderMessages() {
        if (!messagesBox) return;

        messagesBox.innerHTML = "";

        if (!messages.length) {
            if (emptyState) emptyState.style.display = "";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        const fragment = document.createDocumentFragment();

        messages.forEach(message => {
            const wrapper = document.createElement("div");
            wrapper.className = "message";

            const isOwnMessage =
                normalizeID(message.from) ===
                normalizeID(currentUserID);

            if (isOwnMessage) {
                wrapper.classList.add("own", "sent");
            } else {
                wrapper.classList.add("other", "received");
            }

            wrapper.dataset.messageId = message.id;

            const sender = document.createElement("div");
            sender.className = "message-sender";
            sender.textContent =
                message.senderName || "FriendChat User";

            const content = document.createElement("div");
            content.className = "message-content";

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

    /* =========================================================
       SEND MESSAGE
       ========================================================= */

    async function sendMessage() {
        if (isSending) return;

        if (!currentServerID) {
            showToast("Server is missing.");
            return;
        }

        if (!currentChannelID) {
            showToast("Channel is missing.");
            return;
        }

        if (!currentChannel) {
            showToast("Channel is not loaded.");
            return;
        }

        const type = clean(
            currentChannel.type ||
            currentChannel.channelType ||
            "text"
        ).toLowerCase();

        if (type === "voice") {
            showToast(
                "Voice channels cannot receive text messages."
            );
            return;
        }

        const text = clean(messageInput?.value);

        if (!text) return;

        if (text.length > 5000) {
            showToast("Message is too long.");
            return;
        }

        if (!currentUserID) {
            showToast("You are not logged in.");
            return;
        }

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

            const serverMessage =
                data?.message || data?.data || data;

            if (serverMessage) {
                addOrUpdateMessage(
                    normalizeMessage(serverMessage)
                );
            }

            if (messageInput) messageInput.value = "";

            updateCharacterCount();
            scrollMessagesToBottom();
        } catch (error) {
            console.error(
                "FriendChat: Send message failed:",
                error
            );

            showToast(
                error.message || "Could not send message."
            );
        } finally {
            isSending = false;

            if (
                sendButton &&
                clean(
                    currentChannel?.type ||
                    currentChannel?.channelType ||
                    "text"
                ).toLowerCase() !== "voice"
            ) {
                sendButton.disabled = false;
            }

            if (messageInput) messageInput.focus();
        }
    }

    /* =========================================================
       ADD / UPDATE MESSAGE
       ========================================================= */

    function addOrUpdateMessage(message) {
        if (!message) return;

        if (
            normalizeID(message.serverID) !==
            normalizeID(currentServerID)
        ) {
            return;
        }

        if (clean(message.channelID) !== clean(currentChannelID)) {
            return;
        }

        const index = messages.findIndex(
            item => String(item.id) === String(message.id)
        );

        if (index >= 0) {
            messages[index] = {
                ...messages[index],
                ...message
            };
        } else {
            messages.push(message);
        }

        sortMessages();
        renderMessages();
    }

    /* =========================================================
       DELETE MESSAGE
       ========================================================= */

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
            console.error(
                "FriendChat: Delete message failed:",
                error
            );

            showToast(
                error.message || "Could not delete message."
            );
        }
    }

    function removeMessage(messageID) {
        const wanted = String(messageID);

        messages = messages.filter(
            message => String(message.id) !== wanted
        );

        renderMessages();
    }

    /* =========================================================
       WEBSOCKET
       ========================================================= */

    function getWebSocketURL() {
        const protocol =
            location.protocol === "https:" ? "wss:" : "ws:";

        return `${protocol}//${location.host}`;
    }

    function connectWebSocket() {
        if (!currentUserID) {
            console.warn(
                "FriendChat: Cannot connect WebSocket without user ID."
            );
            return;
        }

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
            console.log("FriendChat WebSocket connected.");
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

        socket.addEventListener("close", () => {
            console.warn("FriendChat WebSocket disconnected.");
            scheduleWebSocketReconnect();
        });

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
        if (
            !socket ||
            socket.readyState !== WebSocket.OPEN
        ) {
            return false;
        }

        try {
            socket.send(JSON.stringify(payload));
            return true;
        } catch (error) {
            console.error(
                "FriendChat: WebSocket send failed:",
                error
            );
            return false;
        }
    }

    /* =========================================================
       WEBSOCKET MESSAGE HANDLER
       ========================================================= */

    function handleSocketMessage(rawData) {
        let data;

        try {
            data = typeof rawData === "string"
                ? JSON.parse(rawData)
                : rawData;
        } catch (error) {
            console.warn(
                "FriendChat: Invalid WebSocket data:",
                rawData
            );
            return;
        }

        if (!data) return;

        const type = clean(data.type).toLowerCase();

        if (
            type === "server_message" ||
            type === "server_chat" ||
            type === "channel_message"
        ) {
            const rawMessage =
                data.message || data.data || data;

            const message = normalizeMessage(rawMessage);

            if (message) addOrUpdateMessage(message);
            return;
        }

        if (
            type === "server_message_deleted" ||
            type === "server_message_delete"
        ) {
            const messageID =
                data.messageID ||
                data.messageId ||
                data.id ||
                data.message?.id;

            if (messageID) removeMessage(messageID);
            return;
        }

        if (
            type === "server_updated" ||
            type === "server_update"
        ) {
            const incomingServer = data.server || data.data;

            if (
                !incomingServer ||
                typeof incomingServer !== "object"
            ) {
                return;
            }

            const incomingID = clean(
                incomingServer.serverID ||
                incomingServer.serverId ||
                incomingServer.id
            );

            if (
                incomingID &&
                normalizeID(incomingID) !==
                normalizeID(currentServerID)
            ) {
                return;
            }

            /*
             * Merge settings and preserve existing channels
             * when the incoming WebSocket update is partial.
             */
            const previousServer = currentServer || {};

            currentServer = {
                ...previousServer,
                ...incomingServer,

                settings: {
                    ...(previousServer.settings || {}),
                    ...(incomingServer.settings || {})
                },

                channels:
                    incomingServer.channels !== undefined
                        ? incomingServer.channels
                        : previousServer.channels
            };

            currentServerID = clean(
                currentServer.serverID ||
                currentServer.serverId ||
                currentServer.id ||
                currentServerID
            );

            currentChannel = findChannel(
                currentServer,
                currentChannelID
            );

            applyServerAppearance();
            updateChannelHeader();

            return;
        }

        if (
            type === "server_removed" ||
            type === "server_deleted" ||
            type === "server_delete"
        ) {
            const serverID = clean(
                data.serverID ||
                data.serverId ||
                data.id ||
                data.server?.serverID
            );

            if (
                normalizeID(serverID) ===
                normalizeID(currentServerID)
            ) {
                showToast(
                    "This server is no longer available."
                );

                setTimeout(goToServer, 1200);
            }
        }
    }

    /* =========================================================
       POLLING FALLBACK
       ========================================================= */

    function startMessagePolling() {
        clearInterval(messagePollTimer);

        messagePollTimer = setInterval(async () => {
            if (!currentServerID || !currentChannelID) return;

            if (
                socket &&
                socket.readyState === WebSocket.OPEN
            ) {
                return;
            }

            await loadMessages();
        }, 5000);
    }

    /* =========================================================
       CHARACTER COUNT
       ========================================================= */

    function updateCharacterCount() {
        if (!characterCount) return;

        const length = messageInput?.value?.length || 0;
        characterCount.textContent = `${length}/5000`;
    }

    /* =========================================================
       EMOJI BUTTON
       ========================================================= */

    function setupEmojiButton() {
        if (!emojiButton) return;

        emojiButton.addEventListener("click", event => {
            event.preventDefault();

            const existingPicker =
                document.querySelector(".emoji-picker");

            if (existingPicker) {
                existingPicker.remove();
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
                        document.removeEventListener(
                            "click",
                            closePicker
                        );
                    }
                };

                document.addEventListener("click", closePicker);
            }, 0);
        });
    }

    function insertEmoji(emoji) {
        if (!messageInput) return;

        const start =
            messageInput.selectionStart ??
            messageInput.value.length;

        const end =
            messageInput.selectionEnd ??
            messageInput.value.length;

        const value = messageInput.value;

        messageInput.value =
            value.slice(0, start) +
            emoji +
            value.slice(end);

        messageInput.focus();

        const cursor = start + emoji.length;

        messageInput.setSelectionRange(cursor, cursor);
        updateCharacterCount();
    }

    /* =========================================================
       ATTACHMENT BUTTON
       ========================================================= */

    function setupAttachmentButton() {
        if (!attachButton) return;

        attachButton.addEventListener("click", event => {
            event.preventDefault();

            const existing = document.querySelector(
                'input[type="file"]'
            );

            if (existing) {
                existing.click();
                return;
            }

            showToast("Attachments are coming soon.");
        });
    }

    /* =========================================================
       NAVIGATION
       ========================================================= */

    function goToServer() {
        if (!currentServerID) {
            location.href = "index.html";
            return;
        }

        try {
            localStorage.setItem(
                CURRENT_SERVER_KEY,
                currentServerID
            );
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

    /* =========================================================
       INPUT EVENTS
       ========================================================= */

    function setupInput() {
        if (!messageInput) return;

        messageInput.addEventListener(
            "input",
            updateCharacterCount
        );

        messageInput.addEventListener("keydown", event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
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

    /* =========================================================
       MESSAGE CONTEXT MENU
       ========================================================= */

    function setupMessageActions() {
        if (!messagesBox) return;

        messagesBox.addEventListener("contextmenu", event => {
            const messageElement =
                event.target.closest(".message");

            if (!messageElement) return;

            event.preventDefault();

            const messageID =
                messageElement.dataset.messageId;

            const message = messages.find(
                item => String(item.id) === String(messageID)
            );

            if (!message) return;

            if (
                normalizeID(message.from) !==
                normalizeID(currentUserID)
            ) {
                showToast("You can only delete your own messages.");
                return;
            }

            if (window.confirm("Delete this message?")) {
                deleteMessage(messageID);
            }
        });
    }

    /* =========================================================
       INITIALIZATION
       ========================================================= */

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
                channelID: currentChannelID
            });
        } catch (error) {
            console.error(
                "FriendChat channel initialization failed:",
                error
            );

            showToast(
                error.message || "Could not load this channel.",
                5000
            );
        }
    }

    /* =========================================================
       CLEANUP
       ========================================================= */

    window.addEventListener("beforeunload", () => {
        clearTimeout(reconnectTimer);
        clearInterval(messagePollTimer);

        if (socket) {
            try {
                socket.close();
            } catch (_) {}
        }
    });

    /* =========================================================
       START
       ========================================================= */

    setupNavigation();
    setupInput();
    setupSendButton();
    setupEmojiButton();
    setupAttachmentButton();
    setupMessageActions();
    updateCharacterCount();

    initialize();

})();
