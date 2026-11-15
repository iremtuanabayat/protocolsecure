// Türkiye'de sık kullanılan Smishing (SMS Oltalama) kalıpları
const SMISHING_PATTERNS = [
  { keywords: ['icra', 'uzlaştırma', 'dava dosyası', 'ceza dosyanız', 'hukuk bürosu', 'son gün'], label: 'Sahte İcra / Hukuk Tehdidi', weight: 35 },
  { keywords: ['kargonuz', 'teslim edilemedi', 'adres eksik', 'ptt', 'yurtiçi', 'aras kargo', 'mng'], label: 'Sahte Kargo Bildirimi', weight: 30 },
  { keywords: ['aidat iadesi', 'puanınız silinecek', 'hesabınız askıya', 'bloke', 'kartınız kapatılacak', 'şifreniz'], label: 'Sahte Banka / Finans Uyarısı', weight: 35 },
  { keywords: ['hgs', 'geçiş ihlali', 'borcunuz bulunmaktadır', 'edevlet', 'e-devlet', 'toki', 'sosyal yardım'], label: 'Sahte Kamu / Kurum Bildirimi', weight: 35 },
  { keywords: ['bonus', 'freespin', 'çevrimsiz', 'kazandınız', 'hediye çeki', 'yatırım şartsız'], label: 'Yasa Dışı Bahis / Sahte Ödül Tuzağı', weight: 40 }
];

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'ow.ly', 'shorturl.at'];
const RISKY_TLDS = ['.xyz', '.top', '.click', '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.buzz', '.site', '.online'];
const OFFICIAL_DOMAINS = ['ptt.gov.tr', 'turkiye.gov.tr', 'yurticikargo.com', 'araskargo.com.tr', 'mngkargo.com.tr', 'garantibbva.com.tr', 'akbank.com', 'isbank.com.tr', 'ziraatbank.com.tr'];

export function analyzeSmsSecurity(smsText) {
  const findings = [];
  let riskScore = 0;

  const trimmed = smsText.trim();
  if (trimmed.length < 5) {
    return {
      status: 'warning',
      title: 'Yetersiz SMS İçeriği',
      score: 50,
      summary: 'Analiz edilebilmesi için geçerli bir SMS metni girmelisiniz.',
      findings: ['Lütfen size gelen SMS mesajının tamamını metin kutusuna yapıştırın.'],
      smsInfo: null
    };
  }

  const lowerText = trimmed.toLowerCase();

  // 1. SMS içindeki tüm linkleri (http, https veya www ile başlayan) ayıkla
  const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
  const extractedUrls = trimmed.match(urlRegex) || [];

  // 2. SMS içindeki telefon numaralarını (0850, 05XX, 444 vb.) ayıkla
  const phoneRegex = /(?:\+90|0)?\s*(?:850|5\d{2}|2\d{2}|3\d{2})\s*\d{3}\s*\d{2}\s*\d{2}/g;
  const extractedPhones = trimmed.match(phoneRegex) || [];

  let detectedCategory = 'Genel Mesaj';

  // 3. Smishing Senaryo ve Anahtar Kelime Taraması
  SMISHING_PATTERNS.forEach((pattern) => {
    const matched = pattern.keywords.filter((kw) => lowerText.includes(kw));
    if (matched.length > 0) {
      riskScore += pattern.weight;
      detectedCategory = pattern.label;
      findings.push(`${pattern.label} şüphesi: Mesajda "${matched.join(', ')}" ifadeleri tespit edildi.`);
    }
  });

  // 4. Gömülü Linklerin Güvenlik Taraması
  if (extractedUrls.length > 0) {
    extractedUrls.forEach((rawUrl) => {
      const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      let hostname = '';

      try {
        hostname = new URL(normalizedUrl).hostname.toLowerCase();
      } catch {
        hostname = rawUrl.toLowerCase();
      }

      // Resmi domain kontrolü
      const isOfficial = OFFICIAL_DOMAINS.some((official) => hostname === official || hostname.endsWith(`.${official}`));
      if (isOfficial) {
        findings.push(`Resmi kurum/marka bağlantısı doğrulandı: ${hostname}`);
        return;
      }

      // A) HTTP (Şifresiz) Kontrolü
      if (rawUrl.toLowerCase().startsWith('http://')) {
        riskScore += 25;
        findings.push(`Şifrelenmemiş (HTTP) güvensiz link tespit edildi: ${rawUrl}`);
      }

      // B) Kısaltılmış Link Kontrolü
      if (SHORTENERS.some((s) => hostname.includes(s))) {
        riskScore += 30;
        findings.push(`Asıl hedefi gizleyen kısaltılmış URL tespit edildi (${hostname}): SMS'lerde sıkça oltalama amacıyla kullanılır.`);
      }

      // C) Riskli Uzantı Kontrolü
      if (RISKY_TLDS.some((tld) => hostname.endsWith(tld))) {
        riskScore += 30;
        findings.push(`Yüksek riskli alan adı uzantısı tespit edildi: ${hostname}`);
      }

      // D) Doğrudan IP Adresi Üzerinden Link Kontrolü
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        riskScore += 45;
        findings.push(`Alan adı yerine doğrudan IP adresi kullanan şüpheli bağlantı: ${hostname}`);
      }

      // E) Resmi Olmayan Bilinmeyen Link Uyarısı
      if (!isOfficial) {
        riskScore += 15;
        findings.push(`Mesaj içerisinde harici bir bağlantı bulundu (${hostname}): Tıklamadan önce göndericiyi doğrulayın.`);
      }
    });
  } else {
    findings.push('SMS içeriğinde tıklanabilir bir web bağlantısı (URL) bulunamadı.');
  }

  // 5. Mesaj İçindeki Telefon Numarası Kontrolü
  if (extractedPhones.length > 0) {
    extractedPhones.forEach((phone) => {
      const cleanPhone = phone.replace(/\s+/g, '');
      if (cleanPhone.includes('850')) {
        riskScore += 25;
        findings.push(`Mesaj içinde 0850 sanal santral numarası (${phone.trim()}) paylaşılmış: Geri aramadan önce resmi kurum numarasını teyit edin.`);
      } else {
        findings.push(`Mesaj içinde iletişim numarası tespit edildi: ${phone.trim()}`);
      }
    });
  }

  riskScore = Math.min(Math.max(riskScore, 0), 100);

  let status = 'safe';
  let title = 'SMS İçeriği Temiz Görünüyor';
  let summary = 'Mesaj metninde ve varsa içindeki bağlantılarda belirgin bir Smishing (SMS dolandırıcılığı) izine rastlanmadı.';

  if (riskScore >= 50) {
    status = 'danger';
    title = 'Yüksek Smishing (SMS Dolandırıcılığı) Riski!';
    summary = 'Bu SMS, kullanıcıları paniğe sevk ederek sahte linklere tıklatmayı amaçlayan oltalama belirtileri taşıyor.';
  } else if (riskScore >= 20) {
    status = 'warning';
    title = 'Şüpheli SMS İçeriği / Dikkatli Olun';
    summary = 'Mesaj içerisinde doğrulanmamış link veya dikkat gerektiren ifadeler tespit edildi.';
  }

  return {
    status,
    title,
    score: riskScore,
    summary,
    findings,
    smsInfo: {
      linkCount: extractedUrls.length,
      phoneCount: extractedPhones.length,
      category: detectedCategory
    }
  };
}