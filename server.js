const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const users = new Map();
const sockets = new Map();
const presence = new Map();
const serverMessages = new Map();

const server = http.createServer((req, res) => {

  // Find user
  if (req.url.startsWith("/api/user/")) {
    const id = decodeURIComponent(
      req.url.split("/api/user/")[1]
    ).toUpperCase();

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

  // Get all online statuses
  if (req.url === "/api/presence") {
    const result = {};

    for (const [id, data] of presence) {
      result[id] = data.status;
    }

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify(result));
    return;
  }

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

  let file = req.url === "/" ? "/index.html" : req.url;

  file = path
    .normalize(file)
    .replace(/^(\.\.[\/\\])+/, "");

  const filePath = path.join(__dirname, "..", "client", file);

  fs.readFile(filePath, (err, data) => {

    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);

    const types = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css"
    };

    res.writeHead(200, {
      "Content-Type":
        types[ext] || "application/octet-stream"
    });

    res.end(data);
  });
});

const wss = new WebSocket.Server({
  server
});

function sendToUser(id, payload) {

  const socket = sockets.get(
    String(id).toUpperCase()
  );

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(JSON.stringify(payload));
    return true;
  }

  return false;
}


// Send status to EVERY connected user
function broadcastPresence() {

  const list = {};

  for (const [id, data] of presence) {
    list[id] = data.status;
  }

  const payload = JSON.stringify({
    type: "presence",
    users: list
  });

  for (const socket of sockets.values()) {

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}


wss.on("connection", socket => {

  console.log("Device connected");

  socket.on("message", raw => {

    try {

      const msg = JSON.parse(raw.toString());

      // =========================
      // REGISTER
      // =========================

      if (msg.type === "register") {

        const id = String(
          msg.userId
        ).toUpperCase();

        const user = {
          id,
          name: String(
            msg.name || "Friend"
          )
        };

        users.set(id, user);
        sockets.set(id, socket);

        socket.userId = id;

        // User starts as active
        presence.set(id, {
          status: "active",
          chatWith: null
        });

        socket.send(JSON.stringify({
          type: "registered",
          userId: id
        }));

        broadcastPresence();

        console.log(
          "Registered:",
          id
        );

        return;
      }


      // =========================
      // CHAT OPEN / BUSY
      // =========================

      if (msg.type === "presence_chat") {

        if (!socket.userId) return;

        const chatWith = msg.chatWith
          ? String(msg.chatWith).toUpperCase()
          : null;

        const userPresence =
          presence.get(socket.userId);

        if (userPresence) {

          userPresence.chatWith =
            chatWith;

          // If user is inside a chat,
          // show BUSY to other people.
          userPresence.status =
            chatWith
              ? "busy"
              : "active";
        }

        broadcastPresence();

        return;
      }


      // =========================
      // CHAT MESSAGE
      // =========================

      if (msg.type === "chat") {

        const record = {
          id: String(msg.id),
          from: String(msg.from).toUpperCase(),
          to: String(msg.to).toUpperCase(),
          type: "chat",
          time:
            Number(msg.time) ||
            Date.now()
        };

        serverMessages.set(
          record.id,
          record
        );

        const delivered =
          sendToUser(record.to, {
            type: "chat",
            id: record.id,
            from: record.from,
            text: String(
              msg.text || ""
            ).slice(0, 5000),
            time: record.time
          });

        if (!delivered) {

          serverMessages.delete(
            record.id
          );

          socket.send(
            JSON.stringify({
              type: "delivery_error",
              reason:
                "Friend is offline",
              messageId:
                record.id
            })
          );
        }

        return;
      }


      // =========================
      // DELIVERED
      // =========================

      if (msg.type === "delivered") {

        const record =
          serverMessages.get(
            String(msg.messageId)
          );

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


      // =========================
      // READ
      // =========================

      if (msg.type === "read") {

        const record =
          serverMessages.get(
            String(msg.messageId)
          );

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


      // =========================
      // REACTION
      // =========================

      if (msg.type === "reaction") {

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


      // =========================
      // UNSEND
      // =========================

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


      // =========================
      // DELETE
      // =========================

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
              messageId: id
            }
          );
        }

        return;
      }

    } catch (e) {

      console.log(
        "Invalid message:",
        e.message
      );
    }
  });


  // =========================
  // DISCONNECT
  // =========================

  socket.on("close", () => {

    if (
      socket.userId &&
      sockets.get(socket.userId) === socket
    ) {

      const id = socket.userId;

      sockets.delete(id);

      // Remove presence
      presence.delete(id);

      broadcastPresence();

      console.log(
        "Disconnected:",
        id
      );
    }
  });

});


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
