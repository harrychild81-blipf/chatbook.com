// ===============================
// FriendChat - app.js
// ===============================

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;

let socket = null;
let currentUser = null;
let currentChat = null;
let friends = [];
let messages = {};
let selectedMessageId = null;
let mediaDB = null;

// Presence
let presenceUsers = {};
let currentChatUserId = null;

// ===============================
// STORAGE
// ===============================

function saveAccount() {
  localStorage.setItem("friendchat_account", JSON.stringify(currentUser));
}

function loadAccount() {
  try {
    return JSON.parse(localStorage.getItem("friendchat_account") || "null");
  } catch {
    return null;
  }
}

function saveFriends() {
  localStorage.setItem("friendchat_friends", JSON.stringify(friends));
}

function loadFriends() {
  try {
    friends = JSON.parse(
      localStorage.getItem("friendchat_friends") || "[]"
    );
  } catch {
    friends = [];
  }
}

function chatKey(a, b) {
  return [String(a).toUpperCase(), String(b).toUpperCase()]
    .sort()
    .join("_");
}

function loadMessages(a, b) {
  try {
    return JSON.parse(
      localStorage.getItem("friendchat_chat_" + chatKey(a, b)) || "[]"
    );
  } catch {
    return [];
  }
}

function saveMessages(a, b, list) {
  localStorage.setItem(
    "friendchat_chat_" + chatKey(a, b),
    JSON.stringify(list)
  );
}

// ===============================
// INDEXED DB FOR MEDIA
// ===============================

function openMediaDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FriendChatMedia", 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media");
      }
    };

    request.onsuccess = () => {
      mediaDB = request.result;
      resolve(mediaDB);
    };

    request.onerror = () => reject(request.error);
  });
}

