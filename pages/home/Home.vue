<template>
	<view id="Home" class="w100 h100">
    <TopBar></TopBar>
		<view class="home w100 h100">
      <view class="home__container w100 h100">
<!--        头部-->
        <view class="container__header">
<!--          搜索-->
          <view class="header__search">
            搜索区域
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

      //页面渲染完毕
      onMounted(()=>{

      })

      return{
        articleNavIndex,articleNavColor,unArticleNavColor,changeCurrentNavPage
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
.home{
  &__container{
    .container__header{
      position: fixed;
      left: 0;
      top: 0;
      z-index: 999;
      width: 100%;
      height: 10%;
      margin-top: var(--status-bar-height);
      .header__search{
        background: #016fce;
        height: 53%;
      }
      .header__nav{
        background: #FFFFFF;
        border-bottom: 1px solid #f1f1f1;
        height: 47%;
      }
    }
    .container__body{
      background: #FFFFFF;
      width: 100%;
      height: calc(100% - 10% - 7% - var(--status-bar-height));
      margin-top: calc(13% + var(--status-bar-height));
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
