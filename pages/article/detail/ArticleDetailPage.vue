<template>
  <view class="articleDetailPage">
    <view class="articleDetailPage__container">
      <view class="articleDetailPage__container__header">

        <view style="height: var(--status-bar-height);"></view>
        <view class="articleDetailPage__container__header--main">
          <view class="articleDetailPage__container__header--button">
            <view @click="pageBack()" style="margin-left: 10px;"><uni-icons type="left" size="20"></uni-icons>
            </view>
          </view>

          <view class="articleDetailPage__container__header--title">{{headerTitle}}</view>
          <view class="articleDetailPage__container__header--more"><uni-icons type="more" size="20"></uni-icons></view>
        </view>


      </view>

      <view class="articleDetailPage__container__body">
        <ArticleDetailPage></ArticleDetailPage>
      </view>

      <view class="articleDetailPage__container__footer">

        脚步
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

export default {
  components: {
    Loading,
    ArticleDetailPage,TopBar
  },
  setup() {
    let headerTitle =ref('默认标题')
    onMounted(()=>{


    })
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }
    //监听用户触发返回后处理请求
    onBackPress((e) => {
      console.log(e);
      console.log('用户在详细文章界面按了返回键盘');
//backbutton 是点击物理按键返回，navigateBack是uniapp中的返回（比如左上角的返回箭头）
      // 触发返回就会调用此方法，这里实现的是禁用物理返回，顶部导航栏的自定义返回 uni.navigateBack 仍可使用
      if (e.from === 'backbutton') {
        pageBack()
        return true;
      } else if (e.from === 'navigateBack') {
        return false;
      }
    })

    return {
      pageBack,headerTitle
    }
  }
}
</script>

<style scoped lang="less">
.articleDetailPage{
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
      height: calc(100% - 41px - 45px - var(--status-bar-height));
      margin-top: calc(41px + var(--status-bar-height));
    }
    &__footer{
      background: #d0d0d0;
      height: 40px;
      width: 100%;
      position: fixed;
      z-index: 99;
      bottom: 0;
      left: 0;
    }
   }
}

</style>
