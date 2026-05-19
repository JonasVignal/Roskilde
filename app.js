// ═══════════════════════════════════════════════════════════
// FIREBASE CONFIG
// ─────────────────────────────────────────────────────────
// ⚠️  REPLACE with your own Firebase project credentials
// at https://console.firebase.google.com → Project settings
// ═══════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ═══════════════════════════════════════════════════════════
// EMAILJS CONFIG
// ─────────────────────────────────────────────────────────
// Sign up free at https://www.emailjs.com
// Create a service + template then fill in:
// ═══════════════════════════════════════════════════════════
const EMAILJS_PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
const BAR_EMAIL           = "bar@yourvenue.com"; // ← bar's email address

// ═══════════════════════════════════════════════════════════
// MENU DATA
// ═══════════════════════════════════════════════════════════
const MENU = [
  // ── Cocktails ──────────────────────────────────────────
  { id: 1,  category: "Cocktails",  name: "Negroni",          price: 95,  emoji: "🍊", img: "drink_negroni.png" },
  { id: 2,  category: "Cocktails",  name: "Mojito",           price: 89,  emoji: "🍃", img: "drink_mojito.png"  },
  { id: 3,  category: "Cocktails",  name: "Aperol Spritz",    price: 85,  emoji: "🍊", img: "drink_aperol.png"  },
  { id: 4,  category: "Cocktails",  name: "Margarita",        price: 90,  emoji: "🍋", img: "drink_margarita.png" },
  { id: 5,  category: "Cocktails",  name: "Espresso Martini", price: 99,  emoji: "☕", img: "drink_espresso_martini.png" },
  { id: 6,  category: "Cocktails",  name: "Gin & Tonic",      price: 85,  emoji: "🫧", img: "drink_gin_tonic.png" },
  // ── Spirits & Wine ─────────────────────────────────────
  { id: 7,  category: "Spirits",    name: "Single Malt Whisky", price: 110, emoji: "🥃", img: "drink_whisky.png" },
  { id: 8,  category: "Spirits",    name: "Red Wine",          price: 75,  emoji: "🍷", img: "drink_wine.png" },
  { id: 9,  category: "Spirits",    name: "Prosecco",          price: 72,  emoji: "🥂", img: null },
  { id: 10, category: "Spirits",    name: "Vodka Soda",        price: 78,  emoji: "🫙", img: null },
  // ── Beer ───────────────────────────────────────────────
  { id: 11, category: "Beer",       name: "Craft Beer (pint)", price: 65,  emoji: "🍺", img: "drink_beer.png" },
  { id: 12, category: "Beer",       name: "IPA (pint)",        price: 70,  emoji: "🍻", img: null },
  { id: 13, category: "Beer",       name: "Lager (pint)",      price: 60,  emoji: "🍺", img: null },
  { id: 14, category: "Beer",       name: "Wheat Beer",        price: 65,  emoji: "🍻", img: null },
  // ── Soft Drinks ────────────────────────────────────────
  { id: 15, category: "Soft",       name: "San Pellegrino",    price: 35,  emoji: "💧", img: null },
  { id: 16, category: "Soft",       name: "Coke / Diet Coke",  price: 30,  emoji: "🥤", img: null },
  { id: 17, category: "Soft",       name: "Ginger Beer",       price: 38,  emoji: "🫚", img: null },
  { id: 18, category: "Soft",       name: "Fresh Juice",       price: 42,  emoji: "🍊", img: null },
];

const ITEMS_PER_PAGE = 12;

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let currentUser   = null;
let basket        = {};      // { itemId: quantity }
let currentPage   = 0;
let currentCat    = "All";
let filteredItems = [];

// ═══════════════════════════════════════════════════════════
// INIT FIREBASE
// ═══════════════════════════════════════════════════════════
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// ── Auth state listener ─────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    showMenuScreen(user);
  } else {
    currentUser = null;
    showLoginScreen();
  }
});

