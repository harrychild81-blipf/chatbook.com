/* =========================================================
   FRIENDCHAT SPOTIFY
   spotify/spotify.js
   ========================================================= */

(() => {
  "use strict";

  let spotifyButton = null;
  let sidebar = null;
  let spotifyWindow = null;
  let background = null;

  let searchInput = null;
  let searchResults = null;

  let cover = null;
  let trackTitle = null;
  let trackArtist = null;

  let playButton = null;
  let previousButton = null;
  let nextButton = null;

  let progress = null;
  let progressTime = null;
  let durationTime = null;

  let volumeSlider = null;

  let currentTrack = null;
  let currentPaused = true;
  let currentPosition = 0;
  let currentDuration = 0;

  let progressTimer = null;

  /* =======================================================
     HELPERS
     ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function createElement(tag, className, parent) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (parent) {
      parent.appendChild(element);
    }

    return element;
  }

  function formatTime(ms) {
    ms = Number(ms) || 0;

    const seconds = Math.floor(ms / 1000);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
      minutes +
      ":" +
      String(remainingSeconds).padStart(2, "0")
    );
  }

  function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function showMessage(text, type = "info") {
    let message = document.querySelector(
      ".friendchat-spotify-message"
    );

    if (!message) {
      message = createElement(
        "div",
        "friendchat-spotify-message",
        document.body
      );
    }

    message.textContent = text;
    message.dataset.type = type;

    clearTimeout(message._timer);

    message._timer = setTimeout(() => {
      message.classList.add("hidden");
    }, 5000);

    message.classList.remove("hidden");
  }


  /* =======================================================
     BACKGROUND
     ======================================================= */

  function createBackground() {

    if (background) {
      return;
    }

    background = createElement(
      "div",
      "friendchat-spotify-bg",
      document.body
    );

    background.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  function updateBackground(track) {

    if (!track) {
      return;
    }

    const images =
      track.album &&
      Array.isArray(track.album.images)
        ? track.album.images
        : [];

    if (!images.length) {
      return;
    }

    const image =
      images[0] &&
      images[0].url;

    if (!image) {
      return;
    }

    createBackground();

    background.style.backgroundImage =
      `url("${image}")`;

    background.classList.add("active");

    document.body.classList.add(
      "spotify-background-active"
    );

    window.dispatchEvent(
      new CustomEvent(
        "friendchat:spotify-track",
        {
          detail: {
            track: track
          }
        }
      )
    );
  }


  function clearBackground() {

    if (background) {
      background.style.backgroundImage = "";
      background.classList.remove("active");
    }

    document.body.classList.remove(
      "spotify-background-active"
    );
  }


  /* =======================================================
     SIDE BUTTON
     ======================================================= */

  function createSideButton() {

    if (spotifyButton) {
      return;
    }

    spotifyButton = createElement(
      "button",
      "spotify-side-button",
      document.body
    );

    spotifyButton.type = "button";

    spotifyButton.innerHTML = `
      <span class="spotify-side-icon">♫</span>
      <span class="spotify-side-text">Spotify</span>
    `;

    spotifyButton.title =
      "Open Spotify";

    spotifyButton.addEventListener(
      "click",
      toggleSidebar
    );
  }


  /* =======================================================
     SIDEBAR
     ======================================================= */

  function createSidebar() {

    if (sidebar) {
      return;
    }

    sidebar = createElement(
      "aside",
      "spotify-side-bar",
      document.body
    );

    sidebar.innerHTML = `
      <div class="spotify-sidebar-header">
        <strong>FriendChat</strong>

        <button
          type="button"
          class="spotify-sidebar-close"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        class="spotify-sidebar-item active"
        data-action="spotify"
      >
        <span>♫</span>
        <span>Spotify</span>
      </button>
    `;

    const closeButton =
      sidebar.querySelector(
        ".spotify-sidebar-close"
      );

    closeButton.addEventListener(
      "click",
      closeSidebar
    );

    const spotifyItem =
      sidebar.querySelector(
        '[data-action="spotify"]'
      );

    spotifyItem.addEventListener(
      "click",
      () => {

        openSpotifyWindow();

      }
    );
  }


  function openSidebar() {

    createSidebar();

    sidebar.classList.add("open");

    spotifyButton.classList.add("active");
  }


  function closeSidebar() {

    if (!sidebar) {
      return;
    }

    sidebar.classList.remove("open");

    if (spotifyButton) {
      spotifyButton.classList.remove(
        "active"
      );
    }
  }


  function toggleSidebar() {

    if (!sidebar) {
      createSidebar();
    }

    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }


  /* =======================================================
     SPOTIFY WINDOW
     ======================================================= */

  function createSpotifyWindow() {

    if (spotifyWindow) {
      return;
    }

    spotifyWindow = createElement(
      "div",
      "spotify-window",
      document.body
    );

    spotifyWindow.innerHTML = `
      <div class="spotify-window-header">

        <div class="spotify-window-title">
          <span class="spotify-logo-small">♫</span>

          <strong>Spotify</strong>
        </div>

        <div class="spotify-window-actions">

          <button
            type="button"
            class="spotify-minimize"
            title="Minimize"
          >
            −
          </button>

          <button
            type="button"
            class="spotify-close"
            title="Close"
          >
            ×
          </button>

        </div>

      </div>


      <div
        class="spotify-window-content"
        id="spotifyWindowContent"
      ></div>
    `;

    spotifyWindow
      .querySelector(".spotify-close")
      .addEventListener(
        "click",
        closeSpotifyWindow
      );

    spotifyWindow
      .querySelector(".spotify-minimize")
      .addEventListener(
        "click",
        minimizeSpotifyWindow
      );

    buildSpotifyContent();
  }


  function openSpotifyWindow() {

    createSpotifyWindow();

    spotifyWindow.classList.remove(
      "minimized"
    );

    spotifyWindow.classList.add(
      "open"
    );

    closeSidebar();

    updateSpotifyScreen();

  }


  function closeSpotifyWindow() {

    if (!spotifyWindow) {
      return;
    }

    spotifyWindow.classList.remove(
      "open"
    );
  }


  function minimizeSpotifyWindow() {

    if (!spotifyWindow) {
      return;
    }

    spotifyWindow.classList.toggle(
      "minimized"
    );
  }


  /* =======================================================
     SPOTIFY CONTENT
     ======================================================= */

  function buildSpotifyContent() {

    const content =
      $("spotifyWindowContent");

    if (!content) {
      return;
    }

    content.innerHTML = "";

    /* -----------------------------------------------
       LOGIN
       ----------------------------------------------- */

    if (
      !window.SpotifyAPI ||
      !SpotifyAPI.isLoggedIn()
    ) {

      const loginBox =
        createElement(
          "div",
          "spotify-login-box",
          content
        );

      loginBox.innerHTML = `
        <div class="spotify-login-icon">
          ♫
        </div>

        <h2>
          Connect Spotify
        </h2>

        <p>
          Connect your Spotify account to
          search and play music in FriendChat.
        </p>

        <button
          type="button"
          class="spotify-login-button"
        >
          Connect Spotify
        </button>

        <small class="spotify-login-note">
          Your Spotify login is handled by Spotify.
        </small>
      `;

      loginBox
        .querySelector(
          ".spotify-login-button"
        )
        .addEventListener(
          "click",
          async () => {

            try {

              await SpotifyAPI.login();

            } catch (error) {

              console.error(
                "Spotify login error:",
                error
              );

              showMessage(
                error.message ||
                "Could not connect Spotify.",
                "error"
              );

            }

          }
        );

      return;
    }


    /* -----------------------------------------------
       MAIN PLAYER
       ----------------------------------------------- */

    const main =
      createElement(
        "div",
        "spotify-main",
        content
      );


    /* SEARCH */

    const searchBox =
      createElement(
        "div",
        "spotify-search-box",
        main
      );

    searchBox.innerHTML = `
      <input
        class="spotify-search-input"
        type="text"
        placeholder="Search songs, artists..."
        autocomplete="off"
      >

      <button
        type="button"
        class="spotify-search-button"
      >
        🔍
      </button>
    `;

    searchInput =
      searchBox.querySelector(
        ".spotify-search-input"
      );


    searchBox
      .querySelector(
        ".spotify-search-button"
      )
      .addEventListener(
        "click",
        searchSpotify
      );


    searchInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          searchSpotify();

        }

      }
    );


    /* SEARCH RESULTS */

    searchResults =
      createElement(
        "div",
        "spotify-search-results",
        main
      );


    /* NOW PLAYING */

    const nowPlaying =
      createElement(
        "div",
        "spotify-now-playing",
        main
      );


    const coverBox =
      createElement(
        "div",
        "spotify-cover-box",
        nowPlaying
      );


    cover =
      createElement(
        "img",
        "spotify-cover",
        coverBox
      );

    cover.alt =
      "Album cover";


    const information =
      createElement(
        "div",
        "spotify-track-information",
        nowPlaying
      );


    trackTitle =
      createElement(
        "div",
        "spotify-track-title",
        information
      );

    trackTitle.textContent =
      "Nothing playing";


    trackArtist =
      createElement(
        "div",
        "spotify-track-artist",
        information
      );

    trackArtist.textContent =
      "Choose a song";


    /* PROGRESS */

    const progressBox =
      createElement(
        "div",
        "spotify-progress-box",
        main
      );


    progress =
      createElement(
        "input",
        "spotify-progress",
        progressBox
      );

    progress.type = "range";

    progress.min = "0";
    progress.max = "100";
    progress.value = "0";
    progress.step = "1";


    const times =
      createElement(
        "div",
        "spotify-times",
        progressBox
      );


    progressTime =
      createElement(
        "span",
        "",
        times
      );

    progressTime.textContent =
      "0:00";


    durationTime =
      createElement(
        "span",
        "",
        times
      );

    durationTime.textContent =
      "0:00";


    progress.addEventListener(
      "input",
      () => {

        if (
          !currentDuration
        ) {
          return;
        }

        const percent =
          Number(progress.value) / 100;

        const position =
          currentDuration * percent;

        SpotifyPlayer.seek(
          position
        ).catch(
          console.error
        );

      }
    );


    /* CONTROLS */

    const controls =
      createElement(
        "div",
        "spotify-controls",
        main
      );


    previousButton =
      createElement(
        "button",
        "spotify-control-button",
        controls
      );

    previousButton.innerHTML =
      "⏮";

    previousButton.title =
      "Previous";


    playButton =
      createElement(
        "button",
        "spotify-play-button",
        controls
      );

    playButton.innerHTML =
      "▶";

    playButton.title =
      "Play";


    nextButton =
      createElement(
        "button",
        "spotify-control-button",
        controls
      );

    nextButton.innerHTML =
      "⏭";

    nextButton.title =
      "Next";


    previousButton.addEventListener(
      "click",
      async () => {

        try {

          await SpotifyPlayer.previous();

        } catch (error) {

          handleSpotifyError(error);

        }

      }
    );


    playButton.addEventListener(
      "click",
      async () => {

        try {

          await SpotifyPlayer.togglePlay();

        } catch (error) {

          handleSpotifyError(error);

        }

      }
    );


    nextButton.addEventListener(
      "click",
      async () => {

        try {

          await SpotifyPlayer.next();

        } catch (error) {

          handleSpotifyError(error);

        }

      }
    );


    /* VOLUME */

    const volumeBox =
      createElement(
        "div",
        "spotify-volume-box",
        main
      );


    const volumeLabel =
      createElement(
        "span",
        "",
        volumeBox
      );

    volumeLabel.textContent =
      "🔊";


    volumeSlider =
      createElement(
        "input",
        "spotify-volume",
        volumeBox
      );

    volumeSlider.type =
      "range";

    volumeSlider.min =
      "0";

    volumeSlider.max =
      "100";

    volumeSlider.value =
      "50";


    volumeSlider.addEventListener(
      "input",
      () => {

        SpotifyPlayer
          .setVolume(
            Number(
              volumeSlider.value
            )
          )
          .catch(
            console.error
          );

      }
    );


    /* LOGOUT */

    const footer =
      createElement(
        "div",
        "spotify-footer",
        main
      );


    const logout =
      createElement(
        "button",
        "spotify-logout-button",
        footer
      );

    logout.textContent =
      "Disconnect Spotify";


    logout.addEventListener(
      "click",
      disconnectSpotify
    );


    /* CREATE PLAYER */

    initializePlayer();

  }


  /* =======================================================
     UPDATE SCREEN
     ======================================================= */

  function updateSpotifyScreen() {

    if (!spotifyWindow) {
      return;
    }

    buildSpotifyContent();

  }


  /* =======================================================
     LOGIN CALLBACK
     ======================================================= */

  async function handleSpotifyCallback() {

    if (
      !window.SpotifyAPI
    ) {
      return;
    }

    try {

      const connected =
        await SpotifyAPI.handleCallback();

      if (connected) {

        openSpotifyWindow();

        showMessage(
          "Spotify connected.",
          "success"
        );

      }

    } catch (error) {

      console.error(
        "Spotify callback error:",
        error
      );

      openSpotifyWindow();

      showMessage(
        error.message ||
        "Spotify login failed.",
        "error"
      );

    }

  }


  /* =======================================================
     PLAYER
     ======================================================= */

  async function initializePlayer() {

    if (
      !window.SpotifyPlayer
    ) {
      return;
    }

    try {

      await SpotifyPlayer.create();

      await syncCurrentPlayback();

    } catch (error) {

      console.error(
        "Spotify player error:",
        error
      );

      showMessage(
        error.message ||
        "Spotify player could not start.",
        "error"
      );

    }

  }


  /* =======================================================
     CURRENT PLAYBACK
     ======================================================= */

  async function syncCurrentPlayback() {

    try {

      const playback =
        await SpotifyAPI.getCurrentPlayback();

      if (
        !playback ||
        !playback.item
      ) {
        return;
      }

      currentTrack =
        playback.item;

      currentPaused =
        !playback.is_playing;

      currentPosition =
        playback.progress_ms || 0;

      currentDuration =
        playback.item.duration_ms || 0;

      updateTrackUI();

      updateBackground(
        currentTrack
      );

    } catch (error) {

      console.warn(
        "Could not sync Spotify playback:",
        error
      );

    }

  }


  /* =======================================================
     SEARCH
     ======================================================= */

  async function searchSpotify() {

    if (!searchInput) {
      return;
    }

    const query =
      searchInput.value.trim();

    if (!query) {
      return;
    }

    if (
      !window.SpotifyAPI ||
      !SpotifyAPI.isLoggedIn()
    ) {

      showMessage(
        "Connect Spotify first.",
        "error"
      );

      return;
    }


    searchResults.innerHTML = `
      <div class="spotify-search-loading">
        Searching...
      </div>
    `;


    try {

      const data =
        await SpotifyAPI.searchTracks(
          query
        );

      renderSearchResults(
        data
      );

    } catch (error) {

      console.error(
        "Spotify search error:",
        error
      );

      searchResults.innerHTML = `
        <div class="spotify-search-error">
          Search failed.
        </div>
      `;

      handleSpotifyError(
        error
      );

    }

  }


  /* =======================================================
     SEARCH RESULTS
     ======================================================= */

  function renderSearchResults(data) {

    if (!searchResults) {
      return;
    }

    searchResults.innerHTML = "";


    const tracks =
      data &&
      data.tracks &&
      Array.isArray(data.tracks.items)
        ? data.tracks.items
        : [];


    if (!tracks.length) {

      searchResults.innerHTML = `
        <div class="spotify-no-results">
          No songs found.
        </div>
      `;

      return;
    }


    tracks.forEach(
      track => {

        const item =
          createElement(
            "button",
            "spotify-result",
            searchResults
          );

        item.type =
          "button";


        const image =
          track.album &&
          track.album.images &&
          track.album.images[2]
            ? track.album.images[2].url
            : (
                track.album &&
                track.album.images &&
                track.album.images[0]
                  ? track.album.images[0].url
                  : ""
              );


        const artists =
          Array.isArray(
            track.artists
          )
            ? track.artists
                .map(
                  artist =>
                    artist.name
                )
                .join(", ")
            : "";


        item.innerHTML = `
          ${
            image
              ? `<img
                   src="${escapeHTML(image)}"
                   alt=""
                 >`
              : `<div class="spotify-result-placeholder">
                   ♫
                 </div>`
          }

          <div class="spotify-result-info">

            <strong>
              ${escapeHTML(track.name)}
            </strong>

            <span>
              ${escapeHTML(artists)}
            </span>

          </div>

          <span class="spotify-result-play">
            ▶
          </span>
        `;


        item.addEventListener(
          "click",
          () => {

            playTrack(
              track
            );

          }
        );

      }
    );

  }


  /* =======================================================
     PLAY TRACK
     ======================================================= */

  async function playTrack(track) {

    if (!track) {
      return;
    }

    if (!track.uri) {
      return;
    }


    try {

      currentTrack =
        track;

      currentPaused =
        false;

      currentPosition =
        0;

      currentDuration =
        track.duration_ms || 0;


      updateTrackUI();

      updateBackground(
        track
      );


      await SpotifyPlayer.playTrack(
        track.uri
      );


      updatePlayButton(
        false
      );

    } catch (error) {

      console.error(
        "Could not play track:",
        error
      );

      handleSpotifyError(
        error
      );

    }

  }


  /* =======================================================
     TRACK UI
     ======================================================= */

  function updateTrackUI() {

    if (!currentTrack) {
      return;
    }


    if (trackTitle) {

      trackTitle.textContent =
        currentTrack.name ||
        "Unknown track";

    }


    if (trackArtist) {

      const artists =
        Array.isArray(
          currentTrack.artists
        )
          ? currentTrack.artists
              .map(
                artist =>
                  artist.name
              )
              .join(", ")
          : "Unknown artist";


      trackArtist.textContent =
        artists;

    }


    if (cover) {

      const images =
        currentTrack.album &&
        currentTrack.album.images
          ? currentTrack.album.images
          : [];


      if (images.length) {

        cover.src =
          images[0].url;

        cover.classList.add(
          "loaded"
        );

      }

    }


    if (progress) {

      progress.value =
        currentDuration
          ? (
              currentPosition /
              currentDuration
            ) * 100
          : 0;

    }


    if (progressTime) {

      progressTime.textContent =
        formatTime(
          currentPosition
        );

    }


    if (durationTime) {

      durationTime.textContent =
        formatTime(
          currentDuration
        );

    }


    updatePlayButton(
      currentPaused
    );

  }


  /* =======================================================
     PLAY BUTTON
     ======================================================= */

  function updatePlayButton(paused) {

    if (!playButton) {
      return;
    }

    playButton.innerHTML =
      paused
        ? "▶"
        : "⏸";

    playButton.title =
      paused
        ? "Play"
        : "Pause";

  }


  /* =======================================================
     PLAYER EVENTS
     ======================================================= */

  function setupPlayerEvents() {

    if (
      !window.SpotifyPlayer
    ) {
      return;
    }


    SpotifyPlayer.on(
      "track",
      data => {

        if (!data) {
          return;
        }


        currentTrack =
          data.track;

        currentPaused =
          Boolean(
            data.paused
          );

        currentPosition =
          Number(
            data.position
          ) || 0;

        currentDuration =
          Number(
            data.duration
          ) || (
            data.track &&
            data.track.duration_ms
          ) || 0;


        updateTrackUI();

        updateBackground(
          currentTrack
        );


        window.dispatchEvent(
          new CustomEvent(
            "friendchat:spotify-track",
            {
              detail: {
                track:
                  currentTrack,

                paused:
                  currentPaused,

                position:
                  currentPosition,

                duration:
                  currentDuration
              }
            }
          )
        );

      }
    );


    SpotifyPlayer.on(
      "ready",
      () => {

        syncCurrentPlayback();

      }
    );

  }


  /* =======================================================
     PROGRESS TIMER
     ======================================================= */

  function startProgressTimer() {

    if (progressTimer) {
      clearInterval(
        progressTimer
      );
    }


    progressTimer =
      setInterval(
        () => {

          if (
            currentPaused ||
            !currentDuration
          ) {
            return;
          }


          currentPosition +=
            500;


          if (
            currentPosition >
            currentDuration
          ) {

            currentPosition =
              currentDuration;

          }


          if (progress) {

            progress.value =
              (
                currentPosition /
                currentDuration
              ) * 100;

          }


          if (progressTime) {

            progressTime.textContent =
              formatTime(
                currentPosition
              );

          }

        },
        500
      );

  }


  /* =======================================================
     DISCONNECT
     ======================================================= */

  async function disconnectSpotify() {

    const confirmed =
      window.confirm(
        "Disconnect Spotify from FriendChat?"
      );

    if (!confirmed) {
      return;
    }


    try {

      if (
        window.SpotifyPlayer
      ) {

        await SpotifyPlayer.disconnect();

      }

    } catch (error) {

      console.warn(
        "Spotify disconnect error:",
        error
      );

    }


    if (
      window.SpotifyAPI
    ) {

      SpotifyAPI.logout();

    }


    currentTrack = null;

    currentPaused = true;

    currentPosition = 0;

    currentDuration = 0;


    clearBackground();

    updateSpotifyScreen();

  }


  /* =======================================================
     ERROR HANDLER
     ======================================================= */

  function handleSpotifyError(error) {

    console.error(
      "Spotify:",
      error
    );


    let message =
      "Spotify error.";


    if (error) {

      const text =
        String(
          error.message ||
          error
        );


      if (
        text.toLowerCase()
          .includes("premium")
      ) {

        message =
          "Spotify Premium is required for playback.";

      } else if (
        text.toLowerCase()
          .includes("not connected")
      ) {

        message =
          "Connect Spotify first.";

      } else if (
        text.toLowerCase()
          .includes("token")
      ) {

        message =
          "Spotify login expired. Please reconnect.";

      } else if (
        text.length < 150
      ) {

        message =
          text;

      }

    }


    showMessage(
      message,
      "error"
    );

  }


  /* =======================================================
     GLOBAL FUNCTIONS
     ======================================================= */

  window.openSpotifyPanel =
    openSpotifyWindow;

  window.closeSpotifyPanel =
    closeSpotifyWindow;

  window.toggleSpotifyPanel =
    openSpotifyWindow;


  /* =======================================================
     INITIALIZATION
     ======================================================= */

  function initialize() {

    createBackground();

    createSideButton();

    createSidebar();

    setupPlayerEvents();

    startProgressTimer();

    handleSpotifyCallback();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }

})();