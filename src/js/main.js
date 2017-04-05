var vm = new Vue({
  el: '#app',
  data() {
    return{
      groupType: ['lass', 'lass4u', 'maps', 'probecube', 'indie', 'airbox', 'epa'],
      marker: {'lass': [], 'lass4u': [], 'maps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []},
      airData: {'lass': [], 'lass4u': [], 'maps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []},
      filterType: 'pm25',
      groupView: {'lass': true, 'lass4u': true, 'maps': true, 'probecube': true, 'indie': true, 'airbox': true, 'epa': true},
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
      humiGapColor: ['#fac090', '#76b531', '#b7dee8', '#215968'],
    }
  },
  mounted(){
    $('#resourceLayer input').bootstrapSwitch({
      state: false
    })
    this.getData()
  },
  computed: {
  },
  methods: {
    getData() {
      let dataSrc = []

      $.each(this.groupType, (key, val) => {
        dataSrc.push($.getJSON('../data/last-all-' + val + '.json'))
      })
      $.when
        .apply($, dataSrc)
        .then((...inputData) => {
          $.each(inputData, (ik, iv) => {
            $.each(iv[0]['feeds'], (jk, jv) => {
              let lat = jv['gps_lat'],
                  log = jv['gps_lon'],
                  pm25 = jv['s_d0']

              if (_.isNumber(pm25)) {
                let circleMarker = L.circleMarker(new L.LatLng(lat, log), {
                  color: this.markerColor(pm25),
                  opacity: 1,
                  fillOpacity: 0.5
                })
                this.marker[this.groupType[ik]].push(circleMarker)
                this.airData[this.groupType[ik]].push(jv)
              }
            })
            $.each(this.marker[this.groupType[ik]], (jk, jv) => {
              jv.addTo(map)
            })
          })
        })
    },
    toggleFilter(type) {
      this.filterType=type
      $.each(this.groupType, (ik, group) => {
        // console.log(this.airData[group])
        $.each(this.marker[group], (jk, jv) => {
          let pm25 = this.airData[group][jk]['s_d0']
          jv.setStyle({color: this.markerColor(pm25)})
        })
      })
    },
    toggleGroup(site) {
      this.groupView[site] = !(this.groupView[site])
      
      $.each(this.marker[site], (key, val) => {
        // show
        if (this.groupView[site]) {
          val.setStyle({opacity: 1, fillOpacity: 0.5});
        }
        // hide
        else {
          val.setStyle({opacity: 0, fillOpacity: 0});
        }
      })
    },
    markerColor(pm25) {
      let color = ''
      switch(this.filterType) {
        case 'pm25':
          $.each(this.pm25Gap, (key, val) => {
            if(pm25 >= val) {
              color = this.pm25GapColor[key]
            }
          })
          break
        case 'pm25NASA':
          $.each(this.pm25_NASAGap, (key, val) => {
            if(pm25 >= val) {
              color = this.pm25NASAGapColor[key]
            }
          })
          break
        case 'aqi':
          $.each(this.aqiGap, (key, val) => {
            if(pm25 >= val) {
              color = this.aqiGapColor[key]
            }
          })
          break
        case 'temp':
          $.each(this.tempGap, (key, val) => {
            if(pm25 >= val) {
              color = this.tempGapColor[key]
            }
          })
          break
        case 'humi':
          $.each(this.humiGap, (key, val) => {
            if(pm25 >= val)
              color = this.humiGapColor[key]
          })
          break
      }
      return color
    }

  }
})

let map = L.map('map', {
  center: [23.854271, 120.951906],
  zoom: 8,
  zoomControl: false,
})
L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

let sidebar = L.control.sidebar('sidebar').addTo(map)
sidebar.open('filter')