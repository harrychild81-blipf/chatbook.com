/* =========================================================
   FRIENDCHAT UI v3 - COMPLETE
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = id => document.getElementById(id);

    function create(tag, className, parent) {
        const el = document.createElement(tag);

        if (className) {
            el.className = className;
        }

        if (parent) {
            parent.appendChild(el);
        }

        return el;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char])
        );
    }


    /* =====================================================
       THEMES
       ===================================================== */

    const themes = {
        midnight: {
            name: "Midnight",
            desc: "Dark blue and purple",
            bg: "#070a10",
            panel: "#0d121b",
            accent: "#6c7cff",
            accent2: "#8b5cf6"
        },

        emerald: {
            name: "Emerald",
            desc: "Dark green glass",
            bg: "#06100d",
            panel: "#0c1713",
            accent: "#22c55e",
            accent2: "#14b8a6"
        },

        ocean: {
            name: "Ocean",
            desc: "Deep blue",
            bg: "#061019",
            panel: "#0b1722",
            accent: "#22a6f2",
            accent2: "#6366f1"
        },

        sunset: {
            name: "Sunset",
            desc: "Warm orange glow",
            bg: "#120a08",
            panel: "#1b100d",
            accent: "#ff7a45",
            accent2: "#ef4444"
        },

        rose: {
            name: "Rose",
            desc: "Pink and violet",
            bg: "#100810",
            panel: "#190e19",
            accent: "#ec4899",
            accent2: "#8b5cf6"
        },

        graphite: {
            name: "Graphite",
            desc: "Minimal monochrome",
            bg: "#090909",
            panel: "#121212",
            accent: "#d1d5db",
            accent2: "#6b7280"
        }
    };


    /* =====================================================
       NAVIGATION CSS
       ===================================================== */

    function installStyles() {

        if ($("fc-navigation-style")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "fc-navigation-style";

        style.textContent = `

        /* ===============================================
           LEFT ARROW
           =============================================== */

        #fcNavToggle {
            position: fixed !important;

            left: 16px !important;
            top: 50% !important;

            transform: translateY(-50%) !important;

            width: 28px !important;
            height: 48px !important;

            padding: 0 !important;
            margin: 0 !important;

            border: 0 !important;
            border-radius: 14px !important;

            background: rgba(20,25,38,.96) !important;

            color: white !important;

            display: flex !important;

            align-items: center !important;
            justify-content: center !important;

            z-index: 2147483646 !important;

            cursor: pointer !important;

            box-shadow:
                0 8px 25px rgba(0,0,0,.3) !important;

            transition:
                left .22s ease,
                width .18s ease,
                background .18s ease !important;
        }


        #fcNavToggle:hover {
            width: 34px !important;
            background: rgba(35,42,60,.98) !important;
        }


        #fcNavToggle.is-open {
            left: 204px !important;
        }


        #fcNavToggle .fc-chevron {
            font-size: 25px !important;
            line-height: 1 !important;
        }


        /* ===============================================
           SIDEBAR
           =============================================== */

        #fcCustomSidebar {
            position: fixed !important;

            left: 12px !important;
            top: 50% !important;

            width: 184px !important;

            transform:
                translateY(-50%)
                translateX(-120%) !important;

            z-index: 2147483645 !important;

            box-sizing: border-box !important;

            transition:
                transform .22s ease !important;
        }


        #fcCustomSidebar.open {
            transform:
                translateY(-50%)
                translateX(0) !important;
        }


        #fcCustomSidebar .fc-nav-item {
            cursor: pointer !important;
        }


        /* ===============================================
           BOTTOM DOCK
           =============================================== */

        .fc-bottom-dock {

            position: fixed !important;

            left: 50% !important;
            bottom: 10px !important;

            transform:
                translateX(-50%) !important;

            width: 190px !important;
            min-width: 190px !important;
            max-width: 190px !important;

            height: 48px !important;
            min-height: 48px !important;

            padding: 4px 6px !important;

            display: flex !important;

            align-items: center !important;
            justify-content: center !important;

            gap: 2px !important;

            box-sizing: border-box !important;

            border-radius: 16px !important;

            background:
                rgba(13,18,27,.97) !important;

            border:
                1px solid rgba(255,255,255,.14) !important;

            box-shadow:
                0 12px 35px rgba(0,0,0,.45) !important;

            z-index: 2147483647 !important;
        }


        /* ===============================================
           DOCK BUTTONS
           =============================================== */

        .fc-bottom-dock .fc-dock-btn {

            flex: 0 0 42px !important;

            width: 42px !important;
            min-width: 42px !important;

            height: 40px !important;
            min-height: 40px !important;

            padding: 0 !important;
            margin: 0 !important;

            border: 0 !important;

            border-radius: 11px !important;

            background: transparent !important;

            color: white !important;

            display: flex !important;

            align-items: center !important;
            justify-content: center !important;

            cursor: pointer !important;

            transition:
                transform .15s ease,
                background .15s ease !important;
        }


        .fc-bottom-dock
        .fc-dock-btn:hover {

            background:
                rgba(255,255,255,.07) !important;

            transform:
                translateY(-1px) !important;
        }


        /* Hide labels */

        .fc-bottom-dock
        .fc-dock-btn span:last-child {

            display: none !important;
        }


        /* Icon */

        .fc-bottom-dock
        .fc-dock-btn span:first-child {

            font-size: 18px !important;

            line-height: 1 !important;
        }


        /* ===============================================
           FC CENTER BUTTON
           =============================================== */

        .fc-bottom-dock
        .fc-dock-center {

            flex: 0 0 40px !important;

            width: 40px !important;
            min-width: 40px !important;

            height: 40px !important;
            min-height: 40px !important;

            border-radius: 12px !important;

            background:
                linear-gradient(
                    135deg,
                    #6c5cff,
                    #b34de5
                ) !important;

            color: white !important;

            box-shadow:
                0 5px 18px rgba(120,80,240,.35) !important;
        }


        .fc-bottom-dock
        .fc-dock-center:hover {

            background:
                linear-gradient(
                    135deg,
                    #7668ff,
                    #bd59eb
                ) !important;

            transform:
                translateY(-1px)
                scale(1.03) !important;
        }


        .fc-bottom-dock
        .fc-dock-center span:first-child {

            font-size: 14px !important;
            font-weight: 900 !important;
        }


        /* ===============================================
           CHAT SCREEN
           IMPORTANT:
           Dock is hidden while chat is open.
           =============================================== */

        body.fc-chat-open
        .fc-bottom-dock {

            display: none !important;

            visibility: hidden !important;

            opacity: 0 !important;
        }


        /* ===============================================
           QUICK ACTIONS
           =============================================== */

        .fc-quick-actions {

            position: fixed !important;

            right: 18px !important;
            top: 18px !important;

            display: flex !important;

            gap: 8px !important;

            z-index: 10000 !important;
        }


        .fc-quick-actions button {

            width: 52px !important;
            height: 52px !important;

            border-radius: 15px !important;

            border:
                1px solid rgba(255,255,255,.10) !important;

            background:
                rgba(20,20,28,.88) !important;

            color: white !important;

            cursor: pointer !important;
        }


        /* ===============================================
           DISCOVERY
           =============================================== */

        #fcDiscoveryOverlay {

            position: fixed !important;

            inset: 0 !important;

            background:
                rgba(0,0,0,.58) !important;

            opacity: 0 !important;

            pointer-events: none !important;

            transition:
                opacity .2s ease !important;

            z-index: 20000 !important;
        }


        #fcDiscoveryOverlay.open {

            opacity: 1 !important;

            pointer-events: auto !important;
        }


        #fcDiscovery {

            position: fixed !important;

            left: 50% !important;
            top: 50% !important;

            width:
                min(560px, calc(100vw - 30px)) !important;

            max-height:
                min(700px, calc(100vh - 40px)) !important;

            overflow: auto !important;

            transform:
                translate(-50%,-46%) !important;

            opacity: 0 !important;

            pointer-events: none !important;

            background:
                rgba(13,18,27,.98) !important;

            border:
                1px solid rgba(255,255,255,.12) !important;

            border-radius: 22px !important;

            box-shadow:
                0 30px 100px rgba(0,0,0,.55) !important;

            z-index: 20001 !important;

            transition:
                opacity .2s ease,
                transform .2s ease !important;
        }


        #fcDiscovery.open {

            opacity: 1 !important;

            pointer-events: auto !important;

            transform:
                translate(-50%,-50%) !important;
        }


        .fc-discovery-head {

            display: flex !important;

            align-items: center !important;
            justify-content: space-between !important;

            padding: 18px !important;

            border-bottom:
                1px solid rgba(255,255,255,.08) !important;
        }


        .fc-discovery-list {

            padding: 12px !important;
        }


        .fc-user-suggestion {

            display: flex !important;

            align-items: center !important;

            gap: 12px !important;

            padding: 12px !important;

            border-radius: 14px !important;
        }


        .fc-user-suggestion:hover {

            background:
                rgba(255,255,255,.05) !important;
        }


        .fc-user-avatar {

            width: 44px !important;
            height: 44px !important;

            flex: 0 0 44px !important;

            display: flex !important;

            align-items: center !important;
            justify-content: center !important;

            border-radius: 50% !important;

            background:
                linear-gradient(
                    135deg,
                    #6c7cff,
                    #8b5cf6
                ) !important;

            color: white !important;

            font-weight: 700 !important;
        }


        .fc-user-info {

            flex: 1 !important;

            min-width: 0 !important;
        }


        .fc-user-name {

            font-weight: 700 !important;

            color: white !important;
        }


        .fc-user-id {

            margin-top: 3px !important;

            font-size: 12px !important;

            color:
                rgba(255,255,255,.52) !important;
        }


        .fc-user-add {

            border: 0 !important;

            border-radius: 10px !important;

            padding: 9px 13px !important;

            background:
                #6c7cff !important;

            color: white !important;

            cursor: pointer !important;
        }


        /* ===============================================
           THEME PANEL
           =============================================== */

        #fcThemeOverlay {

            position: fixed !important;

            inset: 0 !important;

            background:
                rgba(0,0,0,.58) !important;

            opacity: 0 !important;

            pointer-events: none !important;

            z-index: 21000 !important;

            transition:
                opacity .2s ease !important;
        }


        #fcThemeOverlay.open {

            opacity: 1 !important;

            pointer-events: auto !important;
        }


        #fcThemePanel {

            position: fixed !important;

            left: 50% !important;
            top: 50% !important;

            width:
                min(540px, calc(100vw - 30px)) !important;

            transform:
                translate(-50%,-48%) !important;

            opacity: 0 !important;

            pointer-events: none !important;

            z-index: 21001 !important;

            background:
                rgba(13,18,27,.98) !important;

            border:
                1px solid rgba(255,255,255,.12) !important;

            border-radius: 22px !important;

            overflow: hidden !important;

            transition:
                opacity .2s ease,
                transform .2s ease !important;
        }


        #fcThemePanel.open {

            opacity: 1 !important;

            pointer-events: auto !important;

            transform:
                translate(-50%,-50%) !important;
        }


        .fc-theme-head {

            display: flex !important;

            align-items: center !important;
            justify-content: space-between !important;

            padding: 18px !important;

            color: white !important;

            border-bottom:
                1px solid rgba(255,255,255,.08) !important;
        }


        .fc-theme-body {

            padding: 16px !important;
        }


        .fc-theme-grid {

            display: grid !important;

            grid-template-columns:
                repeat(2, minmax(0,1fr)) !important;

            gap: 10px !important;
        }


        .fc-theme-choice {

            border:
                1px solid rgba(255,255,255,.10) !important;

            background:
                rgba(255,255,255,.03) !important;

            border-radius: 14px !important;

            padding: 12px !important;

            color: white !important;

            text-align: left !important;

            cursor: pointer !important;
        }


        .fc-theme-choice:hover {

            background:
                rgba(255,255,255,.07) !important;
        }


        .fc-theme-swatch {

            width: 100% !important;

            height: 50px !important;

            border-radius: 10px !important;

            margin-bottom: 8px !important;
        }


        .fc-theme-name {

            font-weight: 700 !important;
        }


        .fc-theme-desc {

            margin-top: 3px !important;

            font-size: 12px !important;

            color:
                rgba(255,255,255,.50) !important;
        }


        /* ===============================================
           MOBILE
           =============================================== */

        @media(max-width:600px) {

            #fcNavToggle {

                left: 4px !important;

                width: 23px !important;

                height: 42px !important;
            }


            #fcNavToggle.is-open {

                left: 194px !important;
            }


            #fcCustomSidebar {

                left: 8px !important;

                width: 178px !important;
            }


            .fc-bottom-dock {

                width: 178px !important;

                min-width: 178px !important;

                max-width: 178px !important;

                height: 46px !important;

                min-height: 46px !important;

                bottom: 8px !important;
            }


            .fc-bottom-dock
            .fc-dock-btn {

                flex-basis: 39px !important;

                width: 39px !important;

                min-width: 39px !important;

                height: 38px !important;

                min-height: 38px !important;
            }


            .fc-bottom-dock
            .fc-dock-center {

                flex-basis: 38px !important;

                width: 38px !important;

                min-width: 38px !important;

                height: 38px !important;

                min-height: 38px !important;

                border-radius: 11px !important;
            }


            .fc-theme-grid {

                grid-template-columns:
                    1fr !important;
            }

        }

        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       GO HOME
       ===================================================== */

    function goHome() {

        /*
         * First try the real FriendChat function.
         * This preserves all of your existing app logic.
         */

        if (
            typeof window.showHome === "function"
        ) {

            try {

                window.showHome();

                updateScreenState();

                return;

            } catch (error) {

                console.warn(
                    "FriendChat showHome failed:",
                    error
                );
            }
        }


        /*
         * Fallback.
         * If showHome isn't available, directly switch screens.
         */

        const screens =
            document.querySelectorAll(
                ".screen"
            );


        screens.forEach(
            screen => {

                screen.classList.add(
                    "hidden"
                );

            }
        );


        const home =
            $("homeScreen");


        if (home) {

            home.classList.remove(
                "hidden"
            );
        }


        document.body.classList.remove(
            "fc-chat-open"
        );


        updateScreenState();
    }


    /* =====================================================
       OPEN PROFILE
       ===================================================== */

    function goProfile() {

        if (
            typeof window.showProfile ===
            "function"
        ) {

            try {

                window.showProfile();

                updateScreenState();

                return;

            } catch (error) {

                console.warn(
                    "showProfile failed:",
                    error
                );
            }
        }


        const screens =
            document.querySelectorAll(
                ".screen"
            );


        screens.forEach(
            screen => {

                screen.classList.add(
                    "hidden"
                );

            }
        );


        const profile =
            $("profileScreen");


        if (profile) {

            profile.classList.remove(
                "hidden"
            );
        }


        updateScreenState();
    }


    /* =====================================================
       OPEN ADD FRIEND
       ===================================================== */

    function goAddFriend() {

        if (
            typeof window.showAdd ===
            "function"
        ) {

            try {

                window.showAdd();

                updateScreenState();

                return;

            } catch (error) {

                console.warn(
                    "showAdd failed:",
                    error
                );
            }
        }


        const screens =
            document.querySelectorAll(
                ".screen"
            );


        screens.forEach(
            screen => {

                screen.classList.add(
                    "hidden"
                );

            }
        );


        const add =
            $("addScreen");


        if (add) {

            add.classList.remove(
                "hidden"
            );
        }


        updateScreenState();
    }


    /* =====================================================
       NAVIGATION SIDEBAR
       ===================================================== */

    function createSidebar() {

        if (
            $("fcCustomSidebar")
        ) {

            return;

        }


        const toggle =
            create(
                "button",
                "",
                document.body
            );


        toggle.id =
            "fcNavToggle";


        toggle.type =
            "button";


        toggle.title =
            "Open navigation";


        toggle.setAttribute(
            "aria-label",
            "Open navigation"
        );


        toggle.innerHTML =
            '<span class="fc-chevron">›</span>';


        const sidebar =
            create(
                "aside",
                "fc-sidebar",
                document.body
            );


        sidebar.id =
            "fcCustomSidebar";


        sidebar.innerHTML = `

            <div class="fc-sidebar-brand">

                <div class="fc-sidebar-logo">
                    FC
                </div>

                <div>

                    <div class="fc-sidebar-title">
                        FriendChat
                    </div>

                    <div class="fc-sidebar-sub">
                        Your private space
                    </div>

                </div>

            </div>


            <button
                type="button"
                class="fc-nav-item active"
                data-action="home"
            >
                <span class="fc-nav-icon">
                    💬
                </span>

                Chats
            </button>


            <button
                type="button"
                class="fc-nav-item"
                data-action="friends"
            >
                <span class="fc-nav-icon">
                    👥
                </span>

                Friends
            </button>


            <button
                type="button"
                class="fc-nav-item"
                data-action="music"
            >
                <span class="fc-nav-icon">
                    🎵
                </span>

                Music
            </button>


            <div class="fc-nav-divider"></div>


            <button
                type="button"
                class="fc-nav-item"
                data-action="theme"
            >
                <span class="fc-nav-icon">
                    🎨
                </span>

                Change theme
            </button>


            <button
                type="button"
                class="fc-nav-item"
                data-action="settings"
            >
                <span class="fc-nav-icon">
                    ⚙️
                </span>

                Settings
            </button>


            <button
                type="button"
                class="fc-nav-item"
                data-action="profile"
            >
                <span class="fc-nav-icon">
                    👤
                </span>

                Profile
            </button>

        `;


        /* ================================================
           ARROW
           ================================================ */

        toggle.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                const open =
                    sidebar.classList.toggle(
                        "open"
                    );


                toggle.classList.toggle(
                    "is-open",
                    open
                );


                if (open) {

                    toggle.title =
                        "Close navigation";

                    toggle.setAttribute(
                        "aria-label",
                        "Close navigation"
                    );

                } else {

                    toggle.title =
                        "Open navigation";

                    toggle.setAttribute(
                        "aria-label",
                        "Open navigation"
                    );
                }

            }
        );


        /* ================================================
           SIDEBAR ACTIONS
           ================================================ */

        sidebar
            .querySelectorAll(
                ".fc-nav-item"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            event.stopPropagation();


                            const action =
                                button.dataset.action;


                            if (
                                action === "home" ||
                                action === "friends"
                            ) {

                                goHome();

                            }


                            if (
                                action === "profile"
                            ) {

                                goProfile();

                            }


                            if (
                                action === "music"
                            ) {

                                if (
                                    typeof window.openSpotifyPanel ===
                                    "function"
                                ) {

                                    window.openSpotifyPanel();

                                } else if (
                                    typeof window.toggleSpotifyPanel ===
                                    "function"
                                ) {

                                    window.toggleSpotifyPanel();

                                }

                            }


                            if (
                                action === "theme" ||
                                action === "settings"
                            ) {

                                openTheme();

                            }


                            sidebar.classList.remove(
                                "open"
                            );


                            toggle.classList.remove(
                                "is-open"
                            );

                        }
                    );

                }
            );
    }


    /* =====================================================
       BOTTOM DOCK
       ===================================================== */

    function createBottomDock() {

        if (
            document.querySelector(
                ".fc-bottom-dock"
            )
        ) {

            return;

        }


        const dock =
            create(
                "nav",
                "fc-bottom-dock",
                document.body
            );


        /* ================================================
           CHAT BUTTON
           ================================================ */

        const chat =
            create(
                "button",
                "fc-dock-btn",
                dock
            );


        chat.type =
            "button";


        chat.title =
            "Chats";


        chat.setAttribute(
            "aria-label",
            "Chats"
        );


        chat.innerHTML =
            `
            <span>💬</span>
            <span>Chats</span>
            `;


        chat.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                /*
                 * This is the important fix.
                 * It calls the original app's showHome()
                 * if available, then falls back to directly
                 * showing homeScreen.
                 */

                goHome();

            }
        );


        /* ================================================
           FC BUTTON
           ================================================ */

        const fc =
            create(
                "button",
                "fc-dock-btn fc-dock-center",
                dock
            );


        fc.type =
            "button";


        fc.title =
            "FC Suggestions";


        fc.setAttribute(
            "aria-label",
            "FC Suggestions"
        );


        fc.innerHTML =
            `
            <span>FC</span>
            <span>Suggestions</span>
            `;


        fc.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                toggleDiscovery();

            }
        );


        /* ================================================
           PROFILE BUTTON
           ================================================ */

        const profile =
            create(
                "button",
                "fc-dock-btn",
                dock
            );


        profile.type =
            "button";


        profile.title =
            "Profile";


        profile.setAttribute(
            "aria-label",
            "Profile"
        );


        profile.innerHTML =
            `
            <span>👤</span>
            <span>Profile</span>
            `;


        profile.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                goProfile();

            }
        );
    }


    /* =====================================================
       QUICK ACTIONS
       ===================================================== */

    function createQuickActions() {

        if (
            document.querySelector(
                ".fc-quick-actions"
            )
        ) {

            return;

        }


        const box =
            create(
                "div",
                "fc-quick-actions",
                document.body
            );


        const add =
            create(
                "button",
                "",
                box
            );


        add.type =
            "button";


        add.title =
            "Add friend";


        add.setAttribute(
            "aria-label",
            "Add friend"
        );


        add.textContent =
            "+";


        add.addEventListener(
            "click",
            event => {

                event.preventDefault();

                goAddFriend();

            }
        );


        const media =
            create(
                "button",
                "",
                box
            );


        media.type =
            "button";


        media.title =
            "Media";


        media.setAttribute(
            "aria-label",
            "Media"
        );


        media.textContent =
            "▧";


        media.addEventListener(
            "click",
            () => {

                const input =
                    $("profileMediaInput");


                if (input) {

                    input.click();

                    return;

                }


                goProfile();

            }
        );
    }


    /* =====================================================
       DISCOVERY
       ===================================================== */

    function createDiscovery() {

        if (
            $("fcDiscovery")
        ) {

            return;

        }


        const overlay =
            create(
                "div",
                "fc-overlay",
                document.body
            );


        overlay.id =
            "fcDiscoveryOverlay";


        overlay.addEventListener(
            "click",
            () => {

                closeDiscovery();

            }
        );


        const panel =
            create(
                "section",
                "fc-discovery",
                document.body
            );


        panel.id =
            "fcDiscovery";


        panel.innerHTML = `

            <div class="fc-discovery-head">

                <div>

                    <strong>
                        FC Suggestions
                    </strong>

                    <div class="fc-sidebar-sub">
                        People known to FriendChat
                    </div>

                </div>


                <button
                    type="button"
                    class="fc-dock-btn"
                    data-close-discovery
                >
                    ×
                </button>

            </div>


            <div
                class="fc-discovery-list"
                id="fcDiscoveryList"
            ></div>

        `;


        const close =
            panel.querySelector(
                "[data-close-discovery]"
            );


        if (close) {

            close.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    closeDiscovery();

                }
            );

        }
    }


    function toggleDiscovery() {

        const panel =
            $("fcDiscovery");


        const overlay =
            $("fcDiscoveryOverlay");


        if (
            !panel ||
            !overlay
        ) {

            return;

        }


        const open =
            panel.classList.contains(
                "open"
            );


        if (open) {

            closeDiscovery();

        } else {

            renderDiscovery();

            panel.classList.add(
                "open"
            );

            overlay.classList.add(
                "open"
            );

        }
    }


    function closeDiscovery() {

        const panel =
            $("fcDiscovery");


        const overlay =
            $("fcDiscoveryOverlay");


        if (panel) {

            panel.classList.remove(
                "open"
            );

        }


        if (overlay) {

            overlay.classList.remove(
                "open"
            );

        }
    }


    function renderDiscovery() {

        const list =
            $("fcDiscoveryList");


        if (!list) {

            return;

        }


        list.innerHTML =
            "";


        const known =
            Array.isArray(
                window.friends
            )
                ? window.friends
                : [];


        const presence =
            window.friendChatPresence ||
            {};


        const users =
            new Map();


        known.forEach(
            user => {

                if (!user) {
                    return;
                }


                const id =
                    String(
                        user.id ||
                        ""
                    ).toUpperCase();


                if (!id) {
                    return;
                }


                users.set(
                    id,
                    user
                );

            }
        );


        Object.keys(
            presence
        ).forEach(
            id => {

                const key =
                    String(
                        id
                    ).toUpperCase();


                if (
                    !users.has(
                        key
                    )
                ) {

                    users.set(
                        key,
                        {
                            id: key,
                            name: key
                        }
                    );

                }

            }
        );


        const current =
            window.currentUser;


        const currentId =
            current &&
            current.id
                ? String(
                    current.id
                ).toUpperCase()
                : "";


        const people =
            [...users.values()]
                .filter(
                    user => {

                        const id =
                            String(
                                user.id ||
                                ""
                            ).toUpperCase();


                        return (
                            id &&
                            id !==
                            currentId
                        );

                    }
                );


        if (
            people.length === 0
        ) {

            list.innerHTML = `

                <div
                    style="
                        padding:30px;
                        text-align:center;
                        color:rgba(255,255,255,.55);
                    "
                >
                    No people available yet.
                </div>

            `;

            return;

        }


        people.forEach(
            user => {

                const row =
                    create(
                        "div",
                        "fc-user-suggestion",
                        list
                    );


                const avatar =
                    create(
                        "div",
                        "fc-user-avatar",
                        row
                    );


                avatar.textContent =
                    (
                        user.name ||
                        "?"
                    )
                        .charAt(0)
                        .toUpperCase();


                const info =
                    create(
                        "div",
                        "fc-user-info",
                        row
                    );


                const name =
                    create(
                        "div",
                        "fc-user-name",
                        info
                    );


                name.textContent =
                    user.name ||
                    "Unknown";


                const id =
                    create(
                        "div",
                        "fc-user-id",
                        info
                    );


                id.textContent =
                    user.id ||
                    "";


                const button =
                    create(
                        "button",
                        "fc-user-add",
                        row
                    );


                button.type =
                    "button";


                button.textContent =
                    "Chat";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        if (
                            typeof window.openChat ===
                            "function"
                        ) {

                            window.openChat(
                                user
                            );

                        }


                        closeDiscovery();

                        setTimeout(
                            updateScreenState,
                            50
                        );

                    }
                );

            }
        );
    }


    /* =====================================================
       THEME PANEL
       ===================================================== */

    function createThemePanel() {

        if (
            $("fcThemePanel")
        ) {

            return;

        }


        const overlay =
            create(
                "div",
                "fc-overlay",
                document.body
            );


        overlay.id =
            "fcThemeOverlay";


        overlay.addEventListener(
            "click",
            closeTheme
        );


        const panel =
            create(
                "section",
                "fc-theme-panel",
                document.body
            );


        panel.id =
            "fcThemePanel";


        panel.innerHTML = `

            <div class="fc-theme-head">

                <strong>
                    FriendChat Theme
                </strong>


                <button
                    type="button"
                    class="fc-dock-btn"
                    data-close-theme
                >
                    ×
                </button>

            </div>


            <div class="fc-theme-body">

                <div
                    class="fc-theme-grid"
                    id="fcThemeGrid"
                ></div>

            </div>

        `;


        const close =
            panel.querySelector(
                "[data-close-theme]"
            );


        if (close) {

            close.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    closeTheme();

                }
            );

        }


        const grid =
            $("fcThemeGrid");


        Object.entries(
            themes
        ).forEach(
            ([key, theme]) => {

                const button =
                    create(
                        "button",
                        "fc-theme-choice",
                        grid
                    );


                button.type =
                    "button";


                button.innerHTML = `

                    <div
                        class="fc-theme-swatch"
                        style="
                            background:
                            linear-gradient(
                                135deg,
                                ${theme.accent},
                                ${theme.accent2}
                            );
                        "
                    ></div>


                    <div class="fc-theme-name">
                        ${escapeHTML(
                            theme.name
                        )}
                    </div>


                    <div class="fc-theme-desc">
                        ${escapeHTML(
                            theme.desc
                        )}
                    </div>

                `;


                button.addEventListener(
                    "click",
                    () => {

                        applyTheme(
                            key
                        );

                    }
                );

            }
        );
    }


    function openTheme() {

        const panel =
            $("fcThemePanel");


        const overlay =
            $("fcThemeOverlay");


        if (!panel || !overlay) {
            return;
        }


        panel.classList.add(
            "open"
        );


        overlay.classList.add(
            "open"
        );
    }


    function closeTheme() {

        const panel =
            $("fcThemePanel");


        const overlay =
            $("fcThemeOverlay");


        if (panel) {

            panel.classList.remove(
                "open"
            );

        }


        if (overlay) {

            overlay.classList.remove(
                "open"
            );

        }
    }


    function applyTheme(key) {

        const theme =
            themes[key];


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
            theme.panel
        );


        root.style.setProperty(
            "--fc-accent",
            theme.accent
        );


        root.style.setProperty(
            "--fc-accent-2",
            theme.accent2
        );


        try {

            localStorage.setItem(
                "friendchat_theme",
                key
            );

        } catch (error) {

            console.warn(
                "Could not save theme",
                error
            );

        }


        closeTheme();
    }


    function loadTheme() {

        let saved =
            "midnight";


        try {

            saved =
                localStorage.getItem(
                    "friendchat_theme"
                ) ||
                "midnight";

        } catch (error) {

            console.warn(
                "Could not load theme",
                error
            );

        }


        applyTheme(
            saved
        );
    }


    /* =====================================================
       REMOVE OLD SPOTIFY SIDE BUTTON
       ===================================================== */

    function removeOldSpotifyButton() {

        const remove =
            () => {

                document
                    .querySelectorAll(
                        ".spotify-side-button, .spotify-side-bar"
                    )
                    .forEach(
                        element => {

                            element.remove();

                        }
                    );

            };


        remove();


        const timer =
            setInterval(
                remove,
                500
            );


        setTimeout(
            () => {

                clearInterval(
                    timer
                );

            },
            10000
        );
    }


    /* =====================================================
       SCREEN STATE
       ===================================================== */

    function updateScreenState() {

        const chat =
            $("chatScreen");


        const login =
            $("loginScreen");


        const signup =
            $("signupScreen");


        const chatOpen =
            !!(
                chat &&
                !chat.classList.contains(
                    "hidden"
                )
            );


        const loggedIn =
            !!(
                login &&
                login.classList.contains(
                    "hidden"
                ) &&
                (
                    !signup ||
                    signup.classList.contains(
                        "hidden"
                    )
                )
            );


        /* ================================================
           BODY CHAT STATE
           ================================================ */

        document.body.classList.toggle(
            "fc-chat-open",
            chatOpen
        );


        /* ================================================
           SIDEBAR
           ================================================ */

        const arrow =
            $("fcNavToggle");


        const sidebar =
            $("fcCustomSidebar");


        if (
            arrow &&
            sidebar
        ) {

            const visible =
                loggedIn;


            arrow.style.setProperty(
                "display",
                visible
                    ? "flex"
                    : "none",
                "important"
            );


            arrow.style.setProperty(
                "visibility",
                visible
                    ? "visible"
                    : "hidden",
                "important"
            );


            sidebar.style.setProperty(
                "display",
                visible
                    ? "block"
                    : "none",
                "important"
            );


            sidebar.style.setProperty(
                "visibility",
                visible
                    ? "visible"
                    : "hidden",
                "important"
            );

        }


        /* ================================================
           BOTTOM DOCK
           ================================================ */

        document
            .querySelectorAll(
                ".fc-bottom-dock"
            )
            .forEach(
                dock => {

                    const show =
                        loggedIn &&
                        !chatOpen;


                    dock.style.setProperty(
                        "display",
                        show
                            ? "flex"
                            : "none",
                        "important"
                    );


                    dock.style.setProperty(
                        "visibility",
                        show
                            ? "visible"
                            : "hidden",
                        "important"
                    );


                    dock.style.setProperty(
                        "opacity",
                        show
                            ? "1"
                            : "0",
                        "important"
                    );

                }
            );


        /* ================================================
           QUICK ACTIONS
           ================================================ */

        document
            .querySelectorAll(
                ".fc-quick-actions"
            )
            .forEach(
                box => {

                    const show =
                        loggedIn;


                    box.style.setProperty(
                        "display",
                        show
                            ? "flex"
                            : "none",
                        "important"
                    );

                }
            );
    }


    /* =====================================================
       SCREEN OBSERVER
       ===================================================== */

    function startScreenObserver() {

        updateScreenState();


        const observer =
            new MutationObserver(
                () => {

                    updateScreenState();

                }
            );


        observer.observe(
            document.body,
            {
                subtree: true,
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );


        setInterval(
            updateScreenState,
            500
        );
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        installStyles();


        if (
            $("fcCustomSidebar")
        ) {

            updateScreenState();

            return;

        }


        createSidebar();

        createQuickActions();

        createBottomDock();

        createDiscovery();

        createThemePanel();

        removeOldSpotifyButton();

        loadTheme();

        startScreenObserver();


        console.log(
            "FriendChat UI v3 loaded successfully"
        );
    }


    /* =====================================================
       START AFTER PAGE LOAD
       ===================================================== */

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
