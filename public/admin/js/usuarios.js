var tipo;
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        firebase.auth().currentUser.getIdToken().then(function (idToken) {
            // Parse the ID token.
            const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));
            // Confirm the user is an Admin.
            if (payload["administrador"] || payload["coordinador"] || user.email === "admin@alzar.com.gt") {
                var opciones;
                if (payload["coordinador"] || user.email === "admin@alzar.com.gt") {
                    opciones = `
                        <li>
                            <a href="index.html">
                                <i class="material-icons">location_city</i>Condominios
                            </a>
                        </li>
                        <li>
                            <a href="amenidades.html">
                                <i class="material-icons">tag_faces</i>Amenidades
                            </a>
                        </li>
                        <li>
                        <a href="registros-logs.html">
                            <i class="material-icons">assessment</i>Registros
                        </a>
                    </li>
                        <li>
                        <a href="reservarAmenidad.html">
                            <i class="material-icons">playlist_add</i>Reservar Amenidad
                        </a>
                        </li>
                        <li>
                        <a href="cuenta-corriente.html">
                            <i class="material-icons">euro_symbol</i>Cuenta Corriente
                        </a>
                        </li>
                    </li>
                        <li>
                            <a href="usuarios.html">
                                <i class="material-icons">supervisor_account</i>Usuarios
                            </a>
                        </li>
                        <li>
                            <a href="sanciones.html">
                                <i class="material-icons">warning</i>Sanciones
                            </a>
                        </li>
                        <li>
                            <a href="condominos.html">
                                <i class="material-icons">account_circle</i>Condóminos
                            </a>
                        </li>
                        <li>
                            <a href="qrs.html">
                                <i class="material-icons">camera</i>QRs de Contadores
                            </a>
                        </li>
                        <li>
                            <a href="reporteReservas.html">
                                <i class="material-icons">picture_as_pdf</i>Rep. de Reservas
                            </a>
                        </li>
                        <li>
                            <a href="reporteLecturas.html">
                                <i class="material-icons">picture_as_pdf</i>Rep. de Lecturas
                            </a>
                        </li>
                        <li>
                            <a href="reporteConsola.html">
                                <i class="material-icons">picture_as_pdf</i>Rep. de Consola
                            </a>
                        </li>
                        <li>
                            <a href="tickets.html">
                                <i class="material-icons">record_voice_over</i>Ver Tickets
                            </a>
                        </li>
                        <li>
                            <a href="mensajesDifusion.html">
                                <i class="material-icons">record_voice_over</i>Mensajes de difusión
                            </a>
                        </li>
                        <li>
                            <a href="mensajePush.html">
                                <i class="material-icons">record_voice_over</i>Mensaje Push
                            </a>
                        </li>
                        <li>
                            <a href="blog.html">
                                <i class="material-icons">chrome_reader_mode</i>Blog de Noticias
                            </a>
                        </li>`
                } else {
                    opciones = `
                        <li>
                            <a href="amenidades.html">
                                <i class="material-icons">tag_faces</i>Amenidades
                            </a>
                        </li>
                        <li>
                            <a href="condominos.html">
                                <i class="material-icons">account_circle</i>Condóminos
                            </a>
                        </li>
                        <li>
                            <a href="sanciones.html">
                                <i class="material-icons">warning</i>Sanciones
                            </a>
                        </li>
                        <li>
                            <a href="qrs.html">
                                <i class="material-icons">camera</i>QRs de Contadores
                            </a>
                        </li>
                        <li>
                            <a href="reporteReservas.html">
                                <i class="material-icons">picture_as_pdf</i>Rep. de Reservas
                            </a>
                        </li>
                        <li>
                            <a href="reporteLecturas.html">
                                <i class="material-icons">picture_as_pdf</i>Rep. de Lecturas
                            </a>
                        </li>
                        <li>
                            <a href="tickets.html">
                                <i class="material-icons">record_voice_over</i>Ver Tickets
                            </a>
                        </li>
                        <li>
                            <a href="mensajesDifusion.html">
                                <i class="material-icons">record_voice_over</i>Mensajes de difusión
                            </a>
                        </li>
                        <li>
                            <a href="blog.html">
                                <i class="material-icons">chrome_reader_mode</i>Blog de Noticias
                            </a>
                        </li>`
                }
                var templateSlide = `
                    <li>
                        <div class="user-view center-align">
                            <div class="background">
                            </div>
                            <a>
                                <img style="display: inline-block;" class="circle" src="${user.photoURL || "img/perfil.png"}">
                            </a>
                            <a>
                                <span class="white-text email">${user.email || ""}</span>
                            </a>
                        </div>
                    </li>
                    ${opciones}
                    <li><div class="divider"></div></li>
                    <li>
                        <a onclick="logOutUser()">
                            <i class="material-icons">close</i>Cerrar sesión
                        </a>
                    </li>
                    `
                document.getElementById("slide-menu").innerHTML = templateSlide;
            } else {
                window.location.replace("login.html")
            }
        });
    } else {
        window.location.replace("login.html")
    }
});
function logOutUser() {
    firebase.auth().signOut().then(function () {
        setTimeout(function () {
            window.location.replace("login.html");
        }, 300);
    }, function (error) {
        Materialize.toast("Algo ha ocurrido, " + error, 8000);
    });
}