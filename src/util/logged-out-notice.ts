export default function loggedOutNotice (): HTMLLIElement {
  const notice = document.createElement("li");
  notice.className = "notification unread";
  notice.innerHTML = "<div class=\"notification-header\"><img class=\"notification-author--avatar\" src=\"32.png\"><h3 class=\"notification-author--nickname\">KA Notifications</h3><span class=\"notification-date\">0s ago</span></div><p class=\"notification-content\">You must be <a class=\"hyperlink\" href=\"https://www.khanacademy.org/login/\" target=\"_blank\">logged in</a> to use this extension.</p>";
  return notice;
}
