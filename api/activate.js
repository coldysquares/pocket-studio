const crypto = require('crypto');
const b64u = b => Buffer.from(b).toString('base64url');

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  const sid = String((req.query && req.query.session_id) || '');
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sid)) return res.status(400).json({ error: 'Bad session id' });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priv = process.env.LICENSE_PRIVATE_KEY;
  if (!stripeKey || !priv) return res.status(503).json({ error: 'Not configured' });
  let r, s;
  try {
    r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + sid, { headers: { authorization: 'Bearer ' + stripeKey } });
    s = await r.json();
  } catch (e) { return res.status(502).json({ error: 'Could not reach Stripe' }); }
  if (!r.ok) return res.status(404).json({ error: 'Payment not found' });
  if (s.payment_status !== 'paid') return res.status(402).json({ error: 'Payment not completed' });
  const link = process.env.STRIPE_PAYMENT_LINK_ID;
  if (link && s.payment_link !== link) return res.status(403).json({ error: 'Not a Pocket Studio purchase' });
  const id = crypto.createHash('sha256').update(sid).digest('hex').slice(0, 12);
  const body = b64u(JSON.stringify({ v: 1, p: 'studio', id, t: Math.floor(Date.now() / 1000) }));
  const sig = crypto.sign('sha256', Buffer.from(body), { key: priv.replace(/\\n/g, '\n'), dsaEncoding: 'ieee-p1363' });
  return res.status(200).json({ license: body + '.' + b64u(sig) });
};
