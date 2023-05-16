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
            导航区域
          </view>
        </view>

<!--        身体-->
        <view class="container__body">
          <view class="w100 h100">
            <ArticlesList></ArticlesList>
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
      //页面渲染完毕
      onMounted(()=>{

      })

      return{
        headerBG
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
      margin-top: calc(16% + var(--status-bar-height));
      position: static;
    }
  }
}
</style>
