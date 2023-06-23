<template>
  <view class="publishPage">
    <view class="publishPage__container">
      <view class="publishPage__container__header">

        <view style="height: var(--status-bar-height);background:#f9f9f9;"></view>

      </view>

      <view class="publishPage__container__body">

        <Publish></Publish>
      </view>

    </view>
  </view>

</template>

<script>
import {
  onBackPress
} from "@dcloudio/uni-app";
import {onMounted, ref} from "vue";
import Loading from "@/components/loading/Loading";
import Publish from "@/components/publish/Publish";
import {useStore} from 'vuex';

export default {
  components: {
    Loading,
    Publish
  },
  setup() {
    let store = useStore()
    let userObj = store.getters.getUser
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }
    onMounted(()=>{
if (!userObj.u_id){
  plus.nativeUI.toast(`请先登录`)
  pageBack()
}


    })


    return {

    }
  }
}
</script>

<style scoped lang="less">
.publishPage{
  overflow: hidden;
  width: 100%;
  height: 100vh;
  &__container{
    width: 100%;
    height: 100%;
    &__header{
      width: 100%;
    }

    &__body{
      width: 100%;
      height: calc(100vh - var(--status-bar-height));
      margin-top: var(--status-bar-height);
    }

  }
}

</style>
