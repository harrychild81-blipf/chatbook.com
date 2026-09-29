const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

/*
====================================================
FRIENDCHAT SERVER
====================================================

Files are in the repository ROOT:

FriendChat-server/
├── index.html
├── app.js
├── style.css
├── server.js
├── package.json
└── package-lock.json

So static files MUST be loaded from __dirname.
====================================================
*/


// ==================================================
// TEMPORARY SERVER DATA
// ==================================================

const users = new Map();
const sockets = new Map();
const serverMessages = new Map();


// Presence information
//
// userId -> {
//   id,
//   name,
//   online,
//   chattingWith
// }

const presence = new Map();


// ==================================================
// HTTP SERVER
// ==================================================

const server = http.createServer((req, res) => {

  // -----------------------------------------------
  // HEALTH CHECK
  // -----------------------------------------------

  if (req.url === "/health") {

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        ok: true,
        service: "FriendChat"
      })
    );

    return;
  }


  // -----------------------------------------------
  // USER LOOKUP
  // -----------------------------------------------

  if (req.url.startsWith("/api/user/")) {

    const id = decodeURIComponent(
      req.url.split("/api/user/")[1]
    ).toUpperCase();

    const user = users.get(id);

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        found: !!user,
        user: user
          ? {
              id: user.id,
              name: user.name
            }
          : null
      })
    );

    return;
  }


  // -----------------------------------------------
  // PRESENCE API
  // -----------------------------------------------

  if (req.url === "/api/presence") {

    const result = {};

    for (const [id, info] of presence.entries()) {

      result[id] = {
        id: info.id,
        name: info.name,
        online: info.online,
        chattingWith: info.chattingWith
      };

    }

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify(result));

    return;
  }


  // -----------------------------------------------
  // SERVE WEBSITE
  // -----------------------------------------------

  let requestedFile = req.url.split("?")[0];

  if (requestedFile === "/") {
    requestedFile = "/index.html";
  }


  // Prevent path traversal
  requestedFile = path
    .normalize(requestedFile)
    .replace(/^(\.\.[\/\\])+/, "");


  /*
    IMPORTANT:

    Files are in the ROOT of the GitHub repository.

    Therefore:

    __dirname + requestedFile

    NOT:

    __dirname + ../client/...
  */

  const filePath = path.join(
    __dirname,
    requestedFile
  );


  fs.readFile(filePath, (error, data) => {

    if (error) {

      console.log(
        "File not found:",
        filePath
      );

      res.writeHead(404, {
        "Content-Type": "text/plain"
      });

      res.end("Not Found");

      return;
    }


    const extension = path.extname(filePath).toLowerCase();


    const contentTypes = {

      ".html": "text/html; charset=utf-8",

      ".js": "application/javascript; charset=utf-8",

      ".css": "text/css; charset=utf-8",

      ".json": "application/json; charset=utf-8",

      ".png": "image/png",

      ".jpg": "image/jpeg",

      ".jpeg": "image/jpeg",

      ".gif": "image/gif",

      ".svg": "image/svg+xml",

      ".ico": "image/x-icon"

    };


    const contentType =
      contentTypes[extension] ||
      "application/octet-stream";


    res.writeHead(200, {
      "Content-Type": contentType
    });

    res.end(data);

  });

});


// ==================================================
// WEBSOCKET SERVER
// ==================================================

const wss = new WebSocket.Server({
  server
});


// ==================================================
// SEND TO USER
// ==================================================

function sendToUser(userId, payload) {

  const id = String(userId).toUpperCase();

  const socket = sockets.get(id);

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify(payload)
    );

    return true;
  }

  return false;
}


// ==================================================
// PRESENCE HELPERS
// ==================================================

