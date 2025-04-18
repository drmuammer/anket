# Deprem Tatbikatı Anket Sistemi

Bu proje, deprem tatbikatları sırasında kullanılmak üzere tasarlanmış bir anket sistemidir. Sistem, mobil ve web platformlarında çalışabilen, kullanıcı dostu bir arayüze sahiptir.

## Özellikler

- Kullanıcı yönetimi (Admin, Anketör, Katılımcı)
- Anket oluşturma ve yönetme
- Birim tabanlı anket atama
- Anket sonuçlarının raporlanması ve görselleştirilmesi
- Mobil uyumlu arayüz
- Rol bazlı yetkilendirme sistemi

## Teknolojiler

- **Frontend**: Next.js, TypeScript, React Bootstrap
- **Backend**: Supabase
- **Veritabanı**: PostgreSQL (Supabase)
- **Kimlik Doğrulama**: Supabase Auth
- **Hosting**: Vercel

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/your-username/deprem-tatbikati-anket.git
cd deprem-tatbikati-anket
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Supabase yapılandırması:
   - Supabase hesabı oluşturun ve yeni bir proje oluşturun
   - `.env.local` dosyasını oluşturun ve Supabase URL ve API anahtarınızı ekleyin:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Vercel Deployment

1. Vercel CLI'yı yükleyin:
```bash
npm install -g vercel
```

2. Projeyi deploy edin:
```bash
vercel
```

3. Üretim ortamı için deploy:
```bash
vercel --prod
```

## Proje Yapısı

- `/src/pages`: Sayfalar ve API rotaları
- `/src/components`: Yeniden kullanılabilir bileşenler
- `/src/lib`: Yardımcı fonksiyonlar ve kütüphaneler
- `/src/styles`: Global stiller ve tema

## Kullanım

1. Admin olarak giriş yapın
2. Birim ve kullanıcı yönetimini yapın
3. Anketler oluşturun ve birimlere atayın
4. Sonuçları görüntüleyin ve raporları inceleyin

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın. 