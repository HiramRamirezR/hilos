// /home/hiramramirez/personalDev/hilos/static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form'); 
    const imageInput = document.getElementById('imageInput');
    const pinsInput = document.getElementById('pins');
    const linesInput = document.getElementById('lines');
    const previewImg = document.getElementById('preview');
    const resultImg = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const generateBtn = document.getElementById('generateBtn');

    // Función para validar si el botón debe estar habilitado
    function validateGenerateButton() {
        generateBtn.disabled = !(
            imageInput.files.length > 0 && 
            pinsInput.value.trim() !== '' && 
            linesInput.value.trim() !== ''
        );
    }

    // Preview selected image
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
    pinsInput.addEventListener('input', () => {
        console.log('Pins changed:', pinsInput.value);
        validateGenerateButton();
    });
    linesInput.addEventListener('input', () => {
        console.log('Lines changed:', linesInput.value);
        validateGenerateButton();
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Reset previous state
        errorDiv.textContent = '';
        resultImg.style.display = 'none';
        loadingDiv.style.display = 'block';
        generateBtn.disabled = true;

        // Crear FormData para el archivo
        const formData = new FormData();
        formData.append('file', imageInput.files[0]);

        // Crear URLSearchParams para otros parámetros
        const params = new URLSearchParams({
            pins: pinsInput.value,
            lines: linesInput.value
        });

        // Combinar FormData con parámetros de URL
        const fullUrl = `/generate-thread-image/?${params.toString()}`;

        console.log('Sending request:', {
            url: fullUrl,
            pins: pinsInput.value,
            lines: linesInput.value
        });

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
            console.error('Error:', error);
        } finally {
            loadingDiv.style.display = 'none';
            validateGenerateButton();
        }
    });
});