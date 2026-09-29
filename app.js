/* =========================================================
   FRIENDCHAT - COMPLETE APP.JS
   ========================================================= */

/* =========================================================
   SERVER CONNECTION
   ========================================================= */

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;

let socket = null;


/* =========================================================
   APP STATE
   ========================================================= */

let currentUser = null;
let friends = [];
let currentChatUserId = null;
let selectedMessageId = null;

let chats = {};


/* =========================================================
   LOCAL STORAGE
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
        localStorage.getItem("friendchat_friends")
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
        localStorage.getItem("friendchat_chats")
      ) || {};
  } catch {
    chats = {};
  }
}


function saveChats() {
  localStorage.setItem(
    "friendchat_chats",
    JSON.stringify(chats)
  );
}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function showBottomNav() {
  const nav =
    document.getElementById("bottomNav");

  if (nav) {
    nav.classList.remove("hidden");
  }
}


function hideBottomNav() {
  const nav =
    document.getElementById("bottomNav");

  if (nav) {
    nav.classList.add("hidden");
  }
}


/* =========================================================
   SCREEN HELPERS
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
  hideBottomNav();

  const screen =
    document.getElementById("loginScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }
}


function showSignup() {
  hideAllScreens();
  hideBottomNav();

  const screen =
    document.getElementById("signupScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }
}


function showHome() {
  hideAllScreens();
  showBottomNav();

  const screen =
    document.getElementById("homeScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }

  currentChatUserId = null;

  sendPresence(null);

  updateHome();
}


function showAdd() {
  hideAllScreens();
  hideBottomNav();

  const screen =
    document.getElementById("addScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }
}


/* =========================================================
   ACCOUNT
   ========================================================= */

function generateFriendId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];
  }

  return "FC-" + code;
}


/* =========================================================
   SIGNUP
   ========================================================= */

