/* =========================================================
   FRIENDCHAT UI V3
   Floating Sidebar + Theme + Profile + Discovery
   Works ON TOP of the existing FriendChat app.js

   IMPORTANT:
   - No sliding sidebar
   - No hamburger button
   - No bottom dock
   - Floating sidebar overlays the existing app
   - Existing FriendChat layout is NOT resized
   ========================================================= */

(function () {
    "use strict";

    const UI_ID = "friendchat-custom-ui";


    /* =========================================================
       THEMES
       ========================================================= */

    const themes = {
        midnight: {
            name: "Midnight",
            bg: "#070a11",
            panel: "#0d111b",
            panel2: "#151a2a",
            card: "#111625",
            text: "#f4f5fa",
            muted: "#8f96a8",
            accent: "#7c5cff",
            accent2: "#5d46d8",
            border: "rgba(255,255,255,.08)"
        },

        emerald: {
            name: "Emerald",
            bg: "#06100d",
            panel: "#0b1713",
            panel2: "#10231c",
            card: "#0d1d17",
            text: "#f1fff8",
            muted: "#8da99d",
            accent: "#20c98b",
            accent2: "#15966a",
            border: "rgba(255,255,255,.08)"
        },

        ocean: {
            name: "Ocean",
            bg: "#050d15",
            panel: "#091520",
            panel2: "#102333",
            card: "#0b1c2a",
            text: "#f1f8ff",
            muted: "#8fa7b9",
            accent: "#36a9ff",
            accent2: "#197ec5",
            border: "rgba(255,255,255,.08)"
        },

        sunset: {
            name: "Sunset",
            bg: "#120a09",
            panel: "#1b100e",
            panel2: "#281614",
            card: "#21110f",
            text: "#fff5f1",
            muted: "#b49a94",
            accent: "#ff7a45",
            accent2: "#d9562b",
            border: "rgba(255,255,255,.08)"
        },

        rose: {
            name: "Rose",
            bg: "#11070d",
            panel: "#1b0d15",
            panel2: "#28121e",
            card: "#21101a",
            text: "#fff3f8",
            muted: "#b99aa9",
            accent: "#ec5ca8",
            accent2: "#bd3d80",
            border: "rgba(255,255,255,.08)"
        },

        graphite: {
            name: "Graphite",
            bg: "#090909",
            panel: "#111111",
            panel2: "#191919",
            card: "#141414",
            text: "#f4f4f4",
            muted: "#999999",
            accent: "#eeeeee",
            accent2: "#bbbbbb",
            border: "rgba(255,255,255,.09)"
        }
    };


    /* =========================================================
       HELPERS
       ========================================================= */

    function $(selector) {
        return document.querySelector(selector);
    }


    function createElement(tag, className, html) {

        const el = document.createElement(tag);

        if (className) {
            el.className = className;
        }

        if (html !== undefined) {
            el.innerHTML = html;
        }

        return el;
    }


    function removeElement(id) {

        const el = document.getElementById(id);

        if (el) {
            el.remove();
        }
    }


    function safeCall(fnName, ...args) {

        try {

            if (typeof window[fnName] === "function") {
                return window[fnName](...args);
            }

        } catch (error) {

            console.warn(
                "FriendChat UI:",
                fnName,
                error
            );
        }

        return null;
    }


    /* =========================================================
       REMOVE OLD CUSTOM UI
       ========================================================= */

    function removeOldCustomUI() {

        /* Remove old custom wrapper */

        removeElement(UI_ID);


        /* Remove previous versions */

        const oldSelectors = [
            "#fc-nav-toggle",
            "#fc-sidebar",
            "#fc-bottom-dock",

            ".fc-nav-toggle",
            ".fc-sidebar",
            ".fc-bottom-dock",

            ".fc-discovery",
            ".fc-theme-panel",

            "#fc-discovery",
            "#fc-theme-panel",

            "#fc-quick-actions"
        ];


        document
            .querySelectorAll(oldSelectors.join(","))
            .forEach(el => {

                try {
                    el.remove();
                } catch (error) {
                    console.warn(error);
                }

            });
    }


    /* =========================================================
       HIDE OLD NAVIGATION
       ========================================================= */

    function hideOldNavigation() {

        const selectors = [

            ".spotify-side-button",
            ".spotify-side-bar",

            ".fc-old-sidebar",
            ".fc-old-nav",

            ".old-sidebar",
            ".old-nav",

            ".side-nav",
            ".sidebar-nav"

        ];


        selectors.forEach(selector => {

            document
                .querySelectorAll(selector)
                .forEach(el => {

                    el.style.display = "none";
                    el.style.visibility = "hidden";
                    el.style.pointerEvents = "none";

                });

        });
    }


    /* =========================================================
       THEME
       ========================================================= */

    function applyTheme(themeName) {

        const theme = themes[themeName];

        if (!theme) {
            return;
        }


        const root =
            document.documentElement;


        root.style.setProperty(
            "--fc-bg",
            theme.bg
        );

        root.style.setProperty(
            "--fc-panel",
            theme.panel
        );

        root.style.setProperty(
            "--fc-panel-2",
            theme.panel2
        );

        root.style.setProperty(
            "--fc-card",
            theme.card
        );

        root.style.setProperty(
            "--fc-text",
            theme.text
        );

        root.style.setProperty(
            "--fc-muted",
            theme.muted
        );

        root.style.setProperty(
            "--fc-accent",
            theme.accent
        );

        root.style.setProperty(
            "--fc-accent-2",
            theme.accent2
        );

        root.style.setProperty(
            "--fc-border",
            theme.border
        );


        try {

            localStorage.setItem(
                "friendchat_theme",
                themeName
            );

        } catch (error) {
            console.warn(error);
        }


        document.body.dataset.fcTheme =
            themeName;
    }


    function loadTheme() {

        let saved = null;

        try {

            saved =
                localStorage.getItem(
                    "friendchat_theme"
                );

        } catch (error) {
            console.warn(error);
        }


        if (
            saved &&
            themes[saved]
        ) {

            applyTheme(saved);

        } else {

            applyTheme("midnight");
        }
    }


    /* =========================================================
       FLOATING BAR CSS
       ========================================================= */

    function injectCSS() {

        if (
            document.getElementById(
                "friendchat-ui-v3-inline-css"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "friendchat-ui-v3-inline-css";


        style.textContent = `

        /* =====================================================
           THEME VARIABLES
           ===================================================== */

        :root {
            --fc-bg: #070a11;
            --fc-panel: #0d111b;
            --fc-panel-2: #151a2a;
            --fc-card: #111625;
            --fc-text: #f4f5fa;
            --fc-muted: #8f96a8;
            --fc-accent: #7c5cff;
            --fc-accent-2: #5d46d8;
            --fc-border: rgba(255,255,255,.08);
        }


        /* =====================================================
           BODY THEME
           ===================================================== */

        body {
            background: var(--fc-bg) !important;
        }


        /* =====================================================
           IMPORTANT:
           DO NOT CHANGE FRIENDCHAT'S MAIN LAYOUT
           ===================================================== */

        #loginScreen,
        #signupScreen,
        #homeScreen,
        #addScreen,
        #chatScreen,
        #profileScreen {

            box-sizing: border-box !important;

        }


        /*
         * The custom UI must NEVER create a layout column.
         */

        .app,
        #app,
        main {

            box-sizing: border-box;

        }


        /* =====================================================
           OLD TOGGLE COMPLETELY DISABLED
           ===================================================== */

        #fc-nav-toggle,
        .fc-nav-toggle {

            display: none !important;

            visibility: hidden !important;

            pointer-events: none !important;

        }


        /* =====================================================
           OLD BOTTOM DOCK DISABLED
           ===================================================== */

        #fc-bottom-dock,
        .fc-bottom-dock {

            display: none !important;

            visibility: hidden !important;

            pointer-events: none !important;

        }


        /* =====================================================
           PERMANENT FLOATING SIDEBAR
           ===================================================== */

        #fc-sidebar,
        .fc-sidebar {

            position: fixed !important;

            left: 14px !important;

            top: 20px !important;

            bottom: 20px !important;

            width: 68px !important;

            height: auto !important;

            min-height: 0 !important;

            max-height: none !important;

            margin: 0 !important;

            padding: 10px 7px !important;

            box-sizing: border-box !important;

            display: flex !important;

            flex-direction: column !important;

            align-items: center !important;

            justify-content: flex-start !important;

            gap: 10px !important;

            background:
                rgba(13,17,27,.96) !important;

            border:
                1px solid var(--fc-border) !important;

            border-radius: 20px !important;

            box-shadow:
                0 18px 55px rgba(0,0,0,.45) !important;

            backdrop-filter:
                blur(20px) !important;

            -webkit-backdrop-filter:
                blur(20px) !important;

            z-index: 1000000 !important;

            transform: none !important;

            opacity: 1 !important;

            visibility: visible !important;

            overflow: hidden !important;

            pointer-events: auto !important;

            transition: none !important;

        }


        /*
         * Even if JS accidentally adds "open",
         * the sidebar DOES NOT slide.
         */

        #fc-sidebar.open,
        .fc-sidebar.open {

            position: fixed !important;

            transform: none !important;

            opacity: 1 !important;

            visibility: visible !important;

            left: 14px !important;

            top: 20px !important;

            bottom: 20px !important;

        }


        /* =====================================================
           SIDEBAR HEADER
           ===================================================== */

        .fc-sidebar-header {

            width: 100% !important;

            height: 42px !important;

            min-height: 42px !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            padding: 0 !important;

            margin: 0 0 5px 0 !important;

        }


        .fc-sidebar-logo {

            width: 40px !important;

            height: 40px !important;

            min-width: 40px !important;

            border-radius: 13px !important;

            background:
                linear-gradient(
                    135deg,
                    var(--fc-accent),
                    var(--fc-accent-2)
                ) !important;

            color: white !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            font-weight: 800 !important;

            font-size: 14px !important;

            box-shadow:
                0 8px 20px
                rgba(124,92,255,.22) !important;

        }


        /*
         * Hide the text so the bar remains thin.
         */

        .fc-sidebar-title,
        .fc-sidebar-subtitle {

            display: none !important;

        }


        /* =====================================================
           SIDEBAR ITEMS
           ===================================================== */

        .fc-sidebar-items {

            width: 100% !important;

            display: flex !important;

            flex-direction: column !important;

            align-items: center !important;

            gap: 7px !important;

            margin: 0 !important;

            padding: 0 !important;

        }


        .fc-sidebar-item {

            width: 50px !important;

            height: 50px !important;

            min-width: 50px !important;

            min-height: 50px !important;

            padding: 0 !important;

            margin: 0 !important;

            border: 0 !important;

            border-radius: 15px !important;

            background: transparent !important;

            color: var(--fc-muted) !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            cursor: pointer !important;

            transition:
                background .18s ease,
                color .18s ease,
                transform .18s ease !important;

        }


        .fc-sidebar-item:hover {

            background:
                var(--fc-panel-2) !important;

            color:
                var(--fc-text) !important;

            transform:
                scale(1.04) !important;

        }


        .fc-sidebar-item:active {

            transform:
                scale(.96) !important;

        }


        .fc-sidebar-icon {

            width: 50px !important;

            height: 50px !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            font-size: 21px !important;

            line-height: 1 !important;

        }


        /*
         * Hide the written labels.
         * Icons remain visible.
         */

        .fc-sidebar-item > span:not(.fc-sidebar-icon) {

            display: none !important;

        }


        /* =====================================================
           OVERLAY WINDOWS
           ===================================================== */

        .fc-overlay {

            position: fixed !important;

            inset: 0 !important;

            background:
                rgba(0,0,0,.35) !important;

            backdrop-filter:
                blur(3px) !important;

            -webkit-backdrop-filter:
                blur(3px) !important;

            z-index: 999900 !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            opacity: 0 !important;

            pointer-events: none !important;

            transition:
                opacity .2s ease !important;

        }


        .fc-overlay.show {

            opacity: 1 !important;

            pointer-events: auto !important;

        }


        .fc-window {

            width:
                min(430px, calc(100vw - 30px)) !important;

            max-height:
                min(600px, calc(100vh - 40px)) !important;

            overflow:
                auto !important;

            background:
                var(--fc-panel) !important;

            border:
                1px solid var(--fc-border) !important;

            border-radius:
                22px !important;

            box-shadow:
                0 30px 90px rgba(0,0,0,.6) !important;

            transform:
                translateY(15px) scale(.97);

            transition:
                transform .25s ease;

        }


        .fc-overlay.show .fc-window {

            transform:
                translateY(0) scale(1);

        }


        .fc-window-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 18px 20px;

            border-bottom:
                1px solid var(--fc-border);

        }


        .fc-window-title {

            color:
                var(--fc-text);

            font-size:
                17px;

            font-weight:
                750;

        }


        .fc-close {

            width:
                32px;

            height:
                32px;

            border:
                0;

            border-radius:
                10px;

            background:
                var(--fc-panel-2);

            color:
                var(--fc-muted);

            cursor:
                pointer;

        }


        .fc-close:hover {

            color:
                var(--fc-text);

        }


        .fc-window-body {

            padding:
                16px;

        }


        /* =====================================================
           DISCOVERY
           ===================================================== */

        .fc-discovery-list {

            display:
                flex;

            flex-direction:
                column;

            gap:
                8px;

        }


        .fc-user-card {

            display:
                flex;

            align-items:
                center;

            gap:
                12px;

            padding:
                10px;

            border-radius:
                14px;

            background:
                var(--fc-card);

            border:
                1px solid var(--fc-border);

        }


        .fc-user-avatar {

            width:
                42px;

            height:
                42px;

            min-width:
                42px;

            border-radius:
                50%;

            overflow:
                hidden;

            background:
                var(--fc-panel-2);

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            color:
                var(--fc-text);

            font-weight:
                700;

        }


        .fc-user-info {

            flex:
                1;

            min-width:
                0;

        }


        .fc-user-name {

            color:
                var(--fc-text);

            font-size:
                14px;

            font-weight:
                650;

        }


        .fc-user-id {

            color:
                var(--fc-muted);

            font-size:
                11px;

            margin-top:
                3px;

        }


        .fc-user-chat {

            border:
                0;

            border-radius:
                10px;

            padding:
                8px 11px;

            background:
                var(--fc-accent);

            color:
                white;

            cursor:
                pointer;

        }


        /* =====================================================
           THEME LIST
           ===================================================== */

        .fc-theme-list {

            display:
                grid;

            grid-template-columns:
                1fr 1fr;

            gap:
                9px;

        }


        .fc-theme-button {

            border:
                1px solid var(--fc-border);

            border-radius:
                13px;

            padding:
                12px;

            background:
                var(--fc-card);

            color:
                var(--fc-text);

            cursor:
                pointer;

            text-align:
                left;

        }


        .fc-theme-button:hover {

            background:
                var(--fc-panel-2);

        }


        .fc-theme-dot {

            width:
                18px;

            height:
                18px;

            border-radius:
                50%;

            display:
                inline-block;

            vertical-align:
                middle;

            margin-right:
                7px;

            background:
                var(--theme-color);

        }


        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 760px) {

            #fc-sidebar,
            .fc-sidebar {

                left:
                    10px !important;

                top:
                    14px !important;

                bottom:
                    14px !important;

                width:
                    60px !important;

                border-radius:
                    18px !important;

                padding:
                    9px 5px !important;

            }


            .fc-sidebar-logo {

                width:
                    38px !important;

                height:
                    38px !important;

                min-width:
                    38px !important;

            }


            .fc-sidebar-item {

                width:
                    46px !important;

                height:
                    46px !important;

                min-width:
                    46px !important;

                min-height:
                    46px !important;

            }


            .fc-sidebar-icon {

                width:
                    46px !important;

                height:
                    46px !important;

                font-size:
                    20px !important;

            }

        }


        @media (max-width: 420px) {

            #fc-sidebar,
            .fc-sidebar {

                left:
                    8px !important;

                top:
                    12px !important;

                bottom:
                    12px !important;

                width:
                    54px !important;

                border-radius:
                    17px !important;

                padding:
                    8px 4px !important;

            }


            .fc-sidebar-logo {

                width:
                    34px !important;

                height:
                    34px !important;

                min-width:
                    34px !important;

                border-radius:
                    11px !important;

                font-size:
                    12px !important;

            }


            .fc-sidebar-item {

                width:
                    42px !important;

                height:
                    42px !important;

                min-width:
                    42px !important;

                min-height:
                    42px !important;

                border-radius:
                    13px !important;

            }


            .fc-sidebar-icon {

                width:
                    42px !important;

                height:
                    42px !important;

                font-size:
                    18px !important;

            }


            .fc-theme-list {

                grid-template-columns:
                    1fr;

            }

        }

        `;


        document.head.appendChild(style);
    }


    /* =========================================================
       CREATE PERMANENT SIDEBAR
       ========================================================= */

    function createSidebar() {

        /* Remove old versions */

        removeElement("fc-sidebar");
        removeElement("fc-nav-toggle");


        /*
         * IMPORTANT:
         * Sidebar is appended directly to BODY.
         * This prevents the sidebar from becoming
         * part of the FriendChat layout.
         */

        const sidebar =
            createElement(
                "aside",
                "fc-sidebar"
            );


        sidebar.id =
            "fc-sidebar";


        /* =====================================================
           HEADER / FC LOGO
           ===================================================== */

        const header =
            createElement(
                "div",
                "fc-sidebar-header"
            );


        header.innerHTML = `
            <div class="fc-sidebar-logo">
                FC
            </div>

            <div>
                <div class="fc-sidebar-title">
                    FriendChat
                </div>

                <div class="fc-sidebar-subtitle">
                    Your private space
                </div>
            </div>
        `;


        sidebar.appendChild(header);


        /* =====================================================
           SIDEBAR OPTIONS
           ===================================================== */

        const items =
            createElement(
                "div",
                "fc-sidebar-items"
            );


        const sidebarOptions = [

            {
                icon: "🎵",

                label: "Music",

                action: function () {

                    if (
                        typeof window.openSpotifyPanel ===
                        "function"
                    ) {

                        window.openSpotifyPanel();

                    }

                    else if (
                        typeof window.toggleSpotifyPanel ===
                        "function"
                    ) {

                        window.toggleSpotifyPanel();

                    }

                    else {

                        const spotify =
                            document.querySelector(
                                ".spotify-window"
                            );

                        if (spotify) {

                            spotify.classList.toggle(
                                "open"
                            );

                        } else {

                            console.warn(
                                "Spotify panel not found"
                            );
                        }
                    }
                }
            },


            {
                icon: "🎨",

                label: "Theme",

                action: function () {

                    openThemePanel();

                }
            },


            {
                icon: "⚙️",

                label: "Settings",

                action: function () {

                    if (
                        typeof window.showSettings ===
                        "function"
                    ) {

                        window.showSettings();

                    } else {

                        console.warn(
                            "showSettings() was not found."
                        );

                    }
                }
            },


            {
                icon: "👤",

                label: "Profile",

                action: function () {

                    safeCall(
                        "showProfile"
                    );

                }
            }

        ];


        sidebarOptions.forEach(
            option => {

                const button =
                    createElement(
                        "button",
                        "fc-sidebar-item"
                    );


                button.type =
                    "button";


                button.title =
                    option.label;


                button.setAttribute(
                    "aria-label",
                    option.label
                );


                button.innerHTML = `
                    <span class="fc-sidebar-icon">
                        ${option.icon}
                    </span>

                    <span>
                        ${option.label}
                    </span>
                `;


                button.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        option.action();

                    }
                );


                items.appendChild(
                    button
                );

            }
        );


        sidebar.appendChild(
            items
        );


        /*
         * Append DIRECTLY to body.
         * It is not inside .app.
         */

        document.body.appendChild(
            sidebar
        );
    }


    /* =========================================================
       THEME WINDOW
       ========================================================= */

    function openThemePanel() {

        let overlay =
            document.getElementById(
                "fc-theme-panel"
            );


        if (overlay) {

            overlay.classList.add(
                "show"
            );

            return;
        }


        overlay =
            createElement(
                "div",
                "fc-overlay"
            );


        overlay.id =
            "fc-theme-panel";


        const windowBox =
            createElement(
                "div",
                "fc-window"
            );


        windowBox.innerHTML = `
            <div class="fc-window-header">

                <div class="fc-window-title">
                    Choose Theme
                </div>

                <button
                    class="fc-close"
                    type="button">
                    ✕
                </button>

            </div>

            <div class="fc-window-body">

                <div class="fc-theme-list"></div>

            </div>
        `;


        const themeList =
            windowBox.querySelector(
                ".fc-theme-list"
            );


        Object.entries(themes).forEach(
            ([key, theme]) => {

                const button =
                    createElement(
                        "button",
                        "fc-theme-button"
                    );


                button.type =
                    "button";


                button.innerHTML = `
                    <span
                        class="fc-theme-dot"
                        style="
                            --theme-color:${theme.accent}
                        ">
                    </span>

                    ${theme.name}
                `;


                button.addEventListener(
                    "click",
                    function () {

                        applyTheme(
                            key
                        );

                        overlay.classList.remove(
                            "show"
                        );
                    }
                );


                themeList.appendChild(
                    button
                );
            }
        );


        const close =
            windowBox.querySelector(
                ".fc-close"
            );


        close.addEventListener(
            "click",
            function () {

                overlay.classList.remove(
                    "show"
                );

            }
        );


        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    overlay
                ) {

                    overlay.classList.remove(
                        "show"
                    );

                }

            }
        );


        overlay.appendChild(
            windowBox
        );


        document.body.appendChild(
            overlay
        );


        requestAnimationFrame(
            () => {

                overlay.classList.add(
                    "show"
                );

            }
        );
    }


    /* =========================================================
       GET FRIENDCHAT USERS
       ========================================================= */

    function getUsers() {

        let users = [];


        const possibleArrays = [

            window.friends,

            window.users,

            window.allUsers,

            window.friendList

        ];


        possibleArrays.forEach(
            array => {

                if (
                    Array.isArray(array)
                ) {

                    users.push(
                        ...array
                    );

                }

            }
        );


        const storageKeys = [

            "friends",

            "users",

            "allUsers",

            "friendList"

        ];


        storageKeys.forEach(
            key => {

                try {

                    const raw =
                        localStorage.getItem(
                            key
                        );


                    if (!raw) {
                        return;
                    }


                    const value =
                        JSON.parse(
                            raw
                        );


                    if (
                        Array.isArray(value)
                    ) {

                        users.push(
                            ...value
                        );

                    }

                } catch (error) {

                    console.warn(
                        "FriendChat storage:",
                        error
                    );

                }

            }
        );


        /* REMOVE DUPLICATES */

        const unique = [];

        const seen =
            new Set();


        users.forEach(
            user => {

                if (!user) {
                    return;
                }


                const id =
                    String(
                        user.id ||
                        user.userId ||
                        user.uid ||
                        user.email ||
                        user.name ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    !id ||
                    seen.has(id)
                ) {

                    return;

                }


                seen.add(id);

                unique.push(
                    user
                );

            }
        );


        return unique;
    }


    /* =========================================================
       DISCOVERY WINDOW
       ========================================================= */

    function openDiscovery() {

        let overlay =
            document.getElementById(
                "fc-discovery"
            );


        if (overlay) {

            renderDiscoveryUsers(
                overlay
            );

            overlay.classList.add(
                "show"
            );

            return;
        }


        overlay =
            createElement(
                "div",
                "fc-overlay"
            );


        overlay.id =
            "fc-discovery";


        const windowBox =
            createElement(
                "div",
                "fc-window"
            );


        windowBox.innerHTML = `
            <div class="fc-window-header">

                <div class="fc-window-title">
                    FriendChat Users
                </div>

                <button
                    class="fc-close"
                    type="button">
                    ✕
                </button>

            </div>

            <div
                class="fc-window-body"
                id="fc-discovery-body">
            </div>
        `;


        const close =
            windowBox.querySelector(
                ".fc-close"
            );


        close.addEventListener(
            "click",
            function () {

                overlay.classList.remove(
                    "show"
                );

            }
        );


        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    overlay
                ) {

                    overlay.classList.remove(
                        "show"
                    );

                }

            }
        );


        overlay.appendChild(
            windowBox
        );


        document.body.appendChild(
            overlay
        );


        renderDiscoveryUsers(
            overlay
        );


        requestAnimationFrame(
            () => {

                overlay.classList.add(
                    "show"
                );

            }
        );
    }


    function renderDiscoveryUsers(
        overlay
    ) {

        const body =
            overlay.querySelector(
                "#fc-discovery-body"
            );


        if (!body) {
            return;
        }


        const users =
            getUsers();


        if (!users.length) {

            body.innerHTML = `
                <div
                    style="
                        text-align:center;
                        padding:35px 10px;
                        color:var(--fc-muted);
                    ">
                    No users found yet.
                </div>
            `;

            return;
        }


        const list =
            createElement(
                "div",
                "fc-discovery-list"
            );


        users.forEach(
            user => {

                const name =
                    user.name ||
                    user.username ||
                    user.displayName ||
                    "FriendChat User";


                const id =
                    user.id ||
                    user.userId ||
                    user.uid ||
                    "";


                const avatar =
                    user.photo ||
                    user.photoURL ||
                    user.avatar ||
                    user.profilePhoto ||
                    "";


                const card =
                    createElement(
                        "div",
                        "fc-user-card"
                    );


                const avatarElement =
                    createElement(
                        "div",
                        "fc-user-avatar"
                    );


                if (avatar) {

                    const img =
                        document.createElement(
                            "img"
                        );


                    img.src =
                        avatar;


                    img.alt =
                        name;


                    img.style.width =
                        "100%";

                    img.style.height =
                        "100%";

                    img.style.objectFit =
                        "cover";

                    img.style.borderRadius =
                        "50%";


                    avatarElement.appendChild(
                        img
                    );

                } else {

                    avatarElement.textContent =
                        String(name)
                            .charAt(0)
                            .toUpperCase();

                }


                const info =
                    createElement(
                        "div",
                        "fc-user-info"
                    );


                info.innerHTML = `
                    <div class="fc-user-name">
                        ${escapeHTML(name)}
                    </div>

                    <div class="fc-user-id">
                        ${escapeHTML(
                            id || "FriendChat user"
                        )}
                    </div>
                `;


                const chat =
                    createElement(
                        "button",
                        "fc-user-chat",
                        "Chat"
                    );


                chat.type =
                    "button";


                chat.addEventListener(
                    "click",
                    function () {

                        overlay.classList.remove(
                            "show"
                        );


                        setTimeout(
                            () => {

                                if (
                                    typeof window.openChat ===
                                    "function"
                                ) {

                                    window.openChat(
                                        user
                                    );

                                }

                                else if (
                                    typeof window.startChat ===
                                    "function"
                                ) {

                                    window.startChat(
                                        user
                                    );

                                }

                            },
                            150
                        );

                    }
                );


                card.appendChild(
                    avatarElement
                );

                card.appendChild(
                    info
                );

                card.appendChild(
                    chat
                );


                list.appendChild(
                    card
                );

            }
        );


        body.innerHTML =
            "";


        body.appendChild(
            list
        );
    }


    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       KEYBOARD
       ========================================================= */

    function setupKeyboard() {

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }


                document
                    .querySelectorAll(
                        ".fc-overlay.show"
                    )
                    .forEach(
                        overlay => {

                            overlay.classList.remove(
                                "show"
                            );

                        }
                    );

            }
        );
    }


    /* =========================================================
       REMOVE BOTTOM DOCK IF CREATED BY OLD VERSION
       ========================================================= */

    function removeBottomDock() {

        removeElement(
            "fc-bottom-dock"
        );


        document
            .querySelectorAll(
                ".fc-bottom-dock"
            )
            .forEach(
                el => el.remove()
            );
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    function init() {

        console.log(
            "FriendChat UI V3 initializing..."
        );


        /* Remove old UI */

        removeOldCustomUI();


        /* Hide old navigation */

        hideOldNavigation();


        /* Add custom CSS */

        injectCSS();


        /* Load theme */

        loadTheme();


        /* Create permanent floating bar */

        createSidebar();


        /*
         * IMPORTANT:
         * We DO NOT create bottom dock.
         */


        removeBottomDock();


        /* Keyboard */

        setupKeyboard();


        /*
         * Spotify may recreate its old
         * sidebar after loading.
         *
         * Keep removing only the OLD
         * Spotify navigation.
         */

        let checks = 0;


        const spotifyCleaner =
            setInterval(
                function () {

                    hideOldNavigation();

                    removeBottomDock();

                    checks++;


                    if (
                        checks >= 20
                    ) {

                        clearInterval(
                            spotifyCleaner
                        );

                    }

                },
                500
            );


        console.log(
            "FriendChat UI V3 loaded successfully."
        );
    }


    /* =========================================================
       GLOBAL FUNCTIONS
       ========================================================= */

    window.openFriendChatDiscovery =
        openDiscovery;


    window.openFriendChatTheme =
        openThemePanel;


    window.applyFriendChatTheme =
        applyTheme;


    window.closeFriendChatSidebar =
        function () {
            /* Kept for compatibility.
               There is no sliding sidebar anymore. */
            return;
        };


    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();
