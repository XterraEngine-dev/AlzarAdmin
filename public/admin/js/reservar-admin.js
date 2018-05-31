"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('amenidades');
var refR = firebase.database().ref('reservas');
var refH = firebase.database().ref('reservas_horas');
var refF = firebase.database().ref('reservas_fijas');
var refFF = firebase.database().ref('formularios');
var obj, tipo;
var idUsuario

(function () {
    var setUnchecked = function () {
        $("#checkAll").change(function () {
            $("input:checkbox").prop('checked', false);
        });
    }
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

    var app = angular.module("app", ["firebase", "colorpicker.module", "ngSanitize"]);

    app.controller('ctrl', function ($scope, $firebaseObject, $firebaseAuth, $firebaseArray, $http, $compile) {
        var amenidad_id = getUrlVars()["id"]
        idUsuario = getUrlVars()["uid_condomino"]
        //&uid_condomino=2 add in url
        console.log("uid_condomino: " + idUsuario);

        var today = new Date();

        var timestamp_today = today.getTime();
        $scope.amenidad_id = amenidad_id;
        $scope.condominio_nombre = localStorage.getItem("condominio_nombre");
        $scope.condominio_id = localStorage.getItem("condominio_id");

        function resolverCargarReservasHorarios(conf) {
            console.log(conf)
            return new Promise((resolve, reject) => {
                var tref = refH.child($scope.condominio_id).child($scope.amenidad_id).child(conf.anio).child(conf.mes + 1).child(conf.dia)
                tref.once("value").then(function (snapshot) {
                    if (snapshot.val()) {
                        var reservas_temporales = []
                        snapshot.forEach(element => {
                            var reserva = element.val();
                            if (reserva)
                                reservas_temporales.push(parseInt(element.key))
                        });
                        resolve(reservas_temporales);
                    } else {
                        resolve(new Error("No data"))
                    }
                }).catch(function (e) {
                    reject(new Error(e))
                })
            });
        }
        function resolverCargarReservas(conf) {
            return new Promise((resolve, reject) => {
                var tref = refR.child($scope.condominio_id).child($scope.amenidad_id).child(conf.anio).child((conf.mes + 1))
                tref.once("value").then(function (snapshot) {
                    if (snapshot.val()) {
                        var reservas_temporales = []
                        snapshot.forEach(element => {
                            var reserva = element.val();
                            if (reserva.estado)
                                reservas_temporales.push([
                                    conf.anio,
                                    conf.mes,
                                    parseInt(element.key)
                                ])

                        });
                        resolve(reservas_temporales);
                    } else {
                        resolve(new Error("No data"))
                    }
                }).catch(function (e) {
                    reject(new Error(e))
                })
            });
        }

        async function cargarFechasNoPermitidas(configuarcion_mes_anio) {
            var reservas = [];
            var promesas = []
            configuarcion_mes_anio.forEach(conf => {
                var newArr = resolverCargarReservas(conf);
                promesas.push(newArr)
            });
            return Promise.all(promesas)
        }
        var dias_nombres = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
        function iniciarCalendario(resultados, maximo_disponible) {
            var fechas = []
            resultados.forEach(resultado => {
                if (resultado.constructor === Array)
                    fechas = fechas.concat(resultado)
            });
            var today_mas_4_meses = new Date();
            today_mas_4_meses.setMonth(today_mas_4_meses.getMonth() + (maximo_disponible || 4));
            $(document).ready(function () {
                $('#fecha_seleccionada').pickadate({
                    // Strings and translations
                    monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                    monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                    weekdaysShort: ['Dom', 'Lun', 'Mar', 'Miér', 'Jue', 'Vie', 'Sáb'],
                    today: 'Hoy',
                    clear: 'Borrar',
                    close: 'Cerrar',
                    labelMonthNext: 'Mes siguiente',
                    labelMonthPrev: 'Mes anterior',
                    labelMonthSelect: 'Seleccionar un mes',
                    labelYearSelect: 'Seleccionar un año',
                    disable: fechas,
                    selectMonths: true, // Creates a dropdown to control month
                    selectYears: 2,
                    closeOnSelect: false,
                    format: 'd/mm/yyyy',
                    editable: false,
                    selectYears: false,
                    min: today,
                    max: today_mas_4_meses,
                    onSet: function (dateText) {
                        console.log(dateText.select)
                        var dateAsString = dateText; //the first parameter of this function
                        if (!dateText.select) return;
                        var dateAsObject = new Date(dateText.select)

                        if (dateAsObject) {
                            $('.collapsible').collapsible('open', 1);
                            if (obj.especial) {
                                cargarHorario(dateAsObject)


                            } else {
                                cargarFijos(dateAsObject)
                            }

                            $scope.$apply(function () {
                                $scope.fecha_seleccionada = dateAsObject;
                            })
                        }
                    }
                });
            })
        }
        function cargarHorario(dateAsObject) {
            setUnchecked();
            $scope.seleccionados = [];
            $scope.costos = [];
            resolverCargarReservasHorarios({
                anio: dateAsObject.getFullYear(),
                mes: dateAsObject.getMonth(),
                dia: dateAsObject.getDate()
            }).then(function (horario) {
                var arrayHorario = [], hora_minima, hora_maxima, horario_disponible = [];
                var diaSeleccionado = dias_nombres[dateAsObject.getDay()]
                console.log(diaSeleccionado, obj)
                for (var j in obj.horarios) {
                    var data = obj.horarios[j];

                    if (data) {
                        if (data.dias) {

                            for (var dia in data.dias) {
                                if (diaSeleccionado == data.dias[dia]) {
                                    for (let kk = data.minima; kk < data.maxima; kk++) {



                                        if (kk == 25) {
                                            horario_disponible.push(1)
                                        } if (kk == 26) {
                                            horario_disponible.push(2)
                                        } if (kk == 27) {
                                            horario_disponible.push(3)
                                        } if (kk <= 23) {
                                            horario_disponible.push(kk)
                                        }
                                    }

                                    if (!hora_minima || data.minima < hora_minima)
                                        hora_minima = data.minima;

                                    if (hora_maxima || data.maxima > hora_maxima)
                                        hora_maxima = data.maxima - 1;
                                    console.log("cargados");
                                    console.log(horario_disponible);
                                }
                            }
                        }
                    }
                }
                // horario_disponible.sort(function (a, b) { return a - b });
                console.log(horario_disponible)
                if (horario.constructor === Array) {
                    for (let i = 0; i < horario_disponible.length; i++) {
                        arrayHorario.push({
                            hora: horario_disponible[i],
                            lleno: horario.indexOf(horario_disponible[i]) != -1 ? true : false

                        });


                    }
                } else {
                    for (let i = 0; i < horario_disponible.length; i++) {
                        arrayHorario.push({
                            hora: horario_disponible[i],
                            lleno: false
                        });
                    }
                }
                if (!arrayHorario.length) {
                    alert("El día seleccionado no posee disponibilidad, cambia de día")
                }
                $scope.$apply(function () {
                    $scope.resolverHorario = true;
                    $scope.arrayHorario = arrayHorario;
                })
            })



        }
        function cargarFijos(dateAsObject) {
            setUnchecked();
            $scope.seleccionados = [];
            $scope.costos = [];
            var tRefF = refF.child($scope.condominio_id).child($scope.amenidad_id).child(dateAsObject.getFullYear()).child((dateAsObject.getMonth() + 1)).child(dateAsObject.getDate())
            console.log(tRefF)
            tRefF.once("value").then(function (s) {
                // CARGAR HORARIOS FIJOS
                var arrarFijos = {}
                for (const llave in obj.horarios) {
                    if (obj.horarios.hasOwnProperty(llave)) {
                        const fijo = obj.horarios[llave];
                        arrarFijos[llave] = {
                            horario: fijo.minima + ":00 a " + fijo.maxima + ":00",
                            llave: llave,
                            lleno: false
                        };

                    }
                }

                var reservas = s
                console.log(s)
                if (reservas.val()) {
                    reservas.forEach(reserva => {
                        if (arrarFijos[reserva.key]) {
                            arrarFijos[reserva.key].lleno = true;
                        }
                    });
                }
                if (!arrarFijos.length) {
                    alert("El día seleccionado no posee disponibilidad, cambia de día")
                }
                $scope.$apply(function () {
                    $scope.resolverHorario = true;
                    $scope.arrarFijos = arrarFijos;
                    $scope.arrarFijosLength = Object.keys(arrarFijos).length;
                })
            }).catch(function (e) {
                console.log(e)
            })


        }
        $scope.registrarFormulario = function () {

            $scope.formularioRegistrado = true
            if (obj.especial) { // POR HORAS
                var todos = $scope.arrayHorario;

                var jj = 0;
                $scope.arrayHorario.forEach(horario => {
                    $scope.seleccionados.forEach(seleccionado => {
                        if (seleccionado.hora == horario.hora) todos[jj].lleno = true;

                    });
                    jj++;
                });

                var completarDia = true

                var jj = 0;
                $scope.arrayHorario.forEach(horario => {
                    $scope.seleccionados.forEach(seleccionado => {
                        if (!todos[jj].lleno) completarDia = false
                    });
                    jj++;
                });

                var dia = $scope.fecha_seleccionada
                if (completarDia) {
                    refR.child($scope.condominio_id).child($scope.amenidad_id)
                        .child(dia.getFullYear())
                        .child(dia.getMonth() + 1)
                        .child(dia.getDate()).update({
                            estado: true,
                            administrador: false
                        });
                }
                $scope.seleccionados.forEach(seleccionado => {
                    refH.child($scope.condominio_id).child($scope.amenidad_id)
                        .child(dia.getFullYear())
                        .child(dia.getMonth() + 1)
                        .child(dia.getDate()).update({
                            [seleccionado.hora]: true
                        })
                })
            } else { // POR HORARIOS FIJOS
                var todos = $scope.arrarFijos;
                for (const llave in todos) {
                    if (todos.hasOwnProperty(llave)) {
                        const fijo = todos[llave];

                        $scope.seleccionados.forEach(seleccionado => {
                            if (seleccionado.llave == llave) todos[llave].lleno = true;
                        });
                    }
                }
                var completarDia = true
                for (const llave in todos) {
                    if (todos.hasOwnProperty(llave)) {
                        const fijo = todos[llave];
                        if (!fijo.lleno) completarDia = false
                    }
                }
                var dia = $scope.fecha_seleccionada
                if (completarDia) {
                    refR.child($scope.condominio_id).child($scope.amenidad_id)
                        .child(dia.getFullYear())
                        .child(dia.getMonth() + 1)
                        .child(dia.getDate()).update({
                            estado: true,
                            administrador: false
                        });
                }
                $scope.seleccionados.forEach(seleccionado => {
                    refF.child($scope.condominio_id).child($scope.amenidad_id)
                        .child(dia.getFullYear())
                        .child(dia.getMonth() + 1)
                        .child(dia.getDate()).update({
                            [seleccionado.llave]: true
                        })
                });
            }

            var dejar = true
            var mensaje = ""
            var fecha = new Date();
            var formulario = {
                fecha: fecha.getTime(),
                fecha_seleccionada: $scope.fecha_seleccionada.getTime(),
                total: $scope.total,
                nombre_condomino: $scope.user_data.nombre || "",
                codigo_condomino: $scope.user_data.codigo,
                correo_condomino: $scope.user_data.correo || "",
                telefono_condomino: $scope.user_data.telefono || "",
                deposito: $scope.data.deposito,
                nombre_condominio: $scope.condominio_data.nombre,
                logo_condominio: $scope.condominio_data.logo,
                id_condominio: $scope.condominio_id,
                amenidad_id: $scope.amenidad_id,
                nombre_amenidad: $scope.data.nombre,
                estado: "reserva"
            }

            if (!$scope.costos.length) {
                mensaje = "Aún no has seleccionado ningun horario"
            } else {
                var costos = $scope.costos;
                costos.map(function (item) {
                    delete item.$$hashKey;
                    return {
                        costo: item.costo,
                        horario: item.horario
                    }
                });
                console.log(costos)
                formulario.costos = costos
            }
            var numero_invitados = document.getElementById("numero_invitados").value

            if (!numero_invitados) {
                dejar = false;
                mensaje = "Aún no has ingresado un número de invitados correcto"
            } else {
                formulario.numero_invitados = numero_invitados;
            }
            if (!dejar) {
                Materialize.toast(mensaje, 5000);
                return;
            }
            var observaciones = document.getElementById("observaciones").value
            formulario.observaciones = observaciones || "";
            var descripcion = document.getElementById("descripcion").value
            formulario.descripcion = descripcion;
            var key = refFF.child($scope.condominio_id).child($scope.amenidad_id).push().key
            console.log(formulario)
            firebase.database().ref("mis_reservas").child($scope.condominio_id).child(idUsuario).child(key).set(formulario).then(function (s) {
                console.log("Se ha guardado el formulario en el Usuario")
            });
            refFF.child($scope.condominio_id).child($scope.amenidad_id).child(key).set(formulario).then(function (s) {
                Materialize.toast("Formulario enviado", 5000);
                $scope.$apply(function () {
                    $scope.titulo_alerta = "Imprimir formulario";
                    $scope.descripcion_alerta = "Es necesario que imprima el formulario, luego deberá realizar el pago correspondiente y subir el número de boleta para validar. El administrador aprobará el formulario y su reserva estará confirmada. No olvide que el día del evento deberá presentar su depósito de garantía mediante un cheque."
                    $scope.confirmarAlerta = function () {
                        //$scope.imprimirFormulario(key);
                        $("#modal_alerta").modal("close");
                    }
                })
                $("#modal_alerta").modal("open");
            });
            var url = "formulario.html?cid=" + $scope.condominio_id + "&aid=" + $scope.amenidad_id + "&id=" + key;
            var i = 0;
            console.log($scope.user_data.correo)
            firebase.database().ref("usuarios").orderByChild("condominio").equalTo($scope.condominio_id).once("value").then(function (s) {
                s.forEach(usuario => {

                    if (i == 0) {
                        $scope.enviarCorreo($scope.user_data.correo, url)
                        i++;
                    }


                    console.log("i=" + i);


                });
            })
        }
        $scope.imprimirFormulario = function (key) {
            var win = window.open("mis_reservas.html")
        }
        $scope.seleccionarHora = function (objeto, i) {
            $scope.seleccionados = $scope.seleccionados.sortBy('hora');
            console.log(document.getElementById("c" + i).checked)
            var isInsided = document.getElementById("c" + i).checked
            if (obj.horas_maximas <= $scope.seleccionados.length) {
                Materialize.toast("Has alcanzado el máximo posible", 5000)
                document.getElementById("c" + i).checked = false;
                return;
            } else {
                if ((obj.horas_uso - 1) > $scope.seleccionados.length) {
                    $scope.errorValidacion = true;
                    Materialize.toast("Aún faltan " + (obj.horas_uso - $scope.seleccionados.length - 1) + " horas para un uso normal", 3000);
                } else $scope.errorValidacion = false;
            }
            if ((obj.horas_uso - 1) == $scope.seleccionados.length) {
                Materialize.toast("Has alcanzado las horas prestadas", 3000);
            }
            if ((obj.horas_uso - 1) < $scope.seleccionados.length) {
                Materialize.toast("Has seleccionado " + Math.abs((obj.horas_uso - $scope.seleccionados.length - 1)) + " extra", 3000);
            }
            if (isInsided) {
                $scope.seleccionados.push(objeto);

                $scope.costos = $scope.seleccionados.map(function (valor, index, array) {
                    var costo;
                    if (index === 0) {
                        costo = obj.costo_uso
                    } else {
                        if (index > 0 && index < obj.horas_uso) costo = 0;
                        else costo = obj.costo_hora;
                    }
                    var o = {
                        horario: valor.hora,
                        costo: costo
                    };
                    return o
                });

                $scope.costos = $scope.costos.sortBy('horario');
                $scope.total = $scope.costos.sum("costo")
                console.log($scope.total)

            } else {
                $scope.seleccionados = $scope.seleccionados.filter(function (el) {
                    return el.hora !== objeto.hora;
                });
                $scope.costos = $scope.seleccionados.map(function (valor, index, array) {
                    var costo;
                    if (index === 0) {
                        costo = obj.costo_uso
                    } else {
                        if (index > 0 && index < obj.horas_uso) costo = 0;
                        else costo = obj.costo_hora;
                    }
                    var o = {
                        horario: valor.hora,
                        costo: costow
                    };
                    return o
                });

                $scope.seleccionados = $scope.seleccionados.sortBy('hora');
                $scope.costos = $scope.costos.sortBy('horario');
                $scope.total = $scope.costos.sum("costo")
            }
            $scope.errorValidacion = false;
            if ($scope.costos.length < obj.horas_uso) {
                $scope.errorValidacion = true;
            }
        }
        $scope.seleccionarFijo = function (objeto, i) {
            var isInsided = document.getElementById("c" + i).checked
            console.log(isInsided)
            if (obj.horas_maximas <= $scope.costos.length) {
                Materialize.toast("Has alcanzado el máximo posible", 5000)
                document.getElementById("c" + i).checked = false;
                return;
            }
            if (isInsided) {
                $scope.seleccionados.push(objeto);
                var costo = obj.costo_uso;
                if ($scope.costos.length >= 1) {
                    costo = obj.costo_hora;
                }
                $scope.costos.push({
                    horario: objeto.horario,
                    costo: costo
                })

                $scope.total = $scope.costos.sum("costo")
                console.log($scope.total)
            } else {
                $scope.costos = $scope.costos.filter(function (el) {
                    return el.horario !== objeto.horario;
                });
                var kkk = 0;
                $scope.costos.forEach(costo => {
                    var costo = obj.costo_hora;
                    if (kkk == 0) {
                        costo = obj.costo_uso
                        console.log(costo)
                    }
                    $scope.costos[kkk].costo = costo;
                    kkk++;
                });
                $scope.seleccionados = $scope.seleccionados.filter(function (el) {
                    return el.hora !== objeto.hora;
                });
                $scope.seleccionados = $scope.seleccionados.sortBy('hora');
                $scope.costos = $scope.costos.sortBy('horario');
                $scope.total = $scope.costos.sum("costo")
            }
        }
        $scope.alertaConfirmacionPrecio = function (objeto) {
            $scope.confirmacion_precio = objeto.confirmacion_precio
            if (objeto.confirmacion_precio) {
                $scope.titulo_alerta = "Realizar pago";
                var descripcion_alerta = "Ahora deberás realizar el pago en la cuenta correspondiente a la Administración de tu Condominio. Luego presentar tu boleta de pago en Administración, además llevar un Cheque con el valor del depósito por garantía, con un valor de Q " + obj.deposito + ", este no será cobrado, será garantía por uso de la amenidad."
                $scope.descripcion_alerta = descripcion_alerta;
                $("#modal_alerta").modal("open");
            }
        }
        $scope.alertaConfirmacionDeposito = function (objeto) {
            $scope.confirmacion_deposito = objeto.confirmacion_deposito
            if (objeto.confirmacion_deposito) {
                $scope.titulo_alerta = "Cheque de Garantía";
                var descripcion_alerta = "Se le avisa, que el Cheque de Depósito por Garantía se entrega por aparte, el pago por uso se realiza previo a la confirmación de su reserva."
                $scope.descripcion_alerta = descripcion_alerta;
                $("#modal_alerta").modal("open");
            }
        }
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $scope.user = user;
                firebase.database().ref("condominios").child($scope.condominio_id).once("value").then(function (snapC) {
                    if (snapC.val()) {
                        // INFORMACIÓN DEL CONDOMINIO
                        $scope.condominio_data = snapC.val();
                        var configuarcion_mes_anio = [];
                        var maximo_disponible = parseInt($scope.condominio_data.maximo_disponible) || 4;
                        for (let i = 0; i < maximo_disponible; i++) {
                            var fecha_mes_t = new Date();
                            fecha_mes_t.setMonth(fecha_mes_t.getMonth() + i);
                            configuarcion_mes_anio.push({
                                anio: fecha_mes_t.getFullYear(),
                                mes: fecha_mes_t.getMonth()
                            });
                        }
                        cargarFechasNoPermitidas(configuarcion_mes_anio).then(resultados => {
                            iniciarCalendario(resultados, maximo_disponible)
                        });

                        var horario = []

                        document.documentElement.style.setProperty('--color-principal', $scope.condominio_data.color);
                        setTimeout(() => {
                            // Comrpobar no tenga bloqueos
                            var hoy = new Date();
                            firebase.database().ref("sanciones").child(idUsuario).orderByChild("condomino").equalTo(idUsuario).once("value").then(function (s) {
                                var dejar = true
                                if (s.val()) {
                                    s.forEach(sancion => {
                                        if (sancion.val().expiracion > hoy) dejar = false;
                                        alert("Usted posee una sanción: " + sancion.razon)
                                        setTimeout(() => {
                                            window.location.replace("index.html");
                                        }, 4000);
                                    });
                                }
                                if (dejar) {
                                    // NO POSEE BLOQUEOS
                                    firebase.database().ref("condominos").child($scope.condominio_id).child(idUsuario).orderByChild("expiracion").startAt(timestamp_today).once("value").then(function (ss) {
                                        $scope.condomino_data = ss.val()
                                        $scope.$apply();
                                        cargarAmenidad();
                                    })
                                }
                            })
                        }, 10);
                    }
                });
                firebase.database().ref("condominos").child($scope.condominio_id).child(idUsuario).once("value").then(function (snapU) {
                    if (snapU.val()) {
                        $scope.user_data = snapU.val()
                        console.log(snapU.val())

                        console.log("usuario uid:" + idUsuario);
                    }
                });
            } else {
                window.location.replace("login.html")
            }
        });

        function cargarAmenidad() {
            obj = $firebaseObject(ref.child($scope.condominio_id).child($scope.amenidad_id));
            $scope.reserva = {}
            obj.$loaded().then(function () {
                $scope.reserva.horas = obj.horas_uso
                $scope.noCargando = true;
                if (obj) {
                    setTimeout(() => {
                        Materialize.updateTextFields();
                    }, 100);
                }
            });
            $scope.data = obj
        }

        $scope.enviarCorreo = function (correo, url) {
            console.log(correo, url)
            console.log("correo enviado");
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: correo,
                            mensaje: mensajeTemplate($scope.data.nombre, $scope.condominio_data.nombre, $scope.user_data.nombre, $scope.fecha_seleccionada, $scope.total, url),
                            titulo: "Reserva realizada",
                            logo: $scope.condominio_data.logo,
                            condominio_nombre: $scope.condominio_data.nombre,
                            emisor: $scope.user_data.correo
                        }
                    })
                },
                success: function (data, textStatus, xhr) {
                    console.log(data)
                },
                error: function (error) {
                    console.log(error)
                }
            });
        }
        function mensajeTemplate(nombre_amenidad, nombre_condominio, nombre_condomino, fecha_seleccionada, total, url) {
            return `
            <p>
                Se ha completado el formulario para la reserva de la amenidad ${nombre_amenidad}, del condominio ${nombre_condominio}. <br><br>
                Reserva realizada por: ${nombre_condomino}.
                <br>
                <br>
                Para la fecha: ${timeConverter(fecha_seleccionada)}
                <br>
                <br>
                Por un valor total de: Q ${total}.
                <br>
                <br>
                Para ver el formulario haz clic <a href="https://app.alzar.com.gt/${url}" target="_blank">aquí</a> (Vista Impresión).
            </p>
            `
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
Array.prototype.sortBy = function (p) {
    return this.slice(0).sort(function (a, b) {
        return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
    });
}
Array.prototype.sum = function (prop) {
    var total = 0
    for (var i = 0, _len = this.length; i < _len; i++) {
        total += this[i][prop]
    }
    return total
}

function ProcessChildMessage(window) {
    window.print()
}