function saveMedia(id, data) {
  return new Promise((resolve, reject) => {
    if (!mediaDB) {
      reject(new Error("Media database not ready"));
      return;
    }

    const tx = mediaDB.transaction("media", "readwrite");
    tx.objectStore("media").put(data, id);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function getMedia(id) {
  return new Promise((resolve, reject) => {
    if (!mediaDB) {
      resolve(null);
      return;
    }

    const tx = mediaDB.transaction("media", "readonly");
    const request = tx.objectStore("media").get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function deleteMedia(id) {
  return new Promise((resolve, reject) => {
    if (!mediaDB) {
      resolve();
      return;
    }

    const tx = mediaDB.transaction("media", "readwrite");
    tx.objectStore("media").delete(id);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// ===============================
// SCREEN FUNCTIONS
// ===============================

function hideAllScreens() {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.add("hidden");
  });
}

function showLogin() {
  hideAllScreens();
  document.getElementById("loginScreen").classList.remove("hidden");
}

function showSignup() {
  hideAllScreens();
  document.getElementById("signupScreen").classList.remove("hidden");
}

function showHome() {
  hideAllScreens();

  document.getElementById("homeScreen").classList.remove("hidden");

  currentChat = null;
  currentChatUserId = null;

  sendPresence(null);

  renderFriends();
}

function showAdd() {
  hideAllScreens();
  document.getElementById("addScreen").classList.remove("hidden");
}

// ===============================
// SIGN UP
// ===============================

function generateFriendId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "FC-";

  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function signup() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  const status = document.getElementById("signupStatus");

  if (!name || !email || !password) {
    status.textContent = "Please fill all fields.";
    return;
  }

  if (password.length < 6) {
    status.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (!email.includes("@")) {
    status.textContent = "Enter a valid email.";
    return;
  }

  const account = {
    name,
    email,
    password,
    id: generateFriendId()
  };

  currentUser = account;

  saveAccount();
  loadFriends();

  status.textContent = `Account created! Your Friend ID is ${account.id}`;

  setTimeout(() => {
    updateHome();
    connectSocket();
    showHome();
  }, 800);
}

// ===============================
// LOGIN
// ===============================

function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const status = document.getElementById("loginStatus");

  const saved = loadAccount();

  if (!saved) {
    status.textContent = "No account found on this browser.";
    return;
  }

  if (saved.email !== email || saved.password !== password) {
    status.textContent = "Incorrect email or password.";
    return;
  }

  currentUser = saved;

  loadFriends();

  updateHome();
  connectSocket();
  showHome();
}

// ===============================
// LOGOUT
// ===============================

function logout() {
  sendPresence(null);

  if (socket) {
    try {
      socket.close();
    } catch {}
  }

  socket = null;
  currentChat = null;
  currentChatUserId = null;

  showLogin();
}

// ===============================
// HOME
// ===============================

function updateHome() {
  if (!currentUser) return;

  document.getElementById("myName").textContent = currentUser.name;
  document.getElementById("myId").textContent = currentUser.id;
  document.getElementById("myIdLabel").textContent = currentUser.id;

  const circle = document.getElementById("profileCircle");

  circle.textContent =
    currentUser.name.charAt(0).toUpperCase() || "?";
}

function renderFriends() {
  const container = document.getElementById("friendList");

  if (!container) return;

  const search =
    document.getElementById("search")?.value
      ?.toLowerCase()
      .trim() || "";

  container.innerHTML = "";

  const filtered = friends.filter((friend) => {
    return (
      friend.name.toLowerCase().includes(search) ||
      friend.id.toLowerCase().includes(search)
    );
  });

  if (filtered.length === 0) {
    container.innerHTML =
      '<div class="muted" style="padding:20px">No friends yet.</div>';
    return;
  }

  filtered.forEach((friend) => {
    const row = document.createElement("div");
    row.className = "friendRow";

    const avatar = document.createElement("div");
    avatar.className = "friendAvatar";

    avatar.textContent =
      friend.name.charAt(0).toUpperCase();

    const status = getPresence(friend.id);

    const dot = document.createElement("span");
    dot.className = `presenceDot ${status}`;

    avatar.appendChild(dot);

    const info = document.createElement("div");
    info.className = "friendInfo";

    const name = document.createElement("strong");
    name.textContent = friend.name;

    const id = document.createElement("small");
    id.className = "muted";
    id.textContent = friend.id;

    const statusText = document.createElement("div");
    statusText.className = "presenceText";
    statusText.textContent = presenceLabel(status);

    info.appendChild(name);
    info.appendChild(id);
    info.appendChild(statusText);

    row.appendChild(avatar);
    row.appendChild(info);

    row.onclick = () => openChat(friend);

    container.appendChild(row);
  });
}

// ===============================
// PRESENCE
// ===============================

function getPresence(userId) {
  const id = String(userId).toUpperCase();

  const value = presenceUsers[id];

  if (!value) return "offline";

  if (typeof value === "string") {
    return value;
  }

  return value.status || "offline";
}

function presenceLabel(status) {
  if (status === "active") return "Active";
  if (status === "busy") return "Busy";
  return "Offline";
}

function sendPresence(chatWith) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "presence_chat",
      chatWith: chatWith
        ? String(chatWith).toUpperCase()
        : null
    })
  );
}

function updatePresence(data) {
  if (!data) return;

  /*
    Supports either:
    { users: {...} }
    or directly:
    { FC-ABC123: "active" }
  */

  if (data.users) {
    presenceUsers = data.users;
  } else {
    presenceUsers = data;
    delete presenceUsers.type;
  }

  renderFriends();

  if (currentChat) {
    updateChatPresence();
  }
}

function updateChatPresence() {
  const statusEl = document.getElementById("chatStatus");

  if (!statusEl || !currentChat) return;

  const status = getPresence(currentChat.id);

  statusEl.textContent = presenceLabel(status);
}

// ===============================
// ADD FRIEND
// ===============================

async function addById() {
  const input = document.getElementById("addId");
  const status = document.getElementById("addStatus");

  const id = input.value.trim().toUpperCase();

  if (!id) {
    status.textContent = "Enter a Friend ID.";
    return;
  }

  if (id === currentUser.id.toUpperCase()) {
    status.textContent = "You cannot add yourself.";
    return;
  }

  try {
    const response = await fetch(
      `/api/user/${encodeURIComponent(id)}`
    );

    const data = await response.json();

    if (!data.found) {
      status.textContent =
        "Friend not found. They may need to open FriendChat first.";
      return;
    }

    const user = data.user;

    if (friends.some((f) => f.id === user.id)) {
      status.textContent = "Already added.";
      return;
    }

    friends.push({
      id: user.id,
      name: user.name
    });

    saveFriends();

    status.textContent = `${user.name} added!`;

    input.value = "";

    renderFriends();

    setTimeout(showHome, 700);
  } catch (error) {
    console.error(error);
    status.textContent =
      "Could not connect to the server.";
  }
}

// ===============================
// CHAT
// ===============================

function openChat(friend) {
  currentChat = friend;
  currentChatUserId = friend.id;

  hideAllScreens();

  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("chatName").textContent =
    friend.name;

  document.getElementById("chatId").textContent =
    friend.id;

  // Add status element if not already present
  let status = document.getElementById("chatStatus");

  if (!status) {
    status = document.createElement("small");
    status.id = "chatStatus";
    status.className = "chatPresence";
    document.getElementById("chatId").parentElement.appendChild(status);
  }

  updateChatPresence();

  sendPresence(friend.id);

  renderMessages();

  markMessagesAsRead();
}

// ===============================
// SEND TEXT MESSAGE
// ===============================

function sendMessage() {
  if (!currentUser || !currentChat) return;

  const input = document.getElementById("messageInput");

  const text = input.value.trim();

  if (!text) return;

  const id =
    "m_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2);

  const message = {
    id,
    from: currentUser.id,
    to: currentChat.id,
    text,
    time: Date.now(),
    type: "text",
    status: "sent",
    reaction: null
  };

  const list = loadMessages(
    currentUser.id,
    currentChat.id
  );

  list.push(message);

  saveMessages(
    currentUser.id,
    currentChat.id,
    list
  );

  renderMessages();

  input.value = "";

  sendSocket(message);
}

// ===============================
// SOCKET
// ===============================

function connectSocket() {
  if (!currentUser) return;

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    return;
  }

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

    if (currentChatUserId) {
      sendPresence(currentChatUserId);
    } else {
      sendPresence(null);
    }
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      await handleSocketMessage(data);
    } catch (error) {
      console.error(
        "Socket message error:",
        error
      );
    }
  };

  socket.onclose = () => {
    console.log("FriendChat disconnected");

    socket = null;

    // Everyone becomes offline locally
    presenceUsers = {};
    renderFriends();

    if (currentChat) {
      updateChatPresence();
    }
  };

  socket.onerror = (error) => {
    console.error(
      "FriendChat socket error:",
      error
    );
  };
}

