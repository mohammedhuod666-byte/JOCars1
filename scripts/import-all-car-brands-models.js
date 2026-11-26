const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL, { arrayMode: true });
const prisma = new PrismaClient({ adapter });

function toSlug(str) {
  return String(str)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Comprehensive global car brands (Jordanian, Classic, Modern, EV, Hybrid, Exotic, Chinese, European, American, Japanese, Korean, Russian, Indian, Malaysian, Turkish)
const GLOBAL_BRANDS = [
  // Popular in Jordan + Classics + Modern + EVs
  {
    nameEn: 'Toyota', nameAr: 'تويوتا', country: 'اليابان',
    models: ['Corolla', 'Camry', 'Prius', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'Prado', 'Fortuner', 'Hilux', 'Yaris', 'Avalon', 'Crown', 'Cressida', 'Corona', 'Starlet', 'Tercel', 'Celica', 'Supra', 'MR2', '86', 'GR86', 'bZ4X', 'bZ3', 'bZ3X', 'Sienna', 'Sequoia', 'Tundra', 'Tacoma', '4Runner', 'Venza', 'Rush', 'Raize', 'Urban Cruiser', 'Avanza', 'Innova', 'HiAce', 'Coaster', 'FJ Cruiser', 'Matrix', 'Echo', 'Solara']
  },
  {
    nameEn: 'Hyundai', nameAr: 'هيونداي', country: 'كوريا الجنوبية',
    models: ['Avante', 'Elantra', 'Sonata', 'Accent', 'Azera', 'Grandeur', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Creta', 'Venue', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Ioniq 9', 'Veloster', 'Genesis', 'Excel', 'Pony', 'Stellar', 'Scoupe', 'Tiburon', 'Coupe', 'Matrix', 'Terracan', 'Galloper', 'Veracruz', 'Getz', 'i10', 'i20', 'i30', 'i40', 'ix35', 'Staria', 'H1', 'Porter', 'Casper', 'Bayon']
  },
  {
    nameEn: 'Kia', nameAr: 'كيا', country: 'كوريا الجنوبية',
    models: ['Cerato', 'Forte', 'K3', 'K5', 'K8', 'K9', 'Optima', 'Rio', 'Picanto', 'Morning', 'Sportage', 'Sorento', 'Telluride', 'Seltos', 'Niro', 'Soul', 'Carnival', 'Sedona', 'Stinger', 'EV3', 'EV5', 'EV6', 'EV9', 'Sephia', 'Shuma', 'Spectra', 'Pride', 'Avella', 'Clarus', 'Magentis', 'Opirus', 'Mohave', 'Bongo', 'Carens', 'Cadenza', 'Stonic', 'Sonet', 'Tasman']
  },
  {
    nameEn: 'Mercedes-Benz', nameAr: 'مرسيدس بنز', country: 'ألمانيا',
    models: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'CLE', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'SL', 'SLC', 'SLK', 'AMG GT', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQV', '190E (W201)', 'W123', 'W124', 'W126', 'W140', 'W210', 'W211', 'W212', 'W202', 'W203', 'W204', 'W205', 'V-Class', 'Vito', 'Sprinter', 'Maybach S-Class', 'Maybach GLS', 'CL-Class', 'CLK', 'ML-Class', 'GL-Class', 'R-Class', '200', '230E', '280SE', '300SEL', '500SEC']
  },
  {
    nameEn: 'BMW', nameAr: 'بي إم دبليو', country: 'ألمانيا',
    models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z3', 'Z4', 'Z8', 'i3', 'i4', 'i5', 'i7', 'i8', 'iX', 'iX1', 'iX3', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'E21', 'E28', 'E30', 'E32', 'E34', 'E36', 'E38', 'E39', 'E46', 'E60', 'E90', '2002', '520i', '525i', '316i', '318i', '320i', '325i', '730i', '740i', '750i']
  },
  {
    nameEn: 'Opel', nameAr: 'أوبل', country: 'ألمانيا',
    models: ['Kadett', 'Kadett C', 'Kadett D', 'Kadett E', 'Ascona', 'Rekord', 'Commodore', 'Manta', 'Monza', 'Senator', 'Diplomat', 'Admiral', 'Kapitan', 'Olympia', 'GT', 'Corsa', 'Astra', 'Vectra', 'Omega', 'Insignia', 'Calibra', 'Tigra', 'Meriva', 'Zafira', 'Mokka', 'Crossland', 'Grandland', 'Antara', 'Frontera', 'Campo', 'Ampera', 'Cascada', 'Adam', 'Karl', 'Agila', 'Combo', 'Vivaro', 'Movano', 'Rocks-e']
  },
  {
    nameEn: 'Volkswagen', nameAr: 'فولكس فاجن', country: 'ألمانيا',
    models: ['Golf', 'Golf Mk1', 'Golf Mk2', 'Golf Mk3', 'Golf Mk4', 'Golf GTI', 'Golf R', 'Jetta', 'Passat', 'Arteon', 'Polo', 'Beetle', 'Super Beetle', 'Scirocco', 'Corrado', 'Tiguan', 'Touareg', 'T-Roc', 'T-Cross', 'Atlas', 'Teramont', 'ID.3', 'ID.4', 'ID.5', 'ID.6', 'ID.7', 'ID.Buzz', 'e-Golf', 'Bora', 'Vento', 'Santana', 'Fox', 'Lupo', 'Up!', 'Caddy', 'Transporter', 'Caravelle', 'Multivan', 'Amarok', 'Phaeton', 'EOS', 'Sharan', 'Touran']
  },
  {
    nameEn: 'Nissan', nameAr: 'نيسان', country: 'اليابان',
    models: ['Sunny', 'Sentra', 'Altima', 'Maxima', 'Tiida', 'Versa', 'Micra', 'March', 'Juke', 'Qashqai', 'X-Trail', 'Rogue', 'Murano', 'Pathfinder', 'Patrol', 'Armada', 'Kicks', 'Leaf', 'Ariya', 'GT-R', '370Z', '350Z', '300ZX', '240SX', 'Silvia', 'Skyline', 'Bluebird', 'Laurel', 'Cedric', 'Gloria', 'Datsun Pickup', 'Navara', 'Frontier', 'Titan', 'Terrano', 'Urvan', 'Note', 'Sylphy']
  },
  {
    nameEn: 'Mitsubishi', nameAr: 'ميتسوبيشي', country: 'اليابان',
    models: ['Lancer', 'Lancer Evolution', 'Mirage', 'Attrage', 'Galant', 'Sigma', 'Colt', 'Eclipse', 'Eclipse Cross', 'ASX', 'Outlander', 'Pajero', 'Pajero Sport', 'Montero', 'L200', 'Triton', 'Xpander', 'Space Star', '3000GT', 'Starion', 'Grandis', 'Canter', 'Delica']
  },
  {
    nameEn: 'Mazda', nameAr: 'مازدا', country: 'اليابان',
    models: ['Mazda 2', 'Mazda 3', 'Mazda 6', '323', '626', '929', '121', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-60', 'CX-7', 'CX-9', 'CX-90', 'MX-5 Miata', 'MX-30', 'RX-7', 'RX-8', 'BT-50', 'B-Series', 'Tribute', 'MPV', 'Premacy']
  },
  {
    nameEn: 'Honda', nameAr: 'هوندا', country: 'اليابان',
    models: ['Civic', 'Accord', 'City', 'Jazz', 'Fit', 'CR-V', 'HR-V', 'ZR-V', 'Pilot', 'Passport', 'Odyssey', 'Ridgeline', 'Prelude', 'Integra', 'S2000', 'NSX', 'CR-X', 'CR-Z', 'Insight', 'Clarity', 'e:NS1', 'e:NP1', 'e:Ny1', 'Honda e', 'Legend', 'Stream', 'Element']
  },
  {
    nameEn: 'Ford', nameAr: 'فورد', country: 'أمريكا',
    models: ['Fusion', 'Focus', 'Fiesta', 'Mondeo', 'Taurus', 'Crown Victoria', 'Mustang', 'Mustang Mach-E', 'Escape', 'Kuga', 'Edge', 'Explorer', 'Expedition', 'Bronco', 'Bronco Sport', 'F-150', 'F-150 Lightning', 'F-250', 'F-350', 'Ranger', 'Maverick', 'Escort', 'Sierra', 'Scorpio', 'Cortina', 'Capri', 'Taunus', 'Pinto', 'Granada', 'Thunderbird', 'GT', 'EcoSport', 'Territory', 'Flex', 'Transit']
  },
  {
    nameEn: 'Chevrolet', nameAr: 'شيفروليه', country: 'أمريكا',
    models: ['Cruze', 'Malibu', 'Impala', 'Caprice', 'Camaro', 'Corvette', 'Optra', 'Aveo', 'Spark', 'Sonic', 'Cobalt', 'Cavalier', 'Lumina', 'Monte Carlo', 'Chevelle', 'Bel Air', 'Nova', 'Equinox', 'Traverse', 'Tahoe', 'Suburban', 'Blazer', 'Trailblazer', 'Captiva', 'Trax', 'Silverado', 'Colorado', 'Bolt EV', 'Bolt EUV', 'Volt', 'Menlo', 'Groove', 'Monza']
  },
  {
    nameEn: 'Lexus', nameAr: 'لكزس', country: 'اليابان',
    models: ['IS', 'ES', 'GS', 'LS', 'RC', 'LC', 'UX', 'NX', 'RX', 'GX', 'LX', 'TX', 'RZ', 'CT 200h', 'HS 250h', 'SC', 'LFA', 'LM']
  },
  {
    nameEn: 'Audi', nameAr: 'أودي', country: 'ألمانيا',
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'Q8 e-tron', 'e-tron', 'e-tron GT', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S8', '80', '90', '100', '200', 'Quattro']
  },
  {
    nameEn: 'Porsche', nameAr: 'بورش', country: 'ألمانيا',
    models: ['911', '911 Carrera', '911 Turbo', '911 GT3', 'Cayenne', 'Macan', 'Macan Electric', 'Panamera', 'Taycan', '718 Cayman', '718 Boxster', 'Boxster', 'Cayman', '924', '928', '944', '968', '356', 'Carrera GT', '918 Spyder']
  },
  {
    nameEn: 'Tesla', nameAr: 'تيسلا', country: 'أمريكا',
    models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck', 'Roadster']
  },
  // Chinese EVs & Hybrids & SUVs (huge in Jordan + global)
  {
    nameEn: 'BYD', nameAr: 'بي واي دي', country: 'الصين',
    models: ['Seagull', 'Dolphin', 'Atto 3', 'Yuan Plus', 'Yuan Up', 'Song Plus', 'Song Pro', 'Song L', 'Han', 'Seal', 'Seal U', 'Tang', 'Qin Plus', 'Qin L', 'Destroyer 05', 'Chazor', 'Frigate 07', 'e2', 'e6', 'F3', 'Shark']
  },
  {
    nameEn: 'Changan', nameAr: 'شانجان', country: 'الصين',
    models: ['Eado', 'Eado Plus', 'Alsvin', 'CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'CS85', 'CS95', 'UNI-T', 'UNI-K', 'UNI-V', 'UNI-Z', 'Lumin', 'BenBen E-Star', 'Hunter', 'X7 Plus', 'Deepal S7', 'Deepal SL03']
  },
  {
    nameEn: 'Deepal', nameAr: 'ديبال', country: 'الصين',
    models: ['SL03', 'S7', 'S07', 'L07', 'G318', 'S05']
  },
  {
    nameEn: 'Geely', nameAr: 'جيلي', country: 'الصين',
    models: ['Coolray', 'Azkarra', 'Tugella', 'Monjaro', 'Okavango', 'Emgrand', 'Geometry C', 'Geometry A', 'Geometry E', 'Galaxy E5', 'Galaxy E8', 'Galaxy L7', 'Starray', 'Preface', 'Panda Mini', 'Atlas']
  },
  {
    nameEn: 'Chery', nameAr: 'شيري', country: 'الصين',
    models: ['Tiggo 2', 'Tiggo 3', 'Tiggo 4 Pro', 'Tiggo 7 Pro', 'Tiggo 8 Pro', 'Tiggo 9', 'Arrizo 5', 'Arrizo 6', 'Arrizo 8', 'eQ1', 'eQ7', 'QQ', 'QQ Ice Cream']
  },
  {
    nameEn: 'Jetour', nameAr: 'جيتور', country: 'الصين',
    models: ['X70', 'X70 Plus', 'X90', 'X90 Plus', 'Dashing', 'T2', 'T1', 'X50']
  },
  {
    nameEn: 'MG', nameAr: 'إم جي', country: 'بريطانيا / الصين',
    models: ['MG3', 'MG4 EV', 'MG5', 'MG6', 'MG7', 'ZS', 'ZS EV', 'HS', 'RX5', 'RX8', 'RX9', 'One', 'Marvel R', 'Cyberster', 'GT', 'MGB', 'Midget', 'TF', 'ZR']
  },
  {
    nameEn: 'Haval', nameAr: 'هافال', country: 'الصين',
    models: ['H6', 'H6 GT', 'H9', 'Jolion', 'Dargo', 'Big Dog', 'Raptor', 'M6']
  },
  {
    nameEn: 'Tank', nameAr: 'تانك', country: 'الصين',
    models: ['Tank 300', 'Tank 400', 'Tank 500', 'Tank 700']
  },
  {
    nameEn: 'Great Wall', nameAr: 'جريت وول', country: 'الصين',
    models: ['Poer', 'Wingle 5', 'Wingle 7', 'Cannon', 'Florid', 'Voleex C30']
  },
  {
    nameEn: 'Ora', nameAr: 'أورا', country: 'الصين',
    models: ['Good Cat (Funky Cat)', 'Lightning Cat', 'Ballet Cat', 'Black Cat', 'White Cat']
  },
  {
    nameEn: 'Zeekr', nameAr: 'زيكر', country: 'الصين',
    models: ['001', '007', '009', 'X', '7X', 'Mix']
  },
  {
    nameEn: 'Li Auto', nameAr: 'لي أوتو', country: 'الصين',
    models: ['L6', 'L7', 'L8', 'L9', 'One', 'MEGA']
  },
  {
    nameEn: 'Nio', nameAr: 'نيو', country: 'الصين',
    models: ['ET5', 'ET5T', 'ET7', 'ET9', 'ES6', 'ES7', 'ES8', 'EC6', 'EC7']
  },
  {
    nameEn: 'XPeng', nameAr: 'إكس بينغ', country: 'الصين',
    models: ['P5', 'P7', 'P7i', 'G3', 'G6', 'G9', 'X9', 'Mona M03']
  },
  {
    nameEn: 'Xiaomi', nameAr: 'شاومي', country: 'الصين',
    models: ['SU7', 'SU7 Max', 'SU7 Ultra', 'YU7']
  },
  {
    nameEn: 'Avatr', nameAr: 'أفاتر', country: 'الصين',
    models: ['11', '12', '07']
  },
  {
    nameEn: 'Denza', nameAr: 'دينزا', country: 'الصين',
    models: ['D9', 'N7', 'N8', 'Z9 GT']
  },
  {
    nameEn: 'Hongqi', nameAr: 'هونغتشي', country: 'الصين',
    models: ['H5', 'H6', 'H9', 'HS3', 'HS5', 'HS7', 'E-HS9', 'E-QM5', 'EH7']
  },
  {
    nameEn: 'Voyah', nameAr: 'فويا', country: 'الصين',
    models: ['Free', 'Dream', 'Passion', 'Courage']
  },
  {
    nameEn: 'Rox', nameAr: 'روكس', country: 'الصين',
    models: ['01', 'Polestones 01']
  },
  {
    nameEn: 'Aito', nameAr: 'آيتو', country: 'الصين',
    models: ['M5', 'M7', 'M9']
  },
  {
    nameEn: 'Leapmotor', nameAr: 'ليب موتور', country: 'الصين',
    models: ['T03', 'C01', 'C10', 'C11', 'C16']
  },
  {
    nameEn: 'Seres', nameAr: 'سيريس', country: 'الصين',
    models: ['Seres 3', 'Seres 5', 'SF5']
  },
  {
    nameEn: 'Skywell', nameAr: 'سكاي ويل', country: 'الصين',
    models: ['ET5', 'HT-i']
  },
  {
    nameEn: 'Omoda', nameAr: 'أومودا', country: 'الصين',
    models: ['C5', 'E5', 'C7', 'C9']
  },
  {
    nameEn: 'Jaecoo', nameAr: 'جايكو', country: 'الصين',
    models: ['J7', 'J8', 'J6']
  },
  {
    nameEn: 'Exeed', nameAr: 'إكسيد', country: 'الصين',
    models: ['LX', 'TXL', 'VX', 'RX', 'Exlantix ES', 'Exlantix ET']
  },
  {
    nameEn: 'Lynk & Co', nameAr: 'لينك آند كو', country: 'الصين',
    models: ['01', '02', '03', '05', '06', '08', '09', 'Z10']
  },
  {
    nameEn: 'GAC', nameAr: 'جي إيه سي', country: 'الصين',
    models: ['GS3', 'GS4', 'GS5', 'GS8', 'Empow', 'Emkoo', 'GA4', 'GA6', 'GA8', 'Aion S', 'Aion Y', 'Aion V', 'Aion LX', 'Hyper GT', 'Hyper HT']
  },
  {
    nameEn: 'Dongfeng', nameAr: 'دونغ فينغ', country: 'الصين',
    models: ['Shine', 'Shine Max', 'Huge', 'Mage', 'Box', 'Nammi 01', 'Forthing T5', 'Forthing Friday', 'Rich 6']
  },
  {
    nameEn: 'BAIC', nameAr: 'بايك', country: 'الصين',
    models: ['BJ40', 'BJ60', 'BJ80', 'X35', 'X55', 'X7', 'U5 Plus', 'EU5', 'EU7', 'Arcfox Alpha-T', 'Arcfox Alpha-S']
  },
  {
    nameEn: 'JAC', nameAr: 'جاك', country: 'الصين',
    models: ['J7', 'JS2', 'JS3', 'JS4', 'JS6', 'JS8', 'T6', 'T8', 'iEV7S', 'E10X']
  },
  {
    nameEn: 'FAW', nameAr: 'فاو', country: 'الصين',
    models: ['Bestune T33', 'Bestune T55', 'Bestune T77', 'Bestune T99', 'Bestune B70', 'Bestune NAT']
  },
  {
    nameEn: 'Maxus', nameAr: 'ماكسوس', country: 'الصين',
    models: ['T60', 'T90', 'D60', 'D90', 'G10', 'G50', 'MIFA 9', 'EV30']
  },
  {
    nameEn: 'Soueast', nameAr: 'ساوايست', country: 'الصين',
    models: ['DX3', 'DX5', 'DX7', 'DX8', 'S07', 'S09']
  },
  {
    nameEn: 'Kaiyi', nameAr: 'كايي', country: 'الصين',
    models: ['X3', 'X3 Pro', 'X7', 'E5']
  },
  {
    nameEn: 'Wuling', nameAr: 'ولينغ', country: 'الصين',
    models: ['Hongguang Mini EV', 'Bingo', 'Air EV', 'Almaz', 'Starlight']
  },
  // European Brands (Classic & Modern)
  {
    nameEn: 'Peugeot', nameAr: 'بيجو', country: 'فرنسا',
    models: ['204', '304', '404', '504', '505', '604', '205', '305', '405', '106', '206', '207', '208', 'e-208', '301', '306', '307', '308', '406', '407', '408', '508', '2008', 'e-2008', '3008', '5008', 'Partner', 'Rifter', 'Boxer', 'Expert', 'RCZ']
  },
  {
    nameEn: 'Renault', nameAr: 'رينو', country: 'فرنسا',
    models: ['R4', 'R5', 'R8', 'R9', 'R11', 'R12', 'R18', 'R19', 'R21', 'R25', 'Clio', 'Megane', 'Megane E-Tech', 'Fluence', 'Symbol', 'Taliant', 'Talisman', 'Laguna', 'Safrane', 'Captur', 'Kadjar', 'Austral', 'Koleos', 'Duster', 'Arkana', 'Zoe', 'Twizy', 'Kangoo', 'Trafic', 'Master']
  },
  {
    nameEn: 'Citroen', nameAr: 'ستروين', country: 'فرنسا',
    models: ['2CV', 'DS', 'CX', 'BX', 'XM', 'ZX', 'Saxo', 'Xsara', 'C1', 'C2', 'C3', 'e-C3', 'C3 Aircross', 'C4', 'e-C4', 'C4 Cactus', 'C5', 'C5 Aircross', 'C6', 'Berlingo', 'Ami']
  },
  {
    nameEn: 'DS Automobiles', nameAr: 'دي إس', country: 'فرنسا',
    models: ['DS 3', 'DS 4', 'DS 5', 'DS 7', 'DS 9']
  },
  {
    nameEn: 'Fiat', nameAr: 'فيات', country: 'إيطاليا',
    models: ['124', '125', '126', '127', '128', '131', '132', 'Uno', 'Regata', 'Tempra', 'Tipo', 'Punto', 'Bravo', 'Brava', 'Linea', '500', '500e', '500X', '500L', 'Panda', 'Doblo', 'Ducato', 'Fiorino', '124 Spider']
  },
  {
    nameEn: 'Alfa Romeo', nameAr: 'ألفا روميو', country: 'إيطاليا',
    models: ['Giulia', 'Stelvio', 'Tonale', 'Junior', 'Giulietta', 'MiTo', '147', '156', '159', '166', 'Spider', 'GTV', 'Brera', '4C', '8C']
  },
  {
    nameEn: 'Lancia', nameAr: 'لانشيا', country: 'إيطاليا',
    models: ['Delta', 'Delta Integrale', 'Thema', 'Dedra', 'Kappa', 'Lybra', 'Ypsilon', 'Stratos', 'Fulvia']
  },
  {
    nameEn: 'Skoda', nameAr: 'سكودا', country: 'التشيك',
    models: ['Octavia', 'Superb', 'Fabia', 'Rapid', 'Scala', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Elroq', 'Yeti', 'Roomster', 'Felicia', 'Favorit', '120']
  },
  {
    nameEn: 'SEAT', nameAr: 'سيات', country: 'إسبانيا',
    models: ['Ibiza', 'Leon', 'Toledo', 'Cordoba', 'Arona', 'Ateca', 'Tarraco', 'Altea', 'Exeo', 'Mii', 'Marbella']
  },
  {
    nameEn: 'Cupra', nameAr: 'كوبرا', country: 'إسبانيا',
    models: ['Formentor', 'Born', 'Leon', 'Ateca', 'Tavascan', 'Terramar']
  },
  {
    nameEn: 'Volvo', nameAr: 'فولفو', country: 'السويد',
    models: ['140', '240', '244', '740', '760', '850', '940', '960', 'S40', 'S60', 'S80', 'S90', 'V40', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90', 'C30', 'C40', 'C70', 'EX30', 'EX90', 'EM90']
  },
  {
    nameEn: 'Saab', nameAr: 'ساب', country: 'السويد',
    models: ['96', '99', '900', '9000', '9-3', '9-5', '9-7X']
  },
  {
    nameEn: 'Land Rover', nameAr: 'لاند روفر', country: 'بريطانيا',
    models: ['Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque', 'Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Series I', 'Series II', 'Series III']
  },
  {
    nameEn: 'Jaguar', nameAr: 'جاغوار', country: 'بريطانيا',
    models: ['XE', 'XF', 'XJ', 'XJ6', 'XJ12', 'XJS', 'XK', 'F-Type', 'F-Pace', 'E-Pace', 'I-Pace', 'S-Type', 'X-Type', 'E-Type']
  },
  {
    nameEn: 'MINI', nameAr: 'ميني', country: 'بريطانيا',
    models: ['Cooper', 'Cooper S', 'Clubman', 'Countryman', 'Paceman', 'Aceman', 'Classic Mini', 'John Cooper Works']
  },
  {
    nameEn: 'Smart', nameAr: 'سمارت', country: 'ألمانيا',
    models: ['Fortwo', 'Forfour', '#1', '#3', '#5', 'Roadster']
  },
  {
    nameEn: 'Polestar', nameAr: 'بولستار', country: 'السويد',
    models: ['Polestar 1', 'Polestar 2', 'Polestar 3', 'Polestar 4']
  },
  {
    nameEn: 'Rover', nameAr: 'روفر', country: 'بريطانيا',
    models: ['25', '45', '75', '200', '400', '600', '800', 'SD1']
  },
  // American & EV Brands
  {
    nameEn: 'GMC', nameAr: 'جي إم سي', country: 'أمريكا',
    models: ['Yukon', 'Yukon XL', 'Sierra', 'Acadia', 'Terrain', 'Canyon', 'Envoy', 'Jimmy', 'Safari', 'Savana', 'Hummer EV']
  },
  {
    nameEn: 'Cadillac', nameAr: 'كاديلاك', country: 'أمريكا',
    models: ['Escalade', 'CTS', 'CT4', 'CT5', 'CT6', 'ATS', 'STS', 'DTS', 'DeVille', 'Eldorado', 'Fleetwood', 'SRX', 'XT4', 'XT5', 'XT6', 'Lyriq', 'Celestiq', 'Optiq']
  },
  {
    nameEn: 'Jeep', nameAr: 'جيب', country: 'أمريكا',
    models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Wagoneer', 'Grand Wagoneer', 'Commander', 'Liberty', 'Patriot', 'CJ-5', 'CJ-7', 'Avenger']
  },
  {
    nameEn: 'Dodge', nameAr: 'دودج', country: 'أمريكا',
    models: ['Charger', 'Challenger', 'Durango', 'Journey', 'Dart', 'Neon', 'Avenger', 'Caliber', 'Hornet', 'Viper', 'Coronet', 'Polara', 'Ram', 'Nitro', 'Magnum']
  },
  {
    nameEn: 'RAM', nameAr: 'رام', country: 'أمريكا',
    models: ['1500', '2500', '3500', 'TRX', 'ProMaster', '1500 REV']
  },
  {
    nameEn: 'Chrysler', nameAr: 'كرايسلر', country: 'أمريكا',
    models: ['300', '300C', 'Pacifica', 'Town & Country', 'Sebring', '200', 'Concorde', 'LHS', 'PT Cruiser', 'Crossfire', 'New Yorker', 'Voyager']
  },
  {
    nameEn: 'Lincoln', nameAr: 'لينكولن', country: 'أمريكا',
    models: ['Navigator', 'Aviator', 'Nautilus', 'Corsair', 'MKZ', 'MKX', 'MKC', 'Continental', 'Town Car', 'LS']
  },
  {
    nameEn: 'Buick', nameAr: 'بويك', country: 'أمريكا',
    models: ['Regal', 'LaCrosse', 'LeSabre', 'Century', 'Park Avenue', 'Riviera', 'Enclave', 'Encore', 'Envision', 'Electra', 'Skylark']
  },
  {
    nameEn: 'Pontiac', nameAr: 'بونتياك', country: 'أمريكا',
    models: ['Firebird', 'Trans Am', 'GTO', 'Grand Prix', 'Bonneville', 'Grand Am', 'Sunfire', 'Solstice', 'G6', 'G8', 'Fiero', 'Tempest']
  },
  {
    nameEn: 'Oldsmobile', nameAr: 'أولدزموبيل', country: 'أمريكا',
    models: ['Cutlass', 'Delta 88', 'Ninety-Eight', 'Toronado', 'Alero', 'Aurora', 'Intrigue', '442']
  },
  {
    nameEn: 'Plymouth', nameAr: 'بليموث', country: 'أمريكا',
    models: ['Barracuda', 'Road Runner', 'Fury', 'Duster', 'Valiant', 'Satellite', 'Voyager', 'Prowler']
  },
  {
    nameEn: 'Mercury', nameAr: 'ميركوري', country: 'أمريكا',
    models: ['Grand Marquis', 'Cougar', 'Marauder', 'Milan', 'Montego', 'Mountaineer', 'Sable']
  },
  {
    nameEn: 'Hummer', nameAr: 'هامر', country: 'أمريكا',
    models: ['H1', 'H2', 'H3', 'H3T']
  },
  {
    nameEn: 'Saturn', nameAr: 'ساتورن', country: 'أمريكا',
    models: ['S-Series', 'Ion', 'Aura', 'Vue', 'Sky', 'Outlook']
  },
  {
    nameEn: 'Scion', nameAr: 'سيون', country: 'اليابان / أمريكا',
    models: ['tC', 'xB', 'xD', 'FR-S', 'iQ', 'iM', 'iA']
  },
  {
    nameEn: 'Rivian', nameAr: 'ريفيان', country: 'أمريكا',
    models: ['R1T', 'R1S', 'R2', 'R3']
  },
  {
    nameEn: 'Lucid', nameAr: 'لوسيد', country: 'أمريكا',
    models: ['Air', 'Air Pure', 'Air Touring', 'Air Sapphire', 'Gravity']
  },
  {
    nameEn: 'Fisker', nameAr: 'فيسكر', country: 'أمريكا',
    models: ['Karma', 'Ocean']
  },
  {
    nameEn: 'DeLorean', nameAr: 'دي لوريان', country: 'أمريكا',
    models: ['DMC-12', 'Alpha5']
  },
  // Japanese & Korean remaining brands
  {
    nameEn: 'Subaru', nameAr: 'سوبارو', country: 'اليابان',
    models: ['Impreza', 'WRX', 'WRX STI', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'XV', 'BRZ', 'Ascent', 'Solterra', 'Justy', 'Leone']
  },
  {
    nameEn: 'Suzuki', nameAr: 'سوزوكي', country: 'اليابان',
    models: ['Swift', 'Jimny', 'Vitara', 'Grand Vitara', 'SX4', 'Alto', 'Baleno', 'Celerio', 'Ignis', 'Ciaz', 'Ertiga', 'Samurai', 'Carry', 'eVitara']
  },
  {
    nameEn: 'Infiniti', nameAr: 'إنفينيتي', country: 'اليابان',
    models: ['Q50', 'Q60', 'Q70', 'QX50', 'QX55', 'QX60', 'QX70', 'QX80', 'G35', 'G37', 'FX35', 'FX45', 'FX50', 'EX35', 'M35', 'M45']
  },
  {
    nameEn: 'Acura', nameAr: 'أكيورا', country: 'اليابان',
    models: ['ILX', 'TLX', 'Integra', 'RLX', 'MDX', 'RDX', 'ZDX', 'NSX', 'RSX', 'TSX', 'TL', 'Legend']
  },
  {
    nameEn: 'Isuzu', nameAr: 'إيسوزو', country: 'اليابان',
    models: ['D-Max', 'MU-X', 'Trooper', 'Rodeo', 'Axiom', 'N-Series', 'NPR', 'Gemini']
  },
  {
    nameEn: 'Daihatsu', nameAr: 'دايهاتسو', country: 'اليابان',
    models: ['Charade', 'Sirion', 'Terios', 'Rocky', 'Mira', 'Cuore', 'Materia', 'Move', 'Copen', 'Applause', 'Feroza']
  },
  {
    nameEn: 'Datsun', nameAr: 'داتسون', country: 'اليابان',
    models: ['120Y', '160J', '180B', '240Z', '260Z', '280Z', '280ZX', '510', '620 Pickup', '720 Pickup', 'Sunny']
  },
  {
    nameEn: 'Genesis', nameAr: 'جينيسيس', country: 'كوريا الجنوبية',
    models: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80', 'Electrified G80', 'Electrified GV70']
  },
  {
    nameEn: 'Daewoo', nameAr: 'دايو', country: 'كوريا الجنوبية',
    models: ['Racer', 'Cielo', 'Nexia', 'Espero', 'Lanos', 'Nubira', 'Leganza', 'Matiz', 'Kalos', 'Lacetti', 'Tacuma', 'Magnus', 'Super Salon', 'Prince']
  },
  {
    nameEn: 'SsangYong / KGM', nameAr: 'سانغ يونغ / KGM', country: 'كوريا الجنوبية',
    models: ['Tivoli', 'Korando', 'Rexton', 'Torres', 'Torres EVX', 'Actyon', 'Kyron', 'Musso', 'Rodius', 'Chairman']
  },
  // Luxury, Supercars & Hypercars
  {
    nameEn: 'Rolls-Royce', nameAr: 'رولز رويس', country: 'بريطانيا',
    models: ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spectre', 'Silver Shadow', 'Silver Spirit', 'Silver Spur', 'Corniche']
  },
  {
    nameEn: 'Bentley', nameAr: 'بنتلي', country: 'بريطانيا',
    models: ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Arnage', 'Azure', 'Brooklands', 'Turbo R']
  },
  {
    nameEn: 'Ferrari', nameAr: 'فيراري', country: 'إيطاليا',
    models: ['296 GTB', '488', 'F8 Tributo', 'Roma', 'Portofino', 'SF90 Stradale', 'Purosangue', '812 Superfast', '12Cilindri', '458 Italia', 'F430', '360 Modena', 'Testarossa', 'F40', 'F50', 'Enzo', 'LaFerrari', '308', '328', 'California']
  },
  {
    nameEn: 'Lamborghini', nameAr: 'لامبورغيني', country: 'إيطاليا',
    models: ['Huracan', 'Aventador', 'Revuelto', 'Urus', 'Temerario', 'Gallardo', 'Murcielago', 'Diablo', 'Countach', 'Miura', 'LM002', 'Sian']
  },
  {
    nameEn: 'McLaren', nameAr: 'ماكلارين', country: 'بريطانيا',
    models: ['720S', '750S', '765LT', 'Artura', '570S', '600LT', '650S', 'GT', 'GTS', '12C', 'P1', 'Senna', 'Speedtail', 'F1']
  },
  {
    nameEn: 'Aston Martin', nameAr: 'أستون مارتن', country: 'بريطانيا',
    models: ['DB11', 'DB12', 'DBS', 'Vantage', 'DBX', 'DB9', 'DB7', 'DB5', 'Vanquish', 'Rapide', 'Valkyrie', 'Valhalla']
  },
  {
    nameEn: 'Maserati', nameAr: 'مازيراتي', country: 'إيطاليا',
    models: ['Ghibli', 'Quattroporte', 'Levante', 'Grecale', 'GranTurismo', 'GranCabrio', 'MC20', 'Biturbo', '3200 GT']
  },
  {
    nameEn: 'Bugatti', nameAr: 'بوغاتي', country: 'فرنسا',
    models: ['Veyron', 'Chiron', 'Divo', 'Mistral', 'Tourbillon', 'EB110']
  },
  {
    nameEn: 'Koenigsegg', nameAr: 'كوينيجسيج', country: 'السويد',
    models: ['Agera', 'Regera', 'Jesko', 'Gemera', 'CCX']
  },
  {
    nameEn: 'Pagani', nameAr: 'باغاني', country: 'إيطاليا',
    models: ['Zonda', 'Huayra', 'Utopia']
  },
  {
    nameEn: 'Lotus', nameAr: 'لوتس', country: 'بريطانيا',
    models: ['Elise', 'Exige', 'Evora', 'Emira', 'Eletre', 'Emeya', 'Esprit']
  },
  {
    nameEn: 'Maybach', nameAr: 'مايباخ', country: 'ألمانيا',
    models: ['57', '62', 'S 580', 'S 680', 'GLS 600', 'EQS 680']
  },
  {
    nameEn: 'Alpine', nameAr: 'ألبين', country: 'فرنسا',
    models: ['A110', 'A290']
  },
  // Russian, Eastern European, Turkish, Indian, Malaysian, Vietnamese
  {
    nameEn: 'Lada', nameAr: 'لادا', country: 'روسيا',
    models: ['2101', '2104', '2105', '2106', '2107', 'Niva', 'Niva Legend', 'Niva Travel', 'Samara', 'Priora', 'Kalina', 'Granta', 'Vesta', 'XRAY']
  },
  {
    nameEn: 'Moskvitch', nameAr: 'موسكوفيتش', country: 'روسيا',
    models: ['408', '412', '2140', '2141 (Aleko)', 'Moskvitch 3', 'Moskvitch 6']
  },
  {
    nameEn: 'Zastava', nameAr: 'زاستافا', country: 'صربيا',
    models: ['Yugo', '101', '128', 'Florida']
  },
  {
    nameEn: 'Dacia', nameAr: 'داسيا', country: 'رومانيا',
    models: ['Logan', 'Sandero', 'Duster', 'Jogger', 'Spring', '1300', '1310']
  },
  {
    nameEn: 'Togg', nameAr: 'توج', country: 'تركيا',
    models: ['T10X', 'T10F']
  },
  {
    nameEn: 'VinFast', nameAr: 'فين فاست', country: 'فيتنام',
    models: ['VF 3', 'VF 5', 'VF 6', 'VF 7', 'VF 8', 'VF 9', 'Lux A2.0', 'Lux SA2.0']
  },
  {
    nameEn: 'Proton', nameAr: 'بروتون', country: 'ماليزيا',
    models: ['Saga', 'Wira', 'Persona', 'Gen-2', 'Satria', 'Perdana', 'Exora', 'X50', 'X70', 'X90', 'e.MAS 7']
  },
  {
    nameEn: 'Perodua', nameAr: 'بيرودوا', country: 'ماليزيا',
    models: ['Myvi', 'Axia', 'Bezza', 'Alza', 'Ativa', 'Aruz']
  },
  {
    nameEn: 'Tata', nameAr: 'تاتا', country: 'الهند',
    models: ['Nano', 'Indica', 'Indigo', 'Tiago', 'Altroz', 'Nexon', 'Nexon EV', 'Harrier', 'Safari', 'Punch', 'Xenon']
  },
  {
    nameEn: 'Mahindra', nameAr: 'ماهيندرا', country: 'الهند',
    models: ['Scorpio', 'XUV300', 'XUV500', 'XUV700', 'Thar', 'Bolero', 'Pik-Up']
  },
  {
    nameEn: 'Maruti Suzuki', nameAr: 'ماروتي سوزوكي', country: 'الهند',
    models: ['800', 'Alto', 'Wagon R', 'Swift', 'Dzire', 'Brezza', 'Ertiga', 'Fronx']
  },
  {
    nameEn: 'UAZ', nameAr: 'أواز', country: 'روسيا',
    models: ['469', 'Hunter', 'Patriot', 'Bukhanka (452)']
  },
  {
    nameEn: 'GAZ', nameAr: 'غاز', country: 'روسيا',
    models: ['Volga 21', 'Volga 24', 'Volga 3110', 'Gazelle']
  },
  {
    nameEn: 'Austin', nameAr: 'أوستن', country: 'بريطانيا',
    models: ['Mini', 'Allegro', 'Maxi', 'Princess', 'Metro', 'Maestro', 'Montego']
  },
  {
    nameEn: 'Triumph', nameAr: 'ترايمف', country: 'بريطانيا',
    models: ['Spitfire', 'TR6', 'TR7', 'Stag', 'Herald', 'Dolomite']
  },
  {
    nameEn: 'Trabant', nameAr: 'ترابانت', country: 'ألمانيا',
    models: ['601', 'P50', '1.1']
  },
  {
    nameEn: 'Iveco', nameAr: 'إيفيكو', country: 'إيطاليا',
    models: ['Daily', 'Eurocargo', 'Stralis']
  },
  {
    nameEn: 'Holden', nameAr: 'هولدن', country: 'أستراليا',
    models: ['Commodore', 'Monaro', 'Statesman', 'Caprice', 'Ute', 'Torana']
  },
  {
    nameEn: 'Vauxhall', nameAr: 'فوكسهول', country: 'بريطانيا',
    models: ['Corsa', 'Astra', 'Vectra', 'Insignia', 'Cavalier', 'Nova', 'Omega', 'Mokka']
  },
  {
    nameEn: 'Polonez', nameAr: 'بولونيز', country: 'بولندا',
    models: ['FSO Polonez', 'Caro', 'Atu']
  },
  {
    nameEn: 'Saipa', nameAr: 'سايبا', country: 'إيران',
    models: ['Pride', 'Tiba', 'Saina', 'Quick', 'Shahin']
  },
  {
    nameEn: 'Iran Khodro (IKCO)', nameAr: 'إيران خودرو', country: 'إيران',
    models: ['Paykan', 'Samand', 'Dena', 'Tara', 'Runna', 'Soren']
  },
  {
    nameEn: 'JMC', nameAr: 'جي إم سي الصينية', country: 'الصين',
    models: ['Vigus', 'Boarding', 'Carrying']
  },
  {
    nameEn: 'Foton', nameAr: 'فوتون', country: 'الصين',
    models: ['Tunland', 'Gratour', 'View', 'Sauvana']
  },
  {
    nameEn: 'Neta', nameAr: 'نيتا', country: 'الصين',
    models: ['Neta V', 'Neta U', 'Neta S', 'Neta GT', 'Neta X', 'Neta L']
  },
  {
    nameEn: 'Arcfox', nameAr: 'أرك فوكس', country: 'الصين',
    models: ['Alpha-S', 'Alpha-T', 'Alpha-T5', 'Kaola']
  },
  {
    nameEn: 'Yangwang', nameAr: 'يانغ وانغ', country: 'الصين',
    models: ['U8', 'U9', 'U7']
  },
  {
    nameEn: 'Fangchengbao', nameAr: 'فانغ تشينغ باو', country: 'الصين',
    models: ['Bao 5', 'Bao 8', 'Bao 3']
  },
  {
    nameEn: 'Aurus', nameAr: 'أوروس', country: 'روسيا',
    models: ['Senat', 'Komendant']
  },
  {
    nameEn: 'Caterham', nameAr: 'كاترهام', country: 'بريطانيا',
    models: ['Seven 170', 'Seven 420', 'Seven 620']
  },
  {
    nameEn: 'Morgan', nameAr: 'مورغان', country: 'بريطانيا',
    models: ['Plus Four', 'Plus Six', '3 Wheeler', 'Super 3']
  },
  {
    nameEn: 'Karmann', nameAr: 'كارمان', country: 'ألمانيا',
    models: ['Ghia']
  },
  {
    nameEn: 'Studebaker', nameAr: 'ستوديبيكر', country: 'أمريكا',
    models: ['Hawk', 'Lark', 'Avanti', 'Commander']
  },
  {
    nameEn: 'Packard', nameAr: 'باكارد', country: 'أمريكا',
    models: ['Clipper', 'Caribbean', ' Patrician']
  },
];

async function main() {
  // Merge models from car-list.json if present
  const carListPath = path.join(__dirname, 'car-list.json');
  const brandMap = new Map();

  for (const b of GLOBAL_BRANDS) {
    brandMap.set(toSlug(b.nameEn), {
      nameEn: b.nameEn.trim(),
      nameAr: b.nameAr.trim(),
      country: b.country,
      models: new Set(b.models.map((m) => m.trim()).filter(Boolean)),
    });
  }

  if (fs.existsSync(carListPath)) {
    const extra = JSON.parse(fs.readFileSync(carListPath, 'utf8'));
    for (const item of extra) {
      const slug = toSlug(item.brand);
      // Map some common European spellings to canonical names
      const aliasMap = {
        'mercedes-benz': 'mercedes-benz',
        'vw': 'volkswagen',
        'volkswagen': 'volkswagen',
        'citro-n': 'citroen',
        'citroen': 'citroen',
        'land-rover': 'land-rover',
        'alfa-romeo': 'alfa-romeo',
      };
      const canonical = aliasMap[slug] || slug;
      if (!brandMap.has(canonical)) {
        brandMap.set(canonical, {
          nameEn: item.brand.trim(),
          nameAr: item.brand.trim(),
          country: null,
          models: new Set((item.models || []).map((m) => m.trim()).filter(Boolean)),
        });
      } else {
        const entry = brandMap.get(canonical);
        for (const m of item.models || []) {
          if (m && m.trim()) entry.models.add(m.trim());
        }
      }
    }
  }

  // Load existing brands & models from DB
  const existingBrands = await prisma.brand.findMany({
    select: { id: true, nameEn: true, nameAr: true, slug: true },
  });
  const slugToBrandId = new Map();
  const enToBrandId = new Map();
  for (const b of existingBrands) {
    slugToBrandId.set(b.slug.toLowerCase(), b.id);
    if (b.nameEn) enToBrandId.set(b.nameEn.trim().toLowerCase(), b.id);
  }

  console.log(`Existing brands: ${existingBrands.length}`);

  // 1. Insert missing brands in batches
  const brandsToInsert = [];
  for (const [slug, b] of brandMap.entries()) {
    const existingId =
      slugToBrandId.get(slug) || enToBrandId.get(b.nameEn.toLowerCase());
    if (existingId) {
      b.dbId = existingId;
    } else {
      const id = 'cm' + crypto.randomBytes(11).toString('hex');
      b.dbId = id;
      slugToBrandId.set(slug, id);
      brandsToInsert.push({
        id,
        nameAr: b.nameAr,
        nameEn: b.nameEn,
        slug,
        country: b.country || null,
      });
    }
  }

  console.log(`New brands to insert: ${brandsToInsert.length}`);
  for (let i = 0; i < brandsToInsert.length; i += 50) {
    const batch = brandsToInsert.slice(i, i + 50);
    const values = [];
    const params = [];
    let pIdx = 1;
    for (const item of batch) {
      values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, true)`);
      params.push(item.id, item.nameAr, item.nameEn, item.slug, item.country);
    }
    const sql = `INSERT INTO "brands" ("id", "nameAr", "nameEn", "slug", "country", "isActive") VALUES ${values.join(', ')} ON CONFLICT ("slug") DO NOTHING`;
    await prisma.$executeRawUnsafe(sql, ...params);
  }

  // Re-fetch brand IDs in case any conflicted by slug
  const allBrands = await prisma.brand.findMany({
    select: { id: true, slug: true, nameEn: true },
  });
  const finalSlugToId = new Map(allBrands.map((b) => [b.slug.toLowerCase(), b.id]));
  const finalEnToId = new Map(allBrands.map((b) => [b.nameEn.trim().toLowerCase(), b.id]));

  // 2. Load existing models
  const existingModels = await prisma.carModel.findMany({
    select: { brandId: true, slug: true, nameEn: true },
  });
  const existingModelKeys = new Set();
  for (const m of existingModels) {
    existingModelKeys.add(`${m.brandId}::${m.slug.toLowerCase()}`);
    if (m.nameEn) existingModelKeys.add(`${m.brandId}::${m.nameEn.trim().toLowerCase()}`);
  }
  console.log(`Existing models: ${existingModels.length}`);

  const modelsToInsert = [];
  for (const [slug, b] of brandMap.entries()) {
    const brandId = finalSlugToId.get(slug) || finalEnToId.get(b.nameEn.toLowerCase()) || b.dbId;
    if (!brandId) continue;

    for (const modelName of b.models) {
      const mSlug = toSlug(modelName) || 'model';
      const key1 = `${brandId}::${mSlug}`;
      const key2 = `${brandId}::${modelName.toLowerCase()}`;
      if (existingModelKeys.has(key1) || existingModelKeys.has(key2)) continue;

      existingModelKeys.add(key1);
      existingModelKeys.add(key2);

      modelsToInsert.push({
        id: 'cm' + crypto.randomBytes(11).toString('hex'),
        nameAr: modelName,
        nameEn: modelName,
        slug: mSlug,
        brandId,
      });
    }
  }

  console.log(`New models to insert: ${modelsToInsert.length}`);
  for (let i = 0; i < modelsToInsert.length; i += 150) {
    const batch = modelsToInsert.slice(i, i + 150);
    const values = [];
    const params = [];
    let pIdx = 1;
    for (const item of batch) {
      values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, true)`);
      params.push(item.id, item.nameAr, item.nameEn, item.slug, item.brandId);
    }
    const sql = `INSERT INTO "car_models" ("id", "nameAr", "nameEn", "slug", "brandId", "isActive") VALUES ${values.join(', ')} ON CONFLICT ("slug", "brandId") DO NOTHING`;
    await prisma.$executeRawUnsafe(sql, ...params);
  }

  const [finalBrands, finalModels] = await Promise.all([
    prisma.brand.count({ where: { isActive: true } }),
    prisma.carModel.count({ where: { isActive: true } }),
  ]);
  console.log(`Done! Active brands: ${finalBrands}, Active models: ${finalModels}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
