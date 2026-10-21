Wrote the decription of home page and product page with ai (change soon) with claude llm
found the right outer curve border radius with claude llm
Found the swords and images with ai; however, they are real swords.
Image link: https://www.reddit.com/r/medieval/comments/1hqin8q/i_draw_a_lot_of_knights_some_more_realistic_than/
Used AI help for getting the midevil font
AI helped me get a font I liked
Helped me with the padding and gap of mainpart





Backend - I used ai for a majority of the backend, but with it I learned a lot about javascript and sql. Prior to this, I had little to no experience with these programming languages, so ai helped me figure out how to code in these languages. I have a deep understanding of every function that we created and can explain them thouroughly.

I wrote all of the tables in supabase, but ai generated example details about each item.

---

# Gunter Ecom

## Project Overview

Gunter Ecom is an online shop for Gunter's handmade medieval armor and weapons, plus a private to-do list where Gunter tracks the orders he has to forge.

- Customers browse three product lines (Nuremberg, Greenwich and Milan), filter and sort them, add items to a cart and place an order with their name and optional notes.
- Gunter logs in, sees every open order appear live, and moves each one through three stages: **Queued → Forging → Ready**.
- Customers check the stage of their orders on the **My Orders** page.

**Tech stack**

| Layer | What it uses |
| --- | --- |
| Pages | Plain HTML and one shared `styles.css` |
| Front-end code | Plain JavaScript, one file per page type |
| Database | Supabase (Postgres): `products`, `orders`, `staff` tables |
| Logins | Supabase Auth: anonymous guest logins for shoppers, email and password for Gunter |
| Live updates | Supabase Realtime on the `orders` table |
| Cart | The browser's `localStorage` |

**Files**

| File | What it does |
| --- | --- |
| `home.html` | Landing page |
| `Nuremberg.html`, `GreenwichLine.html`, `MilanLine.html` | Product line pages with filter, sort and product grid |
| `product.html` | One product, with Add to cart |
| `cart.html` | Cart and checkout |
| `orders.html` | My Orders: the customer's orders and their stage |
| `login.html` | Login for Gunter |
| `gunter.html` | Gunter's to-do list |
| `supabase.js` | Database connection, guest sign-in, staff check, cart helpers |
| `shop.js` | Line pages and product page |
| `cart.js` | Cart page and placing orders |
| `orders.js` | My Orders page |
| `login.js` | Login form |
| `gunter.js` | Gunter's to-do list: orders, stage changes, live feed, log out |

## Setup Instructions

1. **Clone the repository.**
   ```
   git clone https://github.com/ath67-byte/GunterEcom.git
   cd GunterEcom
   ```
2. **Run it with a local web server.** There is nothing to install or build. Pick one:
   - VS Code: install the **Live Server** extension, right-click `home.html` and choose **Open with Live Server**.
   - Python: run `python -m http.server 8000`, then open `http://localhost:8000/home.html`.
3. **Supabase is already connected.** The project URL and publishable key are in `supabase.js`. To use your own Supabase project instead:
   - Replace `SUPABASE_URL` and `SUPABASE_KEY` in `supabase.js`.
   - Create the `products`, `orders` and `staff` tables and the `is_staff()` function.
   - Turn on **Anonymous sign-ins** under Authentication.
   - Add row-level security rules: anyone can read products, customers can insert and read their own orders, and staff can read and update all orders.
   - Add the `orders` table to the `supabase_realtime` publication so Gunter's page updates live.
4. **Make a staff account.** Create a user with an email and password in Supabase Authentication, then add that user's id to the `staff` table.

## Usage Guide

**Shopping (customers)**

1. Open a product line from the menu: Nuremberg, Greenwich or Milan.
2. Click **Show Filter** to filter by type, price range, material and availability. Use the dropdown to sort by A–Z, Z–A or price.
3. Click a product to open its page, then click **Add to cart**.
4. Open the cart from the cart icon. Use **+**, **−** and **Remove** to change it.
5. Enter your name and any notes for Gunter (engraving, sizing and so on), then click **PLACE ORDER**.
6. Click **Check your order status**, or open **My Orders** from the menu, to see each order's stage.

Your orders are linked to this browser. Use the same browser to check on them later.

**Forging (Gunter)**

1. Go to **Log In** and sign in with the staff email and password. You'll be taken to **Gunter's To-Do List**.
2. Every queued and forging order shows as a card: product, quantity, customer name, order time and notes.
3. Change an order's **Stage** dropdown to **Forging** or **Ready**. The change saves right away, and Ready orders leave the list.
4. New orders appear on their own, with no refresh needed.
5. Click **Log out** when you're done.

## Feature List

- Three product lines, each with its own page and banner
- Product grid loaded from the database
- Filters for type, price range, material and availability, which can be combined
- Sorting by Trending, A–Z, Z–A, price low to high and price high to low
- Product page with image, price ("Price coming soon" when there's no price) and description
- Cart saved in the browser, with quantity buttons, remove, line totals and a subtotal
- Checkout with just a name and optional notes, with no account needed
- Shoppers signed in automatically as anonymous guests
- My Orders page showing each order's product, quantity, stage and notes
- Staff-only login that sends Gunter to his to-do list
- Gunter's to-do list with live updates, stage dropdowns and log out
- Database security rules: customers only see their own orders, and only staff can change them
- Customer text escaped on Gunter's page so it can't run as code
- Slide-out side menu and navbar on every page

## Team Contributions

Based on the project's commit history.

**Aman Henok**
- Started the project and built the home page sections (examples, "People who trust" section), fonts and hover effects
- Navbar, menu button on every page and the slide-out side nav
- Cart page layout
- Nuremberg, Milan and Greenwich line pages, their products and line images
- Product image sizing and UI cleanup of the line pages
- Login page redesign and colors, and removing the sign-up page
- Code review comments on coding style

**Lucas Zhao**
- Supabase backend: database connection, guest sign-in, staff check and login (`supabase.js`, `login.js`)
- Login and sign-up screens and their styling
- Cart logic and checkout (`cart.js`)
- Product line template, filter bar and sort button (`shop.js`)
- Gunter's to-do list (`gunter.html`, `gunter.js`)
- My Orders page (`orders.html`, `orders.js`)
