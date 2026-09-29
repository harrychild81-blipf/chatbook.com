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
    socket.readyState !== WebSocket.OPEN ||
    !currentUser
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "presence",
      userId: currentUser.id,
      chatWith:
        chatWith || null
    })
  );
}


/* =========================================================
   FRIENDS
   ========================================================= */

function addFriend() {
  const input =
    document.getElementById(
      "friendIdInput"
    );

  const status =
    document.getElementById(
      "addFriendStatus"
    );

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
        "Enter a FriendChat ID.";
    }

    return;
  }

  if (
    currentUser &&
    id ===
      currentUser.id.toUpperCase()
  ) {
    if (status) {
      status.textContent =
        "You cannot add yourself.";
    }

    return;
  }

  if (
    friends.some(
      friend =>
        String(friend.id).toUpperCase() === id
    )
  ) {
    if (status) {
      status.textContent =
        "This friend is already added.";
    }

    return;
  }

  /*
     Ask the server for the user.
  */

  fetch(
    `${getHttpBase()}/api/user/${encodeURIComponent(id)}`
  )
    .then(response => {
      if (!response.ok) {
        throw new Error(
          "User not found"
        );
      }

      return response.json();
    })
    .then(user => {

      if (!user || !user.userId) {
        throw new Error(
          "User not found"
        );
      }

      const friend = {
        id: user.userId,
        name:
          user.name ||
          "Friend"
      };

      friends.push(friend);

      saveFriends();

      input.value = "";

      if (status) {
        status.textContent =
          `${friend.name} added successfully.`;
      }

      renderFriends();

    })
    .catch(error => {
      console.error(
        "Add friend error:",
        error
      );

      if (status) {
        status.textContent =
          "Friend not found or server unavailable.";
      }
    });
}


function getHttpBase() {
  if (
    location.protocol === "https:"
  ) {
    return location.origin;
  }

  return `http://${location.hostname}:8080`;
}


/* =========================================================
   RENDER FRIENDS
   ========================================================= */

function renderFriends() {
  const list =
    document.getElementById(
      "friendsList"
    );

  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (!friends.length) {
    const empty =
      document.createElement("div");

    empty.className =
      "emptyFriends";

    empty.textContent =
      "No friends yet.";

    list.appendChild(empty);

    return;
  }


  friends.forEach(friend => {

    const item =
      document.createElement("div");

    item.className =
      "friendItem";

    item.onclick = () => {
      openChat(friend.id);
    };


    /* =====================================================
       CIRCULAR FRIEND AVATAR
       ===================================================== */

    const avatar =
      document.createElement("div");

    avatar.className =
      "friendAvatar";

    avatar.style.width = "56px";
    avatar.style.height = "56px";
    avatar.style.minWidth = "56px";
    avatar.style.minHeight = "56px";
    avatar.style.borderRadius = "50%";
    avatar.style.overflow = "hidden";
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.background = "#2563eb";
    avatar.style.color = "#ffffff";
    avatar.style.fontWeight = "700";
    avatar.style.fontSize = "21px";
    avatar.style.flexShrink = "0";


    avatar.textContent =
      String(
        friend.name || "?"
      )
        .charAt(0)
        .toUpperCase();


    const info =
      document.createElement("div");

    info.className =
      "friendInfo";


    const friendName =
      document.createElement("div");

    friendName.className =
      "friendName";

    friendName.textContent =
      friend.name || "Friend";


    const friendId =
      document.createElement("div");

    friendId.className =
      "friendId";

    friendId.textContent =
      friend.id;


    const presence =
      getPresence(friend.id);


    const status =
      document.createElement("div");

    status.className =
      "friendStatus";

    status.textContent =
      presenceLabel(
        presence.status
      );


    if (
      presence.status === "active"
    ) {
      status.style.color =
        "#16a34a";
    } else if (
      presence.status === "busy"
    ) {
      status.style.color =
        "#f59e0b";
    } else {
      status.style.color =
        "#888";
    }


    info.appendChild(
      friendName
    );

    info.appendChild(
      friendId
    );

    info.appendChild(
      status
    );


    item.appendChild(
      avatar
    );

    item.appendChild(
      info
    );


    list.appendChild(
      item
    );


    /*
       Load the actual friend's
       profile photo from IndexedDB.
    */

    loadFriendAvatarIntoItem(
      friend.id,
      avatar
    );

  });
}


/* =========================================================
   OPEN CHAT
   ========================================================= */

function openChat(friendId) {
  const friend =
    friends.find(
      item =>
        String(item.id).toUpperCase() ===
        String(friendId).toUpperCase()
    );

  if (!friend) {
    return;
  }

  currentChatUserId =
    friend.id;

  hideAllScreens();

  const screen =
    document.getElementById(
      "chatScreen"
    );

  if (screen) {
    screen.classList.remove("hidden");
  }

  hideBottomNav();

  const title =
    document.getElementById(
      "chatTitle"
    );

  if (title) {
    title.textContent =
      friend.name;
  }

  const chatStatus =
    document.getElementById(
      "chatStatus"
    );

  if (chatStatus) {
    chatStatus.textContent =
      presenceLabel(
        getPresence(
          friend.id
        ).status
      );
  }

  sendPresence(
    friend.id
  );

  renderChat();

  loadChatAvatar(
    friend.id
  );
}


