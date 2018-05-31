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
                                        $scope.cargarCondominio(data.condominio)
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
            console.log(i)
            $scope.editar = i;

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 300);

            $("#editarModal").modal("open");
        }
        $scope.informacionModal = function (i) {
            console.log(i)
            $scope.editar = i;

            $("#informacionModal").modal("open");
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
            $scope.actualUID = i.$id;
            $("#cambiarContrasenaModal").modal("open");
        }
        $scope.seleccionados = [];

        $scope.check = function (i, v) {
            setTimeout(() => {
                if (i != null && v) {
                    if (v.selected) {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return item
                        });
                    } else {
                        $scope.seleccionados = $scope.data.map(function (item) {
                            if (item.selected)
                                return item
                        });
                    }
                }
                setTimeout(() => {
                    $scope.$apply();
                }, 50);
            }, 50);

        }
        $scope.checkAll = function () {
            $scope.seleccionados = $scope.data.map(function (item) {
                item.selected = true;
                return item
            });
            setTimeout(() => {
                $scope.$apply();
            }, 50);
        };

        $scope.uncheckAll = function () {
            $scope.seleccionados = [];
            $scope.data.map(function (item) {
                item.selected = false;
                return;
            });
        };

        $scope.cambiarPropiedadesGlobales = function () {
            var correos = $scope.seleccionados.filter(function (currentValue, index, arr) {
                return currentValue != null;
            });
            if (correos.length) {
                if ($scope.propiedades) {
                    var p = $scope.propiedades;
                    correos.forEach(seleccionado => {
                        var editable = $scope.data[$scope.data.$indexFor(seleccionado.$id)];
                        if (p.cuota_agua) editable.cuota_agua = parseInt(p.cuota_agua);
                        if (p.costo_cuota_agua) editable.costo_cuota_agua = parseFloat(p.costo_cuota_agua);
                        if (p.costo_cuota_agua_exceso) editable.costo_cuota_agua_exceso = parseFloat(p.costo_cuota_agua_exceso);
                        $scope.data.$save(editable);
                    });
                }
            } else {
                Materialize.toast("No hay condominos seleccionados", 8000)
            }
            console.log(correos)
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
                        nuevaContrasena: $scope.contrasena
                    })
                },
                success: function (data, textStatus, xhr) {
                    Materialize.toast("Contraseña modificada con éxito", 5000);
                    $scope.actualIndex.contrasena = $scope.contrasena;
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

            var datos = $scope.seleccionados.filter(function (currentValue, index, arr) {
                return currentValue != null;
            });
            if (datos.length) {
                waiting();
                enviarRecordatorio(datos, 0, datos.length - 1);
            } else {
                Materialize.toast("No hay condominos seleccionados a quienes enviarles el recordatorio", 8000)
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

            $scope.editar = i
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
                    obj.forEach(s => {
                        if (s)
                            s.selected = false
                    });
                    Materialize.toast("Condóminos cargados", 2000);
                } else {
                    Materialize.toast("No hay condóminos", 2000);
                }
            });
            $scope.data = obj

        }


        $scope.borrarSearch = function () {
            $scope.search = "";
        }
        var rABS = true;
        $scope.importarUsuarios = function () {

            var con = confirm("Si el código ya existe será sobreescrito, excepto su contraseña, la contraseña tiene que ser cambiada manualmente");
            if (!con) return;

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
                console.log(workbook.Sheets)
                var datos = workbook.Sheets[Object.keys(workbook.Sheets)[0]]
                console.log(datos)
                if (!datos) {
                    destroyWaiting();
                    return;
                }
                var result = Object.keys(datos).map(key => ({ key, value: datos[key] }));
                console.log(result)
                var promises = [];
                var usuariosCargando = [];
                var refSize = datos["!ref"]
                var inicio = refSize.split(":")[0].replace(/[^0-9]+/g, "");
                var final = refSize.split(":")[1].replace(/[^0-9]+/g, "");
                var j = 3;
                for (j = 3; j <= final; j++) {
                    var first = "A", last = "G";
                    var u = {};
                    for (var i = first.charCodeAt(0); i <= last.charCodeAt(0); i++) {
                        if (data.hasOwnProperty(String.fromCharCode(i) + j)) console.log("LO TIENE")
                        var kk = String.fromCharCode(i) + j;
                        result.forEach(celda => {
                            if (celda.key == kk) {
                                var d = celda.value;
                                if (d) {
                                    switch (String.fromCharCode(i)) {
                                        case "A":
                                            u.codigo = d.v || "";
                                            u.codigo = String(u.codigo)
                                            u.codigo = u.codigo.replace(" ", '');
                                            break;
                                        case "B":
                                            u.contador = d.v || ""
                                            u.contador = String(u.contador)
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
                        });


                    }
                    u.fecha_creacion = new_fecha_creacion;
                    u.creador = new_creador;
                    u.condominio = new_condominio;
                    u.condominio_nombre = new_condominio_nombre;
                    if (!u.contrasena) u.contrasena = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                    if (u.codigo && u.contrasena) {
                        var dejar = true;
                        $scope.data.forEach(condo => {
                            if (condo.codigo == u.codigo) dejar = false;
                        });
                        if (dejar) {
                            usuariosCargando.push(u);
                        } else {
                            var i = $scope.data.findIndex(x => x.codigo == u.codigo);
                            console.log(i, u.codigo, $scope.data[i])
                            if (u.contador) $scope.data[i].contador = u.contador;
                            if (u.nombre) $scope.data[i].nombre = u.nombre;
                            if (u.correo) $scope.data[i].correo = u.correo;
                            if (u.telefono) $scope.data[i].telefono = u.telefono;
                            if (u.nit) $scope.data[i].nit = u.nit;
                            $scope.data.$save(i).then((s) => {
                                console.log("Condomino modificado " + u.codigo);
                            })
                        }
                    }
                }
                console.log(usuariosCargando)
                var errores = [];
                function crearUsuariosServer(a, j, final) {
                    console.log("Usuario", a[j])
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
                                //crearUsuariosServer(a, j, final);
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
                                //crearUsuariosServer(a, j, final);
                            } else {

                                destroyWaiting();
                            }
                        }
                    });
                }
                if (usuariosCargando.length) {
                    for (var kkk = 0; kkk < usuariosCargando.length; kkk++) {
                        crearUsuariosServer(usuariosCargando, kkk, usuariosCargando.length - 1);
                    }
                } else {
                    Materialize.toast("No hay usuarios que crear", 8000);
                    destroyWaiting();
                }

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
                var datos = workbook.Sheets.USUARIOS || workbook.Sheets[Object.keys(workbook.Sheets)[0]];
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
                        if (a[j])
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
                if (usuariosCargando.length) {
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
                    { columnid: 'cuota_agua', title: "Cuota establecida" },
                    { columnid: 'costo_cuota_agua', title: 'Costo de Cuota de Agua ' },
                    { columnid: 'costo_cuota_agua_exceso', title: 'Costo de por metro cúbico en exceso' },
                    { columnid: 'nombre', title: "Nombre" },
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
                    contador: u.cuota_agua || "",
                    contador: u.costo_cuota_agua || "",
                    contador: u.costo_cuota_agua_exceso || "",
                    nombre: u.nombre || "",
                    correo: u.correo || "",
                    contrasena: u.contrasena || "",
                    telefono: u.telefono || "",
                    nit: u.NIT || "",
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
