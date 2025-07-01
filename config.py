"""
Configuración optimizada para reducir uso de memoria en producción
"""
import os

# Configuración de memoria
MEMORY_OPTIMIZATIONS = {
    # Configuración para PIL/Pillow
    'PIL_MAX_IMAGE_PIXELS': 50000000,  # Limitar tamaño máximo de imagen
    
    # Configuración para NumPy
    'NUMPY_MEMORY_LIMIT': '256MB',
    
    # Configuración para OpenCV
    'OPENCV_MEMORY_LIMIT': True,
    
    # Configuración de garbage collection
    'GC_THRESHOLD': (700, 10, 10),  # Más agresivo que el default
}

# Configuración de archivos temporales
TEMP_CONFIG = {
    'MAX_UPLOAD_SIZE': 10 * 1024 * 1024,  # 10MB máximo
    'CLEANUP_INTERVAL': 300,  # Limpiar archivos cada 5 minutos
    'MAX_TEMP_FILES': 5,  # Máximo 5 archivos temporales
}

# Configuración de procesamiento
PROCESSING_CONFIG = {
    'DEFAULT_PINS': 180,
    'DEFAULT_LINES': 4500,
    'MAX_PINS': 240,
    'MAX_LINES': 6000,
    'DEFAULT_PIXEL_WIDTH': 500,
}

def apply_memory_optimizations():
    """Aplicar optimizaciones de memoria al sistema"""
    import gc
    
    # Configurar garbage collection más agresivo
    gc.set_threshold(*MEMORY_OPTIMIZATIONS['GC_THRESHOLD'])
    
    # Configurar PIL para usar menos memoria
    try:
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = MEMORY_OPTIMIZATIONS['PIL_MAX_IMAGE_PIXELS']
    except ImportError:
        pass
    
    # Configurar variables de entorno para optimización
    os.environ['PYTHONHASHSEED'] = '0'  # Reproducibilidad
    os.environ['MALLOC_TRIM_THRESHOLD_'] = '100000'  # Liberar memoria más frecuentemente
    
def cleanup_temp_files(output_dir):
    """Limpiar archivos temporales antiguos"""
    import time
    import glob
    
    if not os.path.exists(output_dir):
        return
    
    current_time = time.time()
    temp_files = glob.glob(os.path.join(output_dir, "*"))
    
    # Eliminar archivos más antiguos que CLEANUP_INTERVAL
    for file_path in temp_files:
        if os.path.isfile(file_path):
            file_age = current_time - os.path.getmtime(file_path)
            if file_age > TEMP_CONFIG['CLEANUP_INTERVAL']:
                try:
                    os.remove(file_path)
                except OSError:
                    pass  # Ignorar errores de eliminación