/* =========================================================
   CLOSE CHAT
   ========================================================= */

function closeChat() {
  currentChatUserId =
    null;

  sendPresence(null);

  showHome();
}


/* =========================================================
   CHAT STORAGE
   ========================================================= */

function getChatKey(a, b) {
  return [
    String(a).toUpperCase(),
    String(b).toUpperCase()
  ]
    .sort()
    .join("_");
}


function getCurrentChat() {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return [];
  }

  const key =
    getChatKey(
      currentUser.id,
      currentChatUserId
    );

  if (!chats[key]) {
    chats[key] = [];
  }

  return chats[key];
}


function saveCurrentChat() {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }

  const key =
    getChatKey(
      currentUser.id,
      currentChatUserId
    );

  saveChats();

  chats[key] =
    chats[key] || [];
}


/* =========================================================
   MESSAGE ID
   ========================================================= */

function createMessageId() {
  return (
    "msg_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


/* =========================================================
   SEND TEXT MESSAGE
   ========================================================= */

function sendMessage() {
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
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    alert(
      "Not connected to FriendChat server."
    );

    return;
  }


  const message = {
    type: "chat",
    messageId:
      createMessageId(),
    from:
      currentUser.id,
    to:
      currentChatUserId,
    senderName:
      currentUser.name,
    text:
      text,
    time:
      Date.now(),
    status:
      "sent"
  };


  const key =
    getChatKey(
      currentUser.id,
      currentChatUserId
    );


  if (!chats[key]) {
    chats[key] = [];
  }


  chats[key].push(
    message
  );

  saveChats();


  socket.send(
    JSON.stringify(
      message
    )
  );


  input.value = "";

  renderChat();

  scrollChatToBottom();
}


/* =========================================================
   RECEIVE TEXT MESSAGE
   ========================================================= */

function receiveMessage(msg) {
  if (!msg) {
    return;
  }

  if (!currentUser) {
    return;
  }

  const sender =
    msg.from ||
    msg.senderId;

  const receiver =
    msg.to ||
    currentUser.id;


  if (
    String(receiver).toUpperCase() !==
    String(currentUser.id).toUpperCase()
  ) {
    return;
  }


  const key =
    getChatKey(
      currentUser.id,
      sender
    );


  if (!chats[key]) {
    chats[key] = [];
  }


  const existing =
    chats[key].find(
      message =>
        message.messageId ===
        msg.messageId
    );


  if (!existing) {
    chats[key].push({
      ...msg,
      from:
        sender,
      to:
        currentUser.id,
      status:
        "delivered"
    });
  }


  saveChats();


  /*
     Send delivered confirmation.
  */

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type:
          "delivered",
        messageId:
          msg.messageId,
        from:
          currentUser.id,
        to:
          sender
      })
    );
  }


  /*
     If this chat is currently open,
     immediately mark the message read.
  */

  if (
    String(sender).toUpperCase() ===
    String(currentChatUserId || "").toUpperCase()
  ) {

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type:
            "read",
          messageId:
            msg.messageId,
          from:
            currentUser.id,
          to:
            sender
        })
      );
    }

    const message =
      chats[key].find(
        item =>
          item.messageId ===
          msg.messageId
      );

    if (message) {
      message.status =
        "read";
    }

    saveChats();

    renderChat();

    scrollChatToBottom();

  } else {
    renderFriends();
  }
}


/* =========================================================
   UPDATE MESSAGE STATUS
   ========================================================= */

function updateMessageStatus(
  messageId,
  status
) {
  if (!messageId) {
    return;
  }

  let changed = false;


  Object.keys(chats)
    .forEach(key => {

      const message =
        chats[key].find(
          item =>
            item.messageId ===
            messageId
        );

      if (message) {
        message.status =
          status;

        changed = true;
      }
    });


  if (changed) {
    saveChats();

    renderChat();
  }
}


/* =========================================================
   MESSAGE STATUS HTML
   ========================================================= */

function getStatusHTML(status) {
  if (status === "read") {
    return `<span class="messageTicks read">✓✓</span>`;
  }

  if (status === "delivered") {
    return `<span class="messageTicks">✓✓</span>`;
  }

  if (status === "sent") {
    return `<span class="messageTicks">✓</span>`;
  }

  return "";
}


/* =========================================================
   RENDER CHAT
   ========================================================= */

