/* =========================================================
   FRIENDCHAT - CLEAN WORKING APP.JS
   ========================================================= */

/* =========================================================
   SERVER
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
let chats = {};
let currentChatUserId = null;
let selectedMessageId = null;


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadAccount() {
  try {
    return JSON.parse(
      localStorage.getItem("friendchat_account")
    );
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
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
   UTILITY
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function generateFriendId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[
      Math.floor(Math.random() * chars.length)
    ];
  }

  return "FC-" + code;
}


/* =========================================================
   SCREEN CONTROL
   ========================================================= */

function hideAllScreens() {
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.add("hidden");
    });
}


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
  if (!currentUser) {
    showLogin();
    return;
  }

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


function closeAdd() {
  showHome();
}


/* =========================================================
   SIGNUP
   ========================================================= */

function signup() {
  try {
    const nameInput =
      document.getElementById("signupName");

    const emailInput =
      document.getElementById("signupEmail");

    const passwordInput =
      document.getElementById("signupPassword");

    const status =
      document.getElementById("signupStatus");

    if (
      !nameInput ||
      !emailInput ||
      !passwordInput
    ) {
      console.error(
        "Signup HTML elements missing."
      );

      if (status) {
        status.textContent =
          "Signup form error.";
      }

      return;
    }

    const name =
      nameInput.value.trim();

    const email =
      emailInput.value.trim();

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

    console.log(
      "Account created:",
      account.id
    );

  } catch (error) {
    console.error(
      "SIGNUP ERROR:",
      error
    );

    const status =
      document.getElementById(
        "signupStatus"
      );

    if (status) {
      status.textContent =
        "Signup error. Check Console.";
    }
  }
}


/* =========================================================
   LOGIN
   ========================================================= */

function login() {
  try {
    const emailInput =
      document.getElementById("loginEmail");

    const passwordInput =
      document.getElementById("loginPassword");

    const status =
      document.getElementById("loginStatus");

    if (
      !emailInput ||
      !passwordInput
    ) {
      console.error(
        "Login HTML elements missing."
      );

      if (status) {
        status.textContent =
          "Login form error.";
      }

      return;
    }

    const email =
      emailInput.value.trim();

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

    console.log(
      "Account found:",
      account
    );

    if (!account) {
      status.textContent =
        "No account found on this device.";
      return;
    }

    if (
      email.toLowerCase() !==
      String(account.email).toLowerCase()
    ) {
      status.textContent =
        "Incorrect email or password.";
      return;
    }

    if (
      password !==
      String(account.password)
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

    console.log(
      "LOGIN SUCCESS:",
      currentUser.id
    );

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
        "Login error. Press F12 and check Console.";
    }
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
  if (socket) {
    try {
      socket.close();
    } catch (e) {}

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

    profile.style.width = "56px";
    profile.style.height = "56px";
    profile.style.minWidth = "56px";
    profile.style.minHeight = "56px";
    profile.style.maxWidth = "56px";
    profile.style.maxHeight = "56px";
    profile.style.borderRadius = "50%";
    profile.style.overflow = "hidden";
  }

  renderFriends();
  loadProfilePhoto();
}


/* =========================================================
   WEBSOCKET
   ========================================================= */

function connectSocket() {
  if (!currentUser) {
    return;
  }

  if (socket) {
    try {
      socket.close();
    } catch (e) {}
  }

  console.log(
    "Connecting:",
    API
  );

  socket = new WebSocket(API);

  socket.onopen = function () {
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


  socket.onmessage = async function (event) {
    try {
      const msg =
        JSON.parse(event.data);

      console.log(
        "Server:",
        msg
      );

      if (msg.type === "registered") {
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

      if (
        msg.type === "profile_photo"
      ) {
        receiveProfilePhoto(msg);
        return;
      }

    } catch (error) {
      console.error(
        "WebSocket message error:",
        error
      );
    }
  };


  socket.onerror = function (error) {
    console.error(
      "WebSocket error:",
      error
    );
  };


  socket.onclose = function () {
    console.log(
      "WebSocket disconnected"
    );
  };
}


/* =========================================================
   PRESENCE
   ========================================================= */

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
          ? String(chatWith).toUpperCase()
          : null
    })
  );
}


