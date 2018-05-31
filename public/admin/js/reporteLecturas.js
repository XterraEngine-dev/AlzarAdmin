"use strict";

var currentUserType;
var usuario;

var ref = firebase.database().ref('lecturas');
var uref = firebase.database().ref('condominos');
var cref = firebase.database().ref('condominios');

var obj, tipo, condominios, condominos, lecturas;

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

            var mesT = $scope.mesSeleccionado;
            var anioT = $scope.anioSeleccionado;

            console.log(mesT)
            console.log(anioT)

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
                        console.log(condomino)
                        condomino.selected = false
                        if (condomino.contador) {
                            firebase.database().ref("lecturas").child($scope.condominioSeleccionado).child(condomino.contador).child(mesT + "-" + anioT).once("value").then(function (s) {
                                var da = s.val();
                                console.log(da)
                                if (da) {
                                    condomino.fecha = da.fecha
                                    condomino.lectura = da.lectura || "";
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
        $scope.modificar = function (id) {
            $scope.editar = id;
            $("#modificarModal").modal("open");
        }
        $scope.modificarUltima = function (isValid) {
            if (isValid) {
                var mesT = $scope.mesSeleccionado;
                var anioT = $scope.anioSeleccionado;
                var contador = $scope.data[$scope.editar].contador

                ref.child($scope.condominioSeleccionado).child(contador).child(mesT + "-" + anioT).update({
                    lectura: $scope.ultima
                }).then(function (snapshot) {
                    setTimeout(() => {
                        Materialize.toast("Se ha modificado la lectura", 8000);
                        $("#modificarModal").modal("close");
                    }, 500);
                })
                var codigo = $scope.condominioSeleccionado + $scope.data[$scope.editar].codigo
                firebase.database().ref("condominos").child($scope.condominioSeleccionado).child(codigo).update({
                    ultimalectura_contador: $scope.ultima
                });
                ref.child($scope.condominioSeleccionado).child(contador).child(mesT + "-" + anioT).once("value").then(function (s) {
                    if (s.val()) {
                        var data = s.val();
                        $scope.data[$scope.editar].lectura = data.lectura - data.lectura_pasada;
                    }
                });
                var timeStamp = new Date();
                firebase.database().ref("consola").push({
                    fecha: timeStamp.getTime(),
                    usuario: $scope.user.uid,
                    accion: "Se modificó la lectura del contador: " + contador
                });

            }
        }
        $scope.exportarUsuarios = function () {
            var mystyle = {
                sheetid: 'LECTURAS ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + " " + $scope.mesSeleccionado + "-" + $scope.anioSeleccionado,
                headers: true,
                caption: {
                    title: 'LECTURAS ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + " " + $scope.mesSeleccionado + "-" + $scope.anioSeleccionado
                },
                columns: [
                    { columnid: 'contador', title: "No. Contador" },
                    { columnid: 'codigo', title: "Código" },
                    { columnid: 'no_boleta', title: "No. Boleta" },
                    { columnid: 'correo', title: 'Correo' },
                    { columnid: 'consumo', title: "Consumo (m3)" },
                    { columnid: 'lectura', title: "Lectura Actual" },
                    { columnid: 'lectura_pasada', title: "Lectura Pasada" },
                    { columnid: 'fecha', title: "Fecha de emisión" },
                ]
            };
            $scope.lecturas = []
            $scope.condominos.forEach(u => {
                var fechat = timeConverter(u.fecha);
                $scope.lecturas.push({
                    contador: u.contador || "",
                    codigo: u.codigo || "",
                    no_boleta: u.no_boleta || "",
                    correo: u.correo || "",
                    consumo: u.consumo || "",
                    lectura: u.lectura || "",
                    lectura_pasada: u.lectura_pasada || "",
                    fecha: fechat || ""
                });
            });
            alasql('SELECT * INTO XLS("lecturas ' + condominios[condominios.$indexFor($scope.condominioSeleccionado)].nombre + '.xls",?) FROM ?', [mystyle, $scope.lecturas]);
        }
        $scope.enviarRecordatorios = function () {

            /*
            var correos = $filter('filter')($scope.condominos, $scope.search);
            console.log(correos)
            
            */
            var correos = $scope.seleccionados.filter(function (currentValue, index, arr) {
                return currentValue != null;
            });
            if (correos.length > 0) {
                waiting();
                for (var kkk = 0; kkk < correos.length; kkk++) {
                    enviarRecordatorio(correos, kkk, correos.length - 1);
                }
            }
        }
        var d = new Date();
        // Set it to one month ago
        d.setDate(d.getDate() - 3);

        $scope.actual_time_menos_3 = d.getTime();
        console.log($scope.actual_time_menos_3)
        $scope.verHistorial = function (i) {
            var contador = i.contador
            lecturas = $firebaseArray(ref.child($scope.condominioSeleccionado).child(contador));
            $scope.lecturas = lecturas;
            $scope.actualContador = contador;
            $scope.editar = i;
            $("#modalHistorial").modal("open")
        }
        $scope.eliminarLectura = function (i, id) {
            if (confirm("¿Está seguro de eliminar la lectura?")) {
                var mensaje = prompt("Ingrese la justificación")
                if (!mensaje) {
                    $scope.eliminarLectura(i)
                } else {
                    var codigo = $scope.condominioSeleccionado + i.codigo;
                    firebase.database().ref("condominos").child($scope.condominioSeleccionado).child(codigo).update({
                        ultimalectura_contador: i.lectura_pasada,
                        fechaultima_lectura: ""
                    });
                    ref.child($scope.condominioSeleccionado).child(i.contador).child($scope.mesSeleccionado + "-" + $scope.anioSeleccionado).set({}).then(function (snapshot) {
                        firebase.database().ref("fotos_lecturas").child($scope.condominioSeleccionado).child(i.contador).child($scope.mesSeleccionado + "-" + $scope.anioSeleccionado).set({}).then(function (snapshot) {

                        });
                    });
                    var timeStamp = new Date();
                    firebase.database().ref("consola").push({
                        fecha: timeStamp.getTime(),
                        usuario: $scope.user.uid,
                        accion: "La justificación fue: " + mensaje
                    });
                }
            }
        }

        $scope.seleccionados = [];

        $scope.check = function (i, v) {
            setTimeout(() => {
                if (i != null && v) {
                    if (v.selected) {
                        $scope.seleccionados = $scope.condominos.map(function (item) {
                            if (item.selected)
                                return item
                        });
                    } else {
                        $scope.seleccionados = $scope.condominos.map(function (item) {
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
            $scope.seleccionados = $scope.condominos.map(function (item) {
                item.selected = true;
                return item
            });
            setTimeout(() => {
                $scope.$apply();
            }, 50);
        };

        $scope.uncheckAll = function () {
            $scope.seleccionados = [];
            $scope.condominos.map(function (item) {
                item.selected = false;
                return;
            });
        };
        $scope.modificarLectura = function (o, i) {
            var nv = parseInt(prompt("Ingrese un número"));
            if (isNaN(nv)) {
                alert("Es obligatorio ingresar un número")
            } else {
                o.lectura = nv;
                $scope.lecturas.$save(i);
                if (i > 0) {
                    var fecha = new Date(o.fecha);
                    var mes = fecha.getMonth() + 2, anio = fecha.getFullYear();
                    if (mes < 10) mes = "0" + mes;
                    ref.child($scope.condominioSeleccionado).child($scope.editar.contador).child(mes + "-" + anio).update({
                        lectura_pasada: nv
                    });
                } else {
                    firebase.database().ref("condominos").child($scope.condominioSeleccionado).child($scope.condominioSeleccionado + $scope.editar.codigo).update({
                        ultimalectura_contador: nv
                    });
                }
                Materialize.toast("Modificación realizada", 8000)
            }
        }
        $scope.cargarFoto = function (i) {
            var fecha = new Date(i.fecha);
            var mes = 1 + fecha.getMonth(), anio = fecha.getFullYear();
            if (mes < 10) mes = "0" + mes;
            console.log(mes, anio, $scope.actualContador)
            firebase.database().ref("fotos_lecturas").child($scope.condominioSeleccionado).child($scope.actualContador).child(mes + "-" + anio).once("value").then(function (s) {
                var da = s.val();
                if (da) {
                    if (da.foto) {
                        i.foto = da.foto;
                    }
                }
            })
        };
        var rABS = true;
        $scope.cargarInicial = function () {

            waiting();

            var file = document.getElementById("archivoInicial").files[0];
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
                                    u.contador = d.v || ""
                                    break;
                                case "B":
                                    u.lectura = d.v || ""
                                    break;
                            }
                        }
                    }
                    console.log(u)
                    if (u.lectura && u.contador) {
                        usuariosCargando.push(u);
                    }
                    j++;
                }
                var errores = [];
                var mesT = $scope.mesSeleccionado;
                var anioT = $scope.anioSeleccionado;
                function cargarContadores(a, j, final) {
                    if (a[j])
                        if (a[j].contador) {
                            firebase.database().ref("condominos").child($scope.condominioSeleccionado).orderByChild("contador").equalTo("" + a[j].contador).once("value").then(function (s) {
                                if (s.val()) {
                                    firebase.database().ref("lecturas").child($scope.condominioSeleccionado).child(a[j].contador).child(mesT + "-" + anioT).set({
                                        lectura: a[j].lectura
                                    }).then(function () {
                                        Materialize.toast("Se cargó lectura " + (j + 1) + " de " + (final + 1), 8000)
                                        j++;
                                        if (j <= final) {
                                            cargarContadores(a, j, final);
                                        } else {
                                            destroyWaiting();
                                        }
                                    })
                                }
                                else {
                                    Materialize.toast("El contador " + a[j].contador + " no existe", 8000)
                                    j++;
                                    if (j <= final) {
                                        cargarContadores(a, j, final);
                                    } else {
                                        destroyWaiting();
                                    }
                                }
                            })
                        } else {
                            Materialize.toast("No se encontró el contador ", 8000)
                            j++;
                            if (j <= final) {
                                cargarContadores(a, j, final);
                            } else {
                                destroyWaiting();
                            }
                        }
                }
                if (usuariosCargando.length) {
                    console.log(usuariosCargando)
                    cargarContadores(usuariosCargando, 0, usuariosCargando.length - 1);
                } else {
                    Materialize.toast("No hay contadores asociados, intenta de nuevo", 10000);
                }

            }
            reader.readAsBinaryString(file);

        }
        function enviarRecordatorio(a, j, final) {
            var u = a[j]
            var condominio = condominios[condominios.$indexFor($scope.condominioSeleccionado)]
            var exceso = u.consumo - u.cuota_agua
            if (exceso < 0) {
                exceso = 0;
            }
            $.ajax({
                type: "POST",
                url: 'https://us-central1-alzargt.cloudfunctions.net/enviarCorreo',
                data: {
                    json: JSON.stringify({
                        mensaje: {
                            receptor: u.correo,
                            mensaje: mensajeTemplate(u.codigo, u.ultimalectura_contador, u.lectura_pasada, u.consumo, exceso, timeConverter(u.fecha)),
                            titulo: "Lectura de consumo de Agua Potable",
                            logo: condominio.logo,
                            condominio_nombre: condominio.nombre,
                            emisor: $scope.user.email
                        }
                    })
                },
                success: function (data, textStatus, xhr) {
                    Materialize.toast("Mensaje " + (j + 1) + "/" + (final + 1) + " enviado con éxito", 5000);
                    j++;
                    if (j <= final) {
                        //enviarRecordatorio(a, j, final);
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
                        //enviarRecordatorio(a, j, final);
                    } else {
                        destroyWaiting();
                    }
                }
            });
        }
        function mensajeTemplate(no_casa, l_actual, l_anterior, consumo, exceso, fecha) {
            return `
            <h4>Control de lectura de Agua Potable, residencia ${no_casa}</h4>
            <br>
            <p>
                Fecha de la lectura ${fecha}
            </p>
            <br>
            <br>
            <table class="informativa">
                <thead>
                    <tr>
                        <td>
                            Descripción
                        </td>
                        <td>
                            Metros cúbicos
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            Lectura anterior
                        </td>
                        <td>
                            ${l_anterior}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Lectura actual
                        </td>
                        <td>
                            ${l_actual}
                        </td>
                    </tr>
                </tbody>
            </table>
            <br>
            <table class="informativa">
                <thead>
                    <tr>
                        <td>
                            Descripción
                        </td>
                        <td>
                            Metros cúbicos
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            Consumo de Agua
                        </td>
                        <td>
                            ${consumo}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Exceso (metros cúbicos)
                        </td>
                        <td>
                            ${exceso}
                        </td>
                    </tr>
                </tbody>
            </table>
            <br>
            <br>
            Si tiene dudas consultas con sus lecturas, favor hacerlas a esta Administración.
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