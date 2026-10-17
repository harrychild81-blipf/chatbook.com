/* =========================================================
   FRIENDCHAT APP.JS
   ========================================================= */

let currentUser = null;
let friends = [];
let chats = {};
let socket = null;
let currentChatUserId = null;
let selectedMessageId = null;
let presence = {};

/* Media files are stored in IndexedDB, not localStorage.
   localStorage remains responsible for lightweight chat metadata. */
const FC_MEDIA_DB_NAME = "friendchat-media-v1";
const FC_MEDIA_STORE_NAME = "media";
let fcMediaDBPromise = null;
const fcMediaWrites = new Map();
const fcMediaStoredKeys = new Set();
const fcIncomingMediaTransfers = new Map();
const fcOutgoingMediaTransfers = new Map();

function openFriendChatMediaDB() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("This browser does not support IndexedDB."));
  }

  if (!fcMediaDBPromise) {
    fcMediaDBPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(FC_MEDIA_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FC_MEDIA_STORE_NAME)) {
          db.createObjectStore(FC_MEDIA_STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open media storage."));
      request.onblocked = () => reject(new Error("Media storage upgrade is blocked by another FriendChat tab."));
    });
  }

  return fcMediaDBPromise;
}

function storeFriendChatMedia(key, data) {
  const mediaKey = String(key || "");
  if (!mediaKey || typeof data !== "string" || !data) {
    return Promise.reject(new Error("Invalid media data."));
  }

  if (fcMediaStoredKeys.has(mediaKey)) {
    return Promise.resolve(true);
  }

  if (fcMediaWrites.has(mediaKey)) {
    return fcMediaWrites.get(mediaKey);
  }

  const job = openFriendChatMediaDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(FC_MEDIA_STORE_NAME, "readwrite");
    tx.objectStore(FC_MEDIA_STORE_NAME).put({ key: mediaKey, data });
    tx.oncomplete = () => { fcMediaStoredKeys.add(mediaKey); resolve(true); };
    tx.onerror = () => reject(tx.error || new Error("Could not save media."));
    tx.onabort = () => reject(tx.error || new Error("Media save was cancelled."));
  })).finally(() => {
    fcMediaWrites.delete(mediaKey);
  });

  fcMediaWrites.set(mediaKey, job);
  return job;
}

function readFriendChatMedia(key) {
  const mediaKey = String(key || "");
  if (!mediaKey) return Promise.resolve(null);

  return openFriendChatMediaDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(FC_MEDIA_STORE_NAME, "readonly");
    const request = tx.objectStore(FC_MEDIA_STORE_NAME).get(mediaKey);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error || new Error("Could not load media."));
  }));
}

async function hydrateChatMedia() {
  let changed = false;

  for (const messages of Object.values(chats)) {
    for (const message of messages || []) {
      if (message && !message.media && message.mediaStoredElsewhere && message.mediaStorageKey) {
        try {
          const data = await readFriendChatMedia(message.mediaStorageKey);
          if (data) {
            message.media = data;
            changed = true;
          }
        } catch (error) {
          console.warn("Could not restore saved media:", error);
        }
      }
    }
  }

  if (changed && currentChatUserId) {
    renderMessages();
  }
}


/* =========================================================
   STORAGE
   ========================================================= */

function loadAccount() {
  try {
    return JSON.parse(
      localStorage.getItem("friendchat_account")
    );
  } catch {
    return null;
  }
}

function saveAccount(account) {
  localStorage.setItem(
    "friendchat_account",
    JSON.stringify(account)
  );
}

function loadFriends() {
  try {
    friends =
      JSON.parse(
        localStorage.getItem(
          "friendchat_friends"
        )
      ) || [];
  } catch {
    friends = [];
  }
}

function saveFriends() {
  localStorage.setItem(
    "friendchat_friends",
    JSON.stringify(friends)
  );
}

function loadChats() {
  try {
    chats =
      JSON.parse(
        localStorage.getItem(
          "friendchat_chats"
        )
      ) || {};
  } catch {
    chats = {};
  }

  // Restore images/videos asynchronously without blocking text chat startup.
  hydrateChatMedia();
}


function saveChats() {
  try {
    const chatsToSave = {};

    for (const [chatId, messages] of Object.entries(chats)) {
      chatsToSave[chatId] = (messages || []).map(message => {
        if (message && typeof message.media === "string" && message.media) {
          const mediaKey = String(message.mediaStorageKey || message.id || message.messageId || "");
          if (mediaKey) {
            message.mediaStorageKey = mediaKey;
            message.mediaStoredElsewhere = true;
            storeFriendChatMedia(mediaKey, message.media).catch(error => {
              console.error("MEDIA STORAGE ERROR:", error);
            });
          }

          return {
            ...message,
            media: "",
            mediaStoredElsewhere: true,
            mediaStorageKey: mediaKey
          };
        }

        return message;
      });
    }

    localStorage.setItem("friendchat_chats", JSON.stringify(chatsToSave));
  } catch (error) {
    console.error("SAVE CHATS ERROR:", error);
    alert("Could not save chat history. Please check browser storage.");
  }
}


/* =========================================================
   IDs
   ========================================================= */

function generateFriendId() {
  return (
    "FC-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}

function generateMessageId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
  );
}

function normalizeId(id) {
  return String(
    id || ""
  )
    .trim()
    .toUpperCase();
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   SCREENS
   ========================================================= */

function hideAllScreens() {
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.add("hidden");
    });
}

function showLogin() {
  hideAllScreens();

  const el =
    document.getElementById(
      "loginScreen"
    );

  if (el) {
    el.classList.remove("hidden");
  }

  hideBottomNav();
}

function showSignup() {
  hideAllScreens();

  const el =
    document.getElementById(
      "signupScreen"
    );

  if (el) {
    el.classList.remove("hidden");
  }

  hideBottomNav();
}

