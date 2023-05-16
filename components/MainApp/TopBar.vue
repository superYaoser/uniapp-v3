<template>
  <view>
    <view class="status_bar" :style="'background:'+bgColor">
      <!-- 这里是状态栏 -->
    </view>
<!--    <view> 状态栏下的文字 </view>-->
  </view>
</template>

<script>
import {ref} from "vue";

export default {
  name: "TopBar",
  setup(){
    let bgColor = ref('#ffffff')
    //监听 topbar的背景颜色需求
    uni.$on('topBarBackgroundColor',function(bg){
      bgColor.value = bg.bg;
    })
    return{
      bgColor
    }
  }
}
</script>

<style scoped>
.status_bar {
  height: var(--status-bar-height);
  width: 100%;
}
</style>
