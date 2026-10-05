import OpenAI from 'openai';

async function main() {
  const apiKey = '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';
  const baseURL = 'https://integrate.api.nvidia.com/v1';

  const client = new OpenAI({ apiKey, baseURL, timeout: 60000 });

  console.log('Testing streaming connection to NVIDIA NIM with model: z-ai/glm-5.3...');

  try {
    const stream = await client.chat.completions.create({
      model: 'z-ai/glm-5.3',
      messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
      max_tokens: 50,
      stream: true,
    });
    process.stdout.write('✅ Received stream chunks: ');
    for await (const chunk of stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }
    console.log('\nStream completed successfully!');
  } catch (e: any) {
    console.log('\n❌ Failed with stream:', e?.message || e);
  }
}

main().catch(console.error);
