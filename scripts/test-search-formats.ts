async function testSearch() {
  const targets = [
    { name: 'karmal-search', url: 'https://karmal.com/search?q=bmw+x5' },
    { name: 'waseet-search', url: 'https://jo.waseet.net/ar/site/amman/cars?keyword=bmw+x5' },
    { name: 'autohub-search', url: 'https://autohub.jo/search?q=bmw+x5' },
  ];

  for (const t of targets) {
    try {
      const res = await fetch(t.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      });
      console.log(`[${t.name}] Status: ${res.status} | FinalURL: ${res.url}`);
      const text = await res.text();
      console.log(`[${t.name}] Body length: ${text.length} | Contains BMW: ${text.toLowerCase().includes('bmw')}`);
    } catch (e: any) {
      console.log(`[${t.name}] ERROR: ${e.name} - ${e.message}`);
    }
  }
}

testSearch().then(() => process.exit(0));
