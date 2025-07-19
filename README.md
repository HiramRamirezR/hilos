# Hilos - Generador de Imágenes de Hilos

"Hilos" es una aplicación web que permite a los usuarios transformar sus imágenes en impresionantes obras de arte generadas con "hilos" (thread art). La aplicación ofrece una interfaz intuitiva para subir imágenes, previsualizar el resultado y, opcionalmente, adquirir un kit físico para crear la obra de arte en la vida real.

## Características

*   **Generación de Imágenes de Hilos:** Convierte cualquier imagen subida en una representación artística de hilos.
*   **Previsualización en Tiempo Real:** Permite a los usuarios ver cómo se verá su imagen transformada antes de finalizar.
*   **Integración de Pagos con Stripe:** Facilita un proceso de compra seguro para adquirir el kit de hilos.
*   **Confirmación por Correo Electrónico:** Envía un correo electrónico al usuario con un enlace único a un visor personalizado de su imagen de hilos.
*   **Visor de Hilos Personalizado:** Una aplicación web dedicada donde los usuarios pueden ver su imagen de hilos generada y los datos asociados para replicarla.
*   **Persistencia de Datos:** Utiliza una base de datos para almacenar información de usuarios y compras.

## Tecnologías Utilizadas

### Backend

*   **FastAPI:** Framework web de alto rendimiento para construir APIs.
*   **Python:** Lenguaje de programación principal.
*   **OpenCV (`opencv-python-headless`):** Para el procesamiento de imágenes y la lógica de generación de hilos.
*   **NumPy:** Para operaciones numéricas eficientes.
*   **Pillow:** Biblioteca de procesamiento de imágenes.
*   **Uvicorn:** Servidor ASGI para ejecutar la aplicación FastAPI.
*   **SQLAlchemy:** ORM para interactuar con la base de datos.
*   **Pydantic:** Para la validación de datos y la gestión de configuraciones.
*   **`python-dotenv`:** Para la gestión de variables de entorno.
*   **Stripe:** Para el procesamiento de pagos.
*   **`smtplib`:** Para el envío de correos electrónicos de confirmación.

### Frontend

*   **HTML5:** Estructura de la página web.
*   **CSS3:** Estilos y diseño responsivo.
*   **JavaScript:** Lógica interactiva del lado del cliente, incluyendo la carga de imágenes, la simulación de progreso y la integración con la API.
*   **Font Awesome:** Iconos.

## Configuración del Entorno

Sigue estos pasos para configurar y ejecutar el proyecto localmente:

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/hilos.git
cd hilos
```

### 2. Crear y Activar un Entorno Virtual

Es altamente recomendable usar un entorno virtual para gestionar las dependencias del proyecto.

```bash
# Para Windows
python -m venv venv
.\venv\Scripts\activate

# Para macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar Dependencias

Una vez activado el entorno virtual, instala todas las dependencias listadas en `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables. Asegúrate de reemplazar los valores de ejemplo con tus propias claves de Stripe y credenciales de correo electrónico.

```dotenv
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password # Usa una contraseña de aplicación si usas Gmail
FROM_EMAIL_ADDRESS=your_email@gmail.com
BASE_URL=http://localhost:8000 # O la URL de tu despliegue
```

*   **`STRIPE_SECRET_KEY`** y **`STRIPE_PUBLISHABLE_KEY`**: Obtén estas claves desde tu panel de control de Stripe.
*   **`EMAIL_HOST`**, **`EMAIL_PORT`**, **`EMAIL_USERNAME`**, **`EMAIL_PASSWORD`**, **`FROM_EMAIL_ADDRESS`**: Configura estos para tu proveedor de correo electrónico. Para Gmail, necesitarás generar una "contraseña de aplicación" si tienes la verificación en dos pasos activada.
*   **`BASE_URL`**: La URL base de tu aplicación. Para desarrollo local, `http://localhost:8000` es suficiente.

### 5. Inicializar la Base de Datos

Las tablas de la base de datos se crearán automáticamente al iniciar la aplicación por primera vez, gracias a `Base.metadata.create_all(bind=engine)` en `app.py`.

## Ejecutar la Aplicación

Para iniciar el servidor de desarrollo, ejecuta el siguiente comando desde la raíz del proyecto:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

*   `--host 0.0.0.0`: Hace que la aplicación sea accesible desde otras máquinas en tu red local.
*   `--port 8000`: Define el puerto en el que se ejecutará la aplicación. Puedes cambiarlo si es necesario.
*   `--reload`: Reinicia el servidor automáticamente cada vez que detecta cambios en el código (útil para desarrollo).

La aplicación estará disponible en `http://localhost:8000`.

## Uso

1.  **Accede a la Aplicación:** Abre tu navegador y ve a `http://localhost:8000`.
2.  **Sube una Imagen:** Haz clic en "Selecciona una imagen" y elige una foto. Se recomienda una imagen cuadrada y con un sujeto bien enfocado para mejores resultados.
3.  **Genera la Imagen de Hilos:** Una vez que la imagen se cargue, haz clic en "Generar Imagen de Hilos". Verás una barra de progreso mientras la imagen se procesa.
4.  **Previsualiza y Compra:** Después de la generación, verás la imagen de hilos resultante. Si estás satisfecho, puedes hacer clic en "Comprar el kit con esta imagen" para proceder al pago a través de Stripe.
5.  **Confirmación y Visor:** Tras una compra exitosa, recibirás un correo electrónico con un enlace único a tu visor de hilos personalizado, donde podrás ver y descargar tu imagen, así como acceder a los datos para crearla físicamente.

## Estructura del Proyecto

*   `app.py`: El archivo principal de la aplicación FastAPI, maneja las rutas, la lógica de negocio y la integración con Stripe y el correo electrónico.
*   `hilos.py`: Contiene la lógica central para la generación de imágenes de hilos.
*   `database.py`: Configuración de la base de datos y la sesión de SQLAlchemy.
*   `models.py`: Define los modelos de la base de datos (Usuario, Compra).
*   `requirements.txt`: Lista de dependencias de Python.
*   `Procfile`: Configuración para despliegues en plataformas como Heroku.
*   `static/`: Contiene los archivos estáticos del frontend (HTML, CSS, JavaScript) para la página principal y la página de éxito.
    *   `index.html`: Página principal de la aplicación.
    *   `script.js`: Lógica JavaScript para la interacción del usuario.
    *   `styles.css`: Estilos CSS de la aplicación.
    *   `success.html`: Página de éxito después de un pago.
    *   `success.js`: Lógica JavaScript para la página de éxito.
*   `thread_outputs/`: Directorio donde se guardan las imágenes de hilos generadas y los archivos JSON de secuencia.
*   `thread_viewer/`: Contiene los archivos para la aplicación del visor de hilos personalizado.
    *   `index.html`: Página principal del visor.
    *   `script.js`: Lógica JavaScript para el visor.
    *   `styles.css`: Estilos CSS del visor.

## Despliegue

El `Procfile` está configurado para facilitar el despliegue en plataformas que soportan el formato Procfile (como Heroku). Asegúrate de configurar las variables de entorno necesarias en tu plataforma de despliegue.