function signup() {
  const name =
    document
      .getElementById("signupName")
      .value
      .trim();

  const email =
    document
      .getElementById("signupEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("signupPassword")
      .value;

  const status =
    document.getElementById(
      "signupStatus"
    );

  if (!name) {
    status.textContent =
      "Enter your name.";
    return;
  }

  if (!email || !email.includes("@")) {
    status.textContent =
      "Enter a valid email.";
    return;
  }

  if (password.length < 6) {
    status.textContent =
      "Password must be at least 6 characters.";
    return;
  }

  const account = {
    id: generateFriendId(),
    name: name,
    email: email,
    password: password
  };

  saveAccount(account);

  currentUser = account;

  friends = [];
  chats = {};

  saveFriends();
  saveChats();

  updateHome();
  connectSocket();
  showHome();
}


/* =========================================================
   LOGIN
   ========================================================= */

function login() {
  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("loginPassword")
      .value;

  const status =
    document.getElementById(
      "loginStatus"
    );

  const account =
    loadAccount();

  if (!account) {
    status.textContent =
      "No account found on this device.";
    return;
  }

  if (
    email !== account.email ||
    password !== account.password
  ) {
    status.textContent =
      "Incorrect email or password.";
    return;
  }

  currentUser = account;

  loadFriends();
  loadChats();

  updateHome();
  connectSocket();
  showHome();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
  sendPresence(null);

  if (socket) {
    try {
      socket.close();
    } catch {}

    socket = null;
  }

  currentUser = null;
  currentChatUserId = null;

  hideBottomNav();
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
    document.getElementById("myName");

  const id =
    document.getElementById("myId");

  const idLabel =
    document.getElementById("myIdLabel");

  const profile =
    document.getElementById(
      "profileCircle"
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

  if (profile) {
    profile.textContent =
      currentUser.name
        .charAt(0)
        .toUpperCase();
  }

  renderFriends();
}


/* =========================================================
   WEBSOCKET CONNECTION
   ========================================================= */

function connectSocket() {
  if (!currentUser) {
    return;
  }

  if (socket) {
    try {
      socket.close();
    } catch {}

    socket = null;
  }

  console.log(
    "Connecting to:",
    API
  );

  socket =
    new WebSocket(API);


  /* OPEN */

  socket.onopen = () => {
    console.log(
      "FriendChat WebSocket connected"
    );

    socket.send(
      JSON.stringify({
        type: "register",
        userId: currentUser.id,
        name: currentUser.name
      })
    );

    sendPresence(
      currentChatUserId
    );
  };


  /* MESSAGE */

  socket.onmessage = async event => {
    try {
      const msg =
        JSON.parse(event.data);

      console.log(
        "Server message:",
        msg
      );


      if (msg.type === "registered") {
        console.log(
          "Registered with server:",
          msg.userId
        );
        return;
      }


      if (msg.type === "presence") {
        updatePresence(
          msg.users || {}
        );
        return;
      }


      if (msg.type === "chat") {
        receiveMessage(msg);
        return;
      }


      if (msg.type === "media") {
        receiveMedia(msg);
        return;
      }


      if (msg.type === "delivered") {
        updateMessageStatus(
          msg.messageId,
          "delivered"
        );
        return;
      }


      if (msg.type === "read") {
        updateMessageStatus(
          msg.messageId,
          "read"
        );
        return;
      }


      if (msg.type === "reaction") {
        updateReaction(
          msg.messageId,
          msg.reaction
        );
        return;
      }


      if (msg.type === "unsend") {
        removeMessage(
          msg.messageId
        );
        return;
      }


      if (msg.type === "server_delete") {
        removeMessage(
          msg.messageId
        );
        return;
      }


      if (msg.type === "delivery_error") {
        console.log(
          "Delivery error:",
          msg.reason
        );
        return;
      }


      if (msg.type === "media_error") {
        alert(
          msg.reason ||
          "Media could not be sent."
        );
        return;
      }

    } catch (error) {
      console.error(
        "WebSocket message error:",
        error
      );
    }
  };


  socket.onerror = error => {
    console.error(
      "FriendChat WebSocket error:",
      error
    );
  };


  socket.onclose = () => {
    console.log(
      "FriendChat WebSocket disconnected"
    );
  };
}


/* =========================================================
   PRESENCE
   ========================================================= */

function getPresence(userId) {
  const saved =
    window.friendChatPresence || {};

  return (
    saved[
      String(userId).toUpperCase()
    ] || {
      status: "offline"
    }
  );
}


function presenceLabel(status) {
  if (status === "active") {
    return "Active";
  }

  if (status === "busy") {
    return "Busy";
  }

  return "Offline";
}


function updatePresence(users) {
  window.friendChatPresence =
    users || {};

  renderFriends();

  if (currentChatUserId) {
    const user =
      getPresence(
        currentChatUserId
      );

    const chatStatus =
      document.getElementById(
        "chatStatus"
      );

    if (chatStatus) {
      chatStatus.textContent =
        presenceLabel(
          user.status
        );
    }
  }
}


function sendPresence(chatWith) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "presence_chat",

      chatWith:
        chatWith
          ? String(
              chatWith
            ).toUpperCase()
          : null
    })
  );
}


/* =========================================================
   UNREAD MESSAGE COUNT
   ========================================================= */

function getUnreadCount(friendId) {
  const id =
    String(friendId).toUpperCase();

  const chat =
    chats[id] || [];

  return chat.filter(message => {
    return (
      !message.mine &&
      message.status !== "read"
    );
  }).length;
}


/* =========================================================
   FRIEND LIST
   ========================================================= */

function renderFriends() {
  const list =
    document.getElementById(
      "friendList"
    );

  if (!list) {
    return;
  }

  const search =
    (
      document.getElementById(
        "search"
      )?.value || ""
    )
      .toLowerCase()
      .trim();

  list.innerHTML = "";

  const filtered =
    friends.filter(friend => {
      return (
        friend.name
          .toLowerCase()
          .includes(search) ||
        friend.id
          .toLowerCase()
          .includes(search)
      );
    });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div
        class="muted"
        style="padding:20px;text-align:center;"
      >
        No friends yet.
      </div>
    `;

    return;
  }

  filtered.forEach(friend => {
    const presence =
      getPresence(
        friend.id
      );

    const status =
      presence.status ||
      "offline";

    const unread =
      getUnreadCount(
        friend.id
      );

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "friendItem";

    item.onclick = () => {
      openChat(friend);
    };

    item.innerHTML = `
      <div class="friendAvatar">

        ${escapeHtml(
          friend.name
            .charAt(0)
            .toUpperCase()
        )}

        <span
          class="presenceDot ${status}"
        ></span>

      </div>

      <div class="friendInfo">

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

    list.appendChild(item);
  });
}


