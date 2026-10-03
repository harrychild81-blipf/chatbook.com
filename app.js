// FriendChat - app.js
// Complete current application code

let currentUser = null;
let friends = [];
let chats = {};
let socket = null;
let currentChatUserId = null;
let selectedMessageId = null;
let presence = {};
let reconnectTimer = null;
let reconnectAttempts = 0;

// =====================================================
// STORAGE
// =====================================================

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

function saveFriends() {
  localStorage.setItem(
    "friendchat_friends",
    JSON.stringify(friends)
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

function saveChats() {
  localStorage.setItem(
    "friendchat_chats",
    JSON.stringify(chats)
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

// =====================================================
// HELPERS
// =====================================================

function normalizeId(id) {
  return String(id || "")
    .trim()
    .toUpperCase();
}

function generateFriendId() {
  return (
    "FC-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getElement(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = getElement(id);
  if (el) {
    el.textContent = value ?? "";
  }
}

// =====================================================
// SCREEN NAVIGATION
// =====================================================

function hideAllScreens() {
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });
}

function showScreen(id) {
  hideAllScreens();

  const screen = getElement(id);

  if (screen) {
    screen.classList.add("active");
  }
}

function showLogin() {
  showScreen("loginScreen");
}

function showSignup() {
  showScreen("signupScreen");
}

function showHome() {
  showScreen("homeScreen");

  updateHome();
  renderFriends();
}

function showAdd() {
  showScreen("addScreen");

  const input = getElement("addId");

  if (input) {
    input.value = "";
    input.focus();
  }
}

function showChat(userId) {
  const id = normalizeId(userId);

  if (!id) {
    return;
  }

  currentChatUserId = id;

  showScreen("chatScreen");

  const friend = friends.find(
    friend =>
      normalizeId(friend.id) === id
  );

  const name =
    friend?.name ||
    presence[id]?.name ||
    id;

  setText("chatName", name);
  setText("chatId", id);

  renderMessages();
  notifyPresenceChat(id);
}

// =====================================================
// ACCOUNT / LOGIN
// =====================================================

async function login() {
  const emailInput =
    getElement("loginEmail");

  const passwordInput =
    getElement("loginPassword");

  const status =
    getElement("loginStatus");

  if (
    !emailInput ||
    !passwordInput
  ) {
    return;
  }

  const email =
    emailInput.value
      .trim()
      .toLowerCase();

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
    email !==
    String(account.email || "")
      .toLowerCase()
  ) {
    if (status) {
      status.textContent =
        "Wrong email.";
    }

    return;
  }

  if (
    password !==
    String(account.password || "")
  ) {
    if (status) {
      status.textContent =
        "Wrong password.";
    }

    return;
  }

  currentUser = account;

  loadFriends();
  loadChats();

  updateHome();

  // Register the existing local account
  // with the server so it can appear in
  // suggestions even when offline later.
  await registerAccountOnServer();

  connectSocket();

  showHome();
}

async function registerAccountOnServer() {
  if (!currentUser) {
    return false;
  }

  try {
    const response =
      await fetch(
        "/api/register-user",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            id: currentUser.id,
            name: currentUser.name
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      console.error(
        "SERVER ACCOUNT REGISTRATION:",
        data
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "ACCOUNT REGISTRATION ERROR:",
      error
    );

    return false;
  }
}

// =====================================================
// SIGNUP
// =====================================================

async function signup() {
  const nameInput =
    getElement("signupName");

  const emailInput =
    getElement("signupEmail");

  const passwordInput =
    getElement("signupPassword");

  const status =
    getElement("signupStatus");

  if (
    !nameInput ||
    !emailInput ||
    !passwordInput
  ) {
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
    id: generateFriendId(),
    name: name,
    email: email,
    password: password
  };

  // Register permanently on server
  // BEFORE saving locally.
  try {
    const response =
      await fetch(
        "/api/register-user",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            id: account.id,
            name: account.name
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      console.error(
        "SERVER ACCOUNT REGISTRATION:",
        data
      );

      if (status) {
        status.textContent =
          data.message ||
          "Could not create account on server.";
      }

      return;
    }
  } catch (error) {
    console.error(
      "ACCOUNT REGISTRATION ERROR:",
      error
    );

    if (status) {
      status.textContent =
        "Could not connect to FriendChat server.";
    }

    return;
  }

  saveAccount(account);

  currentUser = account;

  friends = [];
  chats = {};

  saveFriends();
  saveChats();

  connectSocket();

  showHome();
}

// =====================================================
// LOGOUT
// =====================================================

function logout() {
  if (socket) {
    try {
      socket.close();
    } catch {}

    socket = null;
  }

  currentUser = null;
  currentChatUserId = null;
  selectedMessageId = null;

  presence = {};

  showLogin();
}

// =====================================================
// HOME
// =====================================================

function updateHome() {
  if (!currentUser) {
    return;
  }

  setText(
    "myName",
    currentUser.name
  );

  setText(
    "myId",
    currentUser.id
  );

  setText(
    "myIdLabel",
    currentUser.id
  );

  const profileCircle =
    getElement("profileCircle");

  if (profileCircle) {
    profileCircle.textContent =
      String(
        currentUser.name || "F"
      )
        .trim()
        .charAt(0)
        .toUpperCase() || "F";
  }
}

// =====================================================
// PROFILE
// =====================================================

function editProfileName() {
  if (!currentUser) {
    return;
  }

  const newName =
    prompt(
      "Enter your new name:",
      currentUser.name || ""
    );

  if (newName === null) {
    return;
  }

  const name =
    newName.trim();

  if (!name) {
    return;
  }

  currentUser.name = name;

  saveAccount(currentUser);

  updateHome();

  registerSocket();

  // Update server account name too.
  registerAccountOnServer();

  renderFriends();
}

function getInitial(name) {
  return (
    String(name || "F")
      .trim()
      .charAt(0)
      .toUpperCase() || "F"
  );
}

// =====================================================
// FRIENDS
// =====================================================

function renderFriends() {
  const container =
    getElement("friendsList");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!friends.length) {
    container.innerHTML =
      `
      <div class="empty-state">
        No friends yet
      </div>
      `;

    return;
  }

  friends.forEach(friend => {
    const id =
      normalizeId(friend.id);

    const info =
      presence[id] || {};

    const online =
      !!info.online ||
      info.status === "active";

    const name =
      friend.name ||
      info.name ||
      id;

    const item =
      document.createElement("div");

    item.className =
      "friend-item";

    item.innerHTML = `
      <div class="friend-avatar">
        ${escapeHtml(
          getInitial(name)
        )}
      </div>

      <div class="friend-info">
        <div class="friend-name">
          ${escapeHtml(name)}
        </div>

        <div class="friend-id">
          ${escapeHtml(id)}
        </div>
      </div>

      <div class="friend-status ${
        online
          ? "online"
          : "offline"
      }">
        ${online
          ? "Online"
          : "Offline"}
      </div>
    `;

    item.onclick = () =>
      showChat(id);

    container.appendChild(item);
  });
}

// =====================================================
// ADD FRIEND
// =====================================================

async function addById() {
  const input =
    getElement("addId");

  const status =
    getElement("addStatus");

  if (!input) {
    return;
  }

  const id =
    normalizeId(input.value);

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
      normalizeId(currentUser.id)
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
        normalizeId(friend.id) === id
    )
  ) {
    if (status) {
      status.textContent =
        "Friend already added.";
    }

    return;
  }

  try {
    const response =
      await fetch(
        "/api/user/" +
          encodeURIComponent(id)
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.found ||
      !data.user
    ) {
      if (status) {
        status.textContent =
          "FriendChat ID not found.";
      }

      return;
    }

    const friend = {
      id: normalizeId(
        data.user.id
      ),
      name:
        data.user.name ||
        "Friend"
    };

    friends.push(friend);

    saveFriends();

    renderFriends();

    if (status) {
      status.textContent =
        "Friend added successfully.";
    }

    input.value = "";
  } catch (error) {
    console.error(
      "ADD FRIEND ERROR:",
      error
    );

    if (status) {
      status.textContent =
        "Could not connect to server.";
    }
  }
}

