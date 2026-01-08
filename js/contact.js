document.getElementById("main-contact-form").addEventListener("submit", async e => {
  e.preventDefault();

  const form = e.target;

  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim()
  };

  try {
    const res = await fetch("http://localhost:3000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Send failed");
      return;
    }

    alert("Message sent successfully!");
    form.reset();

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});