// ═══════════════════════════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════════════════════════
const loginScreen      = document.getElementById("login-screen");
const menuScreen       = document.getElementById("menu-screen");
const btnGoogleSignin  = document.getElementById("btn-google-signin");
const loginError       = document.getElementById("login-error");
const userAvatar       = document.getElementById("user-avatar");
const userNameLabel    = document.getElementById("user-name");
const menuGrid         = document.getElementById("menu-grid");
const basketBadge      = document.getElementById("basket-badge");
const basketTotalLabel = document.getElementById("basket-total-label");
const btnBasket        = document.getElementById("btn-basket");
const basketPanel      = document.getElementById("basket-panel");
const basketBackdrop   = document.getElementById("basket-backdrop");
const btnCloseBasket   = document.getElementById("btn-close-basket");
const basketItemsEl    = document.getElementById("basket-items");
const basketTotalPrice = document.getElementById("basket-total-price");
const btnPlaceOrder    = document.getElementById("btn-place-order");
const orderConfirmed   = document.getElementById("order-confirmed");
const btnOrderDone     = document.getElementById("btn-order-done");
const categoryTabsEl   = document.getElementById("category-tabs");
const pageIndicator    = document.getElementById("page-indicator");
const btnPrev          = document.getElementById("btn-prev");
const btnNext          = document.getElementById("btn-next");

// ═══════════════════════════════════════════════════════════
// SCREEN TRANSITIONS
// ═══════════════════════════════════════════════════════════
function showLoginScreen() {
  menuScreen.classList.remove("active");
  requestAnimationFrame(() => loginScreen.classList.add("active"));
}

function showMenuScreen(user) {
  loginScreen.classList.remove("active");

  // Set user info
  userAvatar.src = user.photoURL || "";
  userAvatar.style.display = user.photoURL ? "block" : "none";
  userNameLabel.textContent = user.displayName?.split(" ")[0] || user.email;

  menuScreen.classList.add("active");

  buildCategoryTabs();
  applyFilter();
}

// ═══════════════════════════════════════════════════════════
// GOOGLE SIGN-IN
// ═══════════════════════════════════════════════════════════
btnGoogleSignin.addEventListener("click", async () => {
  loginError.textContent = "";
  btnGoogleSignin.disabled = true;
  btnGoogleSignin.textContent = "Signing in…";
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    loginError.textContent = friendlyAuthError(err.code);
    btnGoogleSignin.disabled = false;
    btnGoogleSignin.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google`;
  }
});

function friendlyAuthError(code) {
  const map = {
    "auth/popup-closed-by-user": "Sign-in cancelled.",
    "auth/network-request-failed": "No connection. Please check your network.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
  };
  return map[code] || "Sign-in failed. Please try again.";
}

// ═══════════════════════════════════════════════════════════
// CATEGORY TABS
// ═══════════════════════════════════════════════════════════
function buildCategoryTabs() {
  const cats = ["All", ...new Set(MENU.map(i => i.category))];
  categoryTabsEl.innerHTML = "";
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "cat-tab" + (cat === currentCat ? " active" : "");
    btn.textContent = cat;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", cat === currentCat);
    btn.setAttribute("id", `cat-${cat}`);
    btn.addEventListener("click", () => {
      currentCat = cat;
      currentPage = 0;
      document.querySelectorAll(".cat-tab").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      applyFilter();
    });
    categoryTabsEl.appendChild(btn);
  });
}

// ═══════════════════════════════════════════════════════════
// MENU RENDERING
// ═══════════════════════════════════════════════════════════
function applyFilter() {
  filteredItems = currentCat === "All"
    ? [...MENU]
    : MENU.filter(i => i.category === currentCat);
  renderPage();
}

function renderPage() {
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  if (currentPage >= totalPages) currentPage = Math.max(0, totalPages - 1);

  const start = currentPage * ITEMS_PER_PAGE;
  const pageItems = filteredItems.slice(start, start + ITEMS_PER_PAGE);

  // Render dots
  pageIndicator.innerHTML = "";
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement("div");
    dot.className = "page-dot" + (i === currentPage ? " active" : "");
    pageIndicator.appendChild(dot);
  }

  // Render grid
  menuGrid.innerHTML = "";
  pageItems.forEach((item, idx) => {
    const qty = basket[item.id] || 0;
    const card = document.createElement("div");
    card.className = "item-card" + (qty > 0 ? " in-basket" : "");
    card.id = `item-card-${item.id}`;
    card.style.animationDelay = `${idx * 0.04}s`;

    card.innerHTML = `
      <div class="item-img-wrap">
        ${item.img
          ? `<img class="item-img" src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"item-img-placeholder\\">${item.emoji}</div>'">`
          : `<div class="item-img-placeholder">${item.emoji}</div>`}
      </div>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">kr. ${item.price}</div>
        <div class="item-controls">
          <button class="qty-btn" id="minus-${item.id}" aria-label="Decrease quantity" ${qty === 0 ? "disabled" : ""}>−</button>
          <span class="qty-display" id="qty-${item.id}">${qty}</span>
          <button class="qty-btn" id="plus-${item.id}" aria-label="Increase quantity" ${qty >= 12 ? "disabled" : ""}>+</button>
          <button class="btn-add-basket" id="add-${item.id}">Add to basket</button>
        </div>
      </div>
    `;

    card.querySelector(`#minus-${item.id}`).addEventListener("click", () => adjustQty(item.id, -1));
    card.querySelector(`#plus-${item.id}`).addEventListener("click", () => adjustQty(item.id, +1));
    card.querySelector(`#add-${item.id}`).addEventListener("click", () => addToBasket(item.id));

    menuGrid.appendChild(card);
  });

  // Nav buttons
  btnPrev.disabled = currentPage === 0;
  btnNext.disabled = currentPage >= totalPages - 1;
}

