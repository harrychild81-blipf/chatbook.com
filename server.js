const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

/* =====================================================
   MEMORY
   ===================================================== */

const users = new Map();
const sockets = new Map();
const presence = new Map();
const profilePhotos = new Map();

const friendchatServers = new Map();
const directMessages = new Map();
const serverMessages = new Map();
const mediaTransfers = new Map();

/* =====================================================
   WEBSITE ROOT
   ===================================================== */

const SAME_FOLDER = __dirname;
const PARENT_FOLDER = path.resolve(__dirname, "..");

let ROOT_DIR;

if (fs.existsSync(path.join(SAME_FOLDER, "index.html"))) {
    ROOT_DIR = SAME_FOLDER;
} else {
    ROOT_DIR = PARENT_FOLDER;
}

console.log("Website root:", ROOT_DIR);

/* =====================================================
   DATA FILES
   ===================================================== */

const DATA_DIR = path.join(PARENT_FOLDER, ".friendchat-data");

const USERS_FILE = path.join(DATA_DIR, "users.json");
const SERVERS_FILE = path.join(DATA_DIR, "servers.json");
const SERVER_MESSAGES_FILE = path.join(
    DATA_DIR,
    "server-messages.json"
);

/* =====================================================
   HELPERS
   ===================================================== */

function normalizeId(value) {
    return String(value || "")
        .trim()
        .toUpperCase();
}

function cleanText(value, maxLength = 500) {
    return String(value || "")
        .trim()
        .slice(0, maxLength);
}

function generateID(prefix) {
    return (
        prefix +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase() +
        Date.now()
            .toString(36)
            .slice(-4)
            .toUpperCase()
    );
}

/*
=====================================================
IMPORTANT SERVER LOOKUP FIX
=====================================================
*/

function getServerByID(value) {
    const raw = String(value || "").trim();

    if (!raw) {
        return null;
    }

    // Try exact ID first
    let server = friendchatServers.get(raw);

    if (server) {
        return server;
    }

    // Try normalized ID
    const normalized = normalizeId(raw);

    server = friendchatServers.get(normalized);

    if (server) {
        return server;
    }

    // Extra protection for old saved servers
    for (const [key, data] of friendchatServers.entries()) {
        if (
            normalizeId(key) === normalized ||
            normalizeId(data.serverID) === normalized
        ) {
            return data;
        }
    }

    return null;
}

/*
=====================================================
REQUEST USER
=====================================================
*/



function getRequestUserID(req, url = null) {
    const queryUser = url
        ? (
            url.searchParams.get("user") ||
            url.searchParams.get("userID") ||
            url.searchParams.get("userId") ||
            url.searchParams.get("requester") ||
            url.searchParams.get("requesterID") ||
            url.searchParams.get("ownerID")
        )
        : "";

    const headerUser =
        req.headers["x-friendchat-user-id"] ||
        req.headers["x-friendchat-userid"] ||
        req.headers["x-user-id"];

    return normalizeId(
        queryUser || headerUser || ""
    );
}

function getBodyRequesterID(body, req) {
    body = body || {};

    const headerUser =
        req.headers["x-friendchat-user-id"] ||
        req.headers["x-friendchat-userid"] ||
        req.headers["x-user-id"];

    return normalizeId(
        body.requesterID ||
        body.requesterId ||
        body.userID ||
        body.userId ||
        body.ownerID ||
        body.ownerId ||
        body.currentUserID ||
        body.currentUserId ||
        body.fromID ||
        body.fromId ||
        body.senderID ||
        body.senderId ||
        headerUser ||
        ""
    );
}




/* =====================================================
   JSON
   ===================================================== */

function sendJSON(res, statusCode, data) {
    if (res.headersSent) {
        return;
    }

    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control":
            "no-cache, no-store, must-revalidate"
    });

    res.end(JSON.stringify(data));
}

function sendError(
    res,
    statusCode,
    message,
    extra = {}
) {
    sendJSON(res, statusCode, {
        ok: false,
        error: message,
        ...extra
    });
}

/* =====================================================
   READ JSON
   ===================================================== */

function readJSONBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        let size = 0;

        const MAX_BODY = 220 * 1024 * 1024; // Allows a 150 MB file encoded as a data URL plus JSON overhead.

        req.on("data", chunk => {
            size += chunk.length;

            if (size > MAX_BODY) {
                reject(
                    new Error(
                        "Request body is too large."
                    )
                );

                try {
                    req.destroy();
                } catch {}

                return;
            }

            body += chunk.toString();
        });

        req.on("end", () => {
            if (!body.trim()) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(
                    new Error("Invalid JSON.")
                );
            }
        });

        req.on("error", reject);
    });
}

/* =====================================================
   USER SYSTEM
   ===================================================== */

function ensureUser(
    userID,
    name = "Friend"
) {
    const id = normalizeId(userID);

    if (!id) {
        return null;
    }

    const cleanName =
        cleanText(name || "Friend", 100) ||
        "Friend";

    let user = users.get(id);

    if (!user) {
        user = {
            id,
            name: cleanName
        };

        users.set(id, user);

        presence.set(id, {
            id,
            name: cleanName,
            online: false,
            chattingWith: null
        });

        saveUsers();
    } else if (
        cleanName &&
        cleanName !== "Friend" &&
        cleanName !== user.name
    ) {
        user.name = cleanName;
        users.set(id, user);
        saveUsers();
    }

    return user;
}

function loadUsers() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, {
                recursive: true
            });
        }

        if (!fs.existsSync(USERS_FILE)) {
            return;
        }

        const raw =
            fs.readFileSync(
                USERS_FILE,
                "utf8"
            );

        const savedUsers =
            JSON.parse(raw);

        if (!Array.isArray(savedUsers)) {
            return;
        }

        for (const saved of savedUsers) {
            const id = normalizeId(
                saved.id ||
                saved.userID
            );

            if (!id) {
                continue;
            }

            const name =
                cleanText(
                    saved.name ||
                    saved.username ||
                    "Friend",
                    100
                ) || "Friend";

            users.set(id, {
                id,
                name
            });

            presence.set(id, {
                id,
                name,
                online: false,
                chattingWith: null
            });
        }

        console.log(
            `Loaded ${users.size} saved users.`
        );
    } catch (error) {
        console.log(
            "Could not load users:",
            error.message
        );
    }
}

function saveUsers() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, {
                recursive: true
            });
        }

        const temp =
            USERS_FILE + ".tmp";

        fs.writeFileSync(
            temp,
            JSON.stringify(
                Array.from(users.values()),
                null,
                2
            ),
            "utf8"
        );

        fs.renameSync(temp, USERS_FILE);
    } catch (error) {
        console.log(
            "Could not save users:",
            error.message
        );
    }
}

/* =====================================================
   MEMBERS
   ===================================================== */


function normalizeMember(member) {
    if (typeof member === "string") {
        const userID = normalizeId(member);

        if (!userID) {
            return null;
        }

        const user = users.get(userID);

        return {
            userID,
            name: user?.name || "Friend",
            role: "member",
            joinedAt: Date.now()
        };
    }

    if (member && typeof member === "object") {
        const userID = normalizeId(
            member.userID ||
            member.userId ||
            member.memberID ||
            member.memberId ||
            member.member_id ||
            member.targetUserID ||
            member.targetUserId ||
            member.id
        );

        if (!userID) {
            return null;
        }

        const user = users.get(userID);

        return {
            userID,
            name: cleanText(
                member.name ||
                member.username ||
                user?.name ||
                "Friend",
                100
            ) || "Friend",

            role:
                member.role === "owner"
                    ? "owner"
                    : member.role === "admin"
                        ? "admin"
                        : "member",

            joinedAt:
                Number(member.joinedAt) ||
                Date.now()
        };
    }

    return null;
}


/* =====================================================
   CHANNEL
   ===================================================== */

function normalizeChannel(channel) {
    if (
        !channel ||
        typeof channel !== "object"
    ) {
        return null;
    }

    const channelID =
        cleanText(
            channel.channelID ||
            channel.channelId ||
            channel.id ||
            generateID("CH"),
            100
        );

    const name =
        cleanText(
            channel.name || "general",
            50
        );

    if (!channelID || !name) {
        return null;
    }

    return {
        channelID,
        name,
        type:
            cleanText(
                channel.type || "text",
                30
            ),
        createdAt:
            Number(channel.createdAt) ||
            Date.now()
    };
}

/* =====================================================
   ROLE
   ===================================================== */

function normalizeRole(role) {
    if (
        !role ||
        typeof role !== "object"
    ) {
        return null;
    }

    const roleID =
        cleanText(
            role.roleID ||
            role.roleId ||
            role.id ||
            generateID("ROLE"),
            100
        );

    const name =
        cleanText(
            role.name || "Member",
            50
        );

    if (!roleID || !name) {
        return null;
    }

    return {
        roleID,
        name,
        color:
            cleanText(
                role.color || "",
                30
            ),
        permissions:
            Array.isArray(role.permissions)
                ? role.permissions
                    .slice(0, 100)
                    .map(p =>
                        cleanText(p, 50)
                    )
                : []
    };
}

