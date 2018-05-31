"use strict";

var currentUserType;
var usuario;

//var ref = firebase.database().ref('lecturas');
var uref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');


//Lecturas 

var condomino_ref = firebase.database().ref('condominos');
var lecturas_ref = firebase.database().ref('lecturas');


//Ingresos

var movimientosref = firebase.database().ref('cuenta_corriente').child('movimientos');
var ultimoPagoref = firebase.database().ref('cuenta_corriente').child('ultimo_pago');

var saldosref = firebase.database().ref('cuenta_corriente').child('saldos');
var condomino_ref = firebase.database().ref('condominos');
var lecturas_ref = firebase.database().ref('lecturas');



var f = {};
var z = {};

var obj, tipo, condominios, condominos, lecturas;

var new_condominio;

var mes;


var param_mes;
var param_anio;
(function () {
    var app = angular.module("app", ["firebase"]);


    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http, $filter) {
        var time = new Date(), anio = time.getFullYear();
        $scope.anios = [
            anio - 2,
            anio - 1,
            anio
        ]
        var meses = [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
        ];

        var firstDay = new Date(time.getFullYear(), time.getMonth(), 1);
        firstDay.setHours(0, 0, 0, 0);
        $scope.firstSecond = firstDay.getTime();
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

                                    $scope.meses = meses;
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
   * Modal y funciones para consolidar.
   */



        $scope.consolidar = function () {
            $("#modalConsolidar").modal("open");
        }


        $scope.proceso_de_consolidacion = function (condominioSeleccionado) {
            $("#modalConsolidar").modal("close");
            console.log('procesando...', condominioSeleccionado)

            $scope.cargarCondominio(condominioSeleccionado, false);

        }




        $scope.cargarCondominio = function (id, carga) {




            if (carga) {
                if (!$scope.condominioSeleccionado)
                    $scope.condominioSeleccionado = id;
                if (!id)
                    id = $scope.condominioSeleccionado;

                var mesT = $scope.mesSeleccionado;
                var anioT = $scope.anioSeleccionado;

                console.log(mesT)
                console.log(anioT)
                param_mes = mesT;
                param_anio = anioT;

                if (!id || !mesT || !anioT)
                    return;

                var tref = uref.child(id)

                $scope.noCargando = false;
                console.log(mesT, anioT);

                condominos = $firebaseArray(tref);
                condominos.$loaded().then(function () {
                    $scope.noCargando = true;
                    if (condominos.length > 0) {
                        condominos.forEach(condomino => {


                            condomino.selected = false
                            if (condomino.contador) {
                                firebase.database().ref("lecturas").child($scope.condominioSeleccionado).child(condomino.contador).child(mesT + "-" + anioT).once("value").then(function (s) {
                                    var da = s.val();
                                    // console.log(da)
                                    if (da) {
                                        condomino.fecha = da.fecha
                                        condomino.lectura = da.lectura || "";
                                        condomino.lectura_pasada = da.lectura_pasada || "";
                                        condomino.consumo = da.lectura - da.lectura_pasada;
                                        if (isNaN(condomino.consumo)) condomino.consumo = "";
                                        condomino.no_boleta = da.no_boleta || "";
                                        $scope.$apply(function () {
                                            $scope.condominos[$scope.condominos.$indexFor(condomino.codigo)] = condomino
                                        })

                                    }
                                });

                            }

                        });

                        Materialize.toast("Condominos cargados", 2000);

                    } else {
                        Materialize.toast("No hay Condominos", 2000);
                    }
                });
                $scope.condominos = condominos;
            } else {
                if (!$scope.condominioSeleccionado)
                    $scope.condominioSeleccionado = id;
                if (!id)
                    id = $scope.condominioSeleccionado;



                if (!id || !mesT || !anioT)
                    return;

                var tref = uref.child(id)

                $scope.noCargando = false;
                console.log(mesT, anioT);


                mes = mesT;
                anio = anioT

                condominos = $firebaseArray(tref);
                condominos.$loaded().then(function () {
                    $scope.noCargando = true;
                    if (condominos.length > 0) {
                        condominos.forEach(condomino => {


                            //Cargar el exceso a todos los condominos
                            cargar_exceso(condomino.condominio, condomino.$id);



                            condomino.selected = false
                            if (condomino.contador) {
                                firebase.database().ref("lecturas").child($scope.condominioSeleccionado).child(condomino.contador).child(mesT + "-" + anioT).once("value").then(function (s) {
                                    var da = s.val();
                                    // console.log(da)
                                    if (da) {
                                        condomino.fecha = da.fecha
                                        condomino.lectura = da.lectura || "";
                                        condomino.lectura_pasada = da.lectura_pasada || "";
                                        condomino.consumo = da.lectura - da.lectura_pasada;
                                        if (isNaN(condomino.consumo)) condomino.consumo = "";
                                        condomino.no_boleta = da.no_boleta || "";
                                        $scope.$apply(function () {
                                            $scope.condominos[$scope.condominos.$indexFor(condomino.codigo)] = condomino
                                        })

                                    }
                                });

                            }

                        });
                        Materialize.toast("Condominos cargados", 2000);

                    } else {
                        Materialize.toast("No hay Condominos", 2000);
                    }
                });
                $scope.condominos = condominos;
            }


        }


        /**
         * Cargar datos de condomino 
         */
        var i = 0;
        function cargar_exceso(uid_condominio, uid_condomino) {

            $scope.mesSeleccionado;

            try {

                /*  console.log('uid_condominio: ' + uid_condominio)
                  console.log('uid_condomino:' + uid_condomino)*/

                condomino_ref.child(uid_condominio).child(uid_condomino).once("value").then(function (snapshot) {

                    if (snapshot.val()) {

                        var condomino = snapshot.val();

                        var dt = new Date();
                        var month = dt.getMonth() + 1;
                        var year = dt.getFullYear();
                        var fecha_actual = "0" + month + "-" + year;

                        var costo_cuota_agua = condomino.costo_cuota_agua_exceso;
                        var cuota_agua = condomino.cuota_agua;



                        if (i == 0) {

                            console.log('||---------------------------------||')
                            console.log(condomino.contador)
                            console.log(condomino.costo_cuota_agua)
                            console.log(condomino.costo_cuota_agua_exceso)
                            console.log(condomino.cuota_agua)
                            console.log('||---------------------------------||')



                            var contador = condomino.contador;
                            var costoCuotaAgua = condomino.costo_cuota_agua;
                            var costoCuotaAguaExceso = condomino.costo_cuota_agua_exceso;
                            var limite = condomino.cuota_agua;



                            // getConsumo(uid_condominio, contador, fecha_actual).then(content => console.log(content))



                            getConsumo(uid_condominio, contador, fecha_actual).then(consumo => calcular_insertar(consumo, limite, costoCuotaAguaExceso))



                            i++;
                        }

                        var contador = condomino.contador;

                        // borrar lecturas
                        /* lecturas_ref.child('-L05boI08Qxdqv9fuvXI').child(contador).child('05-2018').set({
                             null: null
                         });*/




                    }
                })
            } catch (err) {
                // console.log(err)
            }



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

        }


        //------------------------------------------------------------||>

        /**
         * Consolidar AGUA
         */

        function exceso_agua(exceso, costo_exceso, uid_condominio, uid_condomino) {

            var newCobro = movimientosref.child(uid_condominio).child(uid_condomino).child('EXCESO').push();
            newCobro.set({
                valor: costo_exceso,
                tipo: true,
                detalle: "Cobro por exceso de agua: " + exceso,
                fecha: Date.now()
            })
            //Agregar a saldo
            var newSaldo = saldosref.child(uid_condominio).child(uid_condomino).child('EXCESO').push();
            newSaldo.set({
                valor: costo_exceso,
                tipo: true,
                detalle: "Cobro por exceso de agua: " + exceso,
                fecha: Date.now()
            })


        }




        var d = new Date();
        // Set it to one month ago
        d.setDate(d.getDate() - 3);

        $scope.actual_time_menos_3 = d.getTime();
        console.log($scope.actual_time_menos_3)

        $scope.verHistorial = function (i) {

            console.log(i.condominio)
            console.log(i.$id);


            var codigoCondominio = i.condominio;
            var codigoCondomino = i.$id;




            console.log(param_mes, param_anio)

            window.open('cuenta-detalle.html?uid_condominio=' + codigoCondominio + "&uid_condomino=" + codigoCondomino + "&mes=" + param_mes + "&año=" + param_anio, '_blank');

        }
        var rABS = true;



        $scope.importarCobros = function () {

            var con = confirm("Si el código ya existe será sobreescrito");
            if (!con) return;

            var timeStamp = + new Date();
            var new_fecha_creacion = timeStamp;
            var new_creador = $scope.user.email;

            new_condominio = $scope.condominioSeleccionado;
            var new_condominio_nombre = condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre


            //Condominio
            console.log(new_condominio);



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
                                            // console.log('A', u.codigo);
                                            break;
                                        case "B":

                                            u.tipo = d.v || ""
                                            u.tipo = String(u.tipo)
                                            // console.log('B', u.tipo);
                                            break;
                                        case "C":

                                            u.detalle = d.v || ""
                                            //console.log('C', u.detalle);
                                            break;
                                        case "D":

                                            u.entrante = d.v || ""
                                            //console.log('D', u.entrante);
                                            break;
                                        case "E":

                                            u.saliente = d.v || ""
                                            //console.log('E', u.saliente)
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
                        var dejar = false;
                        $scope.condominos.forEach(condo => {
                            if (condo.codigo == u.codigo) dejar = false;
                        });
                        if (dejar) {
                            usuariosCargando.push(u);
                        } else {
                            var i = $scope.condominos.findIndex(x => x.codigo == u.codigo);



                            //  console.log('A', u.codigo)
                            //  console.log('B', u.tipo);
                            //  console.log('C', u.detalle);
                            // console.log('Entrante: ', u.entrante);
                            // console.log('Saliente: ', u.saliente)


                            if (u.entrante > 0) {

                                console.log('entrante')
                                // console.log(uid_condominio)
                                // console.log(uid_condomino)
                                console.log(new_condominio)
                                var newCargo = saldosref.child(new_condominio).child(new_condominio + u.codigo).child(u.tipo).push();
                                newCargo.set({
                                    valor: u.entrante,
                                    tipo: true,
                                    detalle: u.detalle,
                                    fecha: Date.now()
                                })


                            } else {
                                console.log('saliente')
                                // console.log(uid_condominio)
                                //console.log(uid_condomino)
                                console.log(new_condominio)
                                var newCargo = saldosref.child(new_condominio).child(new_condominio + u.codigo).child(u.tipo).push();
                                newCargo.set({
                                    valor: u.saliente,
                                    tipo: false,
                                    detalle: u.detalle,
                                    fecha: Date.now()
                                })
                            }
                        }
                    }
                }
                console.log(usuariosCargando)
                var errores = [];

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



        function randomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }


       /**
        * Modals
        */


        $scope.modalEntrantes = function(){
            $("#modal_entrante").modal("open");
            console.log('modal_entrante')
        }

        $scope.modalSalientes = function(){
            $("#modal_saliente").modal("open");
            console.log('modal_saliente')
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