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
  autoEmailEnabled: false,
  // Cấu hình Cơ sở dữ liệu Cloud Supabase
  supabaseUrl: 'https://jymkfplrxrbtmskinvre.supabase.co',
  supabaseKey: 'sb_publishable_uozNN_5s8HXEca1_IAU3lw_h5br3rfd',
  supabaseEnabled: true
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

// Danh sách Ebook mặc định chất lượng cao
const DEFAULT_BOOKS = [
  {
    id: 'ebk-khoi-nghiep-0',
    title: 'Khởi Nghiệp Tinh Gọn Từ Số 0',
    subTitle: 'Lộ trình thẩm định ý tưởng & 100 khách hàng đầu tiên',
    author: 'Trần Minh Tuấn',
    category: 'khoi-nghiep',
    categoryName: 'Khởi nghiệp',
    price: 79000,
    originalPrice: 189000,
    badge: 'Khởi nghiệp',
    pages: 218,
    format: 'PDF + EPUB',
    status: 'active',
    rating: 4.9,
    reviewsCount: 142,
    salesCount: 380,
    shortDesc: 'Lộ trình thẩm định ý tưởng, tìm 100 khách hàng đầu tiên không cần vốn lớn.',
    fullDesc: 'Cuốn sách hướng dẫn từng bước từ việc xác thực nhu cầu thị trường, xây dựng sản phẩm tối thiểu khả thi (MVP) đến cách tìm kiếm khách hàng trả phí đầu tiên mà không lãng phí tiền bạc.',
    toc: [
      'Chương 1: Tư duy xác thực thị trường trước khi bỏ vốn',
      'Chương 2: Xây dựng sản phẩm tối thiểu khả thi (MVP) trong 7 ngày',
      'Chương 3: Phễu hút 100 khách hàng đầu tiên qua Organic Content',
      'Chương 4: Tự động hóa quy trình chốt đơn và bảo toàn dòng tiền'
    ],
    sampleExcerpt: 'Đừng hỏi khách hàng họ muốn gì, hãy tạo một giải pháp nhỏ và xem họ có sẵn sàng trả tiền trước không. Đa số mọi người thất bại không phải vì không làm được sản phẩm, mà vì làm ra thứ không ai cần trả tiền để mua.',
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    coverStyle: 'cover-1',
    coverImage: ''
  },
  {
    id: 'ebk-ai-automation',
    title: 'Cẩm Nang Ứng Dụng AI & ChatGPT Vào Kinh Doanh Tự Động',
    subTitle: 'Bộ công thức 500+ Prompt độc quyền',
    author: 'TechLead VN',
    category: 'cong-nghe',
    categoryName: 'Công nghệ & AI',
    price: 99000,
    originalPrice: 250000,
    badge: 'HOT SELLER',
    pages: 185,
    format: 'PDF + Prompt Template',
    status: 'active',
    rating: 5.0,
    reviewsCount: 215,
    salesCount: 650,
    shortDesc: 'Tạo phễu bán lẻ, kịch bản chốt đơn tự động hóa từ AI với hơn 500+ prompt thực chiến.',
    fullDesc: 'Hướng dẫn ứng dụng các công cụ AI thế hệ mới (ChatGPT, Claude, Midjourney, Make/Zapier) vào quy trình vận hành kinh doanh tinh gọn, marketing tự động và chăm sóc khách hàng 24/7.',
    toc: [
      'Chương 1: Giải mã Prompt Engineering chuẩn cho chủ shop & freelancer',
      'Chương 2: Tự động hóa quy trình sản xuất content đa kênh bằng AI',
      'Chương 3: Xây dựng Chatbot tư vấn & chốt đơn thông minh',
      'Chương 4: Kết nối Make.com + AI để tự động hóa xử lý đơn hàng'
    ],
    sampleExcerpt: 'AI sẽ không thay thế bạn, nhưng người biết dùng AI để giải phóng 80% thời gian lặp đi lặp lại chắc chắn sẽ vượt lên dẫn đầu thị trường. Điểm cốt lõi là biết cách ra lệnh (Prompt) chính xác.',
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    coverStyle: 'cover-2',
    coverImage: ''
  },
  {
    id: 'ebk-solo-business',
    title: 'Xây Dựng Cỗ Máy Solo Business Triệu View & Doanh Thu Đều Đặn',
    subTitle: 'Mô hình kinh doanh 1 người với đòn bẩy số',
    author: 'Hoàng Nam',
    category: 'freelance',
    categoryName: 'Solo Business',
    price: 89000,
    originalPrice: 210000,
    badge: 'Solo Business',
    pages: 240,
    format: 'PDF + EPUB',
    status: 'active',
    rating: 4.9,
    reviewsCount: 168,
    salesCount: 420,
    shortDesc: 'Xây dựng thương hiệu cá nhân, bán sản phẩm số và đóng gói tri thức cá nhân.',
    fullDesc: 'Bộ khung hoàn chỉnh giúp một cá nhân có thể xây dựng doanh nghiệp 1 người (Solopreneur), tự tạo ra sản phẩm số (Ebook, Khóa học, Template) và bán hàng tự động 24/7.',
    toc: [
      'Chương 1: Tìm kiếm thị trường ngách phù hợp với thế mạnh cá nhân',
      'Chương 2: Chiến lược đóng gói tri thức thành sản phẩm số có thể scale',
      'Chương 3: Xây dựng hệ thống phễu email marketing tự động hóa',
      'Chương 4: Quản trị thời gian và năng lượng cho Solopreneur'
    ],
    sampleExcerpt: 'Mô hình Solo Business không yêu cầu văn phòng sang trọng hay đội ngũ nhân sự cồng kềnh. Tài sản lớn nhất của bạn là kiến thức được đóng gói chuẩn chỉnh và hệ thống phân phối tự động.',
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    coverStyle: 'cover-3',
    coverImage: ''
  },
  {
    id: 'ebk-quan-tri-tai-chinh',
    title: 'Quản Trị Tài Chính Cá Nhân & Chiến Lược Dòng Tiền Tự Do',
    subTitle: 'Quy tắc 6 chiếc lọ cải tiến & đầu tư an toàn',
    author: 'Đặng Thu Trang',
    category: 'tai-chinh',
    categoryName: 'Tài chính',
    price: 69000,
    originalPrice: 159000,
    badge: 'Tài chính',
    pages: 196,
    format: 'PDF + Sheet Tính Toán',
    status: 'active',
    rating: 4.8,
    reviewsCount: 95,
    salesCount: 310,
    shortDesc: 'Quy tắc 6 chiếc lọ cải tiến, chiến lược đầu tư chỉ số an toàn và thoát bẫy chi tiêu.',
    fullDesc: 'Cuốn sách hướng dẫn quản lý tài chính cá nhân thực tế, phương pháp tích lũy quỹ khẩn cấp, phân bổ danh mục đầu tư an toàn và kế hoạch đạt được tự do tài chính bền vững.',
    toc: [
      'Chương 1: Tái cấu trúc tư duy về tiền bạc và thói quen chi tiêu',
      'Chương 2: Hệ thống 6 chiếc lọ tự động hóa qua ứng dụng ngân hàng',
      'Chương 3: Thiết lập quỹ dự phòng khẩn cấp và bảo vệ dòng tiền',
      'Chương 4: Nguyên tắc đầu tư tích sản dài hạn cho người bận rộn'
    ],
    sampleExcerpt: 'Tự do tài chính không phụ thuộc vào việc bạn kiếm được bao nhiêu tiền mỗi tháng, mà phụ thuộc vào số tiền bạn giữ lại được và cách bạn khiến tiền làm việc thay mình.',
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    coverStyle: 'cover-4',
    coverImage: ''
  },
  {
    id: 'ebk-content-marketing',
    title: 'Content Khác Biệt: Nghệ Thuật Thu Hút Triệu Khách Hàng Tự Nhiên',
    subTitle: 'Bí quyết viết bài chạm đúng cảm xúc và chuyển đổi cao',
    author: 'Lê Bảo Châu',
    category: 'marketing',
    categoryName: 'Marketing & Sales',
    price: 79000,
    originalPrice: 179000,
    badge: 'Bán chạy',
    pages: 208,
    format: 'PDF + EPUB',
    status: 'active',
    rating: 4.9,
    reviewsCount: 110,
    salesCount: 290,
    shortDesc: 'Phương pháp sáng tạo nội dung thu hút người xem tự nhiên trên Facebook, TikTok và LinkedIn.',
    fullDesc: 'Cung cấp 30 công thức viết tiêu đề giật tít không phản cảm, kịch bản video ngắn giữ chân người xem và nghệ thuật kể chuyện (Storytelling) biến độc giả thành người mua hàng trung thành.',
    toc: [
      'Chương 1: Giải mã thuật toán tâm lý độc giả thời đại chú ý ngắn',
      'Chương 2: 12 Công thức Headline thôi miên khiến người đọc dừng lướt',
      'Chương 3: Kỹ thuật Storytelling lồng ghép sản phẩm khéo léo',
      'Chương 4: Xây dựng lịch nội dung 30 ngày chỉ trong 2 giờ'
    ],
    sampleExcerpt: 'Nội dung hay không phải là nội dung dùng từ hoa mỹ, mà là nội dung nói đúng nỗi đau mà khách hàng chưa thể tự gọi tên thành lời.',
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    coverStyle: 'cover-5',
    coverImage: ''
  },
  {
    id: 'ebk-tam-ly-hoc-ve-tien',
    title: 'Tâm Lý Học Về Tiền & Quyết Định Đầu Tư Thực Chiến',
    subTitle: 'Làm chủ cảm xúc, loại bỏ cạm bẫy FOMO tài chính',
    author: 'Phạm Minh Đức',
    category: 'mindset',
    categoryName: 'Mindset',
    price: 75000,
    originalPrice: 169000,
    badge: 'Mindset',
    pages: 224,
    format: 'PDF + EPUB',
    status: 'active',
    rating: 4.9,
    reviewsCount: 88,
    salesCount: 245,
    shortDesc: 'Hiểu rõ các cạm bẫy tâm lý trong quản lý tài chính và ra quyết định đầu tư thông minh.',
    fullDesc: 'Khám phá cách não bộ con người phản ứng trước lòng tham và nỗi sợ hãi trong tiền bạc, giúp bạn đưa ra những quyết định tài chính sáng suốt và kiên định.',
    toc: [
      'Chương 1: Nguồn gốc các sai lầm kinh điển khi xử lý tiền bạc',
      'Chương 2: Hiệu ứng FOMO và cách xây dựng kỷ luật đầu tư thép',
      'Chương 3: Nghệ thuật kiên nhẫn: Đòn bẩy lãi suất kép vô hình',
      'Chương 4: Định nghĩa lại sự giàu có thực sự'
    ],
    sampleExcerpt: 'Kiểm soát tiền bạc tốt ít liên quan đến việc bạn thông minh ra sao, mà liên quan nhiều hơn đến cách bạn hành xử và quản trị cảm xúc khi thị trường biến động.',
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    coverStyle: 'cover-6',
    coverImage: ''
  }
];

