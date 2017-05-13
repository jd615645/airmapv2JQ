var vm = new Vue({
  el: '#app',
  data() {
    return {
      marker: {'lass': [], 'lass4u': [], 'lassmaps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []},
      airData: {'lass': [], 'lass4u': [], 'lassmaps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []},
      emissionData: [],
      emissionMarker: [],
      filterType: 'pm25',
      timeType: 'now',
      groupView: {'lass': true, 'lass4u': true, 'lassmaps': true, 'probecube': true, 'indie': true, 'airbox': true, 'epa': true},
      windLayer: false,
      emissionSite: false,
      dateProgress: 0,
      // filter color
      pm25Gap: [0, 11, 23, 35, 41, 47, 53, 58, 64, 70],
      pm25GapColor: ['#c9e7a7', '#00ff00', '#0c0', '#ff0', '#f3c647', '#e46c0a', '#d99694', '#ff0000', '#800000', '#7030a0'],
      pm25NASAGap: [0, 3, 5, 8, 10, 13, 15, 18, 20, 35, 50, 65],
      pm25NASAGapColor: ['#0000cc', '#03c', '#06f', '#09f', '#3cf', '#6f9', '#9f6', '#cf3', '#ff0', '#ff9833', '#ff3300', '#f30', '#c00', '#800000'],
      aqiGap: [0, 15, 35, 54, 150, 250, 300],
      aqiGapColor: ['#00ff00', '#ffff00', '#ff7e00', '#ff0000', '#800080', '#7e0023'],
      tempGap: [0, 5, 10, 15, 20, 25, 30, 35, 40],
      tempGapColor: ['#215968', '#b7dee8', '#77933c', '#d7e4bd', '#fac090', '#e46c0a', '#ff0000', '#800000'],
      humiGap: [20, 40, 60, 80],
      humiGapColor: ['#fac090', '#76b531', '#b7dee8', '#215968']
    }
  },
  mounted() {
    $('#resourceLayer input').bootstrapSwitch()
    this.getData()
    let emissionsIcon = L.icon({
      iconUrl: './img/emissions.png',

      iconSize: [20, 20]
    })
    $.getJSON('./data/emission.json', (data) => {
      $.each(data, (key, val) => {
        let lat = val['latitude'],
          lon = val['longitude'],
          name = val['name']

        let data = L.marker(new L.LatLng(lat, lon), {
          icon: emissionsIcon,
          opacity: 0
        }).bindPopup('<p>' + name + '</p>')
        this.emissionMarker.push(data)
        this.emissionData.push(val)
      })
      $.each(this.emissionMarker, (key, val) => {
        val.addTo(map)
      })
    })

    this.chartjsDraw()
  },
  computed: {
    timeCalc() {
      let hour = this.dateProgress
      if (hour < 0) {
        return abs(parseInt(hour)) + '小時前'
      }
      else if (hour === 0) {
        return '現在'
      }
      else if (hour > 0) {
        return hour + '小時後'
      }
    }
  },
  methods: {
    getData() {
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
                  color: this.markerColor(pm25),
                  opacity: 1,
                  fillOpacity: 0.5
                }).bindPopup(this.infoPopup(jv))
                this.marker[sites[ik]].push(circleMarker)
                this.airData[sites[ik]].push(jv)
              }
            })
            $.each(this.marker[sites[ik]], (jk, jv) => {
              jv.addTo(map)
            })
          })
        })
    },
    toggleFilter(type) {
      this.filterType = type

      $.each(this.marker, (ik, iv) => {
        $.each(this.marker[ik], (jk, jv) => {
          let markerData = this.airData[ik][jk]['Data']
          let pm25
          if (this.timeType == 'now') {
            pm25 = markerData['pm25']
          }else {
            pm25 = this.airData[ik][jk]['prediction']
          }

          let temp = markerData['temp']
          let humi = markerData['humi']
          switch (type) {
            case 'pm25':
            case 'pm25NASA':
            case 'aqi':
              jv.setStyle({color: this.markerColor(pm25)})
              break
            case 'temp':
              jv.setStyle({color: this.markerColor(temp)})
              break
            case 'humi':
              jv.setStyle({color: this.markerColor(humi)})
              break
          }
        })
      })
    },
    toggleGroup(site) {
      this.groupView[site] = !(this.groupView[site])

      $.each(this.marker[site], (key, val) => {
        // show
        if (this.groupView[site]) {
          // val.setStyle({ zIndexOffset: 4 })
          val.setStyle({ opacity: 1, fillOpacity: 0.5 })
        }
        // hide
        else {
          // val.setStyle({ zIndexOffset: -1 })
          val.setStyle({ opacity: 0, fillOpacity: 0 })
        }
      })
    },
    toggleTime(time) {
      switch (time) {
        case 'now':
          this.timeType = 'now'
          break
        case 'prediction':
          this.timeType = 'prediction'
          break
      }
      $('#filterType > div > div:nth-child(1) > button').click()
    },
    emissionSiteToggle() {
      $.each(this.emissionMarker, (key, val) => {
        // show
        if (this.emissionSite) {
          val.setOpacity(1)
        }
        // hide
        else {
          val.setOpacity(0)
        }
      })
    },
    markerColor(num) {
      let color = '#eee'
      switch (this.filterType) {
        case 'pm25':
          $.each(this.pm25Gap, (key, val) => {
            if (num >= val) {
              color = this.pm25GapColor[key]
            }
          })
          break
        case 'pm25NASA':
          $.each(this.pm25NASAGap, (key, val) => {
            if (num >= val) {
              color = this.pm25NASAGapColor[key]
            }
          })
          break
        case 'aqi':
          $.each(this.aqiGap, (key, val) => {
            if (num >= val) {
              color = this.aqiGapColor[key]
            }
          })
          break
        case 'temp':
          $.each(this.tempGap, (key, val) => {
            if (num >= val) {
              color = this.tempGapColor[key]
            }
          })
          break
        case 'humi':
          $.each(this.humiGap, (key, val) => {
            if (num >= val) {
              color = this.humiGapColor[key]
            }
          })
          break
      }
      return color
    },
    infoPopup(data) {
      // console.log(data)
      let pm25
      if (this.timeType == 'now') {
        pm25 = data['Data']['pm25']
      } else {
        pm25 = data['prediction']
      }
      return (
        '<p>' + data['uniqueKey'] + '</p><p>pm25: ' + pm25 + 'μg/m<sup>3</sup></p>'
      )
    },
    chartjsDraw() {
      let timeData = []
      for (let i = 9; i >= 0; i--) {
        let time = moment().subtract(i, 'hours').format('HH:mm')
        timeData.push(time)
      }
      let data = {
        labels: timeData,
        datasets: [
          {
            fillColor: 'rgba(220,220,220,0.2)',
            strokeColor: 'rgba(220,220,220,1)',
            pointColor: 'rgba(220,220,220,1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(220,220,220,1)',
            data: [20, 34, 20, 18, 66, 31, 58, 17, 18, 21]
          }
        ]
      }
      let options = {
        // /Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines: true,
        // String - Colour of the grid lines
        scaleGridLineColor: 'rgba(0,0,0,.05)',
        // Number - Width of the grid lines
        scaleGridLineWidth: 1,
        // Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: true,
        // Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: true,
        // Boolean - Whether the line is curved between points
        bezierCurve: false,
        // Number - Tension of the bezier curve between points
        bezierCurveTension: 0.4,
        // Boolean - Whether to show a dot for each point
        pointDot: true,
        // Number - Radius of each point dot in pixels
        pointDotRadius: 4,
        // Number - Pixel width of point dot stroke
        pointDotStrokeWidth: 1,
        // Number - amount extra to add to the radius to cater for hit detection outside the drawn point
        pointHitDetectionRadius: 20,
        // Boolean - Whether to show a stroke for datasets
        datasetStroke: true,
        // Number - Pixel width of dataset stroke
        datasetStrokeWidth: 2,
        // Boolean - Whether to fill the dataset with a colour
        datasetFill: true
      }

      let ctx = document.getElementById('myChart').getContext('2d')
      let myLineChart = new Chart(ctx).Line(data, options)
    }
  }
})

let map = L.map('map', {
  center: [23.854271, 120.951906],
  zoom: 8,
  zoomControl: false
})
L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

let sidebar = L.control.sidebar('sidebar').addTo(map)
sidebar.open('filter')

$('#windLayerSw')
  .bootstrapSwitch()
  .on('switchChange.bootstrapSwitch', (event, state) => {
    vm.windLayer = state
  })
$('#emissionSiteSw')
  .bootstrapSwitch()
  .on('switchChange.bootstrapSwitch', (event, state) => {
    vm.emissionSite = state
    vm.emissionSiteToggle()
  })
