/* =========================================================
   FRIENDCHAT - COMPLETE APP.JS
   FEATURES 1 - 11
   ========================================================= */

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;


/* =========================================================
   STATE
   ========================================================= */

let socket = null;
let currentUser = null;
let friends = [];
let chats = {};
let currentChatUserId = null;
let selectedMessageId = null;

const presenceState = {};


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
   FRIEND ID
   ========================================================= */

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
      emailInput.focus();
      return;
    }


    if (!password) {
      status.textContent =
        "Enter your password.";
      passwordInput.focus();
      return;
    }


    const account =
      loadAccount();


    if (!account) {

      status.textContent =
        "No account found on this device. Create an account first.";

      return;
    }


    if (
      email.toLowerCase() !==
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

    showHome();

    connectSocket();

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

  showLogin();
}


/* =========================================================
   UPDATE HOME
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

    socket = null;
  }


  console.log(
    "Connecting:",
    API
  );


  try {

    socket =
      new WebSocket(API);

  } catch (error) {

    console.error(
      "WebSocket creation error:",
      error
    );

    return;
  }


  socket.onopen =
    function () {

      console.log(
        "WebSocket connected"
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


  socket.onclose =
    function () {

      console.log(
        "WebSocket disconnected"
      );
    };


  socket.onerror =
    function (error) {

      console.error(
        "WebSocket error:",
        error
      );
    };


  socket.onmessage =
    function (event) {

      try {

        const msg =
          JSON.parse(
            event.data
          );

        handleSocketMessage(
          msg
        );

      } catch (error) {

        console.error(
          "Socket message error:",
          error
        );
      }
    };
}


/* =========================================================
   SOCKET MESSAGE HANDLER
   ========================================================= */

function handleSocketMessage(
  msg
) {

  if (
    !msg ||
    !msg.type
  ) {
    return;
  }


  switch (msg.type) {

    case "registered":

      console.log(
        "Registered:",
        msg.userId
      );

      break;


    case "presence":

      handlePresence(
        msg
      );

      break;


    case "friend_request":

      handleFriendRequest(
        msg
      );

      break;


    case "friend_added":

      handleFriendAdded(
        msg
      );

      break;


    case "chat":
    case "message":

      receiveMessage(
        msg
      );

      break;


    case "delivered":
    case "message_delivered":

      updateMessageStatus(
        msg.messageId,
        "delivered"
      );

      break;


    case "read":
    case "message_seen":

      updateMessageStatus(
        msg.messageId,
        "read"
      );

      break;


    case "media":

      receiveMedia(
        msg
      );

      break;


    case "reaction":

      updateReaction(
        msg.messageId,
        msg.reaction
      );

      break;


    case "unsend":

      removeMessage(
        msg.messageId
      );

      break;


    case "delete_message":

      removeMessage(
        msg.messageId
      );

      break;


    case "profile_photo":

      break;


    default:

      console.log(
        "Unknown message:",
        msg
      );
  }
}


/* =========================================================
   PRESENCE
   ========================================================= */

function handlePresence(
  msg
) {

  if (!msg.userId) {
    return;
  }


  const id =
    String(
      msg.userId
    ).toUpperCase();


  presenceState[id] = {

    status:
      msg.status ||
      "offline",

    chatWith:
      msg.chatWith ||
      null

  };


  renderFriends();


  if (
    currentChatUserId ===
    id
  ) {

    const status =
      document.getElementById(
        "chatStatus"
      );

    if (status) {
      status.textContent =
        presenceLabel(
          msg.status
        );
    }
  }
}