// =====================================================
// CHAT STORAGE
// =====================================================

function getChatKey(userId) {
  return normalizeId(userId);
}

function getChat(userId) {
  const key =
    getChatKey(userId);

  if (!Array.isArray(chats[key])) {
    chats[key] = [];
  }

  return chats[key];
}

function saveChat(userId) {
  const key =
    getChatKey(userId);

  if (!Array.isArray(chats[key])) {
    chats[key] = [];
  }

  saveChats();
}

// =====================================================
// MESSAGE ID
// =====================================================

function generateMessageId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
  ).toUpperCase();
}

// =====================================================
// SEND MESSAGE
// =====================================================

function sendMessage() {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }

  const input =
    getElement("messageInput");

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
    from: normalizeId(
      currentUser.id
    ),
    to: normalizeId(
      currentChatUserId
    ),
    text: text,
    time: Date.now(),
    delivered: false,
    read: false
  };

  const chat =
    getChat(currentChatUserId);

  chat.push(message);

  saveChat(currentChatUserId);

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
        id: message.id,
        messageId: message.id,
        from: message.from,
        to: message.to,
        text: message.text,
        time: message.time
      })
    );
  }
}

// =====================================================
// MESSAGE RENDERING
// =====================================================

function renderMessages() {
  const container =
    getElement("messages");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!currentChatUserId) {
    return;
  }

  const chat =
    getChat(currentChatUserId);

  const myId =
    normalizeId(
      currentUser?.id
    );

  chat.forEach(message => {
    /*
      IMPORTANT:
      Never trust message.mine after reload.

      The sender ID determines which side
      the message belongs to.
    */
    const senderId =
      normalizeId(
        message.from
      );

    const isMine =
      senderId === myId;

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "message-wrapper " +
      (isMine
        ? "mine"
        : "theirs");

    const bubble =
      document.createElement("div");

    bubble.className =
      "message-bubble";

    let content = "";

    if (message.deleted) {
      content =
        `<div class="deleted-message">
          Message deleted
        </div>`;
    } else if (
      message.mediaType
    ) {
      content =
        renderMediaMessage(
          message
        );
    } else {
      content =
        `<div class="message-text">
          ${escapeHtml(
            message.text || ""
          )}
        </div>`;
    }

    let reactionHtml = "";

    if (message.reaction) {
      reactionHtml = `
        <div class="message-reaction">
          ${escapeHtml(
            message.reaction
          )}
        </div>
      `;
    }

    let ticks = "";

    if (isMine) {
      if (message.read) {
        ticks =
          `<span class="message-ticks seen">✓✓</span>`;
      } else if (
        message.delivered
      ) {
        ticks =
          `<span class="message-ticks">✓✓</span>`;
      } else {
        ticks =
          `<span class="message-ticks">✓</span>`;
      }
    }

    const time =
      message.time
        ? new Date(
            message.time
          ).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          )
        : "";

    bubble.innerHTML = `
      ${content}
      ${reactionHtml}

      <div class="message-meta">
        <span class="message-time">
          ${escapeHtml(time)}
        </span>

        ${ticks}
      </div>
    `;

    bubble.onclick = event => {
      event.stopPropagation();

      openMessageMenu(
        message.id
      );
    };

    wrapper.appendChild(bubble);

    container.appendChild(
      wrapper
    );
  });

  container.scrollTop =
    container.scrollHeight;

  markChatMessagesRead();
}

// =====================================================
// MEDIA MESSAGE RENDERING
// =====================================================

function renderMediaMessage(message) {
  const type =
    String(
      message.mediaType || ""
    ).toLowerCase();

  const data =
    message.data || "";

  if (!data) {
    return `
      <div class="media-unavailable">
        Media unavailable
      </div>
    `;
  }

  if (
    type.startsWith("image")
  ) {
    return `
      <img
        class="chat-media-image"
        src="${escapeHtml(data)}"
        alt="${escapeHtml(
          message.name || "Image"
        )}"
      >
    `;
  }

  if (
    type.startsWith("video")
  ) {
    return `
      <video
        class="chat-media-video"
        controls
        src="${escapeHtml(data)}"
      ></video>
    `;
  }

  return `
    <div class="media-file">
      ${escapeHtml(
        message.name ||
          "File"
      )}
    </div>
  `;
}

// =====================================================
// MESSAGE MENU
// =====================================================

function openMessageMenu(messageId) {
  selectedMessageId =
    String(messageId);

  const menu =
    getElement("messageMenu");

  if (menu) {
    menu.classList.add(
      "active"
    );
  }
}

function closeMessageMenu() {
  selectedMessageId = null;

  const menu =
    getElement("messageMenu");

  if (menu) {
    menu.classList.remove(
      "active"
    );
  }
}

// =====================================================
// REACTION
// =====================================================

function reactToMessage(reaction) {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    return;
  }

  const id =
    String(
      selectedMessageId
    );

  const chat =
    getChat(currentChatUserId);

  const message =
    chat.find(
      item =>
        String(item.id) === id
    );

  if (!message) {
    closeMessageMenu();
    return;
  }

  message.reaction =
    String(reaction || "");

  saveChat(
    currentChatUserId
  );

  renderMessages();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "reaction",
        id: id,
        messageId: id,
        reaction:
          message.reaction
      })
    );
  }

  closeMessageMenu();
}

// =====================================================
// UNSEND
// =====================================================

function unsendSelectedMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId ||
    !currentUser
  ) {
    return;
  }

  const id =
    String(
      selectedMessageId
    );

  const chat =
    getChat(currentChatUserId);

  const index =
    chat.findIndex(
      message =>
        String(message.id) === id
    );

  if (index === -1) {
    closeMessageMenu();
    return;
  }

  const message =
    chat[index];

  const myId =
    normalizeId(
      currentUser.id
    );

  if (
    normalizeId(
      message.from
    ) !== myId
  ) {
    closeMessageMenu();
    return;
  }

  /*
    Unsend removes it from the
    sender's local chat and tells
    the other user to remove it.
  */
  chat.splice(index, 1);

  saveChat(
    currentChatUserId
  );

  renderMessages();

  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "unsend",
        id: id,
        messageId: id
      })
    );
  }

  closeMessageMenu();
}

// =====================================================
// DELETE
// =====================================================

function deleteSelectedMessage() {
  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    return;
  }

  const id =
    String(
      selectedMessageId
    );

  const chat =
    getChat(currentChatUserId);

  const message =
    chat.find(
      item =>
        String(item.id) === id
    );

  if (!message) {
    closeMessageMenu();
    return;
  }

  /*
    Delete locally.
  */
  message.deleted = true;
  message.text = "";
  message.data = null;

  saveChat(
    currentChatUserId
  );

  renderMessages();

  /*
    Also tell server so it can
    remove its stored record.
  */
  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "server_delete",
        id: id,
        messageId: id
      })
    );
  }

  closeMessageMenu();
}

// =====================================================
// MEDIA PICKER
// =====================================================

function chooseMedia() {
  const input =
    getElement("mediaInput");

  if (input) {
    input.click();
  }
}

function handleMediaSelected(event) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  sendMediaFile(file);

  event.target.value = "";
}

function sendMediaFile(file) {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }

  const maxSize =
    25 * 1024 * 1024;

  if (file.size > maxSize) {
    alert(
      "File is too large. Maximum size is 25 MB."
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {
    const message = {
      id: generateMessageId(),
      from: normalizeId(
        currentUser.id
      ),
      to: normalizeId(
        currentChatUserId
      ),
      time: Date.now(),
      mediaType:
        file.type || "application/octet-stream",
      mimeType:
        file.type || "",
      name:
        file.name || "File",
      size: file.size,
      data:
        reader.result,
      delivered: false,
      read: false
    };

    const chat =
      getChat(
        currentChatUserId
      );

    chat.push(message);

    saveChat(
      currentChatUserId
    );

    renderMessages();

    if (
      socket &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "media",
          id: message.id,
          messageId: message.id,
          from: message.from,
          to: message.to,
          time: message.time,
          mediaType:
            message.mediaType,
          mimeType:
            message.mimeType,
          name:
            message.name,
          size:
            message.size,
          data:
            message.data
        })
      );
    }
  };

  reader.onerror = () => {
    alert(
      "Could not read this file."
    );
  };

  reader.readAsDataURL(file);
}

