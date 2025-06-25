document.addEventListener('DOMContentLoaded', () => {
    // Obtener el session_id de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (!sessionId) {
        showError('No se encontró información de la sesión de pago.');
        return;
    }

    // Manejar el envío del formulario de registro
    document.getElementById('registrationForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            session_id: sessionId
        };

        try {
            const response = await fetch('/complete-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error en el registro');
            }

            const responseData = await response.json();
            console.log('Respuesta del servidor:', responseData);

            // Mostrar confirmación final
            document.querySelector('.registration-section').style.display = 'none';
            document.getElementById('finalConfirmation').style.display = 'block';

        } catch (error) {
            console.error('Error completo:', error);
            showError('Error al registrar usuario: ' + error.message);
        }
    });

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
});
