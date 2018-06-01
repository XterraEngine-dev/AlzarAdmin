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

/**
 * Transacciones
 */
var transaccion_ref = firebase.database().ref('cuenta_corriente');
var amenidad_ref = firebase.database().ref('mis_reservas');

var transac_condomino;
var transac_condominio;


var f = {};
var z = {};
var obj, tipo, condominios, condominos, lecturas;
var new_condominio;
var mes;


var param_mes;
var param_anio;


var s_costo_mantenimiento;
var s_costo_amenidad_pos;
var s_costo_amenidad_neg;
var s_costo_exceso;

var saldo_arr = [];

var amenidadades_pos = [];
var amenidadades_neg = [];


var amenidadPo;

(function () {
    var app = angular.module("app", ["firebase"]);


    app.controller('ctrl', function ($scope, $firebaseAuth, $firebaseArray, $http, $filter, $timeout) {
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

            cref.child(id).once("value").then(function (snapshot) {
                if (snapshot.val()) {
                    var data_snap = snapshot.val();

                    console.log(data_snap.exceso_mes_siguiente)
                    console.log(data_snap.exceso_mes_siguiente)
                    console.log(data_snap.extraordinario_mes_siguiente)
                    console.log(data_snap.inventario_mes_siguiente)
                    console.log(data_snap.mantenimiento_mes_siguiente)
                    console.log(data_snap.mora_mes_siguiente)
                }
            })



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


                                cargarSaldo(id, condomino);

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
                if (!id) {

                    id = $scope.condominioSeleccionado;


                }




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


        $scope.modalEntrantes = function (condominio) {
            $("#modal_entrante").modal("open");
            console.log('modal_entrante')
            console.log(condominio.$id)
            console.log(condominio.condominio)

            transac_condomino = condominio.$id
            transac_condominio = condominio.condominio
        }

        $scope.modalSalientes = function (condominio) {
            $("#modal_saliente").modal("open");
            console.log('modal_saliente')
            console.log(condominio.$id)
            console.log(condominio.condominio)

            transac_condomino = condominio.$id
            transac_condominio = condominio.condominio;
        }


        /**
         * Formularios PAGOS y COBROS
         */
        $scope.Bsaliente = function (pago) {

            console.log(pago.tipo)
            console.log(pago.descripcion)
            console.log(pago.valor)

            console.log(transac_condominio)
            console.log(transac_condomino)

            //Ingresar transacicon en firebase

            var pagoset = transaccion_ref.child(transac_condominio).push();
            pagoset.set({
                descripcion: pago.descripcion,
                tipo: pago.tipo,
                id_condomino: transac_condomino,
                valor: pago.valor,
                entrante: false,
                fecha: Date.now()
            })

        }

        $scope.Bentrante = function (cobro) {

            console.log(cobro.tipo)
            console.log(cobro.descripcion)
            console.log(cobro.valor)

            console.log(transac_condominio)
            console.log(transac_condomino)

            //Ingresar transaccion en firebase
            var cobroset = transaccion_ref.child(transac_condominio).push();
            cobroset.set({
                descripcion: cobro.descripcion,
                tipo: cobro.tipo,
                valor: cobro.valor,
                id_condomino: transac_condomino,
                entrante: true,
                fecha: Date.now()
            })


        }


        /**
         * Cargar saldo sin detalles
         */


        var x = 0;
        function cargarSaldo(u_condominio, u_condomino) {



            /**
             * SUMAR CUENTAS
             */
            if (x < 1) {
                $timeout(function () {



                    /* LOGS propiedades de condomino
                    console.log(u_condominio)
                    console.log(u_condomino.$id)
                    console.log(u_condomino.costo_cuota_agua)
                    console.log(u_condomino.costo_cuota_agua_exceso)
                    console.log(u_condomino.cuota_agua)*/

                    // Prefijo S_ para variables de sumatoria.

                    /**
                     * CUOTA DE MANTENIMIENTO
                     */

                    var s_mantenimiento = u_condomino.cuota_agua;
                    console.log('cuota de mantenimiento', s_mantenimiento)
                    s_costo_mantenimiento = s_mantenimiento;

                    /**
                     * Exceso de Agua
                     */

                    var dt = new Date();
                    var month = dt.getMonth() + 1;
                    var year = dt.getFullYear();
                    var fecha_actual = "0" + 5 + "-" + year;
                    var contador = u_condomino.contador;
                    getConsumo(u_condominio, contador, fecha_actual).then(consumo => calcular_exceso(
                        consumo, u_condomino.costo_cuota_agua_exceso))




                    /**
                     * Amenidades 
                     */


                    //cargar_amenidad(u_condominio, u_condomino.$id)




                    costo_amenidad_pos(u_condominio, u_condomino.$id).then(
                        amenidadades_pos => exportPos(amenidadades_pos)
                    );




                    costo_amenidad_neg(u_condominio, u_condomino.$id).then(
                        amenidadades_neg => exportNeg(amenidadades_neg)
                    );



                    //costo_amenidad(u_condominio, u_condomino.$id).then())


                    var s_costo_amenidad_total = s_costo_amenidad_neg - s_costo_amenidad_pos;
                    var total = s_costo_mantenimiento + s_costo_amenidad_total + s_costo_exceso;





                    console.log('cuota', s_costo_mantenimiento)
                    console.log('amenidad total', s_costo_amenidad_total)
                    console.log('costo exceso ', s_costo_exceso)

                    console.log('TOTAL:', total)


                    saldo_arr.push({
                        total: total
                    })

                    $scope.saldos = saldo_arr;





                })
                x++
            }
        }





        function exportNeg(n) {


            var arr_neg = [];
            var total = 0
            for (var i = 0; i < n.length; i++) {
                total += n[i]
            }
            console.log('total neg', total)
            //negativas = total;

            arr_neg.push({
                neg: total
            })


            $scope.saldosAN = arr_neg

        }

        //{{saldos[$index].total}}

        function exportPos(p) {

            var arr_pos = [];
            var total = 0
            for (var i = 0; i < p.length; i++) {
                total += p[i]
            }
            console.log('total pos', total)
            // positivas = total;
            arr_pos.push({
                pos: total
            })
            $scope.saldosAP = arr_pos

        }



        function costo_amenidad_pos(a, b) {
            return new Promise(function (resolve, reject) {
                amenidad_ref.child(a).child(b).once("value").then(function (snapshot) {


                    if (snapshot.val()) {

                        snapshot.forEach(element => {
                            var child = element.val();




                            if (child.estado == 'aprobado') {

                                console.log('saliente', child.total)
                                amenidadades_pos.push(child.total)

                                $timeout(function () {
                                    resolve(amenidadades_pos)
                                });
                            }
                        });


                    } else {
                        s_costo_amenidad_neg = 0;
                        s_costo_amenidad_pos = 0;
                    }


                }), function (err, content) {
                    resolve(content)
                };
            });
        }

        function costo_amenidad_neg(a, b) {
            return new Promise(function (resolve, reject) {
                amenidad_ref.child(a).child(b).once("value").then(function (snapshot) {

                    if (snapshot.val()) {

                        snapshot.forEach(element => {
                            var child = element.val();

                            if (child.estado == 'aprobacion') {

                                console.log('entrante', child.total)

                                amenidadades_neg.push(child.total);

                                $timeout(function () {
                                    resolve(amenidadades_neg)
                                })
                            }

                        });


                    } else {
                        s_costo_amenidad_neg = 0;
                        s_costo_amenidad_pos = 0;
                    }


                }), function (err, content) {
                    resolve(content)
                };
            });
        }



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


        function calcular_exceso(consumo, costo_m_c) {


            if (consumo > 0) {
                console.log('Consumo', consumo);

                var arr_cosumo = [];
                var exceso = consumo;
                var costo_exceso = exceso * costo_m_c;

                s_costo_exceso = costo_exceso;

                arr_cosumo.push({
                    exceso: costo_exceso
                });

                
                $scope.saldosEx = arr_cosumo;


                /*   console.log('costo: ', consumo)
                   console.log('exceso: ', exceso)*/
                console.log('costo exceso: ', costo_exceso)
            } else {
                var arr_cosumo = [];
                console.log('Consumo', consumo);
                console.log('costo exceso: ', 0)
                arr_cosumo.push({
                    exceso: 0
                });
                $scope.costo_exceso = arr_cosumo;
            }
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