<template>
  <view class="privateMessage">
    <view class="privateMessage__container">
      <view class="privateMessage__container__header">

        <view style="height: var(--status-bar-height);"></view>
        <view class="privateMessage__container__header--main">
          <view class="privateMessage__container__header--button">
            <view @click="pageBack()" style="margin-left: 10px;"><uni-icons type="left" size="20"></uni-icons>
            </view>
          </view>

          <view class="privateMessage__container__header--title">
            <view class="privateMessage__container__header--img" :style="'background-image: url('+ 'https://i0.hdslb.com/bfs/face/9827d2901925e8efaf27fbf077e13668f749798a.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp' +');width: 30px;height: 30px;'"></view>
            {{headerTitle}}</view>
          <view class="privateMessage__container__header--more"><uni-icons type="more" size="20"></uni-icons></view>
        </view>


      </view>

      <view class="privateMessage__container__body">
        <scroll-view scroll-y='true' style="width: 100%;height: 100%;">
          <PrivateWindow :position="1"></PrivateWindow>
          <PrivateWindow :position="2"></PrivateWindow>
        </scroll-view>

      </view>

      <view class="privateMessage__container__footer">

      </view>

    </view>

  </view>

</template>

<script>
import ArticleDetailPage from "@/components/article/ArticleDetailPage";
import TopBar from "@/components/MainApp/TopBar";
import {
  onBackPress
} from "@dcloudio/uni-app";
import {onMounted, ref} from "vue";
import Loading from "@/components/loading/Loading";
import {addWatchByArticleId} from "@/static/api/act";
import PrivateWindow from "@/components/message/private/PrivateWindow";

export default {
  components: {
    Loading,
    ArticleDetailPage,TopBar,PrivateWindow
  },
  setup() {
    let headerTitle =ref('91天王')
    onMounted(()=>{

    })
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }

    return {
      pageBack,headerTitle
    }
  }
}
</script>

<style scoped lang="less">
.privateMessage{
  overflow: hidden;
  width: 100%;
  height: 100%;
  &__container{
    width: 100%;
    height: 100%;
    &__header{
      width: 100%;
      background: #f3f3f3;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999;
      &--main{
        height: 40px;
        display: flex;
        justify-items: center;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        view{
          width: 33%;
        }
      }

      &--title{
        display: flex;
        justify-items: center;
        align-items: center;
        justify-content: center;
      }
      &--img{
        background-repeat: no-repeat;
        border-radius: 50%;
        border: 0.0375rem silver solid;
        /*把背景图扩展至足够大，直至完全覆盖背景区域，
    图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
        background-size: cover;
        position: relative;
        background-position: center;
        margin-right: 20rpx;
      }
      &--more{
        display: flex;
        justify-content: flex-end;
        align-items: center;
        align-content: center;
        margin-right: 10px;
      }
    }

    &__body{
      width: 100%;
      height: calc(100% - 41px - 40px - var(--status-bar-height));
      margin-top: calc(41px + var(--status-bar-height));
    }
    &__footer{

    }
  }
}

</style>