function sendSocket(message) {
  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(JSON.stringify(message));
  }
}

// ===============================
// SOCKET MESSAGE HANDLER
// ===============================

async function handleSocketMessage(data) {
  // Registration
  if (data.type === "registered") {
    console.log(
      "Registered:",
      data.userId
    );
    return;
  }

  // Presence
  if (data.type === "presence") {
    updatePresence(data);
    return;
  }

  // Incoming text message
  if (data.type === "chat") {
    const message = {
      id: data.id,
      from: data.from,
      to: currentUser.id,
      text: data.text,
      time: data.time || Date.now(),
      type: "text",
      status: "delivered",
      reaction: null
    };

    const list = loadMessages(
      currentUser.id,
      data.from
    );

    const exists = list.some(
      (m) => m.id === message.id
    );

    if (!exists) {
      list.push(message);

      saveMessages(
        currentUser.id,
        data.from,
        list
      );
    }

    // Tell sender it was delivered
    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "delivered",
          messageId: message.id
        })
      );
    }

    if (
      currentChat &&
      currentChat.id.toUpperCase() ===
        data.from.toUpperCase()
    ) {
      renderMessages();

      markSingleMessageRead(message);
    }

    return;
  }

  // Incoming media
  if (data.type === "media") {
    const message = {
      id: data.id,
      from: data.from,
      to: currentUser.id,
      time: data.time || Date.now(),
      type: data.mediaType || "image",
      mediaId: data.id,
      name: data.name || "media",
      status: "delivered",
      reaction: null
    };

    try {
      await saveMedia(data.id, {
        type: data.mediaType,
        data: data.data,
        name: data.name
      });
    } catch (error) {
      console.error(
        "Could not save incoming media:",
        error
      );
    }

    const list = loadMessages(
      currentUser.id,
      data.from
    );

    if (
      !list.some(
        (m) => m.id === message.id
      )
    ) {
      list.push(message);

      saveMessages(
        currentUser.id,
        data.from,
        list
      );
    }

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "delivered",
          messageId: message.id
        })
      );
    }

    if (
      currentChat &&
      currentChat.id.toUpperCase() ===
        data.from.toUpperCase()
    ) {
      renderMessages();
      markSingleMessageRead(message);
    }

    return;
  }

  // Delivered
  if (data.type === "delivered") {
    updateMessageStatus(
      data.messageId,
      "delivered"
    );
    return;
  }

  // Read
  if (data.type === "read") {
    updateMessageStatus(
      data.messageId,
      "read"
    );
    return;
  }

  // Reaction
  if (data.type === "reaction") {
    updateReaction(
      data.messageId,
      data.reaction
    );
    return;
  }

  // Unsend
  if (data.type === "unsend") {
    await removeMessage(
      data.messageId,
      true
    );
    return;
  }

  // Delete
  if (data.type === "server_delete") {
    await removeMessage(
      data.messageId,
      true
    );
    return;
  }

  // Delivery error
  if (data.type === "delivery_error") {
    updateMessageStatus(
      data.messageId,
      "failed"
    );
    return;
  }
}

