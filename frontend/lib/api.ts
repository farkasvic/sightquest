const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Session Management
export async function startSession(
  lat: number,
  lng: number,
  category: string,
  radiusMeters: number = 2000,
  landmarks: any[] = []
) {
  const response = await fetch(`${API_URL}/start-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startLocation: {
        lat: lat,
        lng: lng
      },
      category,
      radiusMeters,
      landmarks,
    }),
  });
  return response.json();
}

export async function getCurrentSession() {
  const response = await fetch(`${API_URL}/get-current-session`);
  return response.json();
}

export async function completeSession() {
  const response = await fetch(`${API_URL}/complete-session`, {
    method: 'POST',
  });
  return response.json();
}

// Quest & Riddle
export async function getRiddle() {
  const response = await fetch(`${API_URL}/get-riddle`);
  return response.json();
}

export async function generateAllRiddles() {
  const response = await fetch(`${API_URL}/generate-all-riddles`);
  return response.json();
}

export async function checkProximity(lat: number, lon: number) {
  const response = await fetch(`${API_URL}/check-proximity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon }),
  });
  return response.json();
}

// Image Verification
export async function verifyImage(imageFile: File, lat: number, lon: number) {
  // Convert image to base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.readAsDataURL(imageFile);
  });

  const response = await fetch(`${API_URL}/verify-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_b64: base64,
      lat,
      lon,
    }),
  });
  return response.json();
}

// User Profile
export async function getMyProfile() {
  const response = await fetch(`${API_URL}/my-profile`);
  return response.json();
}

export async function collectStamp(poiName: string, category: string) {
  const response = await fetch(`${API_URL}/collect-stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      poi_name: poiName,
      category,
    }),
  });
  return response.json();
}

// Stats & Leaderboard
export async function getStats() {
  const response = await fetch(`${API_URL}/stats`);
  return response.json();
}

// Landmarks Search
export async function getLandmarks(
  lat: number,
  lng: number,
  category: string,
  radius: number = 1000
) {
  const response = await fetch(
    `${API_URL}/get-landmarks?lat=${lat}&lng=${lng}&category=${category}&radius=${radius}`
  );
  return response.json();
}
