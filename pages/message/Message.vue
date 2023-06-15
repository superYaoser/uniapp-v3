<template>
  <view class="w100 h100">
    <view class="w100 h100">
      <view class="message__container w100 h100">
        <!--        头部-->
        <view class="message__container__header bg-efefef pageTitle-height pageTitle-top-fix-zindex999 w100">
          <view class="status-bar-height bg-efefef w100 disF-center"></view>
          <!--          标题-->
          <view class="message__container__header__title my-h3 disF-center w100" style="padding: 5px 0">
            消息
          </view>
        </view>

        <!--        身体-->
        <view class="message__container__body">
          <view class="w100 h100">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #ffffff;`"
                         refresher-enabled="true" refresher-background="#ffffff">
              <MessageCard></MessageCard>
            </scroll-view>
          </view>
        </view>

      </view>
    </view>
  </view>
</template>

<script>

import {useStore} from 'vuex';
import {onMounted, ref, watch, computed} from "vue";
import MessageCard from "@/components/message/MessageCard";

export default {
  components: {
    MessageCard
  },
  setup() {
    onMounted(() => {

    })


    return {}
  }
}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";

.message__container__body {
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 5vh - @My-TabBar-H - var(--status-bar-height));
  margin-top: calc(5vh + var(--status-bar-height));
  position: static;
}

</style>
