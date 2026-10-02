const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;


/* =====================================================
   TEMPORARY SERVER DATA
   ===================================================== */

const users = new Map();
const sockets = new Map();
const serverMessages = new Map();
const presence = new Map();
const profilePhotos = new Map();


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
   HELPERS
   ===================================================== */

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
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
  (req, res) => {

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

    if (pathname === "/health") {

      res.writeHead(
        200,
        {
          "Content-Type":
            "application/json; charset=utf-8"
        }
      );

      res.end(
        JSON.stringify({
          ok: true,
          service: "FriendChat"
        })
      );

      return;
    }


    /* ================================================
       ALL FRIENDCHAT USERS
       ================================================

       Example:

       /api/users

       /api/users?exclude=FC-ABC123

       Returns:

       {
         users: [
           {
             id: "FC-ABC123",
             name: "Harry",
             status: "active"
           }
         ]
       }

       IMPORTANT:
       No email or password is returned.
       ================================================ */

    if (pathname === "/api/users") {

      const excludeId =
        normalizeId(
          url.searchParams.get("exclude")
        );

      const viewer =
        excludeId;

      const presenceForViewer =
        viewer
          ? getPresenceForViewer(viewer)
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

        } else {

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


      /*
        Sort online users first,
        then alphabetically by name.
      */

      result.sort(
        (a, b) => {

          if (
            a.online !== b.online
          ) {

            return a.online
              ? -1
              : 1;

          }

          return String(a.name)
            .localeCompare(
              String(b.name)
            );

        }
      );


      res.writeHead(
        200,
        {
          "Content-Type":
            "application/json; charset=utf-8",

          "Cache-Control":
            "no-cache"
        }
      );


      res.end(
        JSON.stringify({
          users: result
        })
      );

      return;
    }


    /* ================================================
       FIND ONE USER
       ================================================ */

    if (
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


      res.writeHead(
        200,
        {
          "Content-Type":
            "application/json; charset=utf-8"
        }
      );


      res.end(
        JSON.stringify({

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

        })
      );

      return;
    }


    /* ================================================
       PRESENCE API
       ================================================ */

    if (
      pathname === "/api/presence"
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


      res.writeHead(
        200,
        {
          "Content-Type":
            "application/json; charset=utf-8"
        }
      );


      res.end(
        JSON.stringify(result)
      );

      return;
    }


    /* ================================================
       PROFILE PHOTO API
       ================================================ */

    if (
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

        res.writeHead(
          404,
          {
            "Content-Type":
              "application/json; charset=utf-8"
          }
        );


        res.end(
          JSON.stringify({
            found: false
          })
        );

        return;
      }


      res.writeHead(
        200,
        {
          "Content-Type":
            "application/json; charset=utf-8"
        }
      );


      res.end(
        JSON.stringify({

          found:
            true,

          userId:
            id,

          photo:
            photo

        })
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
        .replace(/^\/+/, "");


    /*
      Prevent ../ path traversal.
    */

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


    /*
      Make absolutely sure the requested file
      remains inside ROOT_DIR.
    */

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

      res.writeHead(403);

      res.end("Forbidden");

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


        res.end(data);

      }
    );

  }
);


/* =====================================================
   PRESENCE
   ===================================================== */

function getPresenceForViewer(
  viewerId
) {

  const viewer =
    normalizeId(viewerId);

  const result = {};


  for (
    const [id, info]
    of presence.entries()
  ) {

    let status =
      "offline";


    if (info.online) {

      /*
        User is talking directly
        to the viewer.
      */

      if (
        info.chattingWith &&
        normalizeId(
          info.chattingWith
        ) === viewer
      ) {

        status =
          "active";

      }


      /*
        User is talking to someone else.
      */

      else if (
        info.chattingWith
      ) {

        status =
          "busy";

      }


      /*
        Online and not talking.
      */

      else {

        status =
          "active";

      }

    }


    result[id] = {

      id:
        info.id,

      name:
        info.name,

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
    normalizeId(userId);


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


    /* ================================================
       ALL WEBSOCKET MESSAGES
       ================================================ */

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


            /*
              Close previous connection
              for same account.
            */

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


            const user = {

              id:
                userId,

              name:
                name

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

                id:
                  userId,

                name:
                  name,

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
              Send known profile photos
              to newly connected device.
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


            console.log(
              "Registered:",
              userId,
              "-",
              name
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


            /*
              Limit profile photo size.
            */

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


        /*
          Only remove the current
          connection.
        */

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
   START
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

  }
);
