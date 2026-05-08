console.log("carreras.js cargado correctamente.");

// ============================================================
// DATOS JSON EMBEBIDOS EN EL HTML
// ============================================================
const datosRaw = document.getElementById("datosCompetidores");
let competidores = [];
try {
    competidores = JSON.parse(datosRaw.textContent);
} catch (e) {
    console.error("Error al parsear competidores:", e);
}

let ordenActual = { campo: null, asc: true };

// ============================================================
// FILTRAR
// ============================================================
function filtrarCompetidores() {
    const busqueda  = document.getElementById("inputBusqueda").value.trim().toLowerCase();
    const filtroCil = document.getElementById("filtroCilindraje").value.toLowerCase();
    const filtroCC  = document.getElementById("filtroCC").value;
    const filtroDoc = document.getElementById("filtroDocumento").value.toLowerCase();
    const filtroExp = document.getElementById("filtroExperiencia").value.toLowerCase();

    const filas = document.querySelectorAll("#cuerpoTabla .fila-competidor");
    let visibles = 0;

    filas.forEach(fila => {
        const id     = fila.dataset.id;
        const nombre = fila.dataset.nombre;
        const tel    = fila.dataset.telefono;
        const num    = fila.dataset.numero;
        const marca  = fila.dataset.marca;
        const cc     = parseInt(fila.dataset.cc);
        const doc    = fila.dataset.documento;
        const exp    = fila.dataset.experiencia;

        const coincideBusqueda = !busqueda ||
            id.includes(busqueda) || tel.includes(busqueda) ||
            num.includes(busqueda) || nombre.includes(busqueda);

        const coincideMarca = !filtroCil || marca === filtroCil;

        let coincideCC = true;
        if (filtroCC) {
            if (filtroCC === "1001 +") {
                coincideCC = cc > 1000;
            } else {
                const [min, max] = filtroCC.split("-").map(Number);
                coincideCC = cc >= min && cc <= max;
            }
        }

        const coincideDoc = !filtroDoc || doc === filtroDoc;
        const coincideExp = !filtroExp || exp === filtroExp;

        const mostrar = coincideBusqueda && coincideMarca && coincideCC && coincideDoc && coincideExp;
        fila.style.display = mostrar ? "" : "none";
        if (mostrar) visibles++;
    });

    document.getElementById("contadorVisible").textContent = visibles;
    const sinRes = document.getElementById("sinResultados");
    if (sinRes) sinRes.style.display = visibles === 0 ? "flex" : "none";
}

function limpiarBusqueda() {
    document.getElementById("inputBusqueda").value = "";
    filtrarCompetidores();
}

function resetearFiltros() {
    document.getElementById("inputBusqueda").value     = "";
    document.getElementById("filtroCilindraje").value  = "";
    document.getElementById("filtroCC").value          = "";
    document.getElementById("filtroDocumento").value   = "";
    document.getElementById("filtroExperiencia").value = "";
    filtrarCompetidores();
}

// ============================================================
// ORDENAR
// ============================================================
function ordenarPor(campo) {
    ordenActual.asc = ordenActual.campo === campo ? !ordenActual.asc : true;
    ordenActual.campo = campo;

    const tbody = document.getElementById("cuerpoTabla");
    const filas = Array.from(tbody.querySelectorAll(".fila-competidor"));

    filas.sort((a, b) => {
        let vA, vB;
        if (campo === "id")         { vA = parseInt(a.dataset.id);     vB = parseInt(b.dataset.id); }
        else if (campo === "nombre"){ vA = a.dataset.nombre;            vB = b.dataset.nombre; }
        else if (campo === "cilindraje") { vA = parseInt(a.dataset.cc); vB = parseInt(b.dataset.cc); }
        else if (campo === "numero"){ vA = parseInt(a.dataset.numero);  vB = parseInt(b.dataset.numero); }
        else return 0;

        if (vA < vB) return ordenActual.asc ? -1 : 1;
        if (vA > vB) return ordenActual.asc ?  1 : -1;
        return 0;
    });

    filas.forEach(f => tbody.appendChild(f));

    document.querySelectorAll(".btn-orden").forEach(btn => {
        btn.querySelector("i").className = "fa-solid fa-sort";
    });
    const btnActivo = document.getElementById(`orden-${campo}`);
    if (btnActivo) {
        btnActivo.querySelector("i").className =
            ordenActual.asc ? "fa-solid fa-sort-up" : "fa-solid fa-sort-down";
    }
}

