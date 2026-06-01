/**
 * ============================================================
 * carreras_publico.js — GP COLOMBIA 2026
 * Sistema de inscripción con verificación de credenciales inline
 * ============================================================
 */

console.log("carreras_publico.js cargado.");

// Estado del modal
let carreraActivaId       = null;
let carreraActivaNombre   = null;
let carreraActivaCategoria = null;

// ============================================================
// FILTRADO POR CATEGORÍA
// ============================================================
function filtrarEventos(categoria, btnEl) {
    document.querySelectorAll(".btn-filtro-pub").forEach(b => b.classList.remove("activo"));
    if (btnEl) btnEl.classList.add("activo");

    const cards  = document.querySelectorAll(".card-evento");
    let visibles = 0;

    cards.forEach(card => {
        const mostrar = (categoria === "todos" || card.dataset.categoria === categoria);
        card.style.display = mostrar ? "" : "none";
        if (mostrar) visibles++;
    });

    const sinEventos = document.getElementById("sinEventos");
    if (sinEventos) sinEventos.style.display = visibles === 0 ? "block" : "none";
}

// ============================================================
// ABRIR MODAL — con verificación de sesión activa
// ============================================================
async function abrirModalInscripcion(carreraId, nombreCarrera, categoriaMinima) {
    carreraActivaId        = carreraId;
    carreraActivaNombre    = nombreCarrera;
    carreraActivaCategoria = categoriaMinima;

    // Actualizar header del modal
    document.getElementById("modalNombreCarrera").textContent = nombreCarrera;
    document.getElementById("modalTituloTexto").textContent   = "INSCRIPCIÓN";

    // Mostrar badge de categoría requerida bajo el título
    const subtitulo = document.getElementById("modalNombreCarrera");
    subtitulo.innerHTML = `
        ${nombreCarrera}
        <span class="modal-cat-badge modal-cat-${categoriaMinima}" style="display:inline-flex;margin-left:8px;">
            ${categoriaMinima.toUpperCase()}+
        </span>
    `;

    // Resetear formulario al estado inicial
    resetarModal();

    // Verificar si hay sesión activa
    try {
        const res  = await fetch("/api/sesion");
        const data = await res.json();

        if (data.autenticado) {
            // Usuario ya autenticado → rellenar correo y ocultar campo
            document.getElementById("inscripcionEmail").value    = data.correo;
            document.getElementById("inscripcionEmail").readOnly = true;
            document.getElementById("inscripcionEmail").style.opacity = "0.6";

            // Mostrar info del usuario logueado
            mostrarInfoUsuarioActivo(data);
        } else {
            document.getElementById("inscripcionEmail").readOnly = false;
            document.getElementById("inscripcionEmail").style.opacity = "1";
            ocultarInfoUsuarioActivo();
        }
    } catch (e) {
        // Si falla el check, dejar formulario normal
        document.getElementById("inscripcionEmail").readOnly = false;
    }

    // Abrir overlay
    document.getElementById("modalInscripcionOverlay").classList.add("activo");
    document.body.style.overflow = "hidden";

    // Foco en el campo correo o contraseña
    setTimeout(() => {
        const emailField = document.getElementById("inscripcionEmail");
        if (emailField.readOnly) {
            document.getElementById("inscripcionPassword").focus();
        } else {
            emailField.focus();
        }
    }, 150);
}

function mostrarInfoUsuarioActivo(data) {
    // Añadir o actualizar banner de usuario logueado
    let banner = document.getElementById("usuarioActivoBanner");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "usuarioActivoBanner";
        banner.style.cssText = `
            background: rgba(0,200,80,0.06);
            border: 1px solid rgba(0,200,80,0.2);
            padding: 10px 14px;
            margin-bottom: 12px;
            font-size: 12px;
            color: #66dd99;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        const form = document.getElementById("inscripcionForm");
        if (form) form.insertBefore(banner, form.firstChild);
        else {
            const paso = document.getElementById("pasoLogin");
            const firstChild = paso.querySelector(".inscripcion-form-login");
            if (firstChild) firstChild.insertBefore(banner, firstChild.firstChild);
        }
    }
    const cats = {novato:"NOVATO", intermedio:"INTERMEDIO", experto:"EXPERTO", elite:"ÉLITE"};
    banner.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color:#00c850"></i>
        Sesión activa: <strong style="color:#fff">${data.nombre}</strong>
        &nbsp;·&nbsp; Categoría: <strong style="color:#e10600">${cats[data.categoria] || data.categoria.toUpperCase()}</strong>
    `;
    banner.style.display = "flex";
}

