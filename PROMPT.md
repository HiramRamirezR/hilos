# Descripción del Proyecto: Generador de String Art Personalizado

Este proyecto consiste en una aplicación web para generar y vender arte de cuerdas personalizado a partir de fotos subidas por los usuarios.

## Estructura del Proyecto

El proyecto se divide en las siguientes partes:

1.  **`static/` (Frontend):**
    * `index.html`: Interfaz principal donde los usuarios suben y procesan sus fotos.
    * `script.js`: Lógica de la aplicación frontend.
    * `styles.css`: Estilos para la interfaz de usuario.
    * **Funcionalidad pendiente:**
        * Integración de Stripe para procesar pagos.
        * Creación de cuentas de usuario mediante correo electrónico.
        * Envío de enlaces personalizados a la "mini app" después del pago.

2.  **`thread_viewer/` (Visualizador de Hilos):**
    * `index.html`: Interfaz para visualizar la secuencia de hilos.
    * `script.js`: Lógica para renderizar la secuencia de hilos en un círculo de colores.
    * `styles.css`: Estilos para el visualizador de hilos.
    * **Entrada de datos:**
        * Recibe un archivo JSON con la secuencia de hilos.

3.  **`app.py` (Backend):**
    * Servidor Uvicorn para pruebas locales.
    * **Funcionalidad pendiente:**
        * Endpoints para procesar pagos y crear cuentas.
        * Generación y envío de correos electrónicos con enlaces personalizados.

4.  **`hilos.py` (Lógica de Procesamiento de Imágenes):**
    * Contiene la lógica para convertir imágenes a secuencias de hilos y generar archivos JSON.

## Requerimientos

* **Integración de Pagos:**
    * Implementar una pasarela de pago con Stripe en `static/index.html`.
    * Crear endpoints en `app.py` para procesar pagos y gestionar transacciones.
* **Gestión de Usuarios:**
    * Permitir a los usuarios crear cuentas con su correo electrónico durante el proceso de compra.
    * Almacenar la información del usuario de forma segura.
* **Generación y Envío de Enlaces Personalizados:**
    * Después de un pago exitoso, generar un enlace único para el visualizador de hilos (`thread_viewer/`).
    * Enviar este enlace al correo electrónico del usuario.
    * Asegurar que el enlace sea seguro y no permita el acceso no autorizado.
* **Visualizador de Hilos:**
    * Asegurar que `thread_viewer/` pueda renderizar correctamente la secuencia de hilos a partir del archivo JSON generado por `hilos.py`.
    * Implementar una interfaz clara y fácil de seguir para el usuario.
* **Seguridad:**
    * Proteger las transacciones de pago y la información del usuario.
    * Prevenir el acceso no autorizado a los enlaces personalizados.

## Tareas Específicas

1.  Integrar la API de Stripe en `static/index.html` para permitir pagos.
2.  Desarrollar los endpoints necesarios en `app.py` para procesar pagos y crear cuentas.
3.  Implementar la lógica para generar y enviar correos electrónicos con enlaces personalizados.
4.  Asegurar que `thread_viewer/` pueda renderizar la secuencia de hilos correctamente.
5.  Implementar medidas de seguridad para proteger las transacciones y la información del usuario.

## Consideraciones Adicionales

* Asegurarse de que la aplicación sea responsiva y funcione correctamente en diferentes dispositivos.
* Implementar pruebas unitarias y de integración para garantizar la calidad del código.
* Documentar el código y la arquitectura del proyecto para facilitar el mantenimiento y la escalabilidad.