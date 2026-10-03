/* =========================================================
   FRIENDCHAT SUGGESTIONS
   Shows ALL other FriendChat accounts:
   - Online users
   - Offline users
   - Name
   - FriendChat ID
   - Status
   ========================================================= */

(function () {

  let suggestionsUsers = [];
  let suggestionsTimer = null;


  /* =======================================================
     HELPERS
     ======================================================= */

  function getMyId() {

    try {

      const account =
        JSON.parse(
          localStorage.getItem(
            "friendchat_account"
          )
        );

      return String(
        account?.id || ""
      )
        .trim()
        .toUpperCase();

    } catch (error) {

      console.error(
        "Could not read FriendChat account:",
        error
      );

      return "";

    }
  }


  function escapeHtml(value) {

    return String(
      value || ""
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* =======================================================
     CREATE SUGGESTIONS WINDOW
     ======================================================= */

  function createSuggestionsWindow() {

    let windowElement =
      document.getElementById(
        "friendchatSuggestions"
      );

    if (windowElement) {
      return windowElement;
    }


    windowElement =
      document.createElement("div");

    windowElement.id =
      "friendchatSuggestions";

    windowElement.className =
      "friendchatSuggestions hidden";


    windowElement.innerHTML = `

      <div class="suggestionsHeader">

        <div>
          <h2>Discover</h2>

          <p>
            FriendChat users
          </p>
        </div>

        <button
          type="button"
          class="suggestionsClose"
          onclick="closeSuggestions()"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <div
        id="suggestionsLoading"
        class="suggestionsLoading"
      >
        Loading users...
      </div>


      <div
        id="suggestionsList"
        class="suggestionsList"
      ></div>


      <div
        id="suggestionsEmpty"
        class="suggestionsEmpty hidden"
      >
        No other FriendChat users yet.
      </div>

    `;


    document.body.appendChild(
      windowElement
    );


    return windowElement;

  }


  /* =======================================================
     OPEN
     ======================================================= */

  async function openSuggestions() {

    const windowElement =
      createSuggestionsWindow();


    windowElement.classList.remove(
      "hidden"
    );


    await loadSuggestions();


    /*
      Refresh every 5 seconds while
      the suggestions window is open.
    */

    startSuggestionsRefresh();

  }


  /* =======================================================
     CLOSE
     ======================================================= */

  function closeSuggestions() {

    const windowElement =
      document.getElementById(
        "friendchatSuggestions"
      );


    if (!windowElement) {
      return;
    }


    windowElement.classList.add(
      "hidden"
    );


    stopSuggestionsRefresh();

  }


  /* =======================================================
     LOAD USERS FROM SERVER
     ======================================================= */

  async function loadSuggestions() {

    const loading =
      document.getElementById(
        "suggestionsLoading"
      );

    const list =
      document.getElementById(
        "suggestionsList"
      );

    const empty =
      document.getElementById(
        "suggestionsEmpty"
      );


    if (!list) {
      return;
    }


    const myId =
      getMyId();


    if (!myId) {

      list.innerHTML = "";

      if (loading) {
        loading.textContent =
          "Please log in first.";
      }

      return;

    }


    try {

      if (loading) {
        loading.classList.remove(
          "hidden"
        );

        loading.textContent =
          "Loading users...";
      }


      const response =
        await fetch(
          `/api/users?exclude=${encodeURIComponent(myId)}`,
          {
            cache: "no-store"
          }
        );


      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }


      const data =
        await response.json();


      suggestionsUsers =
        Array.isArray(data.users)
          ? data.users
          : Array.isArray(data)
            ? data
            : [];


      /*
        Safety check:
        never display the current account,
        even if the server accidentally
        sends it.
      */

      suggestionsUsers =
        suggestionsUsers.filter(
          user =>
            String(
              user.id || ""
            )
              .trim()
              .toUpperCase() !== myId
        );


      /*
        Online users first.
        Offline users after them.
      */

      suggestionsUsers.sort(
        (a, b) => {

          const aOnline =
            isUserOnline(a);

          const bOnline =
            isUserOnline(b);


          if (
            aOnline &&
            !bOnline
          ) {
            return -1;
          }


          if (
            !aOnline &&
            bOnline
          ) {
            return 1;
          }


          return String(
            a.name || ""
          ).localeCompare(
            String(
              b.name || ""
            )
          );

        }
      );


      renderSuggestions();


    } catch (error) {

      console.error(
        "Suggestions error:",
        error
      );


      suggestionsUsers = [];


      list.innerHTML = `

        <div class="suggestionsError">

          <strong>
            Could not load users
          </strong>

          <p>
            Check that FriendChat server is running.
          </p>

          <button
            type="button"
            onclick="loadSuggestions()"
          >
            Try again
          </button>

        </div>

      `;


      if (loading) {
        loading.classList.add(
          "hidden"
        );
      }


      if (empty) {
        empty.classList.add(
          "hidden"
        );
      }

    }

  }


  /* =======================================================
     ONLINE STATUS
     ======================================================= */

  function isUserOnline(user) {

    const status =
      String(
        user.status || ""
      )
        .toLowerCase();


    return (
      status === "active" ||
      status === "online" ||
      status === "busy" ||
      user.online === true
    );

  }


  /* =======================================================
     RENDER USERS
     ======================================================= */

  function renderSuggestions() {

    const loading =
      document.getElementById(
        "suggestionsLoading"
      );

    const list =
      document.getElementById(
        "suggestionsList"
      );

    const empty =
      document.getElementById(
        "suggestionsEmpty"
      );


    if (!list) {
      return;
    }


    if (loading) {
      loading.classList.add(
        "hidden"
      );
    }


    if (
      suggestionsUsers.length === 0
    ) {

      list.innerHTML = "";

      if (empty) {
        empty.classList.remove(
          "hidden"
        );
      }

      return;

    }


    if (empty) {
      empty.classList.add(
        "hidden"
      );
    }


    list.innerHTML =
      suggestionsUsers
        .map(
          user =>
            createSuggestionCard(
              user
            )
        )
        .join("");

  }


  /* =======================================================
     USER CARD
     ======================================================= */

  function createSuggestionCard(user) {

    const id =
      String(
        user.id || ""
      )
        .trim()
        .toUpperCase();


    const name =
      String(
        user.name || "FriendChat User"
      )
        .trim();


    const online =
      isUserOnline(user);


    const statusText =
      online
        ? "Online"
        : "Offline";


    const initial =
      escapeHtml(
        name
          .charAt(0)
          .toUpperCase()
      );


    return `

      <div
        class="suggestionCard ${
          online
            ? "userOnline"
            : "userOffline"
        }"
        data-user-id="${escapeHtml(id)}"
      >

        <button
          type="button"
          class="suggestionMain"
          onclick="openSuggestedUser('${escapeJs(id)}')"
        >

          <div class="suggestionAvatar">

            <span>
              ${initial}
            </span>

            <i
              class="suggestionStatusDot ${
                online
                  ? "online"
                  : "offline"
              }"
            ></i>

          </div>


          <div class="suggestionInfo">

            <strong>
              ${escapeHtml(name)}
            </strong>

            <span>
              ${escapeHtml(id)}
            </span>

            <small
              class="${
                online
                  ? "statusOnline"
                  : "statusOffline"
              }"
            >
              ${statusText}
            </small>

          </div>

        </button>


        <button
          type="button"
          class="suggestionChatButton"
          onclick="startChatFromSuggestion('${escapeJs(id)}')"
          title="Start chat"
        >
          💬
        </button>

      </div>

    `;

  }


  /* =======================================================
     ESCAPE JAVASCRIPT STRING
     ======================================================= */

  function escapeJs(value) {

    return String(
      value || ""
    )
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");

  }


  /* =======================================================
     FIND USER
     ======================================================= */

  function findSuggestedUser(id) {

    const normalizedId =
      String(
        id || ""
      )
        .trim()
        .toUpperCase();


    return suggestionsUsers.find(
      user =>
        String(
          user.id || ""
        )
          .trim()
          .toUpperCase() ===
        normalizedId
    );

  }


  /* =======================================================
     OPEN USER PROFILE / CHAT
     ======================================================= */

  async function openSuggestedUser(id) {

    const user =
      findSuggestedUser(id);


    if (!user) {
      return;
    }


    /*
      If your existing app has a profile
      function for another user, use it.
    */

    if (
      typeof window.openUserProfile ===
      "function"
    ) {

      window.openUserProfile(
        user
      );

      return;

    }


    /*
      Otherwise start a chat.
    */

    startChatFromSuggestion(
      user.id
    );

  }


  /* =======================================================
     START CHAT
     ======================================================= */

  function startChatFromSuggestion(id) {

    const user =
      findSuggestedUser(id);


    if (!user) {
      return;
    }


    /*
      Close discovery window.
    */

    closeSuggestions();


    /*
      Add the account to local friends
      if it isn't already there.
    */

    try {

      if (
        Array.isArray(window.friends)
      ) {

        const exists =
          window.friends.some(
            friend =>
              String(
                friend.id || ""
              )
                .trim()
                .toUpperCase() ===
              String(
                user.id
              )
                .trim()
                .toUpperCase()
          );


        if (!exists) {

          window.friends.push({
            id: user.id,
            name: user.name
          });


          if (
            typeof window.saveFriends ===
            "function"
          ) {
            window.saveFriends();
          }

        }

      }

    } catch (error) {

      console.error(
        "Could not add suggestion:",
        error
      );

    }


    /*
      Use your existing openChat()
      function if available.
    */

    if (
      typeof window.openChat ===
      "function"
    ) {

      window.openChat({
        id: user.id,
        name: user.name
      });

      return;

    }


    console.warn(
      "openChat() was not found."
    );

  }


  /* =======================================================
     AUTO REFRESH
     ======================================================= */

  function startSuggestionsRefresh() {

    stopSuggestionsRefresh();


    suggestionsTimer =
      setInterval(
        () => {

          const windowElement =
            document.getElementById(
              "friendchatSuggestions"
            );


          if (
            !windowElement ||
            windowElement.classList.contains(
              "hidden"
            )
          ) {

            stopSuggestionsRefresh();

            return;

          }


          loadSuggestions();

        },
        5000
      );

  }


  function stopSuggestionsRefresh() {

    if (suggestionsTimer) {

      clearInterval(
        suggestionsTimer
      );

      suggestionsTimer = null;

    }

  }


  /* =======================================================
     GLOBAL FUNCTIONS
     ======================================================= */

  window.openSuggestions =
    openSuggestions;

  window.closeSuggestions =
    closeSuggestions;

  window.loadSuggestions =
    loadSuggestions;

  window.renderSuggestions =
    renderSuggestions;

  window.openSuggestedUser =
    openSuggestedUser;

  window.startChatFromSuggestion =
    startChatFromSuggestion;


  /* =======================================================
     FC BUTTON
     ======================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      /*
        Support an existing FC button
        if it has one of these IDs/classes.
      */

      const possibleButtons = [
        document.getElementById(
          "fcButton"
        ),
        document.getElementById(
          "fcLogoButton"
        ),
        document.getElementById(
          "friendchatLogoButton"
        ),
        document.querySelector(
          ".fcButton"
        ),
        document.querySelector(
          ".friendchatLogoButton"
        )
      ];


      const fcButton =
        possibleButtons.find(
          button => !!button
        );


      if (fcButton) {

        fcButton.addEventListener(
          "click",
          event => {

            event.preventDefault();

            openSuggestions();

          }
        );

      }

    }
  );


})();
