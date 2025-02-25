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
        } catch (error) {
            errorDiv.textContent = error.message;
        } finally {
            loadingDiv.style.display = 'none';
            validateGenerateButton();
        }
    });

    // Manejar el pago
    const payBtn = document.getElementById('payBtn');
    payBtn.addEventListener('click', async (event) => {
        event.preventDefault(); // Evita el envío del formulario

        const response = await fetch('/create-payment-intent', {
            method: 'POST',
        });

        const { clientSecret } = await response.json();

        const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: 'Nombre del Usuario',
                },
            },
        });

        if (error) {
            console.error('Error:', error);
            alert('Error en el pago: ' + error.message);
        } else {
            alert('Pago exitoso!');
        }
    });
});