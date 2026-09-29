// ==========================================
// FRIENDCHAT - APP.JS
// ==========================================

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;

let socket = null;

let currentUser =
  JSON.parse(
    localStorage.getItem("friendchatUser") || "null"
  );

let friends =
  JSON.parse(
    localStorage.getItem("friendchatFriends") || "[]"
  );

let currentChat = null;

let addType = "friend";

let longPressTimer = null;


// ==========================================
// SCREEN FUNCTIONS
// ==========================================

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

  document.getElementById("chatName").textContent =
    friend.name;

  document.getElementById("chatId").textContent =
    friend.id;

  renderMessages();

  connectSocket();

  // Tell server that we are chatting
  sendPresence(friend.id);

  // Mark received messages as seen
  markChatSeen(friend.id);
}


// ==========================================
// LOCAL STORAGE
// ==========================================

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

  return JSON.parse(
    localStorage.getItem(
      getChatKey(id)
    ) || "[]"
  );
}


function saveMessages(id, msgs) {

  localStorage.setItem(
    getChatKey(id),
    JSON.stringify(msgs)
  );
}


function makeMessageId() {

  return (
    "MSG-" +
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}


// ==========================================
// USER UI
// ==========================================

function loadUserUI() {

  if (!currentUser) return;

  const myName =
    document.getElementById("myName");

  const myId =
    document.getElementById("myId");

  const myIdLabel =
    document.getElementById("myIdLabel");

  const profileCircle =
    document.getElementById("profileCircle");


  if (myName)
    myName.textContent =
      currentUser.name;

  if (myId)
    myId.textContent =
      currentUser.id;

  if (myIdLabel)
    myIdLabel.textContent =
      currentUser.id;

  if (profileCircle)
    profileCircle.textContent =
      currentUser.name[0].toUpperCase();
}


// ==========================================
// ACCOUNT
// ==========================================

function makeId() {

  return (
    "FC-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}


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
      .trim()
      .toLowerCase();

  const password =
    document
      .getElementById("signupPassword")
      .value;


  const status =
    document.getElementById(
      "signupStatus"
    );


  if (!name || !email || !password) {

    status.textContent =
      "Please fill everything.";

    return;
  }


  if (password.length < 6) {

    status.textContent =
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


  status.textContent =
    "Account created. Your ID is " +
    user.id;


  setTimeout(
    showHome,
    700
  );
}


function login() {

  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim()
      .toLowerCase();

  const password =
    document
      .getElementById("loginPassword")
      .value;


  const saved =
    localStorage.getItem(
      "friendchatUser"
    );


  const status =
    document.getElementById(
      "loginStatus"
    );


  if (!saved) {

    status.textContent =
      "No account on this device. Create one first.";

    return;
  }


  const user =
    JSON.parse(saved);


  if (
    email === user.email &&
    password === user.password
  ) {

    currentUser = user;

    showHome();

  } else {

    status.textContent =
      "Incorrect email or password.";
  }
}


function logout() {

  currentUser = null;

  currentChat = null;


  if (socket) {

    try {
      socket.close();
    } catch (e) {}

  }


  socket = null;

  showLogin();
}


// ==========================================
// ADD FRIEND
// ==========================================

function selectAddType(type) {

  addType = type;


  document.getElementById(
    "friendTab"
  ).className =
    type === "friend"
      ? ""
      : "secondary";


  document.getElementById(
    "groupTab"
  ).className =
    type === "group"
      ? ""
      : "secondary";


  document.getElementById(
    "addId"
  ).placeholder =
    type === "friend"
      ? "Enter Friend ID"
      : "Enter Group ID";
}


async function addById() {

  const id =
    document
      .getElementById("addId")
      .value
      .trim()
      .toUpperCase();


  const status =
    document.getElementById(
      "addStatus"
    );


  if (!id) {

    status.textContent =
      "Enter an ID.";

    return;
  }


  if (addType === "group") {

    status.textContent =
      "Group IDs will be enabled in the next server update.";

    return;
  }


  if (
    !currentUser ||
    id === currentUser.id
  ) {

    status.textContent =
      "You cannot add yourself.";

    return;
  }


  status.textContent =
    "Checking ID...";


  try {

    const res =
      await fetch(
        `/api/user/${encodeURIComponent(id)}`
      );


    const data =
      await res.json();


    if (!data.found) {

      status.textContent =
        "Friend not found.";

      return;
    }


    if (
      friends.some(
        f => f.id === data.user.id
      )
    ) {

      status.textContent =
        "Already added.";

      return;
    }


    friends.push(
      data.user
    );


    saveFriends();


    status.textContent =
      `Added ${data.user.name}!`;


    document.getElementById(
      "addId"
    ).value = "";


    setTimeout(
      showHome,
      700
    );


  } catch (e) {

    status.textContent =
      "Server connection failed.";
  }
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(s) {

  return String(s).replace(
    /[&<>"']/g,

    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );
}


// ==========================================
// PRESENCE
// ==========================================

window.friendChatPresence = {};


function sendPresence(chatWith = null) {

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
        chatWith || null

    })
  );
}


function renderFriends() {

  const list =
    document.getElementById(
      "friendList"
    );


  if (!list) return;


  const q =
    (
      document.getElementById(
        "search"
      )?.value || ""
    ).toLowerCase();


  const filtered =
    friends.filter(
      f =>
        f.name
          .toLowerCase()
          .includes(q) ||

        f.id
          .toLowerCase()
          .includes(q)
    );


  if (!filtered.length) {

    list.innerHTML =
      '<p class="muted">No friends yet. Press ＋ to add someone.</p>';

    return;
  }


  list.innerHTML =
    filtered
      .map(friend => {

        const presence =
          window.friendChatPresence[
            friend.id
          ];


        const status =
          presence?.status ||
          "offline";


        let statusText =
          "Offline";


        if (status === "active")
          statusText = "Active";

        if (status === "busy")
          statusText = "Busy";


        return `

          <div
            class="friend"
            onclick='showChat(${JSON.stringify(friend)})'
          >

            <div class="avatar">
              ${escapeHtml(
                friend.name[0].toUpperCase()
              )}
            </div>

            <div class="friendInfo">

              <strong>
                ${escapeHtml(friend.name)}
              </strong>

              <small>
                ${escapeHtml(friend.id)}
              </small>

              <small
                class="presenceText ${status}"
              >
                <span
                  class="presenceDot ${status}"
                ></span>
                ${statusText}
              </small>

            </div>

          </div>

        `;

      })
      .join("");
}


// ==========================================
// WEBSOCKET
// ==========================================

function connectSocket() {

  if (!currentUser)
    return;


  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {

    return;
  }


  console.log(
    "Connecting to:",
    API
  );


  socket =
    new WebSocket(API);


  // ========================================
  // CONNECTED
  // ========================================

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


    // Tell server current chat
    setTimeout(() => {

      if (
        currentChat
      ) {

        sendPresence(
          currentChat.id
        );

      } else {

        sendPresence(null);

      }

    }, 200);

  };


  // ========================================
  // MESSAGE RECEIVED
  // ========================================

  socket.onmessage = event => {

    let msg;


    try {

      msg =
        JSON.parse(
          event.data
        );

    } catch (e) {

      console.log(
        "Invalid server message"
      );

      return;
    }


    // ======================================
    // REGISTERED
    // ======================================

    if (
      msg.type === "registered"
    ) {

      console.log(
        "Registered as:",
        msg.userId
      );

      return;
    }


    // ======================================
    // PRESENCE
    // ======================================

    if (
      msg.type === "presence"
    ) {

      window.friendChatPresence =
        msg.users || {};


      renderFriends();


      // Update currently open chat status
      if (currentChat) {

        updateChatPresence(
          currentChat.id
        );

      }


      return;
    }


    // ======================================
    // TEXT MESSAGE
    // ======================================

    if (
      msg.type === "chat"
    ) {

      const list =
        getMessages(
          msg.from
        );


      if (
        !list.some(
          m =>
            m.id === msg.id
        )
      ) {

        list.push({

          id:
            msg.id,

          from:
            msg.from,

          text:
            msg.text,

          time:
            msg.time ||
            Date.now(),

          mine:
            false,

          status:
            "received",

          reaction:
            null

        });

      }


      saveMessages(
        msg.from,
        list
      );


      // Tell sender message arrived
      if (
        socket &&
        socket.readyState === WebSocket.OPEN
      ) {

        socket.send(
          JSON.stringify({

            type: "delivered",

            messageId:
              msg.id,

            from:
              msg.from,

            to:
              currentUser.id

          })
        );

      }


      // If this chat is currently open,
      // immediately mark message as seen.
      if (
        currentChat &&
        currentChat.id === msg.from
      ) {

        markOneRead(
          msg.from,
          msg.id
        );


        if (
          socket &&
          socket.readyState === WebSocket.OPEN
        ) {

          socket.send(
            JSON.stringify({

              type: "read",

              messageId:
                msg.id,

              to:
                msg.from

            })
          );

        }


        renderMessages();

      } else {

        renderMessages();

      }


      return;
    }


    // ======================================
    // DELIVERED / READ
    // ======================================

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


    // ======================================
    // REACTION
    // ======================================

    if (
      msg.type === "reaction"
    ) {

      updateReaction(
        msg.messageId,
        msg.reaction,
        msg.from
      );


      return;
    }


    // ======================================
    // UNSEND
    // ======================================

    if (
      msg.type === "unsend"
    ) {

      removeMessageEverywhere(
        msg.messageId
      );


      return;
    }


    // ======================================
    // DELETE
    // ======================================

    if (
      msg.type === "server_delete"
    ) {

      removeMessageEverywhere(
        msg.messageId
      );


      return;
    }


    // ======================================
    // DELIVERY ERROR
    // ======================================

    if (
      msg.type === "delivery_error"
    ) {

      console.log(
        "Delivery error:",
        msg.reason
      );


      updateMessageStatus(
        msg.messageId,
        "sent"
      );


      return;
    }

  };


  // ========================================
  // CLOSED
  // ========================================

  socket.onclose = () => {

    console.log(
      "FriendChat WebSocket disconnected"
    );


    socket = null;


    // Locally show friends offline
    // until connection returns.
    window.friendChatPresence = {};


    renderFriends();


    // Try reconnecting
    // after a few seconds.
    setTimeout(() => {

      if (
        currentUser &&
        !socket
      ) {

        connectSocket();

      }

    }, 3000);

  };


  // ========================================
  // ERROR
  // ========================================

  socket.onerror = error => {

    console.log(
      "WebSocket error:",
      error
    );

  };
}


// ==========================================
// UPDATE CHAT HEADER PRESENCE
// ==========================================

function updateChatPresence(friendId) {

  const info =
    window.friendChatPresence[
      friendId
    ];


  const header =
    document.getElementById(
      "chatId"
    );


  if (!header)
    return;


  if (!info) {

    header.textContent =
      friendId;

    return;
  }


  let status =
    "Offline";


  if (info.status === "active")
    status = "Active";

  if (info.status === "busy")
    status = "Busy";


  header.innerHTML =
    `${escapeHtml(friendId)}
     <span class="chatPresence ${info.status}">
       ${status}
     </span>`;
}


// ==========================================
// SEND TEXT MESSAGE
// ==========================================

function sendMessage() {

  const input =
    document.getElementById(
      "messageInput"
    );


  const text =
    input.value.trim();


  if (
    !text ||
    !currentChat ||
    !currentUser
  ) {

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

    return;
  }


  const message = {

    id:
      makeMessageId(),

    type:
      "chat",

    from:
      currentUser.id,

    to:
      currentChat.id,

    text:
      text,

    time:
      Date.now()

  };


  // Send to server
  socket.send(
    JSON.stringify(message)
  );


  // Save locally
  const list =
    getMessages(
      currentChat.id
    );


  list.push({

    id:
      message.id,

    from:
      currentUser.id,

    text:
      message.text,

    time:
      message.time,

    mine:
      true,

    status:
      "sent",

    reaction:
      null

  });


  saveMessages(
    currentChat.id,
    list
  );


  input.value = "";


  renderMessages();
}


// ==========================================
// MESSAGE STATUS
// ==========================================

function updateMessageStatus(
  id,
  status
) {

  for (
    const friend of friends
  ) {

    const list =
      getMessages(
        friend.id
      );


    const message =
      list.find(
        x =>
          x.id === id
      );


    if (!message)
      continue;


    // IMPORTANT:
    // "read" is the black ✓✓ state.
    if (status === "read") {

      message.status =
        "read";

    }

    else if (
      status === "delivered"
    ) {

      // Don't allow delivered to
      // overwrite an already-read message.
      if (
        message.status !== "read"
      ) {

        message.status =
          "delivered";

      }

    }


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


// ==========================================
// MARK ONE MESSAGE AS READ
// ==========================================

function markOneRead(
  friendId,
  id
) {

  const list =
    getMessages(
      friendId
    );


  const message =
    list.find(
      x =>
        x.id === id
    );


  if (!message)
    return;


  message.status =
    "read";


  saveMessages(
    friendId,
    list
  );
}


// ==========================================
// MARK WHOLE CHAT AS SEEN
// ==========================================

function markChatSeen(
  friendId
) {

  const list =
    getMessages(
      friendId
    );


  let changed = false;


  list.forEach(message => {

    if (
      !message.mine &&
      message.status !== "read"
    ) {

      message.status =
        "read";

      changed = true;


      if (
        socket &&
        socket.readyState === WebSocket.OPEN
      ) {

        socket.send(
          JSON.stringify({

            type:
              "read",

            messageId:
              message.id,

            to:
              friendId

          })
        );

      }

    }

  });


  if (changed) {

    saveMessages(
      friendId,
      list
    );

  }


  renderMessages();
}


// ==========================================
// MESSAGE TICKS
// ==========================================
//
// sent      = ✓
// delivered = ✓✓
// read      = BLACK ✓✓
// ==========================================

function statusTicks(message) {

  if (!message.mine)
    return "";


  // SEEN / READ
  // Force black color directly so it
  // works even if another CSS rule
  // overrides .ticks.
  if (
    message.status === "read"
  ) {

    return `
      <span
        class="ticks read"
        style="
          color:#000000 !important;
          font-weight:700;
          opacity:1;
        "
      >✓✓</span>
    `;

  }


  // DELIVERED
  if (
    message.status === "delivered"
  ) {

    return `
      <span
        class="ticks delivered"
      >✓✓</span>
    `;

  }


  // SENT
  return `
    <span
      class="ticks sent"
    >✓</span>
  `;
}


// ==========================================
// RENDER MESSAGES
// ==========================================

function renderMessages() {

  const box =
    document.getElementById(
      "messages"
    );


  if (!box)
    return;


  if (!currentChat) {

    box.innerHTML = "";

    return;
  }


  const list =
    getMessages(
      currentChat.id
    );


  if (!list.length) {

    box.innerHTML =
      '<p class="muted">No messages yet. Say hello!</p>';

    return;
  }


  box.innerHTML =
    list
      .map(message => {

        const safeId =
          escapeHtml(
            message.id
          );


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


        return `

          <div
            class="msgWrap ${
              message.mine
                ? "mine"
                : "theirs"
            }"

            data-id="${safeId}"

            oncontextmenu="
              openMessageMenu('${safeId}');
              return false;
            "

            ontouchstart="
              startLongPress(
                '${safeId}',
                event
              )
            "

            ontouchend="
              cancelLongPress()
            "

            ontouchmove="
              cancelLongPress()
            "
          >

            <div
              class="msg ${
                message.mine
                  ? "mine"
                  : "theirs"
              }"
            >

              ${escapeHtml(
                message.text
              )}

              <small>

                ${time}

                ${statusTicks(
                  message
                )}

              </small>


              ${
                message.reaction
                  ? `
                    <span
                      class="reactionBadge"
                    >
                      ${escapeHtml(
                        message.reaction
                      )}
                    </span>
                  `
                  : ""
              }

            </div>

          </div>

        `;

      })
      .join("");


  box.scrollTop =
    box.scrollHeight;
}


// ==========================================
// LONG PRESS
// ==========================================

function startLongPress(
  id,
  e
) {

  longPressTimer =
    setTimeout(
      () => {

        openMessageMenu(id);

      },
      550
    );
}


function cancelLongPress() {

  if (
    longPressTimer
  ) {

    clearTimeout(
      longPressTimer
    );

    longPressTimer =
      null;
  }
}


// ==========================================
// MESSAGE MENU
// ==========================================

function openMessageMenu(id) {

  cancelLongPress();


  const message =
    findMessage(id);


  if (!message)
    return;


  document.getElementById(
    "selectedMessageId"
  ).value = id;


  document.getElementById(
    "messageMenu"
  ).classList.remove(
    "hidden"
  );
}


function closeMessageMenu() {

  document.getElementById(
    "messageMenu"
  ).classList.add(
    "hidden"
  );
}


function findMessage(id) {

  if (!currentChat)
    return null;


  return getMessages(
    currentChat.id
  ).find(
    m =>
      m.id === id
  );
}


// ==========================================
// REACTION
// ==========================================

function reactToMessage(
  emoji
) {

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;


  const message =
    findMessage(id);


  if (!message)
    return;


  message.reaction =
    emoji;


  saveMessages(
    currentChat.id,
    getMessages(
      currentChat.id
    )
  );


  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify({

        type:
          "reaction",

        messageId:
          id,

        to:
          currentChat.id,

        reaction:
          emoji

      })
    );

  }


  closeMessageMenu();

  renderMessages();
}


// ==========================================
// UNSEND
// ==========================================

function unsendMessage() {

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;


  const message =
    findMessage(id);


  if (!message)
    return;


  const list =
    getMessages(
      currentChat.id
    )
    .filter(
      x =>
        x.id !== id
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

        type:
          "unsend",

        messageId:
          id,

        to:
          currentChat.id

      })
    );

  }


  closeMessageMenu();

  renderMessages();
}