/* =====================================================
   SERVER NORMALIZATION
   ===================================================== */

function normalizeServer(serverData) {
    if (
        !serverData ||
        typeof serverData !== "object"
    ) {
        return null;
    }

    /*
       IMPORTANT:
       Server IDs are normalized here.
    */

    const serverID =
        normalizeId(
            serverData.serverID ||
            serverData.serverId ||
            serverData.id
        );

    const ownerID =
        normalizeId(
            serverData.ownerID ||
            serverData.ownerId
        );

    if (!serverID || !ownerID) {
        return null;
    }

    ensureUser(
        ownerID,
        serverData.ownerName || "Owner"
    );

    let members =
        Array.isArray(serverData.members)
            ? serverData.members
                .map(normalizeMember)
                .filter(Boolean)
            : [];

    const uniqueMembers = new Map();

    for (const member of members) {
        const id = normalizeId(
            member.userID
        );

        if (!id) {
            continue;
        }

        uniqueMembers.set(id, member);
    }

    members =
        Array.from(
            uniqueMembers.values()
        );

    /*
       ALWAYS make owner a member
    */

    if (
        !members.some(
            member =>
                normalizeId(
                    member.userID
                ) === ownerID
        )
    ) {
        const owner = users.get(ownerID);

        members.unshift({
            userID: ownerID,
            name:
                owner?.name ||
                "Owner",
            role: "owner",
            joinedAt:
                Number(
                    serverData.createdAt
                ) || Date.now()
        });
    }

    members =
        members.map(member => ({
            ...member,
       role:
    normalizeId(
        member.userID
    ) === ownerID
        ? "owner"
        : member.role === "admin"
            ? "admin"
            : "member"
        }));

    let channels =
        Array.isArray(serverData.channels)
            ? serverData.channels
                .map(normalizeChannel)
                .filter(Boolean)
            : [];

    if (channels.length === 0) {
        channels.push({
            channelID:
                generateID("CH"),
            name: "general",
            type: "text",
            createdAt:
                Number(
                    serverData.createdAt
                ) || Date.now()
        });
    }

    channels = channels.slice(0, 200);

    let roles =
        Array.isArray(serverData.roles)
            ? serverData.roles
                .map(normalizeRole)
                .filter(Boolean)
            : [];

    roles = roles.slice(0, 200);

    let rules = [];

    if (Array.isArray(serverData.rules)) {
        rules =
            serverData.rules
                .slice(0, 200)
                .map(rule => {
                    if (
                        typeof rule ===
                        "string"
                    ) {
                        return cleanText(
                            rule,
                            500
                        );
                    }

                    if (
                        rule &&
                        typeof rule ===
                            "object"
                    ) {
                        return {
                            ...rule
                        };
                    }

                    return null;
                })
                .filter(Boolean);
    }

    return {
        serverID,
        ownerID,

        name:
            cleanText(
                serverData.name ||
                "FriendChat Server",
                40
            ),

        description:
            cleanText(
                serverData.description ||
                "",
                200
            ),

        icon:
            serverData.icon || null,

        banner:
            serverData.banner || null,

        createdAt:
            Number(
                serverData.createdAt
            ) || Date.now(),

        members,
        channels,
        roles,
        rules,

        settings:
            serverData.settings &&
            typeof serverData.settings ===
                "object"
                ? serverData.settings
                : {
                    theme: "dark",
                    accentColor:
                        "#6c63ff",
                    background: null
                }
    };
}

/* =====================================================
   SERVER STORAGE
   ===================================================== */

function loadServers() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, {
                recursive: true
            });
        }

        if (!fs.existsSync(SERVERS_FILE)) {
            return;
        }

        const raw =
            fs.readFileSync(
                SERVERS_FILE,
                "utf8"
            );

        const savedServers =
            JSON.parse(raw);

        if (!Array.isArray(savedServers)) {
            return;
        }

        for (const saved of savedServers) {
            const server =
                normalizeServer(saved);

            if (!server) {
                continue;
            }

            friendchatServers.set(
                server.serverID,
                server
            );
        }

        /*
           Save again so old lowercase IDs
           become normalized.
        */

        saveServers();

        console.log(
            `Loaded ${friendchatServers.size} servers.`
        );
    } catch (error) {
        console.log(
            "Could not load servers:",
            error.message
        );
    }
}

function saveServers() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, {
                recursive: true
            });
        }

        const temp =
            SERVERS_FILE + ".tmp";

        fs.writeFileSync(
            temp,
            JSON.stringify(
                Array.from(
                    friendchatServers.values()
                ),
                null,
                2
            ),
            "utf8"
        );

        fs.renameSync(
            temp,
            SERVERS_FILE
        );
    } catch (error) {
        console.log(
            "Could not save servers:",
            error.message
        );
    }
}

/* =====================================================
   SERVER MESSAGES
   ===================================================== */

function loadServerMessages() {
    try {
        if (
            !fs.existsSync(
                SERVER_MESSAGES_FILE
            )
        ) {
            return;
        }

        const raw =
            fs.readFileSync(
                SERVER_MESSAGES_FILE,
                "utf8"
            );

        const saved = JSON.parse(raw);

        if (!Array.isArray(saved)) {
            return;
        }

        for (const message of saved) {
            if (
                message &&
                message.id &&
                message.serverID
            ) {
                message.serverID =
                    normalizeId(
                        message.serverID
                    );

                serverMessages.set(
                    String(message.id),
                    message
                );
            }
        }

        console.log(
            `Loaded ${serverMessages.size} server messages.`
        );
    } catch (error) {
        console.log(
            "Could not load server messages:",
            error.message
        );
    }
}

function saveServerMessages() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, {
                recursive: true
            });
        }

        const temp =
            SERVER_MESSAGES_FILE + ".tmp";

        fs.writeFileSync(
            temp,
            JSON.stringify(
                Array.from(
                    serverMessages.values()
                ),
                null,
                2
            ),
            "utf8"
        );

        fs.renameSync(
            temp,
            SERVER_MESSAGES_FILE
        );
    } catch (error) {
        console.log(
            "Could not save server messages:",
            error.message
        );
    }
}

/* =====================================================
   SERVER PERMISSIONS
   ===================================================== */

function getServerMember(
    server,
    userID
) {
    const id = normalizeId(userID);

    return server.members.find(
        member =>
            normalizeId(
                member.userID
            ) === id
    );
}

function isServerMember(
    server,
    userID
) {
    return !!getServerMember(
        server,
        userID
    );
}

function isServerOwner(
    server,
    userID
) {
    const owner =
        normalizeId(
            server.ownerID
        );

    const requester =
        normalizeId(
            userID
        );

    return (
        !!owner &&
        !!requester &&
        owner === requester
    );
}

function publicMember(member) {
    return {
        userID: member.userID,
        name: member.name,
        role: member.role,
        joinedAt: member.joinedAt
    };
}

function publicServer(
    server,
    viewerID
) {
    const viewer =
        normalizeId(viewerID);

    return {
        serverID:
            server.serverID,

        ownerID:
            server.ownerID,

        name:
            server.name,

        description:
            server.description,

        icon:
            server.icon,

        banner:
            server.banner,

        createdAt:
            server.createdAt,

        members:
            server.members.map(
                publicMember
            ),

        memberCount:
            server.members.length,

        channels:
            server.channels,

        roles:
            server.roles,

        rules:
            server.rules,

        settings:
            server.settings,

        isMember:
            isServerMember(
                server,
                viewer
            ),

        isOwner:
            isServerOwner(
                server,
                viewer
            )
    };
}

function publicServerMessage(
    message
) {
    return {
        id: message.id,
        messageId: message.id,

        serverID:
            message.serverID,

        channelID:
            message.channelID,

        from:
            message.from,

        senderID:
            message.from,

        senderName:
            message.senderName,

        text:
            message.text,

        time:
            message.time,

        edited:
            !!message.edited,

        reaction:
            message.reaction ||
            null
    };
}

/* =====================================================
   WEBSOCKET SEND
   ===================================================== */

function sendToUser(
    userID,
    payload
) {
    const id =
        normalizeId(userID);

    const socket =
        sockets.get(id);

    if (
        socket &&
        socket.readyState ===
            WebSocket.OPEN
    ) {
        try {
            socket.send(
                JSON.stringify(payload)
            );

            return true;
        } catch (error) {
            console.log(
                "Send error:",
                error.message
            );
        }
    }

    return false;
}

function sendToServerMembers(
    serverData,
    payload
) {
    if (!serverData) {
        return;
    }

    for (
        const member of
        serverData.members
    ) {
        sendToUser(
            member.userID,
            payload
        );
    }
}

