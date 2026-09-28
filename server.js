const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const users = new Map();
const sockets = new Map();

// Temporary RAM-only message metadata.
// Actual media is NOT saved to disk.
const serverMessages = new Map();


// ==============================
// HTTP SERVER
// ==============================

const server = http.createServer((req, res) => {

  // ------------------------------
  // USER LOOKUP
  // ------------------------------

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


  // ------------------------------
  // HEALTH CHECK
  // ------------------------------

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


  // ------------------------------
  // WEBSITE FILES
  // ------------------------------

  let requestPath = req.url.split("?")[0];

  if (requestPath === "/") {
    requestPath = "/index.html";
  }

  // Prevent directory traversal
  requestPath = path.normalize(requestPath);

  while (
    requestPath.startsWith("/") ||
    requestPath.startsWith("\\")
  ) {
    requestPath = requestPath.slice(1);
  }

  // IMPORTANT:
  // index.html, app.js and style.css
  // are directly beside server.js
  const filePath = path.join(
    __dirname,
    requestPath
  );


  fs.readFile(filePath, (err, data) => {

    if (err) {

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


    const ext = path.extname(filePath).toLowerCase();

    const contentTypes = {

      ".html":
        "text/html; charset=utf-8",

      ".js":
        "application/javascript; charset=utf-8",

      ".css":
        "text/css; charset=utf-8",

      ".json":
        "application/json",

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

      ".webp":
        "image/webp",

      ".ico":
        "image/x-icon"
    };


    res.writeHead(200, {
      "Content-Type":
        contentTypes[ext] ||
        "application/octet-stream"
    });

    res.end(data);

  });

});


// ==============================
// WEBSOCKET SERVER
// ==============================

const wss = new WebSocket.Server({
  server
});


// ==============================
// SEND TO USER
// ==============================

function sendToUser(id, payload) {

  const userId =
    String(id).toUpperCase();

  const socket =
    sockets.get(userId);

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


// ==============================
// WEBSOCKET CONNECTION
// ==============================

wss.on("connection", socket => {

  console.log("Device connected");


  socket.on("message", raw => {

    try {

      const msg = JSON.parse(
        raw.toString()
      );


      // ==========================
      // REGISTER
      // ==========================

      if (msg.type === "register") {

        const user = {

          id:
            String(
              msg.userId
            ).toUpperCase(),

          name:
            String(
              msg.name || "Friend"
            )

        };


        users.set(
          user.id,
          user
        );

        sockets.set(
          user.id,
          socket
        );

        socket.userId =
          user.id;


        socket.send(
          JSON.stringify({

            type: "registered",

            userId:
              user.id

          })
        );


        console.log(
          "Registered:",
          user.id
        );

        return;
      }


      // ==========================
      // TEXT CHAT
      // ==========================

      if (msg.type === "chat") {

        const record = {

          id:
            String(msg.id),

          from:
            String(
              msg.from
            ).toUpperCase(),

          to:
            String(
              msg.to
            ).toUpperCase(),

          type:
            "chat",

          time:
            Number(msg.time) ||
            Date.now()

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

              id:
                record.id,

              from:
                record.from,

              text:
                String(
                  msg.text || ""
                ).slice(0, 5000),

              time:
                record.time

            }
          );


        if (!delivered) {

          serverMessages.delete(
            record.id
          );


          socket.send(
            JSON.stringify({

              type:
                "delivery_error",

              reason:
                "Friend is offline",

              messageId:
                record.id

            })
          );

        }

        return;
      }


      // ==========================
      // MEDIA
      // ==========================

      if (msg.type === "media") {

        const record = {

          id:
            String(msg.id),

          from:
            String(
              msg.from
            ).toUpperCase(),

          to:
            String(
              msg.to
            ).toUpperCase(),

          type:
            "media",

          mediaType:
            String(
              msg.mediaType || ""
            ),

          mimeType:
            String(
              msg.mimeType || ""
            ),

          name:
            String(
              msg.name || ""
            ),

          size:
            Number(msg.size) || 0,

          time:
            Number(msg.time) ||
            Date.now()

        };


        // Only metadata is stored.
        // The actual media is not saved.

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

              from:
                record.from,

              mediaType:
                record.mediaType,

              mimeType:
                record.mimeType,

              name:
                record.name,

              size:
                record.size,

              data:
                msg.data,

              time:
                record.time

            }
          );


        if (!delivered) {

          serverMessages.delete(
            record.id
          );


          socket.send(
            JSON.stringify({

              type:
                "delivery_error",

              reason:
                "Friend is offline",

              messageId:
                record.id

            })
          );

        }

        return;
      }


      // ==========================
      // DELIVERED
      // ==========================

      if (msg.type === "delivered") {

        const record =
          serverMessages.get(
            String(msg.messageId)
          );


        if (record) {

          sendToUser(
            record.from,
            {

              type:
                "delivered",

              messageId:
                record.id

            }
          );

        }

        return;
      }


      // ==========================
      // READ / SEEN
      // ==========================

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

              type:
                "read",

              messageId:
                record.id

            }
          );

        }

        return;
      }


      // ==========================
      // REACTION
      // ==========================

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

              type:
                "reaction",

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


      // ==========================
      // UNSEND
      // ==========================

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

              type:
                "unsend",

              messageId:
                id

            }
          );

        }

        return;
      }


      // ==========================
      // DELETE
      // ==========================

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

              type:
                "server_delete",

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


  // ==========================
  // DISCONNECT
  // ==========================

  socket.on("close", () => {

    if (
      socket.userId &&
      sockets.get(
        socket.userId
      ) === socket
    ) {

      sockets.delete(
        socket.userId
      );


      console.log(
        "Disconnected:",
        socket.userId
      );

    }

  });

});


// ==============================
// START SERVER
// ==============================

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
