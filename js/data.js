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

// Danh sách Ebook mẫu ban đầu phong phú, chuẩn nội dung thực chiến
const DEFAULT_BOOKS = [
  {
    id: 'ebk-01',
    title: 'Khởi Nghiệp Không Lối Mòn — Framework Thực Chiến',
    subTitle: 'Solo Business',
    author: 'Hoàng Nam & Cộng sự EbookPe',
    category: 'khoi-nghiep',
    categoryName: 'Khởi nghiệp',
    price: 199000,
    originalPrice: 499000,
    badge: 'Bestseller',
    rating: 5.0,
    reviewsCount: 142,
    salesCount: 3250,
    pages: 218,
    format: 'PDF + EPUB',
    coverStyle: 'cover-1',
    coverImage: '',
    shortDesc: 'Từ ý tưởng thô sơ đến 100 khách hàng đầu tiên trong 30 ngày. Không lý thuyết suông, không sáo rỗng.',
    fullDesc: `Cuốn sách dành riêng cho những ai muốn bắt đầu kinh doanh tinh gọn nhưng không có nhiều vốn. Bạn sẽ học được:
• Cách kiểm tra nhu cầu thị trường (Validate) mà không cần lập trình hay chi tiền quảng cáo.
• Xây dựng sản phẩm khả thi tối thiểu (MVP) trong vòng 7 ngày.
• Công thức tạo thông điệp bán lẻ khiến khách hàng tự tìm đến bạn.
• Case study thực tế của 5 mô hình kinh doanh cá nhân đạt doanh thu 50 - 150 triệu/tháng tại Việt Nam.`,
    toc: [
      'Chương 1: Phá bỏ ảo tưởng về khởi nghiệp tiền tỷ',
      'Chương 2: Framework tìm kiếm 10 vấn đề nhức nhối nhất của khách hàng',
      'Chương 3: Tạo giải pháp "không thể chối từ" trong 48 giờ',
      'Chương 4: Chiến thuật 10 khách hàng trả tiền đầu tiên',
      'Chương 5: Vận hành một mình (Solo Founder) không kiệt sức'
    ],
    sampleExcerpt: `Bản chất của khởi nghiệp không phải là thuê văn phòng đẹp, in danh thiếp hay gọi vốn hoành tráng. Khởi nghiệp là giải quyết một nỗi đau thực sự của ai đó và họ sẵn sàng trả tiền để nỗi đau đó biến mất.

Nếu bạn chưa có khách hàng đầu tiên trả tiền, bạn chưa có doanh nghiệp — bạn chỉ đang có một sở thích tốn kém. Hãy ghi nhớ: Khách hàng chỉ quan tâm đến kết quả bạn mang lại cho họ, chứ không quan tâm sản phẩm của bạn được làm ra phức tạp thế nào...`,
    downloadUrl: 'https://example.com/download/khoi-nghiep-khong-loi-mon.pdf',
    featured: true,
    status: 'active'
  },
  {
    id: 'ebk-02',
    title: '20 Ngách Freelance Ít Cạnh Tranh Thu Nhập Cao',
    subTitle: 'Freelance Pro',
    author: 'Trần Lan Anh',
    category: 'freelance',
    categoryName: 'Solo Business',
    price: 269000,
    originalPrice: 450000,
    badge: 'Hot',
    rating: 5.0,
    reviewsCount: 98,
    salesCount: 2840,
    pages: 184,
    format: 'PDF',
    coverStyle: 'cover-2',
    coverImage: '',
    shortDesc: 'Khám phá 20 công việc freelancer ngách có nhu cầu tuyển dụng khủng nhưng rất ít người biết làm.',
    fullDesc: `Đừng chen chân vào những thị trường bão hòa như dịch thuật cơ bản hay thiết kế logo giá rẻ. Cuốn sách cung cấp bản đồ chi tiết 20 kỹ năng ngách được các doanh nghiệp vừa và nhỏ săn đón:
• Kỹ năng tối ưu quy trình bằng Notion / Make / Zapier cho doanh nghiệp.
• Viết kịch bản video ngắn (TikTok, Reels) chuyển đổi cao.
• Quản lý cộng đồng trả phí & thiết lập hệ thống email newsletter tự động.
• Bản hợp đồng mẫu bảo vệ quyền lợi freelancer và quy trình thu tiền cọc 50%.`,
    toc: [
      'Chương 1: Vì sao 80% Freelancer bị ép giá?',
      'Chương 2: Top 7 ngách công nghệ không cần biết code',
      'Chương 3: Top 7 ngách nội dung & truyền thông giá trị cao',
      'Chương 4: Top 6 ngách hỗ trợ kinh doanh B2B',
      'Chương 5: Quy trình chốt hợp đồng 1000$ đầu tiên với khách hàng nước ngoài'
    ],
    sampleExcerpt: `Khi bạn tự xưng là "Content Writer", bạn đang cạnh tranh với hàng ngàn sinh viên viết bài 30.000đ. Nhưng khi bạn định vị là "Chuyên gia viết Email bán hàng cho khóa học online", mức phí của bạn lập tức nhảy vọt lên 5 - 10 triệu cho một chuỗi 5 email. Sự khác biệt nằm ở giá trị chuyển đổi cuối cùng bạn đem lại cho người trả tiền.`,
    downloadUrl: 'https://example.com/download/20-ngach-freelance.pdf',
    featured: true,
    status: 'active'
  },
  {
    id: 'ebk-03',
    title: 'Kiếm Tiền Với AI: Roadmap 30 Ngày Cho Người Mới',
    subTitle: 'AI & Automation',
    author: 'Đội ngũ Kỹ Thuật EbookPe',
    category: 'cong-nghe',
    categoryName: 'Công nghệ & AI',
    price: 199000,
    originalPrice: 399000,
    badge: 'Mới',
    rating: 4.9,
    reviewsCount: 76,
    salesCount: 1920,
    pages: 205,
    format: 'PDF + Prompt Kit',
    coverStyle: 'cover-4',
    coverImage: '',
    shortDesc: '10 cách ứng dụng ChatGPT, Claude, Midjourney để nhân 5 năng suất và tạo dòng tiền phụ.',
    fullDesc: `Cẩm nang cầm tay chỉ việc dành cho người không có nền tảng kỹ thuật công nghệ:
• 100+ Prompt độc quyền cho Marketing, Viết lách, Lên kế hoạch kinh doanh và Chăm sóc khách hàng.
• Xây dựng hệ thống sáng tạo 30 video ngắn trong 2 giờ bằng AI.
• Bán tài nguyên số (Digital Products) tự động 24/7.
• Những rào cản pháp lý & bản quyền khi thương mại hóa sản phẩm AI cần tránh.`,
    toc: [
      'Chương 1: Tư duy đúng về AI — Trợ lý siêu cấp thay vì đồ chơi',
      'Chương 2: Bộ khung Prompt Masterclass đạt kết quả chính xác 99%',
      'Chương 3: Tự động hóa sản xuất nội dung đa kênh',
      'Chương 4: Đóng gói và bán Ebook / Khóa học mini do AI hỗ trợ',
      'Chương 5: Kế hoạch hành động 30 ngày từng bước có kết quả'
    ],
    sampleExcerpt: `Trí tuệ nhân tạo sẽ không cướp đi công việc của bạn. Người biết sử dụng trí tuệ nhân tạo thành thạo mới là người thay thế bạn. Điều tuyệt vời là bạn không cần phải học lập trình Python hay toán học vi phân; bạn chỉ cần học cách ra lệnh (Prompt Engineering) chính xác như một người quản lý tài ba.`,
    downloadUrl: 'https://example.com/download/kiem-tien-voi-ai-30-ngay.pdf',
    featured: true,
    status: 'active'
  },
  {
    id: 'ebk-04',
    title: 'Quản Lý Tiền Kiểu Người Giàu — Hệ Thống 5 Tài Khoản',
    subTitle: 'Personal Finance',
    author: 'Minh Hoàng, CFA',
    category: 'tai-chinh',
    categoryName: 'Tài chính',
    price: 169000,
    originalPrice: 299000,
    badge: 'Khuyên đọc',
    rating: 5.0,
    reviewsCount: 114,
    salesCount: 2450,
    pages: 176,
    format: 'PDF + File Excel',
    coverStyle: 'cover-5',
    coverImage: '',
    shortDesc: 'Chấm dứt cảnh "đầu tháng nhận lương cuối tháng hết tiền". Xây dựng cỗ máy tích lũy tự động.',
    fullDesc: `Hầu hết mọi người thất bại trong tài chính cá nhân vì họ dựa vào "ý chí kiềm chế chi tiêu". Cuốn sách mang tới giải pháp hệ thống:
• Thiết lập 5 tài khoản ngân hàng riêng biệt: Chi tiêu thiết yếu, Tự do tài chính, Đầu tư bản thân, Khẩn cấp và Tận hưởng.
• Công thức phân bổ thu nhập thông minh phù hợp với thu nhập từ 8 triệu đến 80 triệu/tháng.
• Cách thoát bẫy thẻ tín dụng và nợ xấu trong vòng 6 tháng.
• Tặng kèm Template Google Sheets tự động hạch toán chi tiêu không cần ghi chép thủ công.`,
    toc: [
      'Chương 1: Ảo tưởng về tiết kiệm và sự thật về lạm phát',
      'Chương 2: Kiến trúc hệ thống 5 tài khoản tự động hóa',
      'Chương 3: Phẫu thuật các khoản chi tiêu vô hình làm bạn nghèo đi',
      'Chương 4: Chiến lược đầu tư tích sản an toàn tại Việt Nam',
      'Chương 5: Tâm lý học về tiền và cách đối diện với áp lực xã hội'
    ],
    sampleExcerpt: `Tiền bạn kiếm được không quan trọng bằng số tiền bạn giữ lại được và số tiền đó sinh sôi ra bao nhiêu. Nếu thu nhập của bạn tăng từ 15 triệu lên 30 triệu nhưng mức sống tăng tương ứng, bạn chỉ đang chuyển từ chiếc lồng sắt sang chiếc lồng mạ vàng...`,
    downloadUrl: 'https://example.com/download/quan-ly-tien-he-thong-5-tai-khoan.pdf',
    featured: true,
    status: 'active'
  },
  {
    id: 'ebk-05',
    title: 'Bán Hàng Không Cần Quảng Cáo — Organic Sales System',
    subTitle: 'Marketing',
    author: 'Vũ Quốc Đạt',
    category: 'marketing',
    categoryName: 'Marketing & Sales',
    price: 229000,
    originalPrice: 380000,
    badge: 'Bestseller',
    rating: 5.0,
    reviewsCount: 156,
    salesCount: 3810,
    pages: 232,
    format: 'PDF',
    coverStyle: 'cover-7',
    coverImage: '',
    shortDesc: 'Xây dựng dòng khách hàng tự nhiên đều đặn qua nội dung giá trị, không đốt tiền chạy Ads.',
    fullDesc: `Khi chi phí quảng cáo Facebook và TikTok ngày càng đắt đỏ, các doanh nghiệp sống sót là những người nắm giữ lượng khán giả trung thành:
• Công thức tạo nội dung dạng chia sẻ kinh nghiệm khiến người đọc tin tưởng ngay lập tức.
• Phễu bán lẻ từ bài viết Facebook cá nhân đến cuộc gọi tư vấn 1-1.
• Cách biến khách hàng cũ thành đại sứ giới thiệu khách mới miễn phí.
• Kịch bản xử lý từ chối mua hàng tinh tế, không chèo kéo gượng ép.`,
    toc: [
      'Chương 1: Cái bẫy đốt tiền quảng cáo trong kỷ nguyên mới',
      'Chương 2: Nghệ thuật xây dựng lòng tin qua nội dung chân thực',
      'Chương 3: Cấu trúc 1 bài viết bán hàng chuyển đổi cao',
      'Chương 4: Kỹ năng lắng nghe và chốt sale theo phong cách cố vấn',
      'Chương 5: Xây dựng hệ sinh thái khách hàng giới thiệu khách hàng'
    ],
    sampleExcerpt: `Khách hàng không ghét mua hàng, họ chỉ ghét cảm giác bị ép mua. Khi bạn xuất hiện như một chuyên gia tận tâm giúp họ giải quyết vướng mắc, việc thanh toán trở thành bước tiếp theo tự nhiên chứ không cần bất kỳ chiêu trò thúc ép nào.`,
    downloadUrl: 'https://example.com/download/ban-hang-khong-can-quang-cao.pdf',
    featured: true,
    status: 'active'
  },
  {
    id: 'ebk-06',
    title: 'Tư Duy Người Sáng Lập — Re-wire Bộ Não Khởi Nghiệp',
    subTitle: 'Mindset',
    author: 'Đức Huy',
    category: 'mindset',
    categoryName: 'Mindset',
    price: 149000,
    originalPrice: 250000,
    badge: '',
    rating: 4.9,
    reviewsCount: 65,
    salesCount: 1870,
    pages: 160,
    format: 'PDF',
    coverStyle: 'cover-6',
    coverImage: '',
    shortDesc: 'Tại sao 90% startup thất bại vì tâm lý. Cách rèn luyện nội lực chịu áp lực và ra quyết định dứt khoát.',
    fullDesc: `Cuốn sách mổ xẻ những góc khuất tâm lý của người làm chủ:
• Vượt qua hội chứng kẻ giả mạo (Imposter Syndrome) và nỗi sợ bị phán xét.
• Cách duy trì động lực khi suốt 3 tháng liền không có một đơn hàng.
• Kỹ năng ra quyết định dưới điều kiện thiếu thông tin và áp lực tài chính.
• Cân bằng giữa khát vọng thành công và sức khỏe tinh thần.`,
    toc: [
      'Chương 1: Bộ não làm thuê vs. Bộ não người làm chủ',
      'Chương 2: Sống sót qua "Thung lũng tuyệt vọng"',
      'Chương 3: Nghệ thuật chấp nhận sai lầm và xoay trục kịp thời',
      'Chương 4: Xây dựng kỷ luật tự thân thép khi không có sếp thúc ép',
      'Chương 5: Sứ mệnh thực sự đằng sau công việc kinh doanh của bạn'
    ],
    sampleExcerpt: `Khi bạn đi làm thuê, rủi ro lớn nhất là bị sa thải. Khi bạn làm chủ, bạn là người chịu trách nhiệm cho từng đồng tiền chi ra và số phận của chính mình. Sự tự do không bao giờ miễn phí — cái giá của tự do là trách nhiệm tuyệt đối.`,
    downloadUrl: 'https://example.com/download/tu-duy-nguoi-sang-lap.pdf',
    featured: false,
    status: 'active'
  },
  {
    id: 'ebk-07',
    title: 'Xây Thương Hiệu Cá Nhân Từ 0 — Không Cần Nổi Tiếng',
    subTitle: 'Personal Brand',
    author: 'Hà My',
    category: 'marketing',
    categoryName: 'Marketing & Sales',
    price: 189000,
    originalPrice: 320000,
    badge: 'Hot',
    rating: 4.8,
    reviewsCount: 78,
    salesCount: 2390,
    pages: 195,
    format: 'PDF',
    coverStyle: 'cover-8',
    coverImage: '',
    shortDesc: 'Từ tài khoản mạng xã hội 0 follower đến uy tín thương hiệu cá nhân mang về cơ hội việc làm liên tục.',
    fullDesc: `Bạn không cần phải nhảy múa trên TikTok hay khoe xe sang để có thương hiệu cá nhân uy tín:
• Định vị chuyên môn độc bản: Giao thoa giữa đam mê, thế mạnh và nhu cầu xã hội.
• Chiến lược phân phối nội dung đa kênh: Facebook, LinkedIn, Substack, Threads.
• Cách thu hút khách hàng cao cấp (High-ticket clients) bằng uy tín học thuật và kinh nghiệm thực chiến.
• Bảo vệ danh tiếng và xử lý khủng hoảng truyền thông cá nhân.`,
    toc: [
      'Chương 1: Thương hiệu cá nhân không phải là sống ảo',
      'Chương 2: Khám phá định vị độc bản của riêng bạn',
      'Chương 3: Cỗ máy sản xuất nội dung nhất quán 365 ngày',
      'Chương 4: Chuyển đổi lượt theo dõi thành tiền mặt',
      'Chương 5: Duy trì sự chân thực và phát triển bền vững'
    ],
    sampleExcerpt: `Mọi người không mua sản phẩm của một thương hiệu vô danh; họ mua từ những người họ biết, thích và tin tưởng. Xây dựng thương hiệu cá nhân là khoản đầu tư có lợi suất kép lớn nhất trong sự nghiệp của bạn.`,
    downloadUrl: 'https://example.com/download/xay-thuong-hieu-ca-nhan-tu-0.pdf',
    featured: false,
    status: 'active'
  },
  {
    id: 'ebk-08',
    title: 'Mở Spa Mini Tại Nhà: Vốn Nhỏ, Lợi Nhuận Bền Vững',
    subTitle: 'Kinh doanh ngách',
    author: 'Thanh Thảo',
    category: 'kinh-doanh',
    categoryName: 'Kinh doanh',
    price: 249000,
    originalPrice: 420000,
    badge: 'Mẹo thực tế',
    rating: 5.0,
    reviewsCount: 62,
    salesCount: 4180,
    pages: 168,
    format: 'PDF + Bảng tính chi phí',
    coverStyle: 'cover-3',
    coverImage: '',
    shortDesc: 'Mô hình kinh doanh dịch vụ tại nhà vốn dưới 30 triệu, dòng tiền đều đặn >25 triệu/tháng.',
    fullDesc: `Cẩm nang trọn gói từ kinh nghiệm thực tế của chủ chuỗi 3 cơ sở spa mini:
• Lên danh sách trang thiết bị cần thiết và nguồn hàng giá gốc không qua trung gian.
• Thiết kế không gian ấm cúng, thư giãn chuẩn spa ngay tại phòng ngủ hoặc phòng khách.
• Chiến lược tìm 50 khách hàng đầu tiên từ khu vực dân cư xung quanh.
• Bảng tính toán doanh thu, chi phí và điểm hòa vốn chi tiết từng tháng.`,
    toc: [
      'Chương 1: Tại sao mô hình Spa tại nhà đang bùng nổ?',
      'Chương 2: Chuẩn bị vốn và danh mục thiết bị tối thiểu',
      'Chương 3: Setup không gian và tiêu chuẩn an toàn vệ sinh',
      'Chương 4: Chiến thuật marketing địa phương chi phí 0 đồng',
      'Chương 5: Giữ chân khách hàng và upsell thẻ liệu trình'
    ],
    sampleExcerpt: `Khách hàng hiện đại đang có xu hướng ngại sự xô bồ của các viện thẩm mỹ lớn. Họ yêu thích sự riêng tư, ấm cúng và sự chăm sóc 1-1 tận tình tại các cơ sở mini. Đây chính là lợi thế cạnh tranh cốt lõi mà các bạn trẻ có thể tận dụng ngay tại nhà.`,
    downloadUrl: 'https://example.com/download/mo-spa-mini-tai-nha.pdf',
    featured: false,
    status: 'active'
  }
];