/* =====================================================
   PRESENCE
   ===================================================== */

function getPresenceForViewer(
    viewerID
) {
    const viewer =
        normalizeId(viewerID);

    const result = {};

    for (
        const [id, user]
        of users.entries()
    ) {
        const info =
            presence.get(id);

        let status = "offline";

        if (
            info &&
            info.online
        ) {
            if (
                info.chattingWith &&
                normalizeId(
                    info.chattingWith
                ) === viewer
            ) {
                status = "active";
            } else if (
                info.chattingWith
            ) {
                status = "busy";
            } else {
                status = "active";
            }
        }

        result[id] = {
            id: user.id,
            name: user.name,
            status
        };
    }

    return result;
}

function sendPresenceToViewer(
    userID
) {
    sendToUser(
        userID,
        {
            type: "presence",
            users:
                getPresenceForViewer(
                    userID
                )
        }
    );
}

function broadcastPresence() {
    for (
        const id of sockets.keys()
    ) {
        sendPresenceToViewer(id);
    }
}

/* =====================================================
   PROFILE PHOTOS
   ===================================================== */

function broadcastProfilePhoto(
    userID,
    photo
) {
    const senderID =
        normalizeId(userID);

    for (
        const [id, socket]
        of sockets.entries()
    ) {
        if (id === senderID) {
            continue;
        }

        if (
            socket &&
            socket.readyState ===
                WebSocket.OPEN
        ) {
            try {
                socket.send(
                    JSON.stringify({
                        type:
                            "profile_photo",

                        userId:
                            senderID,

                        photo,

                        data:
                            photo.data ||
                            photo
                    })
                );
            } catch {}
        }
    }
}

/* =====================================================
   STATIC FILE TYPES
   ===================================================== */

const contentTypes = {
    ".html":
        "text/html; charset=utf-8",

    ".js":
        "application/javascript; charset=utf-8",

    ".css":
        "text/css; charset=utf-8",

    ".json":
        "application/json; charset=utf-8",

    ".png":
        "image/png",

    ".jpg":
        "image/jpeg",

    ".jpeg":
        "image/jpeg",

    ".gif":
        "image/gif",

    ".svg":
        "image/svg+xml",

    ".ico":
        "image/x-icon",

    ".webp":
        "image/webp",

    ".woff":
        "font/woff",

    ".woff2":
        "font/woff2"
};

/* =====================================================
   LOAD DATA
   ===================================================== */

loadUsers();
loadServers();
loadServerMessages();

/* =====================================================
   HTTP SERVER
   ===================================================== */

