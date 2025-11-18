'use client';

import { useState } from 'react';

export default function PromoFetcher() {
  const baseUrl = 'https://demo.salescode.ai';
  const promoBaseUrl = 'https://promos-demo.salescode.ai';
  const lob = 'cokesademo';
  const fixedPassword = '@1234';
  const publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCvEbxPHVMhvoI4JVU0twKmV6+D0glCpxrAiN7+sp88xUvhA+IIrirRCGiq+v5rpG3VMJv3N5+Nxm/2JZwwMlw04tdCOoLdsp4iLc+UNq0iTZ5P2W/U7QhsQNDsA+qzPtZC28AUm1mfkNYu+FEkec5vkRxHk4Co7gd5RjGGlzSLmQIDAQAB';

  const [loginId, setLoginId] = useState('');
  const [token, setToken] = useState('');
  const [sqlList, setSqlList] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function makePemFromBody(body: string) {
    return '-----BEGIN PUBLIC KEY-----\n' + body.replace(/\s+/g, '') + '\n-----END PUBLIC KEY-----';
  }

  async function encryptTimestamped(password: string, publicKeyBody: string) {
    const { JSEncrypt } = await import('jsencrypt');
    const ts = Date.now();
    const combined = ts + ':' + password;
    const pem = makePemFromBody(publicKeyBody);
    const jsEncrypt = new JSEncrypt({ default_key_size: 1024 });
    jsEncrypt.setPublicKey(pem);
    const encrypted = jsEncrypt.encrypt(combined);
    if (!encrypted) throw new Error('RSA encryption failed');
    return encrypted;
  }

  function extractPromoIds(respJson: any) {
    if (!respJson?.data || !Array.isArray(respJson.data)) return [];
    return respJson.data.map((p: any) => String(p.promoId)).filter((x: string) => x);
  }

  function convertToSqlStringList(items: string[]) {
    return '(' + items.map(i => "'" + i.replace(/'/g, "\\'") + "'").join(',') + ')';
  }

  async function handleFetch() {
    if (!loginId.trim()) {
      setError('Enter login ID');
      return;
    }

    setLoading(true);
    setError('');
    setToken('');
    setSqlList('');

    try {
      const enc = await encryptTimestamped(fixedPassword, publicKey);

      const tokenRes = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          lob,
          loginId: loginId.trim(),
          password: enc,
          unlimitedExpiry: true
        })
      });

      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(`Signin failed: ${tokenJson.error}`);
      if (!tokenJson.token) throw new Error('No token in response');

      const fetchedToken = tokenJson.token;
      setToken(fetchedToken);

      const promosRes = await fetch('/api/promos/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoBaseUrl, token: fetchedToken, lob })
      });

      const promosJson = await promosRes.json();
      if (!promosRes.ok) throw new Error(`Promos fetch failed: ${promosJson.error}`);

      const promoIds = extractPromoIds(promosJson);
      setSqlList(convertToSqlStringList(promoIds));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">Promo Fetcher</h1>

          <input
            type="text"
            placeholder="Enter Login ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 mb-4 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleFetch}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Fetching...' : 'Fetch'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {token && (
            <div className="mt-6 space-y-4">
              {/* Token Output */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Token:</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-24 overflow-auto">
                  <p className="text-xs text-slate-600 font-mono break-all">{token}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(token)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Copy Token
                </button>
              </div>

              {/* SQL Output */}
              {sqlList && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">SQL List:</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-24 overflow-auto">
                    <p className="text-xs text-slate-600 font-mono break-all">{sqlList}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(sqlList)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Copy SQL
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
