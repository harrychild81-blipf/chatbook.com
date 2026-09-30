@@ -2,7 +2,6 @@
   FRIENDCHAT - COMPLETE APP.JS
   ========================================================= */


/* =========================================================
   SERVER CONNECTION
   ========================================================= */
@@ -32,85 +31,85 @@ let chats = {};
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


@@ -119,65 +118,69 @@ function saveChats() {
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

  document
    .getElementById("loginScreen")
    .classList.remove("hidden");
  const screen =
    document.getElementById("loginScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }
}


function showSignup() {

  hideAllScreens();
  hideBottomNav();

  document
    .getElementById("signupScreen")
    .classList.remove("hidden");
  const screen =
    document.getElementById("signupScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }
}


function showHome() {

  hideAllScreens();
  showBottomNav();

  document
    .getElementById("homeScreen")
    .classList.remove("hidden");
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

  document
    .getElementById("addScreen")
    .classList.remove("hidden");
  const screen =
    document.getElementById("addScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }
}


@@ -186,25 +189,21 @@ function showAdd() {
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


@@ -213,7 +212,6 @@ function generateFriendId() {
   ========================================================= */

function signup() {

  const name =
    document
      .getElementById("signupName")
@@ -236,68 +234,44 @@ function signup() {
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


@@ -306,7 +280,6 @@ function signup() {
   ========================================================= */

function login() {

  const email =
    document
      .getElementById("loginEmail")
@@ -318,52 +291,37 @@ function login() {
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


@@ -372,29 +330,21 @@ function login() {
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


@@ -403,69 +353,47 @@ function logout() {
   ========================================================= */

function updateHome() {

  if (!currentUser) {
    return;
  }


  const name =
    document.getElementById(
      "myName"
    );
    document.getElementById("myName");

  const id =
    document.getElementById(
      "myId"
    );
    document.getElementById("myId");

  const idLabel =
    document.getElementById(
      "myIdLabel"
    );
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


@@ -474,291 +402,172 @@ function updateHome() {
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


  /* -------------------------------------------------------
     OPEN
     ------------------------------------------------------- */
  /* OPEN */

  socket.onopen = () => {

    console.log(
      "FriendChat WebSocket connected"
    );


    socket.send(
      JSON.stringify({

        type: "register",

        userId:
          currentUser.id,

        name:
          currentUser.name

        userId: currentUser.id,
        name: currentUser.name
      })
    );


    sendPresence(
      currentChatUserId
    );

  };


  /* -------------------------------------------------------
     MESSAGE
     ------------------------------------------------------- */

  socket.onmessage = async (event) => {
  /* MESSAGE */

  socket.onmessage = async event => {
    try {

      const msg =
        JSON.parse(event.data);


      console.log(
        "Server message:",
        msg
      );


      /* -----------------------------------------------
         REGISTERED
         ----------------------------------------------- */

      if (msg.type === "registered") {

        console.log(
          "Registered with server:",
          msg.userId
        );

        return;

      }


      /* -----------------------------------------------
         PRESENCE
         ----------------------------------------------- */

      if (msg.type === "presence") {

        updatePresence(
          msg.users || {}
        );

        return;

      }


      /* -----------------------------------------------
         TEXT MESSAGE
         ----------------------------------------------- */

      if (msg.type === "chat") {

        receiveMessage(msg);

        return;

      }


      /* -----------------------------------------------
         MEDIA
         ----------------------------------------------- */

      if (msg.type === "media") {

        receiveMedia(msg);

        return;

      }


      /* -----------------------------------------------
         DELIVERED
         ----------------------------------------------- */

      if (msg.type === "delivered") {

        updateMessageStatus(
          msg.messageId,
          "delivered"
        );

        return;

      }


      /* -----------------------------------------------
         READ
         ----------------------------------------------- */

      if (msg.type === "read") {

        updateMessageStatus(
          msg.messageId,
          "read"
        );

        return;

      }


      /* -----------------------------------------------
         REACTION
         ----------------------------------------------- */

      if (msg.type === "reaction") {

        updateReaction(
          msg.messageId,
          msg.reaction
        );

        return;

      }


      /* -----------------------------------------------
         UNSEND
         ----------------------------------------------- */

      if (msg.type === "unsend") {

        removeMessage(
          msg.messageId
        );

        return;

      }


      /* -----------------------------------------------
         DELETE
         ----------------------------------------------- */

      if (msg.type === "server_delete") {

        removeMessage(
          msg.messageId
        );

        return;

      }


      /* -----------------------------------------------
         DELIVERY ERROR
         ----------------------------------------------- */

      if (msg.type === "delivery_error") {

        console.log(
          "Delivery error:",
          msg.reason
        );

        return;

      }


      /* -----------------------------------------------
         MEDIA ERROR
         ----------------------------------------------- */

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


  /* -------------------------------------------------------
     ERROR
     ------------------------------------------------------- */

  socket.onerror = (error) => {

  socket.onerror = error => {
    console.error(
      "FriendChat WebSocket error:",
      error
    );

  };


  /* -------------------------------------------------------
     CLOSED
     ------------------------------------------------------- */

  socket.onclose = () => {

    console.log(
      "FriendChat WebSocket disconnected"
    );

  };

}


@@ -767,52 +576,39 @@ function connectSocket() {
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
@@ -823,37 +619,27 @@ function updatePresence(users) {
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
@@ -862,10 +648,8 @@ function sendPresence(chatWith) {
              chatWith
            ).toUpperCase()
          : null

    })
  );

}


@@ -874,22 +658,18 @@ function sendPresence(chatWith) {
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


@@ -898,18 +678,15 @@ function getUnreadCount(friendId) {
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
@@ -919,30 +696,21 @@ function renderFriends() {
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
@@ -953,48 +721,36 @@ function renderFriends() {
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
@@ -1009,7 +765,6 @@ function renderFriends() {

      </div>


      <div class="friendInfo">

        <div class="friendName">
@@ -1018,14 +773,12 @@ function renderFriends() {
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
@@ -1036,32 +789,23 @@ function renderFriends() {

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


@@ -1070,127 +814,90 @@ function renderFriends() {
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

      id:
        data.user.id,

      name:
        data.user.name

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


@@ -1199,39 +906,33 @@ async function addById() {
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
@@ -1247,61 +948,36 @@ function openChat(friend) {
        ).status
      )}
    </span>

  `;


  if (!chats[currentChatUserId]) {

    chats[currentChatUserId] = [];

  }


  /*
     IMPORTANT:

     When the user actually opens this chat,
     mark every received unread message as read.
  */

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


  /*
     Remove unread badge immediately.
  */

  renderFriends();

}


@@ -1310,19 +986,13 @@ function openChat(friend) {
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


@@ -1331,117 +1001,82 @@ function generateMessageId() {
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

    id:
      generateMessageId(),
    from: currentUser.id,

    from:
      currentUser.id,

    to:
      currentChatUserId,
    to: currentChatUserId,

    text:
      text,

    time:
      Date.now(),
    text: text,

    status:
      "sent",
    time: Date.now(),

    mine:
      true
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

      type:
        "chat",

      id:
        message.id,

      from:
        message.from,
      id: message.id,

      to:
        message.to,
      from: message.from,

      text:
        message.text,
      to: message.to,

      time:
        message.time
      text: message.text,

      time: message.time
    })
  );


  input.value = "";

}


@@ -1450,112 +1085,69 @@ function sendMessage() {
   ========================================================= */

function receiveMessage(msg) {

  const from =
    String(
      msg.from
    ).toUpperCase();


  if (!chats[from]) {

    chats[from] = [];

  }


  /*
     If the user is currently inside this chat,
     message becomes read immediately.

     Otherwise it stays delivered/unread.
  */

  const isOpen =
    currentChatUserId === from;


  const message = {
    id: msg.id,

    id:
      msg.id,

    from:
      from,
    from: from,

    to:
      currentUser.id,
    to: currentUser.id,

    text:
      msg.text,
    text: msg.text,

    time:
      msg.time,
    time: msg.time,

    status:
      isOpen
        ? "read"
        : "delivered",

    mine:
      false

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


    // Tell sender it arrived
    sendDelivered(
      message.id
    );


    // Tell sender it was read
    sendRead(
      message.id
    );

  } else {

    /*
       User is somewhere else.

       Message remains unread.
       Red notification badge will appear.
    */

    sendDelivered(
      message.id
    );

  }


  renderFriends();

}


@@ -1564,30 +1156,20 @@ function receiveMessage(msg) {
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

      type: "delivered",
      messageId: messageId
    })
  );

}


@@ -1596,30 +1178,20 @@ function sendDelivered(messageId) {
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

      type:
        "read",

      messageId:
        messageId

      type: "read",
      messageId: messageId
    })
  );

}


@@ -1631,59 +1203,37 @@ function updateMessageStatus(
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


  /*
     Also update friend list.
     This makes unread notification changes
     appear immediately.
  */

  renderFriends();

}


@@ -1692,39 +1242,31 @@ function updateMessageStatus(
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
@@ -1733,235 +1275,157 @@ function renderMessages() {
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


    /* -------------------------------------------------------
       MESSAGE STATUS
       ------------------------------------------------------- */

    let status = "";


    if (message.mine) {

      /*
         READ = BLACK ✓✓
      */

      if (
        message.status ===
        "read"
      ) {

        status =
          '<span class="messageStatus readTicks">✓✓</span>';

      }

      /*
         DELIVERED = GREY ✓✓
      */

      else if (
      } else if (
        message.status ===
        "delivered"
      ) {

        status =
          '<span class="messageStatus deliveredTicks">✓✓</span>';

      }

      /*
         SENT = GREY SINGLE ✓
      */

      else {

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
          hour:
            "2-digit",

          minute:
            "2-digit"
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


    /* -------------------------------------------------------
       DESKTOP RIGHT CLICK
       ------------------------------------------------------- */
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


    /* -------------------------------------------------------
       MOBILE LONG PRESS
       ------------------------------------------------------- */
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


@@ -1970,67 +1434,53 @@ function renderMessages() {
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
@@ -2040,20 +1490,14 @@ async function sendMedia() {
        ? "image"
        : "video";


    const message = {
      id: generateMessageId(),

      id:
        generateMessageId(),

      from:
        currentUser.id,
      from: currentUser.id,

      to:
        currentChatUserId,
      to: currentChatUserId,

      time:
        Date.now(),
      time: Date.now(),

      media:
        reader.result,
@@ -2069,44 +1513,31 @@ async function sendMedia() {

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

        type:
          "media",

        id:
          message.id,
        id: message.id,

        from:
          message.from,
        from: message.from,

        to:
          message.to,
        to: message.to,

        time:
          message.time,
        time: message.time,

        mediaType:
          message.mediaType,
@@ -2116,18 +1547,13 @@ async function sendMedia() {

        data:
          message.media

      })
    );


    input.value = "";

  };


  reader.readAsDataURL(file);

}


@@ -2136,40 +1562,28 @@ async function sendMedia() {
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

    id:
      msg.id,
    from: from,

    from:
      from,
    to: currentUser.id,

    to:
      currentUser.id,

    time:
      msg.time,
    time: msg.time,

    media:
      msg.data,
    media: msg.data,

    mediaType:
      msg.mediaType,
@@ -2182,49 +1596,37 @@ function receiveMedia(msg) {
        ? "read"
        : "delivered",

    mine:
      false

    mine: false
  };


  const exists =
    chats[from].some(
      item =>
        item.id === message.id
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


@@ -2235,62 +1637,46 @@ function receiveMedia(msg) {
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


@@ -2301,106 +1687,80 @@ function closeMessageMenu() {
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
          item.id === messageId
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

        type:
          "reaction",
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
          item.id === messageId
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


@@ -2409,83 +1769,60 @@ function updateReaction(
   ========================================================= */

function unsendMessage() {

  if (!selectedMessageId) {
    return;
  }


  const id =
    selectedMessageId;


  let found =
    false;

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

      found =
        true;

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

          type:
            "unsend",
          type: "unsend",

          messageId:
            id

        })
      );

    }

  }


  closeMessageMenu();

}


@@ -2494,71 +1831,53 @@ function unsendMessage() {
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

        type:
          "server_delete",
        type: "server_delete",

        messageId:
          id

      })
    );

  }


  closeMessageMenu();

}


@@ -2569,32 +1888,24 @@ function deleteMessage() {
function removeMessage(
  messageId
) {

  for (
    const chatId in chats
  ) {

    chats[chatId] =
      chats[chatId].filter(
        message =>
          message.id !== messageId
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


@@ -2603,7 +1914,6 @@ function removeMessage(
   ========================================================= */

const emojis = [

  "😀",
  "😂",
  "🤣",
@@ -2628,71 +1938,55 @@ const emojis = [
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
    picker.children.length === 0
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


@@ -2701,34 +1995,27 @@ function toggleEmojiPicker() {
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


@@ -2737,21 +2024,16 @@ function escapeHtml(value) {
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

@@ -2761,462 +2043,539 @@ setInterval(() => {
              currentChatUserId
            ).toUpperCase()
          : null

    })
  );


}, 10000);


/* =========================================================
   CLOSE MESSAGE MENU WHEN CLICKING OUTSIDE
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
   START APP
   PROFILE DATABASE
   ========================================================= */

(() => {

  currentUser =
    loadAccount();


  loadFriends();

  loadChats();
const PROFILE_DB_NAME =
  "FriendChatProfileDB";

const PROFILE_DB_VERSION = 1;

  if (currentUser) {
const PROFILE_STORE =
  "profileMedia";

    updateHome();

    connectSocket();
function openProfileDB() {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          PROFILE_DB_NAME,
          PROFILE_DB_VERSION
        );

    showHome();
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

  } else {
      request.onsuccess = () => {
        resolve(
          request.result
        );
      };

    showLogin();
      request.onerror = () => {
        reject(
          request.error
        );
      };
    }
  );
}

  }

})();
/* =========================================================
   FRIENDCHAT PROFILE + LOCAL MEDIA
========================================================= */
   SAVE PROFILE MEDIA
   ========================================================= */

const PROFILE_DB_NAME = "FriendChatProfileDB";
const PROFILE_DB_VERSION = 1;
const PROFILE_STORE = "profileMedia";
async function saveProfileMediaLocal(
  media
) {
  const db =
    await openProfileDB();

function openProfileDB() {
  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readwrite"
        );

  return new Promise((resolve, reject) => {
      tx.objectStore(
        PROFILE_STORE
      ).put(media);

    const request = indexedDB.open(
      PROFILE_DB_NAME,
      PROFILE_DB_VERSION
    );
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

    request.onupgradeneeded = function(e) {

      const db = e.target.result;
/* =========================================================
   GET PROFILE MEDIA
   ========================================================= */

      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
async function getProfileMediaLocal(
  id
) {
  const db =
    await openProfileDB();

        db.createObjectStore(
  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          PROFILE_STORE,
          { keyPath: "id" }
          "readonly"
        );

      }
      const request =
        tx.objectStore(
          PROFILE_STORE
        ).get(id);

    };
      request.onsuccess = () => {
        const result =
          request.result ||
          null;

    request.onsuccess = () => {
      resolve(request.result);
    };
        db.close();

    request.onerror = () => {
      reject(request.error);
    };
        resolve(result);
      };

  });
      request.onerror = () => {
        db.close();

        reject(
          request.error
        );
      };
    }
  );
}


/* SAVE PROFILE MEDIA */

async function saveProfileMediaLocal(media) {

  const db = await openProfileDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      PROFILE_STORE,
      "readwrite"
    );

    tx.objectStore(PROFILE_STORE).put(media);
/* =========================================================
   GET ALL PROFILE MEDIA
   ========================================================= */

    tx.oncomplete = () => {
async function getAllProfileMediaLocal() {
  const db =
    await openProfileDB();

      db.close();
      resolve();
  return new Promise(
    (resolve, reject) => {
      const tx =
        db.transaction(
          PROFILE_STORE,
          "readonly"
        );

    };
      const request =
        tx.objectStore(
          PROFILE_STORE
        ).getAll();

    tx.onerror = () => {
      request.onsuccess = () => {
        const result =
          request.result ||
          [];

      db.close();
      reject(tx.error);
        db.close();

    };
        resolve(result);
      };

  });
      request.onerror = () => {
        db.close();

        reject(
          request.error
        );
      };
    }
  );
}


/* GET PROFILE MEDIA */
/* =========================================================
   PROFILE SCREEN
   ========================================================= */

async function getProfileMediaLocal(id) {
function showProfile() {
  if (!currentUser) {
    return;
  }

  const db = await openProfileDB();
  hideAllScreens();

  return new Promise((resolve, reject) => {
  showBottomNav();

    const tx = db.transaction(
      PROFILE_STORE,
      "readonly"
  const screen =
    document.getElementById(
      "profileScreen"
    );

    const request =
      tx.objectStore(PROFILE_STORE).get(id);

    request.onsuccess = () => {
  if (screen) {
    screen.classList.remove(
      "hidden"
    );
  }

      const result = request.result || null;
  const name =
    document.getElementById(
      "profilePageName"
    );

      db.close();

      resolve(result);

    };

    request.onerror = () => {

      db.close();

      reject(request.error);

    };

  });

}


/* GET ALL PROFILE MEDIA */

async function getAllProfileMediaLocal() {

  const db = await openProfileDB();

  return new Promise((resolve, reject) => {

    const tx = db.transaction(
      PROFILE_STORE,
      "readonly"
  const id =
    document.getElementById(
      "profilePageId"
    );

    const request =
      tx.objectStore(PROFILE_STORE).getAll();

    request.onsuccess = () => {

      const result = request.result || [];

      db.close();

      resolve(result);

    };

    request.onerror = () => {

      db.close();

      reject(request.error);

    };

  });

}


/* =========================================================
   PROFILE SCREEN
========================================================= */

function showProfile() {

  if (!currentUser) return;

  document.querySelectorAll(".screen")
    .forEach(x => x.classList.add("hidden"));

  document
    .getElementById("profileScreen")
    .classList.remove("hidden");

  document
    .getElementById("bottomNav")
    .classList.remove("hidden");

  document
    .getElementById("profilePageName")
    .textContent = currentUser.name;
  if (name) {
    name.textContent =
      currentUser.name;
  }

  document
    .getElementById("profilePageId")
    .textContent = currentUser.id;
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
   ========================================================= */

async function changeProfilePhoto() {

  const input =
    document.getElementById("profilePhotoInput");
    document.getElementById(
      "profilePhotoInput"
    );

  const file = input.files[0];
  if (!input) {
    return;
  }

  if (!file) return;
  const file =
    input.files[0];

  if (!file.type.startsWith("image/")) {
  if (!file) {
    return;
  }

    alert("Please select an image.");
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

  if (file.size > 10 * 1024 * 1024) {

    alert("Profile photo must be under 10 MB.");
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
    "profile-photo-" + currentUser.id;
    "profile-photo-" +
    currentUser.id;

  await saveProfileMediaLocal({

    id: id,

    owner: currentUser.id,

    type: "profilePhoto",
    owner:
      currentUser.id,

    mimeType: file.type,
    type:
      "profilePhoto",

    file: file,
    mimeType:
      file.type,

    time: Date.now()
    file:
      file,

    time:
      Date.now()
  });

  loadProfilePhoto();
  await loadProfilePhoto();

  input.value = "";

}


/* LOAD PROFILE PHOTO */
/* =========================================================
   LOAD PROFILE PHOTO
   ========================================================= */

async function loadProfilePhoto() {

  if (!currentUser) return;
  if (!currentUser) {
    return;
  }

  const item =
    await getProfileMediaLocal(
      "profile-photo-" + currentUser.id
      "profile-photo-" +
      currentUser.id
    );

  const large =
    document.getElementById("profilePhotoLarge");
    document.getElementById(
      "profilePhotoLarge"
    );

  const small =
    document.getElementById("profileCircle");
    document.getElementById(
      "profileCircle"
    );

  if (!item) {
  if (!large && !small) {
    return;
  }

    large.textContent =
  if (!item) {
    const first =
      currentUser.name
        ? currentUser.name.charAt(0).toUpperCase()
        ? currentUser.name
            .charAt(0)
            .toUpperCase()
        : "?";

    small.textContent =
      currentUser.name
        ? currentUser.name.charAt(0).toUpperCase()
        : "?";
    if (large) {
      large.textContent =
        first;
    }

    return;
    if (small) {
      small.textContent =
        first;
    }

    return;
  }

  const url =
    URL.createObjectURL(item.file);

  large.innerHTML =
    `<img src="${url}" alt="Profile photo">`;
    URL.createObjectURL(
      item.file
    );

  small.innerHTML =
    `<img src="${url}" alt="Profile photo">`;
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
   EDIT NAME
========================================================= */
   EDIT PROFILE NAME
   ========================================================= */

function editProfileName() {

  if (!currentUser) return;
  if (!currentUser) {
    return;
  }

  const newName =
    prompt(
      "Enter your new name:",
      currentUser.name
    );

  if (!newName) return;
  if (!newName) {
    return;
  }

  const name =
    newName.trim();

  if (!name) return;
  if (!name) {
    return;
  }

  currentUser.name = name;
  currentUser.name =
    name;

  localStorage.setItem(
    "friendchat_account",
    JSON.stringify(currentUser)
  saveAccount(
    currentUser
  );

  document
    .getElementById("profilePageName")
    .textContent = name;

  document
    .getElementById("myName")
    .textContent = name;

  document
    .getElementById("myIdLabel")
    .textContent = name;
  const profileName =
    document.getElementById(
      "profilePageName"
    );

  if (socket &&
      socket.readyState === WebSocket.OPEN) {
  const homeName =
    document.getElementById(
      "myName"
    );

    socket.send(JSON.stringify({
  if (profileName) {
    profileName.textContent =
      name;
  }

      type: "register",
  if (homeName) {
    homeName.textContent =
      name;
  }

      userId: currentUser.id,
  updateHome();

      name: name
  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type:
          "register",

    }));
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
   ========================================================= */

async function uploadProfileMedia() {

  const input =
    document.getElementById("profileMediaInput");
    document.getElementById(
      "profileMediaInput"
    );

  if (!input) {
    return;
  }

  const file = input.files[0];
  const file =
    input.files[0];

  if (!file) return;
  if (!file) {
    return;
  }

  if (
    !file.type.startsWith("image/") &&
    !file.type.startsWith("video/")
    !file.type.startsWith(
      "image/"
    ) &&
    !file.type.startsWith(
      "video/"
    )
  ) {

    alert("Please select a photo or video.");
    alert(
      "Please select a photo or video."
    );

    input.value = "";

    return;

  }

  if (file.size > 50 * 1024 * 1024) {

    alert("Media must be under 50 MB.");
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


  /* ASK PRIVACY */
  /* PRIVACY */

  const privacy =
    prompt(
@@ -3225,28 +2584,41 @@ async function uploadProfileMedia() {
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

  const visibility =
    privacy.toLowerCase() === "public"
      ? "public"
      : privacy.toLowerCase() === "friends"
        ? "friends"
        : null;
  if (
    privacyText ===
    "friends"
  ) {
    visibility =
      "friends";
  }

  if (!visibility) {

    alert("Please type PUBLIC or FRIENDS.");
    alert(
      "Please type PUBLIC or FRIENDS."
    );

    input.value = "";

    return;

  }


@@ -3257,129 +2629,161 @@ async function uploadProfileMedia() {
    Date.now();


  /* SAVE ONLY ON THIS DEVICE */
  /* SAVE LOCALLY */

  await saveProfileMediaLocal({

    id: id,

    owner: currentUser.id,
    owner:
      currentUser.id,

    type:
      file.type.startsWith("image/")
      file.type.startsWith(
        "image/"
      )
        ? "image"
        : "video",

    mimeType: file.type,

    name: file.name,
    mimeType:
      file.type,

    size: file.size,
    name:
      file.name,

    visibility: visibility,
    size:
      file.size,

    file: file,
    visibility:
      visibility,

    time: Date.now()
    file:
      file,

    time:
      Date.now()
  });


  renderProfileMedia();
  await renderProfileMedia();

  input.value = "";

}


/* =========================================================
   DISPLAY PROFILE MEDIA
========================================================= */
   ========================================================= */

async function renderProfileMedia() {

  const grid =
    document.getElementById(
      "profileMediaGrid"
    );

  if (!grid) return;
  if (!grid || !currentUser) {
    return;
  }

  const all =
    await getAllProfileMediaLocal();

  const media =
    all.filter(item =>

      item.owner === currentUser.id &&
      item.type !== "profilePhoto"

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

  for (const item of media) {

  for (
    const item of media
  ) {
    const div =
      document.createElement("div");
      document.createElement(
        "div"
      );

    div.className =
      "profileMediaItem";


    const url =
      URL.createObjectURL(item.file);


    if (item.type === "image") {
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
          ${item.visibility === "public"
            ? "🌎 Public"
            : "👥 Friends"}
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
          ${item.visibility === "public"
            ? "🌎 Public"
            : "👥 Friends"}
          ${
            item.visibility ===
            "public"
              ? "🌎 Public"
              : "👥 Friends"
          }
        </span>

      `;

    }

    grid.appendChild(div);

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
