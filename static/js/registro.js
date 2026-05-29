/**
 * JS PARA LA PESTAÑA DE REGISTRO — GP COLOMBIA
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formRegistroPiloto');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm_password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const matchText = document.getElementById('matchText');

    // 1. VALIDACIÓN EN TIEMPO REAL DEL TELÉFONO (10 dígitos)
    phoneInput.addEventListener('input', () => {
        // Remover cualquier caracter que no sea número
        phoneInput.value = phoneInput.value.replace(/\D/g, '');
        
        if (phoneInput.value.length !== 10) {
            phoneError.style.display = 'block';
            phoneInput.setCustomValidity('El teléfono debe tener exactamente 10 dígitos.');
        } else {
            phoneError.style.display = 'none';
            phoneInput.setCustomValidity('');
        }
    });

    // 2. MEDIDOR DE FORTALEZA DE CONTRASEÑA
    passwordInput.addEventListener('input', () => {
        const valor = passwordInput.value;
        strengthBar.className = 'password-strength-bar';
        
        if (!valor) {
            strengthText.innerText = '';
            return;
        }

        // Evaluar condiciones
        const tieneLongitud = valor.length >= 8;
        const tieneMayuscula = /[A-Z]/.test(valor);
        const tieneNumero = /[0-9]/.test(valor);
        const tieneEspecial = /[^A-Za-z0-9]/.test(valor);

        const puntos = [tieneLongitud, tieneMayuscula, tieneNumero, tieneEspecial].filter(Boolean).length;

        if (valor.length < 8) {
            strengthBar.classList.add('debil');
            strengthText.innerText = 'MUY CORTA (MÍNIMO 8 CARACTERES)';
            strengthText.style.color = '#e10600';
        } else if (puntos <= 2) {
            strengthBar.classList.add('debil');
            strengthText.innerText = 'CONTRASEÑA DÉBIL';
            strengthText.style.color = '#e10600';
        } else if (puntos === 3) {
            strengthBar.classList.add('media');
            strengthText.innerText = 'CONTRASEÑA MEDIA (AGREGA MAYÚSCULAS O SIGNOS)';
            strengthText.style.color = '#ffa800';
        } else {
            strengthBar.classList.add('fuerte');
            strengthText.innerText = 'CONTRASEÑA FUERTE ✓';
            strengthText.style.color = '#00c850';
        }

        // Validar coincidencia si el confirm ya tiene texto
        validarCoincidencia();
    });

    // 3. COMPARAR CONTRASEÑAS EN TIEMPO REAL
    confirmInput.addEventListener('input', validarCoincidencia);

    function validarCoincidencia() {
        const pass = passwordInput.value;
        const confirm = confirmInput.value;

        if (!confirm) {
            matchText.innerText = '';
            confirmInput.setCustomValidity('');
            return;
        }

        if (pass !== confirm) {
            matchText.innerText = '⚠ LAS CONTRASEÑAS NO COINCIDEN';
            matchText.style.color = '#e10600';
            confirmInput.setCustomValidity('Las contraseñas no coinciden.');
        } else {
            matchText.innerText = '✓ LAS CONTRASEÑAS COINCIDEN';
            matchText.style.color = '#00c850';
            confirmInput.setCustomValidity('');
        }
    }

    // 4. INTERCEPTAR ENVÍO PARA CONFIRMACIONES Y ALERTAS
    form.addEventListener('submit', (e) => {
        const pass = passwordInput.value;
        const confirm = confirmInput.value;
        const phone = phoneInput.value;

        // Comprobar coincidencia
        if (pass !== confirm) {
            e.preventDefault();
            Swal.fire({
                title: 'CONTRASENAS NO COINCIDEN',
                text: 'Por favor, asegúrate de que ambas contraseñas escritas sean idénticas.',
                icon: 'warning',
                confirmButtonColor: '#e10600',
                background: '#0f0f0f',
                color: '#fff'
            });
            confirmInput.focus();
            return;
        }

        // Comprobar longitud teléfono
        if (phone.length !== 10) {
            e.preventDefault();
            Swal.fire({
                title: 'TELÉFONO INVÁLIDO',
                text: 'El número de teléfono debe tener exactamente 10 dígitos numéricos.',
                icon: 'warning',
                confirmButtonColor: '#e10600',
                background: '#0f0f0f',
                color: '#fff'
            });
            phoneInput.focus();
            return;
        }
        
        // Comprobar contraseña mínima
        if (pass.length < 8) {
            e.preventDefault();
            Swal.fire({
                title: 'CONTRASEÑA INSEGURA',
                text: 'La contraseña debe tener al menos 8 caracteres.',
                icon: 'warning',
                confirmButtonColor: '#e10600',
                background: '#0f0f0f',
                color: '#fff'
            });
            passwordInput.focus();
            return;
        }
    });
});

// FUNCIÓN PARA OCULTAR/MOSTRAR CONTRASEÑA
function togglePassField(inputId, btn) {
    const field = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}
