/**
 * EbookPe - Data Layer & Default Seed Database
 * Quản lý lưu trữ localStorage và đồng bộ dữ liệu giữa Storefront & Admin
 */

const STORAGE_KEYS = {
  BOOKS: 'ebookpe_books_v2',
  ORDERS: 'ebookpe_orders_v2',
  SETTINGS: 'ebookpe_settings_v2',
  COMBOS: 'ebookpe_combos_v2',
  CART: 'ebookpe_cart_v2'
};

// Dữ liệu cài đặt mặc định (Thông tin thanh toán VietQR)
const DEFAULT_SETTINGS = {
  storeName: 'EbookPe',
  storeSlogan: 'Nền tảng Ebook thực chiến #1 Việt Nam',
  bankCode: 'MB', // MB, VCB, TCB, VPB, TPB, BIDV, ACB, etc.
  bankName: 'MBBank (Quân Đội)',
  accountNumber: '2456987654',
  accountName: 'PHAN QUOC LOC',
  qrTemplate: 'compact2',
  transferPrefix: 'EBPE',
  hotline: '0333.399.956',
  supportEmail: 'thinhloclinh@gmail.com',
  zaloLink: 'https://zalo.me/0333399956',
  guaranteeDays: 30,
  // Cấu hình Tự động hóa: Bắt tiền vào MBBank (SePay.vn) & Gửi Gmail (EmailJS)
  sepayApiKey: '',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  autoEmailEnabled: false
};

// Danh mục mặc định
const DEFAULT_CATEGORIES = [
  { id: 'all', name: '🔥 Tất cả', icon: '🔥' },
  { id: 'kinh-doanh', name: '💼 Kinh doanh', icon: '💼' },
  { id: 'khoi-nghiep', name: '🚀 Khởi nghiệp', icon: '🚀' },
  { id: 'mindset', name: '🧠 Mindset', icon: '🧠' },
  { id: 'cong-nghe', name: '💻 Công nghệ & AI', icon: '💻' },
  { id: 'tai-chinh', name: '💰 Tài chính', icon: '💰' },
  { id: 'marketing', name: '📈 Marketing & Sales', icon: '📈' },
  { id: 'freelance', name: '⚡ Solo Business', icon: '⚡' }
];

// Danh sách Ebook mặc định (Đã reset sạch để sẵn sàng nhập sách thực tế)
const DEFAULT_BOOKS = [];

// Danh sách Combo tiết kiệm mặc định (Đã reset sạch)
const DEFAULT_COMBOS = [];

// Danh sách đơn hàng mặc định (Đã reset sạch về 0đ doanh thu)
const DEFAULT_ORDERS = [];

/**
 * Lớp EbookDB quản lý LocalStorage và phát thông báo BroadcastChannel
 */
class EbookDB {
  static broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ebookpe_sync_channel') : null;