// ==========================================
// DELETE
// ==========================================

function deleteMessage() {

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;


  const message =
    findMessage(id);


  if (!message)
    return;


  const list =
    getMessages(
      currentChat.id
    )
    .filter(
      x =>
        x.id !== id
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

        type:
          "server_delete",

        messageId:
          id,

        to:
          currentChat.id

      })
    );

  }


  closeMessageMenu();

  renderMessages();
}


// ==========================================
// REMOVE MESSAGE EVERYWHERE
// ==========================================

function removeMessageEverywhere(
  id
) {

  for (
    const friend of friends
  ) {

    const list =
      getMessages(
        friend.id
      );


    if (
      list.some(
        m =>
          m.id === id
      )
    ) {

      saveMessages(
        friend.id,

        list.filter(
          m =>
            m.id !== id
        )
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


// ==========================================
// UPDATE REACTION
// ==========================================

function updateReaction(
  id,
  reaction,
  from
) {

  for (
    const friend of friends
  ) {

    const list =
      getMessages(
        friend.id
      );


    const message =
      list.find(
        x =>
          x.id === id
      );


    if (!message)
      continue;


    message.reaction =
      reaction;


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


// ==========================================
// MEDIA
// ==========================================

function sendMedia() {

  alert(
    "Photo/video sending will be added after basic text messaging is tested."
  );
}


// ==========================================
// SEARCH
// ==========================================

const searchBox =
  document.getElementById(
    "search"
  );


if (searchBox) {

  searchBox.addEventListener(
    "input",
    renderFriends
  );

}


// ==========================================
// MESSAGE INPUT ENTER
// ==========================================

const messageInput =
  document.getElementById(
    "messageInput"
  );


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


// ==========================================
// START APP
// ==========================================

if (currentUser) {

  showHome();

} else {

  showLogin();

}
