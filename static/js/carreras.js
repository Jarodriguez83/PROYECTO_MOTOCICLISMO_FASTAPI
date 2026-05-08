console.log("Archivo carreras.js cargado correctamente.");

// =============================================
// DATOS DE COMPETIDORES (desde JSON embebido)
// =============================================
const datosRaw = document.getElementById("datosCompetidores");
let competidores = [];
if (datosRaw) {
    try {
        competidores = JSON.parse(datosRaw.textContent);
    } catch (e) {
        console.error("Error al parsear competidores:", e);
    }
}

// =============================================
// VARIABLES DE ESTADO
// =============================================
let ordenActual = { campo: null, asc: true };
let competidorEnEdicion = null;

// =============================================
// FILTRAR COMPETIDORES
// =============================================
function filtrarCompetidores() {
    const busqueda     = document.getElementById("inputBusqueda").value.trim().toLowerCase();
    const filtroCil    = document.getElementById("filtroCilindraje").value.toLowerCase();
    const filtroCC     = document.getElementById("filtroCC").value;
    const filtroDoc    = document.getElementById("filtroDocumento").value.toLowerCase();
    const filtroExp    = document.getElementById("filtroExperiencia").value.toLowerCase();

    const filas = document.querySelectorAll("#cuerpoTabla .fila-competidor");
    let visibles = 0;

    filas.forEach(fila => {
        const id      = fila.dataset.id;
        const nombre  = fila.dataset.nombre;
        const tel     = fila.dataset.telefono;
        const numComp = fila.dataset.numero;
        const marca   = fila.dataset.marca;
        const cc      = parseInt(fila.dataset.cc);
        const doc     = fila.dataset.documento;
        const exp     = fila.dataset.experiencia;

        // BÚSQUEDA POR ID, TELÉFONO O Nº COMPETIDOR
        const coincideBusqueda = !busqueda ||
            id.includes(busqueda) ||
            tel.includes(busqueda) ||
            numComp.includes(busqueda) ||
            nombre.includes(busqueda);

        // FILTRO MARCA
        const coincideMarca = !filtroCil || marca === filtroCil;

        // FILTRO CC
        let coincideCC = true;
        if (filtroCC) {
            if (filtroCC === "1001 +") {
                coincideCC = cc > 1000;
            } else {
                const [min, max] = filtroCC.split("-").map(Number);
                coincideCC = cc >= min && cc <= max;
            }
        }

        // FILTRO DOCUMENTO
        const coincideDoc = !filtroDoc || doc === filtroDoc;

        // FILTRO EXPERIENCIA
        const coincideExp = !filtroExp || exp === filtroExp;

        const mostrar = coincideBusqueda && coincideMarca && coincideCC && coincideDoc && coincideExp;
        fila.style.display = mostrar ? "" : "none";
        if (mostrar) visibles++;
    });

    document.getElementById("contadorVisible").textContent = visibles;
    const sinRes = document.getElementById("sinResultados");
    if (sinRes) sinRes.style.display = visibles === 0 ? "flex" : "none";
}

// =============================================
// LIMPIAR BÚSQUEDA
// =============================================
function limpiarBusqueda() {
    document.getElementById("inputBusqueda").value = "";
    filtrarCompetidores();
}

// =============================================
// RESETEAR FILTROS
// =============================================
function resetearFiltros() {
    document.getElementById("inputBusqueda").value       = "";
    document.getElementById("filtroCilindraje").value    = "";
    document.getElementById("filtroCC").value            = "";
    document.getElementById("filtroDocumento").value     = "";
    document.getElementById("filtroExperiencia").value   = "";
    filtrarCompetidores();
}

