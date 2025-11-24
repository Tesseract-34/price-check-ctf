const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
  secret: 'keyboard_cat',
  resave: false,
  saveUninitialized: true
}));

const CATALOG = {
  'premium_report': { name: 'Premium Security Report', price: 99 },
  'flag_token': { name: 'Flag Redemption Token', price: 1000 }
};

function renderPage(title, content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} | Cyber Shop</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `;
}

app.get('/', (req, res) => {
  if (req.query.reset) {
    req.session.cart = [];
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/add-to-cart', (req, res) => {
  const { item } = req.body;
  if (!CATALOG[item]) return res.status(400).send('Invalid item');
  req.session.cart = req.session.cart || [];
  req.session.cart.push(item);
  res.redirect('/cart');
});

app.post('/remove-from-cart', (req, res) => {
  const { index } = req.body;
  if (!req.session.cart || isNaN(index) || index < 0) {
    return res.redirect('/cart');
  }
  req.session.cart.splice(parseInt(index), 1);
  res.redirect('/cart');
});

app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const items = cart.map(id => CATALOG[id]).filter(Boolean);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const cartItemsHTML = items.length 
    ? items.map((item, idx) => `
        <li>
          <span>${item.name} - $${item.price}</span>
          <form method="POST" action="/remove-from-cart" class="inline-form">
            <input type="hidden" name="index" value="${idx}">
            <button type="submit" class="btn-remove">🗑️ Remove</button>
          </form>
        </li>
      `).join('')
    : '<li class="empty">🛒 Your cart is empty.</li>';

  const checkoutButton = items.length ? `
    <form method="POST" action="/checkout">
      <input type="hidden" name="total" value="${total}">
      <button type="submit" ${total > 100 ? 'disabled' : ''} class="btn primary">
        ${total > 100 ? '❌ Too expensive!' : '✅ Checkout'}
      </button>
    </form>
  ` : '';

  const content = `
    <h2>🛒 Your Cart</h2>
    <ul>${cartItemsHTML}</ul>
    <p><strong>Total: $${total}</strong></p>
    ${checkoutButton}
    <div class="cart-actions">
      <a href="/" class="btn secondary">← Continue Shopping</a>
      <a href="/?reset=1" class="btn reset" onclick="return confirm('Clear cart?')">🔄 Clear Cart</a>
    </div>
  `;

  res.send(renderPage('Cart', content));
});

app.post('/checkout', (req, res) => {
  const reportedTotal = parseFloat(req.body.total) || 0;
  let content;

  if (reportedTotal >= 1000 && reportedTotal < 10000) {
    content = `
      <h2>✅ Transaction Approved!</h2>
      <p>You purchased: <strong>Flag Redemption Token</strong></p>
      <div class="success-box">
        <h3>Database breached!!!, Flag: <code>CUET{citadel_vault_override}</code></h3>
      </div>
      <div class="cart-actions">
        <a href="/" class="btn secondary">← Shop Again</a>
        <a href="/?reset=1" class="btn reset" onclick="return confirm('Reset challenge?')">🔄 Reset Challenge</a>
      </div>
    `;
  } else {
    content = `
      <h3>❌ Payment declined.</h3>
      <p>Expected ≥ $1000. You claimed: $${reportedTotal}</p>
      <div class="cart-actions">
        <a href="/cart" class="btn secondary">← Back to Cart</a>
        <a href="/?reset=1" class="btn reset" onclick="return confirm('Clear cart?')">🔄 Clear Cart</a>
      </div>
    `;
  }
  res.send(renderPage('Checkout', content));
});

app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));