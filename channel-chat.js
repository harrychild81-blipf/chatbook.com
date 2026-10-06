/* =========================================================
   FRIENDCHAT - CHANNEL CHAT
   channel-chat.js
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       STORAGE KEYS
       ===================================================== */

    const SERVERS_KEY = "friendchat_servers";
    const CURRENT_SERVER_KEY = "friendchat_current_server";
    const CURRENT_CHANNEL_KEY = "friendchat_current_channel";
    const CHANNEL_MESSAGES_KEY = "friendchat_channel_messages";

    const USER_ID_KEY = "friendchat_user_id";
    const USER_NAME_KEY = "friendchat_user_name";


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    const messagesEl = $("messages");
    const emptyStateEl = $("emptyState");

    const channelNameEl = $("channelName");
    const channelDescriptionEl = $("channelDescription");
    const channelIconEl = $("channelIcon");
    const channelTypeEl = $("channelType");

    const emptyChannelNameEl = $("emptyChannelName");

    const serverNameEl = $("serverName");

    const messageInput = $("messageInput");
    const sendButton = $("sendButton");

    const attachButton = $("attachButton");
    const emojiButton = $("emojiButton");

    const characterCountEl = $("characterCount");

    const backButton = $("backButton");
    const serverButton = $("serverButton");

    const toastEl = $("toast");


    /* =====================================================
       STATE
       ===================================================== */

    let currentServer = null;
    let currentChannel = null;

    let currentUserID = null;
    let currentUserName = null;

    let toastTimer = null;


    /* =====================================================
       GET URL PARAMETERS
       ===================================================== */

    function getURLParams() {
        const params = new URLSearchParams(window.location.search);

        return {
            serverID: params.get("server"),
            channelID: params.get("channel")
        };
    }


    /* =====================================================
       USER
       ===================================================== */

    function loadCurrentUser() {

        currentUserID =
            localStorage.getItem(USER_ID_KEY) ||
            "local-user";

        currentUserName =
            localStorage.getItem(USER_NAME_KEY) ||
            localStorage.getItem("friendchat_name") ||
            "You";
    }


    /* =====================================================
       SERVER STORAGE
       ===================================================== */

    function getSavedServers() {

        try {

            const saved =
                localStorage.getItem(SERVERS_KEY);

            if (!saved) {
                return [];
            }

            const parsed = JSON.parse(saved);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Could not read FriendChat servers:",
                error
            );

            return [];
        }
    }


    function saveServers(servers) {

        try {

            localStorage.setItem(
                SERVERS_KEY,
                JSON.stringify(servers)
            );

        } catch (error) {

            console.error(
                "Could not save FriendChat servers:",
                error
            );
        }
    }


    /* =====================================================
       FIND SERVER
       ===================================================== */

    function findServer(serverID) {

        const servers = getSavedServers();

        return servers.find(
            server =>
                String(server.serverID) ===
                String(serverID)
        ) || null;
    }


    /* =====================================================
       FIND CHANNEL
       ===================================================== */

    function findChannel(server, channelID) {

        if (!server) {
            return null;
        }

        if (!Array.isArray(server.channels)) {
            return null;
        }

        return server.channels.find(
            channel =>
                String(channel.channelID) ===
                String(channelID)
        ) || null;
    }


    /* =====================================================
       MESSAGE STORAGE
       ===================================================== */

    function getAllChannelMessages() {

        try {

            const saved =
                localStorage.getItem(
                    CHANNEL_MESSAGES_KEY
                );

            if (!saved) {
                return {};
            }

            const parsed = JSON.parse(saved);

            return parsed &&
                typeof parsed === "object"
                ? parsed
                : {};

        } catch (error) {

            console.error(
                "Could not read channel messages:",
                error
            );

            return {};
        }
    }


    function saveAllChannelMessages(data) {

        try {

            localStorage.setItem(
                CHANNEL_MESSAGES_KEY,
                JSON.stringify(data)
            );

        } catch (error) {

            console.error(
                "Could not save channel messages:",
                error
            );

            showToast(
                "Could not save the message."
            );
        }
    }


    /* =====================================================
       CHANNEL MESSAGE KEY
       ===================================================== */

    function getMessageStorageKey() {

        if (
            !currentServer ||
            !currentChannel
        ) {
            return null;
        }

        return (
            String(currentServer.serverID) +
            "::" +
            String(currentChannel.channelID)
        );
    }


    /* =====================================================
       GET CURRENT CHANNEL MESSAGES
       ===================================================== */

    function getMessages() {

        const allMessages =
            getAllChannelMessages();

        const key =
            getMessageStorageKey();

        if (!key) {
            return [];
        }

        const messages =
            allMessages[key];

        return Array.isArray(messages)
            ? messages
            : [];
    }


    /* =====================================================
       SAVE CURRENT CHANNEL MESSAGES
       ===================================================== */

    function saveMessages(messages) {

        const allMessages =
            getAllChannelMessages();

        const key =
            getMessageStorageKey();

        if (!key) {
            return;
        }

        allMessages[key] = messages;

        saveAllChannelMessages(
            allMessages
        );
    }


    /* =====================================================
       GENERATE MESSAGE ID
       ===================================================== */

    function generateMessageID() {

        return (
            "MSG-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()
        );
    }


    /* =====================================================
       LOAD SERVER + CHANNEL
       ===================================================== */

    function loadChannel() {

        const params = getURLParams();

        let serverID =
            params.serverID;

        let channelID =
            params.channelID;


        /* -----------------------------------------------
           FALLBACK TO SAVED SERVER
           ----------------------------------------------- */

        if (!serverID) {

            serverID =
                localStorage.getItem(
                    CURRENT_SERVER_KEY
                );
        }


        /* -----------------------------------------------
           FALLBACK TO SAVED CHANNEL
           ----------------------------------------------- */

        if (!channelID) {

            channelID =
                localStorage.getItem(
                    CURRENT_CHANNEL_KEY
                );
        }


        /* -----------------------------------------------
           NO SERVER
           ----------------------------------------------- */

        if (!serverID) {

            showToast(
                "No server selected."
            );

            setTimeout(function () {
                window.location.href =
                    "create-server.html";
            }, 700);

            return;
        }


        /* -----------------------------------------------
           FIND SERVER
           ----------------------------------------------- */

        currentServer =
            findServer(serverID);


        if (!currentServer) {

            showToast(
                "Server could not be found."
            );

            setTimeout(function () {
                window.location.href =
                    "create-server.html";
            }, 700);

            return;
        }


        /* -----------------------------------------------
           FIND CHANNEL
           ----------------------------------------------- */

        if (!channelID) {

            if (
                Array.isArray(
                    currentServer.channels
                ) &&
                currentServer.channels.length > 0
            ) {
                channelID =
                    currentServer.channels[0]
                        .channelID;
            }
        }


        currentChannel =
            findChannel(
                currentServer,
                channelID
            );


        if (!currentChannel) {

            showToast(
                "Channel could not be found."
            );

            setTimeout(function () {
                goToServer();
            }, 700);

            return;
        }


        /* -----------------------------------------------
           SAVE CURRENT LOCATION
           ----------------------------------------------- */

        localStorage.setItem(
            CURRENT_SERVER_KEY,
            currentServer.serverID
        );

        localStorage.setItem(
            CURRENT_CHANNEL_KEY,
            currentChannel.channelID
        );


        /* -----------------------------------------------
           UPDATE PAGE
           ----------------------------------------------- */

        updateChannelHeader();

        renderMessages();

        focusComposer();
    }


    /* =====================================================
       UPDATE CHANNEL HEADER
       ===================================================== */

    function updateChannelHeader() {

        if (!currentChannel) {
            return;
        }


        /* CHANNEL NAME */

        const name =
            currentChannel.name ||
            "General";

        channelNameEl.textContent =
            name;


        /* CHANNEL DESCRIPTION */

        channelDescriptionEl.textContent =
            currentChannel.description ||
            "Welcome to this channel.";


        /* CHANNEL TYPE */

        const type =
            currentChannel.type ||
            "text";

        channelTypeEl.textContent =
            type.toUpperCase();


        /* CHANNEL ICON */

        if (type === "voice") {

            channelIconEl.textContent =
                "🔊";

        } else {

            channelIconEl.textContent =
                "#";
        }


        /* SERVER */

        if (currentServer) {

            serverNameEl.textContent =
                currentServer.name ||
                "FriendChat";
        }


        /* EMPTY STATE */

        emptyChannelNameEl.textContent =
            "Welcome to #" + name;


        document.title =
            "FriendChat - #" + name;
    }


    /* =====================================================
       RENDER MESSAGES
       ===================================================== */

    function renderMessages() {

        if (!messagesEl) {
            return;
        }

        const messages =
            getMessages();


        /* -----------------------------------------------
           REMOVE OLD MESSAGE ELEMENTS
           ----------------------------------------------- */

        const oldMessages =
            messagesEl.querySelectorAll(
                ".channel-message"
            );

        oldMessages.forEach(function (element) {
            element.remove();
        });


        /* -----------------------------------------------
           EMPTY STATE
           ----------------------------------------------- */

        if (messages.length === 0) {

            emptyStateEl.style.display =
                "flex";

            return;
        }


        emptyStateEl.style.display =
            "none";


        /* -----------------------------------------------
           RENDER
           ----------------------------------------------- */

        messages.forEach(function (message) {

            const element =
                createMessageElement(
                    message
                );

            messagesEl.appendChild(
                element
            );
        });


        scrollMessagesToBottom();
    }


    /* =====================================================
       CREATE MESSAGE ELEMENT
       ===================================================== */

    function createMessageElement(message) {

        const wrapper =
            document.createElement("article");

        wrapper.className =
            "channel-message";


        /* -----------------------------------------------
           AVATAR
           ----------------------------------------------- */

        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";

        avatar.textContent =
            getInitials(
                message.senderName
            );


        /* -----------------------------------------------
           CONTENT
           ----------------------------------------------- */

        const content =
            document.createElement("div");

        content.className =
            "message-content";


        /* -----------------------------------------------
           HEADER
           ----------------------------------------------- */

        const header =
            document.createElement("div");

        header.className =
            "message-header";


        const author =
            document.createElement("span");

        author.className =
            "message-author";

        author.textContent =
            message.senderName ||
            "Unknown";


        const time =
            document.createElement("span");

        time.className =
            "message-time";

        time.textContent =
            formatMessageTime(
                message.createdAt
            );


        header.appendChild(author);
        header.appendChild(time);


        /* -----------------------------------------------
           MESSAGE TEXT
           ----------------------------------------------- */

        const text =
            document.createElement("div");

        text.className =
            "message-text";

        /*
         * IMPORTANT:
         * textContent is used instead of innerHTML.
         * This prevents message text from being treated
         * as HTML.
         */

        text.textContent =
            message.text || "";


        content.appendChild(header);
        content.appendChild(text);


        wrapper.appendChild(avatar);
        wrapper.appendChild(content);


        return wrapper;
    }


    /* =====================================================
       GET INITIALS
       ===================================================== */

    function getInitials(name) {

        if (!name) {
            return "U";
        }

        const clean =
            String(name)
                .trim()
                .replace(/\s+/g, " ");


        const parts =
            clean.split(" ");


        if (parts.length === 1) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }


        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }


    /* =====================================================
       FORMAT MESSAGE TIME
       ===================================================== */

    function formatMessageTime(dateValue) {

        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }


        return date.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    }


    /* =====================================================
       SEND MESSAGE
       ===================================================== */

    function sendMessage() {

        if (!currentServer) {
            return;
        }

        if (!currentChannel) {
            return;
        }


        /* -----------------------------------------------
           ONLY TEXT CHANNELS
           ----------------------------------------------- */

        if (
            currentChannel.type &&
            currentChannel.type !== "text"
        ) {

            showToast(
                "Voice channels cannot receive text messages."
            );

            return;
        }


        const text =
            messageInput.value;


        const cleanText =
            text.trim();


        /* -----------------------------------------------
           EMPTY
           ----------------------------------------------- */

        if (!cleanText) {

            messageInput.focus();

            return;
        }


        /* -----------------------------------------------
           LENGTH
           ----------------------------------------------- */

        if (cleanText.length > 2000) {

            showToast(
                "Message is too long."
            );

            return;
        }


        /* -----------------------------------------------
           MESSAGE OBJECT
           ----------------------------------------------- */

        const message = {

            messageID:
                generateMessageID(),

            serverID:
                currentServer.serverID,

            channelID:
                currentChannel.channelID,

            senderID:
                currentUserID,

            senderName:
                currentUserName,

            text:
                cleanText,

            createdAt:
                new Date().toISOString()
        };


        /* -----------------------------------------------
           SAVE
           ----------------------------------------------- */

        const messages =
            getMessages();

        messages.push(message);

        saveMessages(messages);


        /* -----------------------------------------------
           CLEAR INPUT
           ----------------------------------------------- */

        messageInput.value = "";

        updateCharacterCount();

        autoResizeTextarea();


        /* -----------------------------------------------
           RENDER
           ----------------------------------------------- */

        renderMessages();

        messageInput.focus();
    }


    /* =====================================================
       ENTER KEY
       ===================================================== */

    function handleMessageKeydown(event) {

        if (event.key !== "Enter") {
            return;
        }


        /*
         * Shift + Enter
         * = new line
         */

        if (event.shiftKey) {

            return;
        }


        /*
         * Enter
         * = send
         */

        event.preventDefault();

        sendMessage();
    }


    /* =====================================================
       CHARACTER COUNT
       ===================================================== */

    function updateCharacterCount() {

        if (!messageInput) {
            return;
        }

        const length =
            messageInput.value.length;


        characterCountEl.textContent =
            length + " / 2000";


        characterCountEl.classList.remove(
            "warning",
            "danger"
        );


        if (length >= 1800) {

            characterCountEl.classList.add(
                "warning"
            );
        }


        if (length >= 1950) {

            characterCountEl.classList.remove(
                "warning"
            );

            characterCountEl.classList.add(
                "danger"
            );
        }
    }


    /* =====================================================
       AUTO RESIZE TEXTAREA
       ===================================================== */

    function autoResizeTextarea() {

        if (!messageInput) {
            return;
        }


        messageInput.style.height =
            "auto";


        const newHeight =
            Math.min(
                messageInput.scrollHeight,
                150
            );


        messageInput.style.height =
            newHeight + "px";
    }


    /* =====================================================
       SCROLL TO BOTTOM
       ===================================================== */

    function scrollMessagesToBottom() {

        if (!messagesEl) {
            return;
        }


        requestAnimationFrame(function () {

            messagesEl.scrollTop =
                messagesEl.scrollHeight;
        });
    }


    /* =====================================================
       FOCUS COMPOSER
       ===================================================== */

    function focusComposer() {

        if (!messageInput) {
            return;
        }


        setTimeout(function () {

            messageInput.focus();

        }, 100);
    }


    /* =====================================================
       BACK TO SERVER
       ===================================================== */

    function goToServer() {

        if (currentServer) {

            localStorage.setItem(
                CURRENT_SERVER_KEY,
                currentServer.serverID
            );
        }


        window.location.href =
            "server-home.html";
    }


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(message) {

        if (!toastEl) {
            return;
        }


        clearTimeout(toastTimer);


        toastEl.textContent =
            message;


        toastEl.classList.add(
            "show"
        );


        toastTimer =
            setTimeout(function () {

                toastEl.classList.remove(
                    "show"
                );

            }, 2200);
    }


    /* =====================================================
       ATTACHMENT BUTTON
       ===================================================== */

    function handleAttachment() {

        showToast(
            "Attachments will be added soon."
        );
    }


    /* =====================================================
       EMOJI BUTTON
       ===================================================== */

    function handleEmoji() {

        /*
         * Simple prototype emoji picker.
         * Later this can become a full FriendChat
         * emoji panel.
         */

        const emojis = [
            "😀",
            "😂",
            "😍",
            "👍",
            "❤️",
            "🔥",
            "🎮",
            "🎉"
        ];


        const selected =
            emojis[
                Math.floor(
                    Math.random() *
                    emojis.length
                )
            ];


        const start =
            messageInput.selectionStart;

        const end =
            messageInput.selectionEnd;


        const currentValue =
            messageInput.value;


        messageInput.value =
            currentValue.substring(
                0,
                start
            ) +
            selected +
            currentValue.substring(
                end
            );


        const cursorPosition =
            start +
            selected.length;


        messageInput.selectionStart =
            cursorPosition;

        messageInput.selectionEnd =
            cursorPosition;


        updateCharacterCount();

        autoResizeTextarea();

        messageInput.focus();
    }


    /* =====================================================
       COPY SERVER ID
       ===================================================== */

    function copyServerID() {

        if (
            !currentServer ||
            !currentServer.serverID
        ) {
            return;
        }


        const serverID =
            String(
                currentServer.serverID
            );


        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            navigator.clipboard
                .writeText(serverID)
                .then(function () {

                    showToast(
                        "Server ID copied."
                    );

                })
                .catch(function () {

                    fallbackCopy(
                        serverID
                    );

                });

            return;
        }


        fallbackCopy(serverID);
    }


    /* =====================================================
       FALLBACK COPY
       ===================================================== */

    function fallbackCopy(text) {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        textarea.style.position =
            "fixed";

        textarea.style.left =
            "-9999px";

        document.body.appendChild(
            textarea
        );

        textarea.select();


        try {

            document.execCommand(
                "copy"
            );

            showToast(
                "Server ID copied."
            );

        } catch (error) {

            showToast(
                "Could not copy."
            );
        }


        textarea.remove();
    }


    /* =====================================================
       UPDATE CURRENT SERVER DATA
       ===================================================== */

    function refreshCurrentServer() {

        if (!currentServer) {
            return;
        }


        const updated =
            findServer(
                currentServer.serverID
            );


        if (updated) {

            currentServer =
                updated;


            currentChannel =
                findChannel(
                    currentServer,
                    currentChannel.channelID
                );


            updateChannelHeader();

            renderMessages();
        }
    }


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    function setupEvents() {


        /* SEND */

        if (sendButton) {

            sendButton.addEventListener(
                "click",
                sendMessage
            );
        }


        /* ENTER */

        if (messageInput) {

            messageInput.addEventListener(
                "keydown",
                handleMessageKeydown
            );


            messageInput.addEventListener(
                "input",
                function () {

                    updateCharacterCount();

                    autoResizeTextarea();
                }
            );
        }


        /* BACK */

        if (backButton) {

            backButton.addEventListener(
                "click",
                goToServer
            );
        }


        /* SERVER BUTTON */

        if (serverButton) {

            serverButton.addEventListener(
                "click",
                goToServer
            );
        }


        /* ATTACHMENTS */

        if (attachButton) {

            attachButton.addEventListener(
                "click",
                handleAttachment
            );
        }


        /* EMOJI */

        if (emojiButton) {

            emojiButton.addEventListener(
                "click",
                handleEmoji
            );
        }


        /* PAGE VISIBILITY */

        document.addEventListener(
            "visibilitychange",
            function () {

                if (
                    !document.hidden
                ) {
                    refreshCurrentServer();
                }
            }
        );


        /*
         * If another FriendChat tab changes
         * the localStorage data, refresh this page.
         */

        window.addEventListener(
            "storage",
            function (event) {

                if (
                    event.key ===
                    CHANNEL_MESSAGES_KEY
                ) {

                    renderMessages();

                    return;
                }


                if (
                    event.key ===
                    SERVERS_KEY
                ) {

                    refreshCurrentServer();
                }
            }
        );
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        loadCurrentUser();

        setupEvents();

        updateCharacterCount();

        autoResizeTextarea();

        loadChannel();
    }


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();
