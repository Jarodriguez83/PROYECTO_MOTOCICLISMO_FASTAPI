// ============================================================
// CARRERAS.JS - PANEL DE ADMINISTRACIÓN GP COLOMBIA
// ============================================================

console.log("Archivo carreras.js cargado correctamente.");

// ============================================================
// DATOS Y ESTADO
// ============================================================

const datosJSON = document.getElementById('datosCompetidores');
let todosLosCompetidores = datosJSON ? JSON.parse(datosJSON.textContent) : [];
let ordenActual = { campo: null, asc: true };

// ============================================================
// FILTRADO PRINCIPAL
// ============================================================

function filtrarCompetidores() {
    const busqueda = document.getElementById('inputBusqueda').value.trim().toLowerCase();
    const marca = document.getElementById('filtroCilindraje').value.toLowerCase();
    const rangoCC = document.getElementById('filtroCC').value;
    const tipoDoc = document.getElementById('filtroDocumento').value;
    const experiencia = document.getElementById('filtroExperiencia').value;

    const filas = document.querySelectorAll('#cuerpoTabla .fila-competidor');
    let visibles = 0;

    filas.forEach(fila => {
        const id = fila.dataset.id;
        const nombre = fila.dataset.nombre;
        const telefono = fila.dataset.telefono;
        const numero = fila.dataset.numero;
        const filaMarca = fila.dataset.marca;
        const cc = parseInt(fila.dataset.cc);
        const documento = fila.dataset.documento;
        const exp = fila.dataset.experiencia;

        // Búsqueda por ID, teléfono o número competidor
        let matchBusqueda = true;
        if (busqueda) {
            matchBusqueda =
                id.includes(busqueda) ||
                telefono.includes(busqueda) ||
                numero.includes(busqueda) ||
                nombre.includes(busqueda);
        }

        // Filtro marca
        let matchMarca = !marca || filaMarca.includes(marca);

        // Filtro cilindraje
        let matchCC = true;
        if (rangoCC) {
            const [min, max] = rangoCC.split('-').map(Number);
            matchCC = cc >= min && cc <= max;
        }

        // Filtro tipo documento
        let matchDoc = !tipoDoc || documento === tipoDoc;

        // Filtro experiencia
        let matchExp = !experiencia || exp === experiencia;

        const mostrar = matchBusqueda && matchMarca && matchCC && matchDoc && matchExp;
        fila.style.display = mostrar ? '' : 'none';
        if (mostrar) visibles++;
    });

    // Actualizar contador
    const contador = document.getElementById('contadorVisible');
    if (contador) contador.textContent = visibles;

    // Mostrar/ocultar estado vacío
    const sinResultados = document.getElementById('sinResultados');
    const tabla = document.getElementById('tablaCompetidores');
    if (sinResultados && tabla) {
        if (visibles === 0) {
            tabla.style.display = 'none';
            sinResultados.style.display = 'flex';
            sinResultados.style.flexDirection = 'column';
            sinResultados.style.alignItems = 'center';
        } else {
            tabla.style.display = '';
            sinResultados.style.display = 'none';
        }
    }
}

// ============================================================
// LIMPIAR BÚSQUEDA
// ============================================================

function limpiarBusqueda() {
    const input = document.getElementById('inputBusqueda');
    if (input) {
        input.value = '';
        filtrarCompetidores();
    }
}

// ============================================================
// RESETEAR TODOS LOS FILTROS
// ============================================================

function resetearFiltros() {
    document.getElementById('inputBusqueda').value = '';
    document.getElementById('filtroCilindraje').value = '';
    document.getElementById('filtroCC').value = '';
    document.getElementById('filtroDocumento').value = '';
    document.getElementById('filtroExperiencia').value = '';
    filtrarCompetidores();
}

// ============================================================
// ORDENAR TABLA
// ============================================================

function ordenarPor(campo) {
    // Determinar dirección
    if (ordenActual.campo === campo) {
        ordenActual.asc = !ordenActual.asc;
    } else {
        ordenActual.campo = campo;
        ordenActual.asc = true;
    }

    // Actualizar botones
    document.querySelectorAll('.btn-orden').forEach(b => b.classList.remove('activo'));
    const btnActivo = document.getElementById('orden-' + campo);
    if (btnActivo) {
        btnActivo.classList.add('activo');
        const icono = btnActivo.querySelector('i');
        if (icono) {
            icono.className = ordenActual.asc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
        }
    }

    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;

    const filas = Array.from(tbody.querySelectorAll('.fila-competidor'));

    filas.sort((a, b) => {
        let valA, valB;

        switch (campo) {
            case 'id':
                valA = parseInt(a.dataset.id);
                valB = parseInt(b.dataset.id);
                break;
            case 'nombre':
                valA = a.dataset.nombre;
                valB = b.dataset.nombre;
                break;
            case 'cilindraje':
                valA = parseInt(a.dataset.cc);
                valB = parseInt(b.dataset.cc);
                break;
            case 'numero':
                valA = parseInt(a.dataset.numero);
                valB = parseInt(b.dataset.numero);
                break;
            default:
                return 0;
        }

        if (typeof valA === 'string') {
            return ordenActual.asc
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        } else {
            return ordenActual.asc ? valA - valB : valB - valA;
        }
    });

    // Reinsertar filas ordenadas
    filas.forEach(fila => tbody.appendChild(fila));
}

