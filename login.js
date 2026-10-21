const form = document.getElementById("login-form");
const message = document.getElementById("login-message"); //gets the information about the login form

form.addEventListener("submit", async (event) => { //when the login button is clicked, we ask supabase to login with that email and password
    event.preventDefault(); //makes sure the form does not reload
    const email = document.getElementById("email").value.trim(); //prevents any spaces in the email
    const password = document.getElementById("password").value;
    const {error} = await sb.auth.signInWithPassword({email, password});
        if (error) {
            message.textContent = error.message;
            return;
        }
        if (await isStaff()){
            window.location.href = "gunter.html"; //if the email and password matches, it logins as Gunter
        } else {
            window.location.href = "home.html";
        }
});