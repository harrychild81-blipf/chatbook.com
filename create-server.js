/* =========================================================
   FRIENDCHAT
   CREATE SERVER - PHASE 1
   ========================================================= */


/* =========================================================
   GET ELEMENTS
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
    document.getElementById(
        "descriptionCounter"
    );


/* =========================================================
   SERVER ICON PICKER
   ========================================================= */

function openIconPicker() {

    serverIcon.click();
}


/*
 * Click "Upload server icon"
 */

uploadIconButton.addEventListener(
    "click",
    openIconPicker
);


/*
 * Click the actual icon preview
 */

serverIconPreview.addEventListener(
    "click",
    openIconPicker
);


/* =========================================================
   ICON SELECTION
   ========================================================= */

serverIcon.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];


        /*
         * User cancelled file picker.
         */

        if (!file) {
            return;
        }


        /*
         * Make sure the selected file
         * is actually an image.
         */

        if (
            !file.type.startsWith("image/")
        ) {

            showError(
                "Please select an image file."
            );

            this.value = "";

            return;
        }


        /*
         * 5 MB maximum for this prototype.
         */

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            showError(
                "Server icon must be smaller than 5 MB."
            );

            this.value = "";

            return;
        }


        /*
         * Read the selected image.
         */

        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                iconImage.src =
                    event.target.result;

                iconImage.style.display =
                    "block";

                iconText.style.display =
                    "none";

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


/* =========================================================
   NAME CHARACTER COUNTER
   ========================================================= */

serverName.addEventListener(
    "input",
    function () {

        nameCounter.textContent =
            this.value.length;
    }
);


/* =========================================================
   DESCRIPTION CHARACTER COUNTER
   ========================================================= */

serverDescription.addEventListener(
    "input",
    function () {

        descriptionCounter.textContent =
            this.value.length;
    }
);


/* =========================================================
   ERROR FUNCTIONS
   ========================================================= */

function showError(message) {

    errorMessage.textContent =
        message;
}


function clearError() {

    errorMessage.textContent =
        "";
}


/* =========================================================
   CREATE SERVER BUTTON
   ========================================================= */

createServerButton.addEventListener(
    "click",
    createServer
);


function createServer() {

    clearError();


    /*
     * Get form values.
     */

    const name =
        serverName.value.trim();

    const description =
        serverDescription.value.trim();


    /* =====================================================
       VALIDATE SERVER NAME
       ===================================================== */

    if (!name) {

        showError(
            "Please enter a server name."
        );

        serverName.focus();

        return;
    }


    if (name.length < 2) {

        showError(
            "Server name must be at least 2 characters."
        );

        serverName.focus();

        return;
    }


    /* =====================================================
       CREATE SERVER ID
       ===================================================== */

    const serverID =
        "srv_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8);


    /* =====================================================
       GET SERVER ICON
       ===================================================== */

    let icon = null;


    if (
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

        serverID: serverID,

        ownerID: getOwnerID(),

        name: name,

        description: description,

        icon: icon,

        createdAt:
            new Date().toISOString()
    };


    /* =====================================================
       GET EXISTING SERVERS
       ===================================================== */

    let existingServers = [];


    try {

        existingServers =
            JSON.parse(
                localStorage.getItem(
                    "friendchat_servers"
                )
            ) || [];

    } catch (error) {

        console.error(
            "Could not read saved servers:",
            error
        );

        existingServers = [];
    }


    /* =====================================================
       ADD NEW SERVER
       ===================================================== */

    existingServers.push(
        newServer
    );


    /* =====================================================
       SAVE SERVERS
       ===================================================== */

    try {

        localStorage.setItem(
            "friendchat_servers",
            JSON.stringify(
                existingServers
            )
        );

        localStorage.setItem(
            "friendchat_current_server",
            serverID
        );

    } catch (error) {

        console.error(
            "Could not save server:",
            error
        );

        showError(
            "Could not save the server in this browser."
        );

        return;
    }


    /* =====================================================
       SERVER CREATED
       ===================================================== */

    console.log(
        "FriendChat server created:",
        newServer
    );


    /*
     * For Phase 1 we show the result.
     *
     * Later we will replace this with:
     *
     * create-server.html
     *       ↓
     * server-home.html
     *
     * without using an alert.
     */

    showCreatedMessage(
        newServer
    );
}


/* =========================================================
   OWNER ID
   ========================================================= */

function getOwnerID() {

    /*
     * First try to use your existing FriendChat
     * login user ID.
     */

    let ownerID =
        localStorage.getItem(
            "friendchat_user_id"
        );


    /*
     * If your current login system hasn't
     * created one yet, make a temporary ID.
     */

    if (!ownerID) {

        ownerID =
            "user_" +
            Math.random()
                .toString(36)
                .substring(2, 10);


        localStorage.setItem(
            "friendchat_user_id",
            ownerID
        );
    }


    return ownerID;
}


/* =========================================================
   CREATED MESSAGE
   ========================================================= */

function showCreatedMessage(server) {

    /*
     * For now use a simple message.
     *
     * We will build the actual Server Home
     * in the next phase.
     */

    alert(
        "Server created successfully!\n\n" +
        "Server: " +
        server.name +
        "\n\n" +
        "Server ID: " +
        server.serverID
    );


    console.log(
        "Created server:",
        server
    );
}


/* =========================================================
   CANCEL
   ========================================================= */

cancelButton.addEventListener(
    "click",
    function () {

        /*
         * Go back to the previous page.
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
