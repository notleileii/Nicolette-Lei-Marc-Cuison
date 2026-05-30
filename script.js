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
  console.warn("Firebase not configured. Running in demo mode.");
}

function calcAge() {
  const bday = new Date("2005-05-09");
  const today = new Date();
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}
document.getElementById("ageTag").textContent = "Age: " + calcAge() + " years old";
document.getElementById("yr-tag").textContent = new Date().getFullYear();

window.addEventListener("load", () => {
  setTimeout(() => {
    const screen = document.getElementById("pf-screen");
    screen.classList.add("dim-out");
    setTimeout(() => (screen.style.display = "none"), 600);
  }, 1200);
});

let isDark = true;

function toggleTheme() {
  isDark = !isDark;
  document.getElementById("page-root").className = isDark ? "dark" : "light";
  document.getElementById("palette-ico").textContent = isDark ? "☀️" : "🌙";
  document.getElementById("palette-txt").textContent = isDark ? "Light" : "Dark";
}

function toggleMenu() {
  document.getElementById("navDrawer").classList.toggle("expanded");
}

function closeMenu() {
  document.getElementById("navDrawer").classList.remove("expanded");
}

const watcher = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("shown");
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".appear").forEach((el) => watcher.observe(el));

let slides = [];
let currentSlide = 0;
let reelTimer = null;

function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str || ""));
  return d.innerHTML;
}

function buildSlider(messages) {
  const track = document.getElementById("reelTrack");
  const dots = document.getElementById("reelDots");
  track.innerHTML = "";
  dots.innerHTML = "";

  const replied = (messages || []).filter(
    (m) => m.replies && Object.keys(m.replies).length > 0
  );

  if (replied.length === 0) {
    track.innerHTML =
      '<div class="reel-item"><div style="text-align:center;width:100%;color:var(--text2);">No replies yet. Check back soon!</div></div>';
    return;
  }

  slides = replied;

  replied.forEach((msg, i) => {
    const replyList = Object.values(msg.replies);
    const latestReply = replyList[replyList.length - 1];

    const div = document.createElement("div");
    div.className = "reel-item";
    div.innerHTML = `
      <div class="reel-body">
        <p class="reel-from">
          Nicolette replied to
          <strong style="color:var(--accent);">${escapeHtml(msg.name)}</strong>:
          <em style="color:var(--text2);font-style:italic;">${escapeHtml(msg.text)}</em>
        </p>
        <p class="reel-msg">${escapeHtml(latestReply.text)}</p>
        <span class="reel-sig">— NCuison &nbsp;·&nbsp; ${latestReply.time || ""}</span>
      </div>`;
    track.appendChild(div);

    const dot = document.createElement("div");
    dot.className = "reel-dot" + (i === 0 ? " on" : "");
    dot.onclick = () => goToSlide(i);
    dots.appendChild(dot);
  });

  currentSlide = 0;
  goToSlide(0);
  startReel();
}

function goToSlide(n) {
  currentSlide = n;
  document.getElementById("reelTrack").style.transform = `translateX(-${n * 100}%)`;
  document.querySelectorAll(".reel-dot").forEach((d, i) => d.classList.toggle("on", i === n));
}

function startReel() {
  if (reelTimer) clearInterval(reelTimer);
  if (slides.length < 2) return;
  reelTimer = setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    goToSlide(currentSlide);
  }, 5000);
}

let demoMessages = [];

if (db) {
  db.ref("messages").on("value", (snap) => {
    const data = snap.val();
    const msgs = data ? Object.values(data).reverse().slice(0, 20) : [];
    buildSlider(msgs);
  });
} else {
  buildSlider([]);
}

async function sendMessage() {
  const name = document.getElementById("fromName").value.trim();
  const text = document.getElementById("msgText").value.trim();
  const btn = document.getElementById("submitBtn");

  if (!name) { showFieldNote("Please enter your name.", "err"); return; }
  if (!text) { showFieldNote("Please write a message.", "err"); return; }

  btn.disabled = true;
  btn.textContent = "Sending...";

  const msgObj = {
    name,
    text,
    time: new Date().toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  if (db) {
    try {
      await db.ref("messages").push(msgObj);
      document.getElementById("fromName").value = "";
      document.getElementById("msgText").value = "";
      showFieldNote("Message sent! 🎉", "ok");
    } catch (e) {
      showFieldNote("Error: " + e.message, "err");
    }
  } else {
    demoMessages.unshift(msgObj);
    buildSlider(demoMessages.slice(0, 20));
    document.getElementById("fromName").value = "";
    document.getElementById("msgText").value = "";
    showFieldNote("Sent in demo mode! Set up Firebase to persist messages. 🎉", "ok");
  }

  btn.disabled = false;
  btn.textContent = "Send Message ✉️";
}

function showFieldNote(text, type) {
  const el = document.getElementById("fieldNote");
  el.textContent = text;
  el.className = "field-note " + type;
  setTimeout(() => (el.className = "field-note"), 5000);
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;
    e.preventDefault();

    const screen = document.getElementById("pf-screen");
    screen.style.display = "flex";
    screen.style.opacity = "1";
    screen.querySelector(".pf-spin-label").textContent = "Navigating...";

    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth" });
      screen.classList.add("dim-out");
      setTimeout(() => {
        screen.style.display = "none";
        screen.classList.remove("dim-out");
        screen.querySelector(".pf-spin-label").textContent = "Loading Portfolio...";
      }, 500);
    }, 400);
  });
});
