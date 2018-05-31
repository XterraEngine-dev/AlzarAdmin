"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('formularios');
var refFF = firebase.database().ref('mis_reservas');
var uref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');
var aref = firebase.database().ref('amenidades');
var obj, tipo, condominios, condominos, lecturas, amenidades;


var uid_formulario;
var uid_condominio;
var uid_condomino;
var uid_amenidad;




(function () {
    var app = angular.module("app", ["firebase"]);

    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http) {
        var time = new Date(), anio = time.getFullYear();
        $scope.anios = [

            anio - 1,
            anio,
            anio + 1
        ]
        var meses = [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
        ];
        var mesActual = meses[time.getMonth()];

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.auth().currentUser.getIdToken().then(function (idToken) {
                    $scope.mesSeleccionado = mesActual;
                    $scope.anioSeleccionado = String(anio);
                    // Parse the ID token.
                    const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));
                    if (payload["coordinador"] || user.email === "admin@alzar.com.gt") $scope.userTipo = "coordinador";
                    if (payload["administrador"]) $scope.userTipo = "administrador";
                    if ($scope.userTipo === "coordinador") {
                        condominios = $firebaseArray(cref);
                        condominios.$loaded().then(function () {
                            $scope.noCargando = true;
                            if (condominios.length > 0) {
                                Materialize.toast("Condominios cargados", 2000);
                            } else {
                                Materialize.toast("No hay condominios", 2000);
                            }
                        });
                        $scope.condominios = condominios
                    } else {
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
                    }

                })
            }
        }) // CARGAR DATOS DE USUARIO
        $scope.cargarCondominio = function (id) {




            if (!$scope.condominioSeleccionado)
                $scope.condominioSeleccionado = id;
            if (!id)
                id = $scope.condominioSeleccionado;

            $scope.amenidades = $firebaseArray(aref.child(id));
            $scope.amenidades.$loaded().then(function () {
                console.log("Amenidades", $scope.amenidades)
            })


            if (!$scope.amenidadSeleccionada) {
                Materialize.toast("Seleccione una amenidad", 5000);
                return;
            }

            $scope.noCargando = false;
            var hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            hoy.setMonth(hoy.getMonth() - 6);
            var hoy_6_meses = new Date();
            hoy_6_meses.setMonth(hoy_6_meses.getMonth() + 12);
            var inicioVigenciaTimeStamp = hoy.getTime();
            var finalVigenciaTimeStamp = hoy_6_meses.getTime()
            var tref = ref.child(id).child($scope.amenidadSeleccionada).orderByChild("fecha").startAt(inicioVigenciaTimeStamp).endAt(finalVigenciaTimeStamp)
            $scope.data = $firebaseArray(tref);
            $scope.data.$loaded().then(function () {
                console.log($scope.data, tref)
                Materialize.toast("Formularios de reservas buscados", 5000);
                $scope.noCargando = true;
            });

        }
        $scope.verAprobar = function (a) {

            console.log('a' + a);
            var str = JSON.stringify(a);
            str = JSON.stringify(a, null, 4); // (Optional) beautiful indented output.
            console.log(str); // Logs output to dev tools console.

            console.log(a.$id);
            console.log(a.amenidad_id);
            console.log(a.id_condominio);
            console.log(a.id_condominio + a.codigo_condomino);



            uid_formulario = a.$id;
            uid_condominio = a.id_condominio;
            uid_condomino = a.id_condominio + a.codigo_condomino;
            uid_amenidad = a.amenidad_id;

            $scope.editar = a;
            $("#modalHistorial").modal("open");
        }
        $scope.liberar = function (a) {
            $scope.editar = a;
            if (confirm("¿Estás seguro de liberar la fecha de la reserva de esta reserva?")) {
                $scope.editar.estado = "rechazado";
                $scope.data.$save($scope.editar).then(function () {
                    // LIBERACIÓN DE UNA FECHA
                    Materialize.toast("Se ha liberado la fecha", 5000);
                    $("#modalHistorial").modal("close");
                });
            }
        }
        $scope.aprobar = function (a) {

            var estado = "rechazado"
            if (a) {
                estado = "aprobado";
                $scope.enviarCorreo($scope.editar.correo_condomino)

                refFF.child(uid_condominio).child(uid_condomino).child(uid_formulario).update({
                    
                    estado: "aprobado"
                })
            } else {
                estado = "rechazado";
                var mensaje = prompt("¿Motivo del rechazo?")
                $scope.enviarCorreo($scope.editar.correo_condomino, true, mensaje)
            }
            $scope.editar.estado = estado;
            $scope.data.$save($scope.editar).then(function () {
                Materialize.toast("Se realizado la acción", 5000);
                $("#modalHistorial").modal("close");
            });
        }
        $scope.exportarUsuarios = function () {
            var mystyle = {
                sheetid: 'FORMULARIOS DE RESERVA ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + " " + $scope.amenidades[$scope.amenidades.$indexFor($scope.amenidadSeleccionada)].nombre + " " + $scope.mesSeleccionado + "-" + $scope.anioSeleccionado,
                headers: true,
                caption: {
                    title: 'FORMULARIOS DE RESERVA ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + " " + $scope.amenidades[$scope.amenidades.$indexFor($scope.amenidadSeleccionada)].nombre + " " + $scope.mesSeleccionado + "-" + $scope.anioSeleccionado
                },
                columns: [
                    { columnid: 'codigo', title: "Código de Domicilio" },
                    { columnid: 'nombre', title: 'Nombre de quien reserva' },
                    { columnid: 'fecha', title: "Fecha de reservación" },
                    { columnid: 'invitados', title: "No. Invitados" },
                    { columnid: 'valor_reserva', title: "Valor de la Reserva" },
                    { columnid: 'estado', title: "Estado" },
                ]
            };
            $scope.lecturas = []
            $scope.data.forEach(u => {


                var fechat = timeConverter(u.fecha_seleccionada);
                $scope.lecturas.push({
                    codigo: u.codigo_condomino || "",
                    nombre: u.nombre_condomino || "",
                    fecha: fechat || "",
                    invitados: u.invitados || "",
                    valor_reserva: u.valor_reserva || "",
                    estado: u.estado || ""
                });
            });
            alasql('SELECT * INTO XLS("FORMULARIOS DE RESERVA.xls",?) FROM ?', [mystyle, $scope.lecturas]);
        }
        $scope.enviarRecordatorios = function () {
            if ($scope.data.length > 0) {
                waiting();
                enviarRecordatorio($scope.data, 0, $scope.data.length - 1);
            }
        }
        var d = new Date();
        // Set it to one month ago
        d.setDate(d.getDate() - 3);

        $scope.actual_time_menos_3 = d.getTime();
        console.log($scope.actual_time_menos_3)
        $scope.verHistorial = function (i) {
            var contador = $scope.data[i].contador
            lecturas = $firebaseArray(ref.child($scope.condominioSeleccionado).child(contador));
            $scope.lecturas = lecturas;
            $("#modalHistorial").modal("open")
        }
        $scope.eliminarReserva = function (i) {
            if (confirm("¿Está seguro de eliminar la Reserva?"))
                $scope.data.$remove(i).then(function (ref) {
                    Materialize.toast("El formulario de Reserva se ha eliminado", 8000);
                });
        }

        $scope.enviarCorreo = function (correo, rechazo, men) {
            var mensajeTexto = rechazo == true ? mensajeRechazo($scope.amenidades[$scope.amenidades.$indexFor($scope.amenidadSeleccionada)].nombre, timeConverter($scope.editar.fecha_seleccionada), men) : mensajeTemplate($scope.amenidades[$scope.amenidades.$indexFor($scope.amenidadSeleccionada)].nombre, timeConverter($scope.editar.fecha_seleccionada))
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: correo,
                            mensaje: mensajeTexto,
                            titulo: "Reserva confirmada",
                            logo: condominios[condominios.$indexFor($scope.condominioSeleccionado)].logo,
                            condominio_nombre: condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre,
                            emisor: $scope.user.email
                        }
                    })
                },
                success: function (data, textStatus, xhr) {

                },
                error: function (error) {
                    console.log(error)
                }
            });
        }
        function mensajeTemplate(nombre_amenidad, fecha) {
            return `
            <p>
                Se ha confirmado tu reserva para la fecha ${fecha} en la amenidad ${nombre_amenidad}.
            </p>
            `
        }
        function mensajeRechazo(nombre_amenidad, fecha, mensaje) {
            return `
            <p>
                No se ha aprobado tu reserva con fecha ${fecha} en la amenidad ${nombre_amenidad}. Debido a: ${mensaje}
            </p>
            `
        }

        function timeConverter(UNIX_timestamp) {
            var a = new Date(UNIX_timestamp);
            var year = a.getFullYear();
            var month = a.getMonth() + 1;
            var date = a.getDate();
            var time = date + '/' + month + '/' + year;
            return time;
        }
        $(document).ready(function () {
            $('ul.tabs').tabs();
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
    }); // END DE CONTROLADOR
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