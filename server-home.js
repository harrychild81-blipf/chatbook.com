/* =========================================================
   FRIENDCHAT
   SERVER HOME
   PHASE 3 — CHANNELS
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const topServerName =
    document.getElementById(
        "topServerName"
    );

const topServerIcon =
    document.getElementById(
        "topServerIcon"
    );

const topServerIconText =
    document.getElementById(
        "topServerIconText"
    );

const serverName =
    document.getElementById(
        "serverName"
    );

const serverDescription =
    document.getElementById(
        "serverDescription"
    );

const serverIcon =
    document.getElementById(
        "serverIcon"
    );

const serverIconText =
    document.getElementById(
        "serverIconText"
    );

const serverID =
    document.getElementById(
        "serverID"
    );

const previewIcon =
    document.getElementById(
        "previewIcon"
    );

const previewIconText =
    document.getElementById(
        "previewIconText"
    );

const previewName =
    document.getElementById(
        "previewName"
    );

const previewChannelList =
    document.getElementById(
        "previewChannelList"
    );

const toast =
    document.getElementById(
        "toast"
    );

const toastMessage =
    document.getElementById(
        "toastMessage"
    );


/* =========================================================
   CHANNEL ELEMENTS
   ========================================================= */

const createChannelButton =
    document.getElementById(
        "createChannelButton"
    );

const channelModal =
    document.getElementById(
        "channelModal"
    );

const channelModalBackdrop =
    document.getElementById(
        "channelModalBackdrop"
    );

const closeChannelModal =
    document.getElementById(
        "closeChannelModal"
    );

const cancelChannelButton =
    document.getElementById(
        "cancelChannelButton"
    );

const saveChannelButton =
    document.getElementById(
        "saveChannelButton"
    );

const channelNameInput =
    document.getElementById(
        "channelNameInput"
    );

const channelFormError =
    document.getElementById(
        "channelFormError"
    );

const textChannelOption =
    document.getElementById(
        "textChannelOption"
    );

const voiceChannelOption =
    document.getElementById(
        "voiceChannelOption"
    );

const textChannelList =
    document.getElementById(
        "textChannelList"
    );

const voiceChannelList =
    document.getElementById(
        "voiceChannelList"
    );


/* =========================================================
   CURRENT SERVER
   ========================================================= */

let currentServer = null;


/* =========================================================
   SELECTED CHANNEL
   ========================================================= */

let selectedChannelID = null;


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function showToast(message) {

    if (!toast) {
        return;
    }


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


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
   GET SAVED SERVERS
   ========================================================= */

function getSavedServers() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    "friendchat_servers"
                )
            ) || [];


        if (!Array.isArray(saved)) {

            return [];
        }


        return saved;

    } catch (error) {

        console.error(
            "Could not read FriendChat servers:",
            error
        );

        return [];
    }
}


/* =========================================================
   SAVE SERVERS
   ========================================================= */

function saveServers(servers) {

    try {

        localStorage.setItem(
            "friendchat_servers",
            JSON.stringify(servers)
        );

        return true;

    } catch (error) {

        console.error(
            "Could not save FriendChat servers:",
            error
        );

        showToast(
            "Could not save server changes"
        );

        return false;
    }
}


/* =========================================================
   GET CURRENT SERVER
   ========================================================= */

function getCurrentServer() {

    try {

        const currentServerID =
            localStorage.getItem(
                "friendchat_current_server"
            );


        const savedServers =
            getSavedServers();


        if (
            !currentServerID ||
            !savedServers.length
        ) {

            return null;
        }


        const server =
            savedServers.find(
                function (item) {

                    return (
                        item.serverID ===
                        currentServerID
                    );
                }
            );


        return server || null;

    } catch (error) {

        console.error(
            "Could not load current server:",
            error
        );

        return null;
    }
}


/* =========================================================
   SERVER INITIALS
   ========================================================= */

function getServerInitials(name) {

    if (!name) {

        return "FC";
    }


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 1) {

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
   SET SERVER IMAGE
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
        typeof icon === "string"
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
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );
}


