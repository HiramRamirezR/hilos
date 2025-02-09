async function loadThreadSequence() {
    try {
        // Buscar el último archivo JSON generado
        const response = await fetch('../thread_outputs/');
        const text = await response.text();
        
        // Extraer nombres de archivos JSON
        const jsonFileRegex = /(\w+[-\w]*_input\.json)/g;
        const jsonFiles = text.match(jsonFileRegex);
        
        if (!jsonFiles || jsonFiles.length === 0) {
            throw new Error('No se encontraron archivos JSON');
        }
        
        // Tomar el último archivo JSON (el más reciente)
        const latestJsonFile = jsonFiles[jsonFiles.length - 1];
        console.log('Archivo JSON a cargar:', latestJsonFile);
        
        // Cargar el JSON
        const jsonResponse = await fetch(`../thread_outputs/${latestJsonFile}`);
        const threadSequence = await jsonResponse.json();
        
        let currentIndex = 0;
        const totalPins = 200; // Ajustar según la selección del usuario
        const quartersCount = 4;
        const pinsPerQuarter = totalPins / quartersCount;

        function getQuarterAndLocalIndex(globalIndex) {
            if (globalIndex === 0) return { quarter: 0, localIndex: 0 };
            
            const quarter = Math.floor((globalIndex - 1) / pinsPerQuarter) + 1;
            const localIndex = ((globalIndex - 1) % pinsPerQuarter) + 1;
            
            return { quarter, localIndex };
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
        console.error('Error loading thread sequence:', error);
        // Opcional: mostrar un mensaje de error al usuario
        const errorContainer = document.createElement('div');
        errorContainer.textContent = 'No se pudo cargar la secuencia de hilos. Inténtalo de nuevo.';
        errorContainer.style.color = 'red';
        document.querySelector('.thread-viewer-container').prepend(errorContainer);
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', loadThreadSequence);