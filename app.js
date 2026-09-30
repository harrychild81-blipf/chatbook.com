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

  /*
     Load our local profile photo
     whenever home UI refreshes.
  */

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


      /* =====================================================
         PROFILE PHOTO RECEIVED
         ===================================================== */

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


    /*
       Friend profile photo
       will be loaded asynchronously.
    */

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

        <div class="friendStatus">
          ${presenceLabel(
            status
          )}
        </div>

      </div>

      ${
        unread > 0
          ? `
            <div class="unreadBadge">
              ${unread}
            </div>
          `
          : ""
      }
    `;

    list.appendChild(item);

    /*
       Load friend's saved profile
       photo from IndexedDB.
    */

    getFriendProfilePhoto(
      friend.id
    ).then(photo => {
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

      const url =
        URL.createObjectURL(
          photo.file
        );

      avatar.innerHTML = `
        <img
          src="${url}"
          alt="Profile"
        />

        <span
          class="presenceDot ${status}"
        ></span>
      `;
    });
  });
}  if (
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


    /*
       Friend profile photo
       will be loaded asynchronously.
    */

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
        message.status = "read";
      }
    });

  saveChats();

  renderMessages();

  sendPresence(
    currentChatUserId
  );

  markMessagesRead(
    currentChatUserId
  );
}  const from =
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

  const exists =
    chats[from].some(
      item =>
        item.id === message.id
    );

  if (!exists) {
    chats[from].push(message);
  }

  saveChats();

  if (isOpen) {
    renderMessages();

    sendRead(
      message.id
    );
  }

  renderFriends();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "delivered",

        messageId:
          message.id,

        from:
          currentUser.id,

        to: from
      })
    );
  }
}


/* =========================================================
   SEND READ STATUS
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

      messageId:

        messageId,

      from:
        currentUser.id,

      to:
        currentChatUserId
    })
  );
}


/* =========================================================
   MARK CHAT MESSAGES READ
   ========================================================= */

function markMessagesRead(friendId) {
  if (!currentUser) {
    return;
  }

  const id =
    String(
      friendId
    ).toUpperCase();

  const chat =
    chats[id] || [];

  chat.forEach(message => {
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
  });

  saveChats();

  renderFriends();
}


/* =========================================================
   UPDATE MESSAGE STATUS
   ========================================================= */

function updateMessageStatus(
  messageId,
  status
) {
  let changed = false;

  Object.keys(chats)
    .forEach(friendId => {
      const chat =
        chats[friendId] || [];

      chat.forEach(message => {
        if (
          message.id ===
          messageId
        ) {
          message.status =
            status;

          changed = true;
        }
      });
    });

  if (changed) {
    saveChats();
    renderMessages();
    renderFriends();
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

  container.innerHTML = "";

  if (!currentChatUserId) {
    return;
  }

  const chat =
    chats[currentChatUserId] ||
    [];

  chat.forEach(message => {
    renderSingleMessage(
      message,
      container
    );
  });

  requestAnimationFrame(() => {
    container.scrollTop =
      container.scrollHeight;
  });
}


/* =========================================================
   RENDER SINGLE MESSAGE
   ========================================================= */

function renderSingleMessage(
  message,
  container
) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    message.mine
      ? "message mine"
      : "message";

  wrapper.dataset.messageId =
    message.id;


  if (
    message.type ===
      "image" ||
    message.type ===
      "video"
  ) {
    renderMediaMessage(
      message,
      wrapper
    );
  } else {
    const bubble =
      document.createElement(
        "div"
      );

    bubble.className =
      "bubble";

    bubble.textContent =
      message.text || "";

    wrapper.appendChild(
      bubble
    );
  }


  /* =====================================================
     MESSAGE TIME
     ===================================================== */

  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "messageMeta";

  const time =
    new Date(
      message.time
    );

  meta.textContent =
    time.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  /* =====================================================
     DELIVERY / READ TICKS
     ===================================================== */

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
        "#000";
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

    meta.appendChild(
      ticks
    );
  }


  wrapper.appendChild(
    meta
  );


  /* =====================================================
     REACTION
     ===================================================== */

  if (
    message.reaction
  ) {
    const reaction =
      document.createElement(
        "span"
      );

    reaction.className =
      "messageReaction";

    reaction.textContent =
      message.reaction;

    wrapper.appendChild(
      reaction
    );
  }


  /* =====================================================
     LONG PRESS MENU
     ===================================================== */

  let pressTimer = null;

  wrapper.addEventListener(
    "contextmenu",
    event => {
      event.preventDefault();

      openMessageMenu(
        message.id
      );
    }
  );

  wrapper.addEventListener(
    "touchstart",
    () => {
      pressTimer =
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

  wrapper.addEventListener(
    "touchend",
    () => {
      clearTimeout(
        pressTimer
      );
    }
  );

  wrapper.addEventListener(
    "touchmove",
    () => {
      clearTimeout(
        pressTimer
      );
    }
  );


  container.appendChild(
    wrapper
  );
}


/* =========================================================
   RENDER MEDIA MESSAGE
   ========================================================= */

function renderMediaMessage(
  message,
  wrapper
) {
  const bubble =
    document.createElement(
      "div"
    );

  bubble.className =
    "bubble mediaBubble";

  if (
    message.type ===
    "image"
  ) {
    const img =
      document.createElement(
        "img"
      );

    img.src =
      message.data ||
      message.url ||
      "";

    img.alt =
      "Shared image";

    img.style.maxWidth =
      "260px";

    img.style.maxHeight =
      "320px";

    img.style.borderRadius =
      "12px";

    img.style.display =
      "block";

    bubble.appendChild(
      img
    );
  }


  if (
    message.type ===
    "video"
  ) {
    const video =
      document.createElement(
        "video"
      );

    video.src =
      message.data ||
      message.url ||
      "";

    video.controls =
      true;

    video.playsInline =
      true;

    video.style.maxWidth =
      "280px";

    video.style.maxHeight =
      "320px";

    video.style.borderRadius =
      "12px";

    bubble.appendChild(
      video
    );
  }

  wrapper.appendChild(
    bubble
  );
}


/* =========================================================
   OPEN MESSAGE MENU
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

  if (!menu) {
    return;
  }

  menu.classList.remove(
    "hidden"
  );
}


/* =========================================================
   CLOSE MESSAGE MENU
   ========================================================= */

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
   ADD REACTION
   ========================================================= */

function reactToMessage(
  reaction
) {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    return;
  }

  const chat =
    chats[currentChatUserId] ||
    [];

  const message =
    chat.find(
      item =>
        item.id ===
        selectedMessageId
    );

  if (!message) {
    closeMessageMenu();
    return;
  }

  message.reaction =
    reaction;

  saveChats();

  renderMessages();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "reaction",

        messageId:
          message.id,

        reaction:
          reaction,

        from:
          currentUser.id,

        to:
          currentChatUserId
      })
    );
  }

  closeMessageMenu();
}


/* =========================================================
   UPDATE REACTION
   ========================================================= */

function updateReaction(
  messageId,
  reaction
) {
  Object.keys(chats)
    .forEach(friendId => {
      const chat =
        chats[friendId] ||
        [];

      const message =
        chat.find(
          item =>
            item.id ===
            messageId
        );

      if (message) {
        message.reaction =
          reaction;
      }
    });

  saveChats();

  renderMessages();
}


/* =========================================================
   UNSEND MESSAGE
   ========================================================= */

function unsendSelectedMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    closeMessageMenu();
    return;
  }

  const chat =
    chats[currentChatUserId] ||
    [];

  const index =
    chat.findIndex(
      message =>
        message.id ===
        selectedMessageId
    );

  if (index === -1) {
    closeMessageMenu();
    return;
  }

  const message =
    chat[index];

  if (!message.mine) {
    alert(
      "You can only unsend your own message."
    );

    closeMessageMenu();
    return;
  }

  chat.splice(
    index,
    1
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
        type: "unsend",

        messageId:
          message.id,

        from:
          currentUser.id,

        to:
          currentChatUserId
      })
    );
  }

  closeMessageMenu();
}


/* =========================================================
   DELETE MESSAGE
   ========================================================= */

function deleteSelectedMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    closeMessageMenu();
    return;
  }

  const chat =
    chats[currentChatUserId] ||
    [];

  const index =
    chat.findIndex(
      message =>
        message.id ===
        selectedMessageId
    );

  if (index === -1) {
    closeMessageMenu();
    return;
  }

  const message =
    chat[index];

  chat.splice(
    index,
    1
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
          "server_delete",

        messageId:
          message.id,

        from:
          currentUser.id,

        to:
          currentChatUserId
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
  Object.keys(chats)
    .forEach(friendId => {
      const chat =
        chats[friendId] ||
        [];

      const index =
        chat.findIndex(
          message =>
            message.id ===
            messageId
        );

      if (index !== -1) {
        chat.splice(
          index,
          1
        );
      }
    });

  saveChats();

  renderMessages();

  renderFriends();
}


/* =========================================================
   SEND MEDIA
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

  if (
    !currentUser ||
    !currentChatUserId
  ) {
    input.value = "";
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

    input.value = "";
    return;
  }

  const maxSize =
    50 * 1024 * 1024;

  if (
    file.size >
    maxSize
  ) {
    alert(
      "File is too large. Maximum size is 50 MB."
    );

    input.value = "";
    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {
    const type =
      file.type.startsWith(
        "video/"
      )
        ? "video"
        : "image";

    const message = {
      id:
        generateMessageId(),

      from:
        currentUser.id,

      to:
        currentChatUserId,

      type:
        type,

      name:
        file.name,

      mimeType:
        file.type,

      data:
        reader.result,

      time:
        Date.now(),

      status:
        "sent",

      mine:
        true
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
    ].push(
      message
    );

    saveChats();

    renderMessages();

    socket.send(
      JSON.stringify({
        type:
          "media",

        id:
          message.id,

        from:
          message.from,

        to:
          message.to,

        mediaType:
          message.type,

        name:
          message.name,

        mimeType:
          message.mimeType,

        data:
          message.data,

        time:
          message.time
      })
    );

    input.value = "";
  };

  reader.onerror = () => {
    alert(
      "Could not read this file."
    );

    input.value = "";
  };

  reader.readAsDataURL(
    file
  );
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

  const message = {
    id:
      msg.id,

    from:
      from,

    to:
      currentUser.id,

    type:
      msg.mediaType ||
      "image",

    name:
      msg.name ||
      "Media",

    mimeType:
      msg.mimeType ||
      "application/octet-stream",

    data:
      msg.data,

    time:
      msg.time ||
      Date.now(),

    status:
      currentChatUserId ===
      from
        ? "read"
        : "delivered",

    mine:
      false
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

  if (
    currentChatUserId ===
    from
  ) {
    renderMessages();

    sendRead(
      message.id
    );
  }

  renderFriends();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type:
          "delivered",

        messageId:
          message.id,

        from:
          currentUser.id,

        to:
          from
      })
    );
  }
}      fileName:
        file.name,

      mimeType:
        file.type,

      status:
        "sent",

      mine:
        true
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
    ].push(
      message
    );

    saveChats();

    renderMessages();

    socket.send(
      JSON.stringify({
        type:
          "media",

        id:
          message.id,

        from:
          message.from,

        to:
          message.to,

        media:
          message.media,

        mediaType:
          message.mediaType,

        fileName:
          message.fileName,

        mimeType:
          message.mimeType,

        time:
          message.time
      })
    );

    input.value = "";
  };

  reader.readAsDataURL(
    file
  );
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

  const message = {
    id:
      msg.id,

    from:
      from,

    to:
      currentUser.id,

    time:
      msg.time ||
      Date.now(),

    media:
      msg.media,

    mediaType:
      msg.mediaType ||
      "image",

    fileName:
      msg.fileName ||
      "media",

    mimeType:
      msg.mimeType ||
      "",

    status:
      currentChatUserId ===
      from
        ? "read"
        : "delivered",

    mine:
      false
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

  if (
    currentChatUserId ===
    from
  ) {
    renderMessages();

    sendRead(
      message.id
    );
  }

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

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (!menu) {
    return;
  }

  menu.classList.remove(
    "hidden"
  );
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
   REACTION
   ========================================================= */

function reactToMessage(
  emoji
) {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    return;
  }

  const messages =
    chats[
      currentChatUserId
    ] || [];

  const message =
    messages.find(
      item =>
        item.id ===
        selectedMessageId
    );

  if (!message) {
    closeMessageMenu();
    return;
  }

  message.reaction =
    emoji;

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
          "reaction",

        messageId:
          message.id,

        reaction:
          emoji,

        to:
          currentChatUserId
      })
    );
  }

  closeMessageMenu();
}


/* =========================================================
   RECEIVE REACTION
   ========================================================= */

function receiveReaction(msg) {
  Object.keys(chats)
    .forEach(chatId => {

      const messages =
        chats[chatId] ||
        [];

      const message =
        messages.find(
          item =>
            item.id ===
            msg.messageId
        );

      if (message) {
        message.reaction =
          msg.reaction;
      }
    });

  saveChats();

  renderMessages();
}


/* =========================================================
   UNSEND
   ========================================================= */

function unsendSelectedMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    closeMessageMenu();
    return;
  }

  const messages =
    chats[
      currentChatUserId
    ] || [];

  const index =
    messages.findIndex(
      message =>
        message.id ===
        selectedMessageId
    );

  if (index === -1) {
    closeMessageMenu();
    return;
  }

  const message =
    messages[index];

  if (!message.mine) {
    alert(
      "You can only unsend your own message."
    );

    closeMessageMenu();

    return;
  }

  messages.splice(
    index,
    1
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
          "unsend",

        messageId:
          message.id,

        to:
          currentChatUserId
      })
    );
  }

  closeMessageMenu();
}


/* =========================================================
   DELETE
   ========================================================= */

function deleteSelectedMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    closeMessageMenu();
    return;
  }

  const messages =
    chats[
      currentChatUserId
    ] || [];

  const index =
    messages.findIndex(
      message =>
        message.id ===
        selectedMessageId
    );

  if (index === -1) {
    closeMessageMenu();
    return;
  }

  messages.splice(
    index,
    1
  );

  saveChats();

  renderMessages();

  closeMessageMenu();
}


/* =========================================================
   RECEIVE UNSEND
   ========================================================= */

function receiveUnsend(msg) {
  Object.keys(chats)
    .forEach(chatId => {

      const messages =
        chats[chatId] ||
        [];

      const index =
        messages.findIndex(
          message =>
            message.id ===
            msg.messageId
        );

      if (index !== -1) {
        messages.splice(
          index,
          1
        );
      }
    });

  saveChats();

  renderMessages();

  renderFriends();
}


/* =========================================================
   RECEIVE DELETE
   ========================================================= */

function receiveDelete(msg) {
  Object.keys(chats)
    .forEach(chatId => {

      const messages =
        chats[chatId] ||
        [];

      const index =
        messages.findIndex(
          message =>
            message.id ===
            msg.messageId
        );

      if (index !== -1) {
        messages.splice(
          index,
          1
        );
      }
    });

  saveChats();

  renderMessages();

  renderFriends();
}


/* =========================================================
   SEND TYPING
   ========================================================= */

function sendTyping() {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }

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
        "typing",

      to:
        currentChatUserId
    })
  );
}


/* =========================================================
   RECEIVE TYPING
   ========================================================= */

function receiveTyping(msg) {
  if (
    !currentChatUserId ||
    String(
      msg.from
    ).toUpperCase() !==
      String(
        currentChatUserId
      ).toUpperCase()
  ) {
    return;
  }

  const typing =
    document.getElementById(
      "typingStatus"
    );

  if (!typing) {
    return;
  }

  typing.textContent =
    "typing...";

  clearTimeout(
    typingTimer
  );

  typingTimer =
    setTimeout(() => {
      typing.textContent =
        "";
    }, 1500);
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
    "input",
    () => {
      sendTyping();
    }
  );

  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        sendMessage();
      }

    }
  );
}/* =========================================================
   CHANGE PROFILE PHOTO
   ========================================================= */

async function changeProfilePhoto() {
  if (!currentUser) {
    return;
  }

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
      "Profile photo must be 10 MB or smaller."
    );

    input.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload = async () => {
    try {
      await saveProfileMediaLocal({
        id:
          "profile-photo-" +
          currentUser.id,

        type:
          "profilePhoto",

        file:
          file,

        mimeType:
          file.type,

        name:
          file.name,

        time:
          Date.now()
      });

      await loadProfilePhoto();

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

    } catch (error) {
      console.error(
        "Profile photo error:",
        error
      );

      alert(
        "Could not save profile photo."
      );
    }

    input.value = "";
  };

  reader.onerror = () => {
    alert(
      "Could not read the image."
    );

    input.value = "";
  };

  reader.readAsDataURL(
    file
  );
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

  const circle =
    document.getElementById(
      "profileCircle"
    );

  const initial =
    currentUser.name
      .charAt(0)
      .toUpperCase();

  if (item && item.file) {
    const url =
      URL.createObjectURL(
        item.file
      );

    const imageHTML = `
      <img
        src="${url}"
        alt="Profile photo"
      >
    `;

    if (large) {
      large.innerHTML =
        imageHTML;
    }

    if (circle) {
      circle.innerHTML =
        imageHTML;
    }

  } else {

    if (large) {
      large.textContent =
        initial;
    }

    if (circle) {
      circle.textContent =
        initial;
    }
  }
}


/* =========================================================
   RECEIVE PROFILE PHOTO
   ========================================================= */

async function receiveProfilePhoto(
  msg
) {
  if (
    !msg ||
    !msg.userId ||
    !msg.data
  ) {
    return;
  }

  const userId =
    String(
      msg.userId
    ).toUpperCase();

  if (
    currentUser &&
    userId ===
      currentUser.id
  ) {
    return;
  }

  const isFriend =
    friends.some(
      friend =>
        String(
          friend.id
        ).toUpperCase() ===
        userId
    );

  if (!isFriend) {
    return;
  }

  try {
    const response =
      await fetch(
        msg.data
      );

    const blob =
      await response.blob();

    const file =
      new File(
        [blob],
        msg.name ||
          "profile.jpg",
        {
          type:
            msg.mimeType ||
            blob.type ||
            "image/jpeg"
        }
      );

    await saveProfileMediaLocal({
      id:
        "friend-profile-photo-" +
        userId,

      type:
        "friendProfilePhoto",

      userId:
        userId,

      file:
        file,

      mimeType:
        file.type,

      name:
        msg.name ||
        "profile.jpg",

      time:
        msg.time ||
        Date.now()
    });

    renderFriends();

  } catch (error) {
    console.error(
      "Could not save friend profile photo:",
      error
    );
  }
}


/* =========================================================
   GET FRIEND PROFILE PHOTO
   ========================================================= */

async function getFriendProfilePhoto(
  friendId
) {
  return getProfileMediaLocal(
    "friend-profile-photo-" +
      String(
        friendId
      ).toUpperCase()
  );
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

  if (
    newName === null
  ) {
    return;
  }

  const name =
    newName.trim();

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

  const pageName =
    document.getElementById(
      "profilePageName"
    );

  if (pageName) {
    pageName.textContent =
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
          currentUser.name
      })
    );
  }
}


/* =========================================================
   UPLOAD PROFILE MEDIA
   ========================================================= */

async function uploadProfileMedia() {
  if (!currentUser) {
    return;
  }

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

  const isImage =
    file.type.startsWith(
      "image/"
    );

  const isVideo =
    file.type.startsWith(
      "video/"
    );

  if (
    !isImage &&
    !isVideo
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
      "Media must be 50 MB or smaller."
    );

    input.value = "";

    return;
  }

  const visibility =
    prompt(
      "Type PUBLIC or FRIENDS:",
      "FRIENDS"
    );

  if (
    visibility === null
  ) {
    input.value = "";
    return;
  }

  const value =
    visibility
      .trim()
      .toUpperCase();

  if (
    value !==
      "PUBLIC" &&
    value !==
      "FRIENDS"
  ) {
    alert(
      "Please type PUBLIC or FRIENDS."
    );

    input.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload = async () => {
    try {
      const media = {
        id:
          "profile-media-" +
          generateMessageId(),

        type:
          isImage
            ? "image"
            : "video",

        ownerId:
          currentUser.id,

        file:
          file,

        mimeType:
          file.type,

        name:
          file.name,

        visibility:
          value,

        time:
          Date.now()
      };

      await saveProfileMediaLocal(
        media
      );

      await renderProfileMedia();

      input.value = "";

    } catch (error) {
      console.error(
        "Profile media upload error:",
        error
      );

      alert(
        "Could not save media."
      );

      input.value = "";
    }
  };

  reader.onerror = () => {
    alert(
      "Could not read this file."
    );

    input.value = "";
  };

  reader.readAsDataURL(
    file
  );
}


/* =========================================================
   RENDER PROFILE MEDIA
   ========================================================= */

async function renderProfileMedia() {
  if (!currentUser) {
    return;
  }

  const grid =
    document.getElementById(
      "profileMediaGrid"
    );

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  const all =
    await getAllProfileMediaLocal();

  const media =
    all.filter(item => {
      return (
        item.ownerId ===
          currentUser.id &&
        item.type !==
          "profilePhoto"
      );
    });

  if (media.length === 0) {
    grid.innerHTML = `
      <div
        class="muted"
        style="
          grid-column:1/-1;
          padding:30px;
          text-align:center;
        "
      >
        No media uploaded yet.
      </div>
    `;

    return;
  }

  media
    .sort(
      (a, b) =>
        b.time - a.time
    )
    .forEach(item => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "profileMediaCard";

      const url =
        URL.createObjectURL(
          item.file
        );

      if (
        item.type ===
        "image"
      ) {
        const img =
          document.createElement(
            "img"
          );

        img.src =
          url;

        img.alt =
          item.name ||
          "Profile media";

        card.appendChild(
          img
        );

      } else {
        const video =
          document.createElement(
            "video"
          );

        video.src =
          url;

        video.controls =
          true;

        video.playsInline =
          true;

        card.appendChild(
          video
        );
      }

      const badge =
        document.createElement(
          "div"
        );

      badge.className =
        "profileMediaVisibility";

      badge.textContent =
        item.visibility ===
        "PUBLIC"
          ? "Public"
          : "Friends";

      card.appendChild(
        badge
      );

      grid.appendChild(
        card
      );
    });
}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

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
   PROFILE STARTUP
   ========================================================= */

async function refreshProfile() {
  if (!currentUser) {
    return;
  }

  await loadProfilePhoto();

  await renderProfileMedia();
}


/* =========================================================
   INITIALIZE MESSAGE INPUT
   ========================================================= */

setupMessageInput();/* =========================================================
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
