const API = `ws://${location.hostname}:8080`;

let socket = null;
let currentUser = JSON.parse(localStorage.getItem("friendchatUser") || "null");
let friends = JSON.parse(localStorage.getItem("friendchatFriends") || "[]");
let currentChat = null;
let addType = "friend";
let longPressTimer = null;
let longPressTriggered = false;


// =========================
// BASIC UI
// =========================

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
  currentChat = null;

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


// =========================
// STORAGE
// =========================

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
  return "MSG-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2,8);
}


// =========================
// LOCAL MEDIA STORAGE
// =========================

const MEDIA_DB = "FriendChatMedia";
const MEDIA_STORE = "files";

function openMediaDB(){

  return new Promise((resolve,reject)=>{

    const request = indexedDB.open(MEDIA_DB,1);

    request.onupgradeneeded = () => {

      const db = request.result;

      if(!db.objectStoreNames.contains(MEDIA_STORE)){
        db.createObjectStore(MEDIA_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}


async function saveMediaLocal(id,blob){

  const db = await openMediaDB();

  return new Promise((resolve,reject)=>{

    const tx = db.transaction(
      MEDIA_STORE,
      "readwrite"
    );

    tx.objectStore(MEDIA_STORE).put(
      blob,
      id
    );

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


async function getMediaLocal(id){

  const db = await openMediaDB();

  return new Promise((resolve,reject)=>{

    const tx = db.transaction(
      MEDIA_STORE,
      "readonly"
    );

    const request =
      tx.objectStore(MEDIA_STORE).get(id);

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


async function deleteMediaLocal(id){

  try{

    const db = await openMediaDB();

    return new Promise((resolve,reject)=>{

      const tx = db.transaction(
        MEDIA_STORE,
        "readwrite"
      );

      tx.objectStore(MEDIA_STORE).delete(id);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };

    });

  }catch(e){
    console.log("Media delete error:",e);
  }
}


// =========================
// MEDIA CONVERSION
// =========================

function blobToDataURL(blob){

  return new Promise((resolve,reject)=>{

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(blob);

  });
}


function dataURLToBlob(dataURL){

  const parts = dataURL.split(",");

  const mime =
    parts[0].match(/:(.*?);/)[1];

  const binary =
    atob(parts[1]);

  const array = new Uint8Array(
    binary.length
  );

  for(let i=0;i<binary.length;i++){
    array[i] = binary.charCodeAt(i);
  }

  return new Blob(
    [array],
    {type:mime}
  );
}


// =========================
// USER UI
// =========================

function loadUserUI(){

  if(!currentUser)return;

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

  return "FC-" +
    Math.random()
      .toString(36)
      .substring(2,8)
      .toUpperCase();
}


// =========================
// SIGNUP / LOGIN
// =========================

function signup(){

  const name =
    document.getElementById("signupName").value.trim();

  const email =
    document.getElementById("signupEmail").value
      .trim()
      .toLowerCase();

  const password =
    document.getElementById("signupPassword").value;

  if(!name || !email || !password){

    document.getElementById("signupStatus").textContent =
      "Please fill everything.";

    return;
  }

  if(password.length < 6){

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

  setTimeout(showHome,700);
}


function login(){

  const email =
    document.getElementById("loginEmail").value
      .trim()
      .toLowerCase();

  const password =
    document.getElementById("loginPassword").value;

  const saved =
    localStorage.getItem("friendchatUser");

  if(!saved){

    document.getElementById("loginStatus").textContent =
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

    document.getElementById("loginStatus").textContent =
      "Incorrect email or password.";
  }
}


function logout(){

  currentUser = null;

  if(socket){
    socket.close();
  }

  showLogin();
}


// =========================
// ADD FRIEND
// =========================

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
    document.getElementById("addId").value
      .trim()
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

    document.getElementById("addId").value = "";

    setTimeout(showHome,700);

  }catch(e){

    status.textContent =
      "Server connection failed.";
  }
}


// =========================
// FRIEND LIST
// =========================

function renderFriends(){

  const list =
    document.getElementById("friendList");

  if(!list)return;

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
    filtered.map(
      f => `
      <div class="friend"
        onclick='showChat(${JSON.stringify(f)})'>

        <div class="avatar">
          ${escapeHtml(f.name[0].toUpperCase())}
        </div>

        <div class="friendInfo">

          <strong>
            ${escapeHtml(f.name)}
          </strong>

          <small>
            ${escapeHtml(f.id)}
          </small>

        </div>

      </div>
      `
    ).join("");
}


function escapeHtml(s){

  return String(s).replace(
    /[&<>"']/g,
    c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[c])
  );
}


// =========================
// WEBSOCKET
// =========================

function connectSocket(){

  if(!currentUser)return;

  if(
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ){
    return;
  }

  socket =
    new WebSocket(API);

  socket.onopen = () => {

    socket.send(
      JSON.stringify({
        type:"register",
        userId:currentUser.id,
        name:currentUser.name
      })
    );
  };


  socket.onmessage = async event => {

    const msg =
      JSON.parse(event.data);


    // =====================
    // TEXT MESSAGE
    // =====================

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
          time:msg.time || Date.now(),
          mine:false,
          status:"received",
          reaction:null,
          media:false
        });

      }

      saveMessages(
        msg.from,
        list
      );

      socket.send(
        JSON.stringify({
          type:"delivered",
          messageId:msg.id
        })
      );

      if(
        currentChat &&
        currentChat.id === msg.from
      ){

        renderMessages();

        socket.send(
          JSON.stringify({
            type:"read",
            messageId:msg.id
          })
        );

        markOneRead(
          msg.from,
          msg.id
        );
      }

      return;
    }


    // =====================
    // PHOTO / VIDEO
    // =====================

    if(msg.type === "media"){

      try{

        const blob =
          dataURLToBlob(msg.data);

        // Save actual media ONLY on this device
        await saveMediaLocal(
          msg.id,
          blob
        );

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
            time:msg.time || Date.now(),
            mine:false,
            status:"received",
            reaction:null,
            media:true,
            mediaType:msg.mediaType,
            mimeType:msg.mimeType,
            name:msg.name,
            size:msg.size
          });

        }

        saveMessages(
          msg.from,
          list
        );

        // Tell sender it reached this device
        socket.send(
          JSON.stringify({
            type:"delivered",
            messageId:msg.id
          })
        );

        if(
          currentChat &&
          currentChat.id === msg.from
        ){

          renderMessages();

          socket.send(
            JSON.stringify({
              type:"read",
              messageId:msg.id
            })
          );

          markOneRead(
            msg.from,
            msg.id
          );
        }

      }catch(e){

        console.log(
          "Media receive error:",
          e
        );
      }

      return;
    }


    // =====================
    // DELIVERY / READ
    // =====================

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


    // =====================
    // REACTION
    // =====================

    if(msg.type === "reaction"){

      updateReaction(
        msg.messageId,
        msg.reaction,
        msg.from
      );

      return;
    }


    // =====================
    // UNSEND
    // =====================

    if(msg.type === "unsend"){

      removeMessageEverywhere(
        msg.messageId
      );

      return;
    }


    // =====================
    // DELETE
    // =====================

    if(msg.type === "server_delete"){

      removeMessageEverywhere(
        msg.messageId
      );

      return;
    }

  };


  socket.onclose = () => {

    socket = null;

  };


  socket.onerror = () => {

    console.log(
      "Socket error"
    );
  };
}


// =========================
// SEND TEXT
// =========================

function sendMessage(){

  const input =
    document.getElementById("messageInput");

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

    reaction:null,

    media:false

  });

  saveMessages(
    currentChat.id,
    list
  );

  input.value = "";

  renderMessages();
}


