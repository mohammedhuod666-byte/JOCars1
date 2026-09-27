export {};

async function test() {
  const urls = [
    { name: 'opensooq', url: 'https://jo.opensooq.com' },
    { name: 'ordonauto', url: 'https://ordonauto.com' },
    { name: 'karmal', url: 'https://karmal.com' },
    { name: 'waseet', url: 'https://jo.waseet.net' },
    { name: 'autohub', url: 'https://autohub.jo' },
  ];
  for (const u of urls) {
    const t0 = Date.now();
    try {
      const res = await fetch(u.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      });
      console.log(`[${u.name}] Status: ${res.status} ${res.statusText} (${Date.now() - t0}ms)`);
    } catch (e: any) {
      console.log(`[${u.name}] ERROR: ${e.name} - ${e.message} (${Date.now() - t0}ms)`);
    }
  }
}

test().then(() => process.exit(0));