/* =========================================================
   ADD FRIEND
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

  const id =
    input.value
      .trim()
      .toUpperCase();

  if (!id) {
    status.textContent =
      "Enter a Friend ID.";
    return;
  }

  if (
    currentUser &&
    id === currentUser.id
  ) {
    status.textContent =
      "You cannot add yourself.";
    return;
  }

  if (
    friends.some(
      friend =>
        friend.id === id
    )
  ) {
    status.textContent =
      "This friend is already added.";
    return;
  }

  try {
    const protocol =
      location.protocol === "https:"
        ? "https:"
        : "http:";

    const response =
      await fetch(
        `${protocol}//${location.host}/api/user/${encodeURIComponent(id)}`
      );

    const data =
      await response.json();

    if (!data.found) {
      status.textContent =
        "Friend not found. Ask them to open FriendChat first.";
      return;
    }

    friends.push({
      id: data.user.id,
      name: data.user.name
    });

    saveFriends();

    renderFriends();

    status.textContent =
      "Friend added successfully!";

    input.value = "";

  } catch (error) {
    console.error(
      "Add friend error:",
      error
    );

    status.textContent =
      "Could not connect to server.";
  }
}


/* =========================================================
   OPEN CHAT
   ========================================================= */

function openChat(friend) {
  currentChatUserId =
    String(
      friend.id
    ).toUpperCase();

  hideAllScreens();

  hideBottomNav();

  document
    .getElementById("chatScreen")
    .classList.remove("hidden");

  const chatName =
    document.getElementById(
      "chatName"
    );

  const chatId =
    document.getElementById(
      "chatId"
    );

  chatName.textContent =
    friend.name;

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

  if (!chats[currentChatUserId]) {
    chats[currentChatUserId] = [];
  }

  chats[currentChatUserId]
    .forEach(message => {
      if (
        !message.mine &&
        message.status !== "read"
      ) {
        message.status =
          "read";

        sendRead(
          message.id
        );
      }
    });

  saveChats();

  renderMessages();

  sendPresence(
    currentChatUserId
  );

  renderFriends();
}


/* =========================================================
   MESSAGE ID
   ========================================================= */

function generateMessageId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


/* =========================================================
   SEND TEXT MESSAGE
   ========================================================= */

function sendMessage() {
  if (!currentUser) {
    return;
  }

  if (!currentChatUserId) {
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
    return;
  }

  const input =
    document.getElementById(
      "messageInput"
    );

  const text =
    input.value.trim();

  if (!text) {
    return;
  }

  const message = {
    id: generateMessageId(),

    from: currentUser.id,

    to: currentChatUserId,

    text: text,

    time: Date.now(),

    status: "sent",

    mine: true
  };

  if (!chats[currentChatUserId]) {
    chats[currentChatUserId] = [];
  }

  chats[currentChatUserId].push(
    message
  );

  saveChats();

  renderMessages();

  socket.send(
    JSON.stringify({
      type: "chat",

      id: message.id,

      from: message.from,

      to: message.to,

      text: message.text,

      time: message.time
    })
  );

  input.value = "";
}


/* =========================================================
   RECEIVE TEXT MESSAGE
   ========================================================= */

function receiveMessage(msg) {
  const from =
    String(
      msg.from
    ).toUpperCase();

  if (!chats[from]) {
    chats[from] = [];
  }

  const isOpen =
    currentChatUserId === from;

  const message = {
    id: msg.id,

    from: from,

    to: currentUser.id,

    text: msg.text,

    time: msg.time,

    status:
      isOpen
        ? "read"
        : "delivered",

    mine: false
  };

  const alreadyExists =
    chats[from].some(
      item =>
        item.id === message.id
    );

  if (!alreadyExists) {
    chats[from].push(
      message
    );
  }

  saveChats();

  if (isOpen) {
    renderMessages();

    sendDelivered(
      message.id
    );

    sendRead(
      message.id
    );

  } else {
    sendDelivered(
      message.id
    );
  }

  renderFriends();
}


/* =========================================================
   DELIVERED
   ========================================================= */

