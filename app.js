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

    // Check that the login form exists
    if (!emailInput || !passwordInput) {
      console.error(
        "Login elements not found.",
        {
          emailInput,
          passwordInput,
          status
        }
      );

      if (status) {
        status.textContent =
          "Login form error. Check login HTML.";
      }

      return;
    }

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    // Empty email
    if (!email) {
      if (status) {
        status.textContent =
          "Enter your email.";
      }

      emailInput.focus();
      return;
    }

    // Empty password
    if (!password) {
      if (status) {
        status.textContent =
          "Enter your password.";
      }

      passwordInput.focus();
      return;
    }

    // Get saved account
    const account =
      loadAccount();

    console.log(
      "Saved FriendChat account:",
      account
    );

    // No account
    if (!account) {
      if (status) {
        status.textContent =
          "No account found on this device. Create an account first.";
      }

      return;
    }

    // Check email
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

    // Check password
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

    /* =====================================================
       LOGIN SUCCESS
       ===================================================== */

    currentUser = account;

    loadFriends();
    loadChats();

    updateHome();

    // Connect to FriendChat server
    connectSocket();

    // Open home screen
    showHome();

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