// ============================================================
// MODAL VER DETALLE
// ============================================================
document.addEventListener("click", e => {
    const btnVer = e.target.closest(".btn-ver");
    if (!btnVer) return;
    const c = competidores.find(x => x.id === parseInt(btnVer.dataset.id));
    if (c) abrirModalVer(c);
});

function abrirModalVer(c) {
    document.getElementById("modalNumero").textContent   = c.numero_competidor;
    document.getElementById("modalNombre").textContent   = c.nombre_completo;
    document.getElementById("modalEquipo").textContent   = c.equipo || "Sin equipo";
    document.getElementById("modalId").textContent       = `#${c.id}`;
    document.getElementById("modalDocumento").textContent= `${c.tipo_documento.toUpperCase()} — ${c.numero_documento}`;
    document.getElementById("modalFecha").textContent    = c.fecha_nacimiento;
    document.getElementById("modalCiudad").textContent   = c.ciudad;
    document.getElementById("modalTelefono").textContent = c.telefono;
    document.getElementById("modalCorreo").textContent   = c.correo;
    document.getElementById("modalMarca").textContent    = c.marca_motocicleta;
    document.getElementById("modalModelo").textContent   = c.modelo_motocicleta;
    document.getElementById("modalCC").textContent       = `${c.cilindraje_motor} CC`;
    document.getElementById("modalExperiencia").textContent = c.experiencia === "si" ? "✅ SÍ" : "❌ NO";

    const btnEditar = document.getElementById("btnEditarDesdeDetalle");
    if (btnEditar) btnEditar.dataset.id = c.id;

    document.getElementById("modalOverlay").classList.add("activo");
    document.body.style.overflow = "hidden";
}

function cerrarModal() {
    document.getElementById("modalOverlay").classList.remove("activo");
    document.body.style.overflow = "";
}

// ============================================================
// MODAL EDITAR
// ============================================================
document.addEventListener("click", e => {
    // Botón editar en tabla
    const btnEditar = e.target.closest(".btn-editar");
    if (btnEditar) { abrirModalEditar(btnEditar.dataset.id); return; }

    // Botón editar desde el modal de ver detalle
    const btnDesdeDetalle = e.target.closest("#btnEditarDesdeDetalle");
    if (btnDesdeDetalle) { abrirModalEditar(btnDesdeDetalle.dataset.id); }
});

function abrirModalEditar(id) {
    const c = competidores.find(x => x.id === parseInt(id));
    if (!c) return;

    // Header del modal
    document.getElementById("editarNumeroHeader").textContent = c.numero_competidor;
    document.getElementById("editarNombreHeader").textContent = c.nombre_completo;

    // Campos del formulario
    document.getElementById("editarId").value           = c.id;
    document.getElementById("editarNombre").value       = c.nombre_completo;
    document.getElementById("editarTipoDoc").value      = c.tipo_documento;
    document.getElementById("editarNumDoc").value       = c.numero_documento;
    document.getElementById("editarFecha").value        = c.fecha_nacimiento;
    document.getElementById("editarCiudad").value       = c.ciudad;
    document.getElementById("editarTelefono").value     = c.telefono;
    document.getElementById("editarCorreo").value       = c.correo;
    document.getElementById("editarEquipo").value       = c.equipo || "";
    document.getElementById("editarExperiencia").value  = c.experiencia;
    document.getElementById("editarNumComp").value      = c.numero_competidor;
    document.getElementById("editarMarca").value        = c.marca_motocicleta;
    document.getElementById("editarModelo").value       = c.modelo_motocicleta;
    document.getElementById("editarCC").value           = c.cilindraje_motor;

    limpiarErrores();
    cerrarModal();  // cierra el modal de ver si estaba abierto

    document.getElementById("modalEditarOverlay").classList.add("activo");
    document.body.style.overflow = "hidden";
}

function cerrarModalEditar() {
    document.getElementById("modalEditarOverlay").classList.remove("activo");
    document.body.style.overflow = "";
}

// ============================================================
// VALIDACIÓN
// ============================================================
function limpiarErrores() {
    document.querySelectorAll(".editar-error").forEach(el => el.textContent = "");
    document.querySelectorAll(".editar-input").forEach(el => el.classList.remove("input-invalido"));
}

function marcarError(inputId, errorId, mensaje) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add("input-invalido");
    if (error) error.textContent = mensaje;
}