function sendDelivered(messageId) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "delivered",
      messageId: messageId
    })
  );
}


/* =========================================================
   READ
   ========================================================= */

function sendRead(messageId) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "read",
      messageId: messageId
    })
  );
}


/* =========================================================
   MESSAGE STATUS
   ========================================================= */

function updateMessageStatus(
  messageId,
  status
) {
  let changed = false;

  for (
    const chatId in chats
  ) {
    const messages =
      chats[chatId];

    const message =
      messages.find(
        item =>
          item.id === messageId
      );

    if (message) {
      message.status =
        status;

      changed = true;
    }
  }

  if (changed) {
    saveChats();
  }

  if (currentChatUserId) {
    renderMessages();
  }

  renderFriends();
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

  container.innerHTML = "";

  if (!currentChatUserId) {
    return;
  }

  const messages =
    chats[currentChatUserId] ||
    [];

  messages.forEach(message => {
    const bubble =
      document.createElement(
        "div"
      );

    bubble.className =
      "message " +
      (
        message.mine
          ? "mine"
          : "theirs"
      );

    bubble.dataset.messageId =
      message.id;

    let content = "";

    if (message.media) {
      if (
        message.mediaType ===
        "image"
      ) {
        content =
          `<img src="${message.media}" alt="Photo">`;
      } else {
        content =
          `<video controls src="${message.media}"></video>`;
      }

    } else {
      content =
        escapeHtml(
          message.text || ""
        );
    }

    let status = "";

    if (message.mine) {

      if (
        message.status ===
        "read"
      ) {
        status =
          '<span class="messageStatus readTicks">✓✓</span>';

      } else if (
        message.status ===
        "delivered"
      ) {
        status =
          '<span class="messageStatus deliveredTicks">✓✓</span>';

      } else {
        status =
          '<span class="messageStatus sentTick">✓</span>';
      }
    }

    const time =
      new Date(
        message.time
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    bubble.innerHTML = `
      <div>
        ${content}
      </div>

      <div class="messageTime">
        ${time}
        ${status}
      </div>

      ${
        message.reaction
          ? `
            <span
              class="messageReaction"
            >
              ${escapeHtml(
                message.reaction
              )}
            </span>
          `
          : ""
      }
    `;


    /* RIGHT CLICK */

    bubble.addEventListener(
      "contextmenu",
      event => {
        event.preventDefault();

        openMessageMenu(
          message.id
        );
      }
    );


    /* LONG PRESS */

    let longPressTimer = null;

    bubble.addEventListener(
      "touchstart",
      () => {
        longPressTimer =
          setTimeout(() => {
            openMessageMenu(
              message.id
            );
          }, 550);
      },
      {
        passive: true
      }
    );

    bubble.addEventListener(
      "touchend",
      () => {
        if (longPressTimer) {
          clearTimeout(
            longPressTimer
          );

          longPressTimer = null;
        }
      }
    );

    bubble.addEventListener(
      "touchmove",
      () => {
        if (longPressTimer) {
          clearTimeout(
            longPressTimer
          );

          longPressTimer = null;
        }
      }
    );

    container.appendChild(
      bubble
    );
  });

  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   MEDIA
   ========================================================= */

async function sendMedia() {
  if (!currentUser) {
    return;
  }

  if (!currentChatUserId) {
    return;
  }

  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    alert(
      "Not connected to server."
    );
    return;
  }

  const input =
    document.getElementById(
      "mediaInput"
    );

  const file =
    input.files[0];

  if (!file) {
    return;
  }

  if (
    file.size >
    20 * 1024 * 1024
  ) {
    alert(
      "File is too large. Maximum 20 MB."
    );

    input.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {

    const mediaType =
      file.type.startsWith(
        "image/"
      )
        ? "image"
        : "video";

    const message = {
      id: generateMessageId(),

      from: currentUser.id,

      to: currentChatUserId,

      time: Date.now(),

      media:
        reader.result,

      mediaType:
        mediaType,

      fileName:
        file.name,

      status:
        "sent",

      mine:
        true
    };

    if (!chats[currentChatUserId]) {
      chats[currentChatUserId] = [];
    }

    chats[currentChatUserId].push(
      message
    );

    saveChats();

    renderMessages();

    socket.send(
      JSON.stringify({
        type: "media",

        id: message.id,

        from: message.from,

        to: message.to,

        time: message.time,

        mediaType:
          message.mediaType,

        fileName:
          message.fileName,

        data:
          message.media
      })
    );

    input.value = "";
  };

  reader.readAsDataURL(file);
}


/* =========================================================
   RECEIVE MEDIA
   ========================================================= */

function receiveMedia(msg) {
  const from =
    String(
      msg.from
    ).toUpperCase();

  if (!chats[from]) {
    chats[from] = [];
  }

  const isOpen =
    currentChatUserId === from;

  const message = {
    id: msg.id,

    from: from,

    to: currentUser.id,

    time: msg.time,

    media: msg.data,

    mediaType:
      msg.mediaType,

    fileName:
      msg.fileName,

    status:
      isOpen
        ? "read"
        : "delivered",

    mine: false
  };

  const exists =
    chats[from].some(
      item =>
        item.id ===
        message.id
    );

  if (!exists) {
    chats[from].push(
      message
    );
  }

  saveChats();

  if (isOpen) {
    renderMessages();

    sendRead(
      message.id
    );
  }

  sendDelivered(
    message.id
  );

  renderFriends();
}


/* =========================================================
   MESSAGE MENU
   ========================================================= */

function openMessageMenu(
  messageId
) {
  selectedMessageId =
    messageId;

  const hidden =
    document.getElementById(
      "selectedMessageId"
    );

  if (hidden) {
    hidden.value =
      messageId;
  }

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
   REACTIONS
   ========================================================= */

function reactToMessage(
  reaction
) {
  if (!selectedMessageId) {
    return;
  }

  const messageId =
    selectedMessageId;

  for (
    const chatId in chats
  ) {
    const message =
      chats[chatId].find(
        item =>
          item.id ===
          messageId
      );

    if (message) {
      message.reaction =
        reaction;
    }
  }

  saveChats();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "reaction",

        messageId:
          messageId,

        reaction:
          reaction
      })
    );
  }

  renderMessages();

  closeMessageMenu();
}