// Danh sách Combo tiết kiệm độc quyền
const DEFAULT_COMBOS = [
  {
    id: 'combo-01',
    title: 'Gói Khởi Nghiệp Tinh Gọn & Bán Hàng Toàn Diện',
    subTitle: 'Bộ 3 Ebook cốt lõi cho Solo Founder',
    bookIds: ['ebk-01', 'ebk-05', 'ebk-06'],
    bookNames: [
      'Khởi Nghiệp Không Lối Mòn',
      'Bán Hàng Không Cần Quảng Cáo',
      'Tư Duy Người Sáng Lập'
    ],
    price: 389000,
    originalPrice: 1129000,
    discountBadge: 'Tiết kiệm 65%',
    tag: 'Bán chạy nhất',
    popular: true,
    desc: 'Trọn bộ kiến thức từ lúc thai nghén ý tưởng, xây dựng sản phẩm, bán hàng không tốn tiền ads đến tôi luyện tinh thần người làm chủ.'
  },
  {
    id: 'combo-02',
    title: 'Gói Thu Nhập Tự Do: Freelance & Personal Brand',
    subTitle: 'Dành cho người muốn làm việc từ xa',
    bookIds: ['ebk-02', 'ebk-07'],
    bookNames: [
      '20 Ngách Freelance Ít Cạnh Tranh',
      'Xây Thương Hiệu Cá Nhân Từ 0'
    ],
    price: 329000,
    originalPrice: 770000,
    discountBadge: 'Tiết kiệm 57%',
    tag: 'Xu hướng 2025',
    popular: false,
    desc: 'Lộ trình thoát ly công việc văn phòng 8 tiếng: Chọn ngách kỹ năng có giá trị cao và xây dựng uy tín để khách hàng tự săn đón.'
  },
  {
    id: 'combo-03',
    title: 'Gói Kỹ Năng Tương Lai: Đòn Bẩy AI & Tài Chính',
    subTitle: 'Nâng cấp tư duy tiền tệ và năng suất',
    bookIds: ['ebk-03', 'ebk-04'],
    bookNames: [
      'Kiếm Tiền Với AI Trong 30 Ngày',
      'Quản Lý Tiền Kiểu Người Giàu'
    ],
    price: 279000,
    originalPrice: 698000,
    discountBadge: 'Tiết kiệm 60%',
    tag: 'Thực chiến 100%',
    popular: false,
    desc: 'Học cách dùng công nghệ AI để tạo thêm dòng tiền mới và dùng cỗ máy 5 tài khoản để giữ tiền, tích lũy tài sản bền vững.'
  },
  {
    id: 'combo-vip',
    title: 'All-In-One VIP Pass — Mở Khóa Toàn Bộ Kho Ebook',
    subTitle: 'Sở hữu vĩnh viễn toàn bộ ebook hiện tại và tương lai',
    bookIds: ['ebk-01', 'ebk-02', 'ebk-03', 'ebk-04', 'ebk-05', 'ebk-06', 'ebk-07', 'ebk-08'],
    bookNames: [
      'Toàn bộ 8 cuốn Ebook hiện có + Tặng kèm toàn bộ sách mới ra mắt trong năm'
    ],
    price: 599000,
    originalPrice: 2800000,
    discountBadge: 'Siêu Tiết Kiệm -78%',
    tag: 'Đặc quyền VIP',
    popular: true,
    desc: 'Mở khóa không giới hạn trọn đời tất cả ebook thực chiến trên hệ thống EbookPe, cập nhật link tải PDF qua email mỗi khi có ấn bản mới.'
  }
];

