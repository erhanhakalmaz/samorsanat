# E-Ticaret Resim Yükleme Sistemi

E-ticaret siteleri için modern ve kullanıcı dostu resim yükleme sistemi.

## Özellikler

✨ **Temel Özellikler:**
- 🖼️ Çoklu resim yükleme desteği
- 🎨 Drag & Drop (Sürükle-Bırak) özelliği
- 📱 Mobil uyumlu responsive tasarım
- 🔍 Resim önizleme
- 💾 LocalStorage ile otomatik kaydetme
- 📊 Yükleme istatistikleri

✨ **Gelişmiş Özellikler:**
- 🗜️ Otomatik resim optimizasyonu
- 🖼️ Küçük resim (thumbnail) oluşturma
- ✅ Dosya tipi ve boyutu kontrolü (Max: 5MB)
- 💻 İki farklı backend seçeneği (Node.js & Python)
- 🎯 RESTful API

## Desteklenen Dosya Formatları

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Kurulum

### Frontend (Sadece HTML/CSS/JS)

Basit bir HTTP sunucusu ile çalıştırabilirsiniz:

```bash
# Python ile
python -m http.server 8000

# Node.js ile
npx serve
```

Tarayıcınızda `http://localhost:8000` adresine gidin.

### Backend Seçenek 1: Node.js

1. Gerekli paketleri yükleyin:
```bash
npm install
```

2. Sunucuyu başlatın:
```bash
npm start
```

3. Geliştirme modu için:
```bash
npm run dev
```

Sunucu `http://localhost:3000` adresinde çalışacaktır.

### Backend Seçenek 2: Python Flask

1. Sanal ortam oluşturun (opsiyonel):
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Gerekli paketleri yükleyin:
```bash
pip install -r requirements.txt
```

3. Sunucuyu başlatın:
```bash
python app.py
```

Sunucu `http://localhost:5000` adresinde çalışacaktır.

## API Dokümantasyonu

### 1. Tek Resim Yükleme

**Endpoint:** `POST /api/upload`

**Form Data:**
- `image`: Yüklenecek resim dosyası
- `optimize`: (opsiyonel) "true" - Resmi optimize et
- `generateThumbnail`: (opsiyonel) "true" - Küçük resim oluştur

**Yanıt:**
```json
{
  "success": true,
  "message": "Dosya başarıyla yüklendi",
  "data": {
    "filename": "image_1234567890.jpg",
    "originalName": "image.jpg",
    "size": 245678,
    "path": "/uploads/image_1234567890.jpg",
    "thumbnail": "/uploads/thumbnails/image_1234567890.jpg",
    "uploadDate": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. Çoklu Resim Yükleme

**Endpoint:** `POST /api/upload-multiple`

**Form Data:**
- `images`: Yüklenecek resim dosyaları (array)
- `optimize`: (opsiyonel) "true"
- `generateThumbnail`: (opsiyonel) "true"

**Yanıt:**
```json
{
  "success": true,
  "message": "3 dosya başarıyla yüklendi",
  "data": [
    {
      "filename": "image1_1234567890.jpg",
      "originalName": "image1.jpg",
      "size": 245678,
      "path": "/uploads/image1_1234567890.jpg",
      "uploadDate": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 3. Resimleri Listele

**Endpoint:** `GET /api/images`

**Yanıt:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "filename": "image_1234567890.jpg",
      "path": "/uploads/image_1234567890.jpg",
      "size": 245678,
      "uploadDate": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 4. Resim Sil

**Endpoint:** `DELETE /api/images/:filename`

**Yanıt:**
```json
{
  "success": true,
  "message": "Dosya başarıyla silindi"
}
```

## Kullanım

### Temel Kullanım

1. **Dosya Seçimi:** "Dosya Seç" butonuna tıklayın veya resimleri sürükleyip bırakın
2. **Yükleme:** Resimler otomatik olarak önizlenir
3. **Yönetim:** Her resim için indirme veya silme işlemi yapabilirsiniz

### JavaScript Entegrasyonu

```javascript
// Yeni bir resim yükle
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('optimize', 'true');
formData.append('generateThumbnail', 'true');

fetch('/api/upload', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Yüklendi:', data);
});
```

## Dizin Yapısı

```
samorsanat/
├── index.html           # Ana HTML dosyası
├── style.css           # CSS stil dosyası
├── upload.js           # Frontend JavaScript
├── server.js           # Node.js backend
├── app.py              # Python Flask backend
├── package.json        # Node.js bağımlılıklar
├── requirements.txt    # Python bağımlılıklar
├── README.md           # Bu dosya
├── uploads/            # Yüklenen resimler (otomatik oluşur)
│   └── thumbnails/    # Küçük resimler
└── node_modules/       # Node.js paketleri (git'e eklenmez)
```

## Güvenlik

- Dosya boyutu maksimum 5MB ile sınırlandırılmıştır
- Sadece belirtilen resim formatları kabul edilir
- Dosya isimleri güvenli hale getirilir
- CORS koruması aktiftir

## Tarayıcı Desteği

- Chrome (son 2 versiyon)
- Firefox (son 2 versiyon)
- Safari (son 2 versiyon)
- Edge (son 2 versiyon)

## Katkıda Bulunma

1. Bu repository'i fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

MIT License

## İletişim

Proje Sahibi: [E-Ticaret Resim Yükleme]
Repository: https://github.com/erhanhakalmaz/samorsanat

## Gelecek Özellikler

- [ ] Resim düzenleme (crop, rotate, filter)
- [ ] Toplu resim silme
- [ ] Resim sıralama ve kategorileme
- [ ] Cloud storage entegrasyonu (AWS S3, Google Cloud)
- [ ] Watermark ekleme
- [ ] Resim sıkıştırma seviyeleri
- [ ] Batch upload progress bar
- [ ] Image metadata editing

## Sorun Giderme

### Port zaten kullanımda hatası

Node.js için:
```bash
PORT=3001 npm start
```

Python için:
```bash
# app.py dosyasında port değiştirebilirsiniz
```

### Resimler yüklenmiyor

1. `uploads` klasörünün yazma izinleri olduğundan emin olun
2. Dosya boyutunun 5MB'dan küçük olduğunu kontrol edin
3. Desteklenen dosya formatlarını kullandığınızdan emin olun

### LocalStorage dolu hatası

Tarayıcı konsolunda:
```javascript
localStorage.clear();
```
