'use strict';

const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
'https://script.google.com/macros/s/AKfycbzJA1VFEtU87BieWwk3isyYnusJr5lRKIy9fA1m6A8d4R7RCZpP_Nhnavx0_c5WxN1K7w/exec';

const form = document.getElementById("applicationForm");
const resumeInput = document.getElementById("resume");
const statusMsg = document.getElementById("statusMsg");
const dobInput = document.getElementById("dob");
const ageInput = document.getElementById("age");
const fileNameDisplay = document.getElementById("fileName");

// Auto age
dobInput.addEventListener("change", function () {
    const dob = dobInput.value;
    if (!dob) return;

    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    ageInput.value = age;
});

// Show file name
resumeInput.addEventListener("change", function () {
    const file = resumeInput.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
    }
});

// Convert date
function formatDOB(dateStr) {
    const parts = dateStr.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
}

// Submit
async function handleSubmit(e) {
    e.preventDefault();

    const file = resumeInput.files[0];

    if (!file) {
        alert("Upload resume");
        return;
    }

    if (file.type !== "application/pdf") {
        alert("Only PDF allowed");
        return;
    }

    if (file.size > 500000) {
        alert("Max size 500KB");
        return;
    }

    const dobFormatted = formatDOB(dobInput.value);

    const data = new FormData();
    data.append("name", document.getElementById("name").value);
    data.append("age", ageInput.value);
    data.append("email", document.getElementById("email").value);
    data.append("phone", document.getElementById("phone").value);
    data.append("address", document.getElementById("address").value);
    data.append("dob", dobFormatted);
    data.append("resumeName", file.name);

    await fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: data
    });

    statusMsg.textContent = "Application Submitted!";
    form.reset();
    fileNameDisplay.textContent = "";
    ageInput.value = "";
}

form.addEventListener("submit", handleSubmit);
