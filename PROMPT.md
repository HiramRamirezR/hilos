# Descripción del Proyecto: Generador de String Art Personalizado

Este proyecto consiste en una aplicación web para generar y vender arte de cuerdas personalizado a partir de fotos subidas por los usuarios.

## Estructura del Proyecto

El proyecto se divide en las siguientes partes:

1. **`static/` (Frontend):**
   * `index.html`: Interfaz principal donde los usuarios suben y procesan sus fotos.
   * `script.js`: Lógica de la aplicación frontend.
   * `styles.css`: Estilos para la interfaz de usuario.
   * **Implementado:**
       * Subida y procesamiento de imágenes.
       * Integración básica de Stripe para pagos.
   * **Funcionalidad pendiente:**
       * Botón "Comprar esta imagen" junto a la imagen generada.
       * Formulario de registro post-pago.
       * Mostrar confirmación y siguiente pasos después del registro.

2. **`thread_viewer/` (Visualizador de Hilos):**
   * `index.html`: Interfaz para visualizar la secuencia de hilos.
   * `script.js`: Lógica para renderizar la secuencia de hilos en un círculo.
   * `styles.css`: Estilos para el visualizador de hilos.
   * **Funcionalidad pendiente:**
       * Asegurar acceso único por usuario registrado.
       * Cargar JSON específico de la imagen comprada.

3. **`app.py` (Backend):**
   * Servidor FastAPI con endpoints básicos implementados.
   * Integración con Stripe funcionando.
   * **Funcionalidad pendiente:**
       * Base de datos para usuarios y compras.
       * Endpoint para registro de usuarios.
       * Sistema de generación de links únicos.
       * Envío de correos electrónicos.

4. **`hilos.py` (Lógica de Procesamiento de Imágenes):**
   * Contiene la lógica para convertir imágenes a secuencias de hilos.
   * Generación de archivos JSON implementada.

## Flujo de Usuario

1. **Generación de Imagen (Implementado)**
   * Usuario sube una foto
   * Sistema genera versión en hilos
   * Usuario puede repetir el proceso hasta estar satisfecho

2. **Proceso de Compra (Pendiente)**
   * Usuario hace clic en "Comprar esta imagen"
   * Realiza pago con Stripe
   * Completa formulario de registro con:
     - Nombre
     - Teléfono
     - Correo
     - Dirección completa
   * Recibe correo con link único al visualizador

## Tareas Específicas

1. **Frontend (Próximos pasos)**
   * Agregar botón de compra junto a imagen generada
   * Crear formulario de registro post-pago
   * Implementar UI para confirmaciones y mensajes

2. **Backend (Pendiente)**
   * Diseñar e implementar base de datos
   * Crear sistema de autenticación
   * Implementar generación de links únicos
   * Configurar sistema de correos

3. **Seguridad**
   * Proteger rutas del visualizador
   * Validar accesos a links únicos
   * Asegurar datos de usuario

## Consideraciones Técnicas

* Base de datos para almacenar:
  - Información de usuarios
  - Registro de compras
  - Links únicos generados
* Sistema de correos para envío de links
* Validaciones de formularios
* Manejo de errores en pagos y registro