// =====================================================
// READ / SEEN
// =====================================================

function markChatMessagesRead() {
  if (
    !currentUser ||
    !currentChatUserId
  ) {
    return;
  }

  const chat =
    getChat(currentChatUserId);

  const myId =
    normalizeId(
      currentUser.id
    );

  let changed = false;

  chat.forEach(message => {
    const from =
      normalizeId(
        message.from
      );

    if (
      from !== myId &&
      !message.read
    ) {
      message.read = true;
      changed = true;

      if (
        socket &&
        socket.readyState ===
          WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "read",
            id: message.id,
            messageId:
              message.id
          })
        );
      }
    }
  });

  if (changed) {
    saveChat(
      currentChatUserId
    );
  }
}

// =====================================================
// PRESENCE
// =====================================================

function notifyPresenceChat(userId) {
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
        normalizeId(userId)
    })
  );
}

function clearPresenceChat() {
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
      chatWith: null
    })
  );
}

// =====================================================
// WEBSOCKET
// =====================================================

function getWebSocketUrl() {
  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  return (
    protocol +
    "//" +
    location.host
  );
}

function connectSocket() {
  if (!currentUser) {
    return;
  }

  if (
    socket &&
    (
      socket.readyState ===
        WebSocket.OPEN ||
      socket.readyState ===
        WebSocket.CONNECTING
    )
  ) {
    return;
  }

  try {
    socket =
      new WebSocket(
        getWebSocketUrl()
      );
  } catch (error) {
    console.error(
      "WebSocket creation error:",
      error
    );

    scheduleReconnect();

    return;
  }

  socket.addEventListener(
    "open",
    () => {
      console.log(
        "FriendChat WebSocket connected."
      );

      reconnectAttempts = 0;

      registerSocket();
    }
  );

  socket.addEventListener(
    "message",
    event => {
      handleSocketMessage(
        event.data
      );
    }
  );

  socket.addEventListener(
    "close",
    () => {
      console.log(
        "FriendChat WebSocket disconnected."
      );

      socket = null;

      if (currentUser) {
        scheduleReconnect();
      }
    }
  );

  socket.addEventListener(
    "error",
    error => {
      console.error(
        "FriendChat WebSocket error:",
        error
      );
    }
  );
}

function scheduleReconnect() {
  if (
    !currentUser ||
    reconnectTimer
  ) {
    return;
  }

  const delay =
    Math.min(
      10000,
      1000 *
        Math.max(
          1,
          reconnectAttempts + 1
        )
    );

  reconnectAttempts++;

  reconnectTimer =
    setTimeout(() => {
      reconnectTimer = null;

      connectSocket();
    }, delay);
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
      type: "register",
      userId:
        currentUser.id,
      name:
        currentUser.name
    })
  );
}

// =====================================================
// SOCKET MESSAGE HANDLER
// =====================================================

