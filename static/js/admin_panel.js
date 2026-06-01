/**
 * ============================================================
 * ADMIN PANEL JS — GP COLOMBIA
 * FIX: Botones de carrera ahora usan data-attributes en lugar
 * de parámetros inline en onclick, evitando errores JS con
 * caracteres especiales en nombres de carreras.
 * ============================================================
 */

console.log("admin_panel.js cargado correctamente.");

// ============================================================
// ESPERAR A QUE EL DOM ESTÉ LISTO
// ============================================================
document.addEventListener("DOMContentLoaded", function () {

    // ── Interceptar clicks de botones VER / EDITAR con capture=true
    //    para ejecutarse ANTES que carreras.js
    document.addEventListener("click", function (e) {

        // BOTÓN VER → modal extendido con categoría + stats
        const btnVer = e.target.closest(".btn-ver");
        if (btnVer) {
            e.stopImmediatePropagation();
            const competidores = obtenerCompetidores();
            const c = competidores.find(x => x.id === parseInt(btnVer.dataset.id));
            if (c) abrirModalVerAdmin(c);
            return;
        }

        // BOTÓN EDITAR en tabla
        const btnEditar = e.target.closest(".btn-editar");
        if (btnEditar && !btnEditar.classList.contains("btn-editar-desde-detalle")) {
            e.stopImmediatePropagation();
            abrirModalEditarAdmin(btnEditar.dataset.id);
            return;
        }

        // BOTÓN "EDITAR DESDE DETALLE"
        const btnDesdeDetalle = e.target.closest("#btnEditarDesdeDetalle");
        if (btnDesdeDetalle) {
            e.stopImmediatePropagation();
            abrirModalEditarAdmin(btnDesdeDetalle.dataset.id);
            return;
        }

        // ── BOTONES DE CARRERAS — usan data-attributes ──

        // TOGGLE ACTIVO/INACTIVO
        const btnToggle = e.target.closest(".btn-toggle-carrera");
        if (btnToggle) {
            const id = parseInt(btnToggle.dataset.carreraId);
            if (id) toggleCarrera(id, btnToggle);
            return;
        }

        // ELIMINAR CARRERA
        const btnEliminarCarrera = e.target.closest(".btn-eliminar-carrera");
        if (btnEliminarCarrera) {
            const id     = parseInt(btnEliminarCarrera.dataset.carreraId);
            const nombre = btnEliminarCarrera.dataset.carreraNombre || "esta carrera";
            if (id) eliminarCarrera(id, nombre);
            return;
        }

    }, true); // capture: true → se ejecuta antes que carreras.js

});

// ============================================================
// HELPER: obtener array de competidores del JSON embebido
// ============================================================
function obtenerCompetidores() {
    try {
        return JSON.parse(document.getElementById("datosCompetidores").textContent);
    } catch (e) {
        console.error("Error parseando competidores:", e);
        return [];
    }
}

// ============================================================
// SISTEMA DE TABS (COMPETIDORES ↔ CARRERAS)
// ============================================================
function cambiarTab(nombre, btnEl) {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("activo"));
    document.querySelectorAll(".admin-nav-btn").forEach(b => b.classList.remove("activo"));
    const tab = document.getElementById("tab-" + nombre);
    if (tab) tab.classList.add("activo");
    if (btnEl) btnEl.classList.add("activo");
}

