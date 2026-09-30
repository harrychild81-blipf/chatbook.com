const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

/* =====================================================
   FILE LOCATION
   ===================================================== */

// On Render:
// index.html
// app.js
// style.css
// server.js
// are all in the same folder.

const ROOT_DIR = __dirname;

/* =====================================================
   MEMORY
===================================================== */

const users = new Map();
const sockets = new Map();
const messages = new Map();
const profilePhotos = new Map();

/* =====================================================
   HELPERS
===================================================== */

function normalizeId(id) {
  return String(id || "")
    .trim()
    .toUpperCase();
}

function sendSocket(socket, data) {
  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    return false;
  }

  try {
    socket.send(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("SEND ERROR:", error);
    return false;
  }
}

function sendToUser(userId, data) {
  const socket = sockets.get(
    normalizeId(userId)
  );

  return sendSocket(socket, data);
}

/* =====================================================
   PRESENCE
===================================================== */

function getPresence() {
  const result = {};

  for (const [id, socket] of sockets) {
    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      result[id] = {
        status: socket.chatWith
          ? "busy"
          : "active"
      };
    }
  }

  return result;
}

function broadcastPresence() {
  const data = {
    type: "presence",
    users: getPresence()
  };

  for (const socket of sockets.values()) {
    sendSocket(socket, data);
  }
}

/* =====================================================
   HTTP SERVER
===================================================== */

