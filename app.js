function openChat(friend) {

  currentChatUserId = friend.id;

  hideAllScreens();

  document
    .getElementById("chatScreen")
    .classList.remove("hidden");

  const chatName =
    document.getElementById("chatName");

  const chatId =
    document.getElementById("chatId");

  chatName.textContent = friend.name;

  chatId.innerHTML = `
    ${escapeHtml(friend.id)}
    <span
      id="chatStatus"
      class="muted"
      style="margin-left:8px;"
    >
      ${presenceLabel(
        getPresence(friend.id).status
      )}
    </span>
  `;

  if (!chats[currentChatUserId]) {
    chats[currentChatUserId] = [];
  }

  // Mark unread messages as READ
  chats[currentChatUserId].forEach(message => {

    if (!message.mine && message.status !== "read") {

      message.status = "read";

      sendRead(message.id);

    }

  });

  saveChats();

  renderMessages();

  sendPresence(currentChatUserId);

  // Remove notification immediately
  renderFriends();

}