function ocultarInfoUsuarioActivo() {
    const banner = document.getElementById("usuarioActivoBanner");
    if (banner) banner.style.display = "none";
}

function cerrarModalInscripcion() {
    document.getElementById("modalInscripcionOverlay").classList.remove("activo");
    document.body.style.overflow = "";
    setTimeout(resetarModal, 300);
}

function resetarModal() {
    // Volver al paso 1
    document.getElementById("pasoLogin").style.display  = "block";
    document.getElementById("pasoExito").style.display  = "none";

    // Limpiar campos
    document.getElementById("inscripcionEmail").value    = "";
    document.getElementById("inscripcionPassword").value = "";
    document.getElementById("inscripcionEmail").readOnly = false;
    document.getElementById("inscripcionEmail").style.opacity = "1";

    // Ocultar error
    ocultarErrorLogin();

    // Restaurar botón
    const btn = document.getElementById("btnVerificarLogin");
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span id="btnLoginTexto">VERIFICAR E INSCRIBIRME</span>';
    }

    // Restaurar ojo de contraseña
    const passInput = document.getElementById("inscripcionPassword");
    if (passInput) passInput.type = "password";
    const icono = document.getElementById("iconoTogglePass");
    if (icono) icono.className = "fa-solid fa-eye";
}

// ============================================================
// TOGGLE OJO CONTRASEÑA
// ============================================================
function toggleInscripcionPass() {
    const input = document.getElementById("inscripcionPassword");
    const icono = document.getElementById("iconoTogglePass");
    if (input.type === "password") {
        input.type = "text";
        icono.className = "fa-solid fa-eye-slash";
    } else {
        input.type = "password";
        icono.className = "fa-solid fa-eye";
    }
}

// ============================================================
// MOSTRAR / OCULTAR ERROR
// ============================================================
function mostrarErrorLogin(mensaje) {
    const el  = document.getElementById("loginError");
    const msg = document.getElementById("loginErrorMsg");
    if (el && msg) {
        msg.textContent = mensaje;
        el.style.display = "flex";
        el.style.animation = "none";
        requestAnimationFrame(() => {
            el.style.animation = "fadeInShake 0.4s ease";
        });
    }
}

function ocultarErrorLogin() {
    const el = document.getElementById("loginError");
    if (el) el.style.display = "none";
}

// ============================================================
// VERIFICAR CREDENCIALES E INSCRIBIR — FUNCIÓN PRINCIPAL
// ============================================================
async function verificarYInscribir() {
    const email    = document.getElementById("inscripcionEmail").value.trim();
    const password = document.getElementById("inscripcionPassword").value;
    const btn      = document.getElementById("btnVerificarLogin");

    // Validaciones básicas en cliente
    ocultarErrorLogin();

    if (!email) {
        mostrarErrorLogin("Ingresa tu correo electrónico.");
        document.getElementById("inscripcionEmail").focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarErrorLogin("El correo electrónico no es válido.");
        document.getElementById("inscripcionEmail").focus();
        return;
    }

    if (!password || password.length < 6) {
        mostrarErrorLogin("Ingresa tu contraseña.");
        document.getElementById("inscripcionPassword").focus();
        return;
    }

    if (!carreraActivaId) {
        mostrarErrorLogin("Error: no se seleccionó ninguna carrera.");
        return;
    }

    // Estado cargando
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> VERIFICANDO...';

    try {
        const res = await fetch("/api/inscribirse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email:      email,
                password:   password,
                carrera_id: carreraActivaId,
            }),
        });

        const data = await res.json();

        if (data.success) {
            mostrarPasoExito(data);
            actualizarContadorCupos(carreraActivaId, data.cupos_restantes);
        } else {
            // Mapeo de errores a mensajes amigables
            const mensajes = {
                credenciales_invalidas: "Correo o contraseña incorrectos. Verifica tus datos.",
                cuenta_inactiva:        "Tu cuenta está inactiva. Contacta al administrador.",
                sin_perfil:             "No se encontró perfil de competidor vinculado a tu cuenta.",
                carrera_no_existe:      "La carrera ya no está disponible.",
                categoria_insuficiente: data.message || "Tu categoría no es suficiente para esta carrera.",
                sin_cupos:              "¡Los cupos se agotaron! Ya no hay lugares disponibles.",
                ya_inscrito:            "Ya estás inscrito en esta carrera.",
                datos_invalidos:        "Datos inválidos. Verifica el formulario.",
            };
            mostrarErrorLogin(mensajes[data.error] || data.message || "Ocurrió un error inesperado.");
        }

    } catch (err) {
        console.error("Error inscripción:", err);
        mostrarErrorLogin("Error de conexión. Intenta nuevamente.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>VERIFICAR E INSCRIBIRME</span>';
    }
}

