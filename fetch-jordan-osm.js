const fs = require('fs');
const https = require('https');

const query = `[out:json][timeout:90];
area["ISO3166-1"="JO"]->.searchArea;
(
  node["amenity"="fuel"](area.searchArea);
  node["amenity"="charging_station"](area.searchArea);
);
out center;`;

const postData = 'data=' + encodeURIComponent(query);

const options = {
  hostname: 'overpass-api.de',
  port: 443,
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);
      console.log('Total stations found:', parsedData.elements.length);
      fs.writeFileSync('stations_raw_jordan.json', JSON.stringify(parsedData.elements, null, 2));
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.error(rawData);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
