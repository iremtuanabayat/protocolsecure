// Yaygın taklit edilen markalar ve riskli domain uzantıları
const KNOWN_BRANDS = ['google', 'gmail', 'apple', 'microsoft', 'paypal', 'netflix', 'amazon', 'garanti', 'akbank', 'isbank', 'ziraat', 'yapikredi', 'turkcell', 'vodafone', 'turktelekom', 'ptt', 'edevlet'];
const RISKY_TLDS = ['.xyz', '.top', '.click', '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.buzz', '.info'];
const TEMP_MAIL_DOMAINS = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'yopmail.com', 'throwawaymail.com'];
const PHISHING_KEYWORDS = ['acil', 'askıya alındı', 'hesabınız', 'şifrenizi', 'doğrulama', 'kazandınız', 'ödül', 'fatura', 'icra', 'güncelleyin', 'bloke', 'urgent', 'verify', 'suspended', 'password'];

export async function analyzeEmailSecurity(input) {
  const findings = [];
  let riskScore = 0; // 0 = Tamamen Güvenli, 100 = Çok Yüksek Risk

  // 1. Girdi içindeki e-posta adresini ve linkleri Regex ile ayıkla
  const emailMatch = input.match(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const urlMatches = input.match(/(https?:\/\/[^\s]+)/gi) || [];

  if (!emailMatch && urlMatches.length === 0) {
    return {
      status: 'warning',
      title: 'Geçersiz veya Eksik Girdi',
      score: 50,
      summary: 'Girilen metinde geçerli bir e-posta adresi veya incelenecek link bulunamadı.',
      findings: ['Lütfen geçerli bir e-posta adresi (örn: ornek@domain.com) veya e-posta içeriği girin.'],
      dnsInfo: null
    };
  }

  let dnsInfo = { hasMX: false, hasSPF: false, domain: '' };

  // 2. E-posta adresi bulunduysa Domain, DNS (MX/SPF) ve Typosquatting kontrolü yap
  if (emailMatch) {
    const fullEmail = emailMatch[0].toLowerCase();
    const domain = emailMatch[1].toLowerCase();
    dnsInfo.domain = domain;

    // A) Geçici (Temp-Mail) Kontrolü
    if (TEMP_MAIL_DOMAINS.includes(domain)) {
      riskScore += 45;
      findings.push(`Tek kullanımlık / geçici e-posta servisi tespit edildi (${domain}).`);
    }

    // B) Riskli Uzantı (TLD) Kontrolü
    const hasRiskyTld = RISKY_TLDS.some((tld) => domain.endsWith(tld));
    if (hasRiskyTld) {
      riskScore += 30;
      findings.push(`Yüksek riskli alan adı uzantısı kullanılıyor (${domain}).`);
    }

    // C) Marka Taklidi (Typosquatting) Kontrolü
    const officialDomains = ['gmail.com', 'google.com', 'apple.com', 'microsoft.com', 'paypal.com', 'netflix.com', 'amazon.com', 'garantibbva.com.tr', 'akbank.com', 'isbank.com.tr', 'ziraatbank.com.tr', 'yapikredi.com.tr', 'turkcell.com.tr', 'vodafone.com.tr', 'turktelekom.com.tr', 'ptt.gov.tr', 'turkiye.gov.tr'];
    const isBrandMentioned = KNOWN_BRANDS.some((brand) => domain.includes(brand));
    if (isBrandMentioned && !officialDomains.includes(domain)) {
      riskScore += 40;
      findings.push(`Marka taklidi (Typosquatting) şüphesi: "${domain}" resmi marka alan adı değil.`);
    }

    // D) Canlı Google DNS-over-HTTPS (MX ve SPF) Sorgusu
    try {
      const [mxRes, txtRes] = await Promise.all([
        fetch(`https://dns.google/resolve?name=${domain}&type=MX`).then((r) => r.json()),
        fetch(`https://dns.google/resolve?name=${domain}&type=TXT`).then((r) => r.json())
      ]);

      if (mxRes.Answer && mxRes.Answer.length > 0) {
        dnsInfo.hasMX = true;
        findings.push(`DNS MX kaydı doğrulandı: Alan adının aktif bir posta sunucusu var.`);
      } else {
        riskScore += 35;
        findings.push(`DNS MX kaydı bulunamadı: Bu alan adı gerçek e-posta alışverişi için yapılandırılmamış.`);
      }

      const spfRecord = txtRes.Answer?.find((ans) => ans.data && ans.data.toLowerCase().includes('v=spf1'));
      if (spfRecord) {
        dnsInfo.hasSPF = true;
        findings.push(`SPF güvenlik politikası aktif (Sahte gönderici koruması mevcut).`);
      } else {
        riskScore += 15;
        findings.push(`SPF kaydı eksik: Alan adı kimlik taklidine (spoofing) açık olabilir.`);
      }
    } catch {
      findings.push('Canlı DNS sorgusu sırasında ağ bağlantısı kurulamadı, yerel kurallar uygulandı.');
    }
  }

  // 3. E-posta İçeriği ve Gömülü Link Taraması
  const lowerInput = input.toLowerCase();
  const matchedKeywords = PHISHING_KEYWORDS.filter((kw) => lowerInput.includes(kw));
  if (matchedKeywords.length > 0) {
    riskScore += Math.min(matchedKeywords.length * 12, 35);
    findings.push(`Sosyal mühendislik / aciliyet bildiren kelimeler tespit edildi: "${matchedKeywords.join(', ')}"`);
  }

  if (urlMatches.length > 0) {
    urlMatches.forEach((url) => {
      if (url.startsWith('http://')) {
        riskScore += 25;
        findings.push(`Şifrelenmemiş (HTTP) güvensiz bağlantı tespit edildi: ${url}`);
      }
      if (/bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd/i.test(url)) {
        riskScore += 20;
        findings.push(`Hedefi gizleyen kısaltılmış URL tespit edildi: ${url}`);
      }
    });
  }

  // Skoru 0-100 aralığında sınırla
  riskScore = Math.min(Math.max(riskScore, 0), 100);

  // Genel Durum Belirleme
  let status = 'safe';
  let title = 'Güvenli Görünüyor';
  let summary = 'Yapılan DNS ve oltalama (phishing) kontrollerinde belirgin bir tehdit bulunamadı.';

  if (riskScore >= 50) {
    status = 'danger';
    title = 'Yüksek Phishing (Oltalama) Riski!';
    summary = 'Bu e-posta veya içerik ciddi dolandırıcılık ve kimlik avı belirtileri taşıyor.';
  } else if (riskScore >= 20) {
    status = 'warning';
    title = 'Orta Seviye Risk / Dikkatli Olun';
    summary = 'Bazı şüpheli bulgular veya eksik güvenlik kayıtları tespit edildi.';
  }

  return {
    status, // 'safe' | 'warning' | 'danger'
    title,
    score: riskScore,
    summary,
    findings,
    dnsInfo
  };
}