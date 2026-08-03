// api/webhook.js
// Handles Stripe webhook events:
//   - payment_intent.succeeded → send owner email + Telegram notification
//   Stripe automatically sends the customer their receipt

const Stripe = require('stripe');
const { Resend } = require('resend');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Telegram helper ────────────────────────────────────────────────
async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

// ── Email to owner ─────────────────────────────────────────────────
async function sendOwnerEmail(session) {
  const customer = session.customer_details || {};
  const fields = {};
  (session.custom_fields || []).forEach(f => {
    fields[f.key] = f.text?.value || '—';
  });

  const orderLines = (session.metadata?.order_summary || '').split('\n').map(l =>
    `<li style="margin-bottom:6px">${l}</li>`
  ).join('');

  const deliveryFee = session.metadata?.free_delivery === 'true' ? 'Free 🎉' : '£3.99';
  const total = (session.amount_total / 100).toFixed(2);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1a3a6b,#8b1a2b);padding:28px 32px">
      <h1 style="color:#fff;margin:0;font-size:22px">🍽 Новый заказ — Russian Corner</h1>
      <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px">Stripe Payment ID: ${session.payment_intent}</p>
    </div>
    <div style="padding:28px 32px">

      <h2 style="font-size:16px;color:#1a1a1a;border-bottom:2px solid #f0f0f0;padding-bottom:10px">👤 Клиент</h2>
      <table style="width:100%;font-size:14px;color:#333">
        <tr><td style="padding:6px 0;color:#888;width:140px">Имя</td><td><strong>${customer.name || '—'}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888">Email</td><td><a href="mailto:${customer.email}">${customer.email || '—'}</a></td></tr>
        <tr><td style="padding:6px 0;color:#888">Телефон</td><td><strong>${customer.phone || '—'}</strong></td></tr>
      </table>

      <h2 style="font-size:16px;color:#1a1a1a;border-bottom:2px solid #f0f0f0;padding-bottom:10px;margin-top:24px">📦 Заказ</h2>
      <ul style="font-size:14px;color:#333;padding-left:18px;line-height:1.8">${orderLines}</ul>
      <table style="width:100%;font-size:14px;color:#333;margin-top:12px">
        <tr><td style="padding:4px 0;color:#888">Доставка</td><td style="text-align:right">${deliveryFee}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold;font-size:16px">ИТОГО</td><td style="text-align:right;font-weight:bold;font-size:16px;color:#c9a84c">£${total}</td></tr>
      </table>

      <h2 style="font-size:16px;color:#1a1a1a;border-bottom:2px solid #f0f0f0;padding-bottom:10px;margin-top:24px">🚚 Доставка</h2>
      <table style="width:100%;font-size:14px;color:#333">
        <tr><td style="padding:6px 0;color:#888;width:160px">Адрес</td><td><strong>${session.metadata?.delivery_address || fields['delivery_address'] || '—'}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#888">Инструкции</td><td>${session.metadata?.delivery_instructions || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Время</td><td>${session.metadata?.delivery_time || fields['delivery_time'] || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Комментарий</td><td>${session.metadata?.comment || fields['comment'] || '—'}</td></tr>
      </table>

      <div style="margin-top:28px;padding:14px 18px;background:#f9f9f9;border-radius:8px;font-size:12px;color:#888">
        Оплата подтверждена Stripe · ${new Date().toLocaleString('ru-RU', {timeZone:'Europe/London'})}
      </div>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: 'Russian Corner Orders <orders@russiancorner.co.uk>',
    to: process.env.OWNER_EMAIL,
    subject: `🍽 Новый заказ £${total} — ${customer.name || customer.email}`,
    html,
  });
}

// ── Telegram message to owner ──────────────────────────────────────
async function sendTelegramOrder(session) {
  const customer = session.customer_details || {};
  const fields = {};
  (session.custom_fields || []).forEach(f => {
    fields[f.key] = f.text?.value || '—';
  });

  const total = (session.amount_total / 100).toFixed(2);
  const orderLines = (session.metadata?.order_summary || '')
    .split('\n')
    .map(l => `  • ${l}`)
    .join('\n');

  const msg = `
🍽 <b>НОВЫЙ ЗАКАЗ — Russian Corner</b>

💷 <b>Сумма: £${total}</b>

👤 <b>Клиент:</b>
  Имя: ${customer.name || '—'}
  Email: ${customer.email || '—'}
  Тел: ${customer.phone || '—'}

📦 <b>Заказ:</b>
${orderLines}

🚚 <b>Доставка:</b>
  Адрес: ${session.metadata?.delivery_address || fields['delivery_address'] || '—'}
  Инструкции: ${session.metadata?.delivery_instructions || '—'}
  Время: ${session.metadata?.delivery_time || fields['delivery_time'] || '—'}
  Комментарий: ${session.metadata?.comment || fields['comment'] || '—'}

✅ Оплата подтверждена
`.trim();

  await sendTelegram(msg);
}

// ── Raw body reader ────────────────────────────────────────────────
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ── Main webhook handler ───────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Only process paid sessions
    if (session.payment_status === 'paid') {
      try {
        await Promise.all([
          sendOwnerEmail(session),
          sendTelegramOrder(session),
        ]);
        console.log(`✅ Order processed: ${session.id}`);
      } catch (err) {
        console.error('Notification error:', err);
        // Don't return error to Stripe — payment already succeeded
      }
    }
  }

  return res.status(200).json({ received: true });
};