/* =========================================================
   DEFAULT CHANNELS
   ========================================================= */

function createDefaultChannels() {

    return [

        {
            channelID:
                generateChannelID(),

            name:
                "General",

            type:
                "text",

            description:
                "General conversation",

            createdAt:
                Date.now()
        }

    ];
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

        server.channels =
            createDefaultChannels();

        return server.channels;
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
   UPDATE CURRENT SERVER
   ========================================================= */

function updateCurrentServer() {

    if (!currentServer) {

        return false;
    }


    const currentServerID =
        currentServer.serverID;


    const servers =
        getSavedServers();


    const serverIndex =
        servers.findIndex(
            function (server) {

                return (
                    server.serverID ===
                    currentServerID
                );
            }
        );


    if (serverIndex === -1) {

        return false;
    }


    servers[serverIndex] =
        currentServer;


    const saved =
        saveServers(
            servers
        );


    if (!saved) {

        return false;
    }


    currentServer =
        servers[serverIndex];


    return true;
}


/* =========================================================
   LOAD SERVER
   ========================================================= */

function loadServer() {

    const server =
        getCurrentServer();


    /* =====================================================
       NO SERVER
       ===================================================== */

    if (!server) {

        console.warn(
            "No current FriendChat server found."
        );


        window.location.href =
            "create-server.html";

        return;
    }


    currentServer =
        server;


    /* =====================================================
       MAKE SURE CHANNELS EXIST
       ===================================================== */

    const channels =
        normalizeChannels(
            currentServer
        );


    /*
     * If this is an older server created
     * before the channel system existed,
     * save the new default channels.
     */

    if (
        channels.length === 1 &&
        channels[0].name === "General"
    ) {

        updateCurrentServer();
    }


    /* =====================================================
       SERVER INFORMATION
       ===================================================== */

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
       HERO
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
       RENDER CHANNELS
       ===================================================== */

    renderChannels();


    console.log(
        "FriendChat server loaded:",
        currentServer
    );
}


/* =========================================================
   RENDER CHANNELS
   ========================================================= */

function renderChannels() {

    if (!currentServer) {

        return;
    }


    const channels =
        getChannels();


    /* =====================================================
       SEPARATE CHANNEL TYPES
       ===================================================== */

    const textChannels =
        channels.filter(
            function (channel) {

                return (
                    channel.type ===
                    "text"
                );
            }
        );


    const voiceChannels =
        channels.filter(
            function (channel) {

                return (
                    channel.type ===
                    "voice"
                );
            }
        );


    /* =====================================================
       TEXT CHANNELS
       ===================================================== */

    if (textChannelList) {

        textChannelList.innerHTML =
            "";


        if (
            textChannels.length === 0
        ) {

            textChannelList.innerHTML = `
                <div class="channel-empty">
                    No text channels yet.
                </div>
            `;

        } else {

            textChannels.forEach(
                function (channel) {

                    textChannelList.appendChild(
                        createChannelElement(
                            channel
                        )
                    );
                }
            );
        }
    }


    /* =====================================================
       VOICE CHANNELS
       ===================================================== */

    if (voiceChannelList) {

        voiceChannelList.innerHTML =
            "";


        if (
            voiceChannels.length === 0
        ) {

            voiceChannelList.innerHTML = `
                <div class="channel-empty">
                    No voice channels yet.
                </div>
            `;

        } else {

            voiceChannels.forEach(
                function (channel) {

                    voiceChannelList.appendChild(
                        createChannelElement(
                            channel
                        )
                    );
                }
            );
        }
    }


    /* =====================================================
       PREVIEW
       ===================================================== */

    renderPreviewChannels();
}


/* =========================================================
   CREATE CHANNEL ELEMENT
   ========================================================= */

function createChannelElement(
    channel
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "channel-item";


    if (
        channel.channelID ===
        selectedChannelID
    ) {

        button.classList.add(
            "active"
        );
    }


    const icon =
        channel.type === "voice"
            ? "🔊"
            : "#";


    const description =
        channel.description ||
        (
            channel.type === "voice"
                ? "Voice channel"
                : "Text channel"
        );


    button.innerHTML = `

        <div class="channel-icon">
            ${icon}
        </div>

        <div class="channel-info">

            <div class="channel-name">
                ${escapeHTML(channel.name)}
            </div>

            <div class="channel-description">
                ${escapeHTML(description)}
            </div>

        </div>

        <div class="channel-arrow">
            →
        </div>

    `;


    button.addEventListener(
        "click",
        function () {

            selectChannel(
                channel
            );
        }
    );


    return button;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   SELECT CHANNEL
   ========================================================= */

function selectChannel(
    channel
) {

    if (!channel) {

        return;
    }


    selectedChannelID =
        channel.channelID;


    renderChannels();


    if (
        channel.type ===
        "voice"
    ) {

        showToast(
            "Voice channel selected: " +
            channel.name
        );

    } else {

        showToast(
            "#" +
            channel.name +
            " selected"
        );
    }


    /*
     * Real channel chat will be connected
     * in the next stage.
     */

    console.log(
        "Selected FriendChat channel:",
        channel
    );
}


/* =========================================================
   RENDER PREVIEW CHANNELS
   ========================================================= */

function renderPreviewChannels() {

    if (!previewChannelList) {

        return;
    }


    previewChannelList.innerHTML =
        "";


    const channels =
        getChannels();


    if (
        channels.length === 0
    ) {

        previewChannelList.innerHTML = `

            <div class="preview-channel muted">
                No channels
            </div>

        `;

        return;
    }


    channels
        .slice(0, 8)
        .forEach(
            function (channel) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "preview-channel";


                if (
                    channel.type ===
                    "voice"
                ) {

                    item.textContent =
                        "🔊 " +
                        channel.name;

                } else {

                    item.textContent =
                        "# " +
                        channel.name;
                }


                previewChannelList.appendChild(
                    item
                );
            }
        );
}


/* =========================================================
   OPEN CHANNEL MODAL
   ========================================================= */

function openChannelModal() {

    if (!channelModal) {

        return;
    }


    clearChannelForm();


    channelModal.classList.add(
        "open"
    );


    channelModal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        function () {

            if (channelNameInput) {

                channelNameInput.focus();
            }

        },
        100
    );
}


