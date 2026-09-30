/* =========================================================
   FRIENDCHAT - CLEAN WORKING APP.JS
   ========================================================= */

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;

let socket = null;

let currentUser = null;
let friends = [];
let chats = {};
let currentChatUserId = null;
let selectedMessageId = null;


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
   HELPERS
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

  let result = "";

  for (let i = 0; i < 6; i++) {
    result +=
      chars[
        Math.floor(Math.random() * chars.length)
      ];
  }

  return "FC-" + result;
}

function generateMessageId() {
  return (
    "msg-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
  );
}


/* =========================================================
   SCREEN NAVIGATION
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

    if (!nameInput || !emailInput || !passwordInput) {
      console.error("Signup HTML elements missing");
      return;
    }

    const name =
      nameInput.value.trim();

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    if (!name) {
      if (status) {
        status.textContent =
          "Enter your name.";
      }
      return;
    }

    if (!email || !email.includes("@")) {
      if (status) {
        status.textContent =
          "Enter a valid email.";
      }
      return;
    }

    if (password.length < 6) {
      if (status) {
        status.textContent =
          "Password must be at least 6 characters.";
      }
      return;
    }

    const account = {
      id: generateFriendId(),
      name,
      email,
      password
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

  } catch (error) {
    console.error("SIGNUP ERROR:", error);
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

    if (!emailInput || !passwordInput) {
      console.error("Login HTML elements missing");
      return;
    }

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    if (!email) {
      if (status) {
        status.textContent =
          "Enter your email.";
      }
      return;
    }

    if (!password) {
      if (status) {
        status.textContent =
          "Enter your password.";
      }
      return;
    }

    const account = loadAccount();

    if (!account) {
      if (status) {
        status.textContent =
          "No account found on this device.";
      }
      return;
    }

    if (
      email.toLowerCase() !==
      String(account.email).toLowerCase() ||
      password !==
      String(account.password)
    ) {
      if (status) {
        status.textContent =
          "Incorrect email or password.";
      }
      return;
    }

    currentUser = account;

    loadFriends();
    loadChats();

    updateHome();
    connectSocket();
    showHome();

  } catch (error) {
    console.error("LOGIN ERROR:", error);
  }
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
    document.getElementById("profileCircle");

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
    } catch {}
  }

  console.log("Connecting:", API);

  socket = new WebSocket(API);

  socket.onopen = () => {
    console.log("FriendChat connected");

    socket.send(
      JSON.stringify({
        type: "register",
        userId: currentUser.id,
        name: currentUser.name
      })
    );

    sendPresence(currentChatUserId);
  };


  socket.onmessage = async event => {
    try {
      const msg =
        JSON.parse(event.data);

      console.log("SERVER:", msg);


      /* REGISTERED */

      if (msg.type === "registered") {
        console.log(
          "Registered:",
          msg.userId
        );
        return;
      }


      /* PRESENCE */

      if (msg.type === "presence") {
        window.friendChatPresence =
          msg.users || {};

        renderFriends();

        if (currentChatUserId) {
          const status =
            getPresence(
              currentChatUserId
            ).status;

          const chatStatus =
            document.getElementById(
              "chatStatus"
            );

          if (chatStatus) {
            chatStatus.textContent =
              presenceLabel(status);
          }
        }

        return;
      }


      /* CHAT */

      if (msg.type === "chat") {
        receiveMessage(msg);
        return;
      }


      /* DELIVERED */

      if (msg.type === "delivered") {
        updateMessageStatus(
          msg.messageId,
          "delivered"
        );
        return;
      }


      /* READ */

      if (msg.type === "read") {
        updateMessageStatus(
          msg.messageId,
          "read"
        );
        return;
      }


      /* REACTION */

      if (msg.type === "reaction") {
        updateReaction(
          msg.messageId,
          msg.reaction
        );
        return;
      }


      /* UNSEND */

      if (msg.type === "unsend") {
        removeMessage(
          msg.messageId
        );
        return;
      }


      /* DELETE */

      if (msg.type === "server_delete") {
        removeMessage(
          msg.messageId
        );
        return;
      }


      /* MEDIA */

      if (msg.type === "media") {
        receiveMedia(msg);
        return;
      }


      /* MEDIA ERROR */

      if (msg.type === "media_error") {
        alert(
          msg.reason ||
          "Media could not be sent."
        );
        return;
      }


      /* PROFILE PHOTO */

      if (msg.type === "profile_photo") {
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


  socket.onerror = error => {
    console.error(
      "WebSocket error:",
      error
    );
  };


  socket.onclose = () => {
    console.log(
      "FriendChat disconnected"
    );
  };
}


