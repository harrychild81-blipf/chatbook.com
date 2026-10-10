/* =========================================================
   FRIENDCHAT
   SERVER HOME
   FIXED BACKEND CONNECTED VERSION
   ========================================================= */

const API_BASE = "";


/* =========================================================
   ELEMENTS
   ========================================================= */

const topServerName =
    document.getElementById("topServerName");

const topServerIcon =
    document.getElementById("topServerIcon");

const topServerIconText =
    document.getElementById("topServerIconText");

const serverName =
    document.getElementById("serverName");

const serverDescription =
    document.getElementById("serverDescription");

const serverIcon =
    document.getElementById("serverIcon");

const serverIconText =
    document.getElementById("serverIconText");

const serverID =
    document.getElementById("serverID");

const previewIcon =
    document.getElementById("previewIcon");

const previewIconText =
    document.getElementById("previewIconText");

const previewName =
    document.getElementById("previewName");

const previewChannelList =
    document.getElementById("previewChannelList");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================================
   CHANNEL ELEMENTS
   ========================================================= */

const createChannelButton =
    document.getElementById("createChannelButton");

const channelModal =
    document.getElementById("channelModal");

const channelModalBackdrop =
    document.getElementById("channelModalBackdrop");

const closeChannelModal =
    document.getElementById("closeChannelModal");

const cancelChannelButton =
    document.getElementById("cancelChannelButton");

const saveChannelButton =
    document.getElementById("saveChannelButton");

const channelNameInput =
    document.getElementById("channelNameInput");

const channelFormError =
    document.getElementById("channelFormError");

const textChannelOption =
    document.getElementById("textChannelOption");

const voiceChannelOption =
    document.getElementById("voiceChannelOption");

const textChannelList =
    document.getElementById("textChannelList");

const voiceChannelList =
    document.getElementById("voiceChannelList");


/* =========================================================
   STATE
   ========================================================= */

let currentServer = null;

let selectedChannelID = null;

let toastTimer = null;

// True when the loaded server needs a one-time channel-data repair.
let serverNeedsInitialSave = false;


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

            const value =
                localStorage.getItem(key);

            if (
                value &&
                String(value).trim()
            ) {

                return String(value)
                    .trim()
                    .toUpperCase();
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

            const raw =
                localStorage.getItem(key);

            if (!raw) {
                continue;
            }


            try {

                const obj =
                    JSON.parse(raw);


                if (!obj) {
                    continue;
                }


                const id =
                    obj.userID ||
                    obj.userId ||
                    obj.id ||
                    obj.ID;


                if (
                    id &&
                    String(id).trim()
                ) {

                    return String(id)
                        .trim()
                        .toUpperCase();
                }

            } catch (_) {}
        }

    } catch (error) {

        console.error(
            "FriendChat: Could not read current user:",
            error
        );
    }


    return "";
}


/* =========================================================
   SERVER ID
   ========================================================= */

function getCurrentServerID() {

    let urlID = "";


    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        urlID =
            params.get("server") ||
            params.get("serverID") ||
            "";

    } catch (error) {

        console.warn(
            "FriendChat: URL server ID read failed:",
            error
        );
    }


    if (
        urlID &&
        String(urlID).trim()
    ) {

        return String(urlID).trim();
    }


    try {

        const saved =
            localStorage.getItem(
                "friendchat_current_server"
            );


        if (
            saved &&
            String(saved).trim()
        ) {

            return String(saved).trim();
        }

    } catch (error) {

        console.warn(
            "FriendChat: saved server ID read failed:",
            error
        );
    }


    return "";
}


/* =========================================================
   SAVE SERVER ID
   ========================================================= */

function saveCurrentServerID(id) {

    if (!id) {
        return;
    }


    try {

        localStorage.setItem(
            "friendchat_current_server",
            String(id)
        );

    } catch (error) {

        console.error(
            "FriendChat: Could not save server ID:",
            error
        );
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }


    toastMessage.textContent =
        message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const headers = {
        "Content-Type":
            "application/json"
    };


    if (options.headers) {

        Object.assign(
            headers,
            options.headers
        );
    }


    const userID =
        getCurrentUserID();


    if (userID) {

        headers[
            "x-friendchat-user-id"
        ] = userID;
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

        response =
            await fetch(
                API_BASE + url,
                Object.assign(
                    {},
                    options,
                    {
                        headers
                    }
                )
            );

    } catch (error) {

        console.error(
            "FriendChat network error:",
            error
        );


        throw new Error(
            "Cannot connect to FriendChat server."
        );
    }


    let data = null;


    try {

        data =
            await response.json();

    } catch (_) {

        data = null;
    }


    console.log(
        "FriendChat API response:",
        response.status,
        data
    );


    if (!response.ok) {

        let message =
            "Server request failed.";


        if (
            data &&
            data.error
        ) {

            message =
                data.error;
        }


        throw new Error(
            message
        );
    }


    return data;
}