/* =========================================================
   CLOSE CHANNEL MODAL
   ========================================================= */

function closeChannelModalWindow() {

    if (!channelModal) {

        return;
    }


    channelModal.classList.remove(
        "open"
    );


    channelModal.setAttribute(
        "aria-hidden",
        "true"
    );


    clearChannelForm();
}


/* =========================================================
   CLEAR CHANNEL FORM
   ========================================================= */

function clearChannelForm() {

    if (channelNameInput) {

        channelNameInput.value =
            "";
    }


    if (channelFormError) {

        channelFormError.textContent =
            "";
    }


    const textRadio =
        document.querySelector(
            'input[name="channelType"][value="text"]'
        );


    if (textRadio) {

        textRadio.checked =
            true;
    }


    updateChannelTypeUI();
}


/* =========================================================
   GET SELECTED CHANNEL TYPE
   ========================================================= */

function getSelectedChannelType() {

    const selected =
        document.querySelector(
            'input[name="channelType"]:checked'
        );


    if (!selected) {

        return "text";
    }


    return selected.value;
}


/* =========================================================
   UPDATE TYPE UI
   ========================================================= */

function updateChannelTypeUI() {

    const type =
        getSelectedChannelType();


    if (textChannelOption) {

        textChannelOption.classList.toggle(
            "selected",
            type === "text"
        );
    }


    if (voiceChannelOption) {

        voiceChannelOption.classList.toggle(
            "selected",
            type === "voice"
        );
    }
}


/* =========================================================
   SHOW CHANNEL FORM ERROR
   ========================================================= */

function showChannelError(
    message
) {

    if (!channelFormError) {

        return;
    }


    channelFormError.textContent =
        message;
}


/* =========================================================
   CREATE CHANNEL
   ========================================================= */

