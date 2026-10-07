/* =========================================================
   FRIENDCHAT
   CREATE SERVER
   PHASE 1
   SHARED SERVER SYSTEM

   COMPLETE FIXED VERSION

   FEATURES:
   - Correct logged-in user detection
   - Sends ownerID
   - Sends userID
   - Sends x-friendchat-user-id
   - Sends Authorization token when available
   - Server icon support
   - Server name validation
   - Server description validation
   - Default general channel
   - Default Owner + Member roles
   - Saves current server
   - Opens server-home.html
   - Better error handling
   - Prevents duplicate creation
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
   API BASE
   ========================================================= */

/*
   Empty string means use the same website/backend.

   Example:

   https://friendchat.in
          ↓
   https://friendchat.in/api/servers

   Local:

   http://localhost:8080
          ↓
   http://localhost:8080/api/servers
*/

const API_BASE = "";


/* =========================================================
   OPEN IMAGE PICKER
   ========================================================= */

function openIconPicker() {

    if (!serverIcon) {
        return;
    }

    serverIcon.click();

}


/* =========================================================
   UPLOAD ICON BUTTON
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
   SERVER ICON CHANGE
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
               CHECK IMAGE TYPE
               ----------------------------------------- */

            if (
                !file.type ||
                !file.type.startsWith("image/")
            ) {

                showError(
                    "Please select a valid image file."
                );

                this.value = "";

                return;

            }


            /* -----------------------------------------
               MAX FILE SIZE
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
   SERVER DESCRIPTION COUNTER
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
   ERROR MESSAGE
   ========================================================= */

function showError(message) {

    const text =
        String(
            message || ""
        );


    if (!errorMessage) {

        console.error(
            "FriendChat:",
            text
        );

        return;

    }


    errorMessage.textContent =
        text;


    errorMessage.style.display =
        text
            ? "block"
            : "";

}


function clearError() {

    if (!errorMessage) {
        return;
    }


    errorMessage.textContent =
        "";


    errorMessage.style.display =
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
   READ JSON FROM LOCAL STORAGE
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

    catch (error) {

        console.warn(
            "FriendChat: Could not parse localStorage:",
            key
        );

        return null;

    }

}


/* =========================================================
   GET CURRENT USER ID
   ========================================================= */

function getOwnerID() {

    let ownerID =
        "";


    /* -----------------------------------------
       PRIMARY FRIENDCHAT USER ID
       ----------------------------------------- */

    try {

        ownerID =
            localStorage.getItem(
                "friendchat_user_id"
            ) || "";

    }

    catch (error) {

        console.error(
            "FriendChat: Could not read user ID:",
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


    /* -----------------------------------------
       USER OBJECT FALLBACK
       ----------------------------------------- */

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


    /* -----------------------------------------
       DIRECT KEY FALLBACK
       ----------------------------------------- */

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
       NEVER generate a fake user ID.

       The backend must receive the
       actual FriendChat account ID.
    */

    return null;

}


/* =========================================================
   GET CURRENT USER NAME
   ========================================================= */

function getOwnerName() {

    let name =
        "";


    /* -----------------------------------------
       DIRECT NAME
       ----------------------------------------- */

    try {

        name =
            localStorage.getItem(
                "friendchat_user_name"
            ) || "";

    }

    catch (error) {

        console.error(
            "FriendChat: Could not read user name:",
            error
        );

    }


    name =
        String(
            name || ""
        ).trim();


    if (name) {

        return name;

    }


    /* -----------------------------------------
       USER OBJECT FALLBACK
       ----------------------------------------- */

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


            if (possibleName) {

                return String(
                    possibleName
                ).trim();

            }

        }

    }


    return "FriendChat User";

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
        !iconImage ||
        !iconImage.src
    ) {

        return null;

    }


    if (
        iconImage.style.display ===
        "none"
    ) {

        return null;

    }


    if (
        iconImage.src.startsWith(
            "data:image/"
        )
    ) {

        return iconImage.src;

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
           Backend can use this to identify
           the logged-in FriendChat account.
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
        "FriendChat: Sending server creation request."
    );


    console.log(
        "FriendChat: Owner ID:",
        ownerID
    );


    console.log(
        "FriendChat: Server data:",
        serverData
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

    catch (error) {

        console.warn(
            "FriendChat: Server response was not JSON."
        );

    }


    console.log(
        "FriendChat: Server response status:",
        response.status
    );


    console.log(
        "FriendChat: Server response:",
        result
    );


    /* -----------------------------------------
       BACKEND ERROR
       ----------------------------------------- */

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


        const lowerMessage =
            message.toLowerCase();


        if (
            lowerMessage.includes(
                "owner account was not found"
            ) ||
            lowerMessage.includes(
                "owner not found"
            ) ||
            lowerMessage.includes(
                "account was not found"
            )
        ) {

            message =
                "Your FriendChat account could not be found by the server. Please log out and log back in, then try again.";

        }


        if (
            lowerMessage.includes(
                "unauthorized"
            ) ||
            lowerMessage.includes(
                "not authorized"
            )
        ) {

            message =
                "You are not authorized to create a server. Please log out and log back in.";

        }


        if (
            lowerMessage.includes(
                "failed to fetch"
            )
        ) {

            message =
                "Could not connect to the FriendChat server. Check that your backend is running.";

        }


        throw new Error(
            message
        );

    }


    /* -----------------------------------------
       INVALID RESPONSE
       ----------------------------------------- */

    if (
        !result ||
        !result.server
    ) {

        console.error(
            "FriendChat: Invalid backend response:",
            result
        );


        throw new Error(
            "The backend returned an invalid server response."
        );

    }


    return result.server;

}


