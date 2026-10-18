async function onlyGunter(){
    if(!(await isStaff())){
        window.location.href = "home.html";
    }
}
const STAGES = [
  { value: "queued",    label: "Queued" },
  { value: "forging",   label: "Forging" },
  { value: "ready",     label: "Ready" },
];

function esc(text){
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML
}

async function loadOrders(){
    const {data, error} = await sb
        .from("orders")
        .select("*, products(name)")
        .in("status", ["queued", "forging"])
        .order("created_at");
    if (error) {
      console.error(error); 
      return; }

  const board = document.getElementById("order-board");
board.innerHTML = data.map((o) => {

  const productName = o.products.name;
  const name = esc(o.customer_name);
  const date = new Date(o.created_at).toLocaleString();
  const notes = esc(o.notes);

  return `
    <div class="order-card">
      <div class="order-info">
        <h3>#${o.id}: ${productName} × ${o.quantity}</h3>
        <p>For ${name} </p>
        <p>Ordered ${date}</p>
        <p>Notes: ${notes} </p>
      </div>
    <div class="order-stage-dropdown">
      <label>Stage</label>
      <select id ="dropdown">
        <option value="queued" ${o.status === "queued" && "selected"}>Queued</option>
        <option value="forging" ${o.status === "forging" && "selected"}>Forging</option>
        <option value="ready" ${o.status === "ready" && "selected"}>Ready</option>
      </select>
    </div>
  </div>
`;
}).join("");
}

document.getElementById("order-board").addEventListener("change", async (event) => {
  const select = event.target.closest("select[dropdown]");
  if (!select) return;

  const { error } = await sb
    .from("orders")
    .update({ status: select.value })
    .eq("id", select.dataset.id);
  if (error) {
    console.error(error); 
    return;}

  loadOrders();
});

const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    window.location.href = "login.html";
});
sb.channel("orders-feed")
  .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
  .subscribe();
onlyGunter();
loadOrders();