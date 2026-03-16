console.log("Archivo home_form.js cargado correctamente.");
const parametros = new URLSearchParams(window.location.search);

if (parametros.get("registro") === "exitoso") {

    Swal.fire({
        title: "REGISTRO EXITOSO",
        text: "Tu inscripción en GP Colombia fue registrada correctamente.",
        icon: "success",
        confirmButtonText: "CONTINUAR",
        confirmButtonColor: "#e10600"
    });

}
