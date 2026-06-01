/**
 * =====================================================
 * GP COLOMBIA — home_form.js
 * Validaciones del formulario de registro de pilotos
 * =====================================================
 */

console.log("home_form.js cargado correctamente.");

// ══════════════════════════════════════════════════════
// LIMPIAR QUERY PARAMS PARA NO MOSTRAR ALERTA AL RECARGAR
// ══════════════════════════════════════════════════════
function limpiarQueryParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete("registro");
    url.searchParams.delete("error");
    window.history.replaceState({}, document.title, url.pathname + url.search);
}

// ══════════════════════════════════════════════════════
// MOSTRAR ALERTA INTERACTIVA (SweetAlert2)
// ══════════════════════════════════════════════════════
function mostrarAlerta({ title, text, icon, callback }) {
    if (typeof Swal === "undefined") {
        alert(`${title}\n\n${text}`);
        limpiarQueryParams();
        if (callback) callback();
        return;
    }

    Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: "ENTENDIDO",
        confirmButtonColor: "#e10600",
        background: "#111",
        color: "#fff",
        allowOutsideClick: false,
        customClass: { popup: 'swal-gp', confirmButton: 'swal-btn-gp' }
    }).then(() => {
        limpiarQueryParams();
        if (callback) callback();
    });
}

// ══════════════════════════════════════════════════════
// ALERTA DE REGISTRO EXITOSO — CON CONFETI Y BADGE
// ══════════════════════════════════════════════════════
function mostrarRegistroExitoso() {
    if (typeof Swal === "undefined") {
        alert("¡Registro exitoso! Ya puedes iniciar sesión.");
        limpiarQueryParams();
        return;
    }

    Swal.fire({
        title: "¡PILOTO REGISTRADO!",
        html: `
            <div style="text-align:center; padding: 10px 0;">
                <div style="font-size:64px; margin-bottom:12px;">🏁</div>
                <p style="color:#ccc; font-size:15px; letter-spacing:1px; margin-bottom:8px;">
                    Tu inscripción fue completada exitosamente.
                </p>
                <p style="color:#e10600; font-weight:700; font-size:14px; letter-spacing:2px;">
                    YA PUEDES INICIAR SESIÓN
                </p>
            </div>
        `,
        icon: undefined,
        iconHtml: "✓",
        confirmButtonText: '<i class="fa-solid fa-right-to-bracket"></i> IR AL LOGIN',
        confirmButtonColor: "#e10600",
        background: "#111",
        color: "#fff",
        allowOutsideClick: false,
        showClass: { popup: 'animate__animated animate__zoomIn animate__faster' },
        customClass: {
            confirmButton: 'swal-btn-gp',
            icon: 'swal-icon-success-gp'
        }
    }).then((result) => {
        limpiarQueryParams();
        if (result.isConfirmed) {
            window.location.href = "/login";
        }
    });
}

// ══════════════════════════════════════════════════════
// MAPA DE ERRORES DEL BACKEND
// ══════════════════════════════════════════════════════
const ERRORES_BACKEND = {
    cedula_existente: {
        title: "DOCUMENTO YA REGISTRADO",
        text: "Ya existe un participante con ese número de cédula o documento. Verifica el dato.",
        icon: "warning"
    },
    numero_competidor_existente: {
        title: "NÚMERO DE COMPETIDOR OCUPADO",
        text: "Ese número de competidor ya está asignado a otro piloto. Por favor elige uno diferente.",
        icon: "warning"
    },
    nombre_existente: {
        title: "NOMBRE YA REGISTRADO",
        text: "Ya existe un participante con ese nombre completo. Verifica si ya realizaste tu inscripción.",
        icon: "warning"
    },
    correo_existente: {
        title: "CORREO YA REGISTRADO",
        text: "Ya existe una cuenta con ese correo electrónico. Puedes iniciar sesión directamente.",
        icon: "warning"
    },
    passwords_no_coinciden: {
        title: "CONTRASEÑAS NO COINCIDEN",
        text: "Las contraseñas ingresadas no son iguales. Verifica e inténtalo de nuevo.",
        icon: "error"
    },
    password_muy_corta: {
        title: "CONTRASEÑA INSEGURA",
        text: "La contraseña debe tener al menos 8 caracteres para proteger tu cuenta.",
        icon: "error"
    },
    nombre_invalido: {
        title: "NOMBRE INVÁLIDO",
        text: "El nombre completo debe tener al menos 3 caracteres.",
        icon: "error"
    },
    documento_invalido: {
        title: "DOCUMENTO INVÁLIDO",
        text: "El número de documento debe tener al menos 4 caracteres.",
        icon: "error"
    },
    telefono_invalido: {
        title: "TELÉFONO INVÁLIDO",
        text: "El teléfono debe contener solo dígitos (entre 7 y 15 caracteres).",
        icon: "error"
    },
    cilindraje_invalido: {
        title: "CILINDRAJE INVÁLIDO",
        text: "El cilindraje de la motocicleta debe ser mayor a 0.",
        icon: "error"
    },
    numero_invalido: {
        title: "NÚMERO DE COMPETIDOR INVÁLIDO",
        text: "El número de competidor debe ser mayor a 0.",
        icon: "error"
    },
    marca_invalida: {
        title: "MARCA INVÁLIDA",
        text: "Por favor ingresa la marca de tu motocicleta correctamente.",
        icon: "error"
    },
    edad_invalida: {
        title: "EDAD NO PERMITIDA",
        text: "Debes tener entre 16 y 100 años para registrarte en el campeonato.",
        icon: "error"
    },
    fecha_invalida: {
        title: "FECHA INVÁLIDA",
        text: "La fecha de nacimiento ingresada no es válida.",
        icon: "error"
    },
    registro_duplicado: {
        title: "REGISTRO DUPLICADO",
        text: "Algunos de los datos ingresados ya existen en el sistema.",
        icon: "error"
    }
};