function adjustQty(id, delta) {
  const item = MENU.find(i => i.id === id);
  if (!item) return;
  const current = basket[id] || 0;
  const next = Math.min(12, Math.max(0, current + delta));
  if (next === 0) delete basket[id]; else basket[id] = next;

  // Update card without full re-render for snappiness
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = next;
  const minusBtn = document.getElementById(`minus-${id}`);
  if (minusBtn) minusBtn.disabled = next === 0;
  const plusBtn = document.getElementById(`plus-${id}`);
  if (plusBtn) plusBtn.disabled = next >= 12;
  const card = document.getElementById(`item-card-${id}`);
  if (card) card.classList.toggle("in-basket", next > 0);

  updateBasketHeader();
}

function addToBasket(id) {
  const current = basket[id] || 0;
  const qty = current === 0 ? 1 : current; // if 0, add 1; else use current qty
  basket[id] = Math.min(12, qty);
  adjustQty(id, 0); // just refresh display
  updateBasketHeader();

  // Animate basket button
  btnBasket.style.transform = "scale(1.15)";
  setTimeout(() => { btnBasket.style.transform = ""; }, 200);
}

// ═══════════════════════════════════════════════════════════
// BASKET HEADER
// ═══════════════════════════════════════════════════════════
function updateBasketHeader() {
  const totalItems = Object.values(basket).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(basket).reduce((sum, [id, qty]) => {
    const item = MENU.find(i => i.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  if (totalItems > 0) {
    basketBadge.textContent = totalItems;
    basketBadge.classList.remove("hidden");
    basketTotalLabel.textContent = `kr. ${totalPrice}`;
  } else {
    basketBadge.classList.add("hidden");
    basketTotalLabel.textContent = "Basket";
  }
}

// Page navigation
btnPrev.addEventListener("click", () => { if (currentPage > 0) { currentPage--; renderPage(); } });
btnNext.addEventListener("click", () => {
  const total = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  if (currentPage < total - 1) { currentPage++; renderPage(); }
});

// Touch/swipe navigation on menu grid
let touchStartX = 0;
menuGrid.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
menuGrid.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 60) {
    if (dx < 0) btnNext.click();
    else btnPrev.click();
  }
}, { passive: true });

// ═══════════════════════════════════════════════════════════
// BASKET PANEL
// ═══════════════════════════════════════════════════════════
btnBasket.addEventListener("click", openBasket);
btnCloseBasket.addEventListener("click", closeBasket);
basketBackdrop.addEventListener("click", closeBasket);

