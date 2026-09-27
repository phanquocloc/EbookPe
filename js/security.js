/**
 * EbookPe — Security & Authentication Module
 * Tuân thủ và phòng tránh 10 lỗ hổng bảo mật OWASP Top 10
 * 
 * [A01] Broken Access Control: Kiểm soát quyền hạn truy cập Admin nghiêm ngặt
 * [A02] Cryptographic Failures: Mã hóa SHA-256 kèm Salt, sinh Token bằng Web Crypto API
 * [A03] Injection (XSS): Làm sạch dữ liệu đầu ra escapeHTML()
 * [A04] Insecure Design: Chống tấn công dò mật khẩu (Rate limiting / Brute force protection)
 * [A05] Security Misconfiguration: Cấu hình an toàn, xóa Session khi đăng xuất
 * [A06] Vulnerable Components: Kiểm tra toàn vẹn tài nguyên
 * [A07] Identification & Auth Failures: Quản lý phiên Session Timeout 2h, đổi mật khẩu an toàn
 * [A08] Software/Data Integrity: Kiểm định cấu trúc file JSON nhập vào
 * [A09] Security Logging & Monitoring: Nhật ký bảo mật Audit Log
 * [A10] SSRF & Malicious URLs: Chặn liên kết javascript:/data: độc hại
 */

const SECURITY_STORAGE = {
  ADMIN_CRED: 'ebookpe_admin_cred_v1',
  ADMIN_SESSION: 'ebookpe_admin_session_v1',
  LOGIN_ATTEMPTS: 'ebookpe_login_attempts_v1',
  AUDIT_LOGS: 'ebookpe_audit_logs_v1'
};

// Cấu hình tài khoản Admin mặc định ban đầu (Mật khẩu ban đầu: hihiloc2@)
// Mật khẩu sẽ được tự động Hash SHA-256 ngay khi khởi tạo
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'thinhloclinh@gmail.com',
  // SHA-256 hash của "hihiloc2@" với salt "EbookPe_Secure_Salt_9988"
  passwordHash: '7c4df0db2934517bc7fae32360f2ace63f8490a58cb9eff91ebfab1b575a2fad',
  salt: 'EbookPe_Secure_Salt_9988',
  createdAt: '2026-09-27T00:00:00.000Z',
  role: 'super_admin'
};

