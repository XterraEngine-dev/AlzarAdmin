"use strict";

var currentUserType;
var usuario;
var tickets = {};
var ref = firebase.database().ref('tickets');
var uref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');
var aref = firebase.database().ref('amenidades');
var obj, tipo, condominios, condominos, lecturas, amenidades;

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


            $scope.noCargando = false;
            var hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            hoy.setMonth(hoy.getMonth() - 4);
            var hoy_6_meses = new Date();
            hoy_6_meses.setMonth(hoy_6_meses.getMonth() + 12);
            var inicioVigenciaTimeStamp = hoy.getTime();
            var finalVigenciaTimeStamp = hoy_6_meses.getTime()
            var tref = uref.child(id);
            $scope.data = $firebaseArray(tref);
            $scope.tickets = {};
            tickets = {};
            $scope.data.$loaded().then(function () {

            });

        }
        $scope.cargarTickets = function (id) {
            var tref = ref.child($scope.condominioSeleccionado).child(id);
            $scope.tickets[id] = $firebaseArray(tref);
            $scope.tickets[id].$loaded().then(function (s) {
                console.log(s)
            })
        }
        $scope.verAprobar = function (a) {
            $scope.editar = a;
            $("#modalHistorial").modal("open");
        }
        $scope.aprobar = function (a) {
            var estado = "rechazado"
            if (a) {
                estado = "aprobado";
                $scope.enviarCorreo($scope.editar.correo_condomino)
            } else {
                alert("Debe contactar al usuario personalmente")
            }
            $scope.editar.estado = estado;
            $scope.data.$save($scope.editar).then(function () {
                Materialize.toast("Se realizado la acción", 5000);
                $("#modalHistorial").modal("close");
            })
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

        $scope.abrirRespuestas = function (objeto, codigo) {
            $("#modalRespuestas").modal('open');
            $scope.editar = objeto;
            $scope.editar_codigo = codigo;
            var respuestas = $firebaseArray(ref.child($scope.condominioSeleccionado).child(codigo).child(objeto.$id).child("respuestas"));
            respuestas.$loaded().then(function () {
                Materialize.updateTextFields();
            })
            $scope.respuestas = respuestas;
        }
        $scope.crearRespuesta = function () {
            if ($scope.respuesta) {
                $scope.respuesta.condomino = false
                var hoy = new Date();
                $scope.respuesta.fecha = hoy.getTime();
                $scope.respuestas.$add($scope.respuesta).then(function (s) {
                    $scope.enviarCorreo($scope.editar.correo_condomino, "Respuesta de Ticket", $scope.respuesta.mensaje)
                });
            }
        }
        $scope.enviarCorreo = function (correo, titulo, mensaje) {
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: correo,
                            mensaje: mensajeTemplate(mensaje),
                            titulo: "Mensaje para Ticket",
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
        function mensajeTemplate(mensaje) {
            return `
            <p>
                Se ha utilizado el sistema de tickets, por el administrador.
                <br>
                <br>
                El mensaje es: ${mensaje}
            </p>
            `
        }
        $scope.cerrar = function (i) {
            if (confirm("¿Desea cerrar este caso?")) {
                i.abierto = false;
                $scope.tickets[$scope.editar_codigo].$save(i).then(function (s) {
                    Materialize.toast("Cambio realizado", 5000);
                })
            }
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