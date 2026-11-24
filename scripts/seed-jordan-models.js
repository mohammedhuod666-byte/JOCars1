const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing!');
  process.exit(1);
}

const adapter = new PrismaNeonHTTP(connectionString, { arrayMode: true });
const prisma = new PrismaClient({ adapter });

// Jordanian Models Dataset
const MODELS_BY_BRAND_SLUG = {
  'toyota': [
    { nameAr: 'بريوس', nameEn: 'Prius', slug: 'prius' },
    { nameAr: 'بريوس سي', nameEn: 'Prius C', slug: 'prius-c' },
    { nameAr: 'بريوس بلس', nameEn: 'Prius+', slug: 'prius-plus' },
    { nameAr: 'بريوس برايم', nameEn: 'Prius Prime', slug: 'prius-prime' },
    { nameAr: 'كامري', nameEn: 'Camry', slug: 'camry' },
    { nameAr: 'كامري هايبرد', nameEn: 'Camry Hybrid', slug: 'camry-hybrid' },
    { nameAr: 'كورولا', nameEn: 'Corolla', slug: 'corolla' },
    { nameAr: 'كورولا كروس', nameEn: 'Corolla Cross', slug: 'corolla-cross' },
    { nameAr: 'راف 4', nameEn: 'RAV4', slug: 'rav4' },
    { nameAr: 'راف 4 هايبرد', nameEn: 'RAV4 Hybrid', slug: 'rav4-hybrid' },
    { nameAr: 'يارس', nameEn: 'Yaris', slug: 'yaris' },
    { nameAr: 'يارس كروس', nameEn: 'Yaris Cross', slug: 'yaris-cross' },
    { nameAr: 'لاندكروزر', nameEn: 'Land Cruiser', slug: 'land-cruiser' },
    { nameAr: 'برادو', nameEn: 'Prado', slug: 'prado' },
    { nameAr: 'فورتشنر', nameEn: 'Fortuner', slug: 'fortuner' },
    { nameAr: 'هايلكس', nameEn: 'Hilux', slug: 'hilux' },
    { nameAr: 'سي اتش ار', nameEn: 'C-HR', slug: 'c-hr' },
    { nameAr: 'كراون', nameEn: 'Crown', slug: 'crown' },
    { nameAr: 'افالون', nameEn: 'Avalon', slug: 'avalon' },
    { nameAr: 'هايلاندر', nameEn: 'Highlander', slug: 'highlander' },
    { nameAr: 'بي زد 4 اكس', nameEn: 'bZ4X', slug: 'bz4x' },
    { nameAr: 'اوربان كروزر', nameEn: 'Urban Cruiser', slug: 'urban-cruiser' },
    { nameAr: 'سيكويا', nameEn: 'Sequoia', slug: 'sequoia' },
    { nameAr: 'تندرا', nameEn: 'Tundra', slug: 'tundra' },
    { nameAr: 'تاكوما', nameEn: 'Tacoma', slug: 'tacoma' }
  ],
  'hyundai': [
    { nameAr: 'النترا / افانتي', nameEn: 'Elantra / Avante', slug: 'elantra' },
    { nameAr: 'سوناتا', nameEn: 'Sonata', slug: 'sonata' },
    { nameAr: 'سوناتا هايبرد', nameEn: 'Sonata Hybrid', slug: 'sonata-hybrid' },
    { nameAr: 'ايونيك', nameEn: 'Ioniq Hybrid/EV', slug: 'ioniq' },
    { nameAr: 'ايونيك 5', nameEn: 'Ioniq 5', slug: 'ioniq-5' },
    { nameAr: 'ايونيك 6', nameEn: 'Ioniq 6', slug: 'ioniq-6' },
    { nameAr: 'توسان', nameEn: 'Tucson', slug: 'tucson' },
    { nameAr: 'سنتافي', nameEn: 'Santa Fe', slug: 'santa-fe' },
    { nameAr: 'كونا', nameEn: 'Kona', slug: 'kona' },
    { nameAr: 'أكسنت', nameEn: 'Accent', slug: 'accent' },
    { nameAr: 'كريتا', nameEn: 'Creta', slug: 'creta' },
    { nameAr: 'باليسيد', nameEn: 'Palisade', slug: 'palisade' },
    { nameAr: 'ازيرا', nameEn: 'Azera', slug: 'azera' },
    { nameAr: 'فيلوستر', nameEn: 'Veloster', slug: 'veloster' },
    { nameAr: 'فينيوس', nameEn: 'Venue', slug: 'venue' },
    { nameAr: 'ستاريا', nameEn: 'Staria', slug: 'staria' },
    { nameAr: 'بورتر (بك اب)', nameEn: 'Porter', slug: 'porter' }
  ],
  'kia': [
    { nameAr: 'سيراتو / فورتي', nameEn: 'Cerato / Forte', slug: 'cerato' },
    { nameAr: 'K5 / اوبتيما', nameEn: 'K5 / Optima', slug: 'k5' },
    { nameAr: 'سبورتاج', nameEn: 'Sportage', slug: 'sportage' },
    { nameAr: 'سورينتو', nameEn: 'Sorento', slug: 'sorento' },
    { nameAr: 'نيرو', nameEn: 'Niro Hybrid', slug: 'niro' },
    { nameAr: 'نيرو EV', nameEn: 'Niro EV', slug: 'niro-ev' },
    { nameAr: 'EV6', nameEn: 'EV6', slug: 'ev6' },
    { nameAr: 'EV9', nameEn: 'EV9', slug: 'ev9' },
    { nameAr: 'بيكانتو', nameEn: 'Picanto', slug: 'picanto' },
    { nameAr: 'ريو', nameEn: 'Rio', slug: 'rio' },
    { nameAr: 'سيلتوس', nameEn: 'Seltos', slug: 'seltos' },
    { nameAr: 'كادينزا / K8', nameEn: 'Cadenza / K8', slug: 'k8' },
    { nameAr: 'تيلورايد', nameEn: 'Telluride', slug: 'telluride' },
    { nameAr: 'كرنفال', nameEn: 'Carnival', slug: 'carnival' },
    { nameAr: 'بونغو (بك اب)', nameEn: 'Bongo', slug: 'bongo' },
    { nameAr: 'ستينجر', nameEn: 'Stinger', slug: 'stinger' },
    { nameAr: 'بيجاس', nameEn: 'Pegas', slug: 'pegas' },
    { nameAr: 'سونيت', nameEn: 'Sonet', slug: 'sonet' }
  ],
  'volkswagen': [
    { nameAr: 'ID.4', nameEn: 'ID.4', slug: 'id4' },
    { nameAr: 'ID.6', nameEn: 'ID.6', slug: 'id6' },
    { nameAr: 'ID.3', nameEn: 'ID.3', slug: 'id3' },
    { nameAr: 'ID.7', nameEn: 'ID.7', slug: 'id7' },
    { nameAr: 'جولف / Golf GTI', nameEn: 'Golf', slug: 'golf' },
    { nameAr: 'باسات', nameEn: 'Passat', slug: 'passat' },
    { nameAr: 'تيجوان', nameEn: 'Tiguan', slug: 'tiguan' },
    { nameAr: 'طوارق', nameEn: 'Touareg', slug: 'touareg' },
    { nameAr: 'جيتا', nameEn: 'Jetta', slug: 'jetta' },
    { nameAr: 'تي-روك', nameEn: 'T-Roc', slug: 't-roc' },
    { nameAr: 'تيرامونت', nameEn: 'Teramont', slug: 'teramont' },
    { nameAr: 'ارتيون', nameEn: 'Arteon', slug: 'arteon' },
    { nameAr: 'بولو', nameEn: 'Polo', slug: 'polo' }
  ],
  'byd': [
    { nameAr: 'سونغ بلس', nameEn: 'Song Plus EV / DM-i', slug: 'song-plus' },
    { nameAr: 'هان', nameEn: 'Han EV', slug: 'han' },
    { nameAr: 'تانغ', nameEn: 'Tang EV', slug: 'tang' },
    { nameAr: 'اتو 3 / يوان بلس', nameEn: 'Atto 3 / Yuan Plus', slug: 'atto-3' },
    { nameAr: 'تشين بلس', nameEn: 'Qin Plus', slug: 'qin-plus' },
    { nameAr: 'دولفين', nameEn: 'Dolphin', slug: 'dolphin' },
    { nameAr: 'سيل', nameEn: 'Seal', slug: 'seal' },
    { nameAr: 'سيجل', nameEn: 'Seagull', slug: 'seagull' },
    { nameAr: 'تشازور', nameEn: 'Chazor', slug: 'chazor' }
  ],
  'changan': [
    { nameAr: 'CS75 Plus', nameEn: 'CS75 Plus', slug: 'cs75-plus' },
    { nameAr: 'CS35 Plus', nameEn: 'CS35 Plus', slug: 'cs35-plus' },
    { nameAr: 'CS85 Coupe', nameEn: 'CS85', slug: 'cs85' },
    { nameAr: 'CS95', nameEn: 'CS95', slug: 'cs95' },
    { nameAr: 'UNI-T', nameEn: 'UNI-T', slug: 'uni-t' },
    { nameAr: 'UNI-K', nameEn: 'UNI-K', slug: 'uni-k' },
    { nameAr: 'UNI-V', nameEn: 'UNI-V', slug: 'uni-v' },
    { nameAr: 'ايدو بلس', nameEn: 'Eado Plus', slug: 'eado-plus' },
    { nameAr: 'السفن', nameEn: 'Alsvin', slug: 'alsvin' },
    { nameAr: 'ديبال SL03', nameEn: 'Deepal SL03', slug: 'deepal-sl03' },
    { nameAr: 'ديبال S7', nameEn: 'Deepal S7', slug: 'deepal-s7' }
  ],
  'geely': [
    { nameAr: 'كولراي', nameEn: 'Coolray', slug: 'coolray' },
    { nameAr: 'ازكارا', nameEn: 'Azkarra', slug: 'azkarra' },
    { nameAr: 'مونجارو', nameEn: 'Monjaro', slug: 'monjaro' },
    { nameAr: 'اوكافانجو', nameEn: 'Okavango', slug: 'okavango' },
    { nameAr: 'جيومتري C', nameEn: 'Geometry C', slug: 'geometry-c' },
    { nameAr: 'توجيلا', nameEn: 'Tugella', slug: 'tugella' },
    { nameAr: 'امجراند', nameEn: 'Emgrand', slug: 'emgrand' }
  ],
  'tesla': [
    { nameAr: 'موديل 3', nameEn: 'Model 3', slug: 'model-3' },
    { nameAr: 'موديل واي', nameEn: 'Model Y', slug: 'model-y' },
    { nameAr: 'موديل اس', nameEn: 'Model S', slug: 'model-s' },
    { nameAr: 'موديل اكس', nameEn: 'Model X', slug: 'model-x' },
    { nameAr: 'سايبر تراك', nameEn: 'Cybertruck', slug: 'cybertruck' }
  ],
  'mercedes': [
    { nameAr: 'C-Class (C200 / C300)', nameEn: 'C-Class', slug: 'c-class' },
    { nameAr: 'E-Class (E200 / E300)', nameEn: 'E-Class', slug: 'e-class' },
    { nameAr: 'S-Class (S350 / S500)', nameEn: 'S-Class', slug: 's-class' },
    { nameAr: 'GLC-Class', nameEn: 'GLC', slug: 'glc' },
    { nameAr: 'GLE-Class', nameEn: 'GLE', slug: 'gle' },
    { nameAr: 'GLS-Class', nameEn: 'GLS', slug: 'gls' },
    { nameAr: 'CLA-Class', nameEn: 'CLA', slug: 'cla' },
    { nameAr: 'A-Class', nameEn: 'A-Class', slug: 'a-class' },
    { nameAr: 'G-Class (G63)', nameEn: 'G-Class', slug: 'g-class' },
    { nameAr: 'EQE', nameEn: 'EQE', slug: 'eqe' },
    { nameAr: 'EQS', nameEn: 'EQS', slug: 'eqs' },
    { nameAr: 'EQB', nameEn: 'EQB', slug: 'eqb' }
  ],
  'bmw': [
    { nameAr: 'الفئة الثالثة 3 Series', nameEn: '3 Series', slug: '3-series' },
    { nameAr: 'الفئة الخامسة 5 Series', nameEn: '5 Series', slug: '5-series' },
    { nameAr: 'الفئة السابعة 7 Series', nameEn: '7 Series', slug: '7-series' },
    { nameAr: 'الفئة الرابعة 4 Series', nameEn: '4 Series', slug: '4-series' },
    { nameAr: 'X5', nameEn: 'X5', slug: 'x5' },
    { nameAr: 'X3', nameEn: 'X3', slug: 'x3' },
    { nameAr: 'X6', nameEn: 'X6', slug: 'x6' },
    { nameAr: 'X1', nameEn: 'X1', slug: 'x1' },
    { nameAr: 'X7', nameEn: 'X7', slug: 'x7' },
    { nameAr: 'i4 الكهربائية', nameEn: 'i4', slug: 'i4' },
    { nameAr: 'iX3 الكهربائية', nameEn: 'iX3', slug: 'ix3' },
    { nameAr: 'i7 الكهربائية', nameEn: 'i7', slug: 'i7' },
    { nameAr: 'iX', nameEn: 'iX', slug: 'ix' }
  ],
  'nissan': [
    { nameAr: 'ليف (Leaf EV)', nameEn: 'Leaf', slug: 'leaf' },
    { nameAr: 'صني', nameEn: 'Sunny', slug: 'sunny' },
    { nameAr: 'قشقاي', nameEn: 'Qashqai', slug: 'qashqai' },
    { nameAr: 'اكس تريل / روج', nameEn: 'X-Trail / Rogue', slug: 'x-trail' },
    { nameAr: 'التيما', nameEn: 'Altima', slug: 'altima' },
    { nameAr: 'باترول', nameEn: 'Patrol', slug: 'patrol' },
    { nameAr: 'كيكس', nameEn: 'Kicks', slug: 'kicks' },
    { nameAr: 'جوك', nameEn: 'Juke', slug: 'juke' },
    { nameAr: 'اريا الكهربائية', nameEn: 'Ariya', slug: 'ariya' },
    { nameAr: 'نافارا (بك اب)', nameEn: 'Navara', slug: 'navara' }
  ],
  'ford': [
    { nameAr: 'فيوجن / فيوجن هايبرد', nameEn: 'Fusion', slug: 'fusion' },
    { nameAr: 'فوكس', nameEn: 'Focus', slug: 'focus' },
    { nameAr: 'اكسبلورر', nameEn: 'Explorer', slug: 'explorer' },
    { nameAr: 'F-150 / لايتنينج', nameEn: 'F-150', slug: 'f150' },
    { nameAr: 'ايدج', nameEn: 'Edge', slug: 'edge' },
    { nameAr: 'موستانج', nameEn: 'Mustang', slug: 'mustang' },
    { nameAr: 'موستانج ماك-اي EV', nameEn: 'Mustang Mach-E', slug: 'mach-e' },
    { nameAr: 'توروس', nameEn: 'Taurus', slug: 'taurus' },
    { nameAr: 'رينجر (بك اب)', nameEn: 'Ranger', slug: 'ranger' }
  ],
  'lexus': [
    { nameAr: 'ES (ES 300h / ES 350)', nameEn: 'ES', slug: 'es' },
    { nameAr: 'RX (RX 350 / RX 450h)', nameEn: 'RX', slug: 'rx' },
    { nameAr: 'NX (NX 300 / NX 350h)', nameEn: 'NX', slug: 'nx' },
    { nameAr: 'LX (LX 570 / LX 600)', nameEn: 'LX', slug: 'lx' },
    { nameAr: 'IS (IS 250 / IS 300)', nameEn: 'IS', slug: 'is' },
    { nameAr: 'GX (GX 460 / GX 550)', nameEn: 'GX', slug: 'gx' },
    { nameAr: 'UX 250h', nameEn: 'UX', slug: 'ux' }
  ],
  'mitsubishi': [
    { nameAr: 'لانسر / لانسر EX', nameEn: 'Lancer', slug: 'lancer' },
    { nameAr: 'باجيرو', nameEn: 'Pajero', slug: 'pajero' },
    { nameAr: 'اوتلاندر / اوتلاندر PHEV', nameEn: 'Outlander', slug: 'outlander' },
    { nameAr: 'اكليبس كروس', nameEn: 'Eclipse Cross', slug: 'eclipse-cross' },
    { nameAr: 'اتراج', nameEn: 'Attrage', slug: 'attrage' },
    { nameAr: 'ميراج', nameEn: 'Mirage', slug: 'mirage' },
    { nameAr: 'L200 (بك اب)', nameEn: 'L200', slug: 'l200' }
  ],
  'honda': [
    { nameAr: 'سيفيك', nameEn: 'Civic', slug: 'civic' },
    { nameAr: 'اكورد / اكورد هايبرد', nameEn: 'Accord', slug: 'accord' },
    { nameAr: 'CR-V / CR-V هايبرد', nameEn: 'CR-V', slug: 'cr-v' },
    { nameAr: 'HR-V', nameEn: 'HR-V', slug: 'hr-v' },
    { nameAr: 'e:NP1 / e:NS1 الكهربائية', nameEn: 'e:NP1', slug: 'enp1' },
    { nameAr: 'انسايت', nameEn: 'Insight', slug: 'insight' },
    { nameAr: 'بايلوت', nameEn: 'Pilot', slug: 'pilot' }
  ],
  'mg': [
    { nameAr: 'MG 5', nameEn: 'MG 5', slug: 'mg-5' },
    { nameAr: 'MG 6', nameEn: 'MG 6', slug: 'mg-6' },
    { nameAr: 'MG ZS / ZS EV', nameEn: 'MG ZS', slug: 'mg-zs' },
    { nameAr: 'MG HS / HS PHEV', nameEn: 'MG HS', slug: 'mg-hs' },
    { nameAr: 'MG 4 EV الكهربائية', nameEn: 'MG 4', slug: 'mg-4' },
    { nameAr: 'MG One', nameEn: 'MG One', slug: 'mg-one' },
    { nameAr: 'MG GT', nameEn: 'MG GT', slug: 'mg-gt' }
  ],
  'chevrolet': [
    { nameAr: 'بولت EV', nameEn: 'Bolt EV', slug: 'bolt-ev' },
    { nameAr: 'ماليبو', nameEn: 'Malibu', slug: 'malibu' },
    { nameAr: 'كروز', nameEn: 'Cruze', slug: 'cruze' },
    { nameAr: 'كابتيفا', nameEn: 'Captiva', slug: 'captiva' },
    { nameAr: 'تاهو', nameEn: 'Tahoe', slug: 'tahoe' },
    { nameAr: 'سبارك', nameEn: 'Spark', slug: 'spark' },
    { nameAr: 'سيلفرادو', nameEn: 'Silverado', slug: 'silverado' },
    { nameAr: 'ترافرس', nameEn: 'Traverse', slug: 'traverse' }
  ],
  'porsche': [
    { nameAr: 'كايين / كايين كوبيه', nameEn: 'Cayenne', slug: 'cayenne' },
    { nameAr: 'ماكان', nameEn: 'Macan', slug: 'macan' },
    { nameAr: 'باناميرا', nameEn: 'Panamera', slug: 'panamera' },
    { nameAr: '911 (كاريرا / توربو)', nameEn: '911', slug: '911' },
    { nameAr: 'تايكان الكهربائية', nameEn: 'Taycan', slug: 'taycan' },
    { nameAr: '718 بوكستر / كايمان', nameEn: '718', slug: '718' }
  ],
  'land-rover': [
    { nameAr: 'رينج روفر', nameEn: 'Range Rover', slug: 'range-rover' },
    { nameAr: 'رينج روفر سبورت', nameEn: 'Range Rover Sport', slug: 'range-rover-sport' },
    { nameAr: 'رينج روفر فيلار', nameEn: 'Range Rover Velar', slug: 'velar' },
    { nameAr: 'رينج روفر ايفوك', nameEn: 'Range Rover Evoque', slug: 'evoque' },
    { nameAr: 'ديفندر', nameEn: 'Defender', slug: 'defender' },
    { nameAr: 'ديسكفري', nameEn: 'Discovery', slug: 'discovery' }
  ],
  'audi': [
    { nameAr: 'A4', nameEn: 'A4', slug: 'a4' },
    { nameAr: 'A6', nameEn: 'A6', slug: 'a6' },
    { nameAr: 'A3', nameEn: 'A3', slug: 'a3' },
    { nameAr: 'Q5', nameEn: 'Q5', slug: 'q5' },
    { nameAr: 'Q7', nameEn: 'Q7', slug: 'q7' },
    { nameAr: 'Q8', nameEn: 'Q8', slug: 'q8' },
    { nameAr: 'e-tron الكهربائية', nameEn: 'e-tron', slug: 'e-tron' }
  ],
  'mazda': [
    { nameAr: 'مازدا 3', nameEn: 'Mazda 3', slug: 'mazda-3' },
    { nameAr: 'مازدا 6', nameEn: 'Mazda 6', slug: 'mazda-6' },
    { nameAr: 'CX-5', nameEn: 'CX-5', slug: 'cx-5' },
    { nameAr: 'CX-9', nameEn: 'CX-9', slug: 'cx-9' },
    { nameAr: 'CX-30', nameEn: 'CX-30', slug: 'cx-30' }
  ],
  'subaru': [
    { nameAr: 'امبريزا', nameEn: 'Impreza', slug: 'impreza' },
    { nameAr: 'كروستريك / XV', nameEn: 'Crosstrek / XV', slug: 'crosstrek' },
    { nameAr: 'فورستر', nameEn: 'Forester', slug: 'forester' },
    { nameAr: 'اوتباك', nameEn: 'Outback', slug: 'outback' }
  ],
  'suzuki': [
    { nameAr: 'سويفت', nameEn: 'Swift', slug: 'swift' },
    { nameAr: 'جيمني', nameEn: 'Jimny', slug: 'jimny' },
    { nameAr: 'بالينو', nameEn: 'Baleno', slug: 'baleno' },
    { nameAr: 'فيتارا / جراند فيتارا', nameEn: 'Vitara', slug: 'vitara' },
    { nameAr: 'سياز', nameEn: 'Ciaz', slug: 'ciaz' },
    { nameAr: 'ديزاير', nameEn: 'Dzire', slug: 'dzire' }
  ],
  'peugeot': [
    { nameAr: '208 / e-208', nameEn: '208', slug: '208' },
    { nameAr: '2008 / e-2008', nameEn: '2008', slug: '2008' },
    { nameAr: '3008', nameEn: '3008', slug: '3008' },
    { nameAr: '5008', nameEn: '5008', slug: '5008' },
    { nameAr: '508', nameEn: '508', slug: '508' }
  ],
  'jeep': [
    { nameAr: 'جراند شيروكي', nameEn: 'Grand Cherokee', slug: 'grand-cherokee' },
    { nameAr: 'رانجلر', nameEn: 'Wrangler', slug: 'wrangler' },
    { nameAr: 'شيروكي', nameEn: 'Cherokee', slug: 'cherokee' },
    { nameAr: 'كومباس', nameEn: 'Compass', slug: 'compass' },
    { nameAr: 'جلاديتور', nameEn: 'Gladiator', slug: 'gladiator' }
  ],
  'gmc': [
    { nameAr: 'يوكون / يوكون دينالي', nameEn: 'Yukon / Denali', slug: 'yukon' },
    { nameAr: 'سييرا', nameEn: 'Sierra', slug: 'sierra' },
    { nameAr: 'اكاديا', nameEn: 'Acadia', slug: 'acadia' },
    { nameAr: 'تيرين', nameEn: 'Terrain', slug: 'terrain' }
  ],
  'dodge': [
    { nameAr: 'تشارجر', nameEn: 'Charger', slug: 'charger' },
    { nameAr: 'تشالنجر', nameEn: 'Challenger', slug: 'challenger' },
    { nameAr: 'دورانجو', nameEn: 'Durango', slug: 'durango' }
  ],
  'skoda': [
    { nameAr: 'اوكتافيا', nameEn: 'Octavia', slug: 'octavia' },
    { nameAr: 'سوبيرب', nameEn: 'Superb', slug: 'superb' },
    { nameAr: 'كودياك', nameEn: 'Kodiaq', slug: 'kodiaq' },
    { nameAr: 'كاروك', nameEn: 'Karoq', slug: 'karoq' },
    { nameAr: 'كاميك', nameEn: 'Kamiq', slug: 'kamiq' }
  ],
  'volvo': [
    { nameAr: 'XC90', nameEn: 'XC90', slug: 'xc90' },
    { nameAr: 'XC60', nameEn: 'XC60', slug: 'xc60' },
    { nameAr: 'XC40 / EX40', nameEn: 'XC40', slug: 'xc40' },
    { nameAr: 'S90', nameEn: 'S90', slug: 's90' },
    { nameAr: 'EX30 الكهربائية', nameEn: 'EX30', slug: 'ex30' }
  ],
  'chery': [
    { nameAr: 'تيجو 7 برو', nameEn: 'Tiggo 7 Pro', slug: 'tiggo-7' },
    { nameAr: 'تيجو 8 برو', nameEn: 'Tiggo 8 Pro', slug: 'tiggo-8' },
    { nameAr: 'تيجو 4 برو', nameEn: 'Tiggo 4 Pro', slug: 'tiggo-4' },
    { nameAr: 'اريزو 6 برو', nameEn: 'Arrizo 6 Pro', slug: 'arrizo-6' },
    { nameAr: 'اريزو 5', nameEn: 'Arrizo 5', slug: 'arrizo-5' }
  ]
};

