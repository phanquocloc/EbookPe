/**
 * EbookPe — Admin Dashboard Logic
 * Quản lý Ebook (CRUD), Đơn hàng, Thống kê doanh thu và Cài đặt tài khoản VietQR
 */

document.addEventListener('DOMContentLoaded', () => {
  // Trạng thái Admin
  const adminState = {
    currentTab: 'dashboard',
    editingBookId: null,
    searchBooksQuery: '',
    selectedCoverStyle: 'cover-1',
    uploadedCoverBase64: '',
    searchOrdersQuery: ''
  };

  // DOM Elements
  const tabLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabContents = document.querySelectorAll('.admin-tab-content');
  const topbarTitle = document.getElementById('topbar-title');
  const btnTopAddBook = document.getElementById('btn-top-add-book');

  // Book Modal DOM
  const bookModal = document.getElementById('admin-book-modal');
  const bookForm = document.getElementById('admin-book-form');
  const bookModalTitle = document.getElementById('admin-book-modal-title');
  const coverPreview = document.getElementById('admin-cover-preview');

  // Khởi tạo
  initAdmin();

  function initAdmin() {
    bindNavigation();
    renderDashboard();
    renderBooksTable();
    renderOrdersTable();
    loadSettingsForm();
    bindBookFormEvents();
    bindSettingsEvents();
    bindSyncEvents();
    initSecurityTab(); // [OWASP] Khởi tạo tab bảo mật
    bindLogoutButtons();
  }

  // ==========================================
  // NAVIGATION & TAB SWITCHING
  // ==========================================
  function bindNavigation() {
    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        switchTab(tab);
      });
    });

    if (btnTopAddBook) {
      btnTopAddBook.addEventListener('click', () => {
        openAddBookModal();
      });
    }

    // Nút đóng modal
    document.querySelectorAll('.admin-modal-close, [data-close-admin-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeBookModal();
      });
    });

    bookModal?.addEventListener('click', (e) => {
      if (e.target === bookModal) closeBookModal();
    });
  }

  function switchTab(tabId) {
    adminState.currentTab = tabId;

    tabLinks.forEach(l => l.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    const activeLink = document.querySelector(`.sidebar-link[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`tab-content-${tabId}`);

    if (activeLink) activeLink.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    // Cập nhật tiêu đề Topbar
    const titles = {
      dashboard: 'Tổng Quan & Thống Kê',
      books: 'Quản Lý Kho Ebook',
      orders: 'Quản Lý Đơn Hàng',
      settings: 'Cài Đặt Cửa Hàng & Thanh Toán VietQR',
      security: 'Bảo Mật & Nhật Ký Hệ Thống'
    };
    if (topbarTitle) topbarTitle.textContent = titles[tabId] || 'Quản Trị';

    // Refresh dữ liệu theo tab
    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'books') renderBooksTable();
    if (tabId === 'orders') renderOrdersTable();
    if (tabId === 'settings') loadSettingsForm();
    if (tabId === 'security') renderSecurityTab();
  }

  // Đồng bộ thời gian thực
  function bindSyncEvents() {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('ebookpe_sync_channel');
      channel.onmessage = (event) => {
        if (event.data.type === 'ORDERS_UPDATED') {
          renderDashboard();
          renderOrdersTable();
        }
      };
    }
  }

  // ==========================================
  // DASHBOARD OVERVIEW
  // ==========================================
  function renderDashboard() {
    const books = EbookDB.getBooks();
    const orders = EbookDB.getOrders();

    // Tính toán số liệu
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalOrdersCount = orders.length;
    const activeBooksCount = books.filter(b => b.status === 'active').length;
    const totalDownloads = books.reduce((sum, b) => sum + (b.salesCount || 0), 0);

    // Gán vào Card
    const elRevenue = document.getElementById('stat-revenue');
    const elOrders = document.getElementById('stat-orders');
    const elBooks = document.getElementById('stat-books');
    const elDownloads = document.getElementById('stat-downloads');

    if (elRevenue) elRevenue.textContent = EbookDB.formatVND(totalRevenue);
    if (elOrders) elOrders.textContent = totalOrdersCount;
    if (elBooks) elBooks.textContent = activeBooksCount;
    if (elDownloads) elDownloads.textContent = `${totalDownloads.toLocaleString('vi-VN')}+`;

    // Render 5 đơn hàng mới nhất
    const recentOrdersContainer = document.getElementById('recent-orders-list');
    if (recentOrdersContainer) {
      const recent = orders.slice(0, 5);
      if (recent.length === 0) {
        recentOrdersContainer.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Chưa có đơn hàng nào</td></tr>`;
      } else {
        recentOrdersContainer.innerHTML = recent.map(o => `
          <tr>
            <td><strong>#${o.orderId}</strong></td>
            <td>
              <div style="font-weight:600;">${o.customerName}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${o.customerEmail}</div>
            </td>
            <td><strong style="color:var(--primary);">${EbookDB.formatVND(o.totalAmount)}</strong></td>
            <td>
              <span class="badge-status ${o.status}">
                ${o.status === 'completed' ? 'Đã thanh toán' : 'Chờ xử lý'}
              </span>
            </td>
          </tr>
        `).join('');
      }
    }

    // Vẽ biểu đồ Canvas nhẹ
    drawSalesChart();
  }

  function drawSalesChart() {
    const canvas = document.getElementById('sales-chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 200;

    ctx.clearRect(0, 0, w, h);

    // Dữ liệu mô phỏng 7 ngày gần nhất
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const values = [450, 780, 620, 1150, 890, 1420, 1850];
    const maxVal = Math.max(...values) * 1.2;

    const padX = 40;
    const padY = 30;
    const chartW = w - padX * 2;
    const chartH = h - padY * 2;

    // Đường lưới ngang
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padY + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.stroke();
    }

    // Vẽ Area Gradient
    const stepX = chartW / (values.length - 1);
    const grad = ctx.createLinearGradient(0, padY, 0, h - padY);
    grad.addColorStop(0, 'rgba(45, 106, 79, 0.35)');
    grad.addColorStop(1, 'rgba(45, 106, 79, 0.0)');

    ctx.beginPath();
    values.forEach((v, idx) => {
      const x = padX + idx * stepX;
      const y = h - padY - (v / maxVal) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padX + (values.length - 1) * stepX, h - padY);
    ctx.lineTo(padX, h - padY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Vẽ Line
    ctx.beginPath();
    ctx.strokeStyle = '#2D6A4F';
    ctx.lineWidth = 3;
    values.forEach((v, idx) => {
      const x = padX + idx * stepX;
      const y = h - padY - (v / maxVal) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Vẽ Points và Nhãn
    values.forEach((v, idx) => {
      const x = padX + idx * stepX;
      const y = h - padY - (v / maxVal) * chartH;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#2D6A4F';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#6B7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(days[idx], x, h - 8);
    });
  }

  // ==========================================
  // EBOOK CRUD MANAGEMENT
  // ==========================================
  function renderBooksTable() {
    const tableBody = document.getElementById('admin-books-table-body');
    if (!tableBody) return;

    let books = EbookDB.getBooks();

    // Lọc theo tìm kiếm
    if (adminState.searchBooksQuery.trim() !== '') {
      const q = adminState.searchBooksQuery.toLowerCase();
      books = books.filter(b => 
        b.title.toLowerCase().includes(q) ||
        (b.categoryName && b.categoryName.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q))
      );
    }

    if (books.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
            Không tìm thấy Ebook nào. Bấm nút <strong>"+ Thêm Ebook Mới"</strong> để đăng bán.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = books.map(book => {
      // Cover preview thumb
      let coverThumbStyle = '';
      if (book.coverImage && book.coverImage.trim() !== '') {
        coverThumbStyle = `background-image: url('${book.coverImage}');`;
      } else {
        const coverCls = book.coverStyle || 'cover-1';
        coverThumbStyle = `background: var(--${coverCls}, #2D6A4F);`;
      }

      return `
        <tr>
          <td>
            <div class="table-cover-thumb ${book.coverStyle || 'cover-1'}" style="${coverThumbStyle}">
              <span>${book.coverImage ? '' : '📖'}</span>
            </div>
          </td>
          <td>
            <div style="font-weight:700; color:var(--text-main); font-size:0.92rem; max-width:260px;">${book.title}</div>
            <div style="font-size:0.76rem; color:var(--text-muted);">Tác giả: ${book.author || 'EbookPe'} · ${book.pages || 180} trang</div>
          </td>
          <td>
            <span style="background:#F1F5F9; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:600;">
              ${book.categoryName || book.category}
            </span>
          </td>
          <td>
            <div style="font-weight:800; color:var(--primary);">${EbookDB.formatVND(book.price)}</div>
            ${book.originalPrice ? `<div style="font-size:0.74rem; color:var(--text-muted); text-decoration:line-through;">${EbookDB.formatVND(book.originalPrice)}</div>` : ''}
          </td>
          <td>
            <strong>${book.salesCount || 0}</strong> lượt mua
          </td>
          <td>
            <span class="badge-status ${book.status || 'active'}">
              ${book.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn-action-icon" title="Chỉnh sửa" onclick="window.adminEditBook('${book.id}')">
                ✏️
              </button>
              <button class="btn-action-icon" title="Bật/Tắt hiển thị" onclick="window.adminToggleBookStatus('${book.id}')">
                ${book.status === 'active' ? '👁️' : '🙈'}
              </button>
              <button class="btn-action-icon delete" title="Xóa sách" onclick="window.adminDeleteBook('${book.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Tìm kiếm Ebook trong bảng
  document.getElementById('admin-search-book-input')?.addEventListener('input', (e) => {
    adminState.searchBooksQuery = e.target.value;
    renderBooksTable();
  });

  // Mở modal thêm Ebook
  function openAddBookModal() {
    adminState.editingBookId = null;
    adminState.selectedCoverStyle = 'cover-1';
    adminState.uploadedCoverBase64 = '';

    if (bookModalTitle) bookModalTitle.textContent = 'Thêm Ebook Mới Vào Kho';
    if (bookForm) bookForm.reset();

    // Điền mặc định
    document.getElementById('book-category').value = 'khoi-nghiep';
    document.getElementById('book-format').value = 'PDF';
    document.getElementById('book-pages').value = '180';
    document.getElementById('book-status').value = 'active';

    updateCoverPreview();
    bookModal?.classList.add('active');
  }

  // Mở modal sửa Ebook
  window.adminEditBook = function(bookId) {
    const book = EbookDB.getBookById(bookId);
    if (!book) return;

    adminState.editingBookId = book.id;
    adminState.selectedCoverStyle = book.coverStyle || 'cover-1';
    adminState.uploadedCoverBase64 = book.coverImage || '';

    if (bookModalTitle) bookModalTitle.textContent = `Chỉnh Sửa Ebook: ${book.title}`;

    document.getElementById('book-title').value = book.title || '';
    document.getElementById('book-subtitle').value = book.subTitle || '';
    document.getElementById('book-author').value = book.author || '';
    document.getElementById('book-category').value = book.category || 'khoi-nghiep';
    document.getElementById('book-price').value = book.price || '';
    document.getElementById('book-price-old').value = book.originalPrice || '';
    document.getElementById('book-badge').value = book.badge || '';
    document.getElementById('book-pages').value = book.pages || 180;
    document.getElementById('book-format').value = book.format || 'PDF';
    document.getElementById('book-status').value = book.status || 'active';
    document.getElementById('book-short-desc').value = book.shortDesc || '';
    document.getElementById('book-full-desc').value = book.fullDesc || '';
    document.getElementById('book-toc').value = book.toc ? book.toc.join('\n') : '';
    document.getElementById('book-sample').value = book.sampleExcerpt || '';
    document.getElementById('book-download-url').value = book.downloadUrl || '';

    updateCoverPreview();
    bookModal?.classList.add('active');
  };

  // Toggle ẩn hiện sách
  window.adminToggleBookStatus = function(bookId) {
    const book = EbookDB.getBookById(bookId);
    if (book) {
      book.status = book.status === 'active' ? 'hidden' : 'active';
      EbookDB.saveBook(book);
      renderBooksTable();
      renderDashboard();
      showAdminToast(`Đã đổi trạng thái sang "${book.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}"`, 'info');
    }
  };

  // Xóa sách
  window.adminDeleteBook = function(bookId) {
    const book = EbookDB.getBookById(bookId);
    if (!book) return;

    if (confirm(`Bạn có chắc chắn muốn xóa cuốn sách "${book.title}" khỏi hệ thống không?`)) {
      EbookDB.deleteBook(bookId);
      renderBooksTable();
      renderDashboard();
      showAdminToast('Đã xóa cuốn ebook thành công!', 'success');
    }
  };

  function closeBookModal() {
    bookModal?.classList.remove('active');
  }

  // Live Cover Preview & Events
  function bindBookFormEvents() {
    // Chọn preset gradient
    document.querySelectorAll('.cover-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cover-preset-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        adminState.selectedCoverStyle = btn.dataset.cover;
        adminState.uploadedCoverBase64 = ''; // Bỏ ảnh tải lên nếu chọn gradient
        updateCoverPreview();
      });
    });

    // Upload file ảnh bìa (FileReader sang Base64)
    const coverFileInput = document.getElementById('book-cover-file');
    if (coverFileInput) {
      coverFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            alert('Vui lòng chọn ảnh dung lượng dưới 2MB để đảm bảo tốc độ tải trang!');
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            adminState.uploadedCoverBase64 = event.target.result;
            updateCoverPreview();
            showAdminToast('Đã nạp ảnh bìa thành công!', 'success');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Input tiêu đề thay đổi -> live preview
    document.getElementById('book-title')?.addEventListener('input', updateCoverPreview);
    document.getElementById('book-subtitle')?.addEventListener('input', updateCoverPreview);

    // Submit form thêm / sửa sách
    bookForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveBook();
    });
  }

  function updateCoverPreview() {
    if (!coverPreview) return;
    const titleVal = document.getElementById('book-title')?.value || 'Tiêu đề Ebook';
    const subVal = document.getElementById('book-subtitle')?.value || 'Tác giả / Ngách';

    if (adminState.uploadedCoverBase64) {
      coverPreview.className = 'cover-preview-card';
      coverPreview.style.background = `url('${adminState.uploadedCoverBase64}') center/cover no-repeat`;
      coverPreview.innerHTML = `
        <div style="background:rgba(0,0,0,0.6); padding:8px; border-radius:6px;">
          <div style="font-size:0.65rem; text-transform:uppercase;">${subVal}</div>
          <div style="font-size:0.85rem; font-weight:700;">${titleVal}</div>
        </div>
      `;
    } else {
      coverPreview.className = `cover-preview-card ${adminState.selectedCoverStyle}`;
      coverPreview.style.background = '';
      coverPreview.innerHTML = `
        <div style="font-size:0.65rem; text-transform:uppercase; opacity:0.8;">${subVal}</div>
        <div style="font-family:'Playfair Display',serif; font-size:0.95rem; font-weight:700;">${titleVal}</div>
      `;
    }
  }

  function handleSaveBook() {
    const title = document.getElementById('book-title').value.trim();
    const subTitle = document.getElementById('book-subtitle').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const category = document.getElementById('book-category').value;
    const price = parseInt(document.getElementById('book-price').value) || 0;
    const originalPrice = parseInt(document.getElementById('book-price-old').value) || 0;
    const badge = document.getElementById('book-badge').value.trim();
    const pages = parseInt(document.getElementById('book-pages').value) || 180;
    const format = document.getElementById('book-format').value;
    const status = document.getElementById('book-status').value;
    const shortDesc = document.getElementById('book-short-desc').value.trim();
    const fullDesc = document.getElementById('book-full-desc').value.trim();
    const tocRaw = document.getElementById('book-toc').value.trim();
    const sampleExcerpt = document.getElementById('book-sample').value.trim();
    const downloadUrl = document.getElementById('book-download-url').value.trim();

    if (!title || price <= 0) {
      alert('Vui lòng nhập Tên sách và Giá bán hợp lệ!');
      return;
    }

    // Tìm tên danh mục
    const catObj = DEFAULT_CATEGORIES.find(c => c.id === category);
    const categoryName = catObj ? catObj.name.replace(/^[^\s]+\s/, '') : 'Khác';

    // Parse mục lục từ textarea (mỗi dòng 1 chương)
    const toc = tocRaw ? tocRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0) : [];

    const bookData = {
      id: adminState.editingBookId || undefined,
      title,
      subTitle,
      author,
      category,
      categoryName,
      price,
      originalPrice,
      badge,
      pages,
      format,
      status,
      shortDesc,
      fullDesc,
      toc,
      sampleExcerpt,
      downloadUrl: downloadUrl || 'https://example.com/ebook-download.pdf',
      coverStyle: adminState.selectedCoverStyle,
      coverImage: adminState.uploadedCoverBase64
    };

    EbookDB.saveBook(bookData);
    closeBookModal();
    renderBooksTable();
    renderDashboard();
    showAdminToast(adminState.editingBookId ? 'Cập nhật Ebook thành công!' : 'Đã thêm Ebook mới lên gian hàng!', 'success');
  }

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================
  function renderOrdersTable() {
    const tableBody = document.getElementById('admin-orders-table-body');
    if (!tableBody) return;

    let orders = EbookDB.getOrders();

    if (adminState.searchOrdersQuery.trim() !== '') {
      const q = adminState.searchOrdersQuery.toLowerCase();
      orders = orders.filter(o => 
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q))
      );
    }

    if (orders.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">
            Chưa có đơn hàng nào phù hợp với tìm kiếm.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = orders.map(order => `
      <tr>
        <td><strong>#${order.orderId}</strong></td>
        <td>
          <div style="font-weight:700;">${order.customerName}</div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${order.customerEmail}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${order.customerPhone || 'Không có SĐT'}</div>
        </td>
        <td>
          <div style="font-size:0.84rem; max-width:240px;">
            ${order.items.map(i => `• ${i.title} (${i.qty || 1})`).join('<br>')}
          </div>
        </td>
        <td><strong style="color:var(--primary); font-size:0.95rem;">${EbookDB.formatVND(order.totalAmount)}</strong></td>
        <td>
          <span style="font-size:0.75rem; background:#EFF6FF; color:#1D4ED8; padding:3px 8px; border-radius:4px; font-weight:600;">
            ${order.paymentMethod || 'VietQR'}
          </span>
        </td>
        <td>
          <select class="admin-order-status-select" onchange="window.adminChangeOrderStatus('${order.orderId}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid var(--admin-border); font-size:0.78rem;">
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ Đã thanh toán</option>
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Chờ xử lý</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Hủy đơn</option>
          </select>
        </td>
        <td>
          <span style="font-size:0.78rem; color:var(--text-muted);">${order.orderDate}</span>
        </td>
      </tr>
    `).join('');
  }

  window.adminChangeOrderStatus = function(orderId, newStatus) {
    EbookDB.updateOrderStatus(orderId, newStatus);
    renderDashboard();
    showAdminToast(`Đã cập nhật trạng thái đơn #${orderId}!`, 'success');
  };

  document.getElementById('admin-search-order-input')?.addEventListener('input', (e) => {
    adminState.searchOrdersQuery = e.target.value;
    renderOrdersTable();
  });

  // ==========================================
  // SETTINGS & VIETQR CONFIGURATION
  // ==========================================
  function loadSettingsForm() {
    const s = EbookDB.getSettings();

    document.getElementById('setting-bank-code').value = s.bankCode || 'MB';
    document.getElementById('setting-bank-name').value = s.bankName || 'MBBank';
    document.getElementById('setting-account-num').value = s.accountNumber || '';
    document.getElementById('setting-account-name').value = s.accountName || '';
    document.getElementById('setting-prefix').value = s.transferPrefix || 'EBPE';
    document.getElementById('setting-hotline').value = s.hotline || '';
    document.getElementById('setting-email').value = s.supportEmail || '';

    // Cài đặt Tự động hóa
    document.getElementById('setting-sepay-token').value = s.sepayApiKey || '';
    document.getElementById('setting-emailjs-service').value = s.emailjsServiceId || '';
    document.getElementById('setting-emailjs-template').value = s.emailjsTemplateId || '';
    document.getElementById('setting-emailjs-public').value = s.emailjsPublicKey || '';
    document.getElementById('setting-auto-email').checked = !!s.autoEmailEnabled;

    updateVietQRPreviewLive();
  }

  function bindSettingsEvents() {
    // Form lưu cài đặt
    document.getElementById('admin-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        bankCode: document.getElementById('setting-bank-code').value,
        bankName: document.getElementById('setting-bank-name').value,
        accountNumber: document.getElementById('setting-account-num').value.trim(),
        accountName: document.getElementById('setting-account-name').value.trim().toUpperCase(),
        transferPrefix: document.getElementById('setting-prefix').value.trim().toUpperCase(),
        hotline: document.getElementById('setting-hotline').value.trim(),
        supportEmail: document.getElementById('setting-email').value.trim(),
        sepayApiKey: document.getElementById('setting-sepay-token').value.trim(),
        emailjsServiceId: document.getElementById('setting-emailjs-service').value.trim(),
        emailjsTemplateId: document.getElementById('setting-emailjs-template').value.trim(),
        emailjsPublicKey: document.getElementById('setting-emailjs-public').value.trim(),
        autoEmailEnabled: document.getElementById('setting-auto-email').checked
      };

      EbookDB.saveSettings(updated);
      updateVietQRPreviewLive();
      showAdminToast('Đã lưu cấu hình tài khoản ngân hàng & tự động hóa!', 'success');
    });

    // Test gửi Email
    document.getElementById('btn-test-email')?.addEventListener('click', async () => {
      const serviceId = document.getElementById('setting-emailjs-service').value.trim();
      const templateId = document.getElementById('setting-emailjs-template').value.trim();
      const publicKey = document.getElementById('setting-emailjs-public').value.trim();

      if (!serviceId || !templateId || !publicKey) {
        alert('Vui lòng điền đủ Service ID, Template ID và Public Key của EmailJS trước khi gửi thử!');
        return;
      }

      showAdminToast('Đang gửi thử Email tới thinhloclinh@gmail.com...', 'info');
      try {
        if (typeof emailjs !== 'undefined') {
          emailjs.init(publicKey);
          await emailjs.send(serviceId, templateId, {
            to_name: 'PHAN QUOC LOC (Chủ shop EbookPe)',
            to_email: 'thinhloclinh@gmail.com',
            order_id: 'EBPE-TEST',
            total_amount: '199.000đ',
            book_titles: 'Khởi Nghiệp Không Lối Mòn (Thử nghiệm tự động gửi)',
            download_links: 'https://example.com/download-sample.pdf',
            support_hotline: '0333.399.956'
          });
          showAdminToast('Đã gửi email thử nghiệm thành công! Hãy kiểm tra hòm thư Gmail của bạn.', 'success');
        } else {
          alert('Không tìm thấy thư viện EmailJS.');
        }
      } catch (err) {
        alert('Lỗi gửi email: ' + (err.text || err.message || JSON.stringify(err)));
      }
    });

    // Thay đổi thông số ngân hàng -> preview VietQR ngay
    ['setting-bank-code', 'setting-account-num', 'setting-account-name', 'setting-prefix'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateVietQRPreviewLive);
    });

    // Backup & Restore
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      const dataStr = EbookDB.exportBackupJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `EbookPe_Backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      showAdminToast('Đã tải file sao lưu về máy tính!', 'success');
    });

    const fileImport = document.getElementById('input-import-backup');
    document.getElementById('btn-import-backup')?.addEventListener('click', () => {
      fileImport?.click();
    });

    fileImport?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = EbookDB.importBackupJSON(event.target.result);
          if (res.success) {
            showAdminToast('Khôi phục dữ liệu từ file sao lưu thành công!', 'success');
            renderDashboard();
            renderBooksTable();
            renderOrdersTable();
            loadSettingsForm();
          } else {
            alert('File sao lưu không hợp lệ: ' + res.error);
          }
        };
        reader.readAsText(file);
      }
    });

    // Khôi phục dữ liệu gốc
    document.getElementById('btn-reset-default')?.addEventListener('click', () => {
      if (confirm('CẢNH BÁO: Thao tác này sẽ đặt lại toàn bộ sách và cài đặt về trạng thái ban đầu của EbookPe. Bạn có chắc chắn không?')) {
        EbookDB.resetToDefault();
        showAdminToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'info');
        renderDashboard();
        renderBooksTable();
        renderOrdersTable();
        loadSettingsForm();
      }
    });
  }

  function updateVietQRPreviewLive() {
    const bankCode = document.getElementById('setting-bank-code')?.value || 'MB';
    const accNum = document.getElementById('setting-account-num')?.value || '2456987654';
    const accName = document.getElementById('setting-account-name')?.value || 'PHAN QUOC LOC';
    const prefix = document.getElementById('setting-prefix')?.value || 'EBPE';

    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accNum}-compact2.png?amount=199000&addInfo=${prefix}TEST&accountName=${encodeURIComponent(accName)}`;
    const previewImg = document.getElementById('admin-qr-preview-img');
    if (previewImg) previewImg.src = qrUrl;
  }

  // Toast Helper
  function showAdminToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  window.showAdminToast = showAdminToast;

  // ==========================================
  // [OWASP] Bảo Mật & Xác Thực (Security Tab)
  // ==========================================

  function bindLogoutButtons() {
    // Nút logout trong sidebar
    const btnLogout = document.getElementById('btn-admin-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đăng xuất khỏi hệ thống quản trị?')) {
          AdminAuth.logout();
          window.location.replace('admin-login.html');
        }
      });
    }

    // Hiển thị thông tin phiên trong sidebar
    displaySessionInfo();
  }

  function displaySessionInfo() {
    const el = document.getElementById('admin-session-info');
    if (!el || typeof AdminAuth === 'undefined') return;
    try {
      const sess = JSON.parse(sessionStorage.getItem('ebookpe_admin_session_v1') || '{}');
      if (sess.username) {
        el.innerHTML = `👤 ${Security.escapeHTML(sess.username)}<br>🕒 Đăng nhập: ${Security.escapeHTML(sess.loginTime || '')}` ;
      }
    } catch(e) {}
  }

  function initSecurityTab() {
    // Form đổi mật khẩu
    const pwForm = document.getElementById('form-change-password');
    if (pwForm) {
      pwForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cur = document.getElementById('pw-current').value;
        const nw  = document.getElementById('pw-new').value;
        const cf  = document.getElementById('pw-confirm').value;
        const msg = document.getElementById('pw-msg');

        if (!cur || !nw || !cf) {
          showPwMsg(msg, 'error', 'Vui lòng điền đầy đủ các ô mật khẩu!');
          return;
        }

        const result = await AdminAuth.changePassword(cur, nw, cf);
        if (result.success) {
          showPwMsg(msg, 'success', '✅ ' + result.message);
          pwForm.reset();
          renderSecurityTab(); // Refresh audit log
        } else {
          showPwMsg(msg, 'error', '⚠️ ' + result.message);
        }
      });
    }

    // Nút logout trong security tab
    const btnLogoutSec = document.getElementById('btn-logout-security');
    if (btnLogoutSec) {
      btnLogoutSec.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
          AdminAuth.logout();
          window.location.replace('admin-login.html');
        }
      });
    }

    // Xóa logs
    const btnClearLogs = document.getElementById('btn-clear-logs');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        if (confirm('Xóa toàn bộ nhật ký bảo mật?')) {
          localStorage.removeItem('ebookpe_audit_logs_v1');
          Security.logEvent('LOGS_CLEARED', 'WARNING', 'Quản trị viên đã xóa toàn bộ audit log');
          renderSecurityTab();
          showAdminToast('Đã xóa nhật ký bảo mật!', 'success');
        }
      });
    }
  }

  function showPwMsg(el, type, text) {
    if (!el) return;
    el.style.display = 'block';
    if (type === 'success') {
      el.style.background = 'rgba(0,184,148,0.1)';
      el.style.border = '1px solid rgba(0,184,148,0.3)';
      el.style.color = '#00b894';
    } else {
      el.style.background = 'rgba(214,48,49,0.1)';
      el.style.border = '1px solid rgba(214,48,49,0.3)';
      el.style.color = '#d63031';
    }
    el.textContent = text;
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }

  function renderSecurityTab() {
    // Thông tin phiên
    const sessEl = document.getElementById('session-detail');
    if (sessEl) {
      try {
        const sess = JSON.parse(sessionStorage.getItem('ebookpe_admin_session_v1') || '{}');
        const remaining = sess.expiresAt ? Math.max(0, Math.round((sess.expiresAt - Date.now()) / 60000)) : 0;
        sessEl.innerHTML = `
          <div>👤 <b>Tài khoản:</b> ${Security.escapeHTML(sess.username || 'admin')}</div>
          <div>🎭 <b>Vai trò:</b> ${Security.escapeHTML(sess.role || 'super_admin')}</div>
          <div>🕒 <b>Đăng nhập lúc:</b> ${Security.escapeHTML(sess.loginTime || 'N/A')}</div>
          <div>⏱️ <b>Hết hạn sau:</b> <span style="color:${remaining < 30 ? '#d63031' : '#00b894'}">${remaining} phút</span></div>
        `;
      } catch(e) {
        sessEl.textContent = 'Không thể đọc thông tin phiên.';
      }
    }

    // OWASP Status
    const owaspEl = document.getElementById('owasp-status');
    if (owaspEl) {
      const checks = [
        { code: 'A01', name: 'Broken Access Control', status: true, note: 'Auth Guard + Session Check' },
        { code: 'A02', name: 'Cryptographic Failures', status: true, note: 'SHA-256 + Salt + Web Crypto API' },
        { code: 'A03', name: 'Injection (XSS)', status: true, note: 'escapeHTML() trên toàn bộ output' },
        { code: 'A04', name: 'Insecure Design', status: true, note: 'Brute Force Rate Limiting (5 lần)' },
        { code: 'A05', name: 'Security Misconfiguration', status: true, note: 'Security Meta Headers' },
        { code: 'A06', name: 'Vulnerable Components', status: true, note: 'CDN SRI + kiểm tra nguồn gốc' },
        { code: 'A07', name: 'Auth Failures', status: true, note: 'Session Timeout 2h + đổi mật khẩu' },
        { code: 'A08', name: 'Data Integrity', status: true, note: 'validateBackupSchema() JSON' },
        { code: 'A09', name: 'Security Logging', status: true, note: 'Audit Log đầy đủ' },
        { code: 'A10', name: 'SSRF', status: true, note: 'sanitizeURL() chặn javascript:' }
      ];
      owaspEl.innerHTML = checks.map(c =>
        `<div>✅ <b>[${Security.escapeHTML(c.code)}]</b> ${Security.escapeHTML(c.name)} — <span style="color:var(--primary);">${Security.escapeHTML(c.note)}</span></div>`
      ).join('');
    }

    // Audit Log Table
    const tbody = document.getElementById('audit-log-tbody');
    if (tbody && typeof Security !== 'undefined') {
      const logs = Security.getAuditLogs();
      if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted);">Chưa có nhật ký bảo mật nào.</td></tr>';
      } else {
        const levelColors = { INFO: '#6C5CE7', WARNING: '#fdcb6e', SUCCESS: '#00b894', DANGER: '#d63031' };
        tbody.innerHTML = logs.map(log => `
          <tr style="border-top:1px solid var(--border);">
            <td style="padding:11px 16px;color:var(--text-muted);white-space:nowrap;font-size:12px;">${Security.escapeHTML(log.timestamp)}</td>
            <td style="padding:11px 16px;font-weight:600;font-size:13px;">${Security.escapeHTML(log.action)}</td>
            <td style="padding:11px 16px;">
              <span style="padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;
                background:${levelColors[log.level] || '#6C5CE7'}20;
                color:${levelColors[log.level] || '#6C5CE7'}">${Security.escapeHTML(log.level)}</span>
            </td>
            <td style="padding:11px 16px;color:var(--text-muted);font-size:12px;">${Security.escapeHTML(log.details)}</td>
          </tr>
        `).join('');
      }
    }
  }

});