function getPresence(userId) {
  const users =
    window.friendChatPresence || {};

  return (
    users[
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
    const status =
      getPresence(
        currentChatUserId
      ).status;

    const element =
      document.getElementById(
        "chatStatus"
      );

    if (element) {
      element.textContent =
        presenceLabel(status);
    }
  }
}


/* =========================================================
   FRIENDS
   ========================================================= */

function getUnreadCount(friendId) {
  const list =
    chats[
      String(friendId).toUpperCase()
    ] || [];

  return list.filter(
    message =>
      !message.mine &&
      message.status !== "read"
  ).length;
}


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

  if (!filtered.length) {
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
    const status =
      getPresence(friend.id)
        .status || "offline";

    const unread =
      getUnreadCount(friend.id);

    const item =
      document.createElement("div");

    item.className =
      "friendItem";

    item.onclick = function () {
      openChat(friend);
    };

    item.innerHTML = `
      <div
        class="friendAvatar"
        style="
          width:56px;
          height:56px;
          min-width:56px;
          min-height:56px;
          max-width:56px;
          max-height:56px;
          border-radius:50%;
          overflow:hidden;
          position:relative;
          display:flex;
          align-items:center;
          justify-content:center;
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

      <div class="friendInfo">

        <div class="friendName">
          ${escapeHtml(friend.name)}
        </div>

        <div class="friendId">
          ${escapeHtml(friend.id)}
        </div>

        <div class="presenceText ${status}">
          ${presenceLabel(status)}
        </div>

      </div>

      ${
        unread > 0
          ? `
            <div class="unreadBadge">
              ${unread > 9 ? "9+" : unread}
            </div>
          `
          : ""
      }
    `;

    list.appendChild(item);

    loadFriendAvatarIntoItem(
      friend.id,
      item
    );
  });
}


function searchFriends() {
  renderFriends();
}


/* =========================================================
   ADD FRIEND
   ========================================================= */

async function addById() {
  const input =
    document.getElementById("addId");

  const status =
    document.getElementById("addStatus");

  if (!input || !status) {
    return;
  }

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
      friend => friend.id === id
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

    if (
      !response.ok ||
      !data ||
      !data.found
    ) {
      status.textContent =
        "Friend ID not found.";
      return;
    }

    const friend = {
      id: String(
        data.userId || id
      ).toUpperCase(),

      name:
        data.name || "Friend"
    };

    friends.push(friend);

    saveFriends();

    input.value = "";

    status.textContent =
      `${friend.name} added successfully.`;

    renderFriends();

  } catch (error) {
    console.error(
      "Add friend error:",
      error
    );

    status.textContent =
      "Could not find friend.";
  }
}


/* =========================================================
   CHAT
   ========================================================= */

function openChat(friend) {
  if (!friend) {
    return;
  }

  currentChatUserId =
    String(
      friend.id
    ).toUpperCase();

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

  const name =
    document.getElementById(
      "chatName"
    );

  const id =
    document.getElementById(
      "chatId"
    );

  const status =
    document.getElementById(
      "chatStatus"
    );

  if (name) {
    name.textContent =
      friend.name;
  }

  if (id) {
    id.textContent =
      friend.id;
  }

  if (status) {
    status.textContent =
      presenceLabel(
        getPresence(
          friend.id
        ).status
      );
  }

  renderMessages();

  markMessagesRead(
    currentChatUserId
  );

  sendPresence(
    currentChatUserId
  );

  loadChatHeaderAvatar(
    friend.id
  );
}


function backFromChat() {
  currentChatUserId = null;
  sendPresence(null);
  showHome();
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

function sendMessage() {
  if (
    !currentUser ||
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

  const message = {
    id:
      "msg-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2),

    from:
      currentUser.id,

    to:
      currentChatUserId,

    text:
      text,

    time:
      Date.now(),

    mine:
      true,

    status:
      "sent",

    type:
      "text",

    reaction:
      null
  };

  if (
    !chats[currentChatUserId]
  ) {
    chats[currentChatUserId] = [];
  }

  chats[
    currentChatUserId
  ].push(message);

  saveChats();

  input.value = "";

  renderMessages();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "chat",

        messageId:
          message.id,

        from:
          currentUser.id,

        to:
          currentChatUserId,

        text:
          text,

        time:
          message.time
      })
    );
  }
}


