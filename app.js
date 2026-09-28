/* =========================================================
   FRIENDCHAT - COMPLETE app.js
   ========================================================= */

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;

let socket = null;

let currentUser = JSON.parse(
  localStorage.getItem("friendchatUser") || "null"
);

let friends = JSON.parse(
  localStorage.getItem("friendchatFriends") || "[]"
);

let currentChat = null;
let addType = "friend";

let longPressTimer = null;

/* =========================================================
   INDEXED DB - LOCAL MEDIA STORAGE
   ========================================================= */

const MEDIA_DB_NAME = "FriendChatMedia";
const MEDIA_STORE = "files";

function openMediaDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, {
          keyPath: "id"
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMediaLocal(id, blob, mimeType, name) {
  const db = await openMediaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    const store = tx.objectStore(MEDIA_STORE);

    store.put({
      id,
      blob,
      mimeType,
      name
    });

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getMediaLocal(id) {
  const db = await openMediaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readonly");
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function deleteMediaLocal(id) {
  const db = await openMediaDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    const store = tx.objectStore(MEDIA_STORE);

    store.delete(id);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function hideAll() {
  document
    .querySelectorAll(".screen")
    .forEach(x => x.classList.add("hidden"));
}

function showLogin() {
  hideAll();
  document
    .getElementById("loginScreen")
    .classList.remove("hidden");
}

function showSignup() {
  hideAll();
  document
    .getElementById("signupScreen")
    .classList.remove("hidden");
}

function showHome() {
  currentChat = null;

  hideAll();

  document
    .getElementById("homeScreen")
    .classList.remove("hidden");

  loadUserUI();
  renderFriends();
  connectSocket();
}

function showAdd() {
  hideAll();

  document
    .getElementById("addScreen")
    .classList.remove("hidden");

  selectAddType("friend");
}

function showChat(friend) {
  currentChat = friend;

  hideAll();

  document
    .getElementById("chatScreen")
    .classList.remove("hidden");

  document.getElementById("chatName").textContent = friend.name;
  document.getElementById("chatId").textContent = friend.id;

  renderMessages();
  connectSocket();
  markChatSeen(friend.id);
}

function saveFriends() {
  localStorage.setItem(
    "friendchatFriends",
    JSON.stringify(friends)
  );
}

function getChatKey(id) {
  return "friendchatChat_" + id;
}

function getMessages(id) {
  try {
    return JSON.parse(
      localStorage.getItem(getChatKey(id)) || "[]"
    );
  } catch {
    return [];
  }
}

function saveMessages(id, messages) {
  localStorage.setItem(
    getChatKey(id),
    JSON.stringify(messages)
  );
}

function makeMessageId() {
  return (
    "MSG-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function makeId() {
  return (
    "FC-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[c]
  );
}

/* =========================================================
   USER UI
   ========================================================= */

function loadUserUI() {
  if (!currentUser) return;

  document.getElementById("myName").textContent =
    currentUser.name;

  document.getElementById("myId").textContent =
    currentUser.id;

  document.getElementById("myIdLabel").textContent =
    currentUser.id;

  document.getElementById("profileCircle").textContent =
    currentUser.name[0].toUpperCase();
}

/* =========================================================
   SIGNUP / LOGIN
   ========================================================= */

function signup() {
  const name =
    document.getElementById("signupName").value.trim();

  const email =
    document
      .getElementById("signupEmail")
      .value.trim()
      .toLowerCase();

  const password =
    document.getElementById("signupPassword").value;

  if (!name || !email || !password) {
    document.getElementById("signupStatus").textContent =
      "Please fill everything.";

    return;
  }

  if (password.length < 6) {
    document.getElementById("signupStatus").textContent =
      "Password must be at least 6 characters.";

    return;
  }

  const user = {
    name,
    email,
    password,
    id: makeId()
  };

  currentUser = user;

  localStorage.setItem(
    "friendchatUser",
    JSON.stringify(user)
  );

  document.getElementById("signupStatus").textContent =
    "Account created. Your ID is " + user.id;

  setTimeout(showHome, 700);
}

function login() {
  const email =
    document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();

  const password =
    document.getElementById("loginPassword").value;

  const saved =
    localStorage.getItem("friendchatUser");

  if (!saved) {
    document.getElementById("loginStatus").textContent =
      "No account on this device. Create one first.";

    return;
  }

  const user = JSON.parse(saved);

  if (
    email === user.email &&
    password === user.password
  ) {
    currentUser = user;
    showHome();
  } else {
    document.getElementById("loginStatus").textContent =
      "Incorrect email or password.";
  }
}

function logout() {
  currentUser = null;

  if (socket) {
    socket.close();
    socket = null;
  }

  showLogin();
}

/* =========================================================
   ADD FRIEND
   ========================================================= */

function selectAddType(type) {
  addType = type;

  document.getElementById("friendTab").className =
    type === "friend" ? "" : "secondary";

  document.getElementById("groupTab").className =
    type === "group" ? "" : "secondary";

  document.getElementById("addId").placeholder =
    type === "friend"
      ? "Enter Friend ID"
      : "Enter Group ID";
}

async function addById() {
  const id =
    document
      .getElementById("addId")
      .value.trim()
      .toUpperCase();

  const status =
    document.getElementById("addStatus");

  if (!id) {
    status.textContent = "Enter an ID.";
    return;
  }

  if (addType === "group") {
    status.textContent =
      "Group IDs will be enabled in the next server update.";

    return;
  }

  if (id === currentUser.id) {
    status.textContent =
      "You cannot add yourself.";

    return;
  }

  status.textContent = "Checking ID...";

  try {
    const res = await fetch(
      `/api/user/${encodeURIComponent(id)}`
    );

    const data = await res.json();

    if (!data.found) {
      status.textContent = "Friend not found.";
      return;
    }

    if (friends.some(f => f.id === data.user.id)) {
      status.textContent = "Already added.";
      return;
    }

    friends.push(data.user);
    saveFriends();

    status.textContent =
      `Added ${data.user.name}!`;

    document.getElementById("addId").value = "";

    setTimeout(showHome, 700);

  } catch (e) {
    console.error(e);

    status.textContent =
      "Server connection failed.";
  }
}

/* =========================================================
   FRIEND LIST
   ========================================================= */

function renderFriends() {
  const list =
    document.getElementById("friendList");

  if (!list) return;

  const q =
    (
      document.getElementById("search")?.value ||
      ""
    ).toLowerCase();

  const filtered = friends.filter(
    f =>
      f.name.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q)
  );

  if (!filtered.length) {
    list.innerHTML =
      '<p class="muted">No friends yet. Press ＋ to add someone.</p>';

    return;
  }

  list.innerHTML = filtered
    .map(
      f =>
        `<div class="friend"
          onclick='showChat(${JSON.stringify(f)})'>

          <div class="avatar">
            ${escapeHtml(
              f.name[0].toUpperCase()
            )}
          </div>

          <div class="friendInfo">
            <strong>${escapeHtml(f.name)}</strong>
            <small>${escapeHtml(f.id)}</small>
          </div>

        </div>`
    )
    .join("");
}

/* =========================================================
   WEBSOCKET
   ========================================================= */

function connectSocket() {
  if (!currentUser) return;

  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
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
  };

  socket.onmessage = async event => {
    try {
      const msg = JSON.parse(event.data);

      /* ---------------- TEXT ---------------- */

      if (msg.type === "chat") {
        const list = getMessages(msg.from);

        if (!list.some(m => m.id === msg.id)) {
          list.push({
            id: msg.id,
            from: msg.from,
            text: msg.text,
            time: msg.time || Date.now(),
            mine: false,
            status: "received",
            reaction: null,
            kind: "text"
          });
        }

        saveMessages(msg.from, list);

        socket.send(
          JSON.stringify({
            type: "delivered",
            messageId: msg.id,
            from: msg.from,
            to: currentUser.id
          })
        );

        if (
          currentChat &&
          currentChat.id === msg.from
        ) {
          renderMessages();

          socket.send(
            JSON.stringify({
              type: "read",
              messageId: msg.id,
              to: msg.from
            })
          );

          markOneRead(msg.from, msg.id);
        }

        return;
      }

      /* ---------------- MEDIA ---------------- */

      if (msg.type === "media") {
        try {
          const blob = dataURLToBlob(msg.data);

          await saveMediaLocal(
            msg.id,
            blob,
            msg.mimeType,
            msg.name
          );

          const list = getMessages(msg.from);

          if (!list.some(m => m.id === msg.id)) {
            list.push({
              id: msg.id,
              from: msg.from,
              time: msg.time || Date.now(),
              mine: false,
              status: "received",
              reaction: null,
              kind: "media",
              mediaType: msg.mediaType,
              mimeType: msg.mimeType,
              name: msg.name,
              size: msg.size
            });
          }

          saveMessages(msg.from, list);

          socket.send(
            JSON.stringify({
              type: "delivered",
              messageId: msg.id,
              from: msg.from,
              to: currentUser.id
            })
          );

          if (
            currentChat &&
            currentChat.id === msg.from
          ) {
            renderMessages();

            socket.send(
              JSON.stringify({
                type: "read",
                messageId: msg.id,
                to: msg.from
              })
            );

            markOneRead(msg.from, msg.id);
          }

        } catch (error) {
          console.error(
            "Media receive error:",
            error
          );
        }

        return;
      }

      /* ---------------- DELIVERY ---------------- */

      if (
        msg.type === "delivered" ||
        msg.type === "read"
      ) {
        updateMessageStatus(
          msg.messageId,
          msg.type
        );

        return;
      }

      /* ---------------- REACTION ---------------- */

      if (msg.type === "reaction") {
        updateReaction(
          msg.messageId,
          msg.reaction,
          msg.from
        );

        return;
      }

      /* ---------------- UNSEND ---------------- */

      if (msg.type === "unsend") {
        await removeMessageEverywhere(
          msg.messageId,
          "Message unsent"
        );

        return;
      }

      /* ---------------- DELETE ---------------- */

      if (msg.type === "server_delete") {
        await removeMessageEverywhere(
          msg.messageId,
          "Message deleted"
        );

        return;
      }

      /* ---------------- DELIVERY ERROR ---------------- */

      if (msg.type === "delivery_error") {
        updateMessageStatus(
          msg.messageId,
          "failed"
        );

        alert(
          "Message could not be delivered. Your friend may be offline."
        );

        return;
      }

    } catch (error) {
      console.error(
        "Message processing error:",
        error
      );
    }
  };

  socket.onclose = () => {
    console.log("FriendChat disconnected");
    socket = null;
  };

  socket.onerror = error => {
    console.error(
      "WebSocket error:",
      error
    );
  };
}

/* =========================================================
   TEXT MESSAGE
   ========================================================= */

function sendMessage() {
  const input =
    document.getElementById("messageInput");

  const text =
    input.value.trim();

  if (!text || !currentChat || !currentUser) {
    return;
  }

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    alert(
      "Not connected to the server. Please wait a moment and try again."
    );

    connectSocket();
    return;
  }

  const message = {
    id: makeMessageId(),
    type: "chat",
    from: currentUser.id,
    to: currentChat.id,
    text,
    time: Date.now()
  };

  socket.send(JSON.stringify(message));

  const list =
    getMessages(currentChat.id);

  list.push({
    id: message.id,
    from: currentUser.id,
    text,
    time: message.time,
    mine: true,
    status: "sent",
    reaction: null,
    kind: "text"
  });

  saveMessages(
    currentChat.id,
    list
  );

  input.value = "";

  renderMessages();
}

/* =========================================================
   PHOTO / VIDEO
   ========================================================= */

async function sendMedia() {
  const input =
    document.getElementById("mediaInput");

  if (!input || !input.files.length) {
    return;
  }

  const file = input.files[0];

  /* Maximum 20 MB */
  const MAX_SIZE = 20 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    alert(
      "Photo/video is too large. Maximum size is 20 MB."
    );

    input.value = "";
    return;
  }

  if (!currentChat || !currentUser) {
    input.value = "";
    return;
  }

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    alert(
      "Not connected to the server."
    );

    connectSocket();
    input.value = "";
    return;
  }

  try {
    const id = makeMessageId();

    const data =
      await blobToDataURL(file);

    /* Save the actual file only on this device */
    await saveMediaLocal(
      id,
      file,
      file.type,
      file.name
    );

    const mediaType =
      file.type.startsWith("video/")
        ? "video"
        : "image";

    const message = {
      id,
      type: "media",
      from: currentUser.id,
      to: currentChat.id,
      mediaType,
      mimeType: file.type,
      name: file.name,
      size: file.size,
      data,
      time: Date.now()
    };

    /* Send temporarily through WebSocket */
    socket.send(
      JSON.stringify(message)
    );

    /* Save only metadata locally */
    const list =
      getMessages(currentChat.id);

    list.push({
      id,
      from: currentUser.id,
      time: message.time,
      mine: true,
      status: "sent",
      reaction: null,
      kind: "media",
      mediaType,
      mimeType: file.type,
      name: file.name,
      size: file.size
    });

    saveMessages(
      currentChat.id,
      list
    );

    input.value = "";

    renderMessages();

  } catch (error) {
    console.error(
      "Media send error:",
      error
    );

    alert(
      "Could not send the photo/video."
    );

    input.value = "";
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(reader.result);

    reader.onerror = () =>
      reject(reader.error);

    reader.readAsDataURL(blob);
  });
}

