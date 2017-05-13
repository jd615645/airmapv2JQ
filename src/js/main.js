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
  var marker = {'lass': [], 'lass4u': [], 'lassmaps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []}
  var airData = {'lass': [], 'lass4u': [], 'lassmaps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []}
  var emissionData = []
  var emissionMarker = []
  var filterType = 'pm25'
  var timeType = 'now'
  var groupView = {'lass': true, 'lass4u': true, 'lassmaps': true, 'probecube': true, 'indie': true, 'airbox': true, 'epa': true}
  var windLayer = false
  var emissionSite = false
  var dateProgress = 0

  // init
  var map = L.map('map', {
    center: [23.854271, 120.951906],
    zoom: 8,
    zoomControl: false
  })
  var hideWindLayer = false
  L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  let sidebar = L.control.sidebar('sidebar').addTo(map)
  $('#resourceLayer input').bootstrapSwitch()
  sidebar.open('filter')

  // chartjsInit
  let ctx = document.getElementById('myChart').getContext('2d')
  let myLineChart = new Chart(ctx).Line({
    labels: ['13:45', '14:45', '15:45', '16:45', '17:45', '18:45', '19:45', '20:45', '21:45', '22:45'],
    datasets: [
      {
        fillColor: 'rgba(220, 220, 220, 0.5)',
        strokeColor: 'rgba(220, 220, 220, 1)',
        pointColor: 'rgba(220, 220, 220, 1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(220,220,220,1)',
        data: [20, 34, 20, 18, 66, 31, 58, 17, 18, 21]
      }
    ]
  }, {
    scaleShowGridLines: true,
    scaleGridLineColor: 'rgba(0,0,0,.05)',
    scaleGridLineWidth: 1,
    scaleShowHorizontalLines: true,
    scaleShowVerticalLines: true,
    bezierCurve: false,
    bezierCurveTension: 0.4,
    pointDot: true,
    pointDotRadius: 4,
    pointDotStrokeWidth: 1,
    pointHitDetectionRadius: 20,
    datasetStroke: true,
    datasetStrokeWidth: 2,
    datasetFill: true
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
          $.each(iv[0], (jk, jv) => {
            let siteName = jv['SiteName']
            let lat = jv['LatLng']['lat']
            let lng = jv['LatLng']['lng']
            let pm25 = jv['Data']['pm25']
            let humi = jv['Data']['humi']
            let temp = jv['Data']['temp']

            if (_.isNumber(pm25)) {
              let circleMarker = L.circleMarker(new L.LatLng(lat, lng), {
                color: markerColor(pm25),
                opacity: 1,
                fillOpacity: 0.5
              }).bindPopup(infoPopup(jv))
              marker[sites[ik]].push(circleMarker)
              airData[sites[ik]].push(jv)
            }
          })
          $.each(marker[sites[ik]], (jk, jv) => {
            jv.addTo(map)
          })
        })

        $.each(sites, (key, site) => {
          $('#filterGroup button[value="' + site + '"] .count').html(airData[site].length)
        })
      })
  }

  function getEmiss () {
    let emissionsIcon = L.icon({
      iconUrl: '../img/emissions.png',

      iconSize: [20, 20]
    })
    $.getJSON('../data/emission.json', (data) => {
      $.each(data, (key, val) => {
        let lat = val['latitude'],
          lon = val['longitude'],
          name = val['name']

        let data = L.marker(new L.LatLng(lat, lon), {
          icon: emissionsIcon,
          opacity: 0
        }).bindPopup('<p>' + name + '</p>')
        emissionMarker.push(data)
        emissionData.push(val)
      })
      $.each(emissionMarker, (key, val) => {
        val.addTo(map)
      })
    })
  }

  function toggleFilter (type) {
    filterType = type
    $.each(marker, (ik, iv) => {
      $.each(marker[ik], (jk, jv) => {
        let markerData = airData[ik][jk]['Data']
        let pm25
        if (timeType == 'now') {
          pm25 = markerData['pm25']
        } else {
          pm25 = airData[ik][jk]['prediction']
        }

        let temp = markerData['temp']
        let humi = markerData['humi']
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
    groupView[site] = !(groupView[site])

    $.each(marker[site], (key, val) => {
      // show
      if (groupView[site]) {
        // val.setStyle({ zIndexOffset: 4 })
        val.setStyle({ opacity: 1, fillOpacity: 0.5 })
      }
      // hide
      else {
        // val.setStyle({ zIndexOffset: -1 })
        val.setStyle({ opacity: 0, fillOpacity: 0 })
      }
    })
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
    $.each(emissionMarker, (key, val) => {
      // show
      if (emissionSite) {
        val.setOpacity(1)
      }
      // hide
      else {
        val.setOpacity(0)
      }
    })
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
    let pm25Prediction = data['prediction']
    let date = moment(data['time']).format('YYYY/MM/DD HH:mm')
    let time = moment(data['time']).format('HH:mm')
    let historyData = data['history']
    historyData.reverse()
    historyData.push(pm25)

    // chartjsDraw()
    return (
      '<p>Device ID: ' + uniqueKey + '</p><p>Time: ' + date + '</p><p>pm2.5: ' + pm25 + 'μg/m<sup>3</sup></p><p>pm2.5 Prediction: ' + pm25Prediction + '</p>'
    )
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
        if (hideWindLayer) {
          clearWind()
          redraw()
        }
      })
      map.on('zoomstart', function () {
        if (hideWindLayer) {
          clearWind()
          redraw()
        }
      })
      map.on('resize', function () {
        if (hideWindLayer) {
          clearWind()
          redraw()
        }
      })

      $('#windLayerSw')
        .bootstrapSwitch()
        .on('switchChange.bootstrapSwitch', (event, state) => {
          hideWindLayer = !hideWindLayer
          if (hideWindLayer) {
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

        timer = setTimeout(function () { // showing wind is delayed
          var bounds = map.getBounds()
          var size = map.getSize()

          windy.start([[0, 0], [size.x, size.y]], size.x, size.y,
            [[bounds._southWest.lng, bounds._southWest.lat ], [bounds._northEast.lng, bounds._northEast.lat]])
        }, 750)
      }

      // clear canvas and stop animation
      function clearWind () {
        windy.stop()
        context.clearRect(0, 0, 3000, 3000)
      }
    })
  }
})
