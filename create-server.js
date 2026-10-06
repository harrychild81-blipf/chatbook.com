/* =========================================================
   FRIENDCHAT
   CREATE SERVER - PHASE 1
   ========================================================= */


/* ELEMENTS */

const serverName = document.getElementById("serverName");

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
   SERVER ICON
   ========================================================= */

function openIconPicker() {
    serverIcon.click();
}


uploadIconButton.addEventListener(
    "click",
    openIconPicker
);


serverIconPreview.addEventListener(
    "click",
    openIconPicker
);


serverIcon.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) {
            return;
        }


        /*
         * Only allow image files.
         */

        if (!file.type.startsWith("image/")) {

            showError(
                "Please select an image file."
            );

            this.value = "";

            return;
        }


        /*
         * Limit image size for this prototype.
         */

        if (file.size > 5 * 1024 * 1024) {

            showError(
                "Server icon must be smaller than 5 MB."
            );

            this.value = "";

            return;
        }


        const reader = new FileReader();


        reader.onload = function (event) {

            iconImage.src =
                event.target.result;

            iconImage.style.display =
                "block";

            iconText.style.display =
                "none";

        };


        reader.readAsDataURL(file);

        clearError();
    }
);


/* =========================================================
   CHARACTER COUNTERS
   ========================================================= */

serverName.addEventListener(
    "input",
    function () {

        nameCounter.textContent =
            this.value.length;
    }
);


serverDescription.addEventListener(
    "input",
    function () {

        descriptionCounter.textContent =
            this.value.length;
    }
);


/* =========================================================
   ERROR
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
   CREATE SERVER
   ========================================================= */

createServerButton.addEventListener(
    "click",
    createServer
);


function createServer() {

    clearError();


    const name =
        serverName.value.trim();


    const description =
        serverDescription.value.trim();


    /*
     * Server name is required.
     */

    if (!name) {

        showError(
            "Please enter a server name."
        );

        serverName.focus();

        return;
    }


    /*
     * Minimum name length.
     */

    if (name.length < 2) {

        showError(
            "Server name must be at least 2 characters."
        );

        serverName.focus();

        return;
    }


    /*
     * Create a unique local server ID.
     */

    const serverID =
        "srv_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8);


    /*
     * Get selected icon.
     *
     * For Phase 1 we store it as a data URL.
     * Later this will be uploaded to the FriendChat
     * backend/object storage.
     */

    const icon =
        iconImage.src || null;


    /*
     * Server object.
     */

    const newServer = {

        serverID: serverID,

        name: name,

        description: description,

        icon: icon,

        createdAt:
            new Date().toISOString(),

        ownerID:
            getOwnerID()
    };


    /*
     * Save for prototype.
     */

    const existingServers =
        JSON.parse(
            localStorage.getItem(
                "friendchat_servers"
            )
        ) || [];


    existingServers.push(
        newServer
    );


    localStorage.setItem(
        "friendchat_servers",
        JSON.stringify(
            existingServers
        )
    );


    /*
     * Remember the server we just created.
     */

    localStorage.setItem(
        "friendchat_current_server",
        serverID
    );


    /*
     * Open the server.
     */

    openServer(
        newServer
    );
}


/* =========================================================
   OWNER ID
   ========================================================= */

function getOwnerID() {

    /*
     * If your existing FriendChat login system
     * already has a user ID, later we will replace
     * this with that ID.
     */

    let ownerID =
        localStorage.getItem(
            "friendchat_user_id"
        );


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
   OPEN SERVER
   ========================================================= */

function openServer(server) {

    /*
     * Phase 1 doesn't have the complete server
     * dashboard yet.
     *
     * For now we show a confirmation and keep
     * the server data saved.
     */

    alert(
        "Server created successfully!\n\n" +
        "Name: " +
        server.name +
        "\n\n" +
        "Server ID: " +
        server.serverID
    );


    console.log(
        "FriendChat server created:",
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
         * For now return to the previous page.
         */

        if (window.history.length > 1) {

            window.history.back();

        } else {

            window.location.href =
                "../index.html";
        }
    }
);
