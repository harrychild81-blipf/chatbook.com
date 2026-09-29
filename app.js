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

  loadProfilePhoto();
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

      if (msg.type === "profile_photo") {
        receiveProfilePhoto(msg);
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

    loadFriendAvatarIntoItem(
      friend.id,
      item
    );
  });
}


/* =========================================================
   FRIEND AVATAR
   ========================================================= */

async function loadFriendAvatarIntoItem(
  friendId,
  item
) {
  try {
    const profile =
      await getFriendProfilePhoto(
        friendId
      );

    if (!profile || !item) {
      return;
    }

    const avatar =
      item.querySelector(
        ".friendAvatar"
      );

    if (!avatar) {
      return;
    }

    const url =
      URL.createObjectURL(
        profile.file
      );

    const oldDot =
      avatar.querySelector(
        ".presenceDot"
      );

    const dotHTML =
      oldDot
        ? oldDot.outerHTML
        : "";

    avatar.innerHTML = `
      <img
        src="${url}"
        alt="Profile photo"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:50%;
        "
      >
      ${dotHTML}
    `;

  } catch (error) {
    console.error(
      "Could not load friend avatar:",
      error
    );
  }
}
