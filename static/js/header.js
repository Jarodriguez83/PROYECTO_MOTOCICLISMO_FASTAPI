console.log("Archivo header.js cargado correctamente");
// ===============================
// OBTENER ELEMENTOS DEL DOM
// ===============================

const botonMenu = document.getElementById("botonMenu");
const menuPrincipal = document.getElementById("menuPrincipal");


// ===============================
// EVENTO PARA ABRIR O CERRAR MENU
// ===============================

botonMenu.addEventListener("click", function(){

    menuPrincipal.classList.toggle("activo");

});


// ===============================
// CERRAR MENU AL SELECCIONAR LINK
// ===============================

const enlacesMenu = document.querySelectorAll(".enlace-menu");

enlacesMenu.forEach(function(enlace){

    enlace.addEventListener("click", function(){

        menuPrincipal.classList.remove("activo");

    });

});