function updateReaction(
  messageId,
  reaction
) {
  for (
    const chatId in chats
  ) {
    const message =
      chats[chatId].find(
        item =>
          item.id ===
          messageId
      );

    if (message) {
      message.reaction =
        reaction;
    }
  }

  saveChats();

  if (currentChatUserId) {
    renderMessages();
  }
}


/* =========================================================
   UNSEND
   ========================================================= */

function unsendMessage() {
  if (!selectedMessageId) {
    return;
  }

  const id =
    selectedMessageId;

  let found = false;

  for (
    const chatId in chats
  ) {
    const messages =
      chats[chatId];

    const index =
      messages.findIndex(
        message =>
          message.id === id &&
          message.mine
      );

    if (index !== -1) {
      messages.splice(
        index,
        1
      );

      found = true;
    }
  }

  if (found) {
    saveChats();

    renderMessages();

    if (
      socket &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "unsend",

          messageId:
            id
        })
      );
    }
  }

  closeMessageMenu();
}


/* =========================================================
   DELETE
   ========================================================= */

function deleteMessage() {
  if (!selectedMessageId) {
    return;
  }

  const id =
    selectedMessageId;

  for (
    const chatId in chats
  ) {
    const messages =
      chats[chatId];

    const index =
      messages.findIndex(
        message =>
          message.id === id
      );

    if (index !== -1) {
      messages.splice(
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
        type: "server_delete",

        messageId:
          id
      })
    );
  }

  closeMessageMenu();
}


/* =========================================================
   REMOVE MESSAGE
   ========================================================= */

function removeMessage(
  messageId
) {
  for (
    const chatId in chats
  ) {
    chats[chatId] =
      chats[chatId].filter(
        message =>
          message.id !==
          messageId
      );
  }

  saveChats();

  if (currentChatUserId) {
    renderMessages();
  }

  renderFriends();
}


/* =========================================================
   EMOJI PICKER
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

        button.textContent =
          emoji;

        button.onclick = () => {
          const input =
            document.getElementById(
              "messageInput"
            );

          input.value +=
            emoji;

          input.focus();
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
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================================================
   AUTOMATIC PRESENCE REFRESH
   ========================================================= */

