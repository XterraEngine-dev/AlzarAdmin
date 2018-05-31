"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios;

(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http, $filter) {

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.auth().currentUser.getIdToken()
                    .then(function (idToken) {
                        // Parse the ID token.
                        const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));

                        condominios = $firebaseArray(cref);
                        condominios.$loaded().then(function () {
                            if (condominios.length > 0) {
                                Materialize.toast("Condominios cargados", 2000);
                            } else {
                                Materialize.toast("No hay condominios", 2000);
                            }
                        });
                        $scope.condominios = condominios

                        if (payload["administrador"]) {
                            $scope.userTipo = "administrador";
                            firebase.database().ref("usuarios").child(user.uid).once("value").then(function (snapshot) {
                                if (snapshot.val()) {
                                    var data = snapshot.val();
                                    $scope.userData = data;
                                    if (data.condominio) {
                                        cargarCondominio(data.condominio)
                                        $scope.condominioSeleccionado = data.condominio;
                                    }
                                    condominios = $firebaseArray(cref);
                                    $scope.condominios = condominios
                                }
                            });
                        } else {
                            if (payload["coordinador"] || user.email === "admin@alzar.com.gt") $scope.userTipo = "coordinador";
                            $scope.noCargando = true;
                            setTimeout(() => {
                                $scope.$apply();
                            }, 100);
                        }
                    });
            } else {
                window.location.replace("login.html")
            }
        });

        $scope.crear = function (valid) {
            if (valid && $scope.condominioSeleccionado) {

                $scope.new.codigo = String($scope.new.codigo);
                $scope.new.contador = String($scope.new.contador);

                waiting();

                var timeStamp = + new Date();
                $scope.new.fecha_creacion = timeStamp;
                $scope.new.creador = $scope.user.email;
                $scope.new.condominio = $scope.condominioSeleccionado;
                $scope.new.condominio_nombre = condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre
                $.ajax({
                    type: "POST",
                    url: 'https://us-central1-alzargt.cloudfunctions.net/crearCondomino',
                    data: {
                        json: JSON.stringify({
                            usuario: $scope.new,
                            id: $scope.user.uid
                        })
                    },
                    success: function (data, textStatus, xhr) {
                        Materialize.toast("Usuario creado con éxito", 5000);
                        console.log(data);
                        destroyWaiting();
                    },
                    error: function (error) {
                        destroyWaiting();
                        Materialize.toast(error.responseText, 10000);
                        Materialize.toast("No se creo el usuario, vuelve a intentar más tarde", 12000)
                    }
                });

                document.getElementById("crearForm").reset();
                $("#crearModal").modal("close")
            }
        }
        $scope.generarContrasena = function () {
            var newContrasena = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
            var dejar = true;
            if ($scope.new) {
                $scope.new.contrasena = newContrasena
                dejar = false;
            }
            if ($scope.editar) {
                $scope.editar.contrasena = newContrasena;
                dejar = false;
            }
            if (!dejar)
                Materialize.toast("Contraseña generada: " + $scope.new.contrasena, 8000)
        }

        $scope.guardar = function (i) {
            $scope.editar.codigo = String($scope.editar.codigo);
            $scope.editar.contador = String($scope.editar.contador);
            obj.$save($scope.editar).then(function (ref) {
                Materialize.toast("Se han guardado los cambios", 5000);
                $("#editarModal").modal("close");
            });
        }

        $scope.editarModal = function (i) {
            $scope.editar = obj[i];

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 300);

            $("#editarModal").modal("open");
        }

        $scope.eliminar = function () {
            waiting();
            console.log($scope.user.uid)
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/eliminarCondomino',
                data: {
                    json: JSON.stringify({
                        user_id: $scope.editar.$id,
                        id: $scope.user.uid,
                        condominio: $scope.editar.condominio
                    })
                },
                success: function (data, textStatus, xhr) {
                    Materialize.toast("Usuario eliminado con éxito", 5000);
                    $("#eliminarModal").modal("close")
                    destroyWaiting();
                },
                error: function (error) {
                    destroyWaiting();
                    Materialize.toast(error.responseText, 10000);
                    console.error(error.responseText);
                    Materialize.toast("No se eliminó el usuario", 12000)
                }
            });
        }

        $scope.contrasenaModal = function (i) {
            $scope.actualIndex = i;
            $scope.actualUID = $scope.data.$keyAt(i);
            $("#cambiarContrasenaModal").modal("open");
        }
        $scope.cambiarContrasena = function () {
            waiting();
            console.log($scope.user.uid)
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/cambiarContrasena',
                data: {
                    json: JSON.stringify({
                        user_id: $scope.actualUID,
                        id: $scope.user.uid,
                        contrasena: $scope.contrasena
                    })
                },
                success: function (data, textStatus, xhr) {
                    Materialize.toast("Contraseña modificada con éxito", 5000);
                    $scope.data[$scope.actualIndex].contrasena = $scope.contrasena;
                    $scope.data.$save($scope.actualIndex).then(function () {
                        console.log("contraseña modificada en base de datos")
                        $("#cambiarContrasenaModal").modal("close");
                    })
                    destroyWaiting();
                },
                error: function (error) {
                    destroyWaiting();
                    Materialize.toast(error.responseText, 10000);
                    console.error(error.responseText);
                    Materialize.toast("No se eliminó el usuario", 12000)
                }
            });
        }
        $scope.enviarContrasenas = function () {
            var datos = $filter('filter')($scope.data, $scope.search);
            if (datos.length) {
                console.log(datos.length);
                waiting();
                enviarRecordatorio(datos, 0, datos.length - 1);
            } else {
                Materialize.toast("No hay condominos a quienes enviarles el recordatorio", 8000)
            }
        }
        function enviarRecordatorio(a, j, final) {
            var u = a[j]
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: u.correo,
                            mensaje: mensajeTemplate(u.codigo, u.contrasena),
                            titulo: "Recordatorio de contraseña de Alzar Condominio",
                            logo: condominios[condominios.$indexFor($scope.condominioSeleccionado)].logo,
                            condominio_nombre: condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre,
                            emisor: $scope.user.email
                        }
                    })
                },
                success: function (data, textStatus, xhr) {
                    Materialize.toast("Mensaje " + (j + 1) + "/" + (final + 1) + " enviado con éxito", 5000);
                    j++;
                    if (j <= final) {
                        enviarRecordatorio(a, j, final);
                    } else {
                        destroyWaiting();
                    }
                },
                error: function (error) {
                    if (a[j]) if (a[j].codigo) Materialize.toast("No se envió el mensaje " + a[j].codigo, 12000);
                    j++;
                    console.error(error.responseText);
                    if (j <= final) {
                        errores.push(error + "; ");
                        enviarRecordatorio(a, j, final);
                    } else {
                        destroyWaiting();
                    }
                }
            });
        }
        function mensajeTemplate(no_casa, contrasena) {
            return `
            <p>Para acceder a su usuario es necesario utilizar el número de casa: "${no_casa}" (Sin comillas), así como la contraseña: "${contrasena}" (Sin comillas). Para acceder al sistema de clíc <a href="app.alzar.com.gt/">aquí</a>.
            `
        }
        $scope.eliminarModal = function (i) {
            $scope.editar = obj[i]
            $("#eliminarModal").modal("open")
        }

        $scope.cargarCondominio = function (id) {
            console.log($scope.condominioSeleccionado, id)
            if (!$scope.condominioSeleccionado)
                $scope.condominioSeleccionado = id;

            if (!id) return;
            var tref = ref.child(id)
            obj = $firebaseArray(tref
            );
            obj.$loaded().then(function () {
                $scope.noCargando = true;
                if (obj.length > 0) {
                    Materialize.toast("Condóminos cargados", 2000);
                } else {
                    Materialize.toast("No hay condóminos", 2000);
                }
            });
            $scope.data = obj

        }

        $scope.cambiarLogo = function () {
            var file = document.getElementById("logoE").files[0];
            var preview = document.getElementById('imgPreviewE');
            var reader = new FileReader();

            reader.onloadend = function () {

                preview.src = reader.result;
                var width = preview.clientWidth;
                var height = preview.clientHeight;

                if (width / height !== 1) {
                    Materialize.toast("Debe ser una imagen cuadrada (Proporción 1:1)", 10000);
                }
                var fileName = file.name;

                var uploadTask = firebase.storage().ref("condominios").child(fileName).put(file);

                uploadTask.on('state_changed', function (snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    $("#progresoFileE").width(progress + "%");
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                    }
                }, function (error) {
                    Materialize.toast("Ha ocurrido un error, " + error)
                }, function () {

                    var downloadURL = uploadTask.snapshot.downloadURL;

                    $scope.editar.logo = downloadURL;

                    obj.$save($scope.editar).then(function (ref) {
                        Materialize.toast("Se ha modificado el logo", 5000);
                    });

                })
            }
            if (file) {
                reader.readAsDataURL(file);
            } else {
                preview.src = "";
            }

        }

        $scope.borrarSearch = function () {
            $scope.search = "";
        }
        var rABS = true;
        $scope.importarUsuarios = function () {
            var timeStamp = + new Date();
            var new_fecha_creacion = timeStamp;
            var new_creador = $scope.user.email;
            var new_condominio = $scope.condominioSeleccionado;
            var new_condominio_nombre = condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre

            waiting();

            var file = document.getElementById("excelI").files[0];
            if (!file) {
                Materialize.toast("Carga el archivo correctamente", 5000)
                destroyWaiting();
                return;
            }

            var reader = new FileReader();
            var name = file.name;
            reader.onload = function (e) {
                var data = e.target.result;
                var workbook;
                if (rABS) {
                    /* if binary string, read with type 'binary' */
                    workbook = XLSX.read(data, { type: 'binary' });
                } else {
                    /* if array buffer, convert to base64 */
                    var arr = fixdata(data);
                    workbook = XLSX.read(binary, { type: 'binary', cellDates: true, cellStyles: true });
                }
                var datos = workbook.Sheets.USUARIOS || workbook.Sheets.Sheet1
                console.log(datos)
                if (!datos) {
                    destroyWaiting();
                    $("#excelModal").modal("close");
                    $("#dialogModal").modal("open");
                    document.getElementById("tituloDialogModal").innerHTML = "Usa la plantilla";
                    document.getElementById("textoDialogModal").innerHTML = "Al parecer el archivo que has cargado no tiene el formato exacto de la plantilla, intenta de nuevo";
                    return;
                }
                var promises = [];
                var usuariosCargando = [];
                var refSize = datos["!ref"]
                var inicio = refSize.split(":")[0].replace(/[^0-9]+/g, "");
                var final = refSize.split(":")[1].replace(/[^0-9]+/g, "");
                var j = 3;
                while (j <= final) {
                    var first = "A", last = "H";
                    var u = {};
                    for (var i = first.charCodeAt(0); i <= last.charCodeAt(0); i++) {
                        var indice = String.fromCharCode(i) + j;
                        var d = datos[indice]
                        if (d) {
                            switch (String.fromCharCode(i)) {
                                case "A":
                                    u.codigo = d.v || ""
                                    break;
                                case "B":
                                    u.contador = d.v || ""
                                    break;
                                case "C":
                                    u.nombre = d.v || ""
                                    break;
                                case "D":
                                    u.correo = d.v || ""
                                    break;
                                case "E":
                                    u.contrasena = d.v || randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                                    break;
                                case "F":
                                    u.telefono = d.v || ""
                                    break;
                                case "G":
                                    u.nit = d.v || ""
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                    u.fecha_creacion = new_fecha_creacion;
                    u.creador = new_creador;
                    u.condominio = new_condominio;
                    u.condominio_nombre = new_condominio_nombre;
                    console.log(u)
                    if (u.codigo && u.contrasena && u.correo) {
                        usuariosCargando.push(u);
                    }
                    j++;
                }
                var errores = [];
                function crearUsuariosServer(a, j, final) {
                    $.ajax({
                        type: "POST",
                        url: 'https://us-central1-alzargt.cloudfunctions.net/crearCondomino',
                        data: {
                            json: JSON.stringify({
                                usuario: a[j],
                                id: $scope.user.uid
                            })
                        },
                        success: function (data, textStatus, xhr) {
                            Materialize.toast("Usuario " + (j + 1) + "/" + (final + 1) + " creado con éxito", 5000);
                            j++;
                            if (j <= final) {
                                crearUsuariosServer(a, j, final);
                            } else {
                                destroyWaiting();
                            }
                        },
                        error: function (error) {
                            if (a[j]) if (a[j].codigo) Materialize.toast("No se creo el usuario " + a[j].codigo, 12000);
                            j++;
                            console.error(error.responseText);
                            if (j <= final) {
                                errores.push(error + "; ");
                                crearUsuariosServer(a, j, final);
                            } else {

                                destroyWaiting();
                            }
                        }
                    });
                }
                crearUsuariosServer(usuariosCargando, 0, usuariosCargando.length - 1);
            }
            reader.readAsBinaryString(file);
        }

        $scope.asociarContadores = function () {

            waiting();

            var file = document.getElementById("contadoresI").files[0];
            if (!file) {
                Materialize.toast("Carga el archivo correctamente", 5000)
                destroyWaiting();
                return;
            }

            var reader = new FileReader();
            var name = file.name;
            reader.onload = function (e) {
                var data = e.target.result;
                var workbook;
                if (rABS) {
                    /* if binary string, read with type 'binary' */
                    workbook = XLSX.read(data, { type: 'binary' });
                } else {
                    /* if array buffer, convert to base64 */
                    var arr = fixdata(data);
                    workbook = XLSX.read(binary, { type: 'binary', cellDates: true, cellStyles: true });
                }
                var datos = workbook.Sheets.USUARIOS || workbook.Sheets.Sheet1
                console.log(datos)
                if (!datos) {
                    destroyWaiting();
                    $("#contadoresModal").modal("close");
                    $("#dialogModal").modal("open");
                    document.getElementById("tituloDialogModal").innerHTML = "Usa la plantilla";
                    document.getElementById("textoDialogModal").innerHTML = "Al parecer el archivo que has cargado no tiene el formato exacto de la plantilla, intenta de nuevo";
                    return;
                }
                var promises = [];
                var usuariosCargando = [];
                var refSize = datos["!ref"]
                var inicio = refSize.split(":")[0].replace(/[^0-9]+/g, "");
                var final = refSize.split(":")[1].replace(/[^0-9]+/g, "");
                var j = 3;
                while (j <= final) {
                    var first = "A", last = "B";
                    var u = {};
                    for (var i = first.charCodeAt(0); i <= last.charCodeAt(0); i++) {
                        var indice = String.fromCharCode(i) + j;
                        var d = datos[indice]
                        if (d) {
                            switch (String.fromCharCode(i)) {
                                case "A":
                                    u.codigo = d.v || ""
                                    break;
                                case "B":
                                    u.contador = d.v || ""
                                    break;
                            }
                        }
                    }
                    console.log(u)
                    if (u.codigo && u.contador) {
                        usuariosCargando.push(u);
                    }
                    j++;
                }
                var errores = [];
                function cargarContadores(a, j, final) {
                    obj.forEach(usuario => {
                        console.log(usuario, a[j])
                        if (usuario.codigo == a[j].codigo) {
                            usuario.contador = a[j].contador;
                            j++;
                            obj.$save(usuario).then(function (ref) {
                                Materialize.toast("Se asoció el contador del usuario " + usuario.codigo, 8000);
                                if (j <= final) {
                                    cargarContadores(a, j, final);
                                } else {
                                    destroyWaiting();
                                }
                            }).catch(function (e) {
                                console.log("Error al guardar", e);
                                if (j <= final) {
                                    cargarContadores(a, j, final);
                                } else {
                                    destroyWaiting();
                                }
                            })
                        } else {
                            Materialize.toast("No se encontró el código del usuario " + a[j].codigo, 8000)
                            j++;
                            if (j <= final) {
                                cargarContadores(a, j, final);
                            } else {
                                destroyWaiting();
                            }
                        }

                    });
                }
                if (usuariosCargando) {
                    cargarContadores(usuariosCargando, 0, usuariosCargando.length - 1);
                } else {
                    Materialize.toast("No hay codigos con contadores asociados, intenta de nuevo", 10000);
                }

            }
            reader.readAsBinaryString(file);
        }

        $scope.exportarUsuarios = function () {
            var mystyle = {
                sheetid: 'USUARIOS',
                headers: true,
                caption: {
                    title: 'USUARIOS - ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + ' (' + timeConverter(+ new Date()) + ")"
                },
                columns: [
                    { columnid: 'codigo', title: "Código" },
                    { columnid: 'contador', title: "Contador" },
                    { columnid: 'nombre', title: 'Nombre' },
                    { columnid: 'correo', title: "Correo" },
                    { columnid: 'contrasena', title: "Contraseña" },
                    { columnid: 'telefono', title: "Teléfono" },
                    { columnid: 'nit', title: "NIT" },
                    { columnid: 'fecha_creacion', title: "Fecha de Creación" },
                    { columnid: 'creador', title: "Creador" },
                ]
            };
            $scope.usuarios = []
            $scope.data.forEach(u => {
                var fechat = timeConverter(u.fecha_creacion);
                $scope.usuarios.push({
                    codigo: u.codigo || "",
                    contador: u.contador || "",
                    nombre: u.nombre || "",
                    correo: u.correo || "",
                    contrasena: u.contrasena || "",
                    telefono: u.telefono || "",
                    nit: u.nit || "",
                    fecha_creacion: fechat || "",
                    creador: u.creador || ""
                });
            });
            alasql('SELECT * INTO XLS("usuarios ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + '.xls",?) FROM ?', [mystyle, $scope.usuarios]);

        }
        $(document).ready(function () {
            $('ul.tabs').tabs();
            $(".color").each(function (value) {
                cargarColorInput(this)
            })
            $('select').material_select();
            $('.collapsible').collapsible();
            $("#menu-button").sideNav();
            $('.modal').modal({
                dismissible: true, // Modal can be dismissed by clicking outside of the modal
                opacity: .8, // Opacity of modal background
                inDuration: 300, // Transition in duration
                outDuration: 200, // Transition out duration
                startingTop: '10%', // Starting top style attribute
                endingTop: '10%', // Ending top s
                complete: function () {
                    //alert('Closed'); 
                }
            });
        });
        function randomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }
        function timeConverter(UNIX_timestamp) {
            var a = new Date(UNIX_timestamp);
            var year = a.getFullYear();
            var month = a.getMonth() + 1;
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min;
            return time;
        }
    });
    app.directive('imageonload', function () {
        return {
            restrict: 'A',
            scope: { imageonload: '@' },
            link: function (scope, element, attrs) {
                element.bind('load', function () {

                    $(document).ready(function () {
                        $(element).materialbox();
                    });
                });
            }
        };
    });
})()
