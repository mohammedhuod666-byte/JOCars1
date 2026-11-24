const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'cars', 'add', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for SearchableBrandModelSelect if not already present
if (!content.includes('SearchableBrandModelSelect')) {
  const importTarget = "import { AIPriceEstimator } from '@/components/cars/AIPriceEstimator';";
  content = content.replace(
    importTarget,
    `import { AIPriceEstimator } from '@/components/cars/AIPriceEstimator';\nimport { SearchableBrandModelSelect } from '@/components/cars/SearchableBrandModelSelect';`
  );
  console.log('Added SearchableBrandModelSelect import.');
}

// 2. Replace the Brand & Model selects
const brandStartMarker = '<div>\r\n                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الشركة المصنعة (الماركة) *</label>';
const brandStartMarkerLF = '<div>\n                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الشركة المصنعة (الماركة) *</label>';

const modelEndMarker = '<FieldErrors fields={[\'modelId\']} errors={errors} />\r\n                </div>';
const modelEndMarkerLF = '<FieldErrors fields={[\'modelId\']} errors={errors} />\n                </div>';

let replaced = false;

const brandModelReplacement = `                {/* Searchable Brand & Model Selector */}
                <div className="sm:col-span-2">
                  <SearchableBrandModelSelect
                    brands={brands}
                    models={models}
                    selectedBrandId={form.brandId}
                    selectedModelId={form.modelId}
                    onBrandChange={(brandId) => {
                      updateForm('brandId', brandId);
                      updateForm('modelId', '');
                    }}
                    onModelChange={(modelId) => updateForm('modelId', modelId)}
                    brandError={errors.brandId}
                    modelError={errors.modelId}
                  />
                </div>`;

const searchIdx = content.indexOf('الشركة المصنعة (الماركة) *');
if (searchIdx !== -1) {
  // Find opening <div> before it
  const divOpenIdx = content.lastIndexOf('<div', searchIdx);
  // Find closing </div> after model
  const modelIdx = content.indexOf('الموديل (الطراز) *', searchIdx);
  if (modelIdx !== -1) {
    const fieldErrorsIdx = content.indexOf("<FieldErrors fields={['modelId']}", modelIdx);
    if (fieldErrorsIdx !== -1) {
      const divCloseIdx = content.indexOf('</div>', fieldErrorsIdx) + '</div>'.length;
      
      const before = content.slice(0, divOpenIdx);
      const after = content.slice(divCloseIdx);
      content = before + brandModelReplacement + after;
      console.log('Replaced old select elements with SearchableBrandModelSelect.');
      replaced = true;
    }
  }
}

if (!replaced) {
  console.error('Failed to find Brand & Model block!');
}

// 3. Upgrade theme colors across the page
// Page container
content = content.replace(
  'min-h-screen bg-slate-950 text-slate-100 pb-24 py-8',
  'min-h-screen bg-[#080a0f] text-slate-100 pb-28 pt-24 sm:pt-28'
);

// Header card
content = content.replace(
  'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border border-slate-800',
  'bg-gradient-to-b from-[#121622] via-[#141926] to-[#0d1017] border border-white/[0.08]'
);

content = content.replace(
  'bg-emerald-500/10 rounded-full blur-3xl',
  'bg-amber-500/10 rounded-full blur-3xl'
);

content = content.replace(
  'bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20',
  'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25'
);

content = content.replace(
  'text-emerald-400 text-xs font-bold',
  'text-amber-400 text-xs font-bold'
);

content = content.replace(
  'text-xs font-black text-emerald-400',
  'text-xs font-black text-amber-400'
);

content = content.replace(
  'from-emerald-500 to-teal-500',
  'from-amber-400 to-amber-500'
);

content = content.replace(
  "step === s.num\r\n                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'\r\n                    : step > s.num\r\n                      ? 'bg-slate-900 border-slate-800 text-emerald-400'",
  "step === s.num\r\n                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 font-black'\r\n                    : step > s.num\r\n                      ? 'bg-[#121622] border-white/[0.08] text-amber-400'"
);

content = content.replace(
  "step === s.num\n                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'\n                    : step > s.num\n                      ? 'bg-slate-900 border-slate-800 text-emerald-400'",
  "step === s.num\n                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 font-black'\n                    : step > s.num\n                      ? 'bg-[#121622] border-white/[0.08] text-amber-400'"
);

// Navigation button colors at bottom of steps
content = content.replace(
  /bg-emerald-500 hover:bg-emerald-400 text-slate-950/g,
  'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched page.tsx!');
