<template>
  <view>
    <view class="search__container">
<!--      头部-->
      <view class="search__container__header bg-efefef">
        <view class="status-bar-height"></view>

        <view class="search__container__header__input">
          <!--        搜索图标-->
          <view class="search__container__header__input--icon">
            <uni-icons type="search" size="30rpx" color="#808080" style="margin-left: 20rpx;"></uni-icons>
          </view>
          <input  class="search__container__header__input--sub"
                     focus="true"
                     placeholder-class="search__container__header__input--sub"
                     :adjust-position="false" placeholder="搜点什么..."
                     @input=""/>
          <view class="search__container__header__input--cancel" @tap.stop="pageBack">取消</view>
        </view>
      </view>
      <view class="search__container__body">
        <SearchHistory></SearchHistory>
      </view>
    </view>
  </view>
</template>

<script>
import {
  onBackPress
} from "@dcloudio/uni-app";
import SearchHistory from "@/components/home/search/SearchHistory";
export default {
  components:{
    SearchHistory
  },
  setup() {

    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }
    //监听用户触发返回后处理请求
    onBackPress((e) => {
      console.log('用户在搜索界面按了返回键盘');
//backbutton 是点击物理按键返回，navigateBack是uniapp中的返回（比如左上角的返回箭头）
      // 触发返回就会调用此方法，这里实现的是禁用物理返回，顶部导航栏的自定义返回 uni.navigateBack 仍可使用
      if (e.from === 'backbutton') {
        pageBack()
        return true;
      } else if (e.from === 'navigateBack') {
        return false;
      }
    })
    return{
      pageBack
    }
  }
}
</script>

<style scoped lang="less">
.search__container{
  &__header{

    &__input{
      height: 5vh;
      display: flex;
      align-items: center;
      width: 95vw;
      margin: 0 auto;

      &--icon{
        margin-left: 20rpx;
        background: #fbfbfb;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        height: 70%;
        border-top-left-radius:  10rpx;
        border-bottom-left-radius:10rpx;
      }
      &--sub{
        background: #fbfbfb;
        font-size: 26rpx;
        height: 70%;
        width: 80%;
        border-top-right-radius:  10rpx;
        border-bottom-right-radius:10rpx;
      }

      &--cancel{
        margin-left: 20rpx;
        font-size: 25rpx;
        right: 0;
      }
    }
  }
  &__body{
    background: #FFFFFF;
  }
}

</style>
