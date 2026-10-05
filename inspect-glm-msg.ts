import OpenAI from 'openai';

async function main() {
  const apiKey = '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';
  const baseURL = 'https://integrate.api.nvidia.com/v1';

  const client = new OpenAI({ apiKey, baseURL, timeout: 120000 });

  console.log('Inspecting message object from z-ai/glm-5.3...');
  try {
    const res = await client.chat.completions.create({
      model: 'z-ai/glm-5.3',
      messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
      max_tokens: 100,
    });
    console.log('Message choice:', JSON.stringify(res.choices[0], null, 2));
  } catch (e: any) {
    console.log('Error:', e?.message || e);
  }
}

main().catch(console.error);
