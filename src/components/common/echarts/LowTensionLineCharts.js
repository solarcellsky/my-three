import * as echarts from 'echarts';
const axios = require('axios');

export default class LowTensionLineCharts {
  constructor(options) {
    this.options = options;
  }
  create() {
    const target = document.getElementById(this.options.container);
    const dom = document.createElement('div');
    dom.setAttribute('style', 'width: 360px;height: 180px;backgroud: rgba(255, 255, 255, .618);margin: 0 0 10px;');
    const chart = echarts.init(dom);
    target.appendChild(dom);
    chart.showLoading();
    const colors = ['#E6A23C', '#67C23A'];
    axios.get('assets/fakeapi/lt.json').then(function(res) {
      // handle success
      chart.hideLoading();
      const _data = res.data;

      chart.setOption({
        color: colors,
        backgroundColor: 'rgba(255, 255, 255, .88)',
        title: {
          text: '低压电流电压变化曲线',
          subtext: '每分钟更新实时数据(单位: 电压V、电流A)',
          padding: 15,
          textStyle: {
            fontSize: 12
          },
          subtextStyle: {
            fontSize: 10
          },
          left: 'left'
        },
        tooltip: {
          trigger: 'axis',
          textStyle: {
            lineHeight: 1,
            align:'left',
            fontSize: 12
          }
        },
        grid: {
          left: '15px',
          right: '15px',
          bottom: '15px',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: _data.map(function(item) {
            return item.time;
          }),
          boundaryGap: true
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [{
          name: '电压',
          type: 'line',
          smooth: true,
          data: _data.map(function(item) {
            return item.u;
          }),
        },
        {
          name: '电流',
          type: 'line',
          smooth: true,
          data: _data.map(function(item) {
            return item.a;
          }),
        }]
      });
    }).
    catch(function(error) {
      // handle error
      console.log(error);
    }).then(function() {
      // always executed
    });
  }
}