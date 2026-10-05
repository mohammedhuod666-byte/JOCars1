import OpenAI from 'openai';

async function main() {
  const apiKey = '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';
  const baseURL = 'https://integrate.api.nvidia.com/v1';

  const client = new OpenAI({ apiKey, baseURL, timeout: 120000 });

  console.log('Sending request to z-ai/glm-5.3 (timeout: 120s)...');
  const t0 = Date.now();

  try {
    const res = await client.chat.completions.create({
      model: 'z-ai/glm-5.3',
      messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
      max_tokens: 30,
    });
    console.log(`✅ Success in ${(Date.now() - t0) / 1000}s:`, res.choices[0]?.message?.content);
  } catch (e: any) {
    console.log(`❌ Failed in ${(Date.now() - t0) / 1000}s:`, e?.message || e);
  }
}

main().catch(console.error);
