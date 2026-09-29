-- =============================================================================
-- EBOOKPE — PRODUCTION DATABASE SCHEMA & INITIALIZATION SCRIPT (SUPABASE / POSTGRESQL)
-- Phiên bản: 2.0 (Hỗ trợ Ebook đơn lẻ, Gói Combo, Đơn hàng VietQR & Cài đặt hệ thống)
-- Hướng dẫn: Đăng nhập Supabase -> Chọn dự án -> Vào SQL Editor -> Dán toàn bộ mã này -> Bấm RUN
-- =============================================================================

-- Bật extension UUID & JSONB tối ưu hóa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. BẢNG CÀI ĐẶT HỆ THỐNG (SETTINGS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'main_settings',
    store_name TEXT DEFAULT 'EbookPe',
    store_slogan TEXT DEFAULT 'Nền tảng Ebook thực chiến #1 Việt Nam',
    bank_code TEXT DEFAULT 'MB',
    bank_name TEXT DEFAULT 'MBBank (Quân Đội)',
    account_number TEXT DEFAULT '2456987654',
    account_name TEXT DEFAULT 'PHAN QUOC LOC',
    qr_template TEXT DEFAULT 'compact2',
    transfer_prefix TEXT DEFAULT 'EBPE',
    hotline TEXT DEFAULT '0333.399.956',
    support_email TEXT DEFAULT 'thinhloclinh@gmail.com',
    zalo_link TEXT DEFAULT 'https://zalo.me/0333399956',
    guarantee_days INTEGER DEFAULT 30,
    sepay_api_key TEXT DEFAULT '',
    emailjs_service_id TEXT DEFAULT '',
    emailjs_template_id TEXT DEFAULT '',
    emailjs_public_key TEXT DEFAULT '',
    auto_email_enabled BOOLEAN DEFAULT false,
    supabase_url TEXT DEFAULT 'https://jymkfplrxrbtmskinvre.supabase.co',
    supabase_key TEXT DEFAULT 'sb_publishable_uozNN_5s8HXEca1_IAU3lw_h5br3rfd',
    supabase_enabled BOOLEAN DEFAULT true,
    raw_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 2. BẢNG DANH MỤC (CATEGORIES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🔥',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 3. BẢNG EBOOK (BOOKS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sub_title TEXT DEFAULT '',
    author TEXT DEFAULT 'EbookPe',
    category TEXT DEFAULT 'all',
    category_name TEXT DEFAULT 'Ebook',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(12, 2) DEFAULT 0,
    badge TEXT DEFAULT '',
    pages INTEGER DEFAULT 180,
    format TEXT DEFAULT 'PDF + EPUB',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    rating NUMERIC(3, 1) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    short_desc TEXT DEFAULT '',
    full_desc TEXT DEFAULT '',
    toc JSONB DEFAULT '[]'::jsonb,
    sample_excerpt TEXT DEFAULT '',
    download_url TEXT DEFAULT 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    cover_style TEXT DEFAULT 'cover-1',
    cover_image TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 4. BẢNG GÓI COMBO (COMBOS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.combos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sub_title TEXT DEFAULT '',
    tag TEXT DEFAULT 'TIẾT KIỆM',
    discount_badge TEXT DEFAULT '-50%',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(12, 2) DEFAULT 0,
    popular BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    book_ids JSONB DEFAULT '[]'::jsonb,
    bonus_list JSONB DEFAULT '[]'::jsonb,
    download_url TEXT DEFAULT 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 5. BẢNG ĐƠN HÀNG (ORDERS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Khách Hàng',
    customer_email TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'VietQR Chuyển Khoản',
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    email_sent BOOLEAN DEFAULT false,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 6. BẢNG NHẬT KÝ BẢO MẬT & QUẢN TRỊ (AUDIT LOGS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    level TEXT DEFAULT 'INFO' CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- 7. CHỈ MỤC TỐI ƯU HÓA TRUY VẤN (INDEXES)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_books_category ON public.books (category);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books (status);
CREATE INDEX IF NOT EXISTS idx_books_price ON public.books (price);
CREATE INDEX IF NOT EXISTS idx_books_sales ON public.books (sales_count DESC);

CREATE INDEX IF NOT EXISTS idx_combos_status ON public.combos (status);
CREATE INDEX IF NOT EXISTS idx_combos_popular ON public.combos (popular);

-- =============================================================================
-- 8. KÍCH HOẠT ROW LEVEL SECURITY (RLS) & PHÂN QUYỀN TRUY CẬP (POLICIES)
-- =============================================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8.1 Settings Policy
DROP POLICY IF EXISTS "Settings Read Policy" ON public.settings;
CREATE POLICY "Settings Read Policy" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Settings Write Policy" ON public.settings;
CREATE POLICY "Settings Write Policy" ON public.settings FOR ALL USING (true);

-- 8.2 Categories Policy
DROP POLICY IF EXISTS "Categories Read Policy" ON public.categories;
CREATE POLICY "Categories Read Policy" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Categories Write Policy" ON public.categories;
CREATE POLICY "Categories Write Policy" ON public.categories FOR ALL USING (true);

-- 8.3 Books Policy
DROP POLICY IF EXISTS "Books Read Policy" ON public.books;
CREATE POLICY "Books Read Policy" ON public.books FOR SELECT USING (true);
DROP POLICY IF EXISTS "Books Write Policy" ON public.books;
CREATE POLICY "Books Write Policy" ON public.books FOR ALL USING (true);

-- 8.4 Combos Policy
DROP POLICY IF EXISTS "Combos Read Policy" ON public.combos;
CREATE POLICY "Combos Read Policy" ON public.combos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Combos Write Policy" ON public.combos;
CREATE POLICY "Combos Write Policy" ON public.combos FOR ALL USING (true);

-- 8.5 Orders Policy
DROP POLICY IF EXISTS "Orders Read Policy" ON public.orders;
CREATE POLICY "Orders Read Policy" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Orders Insert Policy" ON public.orders;
CREATE POLICY "Orders Insert Policy" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Orders Update Policy" ON public.orders;
CREATE POLICY "Orders Update Policy" ON public.orders FOR UPDATE USING (true);

-- 8.6 Audit Logs Policy
DROP POLICY IF EXISTS "Audit Logs Read Policy" ON public.audit_logs;
CREATE POLICY "Audit Logs Read Policy" ON public.audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Audit Logs Insert Policy" ON public.audit_logs;
CREATE POLICY "Audit Logs Insert Policy" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 9. STORED PROCEDURES & HÀM HỖ TRỢ TỰ ĐỘNG
-- =============================================================================

-- Hàm tự động tăng lượt mua (sales_count) khi có đơn hàng mới
CREATE OR REPLACE FUNCTION public.increment_sales_count(book_id TEXT, quantity INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE public.books
    SET sales_count = COALESCE(sales_count, 0) + quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hàm thống kê doanh thu và tổng số đơn hàng tổng quan
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
    total_revenue NUMERIC,
    total_orders BIGINT,
    total_books BIGINT,
    total_combos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(o.total_amount), 0) AS total_revenue,
        COUNT(o.id) AS total_orders,
        (SELECT COUNT(b.id) FROM public.books b WHERE b.status = 'active') AS total_books,
        (SELECT COUNT(c.id) FROM public.combos c WHERE c.status = 'active') AS total_combos
    FROM public.orders o
    WHERE o.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 10. DỮ LIỆU MẪU BAN ĐẦU (SEED DATA CHUẨN HOÁ)
-- =============================================================================

-- 10.1 Cài đặt mặc định
INSERT INTO public.settings (
    id, store_name, store_slogan, bank_code, bank_name, account_number, account_name, 
    qr_template, transfer_prefix, hotline, support_email, zalo_link, guarantee_days,
    supabase_url, supabase_key, supabase_enabled
) VALUES (
    'main_settings', 'EbookPe', 'Nền tảng Ebook thực chiến #1 Việt Nam', 'MB', 'MBBank (Quân Đội)',
    '2456987654', 'PHAN QUOC LOC', 'compact2', 'EBPE', '0333.399.956', 'thinhloclinh@gmail.com',
    'https://zalo.me/0333399956', 30,
    'https://jymkfplrxrbtmskinvre.supabase.co', 'sb_publishable_uozNN_5s8HXEca1_IAU3lw_h5br3rfd', true
)
ON CONFLICT (id) DO UPDATE SET
    bank_name = EXCLUDED.bank_name,
    account_number = EXCLUDED.account_number,
    account_name = EXCLUDED.account_name,
    supabase_url = EXCLUDED.supabase_url,
    supabase_key = EXCLUDED.supabase_key,
    updated_at = timezone('utc'::text, now());

-- 10.2 Danh mục
INSERT INTO public.categories (id, name, icon, sort_order) VALUES
    ('all', '🔥 Tất cả', '🔥', 1),
    ('kinh-doanh', '💼 Kinh doanh', '💼', 2),
    ('khoi-nghiep', '🚀 Khởi nghiệp', '🚀', 3),
    ('mindset', '🧠 Mindset', '🧠', 4),
    ('cong-nghe', '💻 Công nghệ & AI', '💻', 5),
    ('tai-chinh', '💰 Tài chính', '💰', 6),
    ('marketing', '📈 Marketing & Sales', '📈', 7),
    ('freelance', '⚡ Solo Business', '⚡', 8)
ON CONFLICT (id) DO NOTHING;

-- 10.3 Danh sách 6 Ebook chủ lực
INSERT INTO public.books (
    id, title, sub_title, author, category, category_name, price, original_price, badge, 
    pages, format, status, rating, reviews_count, sales_count, short_desc, full_desc, 
    toc, sample_excerpt, download_url, cover_style
) VALUES
(
    'ebk-khoi-nghiep-0',
    'Khởi Nghiệp Tinh Gọn Từ Số 0',
    'Lộ trình thẩm định ý tưởng & 100 khách hàng đầu tiên',
    'Trần Minh Tuấn',
    'khoi-nghiep',
    'Khởi nghiệp',
    79000,
    189000,
    'Khởi nghiệp',
    218,
    'PDF + EPUB',
    'active',
    4.9,
    142,
    380,
    'Lộ trình thẩm định ý tưởng, tìm 100 khách hàng đầu tiên không cần vốn lớn.',
    'Cuốn sách hướng dẫn từng bước từ việc xác thực nhu cầu thị trường, xây dựng sản phẩm tối thiểu khả thi (MVP) đến cách tìm kiếm khách hàng trả phí đầu tiên mà không lãng phí tiền bạc.',
    '["Chương 1: Tư duy xác thực thị trường trước khi bỏ vốn", "Chương 2: Xây dựng sản phẩm tối thiểu khả thi (MVP) trong 7 ngày", "Chương 3: Phễu hút 100 khách hàng đầu tiên qua Organic Content", "Chương 4: Tự động hóa quy trình chốt đơn và bảo toàn dòng tiền"]'::jsonb,
    'Đừng hỏi khách hàng họ muốn gì, hãy tạo một giải pháp nhỏ và xem họ có sẵn sàng trả tiền trước không. Đa số mọi người thất bại không phải vì không làm được sản phẩm, mà vì làm ra thứ không ai cần trả tiền để mua.',
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    'cover-1'
),
(
    'ebk-ai-automation',
    'Cẩm Nang Ứng Dụng AI & ChatGPT Vào Kinh Doanh Tự Động',
    'Bộ công thức 500+ Prompt độc quyền',
    'TechLead VN',
    'cong-nghe',
    'Công nghệ & AI',
    99000,
    250000,
    'HOT SELLER',
    185,
    'PDF + Prompt Template',
    'active',
    5.0,
    215,
    650,
    'Tạo phễu bán lẻ, kịch bản chốt đơn tự động hóa từ AI với hơn 500+ prompt thực chiến.',
    'Hướng dẫn ứng dụng các công cụ AI thế hệ mới (ChatGPT, Claude, Midjourney, Make/Zapier) vào quy trình vận hành kinh doanh tinh gọn, marketing tự động và chăm sóc khách hàng 24/7.',
    '["Chương 1: Giải mã Prompt Engineering chuẩn cho chủ shop & freelancer", "Chương 2: Tự động hóa quy trình sản xuất content đa kênh bằng AI", "Chương 3: Xây dựng Chatbot tư vấn & chốt đơn thông minh", "Chương 4: Kết nối Make.com + AI để tự động hóa xử lý đơn hàng"]'::jsonb,
    'AI sẽ không thay thế bạn, nhưng người biết dùng AI để giải phóng 80% thời gian lặp đi lặp lại chắc chắn sẽ vượt lên dẫn đầu thị trường. Điểm cốt lõi là biết cách ra lệnh (Prompt) chính xác.',
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    'cover-2'
),
(
    'ebk-solo-business',
    'Xây Dựng Cỗ Máy Solo Business Triệu View & Doanh Thu Đều Đặn',
    'Mô hình kinh doanh 1 người với đòn bẩy số',
    'Hoàng Nam',
    'freelance',
    'Solo Business',
    89000,
    210000,
    'Solo Business',
    240,
    'PDF + EPUB',
    'active',
    4.9,
    168,
    420,
    'Xây dựng thương hiệu cá nhân, bán sản phẩm số và đóng gói tri thức cá nhân.',
    'Bộ khung hoàn chỉnh giúp một cá nhân có thể xây dựng doanh nghiệp 1 người (Solopreneur), tự tạo ra sản phẩm số (Ebook, Khóa học, Template) và bán hàng tự động 24/7.',
    '["Chương 1: Tìm kiếm thị trường ngách phù hợp với thế mạnh cá nhân", "Chương 2: Chiến lược đóng gói tri thức thành sản phẩm số có thể scale", "Chương 3: Xây dựng hệ thống phễu email marketing tự động hóa", "Chương 4: Quản trị thời gian và năng lượng cho Solopreneur"]'::jsonb,
    'Mô hình Solo Business không yêu cầu văn phòng sang trọng hay đội ngũ nhân sự cồng kềnh. Tài sản lớn nhất của bạn là kiến thức được đóng gói chuẩn chỉnh và hệ thống phân phối tự động.',
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    'cover-3'
),
(
    'ebk-quan-tri-tai-chinh',
    'Quản Trị Tài Chính Cá Nhân & Chiến Lược Dòng Tiền Tự Do',
    'Quy tắc 6 chiếc lọ cải tiến & đầu tư an toàn',
    'Đặng Thu Trang',
    'tai-chinh',
    'Tài chính',
    69000,
    159000,
    'Tài chính',
    196,
    'PDF + Sheet Tính Toán',
    'active',
    4.8,
    95,
    310,
    'Quy tắc 6 chiếc lọ cải tiến, chiến lược đầu tư chỉ số an toàn và thoát bẫy chi tiêu.',
    'Cuốn sách hướng dẫn quản lý tài chính cá nhân thực tế, phương pháp tích lũy quỹ khẩn cấp, phân bổ danh mục đầu tư an toàn và kế hoạch đạt được tự do tài chính bền vững.',
    '["Chương 1: Tái cấu trúc tư duy về tiền bạc và thói quen chi tiêu", "Chương 2: Hệ thống 6 chiếc lọ tự động hóa qua ứng dụng ngân hàng", "Chương 3: Thiết lập quỹ dự phòng khẩn cấp và bảo vệ dòng tiền", "Chương 4: Nguyên tắc đầu tư tích sản dài hạn cho người bận rộn"]'::jsonb,
    'Tự do tài chính không phụ thuộc vào việc bạn kiếm được bao nhiêu tiền mỗi tháng, mà phụ thuộc vào số tiền bạn giữ lại được và cách bạn khiến tiền làm việc thay mình.',
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    'cover-4'
),
(
    'ebk-content-marketing',
    'Content Khác Biệt: Nghệ Thuật Thu Hút Triệu Khách Hàng Tự Nhiên',
    'Bí quyết viết bài chạm đúng cảm xúc và chuyển đổi cao',
    'Lê Bảo Châu',
    'marketing',
    'Marketing & Sales',
    79000,
    179000,
    'Bán chạy',
    208,
    'PDF + EPUB',
    'active',
    4.9,
    110,
    290,
    'Phương pháp sáng tạo nội dung thu hút người xem tự nhiên trên Facebook, TikTok và LinkedIn.',
    'Cung cấp 30 công thức viết tiêu đề giật tít không phản cảm, kịch bản video ngắn giữ chân người xem và nghệ thuật kể chuyện (Storytelling) biến độc giả thành người mua hàng trung thành.',
    '["Chương 1: Giải mã thuật toán tâm lý độc giả thời đại chú ý ngắn", "Chương 2: 12 Công thức Headline thôi miên khiến người đọc dừng lướt", "Chương 3: Kỹ thuật Storytelling lồng ghép sản phẩm khéo léo", "Chương 4: Xây dựng lịch nội dung 30 ngày chỉ trong 2 giờ"]'::jsonb,
    'Nội dung hay không phải là nội dung dùng từ hoa mỹ, mà là nội dung nói đúng nỗi đau mà khách hàng chưa thể tự gọi tên thành lời.',
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    'cover-5'
),
(
    'ebk-tam-ly-hoc-ve-tien',
    'Tâm Lý Học Về Tiền & Quyết Định Đầu Tư Thực Chiến',
    'Làm chủ cảm xúc, loại bỏ cạm bẫy FOMO tài chính',
    'Phạm Minh Đức',
    'mindset',
    'Mindset',
    75000,
    169000,
    'Mindset',
    224,
    'PDF + EPUB',
    'active',
    4.9,
    88,
    245,
    'Hiểu rõ các cạm bẫy tâm lý trong quản lý tài chính và ra quyết định đầu tư thông minh.',
    'Khám phá cách não bộ con người phản ứng trước lòng tham và nỗi sợ hãi trong tiền bạc, giúp bạn đưa ra những quyết định tài chính sáng suốt và kiên định.',
    '["Chương 1: Nguồn gốc các sai lầm kinh điển khi xử lý tiền bạc", "Chương 2: Hiệu ứng FOMO và cách xây dựng kỷ luật đầu tư thép", "Chương 3: Nghệ thuật kiên nhẫn: Đòn bẩy lãi suất kép vô hình", "Chương 4: Định nghĩa lại sự giàu có thực sự"]'::jsonb,
    'Kiểm soát tiền bạc tốt ít liên quan đến việc bạn thông minh ra sao, mà liên quan nhiều hơn đến cách bạn hành xử và quản trị cảm xúc khi thị trường biến động.',
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
    'cover-6'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    sub_title = EXCLUDED.sub_title,
    price = EXCLUDED.price,
    download_url = EXCLUDED.download_url,
    updated_at = timezone('utc'::text, now());

-- 10.4 Danh sách 3 Gói Combo tiết kiệm
INSERT INTO public.combos (
    id, title, sub_title, tag, discount_badge, price, original_price, popular, status, 
    book_ids, bonus_list, download_url
) VALUES
(
    'combo-khoi-nghiep-tinh-gon',
    'Combo Khởi Nghiệp Tinh Gọn',
    'Dành cho người mới bắt đầu từ con số 0 cần lộ trình an toàn',
    'TIẾT KIỆM 60%',
    '-60%',
    179000,
    450000,
    false,
    'active',
    '["ebk-khoi-nghiep-0", "ebk-content-marketing", "ebk-quan-tri-tai-chinh"]'::jsonb,
    '["Ebook: Khởi Nghiệp Tinh Gọn Từ Số 0", "Ebook: Content Khác Biệt Thu Hút Triệu View", "Ebook: Quản Trị Tài Chính Cá Nhân & Dòng Tiền", "Bonus Độc Quyền: Notion Business Roadmap Template"]'::jsonb,
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing'
),
(
    'combo-solopreneur-ai-master',
    'Combo Solo Business & AI Master VIP',
    'Trọn bộ cẩm nang & đòn bẩy tự động hóa tối tân cho Solopreneur',
    'GIẢM 78%',
    '-78%',
    249000,
    1150000,
    true,
    'active',
    '["ebk-ai-automation", "ebk-solo-business", "ebk-khoi-nghiep-0", "ebk-content-marketing", "ebk-tam-ly-hoc-ve-tien"]'::jsonb,
    '["Toàn bộ 5 Ebook chủ lực về AI, Solopreneur & Phễu Bán Hàng", "Kho 500+ Prompt ChatGPT & Claude độc quyền kinh doanh", "Bộ Swipe File Email Marketing 100+ mẫu chuyển đổi cao", "Cập nhật trọn đời khi có phiên bản sách và template mới"]'::jsonb,
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing'
),
(
    'combo-mindset-tai-chinh',
    'Combo Mindset & Đột Phá Tài Chính',
    'Làm chủ dòng tiền cá nhân và tư duy đầu tư thực chiến',
    'TIẾT KIỆM 58%',
    '-58%',
    159000,
    380000,
    false,
    'active',
    '["ebk-quan-tri-tai-chinh", "ebk-tam-ly-hoc-ve-tien", "ebk-khoi-nghiep-0"]'::jsonb,
    '["Ebook: Quản Trị Tài Chính Cá Nhân & Chiến Lược Dòng Tiền", "Ebook: Tâm Lý Học Về Tiền & Quyết Định Đầu Tư", "Ebook: Khởi Nghiệp Tinh Gọn Từ Số 0", "Bonus Độc Quyền: File Excel Tự Động Tính Quỹ Tự Do Tài Chính"]'::jsonb,
    'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    sub_title = EXCLUDED.sub_title,
    price = EXCLUDED.price,
    download_url = EXCLUDED.download_url,
    book_ids = EXCLUDED.book_ids,
    bonus_list = EXCLUDED.bonus_list,
    updated_at = timezone('utc'::text, now());

-- =============================================================================
-- THÔNG BÁO HOÀN TẤT
-- =============================================================================
SELECT '✅ Khởi tạo và thiết lập Cơ Sở Dữ Liệu EbookPe trên Supabase thành công 100%!' AS status;