// Danh sách Combo tiết kiệm mặc định
const DEFAULT_COMBOS = [
  {
    id: 'combo-khoi-nghiep-tinh-gon',
    title: 'Combo Khởi Nghiệp Tinh Gọn',
    subTitle: 'Dành cho người mới bắt đầu từ con số 0 cần lộ trình an toàn',
    tag: 'TIẾT KIỆM 60%',
    discountBadge: '-60%',
    price: 179000,
    originalPrice: 450000,
    popular: false,
    status: 'active',
    bookIds: ['ebk-khoi-nghiep-0', 'ebk-content-marketing', 'ebk-quan-tri-tai-chinh'],
    bonusList: [
      'Ebook: Khởi Nghiệp Tinh Gọn Từ Số 0',
      'Ebook: Content Khác Biệt Thu Hút Triệu View',
      'Ebook: Quản Trị Tài Chính Cá Nhân & Dòng Tiền',
      'Bonus Độc Quyền: Notion Business Roadmap Template'
    ],
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing'
  },
  {
    id: 'combo-solopreneur-ai-master',
    title: 'Combo Solo Business & AI Master VIP',
    subTitle: 'Trọn bộ cẩm nang & đòn bẩy tự động hóa tối tân cho Solopreneur',
    tag: 'GIẢM 78%',
    discountBadge: '-78%',
    price: 249000,
    originalPrice: 1150000,
    popular: true,
    status: 'active',
    bookIds: ['ebk-ai-automation', 'ebk-solo-business', 'ebk-khoi-nghiep-0', 'ebk-content-marketing', 'ebk-tam-ly-hoc-ve-tien'],
    bonusList: [
      'Toàn bộ 5 Ebook chủ lực về AI, Solopreneur & Phễu Bán Hàng',
      'Kho 500+ Prompt ChatGPT & Claude độc quyền kinh doanh',
      'Bộ Swipe File Email Marketing 100+ mẫu chuyển đổi cao',
      'Cập nhật trọn đời khi có phiên bản sách và template mới'
    ],
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing'
  },
  {
    id: 'combo-mindset-tai-chinh',
    title: 'Combo Mindset & Đột Phá Tài Chính',
    subTitle: 'Làm chủ dòng tiền cá nhân và tư duy đầu tư thực chiến',
    tag: 'TIẾT KIỆM 58%',
    discountBadge: '-58%',
    price: 159000,
    originalPrice: 380000,
    popular: false,
    status: 'active',
    bookIds: ['ebk-quan-tri-tai-chinh', 'ebk-tam-ly-hoc-ve-tien', 'ebk-khoi-nghiep-0'],
    bonusList: [
      'Ebook: Quản Trị Tài Chính Cá Nhân & Chiến Lược Dòng Tiền',
      'Ebook: Tâm Lý Học Về Tiền & Quyết Định Đầu Tư',
      'Ebook: Khởi Nghiệp Tinh Gọn Từ Số 0',
      'Bonus Độc Quyền: File Excel Tự Động Tính Quỹ Tự Do Tài Chính'
    ],
    downloadUrl: 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing'
  }
];

