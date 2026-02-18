/**
 * HireFlow — Job Application Dashboard
 * Client-side form validation and Google Sheets submission via Apps Script.
 */

'use strict';

/* ===== Configuration ===== */
const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbx8dmg4EBXquhlma-DrkffDYJU0ZnS051enhKtQ5uQMXy3TrCypDc_HbIEpZKNptbbj/exec';

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

/**
 * Converts a File object to a base64-encoded string.
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} Base64-encoded file content.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result is "data:application/pdf;base64,XXXX…" — strip the prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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

    // --- Convert resume to base64 ---
    const resumeBase64 = await fileToBase64(file);

    // --- Submit via hidden form + iframe (bypasses CORS entirely) ---
    setLoading(true);

    try {
        await submitViaIframe({
            name,
            age,
            email,
            phone,
            dob: formatDOB(dob),
            address,
            resumeName: file.name,
            resumeBase64,
        });

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

/**
 * Submits data to Apps Script using a hidden form targeting a hidden iframe.
 * This method bypasses CORS because it's a regular form POST, not an XHR.
 * @param {Object} data - Key-value pairs to submit.
 * @returns {Promise<void>}
 */
function submitViaIframe(data) {
    return new Promise((resolve, reject) => {
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.name = 'hiddenFrame_' + Date.now();
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Create hidden form
        const hiddenForm = document.createElement('form');
        hiddenForm.method = 'POST';
        hiddenForm.action = GOOGLE_APPS_SCRIPT_WEB_APP_URL;
        hiddenForm.target = iframe.name;
        hiddenForm.style.display = 'none';

        // Add hidden inputs for each data field
        for (const [key, value] of Object.entries(data)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            hiddenForm.appendChild(input);
        }

        document.body.appendChild(hiddenForm);

        // Resolve after iframe loads (Apps Script processed the request)
        iframe.addEventListener('load', () => {
            // Clean up
            setTimeout(() => {
                document.body.removeChild(hiddenForm);
                document.body.removeChild(iframe);
            }, 500);
            resolve();
        });

        iframe.addEventListener('error', () => {
            document.body.removeChild(hiddenForm);
            document.body.removeChild(iframe);
            reject(new Error('Form submission failed'));
        });

        // Submit the form
        hiddenForm.submit();
    });
}

form.addEventListener('submit', handleSubmit);


