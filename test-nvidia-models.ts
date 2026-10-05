import OpenAI from 'openai';

async function main() {
  const apiKey = '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';
  const baseURL = 'https://integrate.api.nvidia.com/v1';

  const client = new OpenAI({ apiKey, baseURL, timeout: 15000 });

  const models = [
    'meta/llama-3.3-70b-instruct',
    'meta/llama-3.1-70b-instruct',
    'mistralai/mistral-large-2-instruct',
    'deepseek-ai/deepseek-r1',
    'qwen/qwen2.5-72b-instruct',
    'z-ai/glm-4',
  ];

  for (const m of models) {
    try {
      process.stdout.write(`Testing ${m}... `);
      const res = await client.chat.completions.create({
        model: m,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      });
      console.log(`✅ SUCCESS: ${res.choices[0]?.message?.content?.trim()}`);
      return m;
    } catch (e: any) {
      console.log(`❌ (${e?.message?.slice(0, 50)})`);
    }
  }
}

main().catch(console.error);
