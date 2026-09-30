/**
 * EbookPe — Main Client Application Logic
 * Xử lý hiển thị danh mục, tìm kiếm, giỏ hàng, đọc thử và thanh toán VietQR tự động
 */

document.addEventListener('DOMContentLoaded', () => {
  // Trạng thái ứng dụng
  const state = {
    selectedCategory: 'all',
    searchQuery: '',
    sortBy: 'popular',
    currentBookDetail: null,
    currentCheckoutItems: [],
    discountCode: '',
    discountPercent: 0
  };

  // Cache DOM Elements
  const booksContainer = document.getElementById('books-grid');
  const catStrip = document.getElementById('cat-strip');
  const comboContainer = document.getElementById('combo-grid');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const sortSelect = document.getElementById('sort-select');
  const resultsCount = document.getElementById('results-count');
  const cartBadge = document.getElementById('cart-badge');
  const cartBtn = document.getElementById('cart-btn');

  // Modals
  const detailModal = document.getElementById('modal-book-detail');
  const cartModal = document.getElementById('modal-cart');
  const checkoutModal = document.getElementById('modal-checkout');
  const successModal = document.getElementById('modal-success');
  const libraryModal = document.getElementById('modal-my-library');

  // Khởi tạo
  initApp();

  function initApp() {
    renderCategories();
    renderCombos();
    renderBooks();
    updateCartBadge();
    bindEvents();
    initSettingsSync();
    initFaqAccordion();
    setupHeaderScroll();
    startLiveToastTicker();
  }

  // Lắng nghe thay đổi từ trang Admin (Real-time BroadcastChannel)
  function initSettingsSync() {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('ebookpe_sync_channel');
      channel.onmessage = (event) => {
        if (['BOOKS_UPDATED', 'SETTINGS_UPDATED', 'COMBOS_UPDATED', 'RESET_ALL', 'IMPORT_SUCCESS'].includes(event.data.type)) {
          renderCategories();
          renderCombos();
          renderBooks();
          // Đồng bộ âm thầm dữ liệu mới từ Admin mà không bắn toast gây phiền người dùng
        }
      };
    }
  }

  function setupHeaderScroll() {
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });
  }

  // ==========================================
  // RENDER CATEGORIES
  // ==========================================
  function renderCategories() {
    if (!catStrip) return;
    const books = EbookDB.getBooks().filter(b => b.status !== 'hidden' && b.status !== 'inactive');
    
    // Đếm số lượng sách theo từng danh mục
    const counts = { all: books.length };
    books.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });

    catStrip.innerHTML = DEFAULT_CATEGORIES.map(cat => {
      const count = counts[cat.id] || 0;
      const isActive = state.selectedCategory === cat.id ? 'active' : '';
      return `
        <button class="cat-btn ${isActive}" data-category="${cat.id}">
          <span>${cat.name}</span>
          <span style="font-size:0.75rem; opacity:0.75">(${count})</span>
        </button>
      `;
    }).join('');

    catStrip?.querySelectorAll?.('.cat-btn')?.forEach(btn => {
      btn.addEventListener('click', () => {
        catStrip?.querySelectorAll?.('.cat-btn')?.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedCategory = btn.dataset.category;
        renderBooks();
      });
    });
  }

  // Cho phép filter danh mục từ các link ngoài hoặc từ Hero showcase
  window.filterByCategory = function(catId) {
    state.selectedCategory = catId;
    const catStrip = document.getElementById('category-strip');
    if (catStrip) {
      catStrip.querySelectorAll('.cat-btn').forEach(b => {
        if (b.dataset.category === catId) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
    renderBooks();
    const ebooksSection = document.getElementById('ebooks');
    if (ebooksSection) {
      ebooksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ==========================================
  // RENDER COMBOS (#combo)
  // ==========================================
  function renderCombos() {
    if (!comboContainer) return;
    const allCombos = EbookDB.getCombos();
    const combos = allCombos.filter(c => !c.status || c.status === 'active');

    if (combos.length === 0) {
      comboContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 40px 20px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">⚡</div>
          <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 8px;">Chưa có gói Combo nào</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Các gói combo siêu tiết kiệm sẽ được cập nhật sớm nhất.</p>
        </div>
      `;
      return;
    }

    comboContainer.innerHTML = combos.map(combo => {
      const isVip = combo.id === 'combo-vip' || combo.popular;
      
      // Lấy danh sách tên sách thực tế từ bookIds hoặc bookNames
      let bookListNames = [];
      if (combo.bookIds && Array.isArray(combo.bookIds) && combo.bookIds.length > 0) {
        const booksInCombo = combo.bookIds.map(id => EbookDB.getBookById(id)).filter(Boolean);
        if (booksInCombo.length > 0) {
          bookListNames = booksInCombo.map(b => b.title);
        }
      }
      if (bookListNames.length === 0 && combo.bookNames && Array.isArray(combo.bookNames)) {
        bookListNames = combo.bookNames;
      }

      return `
        <div class="combo-card ${combo.popular ? 'popular' : ''}">
          <span class="combo-badge-top ${isVip ? 'vip' : ''}">${combo.tag || 'Ưu đãi'}</span>
          <h3 class="combo-title">${combo.title}</h3>
          <div class="combo-sub">${combo.subTitle || ''}</div>
          <p class="combo-desc">${combo.desc || ''}</p>
          
          <ul class="combo-books-list">
            ${bookListNames.map(name => `<li><span>${name}</span></li>`).join('')}
          </ul>

          <div class="combo-pricing">
            <span class="combo-price-now">${EbookDB.formatVND(combo.price)}</span>
            ${combo.originalPrice ? `<span class="combo-price-old">${EbookDB.formatVND(combo.originalPrice)}</span>` : ''}
            <br>
            ${combo.discountBadge ? `<span class="combo-savings-tag">${combo.discountBadge}</span>` : ''}
          </div>

          <button class="btn-combo-buy" data-combo-id="${combo.id}">
            ⚡ Mua combo nhận link ngay
          </button>
        </div>
      `;
    }).join('');

    comboContainer.querySelectorAll('.btn-combo-buy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const comboId = btn.dataset.comboId;
        const combo = EbookDB.getComboById(comboId);
        if (combo) {
          openCheckoutModal([{
            id: combo.id,
            title: combo.title,
            price: combo.price,
            qty: 1,
            isCombo: true
          }]);
        }
      });
    });
  }

  // ==========================================
  // RENDER BOOKS (#ebooks)
  // ==========================================
  function renderBooks() {
    if (!booksContainer) return;

    let books = EbookDB.getBooks().filter(b => b.status !== 'hidden' && b.status !== 'inactive');

    // Lọc theo Category
    if (state.selectedCategory !== 'all') {
      books = books.filter(b => b.category === state.selectedCategory);
    }

    // Lọc theo Search Query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      books = books.filter(b => 
        b.title.toLowerCase().includes(q) || 
        (b.subTitle && b.subTitle.toLowerCase().includes(q)) ||
        (b.shortDesc && b.shortDesc.toLowerCase().includes(q)) ||
        (b.categoryName && b.categoryName.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q))
      );
    }

    // Sắp xếp
    if (state.sortBy === 'popular') {
      books.sort((a, b) => {
        const aFeat = (a.isFeatured === true || (a.isFeatured !== false && (a.featured || (a.badge && (a.badge.includes('NỔI BẬT') || a.badge.includes('⭐')))))) ? (a.featuredAt || 1000) : 0;
        const bFeat = (b.isFeatured === true || (b.isFeatured !== false && (b.featured || (b.badge && (b.badge.includes('NỔI BẬT') || b.badge.includes('⭐')))))) ? (b.featuredAt || 1000) : 0;
        if (bFeat !== aFeat) return bFeat - aFeat;
        return (b.salesCount || 0) - (a.salesCount || 0);
      });
    } else if (state.sortBy === 'price-asc') {
      books.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-desc') {
      books.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === 'rating') {
      books.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    }

    // Cập nhật số lượng
    if (resultsCount) {
      resultsCount.textContent = `Hiển thị ${books.length} cuốn ebook phù hợp`;
    }

    if (books.length === 0) {
      booksContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3 style="font-size:1.2rem; margin-bottom:8px;">Không tìm thấy Ebook phù hợp</h3>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">
            Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục "Tất cả".
          </p>
          <button class="btn-primary" id="btn-reset-filter" style="margin: 0 auto;">
            Xem tất cả Ebook
          </button>
        </div>
      `;
      document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
        state.selectedCategory = 'all';
        state.searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        renderCategories();
        renderBooks();
      });
      return;
    }

    booksContainer.innerHTML = books.map(book => {
      // Cover layout: image hoặc gradient
      let coverHtml = '';
      if (book.coverImage && book.coverImage.trim() !== '') {
        coverHtml = `
          <img src="${book.coverImage}" alt="${book.title}" class="product-cover-img" loading="lazy">
          <div class="cover-content">
            <div class="cover-sub">${book.subTitle || book.categoryName}</div>
            <div class="cover-title">${book.title}</div>
          </div>
        `;
      } else {
        const coverCls = book.coverStyle || 'cover-1';
        coverHtml = `
          <div class="cover-content">
            <div class="cover-sub">${book.subTitle || book.categoryName}</div>
            <div class="cover-title">${book.title}</div>
          </div>
        `;
      }

      // Badge flag
      let badgeHtml = '';
      if (book.badge && book.badge.trim() !== '') {
        const badgeLower = book.badge.toLowerCase();
        let cls = '';
        if (badgeLower.includes('best')) cls = 'bestseller';
        else if (badgeLower.includes('hot')) cls = 'hot';
        else if (badgeLower.includes('mới')) cls = 'moi';
        badgeHtml = `<span class="badge-flag ${cls}">${book.badge}</span>`;
      }

      return `
        <div class="product-card" data-book-id="${book.id}">
          <div class="product-cover ${book.coverStyle || 'cover-1'}" onclick="window.viewBookDetail('${book.id}')">
            ${badgeHtml}
            ${coverHtml}
          </div>
          <div class="product-body">
            <span class="product-cat-tag">${book.categoryName || 'Ebook'}</span>
            <div class="product-title" onclick="window.viewBookDetail('${book.id}')">${book.title}</div>
            <p class="product-desc">${book.shortDesc || ''}</p>
            
            <div class="product-meta">
              <span class="rating-stars">★★★★★</span>
              <span><strong>${book.rating || 5.0}</strong> (${book.reviewsCount || 40})</span>
              <span>·</span>
              <span>${book.salesCount ? (book.salesCount >= 1000 ? (book.salesCount/1000).toFixed(1) + 'k' : book.salesCount) : '1.2k'} lượt mua</span>
            </div>

            <div class="product-footer">
              <div class="price-box">
                <span class="product-price">${EbookDB.formatVND(book.price)}</span>
                ${book.originalPrice ? `<span class="product-price-old">${EbookDB.formatVND(book.originalPrice)}</span>` : ''}
              </div>
              <div class="btn-card-actions">
                <button class="btn-view-quick" title="Xem chi tiết & Đọc thử" onclick="window.viewBookDetail('${book.id}')">
                  👁️ Xem
                </button>
                <button class="btn-buy" onclick="window.quickBuy('${book.id}')">
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  function bindEvents() {
    // Search input
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.searchQuery = e.target.value;
          if (clearSearchBtn) {
            clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
          }
          renderBooks();
        }, 250);
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderBooks();
      });
    }

    // Sắp xếp
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderBooks();
      });
    }

    // Mở giỏ hàng
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        openCartModal();
      });
    }

    // Nút đóng tất cả modal khi click overlay hoặc nút X
    document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeAllModals();
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });

    // Tra cứu thư viện đơn hàng
    document.getElementById('nav-library-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      openLibraryModal();
    });
    document.getElementById('footer-library-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      openLibraryModal();
    });

    // Form tra cứu đơn hàng
    document.getElementById('library-search-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLibrarySearch();
    });

    // Form thanh toán Checkout
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCheckoutSubmit();
    });

    // Copy STK & Nội dung
    document.getElementById('btn-copy-stk')?.addEventListener('click', () => {
      const text = document.getElementById('qr-account-num')?.textContent.trim();
      if (text) copyToClipboard(text, 'Đã sao chép Số tài khoản!');
    });

    document.getElementById('btn-copy-memo')?.addEventListener('click', () => {
      const text = document.getElementById('qr-memo')?.textContent.trim();
      if (text) copyToClipboard(text, 'Đã sao chép Nội dung chuyển khoản!');
    });

    // Tab switcher trong Modal chi tiết sách
    document.querySelectorAll('.modal-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tabTarget = tabBtn.dataset.tab;
        document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        tabBtn.classList.add('active');
        document.getElementById(`tab-${tabTarget}`)?.classList.add('active');
      });
    });

    // Áp dụng mã giảm giá
    document.getElementById('btn-apply-coupon')?.addEventListener('click', () => {
      applyCoupon();
    });

    // Lối vào quản trị bí mật cho chủ shop (không hiển thị cho khách)
    // 1. Phím tắt Ctrl + Shift + L (hoặc Ctrl + Shift + A)
    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'L' || e.key === 'l' || e.code === 'KeyL' || e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
        e.preventDefault();
        window.location.href = 'admin.html';
      }
    });

    // 2. Nhấp đúp vào dòng bản quyền chân trang
    document.getElementById('footer-copyright')?.addEventListener('dblclick', () => {
      window.location.href = 'admin.html';
    });
  }

  // ==========================================
  // BOOK DETAIL & SAMPLE READER MODAL
  // ==========================================
  window.viewBookDetail = function(bookId) {
    const book = EbookDB.getBookById(bookId);
    if (!book) return;

    state.currentBookDetail = book;

    const modalTitle = document.getElementById('detail-modal-title');
    const coverBox = document.getElementById('detail-cover-box');
    const pillsWrap = document.getElementById('detail-pills');
    const bookTitle = document.getElementById('detail-title');
    const bookAuthor = document.getElementById('detail-author');
    const bookPrice = document.getElementById('detail-price');
    const bookPriceOld = document.getElementById('detail-price-old');
    const specPages = document.getElementById('detail-pages');
    const specFormat = document.getElementById('detail-format');
    const specSales = document.getElementById('detail-sales');
    const fullDesc = document.getElementById('detail-full-desc');
    const tocList = document.getElementById('detail-toc-list');
    const sampleReader = document.getElementById('detail-sample-reader');

    if (modalTitle) modalTitle.textContent = book.title;
    if (bookTitle) bookTitle.textContent = book.title;
    if (bookAuthor) bookAuthor.textContent = `Tác giả / Biên soạn: ${book.author || 'EbookPe'}`;
    if (bookPrice) bookPrice.textContent = EbookDB.formatVND(book.price);
    if (bookPriceOld) bookPriceOld.textContent = book.originalPrice ? EbookDB.formatVND(book.originalPrice) : '';

    if (specPages) specPages.textContent = `${book.pages || 180} trang`;
    if (specFormat) specFormat.textContent = book.format || 'PDF';
    if (specSales) specSales.textContent = `${book.salesCount || 1000}+ tải`;

    // Pills
    if (pillsWrap) {
      pillsWrap.innerHTML = `
        <span class="detail-pill">${book.categoryName || 'Ebook'}</span>
        ${book.badge ? `<span class="detail-pill" style="background:#FEE2E2; color:#DC2626;">${book.badge}</span>` : ''}
        <span class="detail-pill">★ ${book.rating || 5.0} (${book.reviewsCount || 40})</span>
      `;
    }

    // Cover
    if (coverBox) {
      if (book.coverImage && book.coverImage.trim() !== '') {
        coverBox.className = 'detail-cover-box';
        coverBox.style.background = `url(${book.coverImage}) center/cover no-repeat`;
        coverBox.innerHTML = '';
      } else {
        coverBox.className = `detail-cover-box ${book.coverStyle || 'cover-1'}`;
        coverBox.style.background = '';
        coverBox.innerHTML = `
          <div style="position:relative; z-index:2; color:#fff;">
            <div style="font-size:0.75rem; text-transform:uppercase; opacity:0.8;">${book.subTitle || ''}</div>
            <div style="font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700;">${book.title}</div>
          </div>
        `;
      }
    }

    // Tabs content
    if (fullDesc) {
      fullDesc.innerHTML = `<p style="white-space: pre-line; line-height: 1.8;">${book.fullDesc || book.shortDesc}</p>`;
    }

    if (tocList) {
      if (book.toc && book.toc.length) {
        tocList.innerHTML = book.toc.map(item => `
          <li style="padding: 10px 0; border-bottom: 1px solid var(--border-light); font-size:0.9rem;">
            📌 <strong>${item}</strong>
          </li>
        `).join('');
      } else {
        tocList.innerHTML = `
          <li style="padding: 10px 0;">Chương 1: Khởi động & Nền tảng tư duy</li>
          <li style="padding: 10px 0;">Chương 2: Framework thực chiến từng bước</li>
          <li style="padding: 10px 0;">Chương 3: Case study người thật việc thật</li>
          <li style="padding: 10px 0;">Chương 4: Kế hoạch hành động 30 ngày</li>
        `;
      }
    }

    if (sampleReader) {
      sampleReader.innerHTML = `
        <span class="reader-badge-demo">Trích đoạn đọc thử</span>
        <h4 style="font-family:'Playfair Display',serif; font-size:1.2rem; margin-bottom:12px; color:var(--accent);">
          ${book.title}
        </h4>
        <div style="white-space: pre-line; font-size: 0.96rem; line-height: 1.9;">
          ${book.sampleExcerpt || 'Trích đoạn đang được cập nhật. Bạn có thể mua để nhận toàn bộ nội dung PDF ngay lập tức.'}
        </div>
      `;
    }

    // Reset về tab 1
    document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelector('.modal-tab-btn[data-tab="desc"]')?.classList.add('active');
    document.getElementById('tab-desc')?.classList.add('active');

    // Nút Mua ngay & Thêm vào giỏ trong detail modal
    const btnBuyNow = document.getElementById('btn-detail-buynow');
    const btnAddToCart = document.getElementById('btn-detail-addcart');

    if (btnBuyNow) {
      btnBuyNow.onclick = () => {
        closeAllModals();
        openCheckoutModal([{
          id: book.id,
          title: book.title,
          price: book.price,
          qty: 1
        }]);
      };
    }

    if (btnAddToCart) {
      btnAddToCart.onclick = () => {
        EbookDB.addToCart({
          id: book.id,
          title: book.title,
          price: book.price
        });
        updateCartBadge();
        showToast(`Đã thêm "${book.title}" vào giỏ hàng!`, 'success');
      };
    }

    detailModal?.classList.add('active');
  };

  // Mua nhanh từ Card
  window.quickBuy = function(bookId) {
    const book = EbookDB.getBookById(bookId);
    if (!book) return;
    openCheckoutModal([{
      id: book.id,
      title: book.title,
      price: book.price,
      qty: 1
    }]);
  };

  // ==========================================
  // CART MANAGEMENT
  // ==========================================
  function updateCartBadge() {
    const cart = EbookDB.getCart();
    const totalCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    if (cartBadge) {
      cartBadge.textContent = totalCount;
      cartBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }
  }

  function openCartModal() {
    const cart = EbookDB.getCart();
    const cartList = document.getElementById('cart-items-list');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    const cartDiscountRow = document.getElementById('cart-discount-row');
    const cartDiscountAmount = document.getElementById('cart-discount-amount');

    if (!cartList) return;

    if (cart.length === 0) {
      cartList.innerHTML = `
        <div style="text-align:center; padding: 40px 10px;">
          <div style="font-size:3rem; margin-bottom:12px;">🛒</div>
          <h4 style="margin-bottom:6px;">Giỏ hàng của bạn đang trống</h4>
          <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;">
            Hãy chọn những cuốn ebook tâm đắc để bắt đầu nâng cấp kiến thức.
          </p>
          <a href="#ebooks" class="btn-primary" onclick="window.closeAllModals()">Khám phá Ebook ngay</a>
        </div>
      `;
      if (cartSubtotal) cartSubtotal.textContent = '0đ';
      if (cartTotal) cartTotal.textContent = '0đ';
      document.getElementById('btn-cart-checkout').style.display = 'none';
    } else {
      let subtotal = 0;
      cartList.innerHTML = cart.map(item => {
        const itemTotal = item.price * (item.qty || 1);
        subtotal += itemTotal;
        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <span style="font-size:1.4rem;">📘</span>
              <div>
                <div class="cart-item-title">${item.title}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${item.qty || 1} x ${EbookDB.formatVND(item.price)}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="cart-item-price">${EbookDB.formatVND(itemTotal)}</span>
              <button class="btn-remove-item" onclick="window.removeItemFromCart('${item.id}')" title="Xóa">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join('');

      let discount = 0;
      if (state.discountPercent > 0) {
        discount = Math.round(subtotal * (state.discountPercent / 100));
        if (cartDiscountRow) cartDiscountRow.style.display = 'flex';
        if (cartDiscountAmount) cartDiscountAmount.textContent = `-${EbookDB.formatVND(discount)}`;
      } else {
        if (cartDiscountRow) cartDiscountRow.style.display = 'none';
      }

      const total = Math.max(0, subtotal - discount);
      if (cartSubtotal) cartSubtotal.textContent = EbookDB.formatVND(subtotal);
      if (cartTotal) cartTotal.textContent = EbookDB.formatVND(total);

      const btnCheckout = document.getElementById('btn-cart-checkout');
      if (btnCheckout) {
        btnCheckout.style.display = 'flex';
        btnCheckout.onclick = () => {
          closeAllModals();
          openCheckoutModal(cart, total);
        };
      }
    }

    cartModal?.classList.add('active');
  }

  window.removeItemFromCart = function(id) {
    EbookDB.removeFromCart(id);
    updateCartBadge();
    openCartModal(); // re-render
  };

  function applyCoupon() {
    const input = document.getElementById('coupon-input');
    const msg = document.getElementById('coupon-message');
    if (!input || !msg) return;

    const code = input.value.trim().toUpperCase();
    if (code === 'EBOOKPE10') {
      state.discountPercent = 10;
      state.discountCode = code;
      msg.textContent = 'Áp dụng mã thành công: Giảm 10%!';
      msg.style.color = 'var(--accent)';
      openCartModal();
    } else if (code === 'VIP20' || code === 'WELCOME20') {
      state.discountPercent = 20;
      state.discountCode = code;
      msg.textContent = 'Áp dụng mã thành công: Giảm 20%!';
      msg.style.color = 'var(--accent)';
      openCartModal();
    } else {
      msg.textContent = 'Mã giảm giá không hợp lệ hoặc đã hết hạn!';
      msg.style.color = 'var(--crimson)';
    }
  }

  // ==========================================
  // CHECKOUT & VIETQR AUTOMATION
  // ==========================================
  function openCheckoutModal(items, customTotal = null) {
    state.currentCheckoutItems = items;
    const settings = EbookDB.getSettings();

    // Tính tổng tiền
    let total = 0;
    if (customTotal !== null) {
      total = customTotal;
    } else {
      total = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
      if (state.discountPercent > 0) {
        total = Math.round(total * (1 - state.discountPercent / 100));
      }
    }

    // Sinh mã đơn hàng tạm
    const tempOrderId = `${settings.transferPrefix}${Math.floor(100000 + Math.random() * 900000)}`;
    state.currentTempOrderId = tempOrderId;
    state.currentTotalAmount = total;

    // Render danh sách tóm tắt
    const summaryItems = document.getElementById('checkout-summary-items');
    const summaryTotal = document.getElementById('checkout-summary-total');

    if (summaryItems) {
      summaryItems.innerHTML = items.map(item => `
        <div class="summary-row">
          <span>${item.title} ${item.qty > 1 ? `x${item.qty}` : ''}</span>
          <span><strong>${EbookDB.formatVND(item.price * (item.qty || 1))}</strong></span>
        </div>
      `).join('');
    }

    if (summaryTotal) {
      summaryTotal.textContent = EbookDB.formatVND(total);
    }

    // Cập nhật thông tin VietQR
    const bankCode = settings.bankCode || 'MB';
    const accNum = settings.accountNumber || '2456987654';
    const accName = settings.accountName || 'PHAN QUOC LOC';

    document.getElementById('qr-bank-name').textContent = settings.bankName || 'MBBank';
    document.getElementById('qr-account-num').textContent = accNum;
    document.getElementById('qr-account-name').textContent = accName;
    document.getElementById('qr-amount').textContent = EbookDB.formatVND(total);
    document.getElementById('qr-memo').textContent = tempOrderId;

    // Sinh URL ảnh VietQR chuẩn
    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accNum}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(tempOrderId)}&accountName=${encodeURIComponent(accName)}`;
    const qrImg = document.getElementById('vietqr-image');
    if (qrImg) {
      qrImg.src = qrUrl;
    }

    checkoutModal?.classList.add('active');

    // Bắt đầu tự động kiểm tra tài khoản MBBank qua SePay (nếu có Token)
    startSePayPolling(tempOrderId, total);
  }

  // Quản lý kiểm tra tiền vào ngân hàng tự động (SePay.vn)
  let sepayPollTimer = null;

  async function fetchSepayTransactionsList(apiKey, limit = 20) {
    // 1. Thử gọi qua proxy nội bộ
    try {
      const proxyRes = await fetch(`/api/sepay-proxy?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch (e) {}

    // 2. Thử gọi trực tiếp SePay API
    const directRes = await fetch(`https://my.sepay.vn/userapi/transactions/list?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (!directRes.ok) {
      throw new Error(`Mã phản hồi từ SePay: ${directRes.status}`);
    }
    return await directRes.json();
  }

  function startSePayPolling(orderId, expectedAmount) {
    stopSePayPolling();
    const settings = EbookDB.getSettings();
    const statusDiv = document.getElementById('qr-auto-detect-status');

    if (!settings.sepayApiKey) {
      if (statusDiv) {
        statusDiv.innerHTML = '<span style="color:var(--text-muted);">⚡ Quét mã QR bằng App ngân hàng để chuyển khoản</span>';
      }
      return;
    }

    if (statusDiv) {
      statusDiv.innerHTML = '<span style="color:#2563EB;">🟢 <strong>Auto-Banking:</strong> Đang chờ nhận diện chuyển khoản từ MBBank...</span>';
    }

    // Polling kiểm tra danh sách giao dịch SePay mỗi 3 giây
    sepayPollTimer = setInterval(async () => {
      try {
        const resData = await fetchSepayTransactionsList(settings.sepayApiKey, 20);
        if (resData && resData.transactions && Array.isArray(resData.transactions)) {
          const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const matched = resData.transactions.find(tx => {
            const content = (tx.transaction_content || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const code = (tx.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const amountIn = parseFloat(tx.amount_in || 0);
            return (content.includes(cleanOrderId) || code.includes(cleanOrderId)) && amountIn >= expectedAmount;
          });

          if (matched) {
            stopSePayPolling();
            if (statusDiv) {
              statusDiv.innerHTML = '✅ <strong>Đã nhận được tiền vào MBBank!</strong> Đang mở link tải sách...';
            }
            showToast('✅ MBBank nhận được tiền thành công! Đang chuyển hướng...', 'success');
            setTimeout(() => {
              handleCheckoutSubmit(true);
            }, 800);
          }
        }
      } catch (err) {
        // Tiếp tục kiểm tra
      }
    }, 3000);
  }

  function stopSePayPolling() {
    if (sepayPollTimer) {
      clearInterval(sepayPollTimer);
      sepayPollTimer = null;
    }
  }

  // Quản lý chống gửi trùng lặp Email
  const sentEmailOrderIds = new Set();
  let isProcessingCheckout = false;

  // Tự động gửi Email vào Gmail của khách hàng qua EmailJS
  async function sendAutoEmailToCustomer(order) {
    if (!order || !order.orderId) return false;

    // Chống gửi trùng lặp email cho cùng một mã đơn
    if (sentEmailOrderIds.has(order.orderId) || order.emailSent) {
      console.log('Email đã được gửi cho đơn hàng này, bỏ qua:', order.orderId);
      return false;
    }
    sentEmailOrderIds.add(order.orderId);

    const settings = EbookDB.getSettings();
    if (!settings.autoEmailEnabled || !settings.emailjsServiceId || !settings.emailjsTemplateId || !settings.emailjsPublicKey) {
      return false;
    }

    try {
      if (typeof emailjs !== 'undefined') {
        emailjs.init(settings.emailjsPublicKey);
        
        const bookTitlesList = [];
        const downloadLines = [];
        const htmlLinks = [];
        let primaryFirstUrl = '';

        (order.items || []).forEach(i => {
          if (i.isCombo) {
            const combo = EbookDB.getComboById(i.id);
            if (combo) {
              bookTitlesList.push(`[Combo] ${combo.title}`);

              let booksInCombo = [];
              if (combo.bookIds && Array.isArray(combo.bookIds)) {
                booksInCombo = combo.bookIds.map(bId => EbookDB.getBookById(bId)).filter(Boolean);
              }
              if (booksInCombo.length === 0) {
                booksInCombo = EbookDB.getBooks().slice(0, 3);
              }

              const DEFAULT_DRIVE_URL = 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing';

              booksInCombo.forEach(b => {
                let bUrl = (b.downloadUrl || '').trim();
                if (bUrl.startsWith('drive.google.com')) bUrl = 'https://' + bUrl;
                if (!bUrl || bUrl === '#' || bUrl === 'https://drive.google.com') bUrl = DEFAULT_DRIVE_URL;
                if (!primaryFirstUrl) primaryFirstUrl = bUrl;

                downloadLines.push(`📄 ${b.title}:\n👉 Link tải PDF: ${bUrl}`);
                htmlLinks.push(`<div><b>📖 ${b.title}:</b><br><a href="${bUrl}" target="_blank" style="display:inline-block;padding:8px 16px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:6px;margin:4px 0;font-weight:bold;">⬇️ Tải Ebook PDF</a><br><small style="color:#64748b;">Link: ${bUrl}</small></div>`);
              });
            }
          } else {
            const book = EbookDB.getBookById(i.id);
            const title = i.title || book?.title || 'Ebook';
            let dlUrl = (book?.downloadUrl || i.downloadUrl || '').trim();
            if (dlUrl.startsWith('drive.google.com')) dlUrl = 'https://' + dlUrl;

            bookTitlesList.push(title);

            if (dlUrl && dlUrl !== '#') {
              if (!primaryFirstUrl) primaryFirstUrl = dlUrl;
              downloadLines.push(`📄 ${title}:\n👉 Link Google Drive tải sách: ${dlUrl}`);
              htmlLinks.push(`<div><b>📄 ${title}:</b><br><a href="${dlUrl}" target="_blank" style="display:inline-block;padding:8px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin:6px 0;font-weight:bold;">⬇️ Tải Ebook PDF (Google Drive)</a><br><small style="color:#64748b;">Hoặc copy link: ${dlUrl}</small></div>`);
            } else {
              downloadLines.push(`📄 ${title}: (Đã kích hoạt trên hệ thống EbookPe)`);
              htmlLinks.push(`<div><b>📄 ${title}</b>: Đã kích hoạt bản quyền trên hệ thống EbookPe.vn</div>`);
            }
          }
        });

        const bookTitlesStr = bookTitlesList.join(', ');
        const downloadLinksStr = downloadLines.join('\n\n');
        const htmlDownloadStr = htmlLinks.join('<br>');
        const finalPrimaryUrl = primaryFirstUrl || 'https://drive.google.com/file/d/1vf8ANZPxHaDJJ00r3KH29Y6M4f1R4JIK/view?usp=sharing';

        await emailjs.send(settings.emailjsServiceId, settings.emailjsTemplateId, {
          to_name: order.customerName || 'Khách hàng',
          user_name: order.customerName || 'Khách hàng',
          name: order.customerName || 'Khách hàng',
          customer_name: order.customerName || 'Khách hàng',
          to_email: order.customerEmail,
          user_email: order.customerEmail,
          email: order.customerEmail,
          customer_email: order.customerEmail,
          recipient: order.customerEmail,
          recipient_email: order.customerEmail,
          reply_to: order.customerEmail,
          order_id: order.orderId,
          total_amount: EbookDB.formatVND(order.totalAmount),
          book_titles: bookTitlesStr,
          download_links: downloadLinksStr,
          download_link: finalPrimaryUrl,
          download_url: finalPrimaryUrl,
          link: finalPrimaryUrl,
          google_drive_link: finalPrimaryUrl,
          html_download_links: htmlDownloadStr,
          message: downloadLinksStr,
          support_hotline: settings.hotline || '0333.399.956'
        });

        // Đánh dấu đơn hàng đã gửi email thành công
        order.emailSent = true;
        try {
          const orders = EbookDB.getOrders();
          const target = orders.find(o => o.orderId === order.orderId);
          if (target) {
            target.emailSent = true;
            localStorage.setItem('ebookpe_orders_v2', JSON.stringify(orders));
          }
        } catch (e) {}

        showToast(`Đã tự động gửi email chứa link Ebook tới ${order.customerEmail}!`, 'success');
        return true;
      }
    } catch (e) {
      console.warn('Gửi email tự động không thành công:', e);
      return false;
    }
  }

  async function handleCheckoutSubmit(isAutoTriggered = false) {
    if (isProcessingCheckout) {
      return;
    }
    isProcessingCheckout = true;

    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    const phoneInput = document.getElementById('checkout-phone');
    const submitBtn = document.querySelector('#checkout-form button[type="submit"]');

    let customerName = nameInput?.value.trim();
    let customerEmail = emailInput?.value.trim();
    const customerPhone = phoneInput?.value.trim();

    if (!customerName || !customerEmail) {
      if (isAutoTriggered) {
        customerName = customerName || 'Khách hàng EbookPe';
        customerEmail = customerEmail || 'khachhang@ebookpe.vn';
      } else {
        showToast('Vui lòng nhập Họ tên và Email nhận sách!', 'error');
        isProcessingCheckout = false;
        return;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      showToast('Địa chỉ email không hợp lệ, vui lòng kiểm tra lại!', 'error');
      isProcessingCheckout = false;
      return;
    }

    const settings = EbookDB.getSettings();
    const orderId = state.currentTempOrderId;
    const expectedAmount = state.currentTotalAmount;

    // BẮT BUỘC: CHỐNG GIAN LẬN THANH TOÁN
    // 1. Nếu chưa cấu hình SePay API Token trong Admin -> Báo lỗi
    if (!isAutoTriggered && !settings.sepayApiKey) {
      showToast(`⚠️ Chưa cấu hình SePay API Token trong Admin. Vui lòng vào trang Quản trị -> Cài đặt VietQR -> Dán SePay Token để hệ thống tự động nhận diện tiền MBBank!`, 'error');
      isProcessingCheckout = false;
      return;
    }

    // 2. Nếu đã có SePay API Token và khách bấm tay: Bắt buộc đối soát thực tế với MBBank
    if (!isAutoTriggered && settings.sepayApiKey) {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Đang kiểm tra tiền vào MBBank...';
      }

      try {
        const resData = await fetchSepayTransactionsList(settings.sepayApiKey, 30);
        let isPaymentReceived = false;

        if (resData && resData.transactions && Array.isArray(resData.transactions)) {
          const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const matched = resData.transactions.find(tx => {
            const content = (tx.transaction_content || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const code = (tx.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const amountIn = parseFloat(tx.amount_in || 0);
            return (content.includes(cleanOrderId) || code.includes(cleanOrderId)) && amountIn >= expectedAmount;
          });

          if (matched) {
            isPaymentReceived = true;
          }
        }

        if (!isPaymentReceived) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🔄 Tôi đã quét mã — Kiểm tra thanh toán ngay';
          }
          showToast(`⚠️ Hệ thống chưa nhận được tiền cho mã đơn "${orderId}" trong tài khoản MBBank. Vui lòng quét mã QR chuyển khoản và đợi 3-10 giây để ngân hàng xử lý!`, 'error');
          isProcessingCheckout = false;
          return;
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '🔄 Tôi đã quét mã — Kiểm tra thanh toán ngay';
        }
        showToast(`⚠️ Lỗi đối soát SePay (${err.message}). Vui lòng kiểm tra lại Token SePay trong Cài Đặt Admin!`, 'error');
        isProcessingCheckout = false;
        return;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🔄 Tôi đã quét mã — Kiểm tra thanh toán ngay';
    }

    // Dừng polling SePay nếu đang chạy
    stopSePayPolling();

    // Tạo đơn hàng trong DB
    const order = EbookDB.createOrder({
      orderId: state.currentTempOrderId,
      customerName,
      customerEmail,
      customerPhone,
      items: state.currentCheckoutItems,
      totalAmount: state.currentTotalAmount,
      paymentMethod: isAutoTriggered ? 'VietQR (SePay Tự Động)' : 'VietQR Chuyển Khoản'
    });

    // Nếu mua từ giỏ hàng, xóa giỏ hàng
    EbookDB.clearCart();
    updateCartBadge();

    // Tự động gửi Email vào Gmail khách hàng (đã có cơ chế deduplication)
    sendAutoEmailToCustomer(order);

    // Đóng checkout modal và mở Success modal
    closeAllModals();
    openSuccessModal(order);

    setTimeout(() => {
      isProcessingCheckout = false;
    }, 1500);
  }

  // ==========================================
  // PAYMENT SUCCESS & DIRECT DOWNLOAD MODAL
  // ==========================================
  function openSuccessModal(order) {
    const orderIdSpan = document.getElementById('success-order-id');
    const emailSpan = document.getElementById('success-email');
    const downloadList = document.getElementById('success-download-list');

    if (orderIdSpan) orderIdSpan.textContent = order.orderId;
    if (emailSpan) emailSpan.textContent = order.customerEmail;

    if (downloadList) {
      downloadList.innerHTML = (order.items || []).map(item => {
        if (item.isCombo) {
          const combo = EbookDB.getComboById(item.id);
          if (combo) {
            let booksInCombo = [];
            if (combo.bookIds && Array.isArray(combo.bookIds)) {
              booksInCombo = combo.bookIds.map(bId => EbookDB.getBookById(bId)).filter(Boolean);
            }
            
            let comboDl = (combo.downloadUrl || '').trim();
            if (comboDl.startsWith('drive.google.com')) comboDl = 'https://' + comboDl;

            return `
              <div style="padding:14px; background:#f0fdf4; border-radius:10px; border:1.5px solid #86efac; margin-bottom:14px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; border-bottom:1px dashed #bbf7d0; padding-bottom:8px;">
                  <span style="font-size:1.4rem;">📦</span>
                  <div>
                    <strong style="font-size:0.95rem; color:#166534;">${combo.title}</strong>
                    <div style="font-size:0.75rem; color:#15803d;">Gói gồm ${booksInCombo.length} cuốn Ebook bản quyền (tải riêng từng cuốn bên dưới):</div>
                  </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${booksInCombo.map(b => {
                    let bDl = (b.downloadUrl || '').trim();
                    if (bDl.startsWith('drive.google.com')) bDl = 'https://' + bDl;
                    return `
                      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#fff; border-radius:6px; border:1px solid #e2e8f0; flex-wrap:wrap; gap:6px;">
                        <div style="flex:1; min-width:200px;">
                          <span style="font-size:0.85rem; font-weight:600; color:#334155;">📖 ${b.title}</span>
                          ${bDl && bDl !== '#' ? `
                            <div style="font-size:0.75rem; margin-top:2px;">
                              <a href="${bDl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; word-break:break-all;">🔗 ${bDl}</a>
                            </div>
                          ` : ''}
                        </div>
                        <button class="btn-primary" style="padding:6px 14px; font-size:0.78rem;" onclick="window.downloadBookFile('${b.title}', '${bDl || '#'}')">
                          ⬇️ Tải PDF ngay
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }
        }

        // Single book
        const book = EbookDB.getBookById(item.id);
        const title = item.title || book?.title || 'Ebook';
        let downloadUrl = (book?.downloadUrl || item.downloadUrl || '').trim();
        if (downloadUrl.startsWith('drive.google.com')) downloadUrl = 'https://' + downloadUrl;

        return `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:14px; background:#fff; border-radius:10px; border:1.5px solid var(--border); margin-bottom:10px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:flex-start; gap:12px; flex:1; min-width:220px;">
              <span style="font-size:1.6rem; line-height:1;">📄</span>
              <div style="flex:1;">
                <strong style="font-size:0.92rem; color:var(--text-main); display:block; margin-bottom:2px;">${title}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Định dạng: PDF bản quyền EbookPe</div>
                ${downloadUrl && downloadUrl !== '#' ? `
                  <div style="font-size:0.78rem;">
                    👉 <b>Link Google Drive:</b> <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); font-weight:600; text-decoration:underline; word-break:break-all;">${downloadUrl}</a>
                  </div>
                ` : ''}
              </div>
            </div>
            <button class="btn-primary" style="padding:9px 18px; font-size:0.84rem; white-space:nowrap;" onclick="window.downloadBookFile('${title}', '${downloadUrl || '#'}')">
              ⬇️ Tải PDF ngay
            </button>
          </div>
        `;
      }).join('');
    }

    successModal?.classList.add('active');
  }

  // Mở link Google Drive hoặc tải file PDF thực tế
  window.downloadBookFile = function(title, rawUrl) {
    let url = (rawUrl || '').trim();
    if (url.startsWith('drive.google.com')) {
      url = 'https://' + url;
    }

    // 1. Nếu có link tải thực tế (Google Drive, Dropbox, HTTP/HTTPS)
    if (url && url !== '#' && (url.startsWith('http://') || url.startsWith('https://'))) {
      showToast(`Đang mở link Google Drive tải Ebook "${title}"...`, 'success');
      
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    // 2. Fallback: Nếu admin chưa điền link tải Google Drive, tải PDF mẫu
    showToast(`Đang chuẩn bị file "${title}" tải về máy...`, 'info');
    setTimeout(() => {
      const blob = new Blob([
        `%PDF-1.4\n%EbookPe - Nền tảng Ebook Thực Chiến\n\nTiêu đề: ${title}\nBản quyền thuộc về EbookPe.vn\nCảm ơn bạn đã mua sách tại EbookPe!\nChúc bạn ứng dụng thành công và đạt được kết quả đột phá.`
      ], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title.replace(/[^a-zA-Z0-9\s]/g, '').trim()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Đã tải xuống thành công cuốn "${title}"!`, 'success');
    }, 600);
  };

  // ==========================================
  // TRA CỨU ĐƠN HÀNG / THƯ VIỆN ĐÃ MUA
  // ==========================================
  function openLibraryModal() {
    libraryModal?.classList.add('active');
  }

  function handleLibrarySearch() {
    const input = document.getElementById('library-search-email');
    const resultBox = document.getElementById('library-results');
    if (!input || !resultBox) return;

    const email = input.value.trim().toLowerCase();
    if (!email) {
      showToast('Vui lòng nhập email bạn đã dùng khi mua sách!', 'error');
      return;
    }

    const allOrders = EbookDB.getOrders();
    const userOrders = allOrders.filter(o => o.customerEmail && o.customerEmail.toLowerCase() === email);

    if (userOrders.length === 0) {
      resultBox.innerHTML = `
        <div style="text-align:center; padding: 30px; background:var(--bg); border-radius:10px;">
          <div style="font-size:2.5rem; margin-bottom:10px;">🔍</div>
          <p style="font-weight:600; margin-bottom:4px;">Chưa tìm thấy đơn hàng nào với email "${email}"</p>
          <p style="font-size:0.8rem; color:var(--text-muted);">
            Vui lòng kiểm tra lại chính xác địa chỉ email hoặc liên hệ hotline Zalo để được hỗ trợ cấp lại ngay.
          </p>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <h4 style="margin-bottom:14px; font-size:1rem; color:var(--accent);">
          📚 Tìm thấy ${userOrders.length} đơn hàng của bạn:
        </h4>
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${userOrders.map(order => `
            <div style="background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.82rem;">
                <span style="font-weight:700; color:var(--accent);">Đơn #${order.orderId}</span>
                <span style="color:var(--text-muted);">${order.orderDate}</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${(order.items || []).map(item => {
                  let dlUrl = item.downloadUrl || '';
                  if (!dlUrl) {
                    if (item.isCombo) {
                      const c = EbookDB.getComboById(item.id);
                      dlUrl = c?.downloadUrl || '';
                    } else {
                      const b = EbookDB.getBookById(item.id);
                      dlUrl = b?.downloadUrl || '';
                    }
                  }
                  if (dlUrl.startsWith('drive.google.com')) dlUrl = 'https://' + dlUrl;

                  return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px 14px; border-radius:8px; border:1px solid var(--border-light); flex-wrap:wrap; gap:8px;">
                      <div style="flex:1; min-width:180px;">
                        <span style="font-size:0.88rem; font-weight:600;">📘 ${item.title}</span>
                        ${dlUrl && dlUrl !== '#' ? `
                          <div style="font-size:0.75rem; margin-top:2px;">
                            <a href="${dlUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); text-decoration:underline; word-break:break-all;">🔗 ${dlUrl}</a>
                          </div>
                        ` : ''}
                      </div>
                      <button class="btn-primary" style="padding:6px 14px; font-size:0.78rem;" onclick="window.downloadBookFile('${item.title}', '${dlUrl || '#'}')">
                        ⬇️ Tải lại
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  // ==========================================
  // TIỆN ÍCH CHUNG
  // ==========================================
  window.closeAllModals = function() {
    stopSePayPolling();
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
  };

  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg, 'success');
      }).catch(() => {
        fallbackCopyTextToClipboard(text, successMsg);
      });
    } else {
      fallbackCopyTextToClipboard(text, successMsg);
    }
  }

  function fallbackCopyTextToClipboard(text, successMsg) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(successMsg, 'success');
    } catch (err) {
      showToast('Không thể tự động sao chép, vui lòng copy thủ công!', 'error');
    }
    document.body.removeChild(textArea);
  }

  let lastToastMsg = '';
  let lastToastTime = 0;
  let currentToastTimer = null;

  function showToast(message, type = 'info') {
    if (!message) return;

    // Làm sạch message: nếu message đã có icon ở đầu thì bỏ icon đầu đi để không bị lặp 2 icon
    const cleanMsg = message.replace(/^[\s✅⚠️ℹ️❌🚀⚡📦📄]+/, '').trim();
    const finalMsg = cleanMsg || message;

    // Chống lặp thông báo giống hệt nhau trong 2.5 giây
    const now = Date.now();
    if (finalMsg === lastToastMsg && (now - lastToastTime) < 2500) {
      return;
    }
    lastToastMsg = finalMsg;
    lastToastTime = now;

    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // DỌN SẠCH TẤT CẢ TOAST CŨ NGAY LẬP TỨC - CHỈ GIỮ ĐÚNG 1 THÔNG BÁO DUY NHẤT
    if (currentToastTimer) {
      clearTimeout(currentToastTimer);
      currentToastTimer = null;
    }
    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${finalMsg}</span>`;

    container.appendChild(toast);

    currentToastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        try {
          if (toast.parentElement) toast.remove();
        } catch (e) {}
      }, 250);
    }, 3200);
  }

  function initFaqAccordion() {
    window.toggleFaq = function(btn) {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    };
  }

  // ==========================================
  // LIVE BUYER TICKER (SOCIAL PROOF)
  // ==========================================
  function startLiveToastTicker() {
    const toastUserEl = document.getElementById('live-toast-user');
    const toastWrap = document.getElementById('showcase-live-toast');
    const toastTimeEl = toastWrap ? toastWrap.querySelector('.live-buyer-time') : null;
    if (!toastUserEl || !toastWrap) return;

    // Danh sách người mua mặc định đa dạng, phong phú từ nhiều tỉnh thành
    const defaultBuyers = [
      { name: 'Quốc Bảo (Hà Nội)', book: 'Khởi Nghiệp Không Lối Mòn' },
      { name: 'Minh Thư (TP.HCM)', book: 'Bí Mật Tư Duy Triệu Phú' },
      { name: 'Hoàng Long (Đà Nẵng)', book: 'Combo Vua Bán Hàng Thực Chiến' },
      { name: 'Thanh Nga (Cần Thơ)', book: 'Nghệ Thuật Đàm Phán Giá Trị Cao' },
      { name: 'Đức Trí (Hải Phòng)', book: 'Ứng Dụng AI Tự Động Hóa Doanh Nghiệp' },
      { name: 'Khánh Linh (Nha Trang)', book: 'Quản Trị Tài Chính Cá Nhân 4.0' },
      { name: 'Văn Hùng (Bình Dương)', book: 'Chiến Lược Marketing 0 Đồng' },
      { name: 'Ngọc Ánh (Huế)', book: 'Kỹ Năng Lãnh Đạo Xuất Chúng' },
      { name: 'Tuấn Anh (Quảng Ninh)', book: 'Combo Khởi Nghiệp Toàn Diện' },
      { name: 'Thu Trang (Đồng Nai)', book: 'Tâm Lý Học Trong Giao Tiếp & Thuyết Phục' },
      { name: 'Hải Đăng (Vũng Tàu)', book: 'Xây Dựng Thương Hiệu Cá Nhân' },
      { name: 'Bảo Trâm (Quy Nhơn)', book: 'Kế Hoạch Tài Chính & Tự Do' },
      { name: 'Phương Nam (Hà Nội)', book: 'Combo Đột Phá Doanh Số 2025' },
      { name: 'Hồng Nhung (TP.HCM)', book: 'Nghệ Thuật Quản Lý Thời Gian Tối Ưu' }
    ];

    const timeOptions = ['• Vừa xong', '• 1 phút trước', '• 2 phút trước', '• 3 phút trước', '• 5 phút trước', '• 8 phút trước'];
    const recentNames = []; // Lưu các tên vừa hiển thị gần đây để tuyệt đối không lặp liên tục

    function cleanCustomerName(rawName) {
      if (!rawName) return 'Độc giả';
      // Lọc bỏ mã sinh viên / mã đơn nếu có ở đầu tên (ví dụ: B25DCCN291 Phan Quoc Loc -> Phan Quoc Loc)
      let cleaned = rawName.replace(/^[A-Z0-9_-]{5,15}\s+/i, '').trim();
      return cleaned || rawName;
    }

    function getNextBuyer() {
      // Lấy danh sách đơn hàng thực tế đã hoàn thành
      const realOrders = (typeof EbookDB !== 'undefined' && EbookDB.getOrders)
        ? EbookDB.getOrders().filter(o => o.status === 'completed')
        : [];

      // Chuẩn bị pool ứng viên
      const candidates = [];

      // Thêm các đơn hàng thực tế hợp lệ
      realOrders.forEach(order => {
        const cName = cleanCustomerName(order.customerName);
        const bTitle = order.items?.[0]?.title || 'Ebook Bản Quyền';
        candidates.push({ name: cName, book: bTitle, isReal: true });
      });

      // Thêm pool mẫu
      defaultBuyers.forEach(b => {
        candidates.push({ name: b.name, book: b.book, isReal: false });
      });

      // Lọc bỏ những người vừa hiển thị gần đây (trong danh sách recentNames)
      let available = candidates.filter(c => !recentNames.includes(c.name));

      // Nếu tất cả đều vừa xuất hiện, xóa bớt lịch sử để tạo vòng quay mới
      if (available.length === 0) {
        recentNames.splice(0, Math.floor(recentNames.length / 2));
        available = candidates.filter(c => !recentNames.includes(c.name));
      }

      // Chọn ngẫu nhiên 1 người trong available
      const chosen = (available.length > 0)
        ? available[Math.floor(Math.random() * available.length)]
        : defaultBuyers[0];

      // Lưu lại vào recentNames (tối đa giữ 8 tên gần nhất)
      recentNames.push(chosen.name);
      if (recentNames.length > 8) {
        recentNames.shift();
      }

      return chosen;
    }

    function showNextNotification() {
      const buyer = getNextBuyer();
      const timeStr = timeOptions[Math.floor(Math.random() * timeOptions.length)];

      toastWrap.style.opacity = '0';
      toastWrap.style.transform = 'translateY(4px)';

      setTimeout(() => {
        toastUserEl.innerHTML = `<strong>${buyer.name}</strong> vừa sở hữu <em>${buyer.book}</em>`;
        if (toastTimeEl) {
          toastTimeEl.textContent = timeStr;
        }
        toastWrap.style.opacity = '1';
        toastWrap.style.transform = 'translateY(0)';
      }, 350);

      // Dãn thời gian: random từ 9 đến 14 giây cho mỗi lần hiện để tạo cảm giác tự nhiên, không bị dồn dập
      const nextDelay = 9000 + Math.floor(Math.random() * 5000);
      setTimeout(showNextNotification, nextDelay);
    }

    // Bắt đầu chu kỳ đầu tiên sau 6 giây mở trang
    setTimeout(showNextNotification, 6000);
  }

  window.showToast = showToast;
});
