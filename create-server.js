/* =========================================================
   FRIENDCHAT
   CREATE SERVER
   PHASE 1
   SHARED SERVER SYSTEM

   FIXED VERSION

   FIXES:
   - Correct logged-in user ID
   - Sends ownerID
   - Sends userID
   - Sends x-friendchat-user-id header
   - Sends authorization token when available
   - Better localStorage account detection
   - Correct server navigation
   - Prevents fake owner IDs
   - Better error messages
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const serverName =
    document.getElementById("serverName");

const serverDescription =
    document.getElementById("serverDescription");

const serverIcon =
    document.getElementById("serverIcon");

const serverIconPreview =
    document.getElementById("serverIconPreview");

const iconImage =
    document.getElementById("iconImage");

const iconText =
    document.getElementById("iconText");

const uploadIconButton =
    document.getElementById("uploadIconButton");

const createServerButton =
    document.getElementById("createServerButton");

const cancelButton =
    document.getElementById("cancelButton");

const errorMessage =
    document.getElementById("errorMessage");

const nameCounter =
    document.getElementById("nameCounter");

const descriptionCounter =
    document.getElementById("descriptionCounter");


/* =========================================================
   API
   ========================================================= */

/*
   Empty API_BASE means:

       current website
              ↓
       same backend

   This works with:

       localhost
       laptop LAN IP
       Render
       custom domain

*/

const API_BASE = "";


/* =========================================================
   OPEN IMAGE PICKER
   ========================================================= */

function openIconPicker() {

    if (serverIcon) {

        serverIcon.click();

    }

}


/* =========================================================
   UPLOAD BUTTON
   ========================================================= */

if (uploadIconButton) {

    uploadIconButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openIconPicker();

        }
    );

}


/* =========================================================
   ICON PREVIEW CLICK
   ========================================================= */

if (serverIconPreview) {

    serverIconPreview.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            openIconPicker();

        }
    );

}


/* =========================================================
   SELECT SERVER ICON
   ========================================================= */

