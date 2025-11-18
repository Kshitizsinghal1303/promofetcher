export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promoBaseUrl, token, lob } = body;

    const url = new URL(promoBaseUrl + '/api/v1/promos/fetch');
    url.searchParams.set('appType', 'pwa');
    url.searchParams.set('appVersion', '100000.1.0');
    url.searchParams.set('source', 'app');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': token,
        'lob': lob,
        'Content-Type': 'application/json',
        'User-Agent': 'Promo Fetcher'
      }
    });

    const json = await response.json();

    if (!response.ok) {
      return Response.json({ error: json.message || 'Fetch failed' }, { status: response.status });
    }

    return Response.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