function renderChat() {
  const container =
    document.getElementById(
      "messages"
    );

  if (!container) {
    return;
  }

  if (
    !currentUser ||
    !currentChatUserId
  ) {
    container.innerHTML = "";
    return;
  }


  const key =
    getChatKey(
      currentUser.id,
      currentChatUserId
    );


  const messages =
    chats[key] || [];


  container.innerHTML = "";


  messages.forEach(
    message => {

      const isMine =
        String(message.from).toUpperCase() ===
        String(currentUser.id).toUpperCase();


      const wrapper =
        document.createElement("div");

      wrapper.className =
        isMine
          ? "messageRow mine"
          : "messageRow theirs";


      const bubble =
        document.createElement("div");

      bubble.className =
        isMine
          ? "messageBubble mine"
          : "messageBubble theirs";


      if (
        message.deleted
      ) {
        bubble.innerHTML =
          `<i>This message was unsent</i>`;
      } else if (
        message.mediaType
      ) {
        renderMediaMessage(
          bubble,
          message
        );
      } else {
        const text =
          document.createElement("div");

        text.className =
          "messageText";

        text.textContent =
          message.text || "";

        bubble.appendChild(
          text
        );
      }


      const bottom =
        document.createElement("div");

      bottom.className =
        "messageBottom";


      const time =
        document.createElement("span");

      time.className =
        "messageTime";

      time.textContent =
        formatTime(
          message.time
        );


      bottom.appendChild(
        time
      );


      if (isMine) {
        const status =
          document.createElement("span");

        status.innerHTML =
          getStatusHTML(
            message.status
          );

        bottom.appendChild(
          status
        );
      }


      bubble.appendChild(
        bottom
      );


      if (
        message.reaction
      ) {
        const reaction =
          document.createElement("span");

        reaction.className =
          "messageReaction";

        reaction.textContent =
          message.reaction;

        bubble.appendChild(
          reaction
        );
      }


      wrapper.appendChild(
        bubble
      );


      wrapper.addEventListener(
        "contextmenu",
        event => {
          event.preventDefault();

          showMessageMenu(
            message.messageId,
            event.clientX,
            event.clientY
          );
        }
      );


      let pressTimer = null;


      wrapper.addEventListener(
        "touchstart",
        () => {
          pressTimer =
            setTimeout(() => {

              showMessageMenu(
                message.messageId
              );

            }, 600);
        },
        { passive: true }
      );


      wrapper.addEventListener(
        "touchend",
        () => {
          if (pressTimer) {
            clearTimeout(
              pressTimer
            );
          }
        },
        { passive: true }
      );


      wrapper.addEventListener(
        "touchmove",
        () => {
          if (pressTimer) {
            clearTimeout(
              pressTimer
            );
          }
        },
        { passive: true }
      );


      container.appendChild(
        wrapper
      );
    }
  );


  scrollChatToBottom();
}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date =
    new Date(timestamp);

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


/* =========================================================
   SCROLL CHAT
   ========================================================= */

function scrollChatToBottom() {
  const container =
    document.getElementById(
      "messages"
    );

  if (!container) {
    return;
  }

  setTimeout(() => {
    container.scrollTop =
      container.scrollHeight;
  }, 0);
}


/* =========================================================
   MESSAGE MENU
   ========================================================= */

function showMessageMenu(
  messageId,
  x,
  y
) {
  selectedMessageId =
    messageId;


  const old =
    document.getElementById(
      "messageMenu"
    );

  if (old) {
    old.remove();
  }


  const menu =
    document.createElement("div");

  menu.id =
    "messageMenu";

  menu.className =
    "messageMenu";


  if (
    x !== undefined &&
    y !== undefined
  ) {
    menu.style.left =
      `${x}px`;

    menu.style.top =
      `${y}px`;
  }


  const react =
    document.createElement("button");

  react.textContent =
    "❤️ React";

  react.onclick = () => {
    addReaction(
      messageId,
      "❤️"
    );

    menu.remove();
  };


  const unsend =
    document.createElement("button");

  unsend.textContent =
    "↩ Unsend";

  unsend.onclick = () => {
    unsendMessage(
      messageId
    );

    menu.remove();
  };


  const del =
    document.createElement("button");

  del.textContent =
    "🗑 Delete";

  del.onclick = () => {
    deleteMessage(
      messageId
    );

    menu.remove();
  };


  menu.appendChild(
    react
  );

  menu.appendChild(
    unsend
  );

  menu.appendChild(
    del
  );


  document.body.appendChild(
    menu
  );


  if (
    x === undefined ||
    y === undefined
  ) {
    menu.style.position =
      "fixed";

    menu.style.left =
      "50%";

    menu.style.top =
      "50%";

    menu.style.transform =
      "translate(-50%, -50%)";
  }


  setTimeout(() => {

    const close =
      event => {

        if (
          !menu.contains(
            event.target
          )
        ) {
          menu.remove();

          document.removeEventListener(
            "click",
            close
          );
        }
      };

    document.addEventListener(
      "click",
      close
    );

  }, 0);
}


/* =========================================================
   REACTION
   ========================================================= */

