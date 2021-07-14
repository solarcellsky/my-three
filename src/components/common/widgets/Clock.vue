<template>
  <div class="clock">
    <div>
      <div class="time">00:00:00</div>
    </div>
    <div class="r">
      <div class="day">星期一</div>
      <div class="date">1970年01月01日</div>
    </div>
  </div>
</template>
<script>
export default {
  name: "Clock",
  mounted () {
    this.showDateTime()
  },
  methods: {
    showDateTime() {
      const DAYS=new  Array ("日", "一", "二", "三", "四", "五", "六");
      const currentDT = new Date();
      let Y, M, DATE, DAY, HS, MS, SS;
      Y = currentDT.getFullYear(); //四位整数表示的年份
      M = currentDT.getMonth() + 1; //月
      if (M < 10) M = '0' + M; //两位整数表示的月份，在一些情况下需要补齐
      DATE = currentDT.getDate(); //日
      if (DATE < 10) DATE = '0' + DATE; //两位整数表示的天数，在一些情况下需要补齐
      DAY = currentDT.getDay(); //星期
      HS = currentDT.getHours(); //时
      if (HS < 10) HS = '0' + HS; //两位整数表示的小时，在一些情况下需要补齐
      MS = currentDT.getMinutes(); //分
      if (MS < 10) MS = '0' + MS; //两位整数表示的分钟，在一些情况下需要补齐
      SS = currentDT.getSeconds(); //秒
      if (SS < 10) SS = '0' + SS; //两位整数表示的秒，在一些情况下需要补齐
      const time = document.querySelector(".time");
      const day = document.querySelector(".day");
      const date = document.querySelector(".date");
      time.innerHTML = HS + ':' + MS + ':' + SS;
      day.innerHTML = '星期' + DAYS[DAY];
      date.innerHTML = Y + '年' +  M + '月' + DATE + '日';

      window.setInterval( this.showDateTime, 1000);
    },
  }
}
</script>

<style lang="scss">
.clock {
  position: absolute;
  top: 30px;
  right: 160px;
  display: flex;

  & .time {
    font-size: 36px;
  }

  & .r {
    flex: 1;
    text-align: left;
    font-size: 12px;
    padding: 5px 0 0 10px;
  }
}
</style>