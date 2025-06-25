let bebidas = JSON.parse(localStorage.getItem('bebidas')) || [];
let existencias = JSON.parse(localStorage.getItem('existencias')) || [];
// Variable para almacenar el índice del elemento que se está editando
let editingIndex = -1; 

// Inicializar la interfaz al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    mostrarSeccion('registro-bebidas'); // Muestra la primera sección por defecto
    cargarBebidasExistencias();
    actualizarEstadisticas();
    mostrarExistencias();
    mostrarPesos();
});

// Función para cambiar de sección
function mostrarSeccion(seccionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(seccionId).classList.add('active');

    // Actualizar el estado del botón de navegación activo
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    // Encuentra el botón que corresponde a la sección activa y lo marca
    const activeButton = Array.from(document.querySelectorAll('.nav-button')).find(button =>
        button.onclick.toString().includes(`'${seccionId}'`)
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Si se cambia a la sección de estadísticas o existencias, actualizarlas
    if (seccionId === 'estadisticas-inventario') {
        actualizarEstadisticas();
    } else if (seccionId === 'registro-existencias') {
        mostrarExistencias();
        // Al volver a la sección de existencias, si no estamos editando, limpiar el formulario
        if (editingIndex === -1) { 
            limpiarExistenciasFormulario();
        }
    } else if (seccionId === 'registros-pesos') {
        mostrarPesos();
    }
}

// --- Funciones para Registro de Bebidas ---

// Listener para el botón de registrar bebida
document.getElementById('registrar-btn').addEventListener('click', registrarBebida);

function registrarBebida() {
    const tipo = document.getElementById('tipo').value.trim();
    const producto = document.getElementById('producto').value.trim();
    const tipoBebida = document.getElementById('tipo-bebida').value.trim();
    const capacidad = parseInt(document.getElementById('capacidad').value);
    const pesoVacio = parseInt(document.getElementById('peso-vacio').value);
    const pesoReal = parseInt(document.getElementById('peso-real').value);

    if (tipo && producto && tipoBebida && !isNaN(capacidad) && !isNaN(pesoVacio) && !isNaN(pesoReal) && capacidad > 0 && pesoVacio >= 0 && pesoReal >= 0) {
        // Check for duplicate beverage (same tipo, producto, tipoBebida)
        const isDuplicate = bebidas.some(bebida =>
            bebida.tipo.toLowerCase() === tipo.toLowerCase() &&
            bebida.producto.toLowerCase() === producto.toLowerCase() &&
            bebida.tipoBebida.toLowerCase() === tipoBebida.toLowerCase()
        );

        if (isDuplicate) {
            alert('¡Esta bebida (Clase, Producto, Tipo de Envase) ya está registrada!');
            return;
        }

        const diferencia = pesoReal - pesoVacio; // Calcular diferencia en el registro
        const bebida = { tipo, producto, tipoBebida, capacidad, pesoVacio, pesoReal, diferencia };
        bebidas.push(bebida);
        localStorage.setItem('bebidas', JSON.stringify(bebidas)); // Guardar en localStorage
        limpiarFormulario();
        cargarBebidasExistencias();
        actualizarEstadisticas();
        mostrarPesos(); // Actualizar la tabla de pesos
        alert('Bebida registrada exitosamente!');
    } else {
        alert('Por favor complete todos los campos correctamente. Asegúrese de que Capacidad, Peso Vacío y Peso Real sean números válidos y positivos.');
    }
}

// Limpiar formulario de bebidas
function limpiarFormulario() {
    document.getElementById('tipo').value = '';
    document.getElementById('producto').value = '';
    document.getElementById('tipo-bebida').value = '';
    document.getElementById('capacidad').value = '';
    document.getElementById('peso-vacio').value = '';
    document.getElementById('peso-real').value = '';
}

// --- Funciones para Registro de Existencias ---

// Cargar bebidas en el select de existencias
function cargarBebidasExistencias() {
    const bebidaExistenciaSelect = document.getElementById('bebida-existencia');
    bebidaExistenciaSelect.innerHTML = '<option value="">Selecciona una bebida</option>'; // Limpiar opciones anteriores

    // Group by 'tipo' and then sort by 'producto'
    const groupedBebidas = {};
    bebidas.forEach((bebida, index) => {
        if (!groupedBebidas[bebida.tipo]) {
            groupedBebidas[bebida.tipo] = [];
        }
        groupedBebidas[bebida.tipo].push({ ...bebida, originalIndex: index }); // Store original index
    });

    Object.keys(groupedBebidas).sort().forEach(tipo => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = tipo;
        groupedBebidas[tipo].sort((a, b) => a.producto.localeCompare(b.producto)).forEach(bebida => {
            const option = document.createElement('option');
            option.value = bebida.originalIndex; // Use original index to reference in 'bebidas' array
            option.textContent = `${bebida.producto} (${bebida.tipoBebida})`;
            optgroup.appendChild(option);
        });
        bebidaExistenciaSelect.appendChild(optgroup);
    });
}

