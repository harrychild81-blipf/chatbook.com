/* =========================================================
   FRIENDCHAT
   SERVER MEMBERS
   PHASE 4
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ELEMENT HELPER
       ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    /* =====================================================
       DOM
       ===================================================== */

    const backButton = $("backButton");

    const serverMiniIcon = $("serverMiniIcon");
    const heroServerIcon = $("heroServerIcon");

    const serverName = $("serverName");
    const heroServerName = $("heroServerName");
    const heroDescription = $("heroDescription");

    const memberCount = $("memberCount");
    const ownerCount = $("ownerCount");
    const regularCount = $("regularCount");

    const memberSearch = $("memberSearch");
    const clearSearch = $("clearSearch");

    const ownerList = $("ownerList");
    const memberList = $("memberList");
    const noResults = $("noResults");

    const inviteButton = $("inviteButton");
    const inviteTopButton = $("inviteTopButton");

    const inviteModal = $("inviteModal");
    const closeInviteModal = $("closeInviteModal");
    const cancelInvite = $("cancelInvite");
    const confirmInvite = $("confirmInvite");

    const memberIdInput = $("memberIdInput");
    const inviteError = $("inviteError");

    const memberModal = $("memberModal");
    const closeMemberModal = $("closeMemberModal");

    const profileAvatar = $("profileAvatar");
    const profileStatus = $("profileStatus");
    const profileName = $("profileName");
    const profileId = $("profileId");
    const profileRole = $("profileRole");
    const profileJoined = $("profileJoined");
    const removeMemberButton = $("removeMemberButton");

    const toast = $("toast");


    /* =====================================================
       STATE
       ===================================================== */

    let currentServer = null;
    let allMembers = [];
    let currentProfileMember = null;

    let toastTimer = null;


    /* =====================================================
       STORAGE
       ===================================================== */

    const SERVERS_KEY = "friendchat_servers";
    const CURRENT_SERVER_KEY = "friendchat_current_server";
    const USER_ID_KEY = "friendchat_user_id";
    const USER_NAME_KEY = "friendchat_user_name";


    function getSavedServers() {

        try {

            const raw = localStorage.getItem(SERVERS_KEY);

            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);

            return Array.isArray(parsed) ? parsed : [];

        } catch (error) {

            console.error(
                "FriendChat: could not read servers",
                error
            );

            return [];
        }
    }


    function saveServers(servers) {

        localStorage.setItem(
            SERVERS_KEY,
            JSON.stringify(servers)
        );
    }


    /* =====================================================
       CURRENT USER
       ===================================================== */

    function getCurrentUserID() {

        let id =
            localStorage.getItem(USER_ID_KEY);

        if (!id) {

            id =
                "FC-" +
                Math.random()
                    .toString(36)
                    .substring(2, 8)
                    .toUpperCase();

            localStorage.setItem(
                USER_ID_KEY,
                id
            );
        }

        return id;
    }


    function getCurrentUserName() {

        return (
            localStorage.getItem(USER_NAME_KEY) ||
            "You"
        );
    }


    /* =====================================================
       SERVER ID
       ===================================================== */

    function getCurrentServerID() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const urlServer =
            params.get("server");

        if (urlServer) {

            localStorage.setItem(
                CURRENT_SERVER_KEY,
                urlServer
            );

            return urlServer;
        }


        return localStorage.getItem(
            CURRENT_SERVER_KEY
        );
    }


    /* =====================================================
       LOAD SERVER
       ===================================================== */

    function loadServer() {

        const serverID =
            getCurrentServerID();

        const servers =
            getSavedServers();

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


        currentServer =
            servers.find(function (server) {

                return (
                    server.serverID === serverID ||
                    server.id === serverID
                );

            });


        if (!currentServer) {

            showToast(
                "Server could not be found."
            );

            setTimeout(function () {

                window.location.href =
                    "create-server.html";

            }, 900);

            return;
        }


        /*
         * Make sure required arrays exist.
         */

        if (!Array.isArray(currentServer.members)) {

            currentServer.members = [];
        }


        /*
         * Make sure owner exists as a member.
         */

        ensureOwnerMember();


        /*
         * Save updated server.
         */

        saveCurrentServer();


        renderServer();
        renderMembers();
    }


    /* =====================================================
       OWNER
       ===================================================== */

    function ensureOwnerMember() {

        const ownerID =
            currentServer.ownerID ||
            getCurrentUserID();


        currentServer.ownerID =
            ownerID;


        const existingOwner =
            currentServer.members.find(
                function (member) {

                    return (
                        getMemberID(member) ===
                        ownerID
                    );

                }
            );


        if (!existingOwner) {

            currentServer.members.unshift({

                memberID: ownerID,

                userID: ownerID,

                name:
                    currentServer.ownerName ||
                    getCurrentUserName(),

                username:
                    currentServer.ownerName ||
                    getCurrentUserName(),

                role: "Owner",

                status: "online",

                joinedAt:
                    currentServer.createdAt ||
                    new Date().toISOString(),

                avatar: null

            });

        } else {

            /*
             * Make sure owner has Owner role.
             */

            existingOwner.role =
                "Owner";
        }
    }


    /* =====================================================
       SAVE CURRENT SERVER
       ===================================================== */

    function saveCurrentServer() {

        const servers =
            getSavedServers();

        const index =
            servers.findIndex(
                function (server) {

                    return (
                        server.serverID ===
                            currentServer.serverID ||
                        server.id ===
                            currentServer.id
                    );

                }
            );


        if (index >= 0) {

            servers[index] =
                currentServer;

        } else {

            servers.push(
                currentServer
            );
        }


        saveServers(servers);


        if (currentServer.serverID) {

            localStorage.setItem(
                CURRENT_SERVER_KEY,
                currentServer.serverID
            );
        }
    }


    /* =====================================================
       SERVER UI
       ===================================================== */

    function renderServer() {

        const name =
            currentServer.name ||
            "Server";


        const description =
            currentServer.description ||
            "Manage the people in your server.";


        serverName.textContent =
            name;

        heroServerName.textContent =
            name;

        heroDescription.textContent =
            description;


        setImageOrInitial(
            serverMiniIcon,
            currentServer.icon,
            name
        );


        setImageOrInitial(
            heroServerIcon,
            currentServer.icon,
            name
        );
    }


    /* =====================================================
       INITIALS
       ===================================================== */

    function getInitials(name) {

        if (!name) {
            return "FC";
        }


        const words =
            String(name)
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


    /* =====================================================
       IMAGE / INITIAL
       ===================================================== */

    function setImageOrInitial(
        element,
        image,
        name
    ) {

        if (!element) {
            return;
        }


        element.innerHTML = "";


        if (image) {

            const img =
                document.createElement("img");

            img.src = image;

            img.alt = "";

            img.onerror =
                function () {

                    element.innerHTML =
                        "";

                    element.textContent =
                        getInitials(name);
                };


            element.appendChild(img);

        } else {

            element.textContent =
                getInitials(name);
        }
    }


    /* =====================================================
       MEMBER HELPERS
       ===================================================== */

    function getMemberID(member) {

        return (
            member.memberID ||
            member.userID ||
            member.id ||
            ""
        );
    }


    function getMemberName(member) {

        return (
            member.name ||
            member.username ||
            member.displayName ||
            getMemberID(member) ||
            "Member"
        );
    }


    function isOwner(member) {

        return (
            getMemberID(member) ===
            currentServer.ownerID
        );
    }


    function isOnline(member) {

        return (
            member.status === "online" ||
            member.online === true
        );
    }


    /* =====================================================
       RENDER MEMBERS
       ===================================================== */

    function renderMembers() {

        allMembers =
            Array.isArray(
                currentServer.members
            )
                ? currentServer.members
                : [];


        const query =
            String(
                memberSearch.value || ""
            )
                .trim()
                .toLowerCase();


        const filtered =
            allMembers.filter(
                function (member) {

                    if (!query) {
                        return true;
                    }


                    const name =
                        getMemberName(member)
                            .toLowerCase();


                    const id =
                        getMemberID(member)
                            .toLowerCase();


                    return (
                        name.includes(query) ||
                        id.includes(query)
                    );

                }
            );


        const owners =
            filtered.filter(
                function (member) {

                    return isOwner(member);

                }
            );


        const regularMembers =
            filtered.filter(
                function (member) {

                    return !isOwner(member);

                }
            );


        ownerList.innerHTML = "";
        memberList.innerHTML = "";


        owners.forEach(
            function (member) {

                ownerList.appendChild(
                    createMemberCard(member)
                );

            }
        );


        regularMembers.forEach(
            function (member) {

                memberList.appendChild(
                    createMemberCard(member)
                );

            }
        );


        memberCount.textContent =
            allMembers.length;


        ownerCount.textContent =
            owners.length;


        regularCount.textContent =
            regularMembers.length;


        const hasResults =
            filtered.length > 0;


        noResults.classList.toggle(
            "hidden",
            hasResults
        );


        if (hasResults) {

            ownerList.parentElement.classList.remove(
                "hidden"
            );

            memberList.parentElement.classList.remove(
                "hidden"
            );

        } else {

            ownerList.parentElement.classList.add(
                "hidden"
            );

            memberList.parentElement.classList.add(
                "hidden"
            );
        }


        clearSearch.style.display =
            query
                ? "block"
                : "none";
    }


    /* =====================================================
       MEMBER CARD
       ===================================================== */

    function createMemberCard(member) {

        const card =
            document.createElement("div");

        card.className =
            "member-card";


        const avatar =
            document.createElement("div");

        avatar.className =
            "member-avatar";


        setImageOrInitial(
            avatar,
            member.avatar ||
                member.profilePhoto ||
                null,
            getMemberName(member)
        );


        const dot =
            document.createElement("span");

        dot.className =
            "online-dot";


        if (isOnline(member)) {

            dot.classList.add(
                "online"
            );
        }


        avatar.appendChild(dot);


        const info =
            document.createElement("div");

        info.className =
            "member-info";


        const nameRow =
            document.createElement("div");

        nameRow.className =
            "member-name-row";


        const name =
            document.createElement("div");

        name.className =
            "member-name";

        name.textContent =
            getMemberName(member);


        nameRow.appendChild(name);


        if (isOwner(member)) {

            const badge =
                document.createElement("span");

            badge.className =
                "owner-badge";

            badge.textContent =
                "OWNER";

            nameRow.appendChild(
                badge
            );
        }


        const id =
            document.createElement("div");

        id.className =
            "member-id";

        id.textContent =
            getMemberID(member);


        info.appendChild(
            nameRow
        );

        info.appendChild(
            id
        );


        const right =
            document.createElement("div");

        right.className =
            "member-right";


        const status =
            document.createElement("span");

        status.className =
            "status-text";

        status.textContent =
            isOnline(member)
                ? "Online"
                : "Offline";


        const arrow =
            document.createElement("span");

        arrow.className =
            "member-arrow";

        arrow.textContent =
            "›";


        right.appendChild(
            status
        );

        right.appendChild(
            arrow
        );


        card.appendChild(
            avatar
        );

        card.appendChild(
            info
        );

        card.appendChild(
            right
        );


        card.addEventListener(
            "click",
            function () {

                openMemberProfile(
                    member
                );

            }
        );


        return card;
    }


    /* =====================================================
       OPEN MEMBER PROFILE
       ===================================================== */

    function openMemberProfile(member) {

        currentProfileMember =
            member;


        setImageOrInitial(
            profileAvatar,
            member.avatar ||
                member.profilePhoto ||
                null,
            getMemberName(member)
        );


        profileName.textContent =
            getMemberName(member);


        profileId.textContent =
            getMemberID(member);


        profileRole.textContent =
            isOwner(member)
                ? "Owner"
                : (
                    member.role ||
                    "Member"
                );


        profileStatus.textContent =
            isOnline(member)
                ? "● Online"
                : "● Offline";


        profileStatus.classList.toggle(
            "online",
            isOnline(member)
        );


        profileJoined.textContent =
            formatDate(
                member.joinedAt
            );


        /*
         * Never allow the owner to be removed.
         */

        if (isOwner(member)) {

            removeMemberButton.style.display =
                "none";

        } else {

            removeMemberButton.style.display =
                "block";
        }


        memberModal.classList.remove(
            "hidden"
        );
    }


    /* =====================================================
       DATE
       ===================================================== */

    function formatDate(value) {

        if (!value) {
            return "—";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";
        }


        return date.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       INVITE MODAL
       ===================================================== */

    function openInviteModal() {

        inviteError.textContent =
            "";

        memberIdInput.value =
            "";

        inviteModal.classList.remove(
            "hidden"
        );


        setTimeout(
            function () {

                memberIdInput.focus();

            },
            50
        );
    }


    function closeInvite() {

        inviteModal.classList.add(
            "hidden"
        );

        inviteError.textContent =
            "";
    }


    /* =====================================================
       ADD MEMBER
       ===================================================== */

    function addMember() {

        const id =
            memberIdInput.value
                .trim();


        if (!id) {

            inviteError.textContent =
                "Enter a FriendChat ID.";

            return;
        }


        if (id.length < 3) {

            inviteError.textContent =
                "Enter a valid FriendChat ID.";

            return;
        }


        const exists =
            currentServer.members.some(
                function (member) {

                    return (
                        getMemberID(member)
                            .toLowerCase() ===
                        id.toLowerCase()
                    );

                }
            );


        if (exists) {

            inviteError.textContent =
                "This member is already in the server.";

            return;
        }


        /*
         * Prototype member creation.
         *
         * Later this will be replaced with
         * a real user lookup + invitation system.
         */

        const newMember = {

            memberID: id,

            userID: id,

            name: id,

            username: id,

            role: "Member",

            status: "offline",

            joinedAt:
                new Date().toISOString(),

            avatar: null

        };


        currentServer.members.push(
            newMember
        );


        saveCurrentServer();


        renderMembers();


        closeInvite();


        showToast(
            "Member added successfully."
        );
    }


    /* =====================================================
       REMOVE MEMBER
       ===================================================== */

    function removeCurrentMember() {

        if (!currentProfileMember) {
            return;
        }


        if (
            isOwner(
                currentProfileMember
            )
        ) {

            showToast(
                "The server owner cannot be removed."
            );

            return;
        }


        const id =
            getMemberID(
                currentProfileMember
            );


        const confirmed =
            window.confirm(
                "Remove " +
                getMemberName(
                    currentProfileMember
                ) +
                " from this server?"
            );


        if (!confirmed) {
            return;
        }


        currentServer.members =
            currentServer.members.filter(
                function (member) {

                    return (
                        getMemberID(member) !==
                        id
                    );

                }
            );


        saveCurrentServer();


        memberModal.classList.add(
            "hidden"
        );


        currentProfileMember =
            null;


        renderMembers();


        showToast(
            "Member removed."
        );
    }


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(message) {

        if (!toast) {
            return;
        }


        toast.textContent =
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
                2300
            );
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    function setupSearch() {

        memberSearch.addEventListener(
            "input",
            function () {

                renderMembers();

            }
        );


        clearSearch.addEventListener(
            "click",
            function () {

                memberSearch.value =
                    "";

                renderMembers();

                memberSearch.focus();

            }
        );
    }


    /* =====================================================
       NAVIGATION
       ===================================================== */

    function setupNavigation() {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "server-home.html";

            }
        );
    }


    /* =====================================================
       MODAL EVENTS
       ===================================================== */

    function setupModals() {

        inviteButton.addEventListener(
            "click",
            openInviteModal
        );


        inviteTopButton.addEventListener(
            "click",
            openInviteModal
        );


        closeInviteModal.addEventListener(
            "click",
            closeInvite
        );


        cancelInvite.addEventListener(
            "click",
            closeInvite
        );


        confirmInvite.addEventListener(
            "click",
            addMember
        );


        closeMemberModal.addEventListener(
            "click",
            function () {

                memberModal.classList.add(
                    "hidden"
                );

                currentProfileMember =
                    null;
            }
        );


        removeMemberButton.addEventListener(
            "click",
            removeCurrentMember
        );


        inviteModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    inviteModal
                ) {

                    closeInvite();
                }

            }
        );


        memberModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    memberModal
                ) {

                    memberModal.classList.add(
                        "hidden"
                    );

                    currentProfileMember =
                        null;
                }

            }
        );


        memberIdInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addMember();
                }


                if (
                    event.key ===
                    "Escape"
                ) {

                    closeInvite();
                }

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    if (
                        !inviteModal.classList.contains(
                            "hidden"
                        )
                    ) {

                        closeInvite();

                    } else if (
                        !memberModal.classList.contains(
                            "hidden"
                        )
                    ) {

                        memberModal.classList.add(
                            "hidden"
                        );

                        currentProfileMember =
                            null;
                    }
                }

            }
        );
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        setupNavigation();

        setupSearch();

        setupModals();

        loadServer();
    }


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