function handleSocketMessage(raw) {
  let msg;

  try {
    msg =
      JSON.parse(raw);
  } catch {
    return;
  }

  if (!msg || !msg.type) {
    return;
  }

  // ---------------------------------------------------
  // REGISTERED
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // PRESENCE
  // ---------------------------------------------------

  if (
    msg.type ===
    "presence"
  ) {
    presence =
      msg.users || {};

    renderFriends();

    return;
  }

  // ---------------------------------------------------
  // PROFILE PHOTO
  // ---------------------------------------------------

  if (
    msg.type ===
    "profile_photo"
  ) {
    handleIncomingProfilePhoto(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // CHAT
  // ---------------------------------------------------

  if (
    msg.type ===
    "chat"
  ) {
    receiveChatMessage(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // MEDIA
  // ---------------------------------------------------

  if (
    msg.type ===
    "media"
  ) {
    receiveMediaMessage(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // DELIVERED
  // ---------------------------------------------------

  if (
    msg.type ===
    "delivered"
  ) {
    updateMessageDelivered(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // READ / SEEN
  // ---------------------------------------------------

  if (
    msg.type ===
    "read"
  ) {
    updateMessageRead(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // REACTION
  // ---------------------------------------------------

  if (
    msg.type ===
    "reaction"
  ) {
    receiveReaction(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // UNSEND
  // ---------------------------------------------------

  if (
    msg.type ===
    "unsend"
  ) {
    receiveUnsend(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // SERVER DELETE
  // ---------------------------------------------------

  if (
    msg.type ===
    "server_delete"
  ) {
    receiveServerDelete(
      msg
    );

    return;
  }

  // ---------------------------------------------------
  // DELIVERY ERROR
  // ---------------------------------------------------

  if (
    msg.type ===
    "delivery_error"
  ) {
    console.warn(
      "Message delivery error:",
      msg.reason
    );

    return;
  }

  // ---------------------------------------------------
  // MEDIA ERROR
  // ---------------------------------------------------

  if (
    msg.type ===
    "media_error"
  ) {
    alert(
      msg.reason ||
        "Media could not be sent."
    );

    return;
  }
}

// =====================================================
// RECEIVE CHAT MESSAGE
// =====================================================

function receiveChatMessage(msg) {
  if (!currentUser) {
    return;
  }

  const from =
    normalizeId(
      msg.from
    );

  const to =
    normalizeId(
      msg.to ||
        currentUser.id
    );

  const myId =
    normalizeId(
      currentUser.id
    );

  const otherUser =
    from === myId
      ? to
      : from;

  const chat =
    getChat(otherUser);

  const id =
    String(
      msg.messageId ||
        msg.id ||
        generateMessageId()
    );

  const existing =
    chat.find(
      message =>
        String(message.id) ===
        id
    );

  if (existing) {
    return;
  }

  const message = {
    id: id,
    from: from,
    to: to,
    text:
      String(
        msg.text || ""
      ),
    time:
      Number(
        msg.time
      ) || Date.now(),
    delivered: true,
    read:
      from !== myId
  };

  chat.push(message);

  saveChat(otherUser);

  /*
    If the user is currently inside
    this chat, immediately mark it read.
  */
  if (
    normalizeId(
      currentChatUserId
    ) ===
    normalizeId(otherUser)
  ) {
    renderMessages();

    if (
      from !== myId &&
      socket &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "read",
          id: id,
          messageId: id
        })
      );
    }
  } else {
    renderFriends();
  }
}

// =====================================================
// RECEIVE MEDIA
// =====================================================

function receiveMediaMessage(msg) {
  if (!currentUser) {
    return;
  }

  const from =
    normalizeId(
      msg.from
    );

  const to =
    normalizeId(
      msg.to ||
        currentUser.id
    );

  const myId =
    normalizeId(
      currentUser.id
    );

  const otherUser =
    from === myId
      ? to
      : from;

  const id =
    String(
      msg.messageId ||
        msg.id ||
        generateMessageId()
    );

  const chat =
    getChat(otherUser);

  if (
    chat.some(
      message =>
        String(message.id) ===
        id
    )
  ) {
    return;
  }

  chat.push({
    id: id,
    from: from,
    to: to,
    time:
      Number(
        msg.time
      ) || Date.now(),
    mediaType:
      msg.mediaType || "",
    mimeType:
      msg.mimeType || "",
    name:
      msg.name || "File",
    size:
      Number(
        msg.size
      ) || 0,
    data:
      msg.data || "",
    delivered: true,
    read:
      from !== myId
  });

  saveChat(otherUser);

  if (
    normalizeId(
      currentChatUserId
    ) ===
    normalizeId(otherUser)
  ) {
    renderMessages();
  }
}

// =====================================================
// DELIVERED / READ
// =====================================================

function updateMessageDelivered(
  msg
) {
  const id =
    String(
      msg.messageId ||
        msg.id ||
        ""
    );

  if (!id) {
    return;
  }

  Object.values(
    chats
  ).forEach(chat => {
    if (!Array.isArray(chat)) {
      return;
    }

    const message =
      chat.find(
        item =>
          String(item.id) ===
          id
      );

    if (message) {
      message.delivered = true;
    }
  });

  saveChats();

  renderMessages();
}

function updateMessageRead(msg) {
  const id =
    String(
      msg.messageId ||
        msg.id ||
        ""
    );

  if (!id) {
    return;
  }

  Object.values(
    chats
  ).forEach(chat => {
    if (!Array.isArray(chat)) {
      return;
    }

    const message =
      chat.find(
        item =>
          String(item.id) ===
          id
      );

    if (message) {
      message.read = true;
      message.delivered = true;
    }
  });

  saveChats();

  renderMessages();
}

// =====================================================
// REACTION RECEIVE
// =====================================================

function receiveReaction(msg) {
  const id =
    String(
      msg.messageId ||
        msg.id ||
        ""
    );

  if (!id) {
    return;
  }

  let changed = false;

  Object.values(
    chats
  ).forEach(chat => {
    if (!Array.isArray(chat)) {
      return;
    }

    const message =
      chat.find(
        item =>
          String(item.id) ===
          id
      );

    if (message) {
      message.reaction =
        String(
          msg.reaction || ""
        );

      changed = true;
    }
  });

  if (changed) {
    saveChats();
    renderMessages();
  }
}

// =====================================================
// UNSEND RECEIVE
// =====================================================

function receiveUnsend(msg) {
  const id =
    String(
      msg.messageId ||
        msg.id ||
        ""
    );

  if (!id) {
    return;
  }

  Object.keys(
    chats
  ).forEach(key => {
    const chat =
      chats[key];

    if (!Array.isArray(chat)) {
      return;
    }

    const index =
      chat.findIndex(
        message =>
          String(message.id) ===
          id
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
}

// =====================================================
// SERVER DELETE RECEIVE
// =====================================================

function receiveServerDelete(msg) {
  const id =
    String(
      msg.messageId ||
        msg.id ||
        ""
    );

  if (!id) {
    return;
  }

  Object.values(
    chats
  ).forEach(chat => {
    if (!Array.isArray(chat)) {
      return;
    }

    const message =
      chat.find(
        item =>
          String(item.id) ===
          id
      );

    if (message) {
      message.deleted = true;
      message.text = "";
      message.data = null;
    }
  });

  saveChats();

  renderMessages();
}

// =====================================================
// PROFILE PHOTO
// =====================================================

function handleIncomingProfilePhoto(
  msg
) {
  const userId =
    normalizeId(
      msg.userId
    );

  if (!userId) {
    return;
  }

  /*
    Store received profile photo
    locally for display.
  */
  localStorage.setItem(
    "friendchat_photo_" +
      userId,
    JSON.stringify(
      msg.photo ||
        msg.data ||
        ""
    )
  );

  updateProfilePhoto(
    userId
  );
}

function updateProfilePhoto(
  userId
) {
  const id =
    normalizeId(userId);

  const raw =
    localStorage.getItem(
      "friendchat_photo_" +
        id
    );

  if (!raw) {
    return;
  }

  let photo;

  try {
    photo =
      JSON.parse(raw);
  } catch {
    photo = raw;
  }

  const data =
    typeof photo === "string"
      ? photo
      : photo?.data;

  if (!data) {
    return;
  }

  document
    .querySelectorAll(
      `[data-user-id="${CSS.escape(id)}"]`
    )
    .forEach(el => {
      el.style.backgroundImage =
        `url("${data}")`;

      el.classList.add(
        "has-photo"
      );

      el.textContent = "";
    });
}

function sendProfilePhoto(
  data,
  mimeType,
  name
) {
  if (
    !currentUser ||
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  const photo = {
    data:
      String(data || ""),
    mimeType:
      String(
        mimeType ||
          "image/jpeg"
      ),
    name:
      String(
        name ||
          currentUser.name ||
          "Friend"
      ),
    time:
      Date.now()
  };

  socket.send(
    JSON.stringify({
      type: "profile_photo",
      photo: photo
    })
  );

  localStorage.setItem(
    "friendchat_photo_" +
      normalizeId(
        currentUser.id
      ),
    JSON.stringify(photo)
  );
}

// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const account =
      loadAccount();

    if (account) {
      currentUser =
        account;

      loadFriends();
      loadChats();

      updateHome();
    }

    const mediaInput =
      getElement("mediaInput");

    if (mediaInput) {
      mediaInput.addEventListener(
        "change",
        handleMediaSelected
      );
    }

    const messageInput =
      getElement("messageInput");

    if (messageInput) {
      messageInput.addEventListener(
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

    /*
      Close message menu when
      clicking outside it.
    */
    document.addEventListener(
      "click",
      event => {
        const menu =
          getElement(
            "messageMenu"
          );

        if (
          menu &&
          !menu.contains(
            event.target
          )
        ) {
          closeMessageMenu();
        }
      }
    );

    if (currentUser) {
      connectSocket();
      showHome();
    } else {
      showLogin();
    }
  }
);

// =====================================================
// WINDOW / SCREEN EVENTS
// =====================================================

window.addEventListener(
  "beforeunload",
  () => {
    clearPresenceChat();

    if (socket) {
      try {
        socket.close();
      } catch {}
    }
  }
);

// Make functions available to
// inline HTML onclick handlers.
window.login = login;
window.signup = signup;
window.logout = logout;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.showHome = showHome;
window.showAdd = showAdd;
window.showChat = showChat;
window.addById = addById;
window.sendMessage = sendMessage;
window.chooseMedia = chooseMedia;
window.reactToMessage =
  reactToMessage;
window.unsendSelectedMessage =
  unsendSelectedMessage;
window.deleteSelectedMessage =
  deleteSelectedMessage;
window.closeMessageMenu =
  closeMessageMenu;
window.editProfileName =
  editProfileName;    currentChatUserId ===
    from;

  const message = {

    id:
      messageId,

    messageId:
      messageId,

    from:
      from,

    to:
      normalizeId(
        msg.to ||
        currentUser.id
      ),

    text:
      msg.text ||
      "",

    time:
      msg.time ||
      Date.now(),

    status:
      isOpen
        ? "read"
        : "delivered",

    mine:
      false
  };


  /*
    Avoid duplicate messages.
  */

  const exists =
    chats[from].some(
      existing =>
        String(
          existing.id
        ) ===
        messageId ||
        String(
          existing.messageId
        ) ===
        messageId
    );


  if (
    exists
  ) {

    /*
      If the message already exists
      but the chat is open, make sure
      it is marked as read.
    */

    if (
      isOpen
    ) {

      const existing =
        chats[from].find(
          item =>
            String(
              item.id
            ) ===
            messageId ||
            String(
              item.messageId
            ) ===
            messageId
        );

      if (
        existing &&
        existing.status !==
          "read"
      ) {

        existing.status =
          "read";

        sendRead(
          messageId
        );

        saveChats();

        renderMessages();
      }
    }

    return;
  }


  chats[from].push(
    message
  );

  saveChats();


  /*
    Tell server the message
    was delivered.
  */

  sendDelivered(
    messageId
  );


  /*
    If chat is currently open,
    immediately mark it as read.
  */

  if (
    isOpen
  ) {

    sendRead(
      messageId
    );

    message.status =
      "read";

    saveChats();
  }


  renderFriends();


  if (
    isOpen
  ) {
    renderMessages();
  }
}


/* =========================================================
   DELIVERY / READ
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


function updateMessageStatus(
  messageId,
  status
) {

  if (!messageId) {
    return;
  }


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
              ) ||
            String(
              message.messageId
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


  if (
    changed
  ) {

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


  if (
    !currentChatUserId
  ) {

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

      /*
        IMPORTANT:
        Never trust message.mine
        after reload.

        Determine ownership from
        the sender ID.
      */

      const myId =
        currentUser
          ? normalizeId(
              currentUser.id
            )
          : "";

      const senderId =
        normalizeId(
          message.from
        );

      const isMine =
        senderId ===
        myId;


      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        isMine
          ? "messageRow mine"
          : "messageRow theirs";


      const bubble =
        document.createElement(
          "div"
        );

      bubble.className =
        isMine
          ? "messageBubble mine"
          : "messageBubble theirs";


      /*
        Message text
      */

      if (
        message.text
      ) {

        const text =
          document.createElement(
            "div"
          );

        text.className =
          "messageText";

        text.textContent =
          message.text;

        bubble.appendChild(
          text
        );
      }


      /*
        Media
      */

      if (
        message.media
      ) {

        renderMessageMedia(
          message,
          bubble
        );
      }


      /*
        Reactions
      */

      if (
        message.reaction
      ) {

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


      /*
        Time + status
      */

      const meta =
        document.createElement(
          "div"
        );

      meta.className =
        "messageMeta";


      const time =
        document.createElement(
          "span"
        );

      time.className =
        "messageTime";

      time.textContent =
        formatMessageTime(
          message.time
        );

      meta.appendChild(
        time
      );


      /*
        Sent / delivered / seen ticks
        only belong to our messages.
      */

      if (
        isMine
      ) {

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

          ticks.style.color =
            "#777";

        } else if (
          message.status ===
          "sent"
        ) {

          ticks.textContent =
            "✓";

          ticks.style.color =
            "#777";

        } else if (
          message.status ===
          "error"
        ) {

          ticks.textContent =
            "!";

          ticks.style.color =
            "#d00";
        }


        meta.appendChild(
          ticks
        );
      }


      bubble.appendChild(
        meta
      );


      /*
        Message click / menu
      */

      bubble.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          selectedMessageId =
            message.id;

          showMessageMenu(
            message
          );
        }
      );


      wrapper.appendChild(
        bubble
      );

      container.appendChild(
        wrapper
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
   MESSAGE MENU
   ========================================================= */

function showMessageMenu(
  message
) {

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (!menu) {
    return;
  }


  selectedMessageId =
    message.id;


  menu.classList.remove(
    "hidden"
  );


  /*
    Make sure the correct
    ownership buttons are shown.
  */

  const myId =
    currentUser
      ? normalizeId(
          currentUser.id
        )
      : "";

  const senderId =
    normalizeId(
      message.from
    );

  const isMine =
    senderId ===
    myId;


  const unsendButton =
    document.getElementById(
      "unsendMessageButton"
    );

  const deleteButton =
    document.getElementById(
      "deleteMessageButton"
    );


  if (
    unsendButton
  ) {

    unsendButton.style.display =
      isMine
        ? ""
        : "none";
  }


  if (
    deleteButton
  ) {

    deleteButton.style.display =
      "";
  }
}


function hideMessageMenu() {

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (!menu) {
    return;
  }

  menu.classList.add(
    "hidden"
  );

  selectedMessageId =
    null;
}


/* =========================================================
   UNSEND MESSAGE
   ========================================================= */

function unsendSelectedMessage() {

  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    hideMessageMenu();
    return;
  }


  const message =
    (
      chats[
        currentChatUserId
      ] || []
    ).find(
      item =>
        String(
          item.id
        ) ===
        String(
          selectedMessageId
        )
    );


  if (!message) {

    hideMessageMenu();

    return;
  }


  const myId =
    currentUser
      ? normalizeId(
          currentUser.id
        )
      : "";


  if (
    normalizeId(
      message.from
    ) !==
    myId
  ) {

    hideMessageMenu();

    return;
  }


  /*
    Remove only from our local chat.

    The other user can still see it.
  */

  chats[
    currentChatUserId
  ] =
    chats[
      currentChatUserId
    ].filter(
      item =>
        String(
          item.id
        ) !==
        String(
          selectedMessageId
        )
    );


  saveChats();

  renderMessages();

  hideMessageMenu();


  /*
    Tell server that sender
    unsent the message.
  */

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
          selectedMessageId,

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

function deleteSelectedMessage() {

  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    hideMessageMenu();
    return;
  }


  chats[
    currentChatUserId
  ] =
    (
      chats[
        currentChatUserId
      ] || []
    ).filter(
      message =>
        String(
          message.id
        ) !==
        String(
          selectedMessageId
        )
    );


  saveChats();

  renderMessages();


  /*
    Delete from server too.
  */

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
          selectedMessageId,

        from:
          currentUser.id,

        to:
          currentChatUserId
      })
    );
  }


  hideMessageMenu();
}


/* =========================================================
   REACTIONS
   ========================================================= */

function reactToSelectedMessage(
  emoji
) {

  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    hideMessageMenu();
    return;
  }


  const messages =
    chats[
      currentChatUserId
    ] || [];


  const message =
    messages.find(
      item =>
        String(
          item.id
        ) ===
        String(
          selectedMessageId
        )
    );


  if (!message) {

    hideMessageMenu();

    return;
  }


  /*
    Save locally first.
  */

  message.reaction =
    emoji;


  saveChats();

  renderMessages();


  /*
    Send reaction to server.
  */

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

        from:
          currentUser.id,

        to:
          currentChatUserId,

        reaction:
          emoji
      })
    );
  }


  hideMessageMenu();
}


/* =========================================================
   RECEIVE REACTION
   ========================================================= */

function receiveReaction(
  msg
) {

  const messageId =
    String(
      msg.messageId ||
      msg.id ||
      ""
    );


  if (!messageId) {
    return;
  }


  const from =
    normalizeId(
      msg.from
    );


  const messages =
    chats[
      from
    ] || [];


  const message =
    messages.find(
      item =>
        String(
          item.id
        ) ===
        messageId ||
        String(
          item.messageId
        ) ===
        messageId
    );


  if (!message) {
    return;
  }


  message.reaction =
    msg.reaction ||
    "";


  saveChats();


  if (
    currentChatUserId ===
    from
  ) {

    renderMessages();
  }
}


/* =========================================================
   FORMAT MESSAGE TIME
   ========================================================= */

function formatMessageTime(
  timestamp
) {

  const date =
    new Date(
      timestamp
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date.toLocaleTimeString(
    [],
    {
      hour:
        "numeric",

      minute:
        "2-digit"
    }
  );
}


/* =========================================================
   UNREAD COUNT
   ========================================================= */

function getUnreadCount(
  friendId
) {

  const id =
    normalizeId(
      friendId
    );


  const myId =
    currentUser
      ? normalizeId(
          currentUser.id
        )
      : "";


  return (
    chats[id] || []
  ).filter(
    message => {

      const from =
        normalizeId(
          message.from
        );

      return (
        from === id &&
        from !== myId &&
        message.status !==
          "read"
      );
    }
  ).length;
}


/* =========================================================
   MEDIA
   ========================================================= */

function sendMediaFile(
  file
) {

  if (
    !file ||
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


  const reader =
    new FileReader();


  reader.onload =
    () => {

      const dataUrl =
        reader.result;


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
          "",

        time:
          Date.now(),

        status:
          "sent",

        mine:
          true,

        media: {

          type:
            file.type.startsWith(
              "video/"
            )
              ? "video"
              : "image",

          name:
            file.name,

          mime:
            file.type,

          data:
            dataUrl
        }
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


      socket.send(
        JSON.stringify({

          type:
            "media",

          id:
            message.id,

          messageId:
            message.id,

          from:
            message.from,

          to:
            message.to,

          time:
            message.time,

          media:
            message.media
        })
      );
    };


  reader.readAsDataURL(
    file
  );
}


/* =========================================================
   RECEIVE MEDIA
   ========================================================= */

function receiveMedia(
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
    return;
  }


  if (
    !chats[from]
  ) {

    chats[from] =
      [];
  }


  const exists =
    chats[from].some(
      message =>
        String(
          message.id
        ) ===
        messageId ||
        String(
          message.messageId
        ) ===
        messageId
    );


  if (
    exists
  ) {
    return;
  }


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
      normalizeId(
        msg.to ||
        currentUser.id
      ),

    text:
      "",

    time:
      msg.time ||
      Date.now(),

    status:
      isOpen
        ? "read"
        : "delivered",

    mine:
      false,

    media:
      msg.media ||
      null
  };


  chats[from].push(
    message
  );


  saveChats();

  sendDelivered(
    messageId
  );


  if (
    isOpen
  ) {

    message.status =
      "read";

    sendRead(
      messageId
    );

    saveChats();
  }


  renderFriends();


  if (
    isOpen
  ) {

    renderMessages();
  }
}


/* =========================================================
   RENDER MESSAGE MEDIA
   ========================================================= */

function renderMessageMedia(
  message,
  bubble
) {

  if (
    !message.media
  ) {
    return;
  }


  const media =
    message.media;


  if (
    media.type ===
    "image"
  ) {

    const img =
      document.createElement(
        "img"
      );

    img.src =
      media.data;

    img.alt =
      media.name ||
      "Image";

    img.className =
      "chatMediaImage";

    img.loading =
      "lazy";

    bubble.appendChild(
      img
    );

    return;
  }


  if (
    media.type ===
    "video"
  ) {

    const video =
      document.createElement(
        "video"
      );

    video.src =
      media.data;

    video.controls =
      true;

    video.className =
      "chatMediaVideo";

    bubble.appendChild(
      video
    );
  }
}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function sendProfilePhoto(
  dataUrl
) {

  if (
    !currentUser ||
    !dataUrl
  ) {
    return;
  }


  localStorage.setItem(
    "friendchat_profile_photo",
    dataUrl
  );


  updateProfilePhoto(
    dataUrl
  );


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
        "profile_photo",

      userId:
        currentUser.id,

      photo:
        dataUrl
    })
  );
}


