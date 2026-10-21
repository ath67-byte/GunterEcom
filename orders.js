async function loadMyOrders() { // loads all the customer order
  const user = await getUser(); // finds the current user
  const box = document.getElementById("my-orders"); //declares the customer's order box

  const {data, error} = await sb // calls supabase for the rows from orders
    .from("orders")
    .select("*, products(name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false }); // sorts by newest order
  if (error) {
    console.error(error);
    return;
  }

  if (data.length === 0) { // if the customer has no orders
    box.innerHTML = "<p>You haven't placed any orders yet.</p>";
    return;
  }

  let html = "";
  for (const o of data) {
    let notes = "None";
    if (o.notes) {
      notes = o.notes;
    } // adds any notes

    html += `
      <div class="checkoutPart">
        <h2>Order #${o.id}: ${o.products.name} × ${o.quantity}</h2>
        <p>Stage: ${o.status}</p>
        <p>Notes: ${notes}</p>
      </div>
    `; //prints the order card
  }

  box.innerHTML = html; // all the cards are put in the same box
}

loadMyOrders();
