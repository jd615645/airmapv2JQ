$(document).ready(function () {
  // filter color
  var pm25Gap = [0, 11, 23, 35, 41, 47, 53, 58, 64, 70]
  var pm25GapColor = ['#c9e7a7', '#00ff00', '#0c0', '#ff0', '#f3c647', '#e46c0a', '#d99694', '#ff0000', '#800000', '#7030a0']
  var pm25NASAGap = [0, 3, 5, 8, 10, 13, 15, 18, 20, 35, 50, 65]
  var pm25NASAGapColor = ['#0000cc', '#03c', '#06f', '#09f', '#3cf', '#6f9', '#9f6', '#cf3', '#ff0', '#ff9833', '#ff3300', '#f30', '#c00', '#800000']
  var aqiGap = [0, 15, 35, 54, 150, 250, 300]
  var aqiGapColor = ['#00ff00', '#ffff00', '#ff7e00', '#ff0000', '#800080', '#7e0023']
  var tempGap = [0, 5, 10, 15, 20, 25, 30, 35, 40]
  var tempGapColor = ['#215968', '#b7dee8', '#77933c', '#d7e4bd', '#fac090', '#e46c0a', '#ff0000', '#800000']
  var humiGap = [20, 40, 60, 80]
  var humiGapColor = ['#fac090', '#76b531', '#b7dee8', '#215968']

  // data
  var allData = []
  var emissionData = []
  var filterType = 'pm25'
  var timeType = 'now'
  var windLayer = false

  var markerLayer = {'lass': [], 'lass4u': [], 'lassmaps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []}
  var emissionMarkerLayer = []

  // init
  var map = L.map('map', {
    center: [23.854271, 120.951906],
    zoom: 8,
    zoomControl: false
  })
  L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  var sidebar = L.control.sidebar('sidebar').addTo(map)
  $('#resourceLayer input').bootstrapSwitch()
  sidebar.open('filter')

  // chartjsInit
  var ctx = $('#myChart')
  var myLineChart = Chart.Line(ctx, {
    data: {
      labels: ['', '', '', '', '', '', '', '', '', ''],
      datasets: [
        {
          fillColor: 'rgba(220, 220, 220, 0.5)',
          strokeColor: 'rgba(220, 220, 220, 1)',
          pointColor: 'rgba(220, 220, 220, 1)',
          pointStrokeColor: '#fff',
          pointHighlightFill: '#fff',
          pointHighlightStroke: 'rgba(220,220,220,1)',
          data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        }
      ]
    },
    options: {
      fill: false,
      scaleShowLabels: false,
      legend: {
        display: false
      }
    }
  })

  var windy
  var context
  var timer = null

  getData()
  getEmiss()
  drawWindLayer()

  $('#emissionSiteSw')
    .bootstrapSwitch()
    .on('switchChange.bootstrapSwitch', (event, state) => {
      emissionSite = state
      emissionSiteToggle()
    })

  $('#filterType button').click(function () {
    let type = $(this).attr('value')
    let nowType = $('#filterType button.selected').attr('value')

    $('#filterType button[value="' + nowType + '"]').removeClass('selected')
    $(this).addClass('selected')

    $('.indicatorLevel[value="' + nowType + '"]').hide()
    $('.indicatorLevel[value="' + type + '"]').show()

    toggleFilter(type)
  })
  $('#filterGroup button').click(function () {
    let type = $(this).attr('value')
    if ($(this).attr('select') == 'true') {
      $(this).removeClass('selected')
      $(this).attr('select', 'false')
    }else {
      $(this).addClass('selected')
      $(this).attr('select', 'true')
    }
    toggleGroup(type)
  })
  $('#timeProgress button').click(function () {
    let time = $(this).attr('value')
    let nowType = $('#timeProgress button.selected').attr('value')
    $('#timeProgress button').removeClass('selected')
    $(this).addClass('selected')

    if (time !== nowType) {
      toggleTime(time)
    }
  })

  function getData () {
    let dataSrc = []
    // let sites = ['epa', 'lass', 'lass4u', 'lassmaps', 'airbox', 'probecube', 'indie']
    let sites = ['lass', 'lass4u', 'lassmaps', 'airbox']

    $.each(sites, (key, val) => {
      dataSrc.push($.getJSON('./data/now/' + val + '.json'))
    })
    $.when
      .apply($, dataSrc)
      .then((...inputData) => {
        $.each(inputData, (ik, iv) => {
          let marker = []
          $.each(iv[0], (jk, jv) => {
            let uniqueKey = jv['uniqueKey']
            let lat = jv['LatLng']['lat']
            let lng = jv['LatLng']['lng']
            let pm25 = jv['Data']['pm25']

            if (_.isNumber(pm25)) {
              let circleMarker = L.circleMarker(new L.LatLng(lat, lng), {
                color: markerColor(pm25),
                opacity: 1,
                fillOpacity: 0.5,
                airData: jv
              }).bindPopup(infoPopup(jv))

              marker.push(circleMarker)
            }
            if (!_.has(allData, [uniqueKey])) {
              _.setWith(allData, [uniqueKey], [], Object)
            }
            allData[uniqueKey].push(jv)
          })

          markerLayer[sites[ik]] = L.layerGroup(marker).addTo(map)
        })

        $.each(sites, (key, site) => {
          let siteNum = Object.keys(markerLayer[site]['_layers']).length
          $('#filterGroup button[value="' + site + '"] .count').html(siteNum)
        })
      })
  }

  function getEmiss () {
    let emissionsIcon = L.icon({
      iconUrl: '../img/emissions.png',

      iconSize: [20, 20]
    })
    $.getJSON('../data/emission.json', (data) => {
      let emissionMarker = []
      $.each(data, (key, val) => {
        let lat = val['latitude'],
          lon = val['longitude'],
          name = val['name']

        let data = L.marker(new L.LatLng(lat, lon), {
          icon: emissionsIcon
        }).bindPopup('<p>' + name + '</p>')
        emissionMarker.push(data)
        emissionData.push(val)
      })
      emissionMarkerLayer = L.layerGroup(emissionMarker)
    })
  }

  function toggleFilter (type) {
    filterType = type
    $.each(markerLayer, (ik, iv) => {
      $.each(markerLayer[ik]['_layers'], (jk, jv) => {
        let markerData = jv['options']['airData']
        // console.log(markerData)
        let pm25
        if (timeType == 'now') {
          pm25 = markerData['Data']['pm25']
        } else {
          pm25 = markerData['prediction']
        }

        let temp = markerData['Data']['temp']
        let humi = markerData['Data']['humi']
        switch (type) {
          case 'pm25':
          case 'pm25NASA':
          case 'aqi':
            jv.setStyle({ color: markerColor(pm25) })
            break
          case 'temp':
            jv.setStyle({ color: markerColor(temp) })
            break
          case 'humi':
            jv.setStyle({ color: markerColor(humi) })
            break
        }
      })
    })
  }

  function toggleGroup (site) {
    if (map.hasLayer(markerLayer[site])) {
      map.removeLayer(markerLayer[site])
    } else {
      map.addLayer(markerLayer[site])
    }
  }

  function toggleTime (time) {
    switch (time) {
      case 'now':
        timeType = 'now'
        break
      case 'prediction':
        timeType = 'prediction'
        break
    }
    $('#filterType > div > div:nth-child(1) > button').click()
  }

  function emissionSiteToggle () {
    if (map.hasLayer(emissionMarkerLayer)) {
      map.removeLayer(emissionMarkerLayer)
    } else {
      map.addLayer(emissionMarkerLayer)
    }
  }
  function markerColor (num) {
    let color = '#eee'
    switch (filterType) {
      case 'pm25':
        $.each(pm25Gap, (key, val) => {
          if (num >= val) {
            color = pm25GapColor[key]
          }
        })
        break
      case 'pm25NASA':
        $.each(pm25NASAGap, (key, val) => {
          if (num >= val) {
            color = pm25NASAGapColor[key]
          }
        })
        break
      case 'aqi':
        $.each(aqiGap, (key, val) => {
          if (num >= val) {
            color = aqiGapColor[key]
          }
        })
        break
      case 'temp':
        $.each(tempGap, (key, val) => {
          if (num >= val) {
            color = tempGapColor[key]
          }
        })
        break
      case 'humi':
        $.each(humiGap, (key, val) => {
          if (num >= val) {
            color = humiGapColor[key]
          }
        })
        break
    }
    return color
  }
  function infoPopup (data) {
    let uniqueKey = data['uniqueKey']
    let pm25 = data['Data']['pm25']
    let temp = data['Data']['temp']
    let humi = data['Data']['humi']
    let pm25Prediction = data['prediction']
    let date = moment(data['time']).format('YYYY-MM-DD HH:mm')

    // chartjsDraw()
    return (
      '<h4 class="popup-title">' + uniqueKey + '<small>24.305°N / 120.596°E</small></h4><p class="popup-pm25">PM2.5數值<span>' + pm25 + '</span> μg/m <sup> 3</sup></p><p class="popup-pm25Prediction">空氣品質預測<span>' + pm25Prediction + '</span>μg/m<sup>3</sup></p><p class="popup-temp">溫度<span>' + temp + '</span>°C</p> <p class="popup-humi">溼度<span>' + humi + '</span>%</p> <button class="btn btn-info" id="showChart" value="' + uniqueKey + '"><i class="fa fa-area-chart"></i>點擊觀看圖表</button> <p class="popup-time">最後更新時間: ' + date + '</p>'
    )
  }

  $(document).on('click', '#showChart', function () {
    let uniqueKey = $(this).attr('value')
    console.log(uniqueKey)
    drawChart(allData[uniqueKey][0])
  })

  function drawChart (data) {
    let historyTime = []
    let historyData = data['history']
    let date = moment(data['time']).format('YYYY/MM/DD HH:mm')
    historyData.reverse()
    historyData.push(data['Data']['pm25'])

    for (var i = 9; i >= 0; i--) {
      let time = moment(data['time']).subtract(i, 'hours').format('HH:mm')
      historyTime.push(time)
    }

    $('#myChart').show()

    myLineChart.data.datasets[0].data = historyData
    myLineChart.data.labels = historyTime

    myLineChart.update()
  }

  function updateChart (time, chartData) {
    let timeData = []
    for (let i = 9; i >= 0; i--) {
      let time = moment().subtract(i, 'hours').format('HH:mm')
      timeData.push(time)
    }
  }

  function drawWindLayer () {
    $.get('../data/gfs.json', { cache: true }).success(function (result) {
      // Add CanvasLayer to the map
      canvasOverlay = L.canvasOverlay()
        // .drawing(redraw())
        .addTo(map)

      // windy object
      windy = new Windy({canvas: canvasOverlay.canvas(), data: result})

      context = canvasOverlay.canvas().getContext('2d')

      map.on('dragstart', function () {
        if (windLayer) {
          clearWind()
          redraw()
        }
      })
      map.on('zoomstart', function () {
        if (windLayer) {
          clearWind()
          redraw()
        }
      })
      map.on('resize', function () {
        if (windLayer) {
          clearWind()
          redraw()
        }
      })

      $('#windLayerSw')
        .bootstrapSwitch()
        .on('switchChange.bootstrapSwitch', (event, state) => {
          windLayer = !windLayer
          if (windLayer) {
            redraw()
          }else {
            clearWind()
          }
        })

      // start drawing wind map
      function redraw (overlay, params) {
        if (timer) {
          window.clearTimeout(timer)
        }

        // showing wind is delayed
        timer = setTimeout(function () {
          var bounds = map.getBounds()
          var size = map.getSize()

          windy.start([[0, 0], [size.x, size.y]], size.x, size.y,
            [[bounds._southWest.lng, bounds._southWest.lat ], [bounds._northEast.lng, bounds._northEast.lat]])
        }, 500)
      }

      // clear canvas and stop animation
      function clearWind () {
        windy.stop()
        context.clearRect(0, 0, 3000, 3000)
      }
    })
  }
})