  static notifyChange(type, payload = {}) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  // --- CÀI ĐẶT ---
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      const parsed = JSON.parse(data);
      // Tự động đồng bộ số tài khoản và thông tin mới nếu là số demo cũ
      if (parsed.accountNumber === '0988889999' || parsed.accountName === 'NGUYEN VAN ADMIN') {
        const synced = { ...parsed, ...DEFAULT_SETTINGS };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(synced));
        return synced;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings) {
    const updated = { ...this.getSettings(), ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.notifyChange('SETTINGS_UPDATED', updated);
    return updated;
  }

  // --- EBOOK ---
  static getBooks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  static getBookById(id) {
    const books = this.getBooks();
    return books.find(b => b.id === id) || null;
  }

  static saveBook(book) {
    const books = this.getBooks();
    let updated;
    const existingIndex = books.findIndex(b => b.id === book.id);
    if (existingIndex >= 0) {
      books[existingIndex] = { ...books[existingIndex], ...book, updatedAt: new Date().toISOString() };
      updated = books[existingIndex];
    } else {
      const newBook = {
        ...book,
        id: book.id || 'ebk-' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        rating: book.rating || 5.0,
        reviewsCount: book.reviewsCount || 1,
        salesCount: book.salesCount || 0,
        status: book.status || 'active'
      };
      books.unshift(newBook);
      updated = newBook;
    }
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notifyChange('BOOKS_UPDATED', { books });
    return updated;
  }

  static deleteBook(id) {
    let books = this.getBooks();
    books = books.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notifyChange('BOOKS_UPDATED', { books });
    return true;
  }

  static clearAllBooks() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify([]));
    this.notifyChange('BOOKS_UPDATED', { books: [] });
  }

  // --- COMBOS ---
  static getCombos() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMBOS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  static getComboById(id) {
    const combos = this.getCombos();
    return combos.find(c => c.id === id) || null;
  }

  static saveCombo(combo) {
    const combos = this.getCombos();
    let updated;
    const existingIndex = combos.findIndex(c => c.id === combo.id);
    if (existingIndex >= 0) {
      combos[existingIndex] = { ...combos[existingIndex], ...combo, updatedAt: new Date().toISOString() };
      updated = combos[existingIndex];
    } else {
      const newCombo = {
        ...combo,
        id: combo.id || 'combo-' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        status: combo.status || 'active'
      };
      combos.unshift(newCombo);
      updated = newCombo;
    }
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(combos));
    this.notifyChange('COMBOS_UPDATED', { combos });
    return updated;
  }

  static deleteCombo(id) {
    let combos = this.getCombos();
    combos = combos.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(combos));
    this.notifyChange('COMBOS_UPDATED', { combos });
    return true;
  }

  static clearAllCombos() {
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify([]));
    this.notifyChange('COMBOS_UPDATED', { combos: [] });
  }

  // --- ĐƠN HÀNG ---
  static getOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  static createOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      orderId: 'EBPE-' + Math.floor(100000 + Math.random() * 900000),
      orderDate: new Date().toLocaleString('vi-VN'),
      status: 'completed',
      ...orderData
    };
    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    this.notifyChange('ORDERS_UPDATED', { order: newOrder });

    // Tăng lượt mua cho từng cuốn sách
    if (newOrder.items && newOrder.items.length) {
      const books = this.getBooks();
      newOrder.items.forEach(item => {
        const book = books.find(b => b.id === item.id);
        if (book) {
          book.salesCount = (book.salesCount || 0) + (item.qty || 1);
        }
      });
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
      this.notifyChange('BOOKS_UPDATED', { books });
    }

    return newOrder;
  }

  static updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      order.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.notifyChange('ORDERS_UPDATED', { orders });
      return true;
    }
    return false;
  }

  static clearAllOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    this.notifyChange('ORDERS_UPDATED', { orders: [] });
  }

  // --- GIỎ HÀNG (CART) ---
  static getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    this.notifyChange('CART_UPDATED', { cart });
  }

  static addToCart(item) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    this.saveCart(cart);
    return cart;
  }

  static removeFromCart(id) {
    let cart = this.getCart();
    cart = cart.filter(i => i.id !== id);
    this.saveCart(cart);
    return cart;
  }

  static clearCart() {
    this.saveCart([]);
  }

  // --- KHÔI PHỤC VÀ BACKUP ---
  static resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(DEFAULT_BOOKS));
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(DEFAULT_COMBOS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    this.notifyChange('RESET_ALL');
  }

  static exportBackupJSON() {
    return JSON.stringify({
      version: '2.0',
      timestamp: new Date().toISOString(),
      settings: this.getSettings(),
      books: this.getBooks(),
      combos: this.getCombos(),
      orders: this.getOrders()
    }, null, 2);
  }

  static importBackupJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.books && Array.isArray(data.books)) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(data.books));
      }
      if (data.orders && Array.isArray(data.orders)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      }
      if (data.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      if (data.combos && Array.isArray(data.combos)) {
        localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(data.combos));
      }
      this.notifyChange('IMPORT_SUCCESS');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Tiện ích format tiền VNĐ
  static formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'đ');
  }
}

// Gán biến toàn cục để các script khác sử dụng dễ dàng
window.EbookDB = EbookDB;
window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
