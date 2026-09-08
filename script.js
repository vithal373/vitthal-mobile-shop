/* =========================================================================
   VITTHAL MOBILE SHOP - MAIN JAVASCRIPT
   Firebase Firestore & Store Logic
========================================================================= */

// -------------------------------------------------------------
// 1. FIREBASE CONFIGURATION
// (येथे तुमचे स्वतःचे Firebase Project चे credentials पेस्ट करा)
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Global Store State
let db = null;
let allMobiles = [];
let currentFilter = 'all';

// Initialize Firebase with fallback guard
try {
  if (firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase Firestore Initialized Successfully!");
  } else {
    console.warn("Firebase config not replaced yet. Showing demo sample stock.");
  }
} catch (error) {
  console.error("Firebase Init Error:", error);
}

// -------------------------------------------------------------
// 2. DEMO / SAMPLE DATA (जर Firestore रिकामे असेल किंवा config बाकी असेल तर)
// -------------------------------------------------------------
const sampleMobiles = [
  {
    id: "sample-1",
    name: "Apple iPhone 13 (128GB)",
    brand: "Apple",
    price: 36999,
    condition: "9.5/10 (Super Clean)",
    specs: "RAM: 4GB | Storage: 128GB\nBattery Health: 87%\nDisplay: 6.1\" Super Retina XDR\nColor: Midnight Black | With Box & Bill",
    photos: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "sample-2",
    name: "Samsung Galaxy S22 5G (8/128)",
    brand: "Samsung",
    price: 26500,
    condition: "9/10 (Minor Scratch)",
    specs: "RAM: 8GB | Storage: 128GB\nProcessor: Snapdragon 8 Gen 1\nDisplay: 120Hz Dynamic AMOLED\nColor: Phantom Green | All Original Parts",
    photos: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "sample-3",
    name: "Vivo V29 5G (8/128)",
    brand: "Vivo",
    price: 18499,
    condition: "Mint Condition",
    specs: "RAM: 8GB + 8GB Extended | Storage: 128GB\nCamera: 50MP OIS Aura Light\nBattery: 4600mAh (80W Fast Charge)\nColor: Himalayan Blue",
    photos: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"
    ]
  },
  {
    id: "sample-4",
    name: "OnePlus 10R 5G (8/128)",
    brand: "OnePlus",
    price: 16999,
    condition: "8.5/10",
    specs: "RAM: 8GB | Storage: 128GB\nCharging: 80W SuperVOOC Fast Charger Included\nDisplay: 120Hz Fluid AMOLED\nColor: Sierra Black",
    photos: [
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80"
    ]
  }
];

