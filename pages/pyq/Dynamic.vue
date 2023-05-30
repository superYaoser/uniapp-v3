<template>
  <view class="w100 h100">
    <view class="w100 h100">
      <view class="pyq__container w100 h100">
        <!--        头部-->
        <view class="pyq__container__header bg-efefef pageTitle-height pageTitle-top-fix-zindex999 w100">
          <view class="status-bar-height bg-efefef w100 disF-center"></view>
          <!--          标题-->
          <view class="pyq__container__header__title my-h3 disF-center w100">
            关注
          </view>
        </view>

        <!--        身体-->
        <view class="pyq__container__body">
          <view class="w100 h100">
            <ArticlesList :need-follow-model="false" :model_str_num="'pyq'"></ArticlesList>
          </view>
        </view>

      </view>
    </view>
  </view>
</template>

<script>
import ArticlesList from "@/components/home/articlesList/ArticlesList";
	export default {
		components: {
      ArticlesList,
		},
    setup(){

      return{

      }
    }
	}
</script>

<style scoped lang="less">
.pyq__container__body{
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 9% - 7% + var(--status-bar-height));
  margin-top: calc(9% + var(--status-bar-height));
  position: static;
}

</style>
