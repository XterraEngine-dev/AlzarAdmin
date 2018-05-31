var tipo;
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        var condominio_id = localStorage.getItem("condominio_id");
        console.log(condominio_id)
        firebase.database().ref("condominos").child(condominio_id).child(user.uid).once("value").then(function (s) {
            if (s.val()) {
                var opciones;
                opciones = `
                        <li>
                            <a href="index.html">
                                <i class="material-icons">sentiment_very_satisfied</i>
                                Amenidades
                            </a>
                        </li>
                        <li>
                            <a href="lecturas.html">
                                <i class="material-icons">picture_as_pdf</i>
                                Lecturas de Agua
                            </a>
                        </li>
                        <li>
                            <a style="height: 96px;" href="directorio_condominio.html">
                                <i class="material-icons">work</i>
                                Directorio de servicios de mi comunidad
                            </a>
                        </li>
                        
                        <li><div class="divider"></div></li>
                        <li>
                            <a style="height: 96px;" href="directorio.html">
                                <i class="material-icons">account_circle</i>
                                Anunciarse en el directorio de mi comunidad
                            </a>
                        </li>
                        <li><div class="divider"></div></li>
                        <li>
                            <a href="mis_reservas.html">
                                <i class="material-icons">system_update_alt</i>
                                Mis reservas
                            </a>
                        </li>
                        
                        <li><div class="divider"></div></li>
                        <li>
                            <a style="height: 96px;" href="soporte.html">
                                <i class="material-icons">help</i>
                                Servicio de atención al condómino
                            </a>
                        </li>
                        <li><div class="divider"></div></li>
                        <li>
                            <a href="blog.html">
                                <i class="material-icons">chrome_reader_mode</i>
                                Notas y avisos
                            </a>
                        </li>`
                var templateSlide = `
                        <li>
                            <div class="user-view center-align">
                                <div class="background">
                                </div>
                                <a>
                                    <img style="display: inline-block;" class="circle" src="${user.photoURL || "img/perfil.png"}">
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
                //window.location.replace("login.html")
            }
        });
    } else {
        //window.location.replace("login.html")
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