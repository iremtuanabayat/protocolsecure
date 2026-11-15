const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'ow.ly', 'shorturl.at', 'qrco.de', 'qrfy.com'];
const RISKY_TLDS = ['.xyz', '.top', '.click', '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.buzz', '.site', '.online', '.club', '.vip'];
const TARGETED_BRANDS = ['google', 'apple', 'microsoft', 'paypal', 'netflix', 'amazon', 'instagram', 'facebook', 'whatsapp', 'garanti', 'akbank', 'isbank', 'ziraat', 'yapikredi', 'turkcell', 'vodafone', 'ptt', 'edevlet', 'turkiye'];
const OFFICIAL_DOMAINS = ['google.com', 'apple.com', 'microsoft.com', 'paypal.com', 'netflix.com', 'amazon.com', 'instagram.com', 'facebook.com', 'whatsapp.com', 'garantibbva.com.tr', 'akbank.com', 'isbank.com.tr', 'ziraatbank.com.tr', 'yapikredi.com.tr', 'turkcell.com.tr', 'vodafone.com.tr', 'ptt.gov.tr', 'turkiye.gov.tr'];

export async function analyzeLinkSecurity(rawUrl, sourceType = 'Doğrudan Link') {
  const findings = [];
  let riskScore = 0;

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      status: 'warning',
      title: 'Geçersiz Bağlantı',
      score: 50,
      summary: 'Analiz edilecek geçerli bir URL girilmedi.',
      findings: ['Lütfen http:// veya https:// ile başlayan geçerli bir internet adresi girin.'],
      linkInfo: null
    };
  }

  // Eğer QR kod içinden URL yerine düz metin / Wi-Fi / IBAN çıktıysa yakala
  const looksLikeUrl = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i.test(trimmed);
  if (!looksLikeUrl) {
    return {
      status: 'warning',
      title: 'QR Kod İçeriği Web Linki Değil',
      score: 30,
      summary: 'Taranan QR kod bir web sitesi bağlantısı yerine düz metin veya özel komut içeriyor.',
      findings: [
        `Okunan Ham Veri: "${trimmed}"`,
        'Bilinmeyen kaynaklardan gelen metin veya Wi-Fi bağlantı komutlarını onaylamadan önce içeriği doğrulayın.'
      ],
      linkInfo: {
        protocol: 'Düz Metin / Veri',
        domain: 'Yok',
        source: sourceType
      }
    };
  }

  // URL ayrıştırma (Parsing)
  const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return {
      status: 'danger',
      title: 'Bozuk veya Manipüle Edilmiş URL',
      score: 80,
      summary: 'Girilen bağlantı standart URL yapısına uymuyor ve zararlı yönlendirme içeriyor olabilir.',
      findings: [`Geçersiz sözdizimi: ${trimmed}`],
      linkInfo: null
    };
  }

  const protocol = parsedUrl.protocol.replace(':', '').toUpperCase();
  const hostname = parsedUrl.hostname.toLowerCase();

  // 1. SSL / HTTPS Kontrolü
  if (parsedUrl.protocol === 'http:') {
    riskScore += 30;
    findings.push('Şifrelenmemiş bağlantı (HTTP): Bu siteye girilen şifre ve kart bilgileri ağ üzerinde dinlenebilir.');
  } else {
    findings.push('HTTPS (SSL/TLS) şifreleme protokolü aktif.');
  }

  // 2. "@" Karakteri ile URL Maskeleme Saldırısı (Örn: https://www.google.com@saldirgan.com)
  if (parsedUrl.username || trimmed.includes('@')) {
    riskScore += 55;
    findings.push(`URL Maskeleme Hilesi ("@"): Tarayıcı "@" işaretinden önceki güvenilir görünen kısmı yok sayıp doğrudan "${hostname}" sunucusuna bağlanır!`);
  }

  // 3. Doğrudan IP Adresi Kullanımı
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    riskScore += 50;
    findings.push(`Alan adı yerine doğrudan IP adresi (${hostname}) kullanılıyor: Zararlı yazılım dağıtımında sık görülür.`);
  }

  // 4. URL Kısaltıcı / Dinamik QR Yönlendirici Kontrolü
  const isShortener = SHORTENERS.some((s) => hostname === s || hostname.endsWith(`.${s}`));
  if (isShortener) {
    riskScore += 30;
    findings.push(`URL Kısaltma / Dinamik Yönlendirme Servisi (${hostname}): Nihai hedef gizlenmiş durumda, tıklamadan önce dikkatli olun.`);
  }

  // 5. Riskli Uzantı (TLD) Kontrolü
  if (RISKY_TLDS.some((tld) => hostname.endsWith(tld))) {
    riskScore += 30;
    findings.push(`Yüksek riskli / ucuz alan adı uzantısı tespit edildi (${hostname}).`);
  }

  // 6. Aşırı Alt Alan Adı (Subdomain) Hilesi (Örn: giris.garanti.guvenlik.dogrulama.com)
  const subdomainParts = hostname.split('.');
  if (subdomainParts.length >= 4 && !hostname.endsWith('.com.tr') && !hostname.endsWith('.gov.tr')) {
    riskScore += 25;
    findings.push(`Çok katmanlı karmaşık alt alan adı yapısı (${subdomainParts.length} seviye): Oltalama sitelerinde asıl domaini gizlemek için kullanılır.`);
  }

  // 7. Marka Taklidi (Typosquatting) Kontrolü
  const isOfficial = OFFICIAL_DOMAINS.some((off) => hostname === off || hostname.endsWith(`.${off}`));
  if (!isOfficial) {
    const matchedBrand = TARGETED_BRANDS.find((brand) => hostname.includes(brand));
    if (matchedBrand) {
      riskScore += 45;
      findings.push(`Marka Taklidi Şüphesi: Alan adı "${matchedBrand}" ismini içeriyor ancak resmi alan adı değil!`);
    }
  } else {
    findings.push(`Resmi ve doğrulanmış alan adı (${hostname}).`);
  }

  // 8. Punycode (Sahte Unicode Karakter) Kontrolü
  if (hostname.includes('xn--')) {
    riskScore += 50;
    findings.push('Homograph / Punycode (xn--) saldırısı tespit edildi: Yabancı alfabe harfleriyle gerçek bir sitenin görünümü taklit edilmiş.');
  }

  // 9. Canlı DNS (A Kaydı) Sunucu Doğrulaması
  let dnsActive = false;
  try {
    const dnsRes = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`).then((r) => r.json());
    if (dnsRes.Answer && dnsRes.Answer.length > 0) {
      dnsActive = true;
      findings.push(`Canlı DNS A kaydı doğrulandı: Alan adı aktif bir sunucu IP'sine (${dnsRes.Answer[0].data}) yönleniyor.`);
    } else {
      riskScore += 20;
      findings.push('DNS A kaydı bulunamadı: Alan adı şu an aktif değil veya hatalı/sahte yazılmış.');
    }
  } catch {
    findings.push('Canlı DNS sunucu kontrolü yapılamadı.');
  }

  riskScore = Math.min(Math.max(riskScore, 0), 100);

  let status = 'safe';
  let title = 'Bağlantı Güvenli Görünüyor';
  let summary = 'URL yapısı, şifreleme protokolü ve alan adı kontrollerinde belirgin bir tehdit tespit edilmedi.';

  if (riskScore >= 50) {
    status = 'danger';
    title = 'Tehlikeli Bağlantı / Oltalama Riski!';
    summary = 'Bu bağlantı ciddi güvenlik açıkları veya marka taklidi (phishing) belirtileri taşıyor. Kesinlikle bilgi girmeyin.';
  } else if (riskScore >= 20) {
    status = 'warning';
    title = 'Şüpheli Bağlantı / Dikkatli Olun';
    summary = 'Bağlantı kısaltılmış bir hedefe gidiyor veya şifreleme/alan adı açısından dikkat gerektiriyor.';
  }

  return {
    status,
    title,
    score: riskScore,
    summary,
    findings,
    linkInfo: {
      protocol,
      domain: hostname,
      source: sourceType,
      isShortener,
      dnsActive
    }
  };
}