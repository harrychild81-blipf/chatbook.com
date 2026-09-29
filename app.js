const API = `ws://${location.hostname}:8080`;

let socket = null;
let currentUser = JSON.parse(localStorage.getItem("friendchatUser") || "null");
let friends = JSON.parse(localStorage.getItem("friendchatFriends") || "[]");
let currentChat = null;
let addType = "friend";
let longPressTimer = null;
let longPressTriggered = false;


/* =========================
   SCREEN CONTROL
========================= */

function hideAll(){
  document.querySelectorAll(".screen").forEach(x => x.classList.add("hidden"));
}

function showLogin(){
  hideAll();
  document.getElementById("loginScreen").classList.remove("hidden");
}

function showSignup(){
  hideAll();
  document.getElementById("signupScreen").classList.remove("hidden");
}

function showHome(){
  hideAll();
  document.getElementById("homeScreen").classList.remove("hidden");

  loadUserUI();
  renderFriends();
  connectSocket();
}

function showAdd(){
  hideAll();
  document.getElementById("addScreen").classList.remove("hidden");
  selectAddType("friend");
}

function showChat(friend){

  currentChat = friend;

  hideAll();

  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("chatName").textContent = friend.name;
  document.getElementById("chatId").textContent = friend.id;

  renderMessages();

  connectSocket();

  markChatSeen(friend.id);
}


/* =========================
   STORAGE
========================= */

function saveFriends(){
  localStorage.setItem(
    "friendchatFriends",
    JSON.stringify(friends)
  );
}

function getChatKey(id){
  return "friendchatChat_" + id;
}

function getMessages(id){
  return JSON.parse(
    localStorage.getItem(getChatKey(id)) || "[]"
  );
}

function saveMessages(id,msgs){
  localStorage.setItem(
    getChatKey(id),
    JSON.stringify(msgs)
  );
}

function makeMessageId(){
  return (
    "MSG-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2,8)
  );
}


/* =========================
   USER UI
========================= */

function loadUserUI(){

  if(!currentUser) return;

  document.getElementById("myName").textContent =
    currentUser.name;

  document.getElementById("myId").textContent =
    currentUser.id;

  document.getElementById("myIdLabel").textContent =
    currentUser.id;

  document.getElementById("profileCircle").textContent =
    currentUser.name[0].toUpperCase();
}

function makeId(){
  return (
    "FC-" +
    Math.random()
      .toString(36)
      .substring(2,8)
      .toUpperCase()
  );
}


/* =========================
   SIGNUP
========================= */

