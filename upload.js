// E-Commerce Image Upload Manager
class ImageUploadManager {
    constructor() {
        this.uploadedImages = [];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.stats = {
            total: 0,
            success: 0,
            error: 0
        };
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadStoredImages();
    }
    
    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.imageGrid = document.getElementById('imageGrid');
        this.uploadStats = document.getElementById('uploadStats');
        this.optimizeCheckbox = document.getElementById('optimizeImages');
        this.thumbnailCheckbox = document.getElementById('generateThumbnails');
    }
    
    attachEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Drag and drop
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
    }
    
    handleFiles(files) {
        const fileArray = Array.from(files);
        
        fileArray.forEach(file => {
            if (this.validateFile(file)) {
                this.processFile(file);
            } else {
                this.showError(`Geçersiz dosya: ${file.name}`);
                this.stats.error++;
            }
        });
        
        this.updateStats();
    }
    
    validateFile(file) {
        if (!this.allowedTypes.includes(file.type)) {
            alert(`${file.name} geçersiz dosya türü. Sadece JPG, PNG, GIF ve WebP desteklenir.`);
            return false;
        }
        
        if (file.size > this.maxFileSize) {
            alert(`${file.name} çok büyük. Maksimum dosya boyutu 5MB'dır.`);
            return false;
        }
        
        return true;
    }
    
    processFile(file) {
        this.stats.total++;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: this.formatFileSize(file.size),
                type: file.type,
                url: e.target.result,
                uploadDate: new Date().toISOString(),
                optimized: this.optimizeCheckbox.checked,
                hasThumbnail: this.thumbnailCheckbox.checked
            };
            
            this.uploadedImages.push(imageData);
            this.stats.success++;
            this.saveToStorage();
            this.renderImage(imageData);
            this.updateStats();
        };
        
        reader.onerror = () => {
            this.stats.error++;
            this.showError(`${file.name} yüklenirken hata oluştu.`);
            this.updateStats();
        };
        
        reader.readAsDataURL(file);
    }
    
    renderImage(imageData) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.dataset.id = imageData.id;
        
        imageItem.innerHTML = `
            <img src="${imageData.url}" alt="${imageData.name}">
            <span class="status-badge status-success">Yüklendi</span>
            <div class="image-info">
                <div class="image-name" title="${imageData.name}">${this.truncateName(imageData.name)}</div>
                <div class="image-size">${imageData.size}</div>
                <div class="image-actions">
                    <button class="btn-action btn-download" onclick="imageManager.downloadImage('${imageData.id}')">
                        İndir
                    </button>
                    <button class="btn-action btn-delete" onclick="imageManager.deleteImage('${imageData.id}')">
                        Sil
                    </button>
                </div>
            </div>
        `;
        
        this.imageGrid.appendChild(imageItem);
        
        // Animate entrance
        setTimeout(() => {
            imageItem.style.opacity = '0';
            imageItem.style.transform = 'scale(0.8)';
            imageItem.style.transition = 'all 0.3s ease';
            
            requestAnimationFrame(() => {
                imageItem.style.opacity = '1';
                imageItem.style.transform = 'scale(1)';
            });
        }, 10);
    }
    
    deleteImage(id) {
        if (confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
            const index = this.uploadedImages.findIndex(img => img.id == id);
            
            if (index !== -1) {
                this.uploadedImages.splice(index, 1);
                this.stats.success--;
                this.saveToStorage();
                
                const imageItem = document.querySelector(`[data-id="${id}"]`);
                if (imageItem) {
                    imageItem.style.transform = 'scale(0.8)';
                    imageItem.style.opacity = '0';
                    
                    setTimeout(() => {
                        imageItem.remove();
                        this.updateStats();
                    }, 300);
                }
            }
        }
    }
    
    downloadImage(id) {
        const image = this.uploadedImages.find(img => img.id == id);
        
        if (image) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = image.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    truncateName(name, maxLength = 30) {
        if (name.length <= maxLength) return name;
        
        const extension = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
        
        return truncated + '.' + extension;
    }
    
    updateStats() {
        if (this.stats.total > 0) {
            this.uploadStats.style.display = 'flex';
            document.getElementById('totalFiles').textContent = this.stats.total;
            document.getElementById('successCount').textContent = this.stats.success;
            document.getElementById('errorCount').textContent = this.stats.error;
        } else {
            this.uploadStats.style.display = 'none';
        }
    }
    
    showError(message) {
        console.error(message);
        // Could implement a toast notification here
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('uploadedImages', JSON.stringify(this.uploadedImages));
        } catch (e) {
            console.error('LocalStorage kaydetme hatası:', e);
        }
    }
    
    loadStoredImages() {
        try {
            const stored = localStorage.getItem('uploadedImages');
            
            if (stored) {
                this.uploadedImages = JSON.parse(stored);
                this.stats.total = this.uploadedImages.length;
                this.stats.success = this.uploadedImages.length;
                
                this.uploadedImages.forEach(imageData => {
                    this.renderImage(imageData);
                });
                
                this.updateStats();
            }
        } catch (e) {
            console.error('LocalStorage yükleme hatası:', e);
        }
    }
}

// Initialize the upload manager when DOM is ready
let imageManager;

document.addEventListener('DOMContentLoaded', () => {
    imageManager = new ImageUploadManager();
});
