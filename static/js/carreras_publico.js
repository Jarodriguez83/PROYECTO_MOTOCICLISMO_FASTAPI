console.log("carreras_publico.js cargado.");

// ============================================================
// FILTRADO POR CATEGORÍA
// ============================================================
function filtrarEventos(categoria, btnEl) {
    // Actualizar botones activos
    document.querySelectorAll(".btn-filtro-pub").forEach(b => b.classList.remove("activo"));
    if (btnEl) btnEl.classList.add("activo");

    const cards   = document.querySelectorAll(".card-evento");
    let visibles  = 0;

    cards.forEach(card => {
        if (categoria === "todos" || card.dataset.categoria === categoria) {
            card.style.display = "";
            visibles++;
        } else {
            card.style.display = "none";
        }
    });

    const sinEventos = document.getElementById("sinEventos");
    if (sinEventos) {
        sinEventos.style.display = visibles === 0 ? "block" : "none";
    }
}

// ============================================================
// MODAL INSCRIPCIÓN
// ============================================================
function abrirModalInscripcion(carreraId, nombreCarrera, categoriaMinima) {
    document.getElementById("modalNombreCarrera").textContent = nombreCarrera;
    if (document.getElementById("inputCarreraId")) {
        document.getElementById("inputCarreraId").value = carreraId;
    }

    // El servidor inyecta si el usuario está autenticado
    // Si no hay sesión (verificado por el backend al cargar la página),
    // siempre mostramos el bloque de no-autenticado en el front público.
    const esAutenticado = window.USUARIO_AUTENTICADO === true;

    const bloqueNoAuth = document.getElementById("bloqueNoAuth");
    const bloqueAuth   = document.getElementById("bloqueAuth");

    if (esAutenticado && bloqueAuth && bloqueNoAuth) {
        const info = document.getElementById("inscripcionInfoCarrera");
        if (info) {
            info.innerHTML = `
                <strong>CARRERA:</strong> ${nombreCarrera}<br>
                <strong>CATEGORÍA MÍNIMA:</strong> ${categoriaMinima.toUpperCase()}<br>
                <small style="color:#888;margin-top:6px;display:block;">
                    Tu categoría actual debe ser compatible para inscribirte.
                </small>
            `;
        }
        bloqueNoAuth.style.display = "none";
        bloqueAuth.style.display   = "block";
    } else {
        if (bloqueNoAuth) bloqueNoAuth.style.display = "block";
        if (bloqueAuth)   bloqueAuth.style.display   = "none";
    }

    const overlay = document.getElementById("modalInscripcionOverlay");
    overlay.classList.add("activo");
    document.body.style.overflow = "hidden";
}

function cerrarModalInscripcion() {
    document.getElementById("modalInscripcionOverlay").classList.remove("activo");
    document.body.style.overflow = "";
}

// ESC cierra el modal
document.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrarModalInscripcion();
});

// ============================================================
// ANIMACIÓN DE BARRAS DE OCUPACIÓN AL HACER SCROLL
// ============================================================
const observador = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fill = entry.target.querySelector(".ocup-fill");
            if (fill) {
                const pct = fill.style.width;
                fill.style.width = "0%";
                requestAnimationFrame(() => {
                    setTimeout(() => { fill.style.width = pct; }, 100);
                });
            }
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll(".card-evento").forEach(card => observador.observe(card));