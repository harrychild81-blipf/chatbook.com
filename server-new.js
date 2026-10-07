/*
=========================================================
 FRIENDCHAT - NEW SERVER
 Clean Server + Member + Admin System
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

const DATA_DIR = path.join(
    ROOT,
    ".friendchat-data"
);

const SERVERS_FILE = path.join(
    DATA_DIR,
    "servers.json"
);

const USERS_FILE = path.join(
    DATA_DIR,
    "users.json"
);

/* =======================================================
   DATA SETUP
======================================================= */

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}

function loadJSON(file, fallback) {
    try {
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
   MEMORY
======================================================= */

let users = loadJSON(
    USERS_FILE,
    []
);

let servers = loadJSON(
    SERVERS_FILE,
    []
);

if (!Array.isArray(users)) {
    users = [];
}

if (!Array.isArray(servers)) {
    servers = [];
}

/* =======================================================
   HELPERS
======================================================= */

function normalizeID(value) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}

function cleanText(value, max = 500) {
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

function saveUsers() {
    saveJSON(
        USERS_FILE,
        users
    );
}

function saveServers() {
    saveJSON(
        SERVERS_FILE,
        servers
    );
}

/* =======================================================
   USER FUNCTIONS
======================================================= */

function getUser(userID) {
    const id = normalizeID(
        userID
    );

    return users.find(
        user =>
            normalizeID(
                user.userID
            ) === id
    );
}

function ensureUser(
    userID,
    name = "Friend"
) {
    const id = normalizeID(
        userID
    );

    if (!id) {
        return null;
    }

    let user = getUser(id);

    if (!user) {
        user = {
            userID: id,
            name: cleanText(
                name,
                100
            ),
            createdAt:
                new Date().toISOString()
        };

        users.push(user);

        saveUsers();
    }

    return user;
}

/* =======================================================
   SERVER FUNCTIONS
======================================================= */

function getServer(serverID) {
    const id = normalizeID(
        serverID
    );

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

    const id = normalizeID(
        userID
    );

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
            server.ownerID
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
        member &&
        member.role === "admin"
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

/*
=========================================================
 IMPORTANT

 This function ALWAYS preserves admin.

 owner -> owner
 admin -> admin
 member -> member
=========================================================
*/

function normalizeMember(
    member,
    server
) {
    const userID =
        normalizeID(
            member.userID
        );

    let role =
        member.role === "admin"
            ? "admin"
            : "member";

    if (
        normalizeID(
            server.ownerID
        ) === userID
    ) {
        role = "owner";
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
   PUBLIC SERVER
======================================================= */

function publicServer(
    server,
    requesterID
) {
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
                    getMember(
                        server,
                        requesterID
                    )?.role ||
                    "member"
                ),

        createdAt:
            server.createdAt
    };
}

/* =======================================================
   REQUEST USER
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
                    body += chunk.toString();

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
    const owner =
        ensureUser(
            requesterID,
            body.ownerName ||
            body.name ||
            "Friend"
        );

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
            owner.userID,

        members: [
            {
                userID:
                    owner.userID,

                name:
                    owner.name,

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

    return server;
}

/* =======================================================
   ADD MEMBER
======================================================= */

function addMember(
    server,
    requesterID,
    memberID,
    memberName
) {
    /*
    -----------------------------------------------
    OWNER OR ADMIN CAN ADD
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
    DO NOT ADD TWICE
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
    MAKE SURE USER EXISTS
    -----------------------------------------------
    */

    const user =
        ensureUser(
            targetID,
            memberName ||
            "Friend"
        );

    /*
    -----------------------------------------------
    NEW MEMBER
    -----------------------------------------------
    */

    const member = {
        userID:
            user.userID,

        name:
            user.name,

        role:
            "member"
    };

    server.members.push(
        member
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

    if (
        newRole !== "admin" &&
        newRole !== "member"
    ) {
        return {
            ok: false,
            status: 400,
            error:
                "Invalid role."
        };
    }

    member.role =
        newRole;

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

                /*
                ---------------------------------------
                CORS PREFLIGHT
                ---------------------------------------
                */

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

                /*
                ---------------------------------------
                TEST
                ---------------------------------------
                */

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
                                "FriendChat new server is working."
                        }
                    );

                    return;
                }

                /*
                ---------------------------------------
                CREATE SERVER
                ---------------------------------------
                */

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

                    const newServer =
                        createServer(
                            body,
                            requesterID
                        );

                    sendJSON(
                        res,
                        201,
                        {
                            ok: true,

                            server:
                                publicServer(
                                    newServer,
                                    requesterID
                                )
                        }
                    );

                    return;
                }

                /*
                ---------------------------------------
                GET SERVERS
                ---------------------------------------
                */

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
                                server =>
                                    getMember(
                                        server,
                                        requesterID
                                    )
                            )
                            .map(
                                server =>
                                    publicServer(
                                        server,
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

                /*
                ---------------------------------------
                SERVER ROUTE
                ---------------------------------------
                */

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

                    /*
                    -----------------------------------
                    GET SERVER
                    -----------------------------------
                    */

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

                    /*
                    -----------------------------------
                    DELETE SERVER
                    -----------------------------------
                    */

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

                /*
                ---------------------------------------
                ADD MEMBER
                ---------------------------------------

                Supports:

                POST
                /api/servers/SERVER_ID/members

                ---------------------------------------
                */

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

                    console.log(
                        ""
                    );

                    console.log(
                        "========== ADD MEMBER =========="
                    );

                    console.log(
                        "SERVER:",
                        serverID
                    );

                    console.log(
                        "OWNER:",
                        serverData?.ownerID
                    );

                    console.log(
                        "REQUESTER:",
                        requesterID
                    );

                    console.log(
                        "REQUESTER MEMBER:",
                        getMember(
                            serverData,
                            requesterID
                        )
                    );

                    console.log(
                        "REQUESTER ROLE:",
                        getMember(
                            serverData,
                            requesterID
                        )?.role
                    );

                    console.log(
                        "================================"
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
                        body.memberID ||
                        body.memberId ||
                        body.targetUserID ||
                        body.targetUserId ||
                        body.friendID ||
                        body.friendId ||
                        body.friendUserID ||
                        body.friendUserId ||
                        body.addUserID ||
                        body.addUserId;

                    const memberName =
                        body.memberName ||
                        body.name ||
                        body.username ||
                        "Friend";

                    const result =
                        addMember(
                            serverData,
                            requesterID,
                            memberID,
                            memberName
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

                /*
                ---------------------------------------
                REMOVE MEMBER
                ---------------------------------------
                */

                const removeMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/members\/([^/]+)$/
                    );

                if (
                    req.method ===
                        "DELETE" &&
                    removeMatch
                ) {
                    const serverID =
                        decodeURIComponent(
                            removeMatch[1]
                        );

                    const targetID =
                        decodeURIComponent(
                            removeMatch[2]
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

                /*
                ---------------------------------------
                CHANGE MEMBER ROLE
                ---------------------------------------

                PUT
                /api/servers/SERVER_ID/members/USER_ID

                body:
                {
                    "role": "admin"
                }

                ---------------------------------------
                */

                const roleMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/members\/([^/]+)$/
                    );

                if (
                    req.method ===
                        "PUT" &&
                    roleMatch
                ) {
                    const serverID =
                        decodeURIComponent(
                            roleMatch[1]
                        );

                    const targetID =
                        decodeURIComponent(
                            roleMatch[2]
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

                /*
                ---------------------------------------
                404
                ---------------------------------------
                */

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

                        const user =
                            ensureUser(
                                userID,
                                message.name ||
                                "Friend"
                            );

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
                                        user.userID
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
