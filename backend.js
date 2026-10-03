const SUPABASE_URL = "https://yfdfgvucqypxduqvplrf.supabase.co";
const SUPABASE_KEY = "sb_publishable_J5KWC7EHeN2G2x6-0vGYVw_ayOGeKY0";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ACTIVE_STATUSES = ["queued", "forging", "finishing"];

async function ensureCustomerSession() {
  const { data, error } = await db.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.user;

  const signIn = await db.auth.signInAnonymously();
  if (signIn.error) throw signIn.error;
  return signIn.data.user;
}

async function getProducts() {
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("active", true)
    .order("price");
  if (error) throw error;
  return data;
}

async function placeOrder(order) {
  const { data, error } = await db
    .from("orders")
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getMyOrders(userId) {
  const { data, error } = await db
    .from("orders")
    .select("*, products(name)")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function getPosition(orderId) {
  const { data, error } = await db.rpc("queue_position", { p_order_id: orderId });
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function isStaff() {
  const { data, error } = await db.from("staff").select("user_id");
  if (error) throw error;
  return data.length > 0;
}

async function loginStaff(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function logout() {
  const { error } = await db.auth.signOut();
  if (error) throw error;
  return ensureCustomerSession();
}

async function getQueue() {
  const { data, error } = await db
    .from("orders")
    .select("*, products(name)")
    .in("status", [...ACTIVE_STATUSES, "ready"])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

async function setStatus(orderId, status) {
  const changes = { status };
  if (status === "picked_up") changes.completed_at = new Date().toISOString();

  const { data, error } = await db
    .from("orders")
    .update(changes)
    .eq("id", orderId)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Order was not updated. Are you logged in as Gunter?");
  return data[0];
}

async function setPriority(orderId, priority) {
  const { error } = await db.from("orders").update({ priority }).eq("id", orderId);
  if (error) throw error;
}

async function startOrder(orderId) {
  const { error } = await db.rpc("start_order", { p_order_id: orderId });
  if (error) throw error;
}

async function getMaterials() {
  const { data, error } = await db.from("materials").select("*").order("name");
  if (error) throw error;
  return data;
}

async function addStock(materialId, amount) {
  const current = await db.from("materials").select("quantity").eq("id", materialId).single();
  if (current.error) throw current.error;

  const { error } = await db
    .from("materials")
    .update({ quantity: Number(current.data.quantity) + amount })
    .eq("id", materialId);
  if (error) throw error;
}

function subscribeToOrders(onChange) {
  return db
    .channel("orders-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, onChange)
    .subscribe();
}

function unsubscribe(channel) {
  if (channel) db.removeChannel(channel);
}

const PRODUCT_OPTIONS = {
  sword: { label: "Blade length", choices: ["Short", "Long", "Greatsword"] },
  plate_armor: { label: "Size", choices: ["Small", "Medium", "Large"] },
  chain_mail: { label: "Size", choices: ["Small", "Medium", "Large"] },
  cooking_pot: { label: "Capacity", choices: ["2 quarts", "5 quarts", "10 quarts"] }
};

const STATUS_TEXT = {
  queued: "In line",
  forging: "On the anvil",
  finishing: "Finishing touches",
  ready: "Ready for pickup",
  picked_up: "Picked up",
  cancelled: "Cancelled"
};

const STATUS_STEPS = ["queued", "forging", "finishing", "ready"];

const NEXT_STEP = {
  queued: { label: "Start forging", status: "forging" },
  forging: { label: "Move to finishing", status: "finishing" },
  finishing: { label: "Mark ready", status: "ready" },
  ready: { label: "Picked up", status: "picked_up" }
};

const PRIORITY_TEXT = ["Normal", "Rush", "Royal"];

let currentUser = null;
let products = [];
let selectedProduct = null;
let positionTimer = null;
let ordersChannel = null;

const $ = (id) => document.getElementById(id);

function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function showMessage(id, text, isError) {
  const el = $(id);
  el.textContent = text;
  el.classList.toggle("error", Boolean(isError));
}

function progressPercent(status) {
  if (status === "picked_up") return 100;
  const step = STATUS_STEPS.indexOf(status);
  if (step < 0) return 0;
  return Math.round((step / (STATUS_STEPS.length - 1)) * 100);
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === name));
  document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.screen === name));

  clearInterval(positionTimer);
  positionTimer = null;

  if (name === "orders") {
    renderMyOrders();
    positionTimer = setInterval(renderMyOrders, 10000);
  }
  if (name === "forge") renderForge();
}

async function updateWho() {
  let staff = false;
  try {
    staff = await isStaff();
  } catch (error) {
    console.error(error);
  }
  $("who").textContent = staff ? "Signed in as Gunter" : "Customer";
}

async function renderShop() {
  try {
    products = await getProducts();
    $("product-list").innerHTML = products.map((p) => `
      <div class="card">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <p class="price">${esc(p.price)} gold · about ${esc(p.forge_hours)} h to forge</p>
        <button data-product="${esc(p.id)}">Order</button>
      </div>`).join("");
  } catch (error) {
    console.error(error);
    showMessage("shop-message", "Could not load products: " + error.message, true);
  }
}

function openOrderForm(productId) {
  selectedProduct = products.find((p) => p.id === productId);
  if (!selectedProduct) return;

  const options = PRODUCT_OPTIONS[productId];
  $("order-title").textContent = "Order: " + selectedProduct.name;
  $("option-wrap").classList.toggle("hidden", !options);
  if (options) {
    $("option-name").textContent = options.label;
    $("order-option").innerHTML = options.choices.map((c) => `<option>${esc(c)}</option>`).join("");
  }

  showMessage("shop-message", "");
  $("order-form").classList.remove("hidden");
  $("order-form").scrollIntoView({ behavior: "smooth" });
}

function closeOrderForm() {
  $("order-form").reset();
  $("order-form").classList.add("hidden");
  selectedProduct = null;
}

async function submitOrder(event) {
  event.preventDefault();
  if (!selectedProduct) return;

  const name = $("order-name").value.trim();
  const quantity = parseInt($("order-qty").value, 10);
  if (!name || !(quantity > 0)) {
    showMessage("shop-message", "Please enter your name and a quantity of at least 1.", true);
    return;
  }

  const options = PRODUCT_OPTIONS[selectedProduct.id];
  const order = {
    customer_name: name,
    product_id: selectedProduct.id,
    quantity,
    notes: $("order-notes").value.trim() || null,
    options: options ? { [options.label]: $("order-option").value } : {}
  };

  try {
    const saved = await placeOrder(order);
    closeOrderForm();
    showMessage("shop-message", `Order #${saved.id} placed! Open My Orders to see your place in line.`);
  } catch (error) {
    console.error(error);
    showMessage("shop-message", "Could not place order: " + error.message, true);
  }
}

function orderCard(order, position) {
  const productName = order.products ? order.products.name : order.product_id;
  let placeLine = "";
  if (position && position.place_in_line > 0) {
    placeLine = `<p class="place">#${position.place_in_line} in line · about ${Number(position.hours_until_ready)} hours</p>`;
  } else if (order.status === "ready") {
    placeLine = `<p class="place">Ready for pickup!</p>`;
  }

  const optionText = Object.entries(order.options || {}).map(([k, v]) => `${k}: ${v}`).join(", ");

  return `
    <div class="card">
      <div class="row spread">
        <h3>#${esc(order.id)} · ${esc(productName)} × ${esc(order.quantity)}</h3>
        <span class="badge">${esc(STATUS_TEXT[order.status] || order.status)}</span>
      </div>
      ${optionText ? `<p class="muted">${esc(optionText)}</p>` : ""}
      ${placeLine}
      <div class="progress"><span style="width:${progressPercent(order.status)}%"></span></div>
    </div>`;
}

async function renderMyOrders() {
  const box = $("my-orders");
  if (!currentUser) {
    box.innerHTML = `<p class="message error">Not signed in yet.</p>`;
    return;
  }

  try {
    const orders = await getMyOrders(currentUser.id);
    if (orders.length === 0) {
      box.innerHTML = `<p class="muted">No orders yet. Visit the Shop to place one.</p>`;
      return;
    }
    const positions = await Promise.all(
      orders.map((o) => (ACTIVE_STATUSES.includes(o.status) ? getPosition(o.id) : null))
    );
    box.innerHTML = orders.map((o, i) => orderCard(o, positions[i])).join("");
  } catch (error) {
    console.error(error);
    box.innerHTML = `<p class="message error">${esc(error.message)}</p>`;
  }
}

async function renderForge() {
  let staff = false;
  try {
    staff = await isStaff();
  } catch (error) {
    console.error(error);
  }

  $("login-form").classList.toggle("hidden", staff);
  $("dashboard").classList.toggle("hidden", !staff);

  if (staff) {
    await Promise.all([renderQueue(), renderMaterials()]);
    startLiveUpdates();
  } else {
    stopLiveUpdates();
  }
}

async function renderQueue() {
  const box = $("queue");
  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      box.innerHTML = `<p class="muted">Nothing on the to-do list. Time for a break!</p>`;
      return;
    }
    box.innerHTML = queue.map((o, i) => {
      const next = NEXT_STEP[o.status];
      const productName = o.products ? o.products.name : o.product_id;
      const optionText = Object.entries(o.options || {}).map(([k, v]) => `${k}: ${v}`).join(", ");
      return `
        <div class="card">
          <div class="row spread">
            <h3>${i + 1}. ${esc(productName)} × ${esc(o.quantity)}</h3>
            <span class="badge">${esc(STATUS_TEXT[o.status])}</span>
          </div>
          <p>For ${esc(o.customer_name)} · order #${esc(o.id)} · ${esc(PRIORITY_TEXT[o.priority] || "Normal")}</p>
          ${optionText ? `<p class="muted">${esc(optionText)}</p>` : ""}
          ${o.notes ? `<p class="muted">Notes: ${esc(o.notes)}</p>` : ""}
          <div class="row">
            ${next ? `<button class="small" data-order="${o.id}" data-next="${next.status}">${esc(next.label)}</button>` : ""}
            <select class="small" data-priority-for="${o.id}">
              ${PRIORITY_TEXT.map((label, p) => `<option value="${p}" ${p === o.priority ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
        </div>`;
    }).join("");
  } catch (error) {
    console.error(error);
    box.innerHTML = `<p class="message error">${esc(error.message)}</p>`;
  }
}

async function renderMaterials() {
  const box = $("materials");
  try {
    const materials = await getMaterials();
    box.innerHTML = materials.map((m) => {
      const low = Number(m.quantity) <= Number(m.low_threshold);
      return `
        <div class="card ${low ? "low" : ""}">
          <div class="row spread">
            <span><strong>${esc(m.name)}</strong> <span class="qty">${esc(m.quantity)} ${esc(m.unit)}</span>${low ? " · running low!" : ""}</span>
            <button class="small secondary" data-material="${esc(m.id)}">+10</button>
          </div>
        </div>`;
    }).join("");
  } catch (error) {
    console.error(error);
    box.innerHTML = `<p class="message error">${esc(error.message)}</p>`;
  }
}

async function advanceOrder(orderId, nextStatus) {
  showMessage("forge-message", "");
  try {
    if (nextStatus === "forging") {
      await startOrder(orderId);
    } else {
      await setStatus(orderId, nextStatus);
    }
  } catch (error) {
    console.error(error);
    showMessage("forge-message", error.message, true);
  }
  await Promise.all([renderQueue(), renderMaterials()]);
}

function startLiveUpdates() {
  if (ordersChannel) return;
  ordersChannel = subscribeToOrders(() => {
    renderQueue();
    renderMaterials();
  });
}

function stopLiveUpdates() {
  unsubscribe(ordersChannel);
  ordersChannel = null;
}

async function handleLogin(event) {
  event.preventDefault();
  showMessage("login-message", "");
  try {
    currentUser = await loginStaff($("login-email").value.trim(), $("login-password").value);
    if (!(await isStaff())) {
      currentUser = await logout();
      showMessage("login-message", "That account isn't Gunter's.", true);
      return;
    }
    $("login-form").reset();
    await renderForge();
  } catch (error) {
    console.error(error);
    showMessage("login-message", "Login failed: " + error.message, true);
  }
  updateWho();
}

async function handleLogout() {
  stopLiveUpdates();
  try {
    currentUser = await logout();
  } catch (error) {
    console.error(error);
  }
  await renderForge();
  updateWho();
}

function wireEvents() {
  document.querySelectorAll(".tabbar button").forEach((b) => {
    b.addEventListener("click", () => showScreen(b.dataset.screen));
  });

  $("product-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-product]");
    if (btn) openOrderForm(btn.dataset.product);
  });

  $("order-form").addEventListener("submit", submitOrder);
  $("order-cancel").addEventListener("click", closeOrderForm);
  $("login-form").addEventListener("submit", handleLogin);
  $("logout").addEventListener("click", handleLogout);

  $("queue").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-order]");
    if (btn) advanceOrder(Number(btn.dataset.order), btn.dataset.next);
  });

  $("queue").addEventListener("change", async (e) => {
    const select = e.target.closest("select[data-priority-for]");
    if (!select) return;
    try {
      await setPriority(Number(select.dataset.priorityFor), Number(select.value));
    } catch (error) {
      showMessage("forge-message", error.message, true);
    }
    renderQueue();
  });

  $("materials").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-material]");
    if (!btn) return;
    try {
      await addStock(btn.dataset.material, 10);
    } catch (error) {
      showMessage("forge-message", error.message, true);
    }
    renderMaterials();
  });
}

async function init() {
  if (!$("app")) return;
  wireEvents();
  try {
    currentUser = await ensureCustomerSession();
  } catch (error) {
    console.error(error);
    showMessage("shop-message", "Could not sign in: " + error.message + " (is anonymous sign-in turned on?)", true);
  }
  await renderShop();
  updateWho();
}

init();
