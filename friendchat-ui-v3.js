/* =========================================================
   FRIENDCHAT UI V3
   Custom Sidebar + Theme + Profile + Discovery
   Works ON TOP of the existing FriendChat app.js
   ========================================================= */

(function () {
    "use strict";

    /* =========================================================
       CONFIG
       ========================================================= */

    const UI_ID = "friendchat-custom-ui";

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
        } catch (err) {
            console.warn("FriendChat UI:", fnName, err);
        }

        return null;
    }


    /* =========================================================
       REMOVE OLD UI
       ========================================================= */

    function removeOldCustomUI() {
        removeElement(UI_ID);

        document.querySelectorAll(
            ".fc-nav-toggle, .fc-sidebar, .fc-bottom-dock, .fc-discovery, .fc-theme-panel"
        ).forEach(el => {
            el.remove();
        });
    }


    /* =========================================================
       HIDE OLD SPOTIFY / OLD SIDEBARS
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
            document.querySelectorAll(selector).forEach(el => {
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

        const root = document.documentElement;

        root.style.setProperty("--fc-bg", theme.bg);
        root.style.setProperty("--fc-panel", theme.panel);
        root.style.setProperty("--fc-panel-2", theme.panel2);
        root.style.setProperty("--fc-card", theme.card);
        root.style.setProperty("--fc-text", theme.text);
        root.style.setProperty("--fc-muted", theme.muted);
        root.style.setProperty("--fc-accent", theme.accent);
        root.style.setProperty("--fc-accent-2", theme.accent2);
        root.style.setProperty("--fc-border", theme.border);

        localStorage.setItem("friendchat_theme", themeName);

        document.body.dataset.fcTheme = themeName;
    }


    function loadTheme() {
        const saved = localStorage.getItem("friendchat_theme");

        if (saved && themes[saved]) {
            applyTheme(saved);
        } else {
            applyTheme("midnight");
        }
    }


    /* =========================================================
       MAIN CUSTOM CSS
       ========================================================= */

    function injectCSS() {
        if (document.getElementById("friendchat-ui-v3-inline-css")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "friendchat-ui-v3-inline-css";

        style.textContent = `
        /* =====================================================
           FRIENDCHAT V3 CUSTOM UI
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

        body {
            background: var(--fc-bg) !important;
        }


        /* =====================================================
           LEFT TOGGLE BUTTON
           ===================================================== */

        .fc-nav-toggle {
            position: fixed !important;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);

            width: 44px;
            height: 44px;

            border: 1px solid var(--fc-border);
            border-radius: 14px;

            background: var(--fc-panel);
            color: var(--fc-text);

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            z-index: 999999;

            box-shadow:
                0 10px 30px rgba(0,0,0,.35);

            transition:
                left .28s ease,
                background .2s ease,
                transform .28s ease;
        }

        .fc-nav-toggle:hover {
            background: var(--fc-panel-2);
        }

        .fc-nav-toggle.open {
            left: 300px;
        }


        /* =====================================================
           SIDEBAR
           ===================================================== */

        .fc-sidebar {
            position: fixed !important;

            left: 14px;
            top: 50%;

            width: 260px;

            height: auto !important;
            min-height: 0 !important;
            max-height: calc(100vh - 40px);

            transform:
                translate(-125%, -50%);

            padding: 16px 12px !important;

            box-sizing: border-box;

            background: rgba(13,17,27,.98);

            border: 1px solid var(--fc-border);

            border-radius: 22px;

            box-shadow:
                0 25px 70px rgba(0,0,0,.55);

            z-index: 999998;

            opacity: 0;

            overflow: hidden;

            transition:
                transform .30s cubic-bezier(.22,1,.36,1),
                opacity .20s ease;
        }

        .fc-sidebar.open {
            transform:
                translate(0, -50%);

            opacity: 1;
        }


        /* =====================================================
           SIDEBAR HEADER
           ===================================================== */

        .fc-sidebar-header {
            display: flex;

            align-items: center;

            gap: 11px;

            padding: 6px 7px 14px;
        }

        .fc-sidebar-logo {
            width: 38px;
            height: 38px;

            flex: 0 0 38px;

            border-radius: 12px;

            background:
                linear-gradient(
                    135deg,
                    var(--fc-accent),
                    var(--fc-accent-2)
                );

            color: white;

            display: flex;
            align-items: center;
            justify-content: center;

            font-weight: 800;
            font-size: 15px;

            box-shadow:
                0 8px 20px rgba(124,92,255,.22);
        }

        .fc-sidebar-title {
            color: var(--fc-text);

            font-size: 15px;

            font-weight: 750;

            line-height: 1.2;
        }

        .fc-sidebar-subtitle {
            color: var(--fc-muted);

            font-size: 10px;

            margin-top: 3px;
        }


        /* =====================================================
           SIDEBAR ITEMS
           ===================================================== */

        .fc-sidebar-items {
            display: flex;

            flex-direction: column;

            gap: 5px !important;

            margin: 0 !important;

            padding: 0 !important;
        }

        .fc-sidebar-item {
            width: 100%;

            min-height: 46px !important;
            height: 46px !important;

            box-sizing: border-box;

            display: flex;

            align-items: center;

            gap: 13px;

            padding: 0 12px !important;

            border: 0;

            border-radius: 13px;

            background: transparent;

            color: var(--fc-muted);

            font-size: 14px;

            cursor: pointer;

            transition:
                background .18s ease,
                color .18s ease,
                transform .18s ease;
        }

        .fc-sidebar-item:hover {
            background: var(--fc-panel-2);

            color: var(--fc-text);

            transform: translateX(2px);
        }

        .fc-sidebar-item.active {
            background: rgba(124,92,255,.16);

            color: var(--fc-text);
        }

        .fc-sidebar-icon {
            width: 25px;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 19px;
        }


        /* =====================================================
           SIDEBAR FOOTER
           ===================================================== */

        .fc-sidebar-footer {
            display: none !important;
        }


        /* =====================================================
           BOTTOM DOCK
           ===================================================== */

        .fc-bottom-dock {
            position: fixed !important;

            left: 50%;
            bottom: 16px;

            transform: translateX(-50%);

            height: 58px;

            padding: 6px 8px;

            display: flex;

            align-items: center;

            gap: 8px;

            background: rgba(13,17,27,.94);

            border: 1px solid var(--fc-border);

            border-radius: 19px;

            box-shadow:
                0 18px 45px rgba(0,0,0,.45);

            z-index: 999990;

            backdrop-filter: blur(18px);
        }

        .fc-dock-button {
            width: 45px;
            height: 45px;

            border: 0;

            border-radius: 14px;

            background: transparent;

            color: var(--fc-muted);

            display: flex;

            align-items: center;
            justify-content: center;

            cursor: pointer;

            transition:
                background .18s ease,
                color .18s ease,
                transform .18s ease;
        }

        .fc-dock-button:hover {
            background: var(--fc-panel-2);

            color: var(--fc-text);

            transform: translateY(-2px);
        }

        .fc-dock-center {
            width: 49px;
            height: 49px;

            border-radius: 15px;

            background:
                linear-gradient(
                    135deg,
                    var(--fc-accent),
                    var(--fc-accent-2)
                );

            color: white;

            font-weight: 850;

            font-size: 14px;

            box-shadow:
                0 10px 25px rgba(124,92,255,.3);
        }


        /* =====================================================
           OVERLAY WINDOWS
           ===================================================== */

        .fc-overlay {
            position: fixed;

            inset: 0;

            background: rgba(0,0,0,.35);

            backdrop-filter: blur(3px);

            z-index: 999980;

            display: flex;

            align-items: center;

            justify-content: center;

            opacity: 0;

            pointer-events: none;

            transition: opacity .2s ease;
        }

        .fc-overlay.show {
            opacity: 1;

            pointer-events: auto;
        }

        .fc-window {
            width: min(430px, calc(100vw - 30px));

            max-height: min(600px, calc(100vh - 40px));

            overflow: auto;

            background: var(--fc-panel);

            border: 1px solid var(--fc-border);

            border-radius: 22px;

            box-shadow:
                0 30px 90px rgba(0,0,0,.6);

            transform: translateY(15px) scale(.97);

            transition:
                transform .25s ease;
        }

        .fc-overlay.show .fc-window {
            transform:
                translateY(0)
                scale(1);
        }

        .fc-window-header {
            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 18px 20px;

            border-bottom: 1px solid var(--fc-border);
        }

        .fc-window-title {
            color: var(--fc-text);

            font-size: 17px;

            font-weight: 750;
        }

        .fc-close {
            width: 32px;
            height: 32px;

            border: 0;

            border-radius: 10px;

            background: var(--fc-panel-2);

            color: var(--fc-muted);

            cursor: pointer;
        }

        .fc-close:hover {
            color: var(--fc-text);
        }

        .fc-window-body {
            padding: 16px;
        }


        /* =====================================================
           DISCOVERY
           ===================================================== */

        .fc-discovery-list {
            display: flex;

            flex-direction: column;

            gap: 8px;
        }

        .fc-user-card {
            display: flex;

            align-items: center;

            gap: 12px;

            padding: 10px;

            border-radius: 14px;

            background: var(--fc-card);

            border: 1px solid var(--fc-border);
        }

        .fc-user-avatar {
            width: 42px;
            height: 42px;

            border-radius: 50%;

            object-fit: cover;

            background: var(--fc-panel-2);

            display: flex;

            align-items: center;
            justify-content: center;

            color: var(--fc-text);

            font-weight: 700;
        }

        .fc-user-info {
            flex: 1;

            min-width: 0;
        }

        .fc-user-name {
            color: var(--fc-text);

            font-size: 14px;

            font-weight: 650;
        }

        .fc-user-id {
            color: var(--fc-muted);

            font-size: 11px;

            margin-top: 3px;
        }

        .fc-user-chat {
            border: 0;

            border-radius: 10px;

            padding: 8px 11px;

            background: var(--fc-accent);

            color: white;

            cursor: pointer;
        }


        /* =====================================================
           THEME LIST
           ===================================================== */

        .fc-theme-list {
            display: grid;

            grid-template-columns: 1fr 1fr;

            gap: 9px;
        }

        .fc-theme-button {
            border: 1px solid var(--fc-border);

            border-radius: 13px;

            padding: 12px;

            background: var(--fc-card);

            color: var(--fc-text);

            cursor: pointer;

            text-align: left;
        }

        .fc-theme-button:hover {
            background: var(--fc-panel-2);
        }

        .fc-theme-dot {
            width: 18px;
            height: 18px;

            border-radius: 50%;

            display: inline-block;

            vertical-align: middle;

            margin-right: 7px;

            background: var(--theme-color);
        }


        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 600px) {

            .fc-nav-toggle {
                left: 9px;

                width: 40px;
                height: 40px;
            }

            .fc-nav-toggle.open {
                left: calc(100vw - 54px);
            }

            .fc-sidebar {
                left: 8px;

                width: min(260px, calc(100vw - 16px));
            }

            .fc-bottom-dock {
                bottom: 10px;

                height: 54px;
            }

            .fc-dock-button {
                width: 42px;
                height: 42px;
            }

            .fc-dock-center {
                width: 46px;
                height: 46px;
            }
        }
        `;

        document.head.appendChild(style);
    }


    /* =========================================================
       SIDEBAR
       ========================================================= */

    function createSidebar() {

        removeElement("fc-sidebar");
        removeElement("fc-nav-toggle");

        const toggle = createElement(
            "button",
            "fc-nav-toggle",
            "☰"
        );

        toggle.id = "fc-nav-toggle";

        document.body.appendChild(toggle);


        const sidebar = createElement(
            "aside",
            "fc-sidebar"
        );

        sidebar.id = "fc-sidebar";


        /* HEADER */

        const header = createElement(
            "div",
            "fc-sidebar-header"
        );

        header.innerHTML = `
            <div class="fc-sidebar-logo">FC</div>

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
           ONLY THESE OPTIONS
           ===================================================== */

        const items = createElement(
            "div",
            "fc-sidebar-items"
        );

        const sidebarOptions = [

            {
                icon: "🎵",
                label: "Music",
                action: function () {

                    closeSidebar();

                    setTimeout(() => {

                        if (typeof window.openSpotifyPanel === "function") {
                            window.openSpotifyPanel();
                        }

                        else if (typeof window.toggleSpotifyPanel === "function") {
                            window.toggleSpotifyPanel();
                        }

                        else {
                            const spotify =
                                document.querySelector(".spotify-window");

                            if (spotify) {
                                spotify.classList.toggle("open");
                            }
                        }

                    }, 180);
                }
            },

            {
                icon: "🎨",
                label: "Theme",
                action: function () {

                    closeSidebar();

                    setTimeout(() => {
                        openThemePanel();
                    }, 180);
                }
            },

            {
                icon: "⚙️",
                label: "Settings",
                action: function () {

                    closeSidebar();

                    setTimeout(() => {

                        if (typeof window.showSettings === "function") {
                            window.showSettings();
                        } else {
                            console.log("Settings function not found");
                        }

                    }, 180);
                }
            },

            {
                icon: "👤",
                label: "Profile",
                action: function () {

                    closeSidebar();

                    setTimeout(() => {
                        safeCall("showProfile");
                    }, 180);
                }
            }

        ];


        sidebarOptions.forEach(option => {

            const button = createElement(
                "button",
                "fc-sidebar-item"
            );

            button.type = "button";

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
                option.action
            );

            items.appendChild(button);
        });


        sidebar.appendChild(items);

        document.body.appendChild(sidebar);


        /* TOGGLE */

        toggle.addEventListener("click", function (event) {

            event.stopPropagation();

            const opened =
                sidebar.classList.toggle("open");

            toggle.classList.toggle(
                "open",
                opened
            );

            toggle.innerHTML =
                opened ? "✕" : "☰";
        });


        /* CLICK OUTSIDE */

        document.addEventListener(
            "click",
            function (event) {

                if (!sidebar.classList.contains("open")) {
                    return;
                }

                if (
                    sidebar.contains(event.target) ||
                    toggle.contains(event.target)
                ) {
                    return;
                }

                closeSidebar();
            }
        );
    }


    function closeSidebar() {

        const sidebar =
            document.getElementById("fc-sidebar");

        const toggle =
            document.getElementById("fc-nav-toggle");

        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (toggle) {
            toggle.classList.remove("open");
            toggle.innerHTML = "☰";
        }
    }


    /* =========================================================
       THEME WINDOW
       ========================================================= */

    function openThemePanel() {

        let overlay =
            document.getElementById("fc-theme-panel");

        if (overlay) {

            overlay.classList.add("show");

            return;
        }


        overlay = createElement(
            "div",
            "fc-overlay"
        );

        overlay.id = "fc-theme-panel";


        const windowBox = createElement(
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

                button.type = "button";

                button.innerHTML = `
                    <span
                        class="fc-theme-dot"
                        style="--theme-color:${theme.accent}">
                    </span>

                    ${theme.name}
                `;

                button.addEventListener(
                    "click",
                    function () {

                        applyTheme(key);

                        overlay.classList.remove(
                            "show"
                        );
                    }
                );

                themeList.appendChild(button);
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

                if (event.target === overlay) {
                    overlay.classList.remove(
                        "show"
                    );
                }
            }
        );


        overlay.appendChild(windowBox);

        document.body.appendChild(overlay);


        requestAnimationFrame(() => {
            overlay.classList.add("show");
        });
    }


    /* =========================================================
       DISCOVERY / FRIENDCHAT USERS
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

                if (Array.isArray(array)) {
                    users.push(...array);
                }
            }
        );


        /* LOCAL STORAGE */

        const storageKeys = [
            "friends",
            "users",
            "allUsers",
            "friendList"
        ];


        storageKeys.forEach(
            key => {

                try {

                    const value =
                        JSON.parse(
                            localStorage.getItem(key)
                        );


                    if (Array.isArray(value)) {
                        users.push(...value);
                    }

                } catch (error) {
                    /* Ignore invalid storage */
                }
            }
        );


        /* REMOVE DUPLICATES */

        const unique = [];

        const seen = new Set();


        users.forEach(user => {

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
                ).toLowerCase();


            if (!id || seen.has(id)) {
                return;
            }


            seen.add(id);

            unique.push(user);
        });


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

            overlay.classList.add("show");

            return;
        }


        overlay = createElement(
            "div",
            "fc-overlay"
        );

        overlay.id = "fc-discovery";


        const windowBox = createElement(
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

                if (event.target === overlay) {
                    overlay.classList.remove(
                        "show"
                    );
                }
            }
        );


        overlay.appendChild(windowBox);

        document.body.appendChild(overlay);


        renderDiscoveryUsers(
            overlay
        );


        requestAnimationFrame(() => {

            overlay.classList.add(
                "show"
            );
        });
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
                    "
                >
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


        users.forEach(user => {

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

                avatarElement.innerHTML = `
                    <img
                        src="${avatar}"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:cover;
                            border-radius:50%;
                        "
                    >
                `;

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
                    ${name}
                </div>

                <div class="fc-user-id">
                    ${id || "FriendChat user"}
                </div>
            `;


            const chat =
                createElement(
                    "button",
                    "fc-user-chat",
                    "Chat"
                );


            chat.type = "button";


            chat.addEventListener(
                "click",
                function () {

                    overlay.classList.remove(
                        "show"
                    );


                    setTimeout(() => {

                        if (
                            typeof window.openChat ===
                            "function"
                        ) {
                            window.openChat(user);
                        }

                        else if (
                            typeof window.startChat ===
                            "function"
                        ) {
                            window.startChat(user);
                        }

                    }, 150);
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


            list.appendChild(card);
        });


        body.innerHTML = "";

        body.appendChild(list);
    }


    /* =========================================================
       BOTTOM DOCK
       ========================================================= */

    function createBottomDock() {

        removeElement("fc-bottom-dock");


        const dock =
            createElement(
                "div",
                "fc-bottom-dock"
            );


        dock.id =
            "fc-bottom-dock";


        /* LEFT */

        const left =
            createElement(
                "button",
                "fc-dock-button",
                "💬"
            );


        left.type = "button";

        left.title = "Home";


        left.addEventListener(
            "click",
            function () {

                safeCall("showHome");
            }
        );


        /* CENTER */

        const center =
            createElement(
                "button",
                "fc-dock-button fc-dock-center",
                "FC"
            );


        center.type = "button";

        center.title =
            "FriendChat users";


        center.addEventListener(
            "click",
            function () {

                openDiscovery();
            }
        );


        /* RIGHT */

        const right =
            createElement(
                "button",
                "fc-dock-button",
                "👤"
            );


        right.type = "button";

        right.title =
            "Profile";


        right.addEventListener(
            "click",
            function () {

                safeCall("showProfile");
            }
        );


        dock.appendChild(left);

        dock.appendChild(center);

        dock.appendChild(right);


        document.body.appendChild(dock);
    }


    /* =========================================================
       QUICK ACTIONS
       ========================================================= */

    function createQuickActions() {

        if (document.getElementById("fc-quick-actions")) {
            return;
        }

        const app =
            document.querySelector(
                ".app"
            );

        if (!app) {
            return;
        }


        const actions =
            createElement(
                "div",
                "fc-quick-actions"
            );


        actions.id =
            "fc-quick-actions";


        /* We intentionally keep this minimal.
           Existing FriendChat add/media buttons
           are not replaced. */


        app.appendChild(actions);
    }


    /* =========================================================
       SCREEN VISIBILITY
       ========================================================= */

    function setupScreenVisibility() {

        const app =
            document.querySelector(
                ".app"
            );


        if (!app) {
            return;
        }


        function update() {

            /*
             * Keep custom navigation visible
             * throughout FriendChat.
             *
             * We don't hide it based on
             * app classes because different
             * FriendChat versions use
             * different class names.
             */
        }


        update();


        const observer =
            new MutationObserver(
                update
            );


        observer.observe(
            app,
            {
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );
    }


    /* =========================================================
       KEYBOARD
       ========================================================= */

    function setupKeyboard() {

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    closeSidebar();


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
            }
        );
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    function init() {

        /* Remove previous version */

        removeOldCustomUI();


        /* Hide old navigation */

        hideOldNavigation();


        /* CSS */

        injectCSS();


        /* Theme */

        loadTheme();


        /* Sidebar */

        createSidebar();


        /* Bottom navigation */

        createBottomDock();


        /* Existing app compatibility */

        createQuickActions();


        /* Screen observer */

        setupScreenVisibility();


        /* Keyboard */

        setupKeyboard();


        /*
         * Spotify's old buttons can be
         * recreated by spotify.js after
         * this script loads, so hide them
         * repeatedly for a short time.
         */

        let checks = 0;

        const spotifyCleaner =
            setInterval(
                function () {

                    hideOldNavigation();

                    checks++;

                    if (checks >= 20) {
                        clearInterval(
                            spotifyCleaner
                        );
                    }

                },
                500
            );


        console.log(
            "FriendChat UI V3 loaded"
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
        closeSidebar;


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