function receiveProfilePhoto(
  msg
) {

  const userId =
    normalizeId(
      msg.userId ||
      msg.from
    );


  if (!userId) {
    return;
  }


  localStorage.setItem(
    `friendchat_photo_${userId}`,
    msg.photo ||
    ""
  );


  /*
    Refresh friend list if
    this person is visible.
  */

  renderFriends();
}


function updateProfilePhoto(
  dataUrl
) {

  const elements =
    document.querySelectorAll(
      "[data-profile-photo]"
    );


  elements.forEach(
    element => {

      if (
        dataUrl
      ) {

        element.style.backgroundImage =
          `url("${dataUrl}")`;

        element.textContent =
          "";

      } else {

        element.style.backgroundImage =
          "";

        element.textContent =
          currentUser
            ? currentUser.name
                .charAt(0)
                .toUpperCase()
            : "F";
      }
    }
  );
}


function loadFriendAvatar(
  friendId,
  item
) {

  const id =
    normalizeId(
      friendId
    );


  const cached =
    localStorage.getItem(
      `friendchat_photo_${id}`
    );


  if (
    cached
  ) {

    const avatar =
      item.querySelector(
        ".friendAvatar"
      );


    if (
      avatar
    ) {

      avatar.style.backgroundImage =
        `url("${cached}")`;

      avatar.style.backgroundSize =
        "cover";

      avatar.style.backgroundPosition =
        "center";

      avatar.textContent =
        "";

      const dot =
        avatar.querySelector(
          ".presenceDot"
        );

      if (
        dot
      ) {
        avatar.appendChild(
          dot
        );
      }
    }

    return;
  }


  /*
    Ask server for profile photo.
  */

  fetch(
    `/api/profile-photo/${encodeURIComponent(
      id
    )}`
  )
    .then(
      response =>
        response.json()
    )
    .then(
      data => {

        if (
          !data ||
          !data.photo
        ) {
          return;
        }


        localStorage.setItem(
          `friendchat_photo_${id}`,
          data.photo
        );


        const avatar =
          item.querySelector(
            ".friendAvatar"
          );


        if (
          avatar
        ) {

          avatar.style.backgroundImage =
            `url("${data.photo}")`;

          avatar.style.backgroundSize =
            "cover";

          avatar.style.backgroundPosition =
            "center";

          avatar.textContent =
            "";

          const dot =
            avatar.querySelector(
              ".presenceDot"
            );

          if (
            dot
          ) {
            avatar.appendChild(
              dot
            );
          }
        }
      }
    )
    .catch(
      error =>
        console.warn(
          "FRIEND AVATAR:",
          error
        )
    );
}