/* =========================================================
   RECEIVE MESSAGE
   ========================================================= */

function receiveMessage(msg) {
  if (!currentUser) {
    return;
  }

  const from =
    String(
      msg.from
    ).toUpperCase();

  const messageId =
    msg.messageId ||
    msg.id ||
    "msg-" + Date.now();

  if (!chats[from]) {
    chats[from] = [];
  }

  const exists =
    chats[from].some(
      message =>
        message.id ===
        messageId
    );

  if (exists) {
    return;
  }

  chats[from].push({
    id:
      messageId,

    from:
      from,

    to:
      currentUser.id,

    text:
      msg.text || "",

    time:
      msg.time || Date.now(),

    mine:
      false,

    status:
      "delivered",

    type:
      "text",

    reaction:
      null
  });

  saveChats();

  if (
    currentChatUserId ===
    from
  ) {
    renderMessages();
    markMessagesRead(from);
  } else {
    renderFriends();
  }

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "delivered",

        messageId:
          messageId,

        to:
          from,

        from:
          currentUser.id
      })
    );
  }
}


/* =========================================================
   MESSAGE STATUS
   ========================================================= */

function updateMessageStatus(
  messageId,
  status
) {
  let changed = false;

  Object.keys(chats).forEach(
    chatId => {
      (chats[chatId] || [])
        .forEach(message => {
          if (
            message.id ===
            messageId
          ) {
            message.status =
              status;

            changed = true;
          }
        });
    }
  );

  if (changed) {
    saveChats();
    renderMessages();
  }
}


function markMessagesRead(
  friendId
) {
  const id =
    String(
      friendId
    ).toUpperCase();

  const list =
    chats[id] || [];

  let changed = false;

  list.forEach(message => {
    if (
      !message.mine &&
      message.status !== "read"
    ) {
      message.status =
        "read";

      changed = true;

      if (
        socket &&
        socket.readyState ===
          WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "read",

            messageId:
              message.id,

            to:
              id,

            from:
              currentUser.id
          })
        );
      }
    }
  });

  if (changed) {
    saveChats();
  }

  renderMessages();
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

  if (!currentChatUserId) {
    container.innerHTML = "";
    return;
  }

  const list =
    chats[
      currentChatUserId
    ] || [];

  container.innerHTML = "";

  list.forEach(message => {
    const row =
      document.createElement("div");

    row.className =
      message.mine
        ? "messageRow mine"
        : "messageRow";

    row.dataset.messageId =
      message.id;

    const bubble =
      document.createElement("div");

    bubble.className =
      "messageBubble";

    if (
      message.type === "media"
    ) {
      if (
        message.mediaType ===
        "image"
      ) {
        const img =
          document.createElement("img");

        img.src =
          message.data;

        img.className =
          "chatMedia";

        img.alt =
          "Image";

        bubble.appendChild(img);

      } else {
        const video =
          document.createElement("video");

        video.src =
          message.data;

        video.className =
          "chatMedia";

        video.controls =
          true;

        video.playsInline =
          true;

        bubble.appendChild(video);
      }

    } else {
      const text =
        document.createElement("div");

      text.textContent =
        message.text || "";

      bubble.appendChild(text);
    }

    const time =
      document.createElement("div");

    time.className =
      "messageTime";

    time.textContent =
      new Date(
        message.time
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    if (message.mine) {
      const ticks =
        document.createElement("span");

      ticks.className =
        "messageTicks";

      if (
        message.status ===
        "read"
      ) {
        ticks.textContent =
          "✓✓";

        ticks.style.color =
          "black";

      } else if (
        message.status ===
        "delivered"
      ) {
        ticks.textContent =
          "✓✓";

      } else {
        ticks.textContent =
          "✓";
      }

      time.appendChild(ticks);
    }

    bubble.appendChild(time);

    if (message.reaction) {
      const reaction =
        document.createElement("div");

      reaction.className =
        "messageReaction";

      reaction.textContent =
        message.reaction;

      bubble.appendChild(
        reaction
      );
    }

    row.appendChild(bubble);

    row.addEventListener(
      "contextmenu",
      function (event) {
        event.preventDefault();

        openMessageMenu(
          message.id
        );
      }
    );

    let timer = null;

    row.addEventListener(
      "touchstart",
      function () {
        timer =
          setTimeout(
            function () {
              openMessageMenu(
                message.id
              );
            },
            500
          );
      }
    );

    row.addEventListener(
      "touchend",
      function () {
        clearTimeout(timer);
      }
    );

    container.appendChild(row);
  });

  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   MESSAGE MENU
   ========================================================= */

function openMessageMenu(
  messageId
) {
  selectedMessageId =
    messageId;

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
  selectedMessageId =
    null;

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (menu) {
    menu.classList.add(
      "hidden"
    );
  }
}


/* =========================================================
   REACTIONS
   ========================================================= */

function sendReaction(
  reaction
) {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    return;
  }

  const messageId =
    selectedMessageId;

  updateReaction(
    messageId,
    reaction
  );

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

        to:
          currentChatUserId,

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
  Object.keys(chats).forEach(
    chatId => {
      (chats[chatId] || [])
        .forEach(message => {
          if (
            message.id ===
            messageId
          ) {
            message.reaction =
              reaction;
          }
        });
    }
  );

  saveChats();
  renderMessages();
}


