import { runIntelligenceValuation } from './src/ai/valuation/intelligence-engine';

async function main() {
  const result = await runIntelligenceValuation({
    carId: 'cmui9bbmw00i710xa2pa3801b',
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
