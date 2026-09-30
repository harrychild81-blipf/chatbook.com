const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

/* =========================
   MEMORY
========================= */

const users = new Map();
const sockets = new Map();
const messages = new Map();
const profilePhotos = new Map();

/* =========================
   HELPERS
========================= */

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
  const socket = sockets.get(normalizeId(userId));
  return sendSocket(socket, data);
}

/* =========================
   PRESENCE
========================= */

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

/* =========================
   HTTP SERVER
========================= */

const server = http.createServer((req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  const pathname = url.pathname;

  /* ---------- HEALTH ---------- */

  if (pathname === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
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

  /* ---------- USER ---------- */

  if (pathname.startsWith("/api/user/")) {
    const id = normalizeId(
      decodeURIComponent(
        pathname.substring("/api/user/".length)
      )
    );

    const user = users.get(id);

    res.writeHead(200, {
      "Content-Type": "application/json",
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

  /* ---------- PROFILE PHOTO ---------- */

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
      "Content-Type": "application/json"
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

  /* ---------- STATIC FILES ---------- */

  let filePath;

  if (pathname === "/") {
    filePath = path.join(
      __dirname,
      "..",
      "index.html"
    );
  } else {
    filePath = path.join(
      __dirname,
      "..",
      decodeURIComponent(pathname)
    );
  }

  const root = path.resolve(
    __dirname,
    ".."
  );

  const absolute = path.resolve(
    filePath
  );

  if (!absolute.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(
    absolute,
    (error, data) => {
      if (error) {
        res.writeHead(404, {
          "Content-Type": "text/plain"
        });

        res.end("Not Found");
        return;
      }

      const ext = path.extname(
        absolute
      ).toLowerCase();

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

        ".mp4":
          "video/mp4",

        ".webm":
          "video/webm"
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

/* =========================
   WEBSOCKET SERVER
========================= */

const wss = new WebSocket.Server({
  server
});

wss.on("connection", socket => {
  console.log("Device connected");

  socket.userId = null;
  socket.chatWith = null;

  socket.on("message", raw => {
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

    if (!msg) return;

    /* =========================
       REGISTER
    ========================= */

    if (msg.type === "register") {
      const id = normalizeId(
        msg.userId
      );

      const name = String(
        msg.name || "Friend"
      )
        .trim()
        .slice(0, 100);

      if (!id) return;

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

      users.set(id, {
        id,
        name
      });

      sockets.set(
        id,
        socket
      );

      socket.userId = id;

      sendSocket(socket, {
        type: "registered",
        userId: id,
        name
      });

      console.log(
        "Registered:",
        id,
        "-",
        name
      );

      broadcastPresence();

      return;
    }

    /* =========================
       MUST BE REGISTERED
    ========================= */

    if (!socket.userId) {
      sendSocket(socket, {
        type: "error",
        reason:
          "Register first."
      });

      return;
    }

    /* =========================
       CHAT PRESENCE
    ========================= */

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

    /* =========================
       TEXT MESSAGE
    ========================= */

    if (
      msg.type === "chat"
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
        ).slice(0, 5000);

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
        sendSocket(socket, {
          type:
            "delivery_error",

          messageId,

          reason:
            "Invalid message."
        });

        return;
      }

      /* Security */
      if (
        from !==
        socket.userId
      ) {
        return;
      }

      const receiver =
        sockets.get(to);

      /* User 2 offline */

      if (
        !receiver ||
        receiver.readyState !==
          WebSocket.OPEN
      ) {
        sendSocket(socket, {
          type:
            "delivery_error",

          messageId,

          reason:
            "Friend is offline."
        });

        console.log(
          "Receiver offline:",
          to
        );

        return;
      }

      /* Save temporary message */

      messages.set(
        messageId,
        {
          id: messageId,
          from,
          to,
          text,
          time,
          delivered: true,
          read: false
        }
      );

      /* SEND TO USER 2 */

      sendSocket(
        receiver,
        {
          type: "chat",

          id: messageId,

          messageId,

          from,

          to,

          text,

          time
        }
      );

      /*
        USER 1 gets double grey tick
        because USER 2 received it.
      */

      sendSocket(
        socket,
        {
          type: "delivered",

          id: messageId,

          messageId
        }
      );

      console.log(
        "MESSAGE:",
        from,
        "->",
        to,
        messageId
      );

      return;
    }

    /* =========================
       DELIVERED
    ========================= */

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
        messages.get(id);

      if (!record) return;

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

          messageId: id
        }
      );

      return;
    }

    /* =========================
       READ
    ========================= */

    if (
      msg.type === "read"
    ) {
      const id =
        String(
          msg.messageId ||
          msg.id ||
          ""
        );

      const record =
        messages.get(id);

      if (!record) return;

      if (
        socket.userId !==
        record.to
      ) {
        return;
      }

      record.read = true;

      sendToUser(
        record.from,
        {
          type: "read",

          id,

          messageId: id
        }
      );

      console.log(
        "READ:",
        id
      );

      return;
    }

    /* =========================
       MEDIA
    ========================= */

    if (
      msg.type === "media"
    ) {
      const id =
        String(
          msg.messageId ||
          msg.id ||
          ""
        );

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
        sendSocket(socket, {
          type:
            "delivery_error",

          messageId: id,

          reason:
            "Friend is offline."
        });

        return;
      }

      sendSocket(
        receiver,
        {
          type: "media",

          id,

          messageId: id,

          from,

          to,

          data: msg.data,

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

          delivered: true,

          read: false
        }
      );

      sendSocket(
        socket,
        {
          type:
            "delivered",

          id,

          messageId: id
        }
      );

      return;
    }

    /* =========================
       REACTION
    ========================= */

    if (
      msg.type ===
      "reaction"
    ) {
      const id =
        String(
          msg.messageId
        );

      const record =
        messages.get(id);

      if (!record) return;

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

          messageId: id,

          reaction:
            msg.reaction
        }
      );

      sendToUser(
        record.to,
        {
          type:
            "reaction",

          messageId: id,

          reaction:
            msg.reaction
        }
      );

      return;
    }

    /* =========================
       UNSEND
    ========================= */

    if (
      msg.type === "unsend"
    ) {
      const id =
        String(
          msg.messageId
        );

      const record =
        messages.get(id);

      if (!record) return;

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

          messageId: id
        }
      );

      return;
    }

    /* =========================
       DELETE
    ========================= */

    if (
      msg.type ===
      "server_delete"
    ) {
      const id =
        String(
          msg.messageId
        );

      const record =
        messages.get(id);

      if (!record) return;

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

          messageId: id
        }
      );

      sendToUser(
        record.to,
        {
          type:
            "server_delete",

          messageId: id
        }
      );

      return;
    }

    /* =========================
       PROFILE PHOTO
    ========================= */

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

      const photoData = {
        data:
          String(
            msg.data || ""
          ),

        mimeType:
          String(
            msg.mimeType ||
            "image/jpeg"
          ),

        name:
          String(
            msg.name ||
            users.get(id)?.name ||
            "Friend"
          ).trim(),

        time:
          Number(
            msg.time
          ) || Date.now()
      };

      profilePhotos.set(
        id,
        photoData
      );

      /*
        Send profile photo to
        connected users.
      */

      for (
        const [
          otherId,
          otherSocket
        ] of sockets
      ) {
        if (
          otherId === id
        ) {
          continue;
        }

        sendSocket(
          otherSocket,
          {
            type:
              "profile_photo",

            userId: id,

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

      return;
    }
  });

  /* =========================
     DISCONNECT
  ========================= */

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

  socket.on(
    "error",
    error => {
      console.error(
        "Socket error:",
        error.message
      );
    }
  );
});

/* =========================
   CLEAN OLD MESSAGES
========================= */

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

/* =========================
   START
========================= */

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
