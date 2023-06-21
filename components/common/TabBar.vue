<template>
  <view id="TabBar">
    <view class="tabbar">
      <view>
        <uni-icons type="home" size="30" :color="currentR ==='Home'?activityIconsColor:staticIconsColor"
                   @tap="goHome('Home')"></uni-icons>
        <text>首页</text>
      </view>
      <view>
        <uni-icons type="pyq" size="30" :color="currentR ==='Dynamic'?activityIconsColor:staticIconsColor"
                   @tap="goDynamic('Dynamic')"></uni-icons>
        <text>动态</text>
      </view>
      <view>
        <uni-icons type="plus-filled" size="45" color="#13dbf9" @tap="goPublish('Publish')"></uni-icons>
      </view>
      <view style="position: relative">
        <uni-icons type="smallcircle-filled" color="red" size="5rpx" style="position: absolute;top: 0;right: 0" v-if="haveNewInfo"></uni-icons>
        <uni-icons type="chat" size="30" :color="currentR ==='Message'?activityIconsColor:staticIconsColor"
                   @tap="goMessage('Message')"></uni-icons>
        <text>消息</text>
      </view>
      <view>
        <uni-icons type="person" size="30" :color="currentR ==='Mine'?activityIconsColor:staticIconsColor"
                   @tap="goMine('Mine')"></uni-icons>
        <text>我的</text>
      </view>
    </view>
  </view>
</template>

<script>
import {onMounted, ref} from "vue";

export default {
  name: "TabBar",
  setup() {
    let haveNewInfo = ref(false)
    //监听路由变化
    uni.$on('received_new_information',function(e){
      haveNewInfo.value = e.data
      console.log(haveNewInfo.value)
    })
    //页面渲染完毕
    onMounted(()=>{


    })
    let currentR = ref('Home')
    let staticIconsColor = '#999797';
    let activityIconsColor = '#13dbf9';

    //用户告知其他界面改变router
    const useUniEmitCurrentRouterUpdate = (router) => {
      uni.$emit('currentRouterUpdate', {router: router})
      if (router !== 'Publish') {
        currentR.value = router
      }else {
        uni.$emit('tabBarCurrentRvalue', {router: currentR.value})
      }
    }

    //首页
    const goHome = (router) => {
      useUniEmitCurrentRouterUpdate(router)
    }
    //动态
    const goDynamic = (router) => {
      useUniEmitCurrentRouterUpdate(router)
    }
    //发布
    const goPublish = (router) => {
      uni.navigateTo({
        url: '/pages/publish/Publish',
        animationType:'slide-in-bottom',
        animationDuration: 150
      })
    }
    //消息
    const goMessage = (router) => {
      useUniEmitCurrentRouterUpdate(router)
    }
    //我的
    const goMine = (router) => {
      useUniEmitCurrentRouterUpdate(router)
    }

    return {
      currentR,
      staticIconsColor,
      activityIconsColor,
      goHome,
      goDynamic,
      goPublish,
      goMessage,
      goMine,haveNewInfo
    }
  }
}
</script>

<style lang="less" scoped>
@import "@/static/style/lessMain.less";
#TabBar {
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 999;
  width: 100%;
  height: @My-TabBar-H;
  background-color: #f9f9f9;

  .tabbar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    height: 100%;

    view {
      display: flex;
      flex-direction: column;
      align-items: center;

      text {
        font-size: 12px;
      }
    }
  }
}
</style>