function showHome() {
  if (!currentUser) {
    showLogin();
    return;
  }

  hideAllScreens();

  const el =
    document.getElementById(
      "homeScreen"
    );

  if (el) {
    el.classList.remove("hidden");
  }

  showBottomNav();

  updateHome();
  renderFriends();
}

function showAdd() {
  hideAllScreens();

  const el =
    document.getElementById(
      "addScreen"
    );

  if (el) {
    el.classList.remove("hidden");
  }

  showBottomNav();
}

function showProfile() {
  if (!currentUser) {
    return;
  }

  hideAllScreens();

  const screen =
    document.getElementById(
      "profileScreen"
    );

  if (screen) {
    screen.classList.remove("hidden");
  }

  showBottomNav();

  const name =
    document.getElementById(
      "profilePageName"
    );

  const id =
    document.getElementById(
      "profilePageId"
    );

  if (name) {
    name.textContent =
      currentUser.name;
  }

  if (id) {
    id.textContent =
      currentUser.id;
  }

  loadProfilePhoto();
  renderProfileMedia();
}

function showBottomNav() {
  const nav =
    document.getElementById(
      "bottomNav"
    );

  if (nav) {
    nav.classList.remove(
      "hidden"
    );
  }
}

function hideBottomNav() {
  const nav =
    document.getElementById(
      "bottomNav"
    );

  if (nav) {
    nav.classList.add(
      "hidden"
    );
  }
}


/* =========================================================
   LOGIN
   ========================================================= */

function login() {
  try {
    const emailInput =
      document.getElementById(
        "loginEmail"
      );

    const passwordInput =
      document.getElementById(
        "loginPassword"
      );

    const status =
      document.getElementById(
        "loginStatus"
      );

    if (!emailInput || !passwordInput) {
      if (status) {
        status.textContent =
          "Login form error.";
      }
      return;
    }

    const email =
      emailInput.value
        .trim()
        .toLowerCase();

    const password =
      passwordInput.value;

    if (!email) {
      status.textContent =
        "Enter your email.";
      return;
    }

    if (!password) {
      status.textContent =
        "Enter your password.";
      return;
    }

    const account =
      loadAccount();

    if (!account) {
      status.textContent =
        "No account found on this device.";
      return;
    }

    if (
      email !==
      String(
        account.email
      ).toLowerCase()
    ) {
      status.textContent =
        "Incorrect email or password.";
      return;
    }

    if (
      password !==
      String(
        account.password
      )
    ) {
      status.textContent =
        "Incorrect email or password.";
      return;
    }

    currentUser =
      account;

    loadFriends();
    loadChats();

    updateHome();

    connectSocket();

    showHome();

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    const status =
      document.getElementById(
        "loginStatus"
      );

    if (status) {
      status.textContent =
        "Login error. Check Console.";
    }
  }
}


/* =========================================================
   SIGNUP
   ========================================================= */

function signup() {
  const nameInput =
    document.getElementById(
      "signupName"
    );

  const emailInput =
    document.getElementById(
      "signupEmail"
    );

  const passwordInput =
    document.getElementById(
      "signupPassword"
    );

  const status =
    document.getElementById(
      "signupStatus"
    );

  if (!nameInput ||
      !emailInput ||
      !passwordInput) {
    return;
  }

  const name =
    nameInput.value.trim();

  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;

  if (!name) {
    status.textContent =
      "Enter your name.";
    return;
  }

  if (
    !email ||
    !email.includes("@")
  ) {
    status.textContent =
      "Enter a valid email.";
    return;
  }

  if (
    password.length < 6
  ) {
    status.textContent =
      "Password must be at least 6 characters.";
    return;
  }

  const account = {
    id:
      generateFriendId(),

    name:
      name,

    email:
      email,

    password:
      password
  };

  saveAccount(
    account
  );

  currentUser =
    account;

  friends = [];
  chats = {};

  saveFriends();
  saveChats();

  connectSocket();

  showHome();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

  if (socket) {
    try {
      socket.close();
    } catch {}
  }

  socket = null;

  currentUser = null;
  currentChatUserId = null;

  showLogin();
}


/* =========================================================
   HOME
   ========================================================= */

function updateHome() {

  if (!currentUser) {
    return;
  }

  const name =
    document.getElementById(
      "myName"
    );

  const id =
    document.getElementById(
      "myId"
    );

  const idLabel =
    document.getElementById(
      "myIdLabel"
    );

  if (name) {
    name.textContent =
      currentUser.name;
  }

  if (id) {
    id.textContent =
      currentUser.id;
  }

  if (idLabel) {
    idLabel.textContent =
      currentUser.id;
  }

  loadProfilePhoto();
}


/* =========================================================
   WEBSOCKET
   ========================================================= */

