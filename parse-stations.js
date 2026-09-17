const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('stations_raw.json', 'utf8'));

// Regex to detect Hebrew characters
const hebrewRegex = /[\u0590-\u05FF]/;

function getCity(lat, lng, tags) {
  // 1. Try to get it from tags
  let cityTag = tags['addr:city'] || tags['is_in:city'] || tags['is_in'] || '';
  if (cityTag.includes('Amman') || cityTag.includes('عمان')) return 'عمان';
  if (cityTag.includes('Irbid') || cityTag.includes('اربد') || cityTag.includes('إربد')) return 'إربد';
  if (cityTag.includes('Zarqa') || cityTag.includes('زرقاء') || cityTag.includes('الزرقاء')) return 'الزرقاء';
  if (cityTag.includes('Aqaba') || cityTag.includes('عقبة') || cityTag.includes('العقبة')) return 'العقبة';
  if (cityTag.includes('Salt') || cityTag.includes('سلط') || cityTag.includes('السلط')) return 'السلط';
  
  // 2. Fallback to coordinate bounding boxes
  if (lat >= 31.75 && lat <= 32.05 && lng >= 35.80 && lng <= 36.05) return 'عمان';
  if (lat >= 32.35 && lat <= 32.75 && lng >= 35.70 && lng <= 36.10) return 'إربد';
  if (lat >= 32.04 && lat <= 32.20 && lng >= 36.00 && lng <= 36.25) return 'الزرقاء';
  if (lat >= 29.35 && lat <= 29.60 && lng >= 34.90 && lng <= 35.15) return 'العقبة';
  if (lat >= 32.00 && lat <= 32.10 && lng >= 35.65 && lng <= 35.78) return 'السلط';
  if (lat >= 31.50 && lat <= 31.80 && lng >= 35.50 && lng <= 35.65) return 'البحر الميت';
  if (lat >= 32.25 && lat <= 32.40 && lng >= 35.80 && lng <= 35.95) return 'جرش';
  if (lat >= 31.65 && lat <= 31.75 && lng >= 35.70 && lng <= 35.85) return 'مأدبا';
  if (lat >= 31.10 && lat <= 31.30 && lng >= 35.60 && lng <= 35.80) return 'الكرك';
  if (lat >= 30.10 && lat <= 30.30 && lng >= 35.60 && lng <= 35.80) return 'معان';

  // For others, just default to 'ALL' (or 'أخرى') but the UI dropdown filters exact match.
  // We'll return the name of the area if we can't find a major one, or 'عمان' if we are lost.
  return 'أخرى';
}

const mapped = [];

raw.forEach((el) => {
  const tags = el.tags || {};
  
  // Exclude Israeli/Palestinian stations picked up by bounding box
  const nameEn = tags['name:en'] || '';
  const nameAr = tags['name:ar'] || '';
  const nameDefault = tags['name'] || '';
  const operator = tags['operator'] || '';
  const brand = tags['brand'] || '';
  
  // Check for Hebrew characters
  if (hebrewRegex.test(nameDefault) || hebrewRegex.test(nameEn) || hebrewRegex.test(nameAr) || hebrewRegex.test(operator) || hebrewRegex.test(brand)) {
    return; // skip
  }
  
  // Also explicitly skip common Israeli operators that might not be in Hebrew
  const allText = (nameDefault + nameEn + nameAr + operator + brand).toLowerCase();
  if (allText.includes('sonol') || allText.includes('paz') || allText.includes('delek') || allText.includes('dor alon') || allText.includes('ten') || allText.includes('israel')) {
    return; // skip
  }

  let type = 'PETROL_ONLY';
  if (tags.amenity === 'charging_station') type = 'EV_ONLY';
  if (tags.amenity === 'fuel' && (tags.fuel === 'electricity' || tags['fuel:electricity'] === 'yes')) type = 'HYBRID';
  
  let provider = tags.brand || tags.operator || 'محطة خاصة';
  if (provider.toLowerCase().includes('manaseer')) provider = 'المناصير (Manaseer)';
  else if (provider.toLowerCase().includes('jopetrol') || provider.toLowerCase().includes('petrol')) provider = 'جوبترول (JoPetrol)';
  else if (provider.toLowerCase().includes('total')) provider = 'توتال (TotalEnergies)';
  else if (provider.toLowerCase().includes('gulf')) provider = 'جلف (Gulf)';

  let name = tags['name:ar'] || tags['name'] || tags['name:en'] || `${provider} - ${type === 'EV_ONLY' ? 'محطة شحن' : 'محطة وقود'}`;
  
  const petrolTypes = type !== 'EV_ONLY' ? ['90', '95', 'DIESEL'] : undefined;
  const plugTypes = type !== 'PETROL_ONLY' ? ['CCS2 (DC)', 'Type 2 (AC)'] : undefined;
  
  const city = getCity(el.lat, el.lon, tags);
  
  mapped.push({
    id: el.id.toString(),
    name: name,
    provider: provider,
    type: type,
    city: city,
    address: tags['addr:street'] || name,
    nearby: 'معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)',
    plugTypes: plugTypes,
    powerKw: type !== 'PETROL_ONLY' ? 120 : undefined,
    fastCharging: type !== 'PETROL_ONLY' ? true : undefined,
    petrolTypes: petrolTypes,
    status: 'ONLINE',
    lat: el.lat,
    lng: el.lon,
    pricePerKwh: type !== 'PETROL_ONLY' ? 0.12 : undefined
  });
});

fs.writeFileSync('src/app/ev-charging-jordan/stations-data.ts', 
  `export interface Station {
  id: string;
  name: string;
  provider: string;
  type: 'EV_ONLY' | 'PETROL_ONLY' | 'HYBRID';
  city: string;
  address: string;
  nearby: string;
  plugTypes?: string[];
  powerKw?: number;
  fastCharging?: boolean;
  petrolTypes?: string[];
  status: 'ONLINE' | 'BUSY' | 'MAINTENANCE';
  lat: number;
  lng: number;
  pricePerKwh?: number;
}

export const STATIONS_DATA: Station[] = ${JSON.stringify(mapped, null, 2)};
`
);
console.log('Successfully written ' + mapped.length + ' stations to stations-data.ts');