/* =========================================================
   PROFILE
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


  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {

    registerSocket();
  }
}


/* =========================================================
   LOAD PROFILE PHOTO
   ========================================================= */

function loadMyProfilePhoto() {

  if (!currentUser) {
    return;
  }


  const photo =
    localStorage.getItem(
      "friendchat_profile_photo"
    );


  if (
    photo
  ) {

    updateProfilePhoto(
      photo
    );
  }
}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ??
    ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function generateMessageId() {

  return (
    "MSG-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(
        2,
        8
      )
      .toUpperCase()
  );
}


/* =========================================================
   UI NAVIGATION
   ========================================================= */

function hideAllScreens() {

  document
    .querySelectorAll(
      ".screen"
    )
    .forEach(
      screen => {

        screen.classList.add(
          "hidden"
        );
      }
    );
}


function showScreen(
  id
) {

  hideAllScreens();


  const screen =
    document.getElementById(
      id
    );


  if (
    screen
  ) {

    screen.classList.remove(
      "hidden"
    );
  }
}


function hideBottomNav() {

  const nav =
    document.getElementById(
      "bottomNav"
    );


  if (
    nav
  ) {

    nav.classList.add(
      "hidden"
    );
  }
}


function showBottomNav() {

  const nav =
    document.getElementById(
      "bottomNav"
    );


  if (
    nav
  ) {

    nav.classList.remove(
      "hidden"
    );
  }
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


  if (
    name
  ) {
    name.textContent =
      currentUser.name;
  }


  if (
    id
  ) {
    id.textContent =
      currentUser.id;
  }


  const profile =
    document.querySelector(
      "[data-profile-photo]"
    );


  if (
    profile
  ) {

    profile.title =
      currentUser.name;
  }


  loadMyProfilePhoto();

  renderFriends();
}


/* =========================================================
   ADD SCREEN
   ========================================================= */

function showAdd() {

  showScreen(
    "addScreen"
  );

  hideBottomNav();
}


function showAddTab(
  tab
) {

  const addFriend =
    document.getElementById(
      "addFriendPanel"
    );

  const joinGroup =
    document.getElementById(
      "joinGroupPanel"
    );


  const addFriendTab =
    document.getElementById(
      "addFriendTab"
    );

  const joinGroupTab =
    document.getElementById(
      "joinGroupTab"
    );


  if (
    tab ===
    "friend"
  ) {

    if (
      addFriend
    ) {
      addFriend.classList.remove(
        "hidden"
      );
    }

    if (
      joinGroup
    ) {
      joinGroup.classList.add(
        "hidden"
      );
    }

    if (
      addFriendTab
    ) {
      addFriendTab.classList.add(
        "active"
      );
    }

    if (
      joinGroupTab
    ) {
      joinGroupTab.classList.remove(
        "active"
      );
    }

  } else {

    if (
      addFriend
    ) {
      addFriend.classList.add(
        "hidden"
      );
    }

    if (
      joinGroup
    ) {
      joinGroup.classList.remove(
        "hidden"
      );
    }

    if (
      addFriendTab
    ) {
      addFriendTab.classList.remove(
        "active"
      );
    }

    if (
      joinGroupTab
    ) {
      joinGroupTab.classList.add(
        "active"
      );
    }
  }
}


/* =========================================================
   BACK TO HOME
   ========================================================= */

function backHome() {

  currentChatUserId =
    null;

  hideAllScreens();

  const home =
    document.getElementById(
      "homeScreen"
    );


  if (
    home
  ) {

    home.classList.remove(
      "hidden"
    );
  }


  showBottomNav();

  renderFriends();
}


/* =========================================================
   SEARCH
   ========================================================= */

function searchFriends() {

  renderFriends();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

  if (
    socket
  ) {

    try {

      socket.close();

    } catch {}
  }


  socket =
    null;

  currentUser =
    null;

  currentChatUserId =
    null;


  hideAllScreens();

  hideBottomNav();


  const loginScreen =
    document.getElementById(
      "loginScreen"
    );


  if (
    loginScreen
  ) {

    loginScreen.classList.remove(
      "hidden"
    );
  }
}


/* =========================================================
   SIGNUP
   ========================================================= */