function signup(){

  const name =
    document.getElementById("signupName")
      .value.trim();

  const email =
    document.getElementById("signupEmail")
      .value.trim()
      .toLowerCase();

  const password =
    document.getElementById("signupPassword")
      .value;

  if(!name || !email || !password){

    document.getElementById("signupStatus")
      .textContent =
      "Please fill everything.";

    return;
  }

  if(password.length < 6){

    document.getElementById("signupStatus")
      .textContent =
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

  document.getElementById("signupStatus")
    .textContent =
    "Account created. Your ID is " + user.id;

  setTimeout(showHome,700);
}


/* =========================
   LOGIN
========================= */

function login(){

  const email =
    document.getElementById("loginEmail")
      .value.trim()
      .toLowerCase();

  const password =
    document.getElementById("loginPassword")
      .value;

  const saved =
    localStorage.getItem("friendchatUser");

  if(!saved){

    document.getElementById("loginStatus")
      .textContent =
      "No account on this device. Create one first.";

    return;
  }

  const user = JSON.parse(saved);

  if(
    email === user.email &&
    password === user.password
  ){

    currentUser = user;

    showHome();

  }else{

    document.getElementById("loginStatus")
      .textContent =
      "Incorrect email or password.";
  }
}


/* =========================
   LOGOUT
========================= */

function logout(){

  currentUser = null;

  if(socket){
    socket.close();
  }

  showLogin();
}


/* =========================
   ADD FRIEND
========================= */

function selectAddType(type){

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


async function addById(){

  const id =
    document.getElementById("addId")
      .value.trim()
      .toUpperCase();

  const status =
    document.getElementById("addStatus");

  if(!id){

    status.textContent =
      "Enter an ID.";

    return;
  }

  if(addType === "group"){

    status.textContent =
      "Group IDs will be enabled in the next server update.";

    return;
  }

  if(id === currentUser.id){

    status.textContent =
      "You cannot add yourself.";

    return;
  }

  status.textContent =
    "Checking ID...";

  try{

    const res =
      await fetch(
        `/api/user/${encodeURIComponent(id)}`
      );

    const data =
      await res.json();

    if(!data.found){

      status.textContent =
        "Friend not found.";

      return;
    }

    if(
      friends.some(
        f => f.id === data.user.id
      )
    ){

      status.textContent =
        "Already added.";

      return;
    }

    friends.push(data.user);

    saveFriends();

    status.textContent =
      `Added ${data.user.name}!`;

    document.getElementById("addId")
      .value = "";

    setTimeout(showHome,700);

  }catch(e){

    status.textContent =
      "Server connection failed.";
  }
}


/* =========================
   UNREAD MESSAGE COUNT
========================= */

function getUnreadCount(friendId){

  const list = getMessages(friendId);

  return list.filter(
    m =>
      !m.mine &&
      m.status !== "read"
  ).length;
}


/* =========================
   FRIEND LIST
========================= */

function renderFriends(){

  const list =
    document.getElementById("friendList");

  if(!list) return;

  const q =
    (
      document.getElementById("search")?.value ||
      ""
    ).toLowerCase();

  const filtered =
    friends.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
    );

  if(!filtered.length){

    list.innerHTML =
      '<p class="muted">No friends yet. Press ＋ to add someone.</p>';

    return;
  }


  list.innerHTML =
    filtered.map(f => {

      const unread =
        getUnreadCount(f.id);

      let unreadBadge = "";

      if(unread > 0){

        const label =
          unread > 9
            ? "9+"
            : unread;

        unreadBadge = `
          <span
            style="
              margin-left:auto;
              min-width:22px;
              height:22px;
              padding:0 6px;
              border-radius:50%;
              background:#ff3040;
              color:white;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:12px;
              font-weight:700;
              line-height:22px;
              box-sizing:border-box;
              box-shadow:0 1px 4px rgba(0,0,0,.18);
            "
          >
            ${label}
          </span>
        `;
      }


      return `
        <div
          class="friend"
          onclick='showChat(${JSON.stringify(f)})'
        >

          <div class="avatar">
            ${escapeHtml(
              f.name[0].toUpperCase()
            )}
          </div>

          <div
            class="friendInfo"
            style="
              flex:1;
              min-width:0;
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                width:100%;
              "
            >

              <strong>
                ${escapeHtml(f.name)}
              </strong>

              ${unreadBadge}

            </div>

            <small>
              ${escapeHtml(f.id)}
            </small>

          </div>

        </div>
      `;

    }).join("");
}


function escapeHtml(s){

  return String(s).replace(
    /[&<>"']/g,
    c =>
      ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[c])
  );
}


/* =========================
   WEBSOCKET
========================= */

function connectSocket(){

  if(!currentUser) return;

  if(
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ){
    return;
  }

  socket = new WebSocket(API);


  socket.onopen = () => {

    socket.send(
      JSON.stringify({
        type:"register",
        userId:currentUser.id,
        name:currentUser.name
      })
    );
  };


  socket.onmessage = event => {

    const msg =
      JSON.parse(event.data);


    /* =====================
       INCOMING CHAT
    ===================== */

    if(msg.type === "chat"){

      const list =
        getMessages(msg.from);


      if(
        !list.some(
          m => m.id === msg.id
        )
      ){

        list.push({

          id:msg.id,

          from:msg.from,

          text:msg.text,

          time:
            msg.time ||
            Date.now(),

          mine:false,

          status:"received",

          reaction:null
        });
      }


      saveMessages(
        msg.from,
        list
      );


      /* DELIVERY */

      socket.send(
        JSON.stringify({
          type:"delivered",
          messageId:msg.id,
          from:msg.from,
          to:currentUser.id
        })
      );


      /* IF CHAT IS OPEN */

      if(
        currentChat &&
        currentChat.id === msg.from
      ){

        renderMessages();

        socket.send(
          JSON.stringify({
            type:"read",
            messageId:msg.id,
            to:msg.from
          })
        );

        markOneRead(
          msg.from,
          msg.id
        );

      }


      /* UPDATE RED NOTIFICATION */

      renderFriends();

      return;
    }


    /* =====================
       DELIVERY / READ
    ===================== */

    if(
      msg.type === "delivered" ||
      msg.type === "read"
    ){

      updateMessageStatus(
        msg.messageId,
        msg.type
      );

      return;
    }


    /* =====================
       REACTION
    ===================== */

    if(msg.type === "reaction"){

      updateReaction(
        msg.messageId,
        msg.reaction,
        msg.from
      );

      return;
    }


    /* =====================
       UNSEND
    ===================== */

    if(msg.type === "unsend"){

      removeMessageEverywhere(
        msg.messageId,
        "Message unsent"
      );

      return;
    }


    /* =====================
       DELETE
    ===================== */

    if(msg.type === "server_delete"){

      removeMessageEverywhere(
        msg.messageId,
        "Message deleted"
      );

      return;
    }

  };


  socket.onclose = () => {

    socket = null;
  };


  socket.onerror = () => {

    console.log("Socket error");
  };
}


/* =========================
   SEND MESSAGE
========================= */

function sendMessage(){

  const input =
    document.getElementById(
      "messageInput"
    );

  const text =
    input.value.trim();


  if(
    !text ||
    !currentChat ||
    !currentUser
  ){
    return;
  }


  if(
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ){

    alert(
      "Not connected to the server."
    );

    connectSocket();

    return;
  }


  const message = {

    id:makeMessageId(),

    type:"chat",

    from:currentUser.id,

    to:currentChat.id,

    text,

    time:Date.now()
  };


  socket.send(
    JSON.stringify(message)
  );


  const list =
    getMessages(currentChat.id);


  list.push({

    id:message.id,

    from:currentUser.id,

    text,

    time:message.time,

    mine:true,

    status:"sent",

    reaction:null
  });


  saveMessages(
    currentChat.id,
    list
  );


  input.value = "";

  renderMessages();
}


/* =========================
   MESSAGE STATUS
========================= */

function updateMessageStatus(
  id,
  status
){

  for(
    const friend of friends
  ){

    const list =
      getMessages(friend.id);

    const m =
      list.find(
        x => x.id === id
      );


    if(m){

      m.status = status;

      saveMessages(
        friend.id,
        list
      );


      if(
        currentChat &&
        currentChat.id === friend.id
      ){

        renderMessages();
      }

      return;
    }
  }
}


function markOneRead(
  friendId,
  id
){

  const list =
    getMessages(friendId);

  const m =
    list.find(
      x => x.id === id
    );


  if(m){

    m.status = "read";

    saveMessages(
      friendId,
      list
    );
  }

  /* REMOVE RED BADGE */

  renderFriends();
}


/* =========================
   MARK WHOLE CHAT SEEN
========================= */

function markChatSeen(
  friendId
){

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


    if(
      socket &&
      socket.readyState === WebSocket.OPEN
    ){

      socket.send(
        JSON.stringify({
          type:"read",
          messageId:m.id,
          to:friendId
        })
      );
    }

  });


  saveMessages(
    friendId,
    list
  );


  renderMessages();


  /* REMOVE RED BADGE */

  renderFriends();
}


