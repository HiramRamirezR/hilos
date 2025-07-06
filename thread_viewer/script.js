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
            userNameSpan.textContent = `${userData.name}`;
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

        let autoPlayInterval; // Variable para el intervalo de reproducción automática
        const autoPlayDelay = 8000; // 8 segundos por paso
        let isAutoPlaying = false; // Controla si la reproducción automática está activa

        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');

        function getQuarterAndLocalIndex(globalIndex) {
            // Convertir el índice global (0-indexado) a un número de pin (1-indexado)
            const oneIndexedGlobalPin = globalIndex + 1;

            // Calcular el cuarto (1-indexado)
            const quarter = Math.ceil(oneIndexedGlobalPin / pinsPerQuarter);

            // Calcular el índice local dentro del cuarto (1-indexado)
            let localIndex = oneIndexedGlobalPin % pinsPerQuarter;
            if (localIndex === 0) {
                localIndex = pinsPerQuarter; // Si es el último pin del cuarto, el índice local es pinsPerQuarter
            }

            return { quarter, localIndex };
        }

        function getQuarterColorName(quarter) {
            switch (quarter) {
                case 1:
                    return 'amarillo';
                case 2:
                    return 'verde';
                case 3:
                    return 'azul';
                case 4:
                    return 'rojo';
                default:
                    return '';
            }
        }

        function speakCurrentStep() {
            if (isAutoPlaying && 'speechSynthesis' in window) {
                const { quarter, localIndex } = getQuarterAndLocalIndex(threadSequence[currentIndex]);
                const colorName = getQuarterColorName(quarter);
                const utterance = new SpeechSynthesisUtterance(`Paso ${currentIndex + 1}. Color ${colorName}, pin ${localIndex}.`);
                utterance.lang = 'es-ES'; // Establecer el idioma a español
                speechSynthesis.cancel(); // Detener cualquier habla anterior
                speechSynthesis.speak(utterance);
            }
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
            progressCounter.textContent = `Paso ${currentIndex + 1} de ${threadSequence.length}`;

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
            speakCurrentStep(); // Leer el paso actual
        }

        function nextNumber() {
            if (currentIndex < threadSequence.length - 1) {
                currentIndex++;
                renderSequence();
            } else {
                stopAutoPlay(); // Detener la reproducción automática al llegar al final
            }
        }

        function previousNumber() {
            if (currentIndex > 0) {
                currentIndex--;
                renderSequence();
            }
        }

        function startAutoPlay() {
            if (autoPlayInterval) return; // Evitar múltiples intervalos
            isAutoPlaying = true;
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'block';
            autoPlayInterval = setInterval(() => {
                nextNumber();
            }, autoPlayDelay);
        }

        function stopAutoPlay() {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
            isAutoPlaying = false;
            playBtn.style.display = 'block';
            pauseBtn.style.display = 'none';
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel(); // Detener el habla al pausar
            }
        }

        // Add event listeners to navigation buttons
        document.getElementById('next-btn').addEventListener('click', () => {
            stopAutoPlay();
            nextNumber();
        });
        document.getElementById('prev-btn').addEventListener('click', () => {
            stopAutoPlay();
            previousNumber();
        });
        playBtn.addEventListener('click', startAutoPlay);
        pauseBtn.addEventListener('click', stopAutoPlay);

        // Add keyboard navigation
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') {
                stopAutoPlay();
                nextNumber();
            }
            if (event.key === 'ArrowLeft') {
                stopAutoPlay();
                previousNumber();
            }
        });

        // Initial render
        renderSequence();

    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUserName();
    loadThreadImage();
    loadThreadSequence();
});