setInterval(() => {
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
        currentChatUserId
          ? String(
              currentChatUserId
            ).toUpperCase()
          : null
    })
  );
}, 10000);


/* =========================================================
   CLOSE MESSAGE MENU
   ========================================================= */

document.addEventListener(
  "click",
  event => {
    const menu =
      document.getElementById(
        "messageMenu"
      );

    if (
      menu &&
      event.target === menu
    ) {
      closeMessageMenu();
    }
  }
);


/* =========================================================
   PROFILE DATABASE
   ========================================================= */

const PROFILE_DB_NAME =
  "FriendChatProfileDB";

const PROFILE_DB_VERSION = 1;

const PROFILE_STORE =
  "profileMedia";


function openProfileDB() {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          PROFILE_DB_NAME,
          PROFILE_DB_VERSION
        );

      request.onupgradeneeded =
        function (e) {
          const db =
            e.target.result;

          if (
            !db.objectStoreNames.contains(
              PROFILE_STORE
            )
          ) {
            db.createObjectStore(
              PROFILE_STORE,
              {
                keyPath: "id"
              }
            );
          }
        };

      request.onsuccess = () => {
        resolve(
          request.result
        );
      };

      request.onerror = () => {
        reject(
          request.error
        );
      };
    }
  );
}


/* =========================================================
   SAVE PROFILE MEDIA
   ========================================================= */

async function saveProfileMediaLocal(
  media
) {
  const db =
    await openProfileDB();

  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readwrite"
        );

      tx.objectStore(
        PROFILE_STORE
      ).put(media);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        db.close();
        reject(
          tx.error
        );
      };
    }
  );
}


/* =========================================================
   GET PROFILE MEDIA
   ========================================================= */

async function getProfileMediaLocal(
  id
) {
  const db =
    await openProfileDB();

  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readonly"
        );

      const request =
        tx.objectStore(
          PROFILE_STORE
        ).get(id);

      request.onsuccess = () => {
        const result =
          request.result ||
          null;

        db.close();

        resolve(result);
      };

      request.onerror = () => {
        db.close();

        reject(
          request.error
        );
      };
    }
  );
}


/* =========================================================
   GET ALL PROFILE MEDIA
   ========================================================= */

async function getAllProfileMediaLocal() {
  const db =
    await openProfileDB();

  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readonly"
        );

      const request =
        tx.objectStore(
          PROFILE_STORE
        ).getAll();

      request.onsuccess = () => {
        const result =
          request.result ||
          [];

        db.close();

        resolve(result);
      };

      request.onerror = () => {
        db.close();

        reject(
          request.error
        );
      };
    }
  );
}


/* =========================================================
   PROFILE SCREEN
   ========================================================= */

function showProfile() {
  if (!currentUser) {
    return;
  }

  hideAllScreens();

  showBottomNav();

  const screen =
    document.getElementById(
      "profileScreen"
    );

  if (screen) {
    screen.classList.remove(
      "hidden"
    );
  }

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


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

async function changeProfilePhoto() {
  const input =
    document.getElementById(
      "profilePhotoInput"
    );

  if (!input) {
    return;
  }

  const file =
    input.files[0];

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

    input.value = "";

    return;
  }

  if (
    file.size >
    10 * 1024 * 1024
  ) {
    alert(
      "Profile photo must be under 10 MB."
    );

    input.value = "";

    return;
  }

  const id =
    "profile-photo-" +
    currentUser.id;

  await saveProfileMediaLocal({
    id: id,

    owner:
      currentUser.id,

    type:
      "profilePhoto",

    mimeType:
      file.type,

    file:
      file,

    time:
      Date.now()
  });

  await loadProfilePhoto();

  input.value = "";
}


/* =========================================================
   LOAD PROFILE PHOTO
   ========================================================= */

async function loadProfilePhoto() {
  if (!currentUser) {
    return;
  }

  const item =
    await getProfileMediaLocal(
      "profile-photo-" +
      currentUser.id
    );

  const large =
    document.getElementById(
      "profilePhotoLarge"
    );

  const small =
    document.getElementById(
      "profileCircle"
    );

  if (!large && !small) {
    return;
  }

  if (!item) {
    const first =
      currentUser.name
        ? currentUser.name
            .charAt(0)
            .toUpperCase()
        : "?";

    if (large) {
      large.textContent =
        first;
    }

    if (small) {
      small.textContent =
        first;
    }

    return;
  }

  const url =
    URL.createObjectURL(
      item.file
    );

  if (large) {
    large.innerHTML =
      `<img src="${url}" alt="Profile photo">`;
  }

  if (small) {
    small.innerHTML =
      `<img src="${url}" alt="Profile photo">`;
  }
}


