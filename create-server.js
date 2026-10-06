/* =========================================================
   FRIENDCHAT
   CREATE SERVER
   PHASE 1
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

            /* No file selected */

            if (!file) {
                return;
            }


            /* Make sure it is an image */

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


            /* Maximum 5 MB */

            const maxSize =
                5 * 1024 * 1024;

            if (file.size > maxSize) {

                showError(
                    "Server icon must be smaller than 5 MB."
                );

                this.value = "";

                return;
            }


            /* Read image */

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    if (!iconImage) {
                        return;
                    }

                    iconImage.src =
                        event.target.result;

                    iconImage.style.display =
                        "block";


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

if (serverName && nameCounter) {

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
   GET OWNER ID
   ========================================================= */

function getOwnerID() {

    let ownerID = null;


    try {

        ownerID =
            localStorage.getItem(
                "friendchat_user_id"
            );

    } catch (error) {

        console.error(
            "Could not read user ID:",
            error
        );
    }


    /*
     * Temporary ID for the prototype.
     *
     * Later this will come from your
     * real FriendChat login system.
     */

    if (!ownerID) {

        ownerID =
            "user_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8);


        try {

            localStorage.setItem(
                "friendchat_user_id",
                ownerID
            );

        } catch (error) {

            console.error(
                "Could not save user ID:",
                error
            );
        }
    }


    return ownerID;
}


/* =========================================================
   CREATE UNIQUE SERVER ID
   ========================================================= */

function generateServerID() {

    return (
        "srv_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


/* =========================================================
   GET SAVED SERVERS
   ========================================================= */

function getSavedServers() {

    try {

        const saved =
            localStorage.getItem(
                "friendchat_servers"
            );


        if (!saved) {
            return [];
        }


        const servers =
            JSON.parse(saved);


        if (!Array.isArray(servers)) {
            return [];
        }


        return servers;

    } catch (error) {

        console.error(
            "Could not load servers:",
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
            "Could not save servers:",
            error
        );

        return false;
    }
}


/* =========================================================
   CREATE SERVER
   ========================================================= */

function createServer() {

    clearError();


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


    /* Minimum 2 characters */

    if (name.length < 2) {

        showError(
            "Server name must be at least 2 characters."
        );

        if (serverName) {
            serverName.focus();
        }

        return;
    }


    /* Maximum 40 characters */

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
       SERVER ICON
       ===================================================== */

    let icon = null;


    if (
        iconImage &&
        iconImage.src &&
        iconImage.style.display !== "none"
    ) {

        icon =
            iconImage.src;
    }


    /* =====================================================
       CREATE SERVER OBJECT
       ===================================================== */

    const newServer = {

        /* Unique server ID */

        serverID:
            generateServerID(),


        /* Server owner */

        ownerID:
            getOwnerID(),


        /* Basic information */

        name:
            name,

        description:
            description,


        /* Server icon */

        icon:
            icon,


        /* Server creation time */

        createdAt:
            new Date().toISOString(),


        /* =================================================
           INITIAL SERVER DATA

           These will be used in later phases.
           ================================================= */

        channels: [],

        members: [],

        roles: [],

        rules: [],

        invites: [],


        /* Default server settings */

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
       GET EXISTING SERVERS
       ===================================================== */

    const existingServers =
        getSavedServers();


    /* =====================================================
       ADD NEW SERVER
       ===================================================== */

    existingServers.push(
        newServer
    );


    /* =====================================================
       SAVE SERVER
       ===================================================== */

    const saved =
        saveServers(
            existingServers
        );


    if (!saved) {

        showError(
            "Could not save the server. Please try again."
        );

        return;
    }


    /* =====================================================
       SAVE CURRENT SERVER
       ===================================================== */

    try {

        localStorage.setItem(
            "friendchat_current_server",
            newServer.serverID
        );

    } catch (error) {

        console.error(
            "Could not save current server:",
            error
        );
    }


    /* =====================================================
       LOG
       ===================================================== */

    console.log(
        "FriendChat server created:",
        newServer
    );


    /* =====================================================
       OPEN SERVER HOME
       ===================================================== */

    window.location.href =
        "server-home.html";
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

            /*
             * Go back to FriendChat.
             */

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