// ============================================================
// MODAL VER — VERSIÓN EXTENDIDA (categoría + stats)
// ============================================================
function abrirModalVerAdmin(c) {
    const catLabels = {
        novato: "NOVATO", intermedio: "INTERMEDIO",
        experto: "EXPERTO", elite: "ÉLITE"
    };

    document.getElementById("modalNumero").textContent    = c.numero_competidor;
    document.getElementById("modalNombre").textContent    = c.nombre_completo;
    document.getElementById("modalEquipo").textContent    = c.equipo || "Sin equipo";
    document.getElementById("modalId").textContent        = "#" + c.id;

    const catEl = document.getElementById("modalCategoria");
    if (catEl) catEl.textContent = catLabels[c.categoria] || (c.categoria || "—").toUpperCase();

    document.getElementById("modalDocumento").textContent = (c.tipo_documento || "").toUpperCase() + " — " + c.numero_documento;
    document.getElementById("modalFecha").textContent     = c.fecha_nacimiento;
    document.getElementById("modalCiudad").textContent    = c.ciudad;
    document.getElementById("modalTelefono").textContent  = c.telefono;
    document.getElementById("modalCorreo").textContent    = c.correo;
    document.getElementById("modalMarca").textContent     = c.marca_motocicleta;
    document.getElementById("modalModelo").textContent    = c.modelo_motocicleta;
    document.getElementById("modalCC").textContent        = c.cilindraje_motor + " CC";
    document.getElementById("modalExperiencia").textContent = c.experiencia === "si" ? "✅ SÍ" : "❌ NO";

    const carrerasEl = document.getElementById("modalCarreras");
    const puntosEl   = document.getElementById("modalPuntos");
    const podiosEl   = document.getElementById("modalPodios");
    if (carrerasEl) carrerasEl.textContent = c.carreras_completadas != null ? c.carreras_completadas : 0;
    if (puntosEl)   puntosEl.textContent   = c.puntos_totales != null ? c.puntos_totales : 0;
    if (podiosEl)   podiosEl.textContent   = c.podios != null ? c.podios : 0;

    const btnEditar = document.getElementById("btnEditarDesdeDetalle");
    if (btnEditar) btnEditar.dataset.id = c.id;

    document.getElementById("modalOverlay").classList.add("activo");
    document.body.style.overflow = "hidden";
}

// ============================================================
// MODAL EDITAR — VERSIÓN EXTENDIDA (con campo categoría)
// ============================================================
function abrirModalEditarAdmin(id) {
    const competidores = obtenerCompetidores();
    const c = competidores.find(x => x.id === parseInt(id));
    if (!c) return;

    document.getElementById("editarNumeroHeader").textContent = c.numero_competidor;
    document.getElementById("editarNombreHeader").textContent = c.nombre_completo;
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

    const catEl = document.getElementById("editarCategoria");
    if (catEl) catEl.value = c.categoria || "novato";

    // Limpiar errores visuales
    document.querySelectorAll(".editar-error").forEach(el => { el.textContent = ""; });
    document.querySelectorAll(".editar-input").forEach(el => { el.classList.remove("input-invalido"); });

    // Cerrar modal de ver si estaba abierto
    document.getElementById("modalOverlay").classList.remove("activo");

    document.getElementById("modalEditarOverlay").classList.add("activo");
    document.body.style.overflow = "hidden";
}

// ============================================================
// MODAL NUEVA CARRERA — ABRIR / CERRAR
// ============================================================
function abrirModalNuevaCarrera() {
    const overlay = document.getElementById("modalNuevaCarreraOverlay");
    if (overlay) {
        overlay.classList.add("activo");
        document.body.style.overflow = "hidden";
    }
}

function cerrarModalNuevaCarrera() {
    const overlay = document.getElementById("modalNuevaCarreraOverlay");
    if (!overlay) return;
    overlay.classList.remove("activo");
    document.body.style.overflow = "";

    const form = document.getElementById("formNuevaCarrera");
    if (!form) return;
    form.querySelectorAll("input[type=text], input[type=url], input[type=time]").forEach(el => { el.value = ""; });
    form.querySelectorAll("textarea").forEach(el => { el.value = ""; });
    form.querySelectorAll("input[type=date]").forEach(el => { el.value = ""; });
    form.querySelectorAll("input[type=number]").forEach(el => {
        const defaults = { cupos_totales: "30", puntos_primer_lugar: "25", puntos_segundo_lugar: "18", puntos_tercer_lugar: "15" };
        el.value = defaults[el.name] !== undefined ? defaults[el.name] : "";
    });
    form.querySelectorAll("select").forEach(el => { el.selectedIndex = 0; });
}

