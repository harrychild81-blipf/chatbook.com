/*
=========================================================
 FRIENDCHAT - NEW SERVER
 Server + Members + Admin System
 Uses EXISTING FriendChat users
=========================================================
*/

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const WebSocket = require("ws");

/* =======================================================
   CONFIG
======================================================= */

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

/*
   Server-specific data
*/
const DATA_DIR = path.join(
    ROOT,
    ".friendchat-data"
);

const SERVERS_FILE = path.join(
    DATA_DIR,
    "servers.json"
);

/*
   Possible existing FriendChat user databases.

   We check these in order.
*/
const USER_FILE_CANDIDATES = [
    process.env.FRIENDCHAT_USERS_FILE || null,

    path.join(ROOT, "users.json"),

    path.join(ROOT, "data", "users.json"),

    path.join(ROOT, ".friendchat-data", "users.json"),

    path.join(ROOT, "friendchat-users.json"),

    path.join(ROOT, "server-data", "users.json")
].filter(Boolean);

/* =======================================================
   DATA DIRECTORY
======================================================= */

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}

/* =======================================================
   JSON HELPERS
======================================================= */

function loadJSON(file, fallback) {
    try {
        if (!file) {
            return fallback;
        }

        if (!fs.existsSync(file)) {
            return fallback;
        }

        const text = fs.readFileSync(
            file,
            "utf8"
        );

        if (!text.trim()) {
            return fallback;
        }

        return JSON.parse(text);
    } catch (error) {
        console.log(
            "Could not load:",
            file,
            error.message
        );

        return fallback;
    }
}

