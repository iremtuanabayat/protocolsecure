// Türkiye GSM Operatör Başlangıç Blokları (Prefix)
const TR_OPERATORS = {
  Turkcell: ['530', '531', '532', '533', '534', '535', '536', '537', '538', '539', '516', '561'],
  Vodafone: ['540', '541', '542', '543', '544', '545', '546', '547', '548', '549'],
  'Türk Telekom': ['501', '505', '506', '507', '551', '552', '553', '554', '555', '559']
};

// Yaygın Türkiye İl Alan Kodları
const TR_CITY_CODES = {
  '212': 'İstanbul (Avrupa)',
  '216': 'İstanbul (Anadolu)',
  '312': 'Ankara',
  '232': 'İzmir',
  '224': 'Bursa',
  '242': 'Antalya',
  '322': 'Adana',
  '332': 'Konya',
  '262': 'Kocaeli',
  '264': 'Sakarya'
};

// Wangiri (Tek Çaldırmalık Yurt Dışı Dolandırıcılık) Riskli Ülke Kodları
const HIGH_RISK_COUNTRY_CODES = [
  { code: '+216', country: 'Tunus' },
  { code: '+234', country: 'Nijerya' },
  { code: '+373', country: 'Moldova' },
  { code: '+381', country: 'Sırbistan' },
  { code: '+375', country: 'Belarus' },
  { code: '+252', country: 'Somali' },
  { code: '+881', country: 'Küresel Uydu Hattı' },
  { code: '+882', country: 'Uluslararası Özel Ağ' }
];

