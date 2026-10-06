/* =========================================================
   FRIENDCHAT
   CREATE SERVER
   PHASE 1
   SHARED SERVER SYSTEM
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
   IMPORTANT:

   The same FriendChat backend serves the website.

   Therefore:

       /api/servers

   automatically goes to the same backend.

   We do NOT use localhost here because the website
   may be running on your laptop, phone, or Render.
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
        openIconPicker
    );

}


/* =========================================================
   ICON PREVIEW CLICK
   ========================================================= */

if (serverIconPreview) {

    serverIconPreview.addEventListener(
        "click",
        openIconPicker
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

        return;

    }


    errorMessage.textContent =
        message;

}


function clearError() {

    if (!errorMessage) {

        return;

    }


    errorMessage.textContent =
        "";

}


/* =========================================================
   GET CURRENT USER ID
   ========================================================= */

function getOwnerID() {

    let ownerID = "";


    try {

        ownerID =
            localStorage.getItem(
                "friendchat_user_id"
            ) || "";

    }

    catch (error) {

        console.error(
            "Could not read FriendChat user ID:",
            error
        );

    }


    ownerID =
        String(ownerID)
            .trim()
            .toUpperCase();


    /*
       IMPORTANT:

       Do NOT create a random ID here anymore.

       The backend needs the real logged-in
       FriendChat account.

       If there is no ID, the user must log in.
    */

    if (!ownerID) {

        return null;

    }


    return ownerID;

}


/* =========================================================
   GET CURRENT USER NAME
   ========================================================= */

function getOwnerName() {

    let name = "";


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


    return String(
        name || "FriendChat User"
    ).trim();

}


/* =========================================================
   GENERATE SERVER ID
   ========================================================= */

function generateServerID() {

    const randomPart =
        Math.random()
            .toString(36)
            .substring(2, 10)
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
        iconImage.style.display !== "none"
    ) {

        /*
           Make sure it is actually an image/data URL.
        */

        if (
            iconImage.src.startsWith("data:image/")
        ) {

            return iconImage.src;

        }

    }


    return null;

}


/* =========================================================
   CREATE SERVER ON BACKEND
   ========================================================= */

async function createServerOnBackend(
    serverData
) {

    const response =
        await fetch(
            API_BASE + "/api/servers",
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        serverData
                    )

            }
        );


    let result = null;


    try {

        result =
            await response.json();

    }

    catch (error) {

        result = null;

    }


    if (!response.ok) {

        throw new Error(
            result &&
            result.error
                ? result.error
                : "Could not create the server."
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
   =========================================================

   This is ONLY for navigation.

   It is NOT the database anymore.
   ========================================================= */

function saveCurrentServerID(
    serverID
) {

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
       GET USER
       ===================================================== */

    const ownerID =
        getOwnerID();


    if (!ownerID) {

        showError(
            "Please log in to FriendChat before creating a server."
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

    if (description.length > 200) {

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
       CREATE SERVER OBJECT
       ===================================================== */

    const newServer = {

        serverID:
            generateServerID(),

        ownerID:
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
            new Date().toISOString(),


        /*
           OWNER IS AUTOMATICALLY
           THE FIRST SERVER MEMBER.
        */

        members: [

            {

                userID:
                    ownerID,

                name:
                    ownerName,

                role:
                    "owner",

                joinedAt:
                    new Date().toISOString()

            }

        ],


        /*
           Channels will be added in
           the channel phase.
        */

        channels: [],


        /*
           Roles will be added later.
        */

        roles: [],


        /*
           Rules will be added later.
        */

        rules: [],


        /*
           Invitations will be handled
           by the backend.
        */

        invites: [],


        /*
           Default settings.
        */

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

        createServerButton.dataset.originalText =
            createServerButton.textContent;

        createServerButton.textContent =
            "Creating...";

    }


    try {

        /* =================================================
           SEND SERVER TO BACKEND
           ================================================= */

        const createdServer =
            await createServerOnBackend(
                newServer
            );


        /* =================================================
           SAVE ONLY CURRENT SERVER ID
           ================================================= */

        saveCurrentServerID(
            createdServer.serverID
        );


        console.log(
            "FriendChat shared server created:",
            createdServer
        );


        /* =================================================
           OPEN SERVER HOME
           ================================================= */

        window.location.href =
            "server-home.html";

    }

    catch (error) {

        console.error(
            "Create server error:",
            error
        );


        showError(
            error.message ||
            "Could not create the server. Please try again."
        );


        if (createServerButton) {

            createServerButton.disabled =
                false;

            createServerButton.textContent =
                createServerButton.dataset.originalText ||
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
        createServer
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
                event.key === "Enter"
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
        function () {

            if (
                window.history.length > 1
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