// ══════════════════════════════════════════════════════
// VALIDACIONES CLIENTE (formulario home.html / index.html)
// ══════════════════════════════════════════════════════

/**
 * Valida un campo individual y muestra error visual debajo.
 * @returns {boolean} true si es válido
 */
function validarCampo(inputEl, condicion, mensaje) {
    const wrapper = inputEl.closest(".form-group") || inputEl.parentElement;
    let errorEl = wrapper.querySelector(".campo-error");

    // Crear elemento de error si no existe
    if (!errorEl) {
        errorEl = document.createElement("span");
        errorEl.className = "campo-error";
        errorEl.style.cssText = "font-size:11px; color:#e10600; font-weight:700; letter-spacing:1px; display:block; margin-top:4px;";
        wrapper.appendChild(errorEl);
    }

    if (!condicion) {
        inputEl.style.borderColor = "#e10600";
        inputEl.style.background = "rgba(225,6,0,0.05)";
        errorEl.textContent = mensaje;
        return false;
    } else {
        inputEl.style.borderColor = "";
        inputEl.style.background = "";
        errorEl.textContent = "";
        return true;
    }
}

/**
 * Validación completa del formulario antes de enviar.
 * Muestra todos los errores en línea + resumen con SweetAlert2.
 */
function validarFormularioCompleto(form) {
    let errores = [];

    const campos = [
        { id: "full_name",       label: "Nombre completo",         check: v => v.trim().length >= 3,         msg: "MÍNIMO 3 CARACTERES" },
        { id: "document_number", label: "Número de documento",     check: v => v.trim().length >= 4,         msg: "MÍNIMO 4 CARACTERES" },
        { id: "birth_date",      label: "Fecha de nacimiento",     check: v => {
            if (!v) return false;
            const edad = (new Date() - new Date(v)) / (1000 * 60 * 60 * 24 * 365.25);
            return edad >= 16 && edad <= 100;
        }, msg: "EDAD ENTRE 16 Y 100 AÑOS" },
        { id: "city",            label: "Ciudad",                  check: v => v.trim().length >= 2,         msg: "MÍNIMO 2 CARACTERES" },
        { id: "phone",           label: "Teléfono",                check: v => /^\d{7,15}$/.test(v.trim()), msg: "SOLO DÍGITOS (7-15 CARACTERES)" },
        { id: "motorcycle_brand",label: "Marca de la moto",        check: v => v.trim().length >= 2,         msg: "MÍNIMO 2 CARACTERES" },
        { id: "motorcycle_model",label: "Modelo de la moto",       check: v => v.trim().length >= 1,         msg: "CAMPO OBLIGATORIO" },
        { id: "engine_cc",       label: "Cilindraje",              check: v => parseInt(v) > 0,              msg: "DEBE SER MAYOR A 0" },
        { id: "competitor_number",label:"Número de competidor",    check: v => parseInt(v) > 0,              msg: "DEBE SER MAYOR A 0" },
    ];

    // Campos de correo y contraseña
    const emailEl = form.querySelector('[name="email"]');
    const passEl  = form.querySelector('[name="password"]');
    const confEl  = form.querySelector('[name="confirm_password"]');

    campos.forEach(({ id, label, check, msg }) => {
        const el = form.querySelector(`[name="${id}"]`);
        if (!el) return;
        const ok = validarCampo(el, check(el.value), msg);
        if (!ok) errores.push(label);
    });

    // Validar email
    if (emailEl) {
        const okEmail = validarCampo(emailEl, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim()), "CORREO INVÁLIDO");
        if (!okEmail) errores.push("Correo electrónico");
    }

    // Validar contraseñas
    if (passEl) {
        const okPass = validarCampo(passEl, passEl.value.length >= 8, "MÍNIMO 8 CARACTERES");
        if (!okPass) errores.push("Contraseña");
    }
    if (confEl && passEl) {
        const okConf = validarCampo(confEl, confEl.value === passEl.value && confEl.value !== "", "LAS CONTRASEÑAS NO COINCIDEN");
        if (!okConf && !errores.includes("Contraseña")) errores.push("Confirmar contraseña");
    }

    return errores;
}