/* =========================================================
   UNSEND
   ========================================================= */

function unsendMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    return;
  }

  const list =
    chats[
      currentChatUserId
    ] || [];

  const index =
    list.findIndex(
      message =>
        message.id ===
        selectedMessageId
    );

  if (index === -1) {
    closeMessageMenu();
    return;
  }

  if (!list[index].mine) {
    alert(
      "You can only unsend your own message."
    );

    closeMessageMenu();
    return;
  }

  const id =
    selectedMessageId;

  list.splice(
    index,
    1
  );

  saveChats();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "unsend",

        messageId:
          id,

        to:
          currentChatUserId
      })
    );
  }

  renderMessages();

  closeMessageMenu();
}


/* =========================================================
   DELETE
   ========================================================= */

function deleteMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    return;
  }

  const list =
    chats[
      currentChatUserId
    ] || [];

  const id =
    selectedMessageId;

  const index =
    list.findIndex(
      message =>
        message.id === id
    );

  if (index !== -1) {
    list.splice(
      index,
      1
    );
  }

  saveChats();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "server_delete",

        messageId:
          id,

        to:
          currentChatUserId
      })
    );
  }

  renderMessages();

  closeMessageMenu();
}


function removeMessage(
  messageId
) {
  Object.keys(chats).forEach(
    chatId => {
      chats[chatId] =
        (chats[chatId] || [])
          .filter(
            message =>
              message.id !==
              messageId
          );
    }
  );

  saveChats();
  renderMessages();
}


/* =========================================================
   MEDIA
   ========================================================= */

function sendMedia() {
  const input =
    document.getElementById(
      "mediaInput"
    );

  if (!input) {
    return;
  }

  const file =
    input.files[0];

  if (!file) {
    return;
  }

  if (!currentChatUserId) {
    input.value = "";
    return;
  }

  if (
    !file.type.startsWith("image/") &&
    !file.type.startsWith("video/")
  ) {
    alert(
      "Please select an image or video."
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

  const reader =
    new FileReader();

  reader.onload = function () {
    const message = {
      id:
        "media-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .slice(2),

      from:
        currentUser.id,

      to:
        currentChatUserId,

      time:
        Date.now(),

      mine:
        true,

      status:
        "sent",

      type:
        "media",

      mediaType:
        file.type.startsWith("image/")
          ? "image"
          : "video",

      mimeType:
        file.type,

      data:
        reader.result,

      reaction:
        null
    };

    if (
      !chats[
        currentChatUserId
      ]
    ) {
      chats[
        currentChatUserId
      ] = [];
    }

    chats[
      currentChatUserId
    ].push(message);

    saveChats();
    renderMessages();

    if (
      socket &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "media",

          messageId:
            message.id,

          from:
            currentUser.id,

          to:
            currentChatUserId,

          time:
            message.time,

          mediaType:
            message.mediaType,

          mimeType:
            message.mimeType,

          data:
            message.data
        })
      );
    } else {
      alert(
        "Server is not connected."
      );
    }

    input.value = "";
  };

  reader.readAsDataURL(file);
}


