
const form = document.getElementById("login-form");
const message = document.getElementById("login-message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
            message.textContent = error.message;
            return;
        }
        if (await isStaff()){
            window.location.href = "gunter.html";
        } else {
            window.location.href = "home.html";
        }
});