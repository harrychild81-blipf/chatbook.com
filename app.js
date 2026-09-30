/* =========================================================
   FRIENDCHAT - COMPLETE APP.JS
   ========================================================= */

/* =========================================================
   CONNECTION
   ========================================================= */

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let socket = null;

let currentUser = null;
let currentChatUserId = null;

let friends = [];
let chats = {};

let selectedMessageId = null;

window.friendChatPresence = {};


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
        Math.floor(
          Math.random() * chars.length
        )
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
    document.getElementById(
      "bottomNav"
    );

  if (nav) {
    nav.classList.remove("hidden");
  }
}


function hideBottomNav() {
  const nav =
    document.getElementById(
      "bottomNav"
    );

  if (nav) {
    nav.classList.add("hidden");
  }
}


function showLogin() {
  hideAllScreens();
  hideBottomNav();

  const screen =
    document.getElementById(
      "loginScreen"
    );

  if (screen) {
    screen.classList.remove("hidden");
  }
}


function showSignup() {
  hideAllScreens();
  hideBottomNav();

  const screen =
    document.getElementById(
      "signupScreen"
    );

  if (screen) {
    screen.classList.remove("hidden");
  }
}


function showHome() {
  hideAllScreens();
  showBottomNav();

  const screen =
    document.getElementById(
      "homeScreen"
    );

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
    document.getElementById(
      "addScreen"
    );

  if (screen) {
    screen.classList.remove("hidden");
  }
}


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

    if (
      !nameInput ||
      !emailInput ||
      !passwordInput
    ) {
      console.error(
        "Signup elements not found"
      );
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

    if (
      !email ||
      !email.includes("@")
    ) {
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
      id:
        generateFriendId(),

      name:
        name,

      email:
        email,

      password:
        password
    };

    saveAccount(account);

    currentUser =
      account;

    friends = [];
    chats = {};

    saveFriends();
    saveChats();

    updateHome();

    connectSocket();

    showHome();

  } catch (error) {
    console.error(
      "SIGNUP ERROR:",
      error
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

    if (
      !emailInput ||
      !passwordInput
    ) {
      console.error(
        "Login elements not found"
      );
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

    const account =
      loadAccount();

    if (!account) {
      if (status) {
        status.textContent =
          "No account found on this device.";
      }
      return;
    }

    if (
      email.toLowerCase() !==
      String(
        account.email
      ).toLowerCase() ||
      password !==
      String(
        account.password
      )
    ) {
      if (status) {
        status.textContent =
          "Incorrect email or password.";
      }
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


  /* -------------------------------------------------------
     OPEN
     ------------------------------------------------------- */

  socket.onopen = () => {
    console.log(
      "FriendChat WebSocket connected"
    );

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

    sendPresence(
      currentChatUserId
    );
  };


  /* -------------------------------------------------------
     MESSAGE
     ------------------------------------------------------- */

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


        /* REGISTERED */

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


        /* PRESENCE */

        if (
          msg.type ===
          "presence"
        ) {
          window.friendChatPresence =
            msg.users || {};

          renderFriends();

          updateChatStatus();

          return;
        }


        /* CHAT */

        if (
          msg.type ===
          "chat"
        ) {
          receiveMessage(
            msg
          );

          return;
        }


        /* DELIVERED */

        if (
          msg.type ===
          "delivered"
        ) {
          console.log(
            "DELIVERED RECEIVED:",
            msg.messageId
          );

          updateMessageStatus(
            msg.messageId,
            "delivered"
          );

          return;
        }


        /* READ */

        if (
          msg.type ===
          "read"
        ) {
          console.log(
            "READ RECEIVED:",
            msg.messageId
          );

          updateMessageStatus(
            msg.messageId,
            "read"
          );

          return;
        }


        /* DELIVERY ERROR */

        if (
          msg.type ===
          "delivery_error"
        ) {
          console.log(
            "DELIVERY ERROR:",
            msg
          );

          updateMessageStatus(
            msg.messageId,
            "sent"
          );

          return;
        }


        /* REACTION */

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


        /* UNSEND */

        if (
          msg.type ===
          "unsend"
        ) {
          removeMessage(
            msg.messageId
          );

          return;
        }


        /* DELETE */

        if (
          msg.type ===
          "server_delete"
        ) {
          removeMessage(
            msg.messageId
          );

          return;
        }


        /* PROFILE PHOTO */

        if (
          msg.type ===
          "profile_photo"
        ) {
          receiveProfilePhoto(
            msg
          );

          return;
        }


        /* MEDIA */

        if (
          msg.type ===
          "media"
        ) {
          receiveMedia(
            msg
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

  socket.onerror =
    error => {
      console.error(
        "WebSocket error:",
        error
      );
    };


  /* -------------------------------------------------------
     CLOSE
     ------------------------------------------------------- */

  socket.onclose =
    () => {
      console.log(
        "FriendChat WebSocket disconnected"
      );
    };
}


/* =========================================================
   PRESENCE
   ========================================================= */

function getPresence(
  userId
) {
  return (
    window
      .friendChatPresence[
        String(
          userId
        ).toUpperCase()
      ] || {
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


function sendPresence(
  chatWith
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
        chatWith
          ? String(
              chatWith
            ).toUpperCase()
          : null
    })
  );
}


function updateChatStatus() {
  if (
    !currentChatUserId
  ) {
    return;
  }

  const status =
    document.getElementById(
      "chatStatus"
    );

  if (status) {
    status.textContent =
      presenceLabel(
        getPresence(
          currentChatUserId
        ).status
      );
  }
}


/* =========================================================
   FRIENDS
   ========================================================= */

function getUnreadCount(
  friendId
) {
  const id =
    String(
      friendId
    ).toUpperCase();

  const list =
    chats[id] || [];

  return list.filter(
    message =>
      !message.mine &&
      message.status !==
        "read"
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

  list.innerHTML = "";

  if (!friends.length) {
    list.innerHTML = `
      <div
        class="muted"
        style="
          padding:20px;
          text-align:center;
        "
      >
        No friends yet.
      </div>
    `;

    return;
  }

  friends.forEach(
    friend => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "friendItem";

      item.onclick =
        () => openChat(
          friend
        );

      const status =
        getPresence(
          friend.id
        ).status;

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
            max-width:56px;
            min-height:56px;
            max-height:56px;
            border-radius:50%;
            overflow:hidden;
            display:flex;
            align-items:center;
            justify-content:center;
            position:relative;
            background:#2563eb;
            color:white;
            font-weight:bold;
            font-size:22px;
          "
        >
          ${escapeHtml(
            String(
              friend.name ||
              "F"
            )
              .charAt(0)
              .toUpperCase()
          )}

          <span
            class="presenceDot ${status}"
          ></span>
        </div>

        <div
          class="friendInfo"
          style="
            flex:1;
            min-width:0;
          "
        >
          <div
            class="friendName"
          >
            ${escapeHtml(
              friend.name ||
              "Friend"
            )}
          </div>

          <div
            class="friendId"
          >
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
              <div
                class="unreadBadge"
              >
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
    }
  );
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
        String(
          friend.id
        ).toUpperCase() ===
        id
    )
  ) {
    status.textContent =
      "This friend is already added.";

    return;
  }

  try {
    const protocol =
      location.protocol ===
      "https:"
        ? "https:"
        : "http:";

    const response =
      await fetch(
        `${protocol}//${location.host}/api/user/${encodeURIComponent(
          id
        )}`
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

    const friend = {
      id:
        String(
          data.user.id
        ).toUpperCase(),

      name:
        data.user.name ||
        "Friend"
    };

    friends.push(
      friend
    );

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
   OPEN CHAT
   ========================================================= */

function openChat(
  friend
) {
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
        style="
          margin-left:8px;
        "
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


  /* Mark messages read */

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


function backFromChat() {
  currentChatUserId =
    null;

  sendPresence(
    null
  );

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

    mine:
      true,

    status:
      "sent",

    type:
      "text",

    reaction:
      null
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

  chats[
    currentChatUserId
  ].push(
    message
  );

  saveChats();

  input.value = "";

  renderMessages();


  /* SEND TO SERVER */

  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    console.log(
      "Socket not connected"
    );

    return;
  }

  console.log(
    "SENDING MESSAGE:",
    message.id
  );

  socket.send(
    JSON.stringify({
      type:
        "chat",

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

function receiveMessage(
  msg
) {
  if (!currentUser) {
    return;
  }

  const from =
    String(
      msg.from
    ).toUpperCase();

  const messageId =
    String(
      msg.messageId ||
      msg.id
    );

  if (!messageId) {
    return;
  }

  if (!chats[from]) {
    chats[from] = [];
  }

  const exists =
    chats[from].some(
      message =>
        String(
          message.id
        ) ===
        messageId
    );

  if (exists) {
    return;
  }

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
      msg.text || "",

    time:
      msg.time ||
      Date.now(),

    mine:
      false,

    status:
      "delivered",

    type:
      "text",

    reaction:
      null
  };

  chats[from].push(
    message
  );

  saveChats();


  /* Tell sender it arrived */

  sendDelivered(
    messageId
  );


  /* If chat is open, immediately read */

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
    console.log(
      "Cannot send delivered - socket offline"
    );

    return;
  }

  console.log(
    "SENDING DELIVERED:",
    messageId
  );

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


/* =========================================================
   READ
   ========================================================= */

function sendRead(
  messageId
) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    console.log(
      "Cannot send read - socket offline"
    );

    return;
  }

  console.log(
    "SENDING READ:",
    messageId
  );

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
   UPDATE MESSAGE STATUS
   ========================================================= */

function updateMessageStatus(
  messageId,
  status
) {
  let changed =
    false;

  Object.keys(
    chats
  ).forEach(
    chatId => {

      const messages =
        chats[
          chatId
        ] || [];

      messages.forEach(
        message => {

          if (
            String(
              message.id
            ) ===
            String(
              messageId
            )
          ) {
            message.status =
              status;

            changed =
              true;
          }
        }
      );
    }
  );

  if (changed) {
    saveChats();

    renderMessages();

    console.log(
      "STATUS UPDATED:",
      messageId,
      status
    );
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
    container.innerHTML =
      "";

    return;
  }

  const messages =
    chats[
      currentChatUserId
    ] || [];

  container.innerHTML =
    "";


  messages.forEach(
    message => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        message.mine
          ? "messageRow mine"
          : "messageRow";

      row.dataset.messageId =
        message.id;


      const bubble =
        document.createElement(
          "div"
        );

      bubble.className =
        "messageBubble";


      /* TEXT */

      if (
        message.type ===
        "text"
      ) {
        bubble.textContent =
          message.text || "";
      }


      /* MEDIA */

      else if (
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
              alt="Image"
              style="
                max-width:240px;
                max-height:320px;
                border-radius:10px;
                display:block;
              "
            >
          `;

        } else {

          bubble.innerHTML = `
            <video
              src="${message.data}"
              controls
              playsinline
              style="
                max-width:260px;
                max-height:320px;
                border-radius:10px;
                display:block;
              "
            ></video>
          `;
        }
      }


      /* TIME */

      const time =
        document.createElement(
          "div"
        );

      time.className =
        "messageTime";

      const date =
        new Date(
          message.time
        );

      time.textContent =
        date.toLocaleTimeString(
          [],
          {
            hour:
              "2-digit",

            minute:
              "2-digit"
          }
        );


      /* =================================================
         TICKS
         ================================================= */

      if (
        message.mine
      ) {

        const ticks =
          document.createElement(
            "span"
          );

        ticks.className =
          "messageTicks";


        /*
          SENT
          one tick
        */

        if (
          message.status ===
          "sent"
        ) {

          ticks.textContent =
            "✓";

          ticks.style.color =
            "#777777";
        }


        /*
          DELIVERED
          two grey ticks
        */

        else if (
          message.status ===
          "delivered"
        ) {

          ticks.textContent =
            "✓✓";

          ticks.style.color =
            "#777777";

          ticks.style.fontWeight =
            "bold";
        }


        /*
          READ
          two black ticks
        */

        else if (
          message.status ===
          "read"
        ) {

          ticks.textContent =
            "✓✓";

          ticks.style.color =
            "#000000";

          ticks.style.fontWeight =
            "bold";
        }


        ticks.style.marginLeft =
          "5px";

        ticks.style.fontSize =
          "12px";

        time.appendChild(
          ticks
        );
      }


      bubble.appendChild(
        time
      );


      /* REACTION */

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

        reaction.style.marginLeft =
          "6px";

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

      let pressTimer =
        null;

      row.addEventListener(
        "touchstart",
        () => {

          pressTimer =
            setTimeout(
              () => {

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
        () => {
          clearTimeout(
            pressTimer
          );
        }
      );


      row.addEventListener(
        "touchmove",
        () => {
          clearTimeout(
            pressTimer
          );
        }
      );


      container.appendChild(
        row
      );
    }
  );


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
  Object.keys(
    chats
  ).forEach(
    chatId => {

      (
        chats[
          chatId
        ] || []
      ).forEach(
        message => {

          if (
            String(
              message.id
            ) ===
            String(
              messageId
            )
          ) {
            message.reaction =
              reaction;
          }
        }
      );
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
        String(
          message.id
        ) ===
        String(
          selectedMessageId
        )
    );

  if (
    index ===
    -1
  ) {
    closeMessageMenu();

    return;
  }

  const message =
    list[index];

  if (
    !message.mine
  ) {
    alert(
      "You can only unsend your own message."
    );

    closeMessageMenu();

    return;
  }

  const id =
    message.id;

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

  const list =
    chats[
      currentChatUserId
    ] || [];

  const index =
    list.findIndex(
      message =>
        String(
          message.id
        ) ===
        String(
          selectedMessageId
        )
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

  const id =
    selectedMessageId;

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
  Object.keys(
    chats
  ).forEach(
    chatId => {

      chats[
        chatId
      ] =
        (
          chats[
            chatId
          ] || []
        ).filter(
          message =>
            String(
              message.id
            ) !==
            String(
              messageId
            )
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
  "😀","😃","😄","😁",
  "😆","😅","😂","🤣",
  "😊","😇","🙂","🙃",
  "😉","😌","😍","🥰",
  "😘","😗","😋","😛",
  "😎","🤩","🥳","😏",
  "😐","😑","😶","🙄",
  "😬","🤔","😴","🤗",
  "🤭","🤫","😮","😯",
  "😲","😳","🥺","😭",
  "😢","😡","🤬","😱",
  "😨","😰","👍","👎",
  "👏","🙏","💪","❤️",
  "🧡","💛","💚","💙",
  "💜","🖤","🤍","🔥",
  "✨","🎉","💯"
];


function buildEmojiPicker() {
  const picker =
    document.getElementById(
      "emojiPicker"
    );

  if (!picker) {
    return;
  }

  picker.innerHTML =
    "";

  picker.style.display =
    "grid";

  picker.style.gridTemplateColumns =
    "repeat(8, 1fr)";

  picker.style.gap =
    "4px";

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
        "23px";

      button.style.border =
        "none";

      button.style.background =
        "transparent";

      button.style.cursor =
        "pointer";

      button.onclick =
        () => addEmoji(
          emoji
        );

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
    console.warn(
      "emojiPicker element not found in HTML"
    );

    return;
  }

  if (
    picker.children.length ===
    0
  ) {
    buildEmojiPicker();
  }

  picker.classList.toggle(
    "hidden"
  );
}


function addEmoji(
  emoji
) {
  const input =
    document.getElementById(
      "messageInput"
    );

  if (!input) {
    return;
  }

  input.value +=
    emoji;

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

  if (
    !input ||
    !input.files ||
    !input.files[0]
  ) {
    return;
  }

  const file =
    input.files[0];

  if (!currentChatUserId) {
    input.value = "";

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
      "Please select an image or video."
    );

    input.value = "";

    return;
  }

  if (
    file.size >
    50 *
      1024 *
      1024
  ) {
    alert(
      "Media must be under 50 MB."
    );

    input.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload =
    () => {

      const message = {
        id:
          generateMessageId(),

        messageId:
          null,

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
          file.type.startsWith(
            "image/"
          )
            ? "image"
            : "video",

        mimeType:
          file.type,

        data:
          reader.result,

        reaction:
          null
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

      chats[
        currentChatUserId
      ].push(
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

  reader.readAsDataURL(
    file
  );
}


function receiveMedia(
  msg
) {
  const from =
    String(
      msg.from
    ).toUpperCase();

  const id =
    String(
      msg.messageId ||
      msg.id
    );

  if (!chats[from]) {
    chats[from] = [];
  }

  if (
    chats[from].some(
      message =>
        String(
          message.id
        ) === id
    )
  ) {
    return;
  }

  chats[from].push({
    id:
      id,

    messageId:
      id,

    from:
      from,

    to:
      currentUser.id,

    time:
      msg.time ||
      Date.now(),

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

  sendDelivered(
    id
  );

  if (
    currentChatUserId ===
    from
  ) {

    const message =
      chats[
        from
      ].find(
        item =>
          String(
            item.id
          ) === id
      );

    if (message) {
      message.status =
        "read";
    }

    saveChats();

    renderMessages();

    sendRead(
      id
    );

  } else {
    renderFriends();
  }
}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function changeProfilePhoto() {
  const input =
    document.getElementById(
      "profilePhotoInput"
    );

  if (
    !input ||
    !input.files ||
    !input.files[0]
  ) {
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

  if (
    file.size >
    10 *
      1024 *
      1024
  ) {
    alert(
      "Profile photo must be under 10 MB."
    );

    input.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload =
    () => {

      const data =
        reader.result;

      localStorage.setItem(
        "friendchat_profile_photo_" +
          currentUser.id,
        data
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
              data,

            time:
              Date.now()
          })
        );
      }

      input.value = "";
    };

  reader.readAsDataURL(
    file
  );
}


function loadProfilePhoto() {
  if (!currentUser) {
    return;
  }

  const data =
    localStorage.getItem(
      "friendchat_profile_photo_" +
        currentUser.id
    );

  const circle =
    document.getElementById(
      "profileCircle"
    );

  const large =
    document.getElementById(
      "profilePhotoLarge"
    );

  const initial =
    currentUser.name
      .charAt(0)
      .toUpperCase();

  if (circle) {

    circle.style.width =
      "56px";

    circle.style.height =
      "56px";

    circle.style.minWidth =
      "56px";

    circle.style.minHeight =
      "56px";

    circle.style.maxWidth =
      "56px";

    circle.style.maxHeight =
      "56px";

    circle.style.borderRadius =
      "50%";

    circle.style.overflow =
      "hidden";

    circle.style.display =
      "flex";

    circle.style.alignItems =
      "center";

    circle.style.justifyContent =
      "center";

    if (data) {

      circle.innerHTML = `
        <img
          src="${data}"
          alt="Profile"
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


  if (large) {

    if (data) {

      large.innerHTML = `
        <img
          src="${data}"
          alt="Profile"
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

      large.textContent =
        initial;
    }
  }
}


function receiveProfilePhoto(
  msg
) {
  if (!msg) {
    return;
  }

  const userId =
    String(
      msg.userId
    ).toUpperCase();

  if (
    !userId ||
    userId ===
      currentUser?.id
  ) {
    return;
  }

  if (!msg.data) {
    return;
  }

  /*
    Store friend's photo locally.
  */

  localStorage.setItem(
    "friendchat_friend_photo_" +
      userId,
    msg.data
  );

  renderFriends();
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
    newName ===
    null
  ) {
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
   PROFILE MEDIA
   ========================================================= */

function uploadProfileMedia() {
  const input =
    document.getElementById(
      "profileMediaInput"
    );

  if (
    !input ||
    !input.files ||
    !input.files[0]
  ) {
    return;
  }

  const file =
    input.files[0];

  if (
    !file.type.startsWith(
      "image/"
    ) &&
    !file.type.startsWith(
      "video/"
    )
  ) {
    alert(
      "Only images and videos are allowed."
    );

    input.value = "";

    return;
  }

  if (
    file.size >
    50 *
      1024 *
      1024
  ) {
    alert(
      "Maximum file size is 50 MB."
    );

    input.value = "";

    return;
  }

  const reader =
    new FileReader();

  reader.onload =
    () => {

      const key =
        "friendchat_profile_media_" +
        currentUser.id;

      let media = [];

      try {
        media =
          JSON.parse(
            localStorage.getItem(
              key
            )
          ) || [];
      } catch {
        media = [];
      }

      media.push({
        id:
          generateMessageId(),

        type:
          file.type.startsWith(
            "image/"
          )
            ? "image"
            : "video",

        mimeType:
          file.type,

        data:
          reader.result,

        time:
          Date.now()
      });

      localStorage.setItem(
        key,
        JSON.stringify(
          media
        )
      );

      renderProfileMedia();

      input.value = "";
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

  if (!grid || !currentUser) {
    return;
  }

  const key =
    "friendchat_profile_media_" +
    currentUser.id;

  let media = [];

  try {
    media =
      JSON.parse(
        localStorage.getItem(
          key
        )
      ) || [];
  } catch {
    media = [];
  }

  grid.innerHTML =
    "";

  media.forEach(
    item => {

      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.style.width =
        "120px";

      wrapper.style.height =
        "120px";

      wrapper.style.overflow =
        "hidden";

      wrapper.style.borderRadius =
        "10px";

      if (
        item.type ===
        "image"
      ) {

        wrapper.innerHTML = `
          <img
            src="${item.data}"
            style="
              width:100%;
              height:100%;
              object-fit:cover;
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
              height:100%;
              object-fit:cover;
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
   SEARCH
   ========================================================= */

function searchFriends() {
  const input =
    document.getElementById(
      "search"
    );

  const query =
    (
      input?.value ||
      ""
    ).toLowerCase();

  document
    .querySelectorAll(
      "#friendList .friendItem"
    )
    .forEach(
      item => {

        item.style.display =
          item.textContent
            .toLowerCase()
            .includes(
              query
            )
              ? ""
              : "none";
      }
    );
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
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }
    }
  );
}


/* =========================================================
   ADD TABS
   ========================================================= */

function showAddFriendTab() {
  const friend =
    document.getElementById(
      "addFriendTab"
    );

  const group =
    document.getElementById(
      "joinGroupTab"
    );

  if (friend) {
    friend.classList.remove(
      "hidden"
    );
  }

  if (group) {
    group.classList.add(
      "hidden"
    );
  }
}


function showJoinGroupTab() {
  const friend =
    document.getElementById(
      "addFriendTab"
    );

  const group =
    document.getElementById(
      "joinGroupTab"
    );

  if (friend) {
    friend.classList.add(
      "hidden"
    );
  }

  if (group) {
    group.classList.remove(
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
   MESSAGE MENU CLOSE
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
   KEYBOARD ESCAPE
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {
      closeMessageMenu();

      const picker =
        document.getElementById(
          "emojiPicker"
        );

      if (picker) {
        picker.classList.add(
          "hidden"
        );
      }
    }
  }
);


/* =========================================================
   CALL PLACEHOLDERS
   ========================================================= */

function startVoiceCall(
  friendId
) {
  alert(
    "Voice calling is not enabled yet."
  );
}


function startVideoCall(
  friendId
) {
  alert(
    "Video calling is not enabled yet."
  );
}


function endCall() {}

function acceptCall() {}

function rejectCall() {}


/* =========================================================
   START APP
   ========================================================= */

function initializeFriendChat() {

  console.log(
    "Starting FriendChat..."
  );

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


/* =========================================================
   DOM READY
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