function receiveMedia(msg) {
  if (!currentUser) {
    return;
  }

  const from =
    String(
      msg.from
    ).toUpperCase();

  const id =
    msg.messageId ||
    msg.id ||
    "media-" + Date.now();

  if (!chats[from]) {
    chats[from] = [];
  }

  if (
    chats[from].some(
      message =>
        message.id === id
    )
  ) {
    return;
  }

  chats[from].push({
    id: id,

    from: from,

    to: currentUser.id,

    time:
      msg.time || Date.now(),

    mine: false,

    status: "delivered",

    type: "media",

    mediaType:
      msg.mediaType,

    mimeType:
      msg.mimeType,

    data:
      msg.data,

    reaction: null
  });

  saveChats();

  if (
    currentChatUserId ===
    from
  ) {
    renderMessages();
    markMessagesRead(from);
  } else {
    renderFriends();
  }

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "delivered",

        messageId:
          id,

        to:
          from,

        from:
          currentUser.id
      })
    );
  }
}


/* =========================================================
   EMOJI
   ========================================================= */

function toggleEmojiPicker() {
  const picker =
    document.getElementById(
      "emojiPicker"
    );

  if (picker) {
    picker.classList.toggle(
      "hidden"
    );
  }
}


function addEmoji(emoji) {
  const input =
    document.getElementById(
      "messageInput"
    );

  if (!input) {
    return;
  }

  input.value += emoji;
  input.focus();
}


/* =========================================================
   MESSAGE INPUT
   ========================================================= */

function setupMessageInput() {
  const input =
    document.getElementById(
      "messageInput"
    );

  if (!input) {
    return;
  }

  input.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    }
  );
}


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
    function (resolve, reject) {
      const request =
        indexedDB.open(
          PROFILE_DB_NAME,
          PROFILE_DB_VERSION
        );

      request.onupgradeneeded =
        function (event) {
          const db =
            event.target.result;

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

      request.onsuccess =
        function () {
          resolve(
            request.result
          );
        };

      request.onerror =
        function () {
          reject(
            request.error
          );
        };
    }
  );
}


async function saveProfileMediaLocal(
  media
) {
  const db =
    await openProfileDB();

  return new Promise(
    function (resolve, reject) {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readwrite"
        );

      tx.objectStore(
        PROFILE_STORE
      ).put(media);

      tx.oncomplete =
        function () {
          db.close();
          resolve();
        };

      tx.onerror =
        function () {
          db.close();
          reject(tx.error);
        };
    }
  );
}


async function getProfileMediaLocal(
  id
) {
  const db =
    await openProfileDB();

  return new Promise(
    function (resolve, reject) {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readonly"
        );

      const request =
        tx.objectStore(
          PROFILE_STORE
        ).get(id);

      request.onsuccess =
        function () {
          const result =
            request.result;

          db.close();

          resolve(result);
        };

      request.onerror =
        function () {
          db.close();
          reject(request.error);
        };
    }
  );
}


async function getAllProfileMediaLocal() {
  const db =
    await openProfileDB();

  return new Promise(
    function (resolve, reject) {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readonly"
        );

      const request =
        tx.objectStore(
          PROFILE_STORE
        ).getAll();

      request.onsuccess =
        function () {
          const result =
            request.result || [];

          db.close();

          resolve(result);
        };

      request.onerror =
        function () {
          db.close();
          reject(request.error);
        };
    }
  );
}