function dataURLToBlob(dataURL) {
  const parts = dataURL.split(",");

  const mime =
    parts[0]
      .match(/:(.*?);/)[1];

  const binary =
    atob(parts[1]);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return new Blob(
    [bytes],
    { type: mime }
  );
}

/* =========================================================
   MESSAGE STATUS
   ========================================================= */

function updateMessageStatus(
  id,
  status
) {
  for (const friend of friends) {
    const list =
      getMessages(friend.id);

    const m =
      list.find(x => x.id === id);

    if (m) {
      m.status = status;

      saveMessages(
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

function markOneRead(
  friendId,
  id
) {
  const list =
    getMessages(friendId);

  const m =
    list.find(x => x.id === id);

  if (m) {
    m.status = "read";

    saveMessages(
      friendId,
      list
    );
  }
}

function markChatSeen(
  friendId
) {
  const list =
    getMessages(friendId);

  const unread =
    list.filter(
      m =>
        !m.mine &&
        m.status !== "read"
    );

  unread.forEach(m => {
    m.status = "read";

    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "read",
          messageId: m.id,
          to: friendId
        })
      );
    }
  });

  saveMessages(
    friendId,
    list
  );

  renderMessages();
}

function statusTicks(m) {
  if (!m.mine) {
    return "";
  }

  if (m.status === "read") {
    return '<span class="ticks read">✓✓</span>';
  }

  if (m.status === "delivered") {
    return '<span class="ticks">✓✓</span>';
  }

  if (m.status === "failed") {
    return '<span class="ticks">!</span>';
  }

  return '<span class="ticks">✓</span>';
}