// Danh sách đơn hàng mẫu ban đầu
const DEFAULT_ORDERS = [
  {
    orderId: 'EBPE-98214',
    customerName: 'Nguyễn Thành Trung',
    customerEmail: 'trung.nguyen89@gmail.com',
    customerPhone: '0912345678',
    items: [
      { id: 'ebk-01', title: 'Khởi Nghiệp Không Lối Mòn', price: 199000, qty: 1 }
    ],
    totalAmount: 199000,
    paymentMethod: 'VietQR',
    status: 'completed', // completed, pending, cancelled
    orderDate: '2026-09-26 15:42:10',
    notes: 'Khách thanh toán quét mã MBBank thành công.'
  },
  {
    orderId: 'EBPE-98215',
    customerName: 'Lê Hoàng Nam',
    customerEmail: 'hoangnam.le@outlook.com',
    customerPhone: '0987654321',
    items: [
      { id: 'combo-01', title: 'Gói Khởi Nghiệp Tinh Gọn & Bán Hàng Toàn Diện', price: 389000, qty: 1 }
    ],
    totalAmount: 389000,
    paymentMethod: 'VietQR',
    status: 'completed',
    orderDate: '2026-09-27 08:15:32',
    notes: 'Đã gửi link qua email tự động.'
  },
  {
    orderId: 'EBPE-98216',
    customerName: 'Vũ Thị Minh Hạnh',
    customerEmail: 'hanh.vu1995@gmail.com',
    customerPhone: '0903112233',
    items: [
      { id: 'ebk-03', title: 'Kiếm Tiền Với AI: Roadmap 30 Ngày', price: 199000, qty: 1 }
    ],
    totalAmount: 199000,
    paymentMethod: 'MoMo',
    status: 'completed',
    orderDate: '2026-09-27 09:30:00',
    notes: 'Thanh toán MoMo thành công.'
  }
];

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
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(DEFAULT_BOOKS));
        return DEFAULT_BOOKS;
      }
      return JSON.parse(data);
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
    return updated;
  }

  static deleteBook(id) {
    let books = this.getBooks();
    books = books.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notifyChange('BOOKS_UPDATED', { books });
    return true;
  }

  // --- COMBOS ---
  static getCombos() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMBOS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(DEFAULT_COMBOS));
        return DEFAULT_COMBOS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_COMBOS;
    }
  }

  static getComboById(id) {
    const combos = this.getCombos();
    return combos.find(c => c.id === id) || null;
  }

  // --- ĐƠN HÀNG ---
  static getOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
        return DEFAULT_ORDERS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_ORDERS;
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