function saveJSON(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

/* =======================================================
   LOAD SERVER DATA
======================================================= */

let servers = loadJSON(
    SERVERS_FILE,
    []
);

if (!Array.isArray(servers)) {
    servers = [];
}

/* =======================================================
   FIND EXISTING USER FILE
======================================================= */

function findExistingUserFile() {
    for (const file of USER_FILE_CANDIDATES) {
        if (
            file &&
            fs.existsSync(file)
        ) {
            return file;
        }
    }

    return null;
}

let USER_FILE = findExistingUserFile();

console.log(
    "User database:",
    USER_FILE || "NOT FOUND"
);

/* =======================================================
   LOAD USERS
======================================================= */

function loadUsers() {
    if (!USER_FILE) {
        return [];
    }

    const data = loadJSON(
        USER_FILE,
        []
    );

    /*
       Normal array:
       [
         { userID: "FC-ABC123", name: "Harry" }
       ]
    */
    if (Array.isArray(data)) {
        return data;
    }

    /*
       Some FriendChat versions may store:
       {
          users: [...]
       }
    */
    if (
        data &&
        Array.isArray(data.users)
    ) {
        return data.users;
    }

    /*
       Some versions may use:
       {
          accounts: [...]
       }
    */
    if (
        data &&
        Array.isArray(data.accounts)
    ) {
        return data.accounts;
    }

    return [];
}

let users = loadUsers();

console.log(
    "Existing users loaded:",
    users.length
);

/* =======================================================
   BASIC HELPERS
======================================================= */

function normalizeID(value) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

function displayID(value) {
    return String(
        value || ""
    ).trim();
}

function cleanText(
    value,
    max = 500
) {
    return String(
        value || ""
    )
        .trim()
        .slice(0, max);
}

function newID(prefix) {
    return (
        prefix +
        "-" +
        crypto
            .randomBytes(6)
            .toString("hex")
            .toUpperCase()
    );
}

/* =======================================================
   SAVE SERVERS
======================================================= */

function saveServers() {
    saveJSON(
        SERVERS_FILE,
        servers
    );
}

/* =======================================================
   REFRESH USERS
======================================================= */

function refreshUsers() {
    const latestFile =
        findExistingUserFile();

    if (
        latestFile &&
        latestFile !== USER_FILE
    ) {
        USER_FILE = latestFile;
    }

    users = loadUsers();

    return users;
}

/* =======================================================
   GET USER ID FROM DIFFERENT USER FORMATS
======================================================= */

function getUserID(user) {
    if (!user) {
        return "";
    }

    return (
        user.userID ||
        user.userId ||
        user.id ||
        user.ID ||
        user.uid ||
        user.user_id ||
        ""
    );
}

/* =======================================================
   GET USER NAME
======================================================= */

function getUserName(user) {
    if (!user) {
        return "Friend";
    }

    return (
        user.name ||
        user.username ||
        user.displayName ||
        user.display_name ||
        user.fullName ||
        "Friend"
    );
}

/* =======================================================
   FIND USER
======================================================= */

function getUser(userID) {
    const id =
        normalizeID(userID);

    if (!id) {
        return null;
    }

    /*
       Reload every time.

       This is useful because the main FriendChat
       application may create users while this server
       is already running.
    */
    refreshUsers();

    const user =
        users.find(
            item =>
                normalizeID(
                    getUserID(item)
                ) === id
        );

    return user || null;
}

/* =======================================================
   GET USER PUBLIC DATA
======================================================= */

function publicUser(user) {
    if (!user) {
        return null;
    }

    return {
        userID:
            displayID(
                getUserID(user)
            ),

        name:
            cleanText(
                getUserName(user),
                100
            )
    };
}

/* =======================================================
   SERVER FUNCTIONS
======================================================= */

function getServer(serverID) {
    const id =
        normalizeID(serverID);

    return servers.find(
        server =>
            normalizeID(
                server.serverID
            ) === id
    );
}

function getMember(
    server,
    userID
) {
    if (
        !server ||
        !Array.isArray(
            server.members
        )
    ) {
        return null;
    }

    const id =
        normalizeID(userID);

    return server.members.find(
        member =>
            normalizeID(
                member.userID
            ) === id
    );
}

function isOwner(
    server,
    userID
) {
    return (
        normalizeID(
            server?.ownerID
        ) ===
        normalizeID(
            userID
        )
    );
}

function isAdmin(
    server,
    userID
) {
    const member =
        getMember(
            server,
            userID
        );

    return (
        String(
            member?.role || ""
        ).toLowerCase() ===
        "admin"
    );
}

function canManageMembers(
    server,
    userID
) {
    return (
        isOwner(
            server,
            userID
        ) ||
        isAdmin(
            server,
            userID
        )
    );
}

/* =======================================================
   NORMALIZE MEMBER
======================================================= */

function normalizeMember(
    member,
    server
) {
    const userID =
        normalizeID(
            member.userID
        );

    let role =
        String(
            member.role || "member"
        ).toLowerCase();

    if (
        normalizeID(
            server.ownerID
        ) === userID
    ) {
        role = "owner";
    } else if (
        role === "admin"
    ) {
        role = "admin";
    } else {
        role = "member";
    }

    return {
        userID,
        name:
            cleanText(
                member.name ||
                "Friend",
                100
            ),
        role
    };
}

/* =======================================================
   NORMALIZE ALL SERVER MEMBERS
======================================================= */

function normalizeServerMembers(
    server
) {
    if (
        !Array.isArray(
            server.members
        )
    ) {
        server.members = [];
    }

    server.members =
        server.members.map(
            member =>
                normalizeMember(
                    member,
                    server
                )
        );

    return server;
}

/* =======================================================
   PUBLIC SERVER
======================================================= */

function publicServer(
    server,
    requesterID
) {
    normalizeServerMembers(
        server
    );

    const requester =
        getMember(
            server,
            requesterID
        );

    return {
        serverID:
            server.serverID,

        name:
            server.name,

        description:
            server.description,

        icon:
            server.icon,

        ownerID:
            server.ownerID,

        members:
            server.members.map(
                member =>
                    normalizeMember(
                        member,
                        server
                    )
            ),

        myRole:
            isOwner(
                server,
                requesterID
            )
                ? "owner"
                : (
                    requester?.role ||
                    "member"
                ),

        createdAt:
            server.createdAt
    };
}

/* =======================================================
   REQUESTER ID
======================================================= */

function getRequesterID(
    req,
    body = {}
) {
    const header =
        req.headers[
            "x-friendchat-user-id"
        ];

    const value =
        body.requesterID ||
        body.requesterId ||
        body.currentUserID ||
        body.currentUserId ||
        body.userID ||
        body.userId ||
        body.ownerID ||
        body.ownerId ||
        body.fromID ||
        body.fromId ||
        header;

    return normalizeID(
        value
    );
}

/* =======================================================
   TARGET USER ID
======================================================= */

function getTargetUserID(
    body = {}
) {
    const value =
        body.memberID ||
        body.memberId ||
        body.targetUserID ||
        body.targetUserId ||
        body.friendID ||
        body.friendId ||
        body.friendUserID ||
        body.friendUserId ||
        body.addUserID ||
        body.addUserId ||
        body.id ||
        body.userID ||
        body.userId;

    return normalizeID(
        value
    );
}

/* =======================================================
   JSON RESPONSE
======================================================= */

function sendJSON(
    res,
    status,
    data
) {
    if (res.headersSent) {
        return;
    }

    res.writeHead(
        status,
        {
            "Content-Type":
                "application/json; charset=utf-8",

            "Cache-Control":
                "no-cache, no-store, must-revalidate",

            "Access-Control-Allow-Origin":
                "*",

            "Access-Control-Allow-Headers":
                "Content-Type, X-FriendChat-User-ID",

            "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, OPTIONS"
        }
    );

    res.end(
        JSON.stringify(
            data
        )
    );
}

function sendError(
    res,
    status,
    message,
    extra = {}
) {
    sendJSON(
        res,
        status,
        {
            ok: false,
            error: message,
            ...extra
        }
    );
}

/* =======================================================
   READ BODY
======================================================= */

function readBody(req) {
    return new Promise(
        (resolve, reject) => {
            let body = "";

            req.on(
                "data",
                chunk => {
                    body +=
                        chunk.toString();

                    if (
                        body.length >
                        5 * 1024 * 1024
                    ) {
                        reject(
                            new Error(
                                "Request too large."
                            )
                        );

                        req.destroy();
                    }
                }
            );

            req.on(
                "end",
                () => {
                    if (
                        !body.trim()
                    ) {
                        resolve({});
                        return;
                    }

                    try {
                        resolve(
                            JSON.parse(
                                body
                            )
                        );
                    } catch {
                        reject(
                            new Error(
                                "Invalid JSON."
                            )
                        );
                    }
                }
            );

            req.on(
                "error",
                reject
            );
        }
    );
}

/* =======================================================
   CREATE SERVER
======================================================= */

function createServer(
    body,
    requesterID
) {
    /*
       The owner MUST already exist.

       We no longer create fake users.
    */
    const owner =
        getUser(
            requesterID
        );

    if (!owner) {
        return {
            ok: false,
            status: 404,
            error:
                "Owner user not found."
        };
    }

    const serverID =
        newID(
            "FC-SERVER"
        );

    const server = {
        serverID,

        name:
            cleanText(
                body.name ||
                "New Server",
                40
            ),

        description:
            cleanText(
                body.description ||
                "",
                200
            ),

        icon:
            cleanText(
                body.icon ||
                "FC",
                20
            ),

        ownerID:
            displayID(
                getUserID(owner)
            ),

        members: [
            {
                userID:
                    displayID(
                        getUserID(owner)
                    ),

                name:
                    cleanText(
                        getUserName(owner),
                        100
                    ),

                role:
                    "owner"
            }
        ],

        createdAt:
            new Date().toISOString()
    };

    servers.push(
        server
    );

    saveServers();

    return {
        ok: true,
        server
    };
}

/* =======================================================
   ADD MEMBER
======================================================= */

function addMember(
    server,
    requesterID,
    memberID
) {
    /*
    -----------------------------------------------
    PERMISSION
    -----------------------------------------------
    */

    if (
        !canManageMembers(
            server,
            requesterID
        )
    ) {
        return {
            ok: false,
            status: 403,
            error:
                "Only the server owner or an admin can add members."
        };
    }

    /*
    -----------------------------------------------
    TARGET ID
    -----------------------------------------------
    */

    const targetID =
        normalizeID(
            memberID
        );

    if (!targetID) {
        return {
            ok: false,
            status: 400,
            error:
                "Member ID is required."
        };
    }

    /*
    -----------------------------------------------
    DON'T ADD TWICE
    -----------------------------------------------
    */

    const existing =
        getMember(
            server,
            targetID
        );

    if (existing) {
        return {
            ok: false,
            status: 409,
            error:
                "This user is already a member."
        };
    }

    /*
    -----------------------------------------------
    IMPORTANT:
    FIND THE REAL FRIENDCHAT USER
    -----------------------------------------------
    */

    const user =
        getUser(
            targetID
        );

    console.log(
        ""
    );

    console.log(
        "========== USER LOOKUP =========="
    );

    console.log(
        "SEARCHING FOR:",
        targetID
    );

    console.log(
        "USER FILE:",
        USER_FILE || "NONE"
    );

    console.log(
        "TOTAL USERS:",
        users.length
    );

    console.log(
        "FOUND USER:",
        user
            ? publicUser(user)
            : "NO"
    );

    console.log(
        "================================="
    );

    if (!user) {
        return {
            ok: false,
            status: 404,
            error:
                "User not found.",
            code:
                "USER_NOT_FOUND",
            userID:
                targetID
        };
    }

    /*
    -----------------------------------------------
    USE THE REAL ACCOUNT ID
    -----------------------------------------------
    */

    const realUserID =
        displayID(
            getUserID(user)
        );

    const member = {
        userID:
            realUserID,

        name:
            cleanText(
                getUserName(user),
                100
            ),

        role:
            "member"
    };

    server.members.push(
        member
    );

    normalizeServerMembers(
        server
    );

    saveServers();

    return {
        ok: true,

        member:
            normalizeMember(
                member,
                server
            )
    };
}

/* =======================================================
   CHANGE ROLE
======================================================= */

function changeRole(
    server,
    requesterID,
    targetID,
    newRole
) {
    if (
        !isOwner(
            server,
            requesterID
        )
    ) {
        return {
            ok: false,
            status: 403,
            error:
                "Only the server owner can change member roles."
        };
    }

    const member =
        getMember(
            server,
            targetID
        );

    if (!member) {
        return {
            ok: false,
            status: 404,
            error:
                "Member not found."
        };
    }

    if (
        isOwner(
            server,
            targetID
        )
    ) {
        return {
            ok: false,
            status: 400,
            error:
                "The server owner role cannot be changed."
        };
    }

    const role =
        String(
            newRole || ""
        ).toLowerCase();

    if (
        role !== "admin" &&
        role !== "member"
    ) {
        return {
            ok: false,
            status: 400,
            error:
                "Invalid role."
        };
    }

    member.role =
        role;

    normalizeServerMembers(
        server
    );

    saveServers();

    return {
        ok: true,

        member:
            normalizeMember(
                member,
                server
            )
    };
}

/* =======================================================
   REMOVE MEMBER
======================================================= */

function removeMember(
    server,
    requesterID,
    targetID
) {
    if (
        !canManageMembers(
            server,
            requesterID
        )
    ) {
        return {
            ok: false,
            status: 403,
            error:
                "Only the server owner or an admin can remove members."
        };
    }

    const id =
        normalizeID(
            targetID
        );

    if (
        id ===
        normalizeID(
            server.ownerID
        )
    ) {
        return {
            ok: false,
            status: 400,
            error:
                "The server owner cannot be removed."
        };
    }

    const index =
        server.members.findIndex(
            member =>
                normalizeID(
                    member.userID
                ) === id
        );

    if (
        index === -1
    ) {
        return {
            ok: false,
            status: 404,
            error:
                "Member not found."
        };
    }

    server.members.splice(
        index,
        1
    );

    saveServers();

    return {
        ok: true
    };
}

/* =======================================================
   HTTP SERVER
======================================================= */

const server =
    http.createServer(
        async (
            req,
            res
        ) => {
            try {
                const url =
                    new URL(
                        req.url,
                        `http://${req.headers.host || "localhost"}`
                    );

                const pathname =
                    url.pathname;

                /* =======================================
                   CORS
                ======================================= */

                if (
                    req.method ===
                    "OPTIONS"
                ) {
                    sendJSON(
                        res,
                        204,
                        {}
                    );

                    return;
                }

                /* =======================================
                   TEST
                ======================================= */

                if (
                    pathname ===
                    "/api/test"
                ) {
                    sendJSON(
                        res,
                        200,
                        {
                            ok: true,

                            message:
                                "FriendChat new server is working.",

                            users:
                                users.length,

                            userDatabase:
                                USER_FILE ||
                                null
                        }
                    );

                    return;
                }

                /* =======================================
                   GET USERS
                   Useful for FriendChat member search
                ======================================= */

                if (
                    req.method ===
                        "GET" &&
                    pathname ===
                        "/api/users"
                ) {
                    refreshUsers();

                    const result =
                        users.map(
                            publicUser
                        );

                    sendJSON(
                        res,
                        200,
                        {
                            ok: true,
                            users:
                                result
                        }
                    );

                    return;
                }

                /* =======================================
                   GET ONE USER
                ======================================= */

                const userMatch =
                    pathname.match(
                        /^\/api\/users\/([^/]+)$/
                    );

                if (
                    req.method ===
                        "GET" &&
                    userMatch
                ) {
                    const userID =
                        decodeURIComponent(
                            userMatch[1]
                        );

                    const user =
                        getUser(
                            userID
                        );

                    if (!user) {
                        sendError(
                            res,
                            404,
                            "User not found."
                        );

                        return;
                    }

                    sendJSON(
                        res,
                        200,
                        {
                            ok: true,

                            user:
                                publicUser(
                                    user
                                )
                        }
                    );

                    return;
                }

                /* =======================================
                   CREATE SERVER
                ======================================= */

                if (
                    req.method ===
                        "POST" &&
                    pathname ===
                        "/api/servers"
                ) {
                    const body =
                        await readBody(
                            req
                        );

                    const requesterID =
                        getRequesterID(
                            req,
                            body
                        );

                    if (
                        !requesterID
                    ) {
                        sendError(
                            res,
                            400,
                            "Requester user ID is required."
                        );

                        return;
                    }

                    const result =
                        createServer(
                            body,
                            requesterID
                        );

                    if (
                        !result.ok
                    ) {
                        sendError(
                            res,
                            result.status,
                            result.error
                        );

                        return;
                    }

                    sendJSON(
                        res,
                        201,
                        {
                            ok: true,

                            server:
                                publicServer(
                                    result.server,
                                    requesterID
                                )
                        }
                    );

                    return;
                }

                /* =======================================
                   GET SERVERS
                ======================================= */

                if (
                    req.method ===
                        "GET" &&
                    pathname ===
                        "/api/servers"
                ) {
                    const requesterID =
                        getRequesterID(
                            req
                        );

                    const result =
                        servers
                            .filter(
                                item =>
                                    getMember(
                                        item,
                                        requesterID
                                    )
                            )
                            .map(
                                item =>
                                    publicServer(
                                        item,
                                        requesterID
                                    )
                            );

                    sendJSON(
                        res,
                        200,
                        {
                            ok: true,

                            servers:
                                result
                        }
                    );

                    return;
                }

                /* =======================================
                   GET / DELETE SERVER
                ======================================= */

                const serverMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)$/
                    );

                if (
                    serverMatch
                ) {
                    const serverID =
                        decodeURIComponent(
                            serverMatch[1]
                        );

                    const serverData =
                        getServer(
                            serverID
                        );

                    if (
                        !serverData
                    ) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    /* ===================================
                       GET SERVER
                    =================================== */

                    if (
                        req.method ===
                        "GET"
                    ) {
                        const requesterID =
                            getRequesterID(
                                req
                            );

                        sendJSON(
                            res,
                            200,
                            {
                                ok: true,

                                server:
                                    publicServer(
                                        serverData,
                                        requesterID
                                    )
                            }
                        );

                        return;
                    }

                    /* ===================================
                       DELETE SERVER
                    =================================== */

                    if (
                        req.method ===
                        "DELETE"
                    ) {
                        const body =
                            await readBody(
                                req
                            );

                        const requesterID =
                            getRequesterID(
                                req,
                                body
                            );

                        if (
                            !isOwner(
                                serverData,
                                requesterID
                            )
                        ) {
                            sendError(
                                res,
                                403,
                                "Only the server owner can delete the server."
                            );

                            return;
                        }

                        servers =
                            servers.filter(
                                item =>
                                    normalizeID(
                                        item.serverID
                                    ) !==
                                    normalizeID(
                                        serverID
                                    )
                            );

                        saveServers();

                        sendJSON(
                            res,
                            200,
                            {
                                ok: true
                            }
                        );

                        return;
                    }
                }

                /* =======================================
                   ADD MEMBER
                ======================================= */

                const addMemberMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/members$/
                    );

                if (
                    req.method ===
                        "POST" &&
                    addMemberMatch
                ) {
                    const serverID =
                        decodeURIComponent(
                            addMemberMatch[1]
                        );

                    const body =
                        await readBody(
                            req
                        );

                    const requesterID =
                        getRequesterID(
                            req,
                            body
                        );

                    const serverData =
                        getServer(
                            serverID
                        );

                    if (
                        !serverData
                    ) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    const memberID =
                        getTargetUserID(
                            body
                        );

                    console.log(
                        ""
                    );

                    console.log(
                        "========================================"
                    );

                    console.log(
                        "        FRIENDCHAT ADD MEMBER"
                    );

                    console.log(
                        "========================================"
                    );

                    console.log(
                        "SERVER:",
                        serverID
                    );

                    console.log(
                        "OWNER:",
                        serverData.ownerID
                    );

                    console.log(
                        "REQUESTER:",
                        requesterID
                    );

                    console.log(
                        "REQUESTER ROLE:",
                        getMember(
                            serverData,
                            requesterID
                        )?.role
                    );

                    console.log(
                        "TARGET:",
                        memberID
                    );

                    console.log(
                        "========================================"
                    );

                    const result =
                        addMember(
                            serverData,
                            requesterID,
                            memberID
                        );

                    if (
                        !result.ok
                    ) {
                        sendError(
                            res,
                            result.status,
                            result.error,
                            {
                                code:
                                    result.code ||
                                    null,

                                userID:
                                    result.userID ||
                                    null
                            }
                        );

                        return;
                    }

                    sendJSON(
                        res,
                        200,
                        {
                            ok: true,

                            member:
                                result.member,

                            server:
                                publicServer(
                                    serverData,
                                    requesterID
                                )
                        }
                    );

                    return;
                }

                /* =======================================
                   MEMBER ROUTE
                ======================================= */

                const memberRoute =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/members\/([^/]+)$/
                    );

                if (
                    memberRoute
                ) {
                    const serverID =
                        decodeURIComponent(
                            memberRoute[1]
                        );

                    const targetID =
                        decodeURIComponent(
                            memberRoute[2]
                        );

                    const serverData =
                        getServer(
                            serverID
                        );

                    if (
                        !serverData
                    ) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    /* ===================================
                       REMOVE MEMBER
                    =================================== */

                    if (
                        req.method ===
                        "DELETE"
                    ) {
                        const body =
                            await readBody(
                                req
                            );

                        const requesterID =
                            getRequesterID(
                                req,
                                body
                            );

                        const result =
                            removeMember(
                                serverData,
                                requesterID,
                                targetID
                            );

                        if (
                            !result.ok
                        ) {
                            sendError(
                                res,
                                result.status,
                                result.error
                            );

                            return;
                        }

                        sendJSON(
                            res,
                            200,
                            {
                                ok: true,

                                server:
                                    publicServer(
                                        serverData,
                                        requesterID
                                    )
                            }
                        );

                        return;
                    }

                    /* ===================================
                       CHANGE ROLE
                    =================================== */

                    if (
                        req.method ===
                        "PUT"
                    ) {
                        const body =
                            await readBody(
                                req
                            );

                        const requesterID =
                            getRequesterID(
                                req,
                                body
                            );

                        const result =
                            changeRole(
                                serverData,
                                requesterID,
                                targetID,
                                body.role
                            );

                        if (
                            !result.ok
                        ) {
                            sendError(
                                res,
                                result.status,
                                result.error
                            );

                            return;
                        }

                        sendJSON(
                            res,
                            200,
                            {
                                ok: true,

                                member:
                                    result.member,

                                server:
                                    publicServer(
                                        serverData,
                                        requesterID
                                    )
                            }
                        );

                        return;
                    }
                }

                /* =======================================
                   404
                ======================================= */

                sendError(
                    res,
                    404,
                    "API route not found."
                );
            } catch (error) {
                console.log(
                    "SERVER ERROR:",
                    error
                );

                sendError(
                    res,
                    500,
                    error.message ||
                        "Internal server error."
                );
            }
        }
    );

