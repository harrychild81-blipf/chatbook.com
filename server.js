const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;


/* =====================================================
   SERVER DATA
   ===================================================== */

const users = new Map();
const sockets = new Map();
const serverMessages = new Map();
const presence = new Map();
const profilePhotos = new Map();

/*
   FriendChat community/server data.

   IMPORTANT:
   This is NOT the backend server itself.

   These are the servers/communities that
   FriendChat users create inside the app.
*/
const friendchatServers = new Map();


/* =====================================================
   FIND WEBSITE ROOT
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


function sendToUser(userId, payload) {

  const id = normalizeId(userId);

  const socket = sockets.get(id);

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
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


/* =====================================================
   HTTP JSON HELPERS
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
        "no-cache"
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


function readJSONBody(req) {

  return new Promise(
    (resolve, reject) => {

      let body = "";

      let size = 0;

      const MAX_BODY =
        5 * 1024 * 1024;


      req.on(
        "data",
        chunk => {

          size += chunk.length;

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

          body += chunk.toString();

        }
      );


      req.on(
        "end",
        () => {

          if (!body.trim()) {

            resolve({});

            return;

          }


          try {

            resolve(
              JSON.parse(body)
            );

          }

          catch (error) {

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
   LOAD USERS
   ===================================================== */

function loadUsers() {

  try {

    if (!fs.existsSync(DATA_DIR)) {

      fs.mkdirSync(
        DATA_DIR,
        {
          recursive: true
        }
      );

    }


    if (!fs.existsSync(USERS_FILE)) {

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


    if (!Array.isArray(savedUsers)) {

      console.log(
        "users.json is not an array."
      );

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


      const name =
        String(
          saved.name || "Friend"
        ).trim();


      if (!id) {

        continue;

      }


      const user = {

        id: id,

        name:
          name || "Friend"

      };


      users.set(
        id,
        user
      );


      presence.set(
        id,
        {

          id: id,

          name:
            user.name,

          online:
            false,

          chattingWith:
            null

        }
      );

    }


    console.log(
      `Loaded ${users.size} saved FriendChat users.`
    );

  }

  catch (error) {

    console.log(
      "Could not load users:",
      error.message
    );

  }

}


/* =====================================================
   SAVE USERS
   ===================================================== */

function saveUsers() {

  try {

    if (!fs.existsSync(DATA_DIR)) {

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
      USERS_FILE + ".tmp";


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

  }

  catch (error) {

    console.log(
      "Could not save users:",
      error.message
    );

  }

}


/* =====================================================
   SERVER / COMMUNITY DATA
   ===================================================== */

/*
   Normalize old/new member formats.

   Supported:

   "FC-ABC123"

   OR

   {
      userID: "FC-ABC123",
      name: "Harry",
      role: "member"
   }
*/

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

    const user =
      users.get(
        userID
      );

    return {

      userID:
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

      userID:
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
    cleanText(
      serverData.serverID ||
      serverData.id,
      100
    );


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


  /*
    Always make sure owner exists.
  */

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

    members.unshift({

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

    });

  }


  /*
    Make owner role correct.
  */

  members =
    members.map(
      member => ({

        ...member,

        role:
          normalizeId(
            member.userID
          ) === ownerID
            ? "owner"
            : (
                member.role ===
                  "owner"
                  ? "member"
                  : member.role ||
                    "member"
              )

      })
    );


  return {

    serverID:
      serverID,

    ownerID:
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

    members:
      members,

    channels:
      Array.isArray(
        serverData.channels
      )
        ? serverData.channels
        : [],

    roles:
      Array.isArray(
        serverData.roles
      )
        ? serverData.roles
        : [],

    rules:
      Array.isArray(
        serverData.rules
      )
        ? serverData.rules
        : [],

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

    if (!fs.existsSync(DATA_DIR)) {

      fs.mkdirSync(
        DATA_DIR,
        {
          recursive: true
        }
      );

    }


    if (!fs.existsSync(SERVERS_FILE)) {

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


    if (!Array.isArray(savedServers)) {

      console.log(
        "servers.json is not an array."
      );

      return;

    }


    for (
      const saved
      of savedServers
    ) {

      const server =
        normalizeServer(
          saved
        );


      if (!server) {

        continue;

      }


      friendchatServers.set(
        server.serverID,
        server
      );

    }


    console.log(
      `Loaded ${friendchatServers.size} FriendChat servers.`
    );

  }

  catch (error) {

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

    if (!fs.existsSync(DATA_DIR)) {

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
      SERVERS_FILE + ".tmp";


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


  }

  catch (error) {

    console.log(
      "Could not save servers:",
      error.message
    );

  }

}


/*
   Load accounts first.

   Then load communities so member
   names can be resolved.
*/

loadUsers();
loadServers();


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
   PUBLIC SERVER DATA
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

const server = http.createServer(
  async (req, res) => {

    try {

      const url =
        new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );


      const pathname =
        url.pathname;


      /* ================================================
         HEALTH
         ================================================ */

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

            servers:
              friendchatServers.size,

            users:
              users.size

          }
        );

        return;

      }


      /* ================================================
         ALL FRIENDCHAT USERS
         ================================================ */

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


        const viewer =
          excludeId;


        const presenceForViewer =
          viewer
            ? getPresenceForViewer(
                viewer
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


          const presenceInfo =
            presenceForViewer[id];


          let status =
            "offline";


          if (presenceInfo) {

            status =
              presenceInfo.status ||
              "offline";

          }

          else {

            const info =
              presence.get(id);


            if (
              info &&
              info.online
            ) {

              status =
                "active";

            }

          }


          result.push({

            id:
              user.id,

            name:
              user.name,

            status:
              status,

            online:
              status !== "offline"

          });

        }


        result.sort(
          (a, b) => {

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


      /* ================================================
         FIND ONE USER
         ================================================ */

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
         SERVER API
         ================================================= */


      /* ================================================
         GET SERVERS FOR USER
         
         GET /api/servers?user=FC-ABC123
         ================================================ */

      if (
        req.method === "GET" &&
        pathname === "/api/servers"
      ) {

        const userID =
          normalizeId(
            url.searchParams.get(
              "user"
            )
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
          const server
          of friendchatServers.values()
        ) {

          if (
            isServerMember(
              server,
              userID
            )
          ) {

            result.push(
              publicServer(
                server,
                userID
              )
            );

          }

        }


        result.sort(
          (a, b) =>
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


      /* ================================================
         CREATE SERVER

         POST /api/servers
         ================================================ */

      if (
        req.method === "POST" &&
        pathname === "/api/servers"
      ) {

        const body =
          await readJSONBody(
            req
          );


        const ownerID =
          normalizeId(
            body.ownerID ||
            body.userID
          );


        if (!ownerID) {

          sendError(
            res,
            400,
            "Owner ID is required."
          );

          return;

        }


        /*
          The account must exist.
        */

        const owner =
          users.get(
            ownerID
          );


        if (!owner) {

          sendError(
            res,
            404,
            "Owner account was not found."
          );

          return;

        }


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


        const serverData = {

          serverID:
            serverID,

          ownerID:
            ownerID,

          name:
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

          createdAt:
            Date.now(),

          members: [

            {

              userID:
                ownerID,

              name:
                owner.name,

              role:
                "owner",

              joinedAt:
                Date.now()

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
                Date.now()

            }

          ],

          roles: [],

          rules: [],

          settings: {

            theme:
              "dark",

            accentColor:
              "#6c63ff",

            background:
              null

          }

        };


        friendchatServers.set(
          serverID,
          serverData
        );


        saveServers();


        /*
          Tell the owner that the server
          was created.
        */

        sendToUser(
          ownerID,
          {

            type:
              "server_created",

            server:
              publicServer(
                serverData,
                ownerID
              )

          }
        );


        sendJSON(
          res,
          201,
          {

            ok:
              true,

            server:
              publicServer(
                serverData,
                ownerID
              )

          }
        );


        console.log(
          "Server created:",
          serverID,
          "-",
          name,
          "Owner:",
          ownerID
        );


        return;

      }


      /* ================================================
         GET ONE SERVER

         GET /api/servers/:serverID?user=FC-ABC123
         ================================================ */

      const serverMatch =
        pathname.match(
          /^\/api\/servers\/([^/]+)$/
        );


      if (
        req.method === "GET" &&
        serverMatch
      ) {

        const serverID =
          decodeURIComponent(
            serverMatch[1]
          );


        const viewerID =
          normalizeId(
            url.searchParams.get(
              "user"
            )
          );


        const serverData =
          friendchatServers.get(
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


      /* ================================================
         ADD MEMBER

         POST /api/servers/:serverID/members
         ================================================ */

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
          );


        const body =
          await readJSONBody(
            req
          );


        const requesterID =
          normalizeId(
            body.requesterID ||
            body.userID
          );


        const memberID =
          normalizeId(
            body.memberID
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
          friendchatServers.get(
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


        /*
          For now only the owner can
          add members.

          Roles & permissions will later
          allow admins/moderators too.
        */

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


        /*
          Send live notification if the
          friend is currently online.
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
          Also notify the owner.
        */

        sendToUser(
          requesterID,
          {

            type:
              "server_member_added",

            serverID:
              serverID,

            member:
              publicMember(
                member
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
          "→",
          serverID
        );


        return;

      }


      /* ================================================
         REMOVE MEMBER

         DELETE /api/servers/:serverID/members/:userID
         ================================================ */

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
          );


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
            )
          );


        const serverData =
          friendchatServers.get(
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


        /*
          Tell removed user immediately
          if they are online.
        */

        sendToUser(
          memberID,
          {

            type:
              "server_removed",

            serverID:
              serverID

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
          "Member removed:",
          memberID,
          "from",
          serverID
        );


        return;

      }


      /* ================================================
         SERVER UPDATE

         PUT /api/servers/:serverID
         ================================================ */

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
          );


        const body =
          await readJSONBody(
            req
          );


        const requesterID =
          normalizeId(
            body.requesterID ||
            body.userID
          );


        const serverData =
          friendchatServers.get(
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

          serverData.settings =
            {

              ...serverData.settings,

              ...body.settings

            };

        }


        saveServers();


        /*
          Notify every connected member
          that the server changed.
        */

        for (
          const member
          of serverData.members
        ) {

          sendToUser(
            member.userID,
            {

              type:
                "server_updated",

              server:
                publicServer(
                  serverData,
                  member.userID
                )

            }
          );

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
                requesterID
              )

          }
        );


        return;

      }


      /* ================================================
         PRESENCE API
         ================================================ */

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


      /* ================================================
         PROFILE PHOTO API
         ================================================ */

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
                "/api/profile-photo/".length
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


      /* ================================================
         STATIC WEBSITE FILES
         ================================================ */

      let requestedFile =
        pathname;


      if (
        requestedFile === "/"
      ) {

        requestedFile =
          "/index.html";

      }


      let relativeFile =
        requestedFile
          .replace(
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
          : ROOT_DIR + path.sep;


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
        (error, data) => {

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
                extension === ".css" ||
                extension === ".js"
                  ? "no-cache"
                  : "public, max-age=3600"

            }
          );


          res.end(
            data
          );

        }
      );

    }

    catch (error) {

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
      presence.get(id);


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

      }

      else if (
        info.chattingWith
      ) {

        status =
          "busy";

      }

      else {

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


/* =====================================================
   SEND PRESENCE TO ONE USER
   ===================================================== */

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


/* =====================================================
   SEND PRESENCE TO EVERY CONNECTED USER
   ===================================================== */

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

      }

      catch (error) {

        console.log(
          "Profile photo send error:",
          error.message
        );

      }

    }

  }

}


