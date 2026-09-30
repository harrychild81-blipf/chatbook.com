/* =========================================================
   FRIENDCHAT SERVER
   ========================================================= */

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");


/* =========================================================
   PORT
   ========================================================= */

const PORT =
  process.env.PORT || 8080;


/* =========================================================
   MEMORY
   ========================================================= */

/*
  Users currently known to the server.

  userId -> {
    id,
    name
  }
*/
const users = new Map();


/*
  Active WebSocket connections.

  userId -> socket
*/
const sockets = new Map();


/*
  Message metadata.

  The actual media data is NOT stored here.

  messageId -> {
    id,
    from,
    to,
    type,
    time,
    ...
  }
*/
const serverMessages = new Map();


/* =========================================================
   HELPERS
   ========================================================= */

function normalizeId(id) {
  return String(
    id || ""
  )
    .trim()
    .toUpperCase();
}


function safeString(
  value,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value);
}


function sendSocket(
  socket,
  payload
) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return false;
  }

  try {
    socket.send(
      JSON.stringify(
        payload
      )
    );

    return true;

  } catch (error) {
    console.log(
      "Socket send error:",
      error.message
    );

    return false;
  }
}


function sendToUser(
  userId,
  payload
) {
  const id =
    normalizeId(
      userId
    );

  const socket =
    sockets.get(id);

  return sendSocket(
    socket,
    payload
  );
}


/* =========================================================
   PRESENCE
   ========================================================= */

function buildPresence() {
  const result = {};

  for (
    const [
      id,
      socket
    ] of sockets
  ) {

    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      continue;
    }

    result[id] = {
      status:
        "active"
    };
  }

  /*
    Mark users who are currently
    chatting with somebody as busy.

    The actual chat target is stored
    on the socket.
  */

  for (
    const [
      id,
      socket
    ] of sockets
  ) {

    if (
      socket &&
      socket.readyState ===
        WebSocket.OPEN &&
      socket.chatWith
    ) {

      result[id] = {
        status:
          "busy"
      };
    }
  }

  return result;
}


function broadcastPresence() {
  const usersPresence =
    buildPresence();

  const payload = {
    type:
      "presence",

    users:
      usersPresence
  };

  for (
    const socket
    of sockets.values()
  ) {

    sendSocket(
      socket,
      payload
    );
  }
}


/* =========================================================
   HTTP SERVER
   ========================================================= */

const server =
  http.createServer(
    (req, res) => {

      /*
        Remove query string.

        Example:
        /app.js?v=2
        becomes
        /app.js
      */

      const requestUrl =
        new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );

      const pathname =
        requestUrl.pathname;


      /* -----------------------------------------------------
         HEALTH
         ----------------------------------------------------- */

      if (
        pathname ===
        "/health"
      ) {

        res.writeHead(
          200,
          {
            "Content-Type":
              "application/json",
            "Cache-Control":
              "no-store"
          }
        );

        res.end(
          JSON.stringify({
            ok:
              true,

            service:
              "FriendChat",

            users:
              sockets.size
          })
        );

        return;
      }


      /* -----------------------------------------------------
         USER LOOKUP
         ----------------------------------------------------- */

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
              "application/json",
            "Cache-Control":
              "no-store"
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


      /* -----------------------------------------------------
         PROFILE PHOTO API
         ----------------------------------------------------- */

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

        res.writeHead(
          200,
          {
            "Content-Type":
              "application/json",
            "Cache-Control":
              "no-store"
          }
        );

        res.end(
          JSON.stringify({
            found:
              !!photo,

            userId:
              id,

            photo:
              photo || null
          })
        );

        return;
      }


      /* -----------------------------------------------------
         STATIC FILES
         ----------------------------------------------------- */

      let filePath;

      if (
        pathname ===
        "/"
      ) {
        filePath =
          path.join(
            __dirname,
            "index.html"
          );

      } else {

        /*
          Only serve files from
          the FriendChat project folder.
        */

        const requested =
          decodeURIComponent(
            pathname
          );

        const cleanPath =
          path.normalize(
            requested
          )
          .replace(
            /^(\.\.[\/\\])+/, 
            ""
          );

        filePath =
          path.join(
            __dirname,
            cleanPath
          );
      }


      /*
        Prevent accidental access
        outside project directory.
      */

      const rootDir =
        path.resolve(
          __dirname
        );

      const absoluteFile =
        path.resolve(
          filePath
        );

      if (
        !absoluteFile.startsWith(
          rootDir
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
        absoluteFile,
        (
          error,
          data
        ) => {

          if (error) {

            res.writeHead(
              404,
              {
                "Content-Type":
                  "text/plain"
              }
            );

            res.end(
              "Not Found"
            );

            return;
          }


          const ext =
            path.extname(
              absoluteFile
            )
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
              "video/webm"
          };


          res.writeHead(
            200,
            {
              "Content-Type":
                contentTypes[
                  ext
                ] ||
                "application/octet-stream"
            }
          );

          res.end(
            data
          );
        }
      );
    }
  );


