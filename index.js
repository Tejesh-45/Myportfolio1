/*******************************
 * Singleton: AppConfig
 *******************************/
class AppConfig {
  constructor() {
    if (AppConfig._instance) return AppConfig._instance;
    // default settings:
    this.currency = 'INR';
    this.tax = 5; // percent
    this.discount = 10; // percent
    AppConfig._instance = this;
    return this;
  }

  static getInstance() {
    if (!AppConfig._instance) AppConfig._instance = new AppConfig();
    return AppConfig._instance;
  }

  toggleCurrency() {
    this.currency = this.currency === 'INR' ? 'USD' : 'INR';
  }

  toString() {
    return `Currency=${this.currency}, Tax=${this.tax}%, Discount=${this.discount}%`;
  }
}

/*******************************
 * Factory Method: UserFactory
 *******************************/
class Customer {
  constructor(name) {
    this.type = 'Customer';
    this.name = name;
    this.permissions = ['order'];
  }
}
class DeliveryPartner {
  constructor(name) {
    this.type = 'DeliveryPartner';
    this.name = name;
    this.permissions = ['deliver'];
  }
}
class Restaurant {
  constructor(name) {
    this.type = 'Restaurant';
    this.name = name;
    this.permissions = ['menu','receive_orders'];
  }
}

class UserFactory {
  static create(type, name) {
    switch(type) {
      case 'Customer': return new Customer(name || 'Anon Cust');
      case 'DeliveryPartner': return new DeliveryPartner(name || 'Anon Rider');
      case 'Restaurant': return new Restaurant(name || 'Anon Resto');
      default: throw new Error('Unknown type');
    }
  }
}

/*******************************
 * Abstract Factory: PaymentFactory
 *******************************/
// Families: UPI, Wallet, Card
// Abstract interfaces
class UPI {
  constructor(id) { this.method='UPI'; this.id=id; }
  pay(amount) { return `Paid ${amount} via UPI (${this.id})`; }
}
class Wallet {
  constructor(walletId) { this.method='Wallet'; this.walletId=walletId; }
  pay(amount) { return `Paid ${amount} via Wallet (${this.walletId})`; }
}
class Card {
  constructor(cardNo) { this.method='Card'; this.cardNo=cardNo; }
  pay(amount) { return `Paid ${amount} via Card (xxxx-${String(this.cardNo).slice(-4)})`; }
}

class PaymentFactory {
  static create(family, opts) {
    // client only passes family string
    switch(family) {
      case 'UPI': return new UPI(opts.id || 'user@upi');
      case 'Wallet': return new Wallet(opts.walletId || 'WALLET123');
      case 'Card': return new Card(opts.cardNo || '4242424242424242');
      default: throw new Error('Unknown payment family');
    }
  }
}

/*******************************
 * Builder: OrderBuilder
 *******************************/
class Order {
  constructor() {
    this.size = null;
    this.toppings = [];
    this.notes = '';
    this.price = 0;
  }
}

class OrderBuilder {
  constructor() { this.reset(); }
  reset() { this.order = new Order(); return this; }
  setSize(size) {
    this.order.size = size;
    // naive price based on size
    this.order.price += (size === 'Extra Large' ? 300 : size === 'Large' ? 200 : 120);
    return this;
  }
  addTopping(t) {
    this.order.toppings.push(t);
    this.order.price += 30;
    return this;
  }
  setNotes(n) { this.order.notes = n; return this; }
  build() {
    const finished = JSON.parse(JSON.stringify(this.order)); // deep copy
    this.reset();
    return finished;
  }
}

/*******************************
 * Prototype: clone orders
 *******************************/
function clone(obj) {
  // simple prototype cloning (deep clone with structuredClone if available)
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

/*******************************
 * Demo wiring & UI
 *******************************/
const log = (el, msg) => {
  const d = document.getElementById(el);
  d.innerText = msg + '\n' + d.innerText;
};

/* Singleton demo */
const cfg = AppConfig.getInstance();
document.getElementById('currencyDisplay').innerText = cfg.currency;
document.getElementById('taxDisplay').innerText = cfg.tax + '%';
document.getElementById('discountDisplay').innerText = cfg.discount + '%';
document.getElementById('toggleCurrency').addEventListener('click', () => {
  const c1 = AppConfig.getInstance();
  c1.toggleCurrency();
  document.getElementById('currencyDisplay').innerText = c1.currency;
  log('singletonLog', `Toggled currency -> ${c1.currency}`);
});
document.getElementById('createConfig').addEventListener('click', () => {
  // show creating via constructor doesn't produce new instance
  const attempt = new AppConfig();
  const same = attempt === cfg;
  log('singletonLog', `Created via 'new AppConfig()' -> same instance? ${same}`);
});

/* Factory demo */
const usersDiv = document.getElementById('users');
document.querySelectorAll('.createUser').forEach(btn => {
  btn.addEventListener('click', (ev) => {
    const t = ev.target.dataset.type;
    const u = UserFactory.create(t, t + ' ' + Math.floor(Math.random()*90+10));
    const card = document.createElement('div');
    card.className = 'userCard';
    card.innerText = `${u.type}: ${u.name}\nPerms: ${u.permissions.join(', ')}`;
    usersDiv.prepend(card);
  });
});

/* Abstract Factory demo */
document.getElementById('makePayment').addEventListener('click', () => {
  const family = document.getElementById('paymentFamily').value;
  const p = PaymentFactory.create(family, {});
  const res = p.pay(199);
  log('paymentLog', `Factory(${family}) -> ${res}`);
});

/* Builder demo */
const orderBuilder = new OrderBuilder();
let lastBuiltOrder = null;
document.getElementById('buildOrder').addEventListener('click', () => {
  const size = document.getElementById('size').value;
  const notes = document.getElementById('notes').value;
  const toppings = Array.from(document.querySelectorAll('.topping:checked')).map(i=>i.value);

  orderBuilder.reset().setSize(size);
  toppings.forEach(t => orderBuilder.addTopping(t));
  orderBuilder.setNotes(notes);
  const built = orderBuilder.build();
  lastBuiltOrder = built;
  log('orderPreview', `Order built: ${JSON.stringify(built)}`);
});

/* Prototype demo */
document.getElementById('cloneLast').addEventListener('click', () => {
  if (!lastBuiltOrder) return log('prototypeLog', 'No last order to clone. Build one first.');
  const cloneOrder = clone(lastBuiltOrder);
  log('prototypeLog', `Cloned order: ${JSON.stringify(cloneOrder)}`);
  window.lastClone = cloneOrder; // keep for UI
});
document.getElementById('modifyClone').addEventListener('click', () => {
  if (!window.lastClone) return log('prototypeLog', 'No clone to modify. Click "Clone Last Order" first.');
  // modify clone without affecting original
  window.lastClone.toppings.push('Extra Cheese');
  window.lastClone.price += 30;
  log('prototypeLog', `Modified clone: ${JSON.stringify(window.lastClone)}\nOriginal (lastBuiltOrder): ${JSON.stringify(lastBuiltOrder)}`);
});

/* Demonstration note (singleton check) */
console.log('Singleton instance at load:', cfg.toString());
