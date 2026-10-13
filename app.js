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
           MEDIA
           ----------------------------------------------- */

        if (
          msg.type ===
          "media"
        ) {

          receiveMedia(
            msg
          );

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

        content =
          `<div class="fc-message-text">
             ${escapeHtml(
               message.text ||
               ""
             )}
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


  const file =
    input?.files?.[0];


  if (!file) {
    return;
  }


  if (
    file.size >
    20 * 1024 * 1024
  ) {

    alert(
      "Maximum file size is 20 MB."
    );

    input.value =
      "";

    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      const id =
        generateMessageId();


      const mediaType =
        file.type.startsWith(
          "image/"
        )
          ? "image"
          : "video";


      const message = {

        id:
          id,

        messageId:
          id,

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
            id,

          messageId:
            id,

          from:
            currentUser.id,

          to:
            currentChatUserId,

          data:
            reader.result,

          mediaType:
            mediaType,

          mimeType:
            file.type,

          name:
            file.name,

          size:
            file.size,

          time:
            message.time
        })
      );


      input.value =
        "";
    };


  reader.readAsDataURL(
    file
  );
}


function receiveMedia(
  msg
) {

  const from =
    normalizeId(
      msg.from
    );


  const id =
    String(
      msg.messageId ||
      msg.id
    );


  if (
    !chats[from]
  ) {
    chats[from] = [];
  }


  const isOpen =
    currentChatUserId ===
    from;


  const message = {

    id:
      id,

    messageId:
      id,

    from:
      from,

    to:
      currentUser.id,

    media:
      msg.data,

    mediaType:
      msg.mediaType,

    fileName:
      msg.name,

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
        ) === id
    );


  if (!exists) {

    chats[from].push(
      message
    );
  }


  saveChats();

  sendDelivered(
    id
  );


  if (isOpen) {

    sendRead(
      id
    );
  }


  renderMessages();
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
    50 * 1024 * 1024
  ) {

    alert(
      "Maximum file size is 50 MB."
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