// =============================================
// ORDENAR TABLA
// =============================================
function ordenarPor(campo) {
    if (ordenActual.campo === campo) {
        ordenActual.asc = !ordenActual.asc;
    } else {
        ordenActual.campo = campo;
        ordenActual.asc = true;
    }

    const tbody = document.getElementById("cuerpoTabla");
    const filas = Array.from(tbody.querySelectorAll(".fila-competidor"));

    filas.sort((a, b) => {
        let valA, valB;
        switch (campo) {
            case "id":         valA = parseInt(a.dataset.id);       valB = parseInt(b.dataset.id);       break;
            case "nombre":     valA = a.dataset.nombre;              valB = b.dataset.nombre;              break;
            case "cilindraje": valA = parseInt(a.dataset.cc);        valB = parseInt(b.dataset.cc);        break;
            case "numero":     valA = parseInt(a.dataset.numero);    valB = parseInt(b.dataset.numero);    break;
            default: return 0;
        }
        if (valA < valB) return ordenActual.asc ? -1 : 1;
        if (valA > valB) return ordenActual.asc ? 1 : -1;
        return 0;
    });

    filas.forEach(f => tbody.appendChild(f));

    // ACTUALIZAR ICONO DE ORDEN
    document.querySelectorAll(".btn-orden").forEach(btn => {
        btn.querySelector("i").className = "fa-solid fa-sort";
    });
    const btnActivo = document.getElementById(`orden-${campo}`);
    if (btnActivo) {
        btnActivo.querySelector("i").className = ordenActual.asc
            ? "fa-solid fa-sort-up"
            : "fa-solid fa-sort-down";
    }
}

// =============================================
// ABRIR MODAL VER DETALLE
// =============================================
document.addEventListener("click", function (e) {
    const btnVer = e.target.closest(".btn-ver");
    if (btnVer) {
        const id = parseInt(btnVer.dataset.id);
        const c  = competidores.find(x => x.id === id);
        if (!c) return;
        abrirModal(c);
    }
});

function abrirModal(c) {
    document.getElementById("modalNumero").textContent  = c.numero_competidor;
    document.getElementById("modalNombre").textContent  = c.nombre_completo;
    document.getElementById("modalEquipo").textContent  = c.equipo || "Sin equipo";
    document.getElementById("modalId").textContent      = `#${c.id}`;
    document.getElementById("modalDocumento").textContent = `${c.tipo_documento.toUpperCase()} — ${c.numero_documento}`;
    document.getElementById("modalFecha").textContent   = c.fecha_nacimiento;
    document.getElementById("modalCiudad").textContent  = c.ciudad;
    document.getElementById("modalTelefono").textContent= c.telefono;
    document.getElementById("modalCorreo").textContent  = c.correo;
    document.getElementById("modalMarca").textContent   = c.marca_motocicleta;
    document.getElementById("modalModelo").textContent  = c.modelo_motocicleta;
    document.getElementById("modalCC").textContent      = `${c.cilindraje_motor} CC`;
    document.getElementById("modalExperiencia").textContent = c.experiencia === "si" ? "✅ SÍ" : "❌ NO";

    // GUARDAR ID DEL COMPETIDOR EN EL BOTÓN DE EDITAR (si existe)
    const btnEditarDetalle = document.getElementById("btnEditarDesdeDetalle");
    if (btnEditarDetalle) {
        btnEditarDetalle.dataset.id = c.id;
    }

    document.getElementById("modalOverlay").classList.add("activo");
    document.body.style.overflow = "hidden";
}

function cerrarModal() {
    document.getElementById("modalOverlay").classList.remove("activo");
    document.body.style.overflow = "";
}

// =============================================
// ABRIR MODAL EDITAR
// =============================================
function abrirModalEditar(id) {
    const c = competidores.find(x => x.id === parseInt(id));
    if (!c) return;

    competidorEnEdicion = c;

    // RELLENAR HEADER
    document.getElementById("editarNumeroHeader").textContent = c.numero_competidor;
    document.getElementById("editarNombreHeader").textContent = c.nombre_completo;

    // RELLENAR CAMPOS
    document.getElementById("editarId").value          = c.id;
    document.getElementById("editarNombre").value      = c.nombre_completo;
    document.getElementById("editarTipoDoc").value     = c.tipo_documento;
    document.getElementById("editarNumDoc").value      = c.numero_documento;
    document.getElementById("editarFecha").value       = c.fecha_nacimiento;
    document.getElementById("editarCiudad").value      = c.ciudad;
    document.getElementById("editarTelefono").value    = c.telefono;
    document.getElementById("editarCorreo").value      = c.correo;
    document.getElementById("editarEquipo").value      = c.equipo || "";
    document.getElementById("editarExperiencia").value = c.experiencia;
    document.getElementById("editarNumComp").value     = c.numero_competidor;
    document.getElementById("editarMarca").value       = c.marca_motocicleta;
    document.getElementById("editarModelo").value      = c.modelo_motocicleta;
    document.getElementById("editarCC").value          = c.cilindraje_motor;

    // LIMPIAR ERRORES PREVIOS
    limpiarErrores();

    // CERRAR MODAL DE VER (si está abierto)
    cerrarModal();

    // ABRIR MODAL EDITAR
    document.getElementById("modalEditarOverlay").classList.add("activo");
    document.body.style.overflow = "hidden";
}

