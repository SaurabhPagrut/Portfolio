// Cloudflare Pages Function: POST /api/contact
// Receives the contact form, checks it, and emails it on through Resend (https://resend.com).
//
// Environment variables (Pages → Settings → Variables and Secrets):
//   RESEND_API_KEY  secret, the Resend API key
//   CONTACT_TO      comma-separated recipients, e.g. "getsaurabhpagrut@gmail.com,hello@saurabhpagrut.in"
//   CONTACT_FROM    sender on a domain verified in Resend, e.g. "Portfolio <contact@saurabhpagrut.in>"
//
// The page's script posts with fetch and reads the JSON reply. Without JavaScript the browser
// posts the form normally, so that case gets a redirect to /thanks/ instead.

const LIMITS = { name: [2, 100], email: [3, 200], subject: [3, 150], message: [10, 5000] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  const reply = (status, body) =>
    wantsJson
      ? Response.json(body, { status })
      : status < 300
        ? Response.redirect(new URL('/thanks/', request.url), 303)
        : new Response(body.message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  let data;
  try {
    data = await request.formData();
  } catch {
    return reply(400, { error: 'bad_request', message: 'The form could not be read.' });
  }

  // Honeypot: people never see this field, bots fill it in. Pretend it worked.
  if ((data.get('company') || '').toString().trim()) return reply(200, { status: 'delivered' });

  const fields = {};
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const value = (data.get(key) || '').toString().trim();
    if (value.length < min || value.length > max) {
      return reply(422, { error: 'invalid_field', field: key, message: `Please check the ${key} field.` });
    }
    fields[key] = value;
  }
  if (!EMAIL.test(fields.email)) {
    return reply(422, { error: 'invalid_field', field: 'email', message: 'Please enter a valid email address.' });
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('Contact form is not configured: set RESEND_API_KEY, CONTACT_TO and CONTACT_FROM.');
    return reply(503, { error: 'not_configured', message: 'The contact form is not set up yet.' });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO.split(',').map((s) => s.trim()).filter(Boolean),
      reply_to: fields.email,
      subject: `[saurabhpagrut.in] ${fields.subject}`,
      text: `From: ${fields.name} <${fields.email}>\n\n${fields.message}\n`,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return reply(res.status === 429 ? 429 : 502, { error: 'send_failed', message: "Your message didn't go through." });
  }
  return reply(201, { status: 'delivered' });
}
