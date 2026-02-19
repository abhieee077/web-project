'use strict';

const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
'https://script.google.com/macros/s/AKfycbzJA1VFEtU87BieWwk3isyYnusJr5lRKIy9fA1m6A8d4R7RCZpP_Nhnavx0_c5WxN1K7w/exec';

const form = document.getElementById("applicationForm");
const resumeInput = document.getElementById("resume");
const statusMsg = document.getElementById("statusMsg");
const dobInput = document.getElementById("dob");
const ageInput = document.getElementById("age");
const fileNameDisplay = document.getElementById("fileName");

// Convert DOB YYYY-MM-DD → DD/MM/YYYY
function formatDOB(dateStr) {
    const parts = dateStr.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
}

// Convert file → Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Auto age from DOB
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

// Show selected file name
resumeInput.addEventListener("change", function () {
    const file = resumeInput.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
    }
});

// Submit form
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

    const base64 = await fileToBase64(file);
    const dobFormatted = formatDOB(dobInput.value);

    const params = new URLSearchParams();
    params.append("name", document.getElementById("name").value);
    params.append("age", ageInput.value);
    params.append("email", document.getElementById("email").value);
    params.append("phone", document.getElementById("phone").value);
    params.append("address", document.getElementById("address").value);
    params.append("dob", dobFormatted);
    params.append("resumeName", file.name);
    params.append("resumeBase64", base64);

    await fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
    });

    statusMsg.textContent = "Application Submitted!";
    form.reset();
    fileNameDisplay.textContent = "";
    ageInput.value = "";
}

form.addEventListener("submit", handleSubmit);
