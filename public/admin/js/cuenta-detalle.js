"use strict";

var currentUserType;
var usuario;

//Escritura
var uref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');
var movimientosref = firebase.database().ref('cuenta_corriente').child('movimientos');
var ultimoPagoref = firebase.database().ref('cuenta_corriente').child('ultimo_pago');



//Lectura
var saldosref = firebase.database().ref('cuenta_corriente').child('saldos');
var condomino_ref = firebase.database().ref('condominos');
var lecturas_ref = firebase.database().ref('lecturas');

//AMENIDAD
var amenidad_ref = firebase.database().ref('mis_reservas');





var obj, tipo, condominios, condominos, lecturas;

var email;


var costo_exceso;

var costo_normal;

var saldo_master = [];


var saliente;
var entrante;

(function () {
    var app = angular.module("app", ["firebase"]);


    //Recolectar variables de url.
    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');

            if ($.inArray(hash[0], vars) > -1) {
                vars[hash[0]] += "," + hash[1];


            }
            else {
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
        }

        return vars;
    }


    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http, $filter, $timeout) {




        var c;
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {

                $scope.user = user;
                firebase.auth().currentUser.getIdToken().then(function (idToken) {

                    $scope.email = user.email;
                    cargar_data_condomino();
                    cargar_amenidad();
                    leer_cargas();
                    // cargarCuenta();
                    email = user.email;
                    console.log(email);

                    // Parse the ID token.
                    const payload = JSON.parse(b64DecodeUnicode(idToken.split('.')[1]));
                    if (payload["coordinador"] || user.email === "admin@alzar.com.gt") $scope.userTipo = "coordinador";
                    if (payload["administrador"]) $scope.userTipo = "administrador";
                    if ($scope.userTipo === "coordinador") {
                        condominios = $firebaseArray(cref);
                        condominios.$loaded().then(function () {
                            $scope.noCargando = true;
                            if (condominios.length > 0) {
                                //Materialize.toast("Condominios cargados", 2000);
                            } else {
                                // Materialize.toast("No hay condominios", 2000);
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



        /**
         * Lectura de cargas con excel
         */

        function leer_cargas() {

            saldosref.child(uid_condominio).child(uid_condomino).once("value").then(function (snapshot) {

                if (snapshot.val()) {

                    var condomino = snapshot.val();

                    var costo_cuota_agua_e = condomino.costo_cuota_agua_exceso;
                    var cuota_agua = condomino.cuota_agua;
                    var cuota_agua_mensual = condomino.costo_cuota_agua;



                    snapshot.forEach(function (childSnapshot) {
                        var key_snap = childSnapshot.key;

                        saldosref.child(uid_condominio).child(uid_condomino).child(key_snap).once("value").then(function (snapshot_excel_values) {


                            snapshot_excel_values.forEach(function (snapshotHell) {

                                var hell = snapshotHell.key;
                                console.log('|>', key_snap)
                                console.log('|->', hell)
                                var hell_uid = snapshotHell.val();
                                console.log('|---->', hell_uid.detalle);
                                console.log('|---->', hell_uid.tipo);
                                console.log('|---->', hell_uid.valor);
                                $timeout(function () {
                                    if (hell_uid.tipo) {
                                        saldo_master.push({
                                            tipo: key_snap,
                                            detalle: hell_uid.detalle,
                                            entrante: hell_uid.valor,
                                            saliente: 0
                                        });
                                        $scope.cuentas = saldo_master;
                                        console.log('----->', 'debito', '<-----');
                                    } else {
                                        saldo_master.push({
                                            tipo: key_snap,
                                            detalle: hell_uid.detalle,
                                            entrante: 0,
                                            saliente: hell_uid.valor
                                        });

                                        $scope.cuentas = saldo_master;
                                        console.log('----->', 'credito', '<-----');
                                    }
                                });
                            })
                        })
                    })
                }
            })
        }




        function cargar_data_condomino() {

            condomino_ref.child(uid_condominio).child(uid_condomino).once("value").then(function (snapshot) {

                if (snapshot.val()) {

                    var condomino = snapshot.val();

                    var dt = new Date();
                    var month = dt.getMonth() + 1;
                    var year = dt.getFullYear();
                    var fecha_actual = "0" + month + "-" + year;

                    var costo_cuota_agua_e = condomino.costo_cuota_agua_exceso;
                    var cuota_agua = condomino.cuota_agua;
                    var cuota_agua_mensual = condomino.costo_cuota_agua;



                    var contador = condomino.contador;
                    var costoCuotaAgua = condomino.costo_cuota_agua;
                    var costoCuotaAguaExceso = condomino.costo_cuota_agua_exceso;
                    var limite = condomino.cuota_agua;


                    /* console.log(condomino.costo_cuota_agua_exceso)
                     console.log(condomino.cuota_agua)
                     console.log(condomino.contador);
                     console.log(fecha_actual)*/




                    getConsumo(uid_condominio, contador, fecha_actual).then(consumo => calcular_insertar(consumo, limite, costoCuotaAguaExceso))


                }
            })

        }



        /**
         * CONSUMO 
         */

        //------------------------------------------------------------||>



        function getConsumo(uid_condo, contador, fecha) {

            return new Promise(function (resolve, reject) {
                lecturas_ref.child(uid_condo).child(contador).child(fecha).once("value").then(function (snapshot) {

                    if (snapshot.val()) {
                        var lectura = snapshot.val();
                        var lectura_actual = lectura.lectura;
                        var lectura_pasada = lectura.lectura_pasada;
                        var consumo = lectura.lectura - lectura.lectura_pasada

                        resolve(consumo)
                    }
                }), function (err, content) {
                    resolve(content)
                };
            });

        }




        function calcular_insertar(consumo, limite, costo_m_c) {

            var exceso = consumo - limite;
            var costo_exceso = exceso * costo_m_c;

            console.log('costo: ', consumo)
            console.log('exceso: ', exceso)
            console.log('costo exceso: ', costo_exceso)


            $timeout(function () {



                saldo_master.push({
                    tipo: 'EXCESO',
                    detalle: 'Exceso en consumo de agua',
                    entrante: 0,
                    saliente: costo_exceso
                });

       

                $scope.cuentas = saldo_master;




            });

        }


        //------------------------------------------------------------||>




        /**
         * Variables GLOBALES
         */

        var uid_condominio = getUrlVars()["uid_condominio"]
        var uid_condomino = getUrlVars()["uid_condomino"]
        //
        //Verificar
        //
        console.log('d_condominio: ' + uid_condominio)
        console.log('d_condomino: ' + uid_condomino)



        /**
         * CARGAR AMENIDAD
         */


        function cargar_amenidad() {

            /*  saldo_master.push({
                  tipo: 'Exceso',
                  detalle: 'Exceso en consumo de agua',
                  entrante: costo_exceso,
                  saliente: ''
              });*/
            amenidad_ref.child(uid_condominio).child(uid_condomino).once("value").then(function (snapshot) {


                if (snapshot.val()) {

                    snapshot.forEach(element => {
                        var child = element.val();

                        /* console.log(child.estado)
                         console.log(child.total)
                         console.log(child.nombre_amenidad)*/


                        if (child.estado == 'aprobado') {
                            saldo_master.push({
                                tipo: 'AMENIDAD',
                                detalle: 'Reserva de amenidad ' + child.nombre_amenidad,
                                entrante: 0,
                                saliente: child.total
                            });
                        } else if (child.estado == 'aprobacion') {
                            saldo_master.push({
                                tipo: 'AMENIDAD',
                                detalle: 'Reserva de amenidad ' + child.nombre_amenidad,
                                entrante: child.total,
                                saliente: 0
                            });
                        }

                    });


                }

            });
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