function validarFormulario() {
    limpiarErrores();
    let ok = true;

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

    if (nombre.length < 3)  { marcarError("editarNombre",   "errNombre",   "MÍNIMO 3 CARACTERES"); ok = false; }
    if (numDoc.length < 4)  { marcarError("editarNumDoc",   "errNumDoc",   "DOCUMENTO INVÁLIDO");  ok = false; }

    if (!fecha) {
        marcarError("editarFecha", "errFecha", "SELECCIONA UNA FECHA"); ok = false;
    } else {
        const edad = new Date().getFullYear() - new Date(fecha).getFullYear();
        if (edad < 16 || edad > 100) {
            marcarError("editarFecha", "errFecha", "EDAD DEBE ESTAR ENTRE 16 Y 100 AÑOS"); ok = false;
        }
    }

    if (ciudad.length < 2)                   { marcarError("editarCiudad",   "errCiudad",   "CIUDAD INVÁLIDA");                   ok = false; }
    if (!/^\d{7,15}$/.test(telefono))        { marcarError("editarTelefono", "errTelefono", "SOLO DÍGITOS (7-15 CARACTERES)");    ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { marcarError("editarCorreo", "errCorreo", "CORREO INVÁLIDO");               ok = false; }
    if (!numComp || parseInt(numComp) < 1)   { marcarError("editarNumComp",  "errNumComp",  "DEBE SER MAYOR A 0");               ok = false; }
    if (marca.length < 2)                    { marcarError("editarMarca",    "errMarca",    "MARCA INVÁLIDA");                   ok = false; }
    if (modelo.length < 1)                   { marcarError("editarModelo",   "errModelo",   "MODELO INVÁLIDO");                  ok = false; }
    if (!cc || parseInt(cc) < 1)             { marcarError("editarCC",       "errCC",       "CILINDRAJE DEBE SER MAYOR A 0");   ok = false; }

    return ok;
}

// ============================================================
// CONFIRMAR Y ENVIAR ACTUALIZACIÓN
// ============================================================
function confirmarActualizacion() {
    if (!validarFormulario()) {
        Swal.fire({
            title: "CAMPOS INVÁLIDOS",
            text: "Corrige los campos marcados en rojo antes de continuar.",
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
        html: `¿Deseas guardar los cambios de <strong>${nombre}</strong>?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-floppy-disk"></i> SÍ, GUARDAR',
        cancelButtonText:  '<i class="fa-solid fa-xmark"></i> CANCELAR',
        confirmButtonColor: "#e10600",
        cancelButtonColor:  "#333",
        background: "#111",
        color: "#fff",
        reverseButtons: true
    }).then(result => {
        if (result.isConfirmed) enviarActualizacion();
    });
}

async function enviarActualizacion() {
    const id = document.getElementById("editarId").value;
    const btn = document.querySelector(".btn-guardar-editar");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GUARDANDO...';

    try {
        const res = await fetch(`/competidor/${id}`, {
            method: "PUT",
            body: new FormData(document.getElementById("formEditar"))
        });

        const data = await res.json();

        if (res.ok && data.success) {
            cerrarModalEditar();
            await Swal.fire({
                title: "¡ACTUALIZACIÓN EXITOSA!",
                text: "Los datos fueron actualizados correctamente.",
                icon: "success",
                confirmButtonText: "CONTINUAR",
                confirmButtonColor: "#e10600",
                background: "#111",
                color: "#fff"
            });
            window.location.reload();
        } else {
            throw new Error(data.detail || "Error al actualizar");
        }
    } catch (err) {
        console.error(err);
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
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> GUARDAR CAMBIOS';
    }
}

// ============================================================
// ELIMINAR   ← llama a DELETE /competidor/{id}
// ============================================================
document.addEventListener("click", e => {
    const btn = e.target.closest(".btn-eliminar");
    if (!btn) return;

    const id     = btn.dataset.id;
    const nombre = btn.dataset.nombre;

    Swal.fire({
        title: "¿ELIMINAR PILOTO?",
        html: `Esta acción eliminará permanentemente a <strong>${nombre}</strong>.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-trash"></i> SÍ, ELIMINAR',
        cancelButtonText:  "CANCELAR",
        confirmButtonColor: "#e10600",
        cancelButtonColor:  "#333",
        background: "#111",
        color: "#fff",
        reverseButtons: true
    }).then(async result => {
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

// ============================================================
// ESC cierra cualquier modal abierto
// ============================================================
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        cerrarModal();
        cerrarModalEditar();
    }
});