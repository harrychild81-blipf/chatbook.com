const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;


/* =====================================================
   MEMORY DATA
   ===================================================== */

const users = new Map();
const sockets = new Map();

const serverMessages = new Map();
const serverChannelMessages = new Map();

const presence = new Map();
const profilePhotos = new Map();

const friendchatServers = new Map();


/* =====================================================
   WEBSITE ROOT
   ===================================================== */

const SAME_FOLDER = __dirname;
const PARENT_FOLDER = path.resolve(__dirname, "..");

let ROOT_DIR;

if (
  fs.existsSync(
    path.join(SAME_FOLDER, "index.html")
  )
) {
  ROOT_DIR = SAME_FOLDER;
} else {
  ROOT_DIR = PARENT_FOLDER;
}

console.log("Website root:", ROOT_DIR);


/* =====================================================
   PERSISTENT DATA
   ===================================================== */

const DATA_DIR = path.join(
  PARENT_FOLDER,
  ".friendchat-data"
);

const USERS_FILE = path.join(
  DATA_DIR,
  "users.json"
);

const SERVERS_FILE = path.join(
  DATA_DIR,
  "servers.json"
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


function getRequestUserID(req, url = null) {
  const queryUser =
    url
      ? url.searchParams.get("user")
      : "";

  const headerUser =
    req.headers["x-friendchat-user-id"];

  return normalizeId(
    queryUser ||
    headerUser
  );
}


/* =====================================================
   FIND SERVER
   ===================================================== */

function findServer(serverID) {

  const wanted =
    String(serverID || "")
      .trim();

  if (!wanted) {
    return null;
  }

  /* Exact match */

  const exact =
    friendchatServers.get(
      wanted
    );

  if (exact) {
    return exact;
  }

  /* Normalized match */

  const normalized =
    normalizeId(wanted);

  for (
    const serverData
    of friendchatServers.values()
  ) {

    if (
      normalizeId(
        serverData.serverID
      ) === normalized
    ) {
      return serverData;
    }

    if (
      normalizeId(
        serverData.id
      ) === normalized
    ) {
      return serverData;
    }
  }

  return null;
}


/* =====================================================
   WEBSOCKET SEND
   ===================================================== */

function sendToUser(
  userId,
  payload
) {

  const id =
    normalizeId(userId);

  const socket =
    sockets.get(id);

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {

    try {

      socket.send(
        JSON.stringify(
          payload
        )
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


/* =====================================================
   HTTP JSON
   ===================================================== */

function sendJSON(
  res,
  statusCode,
  data
) {

  res.writeHead(
    statusCode,
    {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-cache, no-store, must-revalidate"
    }
  );

  res.end(
    JSON.stringify(data)
  );
}


function sendError(
  res,
  statusCode,
  message
) {

  sendJSON(
    res,
    statusCode,
    {
      ok: false,
      error: message
    }
  );
}


/* =====================================================
   READ JSON BODY
   ===================================================== */

function readJSONBody(req) {

  return new Promise(
    (resolve, reject) => {

      let body = "";
      let size = 0;

      const MAX_BODY =
        30 * 1024 * 1024;

      req.on(
        "data",
        chunk => {

          size +=
            chunk.length;

          if (
            size >
            MAX_BODY
          ) {

            reject(
              new Error(
                "Request body is too large."
              )
            );

            req.destroy();

            return;
          }

          body +=
            chunk.toString();
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
              JSON.parse(body)
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
        error => {
          reject(error);
        }
      );
    }
  );
}


/* =====================================================
   USERS
   ===================================================== */

function loadUsers() {

  try {

    if (
      !fs.existsSync(
        DATA_DIR
      )
    ) {

      fs.mkdirSync(
        DATA_DIR,
        {
          recursive: true
        }
      );
    }

    if (
      !fs.existsSync(
        USERS_FILE
      )
    ) {

      console.log(
        "No saved users file found."
      );

      return;
    }

    const raw =
      fs.readFileSync(
        USERS_FILE,
        "utf8"
      );

    const savedUsers =
      JSON.parse(raw);

    if (
      !Array.isArray(
        savedUsers
      )
    ) {

      return;
    }

    for (
      const saved
      of savedUsers
    ) {

      const id =
        normalizeId(
          saved.id
        );

      if (!id) {
        continue;
      }

      const name =
        cleanText(
          saved.name ||
          "Friend",
          100
        ) || "Friend";

      const user = {
        id,
        name
      };

      users.set(
        id,
        user
      );

      presence.set(
        id,
        {
          id,
          name,
          online: false,
          chattingWith: null
        }
      );
    }

    console.log(
      `Loaded ${users.size} saved FriendChat users.`
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

    if (
      !fs.existsSync(
        DATA_DIR
      )
    ) {

      fs.mkdirSync(
        DATA_DIR,
        {
          recursive: true
        }
      );
    }

    const savedUsers =
      Array.from(
        users.values()
      ).map(
        user => ({
          id:
            user.id,

          name:
            user.name
        })
      );

    const tempFile =
      USERS_FILE +
      ".tmp";

    fs.writeFileSync(
      tempFile,
      JSON.stringify(
        savedUsers,
        null,
        2
      ),
      "utf8"
    );

    fs.renameSync(
      tempFile,
      USERS_FILE
    );

  } catch (error) {

    console.log(
      "Could not save users:",
      error.message
    );
  }
}


function ensureUser(
  userID,
  name = "Friend"
) {

  const id =
    normalizeId(
      userID
    );

  if (!id) {
    return null;
  }

  const cleanName =
    cleanText(
      name ||
      "Friend",
      100
    ) || "Friend";

  let user =
    users.get(id);

  if (!user) {

    user = {
      id,
      name:
        cleanName
    };

    users.set(
      id,
      user
    );

    presence.set(
      id,
      {
        id,
        name:
          cleanName,
        online: false,
        chattingWith: null
      }
    );

    saveUsers();

  } else {

    if (
      cleanName &&
      cleanName !== "Friend" &&
      cleanName !== user.name
    ) {

      user.name =
        cleanName;

      users.set(
        id,
        user
      );

      saveUsers();
    }
  }

  return user;
}


/* =====================================================
   SERVER MEMBERS
   ===================================================== */

function normalizeMember(
  member
) {

  if (
    typeof member ===
    "string"
  ) {

    const userID =
      normalizeId(
        member
      );

    if (!userID) {
      return null;
    }

    const user =
      users.get(
        userID
      );

    return {
      userID,

      name:
        user?.name ||
        "Friend",

      role:
        "member",

      joinedAt:
        Date.now()
    };
  }

  if (
    member &&
    typeof member ===
      "object"
  ) {

    const userID =
      normalizeId(
        member.userID ||
        member.id
      );

    if (!userID) {
      return null;
    }

    const user =
      users.get(
        userID
      );

    return {
      userID,

      name:
        cleanText(
          member.name ||
          user?.name ||
          "Friend",
          100
        ),

      role:
        member.role ===
          "owner"
          ? "owner"
          : "member",

      joinedAt:
        Number(
          member.joinedAt
        ) ||
        Date.now()
    };
  }

  return null;
}


/* =====================================================
   CHANNEL
   ===================================================== */

function normalizeChannel(
  channel
) {

  if (
    !channel ||
    typeof channel !==
      "object"
  ) {
    return null;
  }

  const channelID =
    cleanText(
      channel.channelID ||
      channel.id ||
      generateID("CH"),
      100
    );

  const name =
    cleanText(
      channel.name ||
      "general",
      50
    );

  if (
    !channelID ||
    !name
  ) {
    return null;
  }

  return {
    channelID,

    name,

    type:
      cleanText(
        channel.type ||
        "text",
        30
      ),

    createdAt:
      Number(
        channel.createdAt
      ) ||
      Date.now()
  };
}


/* =====================================================
   ROLE
   ===================================================== */

function normalizeRole(
  role
) {

  if (
    !role ||
    typeof role !==
      "object"
  ) {
    return null;
  }

  const roleID =
    cleanText(
      role.roleID ||
      role.id ||
      generateID("ROLE"),
      100
    );

  const name =
    cleanText(
      role.name ||
      "Member",
      50
    );

  if (
    !roleID ||
    !name
  ) {
    return null;
  }

  return {
    roleID,

    name,

    color:
      cleanText(
        role.color ||
        "",
        30
      ),

    permissions:
      Array.isArray(
        role.permissions
      )
        ? role.permissions
            .slice(0, 100)
            .map(
              permission =>
                cleanText(
                  permission,
                  50
                )
            )
        : []
  };
}


/* =====================================================
   SERVER NORMALIZATION
   ===================================================== */

function normalizeServer(
  serverData
) {

  if (
    !serverData ||
    typeof serverData !==
      "object"
  ) {
    return null;
  }

  const serverID =
    String(
      serverData.serverID ||
      serverData.id ||
      ""
    ).trim();

  const ownerID =
    normalizeId(
      serverData.ownerID
    );

  if (
    !serverID ||
    !ownerID
  ) {
    return null;
  }

  ensureUser(
    ownerID,
    serverData.ownerName ||
    "Owner"
  );


  /* MEMBERS */

  let members =
    Array.isArray(
      serverData.members
    )
      ? serverData.members
          .map(
            normalizeMember
          )
          .filter(Boolean)
      : [];

  const uniqueMembers =
    new Map();

  for (
    const member
    of members
  ) {

    const id =
      normalizeId(
        member.userID
      );

    if (!id) {
      continue;
    }

    uniqueMembers.set(
      id,
      member
    );
  }

  members =
    Array.from(
      uniqueMembers.values()
    );


  /* OWNER */

  const ownerExists =
    members.some(
      member =>
        normalizeId(
          member.userID
        ) === ownerID
    );

  if (!ownerExists) {

    const owner =
      users.get(
        ownerID
      );

    members.unshift(
      {
        userID:
          ownerID,

        name:
          owner?.name ||
          "Owner",

        role:
          "owner",

        joinedAt:
          Number(
            serverData.createdAt
          ) ||
          Date.now()
      }
    );
  }


  members =
    members.map(
      member => ({
        ...member,

        role:
          normalizeId(
            member.userID
          ) === ownerID
            ? "owner"
            : "member"
      })
    );


  /* CHANNELS */

  let channels =
    Array.isArray(
      serverData.channels
    )
      ? serverData.channels
          .map(
            normalizeChannel
          )
          .filter(Boolean)
      : [];

  if (
    channels.length ===
    0
  ) {

    channels.push(
      {
        channelID:
          "general",

        name:
          "general",

        type:
          "text",

        createdAt:
          Number(
            serverData.createdAt
          ) ||
          Date.now()
      }
    );
  }

  channels =
    channels.slice(
      0,
      200
    );


  /* ROLES */

  let roles =
    Array.isArray(
      serverData.roles
    )
      ? serverData.roles
          .map(
            normalizeRole
          )
          .filter(Boolean)
      : [];

  roles =
    roles.slice(
      0,
      200
    );


  /* RULES */

  let rules = [];

  if (
    Array.isArray(
      serverData.rules
    )
  ) {

    rules =
      serverData.rules
        .slice(0, 200)
        .map(
          rule => {

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
          }
        )
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
        serverData.description,
        200
      ),

    icon:
      serverData.icon ||
      null,

    banner:
      serverData.banner ||
      null,

    createdAt:
      Number(
        serverData.createdAt
      ) ||
      Date.now(),

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
            theme:
              "dark",

            accentColor:
              "#6c63ff",

            background:
              null
          }
  };
}


/* =====================================================
   LOAD SERVERS
   ===================================================== */

function loadServers() {

  try {

    if (
      !fs.existsSync(
        DATA_DIR
      )
    ) {

      fs.mkdirSync(
        DATA_DIR,
        {
          recursive: true
        }
      );
    }

    if (
      !fs.existsSync(
        SERVERS_FILE
      )
    ) {

      console.log(
        "No saved servers file found."
      );

      return;
    }

    const raw =
      fs.readFileSync(
        SERVERS_FILE,
        "utf8"
      );

    const savedServers =
      JSON.parse(raw);

    if (
      !Array.isArray(
        savedServers
      )
    ) {
      return;
    }

    for (
      const saved
      of savedServers
    ) {

      const serverData =
        normalizeServer(
          saved
        );

      if (!serverData) {
        continue;
      }

      friendchatServers.set(
        serverData.serverID,
        serverData
      );
    }

    console.log(
      `Loaded ${friendchatServers.size} FriendChat servers.`
    );

  } catch (error) {

    console.log(
      "Could not load servers:",
      error.message
    );
  }
}


/* =====================================================
   SAVE SERVERS
   ===================================================== */

function saveServers() {

  try {

    if (
      !fs.existsSync(
        DATA_DIR
      )
    ) {

      fs.mkdirSync(
        DATA_DIR,
        {
          recursive: true
        }
      );
    }

    const savedServers =
      Array.from(
        friendchatServers.values()
      );

    const tempFile =
      SERVERS_FILE +
      ".tmp";

    fs.writeFileSync(
      tempFile,
      JSON.stringify(
        savedServers,
        null,
        2
      ),
      "utf8"
    );

    fs.renameSync(
      tempFile,
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
   SERVER MEMBER HELPERS
   ===================================================== */

function getServerMember(
  server,
  userID
) {

  const id =
    normalizeId(
      userID
    );

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

  return (
    normalizeId(
      server.ownerID
    ) ===
    normalizeId(
      userID
    )
  );
}


function publicMember(
  member
) {

  return {
    userID:
      member.userID,

    name:
      member.name,

    role:
      member.role,

    joinedAt:
      member.joinedAt
  };
}


/* =====================================================
   PUBLIC SERVER
   ===================================================== */

function publicServer(
  server,
  viewerID
) {

  const viewer =
    normalizeId(
      viewerID
    );

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


/* =====================================================
   SERVER CHANNEL MESSAGES
   ===================================================== */

function getServerMessageKey(
  serverID,
  channelID
) {

  return (
    String(
      serverID
    ).trim() +
    "::" +
    String(
      channelID ||
      "general"
    ).trim()
  );
}


function getServerMessages(
  serverID,
  channelID
) {

  const key =
    getServerMessageKey(
      serverID,
      channelID
    );

  if (
    !serverChannelMessages.has(
      key
    )
  ) {

    serverChannelMessages.set(
      key,
      []
    );
  }

  return serverChannelMessages.get(
    key
  );
}


/* =====================================================
   PRESENCE
   ===================================================== */

function getPresenceForViewer(
  viewerId
) {

  const viewer =
    normalizeId(
      viewerId
    );

  const result = {};

  for (
    const [id, user]
    of users.entries()
  ) {

    const info =
      presence.get(
        id
      );

    let status =
      "offline";

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

        status =
          "active";

      } else if (
        info.chattingWith
      ) {

        status =
          "busy";

      } else {

        status =
          "active";
      }
    }

    result[id] = {

      id:
        user.id,

      name:
        user.name,

      status:
        status
    };
  }

  return result;
}


function sendPresenceToViewer(
  viewerId
) {

  sendToUser(
    viewerId,
    {
      type:
        "presence",

      users:
        getPresenceForViewer(
          viewerId
        )
    }
  );
}


function broadcastPresence() {

  for (
    const id
    of sockets.keys()
  ) {

    sendPresenceToViewer(
      id
    );
  }
}


/* =====================================================
   SERVER MEMBER NOTIFICATION
   ===================================================== */

function notifyServerMembers(
  serverData,
  payload
) {

  for (
    const member
    of serverData.members
  ) {

    sendToUser(
      member.userID,
      payload
    );
  }
}


/* =====================================================
   PROFILE PHOTO BROADCAST
   ===================================================== */

function broadcastProfilePhoto(
  userId,
  photo
) {

  const senderId =
    normalizeId(
      userId
    );

  for (
    const [id, socket]
    of sockets.entries()
  ) {

    if (
      id === senderId
    ) {
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
              senderId,

            photo:
              photo,

            data:
              photo.data ||
              photo
          })
        );

      } catch (error) {

        console.log(
          "Profile photo send error:",
          error.message
        );
      }
    }
  }
}


/* =====================================================
   LOAD DATA
   ===================================================== */

loadUsers();
loadServers();


/* =====================================================
   CONTENT TYPES
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

  ".txt":
    "text/plain; charset=utf-8",

  ".woff":
    "font/woff",

  ".woff2":
    "font/woff2"
};


/* =====================================================
   HTTP SERVER
   ===================================================== */

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


        /* =================================================
           HEALTH
           ================================================= */

        if (
          req.method === "GET" &&
          pathname === "/health"
        ) {

          sendJSON(
            res,
            200,
            {
              ok:
                true,

              service:
                "FriendChat",

              users:
                users.size,

              servers:
                friendchatServers.size,

              sockets:
                sockets.size
            }
          );

          return;
        }


        /* =================================================
           USERS
           ================================================= */

        if (
          req.method === "GET" &&
          pathname === "/api/users"
        ) {

          const excludeId =
            normalizeId(
              url.searchParams.get(
                "exclude"
              )
            );

          const presenceForViewer =
            excludeId
              ? getPresenceForViewer(
                  excludeId
                )
              : {};

          const result = [];

          for (
            const [id, user]
            of users.entries()
          ) {

            if (
              excludeId &&
              id === excludeId
            ) {
              continue;
            }

            const info =
              presenceForViewer[
                id
              ];

            const status =
              info
                ? info.status ||
                  "offline"
                : "offline";

            result.push({

              id:
                user.id,

              name:
                user.name,

              status,

              online:
                status !==
                "offline"
            });
          }

          result.sort(
            (
              a,
              b
            ) => {

              if (
                a.online !==
                b.online
              ) {

                return a.online
                  ? -1
                  : 1;
              }

              return String(
                a.name
              ).localeCompare(
                String(
                  b.name
                )
              );
            }
          );

          sendJSON(
            res,
            200,
            {
              users:
                result
            }
          );

          return;
        }


        /* =================================================
           ONE USER
           ================================================= */

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
                  "/api/user/".length
                )
              )
            );

          const user =
            users.get(id);

          sendJSON(
            res,
            200,
            {
              found:
                !!user,

              user:
                user
                  ? {
                      id:
                        user.id,

                      name:
                        user.name
                    }
                  : null
            }
          );

          return;
        }


        /* =================================================
           ACCOUNT SYNC
           ================================================= */

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

          sendJSON(
            res,
            200,
            {
              ok:
                true,

              user: {
                id:
                  user.id,

                name:
                  user.name
              }
            }
          );

          return;
        }


        /* =================================================
           GET USER SERVERS
           ================================================= */

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

          result.sort(
            (
              a,
              b
            ) =>
              Number(
                a.createdAt
              ) -
              Number(
                b.createdAt
              )
          );

          sendJSON(
            res,
            200,
            {
              ok:
                true,

              servers:
                result
            }
          );

          return;
        }


        /* =================================================
           CREATE SERVER
           ================================================= */

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
            normalizeId(
              body.ownerID ||
              body.userID ||
              req.headers[
                "x-friendchat-user-id"
              ]
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
              body.username ||
              body.displayName ||
              "Friend"
            );

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

          const serverID =
            generateID(
              "FC-SRV"
            );

          const createdAt =
            Date.now();

          const serverData =
            normalizeServer({

              serverID,

              ownerID,

              ownerName:
                owner.name,

              name,

              description:
                cleanText(
                  body.description,
                  200
                ),

              icon:
                body.icon ||
                null,

              banner:
                body.banner ||
                null,

              createdAt,

              members: [
                {
                  userID:
                    ownerID,

                  name:
                    owner.name,

                  role:
                    "owner",

                  joinedAt:
                    createdAt
                }
              ],

              channels: [
                {
                  channelID:
                    "general",

                  name:
                    "general",

                  type:
                    "text",

                  createdAt
                }
              ],

              roles:
                Array.isArray(
                  body.roles
                )
                  ? body.roles
                  : [],

              rules:
                Array.isArray(
                  body.rules
                )
                  ? body.rules
                  : [],

              settings:
                body.settings ||
                {
                  theme:
                    "dark",

                  accentColor:
                    "#6c63ff",

                  background:
                    null
                }
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

          sendJSON(
            res,
            201,
            {
              ok:
                true,

              server:
                publicData
            }
          );

          console.log(
            "Server created:",
            serverID,
            "-",
            name,
            "- Owner:",
            ownerID
          );

          return;
        }


        /* =================================================
           SERVER ROUTES
           ================================================= */

        const serverMatch =
          pathname.match(
            /^\/api\/servers\/([^/]+)$/
          );


        /* =================================================
           GET ONE SERVER
           ================================================= */

        if (
          req.method === "GET" &&
          serverMatch
        ) {

          const serverID =
            decodeURIComponent(
              serverMatch[1]
            ).trim();

          const viewerID =
            getRequestUserID(
              req,
              url
            );

          console.log(
            "SERVER REQUEST:",
            serverID,
            "VIEWER:",
            viewerID
          );

          const serverData =
            findServer(
              serverID
            );

          if (!serverData) {

            console.log(
              "SERVER NOT FOUND:",
              serverID
            );

            sendError(
              res,
              404,
              "Server not found."
            );

            return;
          }

          if (!viewerID) {

            sendError(
              res,
              400,
              "User ID is required."
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

          sendJSON(
            res,
            200,
            {
              ok:
                true,

              server:
                publicServer(
                  serverData,
                  viewerID
                )
            }
          );

          return;
        }


        /* =================================================
           GET SERVER MESSAGES
           ================================================= */

        const serverMessagesMatch =
          pathname.match(
            /^\/api\/servers\/([^/]+)\/messages$/
          );

        if (
          req.method === "GET" &&
          serverMessagesMatch
        ) {

          const serverID =
            decodeURIComponent(
              serverMessagesMatch[1]
            ).trim();

          const viewerID =
            getRequestUserID(
              req,
              url
            );

          const channelID =
            String(
              url.searchParams.get(
                "channel"
              ) ||
              "general"
            ).trim();

          console.log(
            "SERVER MESSAGES:",
            serverID,
            channelID,
            viewerID
          );

          const serverData =
            findServer(
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

          if (!viewerID) {

            sendError(
              res,
              400,
              "User ID is required."
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

          const channelExists =
            serverData.channels.some(
              channel =>
                String(
                  channel.channelID
                ) ===
                channelID
            );

          if (
            !channelExists
          ) {

            sendError(
              res,
              404,
              "Channel not found."
            );

            return;
          }

          const messages =
            getServerMessages(
              serverData.serverID,
              channelID
            );

          sendJSON(
            res,
            200,
            {
              ok:
                true,

              serverID:
                serverData.serverID,

              channelID,

              messages
            }
          );

          return;
        }


        /* =================================================
           ADD MEMBER
           ================================================= */

        const membersMatch =
          pathname.match(
            /^\/api\/servers\/([^/]+)\/members$/
          );

        if (
          req.method === "POST" &&
          membersMatch
        ) {

          const serverID =
            decodeURIComponent(
              membersMatch[1]
            ).trim();

          const body =
            await readJSONBody(
              req
            );

          const requesterID =
            normalizeId(
              body.requesterID ||
              body.userID ||
              body.ownerID ||
              req.headers[
                "x-friendchat-user-id"
              ]
            );

          const memberID =
            normalizeId(
              body.memberID ||
              body.friendID ||
              body.friendUserID
            );

          console.log(
            "ADD MEMBER:",
            serverID,
            requesterID,
            memberID
          );

          if (!requesterID) {

            sendError(
              res,
              400,
              "Requester ID is required."
            );

            return;
          }

          if (!memberID) {

            sendError(
              res,
              400,
              "Member ID is required."
            );

            return;
          }

          const serverData =
            findServer(
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
              "Only the server owner can add members."
            );

            return;
          }

          const user =
            users.get(
              memberID
            );

          if (!user) {

            sendError(
              res,
              404,
              "FriendChat user was not found."
            );

            return;
          }

          if (
            isServerMember(
              serverData,
              memberID
            )
          ) {

            sendError(
              res,
              409,
              "This user is already a member."
            );

            return;
          }

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

          saveServers();

          const updatedServer =
            publicServer(
              serverData,
              memberID
            );

          sendToUser(
            memberID,
            {
              type:
                "server_added",

              server:
                updatedServer
            }
          );

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

          notifyServerMembers(
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

          sendJSON(
            res,
            200,
            {
              ok:
                true,

              server:
                publicServer(
                  serverData,
                  requesterID
                )
            }
          );

          console.log(
            "Member added:",
            memberID,
            "to",
            serverData.serverID
          );

          return;
        }


        /* =================================================
           REMOVE MEMBER
           ================================================= */

        const removeMemberMatch =
          pathname.match(
            /^\/api\/servers\/([^/]+)\/members\/([^/]+)$/
          );

        if (
          req.method === "DELETE" &&
          removeMemberMatch
        ) {

          const serverID =
            decodeURIComponent(
              removeMemberMatch[1]
            ).trim();

          const memberID =
            normalizeId(
              decodeURIComponent(
                removeMemberMatch[2]
              )
            );

          const requesterID =
            normalizeId(
              url.searchParams.get(
                "requester"
              ) ||
              req.headers[
                "x-friendchat-user-id"
              ]
            );

          const serverData =
            findServer(
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
                ) !==
                memberID
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

          notifyServerMembers(
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

          sendJSON(
            res,
            200,
            {
              ok:
                true,

              server:
                publicServer(
                  serverData,
                  requesterID
                )
            }
          );

          return;
        }


        /* =================================================
           UPDATE SERVER
           ================================================= */

        const updateServerMatch =
          pathname.match(
            /^\/api\/servers\/([^/]+)$/
          );

        if (
          req.method === "PUT" &&
          updateServerMatch
        ) {

          const serverID =
            decodeURIComponent(
              updateServerMatch[1]
            ).trim();

          const body =
            await readJSONBody(
              req
            );

          const requesterID =
            normalizeId(
              body.requesterID ||
              body.userID ||
              req.headers[
                "x-friendchat-user-id"
              ]
            );

          const serverData =
            findServer(
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

          if (!requesterID) {

            sendError(
              res,
              400,
              "Requester ID is required."
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


          /* NAME */

          if (
            body.name !==
            undefined
          ) {

            const newName =
              cleanText(
                body.name,
                40
              );

            if (
              newName.length < 2
            ) {

              sendError(
                res,
                400,
                "Server name must be at least 2 characters."
              );

              return;
            }

            serverData.name =
              newName;
          }


          /* DESCRIPTION */

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


          /* ICON */

          if (
            body.icon !==
            undefined
          ) {

            serverData.icon =
              body.icon ||
              null;
          }


          /* BANNER */

          if (
            body.banner !==
            undefined
          ) {

            serverData.banner =
              body.banner ||
              null;
          }


          /* SETTINGS */

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


          /* CHANNELS */

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
                .slice(
                  0,
                  200
                );

            if (
              serverData.channels.length ===
              0
            ) {

              serverData.channels.push(
                {
                  channelID:
                    "general",

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


          /* ROLES */

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
                .slice(
                  0,
                  200
                );
          }


          /* RULES */

          if (
            Array.isArray(
              body.rules
            )
          ) {

            serverData.rules =
              body.rules
                .slice(
                  0,
                  200
                )
                .map(
                  rule => {

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
                  }
                )
                .filter(Boolean);
          }


          saveServers();


          notifyServerMembers(
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


          sendJSON(
            res,
            200,
            {
              ok:
                true,

              server:
                publicServer(
                  serverData,
                  requesterID
                )
            }
          );

          return;
        }


        /* =================================================
           PRESENCE API
           ================================================= */

        if (
          req.method === "GET" &&
          pathname ===
            "/api/presence"
        ) {

          const result = {};

          for (
            const [id, info]
            of presence.entries()
          ) {

            result[id] = {

              id:
                info.id,

              name:
                info.name,

              online:
                info.online,

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


        /* =================================================
           PROFILE PHOTO
           ================================================= */

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
            profilePhotos.get(
              id
            );

          if (!photo) {

            sendJSON(
              res,
              404,
              {
                found:
                  false
              }
            );

            return;
          }

          sendJSON(
            res,
            200,
            {
              found:
                true,

              userId:
                id,

              photo:
                photo
            }
          );

          return;
        }


        /* =================================================
           STATIC FILES
           ================================================= */

        let requestedFile =
          pathname;

        if (
          requestedFile ===
          "/"
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
          relativeFile ===
            ".."
        ) {

          res.writeHead(
            403
          );

          res.end(
            "Forbidden"
          );

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

          res.writeHead(
            403
          );

          res.end(
            "Forbidden"
          );

          return;
        }

        fs.readFile(
          filePath,
          (
            error,
            data
          ) => {

            if (error) {

              console.log(
                "FILE NOT FOUND:",
                filePath
              );

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

            res.end(
              data
            );
          }
        );

      } catch (error) {

        console.log(
          "HTTP API error:",
          error.message
        );

        if (
          !res.headersSent
        ) {

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
    server
  });


/* =====================================================
   WEBSOCKET CONNECTION
   ===================================================== */

wss.on(
  "connection",
  socket => {

    console.log(
      "Device connected"
    );

    socket.isAlive =
      true;


    /* =================================================
       PONG
       ================================================= */

    socket.on(
      "pong",
      () => {

        socket.isAlive =
          true;
      }
    );


    /* =================================================
       MESSAGE
       ================================================= */

    socket.on(
      "message",
      raw => {

        try {

          const msg =
            JSON.parse(
              raw.toString()
            );


          /* ==========================================
             REGISTER
             ========================================== */

          if (
            msg.type ===
            "register"
          ) {

            const userId =
              normalizeId(
                msg.userId
              );

            const name =
              cleanText(
                msg.name ||
                "Friend",
                100
              );

            if (!userId) {
              return;
            }

            const oldSocket =
              sockets.get(
                userId
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
                userId,
                name
              );

            sockets.set(
              userId,
              socket
            );

            socket.userId =
              userId;

            presence.set(
              userId,
              {
                id:
                  userId,

                name:
                  user.name,

                online:
                  true,

                chattingWith:
                  null
              }
            );


            socket.send(
              JSON.stringify(
                {
                  type:
                    "registered",

                  userId:
                    userId
                }
              )
            );


            /* PROFILE PHOTOS */

            for (
              const [
                photoUserId,
                photo
              ]
              of profilePhotos.entries()
            ) {

              socket.send(
                JSON.stringify(
                  {
                    type:
                      "profile_photo",

                    userId:
                      photoUserId,

                    photo:
                      photo,

                    data:
                      photo.data ||
                      photo
                  }
                )
              );
            }


            /* USER SERVERS */

            const userServers = [];

            for (
              const serverData
              of friendchatServers.values()
            ) {

              if (
                isServerMember(
                  serverData,
                  userId
                )
              ) {

                userServers.push(
                  publicServer(
                    serverData,
                    userId
                  )
                );
              }
            }


            socket.send(
              JSON.stringify(
                {
                  type:
                    "server_list",

                  servers:
                    userServers
                }
              )
            );


            console.log(
              "Registered:",
              userId,
              "-",
              user.name
            );

            broadcastPresence();

            return;
          }


          /* ==========================================
             PROFILE PHOTO
             ========================================== */

          if (
            msg.type ===
            "profile_photo"
          ) {

            const userId =
              socket.userId;

            if (!userId) {
              return;
            }

            let photo;

            if (
              msg.photo
            ) {

              photo =
                msg.photo;

            } else if (
              msg.data
            ) {

              photo = {

                data:
                  String(
                    msg.data
                  ),

                mimeType:
                  String(
                    msg.mimeType ||
                    "image/jpeg"
                  ),

                name:
                  String(
                    msg.name ||
                    users.get(
                      userId
                    )?.name ||
                    "Friend"
                  ),

                time:
                  Number(
                    msg.time
                  ) ||
                  Date.now()
              };

            } else {

              return;
            }

            if (
              JSON.stringify(
                photo
              ).length >
              10 * 1024 * 1024
            ) {

              sendToUser(
                userId,
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
              userId,
              photo
            );

            broadcastProfilePhoto(
              userId,
              photo
            );

            return;
          }


          /* ==========================================
             PRESENCE CHAT
             ========================================== */

          if (
            msg.type ===
            "presence_chat"
          ) {

            const userId =
              socket.userId;

            if (!userId) {
              return;
            }

            const info =
              presence.get(
                userId
              );

            if (!info) {
              return;
            }

            let chatWith =
              msg.chatWith
                ? normalizeId(
                    msg.chatWith
                  )
                : null;

            info.chattingWith =
              chatWith;

            presence.set(
              userId,
              info
            );

            broadcastPresence();

            return;
          }


          /* ==========================================
             SERVER LIST REQUEST
             ========================================== */

          if (
            msg.type ===
            "server_list_request"
          ) {

            const userId =
              normalizeId(
                socket.userId
              );

            if (!userId) {
              return;
            }

            const userServers = [];

            for (
              const serverData
              of friendchatServers.values()
            ) {

              if (
                isServerMember(
                  serverData,
                  userId
                )
              ) {

                userServers.push(
                  publicServer(
                    serverData,
                    userId
                  )
                );
              }
            }

            sendToUser(
              userId,
              {
                type:
                  "server_list",

                servers:
                  userServers
              }
            );

            return;
          }


          /* ==========================================
             SERVER MESSAGE
             ========================================== */

          if (
            msg.type ===
              "server_message" ||

            msg.type ===
              "server_chat" ||

            msg.type ===
              "channel_message"
          ) {

            const userID =
              normalizeId(
                socket.userId ||
                msg.from
              );

            const serverID =
              String(
                msg.serverID ||
                msg.server ||
                ""
              ).trim();

            const channelID =
              String(
                msg.channelID ||
                msg.channel ||
                "general"
              ).trim();

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


            if (!userID) {
              return;
            }


            if (!serverID) {

              sendToUser(
                userID,
                {
                  type:
                    "server_message_error",

                  error:
                    "Server ID is missing."
                }
              );

              return;
            }


            if (!text) {
              return;
            }


            const serverData =
              findServer(
                serverID
              );


            if (!serverData) {

              console.log(
                "SERVER MESSAGE: server not found:",
                serverID
              );

              sendToUser(
                userID,
                {
                  type:
                    "server_message_error",

                  serverID:
                    serverID,

                  channelID:
                    channelID,

                  error:
                    "Server not found."
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
                    "server_message_error",

                  serverID:
                    serverData.serverID,

                  channelID:
                    channelID,

                  error:
                    "You are not a member of this server."
                }
              );

              return;
            }


            const channel =
              serverData.channels.find(
                item =>
                  String(
                    item.channelID
                  ) ===
                  channelID
              );


            if (!channel) {

              sendToUser(
                userID,
                {
                  type:
                    "server_message_error",

                  serverID:
                    serverData.serverID,

                  channelID:
                    channelID,

                  error:
                    "Channel not found."
                }
              );

              return;
            }


            const messageID =
              String(
                msg.messageID ||
                msg.messageId ||
                msg.id ||
                generateID("MSG")
              ).trim();


            const user =
              users.get(
                userID
              );


            const message = {

              id:
                messageID,

              messageID:
                messageID,

              serverID:
                serverData.serverID,

              channelID:
                channelID,

              from:
                userID,

              userID:
                userID,

              name:
                user?.name ||
                "Friend",

              text:
                text,

              time:
                Number(
                  msg.time
                ) ||
                Date.now()
            };


            const messages =
              getServerMessages(
                serverData.serverID,
                channelID
              );


            messages.push(
              message
            );


            /* Keep latest 1000 messages */

            if (
              messages.length >
              1000
            ) {

              messages.splice(
                0,
                messages.length -
                  1000
              );
            }


            console.log(
              "SERVER MESSAGE:",
              serverData.name,
              "#",
              channel.name,
              "-",
              userID,
              ":",
              text
            );


            /* Send to every member */

            for (
              const member
              of serverData.members
            ) {

              sendToUser(
                member.userID,
                {
                  type:
                    "server_message",

                  id:
                    message.id,

                  messageID:
                    message.messageID,

                  serverID:
                    message.serverID,

                  channelID:
                    message.channelID,

                  from:
                    message.from,

                  userID:
                    message.userID,

                  name:
                    message.name,

                  text:
                    message.text,

                  time:
                    message.time
                }
              );
            }

            return;
          }


          /* ==========================================
             PRIVATE TEXT CHAT
             ========================================== */

          if (
            msg.type ===
            "chat"
          ) {

            const messageId =
              String(
                msg.messageId ||
                msg.id ||
                ""
              ).trim();

            if (!messageId) {
              return;
            }

            const record = {

              id:
                messageId,

              from:
                normalizeId(
                  msg.from ||
                  socket.userId
                ),

              to:
                normalizeId(
                  msg.to
                ),

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

              read:
                false
            };


            serverMessages.set(
              record.id,
              record
            );


            const delivered =
              sendToUser(
                record.to,
                {
                  type:
                    "chat",

                  id:
                    record.id,

                  messageId:
                    record.id,

                  from:
                    record.from,

                  text:
                    record.text,

                  time:
                    record.time
                }
              );


            if (
              delivered
            ) {

              sendToUser(
                record.from,
                {
                  type:
                    "delivered",

                  id:
                    record.id,

                  messageId:
                    record.id
                }
              );

            } else {

              sendToUser(
                record.from,
                {
                  type:
                    "delivery_error",

                  reason:
                    "Friend is offline",

                  id:
                    record.id,

                  messageId:
                    record.id
                }
              );
            }

            return;
          }


          /* ==========================================
             PRIVATE MEDIA
             ========================================== */

          if (
            msg.type ===
            "media"
          ) {

            const messageId =
              String(
                msg.messageId ||
                msg.id ||
                ""
              ).trim();

            if (!messageId) {
              return;
            }

            if (
              JSON.stringify(
                msg
              ).length >
              30 * 1024 * 1024
            ) {

              sendToUser(
                socket.userId,
                {
                  type:
                    "media_error",

                  reason:
                    "Media file is too large."
                }
              );

              return;
            }

            const record = {

              id:
                messageId,

              from:
                normalizeId(
                  msg.from ||
                  socket.userId
                ),

              to:
                normalizeId(
                  msg.to
                ),

              time:
                Number(
                  msg.time
                ) ||
                Date.now(),

              mediaType:
                String(
                  msg.mediaType ||
                  ""
                ),

              mimeType:
                String(
                  msg.mimeType ||
                  ""
                ),

              name:
                String(
                  msg.name ||
                  msg.fileName ||
                  ""
                ),

              size:
                Number(
                  msg.size
                ) ||
                0
            };


            serverMessages.set(
              record.id,
              record
            );


            const delivered =
              sendToUser(
                record.to,
                {
                  type:
                    "media",

                  id:
                    record.id,

                  messageId:
                    record.id,

                  from:
                    record.from,

                  time:
                    record.time,

                  mediaType:
                    record.mediaType,

                  mimeType:
                    record.mimeType,

                  name:
                    record.name,

                  size:
                    record.size,

                  data:
                    msg.data
                }
              );


            if (
              delivered
            ) {

              sendToUser(
                record.from,
                {
                  type:
                    "delivered",

                  id:
                    record.id,

                  messageId:
                    record.id
                }
              );

            } else {

              sendToUser(
                record.from,
                {
                  type:
                    "delivery_error",

                  reason:
                    "Friend is offline",

                  id:
                    record.id,

                  messageId:
                    record.id
                }
              );
            }

            return;
          }


          /* ==========================================
             DELIVERED
             ========================================== */

          if (
            msg.type ===
            "delivered"
          ) {

            const id =
              String(
                msg.messageId ||
                msg.id ||
                ""
              );

            const record =
              serverMessages.get(
                id
              );

            if (record) {

              sendToUser(
                record.from,
                {
                  type:
                    "delivered",

                  id:
                    record.id,

                  messageId:
                    record.id
                }
              );
            }

            return;
          }


          /* ==========================================
             READ / SEEN
             ========================================== */

          if (
            msg.type ===
            "read"
          ) {

            const id =
              String(
                msg.messageId ||
                msg.id ||
                ""
              );

            const record =
              serverMessages.get(
                id
              );

            if (record) {

              record.read =
                true;

              sendToUser(
                record.from,
                {
                  type:
                    "read",

                  id:
                    record.id,

                  messageId:
                    record.id
                }
              );
            }

            return;
          }


          /* ==========================================
             REACTION
             ========================================== */

          if (
            msg.type ===
            "reaction"
          ) {

            const id =
              String(
                msg.messageId ||
                msg.id ||
                ""
              );

            const record =
              serverMessages.get(
                id
              );

            if (record) {

              record.reaction =
                String(
                  msg.reaction ||
                  ""
                );

              sendToUser(
                record.from,
                {
                  type:
                    "reaction",

                  id,

                  messageId:
                    id,

                  reaction:
                    record.reaction,

                  from:
                    socket.userId
                }
              );

              sendToUser(
                record.to,
                {
                  type:
                    "reaction",

                  id,

                  messageId:
                    id,

                  reaction:
                    record.reaction,

                  from:
                    socket.userId
                }
              );
            }

            return;
          }


          /* ==========================================
             UNSEND
             ========================================== */

          if (
            msg.type ===
            "unsend"
          ) {

            const id =
              String(
                msg.messageId ||
                msg.id ||
                ""
              );

            const record =
              serverMessages.get(
                id
              );

            if (!record) {
              return;
            }

            serverMessages.delete(
              id
            );


            sendToUser(
              record.to,
              {
                type:
                  "unsend",

                id,

                messageId:
                  id
              }
            );

            return;
          }


          /* ==========================================
             SERVER DELETE
             ========================================== */

          if (
            msg.type ===
            "server_delete"
          ) {

            const id =
              String(
                msg.messageId ||
                msg.id ||
                ""
              );

            const record =
              serverMessages.get(
                id
              );

            if (!record) {
              return;
            }

            serverMessages.delete(
              id
            );

            sendToUser(
              record.to,
              {
                type:
                  "server_delete",

                id,

                messageId:
                  id
              }
            );

            return;
          }

        } catch (error) {

          console.log(
            "Invalid WebSocket message:",
            error.message
          );
        }
      }
    );


    /* =================================================
       SOCKET CLOSED
       ================================================= */

    socket.on(
      "close",
      () => {

        const userId =
          socket.userId;

        if (!userId) {
          return;
        }

        if (
          sockets.get(
            userId
          ) !== socket
        ) {
          return;
        }

        sockets.delete(
          userId
        );

        const info =
          presence.get(
            userId
          );

        if (info) {

          info.online =
            false;

          info.chattingWith =
            null;

          presence.set(
            userId,
            info
          );
        }

        console.log(
          "Disconnected:",
          userId
        );

        broadcastPresence();
      }
    );


    /* =================================================
       SOCKET ERROR
       ================================================= */

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
  setInterval(
    () => {

      for (
        const socket
        of wss.clients
      ) {

        if (
          socket.isAlive ===
          false
        ) {

          console.log(
            "Terminating dead connection:",
            socket.userId ||
            "unknown"
          );

          socket.terminate();

          continue;
        }

        socket.isAlive =
          false;

        try {

          socket.ping();

        } catch (error) {

          console.log(
            "Ping error:",
            error.message
          );
        }
      }

    },
    30000
  );


wss.on(
  "close",
  () => {

    clearInterval(
      heartbeatInterval
    );
  }
);


/* =====================================================
   START SERVER
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
      "        FRIENDCHAT SERVER STARTED"
    );
    console.log(
      "========================================"
    );

    console.log(
      `FriendChat: http://localhost:${PORT}`
    );

    console.log(
      `WebSocket: ws://localhost:${PORT}`
    );

    console.log(
      `Website root: ${ROOT_DIR}`
    );

    console.log(
      `Saved users: ${users.size}`
    );

    console.log(
      `Saved servers: ${friendchatServers.size}`
    );

    console.log(
      "========================================"
    );

    console.log("");
  }
);