/* =========================================================
   PROFILE
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

  if (!input || !currentUser) {
    return;
  }

  const file =
    input.files[0];

  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/")
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

  await saveProfileMediaLocal({
    id:
      "profile-photo-" +
      currentUser.id,

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

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    const reader =
      new FileReader();

    reader.onload =
      function () {
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

            photo:
              reader.result,

            time:
              Date.now()
          })
        );
      };

    reader.readAsDataURL(file);
  }

  input.value = "";
}


async function loadProfilePhoto() {
  if (!currentUser) {
    return;
  }

  let item = null;

  try {
    item =
      await getProfileMediaLocal(
        "profile-photo-" +
        currentUser.id
      );
  } catch (e) {
    console.error(
      "Profile photo error:",
      e
    );
  }

  const initial =
    currentUser.name
      ? currentUser.name
          .charAt(0)
          .toUpperCase()
      : "?";

  const large =
    document.getElementById(
      "profilePhotoLarge"
    );

  const circle =
    document.getElementById(
      "profileCircle"
    );

  if (large) {
    large.style.width = "110px";
    large.style.height = "110px";
    large.style.minWidth = "110px";
    large.style.minHeight = "110px";
    large.style.maxWidth = "110px";
    large.style.maxHeight = "110px";
    large.style.borderRadius = "50%";
    large.style.overflow = "hidden";

    if (item && item.file) {
      const url =
        URL.createObjectURL(
          item.file
        );

      large.innerHTML = `
        <img
          src="${url}"
          style="
            width:110px;
            height:110px;
            object-fit:cover;
            border-radius:50%;
            display:block;
          "
        >
      `;
    } else {
      large.textContent =
        initial;
    }
  }

  if (circle) {
    circle.style.width = "56px";
    circle.style.height = "56px";
    circle.style.minWidth = "56px";
    circle.style.minHeight = "56px";
    circle.style.maxWidth = "56px";
    circle.style.maxHeight = "56px";
    circle.style.borderRadius = "50%";
    circle.style.overflow = "hidden";

    if (item && item.file) {
      const url =
        URL.createObjectURL(
          item.file
        );

      circle.innerHTML = `
        <img
          src="${url}"
          style="
            width:56px;
            height:56px;
            object-fit:cover;
            border-radius:50%;
            display:block;
          "
        >
      `;
    } else {
      circle.textContent =
        initial;
    }
  }
}


/* =========================================================
   FRIEND PROFILE PHOTO
   ========================================================= */

async function receiveProfilePhoto(msg) {
  if (!msg || !msg.userId) {
    return;
  }

  const userId =
    String(
      msg.userId
    ).toUpperCase();

  if (
    currentUser &&
    userId ===
      String(
        currentUser.id
      ).toUpperCase()
  ) {
    return;
  }

  const isFriend =
    friends.some(
      friend =>
        String(friend.id).toUpperCase() ===
        userId
    );

  if (!isFriend) {
    return;
  }

  const data =
    msg.data ||
    msg.photo;

  if (!data) {
    return;
  }

  try {
    const response =
      await fetch(data);

    const blob =
      await response.blob();

    const friend =
      friends.find(
        item =>
          String(item.id).toUpperCase() ===
          userId
      );

    await saveProfileMediaLocal({
      id:
        "friend-profile-photo-" +
        userId,

      owner:
        userId,

      type:
        "profilePhoto",

      mimeType:
        msg.mimeType ||
        blob.type ||
        "image/jpeg",

      name:
        msg.name ||
        (friend
          ? friend.name
          : "Friend"),

      file:
        blob,

      time:
        msg.time ||
        Date.now()
    });

    renderFriends();

    if (
      currentChatUserId ===
      userId
    ) {
      loadChatHeaderAvatar(
        userId
      );
    }

  } catch (error) {
    console.error(
      "Friend photo error:",
      error
    );
  }
}


async function getFriendProfilePhoto(
  friendId
) {
  if (!friendId) {
    return null;
  }

  try {
    return await getProfileMediaLocal(
      "friend-profile-photo-" +
      String(friendId).toUpperCase()
    );
  } catch (e) {
    return null;
  }
}


async function loadFriendAvatarIntoItem(
  friendId,
  item
) {
  if (!item) {
    return;
  }

  try {
    const profile =
      await getFriendProfilePhoto(
        friendId
      );

    const avatar =
      item.querySelector(
        ".friendAvatar"
      );

    if (
      !avatar ||
      !profile ||
      !profile.file
    ) {
      return;
    }

    const url =
      URL.createObjectURL(
        profile.file
      );

    avatar.innerHTML = `
      <img
        src="${url}"
        style="
          width:56px;
          height:56px;
          object-fit:cover;
          border-radius:50%;
          display:block;
        "
      >
    `;

  } catch (error) {
    console.error(
      "Friend avatar error:",
      error
    );
  }
}