/* =========================
   MESSAGE TICKS
========================= */

function statusTicks(m){

  if(!m.mine)
    return "";


  if(m.status === "read"){

    return `
      <span class="ticks read">
        ✓✓
      </span>
    `;
  }


  if(m.status === "delivered"){

    return `
      <span class="ticks">
        ✓✓
      </span>
    `;
  }


  return `
    <span class="ticks">
      ✓
    </span>
  `;
}


/* =========================
   RENDER MESSAGES
========================= */

function renderMessages(){

  const box =
    document.getElementById(
      "messages"
    );


  if(!currentChat){

    box.innerHTML = "";

    return;
  }


  const list =
    getMessages(
      currentChat.id
    );


  if(!list.length){

    box.innerHTML =
      '<p class="muted">No messages yet. Say hello!</p>';

    return;
  }


  box.innerHTML =
    list.map(m => `

      <div
        class="msgWrap ${m.mine ? "mine" : "theirs"}"
        data-id="${escapeHtml(m.id)}"

        oncontextmenu="
          openMessageMenu('${escapeHtml(m.id)}');
          return false;
        "

        ontouchstart="
          startLongPress(
            '${escapeHtml(m.id)}',
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
          class="msg ${m.mine ? "mine" : "theirs"}"
        >

          ${escapeHtml(m.text)}

          <small>

            ${new Date(m.time).toLocaleTimeString(
              [],
              {
                hour:"2-digit",
                minute:"2-digit"
              }
            )}

            ${statusTicks(m)}

          </small>


          ${
            m.reaction
              ? `
                <span class="reactionBadge">
                  ${escapeHtml(m.reaction)}
                </span>
              `
              : ""
          }

        </div>

      </div>

    `).join("");


  box.scrollTop =
    box.scrollHeight;
}