function connectSocket() {

  if (!currentUser) {
    return;
  }

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    registerSocket();
    return;
  }

  const protocol =
    location.protocol ===
    "https:"
      ? "wss:"
      : "ws:";

  const port =
    location.port;

  let url;

  /*
    Local:
    ws://192.168.x.x:8080

    Render:
    wss://website.com
  */

  if (
    location.hostname ===
      "localhost" ||
    location.hostname ===
      "127.0.0.1"
  ) {

    url =
      `${protocol}//${location.hostname}:${port || "8080"}`;

  } else {

    url =
      `${protocol}//${location.host}`;
  }

  console.log(
    "Connecting:",
    url
  );

  try {

    socket =
      new WebSocket(
        url
      );

  } catch (error) {

    console.error(
      "WebSocket creation error:",
      error
    );

    return;
  }


  socket.onopen = () => {

    console.log(
      "WebSocket connected"
    );

    registerSocket();

    if (currentChatUserId) {
      sendPresence(
        currentChatUserId
      );
    }
  };


  socket.onmessage =
    event => {

      try {

        const msg =
          JSON.parse(
            event.data
          );

        console.log(
          "SERVER:",
          msg
        );
      
      /* -----------------------------------------------
         SERVER LIST
         ----------------------------------------------- */

      if (msg.type === "server_list") {
        console.log("SERVER LIST RECEIVED:", msg.servers);

        saveServerListFromServer(
          Array.isArray(msg.servers) ? msg.servers : []
        );

        return;
      }


      /* -----------------------------------------------
         SERVER ADDED
         ----------------------------------------------- */

      if (
        msg.type ===
        "server_added"
      ) {

        addServerFromServer(
          msg.server
        );

        return;
      }

        /* -----------------------------------------------
           REGISTERED
           ----------------------------------------------- */

        if (
          msg.type ===
          "registered"
        ) {
          console.log(
            "Registered:",
            msg.userId
          );
          return;
        }


        /* -----------------------------------------------
           PRESENCE
           ----------------------------------------------- */

        if (
          msg.type ===
          "presence"
        ) {

          presence =
            msg.users ||
            {};

          renderFriends();

          updateChatPresence();

          return;
        }


        /* -----------------------------------------------
           CHAT
           ----------------------------------------------- */

        if (
          msg.type ===
          "chat"
        ) {

          receiveMessage(
            msg
          );

          return;
        }


        /* -----------------------------------------------
           DELIVERED
           ----------------------------------------------- */

        if (
          msg.type ===
          "delivered"
        ) {

          updateMessageStatus(
            msg.messageId ||
            msg.id,
            "delivered"
          );

          return;
        }


        /* -----------------------------------------------
           READ
           ----------------------------------------------- */

        if (
          msg.type ===
          "read"
        ) {

          updateMessageStatus(
            msg.messageId ||
            msg.id,
            "read"
          );

          return;
        }


        /* -----------------------------------------------
           REACTION
           ----------------------------------------------- */

        if (
          msg.type ===
          "reaction"
        ) {

          updateReaction(
            msg.messageId,
            msg.reaction
          );

          return;
        }


        /* -----------------------------------------------
           UNSEND
           ----------------------------------------------- */

        if (
          msg.type ===
          "unsend"
        ) {

          removeMessageEverywhere(
            msg.messageId
          );

          return;
        }


        /* -----------------------------------------------
           DELETE
           ----------------------------------------------- */

        if (
          msg.type ===
          "server_delete"
        ) {

          removeMessageEverywhere(
            msg.messageId
          );

          return;
        }


        /* -----------------------------------------------
           CHUNKED MEDIA TRANSFER (large videos/images)
           ----------------------------------------------- */

        if (msg.type === "media_upload_ready" || msg.type === "media_chunk_ack") {
          continueFriendChatMediaUpload(msg.messageId || msg.id);
          return;
        }

        if (msg.type === "media_transfer_start") {
          const from = normalizeId(msg.from);
          const to = normalizeId(msg.to);
          const messageId = String(msg.messageId || msg.id || "");
          const mediaType = msg.mediaType === "video" ? "video" : msg.mediaType === "image" ? "image" : "";
          if (!currentUser || !from || to !== normalizeId(currentUser.id) || !messageId || !mediaType) return;
          fcIncomingMediaTransfers.set(messageId, {
            from, to, messageId, mediaType,
            mimeType: String(msg.mimeType || "").slice(0, 120),
            name: String(msg.name || "media").slice(0, 255),
            size: Number(msg.size) || 0,
            time: Number(msg.time) || Date.now(),
            chunks: [], nextIndex: 0
          });
          return;
        }

        if (msg.type === "media_transfer_chunk") {
          const messageId = String(msg.messageId || msg.id || "");
          const transfer = fcIncomingMediaTransfers.get(messageId);
          if (!transfer || typeof msg.chunk !== "string" || msg.index !== transfer.nextIndex) return;
          transfer.chunks.push(msg.chunk);
          transfer.nextIndex++;
          return;
        }

        if (msg.type === "media_transfer_end") {
          const messageId = String(msg.messageId || msg.id || "");
          const transfer = fcIncomingMediaTransfers.get(messageId);
          if (!transfer) return;
          fcIncomingMediaTransfers.delete(messageId);
          const data = transfer.chunks.join("");
          transfer.chunks = [];
          receiveMedia({
            type: "media", id: messageId, messageId,
            from: transfer.from, to: transfer.to, data,
            mediaType: transfer.mediaType, mimeType: transfer.mimeType,
            name: transfer.name, size: transfer.size, time: transfer.time
          });
          return;
        }

        /* -----------------------------------------------
           LEGACY SMALL MEDIA
           ----------------------------------------------- */

        if (msg.type === "media") {
          receiveMedia(msg);
          return;
        }


        /* -----------------------------------------------
           PROFILE PHOTO
           ----------------------------------------------- */

        if (
          msg.type ===
          "profile_photo"
        ) {

          receiveProfilePhoto(
            msg
          );

          return;
        }


        /* -----------------------------------------------
           DELIVERY ERROR
           ----------------------------------------------- */

        if (
          msg.type ===
          "delivery_error"
        ) {

          console.warn(
            "Delivery error:",
            msg.reason
          );

          updateMessageStatus(
            msg.messageId ||
            msg.id,
            "error"
          );

          return;
        }

      } catch (error) {

        console.error(
          "Message parse error:",
          error
        );
      }
    };


  socket.onclose =
    () => {

      console.log(
        "WebSocket disconnected"
      );

      socket =
        null;

      /*
        Try again after 2 seconds.
      */

      setTimeout(
        () => {

          if (
            currentUser &&
            !socket
          ) {
            connectSocket();
          }

        },
        2000
      );
    };


  socket.onerror =
    error => {

      console.error(
        "WebSocket error:",
        error
      );
    };
}


function registerSocket() {

  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN ||
    !currentUser
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type:
        "register",

      userId:
        currentUser.id,

      name:
        currentUser.name
    })
  );
}


function sendPresence(
  friendId
) {

  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({

      type:
        "presence_chat",

      chatWith:
        friendId || null
    })
  );
}


