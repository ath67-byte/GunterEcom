async function onlyGunter(){ //if the current uid does not match gunter's then they are logged out
    if(!(await isStaff())){
        window.location.href = "home.html";
    }
}
const STAGES = [ //declares three stages that a order can be in
  { value: "queued",    label: "Queued" },
  { value: "forging",   label: "Forging" },
  { value: "ready",     label: "Ready" },
];

function filter(text){ //filters out text so if a user uses special characters there is no errors
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML
}

async function loadOrders(){ //the main load order function so gunter can see all the orders
    const {data, error} = await sb
        .from("orders")
        .select("*, products(name)")
        .in("status", ["queued", "forging"]) // if a order is ready, then it wont load
        .order("created_at"); //filters through the supabase orders and sorts by oldest orders
    if (error) {
      console.error(error); 
      return; }

  const board = document.getElementById("order-board"); //puts the order cards into order board on gunter.html
board.innerHTML = data.map((o) => { //turns the list of orders into html where o is the order

  const productName = filter(o.products.name);
  const name = filter(o.customer_name);
  const date = new Date(o.created_at).toLocaleString(); //pulls the data from supabase
  const notes = filter(o.notes);


  let queued = "";
  let forging = "";
  let ready = "";
  if (o.status === "queued") queued = "selected";
  if (o.status === "forging") forging = "selected";
  if (o.status === "ready") ready = "selected"; //identifies which option is selected

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
      <select id ="${o.id}">
        <option value="queued" ${queued}>Queued</option>
        <option value="forging" ${forging}>Forging</option>
        <option value="ready" ${ready}>Ready</option>
      </select>
    </div>
  </div>
`; //returns the html
}).join("");
}

document.getElementById("order-board").addEventListener("change", async (event) => { //listens for a event change
  const select = event.target.closest("select[id]"); //finds what actually changed
  if (!select) return;

  const {error} = await sb
    .from("orders")
    .update({ status: select.value })
    .eq("id", select.id);
  if (error) {
    console.error(error); 
    return;
  }

  loadOrders();
});

const logoutBtn = document.getElementById("logout"); //logs out when Gunter presses logout and sends him back to the login page
logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    window.location.href = "login.html";
});
sb.channel("orders-feed") // opens a live connection with supabase so orders can be seen live without reloading
  .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
  .subscribe();
onlyGunter();
loadOrders();