async function loadChatHeaderAvatar(
  friendId
) {
  const holder =
    document.getElementById(
      "chatProfileCircle"
    );

  if (!holder) {
    return;
  }

  const friend =
    friends.find(
      item =>
        String(item.id).toUpperCase() ===
        String(friendId).toUpperCase()
    );

  holder.style.width = "44px";
  holder.style.height = "44px";
  holder.style.minWidth = "44px";
  holder.style.minHeight = "44px";
  holder.style.maxWidth = "44px";
  holder.style.maxHeight = "44px";
  holder.style.borderRadius = "50%";
  holder.style.overflow = "hidden";

  holder.textContent =
    friend
      ? friend.name
          .charAt(0)
          .toUpperCase()
      : "?";

  const profile =
    await getFriendProfilePhoto(
      friendId
    );

  if (!profile || !profile.file) {
    return;
  }

  const url =
    URL.createObjectURL(
      profile.file
    );

  holder.innerHTML = `
    <img
      src="${url}"
      style="
        width:44px;
        height:44px;
        object-fit:cover;
        border-radius:50%;
        display:block;
      "
    >
  `;
}


/* =========================================================
   EDIT PROFILE NAME
   ========================================================= */

function editProfileName() {
  if (!currentUser) {
    return;
  }

  const value =
    prompt(
      "Enter your new name:",
      currentUser.name
    );

  if (value === null) {
    return;
  }

  const name =
    value.trim();

  if (!name) {
    alert(
      "Name cannot be empty."
    );

    return;
  }

  currentUser.name =
    name;

  saveAccount(
    currentUser
  );

  updateHome();

  const pageName =
    document.getElementById(
      "profilePageName"
    );

  if (pageName) {
    pageName.textContent =
      name;
  }

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "register",

        userId:
          currentUser.id,

        name:
          currentUser.name
      })
    );
  }
}


/* =========================================================
   PROFILE MEDIA
   ========================================================= */

