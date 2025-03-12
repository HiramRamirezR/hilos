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

    // Inicializar Stripe
    const stripe = Stripe('pk_test_51MZeZhFWYwy2FJ35A1FniJQBRkUJlF3JHFCAOlzdBxKxKJCbR0jyfi4SGaiv9QMMqE8FQ5FbLP6yXbo6seRrCFya00T5Ac9IT3'); // Reemplaza con tu clave pública
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element'); // Montar el elemento de tarjeta

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
    pinsSelect.addEventListener('change', () => {
        validateGenerateButton();
    });
    linesSelect.addEventListener('change', () => {
        validateGenerateButton();
    });

    // Manejar el envío del formulario de generación de imagen
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Resetear estado anterior
        errorDiv.textContent = '';
        resultImg.style.display = 'none';
        loadingDiv.style.display = 'block';
        generateBtn.disabled = true;

        // Crear FormData para el archivo
        const formData = new FormData();
        formData.append('file', imageInput.files[0]);

        // Crear URLSearchParams para otros parámetros
        const params = new URLSearchParams({
            pins: pinsSelect.value,
            lines: linesSelect.value
        });

        // Combinar FormData con parámetros de URL
        const fullUrl = `/generate-thread-image/?${params.toString()}`;

        try {
            const response = await fetch(fullUrl, {
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

            // Guardar datos de la imagen actual
            currentImageData = {
                imageUrl: imageUrl,
                pins: pinsSelect.value,
                lines: linesSelect.value
            };

            // Mostrar botón de compra
            document.getElementById('buyButton').style.display = 'block';
        } catch (error) {
            errorDiv.textContent = error.message;
        } finally {
            loadingDiv.style.display = 'none';
            validateGenerateButton();
        }
    });

    // Manejar clic en botón de compra
    document.getElementById('buyButton').addEventListener('click', () => {
        document.getElementById('purchaseProcess').style.display = 'block';
        document.getElementById('paymentStep').scrollIntoView({ behavior: 'smooth' });
    });

    // Manejar el pago con Stripe
    document.getElementById('payBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: currentImageData
                })
            });

            const { clientSecret } = await response.json();

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                }
            });

            if (result.error) {
                document.getElementById('card-errors').textContent = result.error.message;
            } else {
                // Pago exitoso, mostrar formulario de registro
                document.getElementById('paymentStep').style.display = 'none';
                document.getElementById('registrationStep').style.display = 'block';
                document.getElementById('registrationStep').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            document.getElementById('card-errors').textContent = 'Error procesando el pago';
        }
    });

    // Manejar el registro
    document.getElementById('registrationForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/register-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...userData,
                    imageData: currentImageData
                })
            });

            if (!response.ok) throw new Error('Error en el registro');

            // Mostrar confirmación
            document.getElementById('registrationStep').style.display = 'none';
            document.getElementById('confirmationStep').style.display = 'block';
            document.getElementById('confirmationStep').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            alert('Error al registrar usuario: ' + error.message);
        }
    });
});