/* =========================================================
   FRIENDS
   ========================================================= */

async function addById() {

  const input =
    document.getElementById(
      "addId"
    );

  const status =
    document.getElementById(
      "addStatus"
    );

  if (!input || !status) {
    return;
  }

  const id =
    normalizeId(
      input.value
    );

  if (!id) {
    status.textContent =
      "Enter a Friend ID.";
    return;
  }

  if (
    currentUser &&
    id ===
      currentUser.id
  ) {
    status.textContent =
      "You cannot add yourself.";
    return;
  }

  if (
    friends.some(
      friend =>
        normalizeId(
          friend.id
        ) === id
    )
  ) {
    status.textContent =
      "This friend is already added.";
    return;
  }

  try {

    const response =
      await fetch(
        `/api/user/${encodeURIComponent(id)}`
      );

    const data =
      await response.json();

    if (!data.found) {
      status.textContent =
        "Friend not found. Ask them to open FriendChat first.";
      return;
    }

    friends.push({
      id:
        data.user.id,

      name:
        data.user.name
    });

    saveFriends();

    renderFriends();

    status.textContent =
      "Friend added successfully.";

    input.value = "";

  } catch (error) {

    console.error(
      "ADD FRIEND:",
      error
    );

    status.textContent =
      "Could not connect to server.";
  }
}


function renderFriends() {

  const list =
    document.getElementById(
      "friendList"
    );

  if (!list) {
    return;
  }

  list.innerHTML = "";

  const search =
    (
      document.getElementById(
        "search"
      )?.value || ""
    )
      .toLowerCase()
      .trim();

  const filtered =
    friends.filter(
      friend =>
        friend.name
          .toLowerCase()
          .includes(search) ||
        friend.id
          .toLowerCase()
          .includes(search)
    );

  if (
    filtered.length ===
    0
  ) {

    list.innerHTML = `
      <div class="muted"
        style="padding:20px;text-align:center;">
        No friends yet.
      </div>
    `;

    return;
  }


  filtered.forEach(
    friend => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "friendItem";

      item.onclick =
        () => {
          openChat(
            friend
          );
        };


      const status =
        getPresence(
          friend.id
        ).status ||
        "offline";


      const unread =
        getUnreadCount(
          friend.id
        );


      item.innerHTML = `

        <div
          class="friendAvatar"
          style="
            width:56px;
            height:56px;
            min-width:56px;
            border-radius:50%;
            overflow:hidden;
            position:relative;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#1877f2;
            color:white;
            font-weight:bold;
          "
        >
          ${escapeHtml(
            friend.name
              .charAt(0)
              .toUpperCase()
          )}

          <span
            class="presenceDot ${status}"
          ></span>
        </div>

        <div
          class="friendInfo"
          style="flex:1;"
        >

          <div class="friendName">
            ${escapeHtml(
              friend.name
            )}
          </div>

          <div class="friendId">
            ${escapeHtml(
              friend.id
            )}
          </div>

          <div
            class="presenceText ${status}"
          >
            ${presenceLabel(
              status
            )}
          </div>

        </div>

        ${
          unread > 0
            ? `
              <div class="unreadBadge">
                ${
                  unread > 9
                    ? "9+"
                    : unread
                }
              </div>
            `
            : ""
        }
      `;


      list.appendChild(
        item
      );

      loadFriendAvatar(
        friend.id,
        item
      );
    }
  );
}


function getPresence(
  friendId
) {

  const id =
    normalizeId(
      friendId
    );

  return (
    presence[id] || {
      status:
        "offline"
    }
  );
}


function presenceLabel(
  status
) {

  if (
    status ===
    "active"
  ) {
    return "Active";
  }

  if (
    status ===
    "busy"
  ) {
    return "Busy";
  }

  return "Offline";
}


function updateChatPresence() {

  if (
    !currentChatUserId
  ) {
    return;
  }

  const el =
    document.getElementById(
      "chatStatus"
    );

  if (!el) {
    return;
  }

  el.textContent =
    presenceLabel(
      getPresence(
        currentChatUserId
      ).status
    );
}


/* =========================================================
   OPEN CHAT
   ========================================================= */

