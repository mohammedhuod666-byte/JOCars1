export interface Station {
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

export const STATIONS_DATA: Station[] = [
  {
    "id": "331525265",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8467903,
    "lng": 35.8487693
  },
  {
    "id": "360624181",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1980093,
    "lng": 35.6897369
  },
  {
    "id": "360644920",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6293331,
    "lng": 36.1444098
  },
  {
    "id": "389438634",
    "name": "One",
    "provider": "One",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "One",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2228789,
    "lng": 34.980815
  },
  {
    "id": "406963190",
    "name": "Hypco",
    "provider": "Hypco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hypco",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2520056,
    "lng": 35.2263909
  },
  {
    "id": "411769079",
    "name": "Hypco",
    "provider": "Hypco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hypco",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2558635,
    "lng": 35.2185578
  },
  {
    "id": "431624576",
    "name": "المحطة الحديثة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شارع القدس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7042166,
    "lng": 35.2223467
  },
  {
    "id": "431626304",
    "name": "محطة النشاش للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة النشاش للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6879448,
    "lng": 35.1633547
  },
  {
    "id": "431626858",
    "name": "محطة بيت لحم للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بيت لحم للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6947909,
    "lng": 35.1790636
  },
  {
    "id": "431628717",
    "name": "محطة الحايك و الصوص",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الحايك و الصوص",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7044755,
    "lng": 35.2273908
  },
  {
    "id": "431630112",
    "name": "شركة بيت لحم للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة بيت لحم للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6966565,
    "lng": 35.1856439
  },
  {
    "id": "431633362",
    "name": "محطة محروقات الجزيرة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات الجزيرة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7065597,
    "lng": 35.254176
  },
  {
    "id": "431633458",
    "name": "محطة محروقات عابدين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات عابدين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7087276,
    "lng": 35.2618121
  },
  {
    "id": "431633752",
    "name": "محطة تقوع للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة تقوع للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6356919,
    "lng": 35.2157596
  },
  {
    "id": "431637086",
    "name": "كازية الفارعة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية الفارعة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.280073,
    "lng": 35.3416106
  },
  {
    "id": "431708586",
    "name": "محطة طوباس لتعبئة الغاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة طوباس لتعبئة الغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3427347,
    "lng": 35.3627351
  },
  {
    "id": "431708597",
    "name": "محطة و مغسلة الاصدقاء",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة و مغسلة الاصدقاء",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3333677,
    "lng": 35.3639009
  },
  {
    "id": "431708693",
    "name": "محطة محروقات طوباس",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات طوباس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3137539,
    "lng": 35.371564
  },
  {
    "id": "431708733",
    "name": "محطة طمون",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة طمون",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3086675,
    "lng": 35.3648686
  },
  {
    "id": "431708755",
    "name": "محطة عقابة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عقابة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3502364,
    "lng": 35.3520689
  },
  {
    "id": "431708780",
    "name": "محطة تحت الانشاء",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة تحت الانشاء",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3400556,
    "lng": 35.3604828
  },
  {
    "id": "431739693",
    "name": "محطة عرابة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عرابة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4047058,
    "lng": 35.2067738
  },
  {
    "id": "431744097",
    "name": "محطة محمد ياسين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محمد ياسين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4665449,
    "lng": 35.3348836
  },
  {
    "id": "431745113",
    "name": "محطة ميثلون",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة ميثلون",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3504433,
    "lng": 35.2648137
  },
  {
    "id": "431745595",
    "name": "محطة ابو الطاهر",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة ابو الطاهر",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3498705,
    "lng": 35.266722
  },
  {
    "id": "431748723",
    "name": "محطة محروقات مسلية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات مسلية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3874759,
    "lng": 35.2915374
  },
  {
    "id": "431750661",
    "name": "محطة الزايد للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الزايد للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4638632,
    "lng": 35.3036899
  },
  {
    "id": "431751237",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5114047,
    "lng": 35.2299542
  },
  {
    "id": "431766173",
    "name": "محطة ماجد الصغير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة ماجد الصغير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4682507,
    "lng": 35.30998
  },
  {
    "id": "431786089",
    "name": "محطة النصبة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة النصبة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.584435,
    "lng": 35.1192839
  },
  {
    "id": "431792658",
    "name": "محطة شاهين للغاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة شاهين للغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4451917,
    "lng": 34.9906125
  },
  {
    "id": "431818410",
    "name": "محطة الحافي للغاز",
    "provider": "for gaz",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الحافي للغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4694308,
    "lng": 35.3084613
  },
  {
    "id": "431822729",
    "name": "شركة صوريف للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة صوريف للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6500016,
    "lng": 35.0668686
  },
  {
    "id": "431853340",
    "name": "محطه البصه للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه البصه للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5172723,
    "lng": 35.0810352
  },
  {
    "id": "431871718",
    "name": "محطة التحرير للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة التحرير للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5071728,
    "lng": 35.0787238
  },
  {
    "id": "431881936",
    "name": "شركة الشرق الاوسط للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة الشرق الاوسط للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5593393,
    "lng": 35.080569
  },
  {
    "id": "431902392",
    "name": "محطة المصري للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة المصري للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2195397,
    "lng": 35.2674607
  },
  {
    "id": "431908880",
    "name": "محطة الامراء",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الامراء",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5070552,
    "lng": 35.089499
  },
  {
    "id": "431913946",
    "name": "محطة نمر التميمي",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة نمر التميمي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2182934,
    "lng": 35.2694191
  },
  {
    "id": "431917869",
    "name": "شركة صوريف للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة صوريف للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6473222,
    "lng": 35.067567
  },
  {
    "id": "431918911",
    "name": "محطة الحرمين للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الحرمين للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1849986,
    "lng": 35.3292405
  },
  {
    "id": "431930246",
    "name": "محطه الانصار للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه الانصار للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5398314,
    "lng": 35.0901343
  },
  {
    "id": "431940963",
    "name": "محطة بيت فوريك",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بيت فوريك",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1842373,
    "lng": 35.3296211
  },
  {
    "id": "431942912",
    "name": "برقة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "برقة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2980434,
    "lng": 35.1847851
  },
  {
    "id": "431949040",
    "name": "محطة وقود الحارث",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود الحارث",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4636928,
    "lng": 35.1201135
  },
  {
    "id": "431957508",
    "name": "محطة الهلال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهلال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5174869,
    "lng": 35.1101537
  },
  {
    "id": "431964172",
    "name": "محطة السلام للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة السلام للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5319708,
    "lng": 35.0889185
  },
  {
    "id": "431968408",
    "name": "محطة العطاري",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة العطاري",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2539475,
    "lng": 35.1861134
  },
  {
    "id": "431974242",
    "name": "شركة زيد للمحروقات الاهلية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة زيد للمحروقات الاهلية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5598604,
    "lng": 35.1003657
  },
  {
    "id": "431975583",
    "name": "محطة كنعان للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة كنعان للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2184291,
    "lng": 35.2692823
  },
  {
    "id": "431982105",
    "name": "بناشر سالم",
    "provider": "wheel pansher",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "بناشر سالم",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2116996,
    "lng": 35.3218546
  },
  {
    "id": "431987292",
    "name": "شركة الارز للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة الارز للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5826894,
    "lng": 35.1002575
  },
  {
    "id": "431990108",
    "name": "كازية عسعس للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية عسعس للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6483026,
    "lng": 35.0619024
  },
  {
    "id": "432039558",
    "name": "محطة الرباط للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الرباط للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4576967,
    "lng": 35.1123691
  },
  {
    "id": "432041113",
    "name": "محطة جماعين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة جماعين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1379534,
    "lng": 35.2203457
  },
  {
    "id": "432052374",
    "name": "محطة الصداقة الحديثة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الصداقة الحديثة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2485567,
    "lng": 35.2506369
  },
  {
    "id": "432056007",
    "name": "محطة الهايل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهايل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1921913,
    "lng": 35.2848554
  },
  {
    "id": "432063609",
    "name": "محطة حواره",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة حواره",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1538506,
    "lng": 35.2591475
  },
  {
    "id": "432070344",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1855842,
    "lng": 35.2298298
  },
  {
    "id": "432086479",
    "name": "مجطة برقه",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مجطة برقه",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2836259,
    "lng": 35.2184825
  },
  {
    "id": "432091675",
    "name": "محطة التميمي",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة التميمي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1484799,
    "lng": 35.2578152
  },
  {
    "id": "432094071",
    "name": "محطة بنزين تحت الانشاء",
    "provider": "Nebras",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jalud - Telfit",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0798787,
    "lng": 35.3028978
  },
  {
    "id": "432094650",
    "name": "محطة محروقات التميمي",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات التميمي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2245258,
    "lng": 35.259558
  },
  {
    "id": "432098512",
    "name": "محطة الخطيب للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الخطيب للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.619486,
    "lng": 35.1079537
  },
  {
    "id": "432100941",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0851287,
    "lng": 35.3372281
  },
  {
    "id": "432102534",
    "name": "محطه السامر للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه السامر للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5075432,
    "lng": 35.0895545
  },
  {
    "id": "432110502",
    "name": "محطة حسونه للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة حسونه للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5278565,
    "lng": 35.100276
  },
  {
    "id": "432112319",
    "name": "شركة التاية للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة التاية للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1399201,
    "lng": 35.2799365
  },
  {
    "id": "432118314",
    "name": "محطة الوليد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الوليد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0854507,
    "lng": 35.3428226
  },
  {
    "id": "432142775",
    "name": "المصري للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "المصري للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2223668,
    "lng": 35.2621364
  },
  {
    "id": "432145523",
    "name": "محروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1415505,
    "lng": 35.282741
  },
  {
    "id": "432146349",
    "name": "محطة المشاريق",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة المشاريق",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0997947,
    "lng": 35.2668148
  },
  {
    "id": "432151884",
    "name": "محطة الصبار للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الصبار للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4015063,
    "lng": 34.9650047
  },
  {
    "id": "432152855",
    "name": "محطة الأندلس للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الأندلس للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5067288,
    "lng": 35.1094442
  },
  {
    "id": "432159332",
    "name": "كازية راس الجورة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية راس الجورة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5559518,
    "lng": 35.1000924
  },
  {
    "id": "432161366",
    "name": "محطة نصار للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Main Street",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4561464,
    "lng": 35.1076697
  },
  {
    "id": "432170297",
    "name": "شركة محروقات عقربا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة محروقات عقربا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1238815,
    "lng": 35.346763
  },
  {
    "id": "432174595",
    "name": "محطة الزيتاوي",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الزيتاوي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.128261,
    "lng": 35.2090881
  },
  {
    "id": "432215731",
    "name": "محطة حلحول للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة حلحول للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5977888,
    "lng": 35.1070634
  },
  {
    "id": "432230282",
    "name": "الارز للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الارز للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5825112,
    "lng": 35.1004348
  },
  {
    "id": "432249194",
    "name": "شركة حمزة شاهين لتعبئة الغاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة حمزة شاهين لتعبئة الغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.507799,
    "lng": 35.1089166
  },
  {
    "id": "432255654",
    "name": "محطه تفوح للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه تفوح للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5382671,
    "lng": 35.0555024
  },
  {
    "id": "432260877",
    "name": "محطة الشرقية للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الشرقية للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9372874,
    "lng": 35.2446064
  },
  {
    "id": "432262237",
    "name": "محطة غاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة غاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9450715,
    "lng": 35.0338914
  },
  {
    "id": "432262330",
    "name": "محطة محروقات نعلين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات نعلين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9466517,
    "lng": 35.0214179
  },
  {
    "id": "432262495",
    "name": "محطة الضاحية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الضاحية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8465936,
    "lng": 35.2288635
  },
  {
    "id": "432263137",
    "name": "محطة الاخوة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الاخوة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0495573,
    "lng": 35.1268883
  },
  {
    "id": "432263231",
    "name": "محطة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8329056,
    "lng": 35.1532264
  },
  {
    "id": "432263246",
    "name": "Salameh Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شارع رئيسي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8148272,
    "lng": 35.2662957
  },
  {
    "id": "432263341",
    "name": "محطة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9140641,
    "lng": 35.2161371
  },
  {
    "id": "432263548",
    "name": "محطة الرام",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الرام",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8546431,
    "lng": 35.2368608
  },
  {
    "id": "432263628",
    "name": "محطة غاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة غاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9171482,
    "lng": 35.1275576
  },
  {
    "id": "432263725",
    "name": "محطة فلسطين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة فلسطين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8918917,
    "lng": 35.2145157
  },
  {
    "id": "432264126",
    "name": "محطة غاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة غاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8448221,
    "lng": 35.1227252
  },
  {
    "id": "432266431",
    "name": "محطة غاز الاخوة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة غاز الاخوة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0359976,
    "lng": 35.1742951
  },
  {
    "id": "432266807",
    "name": "كازية الهدى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية الهدى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9081102,
    "lng": 35.0635427
  },
  {
    "id": "432267390",
    "name": "محطة شقيرات",
    "provider": "diesel",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة شقيرات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7412918,
    "lng": 35.2820955
  },
  {
    "id": "432267409",
    "name": "محطة الهدى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهدى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8855892,
    "lng": 35.1988513
  },
  {
    "id": "432267421",
    "name": "شركة محروقات بني زيد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة محروقات بني زيد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0152106,
    "lng": 35.1224189
  },
  {
    "id": "432267793",
    "name": "محطة قراوة بني زيد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة قراوة بني زيد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0498556,
    "lng": 35.1269838
  },
  {
    "id": "432267957",
    "name": "محطة الجبع",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الجبع",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8562905,
    "lng": 35.2458303
  },
  {
    "id": "432268312",
    "name": "محطة عريقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عريقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7644646,
    "lng": 35.2800772
  },
  {
    "id": "432269142",
    "name": "محطة الفايز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الفايز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9905202,
    "lng": 35.282134
  },
  {
    "id": "432269773",
    "name": "محطة الشيني للغاز",
    "provider": "gaz",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الشيني للغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9072809,
    "lng": 35.2135412
  },
  {
    "id": "432273801",
    "name": "محطة الجمعاء للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الجمعاء للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7521001,
    "lng": 35.2594312
  },
  {
    "id": "432274327",
    "name": "فلسطين للغاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "فلسطين للغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8498013,
    "lng": 35.2109921
  },
  {
    "id": "432274778",
    "name": "محطة دير دبوان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة دير دبوان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9130268,
    "lng": 35.2603358
  },
  {
    "id": "432274924",
    "name": "كازية النورس",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية النورس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8929881,
    "lng": 35.0919583
  },
  {
    "id": "432278571",
    "name": "محطة أبو الريش",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة أبو الريش",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7696389,
    "lng": 35.2559597
  },
  {
    "id": "432278653",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9141376,
    "lng": 35.1836675
  },
  {
    "id": "432278687",
    "name": "محطة 2000 للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شارع بير زيت رام الله",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9608147,
    "lng": 35.1882902
  },
  {
    "id": "432278695",
    "name": "معجنات و محطة ابو شلبك",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "معجنات و محطة ابو شلبك",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8557812,
    "lng": 35.2385398
  },
  {
    "id": "432279484",
    "name": "محطة عابود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عابود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0140127,
    "lng": 35.0712689
  },
  {
    "id": "432279753",
    "name": "محطة الامل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الامل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8527915,
    "lng": 35.1908849
  },
  {
    "id": "432280379",
    "name": "محطة الامانة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الامانة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9983308,
    "lng": 35.0692691
  },
  {
    "id": "432281121",
    "name": "محطة سلواد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة سلواد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.969387,
    "lng": 35.2583051
  },
  {
    "id": "432281372",
    "name": "محطة الهدى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهدى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9231855,
    "lng": 35.2196797
  },
  {
    "id": "432281857",
    "name": "محطة البيرة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة البيرة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9075724,
    "lng": 35.2181892
  },
  {
    "id": "432282295",
    "name": "كازية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8938131,
    "lng": 35.0685607
  },
  {
    "id": "432282916",
    "name": "محطة غاز الخواجا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "نعلين الشارع الرئيسي طريق المديه",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9438489,
    "lng": 35.0146885
  },
  {
    "id": "432283523",
    "name": "محطة سميراميس",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة سميراميس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8749201,
    "lng": 35.2172972
  },
  {
    "id": "432283591",
    "name": "محطة ابو عزيزة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة ابو عزيزة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0179811,
    "lng": 35.3419072
  },
  {
    "id": "432283599",
    "name": "محطة السويس",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة السويس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8864534,
    "lng": 35.2186532
  },
  {
    "id": "432283759",
    "name": "محطة بيتونيا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بيتونيا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8868653,
    "lng": 35.1749031
  },
  {
    "id": "432284064",
    "name": "محطة الهدى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهدى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8691068,
    "lng": 35.2247106
  },
  {
    "id": "432284181",
    "name": "Al Galazon Station For Fuel",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Al Galazon Station For Fuel",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9493997,
    "lng": 35.2140311
  },
  {
    "id": "432286111",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9413166,
    "lng": 35.3082886
  },
  {
    "id": "432286423",
    "name": "بناشر ابو همام",
    "provider": "pansher",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "بناشر ابو همام",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0499873,
    "lng": 35.124901
  },
  {
    "id": "432286493",
    "name": "Alqbaibeh fuel station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Alqbaibeh fuel station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8397618,
    "lng": 35.1313719
  },
  {
    "id": "432287530",
    "name": "محطة الخواجا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الخواجا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8692684,
    "lng": 35.223968
  },
  {
    "id": "432288695",
    "name": "محطة الأخوين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الأخوين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8724038,
    "lng": 35.2196427
  },
  {
    "id": "432288722",
    "name": "محطة محروقات عبوين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات عبوين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0306027,
    "lng": 35.2015618
  },
  {
    "id": "432290764",
    "name": "محطة بيت المقدس",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بيت المقدس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8631663,
    "lng": 35.2292798
  },
  {
    "id": "432290944",
    "name": "محطة الرامون",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الرامون",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9308165,
    "lng": 35.3003552
  },
  {
    "id": "432291157",
    "name": "محطة محروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0311725,
    "lng": 35.1051756
  },
  {
    "id": "432291270",
    "name": "محطة دير جرير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة دير جرير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9698478,
    "lng": 35.287621
  },
  {
    "id": "432291540",
    "name": "شركة العطاري للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة العطاري للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8989443,
    "lng": 35.1776376
  },
  {
    "id": "432294362",
    "name": "محطة المالك",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة المالك",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.984146,
    "lng": 35.3032439
  },
  {
    "id": "432294626",
    "name": "محطة الامانة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الامانة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9689446,
    "lng": 35.2635203
  },
  {
    "id": "432295930",
    "name": "محطة بغداد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بغداد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8093674,
    "lng": 35.2508377
  },
  {
    "id": "432295931",
    "name": "محطة بنزين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بنزين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9030086,
    "lng": 35.2072662
  },
  {
    "id": "432297570",
    "name": "محطة عناتا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عناتا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.817791,
    "lng": 35.2681027
  },
  {
    "id": "432297592",
    "name": "الشراري",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الشراري",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9886064,
    "lng": 35.2805555
  },
  {
    "id": "432297627",
    "name": "محطة الاتحاد للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الاتحاد للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9690678,
    "lng": 35.1104115
  },
  {
    "id": "432301068",
    "name": "محطه الخواجا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه الخواجا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1944474,
    "lng": 35.1347225
  },
  {
    "id": "432301858",
    "name": "Gas Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Gas Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1469929,
    "lng": 35.0391124
  },
  {
    "id": "432309694",
    "name": "محطة محروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2040457,
    "lng": 35.0399429
  },
  {
    "id": "432311795",
    "name": "'Azzun",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "'Azzun",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1781856,
    "lng": 35.051678
  },
  {
    "id": "432330640",
    "name": "محطه القرنين للوقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه القرنين للوقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1793501,
    "lng": 35.103029
  },
  {
    "id": "432330798",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2069208,
    "lng": 35.1259473
  },
  {
    "id": "432332688",
    "name": "محطة حبلة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة حبلة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1610256,
    "lng": 34.9833117
  },
  {
    "id": "432334734",
    "name": "شركة الشنطي للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة الشنطي للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1914213,
    "lng": 34.965899
  },
  {
    "id": "432334788",
    "name": "محطة قلقيلية للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة قلقيلية للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1859918,
    "lng": 34.9644469
  },
  {
    "id": "432334830",
    "name": "محطة صوفين للوقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة صوفين للوقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1905941,
    "lng": 34.9814464
  },
  {
    "id": "432338430",
    "name": "Alhawash fuel",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Alhawash fuel",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8553919,
    "lng": 35.4575483
  },
  {
    "id": "432341063",
    "name": "محطة غاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة غاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8307039,
    "lng": 35.4464131
  },
  {
    "id": "432344387",
    "name": "Sabri khalaf",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Sabri khalaf",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8551976,
    "lng": 35.4577057
  },
  {
    "id": "432346274",
    "name": "مجطة بديا للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مجطة بديا للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1146272,
    "lng": 35.0882582
  },
  {
    "id": "432348057",
    "name": "مستودع غاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مستودع غاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.103955,
    "lng": 35.0911163
  },
  {
    "id": "432352080",
    "name": "محطة قراوة بني حسان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة قراوة بني حسان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1228399,
    "lng": 35.1020672
  },
  {
    "id": "432353212",
    "name": "محطة مسحة للمحروقات",
    "provider": "Fuel",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة مسحة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1053462,
    "lng": 35.0506383
  },
  {
    "id": "432353419",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1095539,
    "lng": 35.0632815
  },
  {
    "id": "432355234",
    "name": "محطه محروقات الهدى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "سلفيت - اسكاكا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0858805,
    "lng": 35.1903288
  },
  {
    "id": "432359044",
    "name": "محطة سلفيت للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة سلفيت للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0864158,
    "lng": 35.1753871
  },
  {
    "id": "432360256",
    "name": "مستودع غاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مستودع غاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1140974,
    "lng": 35.076699
  },
  {
    "id": "432361038",
    "name": "محطة عتيل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عتيل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3647958,
    "lng": 35.070132
  },
  {
    "id": "432361047",
    "name": "محطة قيرا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة قيرا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.133593,
    "lng": 35.1787025
  },
  {
    "id": "432361620",
    "name": "محطة الخواجا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الخواجا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0966743,
    "lng": 35.0434873
  },
  {
    "id": "432362857",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4113387,
    "lng": 35.070618
  },
  {
    "id": "432363911",
    "name": "محطة حسن يوسف للوقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة حسن يوسف للوقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4117552,
    "lng": 35.0653758
  },
  {
    "id": "432364517",
    "name": "القيسي للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "القيسي للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.319243,
    "lng": 35.0489874
  },
  {
    "id": "432370558",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4176215,
    "lng": 35.0853419
  },
  {
    "id": "432373410",
    "name": "محطة القاروط",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة القاروط",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3140163,
    "lng": 35.0280117
  },
  {
    "id": "432380270",
    "name": "مشحمة طولكرم",
    "provider": "washing",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مشحمة طولكرم",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3190901,
    "lng": 35.0475685
  },
  {
    "id": "432386472",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2926793,
    "lng": 35.0370052
  },
  {
    "id": "432392096",
    "name": "غاز الشعب",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "غاز الشعب",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.410773,
    "lng": 35.071444
  },
  {
    "id": "432394871",
    "name": "ميغا لتعبئة الغاز",
    "provider": "Gas Station",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "ميغا لتعبئة الغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3620563,
    "lng": 35.0698953
  },
  {
    "id": "432403761",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3146691,
    "lng": 35.0288579
  },
  {
    "id": "432404237",
    "name": "مستودع الناطور للغاز",
    "provider": "Gas Store",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مستودع الناطور للغاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3725334,
    "lng": 35.0693379
  },
  {
    "id": "432407078",
    "name": "محطة الميجا لاند",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الميجا لاند",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3232187,
    "lng": 35.0296558
  },
  {
    "id": "432410461",
    "name": "محطة علار",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة علار",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3754717,
    "lng": 35.1028645
  },
  {
    "id": "432410974",
    "name": "محطة الكفريات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الكفريات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2528108,
    "lng": 35.0700409
  },
  {
    "id": "432414648",
    "name": "محطة الساعد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الساعد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4032926,
    "lng": 35.0686907
  },
  {
    "id": "432419797",
    "name": "محطة دير الغصون",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة دير الغصون",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3414972,
    "lng": 35.056235
  },
  {
    "id": "432423595",
    "name": "الشعراوية الحديثة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الشعراوية الحديثة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3836639,
    "lng": 35.0727487
  },
  {
    "id": "432535083",
    "name": "محطة عنبتا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عنبتا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3075261,
    "lng": 35.1153471
  },
  {
    "id": "432536765",
    "name": "محطة قديمة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة قديمة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3860595,
    "lng": 35.0454323
  },
  {
    "id": "432542485",
    "name": "محطة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2639837,
    "lng": 35.1303171
  },
  {
    "id": "432544906",
    "name": "محطة محروقات الاصهب",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات الاصهب",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.412973,
    "lng": 35.2795168
  },
  {
    "id": "432545025",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4583201,
    "lng": 35.2598191
  },
  {
    "id": "432545137",
    "name": "محطة الخالد للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الخالد للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4680022,
    "lng": 35.2972377
  },
  {
    "id": "438068796",
    "name": "النجاح",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "النجاح",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3654856,
    "lng": 36.2493949
  },
  {
    "id": "474733510",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6172156,
    "lng": 35.2893784
  },
  {
    "id": "489657723",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1887561,
    "lng": 35.8548924
  },
  {
    "id": "489657816",
    "name": "محطة الأردن",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة الأردن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9248621,
    "lng": 35.9433426
  },
  {
    "id": "516738592",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3928406,
    "lng": 34.9109946
  },
  {
    "id": "518558914",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7149324,
    "lng": 35.1207417
  },
  {
    "id": "527377976",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7032397,
    "lng": 35.1925037
  },
  {
    "id": "527441411",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7344249,
    "lng": 35.209603
  },
  {
    "id": "538508434",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7856007,
    "lng": 35.5398037
  },
  {
    "id": "562625345",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7498062,
    "lng": 35.2108814
  },
  {
    "id": "567340158",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0300361,
    "lng": 34.9346602
  },
  {
    "id": "602515004",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.825634,
    "lng": 35.2389484
  },
  {
    "id": "606136995",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7051537,
    "lng": 35.774505
  },
  {
    "id": "610375773",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.0278705,
    "lng": 35.7164731
  },
  {
    "id": "673451167",
    "name": "Khorshed Rockfeller Gas Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Khorshed Rockfeller Gas Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7836727,
    "lng": 35.2376428
  },
  {
    "id": "695826598",
    "name": "Station Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "Station Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5469364,
    "lng": 35.0239137
  },
  {
    "id": "715267310",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3725078,
    "lng": 34.9977947
  },
  {
    "id": "727413404",
    "name": "TotalEnergies",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "TotalEnergies",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3596253,
    "lng": 35.7839186
  },
  {
    "id": "728006633",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8346067,
    "lng": 36.8148039
  },
  {
    "id": "728036930",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8055117,
    "lng": 35.9126127
  },
  {
    "id": "728036935",
    "name": "جلف (Gulf) - محطة وقود",
    "provider": "جلف (Gulf)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "جلف (Gulf) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7311899,
    "lng": 35.9436405
  },
  {
    "id": "821835702",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1716019,
    "lng": 34.9406803
  },
  {
    "id": "927978195",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2084262,
    "lng": 35.1582657
  },
  {
    "id": "940870890",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8620276,
    "lng": 35.1703695
  },
  {
    "id": "948461594",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0664332,
    "lng": 35.4008058
  },
  {
    "id": "964856196",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7276924,
    "lng": 35.8171675
  },
  {
    "id": "994902232",
    "name": "Jo Petrol",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.156651,
    "lng": 35.7309758
  },
  {
    "id": "1048922988",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8644047,
    "lng": 35.274462
  },
  {
    "id": "1056716268",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7563609,
    "lng": 35.1605414
  },
  {
    "id": "1061070026",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8998614,
    "lng": 35.1700415
  },
  {
    "id": "1080462621",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5744905,
    "lng": 36.2076134
  },
  {
    "id": "1098533579",
    "name": "كازية أبطع",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية أبطع",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7809783,
    "lng": 36.146382
  },
  {
    "id": "1124192569",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8150731,
    "lng": 36.1590368
  },
  {
    "id": "1124807839",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.826055,
    "lng": 36.1616222
  },
  {
    "id": "1127140234",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.0149653,
    "lng": 36.1824334
  },
  {
    "id": "1127933723",
    "name": "الصنمين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الصنمين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.0678083,
    "lng": 36.184673
  },
  {
    "id": "1129157310",
    "name": "TotalEnergies",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "TotalEnergies",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.161005,
    "lng": 35.8485397
  },
  {
    "id": "1129524933",
    "name": "كازية مفرق موثبين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية مفرق موثبين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1416362,
    "lng": 36.2123749
  },
  {
    "id": "1139676939",
    "name": "محطة الحناوي",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الحناوي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.0090464,
    "lng": 36.100633
  },
  {
    "id": "1141438119",
    "name": "محطة محروقات إنخل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات إنخل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.0220746,
    "lng": 36.128555
  },
  {
    "id": "1147463795",
    "name": "كازية الوفاء",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية الوفاء",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.9977876,
    "lng": 36.0765564
  },
  {
    "id": "1174966823",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4628397,
    "lng": 35.9181687
  },
  {
    "id": "1186053544",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8152254,
    "lng": 36.2118959
  },
  {
    "id": "1186082050",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8859569,
    "lng": 36.2156558
  },
  {
    "id": "1191237145",
    "name": "كازية سرايا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية سرايا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7126,
    "lng": 36.5665173
  },
  {
    "id": "1192702102",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.733441,
    "lng": 35.2859198
  },
  {
    "id": "1192727445",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.6732516,
    "lng": 35.468415
  },
  {
    "id": "1193561732",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3797354,
    "lng": 35.0175005
  },
  {
    "id": "1193921624",
    "name": "Jordan Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jordan Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1449798,
    "lng": 35.6199119
  },
  {
    "id": "1199442670",
    "name": "محطة بلان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بلان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7200173,
    "lng": 36.5670701
  },
  {
    "id": "1204361393",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2483912,
    "lng": 36.4189259
  },
  {
    "id": "1207739215",
    "name": "Manaseer",
    "provider": "المناصير (Manaseer)",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5999507,
    "lng": 35.0277152
  },
  {
    "id": "1207743579",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.8959927,
    "lng": 35.1178766
  },
  {
    "id": "1228482957",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7235935,
    "lng": 35.809361
  },
  {
    "id": "1299810541",
    "name": "محطة النيبال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة النيبال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1023687,
    "lng": 36.5241131
  },
  {
    "id": "1302660840",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2863221,
    "lng": 35.7411767
  },
  {
    "id": "1317142833",
    "name": "محطة عتيل للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة عتيل للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7619042,
    "lng": 36.5756318
  },
  {
    "id": "1318502357",
    "name": "الجلبل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شارع 100",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7883525,
    "lng": 35.1952388
  },
  {
    "id": "1318506810",
    "name": "ديزول",
    "provider": "Dizol",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "ديزول",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7595714,
    "lng": 35.3494653
  },
  {
    "id": "1323600293",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5777663,
    "lng": 34.9669267
  },
  {
    "id": "1349263391",
    "name": "شركة التميز المحدودة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة التميز المحدودة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4489732,
    "lng": 37.154544
  },
  {
    "id": "1363502911",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7049889,
    "lng": 35.7921053
  },
  {
    "id": "1382923734",
    "name": "Tapuz",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Tapuz",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5998195,
    "lng": 35.2948321
  },
  {
    "id": "1426833314",
    "name": "كازية الصياد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية الصياد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3248721,
    "lng": 36.2629183
  },
  {
    "id": "1438346641",
    "name": "الزعبي",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الزعبي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6305398,
    "lng": 36.1061982
  },
  {
    "id": "1469114892",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.815548,
    "lng": 34.9967282
  },
  {
    "id": "1543997258",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8361369,
    "lng": 35.2277967
  },
  {
    "id": "1543997369",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8280471,
    "lng": 35.2282741
  },
  {
    "id": "1567024542",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1960311,
    "lng": 35.6219585
  },
  {
    "id": "1579405200",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8018803,
    "lng": 35.2462498
  },
  {
    "id": "1583036867",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3889655,
    "lng": 35.043209
  },
  {
    "id": "1583721334",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3618024,
    "lng": 35.0304702
  },
  {
    "id": "1585310312",
    "name": "محطة إمتان للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة إمتان للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4184876,
    "lng": 36.8182066
  },
  {
    "id": "1589085750",
    "name": "كازية عرمان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية عرمان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5086413,
    "lng": 36.7530699
  },
  {
    "id": "1617822764",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.669504,
    "lng": 38.7190658
  },
  {
    "id": "1627471564",
    "name": "محطة الكفر للوقود",
    "provider": "Independent",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الكفر للوقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6385911,
    "lng": 36.6346718
  },
  {
    "id": "1635419629",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8042814,
    "lng": 35.0988319
  },
  {
    "id": "1635421460",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7948488,
    "lng": 35.1017838
  },
  {
    "id": "1639867342",
    "name": "محطة نزاركو للمحروقات",
    "provider": "Independent",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة نزاركو للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4881098,
    "lng": 36.7020695
  },
  {
    "id": "1674800940",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.740487,
    "lng": 35.2135739
  },
  {
    "id": "1698789507",
    "name": "Petrol Station",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "Petrol Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5140125,
    "lng": 35.0046412
  },
  {
    "id": "1702297274",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1694248,
    "lng": 34.9572356
  },
  {
    "id": "1717626730",
    "name": "دور ألون",
    "provider": "دور ألون",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "دور ألون",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8164331,
    "lng": 35.1527761
  },
  {
    "id": "1717762515",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8570071,
    "lng": 35.1729134
  },
  {
    "id": "1717762543",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8587835,
    "lng": 35.1748376
  },
  {
    "id": "1765638668",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8698567,
    "lng": 35.9849037
  },
  {
    "id": "1779259842",
    "name": "Beer Miriam",
    "provider": "Independent",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Beer Miriam",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7853602,
    "lng": 35.5352237
  },
  {
    "id": "1784466042",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1837215,
    "lng": 35.7080333
  },
  {
    "id": "1799170214",
    "name": "محطة العابد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة العابد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3730917,
    "lng": 36.2504748
  },
  {
    "id": "1800455245",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3807785,
    "lng": 36.2568658
  },
  {
    "id": "1820897751",
    "name": "دروشة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "دروشة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.376771,
    "lng": 36.1157674
  },
  {
    "id": "1824770361",
    "name": "كازية عمورة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية عمورة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3465052,
    "lng": 36.2591261
  },
  {
    "id": "1824771244",
    "name": "محطة العابد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة العابد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3441364,
    "lng": 36.2588224
  },
  {
    "id": "1824837171",
    "name": "قريبة على الجامعة الاوربية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "قريبة على الجامعة الاوربية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1598257,
    "lng": 36.3082824
  },
  {
    "id": "1824852755",
    "name": "جباب ( الاستراد)",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "جباب ( الاستراد)",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1188779,
    "lng": 36.2966577
  },
  {
    "id": "1824894364",
    "name": "طرق الصنمين القنية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "طرق الصنمين القنية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.0345239,
    "lng": 36.1816528
  },
  {
    "id": "1824908046",
    "name": "غباغب",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "غباغب",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1716945,
    "lng": 36.2208935
  },
  {
    "id": "1824915986",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2677299,
    "lng": 36.2237211
  },
  {
    "id": "1825151856",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.9052822,
    "lng": 36.1681988
  },
  {
    "id": "1842229889",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2539372,
    "lng": 35.2079718
  },
  {
    "id": "1874172450",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7425827,
    "lng": 35.2136911
  },
  {
    "id": "1913266973",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7497141,
    "lng": 35.2060019
  },
  {
    "id": "1923544302",
    "name": "كازية اللوزي",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "شارع أبو نصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0332273,
    "lng": 35.8630495
  },
  {
    "id": "1923638493",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "بيرين - شفا بدران",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0626776,
    "lng": 35.9145264
  },
  {
    "id": "2159355468",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8892251,
    "lng": 36.8350558
  },
  {
    "id": "2239372930",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.707054,
    "lng": 34.9484301
  },
  {
    "id": "2295612668",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9967983,
    "lng": 36.2146587
  },
  {
    "id": "2300539175",
    "name": "Alon Daron",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Alon Daron",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7054479,
    "lng": 35.4100376
  },
  {
    "id": "2300539247",
    "name": "Better Place",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Better Place",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.705412,
    "lng": 35.4102841
  },
  {
    "id": "2357661140",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2661224,
    "lng": 34.9306359
  },
  {
    "id": "2450653718",
    "name": "Almanaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "Almanaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.544117,
    "lng": 35.8583233
  },
  {
    "id": "2493197948",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3803251,
    "lng": 35.0175052
  },
  {
    "id": "2511406651",
    "name": "كازية نايفة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية نايفة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2201461,
    "lng": 36.6086231
  },
  {
    "id": "2513159520",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.6993692,
    "lng": 35.2657703
  },
  {
    "id": "2528846654",
    "name": "Jo Petrol",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "King's Highway",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.518598,
    "lng": 35.5391428
  },
  {
    "id": "2528846750",
    "name": "Total",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.8260944,
    "lng": 35.3323414
  },
  {
    "id": "2528846751",
    "name": "Al Manaser",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "Al Manaser",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5674764,
    "lng": 35.0530081
  },
  {
    "id": "2528846752",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.0466008,
    "lng": 35.4830092
  },
  {
    "id": "2528846753",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.1824517,
    "lng": 35.6796424
  },
  {
    "id": "2528846779",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6069623,
    "lng": 36.0014269
  },
  {
    "id": "2528846781",
    "name": "جوبترول (JoPetrol) - محطة وقود",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "جوبترول (JoPetrol) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6781145,
    "lng": 35.9654382
  },
  {
    "id": "2528846787",
    "name": "كازية المناصير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "كازية المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.872387,
    "lng": 35.9314055
  },
  {
    "id": "2528846788",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8745672,
    "lng": 35.9321073
  },
  {
    "id": "2529372954",
    "name": "توتال (TotalEnergies) - محطة وقود",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "توتال (TotalEnergies) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2570079,
    "lng": 35.8873393
  },
  {
    "id": "2529372957",
    "name": "توتال (TotalEnergies) - محطة وقود",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "توتال (TotalEnergies) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1751634,
    "lng": 35.8523526
  },
  {
    "id": "2536144014",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "السلط",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0537092,
    "lng": 35.7424989
  },
  {
    "id": "2536144015",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1462034,
    "lng": 35.6188429
  },
  {
    "id": "2536144024",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8778367,
    "lng": 35.6213637
  },
  {
    "id": "2536144034",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8597727,
    "lng": 35.8009783
  },
  {
    "id": "2536144035",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8450909,
    "lng": 35.8337406
  },
  {
    "id": "2536144036",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8109378,
    "lng": 35.8220328
  },
  {
    "id": "2591899713",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2655911,
    "lng": 35.7682527
  },
  {
    "id": "2594336863",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5943941,
    "lng": 35.2366786
  },
  {
    "id": "2607761305",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3488267,
    "lng": 36.3817896
  },
  {
    "id": "2607845171",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.964589,
    "lng": 36.6077967
  },
  {
    "id": "2610147988",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7935956,
    "lng": 35.1879396
  },
  {
    "id": "2619650271",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7876123,
    "lng": 35.1804744
  },
  {
    "id": "2666699933",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5428555,
    "lng": 35.1318256
  },
  {
    "id": "2707183551",
    "name": "Sabbouri",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Sabbouri",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3815637,
    "lng": 35.4830217
  },
  {
    "id": "2707193101",
    "name": "Al Aytam",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Al Aytam",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.390414,
    "lng": 35.4899484
  },
  {
    "id": "2883772125",
    "name": "المناصير",
    "provider": "المناصير (Manaseer)",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "شارع الشريف ناصر بن جميل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9728842,
    "lng": 35.8862154
  },
  {
    "id": "2919879531",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6039191,
    "lng": 35.2809754
  },
  {
    "id": "3057054133",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3502553,
    "lng": 34.9953993
  },
  {
    "id": "3255400344",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5036258,
    "lng": 35.8758563
  },
  {
    "id": "3255400346",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6364673,
    "lng": 35.8383099
  },
  {
    "id": "3255400347",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4235162,
    "lng": 35.9499885
  },
  {
    "id": "3312004671",
    "name": "محطة الفحاط",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الفحاط",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6753136,
    "lng": 38.6840227
  },
  {
    "id": "3312004672",
    "name": "هلهول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "هلهول",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6748079,
    "lng": 38.6607373
  },
  {
    "id": "3414084235",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2331054,
    "lng": 34.9739532
  },
  {
    "id": "3491343950",
    "name": "محطة سنيريا للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة سنيريا للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1279701,
    "lng": 35.0535736
  },
  {
    "id": "3565294395",
    "name": "محطة محروقات الهدى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات الهدى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3083739,
    "lng": 35.3318434
  },
  {
    "id": "3620986553",
    "name": "كازية المناصير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "كازية المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7619525,
    "lng": 35.9400581
  },
  {
    "id": "3785045324",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7854466,
    "lng": 35.2290292
  },
  {
    "id": "3896076222",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8287427,
    "lng": 35.5119014
  },
  {
    "id": "3946313057",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.5514248,
    "lng": 35.7998234
  },
  {
    "id": "3983274395",
    "name": "كازية الخلايلة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "بهاء الدين عبد الله",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0621539,
    "lng": 36.0740931
  },
  {
    "id": "3986934807",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0674813,
    "lng": 36.0763593
  },
  {
    "id": "3987069903",
    "name": "جوبترول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "الشريف عبد الحميد شرف",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0779557,
    "lng": 36.0740393
  },
  {
    "id": "3992541262",
    "name": "توتال",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "توتال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0574216,
    "lng": 36.1505012
  },
  {
    "id": "3992597317",
    "name": "محطة بن سرداح",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "محطة بن سرداح",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.052921,
    "lng": 36.0844691
  },
  {
    "id": "3999533376",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "بهاء الدين عبد الله",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0585627,
    "lng": 36.07899
  },
  {
    "id": "4038442655",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7074576,
    "lng": 35.1468933
  },
  {
    "id": "4099908492",
    "name": "كازية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2926397,
    "lng": 35.25398
  },
  {
    "id": "4100096690",
    "name": "كازية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Bait Imrin-Yasid",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2928733,
    "lng": 35.2535917
  },
  {
    "id": "4107546497",
    "name": "محطة وقود سيلة الظهر",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Nablus-Jenin Road",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3221477,
    "lng": 35.1935762
  },
  {
    "id": "4136972713",
    "name": "المناصير للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "المناصير للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3192809,
    "lng": 36.2323334
  },
  {
    "id": "4144394497",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8547665,
    "lng": 35.2147672
  },
  {
    "id": "4153733096",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.4697898,
    "lng": 35.2906772
  },
  {
    "id": "4167747215",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6191358,
    "lng": 35.116365
  },
  {
    "id": "4169720092",
    "name": "الشركة المتحدة للغاز",
    "provider": "United Gas",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Al-Shuhadaa Street",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4466418,
    "lng": 35.2616288
  },
  {
    "id": "4169803594",
    "name": "Kofr Kod station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Burken - Yaabad Main street",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4562648,
    "lng": 35.255739
  },
  {
    "id": "4170163918",
    "name": "محطة النفاع للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة النفاع للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4587908,
    "lng": 35.2997615
  },
  {
    "id": "4172942008",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.128691,
    "lng": 36.0653168
  },
  {
    "id": "4172942035",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.026733,
    "lng": 35.8355608
  },
  {
    "id": "4173975709",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.8260908,
    "lng": 35.3328783
  },
  {
    "id": "4193623962",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6618517,
    "lng": 35.7828433
  },
  {
    "id": "4193625857",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.169841,
    "lng": 35.7295959
  },
  {
    "id": "4193626866",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.3129994,
    "lng": 35.7437685
  },
  {
    "id": "4193626867",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6291721,
    "lng": 35.7678387
  },
  {
    "id": "4193627015",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.6816765,
    "lng": 35.6230651
  },
  {
    "id": "4193627016",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2155021,
    "lng": 35.7378816
  },
  {
    "id": "4193627017",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5109399,
    "lng": 35.7832757
  },
  {
    "id": "4193627089",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7011742,
    "lng": 35.7922555
  },
  {
    "id": "4208272691",
    "name": "محطة المناصير للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة المناصير للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.9297948,
    "lng": 36.1278377
  },
  {
    "id": "4217307398",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.0462725,
    "lng": 35.5704379
  },
  {
    "id": "4218385591",
    "name": "المناصير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4235096,
    "lng": 35.9503067
  },
  {
    "id": "4220680910",
    "name": "المناصير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0703334,
    "lng": 36.0982426
  },
  {
    "id": "4225072694",
    "name": "ابو جبنه",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "שועפט",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8152009,
    "lng": 35.2287904
  },
  {
    "id": "4232939392",
    "name": "جوبترول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "الفاروق",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.072493,
    "lng": 36.0816398
  },
  {
    "id": "4236745089",
    "name": "محطة محروقات الزبابدة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات الزبابدة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3933191,
    "lng": 35.3211993
  },
  {
    "id": "4247715589",
    "name": "كازية الخواجا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية الخواجا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9061129,
    "lng": 35.1655853
  },
  {
    "id": "4265534710",
    "name": "توتال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "طريق بيرين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.066286,
    "lng": 36.0601459
  },
  {
    "id": "4271387762",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5483418,
    "lng": 35.1386713
  },
  {
    "id": "4277679489",
    "name": "شركه محروقات الزبابده جنين الحديثه",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركه محروقات الزبابده جنين الحديثه",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3929872,
    "lng": 35.3209039
  },
  {
    "id": "4280768316",
    "name": "محطة الزعبي للمحروقات 1",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة الزعبي للمحروقات 1",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6124319,
    "lng": 35.8622746
  },
  {
    "id": "4281283832",
    "name": "جوبترول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "الشهيد وصفي التل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0441345,
    "lng": 36.0841415
  },
  {
    "id": "4281305648",
    "name": "المناصير للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "بيرين - شفا بدران",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0916926,
    "lng": 35.9433288
  },
  {
    "id": "4283498690",
    "name": "محطة الحزام",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الحزام",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.416048,
    "lng": 36.140526
  },
  {
    "id": "4288732991",
    "name": "الأيتام",
    "provider": "الأيتام",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الأيتام",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1373475,
    "lng": 35.4273057
  },
  {
    "id": "4303475368",
    "name": "Nabali Gas Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Nabali Gas Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8886864,
    "lng": 35.2117356
  },
  {
    "id": "4306962439",
    "name": "توتال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "توتال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0652311,
    "lng": 36.0915152
  },
  {
    "id": "4315410309",
    "name": "محطة محروقات الهدى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شارع حيفا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2358194,
    "lng": 35.2343212
  },
  {
    "id": "4315420261",
    "name": "محطة محروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2213181,
    "lng": 35.2613149
  },
  {
    "id": "4319671489",
    "name": "ماجدة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "بيرين - شفا بدران",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0903517,
    "lng": 35.93542
  },
  {
    "id": "4327707895",
    "name": "كازية الأمل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية الأمل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6871291,
    "lng": 36.5908411
  },
  {
    "id": "4341082557",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6012635,
    "lng": 35.3942156
  },
  {
    "id": "4346273092",
    "name": "محطة المناصير للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة المناصير للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5164299,
    "lng": 35.8715898
  },
  {
    "id": "4346614193",
    "name": "المناصير للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "الفاروق",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0748542,
    "lng": 36.0779495
  },
  {
    "id": "4350884429",
    "name": "قصر الجبل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "قصر الجبل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0897221,
    "lng": 35.8953997
  },
  {
    "id": "4357368363",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7868468,
    "lng": 35.3126939
  },
  {
    "id": "4369861089",
    "name": "المتحدة للغاز - غاز ابو أمير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "المتحدة للغاز - غاز ابو أمير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4267255,
    "lng": 35.3659174
  },
  {
    "id": "4429726906",
    "name": "كازية الأنوار للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية الأنوار للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.518219,
    "lng": 35.0183928
  },
  {
    "id": "4462933289",
    "name": "شركة الحسونة للتجارة العامة .. محروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Nablus Street",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3200483,
    "lng": 35.0429643
  },
  {
    "id": "4462933490",
    "name": "الزيناتي للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Nablus-Tulkarm Road",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3167591,
    "lng": 35.0793329
  },
  {
    "id": "4464361593",
    "name": "شركة ابناء جميل صبري خلف لتجارة المحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة ابناء جميل صبري خلف لتجارة المحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8553017,
    "lng": 35.4567182
  },
  {
    "id": "4464493593",
    "name": "محطة الهدى للمحروقات - بيت عور التحتا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهدى للمحروقات - بيت عور التحتا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8944302,
    "lng": 35.0893762
  },
  {
    "id": "4464532191",
    "name": "محطة الهدى للمحروقات - الماصيون",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهدى للمحروقات - الماصيون",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.885395,
    "lng": 35.1991101
  },
  {
    "id": "4464564789",
    "name": "محطة الهدى للمحروقات - البالوع",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الهدى للمحروقات - البالوع",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9231298,
    "lng": 35.219772
  },
  {
    "id": "4478603694",
    "name": "محطة بيرزيت للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة بيرزيت للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9700184,
    "lng": 35.1934265
  },
  {
    "id": "4485092790",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7040285,
    "lng": 35.2215353
  },
  {
    "id": "4513279690",
    "name": "محطة غاز",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة غاز",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6989416,
    "lng": 35.2972282
  },
  {
    "id": "4538184401",
    "name": "محطة وقود القنيطرة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود القنيطرة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1935843,
    "lng": 35.9191547
  },
  {
    "id": "4571079289",
    "name": "كازية النمر",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Baghdad Street",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4672793,
    "lng": 35.2973352
  },
  {
    "id": "4579056995",
    "name": "مركز شحن المياه",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "مركز شحن المياه",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.4865132,
    "lng": 35.2315645,
    "pricePerKwh": 0.12
  },
  {
    "id": "4579119990",
    "name": "محطة محروقات الثمينات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة محروقات الثمينات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.488687,
    "lng": 35.2361337
  },
  {
    "id": "4588215690",
    "name": "مركز شحن الكهرباء - محطة شحن",
    "provider": "مركز شحن الكهرباء",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "مركز شحن الكهرباء - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.3377721,
    "lng": 35.0322545,
    "pricePerKwh": 0.12
  },
  {
    "id": "4597703491",
    "name": "محطه الزينات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه الزينات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.31094,
    "lng": 35.0361437
  },
  {
    "id": "4609454892",
    "name": "خالد ابوالحسن",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "خالد ابوالحسن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4672968,
    "lng": 35.2902539
  },
  {
    "id": "4617643192",
    "name": "محطة توتال",
    "provider": "غسيل سيارات تعبئة زيوت",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "محطة توتال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5471574,
    "lng": 35.002113
  },
  {
    "id": "4617643193",
    "name": "العقبة الأولى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "العقبة الأولى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5238987,
    "lng": 35.0042507
  },
  {
    "id": "4617737400",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.1927116,
    "lng": 35.7235935
  },
  {
    "id": "4617737700",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2183655,
    "lng": 35.7402608
  },
  {
    "id": "4617737796",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.1972955,
    "lng": 35.7349265
  },
  {
    "id": "4617737890",
    "name": "محطة وقود ابو تايه",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "محطة وقود ابو تايه",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2001075,
    "lng": 35.7276559
  },
  {
    "id": "4617738092",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.20649,
    "lng": 35.7335646
  },
  {
    "id": "4708508883",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3134322,
    "lng": 34.9643612
  },
  {
    "id": "4713323492",
    "name": "الرؤى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الرؤى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0762404,
    "lng": 35.1036034
  },
  {
    "id": "4720632789",
    "name": "محطة الخواجا للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الخواجا للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1671663,
    "lng": 35.5290771
  },
  {
    "id": "4721050689",
    "name": "JSC - محطة شحن",
    "provider": "JSC",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "JSC - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.3181202,
    "lng": 35.0858607,
    "pricePerKwh": 0.12
  },
  {
    "id": "4730435834",
    "name": "محطة المجتبى",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة المجتبى",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1464016,
    "lng": 35.4083889
  },
  {
    "id": "4741455128",
    "name": "الارسال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Ein Sinia",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9644948,
    "lng": 35.2286913
  },
  {
    "id": "4742581921",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8421421,
    "lng": 35.2404256
  },
  {
    "id": "4748858627",
    "name": "غاز الجسر",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "غاز الجسر",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2259244,
    "lng": 35.262883
  },
  {
    "id": "4796079223",
    "name": "كازية داليا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية داليا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7642052,
    "lng": 35.2844025
  },
  {
    "id": "4802958421",
    "name": "محطة محروقات جبع",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Nablus-Jenin Road",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3382887,
    "lng": 35.2042098
  },
  {
    "id": "4838535321",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Ramalla-Nablus Road",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1378471,
    "lng": 35.2577838
  },
  {
    "id": "4893664723",
    "name": "محطه ابو عمشه للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه ابو عمشه للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1910461,
    "lng": 34.9657671
  },
  {
    "id": "4966260763",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.809611,
    "lng": 35.0690943
  },
  {
    "id": "4968989221",
    "name": "Sinjil gas station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Sinjil gas station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0407172,
    "lng": 35.2624473
  },
  {
    "id": "4976038228",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9343591,
    "lng": 35.2212321
  },
  {
    "id": "5052046921",
    "name": "Caral",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Caral",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3751281,
    "lng": 35.4811753
  },
  {
    "id": "5064366221",
    "name": "محطة الإرسال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الإرسال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9653561,
    "lng": 35.2275275
  },
  {
    "id": "5088608461",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "דרך ארז",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2183158,
    "lng": 35.6256918
  },
  {
    "id": "5107136422",
    "name": "Manasser gas station - محطة شحن",
    "provider": "Manasser gas station",
    "type": "EV_ONLY",
    "city": "عمان",
    "address": "Manasser gas station - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.9799752,
    "lng": 35.9021647,
    "pricePerKwh": 0.12
  },
  {
    "id": "5107143525",
    "name": "كازية المناصير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "كازية المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9800786,
    "lng": 35.9022216
  },
  {
    "id": "5139675688",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7799104,
    "lng": 35.198991
  },
  {
    "id": "5229196323",
    "name": "محطه وقود الكاظم",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه وقود الكاظم",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.441209,
    "lng": 35.0852445
  },
  {
    "id": "5231191423",
    "name": "كزية حمزة ابو علان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كزية حمزة ابو علان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4167694,
    "lng": 34.9825974
  },
  {
    "id": "5240179622",
    "name": "عمر السارا زكارنة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "عمر السارا زكارنة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4116998,
    "lng": 35.2764881
  },
  {
    "id": "5259606121",
    "name": "محطة الفوار لتعبئة الوقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الفوار لتعبئة الوقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4855481,
    "lng": 35.0561092
  },
  {
    "id": "5293869022",
    "name": "جبع للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "جبع للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3385792,
    "lng": 35.2048611
  },
  {
    "id": "5298946450",
    "name": "محطة غاز ألون إعبلين",
    "provider": "ألون",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة غاز ألون إعبلين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8290269,
    "lng": 35.1819266
  },
  {
    "id": "5298946451",
    "name": "محطة وقود ستار",
    "provider": "ستار",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود ستار",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8265049,
    "lng": 35.1745291
  },
  {
    "id": "5298946452",
    "name": "ديزول",
    "provider": "ديزول",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "ديزول",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8155525,
    "lng": 35.1890318
  },
  {
    "id": "5304978753",
    "name": "الشني للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الشني للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8884616,
    "lng": 35.4338727
  },
  {
    "id": "5341187721",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1764485,
    "lng": 34.9797961
  },
  {
    "id": "5341187821",
    "name": "كزية تحسين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كزية تحسين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.183773,
    "lng": 35.0295623
  },
  {
    "id": "5343414821",
    "name": "شركة مسير للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Amman Street",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2142697,
    "lng": 35.281076
  },
  {
    "id": "5390483644",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.986977,
    "lng": 35.7067041
  },
  {
    "id": "5403512310",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6646754,
    "lng": 38.6514025
  },
  {
    "id": "5403512491",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6392472,
    "lng": 38.6283973
  },
  {
    "id": "5403741760",
    "name": "FUELAX",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "FUELAX",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4542161,
    "lng": 37.1470508
  },
  {
    "id": "5404991915",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.9163323,
    "lng": 37.741659
  },
  {
    "id": "5405035355",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.6499632,
    "lng": 38.0761599
  },
  {
    "id": "5405843962",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "العقبة",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.5024449,
    "lng": 35.092105
  },
  {
    "id": "5447710025",
    "name": "كازية باب الواد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية باب الواد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8785004,
    "lng": 35.2166664
  },
  {
    "id": "5513838318",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2249215,
    "lng": 35.4707319
  },
  {
    "id": "5526373121",
    "name": "شيبة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شيبة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.4202242,
    "lng": 38.5756619
  },
  {
    "id": "5567669561",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.885927,
    "lng": 38.5804661
  },
  {
    "id": "5567787997",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.0292143,
    "lng": 38.3105361
  },
  {
    "id": "5567830044",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.8050318,
    "lng": 38.9096083
  },
  {
    "id": "5567874750",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.4257614,
    "lng": 38.3976671
  },
  {
    "id": "5567907223",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.5354536,
    "lng": 38.1795544
  },
  {
    "id": "5575492021",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Ya'bad",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4429293,
    "lng": 35.176251
  },
  {
    "id": "5606545673",
    "name": "محطه وقود سال للمحروقات",
    "provider": "جوبترول",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "الرئيسي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5709529,
    "lng": 35.9104901
  },
  {
    "id": "5606636768",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5679311,
    "lng": 36.0178939
  },
  {
    "id": "5606636770",
    "name": "كازية المصري",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "كازية المصري",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.566163,
    "lng": 36.015287
  },
  {
    "id": "5608683889",
    "name": "محطة وقود - توتال",
    "provider": "توتال",
    "type": "PETROL_ONLY",
    "city": "السلط",
    "address": "محطة وقود - توتال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0790949,
    "lng": 35.7153118
  },
  {
    "id": "5608683902",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "السلط",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0602031,
    "lng": 35.7458238
  },
  {
    "id": "5728440367",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5998012,
    "lng": 35.261259
  },
  {
    "id": "5760149796",
    "name": "جلف (Gulf) - محطة وقود",
    "provider": "جلف (Gulf)",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "جلف (Gulf) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2693844,
    "lng": 35.8868644
  },
  {
    "id": "5760149800",
    "name": "المناصير (Manaseer) - محطة وقود",
    "provider": "المناصير (Manaseer)",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "المناصير (Manaseer) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2864863,
    "lng": 35.8282139
  },
  {
    "id": "5760149801",
    "name": "جوبترول (JoPetrol) - محطة وقود",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "جوبترول (JoPetrol) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2890273,
    "lng": 35.8532407
  },
  {
    "id": "5794077689",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7358401,
    "lng": 35.1918804
  },
  {
    "id": "5801749558",
    "name": "محطة المناصير",
    "provider": "AL - Manseer group",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9783138,
    "lng": 36.0131807
  },
  {
    "id": "5814197867",
    "name": "بترول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "بترول",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2831055,
    "lng": 37.398259
  },
  {
    "id": "5814197932",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1972534,
    "lng": 37.502658
  },
  {
    "id": "5814198339",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.0954046,
    "lng": 37.616216
  },
  {
    "id": "5824805053",
    "name": "كازية الحرمين( الخرابشة)",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "كازية الحرمين( الخرابشة)",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9970029,
    "lng": 35.896385
  },
  {
    "id": "5866120344",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.7739838,
    "lng": 35.2043729,
    "pricePerKwh": 0.12
  },
  {
    "id": "5893499417",
    "name": "Rozenfeld Har Yona",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Rozenfeld Har Yona",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7151719,
    "lng": 35.3368312
  },
  {
    "id": "5893938742",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.031008,
    "lng": 35.9797827
  },
  {
    "id": "5985323693",
    "name": "Hajnimr Tamimico",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Haifa street",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2307976,
    "lng": 35.2464404
  },
  {
    "id": "6000980762",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6090105,
    "lng": 35.6105591
  },
  {
    "id": "6001009034",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4344704,
    "lng": 35.5933519
  },
  {
    "id": "6054162511",
    "name": "جوبترول (JoPetrol) - محطة وقود",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "جوبترول (JoPetrol) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1978698,
    "lng": 36.6812427
  },
  {
    "id": "6054163161",
    "name": "جوبترول (JoPetrol) - محطة وقود",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "جوبترول (JoPetrol) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1645828,
    "lng": 36.2206578
  },
  {
    "id": "6054163197",
    "name": "جوبترول (JoPetrol) - محطة وقود",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "جوبترول (JoPetrol) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2699162,
    "lng": 36.446811
  },
  {
    "id": "6076514985",
    "name": "Manaster station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Manaster station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1443766,
    "lng": 35.610784
  },
  {
    "id": "6076791419",
    "name": "Basma Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Basma Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2381663,
    "lng": 35.2444781
  },
  {
    "id": "6076791421",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2522003,
    "lng": 35.225172
  },
  {
    "id": "6145754885",
    "name": "محطه بنزين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه بنزين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0681384,
    "lng": 35.2491289
  },
  {
    "id": "6207381389",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3950511,
    "lng": 35.419206
  },
  {
    "id": "6265111486",
    "name": "محطة المهرمس",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة المهرمس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.1906368,
    "lng": 38.2226843
  },
  {
    "id": "6265111488",
    "name": "محطة الفيصل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الفيصل",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.5031258,
    "lng": 38.2103351
  },
  {
    "id": "6328875392",
    "name": "كازية نجها",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية نجها",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3939716,
    "lng": 36.3759857
  },
  {
    "id": "6383632585",
    "name": "Petrol Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Petrol Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4453475,
    "lng": 35.4830296
  },
  {
    "id": "6383632586",
    "name": "Petrol Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Petrol Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4465228,
    "lng": 35.4834348
  },
  {
    "id": "6383632587",
    "name": "Petrol Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Petrol Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9466479,
    "lng": 35.4697117
  },
  {
    "id": "6395887599",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2397794,
    "lng": 35.6795208
  },
  {
    "id": "6432599753",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4482621,
    "lng": 35.4831518
  },
  {
    "id": "6432600090",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4430622,
    "lng": 35.4840675
  },
  {
    "id": "6432600093",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9465717,
    "lng": 35.4696671
  },
  {
    "id": "6444039967",
    "name": "جوبترول",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "شارع العرب",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0478132,
    "lng": 35.8903143
  },
  {
    "id": "6459616223",
    "name": "جوبترول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "جوبترول",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9944419,
    "lng": 35.8965585
  },
  {
    "id": "6462578933",
    "name": "بن عودة",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "شارع الملكة رانيا العبد الله",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9903421,
    "lng": 35.8934424
  },
  {
    "id": "6483544424",
    "name": "كورال",
    "provider": "كورال",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كورال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3052923,
    "lng": 35.2365124
  },
  {
    "id": "6486715697",
    "name": "جوبترول",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "شارع الاستقلال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9756094,
    "lng": 35.9311724
  },
  {
    "id": "6486804193",
    "name": "توتال",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "توتال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9941576,
    "lng": 35.9904867
  },
  {
    "id": "6488469094",
    "name": "Suboh Gas Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "شارع البطحاء",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9764626,
    "lng": 35.9471597
  },
  {
    "id": "6497743985",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.6524432,
    "lng": 35.2118433
  },
  {
    "id": "6574950561",
    "name": "Al Qatranah Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Queen Alia Airport Road",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.2764442,
    "lng": 36.0546318,
    "pricePerKwh": 0.12
  },
  {
    "id": "6576487391",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7513845,
    "lng": 36.302619
  },
  {
    "id": "6576504685",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7516474,
    "lng": 36.2824224
  },
  {
    "id": "6577216443",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3154561,
    "lng": 35.564721
  },
  {
    "id": "6582663196",
    "name": "جوبترول (JoPetrol) - محطة وقود",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "King's Highway",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.3230455,
    "lng": 35.4870287
  },
  {
    "id": "6587297768",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2419853,
    "lng": 35.3348583
  },
  {
    "id": "6612543086",
    "name": "باطون مواسي - محطة شحن",
    "provider": "باطون مواسي",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "باطون مواسي - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.2409976,
    "lng": 35.2016759,
    "pricePerKwh": 0.12
  },
  {
    "id": "6665542685",
    "name": "New Sim Entrance",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "New Sim Entrance",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0437971,
    "lng": 36.1128924
  },
  {
    "id": "6774403175",
    "name": "محطة توتال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة توتال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9123089,
    "lng": 35.9385285
  },
  {
    "id": "6774441611",
    "name": "محطة جوبترول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة جوبترول",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9181601,
    "lng": 35.9388084
  },
  {
    "id": "6779336085",
    "name": "Qoseen gas station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Qoseen gas station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2369669,
    "lng": 35.1978222
  },
  {
    "id": "6853066882",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4958936,
    "lng": 35.9137997
  },
  {
    "id": "6920417224",
    "name": "Manaseer Express",
    "provider": "المناصير (Manaseer)",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "Manaseer Express",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7268667,
    "lng": 35.7914769
  },
  {
    "id": "6988587487",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7513708,
    "lng": 36.2024044
  },
  {
    "id": "6995380486",
    "name": "الشعب",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الشعب",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6290339,
    "lng": 36.1050375
  },
  {
    "id": "7003038385",
    "name": "محطة وقود ابو سالم",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود ابو سالم",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8457773,
    "lng": 36.2178436
  },
  {
    "id": "7052042874",
    "name": "وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.3320306,
    "lng": 34.9511142
  },
  {
    "id": "7055830834",
    "name": "محطة مغير السرحان Total",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة مغير السرحان Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4768956,
    "lng": 36.2044479
  },
  {
    "id": "7055846157",
    "name": "كازية مغير السرحان",
    "provider": "جوبترول",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية مغير السرحان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4702519,
    "lng": 36.1980992
  },
  {
    "id": "7055865939",
    "name": "المناصير مغير السرحان",
    "provider": "المناصير",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "المناصير مغير السرحان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4596845,
    "lng": 36.2114795
  },
  {
    "id": "7096151699",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.6542698,
    "lng": 35.2140077
  },
  {
    "id": "7112036892",
    "name": "طوطال",
    "provider": "طوطال",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "طوطال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0445689,
    "lng": 36.083705
  },
  {
    "id": "7146504498",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.1198855,
    "lng": 35.0537371
  },
  {
    "id": "7184073930",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1029142,
    "lng": 35.69792
  },
  {
    "id": "7184099025",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1011752,
    "lng": 35.6968496
  },
  {
    "id": "7184112655",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.8229251,
    "lng": 35.5866895
  },
  {
    "id": "7184114005",
    "name": "Joe Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Joe Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1617359,
    "lng": 35.6994086
  },
  {
    "id": "7184115761",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.7811464,
    "lng": 35.5976149
  },
  {
    "id": "7184120268",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.0720509,
    "lng": 35.694918
  },
  {
    "id": "7184121791",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.8360314,
    "lng": 35.6112724
  },
  {
    "id": "7184122707",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.8354839,
    "lng": 35.6124263
  },
  {
    "id": "7245769366",
    "name": "إي بي تي",
    "provider": "إي بي تي",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "إي بي تي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1458721,
    "lng": 35.4078144
  },
  {
    "id": "7245790138",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2185598,
    "lng": 35.2843577
  },
  {
    "id": "7245801455",
    "name": "إي بي تي",
    "provider": "إي بي تي",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "إي بي تي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1664342,
    "lng": 35.3380233
  },
  {
    "id": "7245810217",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1311477,
    "lng": 35.4178539
  },
  {
    "id": "7245813598",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1137968,
    "lng": 35.4077581
  },
  {
    "id": "7251513990",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2758234,
    "lng": 35.2731514
  },
  {
    "id": "7251534159",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3618768,
    "lng": 35.5931926
  },
  {
    "id": "7251540930",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2362759,
    "lng": 35.3434923
  },
  {
    "id": "7282312583",
    "name": "Total",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5326982,
    "lng": 35.8521426
  },
  {
    "id": "7347345101",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.291297,
    "lng": 35.2549365
  },
  {
    "id": "7350250817",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6722,
    "lng": 38.6955
  },
  {
    "id": "7352121359",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3387367,
    "lng": 35.3365132
  },
  {
    "id": "7355079408",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3242358,
    "lng": 35.3844719
  },
  {
    "id": "7355114428",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3144519,
    "lng": 35.2600971
  },
  {
    "id": "7359114583",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3774584,
    "lng": 35.3823763
  },
  {
    "id": "7363225386",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3636219,
    "lng": 35.4100728
  },
  {
    "id": "7395688374",
    "name": "إي بي تي",
    "provider": "إي بي تي",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "إي بي تي",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3647554,
    "lng": 35.2647454
  },
  {
    "id": "7399825458",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3255261,
    "lng": 35.4284661
  },
  {
    "id": "7415224684",
    "name": "مدكو",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مدكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2362444,
    "lng": 35.3602776
  },
  {
    "id": "7415273140",
    "name": "مدكو",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مدكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2746797,
    "lng": 35.2135232
  },
  {
    "id": "7415293205",
    "name": "مدكو",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مدكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2976014,
    "lng": 35.2743155
  },
  {
    "id": "7419176831",
    "name": "Phoenicia",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Phoenicia",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3799176,
    "lng": 35.4911453
  },
  {
    "id": "7419250242",
    "name": "Phoenicia",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Phoenicia",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3848942,
    "lng": 35.395259
  },
  {
    "id": "7419273047",
    "name": "مدكو",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مدكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.0806309,
    "lng": 35.3672647
  },
  {
    "id": "7419279139",
    "name": "مدكو",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مدكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1002196,
    "lng": 35.3948513
  },
  {
    "id": "7419279816",
    "name": "مدكو",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مدكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1764833,
    "lng": 35.4157457
  },
  {
    "id": "7419284362",
    "name": "مدكو",
    "provider": "Medco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مدكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2732378,
    "lng": 35.4328635
  },
  {
    "id": "7448327382",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.3767,
    "lng": 37.5812
  },
  {
    "id": "7448386108",
    "name": "محطة وقود الحماد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود الحماد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.425,
    "lng": 37.9804
  },
  {
    "id": "7448389608",
    "name": "وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.3720187,
    "lng": 37.6021027
  },
  {
    "id": "7448391049",
    "name": "محطة وقود الشعلان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود الشعلان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6163,
    "lng": 38.6086
  },
  {
    "id": "7448391159",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4263,
    "lng": 37.9809
  },
  {
    "id": "7448408878",
    "name": "محطة وقود طريف",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود طريف",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.6625,
    "lng": 38.6469
  },
  {
    "id": "7455010492",
    "name": "Hypco",
    "provider": "Hypco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hypco",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1344674,
    "lng": 35.2293751
  },
  {
    "id": "7455020453",
    "name": "Hypco",
    "provider": "Hypco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hypco",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2233347,
    "lng": 35.3112763
  },
  {
    "id": "7455020593",
    "name": "Hypco",
    "provider": "Hypco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hypco",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2455318,
    "lng": 35.3153881
  },
  {
    "id": "7455024157",
    "name": "Hypco",
    "provider": "Hypco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hypco",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3391603,
    "lng": 35.4310986
  },
  {
    "id": "7455032311",
    "name": "Hypco",
    "provider": "Hypco",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hypco",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3748579,
    "lng": 35.3698826
  },
  {
    "id": "7510039185",
    "name": "GAZ - محطة شحن",
    "provider": "GAZ",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "GAZ - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 29.1134148,
    "lng": 35.3966282,
    "pricePerKwh": 0.12
  },
  {
    "id": "7514418084",
    "name": "محطة توتال المقابلين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة توتال المقابلين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9155123,
    "lng": 35.9109505
  },
  {
    "id": "7535889556",
    "name": "الدريس",
    "provider": "ALDREES",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الدريس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.6804,
    "lng": 38.7649
  },
  {
    "id": "7537626097",
    "name": "المناصير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.113674,
    "lng": 35.8665003
  },
  {
    "id": "7609723286",
    "name": "محطة السلمان للمحروقات ديراستيا",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة السلمان للمحروقات ديراستيا",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1233546,
    "lng": 35.1466574
  },
  {
    "id": "7681369206",
    "name": "كورال",
    "provider": "كورال",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كورال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2681711,
    "lng": 35.2011586
  },
  {
    "id": "7711091239",
    "name": "درة الشمال",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "درة الشمال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.3097,
    "lng": 34.9509
  },
  {
    "id": "7711100418",
    "name": "محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2889,
    "lng": 34.9509
  },
  {
    "id": "7711138116",
    "name": "محطة وقود الجنادرية",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود الجنادرية",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2677,
    "lng": 34.9384
  },
  {
    "id": "7725586355",
    "name": "Srour Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Srour Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2685748,
    "lng": 35.2167991
  },
  {
    "id": "7725586359",
    "name": "Safieddine",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Safieddine",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2446629,
    "lng": 35.2352958
  },
  {
    "id": "7725589689",
    "name": "Hachem Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hachem Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.258014,
    "lng": 35.2214685
  },
  {
    "id": "7875524463",
    "name": "IPT",
    "provider": "IPT",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "IPT",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2725157,
    "lng": 35.2996328
  },
  {
    "id": "7924173450",
    "name": "محطة وكازية الجنوب",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وكازية الجنوب",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5030032,
    "lng": 35.0572524
  },
  {
    "id": "7924245003",
    "name": "الدريس",
    "provider": "ALDREES",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الدريس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2320982,
    "lng": 34.9428237
  },
  {
    "id": "7924363373",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2254729,
    "lng": 34.9374679
  },
  {
    "id": "7924450137",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2393275,
    "lng": 34.9515913
  },
  {
    "id": "7924450187",
    "name": "الخليج",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الخليج",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2436885,
    "lng": 34.9449551
  },
  {
    "id": "7924450214",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2501736,
    "lng": 34.941716
  },
  {
    "id": "7924450326",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2587669,
    "lng": 34.9397115
  },
  {
    "id": "7924450720",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2733134,
    "lng": 34.9377292
  },
  {
    "id": "7924450834",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2892253,
    "lng": 34.9450658
  },
  {
    "id": "7924450873",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.2841605,
    "lng": 34.9612842
  },
  {
    "id": "7930918979",
    "name": "كهرباع لبنان صور",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "كهرباع لبنان صور",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 33.2736988,
    "lng": 35.2073855,
    "pricePerKwh": 0.12
  },
  {
    "id": "7935267155",
    "name": "Hashim",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Hashim",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3813572,
    "lng": 35.4480171
  },
  {
    "id": "7940142909",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.1598602,
    "lng": 36.0918159
  },
  {
    "id": "8084739237",
    "name": "محطة الأمانة برعشيت",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الأمانة برعشيت",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1908755,
    "lng": 35.4441021
  },
  {
    "id": "8250269680",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2045119,
    "lng": 35.4213523
  },
  {
    "id": "8263236723",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4157956,
    "lng": 35.0837573
  },
  {
    "id": "8293413860",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2165084,
    "lng": 35.7250748
  },
  {
    "id": "8328662015",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.8331139,
    "lng": 35.3958596
  },
  {
    "id": "8437372620",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.753911,
    "lng": 38.9678514
  },
  {
    "id": "8503714358",
    "name": "\"Yellow\" - محطة وقود",
    "provider": "\"Yellow\"",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "\"Yellow\" - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1023152,
    "lng": 35.2067015
  },
  {
    "id": "8515115584",
    "name": "كفر قليل",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شارع القدس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1923363,
    "lng": 35.2841481
  },
  {
    "id": "8575646318",
    "name": "Greenspot - محطة شحن",
    "provider": "Greenspot",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Greenspot - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.8241193,
    "lng": 35.0800385,
    "pricePerKwh": 0.12
  },
  {
    "id": "8738456517",
    "name": "JoPetrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "JoPetrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9273564,
    "lng": 35.8760192
  },
  {
    "id": "8739112924",
    "name": "Go",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Go",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7112324,
    "lng": 35.9500554
  },
  {
    "id": "8750284118",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7319012,
    "lng": 35.9452987
  },
  {
    "id": "8882835594",
    "name": "JoPetrol Addustor EV Charger",
    "provider": "جوبترول (JoPetrol)",
    "type": "EV_ONLY",
    "city": "عمان",
    "address": "JoPetrol Addustor EV Charger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.9991123,
    "lng": 35.8786222,
    "pricePerKwh": 0.12
  },
  {
    "id": "8882835892",
    "name": "JoPetrol Dakhelieh EV Charger",
    "provider": "جوبترول (JoPetrol)",
    "type": "EV_ONLY",
    "city": "عمان",
    "address": "JoPetrol Dakhelieh EV Charger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.9746094,
    "lng": 35.9081407,
    "pricePerKwh": 0.12
  },
  {
    "id": "8882872845",
    "name": "ION Garvity coffe house EV Charger",
    "provider": "ION",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "ION Garvity coffe house EV Charger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.1793314,
    "lng": 35.8529575,
    "pricePerKwh": 0.12
  },
  {
    "id": "8960277805",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.0720509,
    "lng": 35.694918
  },
  {
    "id": "8960295791",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.7811464,
    "lng": 35.5976149
  },
  {
    "id": "8960300457",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1011752,
    "lng": 35.6968496
  },
  {
    "id": "8960302984",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.8360314,
    "lng": 35.6112724
  },
  {
    "id": "8960303913",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.8229251,
    "lng": 35.5866895
  },
  {
    "id": "8960306520",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.8354839,
    "lng": 35.6124263
  },
  {
    "id": "8960307447",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1029142,
    "lng": 35.69792
  },
  {
    "id": "8960309824",
    "name": "Joe Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "Joe Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1617359,
    "lng": 35.6994086
  },
  {
    "id": "9065818317",
    "name": "Manaseer Express",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Manaseer Express",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9523364,
    "lng": 35.9263649
  },
  {
    "id": "9077054446",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5072771,
    "lng": 38.2017291
  },
  {
    "id": "9088123617",
    "name": "مشحمة البلد و سولار",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مشحمة البلد و سولار",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9977462,
    "lng": 35.0655213
  },
  {
    "id": "9107128917",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.9536185,
    "lng": 35.4921988,
    "pricePerKwh": 0.12
  },
  {
    "id": "9117081868",
    "name": "Afula Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Afula Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.6056254,
    "lng": 35.2930876,
    "pricePerKwh": 0.12
  },
  {
    "id": "9117081869",
    "name": "Haifa Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Haifa Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.7893647,
    "lng": 34.964761,
    "pricePerKwh": 0.12
  },
  {
    "id": "9117081871",
    "name": "Eilat Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "العقبة",
    "address": "Eilat Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 29.5656767,
    "lng": 34.9605712,
    "pricePerKwh": 0.12
  },
  {
    "id": "9158588346",
    "name": "Modi'in Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Modi'in Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.8893843,
    "lng": 34.966019,
    "pricePerKwh": 0.12
  },
  {
    "id": "9171138800",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6551304,
    "lng": 35.7897761
  },
  {
    "id": "9171371078",
    "name": "محطة معاذ عمارنة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة معاذ عمارنة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6178902,
    "lng": 35.8524548
  },
  {
    "id": "9171376743",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6549142,
    "lng": 35.8018566
  },
  {
    "id": "9171417907",
    "name": "محطة الزعبي للمحروقات  2",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة الزعبي للمحروقات  2",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6099452,
    "lng": 35.8620735
  },
  {
    "id": "9171427478",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5836712,
    "lng": 35.8775035
  },
  {
    "id": "9171432612",
    "name": "المناصير",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "المناصير",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5942483,
    "lng": 35.862006
  },
  {
    "id": "9171448245",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5757496,
    "lng": 35.8840702
  },
  {
    "id": "9171463525",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5489055,
    "lng": 35.882118
  },
  {
    "id": "9171476311",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4044296,
    "lng": 35.9473163
  },
  {
    "id": "9171482794",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3917837,
    "lng": 35.9502718
  },
  {
    "id": "9171487236",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5004783,
    "lng": 35.9657782
  },
  {
    "id": "9171496524",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3779662,
    "lng": 35.9407148
  },
  {
    "id": "9171499049",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2870441,
    "lng": 35.9138283
  },
  {
    "id": "9171505230",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4197893,
    "lng": 35.9490387
  },
  {
    "id": "9171505231",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.363701,
    "lng": 35.9236515
  },
  {
    "id": "9171528836",
    "name": "JoPetrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "JoPetrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2655122,
    "lng": 35.9058412
  },
  {
    "id": "9171530898",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.255396,
    "lng": 35.8944224
  },
  {
    "id": "9171615503",
    "name": "Mannseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "Mannseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.268131,
    "lng": 35.8896909
  },
  {
    "id": "9171745719",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 30.6743324,
    "lng": 35.6088022,
    "pricePerKwh": 0.12
  },
  {
    "id": "9171745720",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 30.6743442,
    "lng": 35.6088637,
    "pricePerKwh": 0.12
  },
  {
    "id": "9172134412",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.1025106,
    "lng": 35.8477989
  },
  {
    "id": "9172155070",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0369451,
    "lng": 35.8331075
  },
  {
    "id": "9172156858",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0847944,
    "lng": 35.83998
  },
  {
    "id": "9172164445",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0925017,
    "lng": 35.8440426
  },
  {
    "id": "9172165968",
    "name": "JO Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "JO Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0639712,
    "lng": 35.8374704
  },
  {
    "id": "9173742032",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7986766,
    "lng": 35.9301948
  },
  {
    "id": "9173742163",
    "name": "JoPetrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "JoPetrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8119337,
    "lng": 36.0104107
  },
  {
    "id": "9173758943",
    "name": "JoPetrol",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "JoPetrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8002385,
    "lng": 36.1551162
  },
  {
    "id": "9173759230",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.842655,
    "lng": 35.890281
  },
  {
    "id": "9173786044",
    "name": "Gulf",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Gulf",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8113658,
    "lng": 36.1188606
  },
  {
    "id": "9175860762",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9602657,
    "lng": 35.9309631
  },
  {
    "id": "9176582564",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.779585,
    "lng": 35.8941941
  },
  {
    "id": "9176586463",
    "name": "Manaseer",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Manaseer",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7737433,
    "lng": 35.8905445
  },
  {
    "id": "9176597135",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7239284,
    "lng": 35.8107847
  },
  {
    "id": "9177492219",
    "name": "Gulf",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "Gulf",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7172635,
    "lng": 35.8007267
  },
  {
    "id": "9177504031",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.737318,
    "lng": 35.8278185
  },
  {
    "id": "9177504032",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "مأدبا",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.7197261,
    "lng": 35.8040797
  },
  {
    "id": "9177542177",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.5625718,
    "lng": 35.6587949
  },
  {
    "id": "9177837580",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2288304,
    "lng": 36.0300998
  },
  {
    "id": "9186633003",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.0624602,
    "lng": 35.4891182
  },
  {
    "id": "9186683312",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "معان",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2642028,
    "lng": 35.743312
  },
  {
    "id": "9186731382",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.5294025,
    "lng": 35.7979178
  },
  {
    "id": "9186764017",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.594736,
    "lng": 35.8040862
  },
  {
    "id": "9186864347",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2258479,
    "lng": 36.0302127
  },
  {
    "id": "9186873389",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2719015,
    "lng": 36.0520413
  },
  {
    "id": "9252897708",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 30.7961495,
    "lng": 35.9604192,
    "pricePerKwh": 0.12
  },
  {
    "id": "9252897709",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 30.7961806,
    "lng": 35.9604433,
    "pricePerKwh": 0.12
  },
  {
    "id": "9375348915",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.6732077,
    "lng": 35.4685627
  },
  {
    "id": "9432804010",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3954293,
    "lng": 35.0449651
  },
  {
    "id": "9489431496",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.9693447,
    "lng": 35.5507569,
    "pricePerKwh": 0.12
  },
  {
    "id": "9565169967",
    "name": "Total",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "Total",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5387663,
    "lng": 35.8765662
  },
  {
    "id": "9590248862",
    "name": "TOTAL",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "TOTAL",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3122445,
    "lng": 35.7607651
  },
  {
    "id": "9591521977",
    "name": "محطه كفرنجه للوقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطه كفرنجه للوقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2988883,
    "lng": 35.7060808
  },
  {
    "id": "9592405070",
    "name": "jO PETROL",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "jO PETROL",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.653095,
    "lng": 35.744432
  },
  {
    "id": "9593980323",
    "name": "محطة جوبترول للمحروقات",
    "provider": "جوبترول (JoPetrol)",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة جوبترول للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5389479,
    "lng": 35.8031696
  },
  {
    "id": "9595258853",
    "name": "محطة وقود النعيمة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة وقود النعيمة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4177709,
    "lng": 35.9121254
  },
  {
    "id": "9603944200",
    "name": "محطة أبو شريعة",
    "provider": "Jo peteol",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة أبو شريعة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4901196,
    "lng": 35.6846945
  },
  {
    "id": "9606455132",
    "name": "محطة مخيم غزة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "محطة مخيم غزة",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.2617074,
    "lng": 35.8555137
  },
  {
    "id": "9643023813",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5388098,
    "lng": 35.8769356
  },
  {
    "id": "9649729010",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "إربد",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5191848,
    "lng": 35.8538919
  },
  {
    "id": "9739972864",
    "name": "Kiryat Shmona Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Kiryat Shmona Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 33.1925896,
    "lng": 35.5706594,
    "pricePerKwh": 0.12
  },
  {
    "id": "9747044947",
    "name": "المناصير (Manaseer) - محطة وقود",
    "provider": "المناصير (Manaseer)",
    "type": "PETROL_ONLY",
    "city": "الكرك",
    "address": "المناصير (Manaseer) - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.1654998,
    "lng": 35.7348347
  },
  {
    "id": "9752089579",
    "name": "هيبكو",
    "provider": "هيبكو",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "هيبكو",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2719607,
    "lng": 35.1987214
  },
  {
    "id": "9781037404",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 33.1742904,
    "lng": 35.6122212,
    "pricePerKwh": 0.12
  },
  {
    "id": "9781037405",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 33.1742913,
    "lng": 35.61224,
    "pricePerKwh": 0.12
  },
  {
    "id": "9859468217",
    "name": "Lobnan Al Akhdar Coral Station",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Lobnan Al Akhdar Coral Station",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.234433,
    "lng": 35.2575469
  },
  {
    "id": "9927498492",
    "name": "شركة برطعة للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "شركة برطعة للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4673752,
    "lng": 35.0900043
  },
  {
    "id": "10031830069",
    "name": "Ein Bokek Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Ein Bokek Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.1991058,
    "lng": 35.3634442,
    "pricePerKwh": 0.12
  },
  {
    "id": "10031892984",
    "name": "Tesla Destination Charger",
    "provider": "Tesla, Inc.",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Tesla Destination Charger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.7026419,
    "lng": 35.3116174,
    "pricePerKwh": 0.12
  },
  {
    "id": "10031892985",
    "name": "Tesla Destination Charger",
    "provider": "Tesla, Inc.",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Tesla Destination Charger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.7026138,
    "lng": 35.3116016,
    "pricePerKwh": 0.12
  },
  {
    "id": "10031913593",
    "name": "Tesla Destination Charger",
    "provider": "Tesla, Inc.",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Tesla Destination Charger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.8062102,
    "lng": 35.1220234,
    "pricePerKwh": 0.12
  },
  {
    "id": "10031913594",
    "name": "Tesla Destination Charger",
    "provider": "Tesla, Inc.",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Tesla Destination Charger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.8061897,
    "lng": 35.1220335,
    "pricePerKwh": 0.12
  },
  {
    "id": "10059535552",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0833914,
    "lng": 36.2293661
  },
  {
    "id": "10059535553",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "الزرقاء",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0865099,
    "lng": 36.2046154
  },
  {
    "id": "10108799217",
    "name": "كازية جرار",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "كازية جرار",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.4525491,
    "lng": 35.2978723
  },
  {
    "id": "10187203417",
    "name": "محطة الهياضلة",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Highway 80 East",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.4277419,
    "lng": 38.5243653
  },
  {
    "id": "10303571339",
    "name": "طوطال",
    "provider": "طوطال",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "طوطال",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3776734,
    "lng": 35.4633935
  },
  {
    "id": "10701086307",
    "name": "محطة وقود الايمن m&h",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة وقود الايمن m&h",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7638376,
    "lng": 39.0458886
  },
  {
    "id": "10726388112",
    "name": "Kiryat Ata Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Kiryat Ata Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.8077323,
    "lng": 35.0757674,
    "pricePerKwh": 0.12
  },
  {
    "id": "10771538519",
    "name": "Kfar Hanokdim - محطة شحن",
    "provider": "Kfar Hanokdim",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Kfar Hanokdim - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.3051992,
    "lng": 35.2687878,
    "pricePerKwh": 0.12
  },
  {
    "id": "10771538520",
    "name": "Kfar Hanokdim - محطة شحن",
    "provider": "Kfar Hanokdim",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Kfar Hanokdim - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.3052299,
    "lng": 35.268791,
    "pricePerKwh": 0.12
  },
  {
    "id": "10902344217",
    "name": "Mevaseret Zion Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Mevaseret Zion Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.8000158,
    "lng": 35.1494871,
    "pricePerKwh": 0.12
  },
  {
    "id": "10988888462",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.9184388,
    "lng": 35.1255192
  },
  {
    "id": "10988894252",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.9172493,
    "lng": 35.125595
  },
  {
    "id": "11051674052",
    "name": "TotalEnergies",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "TotalEnergies",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.1199252,
    "lng": 35.4362069
  },
  {
    "id": "11224577293",
    "name": "Modi’in Azrieli Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Modi’in Azrieli Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.8997169,
    "lng": 35.0089969,
    "pricePerKwh": 0.12
  },
  {
    "id": "11224589073",
    "name": "Eilat Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "العقبة",
    "address": "Eilat Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 29.5540588,
    "lng": 34.9666576,
    "pricePerKwh": 0.12
  },
  {
    "id": "11280625848",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.9956216,
    "lng": 35.2662153,
    "pricePerKwh": 0.12
  },
  {
    "id": "11308508704",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.7524158,
    "lng": 35.4120188
  },
  {
    "id": "11368638722",
    "name": "صبح - محطة وقود",
    "provider": "صبح",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "شارع البطحاء",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9764956,
    "lng": 35.94716
  },
  {
    "id": "11380783556",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.9067921,
    "lng": 35.0869481
  },
  {
    "id": "11443450192",
    "name": "Electromin",
    "provider": "Electromin",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Electromin",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.669472,
    "lng": 38.6743051,
    "pricePerKwh": 0.12
  },
  {
    "id": "11443450196",
    "name": "Electromin",
    "provider": "Electromin",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Electromin",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.3184707,
    "lng": 37.3304486,
    "pricePerKwh": 0.12
  },
  {
    "id": "11578452593",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.9188348,
    "lng": 34.9780194,
    "pricePerKwh": 0.12
  },
  {
    "id": "11578452595",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.9084271,
    "lng": 35.0075867,
    "pricePerKwh": 0.12
  },
  {
    "id": "11578452596",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.8982552,
    "lng": 35.0081678,
    "pricePerKwh": 0.12
  },
  {
    "id": "11593796273",
    "name": "جوبترول",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "جوبترول",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.984094,
    "lng": 35.8862166
  },
  {
    "id": "12211293280",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.1094329,
    "lng": 35.3959588
  },
  {
    "id": "12218574885",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2825166,
    "lng": 37.5396448
  },
  {
    "id": "12360614603",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.46894,
    "lng": 38.29804
  },
  {
    "id": "12360614604",
    "name": "مجمع ومحطة نجد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مجمع ومحطة نجد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.3852484,
    "lng": 37.283187
  },
  {
    "id": "12360614605",
    "name": "اللقاء",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "اللقاء",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.4683082,
    "lng": 37.141517
  },
  {
    "id": "12360614606",
    "name": "العريعر",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "العريعر",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.3489684,
    "lng": 37.329887
  },
  {
    "id": "12360614607",
    "name": "الريان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الريان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.3460584,
    "lng": 37.352047
  },
  {
    "id": "12360614608",
    "name": "السلمان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "السلمان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.3367985,
    "lng": 37.381297
  },
  {
    "id": "12360614609",
    "name": "مجمع المبارك",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مجمع المبارك",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.2915386,
    "lng": 37.3962269
  },
  {
    "id": "12360614610",
    "name": "وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.091559,
    "lng": 37.6237669
  },
  {
    "id": "12360614611",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.087819,
    "lng": 37.6313569
  },
  {
    "id": "12360614612",
    "name": "صالح سحيمان",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "صالح سحيمان",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.7271098,
    "lng": 37.9709469
  },
  {
    "id": "12360614613",
    "name": "مجمع محطة السعيد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مجمع محطة السعيد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.5351602,
    "lng": 38.2205469
  },
  {
    "id": "12360614614",
    "name": "المحطة 2",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "المحطة 2",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.4874903,
    "lng": 38.2051269
  },
  {
    "id": "12360614615",
    "name": "الشام",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "الشام",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.5082503,
    "lng": 38.2269269
  },
  {
    "id": "12360614616",
    "name": "مجمع ومحطة الدبوس",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "مجمع ومحطة الدبوس",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.3050408,
    "lng": 38.690527
  },
  {
    "id": "12360614617",
    "name": "سلمان القعيد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "سلمان القعيد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.292154,
    "lng": 38.6995382
  },
  {
    "id": "12360614618",
    "name": "السراب",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "السراب",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2891508,
    "lng": 38.7038869
  },
  {
    "id": "12360614619",
    "name": "النبك",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "النبك",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2881164,
    "lng": 38.7033972
  },
  {
    "id": "12360614620",
    "name": "المحمد",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "المحمد",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.2866577,
    "lng": 38.7065533
  },
  {
    "id": "12360614621",
    "name": "Pani wala",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Pani wala",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 29.4279277,
    "lng": 38.5229941
  },
  {
    "id": "12366504663",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.2107204,
    "lng": 35.2950889
  },
  {
    "id": "12388290419",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.8130731,
    "lng": 35.2457194
  },
  {
    "id": "12478532353",
    "name": "Stromtankstelle",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Stromtankstelle",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.8369965,
    "lng": 34.976915
  },
  {
    "id": "12875965233",
    "name": "Jerusalem Supercharger",
    "provider": "Tesla Supercharger",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Jerusalem Supercharger",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.7522318,
    "lng": 35.1876735,
    "pricePerKwh": 0.12
  },
  {
    "id": "12878724570",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.6869066,
    "lng": 35.0660191,
    "pricePerKwh": 0.12
  },
  {
    "id": "13041317449",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.4363421,
    "lng": 35.0273276,
    "pricePerKwh": 0.12
  },
  {
    "id": "13300896803",
    "name": "Jo Petrol",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "Jo Petrol",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 31.9596372,
    "lng": 35.8563939
  },
  {
    "id": "13321497928",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.7238149,
    "lng": 35.0585183,
    "pricePerKwh": 0.12
  },
  {
    "id": "13329583867",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.699622,
    "lng": 35.1077469,
    "pricePerKwh": 0.12
  },
  {
    "id": "13338549864",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.695393,
    "lng": 35.0514957,
    "pricePerKwh": 0.12
  },
  {
    "id": "13388849341",
    "name": "محطة السويلميين",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "عمان",
    "address": "محطة السويلميين",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0238083,
    "lng": 35.9358406
  },
  {
    "id": "13516832302",
    "name": "محطة الحرمين للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الحرمين للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.5972469,
    "lng": 36.1830338
  },
  {
    "id": "13610104401",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 30.6411682,
    "lng": 35.2902364
  },
  {
    "id": "13756159566",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "عمان",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 31.9120792,
    "lng": 35.938589,
    "pricePerKwh": 0.12
  },
  {
    "id": "13879556402",
    "name": "محطة الغباغبي للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة الغباغبي للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.6816984,
    "lng": 36.3532614
  },
  {
    "id": "13970067125",
    "name": "محطة سوف للمحروقات",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "جرش",
    "address": "محطة سوف للمحروقات",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.3137497,
    "lng": 35.8336787
  },
  {
    "id": "13970067159",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "جرش",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.2705185,
    "lng": 35.8822483,
    "pricePerKwh": 0.12
  },
  {
    "id": "13970067160",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "جرش",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.2704741,
    "lng": 35.8829825,
    "pricePerKwh": 0.12
  },
  {
    "id": "13970067250",
    "name": "محطة خاصة - محطة شحن",
    "provider": "محطة خاصة",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.1609643,
    "lng": 35.8485804,
    "pricePerKwh": 0.12
  },
  {
    "id": "13970067278",
    "name": "محطة خاصة - محطة وقود",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "محطة خاصة - محطة وقود",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 32.0849765,
    "lng": 35.8887138
  },
  {
    "id": "13970067279",
    "name": "Ajel - محطة شحن",
    "provider": "Ajel",
    "type": "EV_ONLY",
    "city": "أخرى",
    "address": "Ajel - محطة شحن",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "plugTypes": [
      "CCS2 (DC)",
      "Type 2 (AC)"
    ],
    "powerKw": 120,
    "fastCharging": true,
    "status": "ONLINE",
    "lat": 32.0849123,
    "lng": 35.8885068,
    "pricePerKwh": 0.12
  },
  {
    "id": "14145348262",
    "name": "Wardieh",
    "provider": "محطة خاصة",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "Wardieh",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.3342388,
    "lng": 35.4260187
  },
  {
    "id": "14145367382",
    "name": "TotalEnergies",
    "provider": "توتال (TotalEnergies)",
    "type": "PETROL_ONLY",
    "city": "أخرى",
    "address": "TotalEnergies",
    "nearby": "معالم ومرافق محلية (تم إدراجها تلقائياً من الخريطة)",
    "petrolTypes": [
      "90",
      "95",
      "DIESEL"
    ],
    "status": "ONLINE",
    "lat": 33.349061,
    "lng": 35.4525961
  }
];