function getPresence(
  id
) {

  return (
    presenceState[
      String(
        id
      ).toUpperCase()
    ] || {

      status:
        "offline",

      chatWith:
        null
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


/* =========================================================
   FRIEND LIST
   ========================================================= */

function renderFriends() {

  const container =
    document.getElementById(
      "friendsList"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (
    friends.length ===
    0
  ) {

    container.innerHTML = `
      <div class="emptyState">
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


      const initial =
        friend.name
          ? friend.name
              .charAt(0)
              .toUpperCase()
          : "?";


      const status =
        getPresence(
          friend.id
        );


      item.innerHTML = `

        <div class="friendAvatar">
          ${escapeHtml(
            initial
          )}
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
              status.status
            )}
          </div>

        </div>

      `;


      item.onclick =
        function () {

          openChat(
            friend
          );
        };


      container.appendChild(
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
        "Enter a FriendChat ID.";
    }

    return;
  }


  if (
    currentUser &&
    id ===
      String(
        currentUser.id
      ).toUpperCase()
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

function openChat(
  friend
) {

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
}


/* =========================================================
   MESSAGE ID
   ========================================================= */

function generateMessageId() {

  return (
    Date.now()
      .toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );
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
        "chat",

      id:
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
}


/* =========================================================
   RECEIVE TEXT
   ========================================================= */

function receiveMessage(
  msg
) {

  const from =
    String(
      msg.from
    ).toUpperCase();


  if (!chats[from]) {
    chats[from] = [];
  }


  const isOpen =
    currentChatUserId ===
    from;


  const message = {

    id:
      msg.id,

    from:
      from,

    to:
      currentUser.id,

    text:
      msg.text || "",

    time:
      msg.time || Date.now(),

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
}


/* =========================================================
   DELIVERED
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
        messageId

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


/* =========================================================
   STATUS
   ========================================================= */

function updateMessageStatus(
  messageId,
  status
) {

  for (
    const chatId in chats
  ) {

    const message =
      chats[
        chatId
      ].find(
        item =>
          item.id ===
          messageId
      );


    if (message) {

      message.status =
        status;
    }
  }


  saveChats();

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


  container.innerHTML = "";


  if (!currentChatUserId) {
    return;
  }


  const messages =
    chats[
      currentChatUserId
    ] || [];


  messages.forEach(
    message => {

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
              alt="Photo"
              style="
                max-width:100%;
                border-radius:10px;
              "
            >
          `;

        } else {

          content = `
            <video
              controls
              src="${message.media}"
              style="
                max-width:100%;
              "
            ></video>
          `;
        }

      } else {

        content =
          escapeHtml(
            message.text
          );
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
            '<span class="messageStatus readTicks">✓✓</span>';

        } else if (
          message.status ===
          "delivered"
        ) {

          ticks =
            '<span class="messageStatus deliveredTicks">✓✓</span>';

        } else {

          ticks =
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
          }
        );


      bubble.innerHTML = `

        <div>
          ${content}
        </div>

        <div class="messageTime">
          ${time}
          ${ticks}
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
        function (event) {

          event.preventDefault();

          openMessageMenu(
            message.id
          );
        }
      );


      /* LONG PRESS */

      let timer = null;


      bubble.addEventListener(
        "touchstart",
        function () {

          timer =
            setTimeout(
              function () {

                openMessageMenu(
                  message.id
                );

              },
              550
            );
        }
      );


      bubble.addEventListener(
        "touchend",
        function () {

          if (timer) {

            clearTimeout(
              timer
            );

            timer = null;
          }
        }
      );


      bubble.addEventListener(
        "touchmove",
        function () {

          if (timer) {

            clearTimeout(
              timer
            );

            timer = null;
          }
        }
      );


      container.appendChild(
        bubble
      );
    }
  );


  container.scrollTop =
    container.scrollHeight;
}


/* =========================================================
   SEND PHOTO / VIDEO
   ========================================================= */

function sendMedia() {

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

    alert(
      "Not connected to server."
    );

    return;
  }


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


  reader.onload =
    function () {

      const mediaType =
        file.type.startsWith(
          "image/"
        )
          ? "image"
          : "video";


      const message = {

        id:
          generateMessageId(),

        from:
          currentUser.id,

        to:
          currentChatUserId,

        time:
          Date.now(),

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

          time:
            message.time,

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


  reader.readAsDataURL(
    file
  );
}


/* =========================================================
   RECEIVE PHOTO / VIDEO
   ========================================================= */

function receiveMedia(
  msg
) {

  const from =
    String(
      msg.from
    ).toUpperCase();


  if (!chats[from]) {
    chats[from] = [];
  }


  const isOpen =
    currentChatUserId ===
    from;


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
      msg.data,

    mediaType:
      msg.mediaType,

    fileName:
      msg.fileName,

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


  const id =
    selectedMessageId;


  for (
    const chatId in chats
  ) {

    const message =
      chats[
        chatId
      ].find(
        item =>
          item.id === id
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

        messageId:
          id,

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
      chats[
        chatId
      ].find(
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

  renderMessages();
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


  for (
    const chatId in chats
  ) {

    chats[
      chatId
    ] =
      chats[
        chatId
      ].filter(
        message =>
          !(
            message.id === id &&
            message.mine
          )
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

  if (!selectedMessageId) {
    return;
  }


  const id =
    selectedMessageId;


  for (
    const chatId in chats
  ) {

    chats[
      chatId
    ] =
      chats[
        chatId
      ].filter(
        message =>
          message.id !== id
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


/* =========================================================
   REMOVE MESSAGE FROM RECEIVER
   ========================================================= */

function removeMessage(
  messageId
) {

  for (
    const chatId in chats
  ) {

    chats[
      chatId
    ] =
      chats[
        chatId
      ].filter(
        message =>
          message.id !==
          messageId
      );
  }


  saveChats();

  renderMessages();
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
  "💯",
  "🤣",
  "😅",
  "😉",
  "😇",
  "🤩",
  "😴",
  "🤯",
  "🥳",
  "😈",
  "👀",
  "💔",
  "❤️‍🔥",
  "✨",
  "⭐",
  "💪",
  "🤝"

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


        button.style.fontSize =
          "22px";


        button.style.border =
          "none";


        button.style.background =
          "transparent";


        button.style.cursor =
          "pointer";


        button.onclick =
          function () {

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
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )

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
   AUTO PRESENCE
   ========================================================= */

setInterval(
  function () {

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

  },
  10000
);


/* =========================================================
   CLOSE MENU WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {

    const menu =
      document.getElementById(
        "messageMenu"
      );


    if (
      menu &&
      !menu.classList.contains(
        "hidden"
      ) &&
      event.target ===
        menu
    ) {

      closeMessageMenu();
    }
  }
);


/* =========================================================
   ENTER TO SEND
   ========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key !==
      "Enter"
    ) {
      return;
    }


    const input =
      document.getElementById(
        "messageInput"
      );


    if (
      document.activeElement ===
      input
    ) {

      if (
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();
      }
    }
  }
);


/* =========================================================
   START APP
   ========================================================= */

(function () {

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