/* =========================================================
   RENDER MESSAGES
   ========================================================= */

async function renderMessages() {
  const box =
    document.getElementById("messages");

  if (!currentChat) {
    box.innerHTML = "";
    return;
  }

  const list =
    getMessages(currentChat.id);

  if (!list.length) {
    box.innerHTML =
      '<p class="muted">No messages yet. Say hello!</p>';

    return;
  }

  box.innerHTML = "";

  for (const m of list) {
    const wrap =
      document.createElement("div");

    wrap.className =
      `msgWrap ${
        m.mine ? "mine" : "theirs"
      }`;

    wrap.dataset.id = m.id;

    wrap.oncontextmenu = event => {
      event.preventDefault();
      openMessageMenu(m.id);
      return false;
    };

    wrap.ontouchstart = () => {
      startLongPress(m.id);
    };

    wrap.ontouchend =
      cancelLongPress;

    wrap.ontouchmove =
      cancelLongPress;

    const message =
      document.createElement("div");

    message.className =
      `msg ${
        m.mine ? "mine" : "theirs"
      }`;

    /* ---------------- MEDIA MESSAGE ---------------- */

    if (m.kind === "media") {
      const media =
        await getMediaLocal(m.id);

      if (media && media.blob) {
        const url =
          URL.createObjectURL(
            media.blob
          );

        if (
          m.mediaType === "video"
        ) {
          const video =
            document.createElement(
              "video"
            );

          video.src = url;
          video.controls = true;
          video.preload = "metadata";
          video.style.maxWidth = "100%";
          video.style.maxHeight = "350px";
          video.style.borderRadius = "12px";

          message.appendChild(video);

        } else {
          const img =
            document.createElement(
              "img"
            );

          img.src = url;
          img.alt =
            m.name || "Photo";

          img.style.maxWidth = "100%";
          img.style.maxHeight = "350px";
          img.style.borderRadius = "12px";
          img.style.display = "block";

          message.appendChild(img);
        }

      } else {
        const missing =
          document.createElement("div");

        missing.textContent =
          "Media unavailable";

        message.appendChild(
          missing
        );
      }

      const small =
        document.createElement("small");

      small.innerHTML =
        `${new Date(
          m.time
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })} ${statusTicks(m)}`;

      message.appendChild(small);

    } else {
      /* ---------------- TEXT MESSAGE ---------------- */

      const textNode =
        document.createTextNode(
          m.text || ""
        );

      message.appendChild(
        textNode
      );

      const small =
        document.createElement("small");

      small.innerHTML =
        `${new Date(
          m.time
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })} ${statusTicks(m)}`;

      message.appendChild(
        small
      );
    }

    /* ---------------- REACTION ---------------- */

    if (m.reaction) {
      const reaction =
        document.createElement("span");

      reaction.className =
        "reactionBadge";

      reaction.textContent =
        m.reaction;

      message.appendChild(
        reaction
      );
    }

    wrap.appendChild(
      message
    );

    box.appendChild(
      wrap
    );
  }

  box.scrollTop =
    box.scrollHeight;
}

