/* =========================================================
   FRIENDCHAT
   SERVER HOME
   PHASE 2
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

const toast =
    document.getElementById(
        "toast"
    );

const toastMessage =
    document.getElementById(
        "toastMessage"
    );


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
            JSON.parse(
                localStorage.getItem(
                    "friendchat_servers"
                )
            ) || [];


        if (
            !Array.isArray(savedServers)
        ) {

            return null;
        }


        /*
         * Find the server created in Phase 1.
         */

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
   SET SERVER ICON
   ========================================================= */

function setServerImage(
    imageElement,
    textElement,
    icon,
    initials
) {

    if (
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


    /*
     * No image.
     * Show initials instead.
     */

    imageElement.removeAttribute(
        "src"
    );

    imageElement.style.display =
        "none";

    textElement.textContent =
        initials;

    textElement.style.display =
        "block";
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


        /*
         * Send user back to Create Server.
         */

        window.location.href =
            "create-server.html";

        return;
    }


    /* =====================================================
       SERVER INFORMATION
       ===================================================== */

    const name =
        server.name ||
        "Unnamed Server";


    const description =
        server.description ||
        "Welcome to your FriendChat server.";


    const initials =
        getServerInitials(
            name
        );


    /* =====================================================
       TOP BAR
       ===================================================== */

    topServerName.textContent =
        name;


    setServerImage(
        topServerIcon,
        topServerIconText,
        server.icon,
        initials
    );


    /* =====================================================
       HERO
       ===================================================== */

    serverName.textContent =
        name;


    serverDescription.textContent =
        description;


    serverID.textContent =
        server.serverID ||
        "—";


    setServerImage(
        serverIcon,
        serverIconText,
        server.icon,
        initials
    );


    /* =====================================================
       PREVIEW
       ===================================================== */

    previewName.textContent =
        name;


    setServerImage(
        previewIcon,
        previewIconText,
        server.icon,
        initials
    );


    console.log(
        "FriendChat server loaded:",
        server
    );
}


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

                /*
                 * Fallback for browsers where
                 * Clipboard API is unavailable.
                 */

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
   FUTURE FEATURES
   ========================================================= */

if (channelsCard) {

    channelsCard.addEventListener(
        "click",
        function () {

            showToast(
                "Channels will be added next."
            );
        }
    );
}


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