const server =
    http.createServer(
        async (req, res) => {
            try {
                const url =
                    new URL(
                        req.url,
                        `http://${req.headers.host || "localhost"}`
                    );

                const pathname =
                    url.pathname;

                /* =========================================
                   HEALTH
                ========================================= */

                if (
                    req.method === "GET" &&
                    pathname === "/health"
                ) {
                    sendJSON(res, 200, {
                        ok: true,
                        service: "FriendChat",
                        users: users.size,
                        servers:
                            friendchatServers.size,
                        serverMessages:
                            serverMessages.size
                    });

                    return;
                }

                /* =========================================
                   USERS
                ========================================= */

                if (
                    req.method === "GET" &&
                    pathname === "/api/users"
                ) {
                    const excludeID =
                        normalizeId(
                            url.searchParams.get(
                                "exclude"
                            )
                        );

                    const result = [];

                    for (
                        const user
                        of users.values()
                    ) {
                        if (
                            excludeID &&
                            normalizeId(
                                user.id
                            ) === excludeID
                        ) {
                            continue;
                        }

                        const info =
                            presence.get(
                                user.id
                            );

                        const online =
                            !!(
                                info &&
                                info.online
                            );

                        result.push({
                            id: user.id,
                            name: user.name,
                            online,
                            status:
                                online
                                    ? "active"
                                    : "offline"
                        });
                    }

                    result.sort(
                        (a, b) =>
                            String(
                                a.name
                            ).localeCompare(
                                String(
                                    b.name
                                )
                            )
                    );

                    sendJSON(res, 200, {
                        ok: true,
                        users: result
                    });

                    return;
                }

                /* =========================================
                   ONE USER
                ========================================= */

                if (
                    req.method === "GET" &&
                    pathname.startsWith(
                        "/api/user/"
                    )
                ) {
                    const id =
                        normalizeId(
                            decodeURIComponent(
                                pathname.substring(
                                    "/api/user/"
                                        .length
                                )
                            )
                        );

                    const user =
                        users.get(id);

                    sendJSON(res, 200, {
                        ok: true,
                        found: !!user,
                        user:
                            user
                                ? {
                                    id:
                                        user.id,
                                    name:
                                        user.name
                                }
                                : null
                    });

                    return;
                }

                /* =========================================
                   ACCOUNT SYNC
                ========================================= */

                if (
                    req.method === "POST" &&
                    pathname ===
                        "/api/account/sync"
                ) {
                    const body =
                        await readJSONBody(
                            req
                        );

                    const userID =
                        normalizeId(
                            body.userID ||
                            body.userId ||
                            body.id ||
                            req.headers[
                                "x-friendchat-user-id"
                            ]
                        );

                    const name =
                        cleanText(
                            body.name ||
                            body.username ||
                            body.displayName ||
                            "Friend",
                            100
                        );

                    if (!userID) {
                        sendError(
                            res,
                            400,
                            "User ID is required."
                        );

                        return;
                    }

                    const user =
                        ensureUser(
                            userID,
                            name
                        );

                    sendJSON(res, 200, {
                        ok: true,
                        user: {
                            id: user.id,
                            name: user.name
                        }
                    });

                    return;
                }

                /* =========================================
                   GET SERVER LIST
                ========================================= */

                if (
                    req.method === "GET" &&
                    pathname ===
                        "/api/servers"
                ) {
                    const userID =
                        getRequestUserID(
                            req,
                            url
                        );

                    if (!userID) {
                        sendError(
                            res,
                            400,
                            "User ID is required."
                        );

                        return;
                    }

                    const result = [];

                    for (
                        const serverData
                        of friendchatServers.values()
                    ) {
                        if (
                            isServerMember(
                                serverData,
                                userID
                            )
                        ) {
                            result.push(
                                publicServer(
                                    serverData,
                                    userID
                                )
                            );
                        }
                    }

                    sendJSON(res, 200, {
                        ok: true,
                        servers: result
                    });

                    return;
                }

                /* =========================================
                   CREATE SERVER
                ========================================= */

                if (
                    req.method === "POST" &&
                    pathname ===
                        "/api/servers"
                ) {
                    const body =
                        await readJSONBody(
                            req
                        );

                    const ownerID =
                        getBodyRequesterID(
                            body,
                            req
                        );

                    if (!ownerID) {
                        sendError(
                            res,
                            400,
                            "Owner ID is required."
                        );

                        return;
                    }

                    const owner =
                        ensureUser(
                            ownerID,
                            body.ownerName ||
                            body.name ||
                            body.username ||
                            "Friend"
                        );

                    const name =
                        cleanText(
                            body.name,
                            40
                        );

                    if (name.length < 2) {
                        sendError(
                            res,
                            400,
                            "Server name must be at least 2 characters."
                        );

                        return;
                    }

                    const now =
                        Date.now();

                    const serverID =
                        normalizeId(
                            generateID(
                                "FC-SRV"
                            )
                        );

                    const serverData =
                        normalizeServer({
                            serverID,
                            ownerID,
                            ownerName:
                                owner.name,
                            name,
                            description:
                                body.description,
                            icon:
                                body.icon ||
                                null,
                            banner:
                                body.banner ||
                                null,
                            createdAt: now,

                            members: [
                                {
                                    userID:
                                        ownerID,
                                    name:
                                        owner.name,
                                    role:
                                        "owner",
                                    joinedAt:
                                        now
                                }
                            ],

                            channels: [
                                {
                                    channelID:
                                        generateID(
                                            "CH"
                                        ),
                                    name:
                                        "general",
                                    type:
                                        "text",
                                    createdAt:
                                        now
                                }
                            ],

                            roles:
                                body.roles ||
                                [],

                            rules:
                                body.rules ||
                                [],

                            settings:
                                body.settings ||
                                null
                        });

                    friendchatServers.set(
                        serverID,
                        serverData
                    );

                    saveServers();

                    const publicData =
                        publicServer(
                            serverData,
                            ownerID
                        );

                    sendToUser(
                        ownerID,
                        {
                            type:
                                "server_created",
                            server:
                                publicData
                        }
                    );

                    sendJSON(res, 201, {
                        ok: true,
                        server:
                            publicData
                    });

                    console.log("");
                    console.log(
                        "SERVER CREATED"
                    );
                    console.log(
                        "ID:",
                        serverID
                    );
                    console.log(
                        "OWNER:",
                        ownerID
                    );
                    console.log("");

                    return;
                }

                /* =========================================
                   SERVER ROUTE
                ========================================= */

                const serverMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)$/
                    );

                /* =========================================
                   GET SERVER
                ========================================= */

                if (
                    req.method === "GET" &&
                    serverMatch
                ) {
                    const serverID =
                        normalizeId(
                            decodeURIComponent(
                                serverMatch[1]
                            )
                        );

                    const viewerID =
                        getRequestUserID(
                            req,
                            url
                        );

                    const serverData =
                        getServerByID(
                            serverID
                        );

                    if (!serverData) {
                        sendError(
                            res,
                            404,
                            "Server not found.",
                            {
                                code:
                                    "SERVER_NOT_FOUND"
                            }
                        );

                        return;
                    }

                    if (!viewerID) {
                        sendError(
                            res,
                            401,
                            "User ID is required.",
                            {
                                code:
                                    "USER_ID_REQUIRED"
                            }
                        );

                        return;
                    }

                    if (
                        !isServerMember(
                            serverData,
                            viewerID
                        )
                    ) {
                        sendError(
                            res,
                            403,
                            "You are not a member of this server.",
                            {
                                code:
                                    "NOT_SERVER_MEMBER"
                            }
                        );

                        return;
                    }

                    sendJSON(res, 200, {
                        ok: true,
                        server:
                            publicServer(
                                serverData,
                                viewerID
                            )
                    });

                    return;
                }

                /* =========================================
                   SERVER MESSAGE HISTORY
                ========================================= */

                const historyMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/messages$/
                    );

                if (
                    req.method === "GET" &&
                    historyMatch
                ) {
                    const serverID =
                        normalizeId(
                            decodeURIComponent(
                                historyMatch[1]
                            )
                        );

                    const viewerID =
                        getRequestUserID(
                            req,
                            url
                        );

                    const channelID =
                        cleanText(
                            url.searchParams.get(
                                "channel"
                            ) ||
                            url.searchParams.get(
                                "channelID"
                            ) ||
                            url.searchParams.get(
                                "channelId"
                            ) ||
                            "",
                            100
                        );

                    const serverData =
                        getServerByID(
                            serverID
                        );

                    if (!serverData) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    if (
                        !isServerMember(
                            serverData,
                            viewerID
                        )
                    ) {
                        sendError(
                            res,
                            403,
                            "You are not a member of this server."
                        );

                        return;
                    }

                    let messages =
                        Array.from(
                            serverMessages.values()
                        ).filter(
                            message =>
                                normalizeId(
                                    message.serverID
                                ) ===
                                serverID
                        );

                    if (channelID) {
                        messages =
                            messages.filter(
                                message =>
                                    message.channelID ===
                                    channelID
                            );
                    }

                    messages.sort(
                        (a, b) =>
                            Number(a.time) -
                            Number(b.time)
                    );

                    if (
                        messages.length >
                        500
                    ) {
                        messages =
                            messages.slice(-500);
                    }

                    sendJSON(res, 200, {
                        ok: true,
                        serverID,
                        channelID,
                        messages:
                            messages.map(
                                publicServerMessage
                            )
                    });

                    return;
                }

                /* =========================================
                   ADD MEMBER
                ========================================= */

                const membersMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/members$/
                    );

                if (
                    req.method === "POST" &&
                    membersMatch
                ) {
                    const serverID =
                        normalizeId(
                            decodeURIComponent(
                                membersMatch[1]
                            )
                        );

                    const body =
                        await readJSONBody(
                            req
                        );

                    /*
                       Accept every common frontend
                       field name.
                    */

                    const requesterID =
                        normalizeId(
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
                            req.headers[
                                "x-friendchat-user-id"
                            ]
                        );

                    const memberID =
                        normalizeId(
                            body.memberID ||
                            body.memberId ||
                            body.targetUserID ||
                            body.targetUserId ||
                            body.friendID ||
                            body.friendId ||
                            body.friendUserID ||
                            body.friendUserId ||
                            body.addUserID ||
                            body.addUserId
                        );

                    console.log("");
                    console.log(
                        "========================================"
                    );
                    console.log(
                        "ADD SERVER MEMBER"
                    );
                    console.log(
                        "SERVER:",
                        serverID
                    );
                    console.log(
                        "REQUESTER:",
                        requesterID
                    );
                    console.log(
                        "TARGET:",
                        memberID
                    );

                    const serverData =
                        getServerByID(
                            serverID
                        );

                    if (!serverData) {
                        console.log(
                            "SERVER NOT FOUND"
                        );

                        sendError(
                            res,
                            404,
                            "Server not found.",
                            {
                                code:
                                    "SERVER_NOT_FOUND"
                            }
                        );

                        return;
                    }

                    if (!requesterID) {
                        sendError(
                            res,
                            400,
                            "Requester ID is required.",
                            {
                                code:
                                    "REQUESTER_ID_REQUIRED"
                            }
                        );

                        return;
                    }

                    if (!memberID) {
                        sendError(
                            res,
                            400,
                            "Member ID is required.",
                            {
                                code:
                                    "MEMBER_ID_REQUIRED"
                            }
                        );

                        return;
                    }

                    /*
                       SHOW THE ACTUAL OWNER IN CONSOLE
                    */

                    console.log(
                        "REAL OWNER:",
                        normalizeId(
                            serverData.ownerID
                        )
                    );

                    console.log(
                        "REQUESTER:",
                        requesterID
                    );
const requesterMember =
    getServerMember(
        serverData,
        requesterID
    );

const isOwner =
    normalizeId(serverData.ownerID) ===
    normalizeId(requesterID);

const isAdmin =
    requesterMember &&
    requesterMember.role === "admin";

const canManageMembers =
    isOwner || isAdmin;

console.log("========== ADD MEMBER PERMISSION ==========");
console.log("SERVER:", serverData.serverID);
console.log("OWNER:", serverData.ownerID);
console.log("REQUESTER:", requesterID);
console.log("REQUESTER MEMBER:", requesterMember);
console.log("REQUESTER ROLE:", requesterMember?.role);
console.log("IS OWNER:", isOwner);
console.log("IS ADMIN:", isAdmin);
console.log("CAN ADD:", canManageMembers);
console.log("============================================");

if (!canManageMembers) {
    sendError(
        res,
        403,
        "Only the server owner or an admin can add members.",
        {
            code: "MEMBER_ADD_FORBIDDEN",
            ownerID: serverData.ownerID,
            requesterID: requesterID,
            requesterRole:
                requesterMember?.role || "none"
        }
    );

    return;
}

                    /*
                       TARGET USER
                    */

                    const user =
                        users.get(
                            memberID
                        );

                    if (!user) {
                        sendError(
                            res,
                            404,
                            "FriendChat user was not found.",
                            {
                                code:
                                    "USER_NOT_FOUND"
                            }
                        );

                        return;
                    }

                    /*
                       ALREADY MEMBER
                    */

                    if (
                        isServerMember(
                            serverData,
                            memberID
                        )
                    ) {
                        sendError(
                            res,
                            409,
                            "This user is already a member.",
                            {
                                code:
                                    "ALREADY_MEMBER"
                            }
                        );

                        return;
                    }

                    /*
                       ADD MEMBER
                    */

                    const member = {
                        userID:
                            memberID,

                        name:
                            user.name,

                        role:
                            "member",

                        joinedAt:
                            Date.now()
                    };

                    serverData.members.push(
                        member
                    );

                    /*
                       IMPORTANT:
                       Keep owner role correct.
                    */

                    serverData.members =
                        serverData.members.map(
                            m => ({
                                ...m,
                           role:
    normalizeId(
        m.userID
    ) ===
    normalizeId(
        serverData.ownerID
    )
        ? "owner"
        : m.role === "admin"
            ? "admin"
            : "member"
                            })
                        );

                    saveServers();

                    /*
                       Notify new member
                    */

                    sendToUser(
                        memberID,
                        {
                            type:
                                "server_added",

                            server:
                                publicServer(
                                    serverData,
                                    memberID
                                )
                        }
                    );

                    /*
                       Notify owner
                    */

                    sendToUser(
                        requesterID,
                        {
                            type:
                                "server_member_added",

                            serverID:
                                serverData.serverID,

                            member:
                                publicMember(
                                    member
                                )
                        }
                    );

                    /*
                       Notify everyone
                    */

                    sendToServerMembers(
                        serverData,
                        {
                            type:
                                "server_updated",

                            server:
                                publicServer(
                                    serverData,
                                    requesterID
                                )
                        }
                    );

                    console.log(
                        "MEMBER ADDED:",
                        memberID
                    );

                    console.log(
                        "SUCCESS"
                    );

                    console.log(
                        "========================================"
                    );
                    console.log("");

                    sendJSON(res, 200, {
                        ok: true,

                        server:
                            publicServer(
                                serverData,
                                requesterID
                            )
                    });

                    return;
                }

                /* =========================================
                   REMOVE MEMBER
                ========================================= */

                const removeMemberMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/members\/([^/]+)$/
                    );

                if (
                    req.method === "DELETE" &&
                    removeMemberMatch
                ) {
                    const serverID =
                        normalizeId(
                            decodeURIComponent(
                                removeMemberMatch[1]
                            )
                        );

                    const memberID =
                        normalizeId(
                            decodeURIComponent(
                                removeMemberMatch[2]
                            )
                        );

                    const requesterID =
                        getRequestUserID(
                            req,
                            url
                        );

                    const serverData =
                        getServerByID(
                            serverID
                        );

                    if (!serverData) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    if (
                        !isServerOwner(
                            serverData,
                            requesterID
                        )
                    ) {
                        sendError(
                            res,
                            403,
                            "Only the server owner can remove members."
                        );

                        return;
                    }

                    if (
                        memberID ===
                        normalizeId(
                            serverData.ownerID
                        )
                    ) {
                        sendError(
                            res,
                            400,
                            "The server owner cannot be removed."
                        );

                        return;
                    }

                    const oldLength =
                        serverData.members.length;

                    serverData.members =
                        serverData.members.filter(
                            member =>
                                normalizeId(
                                    member.userID
                                ) !== memberID
                        );

                    if (
                        serverData.members.length ===
                        oldLength
                    ) {
                        sendError(
                            res,
                            404,
                            "Member was not found."
                        );

                        return;
                    }

                    saveServers();

                    sendToUser(
                        memberID,
                        {
                            type:
                                "server_removed",

                            serverID:
                                serverData.serverID
                        }
                    );

                    sendToServerMembers(
                        serverData,
                        {
                            type:
                                "server_updated",

                            server:
                                publicServer(
                                    serverData,
                                    requesterID
                                )
                        }
                    );

                    sendJSON(res, 200, {
                        ok: true,

                        server:
                            publicServer(
                                serverData,
                                requesterID
                            )
                    });

                    return;
                }

                /* =========================================
                   UPDATE SERVER
                ========================================= */

                if (
                    req.method === "PUT" &&
                    serverMatch
                ) {
                    const serverID =
                        normalizeId(
                            decodeURIComponent(
                                serverMatch[1]
                            )
                        );

                    const body =
                        await readJSONBody(
                            req
                        );

                    const requesterID =
                        getBodyRequesterID(
                            body,
                            req
                        );

                    const serverData =
                        getServerByID(
                            serverID
                        );

                    if (!serverData) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    if (
                        !isServerOwner(
                            serverData,
                            requesterID
                        )
                    ) {
                        sendError(
                            res,
                            403,
                            "Only the server owner can edit server settings."
                        );

                        return;
                    }

                    if (
                        body.name !==
                        undefined
                    ) {
                        const name =
                            cleanText(
                                body.name,
                                40
                            );

                        if (
                            name.length < 2
                        ) {
                            sendError(
                                res,
                                400,
                                "Server name must be at least 2 characters."
                            );

                            return;
                        }

                        serverData.name =
                            name;
                    }

                    if (
                        body.description !==
                        undefined
                    ) {
                        serverData.description =
                            cleanText(
                                body.description,
                                200
                            );
                    }

                    if (
                        body.icon !==
                        undefined
                    ) {
                        serverData.icon =
                            body.icon ||
                            null;
                    }

                    if (
                        body.banner !==
                        undefined
                    ) {
                        serverData.banner =
                            body.banner ||
                            null;
                    }

                    if (
                        body.settings &&
                        typeof body.settings ===
                            "object"
                    ) {
                        serverData.settings = {
                            ...serverData.settings,
                            ...body.settings
                        };
                    }

                    if (
                        Array.isArray(
                            body.channels
                        )
                    ) {
                        serverData.channels =
                            body.channels
                                .map(
                                    normalizeChannel
                                )
                                .filter(Boolean)
                                .slice(0, 200);

                        if (
                            serverData.channels
                                .length === 0
                        ) {
                            serverData.channels.push(
                                {
                                    channelID:
                                        generateID(
                                            "CH"
                                        ),
                                    name:
                                        "general",
                                    type:
                                        "text",
                                    createdAt:
                                        Date.now()
                                }
                            );
                        }
                    }

                    if (
                        Array.isArray(
                            body.roles
                        )
                    ) {
                        serverData.roles =
                            body.roles
                                .map(
                                    normalizeRole
                                )
                                .filter(Boolean)
                                .slice(0, 200);
                    }

                    if (
                        Array.isArray(
                            body.rules
                        )
                    ) {
                        serverData.rules =
                            body.rules.slice(
                                0,
                                200
                            );
                    }

                    saveServers();

                    sendToServerMembers(
                        serverData,
                        {
                            type:
                                "server_updated",

                            server:
                                publicServer(
                                    serverData,
                                    requesterID
                                )
                        }
                    );

                    sendJSON(res, 200, {
                        ok: true,

                        server:
                            publicServer(
                                serverData,
                                requesterID
                            )
                    });

                    return;
                }

                /* =========================================
                   POST SERVER MESSAGE
                ========================================= */

                const messagePostMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/messages$/
                    );

                if (
                    req.method === "POST" &&
                    messagePostMatch
                ) {
                    const serverID =
                        normalizeId(
                            decodeURIComponent(
                                messagePostMatch[1]
                            )
                        );

                    const body =
                        await readJSONBody(
                            req
                        );

                    const senderID =
                        getBodyRequesterID(
                            body,
                            req
                        );

                    const serverData =
                        getServerByID(
                            serverID
                        );

                    if (!serverData) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    if (
                        !isServerMember(
                            serverData,
                            senderID
                        )
                    ) {
                        sendError(
                            res,
                            403,
                            "You are not a member of this server."
                        );

                        return;
                    }

                    const channelID =
                        cleanText(
                            body.channelID ||
                            body.channelId ||
                            serverData
                                .channels[0]
                                ?.channelID ||
                            "",
                            100
                        );

                    const text =
                        String(
                            body.text ||
                            body.message ||
                            ""
                        )
                            .trim()
                            .slice(0, 5000);

                    if (!text) {
                        sendError(
                            res,
                            400,
                            "Message cannot be empty."
                        );

                        return;
                    }

                    const sender =
                        users.get(
                            senderID
                        );

                    const message = {
                        id:
                            String(
                                body.messageId ||
                                body.id ||
                                generateID("SM")
                            ),

                        serverID,

                        channelID,

                        from:
                            senderID,

                        senderName:
                            sender?.name ||
                            "Friend",

                        text,

                        time:
                            Number(
                                body.time
                            ) ||
                            Date.now(),

                        edited: false,

                        reaction: null
                    };

                    serverMessages.set(
                        message.id,
                        message
                    );

                    saveServerMessages();

                    sendToServerMembers(
                        serverData,
                        {
                            type:
                                "server_message",

                            message:
                                publicServerMessage(
                                    message
                                )
                        }
                    );

                    sendJSON(res, 201, {
                        ok: true,

                        message:
                            publicServerMessage(
                                message
                            )
                    });

                    return;
                }

                /* =========================================
                   DELETE SERVER MESSAGE
                ========================================= */

                const messageDeleteMatch =
                    pathname.match(
                        /^\/api\/servers\/([^/]+)\/messages\/([^/]+)$/
                    );

                if (
                    req.method === "DELETE" &&
                    messageDeleteMatch
                ) {
                    const serverID =
                        normalizeId(
                            decodeURIComponent(
                                messageDeleteMatch[1]
                            )
                        );

                    const messageID =
                        decodeURIComponent(
                            messageDeleteMatch[2]
                        );

                    const requesterID =
                        getRequestUserID(
                            req,
                            url
                        );

                    const serverData =
                        getServerByID(
                            serverID
                        );

                    const message =
                        serverMessages.get(
                            messageID
                        );

                    if (!serverData) {
                        sendError(
                            res,
                            404,
                            "Server not found."
                        );

                        return;
                    }

                    if (!message) {
                        sendError(
                            res,
                            404,
                            "Message not found."
                        );

                        return;
                    }

                    if (
                        normalizeId(
                            message.serverID
                        ) !== serverID
                    ) {
                        sendError(
                            res,
                            400,
                            "Message does not belong to this server."
                        );

                        return;
                    }

                    if (
                        !isServerMember(
                            serverData,
                            requesterID
                        )
                    ) {
                        sendError(
                            res,
                            403,
                            "You are not a server member."
                        );

                        return;
                    }

                    if (
                        normalizeId(
                            message.from
                        ) !== requesterID &&
                        !isServerOwner(
                            serverData,
                            requesterID
                        )
                    ) {
                        sendError(
                            res,
                            403,
                            "You cannot delete this message."
                        );

                        return;
                    }

                    serverMessages.delete(
                        messageID
                    );

                    saveServerMessages();

                    sendToServerMembers(
                        serverData,
                        {
                            type:
                                "server_message_deleted",

                            serverID,

                            messageId:
                                messageID,

                            id:
                                messageID
                        }
                    );

                    sendJSON(res, 200, {
                        ok: true
                    });

                    return;
                }

                /* =========================================
                   PRESENCE
                ========================================= */

                if (
                    req.method === "GET" &&
                    pathname ===
                        "/api/presence"
                ) {
                    const result = {};

                    for (
                        const [
                            id,
                            info
                        ] of presence.entries()
                    ) {
                        result[id] = {
                            id: info.id,
                            name: info.name,
                            online: info.online,
                            chattingWith:
                                info.chattingWith
                        };
                    }

                    sendJSON(
                        res,
                        200,
                        result
                    );

                    return;
                }

                /* =========================================
                   PROFILE PHOTO
                ========================================= */

                if (
                    req.method === "GET" &&
                    pathname.startsWith(
                        "/api/profile-photo/"
                    )
                ) {
                    const id =
                        normalizeId(
                            decodeURIComponent(
                                pathname.substring(
                                    "/api/profile-photo/"
                                        .length
                                )
                            )
                        );

                    const photo =
                        profilePhotos.get(id);

                    if (!photo) {
                        sendJSON(
                            res,
                            404,
                            {
                                found: false
                            }
                        );

                        return;
                    }

                    sendJSON(res, 200, {
                        found: true,
                        userId: id,
                        photo
                    });

                    return;
                }

                /* =========================================
                   STATIC FILES
                ========================================= */

                let requestedFile =
                    pathname;

                if (
                    requestedFile === "/"
                ) {
                    requestedFile =
                        "/index.html";
                }

                let relativeFile =
                    requestedFile.replace(
                        /^\/+/,
                        ""
                    );

                relativeFile =
                    path.normalize(
                        relativeFile
                    );

                if (
                    relativeFile.startsWith(
                        ".." + path.sep
                    ) ||
                    relativeFile === ".."
                ) {
                    res.writeHead(403);
                    res.end("Forbidden");
                    return;
                }

                const filePath =
                    path.resolve(
                        ROOT_DIR,
                        relativeFile
                    );

                const rootWithSeparator =
                    ROOT_DIR.endsWith(
                        path.sep
                    )
                        ? ROOT_DIR
                        : ROOT_DIR +
                          path.sep;

                if (
                    filePath !== ROOT_DIR &&
                    !filePath.startsWith(
                        rootWithSeparator
                    )
                ) {
                    res.writeHead(403);
                    res.end("Forbidden");
                    return;
                }

                fs.readFile(
                    filePath,
                    (error, data) => {
                        if (error) {
                            res.writeHead(
                                404,
                                {
                                    "Content-Type":
                                        "text/plain; charset=utf-8"
                                }
                            );

                            res.end(
                                `FILE NOT FOUND: ${filePath}`
                            );

                            return;
                        }

                        const extension =
                            path.extname(
                                filePath
                            ).toLowerCase();

                        res.writeHead(
                            200,
                            {
                                "Content-Type":
                                    contentTypes[
                                        extension
                                    ] ||
                                    "application/octet-stream",

                                "Cache-Control":
                                    extension ===
                                        ".css" ||
                                    extension ===
                                        ".js"
                                        ? "no-cache"
                                        : "public, max-age=3600"
                            }
                        );

                        res.end(data);
                    }
                );
            } catch (error) {
                console.log(
                    "HTTP ERROR:",
                    error.message
                );

                if (!res.headersSent) {
                    sendError(
                        res,
                        500,
                        error.message ||
                            "Internal server error."
                    );
                }
            }
        }
    );