/* =========================================================
   PRESENCE
   ========================================================= */

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


/* =========================================================
   FRIENDS
   ========================================================= */

function getUnreadCount(friendId) {
  const id =
    String(friendId).toUpperCase();

  const list =
    chats[id] || [];

  return list.filter(
    message =>
      !message.mine &&
      message.status !== "read"
  ).length;
}


function renderFriends() {
  const list =
    document.getElementById("friendList");

  if (!list) {
    return;
  }

  const search =
    (
      document.getElementById("search")
        ?.value || ""
    )
      .toLowerCase()
      .trim();

  list.innerHTML = "";

  const filtered =
    friends.filter(friend =>
      String(friend.name)
        .toLowerCase()
        .includes(search) ||
      String(friend.id)
        .toLowerCase()
        .includes(search)
    );

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
    const item =
      document.createElement("div");

    item.className =
      "friendItem";

    item.onclick = () =>
      openChat(friend);

    const status =
      getPresence(friend.id).status ||
      "offline";

    const unread =
      getUnreadCount(friend.id);

    item.innerHTML = `
      <div
        class="friendAvatar"
        style="
          width:56px;
          height:56px;
          min-width:56px;
          max-width:56px;
          border-radius:50%;
          overflow:hidden;
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
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
  });
}


/* =========================================================
   ADD FRIEND
   ========================================================= */

async function addById() {
  const input =
    document.getElementById("addId");

  const status =
    document.getElementById("addStatus");

  if (!input) {
    return;
  }

  const id =
    input.value
      .trim()
      .toUpperCase();

  if (!id) {
    if (status) {
      status.textContent =
        "Enter a Friend ID.";
    }
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
        String(friend.id).toUpperCase() === id
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

    console.log(
      "USER LOOKUP:",
      data
    );

    if (
      !response.ok ||
      !data.found ||
      !data.user
    ) {
      status.textContent =
        "Friend ID not found.";
      return;
    }

    /* IMPORTANT:
       SERVER RETURNS data.user.name
    */

    const friend = {
      id:
        String(data.user.id)
          .toUpperCase(),

      name:
        data.user.name ||
        "Friend"
    };

    friends.push(friend);

    saveFriends();

    renderFriends();

    status.textContent =
      `${friend.name} added successfully.`;

    input.value = "";

  } catch (error) {
    console.error(
      "ADD FRIEND ERROR:",
      error
    );

    status.textContent =
      "Could not connect to server.";
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
    String(friend.id).toUpperCase();

  hideAllScreens();
  hideBottomNav();

  const screen =
    document.getElementById(
      "chatScreen"
    );

  if (screen) {
    screen.classList.remove("hidden");
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
      ${escapeHtml(friend.id)}
      <span
        id="chatStatus"
        class="muted"
        style="margin-left:8px;"
      >
        ${presenceLabel(
          getPresence(friend.id).status
        )}
      </span>
    `;
  }

  if (!chats[currentChatUserId]) {
    chats[currentChatUserId] = [];
  }

  /* Mark incoming messages as read */

  chats[currentChatUserId].forEach(
    message => {
      if (
        !message.mine &&
        message.status !== "read"
      ) {
        message.status = "read";

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


function backFromChat() {
  currentChatUserId = null;

  sendPresence(null);

  showHome();
}


/* =========================================================
   SEND TEXT
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
    id: generateMessageId(),

    from:
      currentUser.id,

    to:
      currentChatUserId,

    text,

    time:
      Date.now(),

    mine: true,

    status: "sent",

    reaction: null,

    type: "text"
  };

  if (!chats[currentChatUserId]) {
    chats[currentChatUserId] = [];
  }

  chats[currentChatUserId].push(
    message
  );

  saveChats();

  input.value = "";

  renderMessages();

  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    console.log(
      "Socket not connected."
    );
    return;
  }

  /* IMPORTANT:
     Send BOTH id and messageId.
     This makes it compatible with old/new server code.
  */

  socket.send(
    JSON.stringify({
      type: "chat",

      id:
        message.id,

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


/* =========================================================
   RECEIVE MESSAGE
   ========================================================= */

function receiveMessage(msg) {
  if (!currentUser) {
    return;
  }

  const from =
    String(msg.from)
      .toUpperCase();

  const messageId =
    msg.messageId ||
    msg.id ||
    generateMessageId();

  if (!chats[from]) {
    chats[from] = [];
  }

  const alreadyExists =
    chats[from].some(
      message =>
        message.id === messageId
    );

  if (alreadyExists) {
    return;
  }

  const message = {
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

    reaction:
      null,

    type:
      "text"
  };

  chats[from].push(
    message
  );

  saveChats();

  /*
    Tell sender that message reached this device.
  */

  sendDelivered(
    messageId
  );

  if (
    currentChatUserId ===
    from
  ) {
    message.status =
      "read";

    saveChats();

    renderMessages();

    sendRead(
      messageId
    );
  } else {
    renderFriends();
  }
}


/* =========================================================
   DELIVERY / READ
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
      type:
        "delivered",

      messageId:
        messageId
    })
  );
}


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
      type:
        "read",

      messageId:
        messageId
    })
  );
}


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
    chats[currentChatUserId] ||
    [];

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


    /* MEDIA */

    if (
      message.type ===
      "media"
    ) {
      if (
        message.mediaType ===
        "image"
      ) {
        bubble.innerHTML = `
          <img
            src="${message.data}"
            class="chatMedia"
            alt="Image"
          >
        `;
      } else {
        bubble.innerHTML = `
          <video
            src="${message.data}"
            class="chatMedia"
            controls
            playsinline
          ></video>
        `;
      }
    } else {
      bubble.textContent =
        message.text || "";
    }


    /* TIME */

    const time =
      document.createElement(
        "div"
      );

    time.className =
      "messageTime";

    const date =
      new Date(message.time);

    time.textContent =
      date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );


    /* DOUBLE TICK */

    if (message.mine) {
      const ticks =
        document.createElement(
          "span"
        );

      ticks.className =
        "messageTicks";

      if (
        message.status ===
        "read"
      ) {
        ticks.textContent =
          "✓✓";

        ticks.style.color =
          "#000000";

        ticks.style.fontWeight =
          "bold";
      } else if (
        message.status ===
        "delivered"
      ) {
        ticks.textContent =
          "✓✓";

        ticks.style.color =
          "#555";
      } else {
        ticks.textContent =
          "✓";

        ticks.style.color =
          "#555";
      }

      ticks.style.marginLeft =
        "5px";

      time.appendChild(
        ticks
      );
    }

    bubble.appendChild(
      time
    );


    /* REACTION */

    if (message.reaction) {
      const reaction =
        document.createElement(
          "div"
        );

      reaction.className =
        "messageReaction";

      reaction.textContent =
        message.reaction;

      bubble.appendChild(
        reaction
      );
    }


    row.appendChild(
      bubble
    );


    /* RIGHT CLICK */

    row.addEventListener(
      "contextmenu",
      event => {
        event.preventDefault();

        openMessageMenu(
          message.id
        );
      }
    );


    /* LONG PRESS */

    let timer = null;

    row.addEventListener(
      "touchstart",
      () => {
        timer =
          setTimeout(() => {
            openMessageMenu(
              message.id
            );
          }, 500);
      }
    );

    row.addEventListener(
      "touchend",
      () => {
        clearTimeout(timer);
      }
    );

    row.addEventListener(
      "touchmove",
      () => {
        clearTimeout(timer);
      }
    );


    container.appendChild(
      row
    );
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
    chats[currentChatUserId] ||
    [];

  const message =
    list.find(
      item =>
        item.id ===
        selectedMessageId
    );

  if (!message) {
    closeMessageMenu();
    return;
  }

  if (!message.mine) {
    alert(
      "You can only unsend your own message."
    );

    closeMessageMenu();
    return;
  }

  const id =
    selectedMessageId;

  const index =
    list.findIndex(
      item =>
        item.id === id
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
        type:
          "unsend",

        messageId:
          id
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

  const id =
    selectedMessageId;

  const list =
    chats[currentChatUserId] ||
    [];

  const index =
    list.findIndex(
      item =>
        item.id === id
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
        type:
          "server_delete",

        messageId:
          id
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
   EMOJI PICKER
   ========================================================= */

const FRIENDCHAT_EMOJIS = [
  "😀","😃","😄","😁","😆","😅",
  "😂","🤣","😊","😇","🙂","🙃",
  "😉","😌","😍","🥰","😘","😗",
  "😋","😛","😎","🤩","🥳","😏",
  "😐","😑","😶","🙄","😬","🤔",
  "😴","😷","🤗","🤭","🤫","🤥",
  "😮","😯","😲","😳","🥺","😭",
  "😢","😡","🤬","😱","😨","😰",
  "👍","👎","👏","🙏","💪","❤️",
  "🧡","💛","💚","💙","💜","🖤",
  "🤍","🔥","✨","🎉","💯","😂"
];

function buildEmojiPicker() {
  const picker =
    document.getElementById(
      "emojiPicker"
    );

  if (!picker) {
    return;
  }

  picker.innerHTML = "";

  picker.style.display =
    "grid";

  picker.style.gridTemplateColumns =
    "repeat(8, 1fr)";

  picker.style.gap =
    "5px";

  picker.style.padding =
    "10px";

  picker.style.maxHeight =
    "220px";

  picker.style.overflowY =
    "auto";

  FRIENDCHAT_EMOJIS.forEach(
    emoji => {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.textContent =
        emoji;

      button.style.fontSize =
        "24px";

      button.style.border =
        "none";

      button.style.background =
        "transparent";

      button.style.cursor =
        "pointer";

      button.onclick = () =>
        addEmoji(emoji);

      picker.appendChild(
        button
      );
    }
  );
}

function toggleEmojiPicker() {
  const picker =
    document.getElementById(
      "emojiPicker"
    );

  if (!picker) {
    return;
  }

  buildEmojiPicker();

  picker.classList.toggle(
    "hidden"
  );
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

  reader.onload = () => {
    const message = {
      id:
        generateMessageId(),

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

    if (!chats[currentChatUserId]) {
      chats[currentChatUserId] = [];
    }

    chats[currentChatUserId].push(
      message
    );

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
            "media",

          id:
            message.id,

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
    }

    input.value = "";
  };

  reader.readAsDataURL(file);
}


function receiveMedia(msg) {
  const from =
    String(msg.from)
      .toUpperCase();

  const id =
    msg.messageId ||
    msg.id ||
    generateMessageId();

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
    id,

    from,

    to:
      currentUser.id,

    time:
      msg.time || Date.now(),

    mine:
      false,

    status:
      "delivered",

    type:
      "media",

    mediaType:
      msg.mediaType,

    mimeType:
      msg.mimeType,

    data:
      msg.data,

    reaction:
      null
  });

  saveChats();

  sendDelivered(id);

  if (
    currentChatUserId ===
    from
  ) {
    markCurrentMessageRead(id);
  } else {
    renderFriends();
  }
}

function markCurrentMessageRead(id) {
  const list =
    chats[currentChatUserId] ||
    [];

  const message =
    list.find(
      item =>
        item.id === id
    );

  if (message) {
    message.status =
      "read";
  }

  saveChats();

  renderMessages();

  sendRead(id);
}


/* =========================================================
   SEARCH
   ========================================================= */

function searchFriends() {
  renderFriends();
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
    event => {
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
   ADD SCREEN
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
}

function editProfileName() {
  if (!currentUser) {
    return;
  }

  const newName =
    prompt(
      "Enter your new name:",
      currentUser.name
    );

  if (newName === null) {
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
        type:
          "register",

        userId:
          currentUser.id,

        name:
          currentUser.name
      })
    );
  }
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
   MESSAGE MENU OUTSIDE CLICK
   ========================================================= */

document.addEventListener(
  "click",
  event => {
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
   PROFILE PHOTO PLACEHOLDER FUNCTIONS
   ========================================================= */

function changeProfilePhoto() {
  const input =
    document.getElementById(
      "profilePhotoInput"
    );

  if (!input || !input.files[0]) {
    return;
  }

  const file =
    input.files[0];

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

  const reader =
    new FileReader();

  reader.onload = () => {
    const circle =
      document.getElementById(
        "profileCircle"
      );

    const large =
      document.getElementById(
        "profilePhotoLarge"
      );

    const html = `
      <img
        src="${reader.result}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:50%;
          display:block;
        "
      >
    `;

    if (circle) {
      circle.innerHTML =
        html;
    }

    if (large) {
      large.innerHTML =
        html;
    }

    /*
      Send photo to server.
    */

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

    input.value = "";
  };

  reader.readAsDataURL(file);
}

function receiveProfilePhoto(msg) {
  if (!msg) {
    return;
  }

  /*
    Refresh friend list.
    The actual image can be retrieved
    from the server when needed.
  */

  renderFriends();
}


/* =========================================================
   PROFILE MEDIA PLACEHOLDER
   ========================================================= */

function uploadProfileMedia() {
  const input =
    document.getElementById(
      "profileMediaInput"
    );

  if (!input || !input.files[0]) {
    return;
  }

  alert(
    "Profile media upload will be added separately."
  );

  input.value = "";
}


/* =========================================================
   CALL PLACEHOLDERS
   ========================================================= */

function startVoiceCall(friendId) {
  alert(
    "Voice calling is not enabled yet."
  );
}

function startVideoCall(friendId) {
  alert(
    "Video calling is not enabled yet."
  );
}

function endCall() {}

function acceptCall() {}

function rejectCall() {}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeFriendChat() {
  currentUser =
    loadAccount();

  loadFriends();
  loadChats();

  setupMessageInput();

  if (currentUser) {
    updateHome();

    connectSocket();

    showHome();
  } else {
    showLogin();
  }
}


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
