// ===== FIREBASE CONFIG (must match portfolio) =====
const firebaseConfig = {
  apiKey: "AIzaSyBkoIW15zSc2tkq_gk_2VhLIambL_utaUc",
  authDomain: "poftolio-message.firebaseapp.com",
  databaseURL: "https://poftolio-message-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "poftolio-message",
  storageBucket: "poftolio-message.firebasestorage.app",
  messagingSenderId: "1097950774038",
  appId: "1:1097950774038:web:9f44f62ff69c17dfe2c637",
  measurementId: "G-H0XKG6LEV6"
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch (e) {
  console.warn("Firebase not configured. Using demo data.");
}

// ===== STATE =====
let allMessages = [];
let currentReplyKey = null;
let seenKeys = new Set(JSON.parse(localStorage.getItem("seenKeys") || "[]"));

// ===== HELPERS =====
function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str || ""));
  return d.innerHTML;
}

function getInitials(name) {
  return (name || "?")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ===== RENDER =====
function renderMessages(messages) {
  const list = document.getElementById("msgList");
  const totalEl = document.getElementById("totalCount");
  const repliedEl = document.getElementById("repliedCount");
  const badge = document.getElementById("newBadge");

  if (!messages || messages.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><span class="emoji">📭</span><p>No messages yet.<br>Waiting for visitors to reach out...</p></div>';
    totalEl.textContent = "0";
    repliedEl.textContent = "0";
    badge.classList.remove("show");
    return;
  }

  totalEl.textContent = messages.length;
  const replied = messages.filter(
    (m) => m.replies && Object.keys(m.replies).length > 0
  ).length;
  repliedEl.textContent = replied;

  const newOnes = messages.filter((m) => !seenKeys.has(m.key)).length;
  if (newOnes > 0) {
    badge.textContent = newOnes + " New";
    badge.classList.add("show");
  } else {
    badge.classList.remove("show");
  }

  list.innerHTML = messages
    .map((msg) => {
      const isNew = !seenKeys.has(msg.key);
      const hasReplied = msg.replies && Object.keys(msg.replies).length > 0;

      const repliesHtml = hasReplied
        ? '<div class="replies-section">' +
          Object.values(msg.replies)
            .map(
              (r) =>
                `<div class="reply-item"><strong>📤 Your reply · ${r.time || ""}</strong>${escapeHtml(r.text)}</div>`
            )
            .join("") +
          "</div>"
        : "";

      return `
      <div class="msg-card ${isNew ? "new-msg" : ""} ${hasReplied ? "replied" : ""}">
        <div class="msg-header">
          <div class="msg-avatar">${getInitials(msg.name)}</div>
          <div class="msg-meta">
            <div class="msg-name">${escapeHtml(msg.name)}</div>
            <div class="msg-time">${msg.time || "Unknown time"}</div>
          </div>
        </div>
        <div class="msg-text">${escapeHtml(msg.text)}</div>
        <div class="msg-actions">
          <button class="reply-btn" onclick="openReply('${msg.key}', '${escapeHtml(msg.name).replace(/'/g, "\\'")}')">
            💬 Reply
          </button>
          <button class="delete-btn" onclick="deleteMsg('${msg.key}')">🗑 Delete</button>
        </div>
        ${repliesHtml}
      </div>`;
    })
    .join("");

  // Mark all as seen
  messages.forEach((m) => seenKeys.add(m.key));
  localStorage.setItem("seenKeys", JSON.stringify([...seenKeys]));
}

// ===== FIREBASE LISTENER =====
if (db) {
  db.ref("messages").on("value", (snap) => {
    const data = snap.val();
    allMessages = data
      ? Object.entries(data)
          .map(([key, val]) => ({ ...val, key }))
          .reverse()
      : [];
    renderMessages(allMessages);
  });
} else {
  // Demo data
  const demo = [
    {
      key: "demo1",
      name: "Maria Santos",
      text: "Hi! Love your portfolio. Very clean and professional!",
      time: "May 25, 12:30 PM",
    },
    {
      key: "demo2",
      name: "Juan Cruz",
      text: "Great work on the ERP system. Would love to collaborate sometime!",
      time: "May 25, 11:15 AM",
    },
  ];
  allMessages = demo;
  renderMessages(demo);
}

// ===== REPLY MODAL =====
function openReply(key, name) {
  currentReplyKey = key;
  document.getElementById("modalTo").textContent = "To: " + name;
  document.getElementById("replyText").value = "";
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  currentReplyKey = null;
}

async function submitReply() {
  const text = document.getElementById("replyText").value.trim();
  if (!text) { showNotif("Please write a reply first."); return; }

  const replyObj = {
    text,
    time: new Date().toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  if (db && currentReplyKey) {
    try {
      await db.ref("messages/" + currentReplyKey + "/replies").push(replyObj);
    } catch (e) {
      showNotif("Error: " + e.message);
      return;
    }
  } else {
    // Demo mode
    const msg = allMessages.find((m) => m.key === currentReplyKey);
    if (msg) {
      if (!msg.replies) msg.replies = {};
      msg.replies["r" + Date.now()] = replyObj;
      renderMessages(allMessages);
    }
  }

  closeModal();
  showNotif("Reply sent! ✅");
}

// ===== DELETE =====
async function deleteMsg(key) {
  if (!confirm("Delete this message?")) return;

  if (db) {
    try {
      await db.ref("messages/" + key).remove();
    } catch (e) {
      showNotif("Error: " + e.message);
    }
  } else {
    allMessages = allMessages.filter((m) => m.key !== key);
    renderMessages(allMessages);
    showNotif("Message deleted.");
  }
}

// ===== NOTIFICATION =====
function showNotif(text) {
  const el = document.getElementById("notif");
  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

// ===== CLOSE MODAL ON OVERLAY CLICK =====
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modalOverlay")) closeModal();
});

// ===== PWA INSTALL =====
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn").classList.add("visible");
});

document.getElementById("installBtn").addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById("installBtn").classList.remove("visible");
  }
});

// ===== SERVICE WORKER REGISTRATION =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}