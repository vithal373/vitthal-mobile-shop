/* =========================================================================
   VITTHAL MOBILE SHOP - ADMIN LOGIN JAVASCRIPT
   Firebase Auth Logic & Auto-Session Check
========================================================================= */

// -------------------------------------------------------------
// 1. FIREBASE CONFIGURATION
// (script.js मध्ये वापरलेलाच तोच Config येथे वापरा)
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDLM3nuNhKKcOqtI2uMgcaJNPMVrfIlN48",
  authDomain: "vitthal-mobile-shop.firebaseapp.com",
  projectId: "vitthal-mobile-shop",
  storageBucket: "vitthal-mobile-shop.firebasestorage.app",
  messagingSenderId: "751867746433",
  appId: "1:751867746433:web:8947a9df55877d2919d580"
};

// Initialize Firebase App
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// -------------------------------------------------------------
// 2. AUTO-SESSION CHECK (आधीच लॉगिन असल्यास थेट Dashboard वर पाठवा)
// -------------------------------------------------------------
auth.onAuthStateChanged((user) => {
  if (user) {
    window.location.href = "admin-dashboard.html";
  }
});

// -------------------------------------------------------------
// 3. PASSWORD SHOW / HIDE TOGGLE
// -------------------------------------------------------------
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("adminPassword");
  const eyeIcon = document.getElementById("toggleEyeIcon");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.classList.remove("fa-eye");
    eyeIcon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    eyeIcon.classList.remove("fa-eye-slash");
    eyeIcon.classList.add("fa-eye");
  }
}

// -------------------------------------------------------------
// 4. HANDLE ADMIN LOGIN
// -------------------------------------------------------------
async function handleAdminLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");
  const errorBox = document.getElementById("authErrorMsg");
  const errorText = document.getElementById("authErrorText");
  const submitBtn = document.getElementById("loginSubmitBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = submitBtn.querySelector(".btn-text");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  errorBox.style.display = "none";
  errorText.innerText = "";

  if (!email || !password) {
    showError("कृपया Email आणि Password दोन्ही भरा.");
    return;
  }

  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnSpinner.style.display = "inline-block";

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    console.error("Login Error:", error.code, error.message);
    
    let friendlyMessage = "लॉगिन अयशस्वी! कृपया पुन्हा प्रयत्न करा.";
    
    switch (error.code) {
      case "auth/invalid-email":
        friendlyMessage = "ईमेल पत्ता चुकीच्या फॉरमॅटमध्ये आहे.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        friendlyMessage = "चुकीचा Email किंवा Password टाकण्यात आला आहे.";
        break;
      case "auth/user-disabled":
        friendlyMessage = "हे ॲडमिन खाते निष्क्रिय (Disabled) केले गेले आहे.";
        break;
      case "auth/too-many-requests":
        friendlyMessage = "वारंवार चुकीचे प्रयत्न झाले आहेत. थोड्या वेळाने प्रयत्न करा.";
        break;
      case "auth/network-request-failed":
        friendlyMessage = "इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.";
        break;
      default:
        friendlyMessage = error.message || "चुकीचा Email किंवा Password";
    }

    showError(friendlyMessage);

    submitBtn.disabled = false;
    btnText.style.display = "inline-block";
    btnSpinner.style.display = "none";
  }
}

function showError(message) {
  const errorBox = document.getElementById("authErrorMsg");
  const errorText = document.getElementById("authErrorText");
  errorText.innerText = message;
  errorBox.style.display = "flex";
}
