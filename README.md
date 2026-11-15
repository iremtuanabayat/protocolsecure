# 🛡️ Protocol Secure — Siber Güvenlik ve Oltalama (Phishing) Analiz Platformu

**Protocol Secure**, kullanıcıların şüpheli e-posta, SMS (Smishing), telefon numarası, QR kod (Quishing) ve internet bağlantılarını (URL) tamamen tarayıcı üzerinde, hızlı ve güvenli bir şekilde analiz etmelerini sağlayan modern bir web uygulamasıdır.

## 🚀 Öne Çıkan Özellikler

- **E-posta Güvenlik Analizi:** Google DNS-over-HTTPS (DoH) API üzerinden canlı **MX** ve **SPF** kayıtlarını sorgular; tek kullanımlık mail servislerini, marka taklidi (Typosquatting) girişimlerini ve metin içi oltalama ifadelerini tespit eder.
- **Telefon Numarası İstihbaratı:** Türkiye GSM operatör bloklarını (`53X`, `54X`, `50X/55X`), il alan kodlarını, yüksek riskli `0850` sanal santral / `0900` hatlarını ve uluslararası **Wangiri** çağrı dolandırıcılığı alan kodlarını analiz eder.
- **SMS (Smishing) Taraması:** Mesaj metni içerisindeki gömülü linkleri ve iletişim numaralarını Regex ile ayıklar; sahte icra, kargo, banka ve kamu bildirimi kalıplarını tarar.
- **QR Kod Güvenlik Tarayıcı (`html5-qrcode`):** Cihaz kamerası veya yüklenen QR görseli üzerinden kodu okur ve elde edilen bağlantıyı otomatik olarak **Link Analizi** motoruna aktararak hedef güvenliğini denetler.
- **Derin Link (URL) Analizi:** HTTPS/SSL durumu, `@` karakteriyle URL maskeleme hileleri, Punycode (`xn--`) saldırıları, URL kısaltıcılar ve canlı DNS `A` kaydı doğrulaması yapar.
- **LocalStorage Tarama Geçmişi:** Yapılan son 15 güvenlik taramasını tarayıcı hafızasında (`localStorage`) saklar; kullanıcı geçmiş tarama raporlarını tekrar inceleyebilir veya tek tıkla temizleyebilir.

## 🛠️ Kullanılan Teknolojiler

- **Frontend Çatısı:** React 19 (Vite)
- **Dil:** JavaScript (ES6+)
- **Stil & Tasarım:** Saf CSS3 (CSS Grid, Flexbox, Dark Mode UI)
- **İkon Kütüphanesi:** Lucide React
- **QR Kod Okuma:** `html5-qrcode`
- **Harici Servis:** Google Public DNS-over-HTTPS (`dns.google`)

## 💻 Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için:

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Geliştirme sunucusunu başlatın
npm run dev