// =========================
// SEND PHOTO / VIDEO
// =========================

async function sendMedia(){

  const input =
    document.getElementById("mediaInput");

  if(
    !input ||
    !input.files ||
    !input.files.length
  ){
    return;
  }

  if(!currentChat){

    alert(
      "Open a chat first."
    );

    input.value = "";

    return;
  }

  if(
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ){

    alert(
      "Not connected to the server."
    );

    input.value = "";

    connectSocket();

    return;
  }


  const file =
    input.files[0];


  // Only photo/video
  if(
    !file.type.startsWith("image/") &&
    !file.type.startsWith("video/")
  ){

    alert(
      "Please select a photo or video."
    );

    input.value = "";

    return;
  }


  // 20 MB maximum
  if(file.size > 20 * 1024 * 1024){

    alert(
      "Maximum media size is 20 MB."
    );

    input.value = "";

    return;
  }


  try{

    const id =
      makeMessageId();


    // Store original media locally
    await saveMediaLocal(
      id,
      file
    );


    // Convert for temporary WebSocket transfer
    const data =
      await blobToDataURL(file);


    const mediaType =
      file.type.startsWith("image/")
        ? "image"
        : "video";


    const message = {

      id,

      type:"media",

      from:currentUser.id,

      to:currentChat.id,

      mediaType,

      mimeType:file.type,

      name:file.name,

      size:file.size,

      data,

      time:Date.now()

    };


    // Send through server.
    // Server does not save the actual media.
    socket.send(
      JSON.stringify(message)
    );


    // Save metadata locally
    const list =
      getMessages(currentChat.id);

    list.push({

      id,

      from:currentUser.id,

      time:message.time,

      mine:true,

      status:"sent",

      reaction:null,

      media:true,

      mediaType,

      mimeType:file.type,

      name:file.name,

      size:file.size

    });


    saveMessages(
      currentChat.id,
      list
    );


    input.value = "";

    renderMessages();


  }catch(e){

    console.error(
      "Media sending error:",
      e
    );

    alert(
      "Could not send the media."
    );

    input.value = "";
  }
}


// =========================
// MESSAGE STATUS
// =========================