function addReaction(
  messageId,
  reaction
) {
  if (!currentUser) {
    return;
  }

  const key =
    getChatKey(
      currentUser.id,
      currentChatUserId
    );

  const message =
    chats[key]?.find(
      item =>
        item.messageId ===
        messageId
    );

  if (!message) {
    return;
  }


  message.reaction =
    reaction;

  saveChats();

  renderChat();


  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({
        type:
          "reaction",
        messageId:
          messageId,
        reaction:
          reaction,
        from:
          currentUser.id,
        to:
          currentChatUserId
      })
    );

  }
}


/* =========================================================
   RECEIVE REACTION
   ========================================================= */

function updateReaction(
  messageId,
  reaction
) {
  Object.keys(chats)
    .forEach(key => {

      const message =
        chats[key].find(
          item =>
            item.messageId ===
            messageId
        );

      if (message) {
        message.reaction =
          reaction;
      }
    });

  saveChats();

  renderChat();
}


/* =========================================================
   UNSEND MESSAGE
   ========================================================= */

function unsendMessage(
  messageId
) {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }


  const key =
    getChatKey(
      currentUser.id,
      currentChatUserId
    );


  const message =
    chats[key]?.find(
      item =>
        item.messageId ===
        messageId
    );


  if (!message) {
    return;
  }


  if (
    String(message.from).toUpperCase() !==
    String(currentUser.id).toUpperCase()
  ) {
    return;
  }


  message.deleted =
    true;

  message.text =
    "";

  saveChats();

  renderChat();


  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({
        type:
          "unsend",
        messageId:
          messageId,
        from:
          currentUser.id,
        to:
          currentChatUserId
      })
    );

  }
}


/* =========================================================
   DELETE MESSAGE
   ========================================================= */

function deleteMessage(
  messageId
) {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }


  const key =
    getChatKey(
      currentUser.id,
      currentChatUserId
    );


  if (!chats[key]) {
    return;
  }


  chats[key] =
    chats[key].filter(
      message =>
        message.messageId !==
        messageId
    );


  saveChats();

  renderChat();


  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({
        type:
          "delete",
        messageId:
          messageId,
        from:
          currentUser.id,
        to:
          currentChatUserId
      })
    );

  }
}


/* =========================================================
   REMOVE MESSAGE FROM OTHER DEVICE
   ========================================================= */

function removeMessage(
  messageId
) {
  if (!messageId) {
    return;
  }


  Object.keys(chats)
    .forEach(key => {

      const message =
        chats[key]?.find(
          item =>
            item.messageId ===
            messageId
        );

      if (message) {
        message.deleted =
          true;

        message.text =
          "";
      }

    });


  saveChats();

  renderChat();
}


/* =========================================================
   MEDIA HELPERS
   ========================================================= */

function renderMediaMessage(
  bubble,
  message
) {

  if (
    !message.data &&
    !message.mediaData
  ) {
    const text =
      document.createElement(
        "div"
      );

    text.textContent =
      "Media unavailable.";

    bubble.appendChild(
      text
    );

    return;
  }


  const data =
    message.data ||
    message.mediaData;


  if (
    String(
      message.mediaType
    ).startsWith("video/")
  ) {

    const video =
      document.createElement(
        "video"
      );

    video.controls =
      true;

    video.playsInline =
      true;

    video.src =
      data;

    video.style.maxWidth =
      "100%";

    video.style.maxHeight =
      "300px";

    bubble.appendChild(
      video
    );

  } else {

    const img =
      document.createElement(
        "img"
      );

    img.src =
      data;

    img.alt =
      "Photo";

    img.style.maxWidth =
      "100%";

    img.style.maxHeight =
      "300px";

    img.style.borderRadius =
      "10px";

    img.style.objectFit =
      "contain";

    bubble.appendChild(
      img
    );
  }
}


/* =========================================================
   RECEIVE MEDIA
   ========================================================= */

function receiveMedia(msg) {
  if (!msg) {
    return;
  }

  if (!currentUser) {
    return;
  }


  const sender =
    msg.from ||
    msg.senderId;

  const receiver =
    msg.to ||
    currentUser.id;


  if (
    String(receiver).toUpperCase() !==
    String(currentUser.id).toUpperCase()
  ) {
    return;
  }


  const key =
    getChatKey(
      currentUser.id,
      sender
    );


  if (!chats[key]) {
    chats[key] = [];
  }


  const exists =
    chats[key].some(
      message =>
        message.messageId ===
        msg.messageId
    );


  if (!exists) {

    chats[key].push({
      ...msg,
      from:
        sender,
      to:
        currentUser.id,
      status:
        "delivered"
    });

  }


  saveChats();


  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({
        type:
          "delivered",
        messageId:
          msg.messageId,
        from:
          currentUser.id,
        to:
          sender
      })
    );

  }


  if (
    String(sender).toUpperCase() ===
    String(currentChatUserId || "").toUpperCase()
  ) {

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {

      socket.send(
        JSON.stringify({
          type:
            "read",
          messageId:
            msg.messageId,
          from:
            currentUser.id,
          to:
            sender
        })
      );

    }

    const message =
      chats[key].find(
        item =>
          item.messageId ===
          msg.messageId
      );

    if (message) {
      message.status =
        "read";
    }

    saveChats();

    renderChat();

    scrollChatToBottom();

  } else {
    renderFriends();
  }
}