function openChat(
  friend
) {

  currentChatUserId =
    normalizeId(
      friend.id
    );
console.log("OPEN CHAT DEBUG:", {
  friendName: friend.name,
  friendId: friend.id,
  selectedChatId: currentChatUserId,
  savedChatIds: Object.keys(chats)
});
  hideAllScreens();
  hideBottomNav();

  const screen =
    document.getElementById(
      "chatScreen"
    );

  if (screen) {
    screen.classList.remove(
      "hidden"
    );
  }


  const chatName =
    document.getElementById(
      "chatName"
    );

  const chatId =
    document.getElementById(
      "chatId"
    );


  if (chatName) {
    chatName.textContent =
      friend.name;
  }


  if (chatId) {
    chatId.innerHTML = `
      ${escapeHtml(
        friend.id
      )}

      <span
        id="chatStatus"
        class="muted"
        style="margin-left:8px;"
      >
        ${presenceLabel(
          getPresence(
            friend.id
          ).status
        )}
      </span>
    `;
  }


  if (
    !chats[
      currentChatUserId
    ]
  ) {
    chats[
      currentChatUserId
    ] = [];
  }


  /*
    Mark unread messages as read.
  */

  chats[
    currentChatUserId
  ].forEach(
    message => {

      if (
        !message.mine &&
        message.status !==
          "read"
      ) {

        message.status =
          "read";

        sendRead(
          message.id
        );
      }
    }
  );


  saveChats();

  renderMessages();

  sendPresence(
    currentChatUserId
  );

  renderFriends();
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

function sendMessage() {

  if (!currentUser) {
    return;
  }

  if (
    !currentChatUserId
  ) {
    return;
  }

  const input =
    document.getElementById(
      "messageInput"
    );

  if (!input) {
    return;
  }

  const text =
    input.value.trim();

  if (!text) {
    return;
  }


  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {

    alert(
      "Not connected to FriendChat server."
    );

    connectSocket();

    return;
  }


  const message = {

    id:
      generateMessageId(),

    messageId:
      null,

    from:
      currentUser.id,

    to:
      currentChatUserId,

    text:
      text,

    time:
      Date.now(),

    status:
      "sent",

    mine:
      true
  };


  message.messageId =
    message.id;


  if (
    !chats[
      currentChatUserId
    ]
  ) {

    chats[
      currentChatUserId
    ] = [];
  }


  /*
    Put it immediately in sender's
    chat.
  */

  chats[
    currentChatUserId
  ].push(
    message
  );

  saveChats();

  renderMessages();


  /*
    Send to server.
  */

  socket.send(
    JSON.stringify({

      type:
        "chat",

      id:
        message.id,

      messageId:
        message.id,

      from:
        message.from,

      to:
        message.to,

      text:
        message.text,

      time:
        message.time
    })
  );


  input.value = "";

  input.focus();
}


/* =========================================================
   RECEIVE MESSAGE
   ========================================================= */

function receiveMessage(
  msg
) {

  const from =
    normalizeId(
      msg.from
    );

  const messageId =
    String(
      msg.messageId ||
      msg.id ||
      ""
    );


  if (
    !from ||
    !messageId
  ) {

    console.error(
      "Invalid incoming message:",
      msg
    );

    return;
  }


  if (
    !chats[from]
  ) {
    chats[from] = [];
  }


  /*
    If the chat is open,
    message is immediately read.
  */

  const isOpen =
    currentChatUserId ===
    from;


  const message = {

    id:
      messageId,

    messageId:
      messageId,

    from:
      from,

    to:
      currentUser.id,

    text:
      String(
        msg.text ||
        ""
      ),

    time:
      Number(
        msg.time
      ) ||
      Date.now(),

    status:
      isOpen
        ? "read"
        : "delivered",

    mine:
      false
  };


  const exists =
    chats[from].some(
      item =>
        String(
          item.id
        ) ===
        messageId
    );


  if (!exists) {

    chats[from].push(
      message
    );
  }


  saveChats();


  /*
    Tell server it was delivered.
  */

  sendDelivered(
    messageId
  );


  /*
    If user is currently
    looking at this chat,
    mark it read.
  */

  if (isOpen) {

    sendRead(
      messageId
    );

    renderMessages();

  } else {

    renderFriends();
  }


  console.log(
    "RECEIVED MESSAGE:",
    message
  );
}


/* =========================================================
   RECEIVE MEDIA
   ========================================================= */

function receiveMedia(msg) {
  if (!currentUser) return;

  const from = normalizeId(msg.from);
  const to = normalizeId(msg.to);
  const messageId = String(msg.messageId || msg.id || "");
  const data = msg.data;
  const mediaType = msg.mediaType === "image" ? "image" : msg.mediaType === "video" ? "video" : "";

  if (!from || !messageId || to !== normalizeId(currentUser.id) || !mediaType || typeof data !== "string") {
    console.warn("Ignored invalid incoming media message.");
    return;
  }

  if (!data.startsWith("data:image/") && !data.startsWith("data:video/")) {
    console.warn("Ignored media with an invalid data URL.");
    return;
  }

  if (!chats[from]) chats[from] = [];

  const existing = chats[from].find(item => String(item.id || item.messageId) === messageId);
  if (existing) return;

  const message = {
    id: messageId,
    messageId,
    from,
    to: normalizeId(currentUser.id),
    time: Number(msg.time) || Date.now(),
    media: data,
    mediaType,
    fileName: String(msg.name || "media").slice(0, 255),
    status: "delivered",
    mine: false,
    mediaStorageKey: messageId
  };

  chats[from].push(message);
  saveChats();

  if (currentChatUserId === from) {
    renderMessages();
    sendRead(messageId);
  } else {
    renderFriends();
  }
}


/* =========================================================
   DELIVERY
   ========================================================= */

function sendDelivered(
  messageId
) {

  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({

      type:
        "delivered",

      messageId:
        String(
          messageId
        )
    })
  );
}


function sendRead(
  messageId
) {

  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({

      type:
        "read",

      messageId:
        String(
          messageId
        )
    })
  );
}


/* =========================================================
   UPDATE STATUS
   ========================================================= */