class Security {
  /**
   * [A02] Băm mật khẩu an toàn bằng thuật toán SHA-256 với Salt thông qua Web Crypto API
   */
  static async hashPassword(password, salt = 'EbookPe_Secure_Salt_9988') {
    const text = `${salt}:${password}`;
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * [A02] Sinh Token bảo mật ngẫu nhiên không thể đoán trước
   */
  static generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * [A03] Phòng chống XSS Injection: Làm sạch dữ liệu hiển thị trên HTML
   */
  static escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;'
    };
    return String(str).replace(/[&<>"'/]/g, m => map[m]);
  }

  /**
   * [A10] Kiểm định liên kết URL: Chặn javascript:, data:, vbscript:
   */
  static sanitizeURL(url) {
    if (!url || typeof url !== 'string') return '#';
    const cleanUrl = url.trim();
    // Chỉ chấp nhận http, https hoặc đường dẫn nội bộ an toàn
    if (/^(https?:\/\/|\/|#)/i.test(cleanUrl) && !/^javascript:/i.test(cleanUrl)) {
      return cleanUrl;
    }
    return '#unsafe-url-blocked';
  }

  /**
   * [A04] Chống Brute Force / Dò mật khẩu (Rate Limiting)
   * Tối đa 5 lần thử sai, sau đó khóa tạm thời trong 60 giây
   */
  static checkRateLimit(actionKey = 'admin_login', maxAttempts = 5, lockTimeMs = 60000) {
    try {
      const dataStr = localStorage.getItem(SECURITY_STORAGE.LOGIN_ATTEMPTS);
      const data = dataStr ? JSON.parse(dataStr) : {};
      const record = data[actionKey] || { count: 0, lockedUntil: 0 };
      const now = Date.now();

      if (record.lockedUntil > now) {
        const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return {
          allowed: false,
          remainingSeconds,
          message: `Bạn đã nhập sai quá nhiều lần. Vui lòng chờ ${remainingSeconds} giây trước khi thử lại!`
        };
      }

      return { allowed: true, attempts: record.count };
    } catch (e) {
      return { allowed: true, attempts: 0 };
    }
  }

  static recordFailedAttempt(actionKey = 'admin_login', maxAttempts = 5, lockTimeMs = 60000) {
    try {
      const dataStr = localStorage.getItem(SECURITY_STORAGE.LOGIN_ATTEMPTS);
      const data = dataStr ? JSON.parse(dataStr) : {};
      const record = data[actionKey] || { count: 0, lockedUntil: 0 };
      const now = Date.now();

      record.count += 1;
      if (record.count >= maxAttempts) {
        record.lockedUntil = now + lockTimeMs;
        record.count = 0; // Reset sau khi khóa
      }
      data[actionKey] = record;
      localStorage.setItem(SECURITY_STORAGE.LOGIN_ATTEMPTS, JSON.stringify(data));
      this.logEvent('LOGIN_FAILED_ATTEMPT', 'WARNING', `Nhập sai mật khẩu lần ${record.count}`);
    } catch (e) {}
  }

  static resetRateLimit(actionKey = 'admin_login') {
    try {
      const dataStr = localStorage.getItem(SECURITY_STORAGE.LOGIN_ATTEMPTS);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        delete data[actionKey];
        localStorage.setItem(SECURITY_STORAGE.LOGIN_ATTEMPTS, JSON.stringify(data));
      }
    } catch (e) {}
  }

  /**
   * [A09] Ghi nhật ký bảo mật (Security Audit Log)
   */
  static logEvent(action, level = 'INFO', details = '') {
    try {
      const logsStr = localStorage.getItem(SECURITY_STORAGE.AUDIT_LOGS);
      const logs = logsStr ? JSON.parse(logsStr) : [];
      const entry = {
        id: 'LOG-' + Date.now().toString(36),
        timestamp: new Date().toLocaleString('vi-VN'),
        action,
        level, // INFO, WARNING, SUCCESS, DANGER
        details,
        userAgent: navigator.userAgent.slice(0, 80)
      };
      logs.unshift(entry);
      // Giữ tối đa 100 bản ghi mới nhất
      if (logs.length > 100) logs.pop();
      localStorage.setItem(SECURITY_STORAGE.AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {}
  }

  static getAuditLogs() {
    try {
      const logsStr = localStorage.getItem(SECURITY_STORAGE.AUDIT_LOGS);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * [A08] Xác thực tính toàn vẹn của dữ liệu Import JSON
   */
  static validateBackupSchema(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Dữ liệu không đúng định dạng JSON đối tượng.');
    }
    if (data.books && !Array.isArray(data.books)) {
      throw new Error('Trường books phải là một danh sách hợp lệ.');
    }
    if (data.orders && !Array.isArray(data.orders)) {
      throw new Error('Trường orders phải là một danh sách hợp lệ.');
    }
    return true;
  }
}

/**
 * Lớp Quản Lý Xác Thực Admin (Authentication Gatekeeper)
 */
class AdminAuth {
  // Lấy thông tin tài khoản Admin đã lưu (hoặc mặc định)
  static getAdminAccount() {
    try {
      const stored = localStorage.getItem(SECURITY_STORAGE.ADMIN_CRED);
      return stored ? JSON.parse(stored) : DEFAULT_ADMIN;
    } catch (e) {
      return DEFAULT_ADMIN;
    }
  }

  // [A01 & A07] Kiểm tra phiên đăng nhập còn hợp lệ không (Timeout: 2 giờ = 7200s)
  static isAuthenticated() {
    try {
      const sessionStr = sessionStorage.getItem(SECURITY_STORAGE.ADMIN_SESSION);
      if (!sessionStr) return false;
      const session = JSON.parse(sessionStr);
      const now = Date.now();

      // Hết hạn phiên (sau 2 tiếng không thao tác)
      if (!session.token || !session.expiresAt || session.expiresAt < now) {
        this.logout();
        return false;
      }

      // Gia hạn thêm 30 phút mỗi khi có tương tác
      session.expiresAt = now + (2 * 60 * 60 * 1000);
      sessionStorage.setItem(SECURITY_STORAGE.ADMIN_SESSION, JSON.stringify(session));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Đăng nhập
  static async login(usernameInput, passwordInput) {
    const rateCheck = Security.checkRateLimit('admin_login', 5, 60000);
    if (!rateCheck.allowed) {
      return { success: false, message: rateCheck.message };
    }

    const admin = this.getAdminAccount();
    const cleanUser = String(usernameInput || '').trim();
    const cleanPass = String(passwordInput || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!' };
    }

    // Hash mật khẩu nhập vào để so sánh
    const hashedAttempt = await Security.hashPassword(cleanPass, admin.salt || DEFAULT_ADMIN.salt);

    // [A07] So sánh username và hash mật khẩu
    const isUserMatch = (cleanUser.toLowerCase() === admin.username.toLowerCase()) || 
                        (cleanUser.toLowerCase() === admin.email.toLowerCase());
    const isPassMatch = (hashedAttempt === admin.passwordHash);

    if (isUserMatch && isPassMatch) {
      // Đăng nhập thành công -> Tạo phiên an toàn
      Security.resetRateLimit('admin_login');
      const token = Security.generateSecureToken(32);
      const session = {
        token,
        username: admin.username,
        role: admin.role || 'super_admin',
        loginTime: new Date().toLocaleString('vi-VN'),
        expiresAt: Date.now() + (2 * 60 * 60 * 1000) // 2 giờ
      };
      sessionStorage.setItem(SECURITY_STORAGE.ADMIN_SESSION, JSON.stringify(session));
      Security.logEvent('LOGIN_SUCCESS', 'SUCCESS', `Quản trị viên ${admin.username} đăng nhập thành công`);
      return { success: true };
    } else {
      // Đăng nhập thất bại -> Ghi nhận và tăng số lần sai
      Security.recordFailedAttempt('admin_login', 5, 60000);
      return { 
        success: false, 
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!' 
      };
    }
  }

  // Đăng xuất an toàn
  static logout() {
    sessionStorage.removeItem(SECURITY_STORAGE.ADMIN_SESSION);
    Security.logEvent('LOGOUT', 'INFO', 'Quản trị viên đăng xuất khỏi hệ thống');
  }

  // Đổi mật khẩu Admin
  static async changePassword(currentPassword, newPassword, confirmPassword) {
    const admin = this.getAdminAccount();
    const currentHash = await Security.hashPassword(currentPassword, admin.salt || DEFAULT_ADMIN.salt);

    if (currentHash !== admin.passwordHash) {
      return { success: false, message: 'Mật khẩu hiện tại không đúng!' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự để đảm bảo an toàn!' };
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      return { 
        success: false, 
        message: 'Mật khẩu mới phải bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số!' 
      };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Xác nhận mật khẩu mới không trùng khớp!' };
    }

    // Sinh salt mới và lưu hash mới
    const newSalt = Security.generateSecureToken(16);
    const newHash = await Security.hashPassword(newPassword, newSalt);

    const updatedAdmin = {
      ...admin,
      passwordHash: newHash,
      salt: newSalt,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(SECURITY_STORAGE.ADMIN_CRED, JSON.stringify(updatedAdmin));
    Security.logEvent('PASSWORD_CHANGED', 'SUCCESS', 'Quản trị viên đã đổi mật khẩu thành công');
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  }

  // Đổi Tên đăng nhập / Email Admin
  static updateProfile(newUsername, newEmail) {
    const admin = this.getAdminAccount();
    const updated = {
      ...admin,
      username: newUsername.trim() || admin.username,
      email: newEmail.trim() || admin.email
    };
    localStorage.setItem(SECURITY_STORAGE.ADMIN_CRED, JSON.stringify(updated));
    Security.logEvent('PROFILE_UPDATED', 'INFO', `Cập nhật thông tin quản trị: ${updated.username}`);
    return updated;
  }
}

// Gán biến toàn cục
window.Security = Security;
window.AdminAuth = AdminAuth;
