export {};

async function test(id: string) {
  for (const path of [`/ar/search/${id}`, `/en/search/${id}`, `/search/${id}`, `/ar/post/${id}`]) {
    const url = `https://jo.opensooq.com${path}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar,en;q=0.9',
        },
      });
      const text = await res.text();
      const title = text.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
      const isCar = text.includes('BMW') || text.includes('X5') || text.includes('سيارات');
      console.log(`[${id}] ${url} -> Status: ${res.status}, Title: "${title}", isCar=${isCar}`);
    } catch (e: any) {
      console.log(`[${id}] ${url} -> Error: ${e.message}`);
    }
  }
}

async function main() {
  console.log('--- Testing ID 287272368 (BMW X5 2024) ---');
  await test('287272368');
  console.log('\n--- Testing ID 287476186 (BMW X5 2013) ---');
  await test('287476186');
}

main().catch(console.error).finally(() => process.exit(0));
