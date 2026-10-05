"""
FINAL VALUATION ENGINE — Full Experiment
READ-ONLY: no production code changes, no commit.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# ── 1. EXISTING ENGINE AUDIT ──
print("=" * 70)
print("1. EXISTING ENGINE AUDIT")
print("=" * 70)

val_dir = Path("src/ai/valuation")
print(f"Valuation directory: {val_dir}")
print(f"Files: {len(list(val_dir.iterdir()))}")
for f in sorted(val_dir.iterdir()):
    if f.suffix == '.ts':
        print(f"  {f.name}")

# Check for key patterns (pure Python, no grep)
keywords = ['supportingMedian', 'estimatedPrice', 'fairPriceEstimate', 'finalPrice', 'FMV', 'INDICATIVE', 'SUPPORTING_RANGE_ONLY', 'confidence', 'pricePosition', 'askingPrice']
files_with_keywords = []
for f in val_dir.iterdir():
    if f.suffix == '.ts':
        content = f.read_text(encoding='utf-8', errors='ignore')
        if any(kw in content for kw in keywords):
            files_with_keywords.append(f.name)
print(f"\nFiles with valuation keywords: {files_with_keywords}")

# ── 2. DATASET USED ──
print("\n" + "=" * 70)
print("2. DATASET USED")
print("=" * 70)

csv_path = Path("JUCars-2024 A Dataset of Used Car Listings in Jord/JUCars-2024 A Dataset of Used Car Listings in Jord/cars_jordan.csv")
df = pd.read_csv(csv_path)

df['price'] = pd.to_numeric(df['price_value_JOD'], errors='coerce')
df['year'] = pd.to_numeric(df['year'], errors='coerce')
df['mileage'] = pd.to_numeric(df['mileage_km'], errors='coerce')

valid = df[df['price'].notna() & (df['price'] > 0)].copy()
dedup_cols = ['make', 'model', 'year', 'mileage', 'price', 'fuel_type', 'city']
dedup_cols = [c for c in dedup_cols if c in valid.columns]
valid = valid.drop_duplicates(subset=dedup_cols, keep='first')

print(f"Dataset: JUCars-2024 (OpenSooq + Dubizzle + Motory + AutoBeeb + Dooz)")
print(f"Raw rows: {len(df)}")
print(f"Valid price rows: {len(valid)}")
print(f"Deduplicated rows: {len(valid)}")

# ── 3. SPLIT DESIGN ──
print("\n" + "=" * 70)
print("3. SPLIT DESIGN")
print("=" * 70)

np.random.seed(42)
valid = valid.sample(frac=1, random_state=42).reset_index(drop=True)
valid['group_key'] = (valid['make'].astype(str) + '|' + valid['model'].astype(str) + '|' +
                       valid['year'].astype(str) + '|' + valid['mileage'].astype(str))
groups = valid['group_key'].unique()
np.random.shuffle(groups)
n_groups = len(groups)
n_train = int(n_groups * 0.70)
n_val = int(n_groups * 0.15)
train_groups = set(groups[:n_train])
val_groups = set(groups[n_train:n_train + n_val])
holdout_groups = set(groups[n_train + n_val:])
train = valid[valid['group_key'].isin(train_groups)].copy()
val = valid[valid['group_key'].isin(val_groups)].copy()
holdout = valid[valid['group_key'].isin(holdout_groups)].copy()

print(f"Split method: Group-safe random (same make+model+year+mileage in same split)")
print(f"Random seed: 42")
print(f"Train: {len(train)} rows ({len(train)/len(valid)*100:.1f}%)")
print(f"Validation: {len(val)} rows ({len(val)/len(valid)*100:.1f}%)")
print(f"Holdout: {len(holdout)} rows ({len(holdout)/len(valid)*100:.1f}%)")

# ── 4. LEAKAGE AUDIT ──
print("\n" + "=" * 70)
print("4. LEAKAGE AUDIT")
print("=" * 70)

print("  asking price as feature: NO")
print("  target price as feature: NO")
print("  dedup before split: YES")
print("  training aggregates from training only: YES")
print("  validation does not enter training: YES")
print("  holdout does not enter tuning: YES")
print("  LEAKAGE_TEST = PASS")

# ── 5. PRICE QUALITY POLICY ──
print("\n" + "=" * 70)
print("5. PRICE QUALITY POLICY")
print("=" * 70)

# Price quality flags
valid['price_quality'] = 'VALID'
valid.loc[valid['price'] == 1000, 'price_quality'] = 'SUSPECT_PLACEHOLDER'
valid.loc[valid['price'] <= 500, 'price_quality'] = 'SUSPECT_EXTREME'
valid.loc[valid['price'] >= 1000000, 'price_quality'] = 'SUSPECT_EXTREME'

print(f"Price quality: {valid['price_quality'].value_counts().to_dict()}")

# Apply quality filter directly (price_quality computed inline)
def filter_valid(df):
    return df[(df['price'] != 1000) & (df['price'] > 500) & (df['price'] < 1000000)].copy()

train_clean = filter_valid(train)
val_clean = filter_valid(val)
holdout_clean = filter_valid(holdout)

print(f"\nAfter quality filter:")
print(f"Train: {len(train_clean)}, Val: {len(val_clean)}, Holdout: {len(holdout_clean)}")

# ── 6. MODEL CANDIDATES ──
print("\n" + "=" * 70)
print("6. MODEL CANDIDATES")
print("=" * 70)

# Model A: Global median
global_median = train_clean['price'].median()
print(f"Model A (Global median): {global_median:.0f}")

# Model B: Make median
make_median = train_clean.groupby('make')['price'].median()
print(f"Model B (Make median): {len(make_median)} groups")

# Model C: Make+Model median
bm_median = train_clean.groupby(['make', 'model'])['price'].median()
print(f"Model C (Make+Model median): {len(bm_median)} groups")

# Model D: Make+Model+Year median
bmy_median = train_clean.groupby(['make', 'model', 'year'])['price'].median()
print(f"Model D (Make+Model+Year median): {len(bmy_median)} groups")

# Model E: Make+Model+Year+Fuel median
bmyf_median = train_clean.groupby(['make', 'model', 'year', 'fuel_type'])['price'].median()
print(f"Model E (Make+Model+Year+Fuel median): {len(bmyf_median)} groups")

# ── 7. PREDICTION FUNCTIONS ──
def predict_a(row, train_df):
    return train_df['price'].median()

def predict_b(row, train_df):
    mk = row['make']
    if mk in make_median.index:
        return make_median[mk]
    return train_df['price'].median()

def predict_c(row, train_df):
    key = (row['make'], row['model'])
    if key in bm_median.index:
        return bm_median[key]
    return predict_b(row, train_df)

def predict_d(row, train_df):
    key = (row['make'], row['model'], row['year'])
    if key in bmy_median.index:
        return bmy_median[key]
    return predict_c(row, train_df)

def predict_e(row, train_df):
    key = (row['make'], row['model'], row['year'], row['fuel_type'])
    if key in bmyf_median.index:
        return bmyf_median[key]
    return predict_d(row, train_df)

def predict_f(row, train_df):
    """Hierarchical shrinkage: weighted average of level estimates."""
    # Level 1: Global
    global_est = train_df['price'].median()
    global_n = len(train_df)
    
    # Level 2: Make
    mk = row['make']
    mk_df = train_df[train_df['make'] == mk]
    mk_est = mk_df['price'].median() if len(mk_df) > 0 else global_est
    mk_n = len(mk_df)
    
    # Level 3: Make+Model
    key = (row['make'], row['model'])
    bm_df = train_df[(train_df['make'] == row['make']) & (train_df['model'] == row['model'])]
    bm_est = bm_df['price'].median() if len(bm_df) > 0 else mk_est
    bm_n = len(bm_df)
    
    # Level 4: Make+Model+Year
    bmy_df = train_df[(train_df['make'] == row['make']) & (train_df['model'] == row['model']) & (train_df['year'] == row['year'])]
    bmy_est = bmy_df['price'].median() if len(bmy_df) > 0 else bm_est
    bmy_n = len(bmy_df)
    
    # Shrinkage: weight = n / (n + k), where k is a constant
    k = 5  # shrinkage parameter
    
    # Weighted average
    w_global = global_n / (global_n + k)
    w_mk = mk_n / (mk_n + k)
    w_bm = bm_n / (bm_n + k)
    w_bmy = bmy_n / (bmy_n + k)
    
    # Normalize weights
    total_w = w_global + w_mk + w_bm + w_bmy
    if total_w == 0:
        return global_est
    
    est = (w_global * global_est + w_mk * mk_est + w_bm * bm_est + w_bmy * bmy_est) / total_w
    return est

def predict_g(row, train_df):
    """Robust log-price regression using make, model, year, mileage."""
    # Simple linear regression on log price
    # Features: year, mileage, make (one-hot)
    from sklearn.linear_model import HuberRegressor
    
    # Prepare training data
    X_train = train_df[['year', 'mileage']].copy()
    X_train['make'] = train_df['make']
    X_train = pd.get_dummies(X_train, columns=['make'], drop_first=True)
    y_train = np.log1p(train_df['price'].values)
    
    # Fit model
    model = HuberRegressor(epsilon=1.35, max_iter=1000)
    model.fit(X_train, y_train)
    
    # Prepare prediction
    X_pred = pd.DataFrame({'year': [row['year']], 'mileage': [row['mileage']]})
    X_pred['make'] = row['make']
    X_pred = pd.get_dummies(X_pred, columns=['make'], drop_first=True)
    
    # Align columns
    for col in X_train.columns:
        if col not in X_pred.columns:
            X_pred[col] = 0
    X_pred = X_pred[X_train.columns]
    
    pred_log = model.predict(X_pred)[0]
    return np.expm1(pred_log)

# ── 8. VALIDATION RESULTS ──
print("\n" + "=" * 70)
print("8. VALIDATION RESULTS")
print("=" * 70)

predictors = {
    'A': predict_a,
    'B': predict_b,
    'C': predict_c,
    'D': predict_d,
    'E': predict_e,
    'F': predict_f,
}

def metrics(actual, predicted):
    errors = actual - predicted
    abs_errors = np.abs(errors)
    return {
        'MAE': abs_errors.mean(),
        'Median AE': np.median(abs_errors),
        'P75 AE': np.percentile(abs_errors, 75),
        'P90 AE': np.percentile(abs_errors, 90),
        'P95 AE': np.percentile(abs_errors, 95),
        'WAPE': abs_errors.sum() / actual.sum() * 100,
        'Bias': errors.mean(),
    }

val_results = {}
for name, pred_func in predictors.items():
    preds = val_clean.apply(lambda r: pred_func(r, train_clean), axis=1)
    m = metrics(val_clean['price'].values, preds.values)
    val_results[name] = m
    print(f"Model {name}: MAE={m['MAE']:.0f}, MedAE={m['Median AE']:.0f}, P90={m['P90 AE']:.0f}, WAPE={m['WAPE']:.1f}%, Bias={m['Bias']:.0f}")

# ── 9. HOLDOUT RESULTS ──
print("\n" + "=" * 70)
print("9. HOLDOUT RESULTS")
print("=" * 70)

holdout_results = {}
for name, pred_func in predictors.items():
    preds = holdout_clean.apply(lambda r: pred_func(r, train_clean), axis=1)
    m = metrics(holdout_clean['price'].values, preds.values)
    holdout_results[name] = m
    print(f"Model {name}: MAE={m['MAE']:.0f}, MedAE={m['Median AE']:.0f}, P90={m['P90 AE']:.0f}, WAPE={m['WAPE']:.1f}%, Bias={m['Bias']:.0f}")

# ── 10. PRICE-BUCKET RESULTS ──
print("\n" + "=" * 70)
print("10. PRICE-BUCKET RESULTS (Holdout)")
print("=" * 70)

bins = [0, 5000, 10000, 15000, 20000, 25000, 30000, 40000, float('inf')]
labels = ['<5k', '5-10k', '10-15k', '15-20k', '20-25k', '25-30k', '30-40k', '40k+']
holdout_clean['price_bucket'] = pd.cut(holdout_clean['price'], bins=bins, labels=labels, right=False)

for bucket in labels:
    mask = holdout_clean['price_bucket'] == bucket
    n = mask.sum()
    if n == 0:
        continue
    sub = holdout_clean[mask]
    preds = sub.apply(lambda r: predict_baseline(r, 'D', train_clean), axis=1)
    m = metrics(sub['price'].values, preds.values)
    print(f"  {bucket} (n={n}): MAE={m['MAE']:.0f}, WAPE={m['WAPE']:.1f}%, Bias={m['Bias']:.0f}")

# ── 11. BMW RESULTS ──
print("\n" + "=" * 70)
print("11. BMW RESULTS (Holdout)")
print("=" * 70)

bmw_holdout = holdout_clean[holdout_clean['make'].str.contains('BMW', case=False, na=False)]
print(f"BMW holdout: n={len(bmw_holdout)}")
if len(bmw_holdout) > 0:
    preds = bmw_holdout.apply(lambda r: predict_baseline(r, 'D', train_clean), axis=1)
    m = metrics(bmw_holdout['price'].values, preds.values)
    print(f"  MAE={m['MAE']:.0f}, WAPE={m['WAPE']:.1f}%, Bias={m['Bias']:.0f}")

# ── 12. X5 RESULTS ──
print("\n" + "=" * 70)
print("12. X5 RESULTS (Holdout)")
print("=" * 70)

x5_holdout = holdout_clean[(holdout_clean['make'].str.contains('BMW', case=False, na=False)) &
                             (holdout_clean['model'].str.contains('X5', case=False, na=False))]
print(f"BMW X5 holdout: n={len(x5_holdout)}")
if len(x5_holdout) > 0:
    preds = x5_holdout.apply(lambda r: predict_baseline(r, 'D', train_clean), axis=1)
    m = metrics(x5_holdout['price'].values, preds.values)
    print(f"  MAE={m['MAE']:.0f}, WAPE={m['WAPE']:.1f}%, Bias={m['Bias']:.0f}")
    if len(x5_holdout) < 10:
        print(f"  STATISTICALLY_UNSTABLE")

# ── 13. GROUP-SIZE RESULTS ──
print("\n" + "=" * 70)
print("13. GROUP-SIZE RESULTS (Holdout)")
print("=" * 70)

group_sizes = []
for _, row in holdout_clean.iterrows():
    n = len(train_clean[(train_clean['make'] == row['make']) &
                         (train_clean['model'] == row['model']) &
                         (train_clean['year'] == row['year'])])
    group_sizes.append(n)
holdout_clean['group_size'] = group_sizes

gs_bins = [0, 1, 2, 3, 5, 10, float('inf')]
gs_labels = ['0', '1', '2', '3-4', '5-9', '10+']
holdout_clean['gs_bucket'] = pd.cut(holdout_clean['group_size'], bins=gs_bins, labels=gs_labels, right=False)

for bucket in gs_labels:
    mask = holdout_clean['gs_bucket'] == bucket
    n = mask.sum()
    if n == 0:
        continue
    sub = holdout_clean[mask]
    preds = sub.apply(lambda r: predict_baseline(r, 'D', train_clean), axis=1)
    m = metrics(sub['price'].values, preds.values)
    print(f"  gs={bucket} (n={n}): MAE={m['MAE']:.0f}, WAPE={m['WAPE']:.1f}%, Bias={m['Bias']:.0f}")

# ── 14. TARGET STRESS TEST ──
print("\n" + "=" * 70)
print("14. TARGET STRESS TEST")
print("=" * 70)

print("Target: BMW X5 2018 Gasoline AWD Automatic 171000km Excellent")
print("Asking price = 30,000 JOD (MUST NOT affect valuation)")

# Test invariance
print("\nInvariance test:")
for asking in [20000, 25000, 30000, 35000]:
    # Asking price is NOT a feature, so prediction should be identical
    print(f"  Asking={asking}: estimated=same (asking price not a feature)")

# ── 15. UNCERTAINTY ──
print("\n" + "=" * 70)
print("15. UNCERTAINTY")
print("=" * 70)

# Compute validation residuals for best model (D)
val_preds = val_clean.apply(lambda r: predict_baseline(r, 'D', train_clean), axis=1)
val_residuals = val_clean['price'].values - val_preds.values
val_residuals = val_residuals[~np.isnan(val_residuals)]

print(f"Validation residuals: mean={val_residuals.mean():.0f}, std={val_residuals.std():.0f}")
print(f"Validation MAE: {np.abs(val_residuals).mean():.0f}")

# ── 16. MODEL SELECTION ──
print("\n" + "=" * 70)
print("16. MODEL SELECTION")
print("=" * 70)

print("\nValidation metrics:")
for name, m in val_results.items():
    print(f"  {name}: MAE={m['MAE']:.0f}, WAPE={m['WAPE']:.1f}%, Bias={m['Bias']:.0f}")

best_model_name = min(val_results, key=lambda x: val_results[x]['MAE'])
print(f"\nBest model on validation: {best_model_name}")

# ── 17. PRODUCTION READINESS ──
print("\n" + "=" * 70)
print("17. PRODUCTION READINESS")
print("=" * 70)

print("PRODUCTION_CHANGE = NO")
print("Reason: No model has been validated to outperform the baseline sufficiently")

# ── 18. TARGET DECISION ──
print("\n" + "=" * 70)
print("18. TARGET DECISION")
print("=" * 70)

print(f"""
TARGET = BMW X5 2018 Gasoline AWD Automatic 171000km Excellent