/* =========================================================
   PROFILE PHOTOS
   ========================================================= */

/*
  Profile photos are kept temporarily
  in server RAM.

  They are NOT written to disk.
*/

const profilePhotos =
  new Map();


/* =========================================================
   WEBSOCKET SERVER
   ========================================================= */

const wss =
  new WebSocket.Server({
    server
  });


/* =========================================================
   CONNECTION
   ========================================================= */

wss.on(
  "connection",
  socket => {

    console.log(
      "Device connected"
    );


    socket.userId =
      null;

    socket.chatWith =
      null;


    /* =====================================================
       MESSAGE
       ===================================================== */

    socket.on(
      "message",
      raw => {

        try {

          const msg =
            JSON.parse(
              raw.toString()
            );


          if (
            !msg ||
            typeof msg !==
              "object"
          ) {
            return;
          }


          /* =================================================
             REGISTER
             ================================================= */

          if (
            msg.type ===
            "register"
          ) {

            const userId =
              normalizeId(
                msg.userId
              );

            const name =
              safeString(
                msg.name,
                "Friend"
              )
              .trim()
              .slice(
                0,
                100
              );


            if (!userId) {

              sendSocket(
                socket,
                {
                  type:
                    "error",

                  reason:
                    "Invalid user ID."
                }
              );

              return;
            }


            /*
              If this user already has
              another connection, close
              the old connection.
            */

            const oldSocket =
              sockets.get(
                userId
              );

            if (
              oldSocket &&
              oldSocket !==
                socket
            ) {

              try {
                oldSocket.close();
              } catch {}
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

            sockets.set(
              userId,
              socket
            );

            socket.userId =
              userId;


            sendSocket(
              socket,
              {
                type:
                  "registered",

                userId:
                  userId,

                name:
                  user.name
              }
            );


            console.log(
              "Registered:",
              userId,
              "-",
              user.name
            );


            /*
              Send latest profile photo
              to the registering device
              if the server has one.
            */

            const ownPhoto =
              profilePhotos.get(
                userId
              );

            if (ownPhoto) {

              sendSocket(
                socket,
                {
                  type:
                    "profile_photo",

                  userId:
                    userId,

                  name:
                    ownPhoto.name,

                  mimeType:
                    ownPhoto.mimeType,

                  data:
                    ownPhoto.data,

                  time:
                    ownPhoto.time
                }
              );
            }


            broadcastPresence();

            return;
          }


          /* =================================================
             REQUIRE LOGIN / REGISTER
             ================================================= */

          if (
            !socket.userId
          ) {

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


          /* =================================================
             PRESENCE CHAT
             ================================================= */

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


          /* =================================================
             TEXT CHAT
             ================================================= */

          if (
            msg.type ===
            "chat"
          ) {

            const messageId =
              safeString(
                msg.messageId ||
                msg.id
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
              safeString(
                msg.text
              )
              .slice(
                0,
                5000
              );


            const time =
              Number(
                msg.time
              ) ||
              Date.now();


            if (
              !messageId ||
              !from ||
              !to
            ) {

              sendSocket(
                socket,
                {
                  type:
                    "delivery_error",

                  reason:
                    "Invalid message.",

                  messageId:
                    messageId
                }
              );

              return;
            }


            /*
              Security:
              sender must match the
              registered socket.
            */

            if (
              from !==
              socket.userId
            ) {

              sendSocket(
                socket,
                {
                  type:
                    "delivery_error",

                  reason:
                    "Invalid sender.",

                  messageId:
                    messageId
                }
              );

              return;
            }


            const record = {

              id:
                messageId,

              from:
                from,

              to:
                to,

              type:
                "chat",

              text:
                text,

              time:
                time,

              delivered:
                false,

              read:
                false
            };


            serverMessages.set(
              messageId,
              record
            );


            /*
              Send message to recipient.
            */

            const delivered =
              sendToUser(
                to,
                {
                  type:
                    "chat",

                  id:
                    messageId,

                  messageId:
                    messageId,

                  from:
                    from,

                  to:
                    to,

                  text:
                    text,

                  time:
                    time
                }
              );


            if (!delivered) {

              serverMessages.delete(
                messageId
              );


              sendSocket(
                socket,
                {
                  type:
                    "delivery_error",

                  reason:
                    "Friend is offline.",

                  messageId:
                    messageId
                }
              );


              console.log(
                "Message not delivered:",
                messageId
              );

              return;
            }


            /*
              IMPORTANT:

              The recipient socket successfully
              received the message.

              Tell sender to show:

              ✓✓ grey
            */

            record.delivered =
              true;


            sendToUser(
              from,
              {
                type:
                  "delivered",

                messageId:
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

            console.log(
              "DELIVERED:",
              messageId
            );


            return;
          }


          /* =================================================
             DELIVERED ACK
             ================================================= */

          if (
            msg.type ===
            "delivered"
          ) {

            const messageId =
              safeString(
                msg.messageId ||
                msg.id
              ).trim();


            const record =
              serverMessages.get(
                messageId
              );


            if (!record) {
              return;
            }


            /*
              Only recipient can confirm
              delivery.
            */

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

                messageId:
                  messageId
              }
            );


            console.log(
              "DELIVERED ACK:",
              messageId
            );


            return;
          }


          /* =================================================
             READ
             ================================================= */

          if (
            msg.type ===
            "read"
          ) {

            const messageId =
              safeString(
                msg.messageId ||
                msg.id
              ).trim();


            const record =
              serverMessages.get(
                messageId
              );


            if (!record) {
              return;
            }


            /*
              Only recipient can mark
              the message as read.
            */

            if (
              socket.userId !==
              record.to
            ) {
              return;
            }


            record.read =
              true;


            /*
              Tell sender:

              ✓✓ BLACK
            */

            sendToUser(
              record.from,
              {
                type:
                  "read",

                messageId:
                  messageId
              }
            );


            console.log(
              "READ:",
              messageId
            );


            return;
          }


          /* =================================================
             MEDIA
             ================================================= */

          if (
            msg.type ===
            "media"
          ) {

            const messageId =
              safeString(
                msg.messageId ||
                msg.id
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


            const mediaType =
              safeString(
                msg.mediaType
              );


            const mimeType =
              safeString(
                msg.mimeType
              );


            const name =
              safeString(
                msg.name
              )
              .slice(
                0,
                200
              );


            const size =
              Number(
                msg.size
              ) || 0;


            const time =
              Number(
                msg.time
              ) ||
              Date.now();


            if (
              !messageId ||
              !from ||
              !to ||
              !msg.data
            ) {

              sendSocket(
                socket,
                {
                  type:
                    "media_error",

                  reason:
                    "Invalid media."
                }
              );

              return;
            }


            if (
              from !==
              socket.userId
            ) {
              return;
            }


            /*
              Only metadata is stored.

              The base64 media data is
              forwarded but NOT stored in
              serverMessages.
            */

            const record = {

              id:
                messageId,

              from:
                from,

              to:
                to,

              type:
                "media",

              mediaType:
                mediaType,

              mimeType:
                mimeType,

              name:
                name,

              size:
                size,

              time:
                time,

              delivered:
                false,

              read:
                false
            };


            serverMessages.set(
              messageId,
              record
            );


            const delivered =
              sendToUser(
                to,
                {
                  type:
                    "media",

                  id:
                    messageId,

                  messageId:
                    messageId,

                  from:
                    from,

                  to:
                    to,

                  mediaType:
                    mediaType,

                  mimeType:
                    mimeType,

                  name:
                    name,

                  size:
                    size,

                  data:
                    msg.data,

                  time:
                    time
                }
              );


            if (!delivered) {

              serverMessages.delete(
                messageId
              );


              sendSocket(
                socket,
                {
                  type:
                    "delivery_error",

                  reason:
                    "Friend is offline.",

                  messageId:
                    messageId
                }
              );

              return;
            }


            record.delivered =
              true;


            sendToUser(
              from,
              {
                type:
                  "delivered",

                messageId:
                  messageId
              }
            );


            console.log(
              "MEDIA:",
              from,
              "->",
              to,
              messageId
            );


            return;
          }


          /* =================================================
             REACTION
             ================================================= */

          if (
            msg.type ===
            "reaction"
          ) {

            const messageId =
              safeString(
                msg.messageId
              ).trim();


            const reaction =
              safeString(
                msg.reaction
              )
              .slice(
                0,
                20
              );


            const record =
              serverMessages.get(
                messageId
              );


            if (!record) {
              return;
            }


            /*
              Only people involved in
              the message can react.
            */

            if (
              socket.userId !==
                record.from &&
              socket.userId !==
                record.to
            ) {
              return;
            }


            record.reaction =
              reaction;


            sendToUser(
              record.from,
              {
                type:
                  "reaction",

                messageId:
                  messageId,

                reaction:
                  reaction,

                from:
                  socket.userId
              }
            );


            if (
              record.to !==
              record.from
            ) {

              sendToUser(
                record.to,
                {
                  type:
                    "reaction",

                  messageId:
                    messageId,

                  reaction:
                    reaction,

                  from:
                    socket.userId
                }
              );
            }


            return;
          }


          /* =================================================
             UNSEND
             ================================================= */

          if (
            msg.type ===
            "unsend"
          ) {

            const messageId =
              safeString(
                msg.messageId
              ).trim();


            const record =
              serverMessages.get(
                messageId
              );


            if (!record) {
              return;
            }


            /*
              Only sender can unsend.
            */

            if (
              socket.userId !==
              record.from
            ) {
              return;
            }


            serverMessages.delete(
              messageId
            );


            /*
              Tell recipient to remove
              it from their chat.

              The sender already removed
              it locally.
            */

            sendToUser(
              record.to,
              {
                type:
                  "unsend",

                messageId:
                  messageId
              }
            );


            console.log(
              "UNSEND:",
              messageId
            );


            return;
          }


          /* =================================================
             DELETE
             ================================================= */

          if (
            msg.type ===
            "server_delete"
          ) {

            const messageId =
              safeString(
                msg.messageId
              ).trim();


            const record =
              serverMessages.get(
                messageId
              );


            if (!record) {
              return;
            }


            /*
              Only the people involved
              can delete this server
              metadata.
            */

            if (
              socket.userId !==
                record.from &&
              socket.userId !==
                record.to
            ) {
              return;
            }


            serverMessages.delete(
              messageId
            );


            sendToUser(
              record.from,
              {
                type:
                  "server_delete",

                messageId:
                  messageId
              }
            );


            if (
              record.to !==
              record.from
            ) {

              sendToUser(
                record.to,
                {
                  type:
                    "server_delete",

                  messageId:
                    messageId
                }
              );
            }


            console.log(
              "SERVER DELETE:",
              messageId
            );


            return;
          }


          /* =================================================
             PROFILE PHOTO
             ================================================= */

          if (
            msg.type ===
            "profile_photo"
          ) {

            const userId =
              normalizeId(
                msg.userId ||
                socket.userId
              );


            if (
              userId !==
              socket.userId
            ) {
              return;
            }


            if (
              !msg.data
            ) {
              return;
            }


            const photoData = {

              data:
                safeString(
                  msg.data
                ),

              mimeType:
                safeString(
                  msg.mimeType,
                  "image/jpeg"
                ),

              name:
                safeString(
                  msg.name,
                  users.get(
                    userId
                  )?.name ||
                    "Friend"
                )
                .trim()
                .slice(
                  0,
                  100
                ),

              time:
                Number(
                  msg.time
                ) ||
                Date.now()
            };


            /*
              Keep profile photo temporarily
              in server RAM.
            */

            profilePhotos.set(
              userId,
              photoData
            );


            /*
              Update user's name too.
            */

            const user =
              users.get(
                userId
              );

            if (user) {
              user.name =
                photoData.name;

              users.set(
                userId,
                user
              );
            }


            /*
              Broadcast profile photo.

              The client decides whether
              the sender is a friend before
              displaying/saving it.
            */

            for (
              const [
                id,
                otherSocket
              ] of sockets
            ) {

              if (
                id ===
                userId
              ) {
                continue;
              }

              sendSocket(
                otherSocket,
                {
                  type:
                    "profile_photo",

                  userId:
                    userId,

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
              "PROFILE PHOTO:",
              userId
            );


            return;
          }


          /* =================================================
             UNKNOWN MESSAGE
             ================================================= */

          console.log(
            "Unknown message type:",
            msg.type
          );

        } catch (error) {

          console.error(
            "WebSocket message error:",
            error
          );


          sendSocket(
            socket,
            {
              type:
                "error",

              reason:
                "Invalid server message."
            }
          );
        }
      }
    );


    /* =====================================================
       CLOSE
       ===================================================== */

    socket.on(
      "close",
      () => {

        const userId =
          socket.userId;


        if (
          userId &&
          sockets.get(
            userId
          ) === socket
        ) {

          sockets.delete(
            userId
          );


          console.log(
            "Disconnected:",
            userId
          );


          broadcastPresence();
        }
      }
    );


    /* =====================================================
       ERROR
       ===================================================== */

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


/* =========================================================
   CLEAN OLD MESSAGE METADATA
   ========================================================= */

/*
  Server memory should not grow forever.

  Messages older than 24 hours are removed
  from server RAM.

  This does NOT delete the user's local
  chat history.
*/

setInterval(
  () => {

    const now =
      Date.now();

    const maxAge =
      24 *
      60 *
      60 *
      1000;


    for (
      const [
        id,
        message
      ] of serverMessages
    ) {

      if (
        now -
          Number(
            message.time
          ) >
        maxAge
      ) {

        serverMessages.delete(
          id
        );
      }
    }

  },
  60 *
    60 *
    1000
);


/* =========================================================
   SERVER START
   ========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "================================="
    );

    console.log(
      "       FRIENDCHAT SERVER"
    );

    console.log(
      "================================="
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
      "================================="
    );
  }
);
