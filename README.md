# AI Chat Application

Bu uygulama DeepSeek, OpenAI ve Anthropic API'lerini kullanarak bir chat uygulamasıdır.

## Güvenlik Uyarıları

⚠️ **ÖNEMLİ: API Anahtarı Güvenliği**

- `.env` dosyası asla GitHub'a push edilmemelidir
- API anahtarlarınızı asla public repolarda paylaşmayın
- Commit geçmişinde API anahtarı olmadığından emin olun

## Kurulum

1. Repoyu klonlayın
2. `.env.example` dosyasını `.env` olarak kopyalayın
3. `.env` dosyasına kendi API anahtarlarınızı ekleyin
4. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
5. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## Environment Variables

Aşağıdaki environment variable'ları `.env` dosyanızda tanımlamanız gerekiyor:

```plaintext
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
```

## Deployment

Uygulamayı deploy ederken:

1. Environment variable'ları hosting platformunuzda (Vercel, Netlify vb.) ayarlayın
2. API anahtarlarını güvenli bir şekilde saklayın
3. Rate limiting ayarlarını production için güncelleyin

## Güvenlik Kontrol Listesi

Deploy etmeden önce:

- [ ] `.env` dosyası `.gitignore`'da
- [ ] Commit geçmişinde API anahtarı yok
- [ ] Environment variable'lar hosting platformunda ayarlı
- [ ] Rate limiting aktif
- [ ] Error handling ve logging yapılandırıldı

## Özellikler

- Çoklu AI servisi desteği:
  - OpenAI (ChatGPT)
  - Anthropic (Claude)
  - DeepSeek
- Gerçek zamanlı sohbet arayüzü
- Güvenli API key yönetimi (tarayıcı üzerinden)
- Modern ve responsive tasarım
- Markdown desteği
- Kolay kullanımlı arayüz

## Teknolojiler

- React + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui

## Kullanım

1. Uygulamayı başlatın
2. İstediğiniz AI servisini seçin (OpenAI, Anthropic, DeepSeek)
3. İlgili servisin API anahtarını uygulama üzerinden girin
4. Sohbete başlayın

## Geliştirme

```bash
# Geliştirme sunucusunu başlatın
npm run dev

# Derleme
npm run build

# Derlenen uygulamayı önizleyin
npm run preview

# Lint kontrolü
npm run lint
```

## Katkıda Bulunma

1. Bu repoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: XYZ'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## Lisans

MIT

## İletişim

- GitHub: [@username](https://github.com/username)
- Email: email@example.com