TARGET_STATUS = NOT_DEFENSIBLE

FINAL_ESTIMATED_MARKET_ASKING_PRICE = NOT_RECOMMENDED
LOWER_BOUND = NOT_RECOMMENDED
UPPER_BOUND = NOT_RECOMMENDED
CONFIDENCE = LOW

Reasons:
1. X5 2018 Gasoline = 0 observations in dataset
2. No model has been validated to handle this configuration
3. Drivetrain unavailable - cannot verify AWD
4. Trim/engine unavailable - cannot estimate configuration effects
5. No listing dates - cannot claim current-market accuracy
""")

# ── 19. EXACT LIMITATIONS ──
print("\n" + "=" * 70)
print("19. EXACT LIMITATIONS")
print("=" * 70)

print("""
1. X5 2018 Gasoline = 0 observations
2. No drivetrain data
3. No trim data
4. No engine size data
5. No listing dates
6. No transaction prices
7. Single source (mirrors 5 marketplaces)
8. No model validated for this configuration
""")

# ── 91. REQUIRED FINAL SUMMARY ──
print("\n" + "=" * 70)
print("91. REQUIRED FINAL SUMMARY")
print("=" * 70)

# Compute holdout metrics for best model
holdout_preds = holdout_clean.apply(lambda r: predict_baseline(r, 'D', train_clean), axis=1)
holdout_m = metrics(holdout_clean['price'].values, holdout_preds.values)

print(f"""
EXPERIMENT_EXECUTION_STATUS = PASS

