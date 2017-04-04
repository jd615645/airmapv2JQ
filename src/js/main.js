var vm = new Vue({
  el: '#app',
  data() {
    return{
      groupType: ['lass', 'lass4u', 'maps', 'probecube', 'indie', 'airbox', 'epa'],
      marker: {'lass': [], 'lass4u': [], 'maps': [], 'probecube': [], 'indie': [], 'airbox': [], 'epa': []},
      filterType: 1,
      groupView: {'lass': true, 'lass4u': true, 'maps': true, 'probecube': true, 'indie': true, 'airbox': true, 'epa': true},
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
                  log = jv['gps_lon']

              let circleMarker = L.circleMarker([lat, log], {
                color: '#000',
                opacity: 1,
                fillOpacity: 0.5
              })
              this.marker[this.groupType[ik]].push(circleMarker)
            })

          })
        })
    },
    showSite(site) {
      $.each(marker[site], function(key, val) {
        val.setStyle({opacity: 1, fillOpacity: 0.5});
      });
    },
    hideSite(site) {
      $.each(marker[site], (key, val) => {
        val.setStyle({opacity: 0, fillOpacity: 0});
      })
    },
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