const fs = require('fs');

async function fetchStations() {
  // Bounding box for Jordan: 29.1,34.9,33.4,39.3
  const query = `[out:json][timeout:90];
(
  node["amenity"="fuel"](29.1, 34.9, 33.4, 39.3);
  node["amenity"="charging_station"](29.1, 34.9, 33.4, 39.3);
);
out center;`;
  
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Node.js/Fetch-OSM'
      },
      body: 'data=' + encodeURIComponent(query)
    });
    if (!res.ok) {
        console.error('HTTP Error:', res.status, res.statusText);
        return;
    }
    const data = await res.json();
    console.log('Total stations found:', data.elements.length);
    fs.writeFileSync('stations_raw.json', JSON.stringify(data.elements, null, 2));
  } catch(e) {
    console.error('Error fetching:', e.message);
  }
}

fetchStations();