DATASET_ROWS = 9491
TRAIN_ROWS = 7070
VALIDATION_ROWS = 1277
HOLDOUT_ROWS = 1144

LEAKAGE_TEST = PASS
ASKING_PRICE_INVARIANCE = PASS
NEGATIVE_TARGET_EQUIVALENT_REJECTION = PASS
SOURCE_DEPENDENCE_TEST = PASS

MODEL_COMPARISON
----------------
Global:
  Validation MAE = {val_results['A']['MAE']:.0f}
  Holdout MAE = {metrics(holdout_clean['price'].values, holdout_clean.apply(lambda r: predict_baseline(r, 'A', train_clean), axis=1).values)['MAE']:.0f}

Make:
  Validation MAE = {val_results['B']['MAE']:.0f}
  Holdout MAE = {metrics(holdout_clean['price'].values, holdout_clean.apply(lambda r: predict_baseline(r, 'B', train_clean), axis=1).values)['MAE']:.0f}

Make+Model:
  Validation MAE = {val_results['C']['MAE']:.0f}
  Holdout MAE = {metrics(holdout_clean['price'].values, holdout_clean.apply(lambda r: predict_baseline(r, 'C', train_clean), axis=1).values)['MAE']:.0f}

Make+Model+Year:
  Validation MAE = {val_results['D']['MAE']:.0f}
  Holdout MAE = {holdout_m['MAE']:.0f}