function createChannel() {

    if (!currentServer) {

        showChannelError(
            "No server is currently selected."
        );

        return;
    }


    const rawName =
        channelNameInput
            ? channelNameInput.value
            : "";


    const name =
        rawName
            .trim()
            .replace(/\s+/g, " ");


    /* =====================================================
       VALIDATE NAME
       ===================================================== */

    if (!name) {

        showChannelError(
            "Please enter a channel name."
        );

        if (channelNameInput) {

            channelNameInput.focus();
        }

        return;
    }


    if (name.length < 2) {

        showChannelError(
            "Channel name must be at least 2 characters."
        );

        return;
    }


    if (name.length > 40) {

        showChannelError(
            "Channel name must be 40 characters or less."
        );

        return;
    }


    const type =
        getSelectedChannelType();


    /* =====================================================
       CHECK DUPLICATE
       ===================================================== */

    const channels =
        getChannels();


    const duplicate =
        channels.some(
            function (channel) {

                return (
                    channel.name
                        .trim()
                        .toLowerCase() ===
                    name.toLowerCase()
                );
            }
        );


    if (duplicate) {

        showChannelError(
            "A channel with this name already exists."
        );

        return;
    }


    /* =====================================================
       CREATE CHANNEL OBJECT
       ===================================================== */

    const newChannel = {

        channelID:
            generateChannelID(),

        name:
            name,

        type:
            type,

        description:
            type === "voice"
                ? "Voice channel"
                : "Text channel",

        createdAt:
            Date.now()
    };


    /* =====================================================
       ADD CHANNEL
       ===================================================== */

    currentServer.channels.push(
        newChannel
    );


    /* =====================================================
       SAVE
       ===================================================== */

    const saved =
        updateCurrentServer();


    if (!saved) {

        /*
         * Remove it again if saving failed.
         */

        currentServer.channels =
            currentServer.channels.filter(
                function (channel) {

                    return (
                        channel.channelID !==
                        newChannel.channelID
                    );
                }
            );

        return;
    }


    /* =====================================================
       UPDATE UI
       ===================================================== */

    selectedChannelID =
        newChannel.channelID;


    renderChannels();


    closeChannelModalWindow();


    showToast(
        type === "voice"
            ? "Voice channel created"
            : "Text channel created"
    );


    console.log(
        "FriendChat channel created:",
        newChannel
    );
}


/* =========================================================
   CREATE CHANNEL BUTTON
   ========================================================= */

if (createChannelButton) {

    createChannelButton.addEventListener(
        "click",
        function () {

            openChannelModal();
        }
    );
}


/* =========================================================
   CLOSE MODAL BUTTON
   ========================================================= */

if (closeChannelModal) {

    closeChannelModal.addEventListener(
        "click",
        function () {

            closeChannelModalWindow();
        }
    );
}


/* =========================================================
   CANCEL BUTTON
   ========================================================= */

if (cancelChannelButton) {

    cancelChannelButton.addEventListener(
        "click",
        function () {

            closeChannelModalWindow();
        }
    );
}


/* =========================================================
   BACKDROP CLICK
   ========================================================= */

if (channelModalBackdrop) {

    channelModalBackdrop.addEventListener(
        "click",
        function () {

            closeChannelModalWindow();
        }
    );
}


/* =========================================================
   SAVE CHANNEL
   ========================================================= */

if (saveChannelButton) {

    saveChannelButton.addEventListener(
        "click",
        function () {

            createChannel();
        }
    );
}


/* =========================================================
   CHANNEL NAME ENTER KEY
   ========================================================= */

if (channelNameInput) {

    channelNameInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                createChannel();
            }
        }
    );
}


/* =========================================================
   CHANNEL TYPE RADIO BUTTONS
   ========================================================= */

const channelTypeRadios =
    document.querySelectorAll(
        'input[name="channelType"]'
    );


channelTypeRadios.forEach(
    function (radio) {

        radio.addEventListener(
            "change",
            function () {

                updateChannelTypeUI();
            }
        );
    }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                channelModal &&
                channelModal.classList.contains(
                    "open"
                )
            ) {

                closeChannelModalWindow();
            }
        }
    }
);