/* =======================================================
   WEBSOCKET
======================================================= */

const wss =
    new WebSocket.Server({
        server
    });

const sockets =
    new Map();

wss.on(
    "connection",
    socket => {
        console.log(
            "WebSocket device connected."
        );

        socket.on(
            "message",
            raw => {
                try {
                    const message =
                        JSON.parse(
                            raw.toString()
                        );

                    if (
                        message.type ===
                        "register"
                    ) {
                        const userID =
                            normalizeID(
                                message.userID ||
                                message.userId
                            );

                        if (
                            !userID
                        ) {
                            return;
                        }

                        /*
                           IMPORTANT:
                           Don't create a fake account.

                           Only register if the real
                           FriendChat account exists.
                        */
                        const user =
                            getUser(
                                userID
                            );

                        if (!user) {
                            socket.send(
                                JSON.stringify(
                                    {
                                        type:
                                            "error",

                                        error:
                                            "User not found."
                                    }
                                )
                            );

                            return;
                        }

                        sockets.set(
                            userID,
                            socket
                        );

                        socket.userID =
                            userID;

                        socket.send(
                            JSON.stringify(
                                {
                                    type:
                                        "registered",

                                    userID:
                                        displayID(
                                            getUserID(
                                                user
                                            )
                                        )
                                }
                            )
                        );

                        console.log(
                            "User connected:",
                            userID
                        );
                    }
                } catch (
                    error
                ) {
                    console.log(
                        "WS ERROR:",
                        error.message
                    );
                }
            }
        );

        socket.on(
            "close",
            () => {
                if (
                    socket.userID
                ) {
                    sockets.delete(
                        socket.userID
                    );
                }
            }
        );
    }
);

/* =======================================================
   START
======================================================= */

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            ""
        );

        console.log(
            "========================================"
        );

        console.log(
            "       FRIENDCHAT NEW SERVER"
        );

        console.log(
            "========================================"
        );

        console.log(
            "HTTP:",
            `http://localhost:${PORT}`
        );

        console.log(
            "WS:",
            `ws://localhost:${PORT}`
        );

        console.log(
            "Website root:",
            ROOT
        );

        console.log(
            "User database:",
            USER_FILE ||
            "NOT FOUND"
        );

        console.log(
            "Users:",
            users.length
        );

        console.log(
            "Servers:",
            servers.length
        );

        console.log(
            "========================================"
        );

        console.log(
            ""
        );
    }
);