/* =========================================================
   EDIT PROFILE NAME
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

  if (!newName) {
    return;
  }

  const name =
    newName.trim();

  if (!name) {
    return;
  }

  currentUser.name =
    name;

  saveAccount(
    currentUser
  );

  const profileName =
    document.getElementById(
      "profilePageName"
    );

  const homeName =
    document.getElementById(
      "myName"
    );

  if (profileName) {
    profileName.textContent =
      name;
  }

  if (homeName) {
    homeName.textContent =
      name;
  }

  updateHome();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type:
          "register",

        userId:
          currentUser.id,

        name:
          name
      })
    );
  }
}


/* =========================================================
   UPLOAD PROFILE MEDIA
   ========================================================= */

async function uploadProfileMedia() {
  const input =
    document.getElementById(
      "profileMediaInput"
    );

  if (!input) {
    return;
  }

  const file =
    input.files[0];

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
      "Please select a photo or video."
    );

    input.value = "";

    return;
  }

  if (
    file.size >
    50 * 1024 * 1024
  ) {
    alert(
      "Media must be under 50 MB."
    );

    input.value = "";

    return;
  }


  /* PRIVACY */

  const privacy =
    prompt(
      "Who can see this?\n\nType PUBLIC or FRIENDS",
      "FRIENDS"
    );

  if (!privacy) {
    input.value = "";
    return;
  }

  const privacyText =
    privacy
      .trim()
      .toLowerCase();

  let visibility = null;

  if (
    privacyText ===
    "public"
  ) {
    visibility =
      "public";
  }

  if (
    privacyText ===
    "friends"
  ) {
    visibility =
      "friends";
  }

  if (!visibility) {
    alert(
      "Please type PUBLIC or FRIENDS."
    );

    input.value = "";

    return;
  }


  const id =
    "profile-media-" +
    currentUser.id +
    "-" +
    Date.now();


  /* SAVE LOCALLY */

  await saveProfileMediaLocal({
    id: id,

    owner:
      currentUser.id,

    type:
      file.type.startsWith(
        "image/"
      )
        ? "image"
        : "video",

    mimeType:
      file.type,

    name:
      file.name,

    size:
      file.size,

    visibility:
      visibility,

    file:
      file,

    time:
      Date.now()
  });


  await renderProfileMedia();

  input.value = "";
}


/* =========================================================
   DISPLAY PROFILE MEDIA
   ========================================================= */

async function renderProfileMedia() {
  const grid =
    document.getElementById(
      "profileMediaGrid"
    );

  if (!grid || !currentUser) {
    return;
  }

  const all =
    await getAllProfileMediaLocal();

  const media =
    all.filter(item =>
      item.owner ===
        currentUser.id &&
      item.type !==
        "profilePhoto"
    );

  if (!media.length) {
    grid.innerHTML =
      `<p class="muted">No media uploaded yet.</p>`;

    return;
  }

  grid.innerHTML = "";

  for (
    const item of media
  ) {
    const div =
      document.createElement(
        "div"
      );

    div.className =
      "profileMediaItem";

    const url =
      URL.createObjectURL(
        item.file
      );

    if (
      item.type ===
      "image"
    ) {
      div.innerHTML = `
        <img
          src="${url}"
          alt="Profile media"
        >

        <span class="mediaPrivacy">
          ${
            item.visibility ===
            "public"
              ? "🌎 Public"
              : "👥 Friends"
          }
        </span>
      `;
    } else {
      div.innerHTML = `
        <video
          src="${url}"
          controls
          preload="metadata"
        ></video>

        <span class="mediaPrivacy">
          ${
            item.visibility ===
            "public"
              ? "🌎 Public"
              : "👥 Friends"
          }
        </span>
      `;
    }

    grid.appendChild(
      div
    );
  }
}


/* =========================================================
   START APP
   ========================================================= */

(() => {
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