/* =========================================================
   SEND MEDIA
   ========================================================= */

async function sendMedia() {
  const input =
    document.getElementById(
      "mediaInput"
    );

  if (!input) {
    return;
  }

  const file =
    input.files?.[0];

  if (!file) {
    return;
  }

  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    alert(
      "Not connected to FriendChat server."
    );

    return;
  }


  /*
     Keep media reasonably small because
     the current server relays it through
     WebSocket memory.
  */

  const maxSize =
    15 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {
    alert(
      "Please choose a file smaller than 15 MB."
    );

    input.value =
      "";

    return;
  }


  const reader =
    new FileReader();


  reader.onload = () => {

    const message = {
      type:
        "media",

      messageId:
        createMessageId(),

      from:
        currentUser.id,

      to:
        currentChatUserId,

      senderName:
        currentUser.name,

      mediaType:
        file.type,

      fileName:
        file.name,

      data:
        reader.result,

      time:
        Date.now(),

      status:
        "sent"
    };


    const key =
      getChatKey(
        currentUser.id,
        currentChatUserId
      );


    if (!chats[key]) {
      chats[key] = [];
    }


    chats[key].push(
      message
    );

    saveChats();


    socket.send(
      JSON.stringify(
        message
      )
    );


    input.value =
      "";

    renderChat();

    scrollChatToBottom();
  };


  reader.onerror = () => {
    alert(
      "Could not read this file."
    );
  };


  reader.readAsDataURL(
    file
  );
}


/* =========================================================
   PROFILE PAGE
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
    screen.classList.remove("hidden");
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

  loadProfileMedia();
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


  const cleanName =
    newName.trim();


  if (!cleanName) {
    return;
  }


  currentUser.name =
    cleanName;


  saveAccount(
    currentUser
  );


  updateHome();


  const profileName =
    document.getElementById(
      "profilePageName"
    );

  if (profileName) {
    profileName.textContent =
      currentUser.name;
  }


  /*
     Update local friend entries
     where this device is represented.
  */

  saveFriends();


  /*
     Inform server so friends can
     see the updated name.
  */

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({
        type:
          "update_profile",
        userId:
          currentUser.id,
        name:
          currentUser.name
      })
    );

  }
}


/* =========================================================
   PROFILE PHOTO - INDEXEDDB
   ========================================================= */

const PROFILE_DB_NAME =
  "FriendChatProfileDB";

const PROFILE_DB_VERSION =
  1;

const PROFILE_STORE =
  "profilePhotos";


function openProfileDB() {
  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          PROFILE_DB_NAME,
          PROFILE_DB_VERSION
        );


      request.onupgradeneeded =
        event => {

          const db =
            event.target.result;

          if (
            !db.objectStoreNames.contains(
              PROFILE_STORE
            )
          ) {

            db.createObjectStore(
              PROFILE_STORE
            );

          }

        };


      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };


      request.onerror =
        () => {
          reject(
            request.error
          );
        };

    }
  );
}


/* =========================================================
   SAVE PROFILE PHOTO LOCALLY
   ========================================================= */

async function saveProfilePhotoLocal(
  userId,
  photoData
) {
  try {

    const db =
      await openProfileDB();


    return new Promise(
      (resolve, reject) => {

        const transaction =
          db.transaction(
            PROFILE_STORE,
            "readwrite"
          );


        transaction.objectStore(
          PROFILE_STORE
        ).put(
          photoData,
          String(userId).toUpperCase()
        );


        transaction.oncomplete =
          () => {
            db.close();
            resolve();
          };


        transaction.onerror =
          () => {
            db.close();

            reject(
              transaction.error
            );
          };

      }
    );

  } catch (error) {

    console.error(
      "Save profile photo error:",
      error
    );

  }
}


/* =========================================================
   GET PROFILE PHOTO LOCALLY
   ========================================================= */

async function getProfilePhotoLocal(
  userId
) {
  try {

    const db =
      await openProfileDB();


    return new Promise(
      resolve => {

        const transaction =
          db.transaction(
            PROFILE_STORE,
            "readonly"
          );


        const request =
          transaction.objectStore(
            PROFILE_STORE
          ).get(
            String(userId).toUpperCase()
          );


        request.onsuccess =
          () => {

            const result =
              request.result;

            db.close();

            resolve(
              result || null
            );

          };


        request.onerror =
          () => {

            db.close();

            resolve(null);

          };

      }
    );

  } catch (error) {

    console.error(
      "Get profile photo error:",
      error
    );

    return null;
  }
}


/* =========================================================
   DELETE PROFILE PHOTO LOCALLY
   ========================================================= */