// ============================================================
// MOSTRAR PASO DE ÉXITO
// ============================================================
function mostrarPasoExito(data) {
    const cats = {
        novato:     "🏁 NOVATO",
        intermedio: "⚡ INTERMEDIO",
        experto:    "🏆 EXPERTO",
        elite:      "👑 ÉLITE PROFESIONAL",
    };

    document.getElementById("exitoNombrePiloto").textContent    = data.piloto || "—";
    document.getElementById("exitoCategoriaPiloto").textContent = cats[data.categoria] || (data.categoria || "").toUpperCase();
    document.getElementById("exitoNumeroPiloto").textContent    = data.numero || "#";
    document.getElementById("exitoNombreCarrera").textContent   = `✓ INSCRITO EN: ${data.carrera}`;

    const cuposEl = document.getElementById("exitoCuposRestantes");
    if (data.cupos_restantes !== undefined) {
        cuposEl.textContent = `Cupos restantes: ${data.cupos_restantes}`;
    }

    // Transición con animación
    const pasoLogin = document.getElementById("pasoLogin");
    const pasoExito = document.getElementById("pasoExito");

    pasoLogin.style.opacity    = "0";
    pasoLogin.style.transition = "opacity 0.25s";

    setTimeout(() => {
        pasoLogin.style.display = "none";
        pasoExito.style.display = "block";
        pasoExito.style.opacity = "0";
        pasoExito.style.transition = "opacity 0.3s";

        requestAnimationFrame(() => {
            pasoExito.style.opacity = "1";
        });
    }, 250);
}

// ============================================================
// ACTUALIZAR CONTADORES DE CUPOS EN TARJETAS
// ============================================================
function actualizarContadorCupos(carreraId, cuposRestantes) {
    // Buscar la card correspondiente y actualizar la barra y badge
    const botones = document.querySelectorAll(`.btn-inscribirse[onclick*="${carreraId}"]`);
    botones.forEach(btn => {
        const card = btn.closest(".card-evento");
        if (!card) return;

        // Actualizar badge de cupos
        const badge = card.querySelector(".badge-cupos");
        if (badge) {
            if (cuposRestantes <= 0) {
                badge.textContent = "LLENO";
                badge.className   = "badge-cupos badge-lleno";
                // Deshabilitar botón de inscripción
                btn.disabled  = true;
                btn.innerHTML = '<i class="fa-solid fa-ban"></i> CUPOS AGOTADOS';
                btn.className = "btn-inscribirse btn-lleno";
            } else if (cuposRestantes <= 5) {
                badge.textContent = `¡ÚLTIMOS ${cuposRestantes} CUPOS!`;
                badge.className   = "badge-cupos badge-pocos";
            } else {
                badge.textContent = `${cuposRestantes} CUPOS`;
                badge.className   = "badge-cupos";
            }
        }

        // Actualizar barra de ocupación
        const ocupFill  = card.querySelector(".ocup-fill");
        const ocupLabel = card.querySelector(".ocup-label span:last-child");
        if (ocupFill && ocupLabel) {
            const totalText = ocupLabel.textContent.split("/");
            if (totalText.length === 2) {
                const total    = parseInt(totalText[1].trim());
                const inscritos = total - cuposRestantes;
                const pct      = Math.min(Math.round((inscritos / total) * 100), 100);
                ocupFill.style.width        = pct + "%";
                ocupLabel.textContent       = `${inscritos} / ${total}`;
            }
        }
    });
}

// ============================================================
// ENVIAR CON ENTER EN LOS CAMPOS DE LOGIN
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("inscripcionEmail");
    const passInput  = document.getElementById("inscripcionPassword");

    if (emailInput) {
        emailInput.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("inscripcionPassword").focus();
            }
            // Limpiar error al escribir
            if (e.key !== "Enter") ocultarErrorLogin();
        });
    }

    if (passInput) {
        passInput.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                verificarYInscribir();
            }
            if (e.key !== "Enter") ocultarErrorLogin();
        });
    }
});

// ============================================================
// ESC cierra el modal
// ============================================================
document.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrarModalInscripcion();
});

// ============================================================
// ANIMACIÓN BARRAS DE OCUPACIÓN AL HACER SCROLL
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