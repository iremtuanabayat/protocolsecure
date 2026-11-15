import { Shield } from 'lucide-react';

function Header() {
  return (
    <header style={{
      borderBottom: '1px solid #1e293b',
      padding: '20px 40px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      backgroundColor: '#080c14'
    }}>
      {/* Kalkan İkonu Kutusu */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        backgroundColor: 'rgba(0, 102, 255, 0.12)',
        border: '1px solid rgba(0, 163, 204, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00a3cc'
      }}>
        <Shield size={24} />
      </div>

      {/* Başlık ve Alt Başlık */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
          Protocol Secure
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
          E-posta, SMS, Link ve Telefon Numarası Güvenlik Taraması
        </p>
      </div>
    </header>
  );
}

export default Header;