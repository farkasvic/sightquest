let gameLandmarks = []; // stores the 4 randomly picked landmarks

// 1. Get GPS from Browser
function updateLocation() {
  if (!navigator.geolocation) {
    document.getElementById("status").innerText = "GPS not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(sendPosition, showError, {
    enableHighAccuracy: true,
  });
}

let map;
let userMarker;
let originLocation = null; // store the user’s starting point
let originMarker;

const CATEGORY_MAP = {
  Park: {
    label: "🏞️ Park",
    types: ["tourist_attraction", "park", "natural_feature"],
  },
  History: {
    label: "🏛️ History",
    types: ["tourist_attraction", "museum", "church"],
  },
  Food: {
    label: "🍔 Food",
    types: ["restaurant", "cafe", "bakery"],
  },
};

function initMap(lat, lng) {
  if (!map) {
    // First time → create map and marker
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat, lng },
      zoom: 15,
    });

    userMarker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: "You are here",
    });
  } else {
    // Later → move marker and pan map
    userMarker.setPosition({ lat, lng });
    map.panTo({ lat, lng });
  }
}

function getSelectedCategory() {
  return document.getElementById("category").value;
}

// 2. Send GPS to Python Backend
async function sendPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  // ✅ Store origin if not set yet
  if (!originLocation) {
    originLocation = { lat, lon };
    console.log("Origin location set:", originLocation);

    initMap(lat, lon);

    originMarker = new google.maps.Marker({
      position: originLocation,
      map: map,
      title: "Origin",
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    });

    await getRandomLandmarks(originLocation.lat, originLocation.lon, 2000, 4);
  }

  // Update map marker
  initMap(lat, lon);

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
    btn.classList.toggle("active", data.can_verify);
    btn.disabled = !data.can_verify;
  } catch (error) {
    console.error("Error talking to Python:", error);
  }
}

function showError(error) {
  document.getElementById("status").innerText = "GPS Error: " + error.message;
}

// GOD MODE FUNCTION
async function toggleGodMode() {
  try {
    // Toggles on/off (you can adjust the logic if you want strict On/Off)
    const response = await fetch("/toggle-god-mode?enable=true", {
      method: "POST",
    });
    const data = await response.json();
    alert("God Mode Enabled: You can now verify anywhere.");

    // Force an immediate update so the button turns blue instantly
    updateLocation();
  } catch (error) {
    console.error("God Mode failed:", error);
  }
}

// 4️⃣ Fetch landmarks using REST API
async function getRandomLandmarks(
  originLat,
  originLng,
  radius = 2000,
  count = 4,
) {
  try {
    const category = getSelectedCategory();
    console.log("Selected category:", category);

    // Call your backend instead of Google directly
    const response = await fetch(
      `/get-landmarks?lat=${originLat}&lng=${originLng}&radius=${radius}&category=${category}`,
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn("No landmarks found nearby.");
      return;
    }

    const shuffled = data.results.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    gameLandmarks = selected;

    console.log("===== Random Landmarks Selected =====");
    selected.forEach((place, index) => {
      console.log(
        `${index + 1}: ${place.name} | ${place.vicinity} | Lat: ${place.geometry.location.lat}, Lng: ${place.geometry.location.lng}`,
      );

      new google.maps.Marker({
        position: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        map: map,
        title: place.name,
        icon: `http://maps.google.com/mapfiles/ms/icons/${["blue", "green", "purple", "orange"][index]}-dot.png`,
        label: `${index + 1}`,
      });
    });
    console.log("====================================");
  } catch (err) {
    console.error("Failed to fetch landmarks from backend:", err);
  }
}

// Run loop every 2 seconds
setInterval(updateLocation, 2000);
// initMap();