// Listener para actualizar el tipo de bebida al seleccionar en el dropdown
document.getElementById('bebida-existencia').addEventListener('change', function() {
    const selectedIndex = this.value;
    if (selectedIndex !== "") {
        const bebida = bebidas[selectedIndex];
        document.getElementById('tipo-bebida-existencia').value = bebida.tipoBebida;
    } else {
        document.getElementById('tipo-bebida-existencia').value = '';
    }
});

// Agregar existencias
document.getElementById('agregar-existencia-btn').addEventListener('click', agregarExistencia);

function agregarExistencia() {
    const bebidaIndex = document.getElementById('bebida-existencia').value;
    const cantidadCerrados = parseInt(document.getElementById('cantidad-cerrados').value);
    const pesoActualBotella = parseFloat(document.getElementById('peso-actual-botella').value); // Use parseFloat for weights

    if (bebidaIndex !== "" && !isNaN(cantidadCerrados) && !isNaN(pesoActualBotella) && cantidadCerrados >= 0 && pesoActualBotella >= 0) {
        const bebidaSeleccionada = bebidas[bebidaIndex];

        // Calcular mililitros basados en el peso actual y el peso del envase vacío
        let mililitrosAbiertosCalculados = pesoActualBotella - bebidaSeleccionada.pesoVacio;
        if (mililitrosAbiertosCalculados < 0) {
            mililitrosAbiertosCalculados = 0; // Evitar mililitros negativos
        }
        mililitrosAbiertosCalculados = parseFloat(mililitrosAbiertosCalculados.toFixed(2)); // Redondear a 2 decimales

        // Construir el objeto de existencia
        const nuevaExistenciaData = {
            tipo: bebidaSeleccionada.tipo,
            producto: bebidaSeleccionada.producto,
            tipoBebida: bebidaSeleccionada.tipoBebida,
            cantidadCerrados: cantidadCerrados,
            mililitrosAbiertos: mililitrosAbiertosCalculados
        };

        if (editingIndex !== -1) {
            // Si estamos editando un registro existente
            existencias[editingIndex] = nuevaExistenciaData;
            alert('Existencia actualizada exitosamente!');
            editingIndex = -1; // Resetear el índice de edición
        } else {
            // Si no estamos editando, buscar si ya existe una existencia para esta bebida
            const existingExistenceIndex = existencias.findIndex(e =>
                e.tipo === nuevaExistenciaData.tipo &&
                e.producto === nuevaExistenciaData.producto &&
                e.tipoBebida === nuevaExistenciaData.tipoBebida
            );

            if (existingExistenceIndex !== -1) {
                // Si ya existe, preguntar al usuario si desea actualizarla
                if (confirm(`Ya existe una existencia para ${nuevaExistenciaData.producto} (${nuevaExistenciaData.tipoBebida}). ¿Deseas actualizarla con los nuevos datos?`)) {
                    existencias[existingExistenceIndex] = nuevaExistenciaData;
                    alert('Existencia actualizada exitosamente!');
                } else {
                    alert('No se realizó ningún cambio.');
                    limpiarExistenciasFormulario();
                    return; // Salir de la función si el usuario cancela
                }
            } else {
                // Si no existe, agregarla como una nueva
                existencias.push(nuevaExistenciaData);
                alert('Existencia agregada exitosamente!');
            }
        }

        localStorage.setItem('existencias', JSON.stringify(existencias)); // Guardar en localStorage
        mostrarExistencias();
        limpiarExistenciasFormulario();
        actualizarEstadisticas();
    } else {
        alert('Por favor complete todos los campos correctamente. Asegúrese de que Cantidad Cerrados y Peso Actual de la Botella sean números válidos y positivos.');
    }
}


