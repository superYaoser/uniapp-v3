<template>
	<view id="Home" style="width: 100%;">
		<view class="home">
      <view class="home__container">
<!--        头部-->
        <view class="container__header pageTitle-top-fix-zindex999 w100">
          <view class="status-bar-height" style="background: #016fce;"></view>
<!--          搜索-->
          <view class="header__search">
            <view class="header__search__container">
              <view class="header__search__container__input"  @tap.stop="tapSearch()"><uni-icons type="search" style="margin-left: 10rpx" size="25rpx"></uni-icons><text space="ensp"> 搜点什么...</text></view>
              <uni-icons type="scan" size="55rpx" color="#002c52"></uni-icons>
            </view>
          </view>
<!--          导航-->
          <view class="header__nav">
            <view class="header__nav__container">
              <view class="header__nav__container--late" @tap="changeCurrentNavPage(0)" :style="articleNavIndex===0?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">最新</view>
              <view class="header__nav__container--recommend"  @tap="changeCurrentNavPage(1)" :style="articleNavIndex===1?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">推荐</view>
              <view class="header__nav__container--hot"  @tap="changeCurrentNavPage(2)" :style="articleNavIndex===2?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">热门</view>
            </view>
          </view>
        </view>

<!--        身体-->
        <view class="container__body">
          <view class="w100 h100">
            <ArticlesList :need-follow-model="true"></ArticlesList>
          </view>
        </view>

      </view>
    </view>
	</view>
</template>

<script>
import {onMounted, ref} from "vue";
import TopBar from "@/components/MainApp/TopBar";
import ArticlesList from "@/components/home/articlesList/ArticlesList";
import {useStore} from 'vuex';
  export default {
		components: {
      TopBar,
      ArticlesList
		},
    setup(){

      //监听 导航栏的 index变化 的功能
      let articleNavIndex=ref(0)
      let articleNavColor = '#131313'
      let unArticleNavColor = '#a2a3ab'
      uni.$on('home_article_nav_change',function(e){
        articleNavIndex.value = e.currentNavIndex;
      })
      const changeCurrentNavPage = (page)=>{
        uni.$emit('home_article_follow_nav_change', {page: page})
      }
      //查看是否登录
      const store = useStore()
      // 点击搜索
      const tapSearch=()=>{
        let login_user = store.getters.getUser
        if (login_user){

        //  说明登录了
          uni.navigateTo({
            url: '/pages/search/search',
            animationType:'fade-in',
            animationDuration: 100
          })
          console.log("用户已经登录 跳转搜索页")
        }else {
          console.log("用户没有登录 无法搜索")
          plus.nativeUI.toast(`请先登录`)
        }
      }


      //页面渲染完毕
      onMounted(()=>{

      })

      return{
        articleNavIndex,articleNavColor,unArticleNavColor,changeCurrentNavPage,tapSearch
      }
    },
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";
.home{
  &__container{
    height: 100vh;
    .container__header{
      position: fixed;
      left: 0;
      top: 0;
      z-index: 999;
      width: 100%;
      height: calc(10vh + var(--status-bar-height));
      .header__search{
        background: #016fce;
        height: calc((100% - var(--status-bar-height)) * 0.53);
        &__container{
          margin: 0 auto;
          height: 100%;
          width: 95vw;
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-direction: row;
          &__input{
            width: 88%;
            height: 65%;
            display: flex;
            align-items: center;
            border-radius: 20rpx;
            background: #fbfbfb;
            font-size: 25rpx;
            color: #5b5b5b;
          }
        }
      }
      .header__nav{
        background: #FFFFFF;
        border-bottom: 1px solid #f1f1f1;
        height: calc((100% - var(--status-bar-height)) * 0.47);
      }
    }
    .container__body{
      background: #FFFFFF;
      width: 100%;
      height: calc(100% -  var(--status-bar-height) - 10vh - @My-TabBar-H);
      margin-top: calc(10vh + var(--status-bar-height));
      position: static;
    }
  }
}
.header__nav{
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  .header__nav__container{
    display: flex;
    view{
      font-size: 1rem;
      font-weight: inherit;
      margin: 0 10px;
    }
  }
}

.active__nav{
  color: #13dbf9;
}
.unactive__nav{
  color: #3a3a3a;
}
</style>