async function uploadProfileMedia() {
  const input =
    document.getElementById(
      "profileMediaInput"
    );

  if (!input || !currentUser) {
    return;
  }

  const file =
    input.files[0];

  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/") &&
    !file.type.startsWith("video/")
  ) {
    alert(
      "Please select an image or video."
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

  const answer =
    prompt(
      "Who can see this?\n\nType PUBLIC or FRIENDS",
      "FRIENDS"
    );

  if (!answer) {
    input.value = "";
    return;
  }

  const visibility =
    answer.trim().toLowerCase();

  if (
    visibility !== "public" &&
    visibility !== "friends"
  ) {
    alert(
      "Type PUBLIC or FRIENDS."
    );

    input.value = "";
    return;
  }

  await saveProfileMediaLocal({
    id:
      "profile-media-" +
      currentUser.id +
      "-" +
      Date.now(),

    owner:
      currentUser.id,

    type:
      file.type.startsWith("image/")
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


async function renderProfileMedia() {
  const grid =
    document.getElementById(
      "profileMediaGrid"
    );

  if (!grid || !currentUser) {
    return;
  }

  let all = [];

  try {
    all =
      await getAllProfileMediaLocal();
  } catch (e) {
    console.error(
      "Profile media error:",
      e
    );

    return;
  }

  const media =
    all.filter(
      item =>
        item.owner ===
          currentUser.id &&
        item.type !==
          "profilePhoto"
    );

  if (!media.length) {
    grid.innerHTML = `
      <p class="muted">
        No media uploaded yet.
      </p>
    `;

    return;
  }

  grid.innerHTML = "";

  media.forEach(item => {
    if (!item.file) {
      return;
    }

    const url =
      URL.createObjectURL(
        item.file
      );

    const div =
      document.createElement("div");

    div.className =
      "profileMediaItem";

    if (
      item.type === "image"
    ) {
      div.innerHTML = `
        <img
          src="${url}"
          alt="Profile media"
        >

        <span class="mediaPrivacy">
          ${
            item.visibility === "public"
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
          playsinline
        ></video>

        <span class="mediaPrivacy">
          ${
            item.visibility === "public"
              ? "🌎 Public"
              : "👥 Friends"
          }
        </span>
      `;
    }

    grid.appendChild(div);
  });
}


/* =========================================================
   STATUS INFO
   ========================================================= */

function toggleStatusInfo() {
  const box =
    document.getElementById(
      "statusInfo"
    );

  if (box) {
    box.classList.toggle(
      "hidden"
    );
  }
}


/* =========================================================
   ADD TABS
   ========================================================= */

function showAddFriendTab() {
  const friendTab =
    document.getElementById(
      "addFriendTab"
    );

  const groupTab =
    document.getElementById(
      "joinGroupTab"
    );

  if (friendTab) {
    friendTab.classList.remove(
      "hidden"
    );
  }

  if (groupTab) {
    groupTab.classList.add(
      "hidden"
    );
  }
}


function showJoinGroupTab() {
  const friendTab =
    document.getElementById(
      "addFriendTab"
    );

  const groupTab =
    document.getElementById(
      "joinGroupTab"
    );

  if (friendTab) {
    friendTab.classList.add(
      "hidden"
    );
  }

  if (groupTab) {
    groupTab.classList.remove(
      "hidden"
    );
  }
}


function joinGroup() {
  const status =
    document.getElementById(
      "addStatus"
    );

  if (status) {
    status.textContent =
      "Group feature is coming soon.";
  }
}


/* =========================================================
   PROFILE PHOTO REFRESH
   ========================================================= */

async function refreshFriendPhotos() {
  for (const friend of friends) {
    try {
      const existing =
        await getFriendProfilePhoto(
          friend.id
        );

      if (existing) {
        continue;
      }

      const protocol =
        location.protocol === "https:"
          ? "https:"
          : "http:";

      const response =
        await fetch(
          `${protocol}//${location.host}/api/profile-photo/${encodeURIComponent(friend.id)}`
        );

      if (!response.ok) {
        continue;
      }

      const result =
        await response.json();

      if (
        !result ||
        !result.found ||
        !result.photo
      ) {
        continue;
      }

      const data =
        result.photo.data ||
        result.photo.photo;

      if (!data) {
        continue;
      }

      const blob =
        await (
          await fetch(data)
        ).blob();

      await saveProfileMediaLocal({
        id:
          "friend-profile-photo-" +
          friend.id,

        owner:
          friend.id,

        type:
          "profilePhoto",

        mimeType:
          result.photo.mimeType ||
          blob.type ||
          "image/jpeg",

        name:
          result.photo.name ||
          friend.name,

        file:
          blob,

        time:
          result.photo.time ||
          Date.now()
      });

    } catch (e) {
      console.error(
        "Friend photo refresh error:",
        e
      );
    }
  }

  renderFriends();
}


/* =========================================================
   ENTER KEY
   ========================================================= */

setupMessageInput;


/* =========================================================
   CLICK OUTSIDE MESSAGE MENU
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {
    const menu =
      document.getElementById(
        "messageMenu"
      );

    if (
      !menu ||
      menu.classList.contains(
        "hidden"
      )
    ) {
      return;
    }

    if (
      !menu.contains(
        event.target
      )
    ) {
      closeMessageMenu();
    }
  }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeFriendChat() {
  console.log(
    "FriendChat starting..."
  );

  currentUser =
    loadAccount();

  loadFriends();
  loadChats();

  if (currentUser) {
    updateHome();
    connectSocket();
    showHome();

    setTimeout(
      function () {
        refreshFriendPhotos();
      },
      1000
    );
  } else {
    showLogin();
  }

  setupMessageInput();
}


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeFriendChat
  );
} else {
  initializeFriendChat();
}


/* =========================================================
   SAFE PLACEHOLDERS
   ========================================================= */

function startVoiceCall(friendId) {
  alert(
    "Voice calling will be added next."
  );
}


function startVideoCall(friendId) {
  alert(
    "Video calling will be added next."
  );
}


function endCall() {
  console.log(
    "No active call."
  );
}


function acceptCall() {
  console.log(
    "No incoming call."
  );
}


function rejectCall() {
  console.log(
    "No incoming call."
  );
}
