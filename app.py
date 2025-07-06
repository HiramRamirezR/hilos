import os
import ssl
import uuid
import time
import stripe
import logging
import uvicorn
import smtplib
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from email.mime.text import MIMEText
from fastapi.staticfiles import StaticFiles
from email.mime.multipart import MIMEMultipart
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from hilos import generate_thread_image
from database import get_db, engine
from models import User, Purchase, Base

# Configuración de Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_51MZeZhFWYwy2FJ353OSQ58zQtmtKr52f1Ow9F1qdtUgMn8d0kqjcAElMXtsOqgufeCB9YchXp0RATaSAFx7FJahv00zlEq7BgO')

# Crear la aplicación FastAPI
app = FastAPI(
    title="Thread Image Generator",
    description="Generate thread-like representations of images",
    version="0.1.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/thread_viewer", StaticFiles(directory="thread_viewer"), name="thread_viewer")

# Asegurar que existe el directorio de salida
OUTPUT_DIR = "thread_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Crear las tablas de la base de datos
Base.metadata.create_all(bind=engine)



@app.get("/")
async def read_root():
    """Servir la página principal"""
    return FileResponse('static/index.html')

@app.post("/generate-thread-image/")
async def generate_thread_image_endpoint(
    file: UploadFile = File(...),
    pins: int = 240,
    lines: int = 3500
):
    """Generar imagen de hilos a partir de una imagen subida"""
    try:
        # Crear un nombre único para el archivo
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        file_extension = os.path.splitext(file.filename)[1]
        temp_filename = f"{timestamp}_{unique_id}{file_extension}"
        temp_path = os.path.join(OUTPUT_DIR, temp_filename)

        # Guardar el archivo temporalmente
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Generar la imagen de hilos (sin callback para mejor rendimiento)
        output_image_path, line_sequence_path = generate_thread_image(
            temp_path,
            output_dir=OUTPUT_DIR,
            pins=pins,
            lines=lines
        )

        # Eliminar el archivo temporal
        os.remove(temp_path)

        # Obtener el nombre del archivo de salida
        output_filename = os.path.basename(output_image_path)

        # Retornar la imagen generada
        return FileResponse(
            output_image_path,
            media_type="image/png",
            headers={"content-disposition": f"attachment; filename={output_filename}"}
        )

    except Exception as e:
        logger.error(f"Error generando imagen de hilos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class ImageData(BaseModel):
    filename: str
    pins: str
    lines: str
    originalFile: str = None

class UserRegistration(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    imageData: ImageData

class CheckoutRequest(BaseModel):
    imageData: ImageData

def send_confirmation_email(email: str, viewer_url: str):
    try:
        # Configuración desde variables de entorno
        smtp_server = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        port = int(os.getenv('EMAIL_PORT', '587'))
        sender_email = os.getenv('EMAIL_USERNAME')
        password = os.getenv('EMAIL_PASSWORD')

        if not sender_email or not password:
            logger.error("Credenciales de email no configuradas en variables de entorno")
            return

        message = MIMEMultipart("alternative")
        message["Subject"] = "¡Tu imagen de hilos está lista!"
        message["From"] = sender_email
        message["To"] = email

        # Construir URL completa
        base_url = os.getenv('BASE_URL', 'http://localhost:8000')
        full_viewer_url = f"{base_url}{viewer_url}"

        html = f"""
        <html>
          <body>
            <h2>¡Tu imagen de hilos está lista!</h2>
            <p>¡Gracias por tu compra! Tu imagen personalizada de hilos ha sido procesada exitosamente.</p>
            <p>Haz clic en el siguiente enlace para ver y descargar tu imagen:</p>
            <p><a href="{full_viewer_url}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver mi imagen de hilos</a></p>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p>{full_viewer_url}</p>
            <br>
            <p>¡Esperamos que disfrutes tu imagen personalizada!</p>
          </body>
        </html>
        """

        html_part = MIMEText(html, "html")
        message.attach(html_part)

        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls(context=context)
            server.login(sender_email, password)
            server.sendmail(sender_email, email, message.as_string())

    except Exception as e:
        logger.error(f"Error enviando correo: {str(e)}")
        pass

@app.post('/create-checkout-session')
async def create_checkout_session(request: CheckoutRequest):
    try:
        # Crear sesión de checkout en Stripe
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Imagen de Hilos - {request.imageData.pins} pines, {request.imageData.lines} líneas',
                        'description': f'Imagen personalizada generada con {request.imageData.pins} pines y {request.imageData.lines} líneas',
                    },
                    'unit_amount': 2500,  # $25.00 en centavos
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:8000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:8000/',
            metadata={
                'filename': request.imageData.filename,
                'pins': request.imageData.pins,
                'lines': request.imageData.lines,
                'original_file': request.imageData.originalFile or ''
            }
        )

        return {"checkout_url": checkout_session.url}

    except Exception as e:
        logger.error(f"Error creando sesión de checkout: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/success')
async def success_page():
    """Servir la página de éxito después del pago"""
    return FileResponse('static/success.html')

@app.post('/complete-registration')
async def complete_registration(
    request: dict,
    db: Session = Depends(get_db)
):
    """Completar el registro del usuario después del pago exitoso"""
    try:
        session_id = request.get('session_id')
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID requerido")

        # Verificar la sesión de pago con Stripe
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status != 'paid':
                raise HTTPException(status_code=400, detail="Pago no confirmado")
        except stripe.error.StripeError as e:
            logger.error(f"Error verificando sesión de Stripe: {str(e)}")
            raise HTTPException(status_code=400, detail="Sesión de pago inválida")

        # Extraer datos de la imagen desde los metadatos
        metadata = session.metadata
        image_data = ImageData(
            filename=metadata.get('filename', ''),
            pins=metadata.get('pins', ''),
            lines=metadata.get('lines', ''),
            originalFile=metadata.get('original_file', '')
        )

        # Crear datos de usuario
        user_data = UserRegistration(
            name=request.get('name'),
            email=request.get('email'),
            phone=request.get('phone'),
            address=request.get('address'),
            imageData=image_data
        )

        # Procesar el registro (reutilizar lógica existente)
        return await process_user_registration(user_data, db, session.payment_intent)

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error en complete_registration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_user_registration(user_data: UserRegistration, db: Session, payment_intent_id: str = None):
    """Función auxiliar para procesar el registro de usuario"""
    logger.info(f"Iniciando registro de usuario: {user_data.email}")
    logger.debug(f"Datos recibidos: {user_data.model_dump()}")

    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if not existing_user:
        logger.info("Creando nuevo usuario")
        user = User(
            name=user_data.name,
            email=user_data.email,
            phone=user_data.phone,
            address=user_data.address
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        logger.info("Usuario existente encontrado")
        user = existing_user

    # Construir las rutas de los archivos
    image_filename = user_data.imageData.filename
    base_filename = image_filename.replace('_output.png', '')

    # Buscar los archivos en el directorio OUTPUT_DIR
    image_path = os.path.join(OUTPUT_DIR, image_filename)
    json_path = os.path.join(OUTPUT_DIR, f"{base_filename}.json")

    logger.debug(f"Buscando imagen en: {image_path}")
    logger.debug(f"Buscando JSON en: {json_path}")

    if not os.path.exists(image_path):
        logger.error(f"Imagen no encontrada: {image_filename}")
        raise HTTPException(
            status_code=404,
            detail=f"Imagen no encontrada: {image_filename}"
        )

    if not os.path.exists(json_path):
        logger.error(f"Archivo JSON no encontrado: {base_filename}.json")
        raise HTTPException(
            status_code=404,
            detail=f"Archivo JSON no encontrado: {base_filename}.json"
        )

    # Crear registro de compra
    unique_link = str(uuid.uuid4())
    purchase = Purchase(
        user_id=user.id,
        unique_link=unique_link,
        image_path=image_path,
        json_path=json_path,
        payment_intent_id=payment_intent_id
    )
    db.add(purchase)
    db.commit()

    # Construir la URL del visualizador
    viewer_url = f"/viewer/{unique_link}"
    logger.info(f"URL del visualizador generada: {viewer_url}")

    # Enviar correo de confirmación
    send_confirmation_email(user.email, viewer_url)

    return {
        "status": "success",
        "message": "Usuario registrado correctamente",
        "viewer_url": viewer_url
    }

@app.get('/viewer/{unique_link}')
async def thread_viewer(unique_link: str, db: Session = Depends(get_db)):
    """Servir el thread viewer para un enlace único específico"""
    try:
        # Verificar que el enlace único existe en la base de datos
        purchase = db.query(Purchase).filter(Purchase.unique_link == unique_link).first()
        if not purchase:
            raise HTTPException(status_code=404, detail="Enlace no válido o expirado")

        # Servir la página del thread viewer
        return FileResponse('thread_viewer/index.html')

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error sirviendo thread viewer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/thread-data/{unique_link}')
async def get_thread_data(unique_link: str, db: Session = Depends(get_db)):
    """Obtener los datos JSON de la secuencia de hilos para un enlace único"""
    try:
        # Verificar que el enlace único existe y obtener la información de la compra
        purchase = db.query(Purchase).filter(Purchase.unique_link == unique_link).first()
        if not purchase:
            raise HTTPException(status_code=404, detail="Enlace no válido o expirado")

        # Verificar que el archivo JSON existe
        if not os.path.exists(purchase.json_path):
            logger.error(f"Archivo JSON no encontrado: {purchase.json_path}")
            raise HTTPException(status_code=404, detail="Datos de la imagen no encontrados")

        # Leer y retornar el contenido del JSON
        import json
        with open(purchase.json_path, 'r') as f:
            thread_data = json.load(f)

        return thread_data

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error obteniendo datos de hilos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/user-data/{unique_link}')
async def get_user_data(unique_link: str, db: Session = Depends(get_db)):
    """Obtener el nombre del usuario asociado a un enlace único"""
    try:
        purchase = db.query(Purchase).filter(Purchase.unique_link == unique_link).first()
        if not purchase:
            raise HTTPException(status_code=404, detail="Enlace no válido o expirado")

        user = db.query(User).filter(User.id == purchase.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        return {"name": user.name}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error obteniendo datos del usuario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/thread-image/{unique_link}')
async def get_thread_image(unique_link: str, db: Session = Depends(get_db)):
    """Obtener la imagen de hilos para un enlace único"""
    try:
        purchase = db.query(Purchase).filter(Purchase.unique_link == unique_link).first()
        if not purchase:
            raise HTTPException(status_code=404, detail="Enlace no válido o expirado")

        if not os.path.exists(purchase.image_path):
            logger.error(f"Imagen no encontrada: {purchase.image_path}")
            raise HTTPException(status_code=404, detail="Imagen no encontrada")

        return FileResponse(purchase.image_path, media_type="image/png")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error obteniendo imagen de hilos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/register-user')
async def register_user(
    user_data: UserRegistration,
    db: Session = Depends(get_db)
):
    """Endpoint legacy para registro directo (sin pago previo)"""
    try:
        return await process_user_registration(user_data, db)
    except HTTPException as he:
        logger.error(f"Error HTTP: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Error en registro: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