export function analyzePhoneSecurity(rawInput) {
  const findings = [];
  let riskScore = 0;

  // 1. Sadece rakamları ve baştaki '+' işaretini bırakarak temizle
  const cleaned = rawInput.trim().replace(/[^\d+]/g, '');

  if (cleaned.length < 7) {
    return {
      status: 'warning',
      title: 'Geçersiz veya Eksik Numara',
      score: 50,
      summary: 'Girilen telefon numarası standart uzunluğun altında.',
      findings: ['Lütfen alan koduyla birlikte geçerli bir telefon numarası girin (Örn: +90 532 123 45 67).'],
      phoneInfo: null
    };
  }

  let phoneInfo = {
    formatted: cleaned,
    country: 'Bilinmiyor',
    lineType: 'Standart Hat',
    carrier: 'Belirlenemedi'
  };

  // 2. Türkiye (+90 veya 0 ile başlayan 10-11 haneli) Numara Analizi
  const isTurkey =
    cleaned.startsWith('+90') ||
    (cleaned.startsWith('90') && cleaned.length === 12) ||
    (cleaned.startsWith('0') && cleaned.length === 11) ||
    (cleaned.startsWith('5') && cleaned.length === 10);

  if (isTurkey) {
    // Ulusal 10 haneli formata indirge (Örn: 5321234567 veya 8501234567)
    let nationalNumber = cleaned;
    if (nationalNumber.startsWith('+90')) nationalNumber = nationalNumber.slice(3);
    else if (nationalNumber.startsWith('90') && nationalNumber.length === 12) nationalNumber = nationalNumber.slice(2);
    else if (nationalNumber.startsWith('0')) nationalNumber = nationalNumber.slice(1);

    phoneInfo.country = 'Türkiye (+90)';
    phoneInfo.formatted = `+90 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6, 8)} ${nationalNumber.slice(8, 10)}`;

    if (nationalNumber.length !== 10) {
      riskScore += 45;
      findings.push(`Türkiye numara formatı hatalı: 10 hane olması gerekirken ${nationalNumber.length} hane girildi.`);
    } else {
      const prefix = nationalNumber.slice(0, 3);

      // A) 0850 Sanal Santral / VoIP Kontrolü
      if (prefix === '850') {
        riskScore += 35;
        phoneInfo.lineType = 'Sanal Santral / VoIP (0850)';
        phoneInfo.carrier = 'Alternatif Telekom Operatörü';
        findings.push('0850 sanal santral bloğu tespit edildi: İstenmeyen otomatik aramalar (robocall) ve sahte çağrı merkezi dolandırıcılıklarında sık kullanılır.');
      }
      // B) 900 / 888 Yüksek Ücretli Özel Servis Hatları
      else if (prefix === '900' || prefix === '888') {
        riskScore += 65;
        phoneInfo.lineType = 'Katma Değerli Özel Servis';
        phoneInfo.carrier = 'Özel Servis Sağlayıcı';
        findings.push('Yüksek ücretli özel servis hattı (0900/0888): Geri arama durumunda faturanıza yüksek ek ücret yansıyabilir.');
      }
      // C) GSM Mobil Hatlar
      else if (prefix.startsWith('5')) {
        phoneInfo.lineType = 'GSM Mobil Hat';
        let foundCarrier = 'Diğer / Sanal Mobil Operatör';
        for (const [operator, codes] of Object.entries(TR_OPERATORS)) {
          if (codes.includes(prefix)) {
            foundCarrier = operator;
            break;
          }
        }
        phoneInfo.carrier = `${foundCarrier} (Tahsis Bloğu)`;
        findings.push(`Geçerli Türkiye GSM mobil hattı doğrulandı (${prefix} bloğu - İlk tahsis: ${foundCarrier}).`);
        findings.push('Not: Numara taşıma (MNP) nedeniyle güncel operatör farklılık gösterebilir.');
      }
      // D) İl Sabit Hatları
      else if (TR_CITY_CODES[prefix]) {
        phoneInfo.lineType = 'Coğrafi Sabit Hat';
        phoneInfo.carrier = `${TR_CITY_CODES[prefix]} Sabit Hattı`;
        findings.push(`${TR_CITY_CODES[prefix]} bölgesine kayıtlı sabit telefon numarası doğrulandı.`);
      } else {
        riskScore += 20;
        phoneInfo.lineType = 'Diğer Sabit / Özel Blok';
        findings.push(`Alan kodu (${prefix}) standart mobil veya büyükşehir sabit hat blokları dışında yer alıyor.`);
      }

      // E) Sahte / Ardışık / Tekrarlayan Rakam Deseni Kontrolü
      const subscriberPart = nationalNumber.slice(3); // Son 7 hane
      if (/^(\d)\1{6}$/.test(subscriberPart) || subscriberPart === '1234567' || subscriberPart === '0000000') {
        riskScore += 40;
        findings.push('Sahte veya test amaçlı oluşturulmuş tekrarlayan/ardışık rakam dizilimi tespit edildi.');
      }
    }
  } else if (cleaned.startsWith('444') && cleaned.length === 7) {
    // Türkiye 444 Kurumsal Hatlar
    phoneInfo.country = 'Türkiye (Ulusal)';
    phoneInfo.lineType = 'Kurumsal Çağrı Merkezi (444)';
    phoneInfo.carrier = 'Kurumsal Tahsisli Hat';
    findings.push('444 ile başlayan kurumsal müşteri hizmetleri numarası formatı doğrulandı.');
  } else {
    // 3. Yurt Dışı Numara ve Wangiri Dolandırıcılığı Analizi
    phoneInfo.country = 'Uluslararası Hat';
    phoneInfo.lineType = 'Yurt Dışı Numara';

    if (!cleaned.startsWith('+')) {
      riskScore += 25;
      findings.push('Uluslararası formatta başında "+" ülke kodu eksik görünüyor.');
    }

    const riskyCountry = HIGH_RISK_COUNTRY_CODES.find((item) => cleaned.startsWith(item.code));
    if (riskyCountry) {
      riskScore += 70;
      phoneInfo.country = `${riskyCountry.country} (${riskyCountry.code})`;
      findings.push(`YÜKSEK WANGİRİ RİSKİ: ${riskyCountry.country} (${riskyCountry.code}) alan kodu, tek çaldırmalık çağrı bırakıp geri aramayla yüksek ücret kesen dolandırıcılık vakalarıyla bilinmektedir.`);
    } else {
      riskScore += 20;
      findings.push('Yurt dışı kaynaklı numara tespit edildi: Tanımadığınız uluslararası çağrıları geri ararken dikkatli olun.');
    }
  }

  riskScore = Math.min(Math.max(riskScore, 0), 100);

  let status = 'safe';
  let title = 'Hat Formatı ve Güvenliği Normal';
  let summary = 'Numara yapısı standartlara uygun görünüyor ve yüksek riskli dolandırıcılık bloklarında yer almıyor.';

  if (riskScore >= 50) {
    status = 'danger';
    title = 'Yüksek Riskli Hat / Dolandırıcılık Şüphesi!';
    summary = 'Bu numara bloğu yüksek ücretli servisler veya uluslararası çağrı dolandırıcılığı (Wangiri) ile ilişkilendiriliyor.';
  } else if (riskScore >= 20) {
    status = 'warning';
    title = 'Dikkat Gerektiren Hat Türü';
    summary = 'Numara geçerli formatta ancak sanal santral (0850) veya yurt dışı kaynaklı olduğu için temkinli yaklaşılmalıdır.';
  }

  return {
    status,
    title,
    score: riskScore,
    summary,
    findings,
    phoneInfo
  };
}