/* =========================
   LONG PRESS
========================= */

function startLongPress(
  id,
  e
){

  longPressTriggered = false;


  longPressTimer =
    setTimeout(() => {

      longPressTriggered = true;

      openMessageMenu(id);

    },550);
}


function cancelLongPress(){

  if(longPressTimer){

    clearTimeout(
      longPressTimer
    );

    longPressTimer = null;
  }
}


/* =========================
   MESSAGE MENU
========================= */

function openMessageMenu(id){

  cancelLongPress();


  const m =
    findMessage(id);


  if(!m) return;


  document.getElementById(
    "selectedMessageId"
  ).value = id;


  document.getElementById(
    "messageMenu"
  ).classList.remove("hidden");
}


function closeMessageMenu(){

  document.getElementById(
    "messageMenu"
  ).classList.add("hidden");
}


function findMessage(id){

  if(!currentChat)
    return null;


  return getMessages(
    currentChat.id
  ).find(
    m => m.id === id
  );
}


/* =========================
   REACTION
========================= */

function reactToMessage(
  emoji
){

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;


  const m =
    findMessage(id);


  if(!m) return;


  m.reaction = emoji;


  saveMessages(
    currentChat.id,
    getMessages(currentChat.id)
  );


  if(
    socket &&
    socket.readyState === WebSocket.OPEN
  ){

    socket.send(
      JSON.stringify({
        type:"reaction",
        messageId:id,
        to:currentChat.id,
        reaction:emoji
      })
    );
  }


  closeMessageMenu();

  renderMessages();
}


/* =========================
   UNSEND
========================= */

function unsendMessage(){

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;


  const m =
    findMessage(id);


  if(!m) return;


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


  if(
    socket &&
    socket.readyState === WebSocket.OPEN
  ){

    socket.send(
      JSON.stringify({
        type:"unsend",
        messageId:id,
        to:currentChat.id
      })
    );
  }


  closeMessageMenu();

  renderMessages();

  renderFriends();
}


/* =========================
   DELETE
========================= */

function deleteMessage(){

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;


  const m =
    findMessage(id);


  if(!m) return;


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


  if(
    socket &&
    socket.readyState === WebSocket.OPEN
  ){

    socket.send(
      JSON.stringify({
        type:"server_delete",
        messageId:id,
        to:currentChat.id
      })
    );
  }


  closeMessageMenu();

  renderMessages();

  renderFriends();
}


/* =========================
   REMOVE MESSAGE
========================= */

function removeMessageEverywhere(
  id
){

  for(
    const friend of friends
  ){

    const list =
      getMessages(friend.id);


    if(
      list.some(
        m => m.id === id
      )
    ){

      saveMessages(
        friend.id,
        list.filter(
          m => m.id !== id
        )
      );


      if(
        currentChat &&
        currentChat.id === friend.id
      ){

        renderMessages();
      }


      renderFriends();

      return;
    }
  }
}


/* =========================
   UPDATE REACTION
========================= */

function updateReaction(
  id,
  reaction,
  from
){

  for(
    const friend of friends
  ){

    const list =
      getMessages(friend.id);


    const m =
      list.find(
        x => x.id === id
      );


    if(m){

      m.reaction = reaction;

      saveMessages(
        friend.id,
        list
      );


      if(
        currentChat &&
        currentChat.id === friend.id
      ){

        renderMessages();
      }

      return;
    }
  }
}


/* =========================
   MEDIA
========================= */

function sendMedia(){

  alert(
    "Photo/video sending will be added after basic text messaging is tested."
  );
}


/* =========================
   START APP
========================= */

if(currentUser){

  showHome();

}else{

  showLogin();
}