function cerrarModalEditar() {
    document.getElementById("modalEditarOverlay").classList.remove("activo");
    document.body.style.overflow = "";
    competidorEnEdicion = null;
}

// Abrir editar desde botón en tabla O desde botón dentro del modal de ver
document.addEventListener("click", function (e) {
    const btnEditar = e.target.closest(".btn-editar");
    if (btnEditar) {
        abrirModalEditar(btnEditar.dataset.id);
    }
    const btnEditarDetalle = e.target.closest("#btnEditarDesdeDetalle");
    if (btnEditarDetalle) {
        abrirModalEditar(btnEditarDetalle.dataset.id);
    }
});

// =============================================
// VALIDACIÓN DEL FORMULARIO
// =============================================
function limpiarErrores() {
    document.querySelectorAll(".editar-error").forEach(el => el.textContent = "");
    document.querySelectorAll(".editar-input").forEach(el => el.classList.remove("input-invalido"));
}

function mostrarError(campoId, errorId, mensaje) {
    const input = document.getElementById(campoId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add("input-invalido");
    if (error) error.textContent = mensaje;
}

function validarFormulario() {
    limpiarErrores();
    let valido = true;

    const nombre   = document.getElementById("editarNombre").value.trim();
    const numDoc   = document.getElementById("editarNumDoc").value.trim();
    const fecha    = document.getElementById("editarFecha").value;
    const ciudad   = document.getElementById("editarCiudad").value.trim();
    const telefono = document.getElementById("editarTelefono").value.trim();
    const correo   = document.getElementById("editarCorreo").value.trim();
    const numComp  = document.getElementById("editarNumComp").value;
    const marca    = document.getElementById("editarMarca").value.trim();
    const modelo   = document.getElementById("editarModelo").value.trim();
    const cc       = document.getElementById("editarCC").value;

    if (!nombre || nombre.length < 3) {
        mostrarError("editarNombre", "errNombre", "Mínimo 3 caracteres");
        valido = false;
    }

    if (!numDoc || numDoc.length < 4) {
        mostrarError("editarNumDoc", "errNumDoc", "Número de documento inválido");
        valido = false;
    }

    if (!fecha) {
        mostrarError("editarFecha", "errFecha", "Selecciona una fecha");
        valido = false;
    } else {
        const hoy = new Date();
        const nacimiento = new Date(fecha);
        const edad = hoy.getFullYear() - nacimiento.getFullYear();
        if (edad < 16 || edad > 100) {
            mostrarError("editarFecha", "errFecha", "La edad debe estar entre 16 y 100 años");
            valido = false;
        }
    }

    if (!ciudad || ciudad.length < 2) {
        mostrarError("editarCiudad", "errCiudad", "Ingresa una ciudad válida");
        valido = false;
    }

    if (!telefono || !/^\d{7,15}$/.test(telefono)) {
        mostrarError("editarTelefono", "errTelefono", "Teléfono: solo dígitos (7-15 caracteres)");
        valido = false;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !regexEmail.test(correo)) {
        mostrarError("editarCorreo", "errCorreo", "Correo electrónico inválido");
        valido = false;
    }

    if (!numComp || parseInt(numComp) < 1) {
        mostrarError("editarNumComp", "errNumComp", "Número de competidor debe ser mayor a 0");
        valido = false;
    }

    if (!marca || marca.length < 2) {
        mostrarError("editarMarca", "errMarca", "Ingresa una marca válida");
        valido = false;
    }

    if (!modelo || modelo.length < 1) {
        mostrarError("editarModelo", "errModelo", "Ingresa un modelo válido");
        valido = false;
    }

    if (!cc || parseInt(cc) < 1) {
        mostrarError("editarCC", "errCC", "El cilindraje debe ser mayor a 0");
        valido = false;
    }

    return valido;
}

// =============================================
// CONFIRMAR Y ENVIAR ACTUALIZACIÓN
// =============================================
function confirmarActualizacion() {
    if (!validarFormulario()) {
        Swal.fire({
            title: "CAMPOS INVÁLIDOS",
            text: "Por favor corrige los campos marcados en rojo antes de continuar.",
            icon: "warning",
            confirmButtonText: "ENTENDIDO",
            confirmButtonColor: "#e10600",
            background: "#111",
            color: "#fff"
        });
        return;
    }

    const nombre = document.getElementById("editarNombre").value.trim();

    Swal.fire({
        title: "¿CONFIRMAR ACTUALIZACIÓN?",
        html: `¿Deseas guardar los cambios del competidor <strong>${nombre}</strong>?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-floppy-disk"></i> SÍ, GUARDAR',
        cancelButtonText: '<i class="fa-solid fa-xmark"></i> CANCELAR',
        confirmButtonColor: "#e10600",
        cancelButtonColor: "#333",
        background: "#111",
        color: "#fff",
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            enviarActualizacion();
        }
    });
}

async function enviarActualizacion() {
    const id = document.getElementById("editarId").value;
    const btnGuardar = document.querySelector(".btn-guardar-editar");
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GUARDANDO...';

    const formData = new FormData(document.getElementById("formEditar"));

    try {
        const response = await fetch(`/competidor/${id}`, {
            method: "PUT",
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // ACTUALIZAR DATOS EN MEMORIA
            const idx = competidores.findIndex(c => c.id === parseInt(id));
            if (idx !== -1) {
                competidores[idx].nombre_completo    = formData.get("full_name");
                competidores[idx].tipo_documento     = formData.get("document_type");
                competidores[idx].numero_documento   = formData.get("document_number");
                competidores[idx].fecha_nacimiento   = formData.get("birth_date");
                competidores[idx].ciudad             = formData.get("city");
                competidores[idx].telefono           = formData.get("phone");
                competidores[idx].correo             = formData.get("email");
                competidores[idx].equipo             = formData.get("team") || "";
                competidores[idx].experiencia        = formData.get("experience");
                competidores[idx].numero_competidor  = parseInt(formData.get("competitor_number"));
                competidores[idx].marca_motocicleta  = formData.get("motorcycle_brand");
                competidores[idx].modelo_motocicleta = formData.get("motorcycle_model");
                competidores[idx].cilindraje_motor   = parseInt(formData.get("engine_cc"));
            }

            cerrarModalEditar();

            Swal.fire({
                title: "¡ACTUALIZACIÓN EXITOSA!",
                text: "Los datos del competidor fueron actualizados correctamente.",
                icon: "success",
                confirmButtonText: "CONTINUAR",
                confirmButtonColor: "#e10600",
                background: "#111",
                color: "#fff"
            }).then(() => {
                // RECARGAR PARA REFLEJAR CAMBIOS EN LA TABLA
                window.location.reload();
            });

        } else {
            throw new Error(data.detail || "Error al actualizar");
        }

    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            title: "ERROR",
            text: "No se pudo actualizar el competidor. Intenta nuevamente.",
            icon: "error",
            confirmButtonText: "CERRAR",
            confirmButtonColor: "#e10600",
            background: "#111",
            color: "#fff"
        });
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> GUARDAR CAMBIOS';
    }
}

// =============================================
// ELIMINAR COMPETIDOR
// =============================================
document.addEventListener("click", function (e) {
    const btnEliminar = e.target.closest(".btn-eliminar");
    if (!btnEliminar) return;

    const id     = btnEliminar.dataset.id;
    const nombre = btnEliminar.dataset.nombre;

    Swal.fire({
        title: "¿ELIMINAR PILOTO?",
        html: `Esta acción eliminará permanentemente a <strong>${nombre}</strong> del campeonato.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-trash"></i> SÍ, ELIMINAR',
        cancelButtonText: "CANCELAR",
        confirmButtonColor: "#e10600",
        cancelButtonColor: "#333",
        background: "#111",
        color: "#fff",
        reverseButtons: true
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/competidor/${id}`, { method: "DELETE" });
            if (res.ok) {
                await Swal.fire({
                    title: "ELIMINADO",
                    text: `${nombre} ha sido eliminado del campeonato.`,
                    icon: "success",
                    confirmButtonText: "CONTINUAR",
                    confirmButtonColor: "#e10600",
                    background: "#111",
                    color: "#fff"
                });
                window.location.reload();
            } else {
                throw new Error("Error al eliminar");
            }
        } catch (err) {
            Swal.fire({
                title: "ERROR",
                text: "No se pudo eliminar el competidor.",
                icon: "error",
                confirmButtonText: "CERRAR",
                confirmButtonColor: "#e10600",
                background: "#111",
                color: "#fff"
            });
        }
    });
});

// =============================================
// CERRAR MODALES CON ESC
// =============================================
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        cerrarModal();
        cerrarModalEditar();
    }
});