function getPresenceForViewer(viewerId) {

  const result = {};

  const viewer = String(viewerId).toUpperCase();


  for (const [id, info] of presence.entries()) {

    let status = "offline";


    if (info.online) {

      /*
        If the person is chatting with the viewer,
        show them as Active.

        Example:

        A is chatting with B.

        B sees A = Active

        C sees A = Busy
      */

      if (
        info.chattingWith &&
        info.chattingWith === viewer
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

      id: info.id,

      name: info.name,

      status: status

    };

  }


  return result;
}


// ==================================================
// SEND PRESENCE TO ONE USER
// ==================================================

function sendPresenceToViewer(viewerId) {

  const data =
    getPresenceForViewer(viewerId);

  sendToUser(viewerId, {

    type: "presence",

    users: data

  });

}


// ==================================================
// UPDATE ALL CONNECTED USERS' PRESENCE
// ==================================================

function broadcastPresence() {

  for (const id of sockets.keys()) {

    sendPresenceToViewer(id);

  }

}


// ==================================================
// WEBSOCKET CONNECTION
// ==================================================

wss.on("connection", (socket) => {

  console.log("Device connected");


  // ==================================================
  // MESSAGE RECEIVED
  // ==================================================

  socket.on("message", (raw) => {

    try {

      const msg =
        JSON.parse(raw.toString());


      // ==================================================
      // REGISTER
      // ==================================================

      if (msg.type === "register") {

        const userId =
          String(msg.userId || "")
            .trim()
            .toUpperCase();

        const name =
          String(msg.name || "Friend")
            .trim();


        if (!userId) {
          return;
        }


        const user = {

          id: userId,

          name: name

        };


        users.set(
          userId,
          user
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

            id: userId,

            name: name,

            online: true,

            chattingWith: null

          }
        );


        socket.send(
          JSON.stringify({

            type: "registered",

            userId: userId

          })
        );


        console.log(
          "Registered:",
          userId
        );


        broadcastPresence();

        return;
      }


      // ==================================================
      // PRESENCE - WHO ARE YOU CHATTING WITH?
      // ==================================================

      if (msg.type === "presence_chat") {

        const userId =
          socket.userId;


        if (!userId) {
          return;
        }


        const info =
          presence.get(userId);


        if (!info) {
          return;
        }


        let chatWith =
          msg.chatWith;


        if (chatWith) {

          chatWith =
            String(chatWith)
              .trim()
              .toUpperCase();

        } else {

          chatWith = null;

        }


        info.chattingWith =
          chatWith;


        presence.set(
          userId,
          info
        );


        broadcastPresence();

        return;
      }


      // ==================================================
      // TEXT CHAT
      // ==================================================

      if (msg.type === "chat") {

        const record = {

          id: String(msg.id),

          from:
            String(msg.from)
              .toUpperCase(),

          to:
            String(msg.to)
              .toUpperCase(),

          text:
            String(msg.text || "")
              .slice(0, 5000),

          time:
            Number(msg.time) ||
            Date.now(),

          read: false

        };


        serverMessages.set(
          record.id,
          record
        );


        const delivered =
          sendToUser(
            record.to,
            {

              type: "chat",

              id: record.id,

              from: record.from,

              text: record.text,

              time: record.time

            }
          );


        if (!delivered) {

          sendToUser(
            record.from,
            {

              type: "delivery_error",

              reason:
                "Friend is offline",

              messageId:
                record.id

            }
          );

        }


        return;
      }


      // ==================================================
      // MEDIA
      // ==================================================

      if (msg.type === "media") {

        const mediaSize =
          JSON.stringify(msg).length;


        /*
          Limit temporary relay size
          to approximately 30 MB.
        */

        if (
          mediaSize >
          30 * 1024 * 1024
        ) {

          sendToUser(
            socket.userId,
            {

              type: "media_error",

              reason:
                "Media file is too large."

            }
          );

          return;
        }


        const record = {

          id: String(msg.id),

          from:
            String(msg.from)
              .toUpperCase(),

          to:
            String(msg.to)
              .toUpperCase(),

          time:
            Number(msg.time) ||
            Date.now(),

          mediaType:
            String(msg.mediaType || ""),

          fileName:
            String(msg.fileName || ""),

          data:
            msg.data || null

        };


        serverMessages.set(
          record.id,
          record
        );


        const delivered =
          sendToUser(
            record.to,
            {

              type: "media",

              id: record.id,

              from: record.from,

              time: record.time,

              mediaType:
                record.mediaType,

              fileName:
                record.fileName,

              data:
                record.data

            }
          );


        if (!delivered) {

          sendToUser(
            record.from,
            {

              type: "delivery_error",

              reason:
                "Friend is offline",

              messageId:
                record.id

            }
          );

        }


        return;
      }


      // ==================================================
      // DELIVERED
      // ==================================================

      if (msg.type === "delivered") {

        const id =
          String(msg.messageId);


        const record =
          serverMessages.get(id);


        if (record) {

          sendToUser(
            record.from,
            {

              type: "delivered",

              messageId:
                record.id

            }
          );

        }


        return;
      }


      // ==================================================
      // READ / SEEN
      // ==================================================

      if (msg.type === "read") {

        const id =
          String(msg.messageId);


        const record =
          serverMessages.get(id);


        if (record) {

          record.read = true;


          sendToUser(
            record.from,
            {

              type: "read",

              messageId:
                record.id

            }
          );

        }


        return;
      }


      // ==================================================
      // REACTION
      // ==================================================

      if (msg.type === "reaction") {

        const id =
          String(msg.messageId);


        const record =
          serverMessages.get(id);


        if (record) {

          record.reaction =
            String(msg.reaction || "");


          sendToUser(
            record.from,
            {

              type: "reaction",

              messageId: id,

              reaction:
                record.reaction,

              from:
                socket.userId

            }
          );


          sendToUser(
            record.to,
            {

              type: "reaction",

              messageId: id,

              reaction:
                record.reaction,

              from:
                socket.userId

            }
          );

        }


        return;
      }


      // ==================================================
      // UNSEND
      // ==================================================

      if (msg.type === "unsend") {

        const id =
          String(msg.messageId);


        const record =
          serverMessages.get(id);


        serverMessages.delete(id);


        if (record) {

          sendToUser(
            record.to,
            {

              type: "unsend",

              messageId:
                id

            }
          );

        }


        return;
      }


      // ==================================================
      // DELETE
      // ==================================================

      if (msg.type === "server_delete") {

        const id =
          String(msg.messageId);


        const record =
          serverMessages.get(id);


        serverMessages.delete(id);


        if (record) {

          sendToUser(
            record.to,
            {

              type: "server_delete",

              messageId:
                id

            }
          );

        }


        return;
      }

    } catch (error) {

      console.log(
        "Invalid message:",
        error.message
      );

    }

  });


  // ==================================================
  // DISCONNECTED
  // ==================================================

  socket.on("close", () => {

    const userId =
      socket.userId;


    if (!userId) {
      return;
    }


    if (
      sockets.get(userId) === socket
    ) {

      sockets.delete(userId);

    }


    const info =
      presence.get(userId);


    if (info) {

      info.online = false;

      info.chattingWith = null;


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

  });


  // ==================================================
  // ERROR
  // ==================================================

  socket.on("error", (error) => {

    console.log(
      "WebSocket error:",
      error.message
    );

  });

});


// ==================================================
// START SERVER
// ==================================================

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

  }
);
