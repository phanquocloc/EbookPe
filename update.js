const fs = require('fs');
let data = fs.readFileSync('index.html', 'utf8');

const regex = /async function confirmPurchase\(\) \{[\s\S]*?(?=\n    function showNotification)/;
const replacement = `async function confirmPurchase() {
      if (!currentOrder) return;

      const custEmail = document.getElementById('checkout-cust-email')?.value.trim();
      if (!custEmail || !custEmail.includes('@')) {
        alert('⚠️ Vui lòng nhập địa chỉ Email chính xác để nhận link tải Ebook!');
        document.getElementById('checkout-cust-email')?.focus();
        return;
      }
      
      const btn = document.querySelector('#checkout-modal button[onclick="confirmPurchase()"]');
      let origBtnHtml = '';
      if (btn) {
        origBtnHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Đang kiểm tra...</span>';
      }

      try {
        const response = await fetch('/api/check-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: currentOrder.orderId, amount: currentOrder.totalAmount })
        });
        const responseData = await response.json();

        if (responseData.status === 'paid' && responseData.links) {
            window.EbookDB.saveSecureLinks(responseData.links);
            executeOrderCompletion(false);
        } else {
            alert('⚠️ Hệ thống chưa nhận được thanh toán. Vui lòng đợi thêm 1-2 phút hoặc kiểm tra lại nội dung chuyển khoản!');
        }
      } catch (err) {
        alert('Lỗi kiểm tra thanh toán, vui lòng thử lại sau.');
      } finally {
        if (btn) {
            btn.innerHTML = origBtnHtml;
            btn.disabled = false;
        }
      }
    }`;

data = data.replace(regex, replacement);
fs.writeFileSync('index.html', data);
console.log("Updated confirmPurchase");