async function main() {
  console.log('--- Starting Jordan Brands & Models Seeder ---');

  // 1. Fix Brand Arabic names if misnamed
  const brandFixes = [
    { slug: 'changan', nameAr: 'تشانجان (Changan)' },
    { slug: 'geely', nameAr: 'جيلي (Geely)' },
    { slug: 'mercedes', nameAr: 'مرسيدس بنز (Mercedes-Benz)' },
    { slug: 'chery', nameAr: 'شيري (Chery)' },
    { slug: 'volkswagen', nameAr: 'فولكس فاجن (Volkswagen)' },
    { slug: 'byd', nameAr: 'بي واي دي (BYD)' },
    { slug: 'tesla', nameAr: 'تسلا (Tesla)' },
  ];

  for (const fix of brandFixes) {
    const existing = await prisma.brand.findUnique({ where: { slug: fix.slug } });
    if (existing) {
      await prisma.brand.update({
        where: { id: existing.id },
        data: { nameAr: fix.nameAr }
      });
      console.log(`Updated brand name: ${fix.slug} -> ${fix.nameAr}`);
    }
  }

  // 2. Fetch all brands
  const brands = await prisma.brand.findMany();
  const brandMap = new Map();
  for (const b of brands) {
    brandMap.set(b.slug, b);
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const [brandSlug, models] of Object.entries(MODELS_BY_BRAND_SLUG)) {
    const brand = brandMap.get(brandSlug);
    if (!brand) {
      console.warn(`Brand with slug "${brandSlug}" not found in DB!`);
      continue;
    }

    for (const m of models) {
      const existing = await prisma.carModel.findFirst({
        where: {
          brandId: brand.id,
          slug: m.slug
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.carModel.create({
        data: {
          nameAr: m.nameAr,
          nameEn: m.nameEn,
          slug: m.slug,
          brandId: brand.id,
          isActive: true
        }
      });
      createdCount++;
    }
  }

  console.log(`Finished: ${createdCount} models created, ${skippedCount} existing skipped.`);
}

main().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
