async function loadMyOrders() {
  const user = await getUser();

  // Get this customer's orders, newest first
  const { data, error } = await sb
    .from("orders")
    .select("*, products(name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }

  let html = "";
  for (const o of data) {
    const productName = o.products.name;

    let notes = "None";
    if (o.notes) {
      notes = o.notes;
    }

    html += `
      <div class="checkoutPart">
        <h2>Order #${o.id}: ${productName} × ${o.quantity}</h2>
        <p>Stage: ${o.status}</p>
        <p>Notes: ${notes}</p>
      </div>
    `;
  }

  if (data.length === 0) {
    html = "<p>You haven't placed any orders yet.</p>";
  }

  document.getElementById("my-orders").innerHTML = html;
}

loadMyOrders();