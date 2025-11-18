export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { baseUrl, lob } = body;

    const url = new URL(baseUrl + '/signin');
    url.searchParams.set('lob', lob);
    url.searchParams.set('expiry', 'unlimited');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await response.json();

    if (!response.ok) {
      return Response.json({ error: json.message || 'Signin failed' }, { status: response.status });
    }

    return Response.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