// ============================================================
// VER DETALLE EN MODAL
// ============================================================

function verDetalle(id) {
    const competidor = todosLosCompetidores.find(c => c.id === id);
    if (!competidor) return;

    // Mapeo tipo documento
    const tipoDocMap = { cc: 'C.C.', ce: 'C.E.', passport: 'PASAPORTE' };

    document.getElementById('modalNumero').textContent = competidor.numero_competidor;
    document.getElementById('modalNombre').textContent = competidor.nombre_completo;
    document.getElementById('modalEquipo').textContent = competidor.equipo || 'Sin equipo / escudería';
    document.getElementById('modalId').textContent = '#' + competidor.id;
    document.getElementById('modalDocumento').textContent =
        (tipoDocMap[competidor.tipo_documento] || competidor.tipo_documento) +
        ' — ' + competidor.numero_documento;
    document.getElementById('modalFecha').textContent = competidor.fecha_nacimiento;
    document.getElementById('modalCiudad').textContent = competidor.ciudad;
    document.getElementById('modalTelefono').textContent = competidor.telefono;
    document.getElementById('modalCorreo').textContent = competidor.correo;
    document.getElementById('modalMarca').textContent = competidor.marca_motocicleta;
    document.getElementById('modalModelo').textContent = competidor.modelo_motocicleta;
    document.getElementById('modalCC').textContent = competidor.cilindraje_motor + ' CC';
    document.getElementById('modalExperiencia').textContent =
        competidor.experiencia === 'si' ? '✓ CON EXPERIENCIA' : '✗ SIN EXPERIENCIA';

    // Abrir modal
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarModal();
});

// ============================================================
// EVENT LISTENERS PARA BOTONES DE ACCIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Botones Ver detalle
    document.querySelectorAll('.btn-ver').forEach(boton => {
        boton.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            verDetalle(id);
        });
    });

    // Botones Eliminar
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            const nombre = this.getAttribute('data-nombre');
            confirmarEliminar(id, nombre);
        });
    });
});

// ============================================================
// ELIMINAR COMPETIDOR
// ============================================================

function confirmarEliminar(id, nombre) {
    Swal.fire({
        title: '¿ELIMINAR PILOTO?',
        html: `<span style="color:#ccc">¿Estás seguro de que deseas eliminar a <strong style="color:white">${nombre}</strong> del campeonato?<br><br>Esta acción no se puede deshacer.</span>`,
        icon: 'warning',
        background: '#111',
        color: '#fff',
        showCancelButton: true,
        confirmButtonColor: '#e10600',
        cancelButtonColor: '#333',
        confirmButtonText: 'SÍ, ELIMINAR',
        cancelButtonText: 'CANCELAR',
        customClass: {
            popup: 'swal-gp-popup',
            title: 'swal-gp-title',
        }
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarCompetidor(id, nombre);
        }
    });
}

async function eliminarCompetidor(id, nombre) {
    try {
        const respuesta = await fetch(`/eliminar_competidor/${id}`, {
            method: 'DELETE'
        });

        if (respuesta.ok) {
            // Eliminar fila de la tabla
            const fila = document.querySelector(`.fila-competidor[data-id="${id}"]`);
            if (fila) {
                fila.style.transition = 'opacity 0.3s, transform 0.3s';
                fila.style.opacity = '0';
                fila.style.transform = 'translateX(-20px)';
                setTimeout(() => fila.remove(), 300);
            }

            // Actualizar array en memoria
            todosLosCompetidores = todosLosCompetidores.filter(c => c.id !== id);

            // Actualizar contador total
            actualizarContadores();

            Swal.fire({
                title: 'ELIMINADO',
                text: `${nombre} ha sido eliminado del campeonato.`,
                icon: 'success',
                background: '#111',
                color: '#fff',
                confirmButtonColor: '#e10600',
                confirmButtonText: 'CONTINUAR',
                timer: 3000,
                timerProgressBar: true
            });
        } else {
            throw new Error('Error del servidor');
        }
    } catch (error) {
        Swal.fire({
            title: 'ERROR',
            text: 'No se pudo eliminar el competidor. Intenta nuevamente.',
            icon: 'error',
            background: '#111',
            color: '#fff',
            confirmButtonColor: '#e10600'
        });
    }
}

// ============================================================
// ACTUALIZAR CONTADORES DEL HERO
// ============================================================

function actualizarContadores() {
    const total = todosLosCompetidores.length;
    const conExp = todosLosCompetidores.filter(c => c.experiencia === 'si').length;
    const marcas = new Set(todosLosCompetidores.map(c => c.marca_motocicleta.toLowerCase())).size;

    const elTotal = document.getElementById('totalCompetidores');
    const elExp = document.getElementById('totalExperimentados');
    const elMarcas = document.getElementById('totalMarcas');
    const elContador = document.getElementById('contadorVisible');

    if (elTotal) elTotal.textContent = total;
    if (elExp) elExp.textContent = conExp;
    if (elMarcas) elMarcas.textContent = marcas;

    // Contar filas visibles
    const visibles = document.querySelectorAll('.fila-competidor:not([style*="display: none"])').length;
    if (elContador) elContador.textContent = visibles;
}