const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const thumbnailsDir = path.join(__dirname, 'uploads', 'thumbnails');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Geçersiz dosya türü. Sadece JPG, PNG, GIF ve WebP desteklenir.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload single image
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi' });
        }

        const imageData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: `/uploads/${req.file.filename}`,
            uploadDate: new Date().toISOString()
        };

        // Generate thumbnail if requested
        if (req.body.generateThumbnail === 'true') {
            const thumbnailPath = path.join(thumbnailsDir, req.file.filename);
            
            await sharp(req.file.path)
                .resize(200, 200, { fit: 'cover' })
                .toFile(thumbnailPath);
            
            imageData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
        }

        // Optimize image if requested
        if (req.body.optimize === 'true') {
            const sharpInstance = sharp(req.file.path);
            
            // Apply optimization based on file type
            if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg') {
                await sharpInstance.jpeg({ quality: 80 }).toFile(req.file.path + '.optimized');
            } else if (req.file.mimetype === 'image/png') {
                await sharpInstance.png({ compressionLevel: 9 }).toFile(req.file.path + '.optimized');
            } else {
                // For other formats, just optimize without specific options
                await sharpInstance.toFile(req.file.path + '.optimized');
            }
            
            fs.renameSync(req.file.path + '.optimized', req.file.path);
        }

        res.json({
            success: true,
            message: 'Dosya başarıyla yüklendi',
            data: imageData
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Dosya yüklenirken hata oluştu',
            message: error.message 
        });
    }
});

// Upload multiple images
app.post('/api/upload-multiple', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Dosya yüklenmedi' });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            const imageData = {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                path: `/uploads/${file.filename}`,
                uploadDate: new Date().toISOString()
            };

            // Generate thumbnail if requested
            if (req.body.generateThumbnail === 'true') {
                const thumbnailPath = path.join(thumbnailsDir, file.filename);
                
                await sharp(file.path)
                    .resize(200, 200, { fit: 'cover' })
                    .toFile(thumbnailPath);
                
                imageData.thumbnail = `/uploads/thumbnails/${file.filename}`;
            }

            uploadedFiles.push(imageData);
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
            data: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Dosyalar yüklenirken hata oluştu',
            message: error.message 
        });
    }
});

// Get all uploaded images
app.get('/api/images', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir).filter(file => {
            return !fs.statSync(path.join(uploadsDir, file)).isDirectory();
        });

        const images = files.map(filename => {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            
            return {
                filename: filename,
                path: `/uploads/${filename}`,
                size: stats.size,
                uploadDate: stats.birthtime
            };
        });

        res.json({
            success: true,
            count: images.length,
            data: images
        });
    } catch (error) {
        console.error('Error listing images:', error);
        res.status(500).json({ 
            success: false,
            error: 'Resimler listelenirken hata oluştu' 
        });
    }
});

// Delete image
app.delete('/api/images/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);
        const thumbnailPath = path.join(thumbnailsDir, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            
            // Delete thumbnail if exists
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
            
            res.json({
                success: true,
                message: 'Dosya başarıyla silindi'
            });
        } else {
            res.status(404).json({ 
                success: false,
                error: 'Dosya bulunamadı' 
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Dosya silinirken hata oluştu' 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: error.message || 'Sunucu hatası'
    });
});

app.listen(PORT, () => {
    console.log(`E-Ticaret Resim Yükleme Sunucusu ${PORT} portunda çalışıyor`);
    console.log(`http://localhost:${PORT} adresine gidin`);
});

module.exports = app;
