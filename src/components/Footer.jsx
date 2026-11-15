import { Shield } from 'lucide-react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* 1. Sütun: Marka ve Açıklama */}
          <div>
            <div className="footer-brand-title">
              <Shield size={20} color="#0066ff" />
              <span>Protocol Secure</span>
            </div>
            <p className="footer-brand-desc">
              Dijital güvenliğiniz için profesyonel analiz araçları. Hızlı, güvenilir ve tamamen tarayıcınızda çalışır.
            </p>
          </div>

          {/* 2. Sütun: Analiz Araçları */}
          <div>
            <h4 className="footer-col-title">Analiz Araçları</h4>
            <ul className="footer-links">
              <li><a href="#eposta">E-posta Analizi</a></li>
              <li><a href="#telefon">Telefon Numarası Kontrolü</a></li>
              <li><a href="#sms">SMS Güvenlik Taraması</a></li>
              <li><a href="#qr">QR Kod Doğrulama</a></li>
              <li><a href="#link">Link Güvenlik Analizi</a></li>
            </ul>
          </div>

          {/* 3. Sütun: Kurumsal */}
          <div>
            <h4 className="footer-col-title">Kurumsal</h4>
            <ul className="footer-links">
              <li><a href="#hakkimizda">Hakkımızda</a></li>
              <li><a href="#gizlilik">Gizlilik Politikası</a></li>
              <li><a href="#kullanim">Kullanım Koşulları</a></li>
              <li><a href="#iletisim">İletişim</a></li>
            </ul>
          </div>
        </div>

        {/* Alt Telif Hakkı Satırı */}
        <div className="footer-bottom">
          © 2026 Protocol Secure. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}

export default Footer;