/* =========================================================
   COPY SERVER ID
   ========================================================= */

const copyServerID =
    document.getElementById(
        "copyServerID"
    );


if (copyServerID) {

    copyServerID.addEventListener(
        "click",
        async function () {

            const id =
                serverID.textContent.trim();


            if (
                !id ||
                id === "—"
            ) {

                return;
            }


            try {

                await navigator.clipboard.writeText(
                    id
                );

                showToast(
                    "Server ID copied"
                );

            } catch (error) {

                const temporary =
                    document.createElement(
                        "textarea"
                    );


                temporary.value =
                    id;


                document.body.appendChild(
                    temporary
                );


                temporary.select();


                document.execCommand(
                    "copy"
                );


                temporary.remove();


                showToast(
                    "Server ID copied"
                );
            }
        }
    );
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

const backButton =
    document.getElementById(
        "backButton"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "index.html";
            }
        }
    );
}


/* =========================================================
   CARD BUTTONS
   ========================================================= */

const channelsCard =
    document.getElementById(
        "channelsCard"
    );

const membersCard =
    document.getElementById(
        "membersCard"
    );

const rulesCard =
    document.getElementById(
        "rulesCard"
    );

const rolesCard =
    document.getElementById(
        "rolesCard"
    );

const aiCard =
    document.getElementById(
        "aiCard"
    );

const musicCard =
    document.getElementById(
        "musicCard"
    );

const activityCard =
    document.getElementById(
        "activityCard"
    );

const serverSettingsCard =
    document.getElementById(
        "serverSettingsCard"
    );


/* =========================================================
   CHANNELS CARD
   ========================================================= */

if (channelsCard) {

    channelsCard.addEventListener(
        "click",
        function () {

            const channelsSection =
                document.getElementById(
                    "channelsSection"
                );


            if (channelsSection) {

                channelsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );
}


/* =========================================================
   MEMBERS CARD
   ========================================================= */

if (membersCard) {

    membersCard.addEventListener(
        "click",
        function () {

            showToast(
                "Members system coming next."
            );
        }
    );
}


/* =========================================================
   RULES CARD
   ========================================================= */

if (rulesCard) {

    rulesCard.addEventListener(
        "click",
        function () {

            showToast(
                "Rules system coming soon."
            );
        }
    );
}


/* =========================================================
   ROLES CARD
   ========================================================= */

if (rolesCard) {

    rolesCard.addEventListener(
        "click",
        function () {

            showToast(
                "Roles will be added later."
            );
        }
    );
}


/* =========================================================
   AI CARD
   ========================================================= */

if (aiCard) {

    aiCard.addEventListener(
        "click",
        function () {

            showToast(
                "FriendChat AI will be added later."
            );
        }
    );
}


/* =========================================================
   MUSIC CARD
   ========================================================= */

if (musicCard) {

    musicCard.addEventListener(
        "click",
        function () {

            showToast(
                "Music system will be added later."
            );
        }
    );
}


/* =========================================================
   ACTIVITY CARD
   ========================================================= */

if (activityCard) {

    activityCard.addEventListener(
        "click",
        function () {

            showToast(
                "Activity will be added later."
            );
        }
    );
}


/* =========================================================
   SERVER SETTINGS CARD
   ========================================================= */

if (serverSettingsCard) {

    serverSettingsCard.addEventListener(
        "click",
        function () {

            showToast(
                "Server customization will be added later."
            );
        }
    );
}


/* =========================================================
   TOP MEMBERS BUTTON
   ========================================================= */

const membersButton =
    document.getElementById(
        "membersButton"
    );


if (membersButton) {

    membersButton.addEventListener(
        "click",
        function () {

            showToast(
                "Members system coming next."
            );
        }
    );
}


/* =========================================================
   TOP SETTINGS BUTTON
   ========================================================= */

const settingsButton =
    document.getElementById(
        "settingsButton"
    );


if (settingsButton) {

    settingsButton.addEventListener(
        "click",
        function () {

            showToast(
                "Server settings coming soon."
            );
        }
    );
}


/* =========================================================
   START
   ========================================================= */

loadServer();
