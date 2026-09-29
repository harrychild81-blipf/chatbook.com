const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

// Temporary server data
const users = new Map();
const sockets = new Map();
const serverMessages = new Map();
const presence = new Map();


// ===============================
// HTTP SERVER
// ===============================

const server = http.createServer((req, res) => {

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      ok: true,
      service: "FriendChat"
    }));

    return;
  }


  // Find user by FriendChat ID
  if (req.url.startsWith("/api/user/")) {

    const id = decodeURIComponent(
      req.url.split("/api/user/")[1]
    ).trim().toUpperCase();

    const user = users.get(id);

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      found: !!user,
      user: user
        ? {
            id: user.id,
            name: user.name
          }
        : null
    }));

    return;
  }


  // Raw presence API
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


  // Serve website files
  let requestedFile = req.url.split("?")[0];

  if (requestedFile === "/") {
    requestedFile = "/index.html";
  }

  requestedFile = path
    .normalize(requestedFile)
    .replace(/^(\.\.[\/\\])+/, "");

  const filePath = path.join(__dirname, requestedFile);


  fs.readFile(filePath, (error, data) => {

    if (error) {

      console.log("File not found:", filePath);

      res.writeHead(404, {
        "Content-Type": "text/plain"
      });

      res.end("Not Found");

      return;
    }


    const extension = path.extname(filePath).toLowerCase();


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
        "image/x-icon"
    };


    res.writeHead(200, {
      "Content-Type":
        contentTypes[extension] ||
        "application/octet-stream"
    });

    res.end(data);

  });

});


// ===============================
// WEBSOCKET SERVER
// ===============================

const wss = new WebSocket.Server({
  server
});


// ===============================
// SEND TO ONE USER
// ===============================

function sendToUser(userId, payload) {

  const id = String(userId)
    .trim()
    .toUpperCase();

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


// ===============================
// BUILD PRESENCE FOR VIEWER
// ===============================

function getPresenceForViewer(viewerId) {

  const result = {};

  const viewer =
    String(viewerId)
      .trim()
      .toUpperCase();


  for (
    const [id, info]
    of presence.entries()
  ) {

    let status = "offline";


    if (info.online) {

      // Friend is chatting with THIS viewer
      if (
        info.chattingWith &&
        info.chattingWith === viewer
      ) {

        status = "active";

      }

      // Friend is chatting with somebody else
      else if (info.chattingWith) {

        status = "busy";

      }

      // Online but not chatting
      else {

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


// ===============================
// SEND PRESENCE TO ONE VIEWER
// ===============================

function sendPresenceToViewer(viewerId) {

  const data =
    getPresenceForViewer(viewerId);

  sendToUser(viewerId, {

    type: "presence",

    users: data

  });
}


// ===============================
// BROADCAST PRESENCE
// ===============================

function broadcastPresence() {

  for (
    const id of sockets.keys()
  ) {

    sendPresenceToViewer(id);

  }
}


// ===============================
// WEBSOCKET CONNECTION
// ===============================

wss.on("connection", (socket) => {

  console.log(
    "Device connected"
  );


  socket.isAlive = true;


  // Pong received from browser
  socket.on("pong", () => {

    socket.isAlive = true;

  });


  // =============================
  // MESSAGE
  // =============================

  socket.on("message", (raw) => {

    try {

      const msg =
        JSON.parse(raw.toString());


      // ===========================
      // REGISTER
      // ===========================

      if (msg.type === "register") {

        const userId =
          String(msg.userId || "")
            .trim()
            .toUpperCase();

        const name =
          String(
            msg.name || "Friend"
          ).trim();


        if (!userId) {
          return;
        }


        // If this user already has
        // another connection, close
        // the old connection safely.
        const oldSocket =
          sockets.get(userId);


        if (
          oldSocket &&
          oldSocket !== socket
        ) {

          console.log(
            "Closing old connection for:",
            userId
          );

          try {
            oldSocket.close();
          } catch (error) {
            // Ignore
          }
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


        // Tell this device registration worked
        socket.send(
          JSON.stringify({
            type: "registered",

            userId: userId
          })
        );


        console.log(
          "Registered:",
          userId,
          "-",
          name
        );


        // IMPORTANT:
        // Send current presence
        // to everyone.
        broadcastPresence();

        return;
      }


      // ===========================
      // PRESENCE / CHAT STATUS
      // ===========================

      if (
        msg.type === "presence_chat"
      ) {

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


        // Only broadcast if status
        // actually changed.
        if (
          info.chattingWith ===
          chatWith
        ) {

          return;
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
          chatWith || "nobody"
        );


        broadcastPresence();

        return;
      }


      // ===========================
      // TEXT CHAT
      // ===========================

      if (msg.type === "chat") {

        const record = {

          id:
            String(msg.id),

          from:
            String(msg.from)
              .trim()
              .toUpperCase(),

          to:
            String(msg.to)
              .trim()
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


      // ===========================
      // MEDIA
      // ===========================

      if (msg.type === "media") {

        const mediaSize =
          JSON.stringify(msg).length;


        // Maximum 30 MB
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

          id:
            String(msg.id),

          from:
            String(msg.from)
              .trim()
              .toUpperCase(),

          to:
            String(msg.to)
              .trim()
              .toUpperCase(),

          time:
            Number(msg.time) ||
            Date.now(),

          mediaType:
            String(
              msg.mediaType || ""
            ),

          fileName:
            String(
              msg.fileName || ""
            ),

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


      // ===========================
      // DELIVERED
      // ===========================

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


      // ===========================
      // READ / SEEN
      // ===========================

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


      // ===========================
      // REACTION
      // ===========================

      if (
        msg.type === "reaction"
      ) {

        const id =
          String(msg.messageId);


        const record =
          serverMessages.get(id);


        if (record) {

          record.reaction =
            String(
              msg.reaction || ""
            );


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


      // ===========================
      // UNSEND
      // ===========================

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

              messageId: id

            }
          );

        }


        return;
      }


      // ===========================
      // DELETE
      // ===========================

      if (
        msg.type === "server_delete"
      ) {

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

              messageId: id

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


  // =============================
  // CONNECTION CLOSED
  // =============================

  socket.on("close", () => {

    const userId =
      socket.userId;


    if (!userId) {
      return;
    }


    // IMPORTANT FIX:
    // Only the CURRENT socket is
    // allowed to mark the user offline.
    //
    // This prevents an old connection
    // from incorrectly making Jatin
    // appear offline.

    if (
      sockets.get(userId) !== socket
    ) {

      console.log(
        "Old connection closed:",
        userId
      );

      return;
    }


    sockets.delete(userId);


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


  // =============================
  // WEBSOCKET ERROR
  // =============================

  socket.on("error", (error) => {

    console.log(
      "WebSocket error:",
      error.message
    );

  });

});


// ===============================
// HEARTBEAT
// ===============================
//
// This checks whether a browser
// is actually still connected.
//

const heartbeatInterval =
  setInterval(() => {

    for (
      const socket
      of wss.clients
    ) {

      if (
        socket.isAlive === false
      ) {

        console.log(
          "Terminating dead connection:",
          socket.userId || "unknown"
        );

        socket.terminate();

        continue;
      }


      socket.isAlive = false;


      try {

        socket.ping();

      } catch (error) {

        console.log(
          "Ping error:",
          error.message
        );

      }

    }

  }, 30000);


// Stop heartbeat cleanly
wss.on("close", () => {

  clearInterval(
    heartbeatInterval
  );

});


// ===============================
// START SERVER
// ===============================

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