// Mostrar existencias
function mostrarExistencias() {
    const resultadosExistenciasBody = document.getElementById('resultados-existencias-body');
    resultadosExistenciasBody.innerHTML = '';
    // Sort existencias alphabetically by product
    existencias.sort((a, b) => a.producto.localeCompare(b.producto));
    existencias.forEach((existencia, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${existencia.tipo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${existencia.producto}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${existencia.tipoBebida}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${existencia.cantidadCerrados}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${existencia.mililitrosAbiertos} ml</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-blue-400 hover:text-blue-200 mr-2" onclick="editarExistencia(${index})"><i class="fas fa-edit"></i></button>
                <button class="text-red-400 hover:text-red-200" onclick="eliminarExistencia(${index})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        resultadosExistenciasBody.appendChild(row);
    });
}

// Limpiar formulario de existencias
function limpiarExistenciasFormulario() {
    document.getElementById('bebida-existencia').value = '';
    document.getElementById('tipo-bebida-existencia').value = '';
    document.getElementById('cantidad-cerrados').value = '';
    document.getElementById('peso-actual-botella').value = '';
    // Reset the button text and function in case it was in "update" mode
    const agregarBtn = document.getElementById('agregar-existencia-btn');
    agregarBtn.innerHTML = '<i class="fas fa-plus-square mr-2"></i>Agregar Existencia';
    agregarBtn.onclick = agregarExistencia;
    editingIndex = -1; // Asegurarse de que el índice de edición esté reseteado
}

// Eliminar existencia
window.eliminarExistencia = function(index) {
    if (confirm('¿Estás seguro de que deseas eliminar esta existencia?')) {
        existencias.splice(index, 1);
        localStorage.setItem('existencias', JSON.stringify(existencias));
        mostrarExistencias();
        actualizarEstadisticas();
        limpiarExistenciasFormulario(); // Limpiar el formulario si se elimina un elemento que podría estar siendo editado
    }
};

// Editar existencia
window.editarExistencia = function(index) {
    const existencia = existencias[index];
    editingIndex = index; // Establecer el índice del elemento que se está editando

    // Buscar la bebida original en el array 'bebidas' para obtener sus propiedades
    const selectedBebidaIndex = bebidas.findIndex(b =>
        b.tipo === existencia.tipo &&
        b.producto === existencia.producto &&
        b.tipoBebida === existencia.tipoBebida
    );

    if (selectedBebidaIndex !== -1) {
        document.getElementById('bebida-existencia').value = selectedBebidaIndex;
        document.getElementById('tipo-bebida-existencia').value = existencia.tipoBebida;
        document.getElementById('cantidad-cerrados').value = existencia.cantidadCerrados;

        // Calcular el peso real a partir de los mililitros_abiertos para prellenar el input
        const bebidaOriginal = bebidas[selectedBebidaIndex];
        const pesoActualParaEdicion = existencia.mililitrosAbiertos + bebidaOriginal.pesoVacio;
        document.getElementById('peso-actual-botella').value = pesoActualParaEdicion.toFixed(2); // Mostrar con 2 decimales

        const agregarBtn = document.getElementById('agregar-existencia-btn');
        agregarBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Actualizar Existencia';
        // El `onclick` sigue siendo `agregarExistencia` ya que esa función ahora maneja la lógica de actualización
        agregarBtn.onclick = agregarExistencia;

    } else {
        alert('La bebida seleccionada para editar no se encontró en los registros de bebidas. Por favor, asegúrese de que la bebida original exista.');
        limpiarExistenciasFormulario();
    }
    // Cambiar a la sección de 'registro-existencias'
    mostrarSeccion('registro-existencias');
};

// Mostrar Registros de Pesos
function mostrarPesos() {
    const resultadosPesosBody = document.getElementById('resultados-pesos-body');
    resultadosPesosBody.innerHTML = '';
    // Sort by product name for better readability
    bebidas.sort((a, b) => a.producto.localeCompare(b.producto));
    bebidas.forEach((bebida, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${bebida.producto}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${bebida.tipoBebida}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${bebida.pesoVacio} g</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">${bebida.pesoReal} g</td>
        `;
        resultadosPesosBody.appendChild(row);
    });
}

// Actualizar estadísticas de inventario
function actualizarEstadisticas() {
    document.getElementById('total-bebidas').textContent = bebidas.length;
    const totalBotellas = existencias.reduce((sum, existencia) => sum + existencia.cantidadCerrados, 0);
    const totalMililitros = existencias.reduce((sum, existencia) => sum + existencia.mililitrosAbiertos, 0);

    document.getElementById('total-botellas').textContent = totalBotellas;
    document.getElementById('total-mililitros').textContent = totalMililitros.toFixed(2); // Display with 2 decimal places

    // Detailed statistics by beverage type
    const estadisticasDetalle = {};

    // Inicializar estadísticas para todas las bebidas registradas
    bebidas.forEach(bebida => {
        const key = `${bebida.tipo} - ${bebida.producto} (${bebida.tipoBebida})`;
        estadisticasDetalle[key] = {
            totalCerrados: 0,
            totalMililitrosAbiertos: 0
        };
    });

    // Sumar las existencias reales
    existencias.forEach(existencia => {
        const key = `${existencia.tipo} - ${existencia.producto} (${existencia.tipoBebida})`;
        if (estadisticasDetalle[key]) { // Asegurarse de que la clave exista (la bebida esté registrada)
            estadisticasDetalle[key].totalCerrados += existencia.cantidadCerrados;
            estadisticasDetalle[key].totalMililitrosAbiertos += existencia.mililitrosAbiertos;
        }
    });

    const resumenEstadisticasDiv = document.getElementById('estadisticas-detalle');
    resumenEstadisticasDiv.innerHTML = ''; // Clear previous content

    // Ordenar las claves para una presentación consistente
    const sortedKeys = Object.keys(estadisticasDetalle).sort();

    if (sortedKeys.length === 0) {
        resumenEstadisticasDiv.innerHTML = '<p class="text-gray-700 text-md">No hay datos de existencias para mostrar estadísticas detalladas.</p>';
    } else {
        sortedKeys.forEach(key => {
            const stats = estadisticasDetalle[key];
            const p = document.createElement('p');
            p.classList.add('text-gray-700', 'text-md', 'mb-1');
            p.innerHTML = `<strong>${key}:</strong> ${stats.totalCerrados} botellas cerradas, ${stats.totalMililitrosAbiertos.toFixed(2)} ml abiertos.`;
            resumenEstadisticasDiv.appendChild(p);
        });
    }
}

// Borrar todos los registros
document.getElementById('borrar-todos-registros-btn').addEventListener('click', function() {
    if (confirm('¿Estás seguro de que deseas BORRAR TODOS los registros de bebidas y existencias? Esta acción es irreversible.')) {
        bebidas = [];
        existencias = [];
        localStorage.removeItem('bebidas');
        localStorage.removeItem('existencias');
        cargarBebidasExistencias();
        mostrarExistencias();
        mostrarPesos();
        actualizarEstadisticas();
        alert('Todos los registros han sido borrados.');
        limpiarExistenciasFormulario(); // Limpiar formulario después de borrar todo
    }
});

// --- Funciones de Guardado y Carga ---

// Crear Copia de Seguridad (Descargar JSON)
document.getElementById('crear-copia-seguridad-btn').addEventListener('click', function() {
    const dataToSave = {
        bebidas: bebidas,
        existencias: existencias
    };
    const filename = `inventario_bar_backup_${new Date().toISOString().slice(0, 10)}.json`; // e.g., inventario_bar_backup_2023-10-27.json
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Copia de seguridad creada y descargada.');
});

// Cargar Copia de Seguridad (Subir JSON)
document.getElementById('cargar-copia-seguridad-btn').addEventListener('click', function() {
    const fileInput = document.getElementById('cargar-copia-seguridad-input');
    const file = fileInput.files[0];

    if (file) {
        if (confirm('¿Estás seguro de que deseas cargar esta copia de seguridad? Esto reemplazará todos tus datos actuales de inventario.')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const loadedData = JSON.parse(e.target.result);
                    if (loadedData.bebidas && loadedData.existencias) {
                        bebidas = loadedData.bebidas;
                        existencias = loadedData.existencias;
                        localStorage.setItem('bebidas', JSON.stringify(bebidas));
                        localStorage.setItem('existencias', JSON.stringify(existencias));

                        cargarBebidasExistencias();
                        mostrarExistencias();
                        mostrarPesos();
                        actualizarEstadisticas();
                        alert('Copia de seguridad cargada exitosamente.');
                        fileInput.value = ''; // Clear the selected file
                        limpiarExistenciasFormulario(); // Limpiar el formulario después de cargar
                    } else {
                        alert('El archivo JSON no tiene el formato esperado. Asegúrese de que contenga las propiedades "bebidas" y "existencias".');
                    }
                } catch (error) {
                    alert('Error al leer el archivo JSON: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    } else {
        alert('Por favor, seleccione un archivo de copia de seguridad para cargar.');
    }
});

// Exportar Existencias a CSV
document.getElementById('exportar-existencias-btn').addEventListener('click', function() {
    if (existencias.length === 0) {
        alert('No hay existencias para exportar.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Add BOM for proper UTF-8 handling in Excel
    csvContent = "\uFEFF" + csvContent;

    // Headers
    const headers = ["Clase", "Producto", "Tipo", "Cantidad Cerrados", "Mililitros Abiertos"];
    csvContent += headers.join(",") + "\n";

    // Data rows
    existencias.forEach(item => {
        const row = [
            `"${item.tipo}"`, // Enclose in quotes to handle commas within text
            `"${item.producto}"`,
            `"${item.tipoBebida}"`,
            item.cantidadCerrados,
            item.mililitrosAbiertos.toFixed(2)
        ];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `existencias_bar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    alert('Existencias exportadas a CSV.');
});