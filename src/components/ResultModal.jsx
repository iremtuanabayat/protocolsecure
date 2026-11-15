import { ShieldCheck, ShieldAlert, AlertTriangle, X, Server, PhoneCall, MessageSquareWarning, Globe } from 'lucide-react';

function ResultModal({ result, onClose }) {
  if (!result) return null;

  const statusConfig = {
    safe: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', Icon: ShieldCheck },
    warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', Icon: AlertTriangle },
    danger: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', Icon: ShieldAlert }
  };

  const { color, bg, Icon } = statusConfig[result.status] || statusConfig.warning;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Kapat">
          <X size={20} />
        </button>

        {/* Üst Durum Alanı */}
        <div className="modal-header">
          <div className="modal-icon" style={{ backgroundColor: bg, color }}>
            <Icon size={28} />
          </div>
          <div>
            <span className="modal-badge" style={{ backgroundColor: bg, color }}>
              Risk Skoru: %{result.score}
            </span>
            <h3 className="modal-title" style={{ color }}>{result.title}</h3>
          </div>
        </div>

        <p className="modal-summary">{result.summary}</p>

        {/* E-posta Canlı DNS Bilgisi */}
        {result.dnsInfo && result.dnsInfo.domain && (
          <div className="dns-box">
            <div className="dns-box-header">
              <Server size={16} color="#00a3cc" />
              <span>Canlı DNS Altyapı Kontrolü ({result.dnsInfo.domain})</span>
            </div>
            <div className="dns-tags">
              <span className={`dns-tag ${result.dnsInfo.hasMX ? 'ok' : 'bad'}`}>
                MX Kaydı: {result.dnsInfo.hasMX ? 'Aktif' : 'Yok'}
              </span>
              <span className={`dns-tag ${result.dnsInfo.hasSPF ? 'ok' : 'bad'}`}>
                SPF Koruması: {result.dnsInfo.hasSPF ? 'Mevcut' : 'Eksik'}
              </span>
            </div>
          </div>
        )}

        {/* Telefon Numarası Hat Bilgisi */}
        {result.phoneInfo && (
          <div className="dns-box">
            <div className="dns-box-header">
              <PhoneCall size={16} color="#00a3cc" />
              <span>Hat İstihbaratı ({result.phoneInfo.formatted})</span>
            </div>
            <div className="dns-tags">
              <span className="dns-tag ok">Ülke: {result.phoneInfo.country}</span>
              <span className="dns-tag ok">Tür: {result.phoneInfo.lineType}</span>
              <span className="dns-tag ok">Operatör/Bölge: {result.phoneInfo.carrier}</span>
            </div>
          </div>
        )}

        {/* SMS Tarama Özeti */}
        {result.smsInfo && (
          <div className="dns-box">
            <div className="dns-box-header">
              <MessageSquareWarning size={16} color="#00a3cc" />
              <span>SMS İçerik Taraması</span>
            </div>
            <div className="dns-tags">
              <span className="dns-tag ok">Kategori: {result.smsInfo.category}</span>
              <span className={`dns-tag ${result.smsInfo.linkCount > 0 ? 'bad' : 'ok'}`}>
                Bulunan Link: {result.smsInfo.linkCount} Adet
              </span>
              {result.smsInfo.phoneCount > 0 && (
                <span className="dns-tag bad">Numara: {result.smsInfo.phoneCount} Adet</span>
              )}
            </div>
          </div>
        )}

        {/* Link / QR Hedef Bilgisi */}
        {result.linkInfo && (
          <div className="dns-box">
            <div className="dns-box-header">
              <Globe size={16} color="#00a3cc" />
              <span>Bağlantı ve Hedef İstihbaratı ({result.linkInfo.source})</span>
            </div>
            <div className="dns-tags">
              <span className={`dns-tag ${result.linkInfo.protocol === 'HTTPS' ? 'ok' : 'bad'}`}>
                Protokol: {result.linkInfo.protocol}
              </span>
              <span className="dns-tag ok">Hedef: {result.linkInfo.domain}</span>
              {result.linkInfo.isShortener && (
                <span className="dns-tag bad">Kısaltılmış Yönlendirme</span>
              )}
            </div>
          </div>
        )}

        {/* Detaylı Bulgular Listesi */}
        <div className="findings-section">
          <h4>Analiz Bulguları</h4>
          <ul>
            {result.findings.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ResultModal;