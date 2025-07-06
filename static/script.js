document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const imageInput = document.getElementById('imageInput');
    const previewImg = document.getElementById('preview');
    const resultImg = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const generateBtn = document.getElementById('generateBtn');

    // Variables globales para el proceso de compra
    let currentImageData = null;

    // URL de Stripe Checkout (se configurará desde el backend)
    let stripeCheckoutUrl = null;

    // Función para validar si el botón debe estar habilitado
    function validateGenerateButton() {
        generateBtn.disabled = !(imageInput.files.length > 0);
    }

    // Vista previa de la imagen seleccionada
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                validateGenerateButton();
            };
            reader.readAsDataURL(file);
        }
    });

    // Función para actualizar la barra de progreso
    function updateProgress(progress, status) {
        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = document.getElementById('progress-percentage');
        const progressStatus = document.getElementById('progress-status');

        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
        progressStatus.textContent = status;
    }

    // Función para simular progreso estimado (15-17 segundos)
    function simulateProgress() {
        const totalTime = 16000; // 16 segundos promedio
        const updateInterval = 100; // Actualizar cada 100ms
        const totalUpdates = totalTime / updateInterval;
        let currentUpdate = 0;

        const phases = [
            { end: 0.1, status: '✨ Analizando tu obra maestra...' },
            { end: 0.25, status: '🎨 Creando la paleta mágica...' },
            { end: 0.4, status: '📐 Calculando coordenadas artísticas...' },
            { end: 0.6, status: '🧵 Tejiendo los primeros hilos...' },
            { end: 0.8, status: '🎭 Agregando toques de magia...' },
            { end: 0.95, status: '✨ Dando los últimos retoques...' },
            { end: 1.0, status: '🎉 ¡Tu arte está listo!' }
        ];

        const progressInterval = setInterval(() => {
            currentUpdate++;
            const progress = Math.min((currentUpdate / totalUpdates) * 100, 99);

            // Determinar el estado actual
            let currentStatus = 'Procesando...';
            for (const phase of phases) {
                if (progress / 100 <= phase.end) {
                    currentStatus = phase.status;
                    break;
                }
            }

            updateProgress(Math.floor(progress), currentStatus);

            if (currentUpdate >= totalUpdates) {
                clearInterval(progressInterval);
            }
        }, updateInterval);

        return progressInterval;
    }

    // Manejar el envío del formulario de generación de imagen
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // errorDiv.textContent = '';
        resultImg.style.display = 'none';
        loadingDiv.style.display = 'block';
        generateBtn.disabled = true;

        // Inicializar barra de progreso
        updateProgress(0, '🚀 Preparando la magia...');

        // Iniciar simulación de progreso
        const progressInterval = simulateProgress();

        const formData = new FormData();
        formData.append('file', imageInput.files[0]);

        try {
            const response = await fetch(`/generate-thread-image/`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error generando imagen');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            resultImg.src = imageUrl;
            resultImg.style.display = 'block';

            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/['"]/g, '')
                : `${Date.now()}_output.png`;

            currentImageData = {
                filename: filename,
                originalFile: imageInput.files[0].name
            };

            // Detener simulación y mostrar 100%
            clearInterval(progressInterval);
            updateProgress(100, '🎨✨ ¡Tu obra maestra está lista! ✨🎨');

            document.getElementById('buyButton').style.display = 'block';
            document.getElementById('purchaseInfo').style.display = 'block';
        } catch (error) {
            // Detener simulación en caso de error
            clearInterval(progressInterval);
            console.error(error.message);
            updateProgress(0, '😔 Ups, algo salió mal...');
        } finally {
            loadingDiv.style.display = 'none';
            validateGenerateButton();
        }
    });

    // Manejar clic en botón de compra
    document.getElementById('buyButton').addEventListener('click', async () => {
        try {
            // Crear sesión de checkout en el backend
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: currentImageData
                })
            });

            if (!response.ok) {
                throw new Error('Error al crear sesión de checkout');
            }

            const { checkout_url } = await response.json();

            // Redirigir a Stripe Checkout
            window.location.href = checkout_url;

        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la compra: ' + error.message);
        }
    });

});