/* =========================================================
   LOAD SERVER
   ========================================================= */

async function loadServerFromBackend() {

    const id =
        getCurrentServerID();


    const userID =
        getCurrentUserID();


    console.log(
        "FriendChat loading server:",
        id,
        "User:",
        userID
    );


    if (!id) {

        showToast(
            "Server ID is missing."
        );


        setTimeout(
            function () {

                window.location.href =
                    "index.html";

            },
            1200
        );


        return null;
    }


    /*
       IMPORTANT:
       Send the user ID in the URL AND header.
       This makes the request compatible with
       both versions of the FriendChat backend.
    */

    let requestURL =
        "/api/servers/" +
        encodeURIComponent(id);


    if (userID) {

        requestURL +=
            "?user=" +
            encodeURIComponent(userID);
    }


    try {

        const data =
            await apiRequest(
                requestURL,
                {
                    method: "GET"
                }
            );


        if (
            !data ||
            !data.server
        ) {

            throw new Error(
                "Server was not returned by the backend."
            );
        }


        currentServer =
            data.server;


        if (
            !currentServer.serverID
        ) {

            currentServer.serverID =
                id;
        }


        saveCurrentServerID(
            currentServer.serverID
        );


        normalizeChannels(
            currentServer
        );


        console.log(
            "FriendChat server loaded successfully:",
            currentServer
        );


        return currentServer;

    } catch (error) {

        console.error(
            "FriendChat server loading failed:",
            error
        );


        showToast(
            error.message ||
            "Server not found."
        );


        /*
           DO NOT immediately close the page.
           Keep the page open so we can see the error.
        */

        return null;
    }
}


/* =========================================================
   NORMALIZE CHANNELS
   ========================================================= */

function normalizeChannels(server) {

    if (
        !server ||
        typeof server !== "object"
    ) {

        return [];
    }


    if (
        !Array.isArray(
            server.channels
        )
    ) {

        server.channels = [];
    }


    return server.channels;
}


/* =========================================================
   GET CHANNELS
   ========================================================= */

function getChannels() {

    if (!currentServer) {
        return [];
    }


    return normalizeChannels(
        currentServer
    );
}


/* =========================================================
   SERVER INITIALS
   ========================================================= */

function getServerInitials(name) {

    if (!name) {
        return "FC";
    }


    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();
}


/* =========================================================
   SERVER IMAGE
   ========================================================= */

function setServerImage(
    imageElement,
    textElement,
    icon,
    initials
) {

    if (
        imageElement &&
        textElement &&
        icon &&
        typeof icon === "string" &&
        icon.trim()
    ) {

        imageElement.src =
            icon;

        imageElement.style.display =
            "block";

        textElement.style.display =
            "none";

        return;
    }


    if (imageElement) {

        imageElement.removeAttribute(
            "src"
        );

        imageElement.style.display =
            "none";
    }


    if (textElement) {

        textElement.textContent =
            initials;

        textElement.style.display =
            "block";
    }
}


/* =========================================================
   CHANNEL ID
   ========================================================= */

function generateChannelID() {

    return (
        "CH-" +
        Date.now()
            .toString(36)
            .toUpperCase() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );
}


/* =========================================================
   SAVED CHANNEL
   ========================================================= */

function getSavedChannelID() {

    try {

        const raw =
            localStorage.getItem(
                "friendchat_current_channel"
            );


        if (!raw) {
            return null;
        }


        try {

            const data =
                JSON.parse(raw);


            if (
                data &&
                typeof data === "object"
            ) {

                if (
                    data.serverID &&
                    currentServer &&
                    String(data.serverID) !==
                    String(currentServer.serverID)
                ) {

                    return null;
                }


                return (
                    data.channelID ||
                    null
                );
            }

        } catch (_) {

            return raw;
        }

    } catch (_) {}


    return null;
}


/* =========================================================
   SAVE CHANNEL
   ========================================================= */

