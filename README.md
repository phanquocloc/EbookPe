# EbookPe — Nền Tảng Ebook Thực Chiến & Bản Quyền Số #1 Việt Nam

Chào mừng bạn đến với mã nguồn hoàn chỉnh của **EbookPe**. Hệ thống đã được thiết kế tinh tế, hiện đại, tối ưu trải nghiệm khách hàng và tích hợp bảng điều khiển Quản trị viên (Admin) chuyên nghiệp.

---

## 🌟 Cấu Trúc Dự Án

```
EbookPe/
├── index.html        # Giao diện chính cửa hàng dành cho khách hàng (Đã ẩn hoàn toàn nút Admin)
├── admin.html        # Bảng điều khiển Quản trị dành riêng cho chủ shop EbookPe
├── css/
│   ├── style.css     # Hệ thống thiết kế & Style cho giao diện cửa hàng, modal, reader
│   └── admin.css     # Style cho Dashboard Quản trị, bảng dữ liệu, form CRUD
├── js/
│   ├── data.js       # Tầng cơ sở dữ liệu (LocalStorage + BroadcastChannel sync)
│   ├── app.js        # Logic giỏ hàng, lọc danh mục, tìm kiếm, đọc thử, thanh toán VietQR
│   └── admin.js      # Logic quản trị: Thêm/Sửa/Xóa ebook, đơn hàng, cài đặt tự động hóa
└── README.md         # Hướng dẫn sử dụng chi tiết
```

---

## 🔒 1. Lối Vào Bí Mật Dành Cho Quản Trị Viên (Admin)

Để bảo đảm trải nghiệm mua sắm tự nhiên và tin cậy cho khách hàng, **giao diện chính (`index.html`) đã ẩn hoàn toàn tất cả nút bấm hay chữ "Quản Trị Admin"**. Khách hàng vãng lai sẽ không thể nhìn thấy trang quản trị.

Chủ cửa hàng có thể truy cập trang Quản trị bằng **3 cách cực kỳ tiện lợi**:
1. **Truy cập đường dẫn trực tiếp**: `http://localhost:8080/admin.html` (hoặc mở trực tiếp file `admin.html`).
2. **Dùng phím tắt nhanh**: Khi đang ở trang chủ `index.html`, bạn bấm tổ hợp phím **`Ctrl + Shift + A`**.
3. **Nhấp đúp chuột (Double click)**: Bấm đúp vào dòng chữ bản quyền `© 2026 EbookPe.vn` ở góc dưới cùng chân trang.

---

## 🤖 2. Cơ Chế Nhận Diện Tiền MBBank & Tự Động Gửi Ebook Vào Gmail

### ❓ Hiện tại hệ thống hoạt động như thế nào?
- Khi khách bấm *"Mua ngay"*, hệ thống tự động sinh mã VietQR chuẩn xác với STK MBBank `2456987654` - `PHAN QUOC LOC`, kèm đúng số tiền và mã đơn hàng `EBPE...`.
- Sau khi khách chuyển khoản xong, khách bấm *"Tôi đã quét mã chuyển khoản thành công"*, web sẽ ghi nhận đơn hàng và **hiển thị nút "⬇️ Tải PDF ngay" trên màn hình** để khách lưu sách về điện thoại/máy tính ngay lập tức.
- Đồng thời đơn hàng sẽ lưu vào mục **"Đơn Hàng"** trong `admin.html` kèm email khách để bạn theo dõi.

---

### 🚀 Cách kích hoạt TỰ ĐỘNG HÓA 100% (Khách chuyển tiền -> MBBank nhận -> Web tự xác nhận -> Tự bắn Email vào Gmail của khách 24/7):

Hệ thống EbookPe đã được lập trình sẵn các cổng kết nối API, bạn chỉ cần điền thông tin cấu hình vào mục **"⚙️ Cài Đặt"** trong `admin.html`:

#### Bước 1: Tự động bắt tiền vào MBBank qua SePay.vn (Miễn phí & Phổ biến #1 Việt Nam)
1. Truy cập [https://sepay.vn](https://sepay.vn) và đăng ký 1 tài khoản miễn phí.
2. Thêm tài khoản ngân hàng MBBank của bạn (`2456987654` - `PHAN QUOC LOC`).
3. Sao chép **API Token** từ SePay và dán vào ô **"Mã API Token SePay.vn"** trong trang Quản trị `admin.html`.
4. 👉 *Kết quả:* Khi khách quét mã QR chuyển tiền vào MBBank, chỉ sau **1 - 3 giây**, SePay sẽ báo về web. Màn hình thanh toán sẽ **tự động chuyển sang "Đã thanh toán thành công!"** mà khách không cần bấm gì cả.

#### Bước 2: Tự động gửi Ebook vào Gmail khách hàng qua EmailJS.com (Miễn phí 200 email/tháng)
1. Đăng ký tài khoản miễn phí tại [https://www.emailjs.com](https://www.emailjs.com).
2. Kết nối tài khoản Gmail của bạn (`thinhloclinh@gmail.com`).
3. Tạo 1 mẫu Email Template gửi sách (gồm các biến: `{{to_name}}`, `{{order_id}}`, `{{book_titles}}`, `{{download_links}}`).
4. Lấy 3 thông số: **Service ID**, **Template ID**, và **Public Key** dán vào mục cài đặt trong `admin.html`, sau đó tích chọn **"Kích hoạt tự động gửi Gmail"**.
5. 👉 *Kết quả:* Ngay khi đơn hàng được xác nhận (bằng SePay hoặc xác nhận thủ công), hệ thống sẽ **tự động gửi email thật chứa link tải Ebook thẳng vào hộp thư Gmail của khách hàng**!

---

## 💻 3. Cách Khởi Chạy Web

Server nội bộ đang chạy tại cổng `8080`:
- **Trang bán hàng cho khách**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **Trang quản trị cho chủ shop**: [http://localhost:8080/admin.html](http://localhost:8080/admin.html)

Khi bạn thêm hoặc chỉnh sửa sách ở trang Admin, trang bán hàng sẽ **tự động đồng bộ ngay lập tức**!
