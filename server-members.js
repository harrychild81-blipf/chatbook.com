/* =========================================================
   FRIENDCHAT
   SERVER MEMBERS
   COMPLETE FIXED VERSION
   OWNER + ADMIN MEMBER MANAGEMENT
   CODESPACES / LOCAL BACKEND SUPPORT
   ========================================================= */

(function () {

    "use strict";

    /* =====================================================
       CONFIG
       ===================================================== */

    /*
     * If your frontend and backend are on the SAME server:
     * leave this empty.
     *
     * If using GitHub Codespaces with a separate frontend,
     * set this before loading this JS:
     *
     * window.FRIENDCHAT_API_BASE =
     *     "https://YOUR-CODESPACE-8080.app.github.dev";
     *
     * You can also save the API URL in localStorage:
     *
     * localStorage.setItem(
     *     "friendchat_api_base",
     *     "https://YOUR-CODESPACE-8080.app.github.dev"
     * );
     */

    const API_BASE =
        String(
            window.FRIENDCHAT_API_BASE ||
            localStorage.getItem("friendchat_api_base") ||
            ""
        )
            .trim()
            .replace(/\/+$/, "");


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

    const memberIdInputElement = $("memberIdInput");

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
       LOCAL STORAGE
       ===================================================== */

    const CURRENT_SERVER_KEY =
        "friendchat_current_server";

    const USER_ID_KEY =
        "friendchat_user_id";

    const USER_NAME_KEY =
        "friendchat_user_name";


    /* =====================================================
       CURRENT USER
       ===================================================== */

    function getCurrentUserID() {

        const id =
            localStorage.getItem(
                USER_ID_KEY
            );

        if (!id) {
            return null;
        }

        return String(id)
            .trim()
            .toUpperCase();
    }


    function getCurrentUserName() {

        return (
            localStorage.getItem(
                USER_NAME_KEY
            ) ||
            "FriendChat User"
        );
    }


    /* =====================================================
       CURRENT SERVER
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
       MEMBER INPUT FINDER
       ===================================================== */

    function getMemberIDInput() {

        const candidates = [];

        if (memberIdInputElement) {
            candidates.push(
                memberIdInputElement
            );
        }

        const selectors = [
            "#memberIdInput",
            'input[name="memberIdInput"]',
            'input[name="memberID"]',
            'input[name="memberId"]',
            'input[name="userID"]',
            'input[name="userId"]',
            'input[data-member-id]',
            'input[data-user-id]'
        ];

        selectors.forEach(
            function (selector) {

                try {

                    document
                        .querySelectorAll(selector)
                        .forEach(
                            function (element) {

                                if (
                                    !candidates.includes(
                                        element
                                    )
                                ) {

                                    candidates.push(
                                        element
                                    );
                                }
                            }
                        );

                } catch (error) {

                    console.warn(
                        "FriendChat: invalid selector",
                        selector
                    );
                }
            }
        );


        /* Prefer visible input */

        for (
            let i = 0;
            i < candidates.length;
            i++
        ) {

            const element =
                candidates[i];

            if (
                element &&
                element.tagName === "INPUT" &&
                !element.disabled
            ) {

                const style =
                    window.getComputedStyle(
                        element
                    );

                const visible =
                    style.display !== "none" &&
                    style.visibility !== "hidden" &&
                    element.offsetParent !== null;

                if (visible) {
                    return element;
                }
            }
        }

        return candidates[0] || null;
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
            options
                ? {
                    ...options
                }
                : {};

        const headers = {
            ...(requestOptions.headers || {})
        };


        /*
         * JSON requests.
         */

        if (
            !headers["Content-Type"] &&
            !headers["content-type"]
        ) {

            headers["Content-Type"] =
                "application/json";
        }


        /*
         * Important:
         * The backend uses the FriendChat user ID
         * instead of cookie authentication.
         */

        if (userID) {

            headers[
                "x-friendchat-user-id"
            ] = userID;
        }

        requestOptions.headers =
            headers;


        const fullURL =
            API_BASE + url;


        console.log(
            "FriendChat API:",
            requestOptions.method || "GET",
            fullURL
        );

        console.log(
            "FriendChat requester:",
            userID
        );


        let response;

        try {

            response =
                await fetch(
                    fullURL,
                    requestOptions
                );

        } catch (networkError) {

            console.error(
                "FriendChat network error:",
                networkError
            );

            throw new Error(
                "Cannot connect to FriendChat server. Check your backend/API URL."
            );
        }


        let data = null;

        try {

            data =
                await response.json();

        } catch (_) {

            data = null;
        }


        if (!response.ok) {

            const message =
                data &&
                (
                    data.error ||
                    data.message
                )
                    ? (
                        data.error ||
                        data.message
                    )
                    : (
                        "Server returned HTTP " +
                        response.status
                    );


            console.error(
                "FriendChat API error:",
                response.status,
                data
            );


            throw new Error(
                message
            );
        }


        return data;
    }


    /* =====================================================
       LOAD SERVER
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
                    encodeURIComponent(
                        serverID
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


            /*
             * Do not immediately redirect on API
             * errors. This makes debugging much easier.
             */

        } finally {

            loadingServer = false;
        }
    }


    /* =====================================================
       NORMALIZE SERVER
       ===================================================== */

    function normalizeServer(server) {

        const normalized = {
            ...(server || {})
        };


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

            const memberID =
                String(member).trim();


            const owner =
                String(
                    server.ownerID || ""
                )
                    .trim()
                    .toUpperCase();


            return {

                memberID: memberID,

                userID: memberID,

                name: memberID,

                username: memberID,

                role:
                    memberID.toUpperCase() === owner
                        ? "owner"
                        : "member",

                status: "offline",

                joinedAt:
                    server.createdAt ||
                    new Date().toISOString(),

                avatar: null
            };
        }


        const normalized = {
            ...(member || {})
        };


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


        /*
         * IMPORTANT FIX:
         *
         * Do NOT turn admin into member.
         */

        const existingRole =
            String(
                normalized.role || ""
            )
                .trim()
                .toLowerCase();


        const isServerOwner =
            String(memberID)
                .trim()
                .toUpperCase() ===
            String(
                server.ownerID || ""
            )
                .trim()
                .toUpperCase();


        if (isServerOwner) {

            normalized.role =
                "owner";

        } else if (
            existingRole === "admin" ||
            existingRole === "administrator"
        ) {

            normalized.role =
                "admin";

        } else {

            normalized.role =
                "member";
        }


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
                document.createElement(
                    "img"
                );


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


            element.appendChild(
                img
            );

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
            )
                .trim()
                .toUpperCase()
        );
    }


    function isAdmin(member) {

        if (!member) {
            return false;
        }


        if (isOwner(member)) {
            return true;
        }


        const role =
            String(
                member.role || ""
            )
                .trim()
                .toLowerCase();


        return (
            role === "admin" ||
            role === "administrator"
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
       PERMISSIONS
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


        const ownerID =
            String(
                currentServer.ownerID ||
                ""
            )
                .trim()
                .toUpperCase();


        const requesterID =
            currentUserID
                .trim()
                .toUpperCase();


        /*
         * OWNER
         */

        if (
            ownerID ===
            requesterID
        ) {

            return true;
        }


        /*
         * ADMIN
         */

        const currentMember =
            currentServer.members.find(
                function (member) {

                    return (
                        getMemberID(member)
                            .trim()
                            .toUpperCase() ===
                        requesterID
                    );
                }
            );


        if (!currentMember) {
            return false;
        }


        const role =
            String(
                currentMember.role || ""
            )
                .trim()
                .toLowerCase();


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
            ownerList.innerHTML = "";
        }


        if (memberList) {
            memberList.innerHTML = "";
        }


        owners.forEach(
            function (member) {

                if (ownerList) {

                    ownerList.appendChild(
                        createMemberCard(
                            member
                        )
                    );
                }
            }
        );


        regularMembers.forEach(
            function (member) {

                if (memberList) {

                    memberList.appendChild(
                        createMemberCard(
                            member
                        )
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
       INVITE BUTTONS
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
            document.createElement(
                "div"
            );

        card.className =
            "member-card";


        const avatar =
            document.createElement(
                "div"
            );

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
            document.createElement(
                "span"
            );

        dot.className =
            "online-dot";


        if (isOnline(member)) {

            dot.classList.add(
                "online"
            );
        }


        avatar.appendChild(
            dot
        );


        const info =
            document.createElement(
                "div"
            );

        info.className =
            "member-info";


        const nameRow =
            document.createElement(
                "div"
            );

        nameRow.className =
            "member-name-row";


        const name =
            document.createElement(
                "div"
            );

        name.className =
            "member-name";


        name.textContent =
            getMemberName(member);


        nameRow.appendChild(
            name
        );


        if (isOwner(member)) {

            const badge =
                document.createElement(
                    "span"
                );

            badge.className =
                "owner-badge";

            badge.textContent =
                "OWNER";

            nameRow.appendChild(
                badge
            );

        } else if (isAdmin(member)) {

            const badge =
                document.createElement(
                    "span"
                );

            badge.className =
                "owner-badge";

            badge.textContent =
                "ADMIN";

            nameRow.appendChild(
                badge
            );
        }


        const id =
            document.createElement(
                "div"
            );

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
            document.createElement(
                "div"
            );

        right.className =
            "member-right";


        const status =
            document.createElement(
                "span"
            );

        status.className =
            "status-text";

        status.textContent =
            isOnline(member)
                ? "Online"
                : "Offline";


        const arrow =
            document.createElement(
                "span"
            );

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
       MEMBER PROFILE
       ===================================================== */

    function openMemberProfile(
        member
    ) {

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
                        isAdmin(member)
                            ? "Admin"
                            : "Member"
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

            inviteError.style.display =
                "";
        }


        const input =
            getMemberIDInput();


        if (input) {
            input.value = "";
        }


        if (inviteModal) {

            inviteModal.classList.remove(
                "hidden"
            );
        }


        setTimeout(
            function () {

                const activeInput =
                    getMemberIDInput();


                if (activeInput) {

                    activeInput.focus();

                    try {

                        const length =
                            activeInput.value.length;

                        activeInput.setSelectionRange(
                            length,
                            length
                        );

                    } catch (_) {}
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

            inviteError.style.display =
                "";
        }
    }


    /* =====================================================
       FRIENDCHAT ID
       ===================================================== */

    function normalizeFriendChatID(
        value
    ) {

        return String(
            value || ""
        )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");
    }


    function isValidFriendChatID(id) {

        if (!id) {
            return false;
        }


        return id.length >= 3;
    }


    /* =====================================================
       ADD MEMBER
       ===================================================== */

    async function addMember(
        event
    ) {

        if (event) {

            event.preventDefault();
            event.stopPropagation();
        }


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


        const input =
            getMemberIDInput();


        if (!input) {

            console.error(
                "FriendChat: memberIdInput was not found."
            );

            showInviteError(
                "Member ID field was not found."
            );

            return;
        }


        const rawValue =
            String(
                input.value || ""
            ).trim();


        console.log(
            "FriendChat: Add Member input:",
            rawValue
        );


        if (!rawValue) {

            showInviteError(
                "Enter a FriendChat ID."
            );

            input.focus();

            return;
        }


        const id =
            normalizeFriendChatID(
                rawValue
            );


        if (!isValidFriendChatID(id)) {

            showInviteError(
                "Enter a valid FriendChat ID."
            );

            input.focus();

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
                            .trim()
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

            console.log(
                "========================================"
            );

            console.log(
                "FRIENDCHAT ADD MEMBER"
            );

            console.log(
                "API BASE:",
                API_BASE
            );

            console.log(
                "SERVER ID:",
                currentServer.serverID
            );

            console.log(
                "REQUESTER ID:",
                currentUserID
            );

            console.log(
                "TARGET MEMBER ID:",
                id
            );

            console.log(
                "========================================"
            );


            /*
             * IMPORTANT FIX:
             *
             * Send requesterID explicitly.
             *
             * This makes the backend know exactly
             * which user is performing the action.
             */

            const requestBody = {

                requesterID:
                    currentUserID,

                requesterId:
                    currentUserID,

                currentUserID:
                    currentUserID,

                currentUserId:
                    currentUserID,

                userID:
                    id,

                userId:
                    id,

                memberID:
                    id,

                memberId:
                    id
            };


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
                            JSON.stringify(
                                requestBody
                            )
                    }
                );


            console.log(
                "FriendChat: add member response:",
                data
            );


            if (
                data &&
                data.server
            ) {

                currentServer =
                    normalizeServer(
                        data.server
                    );


                localStorage.setItem(
                    CURRENT_SERVER_KEY,
                    currentServer.serverID
                );


            } else {

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

    function showInviteError(
        message
    ) {

        console.warn(
            "FriendChat invite error:",
            message
        );


        if (inviteError) {

            inviteError.textContent =
                message;

            inviteError.style.display =
                "block";
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

    async function removeCurrentMember(
        event
    ) {

        if (event) {

            event.preventDefault();
            event.stopPropagation();
        }


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

    function showToast(
        message
    ) {

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
       FORM PROTECTION
       ===================================================== */

    function setupInviteFormProtection() {

        const input =
            getMemberIDInput();


        if (!input) {
            return;
        }


        const form =
            input.closest("form");


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                addMember(event);

            }
        );


        console.log(
            "FriendChat: Add Member form protection enabled."
        );
    }


    /* =====================================================
       MODAL EVENTS
       ===================================================== */

    function setupModals() {

        if (inviteButton) {

            inviteButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    openInviteModal();
                }
            );
        }


        if (inviteTopButton) {

            inviteTopButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    openInviteModal();
                }
            );
        }


        if (closeInviteModal) {

            closeInviteModal.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    closeInvite();
                }
            );
        }


        if (cancelInvite) {

            cancelInvite.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    closeInvite();
                }
            );
        }


        if (confirmInvite) {

            confirmInvite.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    addMember(event);
                }
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
                function (event) {

                    event.preventDefault();

                    removeCurrentMember(
                        event
                    );
                }
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


        const input =
            getMemberIDInput();


        if (input) {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();
                        event.stopPropagation();

                        addMember(event);
                    }


                    if (
                        event.key ===
                        "Escape"
                    ) {

                        event.preventDefault();

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
       DEBUG
       ===================================================== */

    function printDebugInfo() {

        console.log(
            "========================================"
        );

        console.log(
            "FRIENDCHAT SERVER MEMBERS"
        );

        console.log(
            "API BASE:",
            API_BASE || "(same origin)"
        );

        console.log(
            "CURRENT USER:",
            getCurrentUserID()
        );

        console.log(
            "CURRENT SERVER:",
            getCurrentServerID()
        );

        console.log(
            "========================================"
        );
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        console.log(
            "FriendChat: Server Members JS starting..."
        );


        printDebugInfo();


        const input =
            getMemberIDInput();


        console.log(
            "FriendChat: Member ID input found:",
            !!input
        );


        setupNavigation();

        setupSearch();

        setupModals();

        setupInviteFormProtection();

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