if (serverIcon) {

    serverIcon.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files[0];


            if (!file) {

                return;

            }


            /* -----------------------------------------
               CHECK IMAGE
               ----------------------------------------- */

            if (
                !file.type ||
                !file.type.startsWith("image/")
            ) {

                showError(
                    "Please select an image file."
                );

                this.value = "";

                return;

            }


            /* -----------------------------------------
               MAX 5 MB
               ----------------------------------------- */

            const maxSize =
                5 * 1024 * 1024;


            if (file.size > maxSize) {

                showError(
                    "Server icon must be smaller than 5 MB."
                );

                this.value = "";

                return;

            }


            /* -----------------------------------------
               READ IMAGE
               ----------------------------------------- */

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    if (iconImage) {

                        iconImage.src =
                            event.target.result;

                        iconImage.style.display =
                            "block";

                    }


                    if (iconText) {

                        iconText.style.display =
                            "none";

                    }


                    clearError();

                };


            reader.onerror =
                function () {

                    showError(
                        "Could not read the selected image."
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   SERVER NAME COUNTER
   ========================================================= */

if (
    serverName &&
    nameCounter
) {

    serverName.addEventListener(
        "input",
        function () {

            nameCounter.textContent =
                this.value.length;

        }
    );

}


/* =========================================================
   DESCRIPTION COUNTER
   ========================================================= */

if (
    serverDescription &&
    descriptionCounter
) {

    serverDescription.addEventListener(
        "input",
        function () {

            descriptionCounter.textContent =
                this.value.length;

        }
    );

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    if (!errorMessage) {

        console.error(
            "FriendChat:",
            message
        );

        return;

    }


    errorMessage.textContent =
        String(message || "");

}


function clearError() {

    if (!errorMessage) {

        return;

    }


    errorMessage.textContent =
        "";

}


/* =========================================================
   NORMALIZE USER ID
   ========================================================= */

function normalizeUserID(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .trim()
        .toUpperCase();

}


/* =========================================================
   READ JSON LOCAL STORAGE VALUE
   ========================================================= */

function readLocalStorageObject(key) {

    try {

        const raw =
            localStorage.getItem(key);


        if (!raw) {

            return null;

        }


        return JSON.parse(raw);

    }

    catch (_) {

        return null;

    }

}


/* =========================================================
   GET CURRENT USER ID
   ========================================================= */

function getOwnerID() {

    /*
       Primary FriendChat account ID.
    */

    let ownerID =
        "";


    try {

        ownerID =
            localStorage.getItem(
                "friendchat_user_id"
            ) || "";

    }

    catch (error) {

        console.error(
            "Could not read friendchat_user_id:",
            error
        );

    }


    ownerID =
        normalizeUserID(
            ownerID
        );


    if (ownerID) {

        return ownerID;

    }


    /*
       ------------------------------------------------------
       FALLBACK 1
       ------------------------------------------------------

       Some FriendChat versions may store the
       logged-in account object.
    */

    const possibleObjects = [

        "friendchat_user",

        "friendchat_current_user",

        "currentUser",

        "user",

        "friendchat_account"

    ];


    for (
        const key of possibleObjects
    ) {

        const object =
            readLocalStorageObject(
                key
            );


        if (
            object &&
            typeof object ===
                "object"
        ) {

            const possibleID =
                normalizeUserID(
                    object.userID ||
                    object.userId ||
                    object.id ||
                    object.ID
                );


            if (possibleID) {

                return possibleID;

            }

        }

    }


    /*
       ------------------------------------------------------
       FALLBACK 2
       ------------------------------------------------------

       Try common direct localStorage keys.
    */

    const possibleKeys = [

        "userID",

        "userId",

        "currentUserID",

        "currentUserId",

        "fc_user_id"

    ];


    for (
        const key of possibleKeys
    ) {

        try {

            const value =
                normalizeUserID(
                    localStorage.getItem(
                        key
                    )
                );


            if (value) {

                return value;

            }

        }

        catch (_) {}

    }


    /*
       IMPORTANT:

       Do NOT generate a random ID.

       The backend must receive the real
       FriendChat account ID.
    */

    return null;

}


/* =========================================================
   GET CURRENT USER NAME
   ========================================================= */

function getOwnerName() {

    let name =
        "";


    try {

        name =
            localStorage.getItem(
                "friendchat_user_name"
            ) || "";

    }

    catch (error) {

        console.error(
            "Could not read FriendChat user name:",
            error
        );

    }


    /*
       If direct name doesn't exist,
       check saved user object.
    */

    if (!name) {

        const possibleObjects = [

            "friendchat_user",

            "friendchat_current_user",

            "currentUser",

            "user",

            "friendchat_account"

        ];


        for (
            const key of possibleObjects
        ) {

            const object =
                readLocalStorageObject(
                    key
                );


            if (
                object &&
                typeof object ===
                    "object"
            ) {

                const possibleName =
                    object.name ||
                    object.displayName ||
                    object.username;


                if (
                    possibleName
                ) {

                    name =
                        String(
                            possibleName
                        ).trim();


                    break;

                }

            }

        }

    }


    return String(
        name || "FriendChat User"
    ).trim();

}


/* =========================================================
   GET AUTH TOKEN
   ========================================================= */

function getAuthToken() {

    const possibleKeys = [

        "friendchat_token",

        "friendchat_auth_token",

        "authToken",

        "token",

        "friendchat_session"

    ];


    for (
        const key of possibleKeys
    ) {

        try {

            const value =
                localStorage.getItem(
                    key
                );


            if (
                value &&
                String(value).trim()
            ) {

                return String(
                    value
                ).trim();

            }

        }

        catch (_) {}

    }


    return "";

}


/* =========================================================
   GENERATE SERVER ID
   ========================================================= */

function generateServerID() {

    const randomPart =
        Math.random()
            .toString(36)
            .substring(
                2,
                10
            )
            .toUpperCase();


    const timePart =
        Date.now()
            .toString(36)
            .toUpperCase();


    return (
        "FC-SRV-" +
        timePart +
        "-" +
        randomPart
    );

}


/* =========================================================
   GET SERVER ICON
   ========================================================= */

function getServerIcon() {

    if (
        iconImage &&
        iconImage.src &&
        iconImage.style.display !==
            "none"
    ) {

        if (
            iconImage.src.startsWith(
                "data:image/"
            )
        ) {

            return iconImage.src;

        }

    }


    return null;

}


/* =========================================================
   BUILD REQUEST HEADERS
   ========================================================= */

function getServerRequestHeaders(
    ownerID
) {

    const headers = {

        "Content-Type":
            "application/json",

        "Accept":
            "application/json",

        /*
           IMPORTANT:

           Backend can use this header
           to identify the logged-in user.
        */

        "x-friendchat-user-id":
            ownerID

    };


    const token =
        getAuthToken();


    if (token) {

        headers.Authorization =
            token.startsWith(
                "Bearer "
            )
                ? token
                : "Bearer " + token;

    }


    return headers;

}


/* =========================================================
   CREATE SERVER ON BACKEND
   ========================================================= */

async function createServerOnBackend(
    serverData,
    ownerID
) {

    const headers =
        getServerRequestHeaders(
            ownerID
        );


    console.log(
        "FriendChat: Creating server."
    );


    console.log(
        "FriendChat: Owner ID:",
        ownerID
    );


    const response =
        await fetch(
            API_BASE +
            "/api/servers",
            {

                method:
                    "POST",

                headers:
                    headers,

                credentials:
                    "include",

                body:
                    JSON.stringify(
                        serverData
                    )

            }
        );


    let result =
        null;


    try {

        result =
            await response.json();

    }

    catch (_) {

        result =
            null;

    }


    if (!response.ok) {

        let message =
            "Could not create the server.";


        if (
            result &&
            result.error
        ) {

            message =
                String(
                    result.error
                );

        }


        /*
           Give a more useful message
           for the exact error from your screenshot.
        */

        if (
            message
                .toLowerCase()
                .includes(
                    "owner account was not found"
                )
        ) {

            message =
                "Your FriendChat account could not be found by the server. Please log out and log back in, then try again.";

        }


        throw new Error(
            message
        );

    }


    if (
        !result ||
        !result.server
    ) {

        throw new Error(
            "The backend returned an invalid server response."
        );

    }


    return result.server;

}


/* =========================================================
   SAVE CURRENT SERVER LOCALLY
   ========================================================= */

function saveCurrentServerID(
    serverID
) {

    if (!serverID) {

        return;

    }


    try {

        localStorage.setItem(
            "friendchat_current_server",
            String(serverID)
        );

    }

    catch (error) {

        console.error(
            "Could not save current server:",
            error
        );

    }

}


/* =========================================================
   OPEN CREATED SERVER
   ========================================================= */

function openCreatedServer(
    serverID
) {

    if (!serverID) {

        console.error(
            "FriendChat: Created server has no server ID."
        );


        showError(
            "Server was created, but no server ID was returned."
        );


        return;

    }


    saveCurrentServerID(
        serverID
    );


    /*
       Pass the server ID directly.

       This is safer than relying only
       on localStorage.
    */

    window.location.href =
        "server-home.html?server=" +
        encodeURIComponent(
            serverID
        );

}


/* =========================================================
   CREATE SERVER
   ========================================================= */

async function createServer() {

    clearError();


    /* =====================================================
       PREVENT DOUBLE CLICK
       ===================================================== */

    if (
        createServerButton &&
        createServerButton.disabled
    ) {

        return;

    }


    /* =====================================================
       GET LOGGED-IN USER
       ===================================================== */

    const ownerID =
        getOwnerID();


    console.log(
        "FriendChat: Current owner ID:",
        ownerID
    );


    if (!ownerID) {

        showError(
            "Your FriendChat account was not found. Please log out and log back in."
        );


        return;

    }


    const ownerName =
        getOwnerName();


    /* =====================================================
       GET VALUES
       ===================================================== */

    const name =
        serverName
            ? serverName.value.trim()
            : "";


    const description =
        serverDescription
            ? serverDescription.value.trim()
            : "";


    /* =====================================================
       VALIDATE NAME
       ===================================================== */

    if (!name) {

        showError(
            "Please enter a server name."
        );


        if (serverName) {

            serverName.focus();

        }


        return;

    }


    if (name.length < 2) {

        showError(
            "Server name must be at least 2 characters."
        );


        if (serverName) {

            serverName.focus();

        }


        return;

    }


    if (name.length > 40) {

        showError(
            "Server name cannot be longer than 40 characters."
        );


        if (serverName) {

            serverName.focus();

        }


        return;

    }


    /* =====================================================
       VALIDATE DESCRIPTION
       ===================================================== */

    if (
        description.length >
        200
    ) {

        showError(
            "Description cannot be longer than 200 characters."
        );


        if (serverDescription) {

            serverDescription.focus();

        }


        return;

    }


    /* =====================================================
       SERVER ICON
       ===================================================== */

    const icon =
        getServerIcon();


    /* =====================================================
       TIME
       ===================================================== */

    const createdAt =
        new Date().toISOString();


    /* =====================================================
       CREATE SERVER OBJECT
       ===================================================== */

    const newServer = {

        /*
           The backend may generate its own
           server ID.

           We still provide one so older
           backend versions continue working.
        */

        serverID:
            generateServerID(),


        /*
           MAIN OWNER IDENTIFIER
        */

        ownerID:
            ownerID,


        /*
           ALSO SEND userID FOR BACKEND
           COMPATIBILITY
        */

        userID:
            ownerID,


        ownerName:
            ownerName,


        name:
            name,


        description:
            description,


        icon:
            icon,


        createdAt:
            createdAt,


        /* =================================================
           OWNER MEMBER
           ================================================= */

        members: [

            {

                userID:
                    ownerID,

                name:
                    ownerName,

                role:
                    "owner",

                joinedAt:
                    createdAt

            }

        ],


        /* =================================================
           DEFAULT CHANNELS
           ================================================= */

        channels: [

            {

                channelID:
                    "general",

                id:
                    "general",

                name:
                    "general",

                type:
                    "text",

                createdAt:
                    createdAt

            }

        ],


        /* =================================================
           DEFAULT ROLES
           ================================================= */

        roles: [

            {

                roleID:
                    "owner",

                id:
                    "owner",

                name:
                    "Owner",

                color:
                    "#6c63ff",

                permissions: [
                    "all"
                ]

            },

            {

                roleID:
                    "member",

                id:
                    "member",

                name:
                    "Member",

                color:
                    "#9ca3af",

                permissions: [
                    "send_messages",
                    "read_messages"
                ]

            }

        ],


        /* =================================================
           RULES
           ================================================= */

        rules: [],


        /* =================================================
           INVITES
           ================================================= */

        invites: [],


        /* =================================================
           SETTINGS
           ================================================= */

        settings: {

            theme:
                "dark",

            accentColor:
                "#6c63ff",

            background:
                null

        }

    };


    /* =====================================================
       BUTTON STATE
       ===================================================== */

    if (createServerButton) {

        createServerButton.disabled =
            true;


        createServerButton.dataset
            .originalText =
            createServerButton.textContent;


        createServerButton.textContent =
            "Creating...";

    }


    try {

        /* =================================================
           SEND TO BACKEND
           ================================================= */

        const createdServer =
            await createServerOnBackend(
                newServer,
                ownerID
            );


        console.log(
            "FriendChat: Server created successfully:",
            createdServer
        );


        /* =================================================
           GET REAL SERVER ID
           ================================================= */

        const createdServerID =
            createdServer.serverID ||
            createdServer.id;


        if (!createdServerID) {

            throw new Error(
                "Server was created but the server ID is missing."
            );

        }


        /* =================================================
           SAVE CURRENT SERVER
           ================================================= */

        saveCurrentServerID(
            createdServerID
        );


        /* =================================================
           OPEN SERVER
           ================================================= */

        openCreatedServer(
            createdServerID
        );

    }

    catch (error) {

        console.error(
            "FriendChat: Create server error:",
            error
        );


        showError(
            error.message ||
            "Could not create the server. Please try again."
        );


        /* =================================================
           RESTORE BUTTON
           ================================================= */

        if (createServerButton) {

            createServerButton.disabled =
                false;


            createServerButton.textContent =
                createServerButton.dataset
                    .originalText ||
                "Create Server";

        }

    }

}


/* =========================================================
   CREATE BUTTON
   ========================================================= */

if (createServerButton) {

    createServerButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            createServer();

        }
    );

}


/* =========================================================
   ENTER KEY
   ========================================================= */

if (serverName) {

    serverName.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                createServer();

            }

        }
    );

}


/* =========================================================
   CANCEL
   ========================================================= */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            if (
                window.history.length >
                1
            ) {

                window.history.back();

            }

            else {

                window.location.href =
                    "index.html";

            }

        }
    );

}


/* =========================================================
   INITIAL COUNTERS
   ========================================================= */

if (
    serverName &&
    nameCounter
) {

    nameCounter.textContent =
        serverName.value.length;

}


if (
    serverDescription &&
    descriptionCounter
) {

    descriptionCounter.textContent =
        serverDescription.value.length;

}


/* =========================================================
   DEBUG INFORMATION
   ========================================================= */

console.log(
    "FriendChat Create Server loaded."
);


console.log(
    "FriendChat logged-in user:",
    getOwnerID()
);