// -------------------------------------------------------------
// 3. TAB SWITCHING (Home <-> Second Hand Store)
// -------------------------------------------------------------
function switchTab(tabName) {
  const homeSection = document.getElementById('section-home');
  const storeSection = document.getElementById('section-store');
  const tabHomeBtn = document.getElementById('tab-home');
  const tabStoreBtn = document.getElementById('tab-store');

  if (tabName === 'home') {
    homeSection.classList.add('active');
    storeSection.classList.remove('active');
    tabHomeBtn.classList.add('active');
    tabStoreBtn.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (tabName === 'store') {
    storeSection.classList.add('active');
    homeSection.classList.remove('active');
    tabStoreBtn.classList.add('active');
    tabHomeBtn.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// -------------------------------------------------------------
// 4. FETCH MOBILES FROM FIRESTORE
// -------------------------------------------------------------
async function fetchMobiles() {
  const grid = document.getElementById('mobiles-grid');

  if (!db) {
    allMobiles = sampleMobiles;
    renderMobiles(allMobiles);
    return;
  }

  try {
    const snapshot = await db.collection('mobiles').get();
    
    if (snapshot.empty) {
      allMobiles = sampleMobiles;
    } else {
      allMobiles = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        allMobiles.push({
          id: doc.id,
          name: data.name || 'Mobile Phone',
          brand: data.brand || 'Other',
          price: data.price || 0,
          condition: data.condition || 'Good',
          specs: data.specs || 'No specs provided',
          photos: (Array.isArray(data.photos) && data.photos.length > 0) 
            ? data.photos 
            : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80']
        });
      });
    }

    renderMobiles(allMobiles);
  } catch (error) {
    console.error("Error fetching mobiles:", error);
    allMobiles = sampleMobiles;
    renderMobiles(allMobiles);
  }
}

// -------------------------------------------------------------
// 5. RENDER MOBILES GRID
// -------------------------------------------------------------
function renderMobiles(mobilesList) {
  const grid = document.getElementById('mobiles-grid');
  const emptyMsg = document.getElementById('no-mobiles-msg');

  if (mobilesList.length === 0) {
    grid.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  grid.innerHTML = mobilesList.map(mobile => {
    const mainImg = mobile.photos && mobile.photos.length > 0 
      ? mobile.photos[0] 
      : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80';

    const formattedPrice = Number(mobile.price).toLocaleString('en-IN');

    return `
      <div class="mobile-card" onclick="openDetailModal('${mobile.id}')">
        <div class="card-img-wrap">
          <img src="${mainImg}" alt="${mobile.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'">
          <span class="card-condition-badge"><i class="fa-solid fa-circle-check"></i> ${mobile.condition}</span>
        </div>
        
        <div class="card-body">
          <span class="card-brand">${mobile.brand}</span>
          <h3 class="card-name" title="${mobile.name}">${mobile.name}</h3>
          <p class="card-specs-brief">${mobile.specs.replace(/\n/g, ' • ')}</p>
          
          <div class="card-footer">
            <div class="card-price"><span>₹</span>${formattedPrice}</div>
            <span class="card-btn">माहिती पहा <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 6. FILTER & SEARCH LOGIC
// -------------------------------------------------------------
function setBrandFilter(brand) {
  currentFilter = brand;

  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  applyFilters();
}

function filterMobiles() {
  applyFilters();
}

function applyFilters() {
  const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();

  const filtered = allMobiles.filter(item => {
    const matchesBrand = (currentFilter === 'all') || (item.brand.toLowerCase() === currentFilter.toLowerCase());
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) ||
                          item.brand.toLowerCase().includes(searchQuery) ||
                          item.specs.toLowerCase().includes(searchQuery);
    return matchesBrand && matchesSearch;
  });

  renderMobiles(filtered);
}

// -------------------------------------------------------------
// 7. DETAIL MODAL & WHATSAPP INQUIRY
// -------------------------------------------------------------
function openDetailModal(mobileId) {
  const mobile = allMobiles.find(m => m.id === mobileId);
  if (!mobile) return;

  const modal = document.getElementById('detail-modal');
  const detailContent = document.getElementById('detail-content');

  const mainPhoto = mobile.photos && mobile.photos.length > 0 
    ? mobile.photos[0] 
    : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80';

  const thumbnailsHtml = mobile.photos && mobile.photos.length > 1
    ? mobile.photos.map((url, idx) => `
        <img src="${url}" class="thumb-img ${idx === 0 ? 'active' : ''}" onclick="setMainModalImage('${url}', this)" alt="thumb">
      `).join('')
    : '';

  const encodedMsg = encodeURIComponent(`नमस्कार, मला ${mobile.name} (किंमत: ₹${Number(mobile.price).toLocaleString('en-IN')}) बद्दल माहिती हवी आहे.`);
  const waLink = `https://wa.me/919766504949?text=${encodedMsg}`;

  detailContent.innerHTML = `
    <div class="gallery-wrapper">
      <div class="main-image-box">
        <img id="modalMainImg" src="${mainPhoto}" alt="${mobile.name}">
      </div>
      ${thumbnailsHtml ? `<div class="thumbs-strip">${thumbnailsHtml}</div>` : ''}
    </div>

    <div class="detail-info">
      <span class="detail-brand-badge">${mobile.brand}</span>
      <h2 class="detail-name">${mobile.name}</h2>
      
      <div class="detail-price-box">
        <div class="detail-price">₹${Number(mobile.price).toLocaleString('en-IN')}</div>
        <div class="detail-condition"><i class="fa-solid fa-check-double"></i> ${mobile.condition}</div>
      </div>

      <div class="detail-specs-box">
        <h5><i class="fa-solid fa-microchip"></i> मोबाईल स्पेसिफिकेशन्स (Specs):</h5>
        <p>${mobile.specs}</p>
      </div>

      <a href="${waLink}" target="_blank" class="btn btn-whatsapp-inquiry">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp वर Inquiry करा
      </a>
    </div>
  `;

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function setMainModalImage(url, element) {
  document.getElementById('modalMainImg').src = url;
  document.querySelectorAll('.thumb-img').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetailModal();
});

// -------------------------------------------------------------
// 8. ON PAGE LOAD
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  fetchMobiles();
});