// ===============================
// MEDIA
// ===============================

async function sendMedia() {
  if (!currentUser || !currentChat) return;

  const input =
    document.getElementById("mediaInput");

  const file = input.files[0];

  if (!file) return;

  // 20 MB client limit
  const MAX_SIZE = 20 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    alert("Media must be smaller than 20 MB.");
    input.value = "";
    return;
  }

  if (
    !file.type.startsWith("image/") &&
    !file.type.startsWith("video/")
  ) {
    alert("Only photos and videos are supported.");
    input.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    const dataURL = reader.result;

    const id =
      "media_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2);

    const mediaType =
      file.type.startsWith("video/")
        ? "video"
        : "image";

    const message = {
      id,
      from: currentUser.id,
      to: currentChat.id,
      time: Date.now(),
      type: mediaType,
      mediaId: id,
      name: file.name,
      status: "sent",
      reaction: null
    };

    await saveMedia(id, {
      type: file.type,
      data: dataURL,
      name: file.name
    });

    const list = loadMessages(
      currentUser.id,
      currentChat.id
    );

    list.push(message);

    saveMessages(
      currentUser.id,
      currentChat.id,
      list
    );

    renderMessages();

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "media",
          id,
          from: currentUser.id,
          to: currentChat.id,
          time: message.time,
          mediaType,
          name: file.name,
          data: dataURL
        })
      );
    }

    input.value = "";
  };

  reader.readAsDataURL(file);
}

// ===============================
// RENDER MESSAGES
// ===============================

async function renderMessages() {
  const container =
    document.getElementById("messages");

  if (!container || !currentChat) return;

  const list = loadMessages(
    currentUser.id,
    currentChat.id
  );

  container.innerHTML = "";

  for (const message of list) {
    const wrapper =
      document.createElement("div");

    wrapper.className =
      "message " +
      (message.from === currentUser.id
        ? "mine"
        : "theirs");

    wrapper.dataset.id = message.id;

    const bubble =
      document.createElement("div");

    bubble.className = "bubble";

    if (
      message.type === "image" ||
      message.type === "video"
    ) {
      const media =
        await getMedia(message.mediaId);

      if (media) {
        if (message.type === "image") {
          const img =
            document.createElement("img");

          img.src = media.data;
          img.className = "chatMedia";

          bubble.appendChild(img);
        } else {
          const video =
            document.createElement("video");

          video.src = media.data;
          video.controls = true;
          video.className = "chatMedia";

          bubble.appendChild(video);
        }
      } else {
        bubble.textContent =
          "Media unavailable";
      }
    } else {
      bubble.textContent =
        message.text || "";
    }

    // Time
    const meta =
      document.createElement("div");

    meta.className = "messageMeta";

    const time =
      document.createElement("span");

    time.textContent =
      formatTime(message.time);

    meta.appendChild(time);

    // Message status
    if (message.from === currentUser.id) {
      const ticks =
        document.createElement("span");

      ticks.className = "ticks";

      if (message.status === "read") {
        ticks.textContent = "✓✓";
        ticks.style.color = "#111";
      } else if (
        message.status === "delivered"
      ) {
        ticks.textContent = "✓✓";
      } else if (
        message.status === "failed"
      ) {
        ticks.textContent = "!";
      } else {
        ticks.textContent = "✓";
      }

      meta.appendChild(ticks);
    }

    bubble.appendChild(meta);

    // Reaction
    if (message.reaction) {
      const reaction =
        document.createElement("span");

      reaction.className = "messageReaction";
      reaction.textContent =
        message.reaction;

      wrapper.appendChild(reaction);
    }

    wrapper.appendChild(bubble);

    // Right click / long press
    wrapper.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
        openMessageMenu(message.id);
      }
    );

    let pressTimer = null;

    wrapper.addEventListener(
      "touchstart",
      () => {
        pressTimer = setTimeout(() => {
          openMessageMenu(message.id);
        }, 600);
      },
      { passive: true }
    );

    wrapper.addEventListener(
      "touchend",
      () => {
        clearTimeout(pressTimer);
      },
      { passive: true }
    );

    container.appendChild(wrapper);
  }

  container.scrollTop =
    container.scrollHeight;
}

