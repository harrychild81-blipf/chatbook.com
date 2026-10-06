/* =========================================================
   FRIENDCHAT
   SERVER MEMBERS
   PHASE 4
   SHARED BACKEND VERSION
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
       ===================================================== */

    const API_BASE = "";


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
    let loadingServer = false;
    let addingMember = false;
    let removingMember = false;


    /* =====================================================
       LOCAL STORAGE KEYS
       ===================================================== */

    const CURRENT_SERVER_KEY = "friendchat_current_server";
    const USER_ID_KEY = "friendchat_user_id";
    const USER_NAME_KEY = "friendchat_user_name";


    /* =====================================================
       CURRENT USER
       ===================================================== */

    function getCurrentUserID() {

        const id = localStorage.getItem(USER_ID_KEY);

        if (!id) {
            return null;
        }

        return String(id)
            .trim()
            .toUpperCase();
    }


    function getCurrentUserName() {

        return (
            localStorage.getItem(USER_NAME_KEY) ||
            "FriendChat User"
        );
    }


    /* =====================================================
       CURRENT SERVER ID
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
       API HELPER
       ===================================================== */

    async function apiRequest(
        url,
        options
    ) {

        const userID =
            getCurrentUserID();

        const requestOptions =
            options || {};

        requestOptions.headers =
            requestOptions.headers || {};

        requestOptions.headers[
            "Content-Type"
        ] = "application/json";


        if (userID) {

            requestOptions.headers[
                "x-friendchat-user-id"
            ] = userID;
        }


        const response =
            await fetch(
                API_BASE + url,
                requestOptions
            );


        let data = null;

        try {

            data =
                await response.json();

        } catch (error) {

            data = null;
        }


        if (!response.ok) {

            const message =
                data &&
                data.error
                    ? data.error
                    : "Something went wrong.";

            throw new Error(message);
        }


        return data;
    }


    /* =====================================================
       LOAD SERVER FROM BACKEND
       ===================================================== */

    async function loadServer() {

        if (loadingServer) {
            return;
        }

        loadingServer = true;


        const serverID =
            getCurrentServerID();


        if (!serverID) {

            loadingServer = false;

            showToast(
                "No server selected."
            );

            setTimeout(
                function () {

                    window.location.href =
                        "create-server.html";

                },
                700
            );

            return;
        }


        try {

            const data =
                await apiRequest(
                    "/api/servers/" +
                    encodeURIComponent(serverID),
                    {
                        method: "GET"
                    }
                );


            if (
                !data ||
                !data.server
            ) {

                throw new Error(
                    "Server could not be found."
                );
            }


            currentServer =
                normalizeServer(
                    data.server
                );


            localStorage.setItem(
                CURRENT_SERVER_KEY,
                currentServer.serverID
            );


            renderServer();
            renderMembers();


        } catch (error) {

            console.error(
                "FriendChat: failed to load server",
                error
            );


            showToast(
                error.message ||
                "Could not load server."
            );


            setTimeout(
                function () {

                    window.location.href =
                        "server-home.html?server=" +
                        encodeURIComponent(serverID);

                },
                1200
            );


        } finally {

            loadingServer = false;
        }
    }


    /* =====================================================
       NORMALIZE SERVER
       ===================================================== */

    function normalizeServer(server) {

        const normalized =
            server || {};


        if (
            !normalized.serverID &&
            normalized.id
        ) {

            normalized.serverID =
                normalized.id;
        }


        if (
            !Array.isArray(
                normalized.members
            )
        ) {

            normalized.members = [];
        }


        if (
            !normalized.ownerID
        ) {

            console.warn(
                "FriendChat: server has no ownerID."
            );
        }


        normalized.members =
            normalized.members.map(
                function (member) {

                    return normalizeMember(
                        member,
                        normalized
                    );

                }
            );


        return normalized;
    }


    /* =====================================================
       NORMALIZE MEMBER
       ===================================================== */

    function normalizeMember(
        member,
        server
    ) {

        if (
            typeof member === "string"
        ) {

            return {

                memberID: member,
                userID: member,

                name: member,
                username: member,

                role:
                    member === server.ownerID
                        ? "Owner"
                        : "Member",

                status: "offline",

                joinedAt:
                    server.createdAt ||
                    new Date().toISOString(),

                avatar: null

            };
        }


        const normalized =
            member || {};


        const memberID =
            normalized.memberID ||
            normalized.userID ||
            normalized.id ||
            "";


        normalized.memberID =
            memberID;


        normalized.userID =
            normalized.userID ||
            memberID;


        normalized.name =
            normalized.name ||
            normalized.username ||
            normalized.displayName ||
            memberID ||
            "Member";


        normalized.username =
            normalized.username ||
            normalized.name;


        normalized.role =
            normalized.role ||
            (
                memberID === server.ownerID
                    ? "Owner"
                    : "Member"
            );


        normalized.status =
            normalized.status ||
            "offline";


        normalized.joinedAt =
            normalized.joinedAt ||
            server.createdAt ||
            new Date().toISOString();


        normalized.avatar =
            normalized.avatar ||
            normalized.profilePhoto ||
            null;


        return normalized;
    }


    /* =====================================================
       SERVER UI
       ===================================================== */

    function renderServer() {

        if (!currentServer) {
            return;
        }


        const name =
            currentServer.name ||
            "Server";


        const description =
            currentServer.description ||
            "Manage the people in your server.";


        if (serverName) {

            serverName.textContent =
                name;
        }


        if (heroServerName) {

            heroServerName.textContent =
                name;
        }


        if (heroDescription) {

            heroDescription.textContent =
                description;
        }


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


            img.src =
                image;


            img.alt =
                "";


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

        if (!member) {
            return "";
        }


        return String(
            member.memberID ||
            member.userID ||
            member.id ||
            ""
        ).trim();
    }


    function getMemberName(member) {

        if (!member) {
            return "Member";
        }


        return (
            member.name ||
            member.username ||
            member.displayName ||
            getMemberID(member) ||
            "Member"
        );
    }


    function isOwner(member) {

        if (
            !currentServer ||
            !member
        ) {

            return false;
        }


        return (
            getMemberID(member)
                .toUpperCase() ===
            String(
                currentServer.ownerID ||
                ""
            ).toUpperCase()
        );
    }


    function isCurrentUser(member) {

        const currentUserID =
            getCurrentUserID();


        if (!currentUserID) {
            return false;
        }


        return (
            getMemberID(member)
                .toUpperCase() ===
            currentUserID
        );
    }


    function isOnline(member) {

        if (!member) {
            return false;
        }


        return (
            member.status === "online" ||
            member.online === true
        );
    }


    /* =====================================================
       CURRENT USER PERMISSION
       ===================================================== */

    function canManageMembers() {

        if (!currentServer) {
            return false;
        }


        const currentUserID =
            getCurrentUserID();


        if (!currentUserID) {
            return false;
        }


        if (
            String(
                currentServer.ownerID ||
                ""
            ).toUpperCase() ===
            currentUserID.toUpperCase()
        ) {

            return true;
        }


        const currentMember =
            currentServer.members.find(
                function (member) {

                    return (
                        getMemberID(member)
                            .toUpperCase() ===
                        currentUserID
                            .toUpperCase()
                    );

                }
            );


        if (!currentMember) {
            return false;
        }


        const role =
            String(
                currentMember.role ||
                ""
            ).toLowerCase();


        return (
            role === "admin" ||
            role === "administrator" ||
            role === "owner"
        );
    }


    /* =====================================================
       RENDER MEMBERS
       ===================================================== */

    function renderMembers() {

        if (!currentServer) {
            return;
        }


        allMembers =
            Array.isArray(
                currentServer.members
            )
                ? currentServer.members
                : [];


        const query =
            String(
                memberSearch &&
                memberSearch.value
                    ? memberSearch.value
                    : ""
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


        if (ownerList) {

            ownerList.innerHTML =
                "";
        }


        if (memberList) {

            memberList.innerHTML =
                "";
        }


        owners.forEach(
            function (member) {

                if (ownerList) {

                    ownerList.appendChild(
                        createMemberCard(member)
                    );
                }
            }
        );


        regularMembers.forEach(
            function (member) {

                if (memberList) {

                    memberList.appendChild(
                        createMemberCard(member)
                    );
                }
            }
        );


        if (memberCount) {

            memberCount.textContent =
                allMembers.length;
        }


        if (ownerCount) {

            ownerCount.textContent =
                owners.length;
        }


        if (regularCount) {

            regularCount.textContent =
                regularMembers.length;
        }


        const hasResults =
            filtered.length > 0;


        if (noResults) {

            noResults.classList.toggle(
                "hidden",
                hasResults
            );
        }


        if (
            ownerList &&
            ownerList.parentElement
        ) {

            ownerList.parentElement.classList.toggle(
                "hidden",
                !hasResults
            );
        }


        if (
            memberList &&
            memberList.parentElement
        ) {

            memberList.parentElement.classList.toggle(
                "hidden",
                !hasResults
            );
        }


        if (clearSearch) {

            clearSearch.style.display =
                query
                    ? "block"
                    : "none";
        }


        updateInviteButtons();
    }


    /* =====================================================
       INVITE BUTTON PERMISSION
       ===================================================== */

    function updateInviteButtons() {

        const allowed =
            canManageMembers();


        if (inviteButton) {

            inviteButton.style.display =
                allowed
                    ? ""
                    : "none";
        }


        if (inviteTopButton) {

            inviteTopButton.style.display =
                allowed
                    ? ""
                    : "none";
        }
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


        nameRow.appendChild(
            name
        );


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

        } else {

            const role =
                String(
                    member.role ||
                    ""
                ).toLowerCase();


            if (
                role === "admin" ||
                role === "administrator"
            ) {

                const badge =
                    document.createElement("span");


                badge.className =
                    "owner-badge";


                badge.textContent =
                    "ADMIN";


                nameRow.appendChild(
                    badge
                );
            }
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


        if (profileName) {

            profileName.textContent =
                getMemberName(member);
        }


        if (profileId) {

            profileId.textContent =
                getMemberID(member);
        }


        if (profileRole) {

            profileRole.textContent =
                isOwner(member)
                    ? "Owner"
                    : (
                        member.role ||
                        "Member"
                    );
        }


        if (profileStatus) {

            profileStatus.textContent =
                isOnline(member)
                    ? "● Online"
                    : "● Offline";


            profileStatus.classList.toggle(
                "online",
                isOnline(member)
            );
        }


        if (profileJoined) {

            profileJoined.textContent =
                formatDate(
                    member.joinedAt
                );
        }


        /*
         * Owner can never be removed.
         *
         * Also don't show the remove button
         * if the current user doesn't have
         * permission to manage members.
         */

        if (
            isOwner(member) ||
            !canManageMembers() ||
            isCurrentUser(member)
        ) {

            if (removeMemberButton) {

                removeMemberButton.style.display =
                    "none";
            }

        } else {

            if (removeMemberButton) {

                removeMemberButton.style.display =
                    "block";
            }
        }


        if (memberModal) {

            memberModal.classList.remove(
                "hidden"
            );
        }
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

        if (!canManageMembers()) {

            showToast(
                "You don't have permission to add members."
            );

            return;
        }


        if (inviteError) {

            inviteError.textContent =
                "";
        }


        if (memberIdInput) {

            memberIdInput.value =
                "";
        }


        if (inviteModal) {

            inviteModal.classList.remove(
                "hidden"
            );
        }


        setTimeout(
            function () {

                if (memberIdInput) {

                    memberIdInput.focus();
                }

            },
            50
        );
    }


    function closeInvite() {

        if (inviteModal) {

            inviteModal.classList.add(
                "hidden"
            );
        }


        if (inviteError) {

            inviteError.textContent =
                "";
        }
    }


    /* =====================================================
       ADD MEMBER
       ===================================================== */

    async function addMember() {

        if (addingMember) {
            return;
        }


        if (!currentServer) {

            showInviteError(
                "Server is not loaded."
            );

            return;
        }


        if (!canManageMembers()) {

            showInviteError(
                "You don't have permission to add members."
            );

            return;
        }


        const currentUserID =
            getCurrentUserID();


        if (!currentUserID) {

            showInviteError(
                "You are not logged in."
            );

            return;
        }


        const rawID =
            memberIdInput
                ? memberIdInput.value.trim()
                : "";


        if (!rawID) {

            showInviteError(
                "Enter a FriendChat ID."
            );

            return;
        }


        const id =
            rawID.toUpperCase();


        if (id.length < 3) {

            showInviteError(
                "Enter a valid FriendChat ID."
            );

            return;
        }


        if (
            id ===
            currentUserID.toUpperCase()
        ) {

            showInviteError(
                "You are already in this server."
            );

            return;
        }


        const exists =
            currentServer.members.some(
                function (member) {

                    return (
                        getMemberID(member)
                            .toUpperCase() ===
                        id
                    );

                }
            );


        if (exists) {

            showInviteError(
                "This member is already in the server."
            );

            return;
        }


        addingMember = true;


        if (confirmInvite) {

            confirmInvite.disabled =
                true;

            confirmInvite.textContent =
                "Adding...";
        }


        try {

            const data =
                await apiRequest(
                    "/api/servers/" +
                    encodeURIComponent(
                        currentServer.serverID
                    ) +
                    "/members",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                userID: id
                            })
                    }
                );


            if (
                data &&
                data.server
            ) {

                currentServer =
                    normalizeServer(
                        data.server
                    );

            } else {

                /*
                 * If backend returns only the
                 * member, reload the server.
                 */

                await refreshServer();
            }


            renderServer();
            renderMembers();

            closeInvite();


            showToast(
                "Member added successfully."
            );


        } catch (error) {

            console.error(
                "FriendChat: failed to add member",
                error
            );


            showInviteError(
                error.message ||
                "Could not add member."
            );


        } finally {

            addingMember = false;


            if (confirmInvite) {

                confirmInvite.disabled =
                    false;

                confirmInvite.textContent =
                    "Add Member";
            }
        }
    }


    /* =====================================================
       INVITE ERROR
       ===================================================== */

    function showInviteError(message) {

        if (inviteError) {

            inviteError.textContent =
                message;
        }
    }


    /* =====================================================
       REFRESH SERVER
       ===================================================== */

    async function refreshServer() {

        if (!currentServer) {
            return;
        }


        const data =
            await apiRequest(
                "/api/servers/" +
                encodeURIComponent(
                    currentServer.serverID
                ),
                {
                    method: "GET"
                }
            );


        if (
            !data ||
            !data.server
        ) {

            throw new Error(
                "Server could not be loaded."
            );
        }


        currentServer =
            normalizeServer(
                data.server
            );


        renderServer();
        renderMembers();
    }


    /* =====================================================
       REMOVE MEMBER
       ===================================================== */

    async function removeCurrentMember() {

        if (removingMember) {
            return;
        }


        if (!currentProfileMember) {
            return;
        }


        if (!currentServer) {
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


        if (!canManageMembers()) {

            showToast(
                "You don't have permission to remove members."
            );

            return;
        }


        const targetID =
            getMemberID(
                currentProfileMember
            );


        if (!targetID) {

            showToast(
                "Invalid member ID."
            );

            return;
        }


        const targetName =
            getMemberName(
                currentProfileMember
            );


        const confirmed =
            window.confirm(
                "Remove " +
                targetName +
                " from this server?"
            );


        if (!confirmed) {
            return;
        }


        removingMember = true;


        if (removeMemberButton) {

            removeMemberButton.disabled =
                true;

            removeMemberButton.textContent =
                "Removing...";
        }


        try {

            await apiRequest(
                "/api/servers/" +
                encodeURIComponent(
                    currentServer.serverID
                ) +
                "/members/" +
                encodeURIComponent(
                    targetID
                ),
                {
                    method: "DELETE"
                }
            );


            /*
             * Reload from backend so every
             * member shown is authoritative.
             */

            await refreshServer();


            if (memberModal) {

                memberModal.classList.add(
                    "hidden"
                );
            }


            currentProfileMember =
                null;


            showToast(
                "Member removed."
            );


        } catch (error) {

            console.error(
                "FriendChat: failed to remove member",
                error
            );


            showToast(
                error.message ||
                "Could not remove member."
            );


        } finally {

            removingMember = false;


            if (removeMemberButton) {

                removeMemberButton.disabled =
                    false;

                removeMemberButton.textContent =
                    "Remove Member";
            }
        }
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

        if (memberSearch) {

            memberSearch.addEventListener(
                "input",
                function () {

                    renderMembers();

                }
            );
        }


        if (clearSearch) {

            clearSearch.addEventListener(
                "click",
                function () {

                    if (memberSearch) {

                        memberSearch.value =
                            "";
                    }


                    renderMembers();


                    if (memberSearch) {

                        memberSearch.focus();
                    }
                }
            );
        }
    }


    /* =====================================================
       NAVIGATION
       ===================================================== */

    function setupNavigation() {

        if (backButton) {

            backButton.addEventListener(
                "click",
                function () {

                    const serverID =
                        getCurrentServerID();


                    if (serverID) {

                        window.location.href =
                            "server-home.html?server=" +
                            encodeURIComponent(
                                serverID
                            );

                    } else {

                        window.location.href =
                            "server-home.html";
                    }
                }
            );
        }
    }


    /* =====================================================
       MODAL EVENTS
       ===================================================== */

    function setupModals() {

        if (inviteButton) {

            inviteButton.addEventListener(
                "click",
                openInviteModal
            );
        }


        if (inviteTopButton) {

            inviteTopButton.addEventListener(
                "click",
                openInviteModal
            );
        }


        if (closeInviteModal) {

            closeInviteModal.addEventListener(
                "click",
                closeInvite
            );
        }


        if (cancelInvite) {

            cancelInvite.addEventListener(
                "click",
                closeInvite
            );
        }


        if (confirmInvite) {

            confirmInvite.addEventListener(
                "click",
                addMember
            );
        }


        if (closeMemberModal) {

            closeMemberModal.addEventListener(
                "click",
                function () {

                    if (memberModal) {

                        memberModal.classList.add(
                            "hidden"
                        );
                    }


                    currentProfileMember =
                        null;
                }
            );
        }


        if (removeMemberButton) {

            removeMemberButton.addEventListener(
                "click",
                removeCurrentMember
            );
        }


        if (inviteModal) {

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
        }


        if (memberModal) {

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
        }


        if (memberIdInput) {

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
        }


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }


                if (
                    inviteModal &&
                    !inviteModal.classList.contains(
                        "hidden"
                    )
                ) {

                    closeInvite();

                    return;
                }


                if (
                    memberModal &&
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


    /* =====================================================
       START
       ===================================================== */

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