function updateMessageStatus(
  messageId,
  status
) {

  const id =
    String(
      messageId
    );


  for (
    const chatId in chats
  ) {

    const list =
      chats[chatId];

    const message =
      list.find(
        item =>
          String(
            item.id
          ) === id
      );


    if (message) {

      /*
        Never downgrade read
        back to delivered.
      */

      if (
        message.status ===
        "read"
      ) {
        return;
      }

      message.status =
        status;

      saveChats();

      if (
        currentChatUserId ===
        chatId
      ) {
        renderMessages();
      }

      renderFriends();

      console.log(
        "STATUS:",
        id,
        status
      );

      return;
    }
  }
}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages() {

  const container =
    document.getElementById(
      "messages"
    );

  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  if (
    !currentChatUserId
  ) {
    return;
  }


  const list =
    chats[
      currentChatUserId
    ] || [];


  list.forEach(
    message => {

      /*
        IMPORTANT:
        Every message has its own
        full-width row.
      */

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "fc-message-row " +
        (
          message.mine
            ? "mine"
            : "other"
        );


      const bubble =
        document.createElement(
          "div"
        );

      bubble.className =
        "fc-message-bubble";


      /*
        Content
      */

      let content = "";


      if (
        message.media
      ) {

        if (
          message.mediaType ===
          "image"
        ) {

          content = `
            <img
              src="${message.media}"
              class="fc-chat-image"
              alt="Image"
            >
          `;

        } else if (
          message.mediaType ===
          "video"
        ) {

          content = `
            <video
              src="${message.media}"
              class="fc-chat-video"
              controls
              playsinline
            ></video>
          `;

        }

      } else {

        const fallbackText = message.mediaStoredElsewhere
          ? "Media could not be restored on this device. New media will be saved automatically."
          : (message.text || "");

        content =
          `<div class="fc-message-text">
             ${escapeHtml(fallbackText)}
           </div>`;
      }


      let ticks = "";


      if (
        message.mine
      ) {

        if (
          message.status ===
          "read"
        ) {

          ticks =
            `<span class="fc-ticks read">✓✓</span>`;

        } else if (
          message.status ===
          "delivered"
        ) {

          ticks =
            `<span class="fc-ticks delivered">✓✓</span>`;

        } else if (
          message.status ===
          "error"
        ) {

          ticks =
            `<span class="fc-ticks error">!</span>`;

        } else {

          ticks =
            `<span class="fc-ticks sent">✓</span>`;
        }
      }


      const time =
        new Date(
          message.time
        ).toLocaleTimeString(
          [],
          {
            hour:
              "2-digit",

            minute:
              "2-digit"
          }
        );


      bubble.innerHTML = `

        <div class="fc-message-content">
          ${content}
        </div>

        <div class="fc-message-meta">

          <span>
            ${time}
          </span>

          ${ticks}

        </div>

        ${
          message.reaction
            ? `
              <span
                class="fc-reaction"
              >
                ${escapeHtml(
                  message.reaction
                )}
              </span>
            `
            : ""
        }

      `;


      /*
        Long press / right click.
      */

      bubble.addEventListener(
        "contextmenu",
        event => {

          event.preventDefault();

          openMessageMenu(
            message.id
          );
        }
      );


      let timer = null;


      bubble.addEventListener(
        "touchstart",
        () => {

          timer =
            setTimeout(
              () => {

                openMessageMenu(
                  message.id
                );

              },
              550
            );

        },
        {
          passive:
            true
        }
      );


      bubble.addEventListener(
        "touchend",
        () => {

          if (timer) {

            clearTimeout(
              timer
            );

            timer =
              null;
          }
        }
      );


      bubble.addEventListener(
        "touchmove",
        () => {

          if (timer) {

            clearTimeout(
              timer
            );

            timer =
              null;
          }
        }
      );


      row.appendChild(
        bubble
      );

      container.appendChild(
        row
      );
    }
  );


  /*
    Scroll to bottom.
  */

  requestAnimationFrame(
    () => {

      container.scrollTop =
        container.scrollHeight;
    }
  );
}


/* =========================================================
   UNREAD
   ========================================================= */

function getUnreadCount(
  friendId
) {

  const id =
    normalizeId(
      friendId
    );

  const list =
    chats[id] || [];


  return list.filter(
    message =>
      !message.mine &&
      message.status !==
        "read"
  ).length;
}


/* =========================================================
   REACTIONS
   ========================================================= */

function reactToMessage(
  reaction
) {

  if (
    !selectedMessageId
  ) {
    return;
  }


  updateReaction(
    selectedMessageId,
    reaction
  );


  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({

        type:
          "reaction",

        messageId:
          selectedMessageId,

        reaction:
          reaction
      })
    );
  }


  closeMessageMenu();
}


function updateReaction(
  messageId,
  reaction
) {

  const id =
    String(
      messageId
    );


  for (
    const chatId in chats
  ) {

    const message =
      chats[chatId].find(
        item =>
          String(
            item.id
          ) === id
      );


    if (message) {

      message.reaction =
        reaction;

      saveChats();

      if (
        currentChatUserId ===
        chatId
      ) {
        renderMessages();
      }

      return;
    }
  }
}


/* =========================================================
   MESSAGE MENU
   ========================================================= */

function openMessageMenu(
  messageId
) {

  selectedMessageId =
    String(
      messageId
    );


  const menu =
    document.getElementById(
      "messageMenu"
    );


  if (menu) {

    menu.classList.remove(
      "hidden"
    );
  }
}


function closeMessageMenu() {

  const menu =
    document.getElementById(
      "messageMenu"
    );


  if (menu) {

    menu.classList.add(
      "hidden"
    );
  }


  selectedMessageId =
    null;
}


/* =========================================================
   UNSEND
   ========================================================= */

function unsendMessage() {

  if (
    !selectedMessageId
  ) {
    return;
  }


  const id =
    selectedMessageId;


  for (
    const chatId in chats
  ) {

    const list =
      chats[chatId];


    const index =
      list.findIndex(
        message =>
          String(
            message.id
          ) === id &&
          message.mine
      );


    if (
      index !==
      -1
    ) {

      list.splice(
        index,
        1
      );
    }
  }


  saveChats();

  renderMessages();


  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({

        type:
          "unsend",

        messageId:
          id
      })
    );
  }


  closeMessageMenu();
}


/* =========================================================
   DELETE
   ========================================================= */

function deleteMessage() {

  if (
    !selectedMessageId
  ) {
    return;
  }


  const id =
    selectedMessageId;


  for (
    const chatId in chats
  ) {

    chats[chatId] =
      chats[chatId].filter(
        message =>
          String(
            message.id
          ) !== id
      );
  }


  saveChats();

  renderMessages();


  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({

        type:
          "server_delete",

        messageId:
          id
      })
    );
  }


  closeMessageMenu();
}


function removeMessageEverywhere(
  messageId
) {

  const id =
    String(
      messageId
    );


  for (
    const chatId in chats
  ) {

    chats[chatId] =
      chats[chatId].filter(
        message =>
          String(
            message.id
          ) !== id
      );
  }


  saveChats();


  if (
    currentChatUserId
  ) {
    renderMessages();
  }


  renderFriends();
}


/* =========================================================
   EMOJI
   ========================================================= */

