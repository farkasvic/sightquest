// ✅ FILENAME: src/static/planner.js
let map;
let userLocation = { lat: 49.2606, lng: -123.246 }; // Default UBC
let selectedCategory = "Landmark";

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: userLocation,
    zoom: 14,
    disableDefaultUI: true,
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      map.setCenter(userLocation);
      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: "You",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });
    });
  }
}

window.setCategory = function (category) {
  selectedCategory = category;
  const buttons = document.querySelectorAll("#category-buttons button");
  buttons.forEach((btn) => btn.classList.remove("active"));
  const activeBtn = Array.from(buttons).find((b) =>
    b.innerText.includes(category),
  );
  if (activeBtn) activeBtn.classList.add("active");
};

window.startSession = async function (radius, count) {
  const btn = document.querySelector("button[onclick*='startSession']");
  const originalText = btn.innerText;
  btn.innerText = "Scanning Area...";
  btn.disabled = true;

  try {
    const response = await fetch(
      `/get-landmarks?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}&category=${selectedCategory}`,
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      alert("No locations found! Try a different category.");
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }

    const shuffled = data.results.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map((place, index) => ({
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      order: index + 1,
    }));

    const payload = {
      startLocation: userLocation,
      radiusMeters: radius,
      category: selectedCategory,
      landmarks: selected,
    };

    const sessionRes = await fetch("/start-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const sessionData = await sessionRes.json();

    if (sessionData.status === "session_created") {
      window.location.href = "/static/index.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to start session.");
    btn.innerText = "Try Again";
    btn.disabled = false;
  }
};

window.initMap = initMap;