async function deleteProfilePhotoLocal(
  userId
) {
  try {

    const db =
      await openProfileDB();


    return new Promise(
      resolve => {

        const transaction =
          db.transaction(
            PROFILE_STORE,
            "readwrite"
          );


        transaction.objectStore(
          PROFILE_STORE
        ).delete(
          String(userId).toUpperCase()
        );


        transaction.oncomplete =
          () => {
            db.close();
            resolve();
          };


        transaction.onerror =
          () => {
            db.close();
            resolve();
          };

      }
    );

  } catch (error) {

    console.error(
      "Delete profile photo error:",
      error
    );

  }
}


/* =========================================================
   RENDER PROFILE PHOTO
   ========================================================= */

async function loadProfilePhoto() {
  if (!currentUser) {
    return;
  }


  const photo =
    await getProfilePhotoLocal(
      currentUser.id
    );


  /*
     Large photo on Profile page.
  */

  const large =
    document.getElementById(
      "profilePhotoLarge"
    );


  /*
     Small avatar on Home page.
  */

  const small =
    document.getElementById(
      "profileCircle"
    );


  if (photo && photo.data) {

    if (large) {

      large.innerHTML =
        "";

      large.style.width =
        "110px";

      large.style.height =
        "110px";

      large.style.borderRadius =
        "50%";

      large.style.overflow =
        "hidden";

      large.style.display =
        "flex";

      large.style.alignItems =
        "center";

      large.style.justifyContent =
        "center";


      const img =
        document.createElement(
          "img"
        );

      img.src =
        photo.data;

      img.alt =
        currentUser.name;

      img.style.width =
        "100%";

      img.style.height =
        "100%";

      img.style.objectFit =
        "cover";

      img.style.borderRadius =
        "50%";


      large.appendChild(
        img
      );

    }


    if (small) {

      small.innerHTML =
        "";

      small.style.width =
        "56px";

      small.style.height =
        "56px";

      small.style.minWidth =
        "56px";

      small.style.minHeight =
        "56px";

      small.style.borderRadius =
        "50%";

      small.style.overflow =
        "hidden";

      small.style.display =
        "flex";

      small.style.alignItems =
        "center";

      small.style.justifyContent =
        "center";

      small.style.flexShrink =
        "0";


      const img =
        document.createElement(
          "img"
        );

      img.src =
        photo.data;

      img.alt =
        currentUser.name;

      img.style.width =
        "100%";

      img.style.height =
        "100%";

      img.style.objectFit =
        "cover";

      img.style.borderRadius =
        "50%";


      small.appendChild(
        img
      );

    }

  } else {

    /*
       No photo = blue circle
       with user's initial.
    */

    if (large) {

      large.innerHTML =
        "";

      large.style.width =
        "110px";

      large.style.height =
        "110px";

      large.style.borderRadius =
        "50%";

      large.style.overflow =
        "hidden";

      large.style.display =
        "flex";

      large.style.alignItems =
        "center";

      large.style.justifyContent =
        "center";

      large.style.background =
        "#2563eb";

      large.style.color =
        "#ffffff";

      large.style.fontSize =
        "42px";

      large.style.fontWeight =
        "700";


      large.textContent =
        currentUser.name
          .charAt(0)
          .toUpperCase();

    }


    if (small) {

      small.innerHTML =
        "";

      small.style.width =
        "56px";

      small.style.height =
        "56px";

      small.style.minWidth =
        "56px";

      small.style.minHeight =
        "56px";

      small.style.borderRadius =
        "50%";

      small.style.overflow =
        "hidden";

      small.style.display =
        "flex";

      small.style.alignItems =
        "center";

      small.style.justifyContent =
        "center";

      small.style.background =
        "#2563eb";

      small.style.color =
        "#ffffff";

      small.style.fontSize =
        "21px";

      small.style.fontWeight =
        "700";

      small.style.flexShrink =
        "0";


      small.textContent =
        currentUser.name
          .charAt(0)
          .toUpperCase();

    }

  }
}


