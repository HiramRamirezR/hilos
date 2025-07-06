async function loadUserName() {
    try {
        const pathParts = window.location.pathname.split('/');
        const uniqueLink = pathParts[pathParts.length - 1];

        const response = await fetch(`/api/user-data/${uniqueLink}`);
        if (!response.ok) {
            throw new Error('No se pudo cargar el nombre del usuario');
        }

        const userData = await response.json();
        const userNameSpan = document.getElementById('user-name');
        if (userNameSpan) {
            userNameSpan.textContent = `de ${userData.name}`;
        }
    } catch (error) {
        console.error('Error cargando nombre de usuario:', error);
    }
}

async function loadThreadImage() {
    try {
        const pathParts = window.location.pathname.split('/');
        const uniqueLink = pathParts[pathParts.length - 1];

        const imgElement = document.getElementById('thread-image-preview');
        if (imgElement) {
            imgElement.src = `/api/thread-image/${uniqueLink}`;
            imgElement.style.display = 'block'; // Mostrar la imagen una vez cargada
        }
    } catch (error) {
        console.error('Error cargando imagen de hilos:', error);
    }
}

async function loadThreadSequence() {
    try {
        // Obtener el unique_link de la URL
        const pathParts = window.location.pathname.split('/');
        const uniqueLink = pathParts[pathParts.length - 1];

        // Cargar el JSON específico para este link
        const response = await fetch(`/api/thread-data/${uniqueLink}`);
        if (!response.ok) {
            throw new Error('No se pudo cargar la secuencia de hilos');
        }

        const threadSequence = await response.json();

        // Obtener el paso guardado de localStorage
        const savedIndex = localStorage.getItem(`threadProgress_${uniqueLink}`);
        let currentIndex = savedIndex ? parseInt(savedIndex) : 0;

        // Asegurarse de que el índice guardado no exceda la longitud de la secuencia
        if (currentIndex >= threadSequence.length) {
            currentIndex = 0;
        }

        const totalPins = 180; // Ajustado a 180 pines
        const quartersCount = 4;
        const pinsPerQuarter = totalPins / quartersCount; // Esto será 45

        function getQuarterAndLocalIndex(globalIndex) {
            if (globalIndex === 0) return { quarter: 0, localIndex: 0 };

            const quarter = Math.floor((globalIndex - 1) / pinsPerQuarter) + 1;
            const localIndex = ((globalIndex - 1) % pinsPerQuarter) + 1;

            return { quarter, localIndex };
        }

        function saveProgress() {
            localStorage.setItem(`threadProgress_${uniqueLink}`, currentIndex);
        }

        function renderSequence() {
            const quarters = document.querySelectorAll('.quarter');
            const quarterNumbers = document.querySelectorAll('.quarter-number');
            const progressCounter = document.getElementById('progress-counter');

            // Resetear todos los cuartos
            quarters.forEach(quarter => quarter.classList.remove('active'));
            quarterNumbers.forEach(number => number.textContent = '');

            const { quarter, localIndex } = getQuarterAndLocalIndex(threadSequence[currentIndex]);

            // Actualizar contador de progreso
            progressCounter.textContent = `Paso ${currentIndex} de ${threadSequence.length - 1}`;

            // Validar que el cuarto exista antes de intentar activarlo
            if (quarter > 0 && quarter <= 4) {
                // Activar el cuarto correcto
                const activeQuarter = document.querySelector(`.quarter.q${quarter}`);
                if (activeQuarter) {
                    activeQuarter.classList.add('active');

                    // Mostrar número en el cuarto
                    const activeQuarterNumber = activeQuarter.querySelector('.quarter-number');
                    if (activeQuarterNumber) {
                        activeQuarterNumber.textContent = localIndex;
                    }
                }
            }
            saveProgress(); // Guardar el progreso cada vez que se renderiza la secuencia
        }

        function nextNumber() {
            if (currentIndex < threadSequence.length - 1) {
                currentIndex++;
                renderSequence();
            }
        }

        function previousNumber() {
            if (currentIndex > 0) {
                currentIndex--;
                renderSequence();
            }
        }

        // Add event listeners to navigation buttons
        document.getElementById('next-btn').addEventListener('click', nextNumber);
        document.getElementById('prev-btn').addEventListener('click', previousNumber);

        // Add keyboard navigation
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') nextNumber();
            if (event.key === 'ArrowLeft') previousNumber();
        });

        // Initial render
        renderSequence();

    } catch (error) {
        console.error('Error:', error);
        const errorContainer = document.createElement('div');
        errorContainer.textContent = 'No se pudo cargar la secuencia de hilos. Inténtalo de nuevo.';
        errorContainer.style.color = 'red';
        document.querySelector('.thread-viewer-container').prepend(errorContainer);
    }
}

// Call the functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUserName();
    loadThreadImage();
    loadThreadSequence();
});