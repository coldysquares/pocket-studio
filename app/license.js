// One license for all of Pocket Studio (Studio tools and the Tabbycat Songbook).
// The key is signed on the server after a Stripe payment and checked here on the device,
// so an unlocked phone stays unlocked with no signal.
export const STRIPE_LINK = 'https://buy.stripe.com/4gMbIU6Xj9rk0yT5EHgjC00';
export const PRICE = '$25';
export const FREE_SONG_LIMIT = 10;
export const LICENSE_KEY_NAME = 'pocket-studio-license';

const LICENSE_PUBKEY = {"kty":"EC","x":"1vpsHqfkYdatAJpxhizrLon8biIYJCN_V19yKdWVbMA","y":"kCp87JIZK6mqm3vPqbOV2FxJ1pitlTwRSAF_Brgl33o","crv":"P-256"};

const b64uToBytes = t => {
  t = t.replace(/-/g, '+').replace(/_/g, '/');
  t += '='.repeat((4 - t.length % 4) % 4);
  const bin = atob(t), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export async function verifyLicense(tok) {
  try {
    const [body, sig] = String(tok || '').trim().split('.');
    if (!body || !sig) return false;
    const key = await crypto.subtle.importKey('jwk', LICENSE_PUBKEY, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uToBytes(sig), new TextEncoder().encode(body)))) return false;
    const p = JSON.parse(new TextDecoder().decode(b64uToBytes(body)));
    return p.v === 1 && p.p === 'studio';
  } catch (e) {
    return false;
  }
}

export function savedLicense() {
  try { return localStorage.getItem(LICENSE_KEY_NAME); } catch (e) { return null; }
}

export function saveLicense(tok) {
  try { localStorage.setItem(LICENSE_KEY_NAME, String(tok).trim()); } catch (e) {}
}

export async function isUnlocked() {
  const tok = savedLicense();
  return tok ? verifyLicense(tok) : false;
}
