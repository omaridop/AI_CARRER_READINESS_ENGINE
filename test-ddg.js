async function test() {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent('site:udemy.com/course/ Python');
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' } });
  const t = await r.text();
  console.log(t.substring(0, 500));
}
test();