// ===============================
// TIME
// ===============================

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

// ===============================
// STATUS
// ===============================

function updateMessageStatus(
  messageId,
  status
) {
  if (!currentUser) return;

  const allFriends = [
    ...friends
  ];

  for (const friend of allFriends) {
    const list = loadMessages(
      currentUser.id,
      friend.id
    );

    const message =
      list.find(
        (m) => m.id === messageId
      );

    if (message) {
      message.status = status;

      saveMessages(
        currentUser.id,
        friend.id,
        list
      );

      if (
        currentChat &&
        currentChat.id === friend.id
      ) {
        renderMessages();
      }

      return;
    }
  }
}

// ===============================
// READ
// ===============================

function markMessagesAsRead() {
  if (!currentChat) return;

  const list = loadMessages(
    currentUser.id,
    currentChat.id
  );

  list.forEach((message) => {
    if (
      message.from !== currentUser.id &&
      message.status !== "read"
    ) {
      message.status = "read";

      if (
        socket &&
        socket.readyState === WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "read",
            messageId: message.id
          })
        );
      }
    }
  });

  saveMessages(
    currentUser.id,
    currentChat.id,
    list
  );

  renderMessages();
}

function markSingleMessageRead(message) {
  if (!message) return;

  message.status = "read";

  const list = loadMessages(
    currentUser.id,
    message.from
  );

  const found =
    list.find(
      (m) => m.id === message.id
    );

  if (found) {
    found.status = "read";

    saveMessages(
      currentUser.id,
      message.from,
      list
    );
  }

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "read",
        messageId: message.id
      })
    );
  }

  renderMessages();
}

// ===============================
// REACTIONS
// ===============================

function openMessageMenu(id) {
  selectedMessageId = id;

  const hidden =
    document.getElementById(
      "selectedMessageId"
    );

  if (hidden) {
    hidden.value = id;
  }

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (menu) {
    menu.classList.remove("hidden");
  }
}

function closeMessageMenu() {
  selectedMessageId = null;

  const menu =
    document.getElementById(
      "messageMenu"
    );

  if (menu) {
    menu.classList.add("hidden");
  }
}

function reactToMessage(reaction) {
  if (!selectedMessageId || !currentChat) {
    return;
  }

  const id = selectedMessageId;

  updateReaction(id, reaction);

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "reaction",
        messageId: id,
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
  if (!currentChat) return;

  const list = loadMessages(
    currentUser.id,
    currentChat.id
  );

  const message =
    list.find(
      (m) => m.id === messageId
    );

  if (!message) return;

  message.reaction = reaction;

  saveMessages(
    currentUser.id,
    currentChat.id,
    list
  );

  renderMessages();
}

// ===============================
// UNSEND
// ===============================

