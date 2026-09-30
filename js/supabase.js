/**
 * EbookPe — Supabase Cloud Database Integration Layer
 * Tích hợp lưu trữ cơ sở dữ liệu thời gian thực Supabase (PostgreSQL)
 * Hỗ trợ đồng bộ 2 chiều tự động: Sách, Combo, Đơn hàng & Cài đặt
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
     * Gửi yêu cầu REST API trực tiếp tới Supabase (Kèm chống cache dữ liệu)
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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Prefer': options.prefer || 'return=representation',
        ...(options.headers || {})
      };

      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        cache: 'no-store',
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
        await this.request('books?limit=1', { method: 'GET' });
        return { success: true, message: 'Kết nối Supabase thành công! Dữ liệu Cloud đã sẵn sàng.' };
      } catch (err) {
        const msg = err.message || '';
        return { success: false, message: `Lỗi kết nối Supabase: ${msg}` };
      }
    }

    /**
     * Lấy danh sách Sách từ Supabase Cloud và đồng bộ vào LocalStorage
     */
    static async fetchBooks() {
      try {
        const rows = await this.request('books?select=*&order=created_at.desc');
        if (Array.isArray(rows)) {
          const mapped = rows.map(r => ({
            id: r.id,
            title: r.title,
            subTitle: r.sub_title || '',
            author: r.author || 'EbookPe',
            category: r.category || 'all',
            categoryName: r.category_name || 'Ebook',
            price: parseFloat(r.price || 0),
            originalPrice: parseFloat(r.original_price || 0),
            badge: r.badge || '',
            pages: parseInt(r.pages || 180),
            format: r.format || 'PDF + EPUB',
            status: r.status || 'active',
            rating: parseFloat(r.rating || 5.0),
            reviewsCount: parseInt(r.reviews_count || 0),
            salesCount: parseInt(r.sales_count || 0),
            shortDesc: r.short_desc || '',
            fullDesc: r.full_desc || '',
            toc: r.toc || [],
            sampleExcerpt: r.sample_excerpt || '',
            downloadUrl: r.download_url || 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
            coverStyle: r.cover_style || 'cover-1',
            coverImage: r.cover_image || '',
            createdAt: r.created_at || new Date().toISOString(),
            isFeatured: !!(r.badge && (r.badge.includes('NỔI BẬT') || r.badge.includes('HOT') || r.badge.includes('⭐') || r.badge.toLowerCase().includes('featured')))
          }));
          window._cloudBooksCache = mapped;
          localStorage.setItem('ebookpe_books_v4', JSON.stringify(mapped));
          return mapped;
        }
      } catch (e) {
        console.warn('[Supabase] Tải sách từ Cloud:', e.message);
      }
      return null;
    }

    /**
     * Lấy danh sách Combo từ Supabase Cloud và đồng bộ vào LocalStorage
     */
    static async fetchCombos() {
      try {
        const rows = await this.request('combos?select=*&order=created_at.asc');
        if (Array.isArray(rows)) {
          const mapped = rows.map(r => ({
            id: r.id,
            title: r.title,
            subTitle: r.sub_title || '',
            tag: r.tag || 'Ưu đãi',
            discountBadge: r.discount_badge || '',
            price: parseFloat(r.price || 0),
            originalPrice: parseFloat(r.original_price || 0),
            popular: !!r.popular,
            status: r.status || 'active',
            bookIds: r.book_ids || [],
            bonusList: r.bonus_list || [],
            downloadUrl: r.download_url || 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing'
          }));
          window._cloudCombosCache = mapped;
          localStorage.setItem('ebookpe_combos_v4', JSON.stringify(mapped));
          return mapped;
        }
      } catch (e) {
        console.warn('[Supabase] Tải combo từ Cloud:', e.message);
      }
      return null;
    }

    /**
     * Lấy Cài đặt hệ thống từ Supabase Cloud và đồng bộ vào LocalStorage
     */
    static async fetchSettings() {
      try {
        const rows = await this.request('settings?id=eq.main_settings&select=*');
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          const raw = (r.raw_data && typeof r.raw_data === 'object') ? r.raw_data : {};
          const current = (window.EbookDB && typeof window.EbookDB.getSettings === 'function') ? window.EbookDB.getSettings() : {};
          
          const mapped = {
            ...current,
            ...raw,
            storeName: r.store_name ?? raw.storeName ?? current.storeName,
            storeSlogan: r.store_slogan ?? raw.storeSlogan ?? current.storeSlogan,
            bankCode: r.bank_code ?? raw.bankCode ?? current.bankCode,
            bankName: r.bank_name ?? raw.bankName ?? current.bankName,
            accountNumber: r.account_number ?? raw.accountNumber ?? current.accountNumber,
            accountName: r.account_name ?? raw.accountName ?? current.accountName,
            qrTemplate: r.qr_template ?? raw.qrTemplate ?? current.qrTemplate,
            transferPrefix: r.transfer_prefix ?? raw.transferPrefix ?? current.transferPrefix,
            hotline: r.hotline ?? raw.hotline ?? current.hotline,
            supportEmail: r.support_email ?? raw.supportEmail ?? current.supportEmail,
            zaloLink: r.zalo_link ?? raw.zaloLink ?? current.zaloLink,
            guaranteeDays: r.guarantee_days ?? raw.guaranteeDays ?? current.guaranteeDays,
            sepayApiKey: r.sepay_api_key !== undefined ? r.sepay_api_key : (raw.sepayApiKey !== undefined ? raw.sepayApiKey : current.sepayApiKey),
            emailjsServiceId: r.emailjs_service_id !== undefined ? r.emailjs_service_id : (raw.emailjsServiceId !== undefined ? raw.emailjsServiceId : current.emailjsServiceId),
            emailjsTemplateId: r.emailjs_template_id !== undefined ? r.emailjs_template_id : (raw.emailjsTemplateId !== undefined ? raw.emailjsTemplateId : current.emailjsTemplateId),
            emailjsPublicKey: r.emailjs_public_key !== undefined ? r.emailjs_public_key : (raw.emailjsPublicKey !== undefined ? raw.emailjsPublicKey : current.emailjsPublicKey),
            autoEmailEnabled: r.auto_email_enabled !== undefined ? !!r.auto_email_enabled : (raw.autoEmailEnabled !== undefined ? !!raw.autoEmailEnabled : !!current.autoEmailEnabled),
            supabaseUrl: r.supabase_url ?? raw.supabaseUrl ?? current.supabaseUrl,
            supabaseKey: r.supabase_key ?? raw.supabaseKey ?? current.supabaseKey,
            supabaseEnabled: r.supabase_enabled ?? raw.supabaseEnabled ?? current.supabaseEnabled
          };
          localStorage.setItem('ebookpe_settings_v4', JSON.stringify(mapped));
          if (window.EbookDB && typeof window.EbookDB.notifyChange === 'function') {
            window.EbookDB.notifyChange('SETTINGS_UPDATED', mapped);
          }
          return mapped;
        }
      } catch (e) {
        console.warn('[Supabase] Tải cài đặt từ Cloud:', e.message);
      }
      return null;
    }

    /**
     * Lưu/Cập nhật Cài đặt hệ thống lên Supabase Cloud
     */
    static async saveSettings(s) {
      if (!s || typeof s !== 'object') return;
      try {
        const payload = {
          store_name: s.storeName || 'EbookPe',
          store_slogan: s.storeSlogan || 'Nền tảng Ebook thực chiến #1 Việt Nam',
          bank_code: s.bankCode || 'MB',
          bank_name: s.bankName || 'MBBank (Quân Đội)',
          account_number: s.accountNumber || '2456987654',
          account_name: s.accountName || 'PHAN QUOC LOC',
          qr_template: s.qrTemplate || 'compact2',
          transfer_prefix: s.transferPrefix || 'EBPE',
          hotline: s.hotline || '0333.399.956',
          support_email: s.supportEmail || 'thinhloclinh@gmail.com',
          zalo_link: s.zaloLink || 'https://zalo.me/0333399956',
          guarantee_days: parseInt(s.guaranteeDays || 30),
          sepay_api_key: (s.sepayApiKey || '').trim(),
          emailjs_service_id: (s.emailjsServiceId || '').trim(),
          emailjs_template_id: (s.emailjsTemplateId || '').trim(),
          emailjs_public_key: (s.emailjsPublicKey || '').trim(),
          auto_email_enabled: !!s.autoEmailEnabled,
          supabase_url: (s.supabaseUrl || DEFAULT_CONFIG.url).trim(),
          supabase_key: (s.supabaseKey || DEFAULT_CONFIG.key).trim(),
          supabase_enabled: s.supabaseEnabled !== false,
          raw_data: s,
          updated_at: new Date().toISOString()
        };

        try {
          const patchRes = await this.request('settings?id=eq.main_settings', {
            method: 'PATCH',
            body: payload
          });
          if (Array.isArray(patchRes) && patchRes.length > 0) {
            console.log('[Supabase] Đã cập nhật Cài Đặt lên Cloud Database thành công');
            return patchRes[0];
          }
        } catch (patchErr) {
          console.warn('[Supabase] Thử PATCH settings:', patchErr.message);
        }

        const insertPayload = { id: 'main_settings', ...payload };
        await this.request('settings', {
          method: 'POST',
          body: insertPayload
        });
        console.log('[Supabase] Đã tạo mới Cài Đặt trên Cloud Database');
      } catch (e) {
        console.warn('[Supabase] Lưu cài đặt lên Cloud:', e.message);
      }
    }

    /**
     * Lưu/Cập nhật Sách lên Supabase Cloud
     */
    static async saveBook(b) {
      if (!b || !b.id) return;
      try {
        const isFeat = b.isFeatured !== undefined 
          ? !!b.isFeatured 
          : !!(b.featured || (b.badge && (b.badge.includes('⭐') || b.badge.includes('NỔI BẬT'))));

        let badgeVal = b.badge || '';
        if (isFeat) {
          if (!badgeVal.includes('⭐') && !badgeVal.includes('NỔI BẬT')) {
            badgeVal = badgeVal ? `⭐ ${badgeVal}` : '⭐ NỔI BẬT';
          }
        } else {
          badgeVal = badgeVal.replace(/⭐\s*/g, '').replace(/NỔI BẬT/g, '').replace(/HOT/g, '').trim();
        }

        const payload = {
          title: b.title || 'Chưa đặt tên',
          sub_title: b.subTitle || '',
          author: b.author || 'EbookPe',
          category: b.category || 'all',
          category_name: b.categoryName || 'Ebook',
          price: parseFloat(b.price || 0),
          original_price: parseFloat(b.originalPrice || 0),
          badge: badgeVal,
          pages: parseInt(b.pages || 180),
          format: b.format || 'PDF + EPUB',
          status: b.status || 'active',
          rating: parseFloat(b.rating || 5.0),
          reviews_count: parseInt(b.reviewsCount || 0),
          sales_count: parseInt(b.salesCount || 0),
          short_desc: b.shortDesc || '',
          full_desc: b.fullDesc || '',
          toc: Array.isArray(b.toc) ? b.toc : (b.toc ? [b.toc] : []),
          sample_excerpt: b.sampleExcerpt || '',
          download_url: b.downloadUrl || 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
          cover_style: b.coverStyle || 'cover-1',
          cover_image: b.coverImage || '',
          updated_at: new Date().toISOString()
        };

        // 1. Thử PATCH cập nhật sách nếu đã tồn tại trong DB
        try {
          const patchRes = await this.request(`books?id=eq.${encodeURIComponent(b.id)}`, {
            method: 'PATCH',
            body: payload
          });
          if (Array.isArray(patchRes) && patchRes.length > 0) {
            console.log('[Supabase] Đã cập nhật sách trên Cloud:', b.id, badgeVal);
            return patchRes[0];
          }
        } catch (patchErr) {
          console.warn('[Supabase] Thử PATCH sách:', patchErr.message);
        }

        // 2. Nếu sách chưa có trong DB (sách mới tạo), thực hiện POST INSERT
        const insertPayload = {
          id: b.id,
          ...payload,
          created_at: b.createdAt || new Date().toISOString()
        };
        const postRes = await this.request('books', {
          method: 'POST',
          body: insertPayload
        });
        console.log('[Supabase] Đã thêm mới sách lên Cloud:', b.id);
        return postRes;
      } catch (e) {
        console.warn('[Supabase] Lưu sách lên Cloud:', e.message);
      }
    }

    /**
     * Xóa Sách khỏi Supabase Cloud
     */
    static async deleteBook(id) {
      if (!id) return;
      try {
        await this.request(`books?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('[Supabase] Xóa sách khỏi Cloud:', e.message);
      }
    }

    /**
     * Xóa toàn bộ Sách khỏi Supabase Cloud
     */
    static async clearAllBooks() {
      try {
        await this.request('books?id=neq.null', {
          method: 'DELETE'
        });
        console.log('[Supabase] Đã xóa sạch toàn bộ sách trên Cloud');
      } catch (e) {
        console.warn('[Supabase] Xóa tất cả sách khỏi Cloud:', e.message);
      }
    }

    /**
     * Lưu/Cập nhật Combo lên Supabase Cloud
     */
    static async saveCombo(c) {
      if (!c || !c.id) return;
      try {
        const payload = {
          title: c.title || 'Gói Combo',
          sub_title: c.subTitle || '',
          tag: c.tag || 'Ưu đãi',
          discount_badge: c.discountBadge || '',
          price: parseFloat(c.price || 0),
          original_price: parseFloat(c.originalPrice || 0),
          popular: !!c.popular,
          status: c.status || 'active',
          book_ids: c.bookIds || [],
          bonus_list: c.bonusList || [],
          download_url: c.downloadUrl || 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing',
          updated_at: new Date().toISOString()
        };

        try {
          const patchRes = await this.request(`combos?id=eq.${encodeURIComponent(c.id)}`, {
            method: 'PATCH',
            body: payload
          });
          if (Array.isArray(patchRes) && patchRes.length > 0) {
            console.log('[Supabase] Đã cập nhật combo trên Cloud:', c.id);
            return patchRes[0];
          }
        } catch (patchErr) {
          console.warn('[Supabase] Thử PATCH combo:', patchErr.message);
        }

        const insertPayload = {
          id: c.id,
          ...payload,
          created_at: c.createdAt || new Date().toISOString()
        };
        const postRes = await this.request('combos', {
          method: 'POST',
          body: insertPayload
        });
        console.log('[Supabase] Đã thêm mới combo lên Cloud:', c.id);
        return postRes;
      } catch (e) {
        console.warn('[Supabase] Lưu combo lên Cloud:', e.message);
      }
    }

    /**
     * Xóa Combo khỏi Supabase Cloud
     */
    static async deleteCombo(id) {
      if (!id) return;
      try {
        await this.request(`combos?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('[Supabase] Xóa combo khỏi Cloud:', e.message);
      }
    }

    /**
     * Xóa toàn bộ Combo khỏi Supabase Cloud
     */
    static async clearAllCombos() {
      try {
        await this.request('combos?id=neq.null', {
          method: 'DELETE'
        });
        console.log('[Supabase] Đã xóa sạch toàn bộ combo trên Cloud');
      } catch (e) {
        console.warn('[Supabase] Xóa tất cả combo khỏi Cloud:', e.message);
      }
    }

    /**
     * Xóa toàn bộ Đơn hàng khỏi Supabase Cloud
     */
    static async clearAllOrders() {
      try {
        await this.request('orders?id=neq.null', {
          method: 'DELETE'
        });
        console.log('[Supabase] Đã xóa sạch toàn bộ đơn hàng trên Cloud');
      } catch (e) {
        console.warn('[Supabase] Xóa tất cả đơn hàng khỏi Cloud:', e.message);
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const client = this.getClient();
        if (client) {
          const { data, error } = await client.from('orders').upsert(payload);
          if (error) throw error;
          console.log('[Supabase] Đã lưu đơn hàng lên Cloud:', order.orderId);
          return data;
        }

        const data = await this.request('orders?on_conflict=id', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=representation',
          body: payload
        });
        console.log('[Supabase] Đã lưu đơn hàng REST API:', order.orderId);
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
        const rows = await this.request('orders?select=*&order=created_at.desc');
        return (rows || []).map(r => ({
          orderId: r.order_id || r.id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          totalAmount: parseFloat(r.total_amount || 0),
          paymentMethod: r.payment_method,
          status: r.status || 'completed',
          items: r.items || [],
          orderDate: r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
          createdAt: r.created_at
        }));
      } catch (err) {
        console.warn('[Supabase] Tải đơn hàng:', err.message);
        return null;
      }
    }

    /**
     * Đồng bộ toàn bộ dữ liệu hiện tại lên Supabase Cloud
     */
    static async syncAllToSupabase() {
      if (!window.EbookDB) {
        throw new Error('EbookDB chưa sẵn sàng');
      }

      const results = { ordersCount: 0, booksCount: 0, combosCount: 0, settingsSaved: false, errors: [] };

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
          await this.saveBook(b);
        }
        results.booksCount = books.length;
      } catch (e) {
        results.errors.push(`Sách: ${e.message}`);
      }

      // 3. Đồng bộ Combo
      try {
        const combos = window.EbookDB.getCombos();
        for (const c of combos) {
          await this.saveCombo(c);
        }
        results.combosCount = combos.length;
      } catch (e) {
        results.errors.push(`Combo: ${e.message}`);
      }

      // 4. Đồng bộ Cài đặt
      try {
        const settings = window.EbookDB.getSettings();
        await this.saveSettings(settings);
        results.settingsSaved = true;
      } catch (e) {
        results.errors.push(`Cài đặt: ${e.message}`);
      }

      return results;
    }

    /**
     * Kích hoạt lắng nghe Realtime thay đổi từ Supabase Cloud
     * Tự động cập nhật giao diện ngay lập tức khi Admin thêm/sửa/xóa sách hoặc đổi cài đặt
     */
    static initRealtimeListener(onUpdateCallback) {
      try {
        const client = this.getClient();
        if (!client) return;

        client
          .channel('public_ebookpe_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, async (payload) => {
            console.log('[Supabase Realtime] Sách đã thay đổi:', payload.eventType);
            await this.fetchBooks();
            if (typeof onUpdateCallback === 'function') onUpdateCallback('BOOKS', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'combos' }, async (payload) => {
            console.log('[Supabase Realtime] Combo đã thay đổi:', payload.eventType);
            await this.fetchCombos();
            if (typeof onUpdateCallback === 'function') onUpdateCallback('COMBOS', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, async (payload) => {
            console.log('[Supabase Realtime] Cài đặt đã thay đổi:', payload.eventType);
            await this.fetchSettings();
            if (typeof onUpdateCallback === 'function') onUpdateCallback('SETTINGS', payload);
          })
          .subscribe((status) => {
            console.log('[Supabase Realtime Status]:', status);
          });
      } catch (err) {
        console.warn('[Supabase Realtime Error]:', err.message);
      }
    }

    /**
     * Script SQL khởi tạo bảng
     */
    static getSQLSchema() {
      return `-- EbookPe Supabase Schema
-- Xem file supabase_schema.sql trong thư mục dự án để có toàn bộ script chi tiết`;
    }
  }

  window.EbookSupabase = EbookSupabase;
})(window);
