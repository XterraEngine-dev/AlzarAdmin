"use strict";

var crearEncuestaValidate;
var permisos;
var pickerInicioVigencia;
var pickerFinalVigencia;
var currentUserType;
var actualID = localStorage.getItem("resultadosID");
var datosEncuesta, resultados, actualPregunta;
if (!actualID) {
    window.close();
}
var dataColorSet = [
    "#d50000",
    "#c51162",
    "#aa00ff",
    "#6200ea",
    "#304ffe",
    "#2962ff",
    "#0091ea",
    "#00b8d4",
    "#00bfa5",
    "#00c853",
    "#64dd17",
    "#aeea00",
    "#ffd600",
    "#ffab00",
    "#ff6d00",
    "#dd2c00",
    "#263238",
    "#b71c1c",
    "#880e4f",
    "#4a148c",
    "#311b92",
    "#0d47a1",
    "#01579b",
    "#006064",
    "#004d40",
    "#1b5e20",
    "#827717",
    "#f57f17"
]
var cargarColorInput;
var app = angular.module("resultados", ['ngAnimate', 'ngTouch', 'ui.grid', 'ui.grid.selection', 'ui.grid.exporter',"firebase", "chart.js"]);

app.config(['ChartJsProvider', '$qProvider', function (ChartJsProvider, $qProvider) {
    // Configure all charts
    
    // Configure all line charts
    ChartJsProvider.setOptions('line', {
      showLines: true
    });
    ChartJsProvider.setOptions('doughnut', {
        legend: { display: true }
      });
  }]).controller("resultadosCtrl", ['$scope', '$http', '$firebaseObject', '$firebaseArray' , function($scope,$http, $firebaseObject, $firebaseArray) {
    $scope.gridOptions = {
        enableHorizontalScrollbar: 1,
		enableGridMenu: true,
		enableSelectAll: false,
		exporterMenuPdf: false,
		exporterMenuCsv: false,
		showHeader: true,
		onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
		}
    };
    
    var colorOptions = {
        buildCallback: function($elm) {
            this.$colorPatch = $elm.prepend('<div class="cp-disp">').find('.cp-disp');
        },
        cssAddon:
            '.cp-disp {padding:10px; margin-bottom:6px; font-size:12px; height:20px; line-height:20px}' +
            '.cp-xy-slider {width:200px; height:200px;}' +
            '.cp-xy-cursor {width:16px; height:16px; border-width:2px; margin:-8px}' +
            '.cp-z-slider {height:200px; width:40px;}' +
            '.cp-z-cursor {border-width:8px; margin-top:-8px;}' +
            '.cp-alpha {height:40px;}' +
            '.cp-alpha-cursor {border-width:8px; margin-left:-8px;}',
        opacity: false, // disables opacity slider
        renderCallback: function($elm, toggled) {
            var colors = this.color.colors;
            
            this.$colorPatch.css({
                backgroundColor: '#' + colors.HEX,
                color: colors.RGBLuminance > 0.22 ? '#222' : '#ddd'
            }).text(this.color.toString($elm._colorMode)); // $elm.val();
            $elm.val('#' + this.color.colors.HEX);
    
            $scope.resultadosData.colors[$scope.selectedCanvas][ $scope.selectedIndex] = $elm.val();
            $scope.$apply();
        }
    }
    cargarColorInput = function(element) {
        $(element).colorPicker(colorOptions);
    }

    var saveColor = function(i) {
        console.log(i)
        $scope.resultadosData.colors[i] = $("#ci" + i).val()
        $scope.$apply();
    }
    $scope.exportarAExcel = function () {
        waiting();
        var contenido = []
        $(".file_download").fadeOut(50);
        setTimeout(function() {
            
            $(".card").each( function(i, value) {
                console.log(this)
                html2canvas(this, {
                    onrendered: function (canvas) {
                        var data = canvas.toDataURL();
                        contenido.push({image: data, width: 500})
                        if ($(".card").length-1 == i) {
                            var docDefinition = {
                                pageSize: 'LETTER',
                                info: {
                                    title: 'Reporte automático',
                                    author: 'SMART INSIGHTS',
                                },
                                content: contenido
                            };
                            $(".file_download").fadeIn(50);
                            console.log(docDefinition)
                            destroyWaiting();
                            pdfMake.createPdf(docDefinition).download("REPORTE.pdf");
                        }
                    }
                });
            })
        }, 200);
    }
    function getColor(event, array){
        if (array) {
            if (array[0]._index != undefined && array[0]._index != null) {
                var id = $(event.srcElement).attr('id').replace("barrasC", "")
                id = id.replace("pieC", "")
                $("#modalColor").modal("open")
                $scope.selectedCanvas = id
                $scope.selectedIndex = array[0]._index
                $scope.selectedColor = $scope.resultadosData.colors[id][array[0]._index]
                $scope.$apply();
            }
        }
    }
    $scope.opciones = {
        onClick: getColor,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    min: 0,
                    beginAtZero: true,
                }
            }]
        },
        tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                  var dataset = data.datasets[tooltipItem.datasetIndex];
                var total = dataset.data.reduce(function(previousValue, currentValue, currentIndex, array) {
                  return previousValue + currentValue;
                });
                var currentValue = dataset.data[tooltipItem.index];
                var precentage = Math.floor(((currentValue/total) * 100)+0.5);         
                return precentage + "%";
              }
            }
        },
        "animation": {
            "duration": 500,
            "onComplete": function() {
              var chartInstance = this.chart,
                ctx = chartInstance.ctx;
      
              ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = "#FFFFFF";
              this.data.datasets.forEach(function(dataset, i) {
                var meta = chartInstance.controller.getDatasetMeta(i);
                meta.data.forEach(function(bar, index) {
                  var data = dataset.data[index];
                  var total = dataset.data.reduce(function(previousValue, currentValue, currentIndex, array) {
                    return previousValue + currentValue;
                  });
                  var percentage = Math.round( data / total * 100, 2 )
                  ctx.fillText(data + " ("+percentage+"%)", bar._model.x, bar._model.y + 20);
                });
              });
            }
          },
    }
    $scope.pieOpciones = {
        onClick: getColor,
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 500,
            easing: "easeOutQuart",
            onComplete: function () {
                var ctx = this.chart.ctx;
                ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                var id = $(this.canvas).attr('id').replace("pieC", "")
                this.data.datasets.forEach(function (dataset) {
                
                for (var i = 0; i < dataset.data.length; i++) {
                  var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
                      total = dataset._meta[Object.keys(dataset._meta)[0]].total,
                      mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius)/2,
                      start_angle = model.startAngle,
                      end_angle = model.endAngle,
                      mid_angle = start_angle + (end_angle - start_angle)/2;
        
                  var x = mid_radius * Math.cos(mid_angle);
                  var y = mid_radius * Math.sin(mid_angle);
        
                  ctx.fillStyle = "#FFFFFF";
                  var percent = String(Math.round(dataset.data[i]/total*100)) + "%";

                  ctx.fillText($scope.resultadosData.labels[id][i], model.x + x, model.y + y);
                  // Display percent in another line, line break doesn't work for fillText
                  ctx.fillText(percent, model.x + x, model.y + y + 15);
                }
              });               
            }
        }
    }
    $scope.pieOpcionesSin = {
        onClick: getColor,
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 500,
            easing: "easeOutQuart",
            onComplete: function () {
              var ctx = this.chart.ctx;
              ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              var id = $(this.canvas).attr('id').replace("pieC", "")
              this.data.datasets.forEach(function (dataset) {
        
                for (var i = 0; i < dataset.data.length; i++) {
                  var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
                      total = dataset._meta[Object.keys(dataset._meta)[0]].total,
                      mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius)/2,
                      start_angle = model.startAngle,
                      end_angle = model.endAngle,
                      mid_angle = start_angle + (end_angle - start_angle)/2;
        
                  var x = mid_radius * Math.cos(mid_angle);
                  var y = mid_radius * Math.sin(mid_angle);
        
                  ctx.fillStyle = "#FFFFFF";
                  var percent = String(Math.round(dataset.data[i]/total*100)) + "%";
                  ctx.fillText($scope.resultadosData.labelsMultiples[id][i], model.x + x, model.y + y);
                  // Display percent in another line, line break doesn't work for fillText
                  ctx.fillText(percent, model.x + x, model.y + y + 15);
                }
              });               
            }
        }
    }
    $scope.mostrarTodo = false;
    $scope.porcentaje = false;
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firebase.database().ref("encuestas").child(actualID).once("value").then(function(snapshotEncuesta){
                $scope.encuesta = snapshotEncuesta.val();
                $scope.$apply();
            });
            firebase.database().ref("usuarios").child(user.uid).once("value").then(function(snapshotUser){
                $scope.user = snapshotUser.val()
                switch ($scope.user.tipo) {
                    case "supervisor":
                        switch ($scope.user.tipo_asignado) {
                            case "sucursal":
                                for (var index in $scope.user.asignado) {    
                                    var valor = $scope.user.asignado[index]
                                    cargarSucursalesValores(valor)
                                }
                                break;
                            case "distrito":
                                for (var index in $scope.user.asignado) {    
                                    var valor = $scope.user.asignado[index]
                                    cargarDistritosValores(valor);
                                }
                                break;
                            case "region":
                                for (var index in $scope.user.asignado) {  
                                    var valor = $scope.user.asignado[index]
                                    cargarRegionesValores(valor);
                                }
                            default:
                                break;
                        }
                        break;
                    case "manager":
                        cargarEmpresaData($scope.user.empresa_uid)
                        break;
                    case "administrador":
                        cargarEmpresasData()
                        break;
                    default:
                        break;
                }
            }).catch( function(error) {
                if (error) {
                    console.error(error)
                }
            })
        }
    })
    function cargarRegionesValores(valor) {
        firebase.database().ref("empresas").child($scope.user.empresa_uid).child("regiones").once("value").then(function (snapshotRegiones) {
            snapshotRegiones.forEach(function(region) {
                if (region.key == valor) {
                    console.log(valor)
                    cargarRegionData($scope.user.empresa_uid, region.key);
                } 
            });
        });
    }
    function cargarDistritosValores(valor) {
        firebase.database().ref("empresas").child($scope.user.empresa_uid).child("regiones").once("value").then(function (snapshotRegiones) {
            snapshotRegiones.forEach(function(region) {
                console.log(region.val())
                for (var i in region.val().distritos) {
                    if (i == valor) {
                        cargarDistritoData($scope.user.empresa_uid, region.key, i);
                    }
                }
            });
        });
    }
    function cargarSucursalesValores(valor) {
        firebase.database().ref("empresas").child($scope.user.empresa_uid).child("sucursales").child(valor).once("value").then(function (snapshotSucursal) {
            var sucursal = snapshotSucursal.val();
            if (sucursal) {
                cargarAgenciasData($scope.user.empresa_uid, sucursal.region, sucursal.distrito, valor)
            }
        });
    }
    var hoy = + new Date();
    $scope.finalVigencia = hoy;
    $scope.inicioVigencia = hoy;
    function cargarEmpresasData(){
        firebase.database().ref("empresas").once("value").then(function (snapshot) {
            if (snapshot.val()) {
                $scope.filtroData = {}
                snapshot.forEach(function(childData) {                    
                    $scope.filtroData[childData.key] = {nombre: childData.val().nombre}
                    $scope.filtroData[childData.key].regiones = {}                    
                    for (var i in childData.val().regiones) {
                        if (childData.val().regiones.hasOwnProperty(i)) {
                            var element = childData.val().regiones[i];
                            $scope.filtroData[childData.key].regiones[i] = {}
                            $scope.filtroData[childData.key].regiones[i].nombre = element.nombre
                            $scope.filtroData[childData.key].regiones[i].distritos = {}
                            for (var j in element.distritos) {
                                var distrito = element.distritos[j]
                                $scope.filtroData[childData.key].regiones[i].distritos[j] = {}
                                $scope.filtroData[childData.key].regiones[i].distritos[j].nombre = distrito.nombre
                                $scope.filtroData[childData.key].regiones[i].distritos[j].sucursales = {}
                                for (var k in childData.val().sucursales) {
                                    var sucursal = childData.val().sucursales[k]
                                    $scope.filtroData[childData.key].regiones[i].distritos[j].sucursales[k] = {}
                                    $scope.filtroData[childData.key].regiones[i].distritos[j].sucursales[k].nombre = sucursal.nombre
                                    $scope.filtroData[childData.key].regiones[i].distritos[j].sucursales[k].agentes = {}
                                    
                                }
                            }
                        }
                    }
                });
                $scope.$apply();
                $('select').material_select();
                setTimeout(function() {
                    cargarResultados();
                }, 100);
            }
        });
    }
    function cargarEmpresaData(empresa_uid){
        firebase.database().ref("empresas").child(empresa_uid).once("value").then(function (snapshot) {
            $scope.filtroData = {}
                          
            $scope.filtroData[empresa_uid] = {nombre: snapshot.val().nombre}
            if (!$scope.filtroData[empresa_uid].regiones) {
                $scope.filtroData[empresa_uid].regiones = {}
            }
            
            for (var i in snapshot.val().regiones) {
                if (snapshot.val().regiones.hasOwnProperty(i)) {
                    var element = snapshot.val().regiones[i];
                    $scope.filtroData[empresa_uid].regiones[i] = {}
                    $scope.filtroData[empresa_uid].regiones[i].nombre = element.nombre
                    $scope.filtroData[empresa_uid].regiones[i].distritos = {}
                    for (var j in element.distritos) {
                        var distrito = element.distritos[j]
                        $scope.filtroData[empresa_uid].regiones[i].distritos[j] = {}
                        $scope.filtroData[empresa_uid].regiones[i].distritos[j].nombre = distrito.nombre
                        $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales = {}
                        for (var k in snapshot.val().sucursales) {
                            var sucursal = snapshot.val().sucursales[k]
                            $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k] = {}
                            $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].nombre = sucursal.nombre
                            $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].agentes = {}
                                    
                        }
                    }
                }
            }
            $scope.empresaSeleccionada = empresa_uid
            $scope.$apply();
            $('select').material_select();
            setTimeout(function() {
                cargarResultados();
            }, 100);
        });
    }
    function cargarRegionData(empresa_uid, region_uid){
        console.log("Cargando regiones")
        firebase.database().ref("empresas").child(empresa_uid).once("value").then(function (snapshot) {
            if (!$scope.filtroData) {
                $scope.filtroData = {}    
            }
            if (!$scope.filtroData[empresa_uid]) {
                $scope.filtroData[empresa_uid] = {}
            }
            $scope.filtroData[empresa_uid].nombre = snapshot.val().nombre
            if (!$scope.filtroData[empresa_uid].regiones) {
                $scope.filtroData[empresa_uid].regiones = {}
            }    
            console.log($scope.filtroData)
            for (var i in snapshot.val().regiones) {
                if (i == region_uid) {
                    var element = snapshot.val().regiones[i];
                    if (!$scope.filtroData[empresa_uid].regiones[i]) {
                        $scope.filtroData[empresa_uid].regiones[i] = {}
                    }
                    $scope.filtroData[empresa_uid].regiones[i].nombre = element.nombre
                    $scope.filtroData[empresa_uid].regiones[i].distritos = {}
                    for (var j in element.distritos) {
                        var distrito = element.distritos[j]
                        $scope.filtroData[empresa_uid].regiones[i].distritos[j] = {}
                        $scope.filtroData[empresa_uid].regiones[i].distritos[j].nombre = distrito.nombre
                        $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales = {}
                        for (var k in snapshot.val().sucursales) {
                            var sucursal = snapshot.val().sucursales[k]
                            if (sucursal.distrito == j) {
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k] = {}
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].nombre = sucursal.nombre
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].agentes = {}
                            }
                            
                                    
                        }
                    }
                }
            }
            $scope.empresaSeleccionada = empresa_uid
            $scope.regionSeleccionada = region_uid
            $scope.$apply();
            $('select').material_select();
            setTimeout(function() {
                cargarResultados();
            }, 100);
        });
    }
    function cargarDistritoData(empresa_uid, region_uid, distrito_uid){
        firebase.database().ref("empresas").child(empresa_uid).once("value").then(function (snapshot) {
            if (!$scope.filtroData) {
                $scope.filtroData = {}    
            }
            $scope.filtroData[empresa_uid] = {nombre: snapshot.val().nombre}
            if (!$scope.filtroData[empresa_uid].regiones) {
                $scope.filtroData[empresa_uid].regiones = {}
            }              
            for (var i in snapshot.val().regiones) {
                if (i == region_uid) {
                    var element = snapshot.val().regiones[i];
                    if (!$scope.filtroData[empresa_uid].regiones[i]) {
                        $scope.filtroData[empresa_uid].regiones[i] = {}
                    }
                    $scope.filtroData[empresa_uid].regiones[i].nombre = element.nombre
                    $scope.filtroData[empresa_uid].regiones[i].distritos = {}
                    for (var j in element.distritos) {
                        if (j == distrito_uid) {
                            var distrito = element.distritos[j]
                            if (!$scope.filtroData[empresa_uid].regiones[i].distritos[j]) {
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j] = {}
                            }
                            
                            $scope.filtroData[empresa_uid].regiones[i].distritos[j].nombre = distrito.nombre
                            $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales = {}
                            for (var k in snapshot.val().sucursales) {
                                var sucursal = snapshot.val().sucursales[k]
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k] = {}
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].nombre = sucursal.nombre
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].agentes = {}
                                        
                            }
                        }
                        
                    }
                }
            }
            $scope.empresaSeleccionada = empresa_uid
            $scope.regionSeleccionada = region_uid
            $scope.distritoSeleccionado = distrito_uid
            $scope.$apply();
            $('select').material_select();
            setTimeout(function() {
                cargarResultados();
            }, 100);
        });
    }
    function cargarAgenciasData(empresa_uid, region_uid, distrito_uid, agencia_uid){
        firebase.database().ref("empresas").child(empresa_uid).once("value").then(function (snapshot) {
            if (!$scope.filtroData) {
                $scope.filtroData = {}    
            }
            $scope.filtroData[empresa_uid] = {nombre: snapshot.val().nombre}
            $scope.filtroData[empresa_uid].regiones = {}                    
            for (var i in snapshot.val().regiones) {
                if (i == region_uid) {
                    var element = snapshot.val().regiones[i];
                    console.log(element)
                    if (!$scope.filtroData[empresa_uid].regiones[i]) {
                        $scope.filtroData[empresa_uid].regiones[i] = {}
                    }
                    $scope.filtroData[empresa_uid].regiones[i].nombre = element.nombre
                    $scope.filtroData[empresa_uid].regiones[i].distritos = {}
                    for (var j in element.distritos) {
                        if (j == distrito_uid) {
                            var distrito = element.distritos[j]
                            if (!$scope.filtroData[empresa_uid].regiones[i].distritos[j]) {
                                $scope.filtroData[empresa_uid].regiones[i].distritos[j] = {}
                            }
                            $scope.filtroData[empresa_uid].regiones[i].distritos[j].nombre = distrito.nombre
                            $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales = {}
                            for (var k in snapshot.val().sucursales) {
                                if (k == agencia_uid) {
                                    var sucursal = snapshot.val().sucursales[k]
                                    if (!$scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k]) {
                                        $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k] = {}
                                    }
                                    $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].nombre = sucursal.nombre
                                    $scope.filtroData[empresa_uid].regiones[i].distritos[j].sucursales[k].agentes = {}
                                }    
                            }
                        }
                        
                    }
                }
            }
            $scope.empresaSeleccionada = empresa_uid
            $scope.regionSeleccionada = region_uid
            $scope.distritoSeleccionado = distrito_uid
            $scope.sucursalSeleccionada = agencia_uid
            $scope.$apply();
            $('select').material_select();
            setTimeout(function() {
                cargarResultados();
            }, 100);
        });
    }
    $scope.cargarAgentes = function (){
        console.log($scope.sucursalSeleccionada)
        if ($scope.sucursalSeleccionada) {
            firebase.database().ref("usuarios").orderByChild("sucursal").equalTo($scope.sucursalSeleccionada).once("value").then(function (snapshotAgentes) {
                console.log(snapshotAgentes.val())
                $scope.filtroData[$scope.empresaSeleccionada].regiones[$scope.regionSeleccionada].distritos[$scope.distritoSeleccionado].sucursales[$scope.sucursalSeleccionada].agentes = {}
                
                snapshotAgentes.forEach(function(agente) {
                    $scope.filtroData[$scope.empresaSeleccionada].regiones[$scope.regionSeleccionada].distritos[$scope.distritoSeleccionado].sucursales[$scope.sucursalSeleccionada].agentes[agente.key] = agente.val()
                });
                console.log($scope.filtroData)
                $scope.$apply();
                $('select').material_select();
                setTimeout(function() {
                    cargarResultados();
                }, 100);
            })
        }
    }
    $scope.actualizarSelect = function(){
        setTimeout(function() {
            $('select').material_select();
            cargarResultados();
        }, 50);

    }

    $scope.refAnterior;
    var cargarResultados = debounce( function () {

        $scope.mostrarResultados = false;
        if (!$scope.sucursalSeleccionada && !$scope.agenteSeleccionado && !$scope.distritoSeleccionado && !$scope.regionSeleccionada && !$scope.empresaSeleccionada && !$scope.mostrarTodo) {
            $scope.resultados = null;
            destroyWaiting();
            $scope.$apply();
            return;
        }

        var inicioVigenciaT = + pickerInicioVigencia.getDate().setHours(0,0,0,0);
        var finalVigenciaT = + pickerFinalVigencia.getDate().setHours(24,0,0,0);
        inicioVigenciaTimeStamp = inicioVigenciaT
        finalVigenciaTimeStamp = finalVigenciaT

        waiting();

        var refTemporal;

        if (!inicioVigenciaT || !finalVigenciaT || finalVigenciaT < inicioVigenciaT) {
            Materialize.toast("Es necesario seleccionar una fecha con el formato adecuado", 8000);
            $scope.resultados = null;
            destroyWaiting();
            $scope.$apply();
            return
        }
        if ($scope.agenteSeleccionado) {
            console.log("RESULTADOS PARA AGENTE")
            refTemporal = firebase.database().ref("resultados").child(actualID).orderByChild("usuario_t").startAt($scope.agenteSeleccionado + "_" + inicioVigenciaTimeStamp).endAt($scope.agenteSeleccionado + "_" + finalVigenciaTimeStamp);
        } else {
            if ($scope.sucursalSeleccionada) {
                console.log("RESULTADOS PARA SUCURSAL")
                refTemporal = firebase.database().ref("resultados").child(actualID).orderByChild("sucursal_t").startAt($scope.sucursalSeleccionada + "_" + inicioVigenciaTimeStamp).endAt($scope.sucursalSeleccionada + "_" + finalVigenciaTimeStamp);
            } else {
                if ($scope.distritoSeleccionado) {
                    console.log("RESULTADOS PARA DISTRITO")
                    refTemporal = firebase.database().ref("resultados").child(actualID).orderByChild("distrito_t").startAt($scope.distritoSeleccionado + "_" + inicioVigenciaTimeStamp).endAt($scope.distritoSeleccionado + "_" + finalVigenciaTimeStamp);
                } else {
                    if ($scope.regionSeleccionada) {
                        console.log("RESULTADOS PARA REGIÓN")
                        refTemporal = firebase.database().ref("resultados").child(actualID).orderByChild("region_t").startAt($scope.regionSeleccionada + "_" + inicioVigenciaTimeStamp).endAt($scope.regionSeleccionada + "_" + finalVigenciaTimeStamp);
                    } else {
                        if ($scope.empresaSeleccionada) {
                            console.log("RESULTADOS PARA EMPRESA")
                            refTemporal = firebase.database().ref("resultados").child(actualID).orderByChild("empresa_uid_t").startAt($scope.empresaSeleccionada + "_" + inicioVigenciaTimeStamp).endAt($scope.empresaSeleccionada + "_" + finalVigenciaTimeStamp);
                        } else {
                            console.log("RESULTADOS GENERALES")
                            refTemporal = firebase.database().ref("resultados").child(actualID).orderByChild("fecha").startAt(inicioVigenciaTimeStamp).endAt(finalVigenciaTimeStamp);
                        }
                    }
                }
            }
        }
        if ($scope.mostrarTodo) {
            console.log("RESULTADOS GENERALES")
            refTemporal = firebase.database().ref("resultados").child(actualID).orderByChild("fecha").startAt(inicioVigenciaTimeStamp).endAt(finalVigenciaTimeStamp);
        }
        if ($scope.refAnterior) {
            $scope.refAnterior.off();
        }
        $scope.refAnterior = refTemporal;
        refTemporal.on("value", function (snapshot) {

            var resultados = snapshot;
            
            if (!snapshot.val()) {
                console.log("No hay resultados")
                $scope.resultados = null;
                destroyWaiting();
                $scope.$apply();
                return;
            }

            $scope.resultadosData = {}
            $scope.resultadosData.colors = {}
            $scope.resultadosData.series = {}
            $scope.resultadosData.labels = {}
            $scope.resultadosData.contador = {}
            $scope.resultadosData.data = {}
            $scope.comentarios = []
            $scope.comentariosNulos = []
            
            $scope.resultados = snapshot;
            $scope.mostrarResultados = true
            $scope.total = {}
            $scope.totalPonderacion = {}
            $scope.resultadosData.nombresContadores = {}
            $scope.resultadosData.labelsMultiples = {}
            for (var preguntaKey in $scope.encuesta.preguntas) {
                if ($scope.encuesta.preguntas.hasOwnProperty(preguntaKey)) {
                    var contador = [];
                    var preguntaData = $scope.encuesta.preguntas[preguntaKey];
                    var pregunta = preguntaKey;
                    var labelsRespuestas = [];
                    var keysRespuestas = [];
                    var nombresContadores = {}
                    var labelsMultiples = ['Tot Des', 'Desacuerdo', 'Regular', 'Acuerdo', 'Tot Acu']
                    switch (preguntaData.tipo) {
                        case "multiple_acuerdo":
                            var contador = {};
                            for (var key in preguntaData.respuestas) {
                                if (preguntaData.respuestas.hasOwnProperty(key)) {
                                    var respuesta = preguntaData.respuestas[key];
                                    labelsRespuestas.push(respuesta.texto);
                                    nombresContadores[key] = respuesta.texto
                                    console.log(nombresContadores)
                                    keysRespuestas.push(key);
                                    contador[key] = [0,0,0,0,0]
                                }
                            }
                            var c = 0;
                            for (var i in keysRespuestas) {
                                if (keysRespuestas.hasOwnProperty(i)) {
                                    resultados.forEach(function(resultado) {
                                        var respuesta = resultado.val()[pregunta]
                                        for (var k in respuesta) {
                                            if (respuesta.hasOwnProperty(k)) {
                                                var r = respuesta[k];
                                                console.log(r)
                                                console.log(keysRespuestas[i])
                                                contador[keysRespuestas[i]][parseInt(r)-1] += 1
                                            }
                                        }
                                    });
                                } 
                            }
                            console.log(contador)
                            break;
                        case "multiple":
                            for (var key in preguntaData.respuestas) {
                                if (preguntaData.respuestas.hasOwnProperty(key)) {
                                    var respuesta = preguntaData.respuestas[key];
                                    labelsRespuestas.push(respuesta.texto);
                                    keysRespuestas.push(key);
                                    contador.push(0);
                                }
                            }
                            var c = 0;
                            for (var i in keysRespuestas) {
                                if (keysRespuestas.hasOwnProperty(i)) {
                                    resultados.forEach(function(resultado) {
                                        var respuesta = resultado.val()[pregunta]
                                        for (var k in respuesta) {
                                            if (respuesta.hasOwnProperty(k)) {
                                                var r = respuesta[k];
                                                console.log(r, k, keysRespuestas[i])
                                                if (r) {
                                                    if (k.replace("-","") == keysRespuestas[i].replace("-","")) {
                                                        contador[i] += 1;
                                                    }
                                                }
                                                
                                            }
                                        }
                                    });
                                } 
                            }
                            console.log(contador)
                            break;
                        case "unica":
                            for (var key in preguntaData.respuestas) {
                                if (preguntaData.respuestas.hasOwnProperty(key)) {
                                    var respuesta = preguntaData.respuestas[key];
                                    labelsRespuestas.push(respuesta.texto);
                                    keysRespuestas.push(key);
                                    contador.push(0);
                                    
                                }
                            }
                            console.log(labelsRespuestas)
                            var c = 0;
                            for (var i in keysRespuestas) {
                                if (keysRespuestas.hasOwnProperty(i)) {
                                    resultados.forEach(function(resultado) {
                                        var respuesta = resultado.val()[pregunta]
                                        if (respuesta == keysRespuestas[i]) {
                                            contador[i] += 1;
                                        }
                                    });
                                } 
                            }
                            console.log(contador)
                            break;
                        case "texto":

                            $scope.comentarios[preguntaKey] = []
                            $scope.comentariosNulos[preguntaKey] = 0
                            resultados.forEach( function(resultado) {
                                var respuesta = resultado.val()[pregunta]
                                if (respuesta == "") {
                                    respuesta = "sin respuesta";
                                    $scope.comentariosNulos[preguntaKey]++;
                                }
                                var usuario = resultado.val().usuario || "no usuario"
                                if (respuesta) {
                                    $scope.comentarios[preguntaKey].push({
                                        comentario: respuesta,
                                        usuario: usuario
                                    })
                                }
                            })
                            break;
                        case "smile":
                            labelsRespuestas = ["ninguna", "mediana", "gran"];
                            contador = [0,0,0]
                            $scope.comentarios[preguntaKey] = []
                            $scope.comentariosNulos[preguntaKey] = 0
                            resultados.forEach(function(resultado) {
                                var respuesta = resultado.val()[pregunta]
                                if (respuesta == "gran") {
                                    contador[2] += 1;
                                }
                                if (respuesta == "mediana") {
                                    contador[1] += 1;
                                }
                                if (respuesta == "ninguna") {
                                    contador[0] += 1;
                                }
                                if (preguntaData.comentario) {
                                    if (preguntaData.comentario[preguntaKey]) {
                                        var usuario = resultado.val().usuario || "no usuario"
                                        if (resultado.val().comentarios) {
                                            var comentario = resultado.val().comentarios[pregunta]
                                            if (comentario == "") {
                                                comentario = "sin respuesta"
                                                $scope.comentariosNulos[preguntaKey]++;
                                            }
                                            if (comentario) {
                                                $scope.comentarios[preguntaKey].push({
                                                    comentario: comentario,
                                                    usuario: usuario
                                                })
                                            }
                                        }
                                        
                                    }
                                }
                            });
                            
                            console.log(contador)
                            break;
                        case "escala":
                            labelsRespuestas = ["0 (Mín)", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10 (Máx)"];
                            contador = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                            //          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                            resultados.forEach(function(resultado) {
                                var respuesta = resultado.val()[pregunta]
                                if (respuesta) contador[parseInt(respuesta)] += 1;
                            });
                            break;
                        case "nps":
                            labelsRespuestas = ["Valor"];
                            contador = [0, 0]
                            //          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                            resultados.forEach(function(resultado) {
                                var respuesta = resultado.val()[pregunta]
                                if (!isNaN(respuesta)) {
                                    respuesta = parseInt(respuesta)
                                    if (respuesta == 0 && respuesta <= 6) contador[0] += 1;
                                    if (respuesta == 9 || respuesta == 10) contador[0] += 1;
                                }
                            });
                            contador[0] = [contador[1] - contador[0]]
                            break;
                    }
                    
                    $scope.resultadosData.contador[preguntaKey] = contador
                    if (preguntaData.tipo != "multiple_acuerdo") {
                        $scope.total[preguntaKey] = contador.reduce(function(a, b) { return a + b; }, 0);
                    } else {
                        $scope.total[preguntaKey] = {}
                        for (var key in contador) {
                            
                            if (contador.hasOwnProperty(key)) {
                                var ele = contador[key];
                                $scope.total[preguntaKey][key] = contador[key].reduce(function(a, b) { return a + b; }, 0);
                            }
                        }
                    }
                    $scope.totalPonderacion[preguntaKey] = 0;
                    $scope.resultadosData.data[preguntaKey] = []
                    for (var j in contador) {
                        var granP = preguntaData.granP || 1;
                        var medianaP = preguntaData.medianaP || 1;
                        var ningunaP = preguntaData.ningunaP || 1;
                        var porcentaje = 0;
                        if (contador[j] != 0) {
                            porcentaje = Math.round( contador[j]/$scope.total[preguntaKey] * 100, 2)
                        } else {
                            porcentaje = 0;
                        }
                        var ponderacion = contador[j];
                        
                        switch (labelsRespuestas[j]) {
                            case "ninguna":
                                ponderacion = ponderacion * ningunaP
                                break;
                            case "mediana":
                                ponderacion = ponderacion * medianaP
                            case "gran":
                                ponderacion = ponderacion * granP
                            default:
                                break;
                        }
                        $scope.resultadosData.data[preguntaKey].push({
                            contador: contador[j],
                            porcentaje: porcentaje,
                            label: labelsRespuestas[j],
                            ponderacion: ponderacion
                        });
                        $scope.totalPonderacion[preguntaKey] += ponderacion
                }
                $scope.resultadosData.colors[preguntaKey] = shuffle(dataColorSet).slice(0,labelsRespuestas.length);
                $scope.resultadosData.series[preguntaKey] = $scope.encuesta.preguntas[preguntaKey].texto
                $scope.resultadosData.labels[preguntaKey] = labelsRespuestas
                $scope.resultadosData.nombresContadores[preguntaKey] = nombresContadores
                $scope.resultadosData.labelsMultiples[preguntaKey] = labelsMultiples
            }
            
            }
            
            console.log($scope.resultadosData)
            destroyWaiting();
            $scope.$apply();
            setTimeout(function() {
                $('ul.tabs').tabs();    
            }, 100);
            $(".color").colorPicker(colorOptions);
            $('select').material_select();
            
        }, function (error) {
            if (error) {
                Materialize.toast(error, 8000)
            }
        });

        
    }, 150) // CARGAR RESULTADOS
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    } // DEBOUNCE
    $( document ).ready(function() {
        $('#bfilter-slide').sideNav({
            menuWidth: 320, // Default is 300
            edge: 'right', 
            closeOnClick: true, 
            draggable: true
          });
        $('.dropdown-button').dropdown({
            inDuration: 300,
            outDuration: 225,
            constrainWidth: false, // Does not change width of dropdown to that of the activator
            hover: true, // Activate on hover
            gutter: 0, // Spacing from edge
            belowOrigin: false, // Displays dropdown below the button
            alignment: 'left', // Displays dropdown with edge aligned to the left of button
            stopPropagation: false // Stops event propagation
          }
        );
        $('ul.tabs').tabs();
        $('.modal').modal({
            dismissible: false, // Modal can be dismissed by clicking outside of the modal
            opacity: .8, // Opacity of modal background
            inDuration: 300, // Transition in duration
            outDuration: 200, // Transition out duration
            startingTop: '10%', // Starting top style attribute
            endingTop: '10%', // Ending top s
            complete: function() { 
            }
        });
        
        var hoy = new Date()
        var i18n = {
            previousMonth : 'mes anterior',
            nextMonth     : 'siguiente mes',
            months        : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
            weekdays      : ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'],
            weekdaysShort : ['Dom','Lun','Mar','Mie','Jue','Vie','Sab']
        }
        pickerInicioVigencia = new Pikaday({ 
            field: $('#inicioVigencia')[0],
            format: 'D/M/YYYY',
            onSelect: function() {
                inicioVigenciaTimeStamp = + pickerInicioVigencia.getDate().setHours(0,0,0,0);
                cargarResultados();
            },
            i18n: i18n,
            maxDate: hoy,
            firstDay: 1,
            keyboardInput: false
        });
        pickerFinalVigencia = new Pikaday({ 
            field: $('#finalVigencia')[0],
            format: 'D/M/YYYY',
            onSelect: function() {
                finalVigenciaTimeStamp =  + pickerFinalVigencia.getDate().setHours(24,0,0,0) 
                cargarResultados();
            },
            i18n: i18n,
            maxDate: hoy,
            firstDay: 1,
            keyboardInput: false
        });
        var ayer = new Date()
        ayer.setDate(ayer.getDate()-1);

        pickerInicioVigencia.setDate(ayer, false)
        pickerFinalVigencia.setDate(hoy, false)
        
    });
}]) // APP CONTROLLER


var inicioVigenciaTimeStamp,
    finalVigenciaTimeStamp;


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}
function descargarCanvas(i){
    var chart = i.parentNode.getElementsByTagName("canvas")[0]
    console.log(chart)
    var url=chart.toDataURL();
    var link = document.createElement("a");
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
