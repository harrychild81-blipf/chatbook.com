/* =========================================================
   FRIENDCHAT - CHANNEL CHAT
   BACKEND CONNECTED VERSION
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

    /* =========================================================
       DOM
       ========================================================= */

    const $ = (id) => document.getElementById(id);

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
        return String(value || "").trim();
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
        if (!toast) return;

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

                if (value && clean(value)) {
                    return clean(value);
                }
            } catch (_) {}
        }

        return "";
    }

    function getUserFromStorage() {
        let id = getStorageValue(USER_ID_KEYS);
        let name = getStorageValue(USER_NAME_KEYS);

        /*
         * Some FriendChat versions store the whole user
         * object in localStorage.
         */
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
                    id =
                        id ||
                        clean(
                            parsed.userID ||
                            parsed.userId ||
                            parsed.id ||
                            parsed.uid
                        );

                    name =
                        name ||
                        clean(
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
        const params = new URLSearchParams(window.location.search);

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

    /* =========================================================
       API
       ========================================================= */

    async function apiRequest(path, options = {}) {
        const method = options.method || "GET";

        const headers = {
            ...(options.headers || {})
        };

        /*
         * Backend accepts x-friendchat-user-id.
         */
        if (currentUserID) {
            headers["x-friendchat-user-id"] = currentUserID;
        }

        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        const separator = path.includes("?") ? "&" : "?";

        let requestURL = API_BASE + path;

        /*
         * Send user through query string too.
         * This makes the frontend compatible with the
         * FriendChat server.js implementation.
         */
        if (currentUserID && !/[?&]user=/.test(requestURL)) {
            requestURL +=
                separator +
                "user=" +
                encodeURIComponent(currentUserID);
        }

        const response = await fetch(requestURL, {
            method,
            headers,
            body: options.body
        });

        let data = null;

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            try {
                data = JSON.parse(text);
            } catch (_) {
                data = {
                    ok: response.ok,
                    text
                };
            }
        }

        if (!response.ok) {
            const errorMessage =
                data?.error ||
                data?.message ||
                data?.text ||
                `Request failed (${response.status})`;

            throw new Error(errorMessage);
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

        const server =
            data.server ||
            data.data ||
            data;

        if (!server) {
            throw new Error("Server could not be found.");
        }

        currentServer = server;

        /*
         * Backend may return a normalized ID.
         */
        if (server.serverID) {
            currentServerID = clean(server.serverID);
        } else if (server.id) {
            currentServerID = clean(server.id);
        }

        saveCurrentLocation();

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
            channels.find(
                channel =>
                    clean(
                        channel.channelID ||
                        channel.channelId ||
                        channel.id
                    ) === wanted
            ) ||
            channels.find(
                channel =>
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

        /*
         * Use the actual channel ID returned by the backend.
         */
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

        const name =
            clean(currentChannel.name) ||
            "Channel";

        const description =
            clean(currentChannel.description) ||
            "";

        if (channelName) {
            channelName.textContent = name;
        }

        if (channelDescription) {
            channelDescription.textContent =
                description ||
                `Welcome to #${name}`;
        }

        if (serverName) {
            serverName.textContent =
                clean(
                    currentServer?.name
                ) || "FriendChat Server";
        }

        if (channelType) {
            channelType.textContent =
                type === "voice"
                    ? "Voice Channel"
                    : "Text Channel";
        }

        if (channelIcon) {
            channelIcon.textContent =
                type === "voice"
                    ? "🔊"
                    : "#";
        }

        if (emptyChannelName) {
            emptyChannelName.textContent =
                name;
        }

        /*
         * Voice channels currently do not use the
         * text message box.
         */
        if (type === "voice") {
            if (messageInput) {
                messageInput.disabled = true;
                messageInput.placeholder =
                    "Voice channel";
            }

            if (sendButton) {
                sendButton.disabled = true;
            }
        } else {
            if (messageInput) {
                messageInput.disabled = false;
                messageInput.placeholder =
                    `Message #${name}`;
            }

            if (sendButton) {
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

            serverID:
                clean(
                    message.serverID ||
                    message.serverId ||
                    currentServerID
                ),

            channelID:
                clean(
                    message.channelID ||
                    message.channelId ||
                    currentChannelID
                ),

            from:
                clean(
                    message.from ||
                    message.senderID ||
                    message.senderId ||
                    message.userID ||
                    message.userId
                ),

            senderName:
                clean(
                    message.senderName ||
                    message.name ||
                    message.fromName ||
                    "FriendChat User"
                ),

            text:
                String(
                    message.text ||
                    message.message ||
                    ""
                ),

            createdAt:
                message.createdAt ||
                message.time ||
                message.timestamp ||
                Date.now(),

            edited:
                Boolean(message.edited),

            reaction:
                message.reaction || null
        };
    }

    /* =========================================================
       LOAD MESSAGES FROM BACKEND
       ========================================================= */

    async function loadMessages() {
        if (!currentServerID || !currentChannelID) {
            return;
        }

        const path =
            `/api/servers/${encodeURIComponent(currentServerID)}/messages` +
            `?channel=${encodeURIComponent(currentChannelID)}`;

        try {
            const data = await apiRequest(path);

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
                .filter(message => {
                    return (
                        normalizeID(message.serverID) ===
                            normalizeID(currentServerID) &&
                        clean(message.channelID) ===
                            clean(currentChannelID)
                    );
                });

            sortMessages();

            renderMessages();
        } catch (error) {
            console.error(
                "FriendChat: Could not load messages:",
                error
            );

            /*
             * Don't destroy the page if message loading
             * temporarily fails.
             */
            showToast(
                error.message ||
                "Could not load messages."
            );
        }
    }

    /* =========================================================
       MESSAGE SORTING
       ========================================================= */

    function getMessageTime(message) {
        const value =
            message.createdAt ||
            message.time ||
            0;

        const time = new Date(value).getTime();

        return Number.isFinite(time)
            ? time
            : 0;
    }

    function sortMessages() {
        messages.sort(
            (a, b) =>
                getMessageTime(a) -
                getMessageTime(b)
        );
    }

    /* =========================================================
       MESSAGE RENDERING
       ========================================================= */

    function formatTime(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function renderMessages() {
        if (!messagesBox) return;

        messagesBox.innerHTML = "";

        if (!messages.length) {
            if (emptyState) {
                emptyState.style.display = "";
            }

            return;
        }

        if (emptyState) {
            emptyState.style.display = "none";
        }

        const fragment =
            document.createDocumentFragment();

        messages.forEach(message => {
            const wrapper =
                document.createElement("div");

            wrapper.className = "message";

            /*
             * Add common class names so this works with
             * different FriendChat CSS versions.
             */
            if (
                normalizeID(message.from) ===
                normalizeID(currentUserID)
            ) {
                wrapper.classList.add("own");
                wrapper.classList.add("sent");
            } else {
                wrapper.classList.add("other");
                wrapper.classList.add("received");
            }

            wrapper.dataset.messageId =
                message.id;

            const sender =
                document.createElement("div");

            sender.className = "message-sender";
            sender.textContent =
                message.senderName ||
                "FriendChat User";

            const content =
                document.createElement("div");

            content.className = "message-content";

            const text =
                document.createElement("div");

            text.className = "message-text";

            /*
             * textContent prevents HTML injection.
             */
            text.textContent =
                message.text || "";

            const time =
                document.createElement("span");

            time.className = "message-time";

            time.textContent =
                formatTime(
                    message.createdAt
                );

            content.appendChild(text);
            content.appendChild(time);

            wrapper.appendChild(sender);
            wrapper.appendChild(content);

            /*
             * Optional reaction support.
             */
            if (message.reaction) {
                const reaction =
                    document.createElement("div");

                reaction.className =
                    "message-reaction";

                reaction.textContent =
                    message.reaction;

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
            messagesBox.scrollTop =
                messagesBox.scrollHeight;
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

        const text = clean(
            messageInput?.value
        );

        if (!text) {
            return;
        }

        if (text.length > 5000) {
            showToast(
                "Message is too long."
            );
            return;
        }

        if (!currentUserID) {
            showToast(
                "You are not logged in."
            );
            return;
        }

        isSending = true;

        if (sendButton) {
            sendButton.disabled = true;
        }

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
                data?.message ||
                data?.data ||
                data;

            if (serverMessage) {
                addOrUpdateMessage(
                    normalizeMessage(
                        serverMessage
                    )
                );
            }

            if (messageInput) {
                messageInput.value = "";
            }

            updateCharacterCount();

            scrollMessagesToBottom();
        } catch (error) {
            console.error(
                "FriendChat: Send message failed:",
                error
            );

            showToast(
                error.message ||
                "Could not send message."
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

            if (messageInput) {
                messageInput.focus();
            }
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

        if (
            clean(message.channelID) !==
            clean(currentChannelID)
        ) {
            return;
        }

        const index = messages.findIndex(
            item =>
                String(item.id) ===
                String(message.id)
        );

        if (index >= 0) {
            messages[index] = message;
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
                error.message ||
                "Could not delete message."
            );
        }
    }

    function removeMessage(messageID) {
        const wanted = String(messageID);

        messages = messages.filter(
            message =>
                String(message.id) !== wanted
        );

        renderMessages();
    }

    /* =========================================================
       WEBSOCKET
       ========================================================= */

    function getWebSocketURL() {
        const protocol =
            location.protocol === "https:"
                ? "wss:"
                : "ws:";

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
                socket.readyState ===
                    WebSocket.OPEN ||
                socket.readyState ===
                    WebSocket.CONNECTING
            )
        ) {
            return;
        }

        try {
            socket = new WebSocket(
                getWebSocketURL()
            );
        } catch (error) {
            console.error(
                "FriendChat WebSocket error:",
                error
            );

            scheduleWebSocketReconnect();
            return;
        }

        socket.addEventListener(
            "open",
            () => {
                console.log(
                    "FriendChat WebSocket connected."
                );

                clearTimeout(
                    reconnectTimer
                );

                /*
                 * Register the logged-in user.
                 */
                sendSocket({
                    type: "register",
                    userId: currentUserID,
                    userID: currentUserID,
                    name: currentUserName
                });

                /*
                 * Tell backend which server we are viewing.
                 */
                sendSocket({
                    type: "server_open",
                    serverID: currentServerID
                });
            }
        );

        socket.addEventListener(
            "message",
            event => {
                handleSocketMessage(
                    event.data
                );
            }
        );

        socket.addEventListener(
            "close",
            () => {
                console.warn(
                    "FriendChat WebSocket disconnected."
                );

                scheduleWebSocketReconnect();
            }
        );

        socket.addEventListener(
            "error",
            error => {
                console.warn(
                    "FriendChat WebSocket error:",
                    error
                );
            }
        );
    }

    function scheduleWebSocketReconnect() {
        clearTimeout(
            reconnectTimer
        );

        reconnectTimer = setTimeout(
            () => {
                connectWebSocket();
            },
            3000
        );
    }

    function sendSocket(payload) {
        if (
            !socket ||
            socket.readyState !==
                WebSocket.OPEN
        ) {
            return false;
        }

        try {
            socket.send(
                JSON.stringify(payload)
            );

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
            data =
                typeof rawData === "string"
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

        const type =
            clean(data.type).toLowerCase();

        /*
         * New server message
         */
        if (
            type === "server_message" ||
            type === "server_chat" ||
            type === "channel_message"
        ) {
            const rawMessage =
                data.message ||
                data.data ||
                data;

            const message =
                normalizeMessage(
                    rawMessage
                );

            if (message) {
                addOrUpdateMessage(
                    message
                );
            }

            return;
        }

        /*
         * Deleted server message
         */
        if (
            type ===
                "server_message_deleted" ||
            type ===
                "server_message_delete"
        ) {
            const messageID =
                data.messageID ||
                data.messageId ||
                data.id ||
                data.message?.id;

            if (messageID) {
                removeMessage(
                    messageID
                );
            }

            return;
        }

        /*
         * Server updated
         */
        if (
            type === "server_updated" ||
            type === "server_update"
        ) {
            const server =
                data.server ||
                data.data;

            if (!server) return;

            const incomingID =
                clean(
                    server.serverID ||
                    server.serverId ||
                    server.id
                );

            if (
                normalizeID(incomingID) !==
                normalizeID(currentServerID)
            ) {
                return;
            }

            currentServer = server;

            currentChannel =
                findChannel(
                    currentServer,
                    currentChannelID
                );

            updateChannelHeader();

            return;
        }

        /*
         * Server removed / deleted
         */
        if (
            type === "server_removed" ||
            type === "server_deleted" ||
            type === "server_delete"
        ) {
            const serverID =
                clean(
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

                setTimeout(() => {
                    goToServer();
                }, 1200);
            }

            return;
        }
    }

    /* =========================================================
       POLLING FALLBACK
       ========================================================= */

    function startMessagePolling() {
        clearInterval(
            messagePollTimer
        );

        /*
         * WebSocket is preferred, but polling gives
         * reliable fallback when WebSocket disconnects.
         */
        messagePollTimer = setInterval(
            async () => {
                if (
                    !currentServerID ||
                    !currentChannelID
                ) {
                    return;
                }

                if (
                    socket &&
                    socket.readyState ===
                        WebSocket.OPEN
                ) {
                    return;
                }

                await loadMessages();
            },
            5000
        );
    }

    /* =========================================================
       CHARACTER COUNT
       ========================================================= */

    function updateCharacterCount() {
        if (!characterCount) return;

        const length =
            messageInput?.value?.length || 0;

        characterCount.textContent =
            `${length}/5000`;
    }

    /* =========================================================
       EMOJI BUTTON
       ========================================================= */

    function setupEmojiButton() {
        if (!emojiButton) return;

        emojiButton.addEventListener(
            "click",
            event => {
                event.preventDefault();

                const emojis = [
                    "😀",
                    "😂",
                    "😍",
                    "😎",
                    "😮",
                    "😢",
                    "😡",
                    "👍",
                    "❤️",
                    "🔥"
                ];

                /*
                 * If the existing HTML/CSS already has
                 * an emoji picker, use it.
                 */
                const existingPicker =
                    document.querySelector(
                        ".emoji-picker"
                    );

                if (existingPicker) {
                    existingPicker.classList.toggle(
                        "show"
                    );
                    return;
                }

                /*
                 * Small fallback picker.
                 */
                const picker =
                    document.createElement("div");

                picker.className =
                    "emoji-picker";

                picker.style.position =
                    "absolute";

                picker.style.bottom =
                    "70px";

                picker.style.right =
                    "20px";

                picker.style.display =
                    "flex";

                picker.style.flexWrap =
                    "wrap";

                picker.style.gap =
                    "6px";

                picker.style.padding =
                    "10px";

                picker.style.background =
                    "#111824";

                picker.style.border =
                    "1px solid rgba(255,255,255,.1)";

                picker.style.borderRadius =
                    "12px";

                picker.style.zIndex =
                    "9999";

                emojis.forEach(emoji => {
                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type = "button";
                    button.textContent =
                        emoji;

                    button.style.border =
                        "0";

                    button.style.background =
                        "transparent";

                    button.style.fontSize =
                        "22px";

                    button.style.cursor =
                        "pointer";

                    button.addEventListener(
                        "click",
                        () => {
                            insertEmoji(
                                emoji
                            );

                            picker.remove();
                        }
                    );

                    picker.appendChild(
                        button
                    );
                });

                document.body.appendChild(
                    picker
                );

                /*
                 * Close when clicking outside.
                 */
                setTimeout(() => {
                    const closePicker =
                        event => {
                            if (
                                !picker.contains(
                                    event.target
                                ) &&
                                event.target !==
                                    emojiButton
                            ) {
                                picker.remove();

                                document.removeEventListener(
                                    "click",
                                    closePicker
                                );
                            }
                        };

                    document.addEventListener(
                        "click",
                        closePicker
                    );
                }, 0);
            }
        );
    }

    function insertEmoji(emoji) {
        if (!messageInput) return;

        const start =
            messageInput.selectionStart ??
            messageInput.value.length;

        const end =
            messageInput.selectionEnd ??
            messageInput.value.length;

        const value =
            messageInput.value;

        messageInput.value =
            value.slice(0, start) +
            emoji +
            value.slice(end);

        messageInput.focus();

        const cursor =
            start + emoji.length;

        messageInput.setSelectionRange(
            cursor,
            cursor
        );

        updateCharacterCount();
    }

    /* =========================================================
       ATTACHMENT BUTTON
       ========================================================= */

    function setupAttachmentButton() {
        if (!attachButton) return;

        attachButton.addEventListener(
            "click",
            event => {
                event.preventDefault();

                /*
                 * If an existing file input exists,
                 * use it.
                 */
                const existing =
                    document.querySelector(
                        'input[type="file"]'
                    );

                if (existing) {
                    existing.click();
                    return;
                }

                showToast(
                    "Attachments are coming soon."
                );
            }
        );
    }

    /* =========================================================
       NAVIGATION
       ========================================================= */

    function goToServer() {
        if (!currentServerID) {
            window.location.href =
                "index.html";

            return;
        }

        try {
            localStorage.setItem(
                CURRENT_SERVER_KEY,
                currentServerID
            );
        } catch (_) {}

        window.location.href =
            `server-home.html?server=${encodeURIComponent(
                currentServerID
            )}`;
    }

    function setupNavigation() {
        if (backButton) {
            backButton.addEventListener(
                "click",
                () => {
                    goToServer();
                }
            );
        }

        if (serverButton) {
            serverButton.addEventListener(
                "click",
                () => {
                    goToServer();
                }
            );
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

        messageInput.addEventListener(
            "keydown",
            event => {
                /*
                 * Enter sends.
                 * Shift + Enter creates a new line.
                 */
                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();

                    sendMessage();
                }
            }
        );
    }

    function setupSendButton() {
        if (!sendButton) return;

        sendButton.addEventListener(
            "click",
            event => {
                event.preventDefault();

                sendMessage();
            }
        );
    }

    /* =========================================================
       MESSAGE CONTEXT MENU
       ========================================================= */

    function setupMessageActions() {
        if (!messagesBox) return;

        /*
         * Right-clicking own message gives a simple
         * delete option.
         */
        messagesBox.addEventListener(
            "contextmenu",
            event => {
                const messageElement =
                    event.target.closest(
                        ".message"
                    );

                if (!messageElement) {
                    return;
                }

                event.preventDefault();

                const messageID =
                    messageElement.dataset
                        .messageId;

                const message =
                    messages.find(
                        item =>
                            String(item.id) ===
                            String(messageID)
                    );

                if (!message) return;

                if (
                    normalizeID(message.from) !==
                    normalizeID(currentUserID)
                ) {
                    return;
                }

                const shouldDelete =
                    window.confirm(
                        "Delete this message?"
                    );

                if (shouldDelete) {
                    deleteMessage(
                        messageID
                    );
                }
            }
        );
    }

    /* =========================================================
       INITIALIZATION
       ========================================================= */

    async function initialize() {
        console.log(
            "FriendChat channel chat starting..."
        );

        const user =
            getUserFromStorage();

        currentUserID =
            normalizeID(user.id);

        currentUserName =
            user.name;

        const params =
            getURLParams();

        currentServerID =
            clean(
                params.serverID
            ) ||
            getStorageValue([
                CURRENT_SERVER_KEY
            ]);

        currentChannelID =
            clean(
                params.channelID
            ) ||
            getStorageValue([
                CURRENT_CHANNEL_KEY
            ]);

        /*
         * Save current location immediately.
         */
        saveCurrentLocation();

        if (!currentUserID) {
            console.error(
                "FriendChat: User ID missing."
            );

            showToast(
                "Please log in again."
            );

            return;
        }

        if (!currentServerID) {
            console.error(
                "FriendChat: Server ID missing."
            );

            showToast(
                "Server ID is missing."
            );

            return;
        }

        if (!currentChannelID) {
            console.error(
                "FriendChat: Channel ID missing."
            );

            showToast(
                "Channel ID is missing."
            );

            return;
        }

        try {
            /*
             * IMPORTANT:
             * Server is loaded from the backend.
             * We no longer depend on localStorage
             * containing the complete server.
             */
            await loadServer();

            /*
             * Find the requested channel inside
             * the backend server data.
             */
            await loadChannel();

            /*
             * Load actual messages from server.
             */
            await loadMessages();

            /*
             * Connect realtime updates.
             */
            connectWebSocket();

            /*
             * Fallback polling.
             */
            startMessagePolling();

            console.log(
                "FriendChat channel ready:",
                {
                    userID: currentUserID,
                    serverID: currentServerID,
                    channelID: currentChannelID
                }
            );
        } catch (error) {
            console.error(
                "FriendChat channel initialization failed:",
                error
            );

            showToast(
                error.message ||
                "Could not load this channel.",
                5000
            );

            /*
             * Keep the page open so the actual
             * error can be seen instead of instantly
             * redirecting away.
             */
        }
    }

    /* =========================================================
       CLEANUP
       ========================================================= */

    window.addEventListener(
        "beforeunload",
        () => {
            clearTimeout(
                reconnectTimer
            );

            clearInterval(
                messagePollTimer
            );

            if (socket) {
                try {
                    socket.close();
                } catch (_) {}
            }
        }
    );

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