function saveSelectedChannel(channel) {

    if (
        !currentServer ||
        !channel
    ) {

        return;
    }


    try {

        localStorage.setItem(
            "friendchat_current_channel",
            JSON.stringify({

                serverID:
                    currentServer.serverID,

                channelID:
                    channel.channelID

            })
        );

    } catch (error) {

        console.error(
            "FriendChat: Could not save channel:",
            error
        );
    }
}


/* =========================================================
   GET URL CHANNEL
   ========================================================= */

function getChannelFromURL() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        return (
            params.get("channel") ||
            params.get("channelID") ||
            null
        );

    } catch (_) {

        return null;
    }
}


/* =========================================================
   LOAD SERVER UI
   ========================================================= */

async function loadServer() {

    const server =
        await loadServerFromBackend();


    if (!server) {

        console.error(
            "FriendChat: Server could not be loaded."
        );

        return;
    }


    const name =
        currentServer.name ||
        "Unnamed Server";


    const description =
        currentServer.description ||
        "Welcome to your FriendChat server.";


    const initials =
        getServerInitials(
            name
        );


    /* =====================================================
       TOP BAR
       ===================================================== */

    if (topServerName) {

        topServerName.textContent =
            name;
    }


    setServerImage(
        topServerIcon,
        topServerIconText,
        currentServer.icon,
        initials
    );


    /* =====================================================
       SERVER HERO
       ===================================================== */

    if (serverName) {

        serverName.textContent =
            name;
    }


    if (serverDescription) {

        serverDescription.textContent =
            description;
    }


    if (serverID) {

        serverID.textContent =
            currentServer.serverID ||
            "—";
    }


    setServerImage(
        serverIcon,
        serverIconText,
        currentServer.icon,
        initials
    );


    /* =====================================================
       PREVIEW
       ===================================================== */

    if (previewName) {

        previewName.textContent =
            name;
    }


    setServerImage(
        previewIcon,
        previewIconText,
        currentServer.icon,
        initials
    );


    /* =====================================================
       CHANNEL SELECTION
       ===================================================== */

    const urlChannel =
        getChannelFromURL();


    const savedChannel =
        getSavedChannelID();    const possibleChannel = urlChannel || savedChannel;

    if (possibleChannel) {
        const found = getChannels().find(function (channel) {
            return String(channel.channelID) === String(possibleChannel);
        });

        if (found) {
            selectedChannelID = found.channelID;
        }
    }

    if (!selectedChannelID && getChannels().length) {
        selectedChannelID = getChannels()[0].channelID;
    }

    renderChannels();

    console.log("FriendChat server home ready.", currentServer);
}


/* =========================================================
   RENDER CHANNELS
   ========================================================= */

function renderChannels() {
    if (!currentServer) return;

    const channels = getChannels();

    const textChannels = channels.filter(function (channel) {
        return channel.type === "text";
    });

    const voiceChannels = channels.filter(function (channel) {
        return channel.type === "voice";
    });

    if (textChannelList) {
        textChannelList.innerHTML = "";

        if (!textChannels.length) {
            textChannelList.innerHTML = `
                <div class="channel-empty">No text channels yet.</div>
            `;
        } else {
            textChannels.forEach(function (channel) {
                textChannelList.appendChild(createChannelElement(channel));
            });
        }
    }

    if (voiceChannelList) {
        voiceChannelList.innerHTML = "";

        if (!voiceChannels.length) {
            voiceChannelList.innerHTML = `
                <div class="channel-empty">No voice channels yet.</div>
            `;
        } else {
            voiceChannels.forEach(function (channel) {
                voiceChannelList.appendChild(createChannelElement(channel));
            });
        }
    }

    renderPreviewChannels();
}