function openBasket() {
  renderBasket();
  basketPanel.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeBasket() {
  basketPanel.classList.remove("open");
  document.body.style.overflow = "";
}

function renderBasket() {
  const entries = Object.entries(basket).filter(([, qty]) => qty > 0);

  if (entries.length === 0) {
    basketItemsEl.innerHTML = `<div class="basket-empty"><span>🛒</span>Your basket is empty.<br>Head back to the menu and add some drinks!</div>`;
    btnPlaceOrder.disabled = true;
    basketTotalPrice.textContent = "kr. 0";
    return;
  }

  btnPlaceOrder.disabled = false;
  let total = 0;
  basketItemsEl.innerHTML = "";

  entries.forEach(([idStr, qty]) => {
    const id = Number(idStr);
    const item = MENU.find(i => i.id === id);
    if (!item) return;
    const subtotal = item.price * qty;
    total += subtotal;

    const el = document.createElement("div");
    el.className = "basket-item";
    el.id = `basket-item-${id}`;
    el.innerHTML = `
      ${item.img
        ? `<img class="basket-item-img" src="${item.img}" alt="${item.name}" onerror="this.outerHTML='<div class=\\"basket-item-img\\" style=\\"display:flex;align-items:center;justify-content:center;font-size:28px;background:#1a1418;border-radius:10px;\\">${item.emoji}</div>'">`
        : `<div class="basket-item-img" style="display:flex;align-items:center;justify-content:center;font-size:28px;background:#1a1418;border-radius:10px;">${item.emoji}</div>`}
      <div class="basket-item-details">
        <div class="basket-item-name">${item.name}</div>
        <div class="basket-item-price">kr. ${item.price} each &bull; kr. ${subtotal} total</div>
      </div>
      <div class="basket-item-controls">
        <button class="qty-btn" id="bm-${id}" aria-label="Remove one">−</button>
        <span class="basket-item-qty" id="bq-${id}">${qty}</span>
        <button class="qty-btn" id="bp-${id}" aria-label="Add one" ${qty >= 12 ? "disabled" : ""}>+</button>
      </div>
    `;

    el.querySelector(`#bm-${id}`).addEventListener("click", () => {
      adjustQty(id, -1);
      renderBasket();
    });
    el.querySelector(`#bp-${id}`).addEventListener("click", () => {
      adjustQty(id, +1);
      renderBasket();
    });

    basketItemsEl.appendChild(el);
  });

  basketTotalPrice.textContent = `kr. ${total}`;
}

// ═══════════════════════════════════════════════════════════
// PLACE ORDER
// ═══════════════════════════════════════════════════════════
btnPlaceOrder.addEventListener("click", async () => {
  btnPlaceOrder.disabled = true;
  btnPlaceOrder.textContent = "Sending order…";

  const orderLines = Object.entries(basket)
    .filter(([, qty]) => qty > 0)
    .map(([idStr, qty]) => {
      const item = MENU.find(i => i.id === Number(idStr));
      return `${item.name} × ${qty} = kr. ${item.price * qty}`;
    });

  const total = Object.entries(basket).reduce((sum, [id, qty]) => {
    const item = MENU.find(i => i.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const orderText = orderLines.join("\n");

  // ── Send email via EmailJS ──────────────────────────────
  const sent = await sendOrderEmail({
    customerName: currentUser.displayName || currentUser.email,
    customerEmail: currentUser.email,
    orderDetails: orderText,
    totalPrice: `kr. ${total}`,
    orderTime: new Date().toLocaleTimeString("da-DK"),
  });

  closeBasket();

  // Show confirmation
  orderConfirmed.classList.remove("hidden");

  // Reset basket
  basket = {};
  updateBasketHeader();
  renderPage();

  btnPlaceOrder.textContent = "Place Order 🍸";
});

btnOrderDone.addEventListener("click", () => {
  orderConfirmed.classList.add("hidden");
});

// ═══════════════════════════════════════════════════════════
// EMAIL VIA EMAILJS
// ═══════════════════════════════════════════════════════════
async function sendOrderEmail({ customerName, customerEmail, orderDetails, totalPrice, orderTime }) {
  // Load EmailJS SDK dynamically
  if (!window.emailjs) {
    await loadScript("https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js");
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:       BAR_EMAIL,
      customer_name:  customerName,
      customer_email: customerEmail,
      order_details:  orderDetails,
      total_price:    totalPrice,
      order_time:     orderTime,
    });
    console.log("✅ Order email sent");
    return true;
  } catch (err) {
    console.error("❌ EmailJS error:", err);
    return false;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
