<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>FriendChat - Server</title>

    <link
        rel="stylesheet"
        href="server-home.css"
    >

    <link rel="stylesheet" href="server-customization.css">
</head>


<body>

    <div class="server-app">


        <!-- =================================================
             TOP BAR
             ================================================= -->

        <header class="top-bar">

            <div class="top-left">

                <button
                    class="back-button"
                    id="backButton"
                    title="Back"
                >
                    ←
                </button>


                <div class="mini-server-icon">

                    <img
                        id="topServerIcon"
                        src=""
                        alt=""
                    >

                    <span id="topServerIconText">
                        FC
                    </span>

                </div>


                <div class="top-server-info">

                    <div
                        class="top-server-name"
                        id="topServerName"
                    >
                        Server
                    </div>

                    <div class="top-server-status">
                        Your server
                    </div>

                </div>

            </div>


            <div class="top-right">

                <button
                    class="top-button"
                    id="membersButton"
                >
                    <span>👥</span>
                    <span>Members</span>
                </button>


                <button
                    class="top-button"
                    id="settingsButton"
                >
                    <span>⚙</span>
                    <span>Settings</span>
                </button>

            </div>

        </header>



        <!-- =================================================
             MAIN CONTENT
             ================================================= -->

        <main class="main-content">


            <!-- =================================================
                 SERVER HERO
                 ================================================= -->

            <section class="server-hero">

                <div class="hero-glow"></div>


                <div class="large-server-icon">

                    <img
                        id="serverIcon"
                        src=""
                        alt="Server icon"
                    >

                    <span id="serverIconText">
                        FC
                    </span>

                </div>


                <div class="hero-info">

                    <div class="server-label">
                        YOUR SERVER
                    </div>

                    <h1 id="serverName">
                        Server
                    </h1>

                    <p id="serverDescription">
                        Welcome to your FriendChat server.
                    </p>


                    <div class="server-id">

                        <span>
                            SERVER ID
                        </span>

                        <code id="serverID">
                            —
                        </code>

                        <button
                            id="copyServerID"
                            title="Copy Server ID"
                        >
                            Copy
                        </button>

                    </div>

                </div>

            </section>



            <!-- =================================================
                 CHANNELS
                 ================================================= -->

            <section
                class="section channels-section"
                id="channelsSection"
            >

                <div class="section-heading channels-heading">

                    <div>

                        <h2>
                            Channels
                        </h2>

                        <p>
                            Create spaces for conversations and activities.
                        </p>

                    </div>


                    <button
                        class="create-channel-button"
                        id="createChannelButton"
                        type="button"
                    >

                        <span>
                            +
                        </span>

                        <span>
                            Create Channel
                        </span>

                    </button>

                </div>



                <!-- TEXT CHANNELS -->

                <div class="channel-group">

                    <div class="channel-group-title">

                        <span>
                            TEXT CHANNELS
                        </span>

                    </div>


                    <div
                        class="channel-list"
                        id="textChannelList"
                    >

                        <!-- Channels will be inserted here -->

                    </div>

                </div>



                <!-- VOICE CHANNELS -->

                <div class="channel-group">

                    <div class="channel-group-title">

                        <span>
                            VOICE CHANNELS
                        </span>

                    </div>


                    <div
                        class="channel-list"
                        id="voiceChannelList"
                    >

                        <!-- Voice channels will be inserted here -->

                    </div>

                </div>


            </section>



            <!-- =================================================
                 QUICK ACTIONS
                 ================================================= -->

            <section class="section">

                <div class="section-heading">

                    <div>

                        <h2>
                            Your server
                        </h2>

                        <p>
                            Manage and customize your space.
                        </p>

                    </div>

                </div>


                <div class="action-grid">


                    <!-- CHANNELS -->

                    <button
                        class="action-card"
                        id="channelsCard"
                        type="button"
                    >

                        <div class="action-icon">
                            💬
                        </div>

                        <div class="action-text">

                            <strong>
                                Channels
                            </strong>

                            <span>
                                Create rooms for conversations
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>



                    <!-- MEMBERS -->

                    <button
                        class="action-card"
                        id="membersCard"
                        type="button"
                    >

                        <div class="action-icon">
                            👥
                        </div>

                        <div class="action-text">

                            <strong>
                                Members
                            </strong>

                            <span>
                                See people in your server
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>



                    <!-- RULES -->

                    <button
                        class="action-card"
                        id="rulesCard"
                        type="button"
                    >

                        <div class="action-icon">
                            📜
                        </div>

                        <div class="action-text">

                            <strong>
                                Rules
                            </strong>

                            <span>
                                Set rules for your community
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>



                    <!-- ROLES -->

                    <button
                        class="action-card"
                        id="rolesCard"
                        type="button"
                    >

                        <div class="action-icon">
                            🛡
                        </div>

                        <div class="action-text">

                            <strong>
                                Roles
                            </strong>

                            <span>
                                Manage roles and permissions
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>



                    <!-- AI -->

                    <button
                        class="action-card"
                        id="aiCard"
                        type="button"
                    >

                        <div class="action-icon">
                            ✦
                        </div>

                        <div class="action-text">

                            <strong>
                                FriendChat AI
                            </strong>

                            <span>
                                AI tools for your server
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>



                    <!-- MUSIC -->

                    <button
                        class="action-card"
                        id="musicCard"
                        type="button"
                    >

                        <div class="action-icon">
                            ♪
                        </div>

                        <div class="action-text">

                            <strong>
                                Music
                            </strong>

                            <span>
                                Shared listening and music
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>



                    <!-- ACTIVITY -->

                    <button
                        class="action-card"
                        id="activityCard"
                        type="button"
                    >

                        <div class="action-icon">
                            ◉
                        </div>

                        <div class="action-text">

                            <strong>
                                Activity
                            </strong>

                            <span>
                                See what's happening
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>



                    <!-- SETTINGS -->

                    <button
                        class="action-card"
                        id="serverSettingsCard"
                        type="button"
                    >

                        <div class="action-icon">
                            ⚙
                        </div>

                        <div class="action-text">

                            <strong>
                                Server Settings
                            </strong>

                            <span>
                                Customize your server
                            </span>

                        </div>

                        <div class="action-arrow">
                            →
                        </div>

                    </button>

                </div>

            </section>



            <!-- =================================================
                 SERVER PREVIEW
                 ================================================= -->

            <section class="section">

                <div class="section-heading">

                    <div>

                        <h2>
                            Server preview
                        </h2>

                        <p>
                            This is how your server currently looks.
                        </p>

                    </div>

                </div>


                <div class="preview-box">


                    <div class="preview-header">

                        <div class="preview-server-icon">

                            <img
                                id="previewIcon"
                                src=""
                                alt=""
                            >

                            <span id="previewIconText">
                                FC
                            </span>

                        </div>


                        <div>

                            <strong id="previewName">
                                Server
                            </strong>

                            <p>
                                FriendChat server
                            </p>

                        </div>

                    </div>


                    <div class="preview-line"></div>


                    <div
                        class="preview-content"
                        id="previewChannelList"
                    >

                        <!-- Preview channels inserted by JS -->

                    </div>

                </div>

            </section>


        </main>



        <!-- =================================================
             CREATE CHANNEL MODAL
             ================================================= -->

        <div
            class="channel-modal"
            id="channelModal"
            aria-hidden="true"
        >

            <div
                class="channel-modal-backdrop"
                id="channelModalBackdrop"
            ></div>


            <div
                class="channel-modal-box"
                role="dialog"
                aria-modal="true"
                aria-labelledby="channelModalTitle"
            >


                <div class="channel-modal-header">

                    <div>

                        <div
                            class="channel-modal-title"
                            id="channelModalTitle"
                        >
                            Create Channel
                        </div>

                        <div class="channel-modal-subtitle">
                            Add a new space to your server.
                        </div>

                    </div>


                    <button
                        class="channel-modal-close"
                        id="closeChannelModal"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>



                <!-- CHANNEL NAME -->

                <div class="form-group">

                    <label for="channelNameInput">
                        Channel name
                    </label>

                    <input
                        id="channelNameInput"
                        type="text"
                        maxlength="40"
                        placeholder="e.g. gaming"
                        autocomplete="off"
                    >

                    <div
                        class="form-error"
                        id="channelFormError"
                    ></div>

                </div>



                <!-- CHANNEL TYPE -->

                <div class="form-group">

                    <label>
                        Channel type
                    </label>


                    <div class="channel-type-options">


                        <label
                            class="channel-type-option selected"
                            id="textChannelOption"
                        >

                            <input
                                type="radio"
                                name="channelType"
                                value="text"
                                checked
                            >

                            <div class="channel-type-icon">
                                #
                            </div>

                            <div class="channel-type-info">

                                <strong>
                                    Text
                                </strong>

                                <span>
                                    Chat with messages
                                </span>

                            </div>

                        </label>



                        <label
                            class="channel-type-option"
                            id="voiceChannelOption"
                        >

                            <input
                                type="radio"
                                name="channelType"
                                value="voice"
                            >

                            <div class="channel-type-icon">
                                🔊
                            </div>

                            <div class="channel-type-info">

                                <strong>
                                    Voice
                                </strong>

                                <span>
                                    Talk with your friends
                                </span>

                            </div>

                        </label>


                    </div>

                </div>



                <!-- MODAL BUTTONS -->

                <div class="channel-modal-actions">

                    <button
                        class="modal-cancel-button"
                        id="cancelChannelButton"
                        type="button"
                    >
                        Cancel
                    </button>


                    <button
                        class="modal-create-button"
                        id="saveChannelButton"
                        type="button"
                    >
                        Create Channel
                    </button>

                </div>

            </div>

        </div>



        <!-- =================================================
             TOAST
             ================================================= -->

        <div
            class="toast"
            id="toast"
        >

            <span id="toastMessage">
                Done
            </span>

        </div>


    </div>


    <script src="server-home.js"></script>
    <script src="server-customization.js"></script>

</body>

</html>