/* =========================================================
   CREATE CHANNEL ELEMENT
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

    const description = channel.description ||
        (channel.type === "voice" ? "Voice channel" : "Text channel");

    button.innerHTML = `
        <div class="channel-icon">${icon}</div>
        <div class="channel-info">
            <div class="channel-name">${escapeHTML(channel.name)}</div>
            <div class="channel-description">${escapeHTML(description)}</div>
        </div>
        <div class="channel-arrow">→</div>
    `;

    button.addEventListener("click", function (event) {
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
        previewChannelList.innerHTML = `
            <div class="preview-channel muted">No channels</div>
        `;
        return;
    }

    channels.slice(0, 8).forEach(function (channel) {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "preview-channel";
        item.dataset.channelId = channel.channelID;

        if (String(channel.channelID) === String(selectedChannelID)) {
            item.classList.add("active");
        }

        item.textContent = channel.type === "voice"
            ? "🔊 " + channel.name
            : "# " + channel.name;

        item.addEventListener("click", function (event) {
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

    setTimeout(function () {
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
    if (channelNameInput) channelNameInput.value = "";
    if (channelFormError) channelFormError.textContent = "";

    const textRadio = document.querySelector(
        'input[name="channelType"][value="text"]'
    );

    if (textRadio) textRadio.checked = true;

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
   SAVE SERVER
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

    const duplicate = getChannels().some(function (channel) {
        return String(channel.name || "").trim().toLowerCase() ===
            name.toLowerCase();
    });

    if (duplicate) {
        showChannelError("A channel with this name already exists.");
        return;
    }

    const newChannel = {
        channelID: generateChannelID(),
        name: name,
        type: type,
        description: type === "voice" ? "Voice channel" : "Text channel",
        createdAt: new Date().toISOString()
    };

    if (saveChannelButton) {
        saveChannelButton.disabled = true;
        saveChannelButton.textContent = "Creating...";
    }

    try {
        currentServer.channels = getChannels();
        currentServer.channels.push(newChannel);

        const saved = await saveServerToBackend();

        if (!saved) {
            currentServer.channels = currentServer.channels.filter(
                function (channel) {
                    return channel.channelID !== newChannel.channelID;
                }
            );

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
        console.error("FriendChat: Create channel failed:", error);

        showChannelError(
            error.message || "Could not create channel."
        );
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
    closeChannelModal.addEventListener(
        "click",
        closeChannelModalWindow
    );
}

if (cancelChannelButton) {
    cancelChannelButton.addEventListener(
        "click",
        closeChannelModalWindow
    );
}

if (channelModalBackdrop) {
    channelModalBackdrop.addEventListener(
        "click",
        closeChannelModalWindow
    );
}

if (saveChannelButton) {
    saveChannelButton.addEventListener("click", createChannel);
}

if (channelNameInput) {
    channelNameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            createChannel();
        }
    });
}


/* =========================================================
   CHANNEL TYPE
   ========================================================= */

document
    .querySelectorAll('input[name="channelType"]')
    .forEach(function (radio) {
        radio.addEventListener("change", updateChannelTypeUI);
    });


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener("keydown", function (event) {
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

const copyServerIDButton =
    document.getElementById("copyServerID");

if (copyServerIDButton) {
    copyServerIDButton.addEventListener("click", async function () {
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

const backButton =
    document.getElementById("backButton");

if (backButton) {
    backButton.addEventListener("click", function () {
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


/* =========================================================
   MEMBERS CARD
   ========================================================= */

const membersCard =
    document.getElementById("membersCard");

if (membersCard) {
    membersCard.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openServerMembers();
    });
}


/* =========================================================
   TOP MEMBERS BUTTON
   ========================================================= */

const membersButton =
    document.getElementById("membersButton");

if (membersButton) {
    membersButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openServerMembers();
    });
}


/* =========================================================
   OTHER CARDS
   ========================================================= */

const rulesCard =
    document.getElementById("rulesCard");

const rolesCard =
    document.getElementById("rolesCard");

const aiCard =
    document.getElementById("aiCard");

const musicCard =
    document.getElementById("musicCard");

const activityCard =
    document.getElementById("activityCard");

const serverSettingsCard =
    document.getElementById("serverSettingsCard");

const channelsCard =
    document.getElementById("channelsCard");

const settingsButton =
    document.getElementById("settingsButton");


if (channelsCard) {
    channelsCard.addEventListener("click", function () {
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
    rulesCard.addEventListener("click", function () {
        showToast("Rules system coming soon.");
    });
}


if (rolesCard) {
    rolesCard.addEventListener("click", function () {
        showToast("Roles will be added later.");
    });
}


if (aiCard) {
    aiCard.addEventListener("click", function () {
        showToast("FriendChat AI will be added later.");
    });
}


if (musicCard) {
    musicCard.addEventListener("click", function () {
        showToast("Music system will be added later.");
    });
}


if (activityCard) {
    activityCard.addEventListener("click", function () {
        showToast("Activity will be added later.");
    });
}


if (serverSettingsCard) {
    serverSettingsCard.addEventListener("click", function () {
        showToast("Server customization will be added later.");
    });
}


if (settingsButton) {
    settingsButton.addEventListener("click", function () {
        showToast("Server settings coming soon.");
    });
}


/* =========================================================
   START
   ========================================================= */

console.log("FriendChat server-home.js loaded.");
console.log("Current User:", getCurrentUserID());
console.log("Current Server:", getCurrentServerID());

loadServer();
