var g = new JustGage({
  id: 'gauge',
  value: 40,
  min: 0,
  max: 100,
  title: 'PM2.5',
  customSectors: {
    percents: true,
    ranges: [{
      color : "#43bf58",
      lo : 0,
      hi : 50
    },{
      color : "#ff3b30",
      lo : 51,
      hi : 100
    }]
  }
})