async function signup() {

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

    if (status) {
      status.textContent =
        "Enter your name.";
    }

    return;
  }


  if (
    !email ||
    !email.includes(
      "@"
    )
  ) {

    if (status) {
      status.textContent =
        "Enter a valid email.";
    }

    return;
  }


  if (
    password.length <
    6
  ) {

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


  /*
    Register the account
    on the server so it appears
    in FriendChat discovery even
    when offline later.
  */

  try {

    const response =
      await fetch(
        "/api/register-user",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              id:
                account.id,

              name:
                account.name
            })
        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {

      console.error(
        "SERVER ACCOUNT REGISTRATION:",
        data
      );

      if (status) {
        status.textContent =
          "Could not create account on server.";
      }

      return;
    }

  } catch (error) {

    console.error(
      "ACCOUNT REGISTRATION ERROR:",
      error
    );

    if (status) {
      status.textContent =
        "Could not connect to FriendChat server.";
    }

    return;
  }


  saveAccount(
    account
  );

  currentUser =
    account;

  friends =
    [];

  chats =
    {};


  saveFriends();

  saveChats();

  connectSocket();

  showHome();
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {

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
    return;
  }


  const email =
    emailInput.value
      .trim()
      .toLowerCase();

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
    email !==
    String(
      account.email
    ).toLowerCase()
  ) {

    if (status) {
      status.textContent =
        "Wrong email.";
    }

    return;
  }


  if (
    password !==
    String(
      account.password
    )
  ) {

    if (status) {
      status.textContent =
        "Wrong password.";
    }

    return;
  }


  currentUser =
    account;


  /*
    Make sure older accounts,
    created before persistent
    server registration was added,
    also get registered.
  */

  try {

    await fetch(
      "/api/register-user",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            id:
              currentUser.id,

            name:
              currentUser.name
          })
      }
    );

  } catch (
    error
  ) {

    console.warn(
      "LOGIN SERVER REGISTRATION:",
      error
    );
  }


  loadFriends();

  loadChats();

  updateHome();

  connectSocket();

  showHome();
}


/* =========================================================
   SHOW SIGNUP
   ========================================================= */

function showSignup() {

  hideAllScreens();

  const screen =
    document.getElementById(
      "signupScreen"
    );


  if (
    screen
  ) {

    screen.classList.remove(
      "hidden"
    );
  }


  hideBottomNav();
}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLogin() {

  hideAllScreens();

  const screen =
    document.getElementById(
      "loginScreen"
    );


  if (
    screen
  ) {

    screen.classList.remove(
      "hidden"
    );
  }


  hideBottomNav();
}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeApp() {

  const account =
    loadAccount();


  if (
    account
  ) {

    currentUser =
      account;

    loadFriends();

    loadChats();

    updateHome();

    showHome();

    connectSocket();

  } else {

    showLogin();
  }
}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeApp();


    /*
      Search
    */

    const search =
      document.getElementById(
        "search"
      );

    if (
      search
    ) {

      search.addEventListener(
        "input",
        searchFriends
      );
    }


    /*
      Message input
    */

    const messageInput =
      document.getElementById(
        "messageInput"
      );

    if (
      messageInput
    ) {

      messageInput.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Enter"
          ) {

            event.preventDefault();

            sendMessage();
          }
        }
      );
    }


    /*
      Media picker
    */

    const mediaInput =
      document.getElementById(
        "mediaInput"
      );

    if (
      mediaInput
    ) {

      mediaInput.addEventListener(
        "change",
        event => {

          const file =
            event.target.files?.[0];

          if (
            file
          ) {

            sendMediaFile(
              file
            );
          }


          event.target.value =
            "";
        }
      );
    }


    /*
      Message menu buttons
    */

    document
      .getElementById(
        "unsendMessageButton"
      )
      ?.addEventListener(
        "click",
        unsendSelectedMessage
      );


    document
      .getElementById(
        "deleteMessageButton"
      )
      ?.addEventListener(
        "click",
        deleteSelectedMessage
      );


    document
      .getElementById(
        "cancelMessageButton"
      )
      ?.addEventListener(
        "click",
        hideMessageMenu
      );


    /*
      Reaction buttons
    */

    document
      .querySelectorAll(
        "[data-reaction]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              reactToSelectedMessage(
                button.dataset.reaction
              );
            }
          );
        }
      );


    /*
      Close message menu
      when clicking outside.
    */

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

          hideMessageMenu();
        }
      }
    );


    /*
      Profile photo picker
    */

    const profilePhotoInput =
      document.getElementById(
        "profilePhotoInput"
      );


    if (
      profilePhotoInput
    ) {

      profilePhotoInput.addEventListener(
        "change",
        event => {

          const file =
            event.target.files?.[0];

          if (
            !file
          ) {
            return;
          }


          const reader =
            new FileReader();


          reader.onload =
            () => {

              sendProfilePhoto(
                reader.result
              );
            };


          reader.readAsDataURL(
            file
          );


          event.target.value =
            "";
        }
      );
    }
  }
);


/* =========================================================
   AUTO-HIDE / GLOBAL EVENTS
   ========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (
      socket
    ) {

      try {
        socket.close();
      } catch {}
    }
  }
);


/* =========================================================
   END OF CORE APP
   ========================================================= */           ----------------------------------------------- */

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
      normalizeId(
        msg.to ||
        currentUser.id
      ),

    text:
      msg.text ||
      "",

    time:
      msg.time ||
      Date.now(),

    status:
      isOpen
        ? "read"
        : "delivered",

    mine:
      false
  };


  /*
    Avoid duplicate messages.
  */

  const exists =
    chats[from].some(
      existing =>
        String(
          existing.id
        ) ===
        messageId ||
        String(
          existing.messageId
        ) ===
        messageId
    );


  if (
    exists
  ) {

    /*
      If the message already exists
      but the chat is open, make sure
      it is marked as read.
    */

    if (
      isOpen
    ) {

      const existing =
        chats[from].find(
          item =>
            String(
              item.id
            ) ===
            messageId ||
            String(
              item.messageId
            ) ===
            messageId
        );

      if (
        existing &&
        existing.status !==
          "read"
      ) {

        existing.status =
          "read";

        sendRead(
          messageId
        );

        saveChats();

        renderMessages();
      }
    }

    return;
  }


  chats[from].push(
    message
  );

  saveChats();


  /*
    Tell server the message
    was delivered.
  */

  sendDelivered(
    messageId
  );


  /*
    If chat is currently open,
    immediately mark it as read.
  */

  if (
    isOpen
  ) {

    sendRead(
      messageId
    );

    message.status =
      "read";

    saveChats();
  }


  renderFriends();


  if (
    isOpen
  ) {
    renderMessages();
  }
}


