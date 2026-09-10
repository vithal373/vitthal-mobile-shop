/* =========================================================================
   VITTHAL MOBILE SHOP - ADMIN DASHBOARD JAVASCRIPT
   Auth Guard, Cloudinary Unsigned Upload & Firestore CRUD
========================================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDLM3nuNhKKcOqtI2uMgcaJNPMVrfIlN48",
  authDomain: "vitthal-mobile-shop.firebaseapp.com",
  projectId: "vitthal-mobile-shop",
  storageBucket: "vitthal-mobile-shop.firebasestorage.app",
  messagingSenderId: "751867746433",
  appId: "1:751867746433:web:8947a9df55877d2919d580"
};
const CLOUDINARY_CLOUD_NAME = "cwlgj1kn";
const CLOUDINARY_UPLOAD_PRESET = "vitthal_unsigned";

let auth, db;
let dashMobilesList = [];
let selectedFiles = [];
let mobileToDeleteId = null;

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
auth = firebase.auth();
db = firebase.firestore();

auth.onAuthStateChanged((user) => {
  const guardLoader = document.getElementById("authGuardLoader");
  const mainContent = document.getElementById("dashMainContent");

  if (!user) {
    window.location.href = "admin-login.html";
  } else {
    guardLoader.style.display = "none";
    mainContent.style.display = "block";
    loadDashboardMobiles();
  }
});

async function handleAdminLogout() {
  try {
    await auth.signOut();
    window.location.href = "admin-login.html";
  } catch (error) {
    console.error("Logout Error:", error);
    alert("Logout करताना समस्या आली!");
  }
}

async function loadDashboardMobiles() {
  const loader = document.getElementById("dashLoader");
  const tableWrapper = document.getElementById("tableWrapper");
  const emptyState = document.getElementById("dashEmptyState");

  loader.style.display = "block";
  tableWrapper.style.display = "none";
  emptyState.style.display = "none";

  try {
    const snapshot = await db.collection("mobiles").orderBy("createdAt", "desc").get().catch(async () => {
      return await db.collection("mobiles").get();
    });

    dashMobilesList = [];
    let totalStockPrice = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const mobileObj = {
        id: doc.id,
        name: data.name || "Unnamed",
        brand: data.brand || "Other",
        price: Number(data.price) || 0,
        condition: data.condition || "Good",
        specs: data.specs || "",
        photos: Array.isArray(data.photos) ? data.photos : []
      };
      dashMobilesList.push(mobileObj);
      totalStockPrice += mobileObj.price;
    });

    document.getElementById("totalMobilesCount").innerText = dashMobilesList.length;
    document.getElementById("totalStockValue").innerText = "₹" + totalStockPrice.toLocaleString("en-IN");

    loader.style.display = "none";
    renderDashboardTable(dashMobilesList);

  } catch (error) {
    console.error("Fetch Mobiles Error:", error);
    loader.style.display = "none";
    showToast("डेटा लोड करताना एरर आला!", "error");
  }
}

function renderDashboardTable(list) {
  const tbody = document.getElementById("dashMobilesTbody");
  const tableWrapper = document.getElementById("tableWrapper");
  const emptyState = document.getElementById("dashEmptyState");

  if (list.length === 0) {
    tableWrapper.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  tableWrapper.style.display = "block";

  tbody.innerHTML = list.map((item) => {
    const thumb = item.photos.length > 0
      ? item.photos[0]
      : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=80";

    const formattedPrice = "₹" + Number(item.price).toLocaleString("en-IN");

    return `
      <tr>
        <td>
          <img src="${thumb}" class="dash-thumb-img" alt="${item.name}">
        </td>
        <td>
          <div class="dash-item-name">${item.name}</div>
          <small class="dash-item-specs-sub">${item.specs ? item.specs.substring(0, 45) + '...' : ''}</small>
        </td>
        <td><span class="badge-brand">${item.brand}</span></td>
        <td><strong class="dash-item-price">${formattedPrice}</strong></td>
        <td><span class="badge-condition">${item.condition}</span></td>
        <td>
          <button class="btn-dash-delete" onclick="promptDeleteModal('${item.id}', '${item.name.replace(/'/g, "\\'")}')" title="Delete Mobile">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function filterDashMobiles() {
  const query = document.getElementById("dashSearchInput").value.toLowerCase().trim();
  const filtered = dashMobilesList.filter((m) =>
    m.name.toLowerCase().includes(query) ||
    m.brand.toLowerCase().includes(query) ||
    m.condition.toLowerCase().includes(query)
  );
  renderDashboardTable(filtered);
}

function handlePhotoSelection(event) {
  const files = Array.from(event.target.files);
  const previewContainer = document.getElementById("imagePreviewContainer");
  previewContainer.innerHTML = "";

  if (files.length > 5) {
    alert("कृपया जास्तीत जास्त 5 फोटो निवडा!");
    event.target.value = "";
    selectedFiles = [];
    return;
  }

  selectedFiles = files;

  selectedFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "preview-thumbnail";
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

async function handleSaveMobile(event) {
  event.preventDefault();

  const name = document.getElementById("mobName").value.trim();
  const brand = document.getElementById("mobBrand").value;
  const price = parseFloat(document.getElementById("mobPrice").value);
  const condition = document.getElementById("mobCondition").value.trim();
  const specs = document.getElementById("mobSpecs").value.trim();

  const errorBox = document.getElementById("modalErrorBox");
  const errorText = document.getElementById("modalErrorText");
  const saveBtn = document.getElementById("saveMobileBtn");
  const saveSpinner = document.getElementById("saveSpinner");
  const progressText = document.getElementById("uploadProgressText");
  const btnText = saveBtn.querySelector(".btn-text");

  errorBox.style.display = "none";

  if (!name || !brand || isNaN(price) || !condition || !specs) {
    errorText.innerText = "कृपया सर्व आवश्यक माहिती भरा.";
    errorBox.style.display = "flex";
    return;
  }

  if (selectedFiles.length === 0) {
    errorText.innerText = "कृपया मोबाईलचा किमान 1 फोटो निवडा.";
    errorBox.style.display = "flex";
    return;
  }

  saveBtn.disabled = true;
  btnText.style.display = "none";
  saveSpinner.style.display = "inline-block";
  progressText.style.display = "inline-block";
  progressText.innerText = `फोटो अपलोड होत आहेत (0/${selectedFiles.length})...`;

  try {
    const uploadedPhotoUrls = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      progressText.innerText = `फोटो अपलोड होत आहेत (${i + 1}/${selectedFiles.length})...`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Cloudinary Photo Upload अयशस्वी! कृपया Upload Preset किंवा Cloud Name तपासा.");
      }

      const uploadData = await res.json();
      uploadedPhotoUrls.push(uploadData.secure_url);
    }

    progressText.innerText = "Firestore मध्ये सेव्ह करत आहे...";

    await db.collection("mobiles").add({
      name: name,
      brand: brand,
      price: price,
      condition: condition,
      specs: specs,
      photos: uploadedPhotoUrls,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast("नवीन मोबाईल यशस्वीरीत्या ॲड झाला!", "success");
    closeAddMobileModal();
    loadDashboardMobiles();

  } catch (err) {
    console.error("Save Mobile Error:", err);
    errorText.innerText = err.message || "मोबाईल सेव्ह करताना एरर आला.";
    errorBox.style.display = "flex";
  } finally {
    saveBtn.disabled = false;
    btnText.style.display = "inline-block";
    saveSpinner.style.display = "none";
    progressText.style.display = "none";
  }
}

function promptDeleteModal(id, name) {
  mobileToDeleteId = id;
  document.getElementById("deleteTargetName").innerText = `तुम्हाला खात्री आहे का "${name}" हा मोबाईल कायमचा डिलीट करायचा?`;
  document.getElementById("deleteModal").classList.add("show");
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("show");
  mobileToDeleteId = null;
}

async function executeDeleteMobile() {
  if (!mobileToDeleteId) return;

  const deleteBtn = document.getElementById("confirmDeleteBtn");
  const spinner = document.getElementById("deleteSpinner");
  const btnText = deleteBtn.querySelector(".btn-text");

  deleteBtn.disabled = true;
  btnText.style.display = "none";
  spinner.style.display = "inline-block";

  try {
    await db.collection("mobiles").doc(mobileToDeleteId).delete();
    
    closeDeleteModal();
    showToast("मोबाईल यशस्वीरीत्या डिलीट करण्यात आला!", "success");
    loadDashboardMobiles();

  } catch (error) {
    console.error("Delete Error:", error);
    alert("मोबाईल डिलीट करताना एरर आला!");
  } finally {
    deleteBtn.disabled = false;
    btnText.style.display = "inline-block";
    spinner.style.display = "none";
  }
}

function openAddMobileModal() {
  document.getElementById("addMobileForm").reset();
  document.getElementById("imagePreviewContainer").innerHTML = "";
  document.getElementById("modalErrorBox").style.display = "none";
  selectedFiles = [];
  document.getElementById("addMobileModal").classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeAddMobileModal() {
  document.getElementById("addMobileModal").classList.remove("show");
  document.body.style.overflow = "auto";
}

function showToast(msg, type = "success") {
  const toast = document.getElementById("toastAlert");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");

  toastMsg.innerText = msg;
  if (type === "error") {
    toast.style.background = "#ff4757";
    toastIcon.className = "fa-solid fa-triangle-exclamation";
  } else {
    toast.style.background = "#2ed573";
    toastIcon.className = "fa-solid fa-circle-check";
  }

  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}
