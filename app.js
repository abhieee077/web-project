/**
 * HireFlow — Job Application Dashboard
 * Client-side form validation and Google Sheets submission via Apps Script.
 */

'use strict';

/* ===== Configuration ===== */
const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbxrq5TcZsf5C8BWxSrcQKVhI5TEMuKT7azu3Nzqg2uyiOC3nS9Ymq5gQtPQzXuxKKzdow/exec';

/** Maximum resume file size in bytes (500 KB). */
const MAX_RESUME_SIZE = 500 * 1024;

/** Allowed MIME type for resume. */
const ALLOWED_RESUME_TYPE = 'application/pdf';

/* ===== DOM References ===== */
const form = document.getElementById('applicationForm');
const resumeInput = document.getElementById('resume');
const fileNameDisplay = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const statusMsg = document.getElementById('statusMsg');
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');

/* ===== Validation Helpers ===== */

/**
 * Validates a 10-digit phone number.
 * @param {string} phone - The phone number string.
 * @returns {boolean} True if valid.
 */
function validatePhone(phone) {
    return /^\d{10}$/.test(phone.trim());
}

/**
 * Validates a basic email format.
 * @param {string} email - The email string.
 * @returns {boolean} True if valid.
 */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates resume file type and size.
 * @param {File} file - The selected file.
 * @returns {{ valid: boolean, message: string }}
 */
function validateResume(file) {
    if (!file) {
        return { valid: false, message: 'Please upload your resume.' };
    }
    if (file.type !== ALLOWED_RESUME_TYPE) {
        return { valid: false, message: 'Only PDF files are allowed.' };
    }
    if (file.size > MAX_RESUME_SIZE) {
        return { valid: false, message: 'File size must be under 500 KB.' };
    }
    return { valid: true, message: '' };
}

/**
 * Converts a date string from YYYY-MM-DD to DD/MM/YYYY.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {string} Date in DD/MM/YYYY format.
 */
function formatDOB(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Calculates age from a date of birth string.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {number} The calculated age in years.
 */
function calculateAge(dateStr) {
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

/* ===== UI Helpers ===== */

/**
 * Shows an inline error message for a field.
 * @param {string} fieldId - The input element ID.
 * @param {string} message - Error message to display.
 */
function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}Error`);
    if (input) {
        input.classList.add('input-error');
    }
    if (errorSpan) {
        errorSpan.textContent = message;
    }
}

/**
 * Clears all inline error messages and input error styles.
 */
function clearErrors() {
    document.querySelectorAll('.error-msg').forEach((el) => {
        el.textContent = '';
    });
    document.querySelectorAll('.input-error').forEach((el) => {
        el.classList.remove('input-error');
    });
    statusMsg.textContent = '';
    statusMsg.className = 'status-msg';
}

/**
 * Sets the submit button loading state.
 * @param {boolean} loading - Whether the button should show a spinner.
 */
function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.textContent = loading ? 'Submitting…' : 'Submit Application';
    btnSpinner.classList.toggle('hidden', !loading);
}

/* ===== DOB → Age Auto-Calculation ===== */
dobInput.addEventListener('change', () => {
    const dobValue = dobInput.value;
    if (dobValue) {
        const age = calculateAge(dobValue);
        ageInput.value = age >= 0 ? age : '';
    } else {
        ageInput.value = '';
    }
});

/* ===== File Input Display ===== */
resumeInput.addEventListener('change', () => {
    const file = resumeInput.files[0];
    if (file) {
        fileNameDisplay.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    } else {
        fileNameDisplay.textContent = '';
    }
});

/* ===== Form Submission ===== */

/**
 * Handles form submission: validates, formats, and sends data to Apps Script.
 * @param {SubmitEvent} e - The submit event.
 */
async function handleSubmit(e) {
    e.preventDefault();
    clearErrors();

    let hasError = false;

    // --- Collect values ---
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const dob = document.getElementById('dob').value;
    const address = document.getElementById('address').value.trim();
    const file = resumeInput.files[0];

    // --- Validate ---
    if (!name) {
        showError('name', 'Name is required.');
        hasError = true;
    }

    if (!dob) {
        showError('dob', 'Date of birth is required.');
        hasError = true;
    } else if (!age || Number(age) < 0) {
        showError('dob', 'Please select a valid date of birth.');
        hasError = true;
    }

    if (!validateEmail(email)) {
        showError('email', 'Enter a valid email address.');
        hasError = true;
    }

    if (!validatePhone(phone)) {
        showError('phone', 'Enter a valid 10-digit phone number.');
        hasError = true;
    }



    if (!address) {
        showError('address', 'Address is required.');
        hasError = true;
    }

    const resumeCheck = validateResume(file);
    if (!resumeCheck.valid) {
        showError('resume', resumeCheck.message);
        hasError = true;
    }

    if (hasError) {
        return;
    }

    // --- Build FormData ---
    const formData = new FormData();
    formData.append('name', name);
    formData.append('age', age);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('dob', formatDOB(dob));
    formData.append('address', address);
    formData.append('resume', file);

    // --- Submit ---
    setLoading(true);

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors',
        });

        // Apps Script returns an opaque response due to redirects.
        // A successful POST will not throw, so we treat it as success.
        statusMsg.textContent = '✅ Application submitted successfully!';
        statusMsg.classList.add('status-msg--success');
        form.reset();
        ageInput.value = '';
        fileNameDisplay.textContent = '';
    } catch (error) {
        console.error('Submission error:', error);
        statusMsg.textContent = '❌ Submission failed. Please try again later.';
        statusMsg.classList.add('status-msg--error');
    } finally {
        setLoading(false);
    }
}

form.addEventListener('submit', handleSubmit);
