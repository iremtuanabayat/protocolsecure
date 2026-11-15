import { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, QrCode, Link2 } from 'lucide-react';
import Header from './components/Header';
import AnalysisCard from './components/AnalysisCard';
import Footer from './components/Footer';
import ResultModal from './components/ResultModal';
import QrScannerModal from './components/QrScannerModal';
import ScanHistory from './components/ScanHistory';
import { analyzeEmailSecurity } from './utils/emailAnalyzer';
import { analyzePhoneSecurity } from './utils/phoneAnalyzer';
import { analyzeSmsSecurity } from './utils/smsAnalyzer';
import { analyzeLinkSecurity } from './utils/linkAnalyzer';
import './App.css';

const STORAGE_KEY = 'protocol_secure_history';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Sayfa açıldığında LocalStorage'daki geçmişi yükle
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Geçmiş her güncellendiğinde LocalStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scanHistory));
  }, [scanHistory]);

  // Yapılan her analizi geçmiş listesinin en üstüne ekleyen yardımcı fonksiyon
  const saveToHistory = (type, query, result) => {
    const newRecord = {
      id: Date.now(),
      type,
      query,
      date: new Date().toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      result
    };
    setScanHistory((prev) => [newRecord, ...prev].slice(0, 15)); // Son 15 taramayı tut
  };

  const handleEmailAnalyze = async (value) => {
    const result = await analyzeEmailSecurity(value);
    setAnalysisResult(result);
    saveToHistory('E-posta Analizi', value, result);
  };

  const handlePhoneAnalyze = (value) => {
    const result = analyzePhoneSecurity(value);
    setAnalysisResult(result);
    saveToHistory('Telefon Analizi', value, result);
  };

  const handleSmsAnalyze = (value) => {
    const result = analyzeSmsSecurity(value);
    setAnalysisResult(result);
    saveToHistory('SMS Analizi', value, result);
  };

  const handleLinkAnalyze = async (value) => {
    const result = await analyzeLinkSecurity(value, 'Link Analizi');
    setAnalysisResult(result);
    saveToHistory('Link Analizi', value, result);
  };

  const handleQrSuccess = async (decodedQrText) => {
    setIsQrModalOpen(false);
    const result = await analyzeLinkSecurity(decodedQrText, 'QR Kod Taraması');
    setAnalysisResult(result);
    saveToHistory('QR Kod Analizi', decodedQrText, result);
  };

  const handleClearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="app-wrapper">
      <Header />

      <main className="main-container">
        <h2 className="section-title">Analiz Türü Seçin</h2>

        <div className="cards-grid">
          <AnalysisCard
            icon={Mail}
            title="E-posta Analizi"
            description="E-postadaki linklerin güvenliğini analiz edin"
            placeholder="E-posta adresini veya içeriğini girin..."
            onAnalyze={handleEmailAnalyze}
          />

          <AnalysisCard
            icon={Phone}
            title="Telefon Numarası Analizi"
            description="Hat durumunu ve güvenliğini kontrol edin"
            placeholder="+90 5XX XXX XX XX"
            onAnalyze={handlePhoneAnalyze}
          />

          <AnalysisCard
            icon={MessageSquare}
            title="SMS Analizi"
            description="SMS içindeki linkleri güvenlik taramasından geçirin"
            placeholder="SMS içeriğini yapıştırın..."
            onAnalyze={handleSmsAnalyze}
          />

          <AnalysisCard
            icon={QrCode}
            title="QR Kod Analizi"
            description="QR kodu kamera ile tarayın"
            showInput={false}
            buttonText="Kamerayı Aç"
            buttonIcon={QrCode}
            onAnalyze={() => setIsQrModalOpen(true)}
          />

          <AnalysisCard
            icon={Link2}
            title="Link Analizi"
            description="URL'nin güvenliğini ve son hedefini analiz edin"
            placeholder="https://example.com"
            onAnalyze={handleLinkAnalyze}
          />
        </div>

        {/* LocalStorage Tarama Geçmişi Tablosu */}
        <ScanHistory
          history={scanHistory}
          onSelectHistory={(oldResult) => setAnalysisResult(oldResult)}
          onClearHistory={handleClearHistory}
        />
      </main>

      <Footer />

      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={handleQrSuccess}
      />

      <ResultModal
        result={analysisResult}
        onClose={() => setAnalysisResult(null)}
      />
    </div>
  );
}

export default App;