const emojis = [
  "😀",
  "😂",
  "🤣",
  "😊",
  "😍",
  "🥰",
  "😘",
  "😎",
  "😭",
  "😢",
  "😡",
  "😮",
  "😱",
  "🤔",
  "🙄",
  "👍",
  "👎",
  "👏",
  "🔥",
  "❤️",
  "💀",
  "🎉",
  "🙏",
  "💯"
];


function toggleEmojiPicker() {

  const picker =
    document.getElementById(
      "emojiPicker"
    );


  if (!picker) {
    return;
  }


  if (
    picker.children.length ===
    0
  ) {

    emojis.forEach(
      emoji => {

        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.textContent =
          emoji;

        button.onclick =
          () => {

            const input =
              document.getElementById(
                "messageInput"
              );

            if (input) {

              input.value +=
                emoji;

              input.focus();
            }
          };


        picker.appendChild(
          button
        );
      }
    );
  }


  picker.classList.toggle(
    "hidden"
  );
}



/* =========================================================
   MEDIA
   ========================================================= */

function continueFriendChatMediaUpload(messageId) {
  const id = String(messageId || "");
  const transfer = fcOutgoingMediaTransfers.get(id);
  if (!transfer || !socket || socket.readyState !== WebSocket.OPEN) return;

  try {
    if (transfer.nextOffset < transfer.data.length) {
      const chunk = transfer.data.slice(transfer.nextOffset, transfer.nextOffset + transfer.chunkSize);
      const index = transfer.chunkIndex;
      socket.send(JSON.stringify({
        type: "media_transfer_chunk",
        id, messageId: id, index, chunk
      }));
      transfer.nextOffset += chunk.length;
      transfer.chunkIndex++;
      return;
    }

    socket.send(JSON.stringify({ type: "media_transfer_end", id, messageId: id }));
    transfer.data = "";
    fcOutgoingMediaTransfers.delete(id);
  } catch (error) {
    console.error("Media chunk send failed:", error);
    fcOutgoingMediaTransfers.delete(id);
    updateMessageStatus(id, "error");
    alert("Video upload was interrupted. Please try again with a stable connection.");
  }
}

function sendMedia() {
  if (!currentUser || !currentChatUserId) {
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Not connected to server.");
    return;
  }

  const input = document.getElementById("mediaInput");
  const file = input?.files?.[0];

  if (!file) {
    return;
  }

  // Maximum original file size: 150 MB. Base64 expands the WebSocket payload.
  const MAX_FILE_SIZE = 150 * 1024 * 1024;

  if (file.size > MAX_FILE_SIZE) {
    alert("Maximum file size is 150 MB per image or video.");
    input.value = "";
    return;
  }

  if (
    !file.type.startsWith("image/") &&
    !file.type.startsWith("video/")
  ) {
    alert("Please select an image or video.");
    input.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    if (!reader.result) {
      alert("Could not read this file.");
      input.value = "";
      return;
    }

    const id = generateMessageId();
    const mediaType = file.type.startsWith("image/")
      ? "image"
      : "video";

    const message = {
      id: id,
      messageId: id,
      from: currentUser.id,
      to: currentChatUserId,
      time: Date.now(),
      media: reader.result,
      mediaType: mediaType,
      fileName: file.name,
      mediaStorageKey: id,
      mediaStoredElsewhere: true,
      status: "sent",
      mine: true
    };

    if (!chats[currentChatUserId]) {
      chats[currentChatUserId] = [];
    }

    chats[currentChatUserId].push(message);

    saveChats();
    renderMessages();

    try {
      const data = String(reader.result);
      const chunkSize = 256 * 1024;
      fcOutgoingMediaTransfers.set(id, {
        id, to: currentChatUserId, data, chunkSize,
        nextOffset: 0, chunkIndex: 0, time: message.time,
        mediaType, mimeType: file.type, name: file.name, size: file.size
      });
      socket.send(JSON.stringify({
        type: "media_transfer_start",
        id, messageId: id,
        from: currentUser.id,
        to: currentChatUserId,
        mediaType, mimeType: file.type,
        name: file.name, size: file.size,
        time: message.time
      }));
    } catch (error) {
      console.error("Media send failed:", error);
      fcOutgoingMediaTransfers.delete(id);
      updateMessageStatus(id, "error");
      alert("Could not start the upload. Please try again.");
    }

    input.value = "";
  };

  reader.onerror = () => {
    alert("Could not read this file.");
    input.value = "";
  };

  reader.readAsDataURL(file);
}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

async function changeProfilePhoto() {

  const input =
    document.getElementById(
      "profilePhotoInput"
    );


  const file =
    input?.files?.[0];


  if (!file) {
    return;
  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "Please select an image."
    );

    return;
  }


  if (
    file.size >
    10 * 1024 * 1024
  ) {

    alert(
      "Maximum profile photo size is 10 MB."
    );

    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      localStorage.setItem(
        "friendchat_profile_photo",
        reader.result
      );


      loadProfilePhoto();


      if (
        socket &&
        socket.readyState ===
          WebSocket.OPEN
      ) {

        socket.send(
          JSON.stringify({

            type:
              "profile_photo",

            userId:
              currentUser.id,

            name:
              currentUser.name,

            mimeType:
              file.type,

            data:
              reader.result,

            time:
              Date.now()
          })
        );
      }


      input.value =
        "";
    };


  reader.readAsDataURL(
    file
  );
}


function loadProfilePhoto() {

  const data =
    localStorage.getItem(
      "friendchat_profile_photo"
    );


  const avatarIds = [
    "profileCircle",
    "profilePhotoLarge"
  ];


  avatarIds.forEach(
    id => {

      const el =
        document.getElementById(
          id
        );

      if (!el) {
        return;
      }


      if (data) {

        el.innerHTML = `
          <img
            src="${data}"
            style="
              width:100%;
              height:100%;
              object-fit:cover;
              border-radius:50%;
              display:block;
            "
          >
        `;

      } else {

        el.innerHTML =
          escapeHtml(
            currentUser?.name
              ?.charAt(0)
              ?.toUpperCase() ||
            "?"
          );
      }
    }
  );
}


