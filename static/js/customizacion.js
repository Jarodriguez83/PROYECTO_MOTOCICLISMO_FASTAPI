/**
 * JS PARA LA PESTAÑA DE CUSTOMIZACIÓN — GP COLOMBIA
 */

// FILTRADO DINÁMICO DE ARTÍCULOS
function filtrarArticulos(categoria, boton) {
    // 1. Quitar clase activo de todos los botones de filtro
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(btn => btn.classList.remove('activo'));
    
    // 2. Agregar clase activo al botón presionado
    boton.classList.add('activo');
    
    // 3. Filtrar las tarjetas
    const cards = document.querySelectorAll('.card-articulo');
    let visibles = 0;
    
    cards.forEach(card => {
        const catCard = card.getAttribute('data-categoria');
        if (categoria === 'todos' || catCard === categoria) {
            card.style.display = 'flex';
            visibles++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // 4. Mostrar estado vacío si no hay artículos visibles
    const sinArticulos = document.getElementById('sinArticulos');
    if (visibles === 0) {
        sinArticulos.style.display = 'block';
    } else {
        sinArticulos.style.display = 'none';
    }
}

// ABRIR MODAL DE COTIZACIÓN
function abrirCotizador(nombre, precio, imgUrl) {
    document.getElementById('resumenNombre').innerText = nombre;
    document.getElementById('resumenPrecio').innerText = precio;
    document.getElementById('resumenImg').src = imgUrl;
    
    const overlay = document.getElementById('modalCotizadorOverlay');
    overlay.classList.add('activo');
}

// CERRAR MODAL DE COTIZACIÓN
function cerrarCotizador() {
    const overlay = document.getElementById('modalCotizadorOverlay');
    overlay.classList.remove('activo');
    document.getElementById('formCotizacion').reset();
}

// ENVIAR SOLICITUD DE COTIZACIÓN
function enviarSolicitud(event) {
    event.preventDefault();
    
    const producto = document.getElementById('resumenNombre').innerText;
    const precio = document.getElementById('resumenPrecio').innerText;
    const nombre = document.getElementById('inputNombre').value;
    const correo = document.getElementById('inputCorreo').value;
    const telefono = document.getElementById('inputTelefono').value;
    const moto = document.getElementById('inputMoto').value || 'No especificada';
    const notas = document.getElementById('inputNotas').value || 'Ninguna';
    
    cerrarCotizador();
    
    // Notificación premium con SweetAlert2
    Swal.fire({
        title: '¡SOLICITUD ENVIADA!',
        html: `
            <div style="text-align: left; font-family: 'Rajdhani', sans-serif; font-size: 15px; color: #ccc; line-height: 1.5;">
                <p style="margin-bottom: 12px; color: #fff; font-weight: bold;">Hemos registrado tu interés en el artículo:</p>
                <p style="color: #e10600; font-size: 16px; font-weight: bold; margin-bottom: 12px;">🏁 ${producto} (${precio})</p>
                <p style="margin-bottom: 8px;"><strong>Piloto:</strong> ${nombre}</p>
                <p style="margin-bottom: 8px;"><strong>Moto registrada:</strong> ${moto}</p>
                <p style="margin-bottom: 8px;"><strong>Contacto:</strong> ${telefono} / ${correo}</p>
                <p style="margin-top: 15px; font-style: italic; color: #888;">Un asesor especializado de GP Colombia se pondrá en contacto contigo en las próximas horas para coordinar la entrega o cotización.</p>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'ENTENDIDO',
        confirmButtonColor: '#e10600',
        background: '#0f0f0f',
        color: '#fff',
        customClass: {
            title: 'tit-sweetalert',
            confirmButton: 'btn-sweetalert'
        }
    });
}

// COMPORTAMIENTO DE LOS ANUNCIOS PUBLICITARIOS
function abrirAnuncio(nombre, marca) {
    Swal.fire({
        title: 'REDIRECCIÓN PATROCINADA',
        html: `
            <div style="font-family: 'Rajdhani', sans-serif; font-size: 15px; color: #ccc;">
                <p>Estás saliendo de GP Colombia hacia el portal oficial de nuestro patrocinador:</p>
                <p style="color: #e10600; font-weight: bold; font-size: 16px; margin: 12px 0;">🚀 ${marca}</p>
                <p style="font-size: 12px; color: #777;">Campaña activa para pilotos del campeonato 2026: <strong>"${nombre}"</strong>.</p>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'CONTINUAR',
        cancelButtonText: 'CANCELAR',
        confirmButtonColor: '#e10600',
        cancelButtonColor: '#333',
        background: '#0f0f0f',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: '¡Redirección simulada!',
                text: 'Se abriría el portal del patrocinador en una nueva pestaña.',
                icon: 'success',
                confirmButtonColor: '#e10600',
                background: '#0f0f0f',
                color: '#fff'
            });
        }
    });
}
