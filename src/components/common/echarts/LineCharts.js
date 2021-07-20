import * as echarts from 'echarts';
const axios = require('axios');

export default class LineCharts {
  constructor(options) {
    this.options = options;
  }
  create() {
    const target = document.getElementById(this.options.container)
    const dom = document.createElement('div');
    dom.setAttribute('style', 'width: 360px;height: 180px;backgroud: rgba(255, 255, 255, .618);');
    target.appendChild(dom);
    const chart = echarts.init(dom);
    chart.showLoading();
    axios.get('assets/fakeapi/confidence-band.json')
      .then(function (res) {
        // handle success
        let data = res.data
        chart.hideLoading();
        let base = -data.reduce(function (min, val) {
            return Math.floor(Math.min(min, val.l));
        }, Infinity);

        chart.setOption({
          backgroundColor: 'rgba(255, 255, 255, .88)',
            title: {
                text: '泵房压力变化曲线',
                subtext: '每分钟更新实时数据',
                left: 'left'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    animation: false,
                    label: {
                        backgroundColor: '#ccc',
                        borderColor: '#aaa',
                        borderWidth: 1,
                        shadowBlur: 0,
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        color: '#222'
                    }
                },
                formatter: function (params) {
                    return params[2].name + '<br />' + ((params[2].value - base) * 100).toFixed(1) + '%';
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(function (item) {
                    return item.date;
                }),
                axisLabel: {
                    formatter: function (value, idx) {
                        var date = new Date(value);
                        return idx === 0 ? value : [date.getMonth() + 1, date.getDate()].join('-');
                    }
                },
                boundaryGap: false
            },
            yAxis: {
                axisLabel: {
                    formatter: function (val) {
                        return (val - base) * 100 + '%';
                    }
                },
                axisPointer: {
                    label: {
                        formatter: function (params) {
                            return ((params.value - base) * 100).toFixed(1) + '%';
                        }
                    }
                },
                splitNumber: 3
            },
            series: [{
                name: 'L',
                type: 'line',
                data: data.map(function (item) {
                    return item.l + base;
                }),
                lineStyle: {
                    opacity: 0
                },
                stack: 'confidence-band',
                symbol: 'none'
            }, {
                name: 'U',
                type: 'line',
                data: data.map(function (item) {
                    return item.u - item.l;
                }),
                lineStyle: {
                    opacity: 0
                },
                areaStyle: {
                    color: 'rgba(255, 0, 0, .36)'
                },
                stack: 'confidence-band',
                symbol: 'none'
            }, {
                type: 'line',
                data: data.map(function (item) {
                    return item.value + base;
                }),
                hoverAnimation: false,
                symbolSize: 6,
                itemStyle: {
                    color: '#f00'
                },
                showSymbol: false
            }]
        });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  }
}