async function unsendMessage() {
  if (!selectedMessageId || !currentChat) {
    return;
  }

  const id = selectedMessageId;

  const list = loadMessages(
    currentUser.id,
    currentChat.id
  );

  const message =
    list.find(
      (m) => m.id === id
    );

  if (!message) {
    closeMessageMenu();
    return;
  }

  if (message.from !== currentUser.id) {
    alert("You can only unsend your own message.");
    closeMessageMenu();
    return;
  }

  if (message.mediaId) {
    await deleteMedia(message.mediaId);
  }

  const newList =
    list.filter(
      (m) => m.id !== id
    );

  saveMessages(
    currentUser.id,
    currentChat.id,
    newList
  );

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "unsend",
        messageId: id
      })
    );
  }

  closeMessageMenu();

  renderMessages();
}

// ===============================
// DELETE
// ===============================

async function deleteMessage() {
  if (!selectedMessageId || !currentChat) {
    return;
  }

  const id = selectedMessageId;

  const list = loadMessages(
    currentUser.id,
    currentChat.id
  );

  const message =
    list.find(
      (m) => m.id === id
    );

  if (!message) {
    closeMessageMenu();
    return;
  }

  if (message.mediaId) {
    await deleteMedia(message.mediaId);
  }

  const newList =
    list.filter(
      (m) => m.id !== id
    );

  saveMessages(
    currentUser.id,
    currentChat.id,
    newList
  );

  if (
    message.from === currentUser.id &&
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "server_delete",
        messageId: id
      })
    );
  }

  closeMessageMenu();

  renderMessages();
}

// ===============================
// REMOVE RECEIVED MESSAGE
// ===============================

async function removeMessage(
  messageId,
  fromServer = false
) {
  if (!currentUser) return;

  for (const friend of friends) {
    const list = loadMessages(
      currentUser.id,
      friend.id
    );

    const message =
      list.find(
        (m) => m.id === messageId
      );

    if (!message) continue;

    if (message.mediaId) {
      await deleteMedia(
        message.mediaId
      );
    }

    const newList =
      list.filter(
        (m) => m.id !== messageId
      );

    saveMessages(
      currentUser.id,
      friend.id,
      newList
    );

    if (
      currentChat &&
      currentChat.id === friend.id
    ) {
      renderMessages();
    }

    return;
  }
}

// ===============================
// EMOJI PICKER
// ===============================

const emojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😍",
  "🥰",
  "😘",
  "😎",
  "🤩",
  "🤔",
  "😮",
  "😢",
  "😭",
  "😡",
  "🤬",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "🎉",
  "👏",
  "💀",
  "🙏"
];

function toggleEmojiPicker() {
  const picker =
    document.getElementById(
      "emojiPicker"
    );

  if (!picker) return;

  if (picker.classList.contains("hidden")) {
    picker.innerHTML = "";

    emojis.forEach((emoji) => {
      const button =
        document.createElement("button");

      button.textContent = emoji;

      button.onclick = () => {
        const input =
          document.getElementById(
            "messageInput"
          );

        input.value += emoji;
        input.focus();
      };

      picker.appendChild(button);
    });

    picker.classList.remove("hidden");
  } else {
    picker.classList.add("hidden");
  }
}

// ===============================
// CLOSE MENUS WHEN CLICKING OUTSIDE
// ===============================

document.addEventListener(
  "click",
  (event) => {
    const picker =
      document.getElementById(
        "emojiPicker"
      );

    const emojiButton =
      document.querySelector(
        ".emojiButton"
      );

    if (
      picker &&
      !picker.contains(event.target) &&
      event.target !== emojiButton
    ) {
      picker.classList.add("hidden");
    }

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

// ===============================
// STARTUP
// ===============================

(async function startApp() {
  try {
    await openMediaDB();
  } catch (error) {
    console.error(
      "IndexedDB error:",
      error
    );
  }

  currentUser = loadAccount();

  loadFriends();

  if (currentUser) {
    updateHome();
    connectSocket();
    showHome();
  } else {
    showLogin();
  }
})();
// ===============================
// AUTOMATIC PRESENCE REFRESH
// ===============================

setInterval(() => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  // Tell the server who we are currently chatting with.
  // If no chat is open, send null.
  socket.send(
    JSON.stringify({
      type: "presence_chat",
      chatWith: currentChatUserId
        ? String(currentChatUserId).toUpperCase()
        : null
    })
  );
}, 10000);
