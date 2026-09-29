/* =========================================================
   FRIENDCHAT - COMPLETE APP.JS
   ========================================================= */

// =========================================================
// SERVER CONNECTION
// =========================================================

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;

let socket = null;


// =========================================================
// APP STATE
// =========================================================

let currentUser = null;
let friends = [];
let currentChatUserId = null;
let selectedMessageId = null;

let chats = {};


// =========================================================
// LOCAL STORAGE
// =========================================================

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


// =========================================================
// SCREEN HELPERS
// =========================================================

function hideAllScreens() {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.add("hidden");
    });

}


function showLogin() {

  hideAllScreens();

  document
    .getElementById("loginScreen")
    .classList.remove("hidden");

}


function showSignup() {

  hideAllScreens();

  document
    .getElementById("signupScreen")
    .classList.remove("hidden");

}


function showHome() {

  hideAllScreens();

  document
    .getElementById("homeScreen")
    .classList.remove("hidden");

  currentChatUserId = null;

  sendPresence(null);

  updateHome();

}


function showAdd() {

  hideAllScreens();

  document
    .getElementById("addScreen")
    .classList.remove("hidden");

}


// =========================================================
// ACCOUNT
// =========================================================

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


// =========================================================
// SIGNUP
// =========================================================

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


// =========================================================
// LOGIN
// =========================================================

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


// =========================================================
// LOGOUT
// =========================================================

function logout() {

  sendPresence(null);


  if (socket) {

    socket.close();

    socket = null;

  }


  currentUser = null;

  currentChatUserId = null;

  showLogin();

}


// =========================================================
// HOME
// =========================================================

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


// =========================================================
// WEBSOCKET CONNECTION
// =========================================================

