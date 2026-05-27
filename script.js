// ===== FIREBASE CONFIG =====
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

// ===== AGE CALCULATOR =====
function calcAge() {
  const bday = new Date("2005-05-09");
  const today = new Date();
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}
document.getElementById("ageBadge").textContent = "Age: " + calcAge() + " years old";
document.getElementById("footerYear").textContent = new Date().getFullYear();

// ===== LOADER =====
window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    loader.classList.add("fade-out");
    setTimeout(() => (loader.style.display = "none"), 600);
  }, 1200);
});

// ===== THEME TOGGLE =====
let isDark = true;

function toggleTheme() {
  isDark = !isDark;
  document.getElementById("body").className = isDark ? "dark" : "light";
  document.getElementById("theme-icon").textContent = isDark ? "☀️" : "🌙";
  document.getElementById("theme-label").textContent = isDark ? "Light" : "Dark";
}

// ===== MOBILE MENU =====
function toggleMenu() {
  document.getElementById("mobileMenu").classList.toggle("open");
}

function closeMenu() {
  document.getElementById("mobileMenu").classList.remove("open");
}

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ===== SLIDER =====
let slides = [];
let currentSlide = 0;
let sliderTimer = null;

function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str || ""));
  return d.innerHTML;
}

function buildSlider(messages) {
  const inner = document.getElementById("sliderInner");
  const dots = document.getElementById("sliderDots");
  inner.innerHTML = "";
  dots.innerHTML = "";

  // Only show messages that have at least one reply
  const replied = (messages || []).filter(
    (m) => m.replies && Object.keys(m.replies).length > 0
  );

  if (replied.length === 0) {
    inner.innerHTML =
      '<div class="slide"><div style="text-align:center;width:100%;color:var(--text2);">No replies yet. Check back soon!</div></div>';
    return;
  }

  slides = replied;

  replied.forEach((msg, i) => {
    const replyList = Object.values(msg.replies);
    const latestReply = replyList[replyList.length - 1];

    const div = document.createElement("div");
    div.className = "slide";
    div.innerHTML = `
      <div class="slide-content" style="width:100%;">
        <p class="slide-replied-label">
          Nicolette replied to
          <strong style="color:var(--accent);">${escapeHtml(msg.name)}</strong>:
          <em style="color:var(--text2);font-style:italic;">${escapeHtml(msg.text)}</em>
        </p>
        <p class="slide-reply-text">${escapeHtml(latestReply.text)}</p>
        <span class="slide-meta">— NCuison &nbsp;·&nbsp; ${latestReply.time || ""}</span>
      </div>`;
    inner.appendChild(div);

    const dot = document.createElement("div");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.onclick = () => goToSlide(i);
    dots.appendChild(dot);
  });

  currentSlide = 0;
  goToSlide(0);
  startSlider();
}

function goToSlide(n) {
  currentSlide = n;
  document.getElementById("sliderInner").style.transform = `translateX(-${n * 100}%)`;
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === n));
}

function startSlider() {
  if (sliderTimer) clearInterval(sliderTimer);
  if (slides.length < 2) return;
  sliderTimer = setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    goToSlide(currentSlide);
  }, 5000);
}

// ===== FIREBASE MESSAGES LISTENER =====
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

// ===== SEND MESSAGE =====
async function sendMessage() {
  const name = document.getElementById("senderName").value.trim();
  const text = document.getElementById("msgBody").value.trim();
  const btn = document.getElementById("sendBtn");

  if (!name) { showFormMsg("Please enter your name.", "error"); return; }
  if (!text) { showFormMsg("Please write a message.", "error"); return; }

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
      document.getElementById("senderName").value = "";
      document.getElementById("msgBody").value = "";
      showFormMsg("Message sent! 🎉", "success");
    } catch (e) {
      showFormMsg("Error: " + e.message, "error");
    }
  } else {
    // Demo mode — show in slider without persistence
    demoMessages.unshift(msgObj);
    buildSlider(demoMessages.slice(0, 20));
    document.getElementById("senderName").value = "";
    document.getElementById("msgBody").value = "";
    showFormMsg("Sent in demo mode! Set up Firebase to persist messages. 🎉", "success");
  }

  btn.disabled = false;
  btn.textContent = "Send Message ✉️";
}

function showFormMsg(text, type) {
  const el = document.getElementById("formMsg");
  el.textContent = text;
  el.className = "form-msg " + type;
  setTimeout(() => (el.className = "form-msg"), 5000);
}

// ===== SMOOTH SCROLL WITH LOADING FLASH =====
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;
    e.preventDefault();

    const loader = document.getElementById("loader");
    loader.style.display = "flex";
    loader.style.opacity = "1";
    loader.querySelector(".loader-text").textContent = "Navigating...";

    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth" });
      loader.classList.add("fade-out");
      setTimeout(() => {
        loader.style.display = "none";
        loader.classList.remove("fade-out");
        loader.querySelector(".loader-text").textContent = "Loading Portfolio...";
      }, 500);
    }, 400);
  });
});