// ============================================================
// GUARDAR NUEVA CARRERA
// ============================================================
async function guardarNuevaCarrera() {
    const form = document.getElementById("formNuevaCarrera");
    if (!form) return;

    const nombre      = (document.getElementById("nc_nombre")?.value || "").trim();
    const descripcion = (document.getElementById("nc_descripcion")?.value || "").trim();
    const ubicacion   = (document.getElementById("nc_ubicacion")?.value || "").trim();
    const fecha       = (document.getElementById("nc_fecha")?.value || "").trim();

    if (!nombre || !descripcion || !ubicacion || !fecha) {
        Swal.fire({
            title: "CAMPOS OBLIGATORIOS",
            text: "Completa al menos: nombre, descripción, ubicación y fecha.",
            icon: "warning",
            confirmButtonText: "ENTENDIDO",
            confirmButtonColor: "#e10600",
            background: "#111",
            color: "#fff"
        });
        return;
    }

    const btn = document.querySelector("#modalNuevaCarrera .btn-guardar-editar");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CREANDO...';
    }

    try {
        const formData = new FormData(form);
        const res = await fetch("/admin/carrera", { method: "POST", body: formData });
        const data = await res.json();

        if (res.ok && data.success) {
            cerrarModalNuevaCarrera();
            await Swal.fire({
                title: "¡CARRERA CREADA!",
                text: "La carrera fue agregada al calendario 2026.",
                icon: "success",
                confirmButtonText: "VER CARRERAS",
                confirmButtonColor: "#e10600",
                background: "#111",
                color: "#fff"
            });
            window.location.reload();
        } else {
            throw new Error(data.detail || "Error al crear la carrera");
        }
    } catch (err) {
        console.error(err);
        Swal.fire({
            title: "ERROR",
            text: "No se pudo crear la carrera. Verifica los datos.",
            icon: "error",
            confirmButtonText: "CERRAR",
            confirmButtonColor: "#e10600",
            background: "#111",
            color: "#fff"
        });
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> CREAR CARRERA';
        }
    }
}

// ============================================================
// TOGGLE ACTIVO / INACTIVO — llamado desde event listener
// ============================================================
async function toggleCarrera(id, btnEl) {
    try {
        const res  = await fetch("/admin/carrera/" + id + "/toggle", { method: "PATCH" });
        const data = await res.json();

        if (res.ok && data.success) {
            const card        = btnEl.closest(".card-carrera-admin");
            const badgeEstado = card ? card.querySelector(".badge-estado") : null;

            if (data.activa) {
                btnEl.classList.remove("btn-activar");
                btnEl.classList.add("btn-desactivar");
                btnEl.innerHTML = '<i class="fa-solid fa-eye-slash"></i> DESACTIVAR';
                if (card)        card.classList.remove("carrera-inactiva");
                if (badgeEstado) { badgeEstado.className = "badge-estado badge-activo"; badgeEstado.textContent = "ACTIVA"; }
            } else {
                btnEl.classList.remove("btn-desactivar");
                btnEl.classList.add("btn-activar");
                btnEl.innerHTML = '<i class="fa-solid fa-eye"></i> ACTIVAR';
                if (card)        card.classList.add("carrera-inactiva");
                if (badgeEstado) { badgeEstado.className = "badge-estado badge-inactivo"; badgeEstado.textContent = "INACTIVA"; }
            }
        } else {
            throw new Error("Error al cambiar estado");
        }
    } catch (err) {
        console.error(err);
        Swal.fire({ title: "ERROR", text: "No se pudo cambiar el estado de la carrera.", icon: "error", confirmButtonColor: "#e10600", background: "#111", color: "#fff" });
    }
}

