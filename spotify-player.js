/* =========================================================
   FRIENDCHAT - SPOTIFY PLAYER
   File: spotify/spotify-player.js

   Handles:
   - Spotify Web Playback SDK
   - Play / pause
   - Previous / next
   - Volume
   - Current track
   - Album artwork
   - FriendChat background artwork

   This file does NOT create the Spotify UI.
   ========================================================= */


const SpotifyPlayer = (() => {

  /* =======================================================
     PLAYER STATE
     ======================================================= */

  let player = null;

  let deviceId = null;

  let currentState = null;

  let isReady = false;

  let volume = 0.5;


  /* =======================================================
     WAIT FOR SPOTIFY WEB PLAYBACK SDK
     ======================================================= */

  function waitForSpotifySDK() {

    return new Promise((resolve, reject) => {

      /*
        Spotify normally creates:

        window.Spotify

        when the Web Playback SDK has loaded.
      */

      if (window.Spotify) {

        resolve();

        return;

      }


      let attempts = 0;

      const timer =
        setInterval(() => {

          attempts++;


          if (window.Spotify) {

            clearInterval(timer);

            resolve();

            return;

          }


          /*
            Stop waiting after 15 seconds.
          */

          if (attempts >= 150) {

            clearInterval(timer);

            reject(
              new Error(
                "Spotify Web Playback SDK did not load."
              )
            );

          }

        }, 100);

    });

  }


  /* =======================================================
     CREATE PLAYER
     ======================================================= */

  async function create() {

    if (player) {

      return player;

    }


    await waitForSpotifySDK();


    const token =
      await SpotifyAPI.getAccessToken();


    if (!token) {

      throw new Error(
        "Spotify is not connected."
      );

    }


    player =
      new Spotify.Player({

        name:
          "FriendChat Spotify",

        volume:
          volume,


        getOAuthToken:
          async callback => {

            try {

              const newToken =
                await SpotifyAPI.getAccessToken();


              callback(
                newToken || ""
              );

            } catch {

              callback("");

            }

          }

      });


    /* =====================================================
       PLAYER READY
       ===================================================== */

    player.addListener(
      "ready",
      async ({ device_id }) => {

        deviceId =
          device_id;

        isReady =
          true;


        console.log(
          "Spotify player ready:",
          deviceId
        );


        /*
          Tell Spotify that this device
          is available for playback.
        */

        try {

          await SpotifyAPI.request(
            "/me/player",
            {

              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  device_ids: [
                    deviceId
                  ],
                  play: false
                })

            }
          );

        } catch (error) {

          console.warn(
            "Could not transfer playback:",
            error.message
          );

        }


        emit(
          "ready",
          {
            deviceId
          }
        );

      }
    );


    /* =====================================================
       PLAYER NOT READY
       ===================================================== */

    player.addListener(
      "not_ready",
      ({ device_id }) => {

        console.warn(
          "Spotify device not ready:",
          device_id
        );


        if (
          deviceId === device_id
        ) {

          deviceId =
            null;

          isReady =
            false;

        }


        emit(
          "not_ready",
          {
            deviceId:
              device_id
          }
        );

      }
    );


    /* =====================================================
       INITIALIZATION ERROR
       ===================================================== */

    player.addListener(
      "initialization_error",
      ({ message }) => {

        console.error(
          "Spotify initialization error:",
          message
        );


        emit(
          "error",
          {
            type:
              "initialization",

            message
          }
        );

      }
    );


    /* =====================================================
       AUTHENTICATION ERROR
       ===================================================== */

    player.addListener(
      "authentication_error",
      ({ message }) => {

        console.error(
          "Spotify authentication error:",
          message
        );


        emit(
          "error",
          {
            type:
              "authentication",

            message
          }
        );

      }
    );


    /* =====================================================
       ACCOUNT ERROR
       ===================================================== */

    player.addListener(
      "account_error",
      ({ message }) => {

        console.error(
          "Spotify account error:",
          message
        );


        emit(
          "error",
          {
            type:
              "account",

            message
          }
        );

      }
    );


    /* =====================================================
       PLAYBACK ERROR
       ===================================================== */

    player.addListener(
      "playback_error",
      ({ message }) => {

        console.error(
          "Spotify playback error:",
          message
        );


        emit(
          "error",
          {
            type:
              "playback",

            message
          }
        );

      }
    );


    /* =====================================================
       TRACK / PLAYBACK STATE CHANGED
       ===================================================== */

    player.addListener(
      "player_state_changed",
      state => {

        if (!state) {

          return;

        }


        currentState =
          state;


        const track =
          state.track_window?.current_track;


        if (!track) {

          return;

        }


        /*
          Update FriendChat's
          background artwork.
        */

        updateBackground(
          track
        );


        /*
          Send the current song
          information to Spotify UI.
        */

        emit(
          "track",
          {

            track,

            paused:
              state.paused,

            position:
              state.position,

            duration:
              state.duration

          }
        );

      }
    );


    /* =====================================================
       CONNECT
       ===================================================== */

    const connected =
      await player.connect();


    if (!connected) {

      throw new Error(
        "Could not connect Spotify player."
      );

    }


    return player;

  }


  /* =======================================================
     PLAY
     ======================================================= */

  async function play() {

    if (!player) {

      await create();

    }


    await player.resume();

  }


  /* =======================================================
     PAUSE
     ======================================================= */

  async function pause() {

    if (!player) {

      return;

    }


    await player.pause();

  }


  /* =======================================================
     TOGGLE PLAY / PAUSE
     ======================================================= */

  async function togglePlay() {

    if (!player) {

      await create();

    }


    await player.togglePlay();

  }


  /* =======================================================
     NEXT TRACK
     ======================================================= */

  async function next() {

    if (!player) {

      return;

    }


    await player.nextTrack();

  }


  /* =======================================================
     PREVIOUS TRACK
     ======================================================= */

  async function previous() {

    if (!player) {

      return;

    }


    await player.previousTrack();

  }


  /* =======================================================
     SET VOLUME
     ======================================================= */

  async function setVolume(
    value
  ) {

    value =
      Number(value);


    /*
      Accept either:

      0 - 1

      or

      0 - 100
    */

    if (value > 1) {

      value =
        value / 100;

    }


    value =
      Math.max(
        0,
        Math.min(
          1,
          value
        )
      );


    volume =
      value;


    if (player) {

      await player.setVolume(
        value
      );

    }

  }


  /* =======================================================
     SEEK
     ======================================================= */

  async function seek(
    milliseconds
  ) {

    if (!player) {

      return;

    }


    milliseconds =
      Number(milliseconds);


    if (
      !Number.isFinite(
        milliseconds
      )
    ) {

      return;

    }


    await player.seek(
      milliseconds
    );

  }


  /* =======================================================
     GET PLAYER STATE
     ======================================================= */

  async function getState() {

    if (!player) {

      return null;

    }


    return player.getCurrentState();

  }


  /* =======================================================
     PLAY A SPECIFIC SPOTIFY TRACK
     ======================================================= */

  async function playTrack(
    trackUri
  ) {

    if (!trackUri) {

      return;

    }


    if (!deviceId) {

      await create();

    }


    const token =
      await SpotifyAPI.getAccessToken();


    if (!token) {

      throw new Error(
        "Spotify is not connected."
      );

    }


    /*
      Tell Spotify to play this
      track on FriendChat's player.
    */

    await SpotifyAPI.request(
      "/me/player/play?device_id=" +
      encodeURIComponent(
        deviceId
      ),
      {

        method:
          "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            uris: [
              trackUri
            ]

          })

      }
    );

  }


  /* =======================================================
     BACKGROUND ARTWORK
     ======================================================= */

  function updateBackground(
    track
  ) {

    if (!track) {

      return;

    }


    const images =
      track.album?.images || [];


    if (!images.length) {

      return;

    }


    /*
      Use the largest available
      Spotify album image.
    */

    const image =
      images[0]?.url;


    if (!image) {

      return;

    }


    /*
      Store the current artwork
      so the rest of FriendChat
      can use it.
    */

    document.documentElement
      .style
      .setProperty(
        "--spotify-background-image",
        `url("${image}")`
      );


    document.body
      .classList
      .add(
        "spotify-background-active"
      );


    /*
      Dispatch a custom event.

      spotify.js can listen to this
      without this file knowing
      anything about the UI.
    */

    window.dispatchEvent(
      new CustomEvent(
        "friendchat:spotify-background",
        {

          detail: {

            image,

            track

          }

        }
      )
    );

  }


  /* =======================================================
     CLEAR BACKGROUND
     ======================================================= */

  function clearBackground() {

    document.documentElement
      .style
      .removeProperty(
        "--spotify-background-image"
      );


    document.body
      .classList
      .remove(
        "spotify-background-active"
      );


    window.dispatchEvent(
      new CustomEvent(
        "friendchat:spotify-background-clear"
      )
    );

  }


  /* =======================================================
     EVENT SYSTEM
     ======================================================= */

  const listeners = {};


  function on(
    event,
    callback
  ) {

    if (
      !listeners[event]
    ) {

      listeners[event] =
        [];

    }


    listeners[event]
      .push(callback);


    /*
      Return a function that
      removes the listener.
    */

    return () => {

      listeners[event] =
        listeners[event]
          .filter(
            fn =>
              fn !== callback
          );

    };

  }


  function emit(
    event,
    data
  ) {

    const callbacks =
      listeners[event] || [];


    callbacks.forEach(
      callback => {

        try {

          callback(data);

        } catch (error) {

          console.error(
            "Spotify event error:",
            error
          );

        }

      }
    );

  }


  /* =======================================================
     DISCONNECT
     ======================================================= */

  async function disconnect() {

    if (!player) {

      return;

    }


    try {

      await player.disconnect();

    } catch {}

    player =
      null;

    deviceId =
      null;

    currentState =
      null;

    isReady =
      false;


    clearBackground();

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {

    create,

    play,

    pause,

    togglePlay,

    next,

    previous,

    setVolume,

    seek,

    getState,

    playTrack,

    disconnect,

    clearBackground,

    on,

    isReady: () =>
      isReady,

    getDeviceId: () =>
      deviceId

  };

})();