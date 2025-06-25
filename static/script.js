document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const imageInput = document.getElementById('imageInput');
    const pinsSelect = document.getElementById('pins');
    const linesSelect = document.getElementById('lines');
    const previewImg = document.getElementById('preview');
    const resultImg = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const generateBtn = document.getElementById('generateBtn');

    // Variables globales para el proceso de compra
    let currentImageData = null;

    // URL de Stripe Checkout (se configurará desde el backend)
    let stripeCheckoutUrl = null;

    // Función para validar si el botón debe estar habilitado
    function validateGenerateButton() {
        generateBtn.disabled = !(
            imageInput.files.length > 0 &&
            pinsSelect.value &&
            linesSelect.value
        );
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

    // Listeners para pines y líneas
    pinsSelect.addEventListener('change', validateGenerateButton);
    linesSelect.addEventListener('change', validateGenerateButton);

    // Manejar el envío del formulario de generación de imagen
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        errorDiv.textContent = '';
        resultImg.style.display = 'none';
        loadingDiv.style.display = 'block';
        generateBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', imageInput.files[0]);

        const params = new URLSearchParams({
            pins: pinsSelect.value,
            lines: linesSelect.value
        });

        try {
            const response = await fetch(`/generate-thread-image/?${params.toString()}`, {
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
                pins: pinsSelect.value,
                lines: linesSelect.value,
                originalFile: imageInput.files[0].name
            };

            document.getElementById('buyButton').style.display = 'block';
            document.getElementById('purchaseInfo').style.display = 'block';
        } catch (error) {
            errorDiv.textContent = error.message;
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