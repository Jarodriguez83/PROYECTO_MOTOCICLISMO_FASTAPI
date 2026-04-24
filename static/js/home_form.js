/**
 * Script de manejo de alertas y validaciones para GP Colombia
 */

console.log("Archivo home_form.js cargado correctamente.");

const parametros = new URLSearchParams(window.location.search);

/**
 * Limpia los parámetros de la URL para evitar que las alertas
 * reaparezcan al recargar la página (F5).
 */
function limpiarQueryParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete("registro");
    url.searchParams.delete("error");
    window.history.replaceState({}, document.title, url.pathname + url.search);
}

/**
 * Muestra una alerta visual usando SweetAlert2 o un alert() básico como respaldo.
 */
function mostrarAlerta({ title, text, icon }) {
    // Fallback si SweetAlert2 no carga (CDN, red, etc.)
    if (typeof Swal === "undefined" || !Swal?.fire) {
        console.error("SweetAlert2 (Swal) no está disponible. Mostrando alert() de respaldo.");
        window.alert(`${title}\n\n${text}`);
        limpiarQueryParams();
        return;
    }

    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonText: "ENTENDIDO",
        confirmButtonColor: "#e10600", // Color corporativo
        allowOutsideClick: false
    }).then(limpiarQueryParams);
}

// ==========================================
// PROCESAMIENTO DE PARÁMETROS (REGISTRO)
// ==========================================

// Caso: Registro exitoso
if (parametros.get("registro") === "exitoso") {
    mostrarAlerta({
        title: "REGISTRO EXITOSO",
        text: "Tu inscripción en GP Colombia fue registrada correctamente.",
        icon: "success"
    });
}

// Caso: Manejo de Errores desde el Backend
const error = parametros.get("error");

if (error) {
    switch (error) {
        case "cedula_existente":
            mostrarAlerta({
                title: "CÉDULA YA REGISTRADA",
                text: "Ya existe un participante con este número de cédula/documento. Verifica el dato e inténtalo de nuevo.",
                icon: "warning"
            });
            break;

        case "numero_competidor_existente":
            mostrarAlerta({
                title: "NÚMERO DE COMPETIDOR YA REGISTRADO",
                text: "Ese número de competidor ya está asignado. Por favor ingresa uno diferente.",
                icon: "warning"
            });
            break;

        case "nombre_existente":
            mostrarAlerta({
                title: "NOMBRE YA REGISTRADO",
                text: "Ya existe un participante registrado con este nombre completo. Verifica si ya realizaste tu inscripción.",
                icon: "warning"
            });
            break;

        case "registro_duplicado":
            mostrarAlerta({
                title: "REGISTRO DUPLICADO",
                text: "No se pudo completar el registro porque algunos de los datos ingresados ya existen en el sistema.",
                icon: "error"
            });
            break;

        default:
            mostrarAlerta({
                title: "ERROR",
                text: "Ocurrió un problema inesperado al procesar tu registro.",
                icon: "error"
            });
            break;
    }
}