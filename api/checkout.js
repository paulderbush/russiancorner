// api/checkout.js
// Creates a Stripe Checkout session with the cart items + customer info form

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // Allow CORS from your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cart, customerInfo } = req.body;

    // Validate cart
    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Build Stripe line items from cart
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          description: item.meta || '',
        },
        unit_amount: Math.round((item.pr || item.price || 0) * 100), // Stripe uses pence
      },
      quantity: item.qty,
    }));

    // Add delivery fee as a line item
    lineItems.push({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: 'Delivery',
          description: 'Russian-speaking courier · Battersea / Nine Elms / Vauxhall',
        },
        unit_amount: 399, // £3.99
      },
      quantity: 1,
    });

    // Build order summary for metadata (stored in Stripe, sent via webhook)
    const orderSummary = cart.map(item =>
      `${item.qty}x ${item.name} (${item.meta || ''}) — £${((item.pr || item.price || 0) * item.qty).toFixed(2)}`
    ).join('\n');

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      
      // Collect customer email (Stripe sends receipt automatically)
      customer_email: customerInfo?.email || undefined,
      
      // Collect phone number at checkout
      phone_number_collection: {
        enabled: true,
      },

      // Collect billing address (we use for delivery)
      billing_address_collection: 'required',

      // Custom fields for delivery address & comment
      custom_fields: [
        {
          key: 'delivery_address',
          label: { type: 'custom', custom: 'Delivery address' },
          type: 'text',
        },
        {
          key: 'delivery_time',
          label: { type: 'custom', custom: 'Preferred delivery time' },
          type: 'text',
          optional: true,
        },
        {
          key: 'comment',
          label: { type: 'custom', custom: 'Comment to order' },
          type: 'text',
          optional: true,
        },
      ],

      // Store order details in metadata for the webhook
      metadata: {
        order_summary: orderSummary.substring(0, 500), // Stripe metadata limit
        customer_name: customerInfo?.name || '',
        customer_phone: customerInfo?.phone || '',
        delivery_address: customerInfo?.address || '',
        delivery_instructions: customerInfo?.instructions || '',
        delivery_time: customerInfo?.time || '',
        comment: customerInfo?.comment || '',
        item_count: cart.reduce((s, i) => s + i.qty, 0).toString(),
      },

      // Where to redirect after payment
      success_url: `${process.env.SITE_URL || 'https://russiancorner.vercel.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || 'https://russiancorner.vercel.app'}`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
};
