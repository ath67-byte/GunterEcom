const SUPABASE_URL = "https://yfdfgvucqypxduqvplrf.supabase.co";
const SUPABASE_KEY = "sb_publishable_J5KWC7EHeN2G2x6-0vGYVw_ayOGeKY0";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getUser(){
    const {data} = await sb.auth.getSession();
    if (data.session) return data.session.user;

    const {data: signIn, error} = await sb.auth.signInAnonymously();
    if(error) throw error;
    return signIn.user;
}
async function isStaff(){
    const {data} = await sb.rpc('is_staff');
    return !!data;
}
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}
