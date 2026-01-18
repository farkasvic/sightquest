// ✅ FILENAME: src/static/game.js
let map;
let userMarker;

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
    navigator.geolocation.watchPosition(sendPosition, console.error, {
      enableHighAccuracy: true,
      maximumAge: 1000,
    });
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

async function sendPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const pos = { lat, lon };
  if (userMarker) userMarker.setPosition(pos);
  if (map) map.setCenter(pos);

  try {
    const response = await fetch("/check-proximity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: lat, lon: lon }),
    });
    const data = await response.json();

    document.getElementById("distance").innerText =
      Math.round(data.distance_remaining) + " m";
    document.getElementById("status").innerText = data.message;

    const btn = document.getElementById("cam-btn");
    const btnText = document.getElementById("btn-text");

    if (btn) {
      if (data.can_verify) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.style.backgroundColor = "#10b981";
        if (btnText) btnText.innerText = "📸 Snap Photo";
        btn.onclick = () => document.getElementById("camera-input").click();
      } else {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
        btn.style.backgroundColor = "black";
        if (btnText) btnText.innerText = "Get Closer";
        btn.onclick = null;
      }
    }
  } catch (error) {
    console.error("GPS Error:", error);
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
  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      const response = await fetch("/verify-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_b64: base64Image,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
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
  });
}

// --- HACKATHON TOOLS ---
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
    user.stamps.forEach((stamp) => {
      const item = document.createElement("div");
      item.className = "p-2 bg-gray-100 rounded mb-2 border";
      item.innerHTML = `<strong>${stamp.name}</strong> <span class="text-xs text-gray-500">${stamp.category}</span>`;
      list.appendChild(item);
    });
  } catch (e) {}
}

window.initMap = initMap;