/* =====================================================
   WEBSOCKET SERVER
   ===================================================== */

const wss =
    new WebSocket.Server({
        server,
        // 150 MiB files become roughly 200 MiB when base64 encoded, plus JSON overhead.
        maxPayload: 220 * 1024 * 1024
    });

wss.on(
    "connection",
    socket => {
        console.log(
            "Device connected"
        );

        socket.isAlive = true;

        socket.on(
            "pong",
            () => {
                socket.isAlive = true;
            }
        );

        socket.on(
            "message",
            raw => {
                try {
                    const msg =
                        JSON.parse(
                            raw.toString()
                        );

                    /* =====================================
                       REGISTER
                    ===================================== */

                    if (
                        msg.type ===
                        "register"
                    ) {
                        const userID =
                            normalizeId(
                                msg.userId ||
                                msg.userID
                            );

                        if (!userID) {
                            return;
                        }

                        const name =
                            cleanText(
                                msg.name ||
                                msg.username ||
                                "Friend",
                                100
                            );

                        const oldSocket =
                            sockets.get(
                                userID
                            );

                        if (
                            oldSocket &&
                            oldSocket !== socket
                        ) {
                            try {
                                oldSocket.close();
                            } catch {}
                        }

                        const user =
                            ensureUser(
                                userID,
                                name
                            );

                        sockets.set(
                            userID,
                            socket
                        );

                        socket.userId =
                            userID;

                        presence.set(
                            userID,
                            {
                                id:
                                    userID,

                                name:
                                    user.name,

                                online:
                                    true,

                                chattingWith:
                                    null
                            }
                        );

                        sendToUser(
                            userID,
                            {
                                type:
                                    "registered",

                                userId:
                                    userID
                            }
                        );

                        /*
                           Send servers
                        */

                        const userServers =
                            [];

                        for (
                            const serverData
                            of friendchatServers.values()
                        ) {
                            if (
                                isServerMember(
                                    serverData,
                                    userID
                                )
                            ) {
                                userServers.push(
                                    publicServer(
                                        serverData,
                                        userID
                                    )
                                );
                            }
                        }

                        sendToUser(
                            userID,
                            {
                                type:
                                    "server_list",

                                servers:
                                    userServers
                            }
                        );

                        broadcastPresence();

                        console.log(
                            "Registered:",
                            userID,
                            "-",
                            user.name
                        );

                        return;
                    }

                    /* =====================================
                       PRESENCE
                    ===================================== */

                    if (
                        msg.type ===
                        "presence_chat"
                    ) {
                        const userID =
                            socket.userId;

                        if (!userID) {
                            return;
                        }

                        const info =
                            presence.get(
                                userID
                            );

                        if (!info) {
                            return;
                        }

                        info.chattingWith =
                            msg.chatWith
                                ? normalizeId(
                                    msg.chatWith
                                )
                                : null;

                        presence.set(
                            userID,
                            info
                        );

                        broadcastPresence();

                        return;
                    }

                    /* =====================================
                       SERVER LIST REQUEST
                    ===================================== */

                    if (
                        msg.type ===
                        "server_list_request"
                    ) {
                        const userID =
                            normalizeId(
                                socket.userId
                            );

                        if (!userID) {
                            return;
                        }

                        const servers = [];

                        for (
                            const serverData
                            of friendchatServers.values()
                        ) {
                            if (
                                isServerMember(
                                    serverData,
                                    userID
                                )
                            ) {
                                servers.push(
                                    publicServer(
                                        serverData,
                                        userID
                                    )
                                );
                            }
                        }

                        sendToUser(
                            userID,
                            {
                                type:
                                    "server_list",
                                servers
                            }
                        );

                        return;
                    }

                    /* =====================================
                       SERVER OPEN
                    ===================================== */

                    if (
                        msg.type ===
                            "server_open" ||
                        msg.type ===
                            "server_request"
                    ) {
                        const userID =
                            normalizeId(
                                socket.userId
                            );

                        const serverID =
                            normalizeId(
                                msg.serverID ||
                                msg.serverId ||
                                msg.id ||
                                ""
                            );

                        const serverData =
                            getServerByID(
                                serverID
                            );

                        if (!serverData) {
                            sendToUser(
                                userID,
                                {
                                    type:
                                        "server_error",

                                    error:
                                        "Server not found.",

                                    code:
                                        "SERVER_NOT_FOUND"
                                }
                            );

                            return;
                        }

                        if (
                            !isServerMember(
                                serverData,
                                userID
                            )
                        ) {
                            sendToUser(
                                userID,
                                {
                                    type:
                                        "server_error",

                                    error:
                                        "You are not a member of this server.",

                                    code:
                                        "NOT_SERVER_MEMBER"
                                }
                            );

                            return;
                        }

                        sendToUser(
                            userID,
                            {
                                type:
                                    "server_opened",

                                server:
                                    publicServer(
                                        serverData,
                                        userID
                                    )
                            }
                        );

                        return;
                    }

                    /* =====================================
                       SERVER MESSAGE
                    ===================================== */

                    if (
                        msg.type ===
                            "server_message" ||
                        msg.type ===
                            "server_chat" ||
                        msg.type ===
                            "channel_message"
                    ) {
                        const senderID =
                            normalizeId(
                                socket.userId
                            );

                        const serverID =
                            normalizeId(
                                msg.serverID ||
                                msg.serverId ||
                                ""
                            );

                        const serverData =
                            getServerByID(
                                serverID
                            );

                        if (!serverData) {
                            sendToUser(
                                senderID,
                                {
                                    type:
                                        "server_error",

                                    error:
                                        "Server not found.",

                                    code:
                                        "SERVER_NOT_FOUND"
                                }
                            );

                            return;
                        }

                        if (
                            !isServerMember(
                                serverData,
                                senderID
                            )
                        ) {
                            sendToUser(
                                senderID,
                                {
                                    type:
                                        "server_error",

                                    error:
                                        "You are not a member of this server.",

                                    code:
                                        "NOT_SERVER_MEMBER"
                                }
                            );

                            return;
                        }

                        const channelID =
                            cleanText(
                                msg.channelID ||
                                msg.channelId ||
                                serverData
                                    .channels[0]
                                    ?.channelID ||
                                "",
                                100
                            );

                        const text =
                            String(
                                msg.text ||
                                msg.message ||
                                ""
                            )
                                .trim()
                                .slice(
                                    0,
                                    5000
                                );

                        if (!text) {
                            return;
                        }

                        const sender =
                            users.get(
                                senderID
                            );

                        const message = {
                            id:
                                String(
                                    msg.messageId ||
                                    msg.id ||
                                    generateID(
                                        "SM"
                                    )
                                ),

                            serverID,

                            channelID,

                            from:
                                senderID,

                            senderName:
                                sender?.name ||
                                "Friend",

                            text,

                            time:
                                Number(
                                    msg.time
                                ) ||
                                Date.now(),

                            edited:
                                false,

                            reaction:
                                null
                        };

                        serverMessages.set(
                            message.id,
                            message
                        );

                        saveServerMessages();

                        sendToServerMembers(
                            serverData,
                            {
                                type:
                                    "server_message",

                                message:
                                    publicServerMessage(
                                        message
                                    )
                            }
                        );

                        return;
                    }

                    /* =====================================
                       SERVER REACTION
                    ===================================== */

                    if (
                        msg.type ===
                            "server_reaction" ||
                        msg.type ===
                            "server_message_reaction"
                    ) {
                        const userID =
                            normalizeId(
                                socket.userId
                            );

                        const messageID =
                            String(
                                msg.messageId ||
                                msg.id ||
                                ""
                            );

                        const message =
                            serverMessages.get(
                                messageID
                            );

                        if (!message) {
                            return;
                        }

                        const serverData =
                            getServerByID(
                                message.serverID
                            );

                        if (!serverData) {
                            return;
                        }

                        if (
                            !isServerMember(
                                serverData,
                                userID
                            )
                        ) {
                            return;
                        }

                        message.reaction =
                            String(
                                msg.reaction ||
                                ""
                            );

                        saveServerMessages();

                        sendToServerMembers(
                            serverData,
                            {
                                type:
                                    "server_reaction",

                                id:
                                    messageID,

                                messageId:
                                    messageID,

                                serverID:
                                    message.serverID,

                                reaction:
                                    message.reaction,

                                from:
                                    userID
                            }
                        );

                        return;
                    }

                    /* =====================================
                       SERVER MESSAGE READ
                    ===================================== */

                    if (
                        msg.type ===
                            "server_read" ||
                        msg.type ===
                            "server_message_read"
                    ) {
                        const userID =
                            normalizeId(
                                socket.userId
                            );

                        const messageID =
                            String(
                                msg.messageId ||
                                msg.id ||
                                ""
                            );

                        const message =
                            serverMessages.get(
                                messageID
                            );

                        if (!message) {
                            return;
                        }

                        const serverData =
                            getServerByID(
                                message.serverID
                            );

                        if (!serverData) {
                            return;
                        }

                        if (
                            !isServerMember(
                                serverData,
                                userID
                            )
                        ) {
                            return;
                        }

                        sendToServerMembers(
                            serverData,
                            {
                                type:
                                    "server_read",

                                id:
                                    messageID,

                                messageId:
                                    messageID,

                                serverID:
                                    message.serverID,

                                userID
                            }
                        );

                        return;
                    }

                    /* =====================================
                       SERVER MESSAGE DELETE
                    ===================================== */

                    if (
                        msg.type ===
                        "server_message_delete"
                    ) {
                        const userID =
                            normalizeId(
                                socket.userId
                            );

                        const messageID =
                            String(
                                msg.messageId ||
                                msg.id ||
                                ""
                            );

                        const message =
                            serverMessages.get(
                                messageID
                            );

                        if (!message) {
                            return;
                        }

                        const serverData =
                            getServerByID(
                                message.serverID
                            );

                        if (!serverData) {
                            return;
                        }

                        if (
                            !isServerMember(
                                serverData,
                                userID
                            )
                        ) {
                            return;
                        }

                        if (
                            normalizeId(
                                message.from
                            ) !== userID &&
                            !isServerOwner(
                                serverData,
                                userID
                            )
                        ) {
                            return;
                        }

                        serverMessages.delete(
                            messageID
                        );

                        saveServerMessages();

                        sendToServerMembers(
                            serverData,
                            {
                                type:
                                    "server_message_deleted",

                                id:
                                    messageID,

                                messageId:
                                    messageID,

                                serverID:
                                    message.serverID
                            }
                        );

                        return;
                    }

                    /* =====================================
                       CHUNKED IMAGE / VIDEO MEDIA
                    ===================================== */

                    if (msg.type === "media_transfer_start") {
                        const senderID = normalizeId(socket.userId);
                        const claimedSenderID = normalizeId(msg.from);
                        const targetID = normalizeId(msg.to);
                        const messageID = String(msg.messageId || msg.id || "").slice(0, 160);
                        const mediaType = msg.mediaType === "image" ? "image" : msg.mediaType === "video" ? "video" : "";
                        const size = Number(msg.size) || 0;
                        if (!senderID || claimedSenderID !== senderID || !targetID || targetID === senderID || !messageID || !mediaType || size <= 0 || size > 150 * 1024 * 1024) {
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Invalid media. Maximum file size is 150 MB." });
                            return;
                        }
                        if (!sockets.has(targetID) || sockets.get(targetID).readyState !== WebSocket.OPEN) {
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Friend is offline. Keep FriendChat open and send the video again." });
                            return;
                        }
                        const key = senderID + ":" + messageID;
                        mediaTransfers.set(key, {
                            senderID, targetID, messageID, mediaType, size,
                            mimeType: String(msg.mimeType || "").slice(0, 120),
                            name: cleanText(msg.name || "media", 255),
                            time: Number(msg.time) || Date.now(), nextIndex: 0,
                            startedAt: Date.now()
                        });
                        const sent = sendToUser(targetID, {
                            type: "media_transfer_start", id: messageID, messageId: messageID,
                            from: senderID, to: targetID, mediaType,
                            mimeType: String(msg.mimeType || "").slice(0, 120),
                            name: cleanText(msg.name || "media", 255), size,
                            time: Number(msg.time) || Date.now()
                        });
                        if (!sent) {
                            mediaTransfers.delete(key);
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Could not reach your friend. Please try again." });
                            return;
                        }
                        sendToUser(senderID, { type: "media_upload_ready", id: messageID, messageId: messageID });
                        return;
                    }

                    if (msg.type === "media_transfer_chunk") {
                        const senderID = normalizeId(socket.userId);
                        const messageID = String(msg.messageId || msg.id || "").slice(0, 160);
                        const key = senderID + ":" + messageID;
                        const transfer = mediaTransfers.get(key);
                        const chunk = msg.chunk;
                        if (!transfer || typeof chunk !== "string" || chunk.length > 300 * 1024 || Number(msg.index) !== transfer.nextIndex) {
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Video upload chunk was invalid or out of order. Please retry." });
                            if (transfer) mediaTransfers.delete(key);
                            return;
                        }
                        const sent = sendToUser(transfer.targetID, {
                            type: "media_transfer_chunk", id: messageID, messageId: messageID,
                            index: transfer.nextIndex, chunk
                        });
                        if (!sent) {
                            mediaTransfers.delete(key);
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Your friend disconnected during the video upload." });
                            return;
                        }
                        transfer.nextIndex++;
                        sendToUser(senderID, { type: "media_chunk_ack", id: messageID, messageId: messageID });
                        return;
                    }

                    if (msg.type === "media_transfer_end") {
                        const senderID = normalizeId(socket.userId);
                        const messageID = String(msg.messageId || msg.id || "").slice(0, 160);
                        const key = senderID + ":" + messageID;
                        const transfer = mediaTransfers.get(key);
                        if (!transfer) {
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Video upload session expired. Please retry." });
                            return;
                        }
                        const sent = sendToUser(transfer.targetID, { type: "media_transfer_end", id: messageID, messageId: messageID });
                        mediaTransfers.delete(key);
                        if (sent) sendToUser(senderID, { type: "delivered", id: messageID, messageId: messageID });
                        else sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Your friend disconnected before the video finished." });
                        return;
                    }

                    /* =====================================
                       DIRECT IMAGE / VIDEO MEDIA (legacy)
                    ===================================== */

                    if (msg.type === "media") {
                        const senderID = normalizeId(socket.userId);
                        const claimedSenderID = normalizeId(msg.from);
                        const targetID = normalizeId(msg.to);
                        const messageID = String(msg.messageId || msg.id || "").slice(0, 160);
                        const data = msg.data;
                        const mediaType = msg.mediaType === "image" ? "image" : msg.mediaType === "video" ? "video" : "";

                        // Trust the authenticated WebSocket registration, not the sender ID supplied by the browser.
                        if (!senderID || claimedSenderID !== senderID || !targetID || targetID === senderID || !messageID || !mediaType) {
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Invalid media message." });
                            return;
                        }

                        // 150 MiB original files become roughly 200 MiB data URLs; allow some header overhead.
                        if (typeof data !== "string" || data.length > 210 * 1024 * 1024 ||
                            (mediaType === "image" && !data.startsWith("data:image/")) ||
                            (mediaType === "video" && !data.startsWith("data:video/"))) {
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Invalid or oversized media. Maximum file size is 150 MB." });
                            return;
                        }

                        const delivered = sendToUser(targetID, {
                            type: "media",
                            id: messageID,
                            messageId: messageID,
                            from: senderID,
                            to: targetID,
                            data,
                            mediaType,
                            mimeType: String(msg.mimeType || "").slice(0, 120),
                            name: cleanText(msg.name || "media", 255),
                            size: Number(msg.size) || 0,
                            time: Number(msg.time) || Date.now()
                        });

                        if (delivered) {
                            sendToUser(senderID, { type: "delivered", id: messageID, messageId: messageID });
                        } else {
                            sendToUser(senderID, { type: "delivery_error", id: messageID, messageId: messageID, reason: "Friend is offline. Media was saved on your device but was not delivered." });
                        }

                        return;
                    }

                    /* =====================================
                       PRIVATE CHAT
                    ===================================== */

                    if (
                        msg.type === "chat"
                    ) {
                        const messageID =
                            String(
                                msg.messageId ||
                                msg.id ||
                                generateID(
                                    "MSG"
                                )
                            );

                        const from =
                            normalizeId(
                                msg.from ||
                                socket.userId
                            );

                        const to =
                            normalizeId(
                                msg.to ||
                                msg.userID
                            );

                        if (!from || !to) {
                            return;
                        }

                        const record = {
                            id:
                                messageID,

                            from,

                            to,

                            text:
                                String(
                                    msg.text ||
                                    ""
                                ).slice(
                                    0,
                                    5000
                                ),

                            time:
                                Number(
                                    msg.time
                                ) ||
                                Date.now(),

                            read: false
                        };

                        directMessages.set(
                            messageID,
                            record
                        );

                        const delivered =
                            sendToUser(
                                to,
                                {
                                    type:
                                        "chat",

                                    id:
                                        messageID,

                                    messageId:
                                        messageID,

                                    from,

                                    text:
                                        record.text,

                                    time:
                                        record.time
                                }
                            );

                        if (delivered) {
                            sendToUser(
                                from,
                                {
                                    type:
                                        "delivered",

                                    id:
                                        messageID,

                                    messageId:
                                        messageID
                                }
                            );
                        } else {
                            sendToUser(
                                from,
                                {
                                    type:
                                        "delivery_error",

                                    reason:
                                        "Friend is offline",

                                    id:
                                        messageID,

                                    messageId:
                                        messageID
                                }
                            );
                        }

                        return;
                    }

                    /* =====================================
                       DIRECT READ
                    ===================================== */

                    if (
                        msg.type === "read"
                    ) {
                        const messageID =
                            String(
                                msg.messageId ||
                                msg.id ||
                                ""
                            );

                        const record =
                            directMessages.get(
                                messageID
                            );

                        if (!record) {
                            return;
                        }

                        record.read = true;

                        sendToUser(
                            record.from,
                            {
                                type:
                                    "read",

                                id:
                                    messageID,

                                messageId:
                                    messageID
                            }
                        );

                        return;
                    }

                    /* =====================================
                       DIRECT REACTION
                    ===================================== */

                    if (
                        msg.type ===
                        "reaction"
                    ) {
                        const messageID =
                            String(
                                msg.messageId ||
                                msg.id ||
                                ""
                            );

                        const record =
                            directMessages.get(
                                messageID
                            );

                        if (!record) {
                            return;
                        }

                        record.reaction =
                            String(
                                msg.reaction ||
                                ""
                            );

                        const payload = {
                            type:
                                "reaction",

                            id:
                                messageID,

                            messageId:
                                messageID,

                            reaction:
                                record.reaction,

                            from:
                                socket.userId
                        };

                        sendToUser(
                            record.from,
                            payload
                        );

                        sendToUser(
                            record.to,
                            payload
                        );

                        return;
                    }

                    /* =====================================
                       UNSEND
                    ===================================== */

                    if (
                        msg.type ===
                        "unsend"
                    ) {
                        const messageID =
                            String(
                                msg.messageId ||
                                msg.id ||
                                ""
                            );

                        const record =
                            directMessages.get(
                                messageID
                            );

                        if (!record) {
                            return;
                        }

                        directMessages.delete(
                            messageID
                        );

                        sendToUser(
                            record.to,
                            {
                                type:
                                    "unsend",

                                id:
                                    messageID,

                                messageId:
                                    messageID
                            }
                        );

                        return;
                    }

                    /* =====================================
                       PROFILE PHOTO
                    ===================================== */

                    if (
                        msg.type ===
                        "profile_photo"
                    ) {
                        const userID =
                            socket.userId;

                        if (!userID) {
                            return;
                        }

                        const photo =
                            msg.photo ||
                            {
                                data:
                                    msg.data,

                                mimeType:
                                    msg.mimeType ||
                                    "image/jpeg",

                                name:
                                    msg.name ||
                                    users.get(
                                        userID
                                    )?.name ||
                                    "Friend",

                                time:
                                    Date.now()
                            };

                        if (!photo.data) {
                            return;
                        }

                        if (
                            JSON.stringify(
                                photo
                            ).length >
                            10 *
                                1024 *
                                1024
                        ) {
                            sendToUser(
                                userID,
                                {
                                    type:
                                        "profile_photo_error",

                                    reason:
                                        "Profile photo is too large."
                                }
                            );

                            return;
                        }

                        profilePhotos.set(
                            userID,
                            photo
                        );

                        broadcastProfilePhoto(
                            userID,
                            photo
                        );

                        return;
                    }
                } catch (error) {
                    console.log(
                        "WebSocket message error:",
                        error.message
                    );
                }
            }
        );

        socket.on(
            "close",
            () => {
                const userID =
                    socket.userId;

                if (!userID) {
                    return;
                }

                if (
                    sockets.get(
                        userID
                    ) !== socket
                ) {
                    return;
                }

                sockets.delete(
                    userID
                );

                const info =
                    presence.get(
                        userID
                    );

                if (info) {
                    info.online = false;
                    info.chattingWith =
                        null;

                    presence.set(
                        userID,
                        info
                    );
                }

                console.log(
                    "Disconnected:",
                    userID
                );

                broadcastPresence();
            }
        );

        socket.on(
            "error",
            error => {
                console.log(
                    "WebSocket error:",
                    error.message
                );
            }
        );
    }
);

/* =====================================================
   HEARTBEAT
   ===================================================== */

const heartbeatInterval =
    setInterval(() => {
        for (
            const socket
            of wss.clients
        ) {
            if (
                socket.isAlive ===
                false
            ) {
                socket.terminate();
                continue;
            }

            socket.isAlive = false;

            try {
                socket.ping();
            } catch {}
        }
    }, 30000);

wss.on(
    "close",
    () => {
        clearInterval(
            heartbeatInterval
        );
    }
);

/* =====================================================
   START
   ===================================================== */

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "       FRIENDCHAT SERVER STARTED"
        );
        console.log(
            "========================================"
        );

        console.log(
            `HTTP: http://localhost:${PORT}`
        );

        console.log(
            `WS:   ws://localhost:${PORT}`
        );

        console.log(
            `Website root: ${ROOT_DIR}`
        );

        console.log(
            `Users: ${users.size}`
        );

        console.log(
            `Servers: ${friendchatServers.size}`
        );

        console.log(
            `Server messages: ${serverMessages.size}`
        );

        console.log(
            "========================================"
        );

        console.log("");
    }
);
