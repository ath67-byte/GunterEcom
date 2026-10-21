const SUPABASE_URL = "https://yfdfgvucqypxduqvplrf.supabase.co";
const SUPABASE_KEY = "sb_publishable_J5KWC7EHeN2G2x6-0vGYVw_ayOGeKY0"; 

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);// stores supabase keys so we can access the database

async function getUser(){ //checks if a user already has a id assigned and if not assigns a new one
    const {data} = await sb.auth.getSession();
    if (data.session) return data.session.user;

    const {data: signIn, error} = await sb.auth.signInAnonymously();
    if(error) throw error;
    return signIn.user;
}
async function isStaff(){ //calls the isStaff function from supabase to check if the current user id matches the one of gunter
    const {data} = await sb.rpc('is_staff');
    return !!data;
}
function getCart() { // returns the info about the cart in json
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) { // saves the json information as cart
  localStorage.setItem("cart", JSON.stringify(cart));
}