// Danh sách đơn hàng mặc định
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
    const REAL_DRIVE_URL = 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing';
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(DEFAULT_BOOKS));
        return DEFAULT_BOOKS;
      }
      let parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        let changed = false;
        parsed = parsed.map(b => {
          if (!b.downloadUrl || b.downloadUrl === '#' || b.downloadUrl.includes('example')) {
            b.downloadUrl = REAL_DRIVE_URL;
            changed = true;
          }
          return b;
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(parsed));
        }
        return parsed;
      }
      return DEFAULT_BOOKS;
    } catch (e) {
      return DEFAULT_BOOKS;
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

    // Tự động đẩy lên Supabase Cloud
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.saveBook === 'function') {
      window.EbookSupabase.saveBook(updated);
    }

    return updated;
  }

  static deleteBook(id) {
    let books = this.getBooks();
    books = books.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notifyChange('BOOKS_UPDATED', { books });

    // Tự động xóa trên Supabase Cloud
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.deleteBook === 'function') {
      window.EbookSupabase.deleteBook(id);
    }

    return true;
  }

  static clearAllBooks() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify([]));
    this.notifyChange('BOOKS_UPDATED', { books: [] });

    // Tự động xóa sạch trên Supabase Cloud
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.clearAllBooks === 'function') {
      window.EbookSupabase.clearAllBooks();
    }
  }

  // --- COMBOS ---
  static getCombos() {
    const REAL_DRIVE_URL = 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing';
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMBOS);
      if (data === null) {
        localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(DEFAULT_COMBOS));
        return DEFAULT_COMBOS;
      }
      let parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        let changed = false;
        parsed = parsed.map(c => {
          if (!c.downloadUrl || c.downloadUrl === '#' || c.downloadUrl.includes('example')) {
            c.downloadUrl = REAL_DRIVE_URL;
            changed = true;
          }
          return c;
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(parsed));
        }
        return parsed;
      }
      return DEFAULT_COMBOS;
    } catch (e) {
      return DEFAULT_COMBOS;
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

    // Tự động đẩy lên Supabase Cloud
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.saveCombo === 'function') {
      window.EbookSupabase.saveCombo(updated);
    }

    return updated;
  }

  static deleteCombo(id) {
    let combos = this.getCombos();
    combos = combos.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(combos));
    this.notifyChange('COMBOS_UPDATED', { combos });

    // Tự động xóa trên Supabase Cloud
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.deleteCombo === 'function') {
      window.EbookSupabase.deleteCombo(id);
    }

    return true;
  }

  static clearAllCombos() {
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify([]));
    this.notifyChange('COMBOS_UPDATED', { combos: [] });

    // Tự động xóa sạch trên Supabase Cloud
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.clearAllCombos === 'function') {
      window.EbookSupabase.clearAllCombos();
    }
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

    // Tự động đẩy đơn hàng lên Supabase Cloud Database (nếu có cấu hình)
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.saveOrder === 'function') {
      try {
        window.EbookSupabase.saveOrder(newOrder);
      } catch (e) {
        console.warn('Lỗi lưu đơn hàng Supabase:', e);
      }
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

    // Tự động xóa sạch trên Supabase Cloud
    if (typeof window !== 'undefined' && window.EbookSupabase && typeof window.EbookSupabase.clearAllOrders === 'function') {
      window.EbookSupabase.clearAllOrders();
    }
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