/* =========================================================
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
    input.files?.[0];


  if (!file) {
    return;
  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "Please choose an image."
    );

    input.value =
      "";

    return;
  }


  /*
     Keep profile photos reasonably
     small because the server temporarily
     relays them through RAM.
  */

  const maxSize =
    7 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {

    alert(
      "Please choose an image smaller than 7 MB."
    );

    input.value =
      "";

    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    async () => {

      const photoData = {
        data:
          reader.result,

        mimeType:
          file.type,

        name:
          currentUser.name,

        time:
          Date.now()
      };


      /*
         Save the photo on THIS DEVICE.
      */

      await saveProfilePhotoLocal(
        currentUser.id,
        photoData
      );


      /*
         Immediately update our UI.
      */

      await loadProfilePhoto();

      renderFriends();


      /*
         Send the photo to the server
         so friends currently online can
         receive it.

         "photo" is included for
         compatibility with the older
         server format.

         "data" is included for the
         newer server format.
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

            photo:
              reader.result,

            data:
              reader.result,

            mimeType:
              file.type,

            time:
              Date.now()
          })
        );

      } else {

        console.log(
          "Profile photo saved locally; server is offline."
        );

      }


      input.value =
        "";
    };


  reader.onerror =
    () => {

      alert(
        "Could not read the image."
      );

      input.value =
        "";

    };


  reader.readAsDataURL(
    file
  );
}


/* =========================================================
   RECEIVE FRIEND PROFILE PHOTO
   ========================================================= */

async function receiveProfilePhoto(
  msg
) {
  if (!msg) {
    return;
  }


  const userId =
    msg.userId;


  if (!userId) {
    return;
  }


  /*
     New server format:
        msg.data

     Older server format:
        msg.photo
  */

  const data =
    msg.data ||
    msg.photo ||
    "";


  if (!data) {
    return;
  }


  const photoData = {
    data:
      data,

    mimeType:
      msg.mimeType ||
      "image/jpeg",

    name:
      msg.name ||
      getFriendName(
        userId
      ) ||
      "Friend",

    time:
      Number(
        msg.time ||
        Date.now()
      )
  };


  /*
     Do NOT replace our own photo
     with a remote copy.
  */

  if (
    currentUser &&
    String(userId).toUpperCase() ===
      String(currentUser.id).toUpperCase()
  ) {

    return;
  }


  /*
     Save friend's photo locally.
  */

  await saveProfilePhotoLocal(
    userId,
    photoData
  );


  /*
     Refresh Friends list.
  */

  renderFriends();


  /*
     Refresh chat header if this
     particular friend is open.
  */

  if (
    currentChatUserId &&
    String(currentChatUserId).toUpperCase() ===
      String(userId).toUpperCase()
  ) {

    loadChatAvatar(
      userId
    );

  }
}


/* =========================================================
   GET FRIEND NAME
   ========================================================= */

function getFriendName(
  userId
) {
  const friend =
    friends.find(
      item =>
        String(item.id).toUpperCase() ===
        String(userId).toUpperCase()
    );

  return (
    friend?.name ||
    "Friend"
  );
}


/* =========================================================
   LOAD FRIEND AVATAR INTO FRIEND LIST
   ========================================================= */

async function loadFriendAvatarIntoItem(
  userId,
  avatarElement
) {
  if (!avatarElement) {
    return;
  }


  const photo =
    await getProfilePhotoLocal(
      userId
    );


  /*
     Always keep the avatar
     circular and fixed-size.
  */

  avatarElement.style.width =
    "56px";

  avatarElement.style.height =
    "56px";

  avatarElement.style.minWidth =
    "56px";

  avatarElement.style.minHeight =
    "56px";

  avatarElement.style.maxWidth =
    "56px";

  avatarElement.style.maxHeight =
    "56px";

  avatarElement.style.borderRadius =
    "50%";

  avatarElement.style.overflow =
    "hidden";

  avatarElement.style.display =
    "flex";

  avatarElement.style.alignItems =
    "center";

  avatarElement.style.justifyContent =
    "center";

  avatarElement.style.flexShrink =
    "0";


  if (
    photo &&
    photo.data
  ) {

    avatarElement.innerHTML =
      "";

    const img =
      document.createElement(
        "img"
      );

    img.src =
      photo.data;

    img.alt =
      getFriendName(
        userId
      );

    img.style.width =
      "56px";

    img.style.height =
      "56px";

    img.style.minWidth =
      "56px";

    img.style.minHeight =
      "56px";

    img.style.maxWidth =
      "56px";

    img.style.maxHeight =
      "56px";

    img.style.objectFit =
      "cover";

    img.style.borderRadius =
      "50%";

    img.style.display =
      "block";


    avatarElement.appendChild(
      img
    );

  } else {

    avatarElement.innerHTML =
      "";

    avatarElement.style.background =
      "#2563eb";

    avatarElement.style.color =
      "#ffffff";

    avatarElement.style.fontWeight =
      "700";

    avatarElement.style.fontSize =
      "21px";


    avatarElement.textContent =
      getFriendName(
        userId
      )
        .charAt(0)
        .toUpperCase();

  }
}


/* =========================================================
   CHAT HEADER AVATAR
   ========================================================= */

async function loadChatAvatar(
  userId
) {
  const avatar =
    document.getElementById(
      "chatAvatar"
    );


  if (!avatar) {
    return;
  }


  const friend =
    friends.find(
      item =>
        String(item.id).toUpperCase() ===
        String(userId).toUpperCase()
    );


  const friendName =
    friend?.name ||
    "Friend";


  avatar.style.width =
    "46px";

  avatar.style.height =
    "46px";

  avatar.style.minWidth =
    "46px";

  avatar.style.minHeight =
    "46px";

  avatar.style.borderRadius =
    "50%";

  avatar.style.overflow =
    "hidden";

  avatar.style.display =
    "flex";

  avatar.style.alignItems =
    "center";

  avatar.style.justifyContent =
    "center";

  avatar.style.flexShrink =
    "0";


  const photo =
    await getProfilePhotoLocal(
      userId
    );


  if (
    photo &&
    photo.data
  ) {

    avatar.innerHTML =
      "";

    const img =
      document.createElement(
        "img"
      );

    img.src =
      photo.data;

    img.alt =
      friendName;

    img.style.width =
      "46px";

    img.style.height =
      "46px";

    img.style.objectFit =
      "cover";

    img.style.borderRadius =
      "50%";

    img.style.display =
      "block";


    avatar.appendChild(
      img
    );

  } else {

    avatar.innerHTML =
      "";

    avatar.style.background =
      "#2563eb";

    avatar.style.color =
      "#ffffff";

    avatar.style.fontWeight =
      "700";

    avatar.style.fontSize =
      "18px";


    avatar.textContent =
      friendName
        .charAt(0)
        .toUpperCase();

  }
}


/* =========================================================
   PROFILE MEDIA STORAGE
   ========================================================= */

const MEDIA_DB_NAME =
  "FriendChatMediaDB";

const MEDIA_DB_VERSION =
  1;

const MEDIA_STORE =
  "profileMedia";


function openMediaDB() {
  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          MEDIA_DB_NAME,
          MEDIA_DB_VERSION
        );


      request.onupgradeneeded =
        event => {

          const db =
            event.target.result;

          if (
            !db.objectStoreNames.contains(
              MEDIA_STORE
            )
          ) {

            db.createObjectStore(
              MEDIA_STORE,
              {
                keyPath:
                  "id"
              }
            );

          }

        };


      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };


      request.onerror =
        () => {
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
  try {

    const db =
      await openMediaDB();


    return new Promise(
      (resolve, reject) => {

        const transaction =
          db.transaction(
            MEDIA_STORE,
            "readwrite"
          );


        transaction.objectStore(
          MEDIA_STORE
        ).put(
          media
        );


        transaction.oncomplete =
          () => {
            db.close();
            resolve();
          };


        transaction.onerror =
          () => {
            db.close();

            reject(
              transaction.error
            );
          };

      }
    );

  } catch (error) {

    console.error(
      "Save profile media error:",
      error
    );

  }
}


/* =========================================================
   GET PROFILE MEDIA
   ========================================================= */

async function getProfileMediaLocal() {
  try {

    const db =
      await openMediaDB();


    return new Promise(
      resolve => {

        const transaction =
          db.transaction(
            MEDIA_STORE,
            "readonly"
          );


        const request =
          transaction.objectStore(
            MEDIA_STORE
          ).getAll();


        request.onsuccess =
          () => {

            const result =
              request.result || [];

            db.close();

            resolve(
              result
            );

          };


        request.onerror =
          () => {

            db.close();

            resolve([]);

          };

      }
    );

  } catch (error) {

    console.error(
      "Get profile media error:",
      error
    );

    return [];
  }
}


/* =========================================================
   DELETE PROFILE MEDIA
   ========================================================= */

async function deleteProfileMediaLocal(
  id
) {
  try {

    const db =
      await openMediaDB();


    return new Promise(
      resolve => {

        const transaction =
          db.transaction(
            MEDIA_STORE,
            "readwrite"
          );


        transaction.objectStore(
          MEDIA_STORE
        ).delete(
          id
        );


        transaction.oncomplete =
          () => {
            db.close();
            resolve();
          };


        transaction.onerror =
          () => {
            db.close();
            resolve();
          };

      }
    );

  } catch (error) {

    console.error(
      "Delete profile media error:",
      error
    );

  }
}        receiveMedia(msg);
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

    if (!item) {
      return;
    }

    const avatar =
      item.querySelector(
        ".friendAvatar"
      );

    if (!avatar) {
      return;
    }

    /* Always keep the avatar circular and fixed-size. */
    avatar.style.width = "56px";
    avatar.style.height = "56px";
    avatar.style.minWidth = "56px";
    avatar.style.minHeight = "56px";
    avatar.style.maxWidth = "56px";
    avatar.style.maxHeight = "56px";
    avatar.style.borderRadius = "50%";
    avatar.style.overflow = "hidden";
    avatar.style.position = "relative";
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";

    if (!profile || !profile.file) {
      return;
    }

    const url =
      URL.createObjectURL(
        profile.file
      );

    const status =
      getPresence(friendId).status ||
      "offline";

    avatar.innerHTML = `
      <img
        src="${url}"
        alt="Profile photo"
        style="
          width:56px;
          height:56px;
          min-width:56px;
          min-height:56px;
          max-width:56px;
          max-height:56px;
          object-fit:cover;
          border-radius:50%;
          display:block;
        "
      >

      <span
        class="presenceDot ${status}"
        style="
          position:absolute;
          right:0;
          bottom:0;
        "
      ></span>
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
}      "messageMenu"
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
