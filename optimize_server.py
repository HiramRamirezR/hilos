#!/usr/bin/env python3
"""
Script para optimizar el servidor para producción con memoria limitada
"""
import os
import sys
import subprocess

def optimize_python_environment():
    """Optimizar el entorno de Python para usar menos memoria"""
    
    # Variables de entorno para optimización
    optimizations = {
        'PYTHONHASHSEED': '0',  # Reproducibilidad
        'PYTHONOPTIMIZE': '2',  # Optimización máxima
        'PYTHONDONTWRITEBYTECODE': '1',  # No crear archivos .pyc
        'MALLOC_TRIM_THRESHOLD_': '100000',  # Liberar memoria más frecuentemente
        'MALLOC_MMAP_THRESHOLD_': '131072',  # Usar mmap para allocaciones grandes
        'PYTHONMALLOC': 'malloc',  # Usar malloc estándar
    }
    
    for key, value in optimizations.items():
        os.environ[key] = value
        print(f"✅ {key} = {value}")

def check_memory_requirements():
    """Verificar que el sistema tenga suficiente memoria"""
    try:
        import psutil
        memory = psutil.virtual_memory()
        available_gb = memory.available / (1024**3)
        
        print(f"💾 Memoria disponible: {available_gb:.2f} GB")
        
        if available_gb < 0.8:  # Menos de 800MB
            print("⚠️  ADVERTENCIA: Memoria baja. Considera optimizaciones adicionales.")
            return False
        else:
            print("✅ Memoria suficiente para el procesamiento.")
            return True
            
    except ImportError:
        print("📦 psutil no instalado. Instalando...")
        subprocess.run([sys.executable, "-m", "pip", "install", "psutil"])
        return check_memory_requirements()

def optimize_dependencies():
    """Optimizar dependencias para usar menos memoria"""
    
    # Configuraciones específicas para librerías
    optimizations = [
        "export OMP_NUM_THREADS=1",  # Limitar OpenMP a 1 thread
        "export OPENBLAS_NUM_THREADS=1",  # Limitar OpenBLAS
        "export MKL_NUM_THREADS=1",  # Limitar Intel MKL
        "export NUMEXPR_NUM_THREADS=1",  # Limitar NumExpr
    ]
    
    print("🔧 Aplicando optimizaciones de dependencias:")
    for opt in optimizations:
        print(f"   {opt}")
        key, value = opt.replace("export ", "").split("=")
        os.environ[key] = value

def create_startup_script():
    """Crear script optimizado para iniciar el servidor"""
    
    startup_script = """#!/bin/bash
# Script optimizado para iniciar el servidor con memoria limitada

# Optimizaciones de memoria
export PYTHONHASHSEED=0
export PYTHONOPTIMIZE=2
export PYTHONDONTWRITEBYTECODE=1
export MALLOC_TRIM_THRESHOLD_=100000
export MALLOC_MMAP_THRESHOLD_=131072
export PYTHONMALLOC=malloc

# Limitar threads de librerías científicas
export OMP_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export MKL_NUM_THREADS=1
export NUMEXPR_NUM_THREADS=1

# Iniciar servidor con configuración optimizada
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 1 --loop uvloop --http httptools
"""
    
    with open("start_optimized.sh", "w") as f:
        f.write(startup_script)
    
    # Hacer ejecutable
    os.chmod("start_optimized.sh", 0o755)
    print("✅ Script de inicio optimizado creado: start_optimized.sh")

def main():
    """Función principal"""
    print("🚀 Optimizando servidor para memoria limitada...\n")
    
    print("1. Optimizando entorno de Python...")
    optimize_python_environment()
    print()
    
    print("2. Verificando memoria del sistema...")
    memory_ok = check_memory_requirements()
    print()
    
    print("3. Optimizando dependencias...")
    optimize_dependencies()
    print()
    
    print("4. Creando script de inicio optimizado...")
    create_startup_script()
    print()
    
    if memory_ok:
        print("✅ ¡Optimización completada! El servidor debería usar menos memoria.")
        print("💡 Para iniciar el servidor optimizado, usa: ./start_optimized.sh")
    else:
        print("⚠️  Optimización completada con advertencias.")
        print("💡 Considera el plan de $7/mes de Render para mejor rendimiento.")

if __name__ == "__main__":
    main()
