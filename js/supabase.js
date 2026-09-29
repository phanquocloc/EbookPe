/**
 * EbookPe — Supabase Cloud Database Integration Layer
 * Tích hợp lưu trữ cơ sở dữ liệu thời gian thực Supabase (PostgreSQL)
 * Hỗ trợ cả Supabase JS SDK và REST API Direct Fetch (chống lỗi thư viện bên thứ 3)
 */

(function (window) {
  'use strict';

  const DEFAULT_CONFIG = {
    url: 'https://jymkfplrxrbtmskinvre.supabase.co',
    key: 'sb_publishable_uozNN_5s8HXEca1_IAU3lw_h5br3rfd',
    enabled: true
  };

  class EbookSupabase {
    static getSettings() {
      if (window.EbookDB && typeof window.EbookDB.getSettings === 'function') {
        const s = window.EbookDB.getSettings();
        return {
          url: (s.supabaseUrl || DEFAULT_CONFIG.url).trim(),
          key: (s.supabaseKey || DEFAULT_CONFIG.key).trim(),
          enabled: s.supabaseEnabled !== false
        };
      }
      return DEFAULT_CONFIG;
    }

    static getClient() {
      const cfg = this.getSettings();
      if (!cfg.enabled || !cfg.url || !cfg.key) return null;
      if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        try {
          if (!window._supabaseClientInstance) {
            window._supabaseClientInstance = window.supabase.createClient(cfg.url, cfg.key);
          }
          return window._supabaseClientInstance;
        } catch (e) {
          console.warn('[Supabase] Init client error:', e);
        }
      }
      return null;
    }

    /**
     * Gửi yêu cầu REST API trực tiếp tới Supabase (fallback siêu nhanh & độc lập)
     */
    static async request(endpoint, options = {}) {
      const cfg = this.getSettings();
      if (!cfg.url || !cfg.key) {
        throw new Error('Chưa cấu hình Supabase URL và Anon Key');
      }

      const cleanUrl = cfg.url.replace(/\/+$/, '');
      const url = `${cleanUrl}/rest/v1/${endpoint.replace(/^\/+/, '')}`;

      const headers = {
        'apikey': cfg.key,
        'Authorization': `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...(options.headers || {})
      };

      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!res.ok) {
        let errData = {};
        try {
          errData = await res.json();
        } catch (e) {}
        const msg = errData.message || errData.hint || errData.details || `Mã lỗi HTTP: ${res.status}`;
        throw new Error(msg);
      }

      try {
        return await res.json();
      } catch (e) {
        return null;
      }
    }

    /**
     * Kiểm tra trạng thái kết nối tới Supabase
     */
    static async testConnection() {
      const cfg = this.getSettings();
      if (!cfg.url || !cfg.key) {
        return { success: false, message: 'Chưa điền Supabase URL hoặc API Key' };
      }

      try {
        // Thử query 1 bản ghi từ bảng orders
        await this.request('orders?limit=1', { method: 'GET' });
        return { success: true, message: 'Kết nối Supabase thành công! Bảng orders đã sẵn sàng.' };
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('Could not find the table') || msg.includes('relation') || msg.includes('404') || msg.includes('PGRST205')) {
          return {
            success: true,
            warning: true,
            message: 'Đã kết nối tới Server Supabase thành công! (Lưu ý: Cần chạy script SQL để tạo bảng dữ liệu).'
          };
        }
        return { success: false, message: `Lỗi kết nối Supabase: ${msg}` };
      }
    }

    /**
     * Lưu đơn hàng mới lên Supabase
     */
    static async saveOrder(order) {
      if (!order || !order.orderId) return null;
      try {
        const payload = {
          id: order.orderId,
          order_id: order.orderId,
          customer_name: order.customerName || 'Khách Hàng',
          customer_email: order.customerEmail || '',
          customer_phone: order.customerPhone || '',
          total_amount: order.totalAmount || 0,
          payment_method: order.paymentMethod || 'VietQR',
          status: order.status || 'completed',
          items: order.items || [],
          created_at: new Date().toISOString()
        };

        const client = this.getClient();
        if (client) {
          const { data, error } = await client.from('orders').upsert(payload);
          if (error) throw error;
          console.log('[Supabase] Đã lưu đơn hàng lên Cloud thành công:', order.orderId);
          return data;
        }

        const data = await this.request('orders', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=representation',
          body: payload
        });
        console.log('[Supabase] Đã lưu đơn hàng REST API thành công:', order.orderId);
        return data;
      } catch (err) {
        console.warn('[Supabase] Lưu đơn hàng thất bại (đã lưu dự phòng LocalStorage):', err.message);
        return null;
      }
    }

    /**
     * Lấy toàn bộ đơn hàng từ Supabase
     */
    static async getOrders() {
      try {
        const client = this.getClient();
        if (client) {
          const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return (data || []).map(this.mapOrderFromSupabase);
        }

        const data = await this.request('orders?select=*&order=created_at.desc');
        return (data || []).map(this.mapOrderFromSupabase);
      } catch (err) {
        console.warn('[Supabase] Tải đơn hàng từ Cloud không thành công:', err.message);
        return null;
      }
    }

    static mapOrderFromSupabase(row) {
      return {
        orderId: row.order_id || row.id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        totalAmount: parseFloat(row.total_amount || 0),
        payment_method: row.payment_method,
        status: row.status || 'completed',
        items: row.items || [],
        orderDate: row.created_at ? new Date(row.created_at).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
        createdAt: row.created_at
      };
    }

    /**
     * Đồng bộ toàn bộ dữ liệu hiện tại (Sách, Combo, Đơn hàng, Cài đặt) lên Supabase
     */
    static async syncAllToSupabase() {
      if (!window.EbookDB) {
        throw new Error('EbookDB chưa sẵn sàng');
      }

      const results = {
        ordersCount: 0,
        booksCount: 0,
        combosCount: 0,
        settingsSaved: false,
        errors: []
      };

      // 1. Đồng bộ Đơn hàng
      try {
        const orders = window.EbookDB.getOrders();
        for (const o of orders) {
          await this.saveOrder(o);
        }
        results.ordersCount = orders.length;
      } catch (e) {
        results.errors.push(`Đơn hàng: ${e.message}`);
      }

      // 2. Đồng bộ Sách
      try {
        const books = window.EbookDB.getBooks();
        for (const b of books) {
          const payload = {
            id: b.id,
            title: b.title,
            sub_title: b.subTitle || '',
            author: b.author || '',
            category: b.category || 'all',
            category_name: b.categoryName || '',
            price: b.price || 0,
            original_price: b.originalPrice || 0,
            badge: b.badge || '',
            pages: b.pages || 100,
            format: b.format || 'PDF + EPUB',
            status: b.status || 'active',
            rating: b.rating || 5.0,
            reviews_count: b.reviewsCount || 0,
            sales_count: b.salesCount || 0,
            short_desc: b.shortDesc || '',
            full_desc: b.fullDesc || '',
            toc: b.toc || [],
            sample_excerpt: b.sampleExcerpt || '',
            download_url: b.downloadUrl || '',
            cover_style: b.coverStyle || 'cover-1',
            cover_image: b.coverImage || ''
          };
          await this.request('books', {
            method: 'POST',
            prefer: 'resolution=merge-duplicates,return=representation',
            body: payload
          });
        }
        results.booksCount = books.length;
      } catch (e) {
        results.errors.push(`Sách: ${e.message}`);
      }

      // 3. Đồng bộ Combo
      try {
        const combos = window.EbookDB.getCombos();
        for (const c of combos) {
          const payload = {
            id: c.id,
            title: c.title,
            sub_title: c.subTitle || '',
            tag: c.tag || '',
            discount_badge: c.discountBadge || '',
            price: c.price || 0,
            original_price: c.originalPrice || 0,
            popular: !!c.popular,
            status: c.status || 'active',
            book_ids: c.bookIds || [],
            bonus_list: c.bonusList || [],
            download_url: c.downloadUrl || ''
          };
          await this.request('combos', {
            method: 'POST',
            prefer: 'resolution=merge-duplicates,return=representation',
            body: payload
          });
        }
        results.combosCount = combos.length;
      } catch (e) {
        results.errors.push(`Combo: ${e.message}`);
      }

      // 4. Đồng bộ Cài đặt
      try {
        const settings = window.EbookDB.getSettings();
        await this.request('settings', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=representation',
          body: {
            id: 'main_settings',
            data: settings,
            updated_at: new Date().toISOString()
          }
        });
        results.settingsSaved = true;
      } catch (e) {
        results.errors.push(`Cài đặt: ${e.message}`);
      }

      return results;
    }

    /**
     * Script SQL chuẩn hóa để khởi tạo bảng trên Supabase
     */
    static getSQLSchema() {
      return `-- ========================================================
-- EbookPe - SQL Schema Khởi Tạo Bảng Cho Supabase Database
-- Hướng dẫn: Dán toàn bộ mã này vào Supabase -> SQL Editor -> Run
-- ========================================================

-- 1. Bảng Đơn Hàng (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    total_amount NUMERIC DEFAULT 0,
    payment_method TEXT,
    status TEXT DEFAULT 'completed',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Sách Ebook (Books)
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sub_title TEXT,
    author TEXT,
    category TEXT,
    category_name TEXT,
    price NUMERIC DEFAULT 0,
    original_price NUMERIC DEFAULT 0,
    badge TEXT,
    pages INTEGER DEFAULT 100,
    format TEXT DEFAULT 'PDF + EPUB',
    status TEXT DEFAULT 'active',
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    short_desc TEXT,
    full_desc TEXT,
    toc JSONB DEFAULT '[]'::jsonb,
    sample_excerpt TEXT,
    download_url TEXT,
    cover_style TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Combo Tiết Kiệm (Combos)
CREATE TABLE IF NOT EXISTS public.combos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sub_title TEXT,
    tag TEXT,
    discount_badge TEXT,
    price NUMERIC DEFAULT 0,
    original_price NUMERIC DEFAULT 0,
    popular BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    book_ids JSONB DEFAULT '[]'::jsonb,
    bonus_list JSONB DEFAULT '[]'::jsonb,
    download_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Cài Đặt Shop (Settings)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Bật Row Level Security (RLS) & Cấp Quyền Đọc/Ghi Cho Anon Key
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep doc orders" ON public.orders;
CREATE POLICY "Cho phep doc orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Cho phep them sua orders" ON public.orders;
CREATE POLICY "Cho phep them sua orders" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Cho phep quan tri books" ON public.books;
CREATE POLICY "Cho phep quan tri books" ON public.books FOR ALL USING (true);

DROP POLICY IF EXISTS "Cho phep quan tri combos" ON public.combos;
CREATE POLICY "Cho phep quan tri combos" ON public.combos FOR ALL USING (true);

DROP POLICY IF EXISTS "Cho phep quan tri settings" ON public.settings;
CREATE POLICY "Cho phep quan tri settings" ON public.settings FOR ALL USING (true);
`;
    }
  }

  window.EbookSupabase = EbookSupabase;
})(window);