/* =========================================================
   SAVE CURRENT SERVER
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


        console.log(
            "FriendChat: Current server saved:",
            serverID
        );

    }

    catch (error) {

        console.error(
            "FriendChat: Could not save current server:",
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
            "FriendChat: Created server has no ID."
        );


        showError(
            "Server was created, but no server ID was returned."
        );


        return;

    }


    saveCurrentServerID(
        serverID
    );


    console.log(
        "FriendChat: Opening created server:",
        serverID
    );


    /*
       Directly pass the server ID
       through the URL.
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


    /* -----------------------------------------
       PREVENT DOUBLE CLICK
       ----------------------------------------- */

    if (
        createServerButton &&
        createServerButton.disabled
    ) {

        return;

    }


    /* -----------------------------------------
       GET OWNER ID
       ----------------------------------------- */

    const ownerID =
        getOwnerID();


    console.log(
        "FriendChat: Current logged-in user:",
        ownerID
    );


    if (!ownerID) {

        showError(
            "Your FriendChat account was not found. Please log out and log back in."
        );


        return;

    }


    /* -----------------------------------------
       GET OWNER NAME
       ----------------------------------------- */

    const ownerName =
        getOwnerName();


    /* -----------------------------------------
       GET SERVER NAME
       ----------------------------------------- */

    const name =
        serverName
            ? serverName.value.trim()
            : "";


    /* -----------------------------------------
       GET DESCRIPTION
       ----------------------------------------- */

    const description =
        serverDescription
            ? serverDescription.value.trim()
            : "";


    /* =====================================================
       VALIDATE SERVER NAME
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
       GET SERVER ICON
       ===================================================== */

    const icon =
        getServerIcon();


    /* =====================================================
       CREATE DATE
       ===================================================== */

    const createdAt =
        new Date().toISOString();


    /* =====================================================
       CREATE SERVER ID
       ===================================================== */

    const serverID =
        generateServerID();


    /* =====================================================
       CREATE SERVER OBJECT
       ===================================================== */

    const newServer = {

        /* -----------------------------------------
           SERVER ID
           ----------------------------------------- */

        serverID:
            serverID,


        /* -----------------------------------------
           OWNER
           ----------------------------------------- */

        ownerID:
            ownerID,


        /* -----------------------------------------
           USER ID COMPATIBILITY
           ----------------------------------------- */

        userID:
            ownerID,


        /* -----------------------------------------
           OWNER NAME
           ----------------------------------------- */

        ownerName:
            ownerName,


        /* -----------------------------------------
           SERVER NAME
           ----------------------------------------- */

        name:
            name,


        /* -----------------------------------------
           DESCRIPTION
           ----------------------------------------- */

        description:
            description,


        /* -----------------------------------------
           ICON
           ----------------------------------------- */

        icon:
            icon,


        /* -----------------------------------------
           CREATED AT
           ----------------------------------------- */

        createdAt:
            createdAt,


        /* =================================================
           MEMBERS
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
           CHANNELS
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
           ROLES
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
           SERVER RULES
           ================================================= */

        rules: [],


        /* =================================================
           INVITES
           ================================================= */

        invites: [],


        /* =================================================
           SERVER SETTINGS
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


    console.log(
        "FriendChat: Creating server object:",
        newServer
    );


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


    /* =====================================================
       SEND SERVER TO BACKEND
       ===================================================== */

    try {

        const createdServer =
            await createServerOnBackend(
                newServer,
                ownerID
            );


        console.log(
            "FriendChat: Server created:",
            createdServer
        );


        /* -----------------------------------------
           GET REAL SERVER ID
           ----------------------------------------- */

        const createdServerID =
            createdServer.serverID ||
            createdServer.id ||
            serverID;


        if (!createdServerID) {

            throw new Error(
                "Server was created but the server ID is missing."
            );

        }


        /* -----------------------------------------
           SAVE SERVER
           ----------------------------------------- */

        saveCurrentServerID(
            createdServerID
        );


        /* -----------------------------------------
           OPTIONAL EVENT
           ----------------------------------------- */

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "friendchat:server-created",
                    {
                        detail: {
                            server:
                                createdServer
                        }
                    }
                )
            );

        }

        catch (_) {}


        /* -----------------------------------------
           OPEN SERVER
           ----------------------------------------- */

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
            error &&
            error.message
                ? error.message
                : "Could not create the server. Please try again."
        );


        /* -----------------------------------------
           RESTORE BUTTON
           ----------------------------------------- */

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
   CREATE SERVER BUTTON
   ========================================================= */

if (createServerButton) {

    createServerButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

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
   CANCEL BUTTON
   ========================================================= */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


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
   INITIAL NAME COUNTER
   ========================================================= */

if (
    serverName &&
    nameCounter
) {

    nameCounter.textContent =
        serverName.value.length;

}


/* =========================================================
   INITIAL DESCRIPTION COUNTER
   ========================================================= */

if (
    serverDescription &&
    descriptionCounter
) {

    descriptionCounter.textContent =
        serverDescription.value.length;

}


/* =========================================================
   DEBUG
   ========================================================= */

console.log(
    "=========================================="
);

console.log(
    "FriendChat Create Server JS loaded."
);

console.log(
    "Logged-in user:",
    getOwnerID()
);

console.log(
    "=========================================="
);