function updateMessageStatus(id,status){

  for(const friend of friends){

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


function markOneRead(friendId,id){

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
}


function markChatSeen(friendId){

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
          messageId:m.id
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


function statusTicks(m){

  if(!m.mine)return "";

  if(m.status === "read"){

    return '<span class="ticks read">✓✓</span>';

  }

  if(m.status === "delivered"){

    return '<span class="ticks">✓✓</span>';

  }

  return '<span class="ticks">✓</span>';
}


// =========================
// RENDER MESSAGES
// =========================

async function renderMessages(){

  const box =
    document.getElementById("messages");

  if(!currentChat){

    box.innerHTML = "";

    return;
  }

  const list =
    getMessages(currentChat.id);


  if(!list.length){

    box.innerHTML =
      '<p class="muted">No messages yet. Say hello!</p>';

    return;
  }


  box.innerHTML =
    list.map(m => {

      let content = "";


      // MEDIA MESSAGE
      if(m.media){

        const safeId =
          escapeHtml(m.id);

        if(m.mediaType === "image"){

          content = `
            <div class="mediaMessage"
              data-media-id="${safeId}">
              <div class="muted smallText">
                Loading photo...
              </div>
            </div>
          `;

        }else{

          content = `
            <div class="mediaMessage"
              data-media-id="${safeId}">
              <div class="muted smallText">
                Loading video...
              </div>
            </div>
          `;
        }

      }else{

        content =
          escapeHtml(m.text || "");
      }


      return `
        <div
          class="msgWrap ${m.mine ? "mine" : "theirs"}"
          data-id="${escapeHtml(m.id)}"
          oncontextmenu="openMessageMenu('${escapeHtml(m.id)}');return false;"
          ontouchstart="startLongPress('${escapeHtml(m.id)}',event)"
          ontouchend="cancelLongPress()"
          ontouchmove="cancelLongPress()">

          <div class="msg ${m.mine ? "mine" : "theirs"}">

            ${content}

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
              ? `<span class="reactionBadge">
                  ${escapeHtml(m.reaction)}
                </span>`
              : ""
            }

          </div>

        </div>
      `;

    }).join("");


  box.scrollTop =
    box.scrollHeight;


  // Load locally stored media
  const mediaElements =
    box.querySelectorAll(
      ".mediaMessage"
    );


  for(const element of mediaElements){

    const id =
      element.dataset.mediaId;

    try{

      const blob =
        await getMediaLocal(id);

      if(!blob){

        element.innerHTML =
          '<div class="muted smallText">Media unavailable</div>';

        continue;
      }


      const url =
        URL.createObjectURL(blob);


      const message =
        list.find(
          m => m.id === id
        );


      if(
        message &&
        message.mediaType === "image"
      ){

        element.innerHTML = `
          <img
            src="${url}"
            alt="Photo"
            style="max-width:100%;border-radius:10px;display:block;"
          >
        `;

      }else{

        element.innerHTML = `
          <video
            src="${url}"
            controls
            playsinline
            style="max-width:100%;border-radius:10px;display:block;"
          ></video>
        `;
      }

    }catch(e){

      console.log(
        "Media loading error:",
        e
      );

      element.innerHTML =
        '<div class="muted smallText">Could not load media</div>';
    }
  }
}


// =========================
// LONG PRESS / MENU
// =========================

function startLongPress(id,e){

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


function openMessageMenu(id){

  cancelLongPress();

  const m =
    findMessage(id);

  if(!m)return;

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

  if(!currentChat)return null;

  return getMessages(
    currentChat.id
  ).find(
    m => m.id === id
  );
}


// =========================
// REACTION
// =========================

function reactToMessage(emoji){

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;

  const m =
    findMessage(id);

  if(!m)return;


  m.reaction = emoji;


  const list =
    getMessages(currentChat.id);

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


// =========================
// UNSEND
// =========================

async function unsendMessage(){

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;

  const m =
    findMessage(id);

  if(!m)return;


  const list =
    getMessages(currentChat.id)
      .filter(
        x => x.id !== id
      );

  saveMessages(
    currentChat.id,
    list
  );


  await deleteMediaLocal(id);


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
}


// =========================
// DELETE
// =========================

async function deleteMessage(){

  const id =
    document.getElementById(
      "selectedMessageId"
    ).value;

  const m =
    findMessage(id);

  if(!m)return;


  const list =
    getMessages(currentChat.id)
      .filter(
        x => x.id !== id
      );

  saveMessages(
    currentChat.id,
    list
  );


  await deleteMediaLocal(id);


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
}


// =========================
// REMOVE MESSAGE
// =========================

async function removeMessageEverywhere(id){

  for(const friend of friends){

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

      await deleteMediaLocal(id);

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


// =========================
// UPDATE REACTION
// =========================

function updateReaction(
  id,
  reaction,
  from
){

  for(const friend of friends){

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


// =========================
// START APP
// =========================

if(currentUser){

  showHome();

}else{

  showLogin();
}