const server = http.createServer((req, res) => {
  let url;

  try {
    url = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    );
  } catch (error) {
    res.writeHead(400, {
      "Content-Type": "text/plain"
    });

    res.end("Bad Request");
    return;
  }

  const pathname = url.pathname;

  /* =================================================
     HEALTH
  ================================================= */

  if (pathname === "/health") {
    res.writeHead(200, {
      "Content-Type":
        "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    res.end(
      JSON.stringify({
        ok: true,
        service: "FriendChat",
        connected: sockets.size
      })
    );

    return;
  }

  /* =================================================
     USER
  ================================================= */

  if (pathname.startsWith("/api/user/")) {
    const id = normalizeId(
      decodeURIComponent(
        pathname.substring(
          "/api/user/".length
        )
      )
    );

    const user = users.get(id);

    res.writeHead(200, {
      "Content-Type":
        "application/json; charset=utf-8",
      "Cache-Control": "no-store"
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

  /* =================================================
     PROFILE PHOTO
  ================================================= */

  if (
    pathname.startsWith(
      "/api/profile-photo/"
    )
  ) {
    const id = normalizeId(
      decodeURIComponent(
        pathname.substring(
          "/api/profile-photo/".length
        )
      )
    );

    const photo = profilePhotos.get(id);

    res.writeHead(200, {
      "Content-Type":
        "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    res.end(
      JSON.stringify({
        found: !!photo,
        userId: id,
        photo: photo || null
      })
    );

    return;
  }

  /* =================================================
     STATIC FILES
  ================================================= */

  let requestedPath = pathname;

  // / -> index.html
  if (requestedPath === "/") {
    requestedPath = "/index.html";
  }

  // Remove leading /
  requestedPath = requestedPath.replace(
    /^\/+/,
    ""
  );

  let filePath;

  try {
    filePath = path.resolve(
      ROOT_DIR,
      decodeURIComponent(requestedPath)
    );
  } catch (error) {
    res.writeHead(400, {
      "Content-Type": "text/plain"
    });

    res.end("Bad Request");
    return;
  }

  /* =================================================
     SECURITY
  ================================================= */

  if (
    filePath !== ROOT_DIR &&
    !filePath.startsWith(
      ROOT_DIR + path.sep
    )
  ) {
    res.writeHead(403, {
      "Content-Type": "text/plain"
    });

    res.end("Forbidden");
    return;
  }

  console.log(
    "Serving:",
    filePath
  );

  fs.readFile(
    filePath,
    (error, data) => {
      if (error) {
        console.error(
          "FILE NOT FOUND:",
          filePath
        );

        res.writeHead(404, {
          "Content-Type":
            "text/plain; charset=utf-8"
        });

        res.end("Not Found");
        return;
      }

      const ext = path
        .extname(filePath)
        .toLowerCase();

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

        ".webp":
          "image/webp",

        ".svg":
          "image/svg+xml",

        ".ico":
          "image/x-icon",

        ".mp4":
          "video/mp4",

        ".webm":
          "video/webm",

        ".mp3":
          "audio/mpeg",

        ".wav":
          "audio/wav"
      };

      res.writeHead(200, {
        "Content-Type":
          contentTypes[ext] ||
          "application/octet-stream"
      });

      res.end(data);
    }
  );
});

/* =====================================================
   WEBSOCKET SERVER
===================================================== */

const wss = new WebSocket.Server({
  server
});

wss.on(
  "connection",
  socket => {
    console.log(
      "Device connected"
    );

    socket.userId = null;
    socket.chatWith = null;

    /* =================================================
       MESSAGE HANDLER
    ================================================= */

    socket.on(
      "message",
      raw => {
        let msg;

        try {
          msg = JSON.parse(
            raw.toString()
          );
        } catch (error) {
          console.error(
            "Invalid JSON:",
            error
          );

          return;
        }

        if (!msg) {
          return;
        }

        /* =============================================
           REGISTER
        ============================================= */

        if (
          msg.type ===
          "register"
        ) {
          const id =
            normalizeId(
              msg.userId
            );

          const name =
            String(
              msg.name ||
                "Friend"
            )
              .trim()
              .slice(0, 100);

          if (!id) {
            return;
          }

          const oldSocket =
            sockets.get(id);

          if (
            oldSocket &&
            oldSocket !== socket
          ) {
            try {
              oldSocket.close();
            } catch {}
          }

          users.set(
            id,
            {
              id,
              name
            }
          );

          sockets.set(
            id,
            socket
          );

          socket.userId =
            id;

          sendSocket(
            socket,
            {
              type:
                "registered",

              userId:
                id,

              name
            }
          );

          console.log(
            "Registered:",
            id,
            "-",
            name
          );

          broadcastPresence();

          return;
        }

        /* =============================================
           MUST BE REGISTERED
        ============================================= */

        if (!socket.userId) {
          sendSocket(
            socket,
            {
              type:
                "error",

              reason:
                "Register first."
            }
          );

          return;
        }

        /* =============================================
           CHAT PRESENCE
        ============================================= */

        if (
          msg.type ===
          "presence_chat"
        ) {
          socket.chatWith =
            msg.chatWith
              ? normalizeId(
                  msg.chatWith
                )
              : null;

          broadcastPresence();

          return;
        }

        /* =============================================
           TEXT MESSAGE
        ============================================= */

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

          const from =
            normalizeId(
              msg.from ||
                socket.userId
            );

          const to =
            normalizeId(
              msg.to
            );

          const text =
            String(
              msg.text || ""
            ).slice(
              0,
              5000
            );

          const time =
            Number(
              msg.time
            ) || Date.now();

          if (
            !messageId ||
            !from ||
            !to ||
            !text
          ) {
            sendSocket(
              socket,
              {
                type:
                  "delivery_error",

                messageId,

                reason:
                  "Invalid message."
              }
            );

            return;
          }

          /* Security */

          if (
            from !==
            socket.userId
          ) {
            console.error(
              "Invalid sender:",
              from
            );

            return;
          }

          const receiver =
            sockets.get(to);

          /* Receiver offline */

          if (
            !receiver ||
            receiver.readyState !==
              WebSocket.OPEN
          ) {
            sendSocket(
              socket,
              {
                type:
                  "delivery_error",

                messageId,

                reason:
                  "Friend is offline."
              }
            );

            console.log(
              "Receiver offline:",
              to
            );

            return;
          }

          /* Save message */

          messages.set(
            messageId,
            {
              id:
                messageId,

              from,

              to,

              text,

              time,

              delivered:
                false,

              read:
                false
            }
          );

          /* Send message */

          const sent =
            sendSocket(
              receiver,
              {
                type:
                  "chat",

                id:
                  messageId,

                messageId,

                from,

                to,

                text,

                time
              }
            );

          /* =========================================
             DELIVERY TICK
          ========================================= */

          if (sent) {
            const record =
              messages.get(
                messageId
              );

            if (record) {
              record.delivered =
                true;
            }

            sendSocket(
              socket,
              {
                type:
                  "delivered",

                id:
                  messageId,

                messageId
              }
            );

            console.log(
              "DELIVERED:",
              messageId
            );
          }

          console.log(
            "MESSAGE:",
            from,
            "->",
            to,
            messageId
          );

          return;
        }

        /* =============================================
           DELIVERED ACK
        ============================================= */

        if (
          msg.type ===
          "delivered"
        ) {
          const id =
            String(
              msg.messageId ||
                msg.id ||
                ""
            ).trim();

          const record =
            messages.get(id);

          if (!record) {
            return;
          }

          if (
            socket.userId !==
            record.to
          ) {
            return;
          }

          record.delivered =
            true;

          sendToUser(
            record.from,
            {
              type:
                "delivered",

              id,

              messageId:
                id
            }
          );

          console.log(
            "DELIVERY ACK:",
            id
          );

          return;
        }

        /* =============================================
           READ
        ============================================= */

        if (
          msg.type ===
          "read"
        ) {
          const id =
            String(
              msg.messageId ||
                msg.id ||
                ""
            ).trim();

          const record =
            messages.get(id);

          if (!record) {
            return;
          }

          if (
            socket.userId !==
            record.to
          ) {
            return;
          }

          record.read =
            true;

          sendToUser(
            record.from,
            {
              type:
                "read",

              id,

              messageId:
                id
            }
          );

          console.log(
            "READ:",
            id
          );

          return;
        }

        /* =============================================
           MEDIA
        ============================================= */

        if (
          msg.type ===
          "media"
        ) {
          const id =
            String(
              msg.messageId ||
                msg.id ||
                ""
            ).trim();

          const from =
            normalizeId(
              msg.from ||
                socket.userId
            );

          const to =
            normalizeId(
              msg.to
            );

          const receiver =
            sockets.get(to);

          if (
            !receiver ||
            receiver.readyState !==
              WebSocket.OPEN
          ) {
            sendSocket(
              socket,
              {
                type:
                  "delivery_error",

                messageId:
                  id,

                reason:
                  "Friend is offline."
              }
            );

            return;
          }

          const sent =
            sendSocket(
              receiver,
              {
                type:
                  "media",

                id,

                messageId:
                  id,

                from,

                to,

                data:
                  msg.data,

                mediaType:
                  msg.mediaType,

                mimeType:
                  msg.mimeType,

                name:
                  msg.name,

                size:
                  msg.size,

                time:
                  msg.time ||
                  Date.now()
              }
            );

          messages.set(
            id,
            {
              id,

              from,

              to,

              time:
                msg.time ||
                Date.now(),

              delivered:
                !!sent,

              read:
                false
            }
          );

          if (sent) {
            sendSocket(
              socket,
              {
                type:
                  "delivered",

                id,

                messageId:
                  id
              }
            );
          }

          return;
        }

        /* =============================================
           REACTION
        ============================================= */

        if (
          msg.type ===
          "reaction"
        ) {
          const id =
            String(
              msg.messageId ||
                ""
            );

          const record =
            messages.get(id);

          if (!record) {
            return;
          }

          if (
            socket.userId !==
              record.from &&
            socket.userId !==
              record.to
          ) {
            return;
          }

          sendToUser(
            record.from,
            {
              type:
                "reaction",

              messageId:
                id,

              reaction:
                msg.reaction
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
                msg.reaction
            }
          );

          return;
        }

        /* =============================================
           UNSEND
        ============================================= */

        if (
          msg.type ===
          "unsend"
        ) {
          const id =
            String(
              msg.messageId ||
                ""
            );

          const record =
            messages.get(id);

          if (!record) {
            return;
          }

          if (
            socket.userId !==
            record.from
          ) {
            return;
          }

          messages.delete(id);

          sendToUser(
            record.to,
            {
              type:
                "unsend",

              messageId:
                id
            }
          );

          return;
        }

        /* =============================================
           DELETE
        ============================================= */

        if (
          msg.type ===
          "server_delete"
        ) {
          const id =
            String(
              msg.messageId ||
                ""
            );

          const record =
            messages.get(id);

          if (!record) {
            return;
          }

          if (
            socket.userId !==
              record.from &&
            socket.userId !==
              record.to
          ) {
            return;
          }

          messages.delete(id);

          sendToUser(
            record.from,
            {
              type:
                "server_delete",

              messageId:
                id
            }
          );

          sendToUser(
            record.to,
            {
              type:
                "server_delete",

              messageId:
                id
            }
          );

          return;
        }

        /* =============================================
           PROFILE PHOTO
        ============================================= */

        if (
          msg.type ===
          "profile_photo"
        ) {
          const id =
            normalizeId(
              msg.userId ||
                socket.userId
            );

          if (
            id !==
            socket.userId
          ) {
            return;
          }

          const photoData =
            {
              data:
                String(
                  msg.data ||
                    ""
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
                      id
                    )?.name ||
                    "Friend"
                )
                  .trim(),

              time:
                Number(
                  msg.time
                ) ||
                Date.now()
            };

          profilePhotos.set(
            id,
            photoData
          );

          for (
            const [
              otherId,
              otherSocket
            ] of sockets
          ) {
            if (
              otherId ===
              id
            ) {
              continue;
            }

            sendSocket(
              otherSocket,
              {
                type:
                  "profile_photo",

                userId:
                  id,

                name:
                  photoData.name,

                mimeType:
                  photoData.mimeType,

                data:
                  photoData.data,

                time:
                  photoData.time
              }
            );
          }

          console.log(
            "Profile photo updated:",
            id
          );

          return;
        }
      }
    );

    /* =================================================
       DISCONNECT
    ================================================= */

    socket.on(
      "close",
      () => {
        const id =
          socket.userId;

        if (
          id &&
          sockets.get(id) ===
            socket
        ) {
          sockets.delete(id);

          console.log(
            "Disconnected:",
            id
          );

          broadcastPresence();
        }
      }
    );

    /* =================================================
       ERROR
    ================================================= */

    socket.on(
      "error",
      error => {
        console.error(
          "Socket error:",
          error.message
        );
      }
    );
  }
);

/* =====================================================
   CLEAN OLD MESSAGES
===================================================== */

setInterval(
  () => {
    const limit =
      Date.now() -
      24 *
        60 *
        60 *
        1000;

    for (
      const [
        id,
        message
      ] of messages
    ) {
      if (
        Number(
          message.time
        ) < limit
      ) {
        messages.delete(id);
      }
    }
  },
  60 * 60 * 1000
);

/* =====================================================
   START
===================================================== */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "================================"
    );

    console.log(
      "       FRIENDCHAT SERVER"
    );

    console.log(
      "================================"
    );

    console.log(
      "Root directory:",
      ROOT_DIR
    );

    console.log(
      `HTTP: http://localhost:${PORT}`
    );

    console.log(
      `WebSocket: ws://localhost:${PORT}`
    );

    console.log(
      "Server is ready."
    );

    console.log(
      "================================"
    );
  }
);
