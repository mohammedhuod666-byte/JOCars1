import prisma from '../src/lib/prisma';
import { runIntelligenceValuation } from '../src/ai/valuation/intelligence-engine';

async function main() {
  console.log('=== STARTING LIVE VALUATION AUDIT: BMW X5 2018 ===');
  const result = await runIntelligenceValuation({ carId: 'cmui9bbmw00i710xa2pa3801b' });
  
  console.log('\n--- 1. TARGET VEHICLE SNAPSHOT ---');
  console.log(`Car ID: cmui9bbmw00i710xa2pa3801b | Asking Price: ${result.askingPrice?.toLocaleString()} JOD`);

  console.log('\n--- 2. MARKET EVIDENCE & SCREENING FUNNEL ---');
  console.log(`Total Listings Scanned: ${result.marketEvidence.totalListings}`);
  console.log(`Valid Listings: ${result.marketEvidence.validListings}`);
  console.log(`Approved Comparables: ${result.marketEvidence.usedComparables}`);
  console.log(`Excluded Listings: ${result.marketEvidence.excludedListings}`);
  console.log(`Unique Sources: ${result.marketEvidence.uniqueSources}`);
  console.log(`Same Year Share: ${Math.round(result.marketEvidence.sameYearShare * 100)}%`);

  console.log('\n--- 3. TARGET CLUSTER & EXCLUSIONS ---');
  console.log(`Target Cluster Count: ${result.targetCluster?.totalClusterCount || 0}`);
  if (result.targetCluster?.listings) {
    for (const tl of result.targetCluster.listings) {
      console.log(`  - Target Copy: [${tl.source}] ${tl.title} (${tl.price} JOD) - ${tl.reason}`);
    }
  }
  const excludedByReason: Record<string, number> = {};
  for (const ex of result.comparablesExcluded) {
    excludedByReason[ex.reasonCategory] = (excludedByReason[ex.reasonCategory] || 0) + 1;
  }
  console.log('Exclusion categories breakdown:', excludedByReason);

  console.log('\n--- 4. CROSS-MODEL CONTAMINATION AUDIT (ZERO TOLERANCE) ---');
  const nonX5Comps = result.comparablesUsed.filter(c => {
    const t = (c.title + ' ' + (c.model || '')).toLowerCase();
    return !t.includes('x5') && !t.includes('اكس 5') && !t.includes('اكس فايف');
  });
  console.log(`Non-X5 models among approved comparables: ${nonX5Comps.length} (MUST BE 0)`);
  if (nonX5Comps.length > 0) {
    console.error('CRITICAL ERROR: Foreign models leaked into comps:', nonX5Comps);
  } else {
    console.log('PASSED: 100% of approved comparables are BMW X5 models.');
  }

  console.log('\n--- 5. MARKET EMPIRICAL PERCENTILES (Strictly on Eligible Comps) ---');
  console.log('Percentiles:', result.marketEvidence.percentiles);

  console.log('\n--- 6. ASKING PRICE POSITION VS FMV (SEPARATED FROM PERCENTILE) ---');
  console.log(`Asking Price: ${result.askingPrice?.toLocaleString()} JOD`);
  console.log(`Classification: ${result.pricePosition.classification}`);
  console.log(`Premium vs FMV Amount: ${result.pricePosition.differenceAmount?.toLocaleString()} JOD`);
  console.log(`Premium vs FMV Percent: ${result.pricePosition.differencePercent}% (${result.pricePosition.premiumLabelAr})`);
  console.log(`Market Percentile Rank: ${result.pricePosition.percentileRank !== null ? `P${result.pricePosition.percentileRank}` : 'N/A'}`);
  console.log(`Percentile Label: ${result.pricePosition.percentileLabel}`);

  console.log('\n--- 7. CONSENSUS BAND & SENSITIVITY ---');
  console.log('Consensus Band:', result.consensusBand);
  console.log('Dominant Comparable Flag:', result.sensitivity.dominantComparable);
  console.log('Stability Score:', result.sensitivity.stabilityScore);

  console.log('\n--- 8. FINAL VALUATION OUTCOME ---');
  console.log(`Status: ${result.status}`);
  console.log(`Fair Market Value (FMV): ${result.fairMarketValue?.toLocaleString()} JOD`);
  console.log(`Fair Market Range: ${result.range.low?.toLocaleString()} – ${result.range.high?.toLocaleString()} JOD`);
  console.log(`Confidence Score: ${result.confidence}%`);

  console.log('\n--- 9. APPROVED COMPARABLES DETAILED TABLE ---');
  for (let i = 0; i < result.comparablesUsed.length; i++) {
    const c = result.comparablesUsed[i];
    console.log(`[${i + 1}] ${c.title} | Source: ${c.source} | Year: ${c.year} | Km: ${c.mileage?.toLocaleString() || 'N/A'} | Raw: ${c.originalPrice} JOD | Adj: ${c.adjustedPrice} JOD | Contrib: ${c.contributionPercent}% | Tier: ${c.tier} (${c.tierLabel}) | Weight: ${c.weight}`);
    console.log(`    URL Verification -> Canonical: ${c.canonicalUrl} | Status: ${c.urlStatus} | Evidence: ${c.evidenceStatus} | VerifiedAt: ${c.urlVerifiedAt}`);
    if (c.weightBreakdown) {
      console.log(`    Weights Breakdown -> Year: ${c.weightBreakdown.yearWeight} | Spec: ${c.weightBreakdown.technicalWeight} | Km: ${c.weightBreakdown.mileageWeight} | Source: ${c.weightBreakdown.sourceQualityWeight} | Age: ${c.weightBreakdown.recencyWeight}`);
    }
    if (c.adjustmentsList && c.adjustmentsList.length > 0) {
      console.log(`    Adjustments (${c.adjustmentsList.length}):`);
      for (const adj of c.adjustmentsList) {
        console.log(`      • ${adj.factorAr}: ${adj.delta > 0 ? '+' : ''}${adj.delta} JOD [${adj.provenance}] - ${adj.reason}`);
      }
    }
  }

  if (result.glmIntelligence) {
    console.log('\n--- 10. GLM INTELLIGENCE LAYER ---');
    console.log(`Generated by: ${result.glmIntelligence.generatedBy}`);
    console.log(`Market Summary: ${result.glmIntelligence.marketSummary}`);
    console.log('Key Drivers:');
    for (const d of result.glmIntelligence.keyDrivers) {
      console.log(`  - ${d.text} ${d.evidence ? `[${d.evidence.metric}=${d.evidence.value}]` : ''}`);
    }
    console.log('Data Warnings:');
    for (const w of result.glmIntelligence.dataWarnings) {
      console.log(`  - [${w.severity}] ${w.text}`);
    }
    console.log('Limitations:');
    for (const l of result.glmIntelligence.limitations) {
      console.log(`  - ${l}`);
    }
  }
  console.log('=== AUDIT COMPLETE ===');
}

main().catch(console.error).finally(() => process.exit(0));