// ══════════════════════════════════════════════════════
// INICIALIZACIÓN — Escuchar submit del formulario
// ══════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

    // ── Formulario en index.html (registro con contraseña) ──
    const formRegistro = document.getElementById("formRegistro");
    if (formRegistro) {
        formRegistro.addEventListener("submit", function (e) {
            const errores = validarFormularioCompleto(this);

            if (errores.length > 0) {
                e.preventDefault();
                const listaErrores = errores.map(c => `• ${c}`).join("<br>");
                Swal.fire({
                    title: "CAMPOS CON ERRORES",
                    html: `Corrige los siguientes campos antes de continuar:<br><br><div style="text-align:left; color:#e10600; font-size:13px; font-weight:700; letter-spacing:1px;">${listaErrores}</div>`,
                    icon: "error",
                    confirmButtonText: "CORREGIR",
                    confirmButtonColor: "#e10600",
                    background: "#111",
                    color: "#fff",
                });
                // Scroll al primer campo con error
                const primerError = formRegistro.querySelector('[style*="border-color: rgb(225, 6, 0)"]');
                if (primerError) primerError.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
        });

        // Validación en tiempo real
        formRegistro.querySelectorAll("input, select").forEach(el => {
            el.addEventListener("blur", () => {
                // Limpiar error visual al salir del campo
                el.style.borderColor = "";
                el.style.background = "";
                const wrapper = el.closest(".form-group") || el.parentElement;
                const errorEl = wrapper.querySelector(".campo-error");
                if (errorEl) errorEl.textContent = "";
            });
        });
    }

    // ── Formulario en home.html (registro sin contraseña / solo datos) ──
    const formHomeRegistro = document.querySelector(".formulario-registro");
    if (formHomeRegistro) {
        formHomeRegistro.addEventListener("submit", function (e) {
            // Validaciones básicas para el formulario del home
            let ok = true;

            const reqs = this.querySelectorAll("[required]");
            reqs.forEach(el => {
                if (!el.value.trim()) {
                    el.style.borderColor = "#e10600";
                    el.style.outline = "none";
                    ok = false;
                } else {
                    el.style.borderColor = "";
                }
            });

            if (!ok) {
                e.preventDefault();
                Swal.fire({
                    title: "CAMPOS OBLIGATORIOS",
                    text: "Por favor completa todos los campos marcados en rojo.",
                    icon: "warning",
                    confirmButtonText: "ENTENDIDO",
                    confirmButtonColor: "#e10600",
                    background: "#111",
                    color: "#fff",
                });
            }
        });
    }

    // ══════════════════════════════════════════════════
    // PROCESAR ALERTAS DESDE QUERY PARAMS
    // ══════════════════════════════════════════════════
    const params = new URLSearchParams(window.location.search);

    if (params.get("registro") === "exitoso") {
        mostrarRegistroExitoso();
        return; // salir temprano; la alerta exitosa ya limpia params
    }

    const error = params.get("error");
    if (error && ERRORES_BACKEND[error]) {
        const { title, text, icon } = ERRORES_BACKEND[error];
        mostrarAlerta({ title, text, icon });
    } else if (error) {
        // Error genérico no mapeado
        mostrarAlerta({
            title: "ERROR EN EL REGISTRO",
            text: "Ocurrió un problema inesperado. Verifica los datos e intenta nuevamente.",
            icon: "error"
        });
    }
});