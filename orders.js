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
    // The product may have been deleted since the order was placed
    let productName = "Removed product";
    if (o.products) {
      productName = o.products.name;
    }

    html += `
      <div class="checkoutPart">
        <h2>Order #${o.id}: ${productName} × ${o.quantity}</h2>
        <p>Stage: ${o.status}</p>
      </div>
    `;
  }

  if (data.length === 0) {
    html = "<p>You haven't placed any orders yet.</p>";
  }

  document.getElementById("my-orders").innerHTML = html;
}

loadMyOrders();