function connectSocket() {

  if (!currentUser) {
    return;
  }


  // Close old connection first

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


  socket = new WebSocket(API);


  // -------------------------------------------------------
  // OPEN
  // -------------------------------------------------------

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

      })
    );


    // Tell server current presence

    sendPresence(
      currentChatUserId
    );

  };


  // -------------------------------------------------------
  // MESSAGE
  // -------------------------------------------------------

  socket.onmessage = async (event) => {

    try {

      const msg =
        JSON.parse(event.data);


      console.log(
        "Server message:",
        msg
      );


      // -----------------------------------------------
      // REGISTERED
      // -----------------------------------------------

      if (msg.type === "registered") {

        console.log(
          "Registered with server:",
          msg.userId
        );

        return;
      }


      // -----------------------------------------------
      // PRESENCE
      // -----------------------------------------------

      if (msg.type === "presence") {

        updatePresence(
          msg.users || {}
        );

        return;
      }


      // -----------------------------------------------
      // TEXT MESSAGE
      // -----------------------------------------------

      if (msg.type === "chat") {

        receiveMessage(msg);

        return;
      }


      // -----------------------------------------------
      // MEDIA
      // -----------------------------------------------

      if (msg.type === "media") {

        receiveMedia(msg);

        return;
      }


      // -----------------------------------------------
      // DELIVERED
      // -----------------------------------------------

      if (msg.type === "delivered") {

        updateMessageStatus(
          msg.messageId,
          "delivered"
        );

        return;
      }


      // -----------------------------------------------
      // READ
      // -----------------------------------------------

      if (msg.type === "read") {

        updateMessageStatus(
          msg.messageId,
          "read"
        );

        return;
      }


      // -----------------------------------------------
      // REACTION
      // -----------------------------------------------

      if (msg.type === "reaction") {

        updateReaction(
          msg.messageId,
          msg.reaction
        );

        return;
      }


      // -----------------------------------------------
      // UNSEND
      // -----------------------------------------------

      if (msg.type === "unsend") {

        removeMessage(
          msg.messageId
        );

        return;
      }


      // -----------------------------------------------
      // DELETE
      // -----------------------------------------------

      if (msg.type === "server_delete") {

        removeMessage(
          msg.messageId
        );

        return;
      }


      // -----------------------------------------------
      // DELIVERY ERROR
      // -----------------------------------------------

      if (msg.type === "delivery_error") {

        console.log(
          "Delivery error:",
          msg.reason
        );

        return;
      }


      // -----------------------------------------------
      // MEDIA ERROR
      // -----------------------------------------------

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


  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  socket.onerror = (error) => {

    console.error(
      "FriendChat WebSocket error:",
      error
    );

  };


  // -------------------------------------------------------
  // CLOSED
  // -------------------------------------------------------

  socket.onclose = () => {

    console.log(
      "FriendChat WebSocket disconnected"
    );

  };

}


// =========================================================
// PRESENCE
// =========================================================

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

  // Update open chat header

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
    socket.readyState !== WebSocket.OPEN
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


// =========================================================
// FRIEND LIST
// =========================================================

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
      <div class="muted" style="padding:20px;text-align:center;">
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
          ${escapeHtml(friend.name)}
        </div>

        <div class="friendId">
          ${escapeHtml(friend.id)}
        </div>

        <div
          class="presenceText ${status}"
        >
          ${presenceLabel(status)}
        </div>

      </div>

    `;


    list.appendChild(item);

  });

}


// =========================================================
// ADD FRIEND
// =========================================================

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


// =========================================================
// OPEN CHAT
// =========================================================

function openChat(friend) {

  currentChatUserId =
    friend.id;


  hideAllScreens();


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


  if (!chats[currentChatUserId]) {

    chats[currentChatUserId] = [];

  }


  renderMessages();


  sendPresence(
    currentChatUserId
  );

}


// =========================================================
// MESSAGE ID
// =========================================================

function generateMessageId() {

  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


// =========================================================
// SEND TEXT MESSAGE
// =========================================================

function sendMessage() {

  if (!currentUser) {
    return;
  }


  if (!currentChatUserId) {
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


// =========================================================
// RECEIVE TEXT MESSAGE
// =========================================================

function receiveMessage(msg) {

  const from =
    String(msg.from).toUpperCase();


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

    text:
      msg.text,

    time:
      msg.time,

    status:
      "delivered",

    mine:
      false

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


  if (
    currentChatUserId === from
  ) {

    renderMessages();


    // Tell sender message was delivered

    sendDelivered(
      message.id
    );


    // Tell sender it was read

    sendRead(
      message.id
    );

  } else {

    sendDelivered(
      message.id
    );

  }

}


// =========================================================
// DELIVERED
// =========================================================

function sendDelivered(messageId) {

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    return;
  }


  socket.send(
    JSON.stringify({

      type: "delivered",

      messageId:
        messageId

    })
  );

}


// =========================================================
// READ
// =========================================================

function sendRead(messageId) {

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    return;
  }


  socket.send(
    JSON.stringify({

      type: "read",

      messageId:
        messageId

    })
  );

}


// =========================================================
// MESSAGE STATUS
// =========================================================

function updateMessageStatus(
  messageId,
  status
) {

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

    }

  }


  saveChats();


  if (currentChatUserId) {

    renderMessages();

  }

}


// =========================================================
// RENDER MESSAGES
// =========================================================

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

      if (message.status === "read") {

        status =
          '<span class="messageStatus">✓✓</span>';

      } else if (
        message.status === "delivered"
      ) {

        status =
          '<span class="messageStatus">✓✓</span>';

      } else {

        status =
          '<span class="messageStatus">✓</span>';

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
            <span class="messageReaction">
              ${escapeHtml(
                message.reaction
              )}
            </span>
          `
          : ""
      }

    `;


    bubble.addEventListener(
      "contextmenu",
      event => {

        event.preventDefault();

        openMessageMenu(
          message.id
        );

      }
    );


    container.appendChild(
      bubble
    );

  });


  container.scrollTop =
    container.scrollHeight;

}


// =========================================================
// MEDIA
// =========================================================

async function sendMedia() {

  if (!currentUser) {
    return;
  }


  if (!currentChatUserId) {
    return;
  }


  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
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


  /*
    Keep the existing safety limit.
  */

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
      file.type.startsWith("image/")
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


  reader.readAsDataURL(file);

}


// =========================================================
// RECEIVE MEDIA
// =========================================================

function receiveMedia(msg) {

  const from =
    String(msg.from).toUpperCase();


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
      msg.time,

    media:
      msg.data,

    mediaType:
      msg.mediaType,

    fileName:
      msg.fileName,

    status:
      "delivered",

    mine:
      false

  };


  const exists =
    chats[from].some(
      item =>
        item.id === message.id
    );


  if (!exists) {

    chats[from].push(
      message
    );

  }


  saveChats();


  if (
    currentChatUserId === from
  ) {

    renderMessages();

  }


  sendDelivered(
    message.id
  );

}


// =========================================================
// REACTIONS
// =========================================================

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


  document
    .getElementById("messageMenu")
    .classList.remove("hidden");

}


function closeMessageMenu() {

  document
    .getElementById("messageMenu")
    .classList.add("hidden");

  selectedMessageId = null;

}


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
          item.id === messageId
      );


    if (message) {

      message.reaction =
        reaction;

    }

  }


  saveChats();


  renderMessages();

}


// =========================================================
// UNSEND
// =========================================================

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


// =========================================================
// DELETE
// =========================================================

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


// =========================================================
// REMOVE MESSAGE
// =========================================================

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
      );

  }


  saveChats();


  if (currentChatUserId) {

    renderMessages();

  }

}


// =========================================================
// EMOJI PICKER
// =========================================================

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
    picker.children.length === 0
  ) {

    emojis.forEach(emoji => {

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

    });

  }


  picker.classList.toggle(
    "hidden"
  );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// =========================================================
// AUTOMATIC PRESENCE REFRESH
// =========================================================

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

      type: "presence_chat",

      chatWith:
        currentChatUserId
          ? String(
              currentChatUserId
            ).toUpperCase()
          : null

    })
  );

}, 10000);


// =========================================================
// CLOSE MESSAGE MENU WHEN CLICKING OUTSIDE
// =========================================================

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


// =========================================================
// START APP
// =========================================================

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