// ============================================================
// ELIMINAR CARRERA — llamado desde event listener
// ============================================================
async function eliminarCarrera(id, nombre) {
    const result = await Swal.fire({
        title: "¿ELIMINAR CARRERA?",
        html: "Esta acción eliminará permanentemente <strong>" + nombre + "</strong> y todas sus inscripciones.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-trash"></i> SÍ, ELIMINAR',
        cancelButtonText: "CANCELAR",
        confirmButtonColor: "#e10600",
        cancelButtonColor: "#333",
        background: "#111",
        color: "#fff",
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        const res  = await fetch("/admin/carrera/" + id, { method: "DELETE" });
        const data = await res.json();

        if (res.ok && data.success) {
            await Swal.fire({
                title: "CARRERA ELIMINADA",
                text: nombre + " fue eliminada del calendario.",
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
        console.error(err);
        Swal.fire({ title: "ERROR", text: "No se pudo eliminar la carrera.", icon: "error", confirmButtonColor: "#e10600", background: "#111", color: "#fff" });
    }
}

// ============================================================
// FILTRAR COMPETIDORES — sobreescribe la de carreras.js
// añadiendo el filtro de categoría exclusivo del admin
// ============================================================
function filtrarCompetidores() {
    const busqueda  = (document.getElementById("inputBusqueda")?.value || "").trim().toLowerCase();
    const filtroCil = (document.getElementById("filtroCilindraje")?.value || "").toLowerCase();
    const filtroCC  = document.getElementById("filtroCC")?.value || "";
    const filtroDoc = (document.getElementById("filtroDocumento")?.value || "").toLowerCase();
    const filtroExp = (document.getElementById("filtroExperiencia")?.value || "").toLowerCase();
    const filtroCat = (document.getElementById("filtroCategoria")?.value || "").toLowerCase();

    const filas    = document.querySelectorAll("#cuerpoTabla .fila-competidor");
    let visibles = 0;

    filas.forEach(fila => {
        const id    = fila.dataset.id    || "";
        const nombre= fila.dataset.nombre|| "";
        const tel   = fila.dataset.telefono || "";
        const num   = fila.dataset.numero   || "";
        const marca = fila.dataset.marca    || "";
        const cc    = parseInt(fila.dataset.cc) || 0;
        const doc   = fila.dataset.documento   || "";
        const exp   = fila.dataset.experiencia || "";
        const cat   = fila.dataset.categoria   || "";

        const okBusqueda = !busqueda  || id.includes(busqueda) || tel.includes(busqueda) || num.includes(busqueda) || nombre.includes(busqueda);
        const okMarca    = !filtroCil || marca === filtroCil;
        const okDoc      = !filtroDoc || doc   === filtroDoc;
        const okExp      = !filtroExp || exp   === filtroExp;
        const okCat      = !filtroCat || cat   === filtroCat;

        let okCC = true;
        if (filtroCC) {
            if (filtroCC === "1001 +") { okCC = cc > 1000; }
            else { const parts = filtroCC.split("-").map(Number); okCC = cc >= parts[0] && cc <= parts[1]; }
        }

        const mostrar = okBusqueda && okMarca && okCC && okDoc && okExp && okCat;
        fila.style.display = mostrar ? "" : "none";
        if (mostrar) visibles++;
    });

    const contEl = document.getElementById("contadorVisible");
    if (contEl) contEl.textContent = visibles;

    const sinRes = document.getElementById("sinResultados");
    if (sinRes) sinRes.style.display = visibles === 0 ? "flex" : "none";
}

function limpiarBusqueda() {
    const el = document.getElementById("inputBusqueda");
    if (el) el.value = "";
    filtrarCompetidores();
}

function resetearFiltros() {
    ["inputBusqueda","filtroCilindraje","filtroCC","filtroDocumento","filtroExperiencia","filtroCategoria"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    filtrarCompetidores();
}

// ============================================================
// ESTILOS ADICIONALES INYECTADOS
// ============================================================
(function() {
    const style = document.createElement("style");
    style.textContent = [
        ".badge-categoria { display:inline-block; font-size:10px; font-weight:700; letter-spacing:2px; padding:4px 10px; text-transform:uppercase; }",
        ".badge-cat-novato     { background:rgba(78,163,255,0.15); color:#4ea3ff; border:1px solid rgba(78,163,255,0.3); }",
        ".badge-cat-intermedio { background:rgba(255,168,0,0.15);  color:#ffa800; border:1px solid rgba(255,168,0,0.3); }",
        ".badge-cat-experto    { background:rgba(225,6,0,0.15);    color:#ff6666; border:1px solid rgba(225,6,0,0.3); }",
        ".badge-cat-elite      { background:rgba(212,175,55,0.15); color:#d4af37; border:1px solid rgba(212,175,55,0.3); }",
        ".celda-center { text-align:center; font-family:'Bebas Neue',sans-serif; font-size:16px; letter-spacing:1px; }",
        ".editar-textarea { resize:vertical; min-height:80px; background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); color:white; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:600; padding:10px; width:100%; box-sizing:border-box; transition:border-color 0.2s; }",
        ".editar-textarea:focus { outline:none; border-color:#e10600; }",
        "#modalNuevaCarrera { max-width:860px !important; }",
        ".input-invalido { border-color:#e10600 !important; background:rgba(225,6,0,0.05) !important; }"
    ].join("\n");
    document.head.appendChild(style);
})();

// ============================================================
// ESC cierra modales
// ============================================================
document.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrarModalNuevaCarrera();
});