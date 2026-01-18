// ✅ FILENAME: src/static/game.js
let map;
let userMarker;
let lastKnownLocation = { lat: 49.2606, lng: -123.246 }; // Default UBC
let godModeEnabled = false;

function initMap() {
  const startLoc = { lat: 49.2606, lng: -123.246 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: startLoc,
    zoom: 15,
    mapId: "YOUR_MAP_ID",
    disableDefaultUI: true,
  });

  userMarker = new google.maps.Marker({
    position: startLoc,
    map: map,
    title: "You",
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: "#4285F4",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "white",
    },
  });

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        // Update local cache
        lastKnownLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        // Run the game logic
        checkGameRules();
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 1000 },
    );
  }

  loadCurrentRiddle();
  updatePassportUI();
}

async function loadCurrentRiddle() {
  try {
    const response = await fetch("/get-riddle");
    const data = await response.json();
    const box = document.getElementById("riddle-text");
    if (box) box.innerText = data.riddle;
  } catch (e) {
    console.error("Riddle error", e);
  }
}

// ✅ CENTRAL LOGIC (Replaces simple sendPosition)
async function checkGameRules() {
  // 1. Update Map Visuals
  if (userMarker) userMarker.setPosition(lastKnownLocation);
  // Optional: Auto-center map
  // if (map) map.setCenter(lastKnownLocation);

  try {
    // 2. Check Proximity with Backend
    const response = await fetch("/check-proximity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastKnownLocation),
    });
    const data = await response.json();

    // 3. Update Text UI
    const distEl = document.getElementById("distance");
    if (distEl) distEl.innerText = Math.round(data.distance_remaining) + " m";

    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.innerText = data.message;

    // 4. Update Button State (Distance OR God Mode)
    // The backend 'can_verify' already accounts for God Mode if the toggle endpoint was hit.
    // We also check local 'godModeEnabled' for instant UI feedback.
    const isAllowed = data.can_verify || godModeEnabled;
    updateCameraButton(isAllowed);
  } catch (error) {
    console.error("Game Loop Error:", error);
  }
}

// ✅ UI STATE MANAGER
function updateCameraButton(isAllowed) {
  const btn = document.getElementById("cam-btn");
  const btnText = document.getElementById("btn-text");

  if (!btn) return;

  if (isAllowed) {
    // --- UNLOCKED ---
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    btn.style.backgroundColor = "#10b981"; // Green
    btn.classList.add("animate-pulse"); // Visual cue

    if (btnText) btnText.innerText = "Snap Photo";
    btn.onclick = () => document.getElementById("camera-input").click();
  } else {
    // --- LOCKED ---
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
    btn.style.backgroundColor = "black";
    btn.classList.remove("animate-pulse");

    if (btnText) btnText.innerText = "Get Closer";
    btn.onclick = null;
  }
}

window.processImage = function () {
  const input = document.getElementById("camera-input");
  const file = input.files[0];
  if (!file) return;

  const btn = document.getElementById("cam-btn");
  if (btn) btn.innerText = "Verifying...";

  const reader = new FileReader();
  reader.onload = function (e) {
    verifyImageWithBackend(e.target.result);
  };
  reader.readAsDataURL(file);
};

async function verifyImageWithBackend(base64Image) {
  // Use cached location to prevent GPS delay
  try {
    const response = await fetch("/verify-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_b64: base64Image,
        lat: lastKnownLocation.lat,
        lon: lastKnownLocation.lng,
      }),
    });
    const result = await response.json();
    if (result.success) {
      alert("✅ SUCCESS: " + result.message);
      window.location.reload();
    } else {
      alert("❌ FAIL: " + result.message);
      window.location.reload();
    }
  } catch (e) {
    alert("Error verifying image.");
    window.location.reload();
  }
}

// --- HACKATHON TOOLS & GOD MODE ---

// ✅ Toggle God Mode Function
window.toggleGodMode = async function () {
  godModeEnabled = !godModeEnabled;

  try {
    const res = await fetch(`/toggle-god-mode?enable=${godModeEnabled}`, {
      method: "POST",
    });
    const data = await res.json();

    if (data.status === "success") {
      const statusMsg = godModeEnabled ? "⚡️ GOD MODE ON" : "🚫 God Mode OFF";
      alert(statusMsg);

      // ✅ CRITICAL: Re-check rules immediately!
      // This unlocks the button instantly without waiting for movement
      checkGameRules();
    }
  } catch (e) {
    alert("Failed to toggle God Mode.");
  }
};

window.addDemoStamp = async function (name, category) {
  await fetch("/collect-stamp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ poi_name: name, category: category }),
  });
  updatePassportUI();
};

window.resetDatabase = async function () {
  if (!confirm("Reset all stamps?")) return;
  await fetch("/reset-db", { method: "POST" });
  window.location.reload();
};

async function updatePassportUI() {
  try {
    const res = await fetch("/my-profile");
    const user = await res.json();
    const list = document.getElementById("passport-list");
    if (!list) return;
    list.innerHTML = "";

    if (!user.stamps || user.stamps.length === 0) {
      list.innerHTML = "<p class='text-gray-500 text-sm'>No stamps yet.</p>";
      return;
    }

    user.stamps.forEach((stamp) => {
      const item = document.createElement("div");
      item.className =
        "p-2 bg-gray-100 rounded mb-2 border flex justify-between";
      item.innerHTML = `
        <span class="font-bold">${stamp.name}</span> 
        <span class="text-xs text-blue-500 self-center uppercase">${stamp.category}</span>
      `;
      list.appendChild(item);
    });
  } catch (e) {}
}

window.initMap = initMap;
