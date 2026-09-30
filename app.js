/* =========================================================
   FRIENDCHAT - COMPLETE APP.JS
   ========================================================= */

/* =========================================================
   SERVER CONNECTION
   ========================================================= */

const API =
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.hostname}:8080`;

let socket = null;


/* =========================================================
   APP STATE
   ========================================================= */

let currentUser = null;
let friends = [];
let currentChatUserId = null;
let selectedMessageId = null;

let chats = {};


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
   BOTTOM NAVIGATION
   ========================================================= */

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


/* =========================================================
   SCREEN HELPERS
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
   ACCOUNT
   ========================================================= */

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


/* =========================================================
   SIGNUP
   ========================================================= */

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


/* =========================================================
   LOGIN
   ========================================================= */

function login() {
  try {
    const emailInput =
      document.getElementById("loginEmail");

    const passwordInput =
      document.getElementById("loginPassword");

    const status =
      document.getElementById("loginStatus");

    if (!emailInput || !passwordInput) {
      console.error(
        "Login inputs not found."
      );

      if (status) {
        status.textContent =
          "Login form error. Check the login HTML.";
      }

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

    console.log(
      "Account found:",
      account
    );

    if (!account) {
      if (status) {
        status.textContent =
          "No account found on this device. Create an account first.";
      }

      return;
    }

    if (
      email.toLowerCase() !==
      String(account.email).toLowerCase()
    ) {
      if (status) {
        status.textContent =
          "Incorrect email or password.";
      }

      return;
    }

    if (
      password !==
      String(account.password)
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

    showHome();

    connectSocket();

    console.log(
      "Login successful:",
      currentUser.id
    );

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
        "Login error. Press F12 and check Console.";
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

  hideBottomNav();

  showLogin();
}
