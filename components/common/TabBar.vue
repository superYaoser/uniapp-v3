<template>
  <view id="TabBar">
    <view class="tabbar">
      <view>
        <uni-icons type="home" size="30" :color="currentR ==='Home'?activityIconsColor:staticIconsColor"
                   @click="goHome('Home')"></uni-icons>
        <text>首页</text>
      </view>
      <view>
        <uni-icons type="pyq" size="30" :color="currentR ==='Dynamic'?activityIconsColor:staticIconsColor"
                   @click="goDynamic('Dynamic')"></uni-icons>
        <text>动态</text>
      </view>
      <view>
        <uni-icons type="plus-filled" size="45" color="#13dbf9" @click="goPublish('Publish')"></uni-icons>
      </view>
      <view>
        <uni-icons type="chat" size="30" :color="currentR ==='Message'?activityIconsColor:staticIconsColor"
                   @click="goMessage('Message')"></uni-icons>
        <text>消息</text>
      </view>
      <view>
        <uni-icons type="person" size="30" :color="currentR ==='Mine'?activityIconsColor:staticIconsColor"
                   @click="goMine('Mine')"></uni-icons>
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
    //页面渲染完毕
    onMounted(()=>{

      //先默认让头区域是首页的颜色
      uni.$emit('topBarBackgroundColor', {bg: '#016fce'})

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
      //让头改变颜色
      uni.$emit('topBarBackgroundColor', {bg: '#016fce'})
    }
    //动态
    const goDynamic = (router) => {
      useUniEmitCurrentRouterUpdate(router)
      //让头改变颜色
      uni.$emit('topBarBackgroundColor', {bg: '#ffffff'})
    }
    //发布
    const goPublish = (router) => {
      useUniEmitCurrentRouterUpdate(router)
      uni.$emit('tabBarVisibilityUpdate', {tabBarVisibility: false})
      //让头改变颜色
      uni.$emit('topBarBackgroundColor', {bg: '#ffffff'})
    }
    //消息
    const goMessage = (router) => {
      useUniEmitCurrentRouterUpdate(router)
      //让头改变颜色
      uni.$emit('topBarBackgroundColor', {bg: '#ffffff'})
    }
    //我的
    const goMine = (router) => {
      useUniEmitCurrentRouterUpdate(router)
      //让头改变颜色
      uni.$emit('topBarBackgroundColor', {bg: '#ffffff'})
    }

    return {
      currentR,
      staticIconsColor,
      activityIconsColor,
      goHome,
      goDynamic,
      goPublish,
      goMessage,
      goMine
    }
  }
}
</script>

<style lang="less" scoped>
#TabBar {
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 999;
  width: 100%;
  height: 7%;
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
