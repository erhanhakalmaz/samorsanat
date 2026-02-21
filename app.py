from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
import os
import time
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
THUMBNAIL_FOLDER = os.path.join(UPLOAD_FOLDER, 'thumbnails')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(THUMBNAIL_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_thumbnail(image_path, thumbnail_path, size=(200, 200)):
    """Generate a thumbnail from the uploaded image"""
    try:
        with Image.open(image_path) as img:
            img.thumbnail(size, Image.Resampling.LANCZOS)
            img.save(thumbnail_path, quality=85, optimize=True)
        return True
    except Exception as e:
        print(f"Thumbnail generation error: {e}")
        return False


def optimize_image(image_path):
    """Optimize the uploaded image"""
    try:
        with Image.open(image_path) as img:
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            
            img.save(image_path, quality=80, optimize=True)
        return True
    except Exception as e:
        print(f"Image optimization error: {e}")
        return False


@app.route('/')
def index():
    return send_file('index.html')


@app.route('/style.css')
def style():
    return send_file('style.css')


@app.route('/upload.js')
def script():
    return send_file('upload.js')


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a single image"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'Dosya yüklenmedi'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Dosya seçilmedi'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False, 
                'error': 'Geçersiz dosya türü. Sadece JPG, PNG, GIF ve WebP desteklenir.'
            }), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        timestamp = str(int(time.time() * 1000))
        unique_filename = f"{name}_{timestamp}{ext}"
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        
        image_data = {
            'filename': unique_filename,
            'originalName': filename,
            'size': file_size,
            'path': f'/uploads/{unique_filename}',
            'uploadDate': datetime.now().isoformat()
        }
        
        # Generate thumbnail if requested
        if request.form.get('generateThumbnail') == 'true':
            thumbnail_path = os.path.join(THUMBNAIL_FOLDER, unique_filename)
            if generate_thumbnail(filepath, thumbnail_path):
                image_data['thumbnail'] = f'/uploads/thumbnails/{unique_filename}'
        
        # Optimize image if requested
        if request.form.get('optimize') == 'true':
            optimize_image(filepath)
        
        return jsonify({
            'success': True,
            'message': 'Dosya başarıyla yüklendi',
            'data': image_data
        })
    
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({
            'success': False,
            'error': 'Dosya yüklenirken hata oluştu',
            'message': str(e)
        }), 500


@app.route('/api/upload-multiple', methods=['POST'])
def upload_multiple_files():
    """Upload multiple images"""
    try:
        if 'images' not in request.files:
            return jsonify({'success': False, 'error': 'Dosya yüklenmedi'}), 400
        
        files = request.files.getlist('images')
        uploaded_files = []
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                timestamp = str(int(time.time() * 1000))
                unique_filename = f"{name}_{timestamp}{ext}"
                
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                
                file_size = os.path.getsize(filepath)
                
                image_data = {
                    'filename': unique_filename,
                    'originalName': filename,
                    'size': file_size,
                    'path': f'/uploads/{unique_filename}',
                    'uploadDate': datetime.now().isoformat()
                }
                
                # Generate thumbnail if requested
                if request.form.get('generateThumbnail') == 'true':
                    thumbnail_path = os.path.join(THUMBNAIL_FOLDER, unique_filename)
                    if generate_thumbnail(filepath, thumbnail_path):
                        image_data['thumbnail'] = f'/uploads/thumbnails/{unique_filename}'
                
                uploaded_files.append(image_data)
        
        return jsonify({
            'success': True,
            'message': f'{len(uploaded_files)} dosya başarıyla yüklendi',
            'data': uploaded_files
        })
    
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({
            'success': False,
            'error': 'Dosyalar yüklenirken hata oluştu',
            'message': str(e)
        }), 500


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/uploads/thumbnails/<path:filename>')
def thumbnail_file(filename):
    """Serve thumbnail files"""
    return send_from_directory(THUMBNAIL_FOLDER, filename)


@app.route('/api/images', methods=['GET'])
def list_images():
    """List all uploaded images"""
    try:
        files = [f for f in os.listdir(UPLOAD_FOLDER) 
                if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))]
        
        images = []
        for filename in files:
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            stat = os.stat(filepath)
            
            images.append({
                'filename': filename,
                'path': f'/uploads/{filename}',
                'size': stat.st_size,
                'uploadDate': datetime.fromtimestamp(stat.st_ctime).isoformat()
            })
        
        return jsonify({
            'success': True,
            'count': len(images),
            'data': images
        })
    
    except Exception as e:
        print(f"Error listing images: {e}")
        return jsonify({
            'success': False,
            'error': 'Resimler listelenirken hata oluştu'
        }), 500


@app.route('/api/images/<filename>', methods=['DELETE'])
def delete_image(filename):
    """Delete an uploaded image"""
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        thumbnail_path = os.path.join(THUMBNAIL_FOLDER, filename)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            
            # Delete thumbnail if exists
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)
            
            return jsonify({
                'success': True,
                'message': 'Dosya başarıyla silindi'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Dosya bulunamadı'
            }), 404
    
    except Exception as e:
        print(f"Delete error: {e}")
        return jsonify({
            'success': False,
            'error': 'Dosya silinirken hata oluştu'
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'success': False,
        'error': 'Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.'
    }), 413


if __name__ == '__main__':
    print("E-Ticaret Resim Yükleme Sunucusu başlatılıyor...")
    print("http://localhost:5000 adresine gidin")
    app.run(debug=True, host='0.0.0.0', port=5000)
