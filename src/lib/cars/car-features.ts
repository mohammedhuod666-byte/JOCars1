// Canonical car features/options catalog (Arabic labels + stable keys).
// Used by the add form (checklist), the car page (display), and the
// valuation engine (spec overlap scoring).

export const CAR_FEATURES = [
  'daytime_led', 'full_led', 'front_fog', 'front_radar', 'auto_hold', 'hill_descent',
  'tcs', 'blind_spot', 'parking_sensors', 'rims_20', 'power_mirrors', 'power_trunk',
  'harman_kardon', 'leather_seats', 'power_front_seats', 'seat_heat_cool', 'driver_memory_2',
  'sport_steering', 'paddles', 'auto_windows', 'driver_display', 'hud', 'rear_entertainment',
  'carbon_trim', 'pano_roof', 'drive_modes', 'ambient_light', 'cam_360', 'tire_pressure', 'tunnel_sensor',
  'cruise_control', 'lane_assist', 'rear_camera', 'keyless', 'push_start', 'sunroof',
];

export const CAR_FEATURES_AR: Record<string, string> = {
  daytime_led: 'انارة نهارية LED', full_led: 'انارة امامية وخلفية LED', front_fog: 'كشافات أمامية',
  front_radar: 'رادار تفاعلي أمامي', auto_hold: 'Auto hold', hill_descent: 'نظام المساعدة على نزول التل',
  tcs: 'TCS', blind_spot: 'نقطة عمياء', parking_sensors: 'حساسات اصطفاف امامية وخلفية',
  rims_20: 'جنوط قياس 20inch', power_mirrors: 'مرايا تحكم كهربائي', power_trunk: 'صندوق خلفي كهربائي',
  harman_kardon: 'نظام صوتي harman kardon', leather_seats: 'مقاعد جلدية',
  power_front_seats: 'تحكم كهربائي للمقاعد الأمامية', seat_heat_cool: 'تدفئة وتبريد للمقاعد الأمامية',
  driver_memory_2: 'ميموري عدد 2 لمقعد السائق', sport_steering: 'مقود جلدي رياضي مع ازرار تحكم',
  paddles: 'Shifting paddles', auto_windows: 'نوافذ كهربائية اوتوماتيكية',
  driver_display: 'شاشة معلومات للسائق', hud: 'Head up display',
  rear_entertainment: 'شاشة داخلية ترفيهية (تحكم ماوس ولمس)', carbon_trim: 'كفرات كاربون فايبر داخلية',
  pano_roof: 'فتحة سقف بانوراما', drive_modes: 'وضعيات قيادة متعددة', ambient_light: 'انارة داخلية مخفية',
  cam_360: 'كاميرات 360 درجة', tire_pressure: 'حساسات ضغط اطارات', tunnel_sensor: 'حساس انفاق',
  cruise_control: 'مثبت سرعة', lane_assist: 'مساعدة البقاء بالمسار', rear_camera: 'كاميرا خلفية',
  keyless: 'دخول بدون مفتاح', push_start: 'تشغيل بصمة', sunroof: 'فتحة سقف',
};

/** Keep only known keys (drop stale/typo entries from stored JSON). */
export function sanitizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string' && CAR_FEATURES.includes(x)).slice(0, 60);
  if (typeof raw === 'string') {
    try {
      return sanitizeFeatures(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}