/* =========================================================
   LONG PRESS / MESSAGE MENU
   ========================================================= */

function startLongPress(id) {
  cancelLongPress();

  longPressTimer =
    setTimeout(() => {
      openMessageMenu(id);
    }, 550);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function openMessageMenu(id) {
  cancelLongPress();

  const m =
    findMessage(id);

  if (!m) return;

  document.getElementById(
    "selectedMessageId"
  ).value = id;

  document.getElementById(
    "messageMenu"
  ).classList.remove("hidden");
}

function closeMessageMenu() {
  document.getElementById(
    "messageMenu"
  ).classList.add("hidden");
}

function findMessage(id) {
  if (!currentChat) {
    return null;
  }

  return getMessages(
    currentChat.id
  ).find(
    m => m.id === id
  );
}

/* =========================================================
   REACTIONS
   ========================================================= */

function reactToMessage(
  emoji
) {
  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;

  const m =
    findMessage(id);

  if (!m) return;

  m.reaction = emoji;

  const list =
    getMessages(
      currentChat.id
    );

  saveMessages(
    currentChat.id,
    list
  );

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "reaction",
        messageId: id,
        to: currentChat.id,
        reaction: emoji
      })
    );
  }

  closeMessageMenu();

  renderMessages();
}

function updateReaction(
  id,
  reaction,
  from
) {
  for (const friend of friends) {
    const list =
      getMessages(friend.id);

    const m =
      list.find(
        x => x.id === id
      );

    if (m) {
      m.reaction = reaction;

      saveMessages(
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

/* =========================================================
   UNSEND
   ========================================================= */

async function unsendMessage() {
  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;

  const m =
    findMessage(id);

  if (!m) return;

  const list =
    getMessages(
      currentChat.id
    ).filter(
      x => x.id !== id
    );

  saveMessages(
    currentChat.id,
    list
  );

  if (m.kind === "media") {
    try {
      await deleteMediaLocal(id);
    } catch {}
  }

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "unsend",
        messageId: id,
        to: currentChat.id
      })
    );
  }

  closeMessageMenu();

  renderMessages();
}

/* =========================================================
   DELETE
   ========================================================= */

async function deleteMessage() {
  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;

  const m =
    findMessage(id);

  if (!m) return;

  const list =
    getMessages(
      currentChat.id
    ).filter(
      x => x.id !== id
    );

  saveMessages(
    currentChat.id,
    list
  );

  if (m.kind === "media") {
    try {
      await deleteMediaLocal(id);
    } catch {}
  }

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "server_delete",
        messageId: id,
        to: currentChat.id
      })
    );
  }

  closeMessageMenu();

  renderMessages();
}

/* =========================================================
   REMOVE MESSAGE FROM RECEIVER
   ========================================================= */

async function removeMessageEverywhere(
  id,
  reason
) {
  for (const friend of friends) {
    const list =
      getMessages(friend.id);

    const message =
      list.find(
        m => m.id === id
      );

    if (message) {
      saveMessages(
        friend.id,
        list.filter(
          m => m.id !== id
        )
      );

      if (
        message.kind === "media"
      ) {
        try {
          await deleteMediaLocal(id);
        } catch {}
      }

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

/* =========================================================
   START APP
   ========================================================= */

if (currentUser) {
  showHome();
} else {
  showLogin();
}