/* =========================================================
   DELIVERY / READ
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


function updateMessageStatus(
  messageId,
  status
) {

  if (!messageId) {
    return;
  }


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
              ) ||
            String(
              message.messageId
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


  if (
    changed
  ) {

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


  if (
    !currentChatUserId
  ) {

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

      /*
        IMPORTANT:
        Never trust message.mine
        after reload.

        Determine ownership from
        the sender ID.
      */

      const myId =
        currentUser
          ? normalizeId(
              currentUser.id
            )
          : "";

      const senderId =
        normalizeId(
          message.from
        );

      const isMine =
        senderId ===
        myId;


      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        isMine
          ? "messageRow mine"
          : "messageRow theirs";


      const bubble =
        document.createElement(
          "div"
        );

      bubble.className =
        isMine
          ? "messageBubble mine"
          : "messageBubble theirs";


      /*
        Message text
      */

      if (
        message.text
      ) {

        const text =
          document.createElement(
            "div"
          );

        text.className =
          "messageText";

        text.textContent =
          message.text;

        bubble.appendChild(
          text
        );
      }


      /*
        Media
      */

      if (
        message.media
      ) {

        renderMessageMedia(
          message,
          bubble
        );
      }


      /*
        Reactions
      */

      if (
        message.reaction
      ) {

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


      /*
        Time + status
      */

      const meta =
        document.createElement(
          "div"
        );

      meta.className =
        "messageMeta";


      const time =
        document.createElement(
          "span"
        );

      time.className =
        "messageTime";

      time.textContent =
        formatMessageTime(
          message.time
        );

      meta.appendChild(
        time
      );


      /*
        Sent / delivered / seen ticks
        only belong to our messages.
      */

      if (
        isMine
      ) {

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

          ticks.style.color =
            "#777";

        } else if (
          message.status ===
          "sent"
        ) {

          ticks.textContent =
            "✓";

          ticks.style.color =
            "#777";

        } else if (
          message.status ===
          "error"
        ) {

          ticks.textContent =
            "!";

          ticks.style.color =
            "#d00";
        }


        meta.appendChild(
          ticks
        );
      }


      bubble.appendChild(
        meta
      );


      /*
        Message click / menu
      */

      bubble.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          selectedMessageId =
            message.id;

          showMessageMenu(
            message
          );
        }
      );


      wrapper.appendChild(
        bubble
      );

      container.appendChild(
        wrapper
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
   MESSAGE MENU
   ========================================================= */

function showMessageMenu(
  message
) {

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (!menu) {
    return;
  }


  selectedMessageId =
    message.id;


  menu.classList.remove(
    "hidden"
  );


  /*
    Make sure the correct
    ownership buttons are shown.
  */

  const myId =
    currentUser
      ? normalizeId(
          currentUser.id
        )
      : "";

  const senderId =
    normalizeId(
      message.from
    );

  const isMine =
    senderId ===
    myId;


  const unsendButton =
    document.getElementById(
      "unsendMessageButton"
    );

  const deleteButton =
    document.getElementById(
      "deleteMessageButton"
    );


  if (
    unsendButton
  ) {

    unsendButton.style.display =
      isMine
        ? ""
        : "none";
  }


  if (
    deleteButton
  ) {

    deleteButton.style.display =
      "";
  }
}


function hideMessageMenu() {

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (!menu) {
    return;
  }

  menu.classList.add(
    "hidden"
  );

  selectedMessageId =
    null;
}


/* =========================================================
   UNSEND MESSAGE
   ========================================================= */

function unsendSelectedMessage() {

  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    hideMessageMenu();
    return;
  }


  const message =
    (
      chats[
        currentChatUserId
      ] || []
    ).find(
      item =>
        String(
          item.id
        ) ===
        String(
          selectedMessageId
        )
    );


  if (!message) {

    hideMessageMenu();

    return;
  }


  const myId =
    currentUser
      ? normalizeId(
          currentUser.id
        )
      : "";


  if (
    normalizeId(
      message.from
    ) !==
    myId
  ) {

    hideMessageMenu();

    return;
  }


  /*
    Remove only from our local chat.

    The other user can still see it.
  */

  chats[
    currentChatUserId
  ] =
    chats[
      currentChatUserId
    ].filter(
      item =>
        String(
          item.id
        ) !==
        String(
          selectedMessageId
        )
    );


  saveChats();

  renderMessages();

  hideMessageMenu();


  /*
    Tell server that sender
    unsent the message.
  */

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
          selectedMessageId,

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

function deleteSelectedMessage() {

  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    hideMessageMenu();
    return;
  }


  chats[
    currentChatUserId
  ] =
    (
      chats[
        currentChatUserId
      ] || []
    ).filter(
      message =>
        String(
          message.id
        ) !==
        String(
          selectedMessageId
        )
    );


  saveChats();

  renderMessages();


  /*
    Delete from server too.
  */

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
          selectedMessageId,

        from:
          currentUser.id,

        to:
          currentChatUserId
      })
    );
  }


  hideMessageMenu();
}


/* =========================================================
   REACTIONS
   ========================================================= */

function reactToSelectedMessage(
  emoji
) {

  if (
    !selectedMessageId ||
    !currentChatUserId
  ) {
    hideMessageMenu();
    return;
  }


  const messages =
    chats[
      currentChatUserId
    ] || [];


  const message =
    messages.find(
      item =>
        String(
          item.id
        ) ===
        String(
          selectedMessageId
        )
    );


  if (!message) {

    hideMessageMenu();

    return;
  }


  /*
    Save locally first.
  */

  message.reaction =
    emoji;


  saveChats();

  renderMessages();


  /*
    Send reaction to server.
  */

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

        from:
          currentUser.id,

        to:
          currentChatUserId,

        reaction:
          emoji
      })
    );
  }


  hideMessageMenu();
}


/* =========================================================
   RECEIVE REACTION
   ========================================================= */

function receiveReaction(
  msg
) {

  const messageId =
    String(
      msg.messageId ||
      msg.id ||
      ""
    );


  if (!messageId) {
    return;
  }


  const from =
    normalizeId(
      msg.from
    );


  const messages =
    chats[
      from
    ] || [];


  const message =
    messages.find(
      item =>
        String(
          item.id
        ) ===
        messageId ||
        String(
          item.messageId
        ) ===
        messageId
    );


  if (!message) {
    return;
  }


  message.reaction =
    msg.reaction ||
    "";


  saveChats();


  if (
    currentChatUserId ===
    from
  ) {

    renderMessages();
  }
}


/* =========================================================
   FORMAT MESSAGE TIME
   ========================================================= */

function formatMessageTime(
  timestamp
) {

  const date =
    new Date(
      timestamp
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date.toLocaleTimeString(
    [],
    {
      hour:
        "numeric",

      minute:
        "2-digit"
    }
  );
}


/* =========================================================
   UNREAD COUNT
   ========================================================= */

function getUnreadCount(
  friendId
) {

  const id =
    normalizeId(
      friendId
    );


  const myId =
    currentUser
      ? normalizeId(
          currentUser.id
        )
      : "";


  return (
    chats[id] || []
  ).filter(
    message => {

      const from =
        normalizeId(
          message.from
        );

      return (
        from === id &&
        from !== myId &&
        message.status !==
          "read"
      );
    }
  ).length;
}


/* =========================================================
   MEDIA
   ========================================================= */

function sendMediaFile(
  file
) {

  if (
    !file ||
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


  const reader =
    new FileReader();


  reader.onload =
    () => {

      const dataUrl =
        reader.result;


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
          "",

        time:
          Date.now(),

        status:
          "sent",

        mine:
          true,

        media: {

          type:
            file.type.startsWith(
              "video/"
            )
              ? "video"
              : "image",

          name:
            file.name,

          mime:
            file.type,

          data:
            dataUrl
        }
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


      socket.send(
        JSON.stringify({

          type:
            "media",

          id:
            message.id,

          messageId:
            message.id,

          from:
            message.from,

          to:
            message.to,

          time:
            message.time,

          media:
            message.media
        })
      );
    };


  reader.readAsDataURL(
    file
  );
}


/* =========================================================
   RECEIVE MEDIA
   ========================================================= */

function receiveMedia(
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
    return;
  }


  if (
    !chats[from]
  ) {

    chats[from] =
      [];
  }


  const exists =
    chats[from].some(
      message =>
        String(
          message.id
        ) ===
        messageId ||
        String(
          message.messageId
        ) ===
        messageId
    );


  if (
    exists
  ) {
    return;
  }


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
      normalizeId(
        msg.to ||
        currentUser.id
      ),

    text:
      "",

    time:
      msg.time ||
      Date.now(),

    status:
      isOpen
        ? "read"
        : "delivered",

    mine:
      false,

    media:
      msg.media ||
      null
  };


  chats[from].push(
    message
  );


  saveChats();

  sendDelivered(
    messageId
  );


  if (
    isOpen
  ) {

    message.status =
      "read";

    sendRead(
      messageId
    );

    saveChats();
  }


  renderFriends();


  if (
    isOpen
  ) {

    renderMessages();
  }
}


/* =========================================================
   RENDER MESSAGE MEDIA
   ========================================================= */

function renderMessageMedia(
  message,
  bubble
) {

  if (
    !message.media
  ) {
    return;
  }


  const media =
    message.media;


  if (
    media.type ===
    "image"
  ) {

    const img =
      document.createElement(
        "img"
      );

    img.src =
      media.data;

    img.alt =
      media.name ||
      "Image";

    img.className =
      "chatMediaImage";

    img.loading =
      "lazy";

    bubble.appendChild(
      img
    );

    return;
  }


  if (
    media.type ===
    "video"
  ) {

    const video =
      document.createElement(
        "video"
      );

    video.src =
      media.data;

    video.controls =
      true;

    video.className =
      "chatMediaVideo";

    bubble.appendChild(
      video
    );
  }
}      } else {

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