/* =====================================================
   NOTIFY SERVER MEMBERS
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
  (socket) => {

    console.log(
      "Device connected"
    );


    socket.isAlive =
      true;


    socket.on(
      "pong",
      () => {

        socket.isAlive =
          true;

      }
    );


    socket.on(
      "message",
      (raw) => {

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
              String(
                msg.name ||
                "Friend"
              ).trim();


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

              }

              catch {}

            }


            const user = {

              id:
                userId,

              name:
                name ||
                "Friend"

            };


            users.set(
              userId,
              user
            );


            saveUsers();


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
              JSON.stringify({

                type:
                  "registered",

                userId:
                  userId

              })
            );


            /*
              Send saved profile photos.
            */

            for (
              const [
                photoUserId,
                photo
              ]
              of profilePhotos.entries()
            ) {

              socket.send(
                JSON.stringify({

                  type:
                    "profile_photo",

                  userId:
                    photoUserId,

                  photo:
                    photo,

                  data:
                    photo.data ||
                    photo

                })
              );

            }


            /*
              IMPORTANT:

              When a user logs in,
              immediately send all servers
              they belong to.

              This is what allows the
              server sidebar to update
              without waiting for another
              action.
            */

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
              JSON.stringify({

                type:
                  "server_list",

                servers:
                  userServers

              })
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

            }

            else if (
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

            }

            else {

              return;

            }


            const photoSize =
              JSON.stringify(
                photo
              ).length;


            if (
              photoSize >
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


            console.log(
              "Profile photo updated:",
              userId
            );


            broadcastProfilePhoto(
              userId,
              photo
            );


            return;

          }


          /* ==========================================
             PRESENCE / CURRENT CHAT
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
              msg.chatWith;


            if (
              chatWith
            ) {

              chatWith =
                normalizeId(
                  chatWith
                );

            }

            else {

              chatWith =
                null;

            }


            info.chattingWith =
              chatWith;


            presence.set(
              userId,
              info
            );


            console.log(
              "Presence:",
              userId,
              "chatting with",
              chatWith ||
                "nobody"
            );


            broadcastPresence();


            return;

          }


          /* ==========================================
             SERVER REQUEST THROUGH WEBSOCKET
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
             TEXT CHAT
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

            }

            else {

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
             MEDIA
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


            const payloadSize =
              JSON.stringify(
                msg
              ).length;


            if (
              payloadSize >
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

            }

            else {

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


            if (
              record
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


            if (
              record
            ) {

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


            if (
              record
            ) {

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

                  id:
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

                  id:
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


            serverMessages.delete(
              id
            );


            if (
              record
            ) {

              sendToUser(
                record.to,
                {

                  type:
                    "unsend",

                  id:
                    id,

                  messageId:
                    id

                }
              );

            }


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


            serverMessages.delete(
              id
            );


            if (
              record
            ) {

              sendToUser(
                record.to,
                {

                  type:
                    "server_delete",

                  id:
                    id,

                  messageId:
                    id

                }
              );

            }


            return;

          }

        }

        catch (error) {

          console.log(
            "Invalid WebSocket message:",
            error.message
          );

        }

      }
    );


    /* ================================================
       CONNECTION CLOSED
       ================================================ */

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


        if (
          info
        ) {

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


    /* ================================================
       SOCKET ERROR
       ================================================ */

    socket.on(
      "error",
      (error) => {

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

        }

        catch (error) {

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

    console.log(
      `FriendChat running at http://localhost:${PORT}`
    );


    console.log(
      `WebSocket server: ws://localhost:${PORT}`
    );


    console.log(
      `Serving files from: ${ROOT_DIR}`
    );


    console.log(
      `Saved users: ${users.size}`
    );


    console.log(
      `Saved FriendChat servers: ${friendchatServers.size}`
    );

  }
);
