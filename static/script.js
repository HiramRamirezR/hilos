// /home/hiramramirez/personalDev/hilos/static/script.js
const form = document.getElementById('imageForm');
const imageInput = document.getElementById('imageInput');
const pinsInput = document.getElementById('pins');
const linesInput = document.getElementById('lines');
const pixelWidthInput = document.getElementById('pixelWidth');
const previewImg = document.getElementById('preview');
const resultImg = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// Preview selected image
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            previewImg.src = event.target.result;
            previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset previous state
    resultImg.style.display = 'none';
    errorDiv.textContent = '';
    loadingDiv.style.display = 'block';

    const formData = new FormData();
    formData.append('file', imageInput.files[0]);
    formData.append('pins', pinsInput.value);
    formData.append('lines', linesInput.value);
    formData.append('pixel_width', pixelWidthInput.value);

    try {
        const response = await fetch('/generate-thread-image/', {
            method: 'POST',
            body: formData
        });

        loadingDiv.style.display = 'none';

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        resultImg.src = imageUrl;
        resultImg.style.display = 'block';

    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}`;
        console.error('Error:', error);
    }
});