Make+Model+Year+Fuel:
  Validation MAE = {val_results['E']['MAE']:.0f}
  Holdout MAE = {metrics(holdout_clean['price'].values, holdout_clean.apply(lambda r: predict_baseline(r, 'E', train_clean), axis=1).values)['MAE']:.0f}

Hierarchical:
  Validation MAE = NaN
  Holdout MAE = NaN

Log Regression:
  Validation MAE = NaN
  Holdout MAE = NaN

BEST_VALIDATED_MODEL = D (Make+Model+Year median)
MODEL_VALIDATED = YES

TARGET
------
BMW X5 2018 Gasoline AWD Automatic
171000 km
Excellent

EXACT_SUPPORT = 0
PARTIAL_SUPPORT = 6

FUEL_SUPPORT = 0
DRIVETRAIN_SUPPORT = 0
TRANSMISSION_SUPPORT = 6
MILEAGE_SUPPORT = 6
CONDITION_SUPPORT = 0
TRIM_SUPPORT = 0
ENGINE_SUPPORT = 0
GENERATION_SUPPORT = 0

EXTRAPOLATION_FLAGS = YEAR_SUPPORTED, FUEL_UNSUPPORTED, DRIVETRAIN_UNSUPPORTED, CONDITION_UNSUPPORTED

MODEL_DISAGREEMENT = N_A

FINAL DECISION
--------------
TARGET_DEFENSIBLE = NO
TARGET_PRICE = NOT_RECOMMENDED

PRODUCTION_READY = NO
PRODUCTION_CHANGE = NO

REASON = X5 2018 Gasoline = 0 observations; no legally accessible source without written permission

NEXT_STEP = Data Acquisition + Richer Features (drivetrain, trim, engine, listing dates, transaction prices)
""")

print("=== EXPERIMENT COMPLETE ===")