function receiveProfilePhoto(
  msg
) {

  if (
    !msg.userId ||
    !msg.data
  ) {
    return;
  }


  const id =
    normalizeId(
      msg.userId
    );


  /*
    Only save profile photos
    for people in our friend list.
  */

  if (
    !friends.some(
      friend =>
        normalizeId(
          friend.id
        ) === id
    )
  ) {
    return;
  }


  localStorage.setItem(
    `friendchat_photo_${id}`,
    msg.data
  );


  renderFriends();
}


function loadFriendAvatar(
  friendId,
  item
) {

  const id =
    normalizeId(
      friendId
    );


  const photo =
    localStorage.getItem(
      `friendchat_photo_${id}`
    );


  if (!photo) {
    return;
  }


  const avatar =
    item.querySelector(
      ".friendAvatar"
    );


  if (!avatar) {
    return;
  }


  avatar.innerHTML = `
    <img
      src="${photo}"
      style="
        width:56px;
        height:56px;
        object-fit:cover;
        border-radius:50%;
        display:block;
      "
    >
  `;
}


/* =========================================================
   PROFILE MEDIA
   ========================================================= */

function uploadProfileMedia() {

  const input =
    document.getElementById(
      "profileMediaInput"
    );


  const file =
    input?.files?.[0];


  if (!file) {
    return;
  }


  if (
    !file.type.startsWith(
      "image/"
    ) &&
    !file.type.startsWith(
      "video/"
    )
  ) {

    alert(
      "Only image or video allowed."
    );

    return;
  }


  if (
    file.size >
    150 * 1024 * 1024
  ) {

    alert(
      "Maximum file size is 150 MB."
    );

    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      let media =
        JSON.parse(
          localStorage.getItem(
            "friendchat_profile_media"
          ) || "[]"
        );


      media.push({

        id:
          generateMessageId(),

        data:
          reader.result,

        type:
          file.type,

        name:
          file.name,

        time:
          Date.now(),

        visibility:
          "friends"
      });


      localStorage.setItem(
        "friendchat_profile_media",
        JSON.stringify(
          media
        )
      );


      renderProfileMedia();

      input.value =
        "";
    };


  reader.readAsDataURL(
    file
  );
}


function renderProfileMedia() {

  const grid =
    document.getElementById(
      "profileMediaGrid"
    );


  if (!grid) {
    return;
  }


  const media =
    JSON.parse(
      localStorage.getItem(
        "friendchat_profile_media"
      ) || "[]"
    );


  grid.innerHTML =
    "";


  media.forEach(
    item => {

      const wrapper =
        document.createElement(
          "div"
        );


      if (
        item.type.startsWith(
          "image/"
        )
      ) {

        wrapper.innerHTML = `
          <img
            src="${item.data}"
            style="
              width:100%;
              border-radius:12px;
              display:block;
            "
          >
        `;

      } else {

        wrapper.innerHTML = `
          <video
            src="${item.data}"
            controls
            style="
              width:100%;
              border-radius:12px;
              display:block;
            "
          ></video>
        `;
      }


      grid.appendChild(
        wrapper
      );
    }
  );
}


/* =========================================================
   EDIT NAME
   ========================================================= */

function editProfileName() {

  if (!currentUser) {
    return;
  }


  const newName =
    prompt(
      "Enter your new name:",
      currentUser.name
    );


  if (
    !newName ||
    !newName.trim()
  ) {
    return;
  }


  currentUser.name =
    newName.trim();


  saveAccount(
    currentUser
  );


  updateHome();

  showProfile();


  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {

    registerSocket();
  }
}


/* =========================================================
   SEARCH
   ========================================================= */

function searchFriends() {
  renderFriends();
}


/* =========================================================
   STARTUP
   ========================================================= */
/* =========================================================
   SERVER LIST SYNC
   ========================================================= */

function saveServerListFromServer(servers) {
  try {
    if (!Array.isArray(servers)) {
      return;
    }

    localStorage.setItem(
      "friendchat_servers",
      JSON.stringify(servers)
    );

    console.log(
      "SERVER LIST UPDATED:",
      servers
    );

    /*
      Tell the server navigation in index.html
      to refresh immediately.
    */
    window.dispatchEvent(
      new Event("friendchat-server-list-updated")
    );

  } catch (error) {
    console.error(
      "SERVER LIST SAVE ERROR:",
      error
    );
  }
}


function addServerFromServer(server) {
  try {
    if (!server) {
      return;
    }

    const current =
      JSON.parse(
        localStorage.getItem(
          "friendchat_servers"
        ) || "[]"
      );

    if (!Array.isArray(current)) {
      return;
    }

    const serverId = String(
      server.serverID ||
      server.id ||
      ""
    );

    if (!serverId) {
      return;
    }

    /*
      Prevent duplicate servers.
    */
    const exists =
      current.some(
        item =>
          String(
            item.serverID ||
            item.id ||
            ""
          ) === serverId
      );

    if (!exists) {
      current.push(server);
    } else {
      /*
        Update the existing server
        with the newest information.
      */
      const index =
        current.findIndex(
          item =>
            String(
              item.serverID ||
              item.id ||
              ""
            ) === serverId
        );

      if (index !== -1) {
        current[index] = server;
      }
    }

    localStorage.setItem(
      "friendchat_servers",
      JSON.stringify(current)
    );

    console.log(
      "SERVER ADDED:",
      server
    );

    /*
      Refresh server navigation.
    */
    window.dispatchEvent(
      new Event("friendchat-server-list-updated")
    );

  } catch (error) {
    console.error(
      "SERVER ADD ERROR:",
      error
    );
  }
}
(function startFriendChat() {

  currentUser =
    loadAccount();

  loadFriends();

  loadChats();


  if (currentUser) {

    updateHome();

    connectSocket();

    showHome();

  } else {

    showLogin();
  }

})();
