/* =========================================================
   FRIENDCHAT - SPOTIFY API
   File: spotify/spotify-api.js

   This file handles:
   - Spotify configuration
   - PKCE login
   - Access tokens
   - Refresh tokens
   - Spotify Web API requests
   - Song searching

   DO NOT put Spotify UI code here.
   ========================================================= */


const SpotifyAPI = (() => {

  /* =======================================================
     CONFIGURATION
     ======================================================= */

  /*
    IMPORTANT:
    We will put your Spotify Client ID here later.

    Do NOT put a Spotify Client Secret in this file.
    This is browser-side code.
  */

  const CLIENT_ID = "1d70d85c139e49d9a13f99a2c7d0fca3";


  /*
    FriendChat currently runs from your server on port 8080.

    Spotify requires the redirect URI to exactly match
    the one registered in your Spotify Developer Dashboard.
  */

  const REDIRECT_URI =
    window.location.origin + window.location.pathname;


  const AUTH_URL =
    "https://accounts.spotify.com/authorize";

  const TOKEN_URL =
    "https://accounts.spotify.com/api/token";

  const API_URL =
    "https://api.spotify.com/v1";


  /* =======================================================
     STORAGE KEYS
     ======================================================= */

  const STORAGE = {

    accessToken:
      "friendchat_spotify_access_token",

    refreshToken:
      "friendchat_spotify_refresh_token",

    expiresAt:
      "friendchat_spotify_expires_at",

    verifier:
      "friendchat_spotify_code_verifier",

    state:
      "friendchat_spotify_state"

  };


  /* =======================================================
     SPOTIFY SCOPES
     ======================================================= */

  /*
    These permissions allow the Spotify player and
    playback controls to work.

    We will add more permissions later if needed.
  */

  const SCOPES = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing"
  ].join(" ");


  /* =======================================================
     BASIC HELPERS
     ======================================================= */

  function randomString(length = 64) {

    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const values =
      new Uint8Array(length);

    crypto.getRandomValues(values);

    let result = "";

    for (let i = 0; i < values.length; i++) {

      result +=
        characters[
          values[i] % characters.length
        ];

    }

    return result;
  }


  function base64UrlEncode(buffer) {

    const bytes =
      new Uint8Array(buffer);

    let binary = "";

    for (const byte of bytes) {

      binary +=
        String.fromCharCode(byte);

    }

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }


  async function createCodeChallenge(verifier) {

    const data =
      new TextEncoder().encode(verifier);

    const digest =
      await crypto.subtle.digest(
        "SHA-256",
        data
      );

    return base64UrlEncode(digest);
  }


  /* =======================================================
     LOGIN
     ======================================================= */

  async function login() {

    if (
      !CLIENT_ID ||
      CLIENT_ID === "YOUR_SPOTIFY_CLIENT_ID"
    ) {

      throw new Error(
        "Spotify Client ID has not been added yet."
      );

    }


    const verifier =
      randomString(128);

    const challenge =
      await createCodeChallenge(verifier);

    const state =
      randomString(32);


    localStorage.setItem(
      STORAGE.verifier,
      verifier
    );

    localStorage.setItem(
      STORAGE.state,
      state
    );


    const params =
      new URLSearchParams({

        response_type:
          "code",

        client_id:
          CLIENT_ID,

        scope:
          SCOPES,

        redirect_uri:
          REDIRECT_URI,

        state:
          state,

        code_challenge_method:
          "S256",

        code_challenge:
          challenge

      });


    window.location.href =
      AUTH_URL +
      "?" +
      params.toString();
  }


  /* =======================================================
     HANDLE SPOTIFY CALLBACK
     ======================================================= */

  async function handleCallback() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const code =
      params.get("code");

    const returnedState =
      params.get("state");

    const error =
      params.get("error");


    /*
      No Spotify callback.
    */

    if (!code && !error) {

      return false;

    }


    /*
      User cancelled Spotify login.
    */

    if (error) {

      cleanupCallback();

      throw new Error(
        "Spotify login was cancelled."
      );

    }


    const savedState =
      localStorage.getItem(
        STORAGE.state
      );


    /*
      Security check.
    */

    if (
      !savedState ||
      returnedState !== savedState
    ) {

      cleanupCallback();

      throw new Error(
        "Spotify security check failed."
      );

    }


    const verifier =
      localStorage.getItem(
        STORAGE.verifier
      );


    if (!verifier) {

      cleanupCallback();

      throw new Error(
        "Spotify code verifier is missing."
      );

    }


    await exchangeCode(
      code,
      verifier
    );


    cleanupCallback();

    return true;
  }


  /* =======================================================
     EXCHANGE AUTHORIZATION CODE
     ======================================================= */

  async function exchangeCode(
    code,
    verifier
  ) {

    const body =
      new URLSearchParams({

        grant_type:
          "authorization_code",

        code:
          code,

        redirect_uri:
          REDIRECT_URI,

        client_id:
          CLIENT_ID,

        code_verifier:
          verifier

      });


    const response =
      await fetch(
        TOKEN_URL,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },

          body:
            body.toString()

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error_description ||
        "Spotify token exchange failed."
      );

    }


    saveTokens(data);
  }


  /* =======================================================
     SAVE TOKENS
     ======================================================= */

  function saveTokens(data) {

    if (
      data.access_token
    ) {

      localStorage.setItem(
        STORAGE.accessToken,
        data.access_token
      );

    }


    if (
      data.refresh_token
    ) {

      localStorage.setItem(
        STORAGE.refreshToken,
        data.refresh_token
      );

    }


    if (
      data.expires_in
    ) {

      const expiresAt =
        Date.now() +
        Number(data.expires_in) * 1000;


      localStorage.setItem(
        STORAGE.expiresAt,
        String(expiresAt)
      );

    }

  }


  /* =======================================================
     GET SAVED ACCESS TOKEN
     ======================================================= */

  function getSavedAccessToken() {

    return localStorage.getItem(
      STORAGE.accessToken
    );

  }


  function getSavedRefreshToken() {

    return localStorage.getItem(
      STORAGE.refreshToken
    );

  }


  function getExpiresAt() {

    return Number(
      localStorage.getItem(
        STORAGE.expiresAt
      ) || 0
    );

  }


  /* =======================================================
     CHECK LOGIN
     ======================================================= */

  function isLoggedIn() {

    return Boolean(
      getSavedAccessToken() ||
      getSavedRefreshToken()
    );

  }


  /* =======================================================
     REFRESH ACCESS TOKEN
     ======================================================= */

  async function refreshAccessToken() {

    const refreshToken =
      getSavedRefreshToken();


    if (!refreshToken) {

      return false;

    }


    const body =
      new URLSearchParams({

        grant_type:
          "refresh_token",

        refresh_token:
          refreshToken,

        client_id:
          CLIENT_ID

      });


    const response =
      await fetch(
        TOKEN_URL,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },

          body:
            body.toString()

        }
      );


    if (!response.ok) {

      clearTokens();

      return false;

    }


    const data =
      await response.json();


    /*
      Spotify may not return a new
      refresh token.

      Therefore saveTokens() keeps
      the old one if necessary.
    */

    saveTokens(data);

    return true;
  }


  /* =======================================================
     GET VALID ACCESS TOKEN
     ======================================================= */

  async function getAccessToken() {

    const accessToken =
      getSavedAccessToken();

    const expiresAt =
      getExpiresAt();


    /*
      Give ourselves a 60-second
      safety margin.
    */

    if (
      accessToken &&
      Date.now() <
        expiresAt - 60000
    ) {

      return accessToken;

    }


    /*
      Token expired or missing.
      Try refreshing it.
    */

    const refreshed =
      await refreshAccessToken();


    if (!refreshed) {

      return null;

    }


    return getSavedAccessToken();
  }


  /* =======================================================
     SPOTIFY API REQUEST
     ======================================================= */

  async function request(
    endpoint,
    options = {}
  ) {

    let token =
      await getAccessToken();


    if (!token) {

      throw new Error(
        "Spotify is not connected."
      );

    }


    const headers = {

      ...(options.headers || {}),

      Authorization:
        "Bearer " + token

    };


    let response =
      await fetch(
        API_URL + endpoint,
        {
          ...options,
          headers
        }
      );


    /*
      Access token may have expired.
      Try refreshing once.
    */

    if (
      response.status === 401
    ) {

      const refreshed =
        await refreshAccessToken();


      if (refreshed) {

        token =
          getSavedAccessToken();


        headers.Authorization =
          "Bearer " + token;


        response =
          await fetch(
            API_URL + endpoint,
            {
              ...options,
              headers
            }
          );

      }

    }


    if (!response.ok) {

      let message =
        "Spotify API request failed.";


      try {

        const error =
          await response.json();


        message =
          error.error?.message ||
          message;

      } catch {}


      throw new Error(message);

    }


    /*
      Some Spotify requests return
      HTTP 204 with no JSON body.
    */

    if (
      response.status === 204
    ) {

      return null;

    }


    return response.json();
  }


  /* =======================================================
     SEARCH SONGS
     ======================================================= */

  async function searchTracks(
    query
  ) {

    if (!query?.trim()) {

      return [];

    }


    const params =
      new URLSearchParams({

        q:
          query.trim(),

        type:
          "track",

        limit:
          "10"

      });


    const data =
      await request(
        "/search?" +
        params.toString()
      );


    return (
      data.tracks?.items ||
      []
    );
  }


  /* =======================================================
     GET CURRENT PLAYBACK
     ======================================================= */

  async function getCurrentPlayback() {

    try {

      return await request(
        "/me/player"
      );

    } catch (error) {

      console.warn(
        "Could not get Spotify playback:",
        error.message
      );

      return null;

    }

  }


  /* =======================================================
     LOGOUT
     ======================================================= */

  function logout() {

    clearTokens();

  }


  function clearTokens() {

    localStorage.removeItem(
      STORAGE.accessToken
    );

    localStorage.removeItem(
      STORAGE.refreshToken
    );

    localStorage.removeItem(
      STORAGE.expiresAt
    );

    localStorage.removeItem(
      STORAGE.verifier
    );

    localStorage.removeItem(
      STORAGE.state
    );

  }


  /* =======================================================
     CLEAN CALLBACK URL
     ======================================================= */

  function cleanupCallback() {

    const cleanUrl =
      window.location.origin +
      window.location.pathname;


    window.history.replaceState(
      {},
      document.title,
      cleanUrl
    );

  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {

    login,

    handleCallback,

    getAccessToken,

    isLoggedIn,

    searchTracks,

    getCurrentPlayback,

    request,

    logout,

    clearTokens,

    getClientId: () =>
      CLIENT_ID,

    getRedirectUri: () =>
      REDIRECT_URI

  };

})();