import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, ImageUp } from 'lucide-react';

function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    const html5QrCode = new Html5Qrcode('qr-reader-region');
    scannerRef.current = html5QrCode;

    // Kamerayı başlat
    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // QR kod başarıyla okunduğunda kamerayı durdur ve link analizine aktar
          stopCamera().then(() => {
            onScanSuccess(decodedText);
          });
        },
        () => {
          // Karede henüz QR yoksa sessizce taramaya devam et
        }
      )
      .then(() => {
        isScanningRef.current = true;
      })
      .catch(() => {
        setErrorMsg('Kamera başlatılamadı veya kamera izni verilmedi. Aşağıdan QR kod görseli yükleyerek de tarama yapabilirsiniz.');
      });

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        isScanningRef.current = false;
      } catch {
        // Zaten durdurulmuşsa yoksay
      }
    }
  };

  // Bilgisayardan QR görseli seçerek okutma
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopCamera();
      const fileScanner = new Html5Qrcode('qr-file-hidden');
      const decodedText = await fileScanner.scanFile(file, true);
      fileScanner.clear();
      onScanSuccess(decodedText);
    } catch {
      setErrorMsg('Seçilen görselde geçerli bir QR kod okunamadı. Lütfen net bir QR görseli deneyin.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Kapat">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-icon" style={{ backgroundColor: 'rgba(0, 102, 255, 0.12)', color: '#00a3cc' }}>
            <Camera size={26} />
          </div>
          <div>
            <h3 className="modal-title" style={{ color: '#ffffff' }}>QR Kod Güvenlik Tarayıcı</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              QR kodu kameraya gösterin; içindeki bağlantı otomatik olarak Link Analizi ile taranacaktır.
            </p>
          </div>
        </div>

        {/* Canlı Kamera Alanı */}
        <div id="qr-reader-region" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#080c14' }} />
        <div id="qr-file-hidden" style={{ display: 'none' }} />

        {errorMsg && (
          <p style={{ fontSize: '13px', color: '#f59e0b', marginTop: '12px', lineHeight: '1.4' }}>
            {errorMsg}
          </p>
        )}

        {/* Alternatif: Dosyadan QR Yükleme */}
        <div style={{ marginTop: '18px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
          <label className="card-button" style={{ cursor: 'pointer' }}>
            <ImageUp size={18} />
            <span>Görsel Dosyasından QR Kod Seç</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default QrScannerModal;