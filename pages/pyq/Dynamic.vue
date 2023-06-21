<template>
  <view class="w100 h100">
    <view class="w100 h100">
      <view class="pyq__container w100 h100">
        <!--        头部-->
        <view class="pyq__container__header bg-efefef pageTitle-height pageTitle-top-fix-zindex999 w100">
          <view class="status-bar-height bg-efefef w100 disF-center"></view>
          <!--          标题-->
          <view class="pyq__container__header__title my-h3 disF-center w100" style="padding: 5px 0">
            关注
          </view>
        </view>

        <!--        身体-->
        <view class="pyq__container__body">

          <NoLogin v-if="!loginStatus" :img-change="1"></NoLogin>
          <view class="w100 h100" v-else>
            <ArticlesList :need-follow-model="false" :model_str_num="'pyq'"></ArticlesList>
          </view>
        </view>

      </view>
    </view>
  </view>
</template>

<script>
import ArticlesList from "@/components/home/articlesList/ArticlesList";
import {useStore} from 'vuex';
import {onMounted, ref, watch,computed} from "vue";
import Loading from "@/components/loading/Loading";
import {getConcernDetailedArticle} from "@/static/api/article";
import NoLogin from "@/components/noLogin/NoLogin";
	export default {
		components: {
      ArticlesList,Loading,NoLogin
		},
    props: {
      loginStatus: Boolean,
    },
    setup(props){
      let loginStatus = ref(props.loginStatus)
      onMounted(()=>{

      })

      return{
        loginStatus
      }
    }
	}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";
.pyq__container__body{
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 5vh - @My-TabBar-H - var(--status-bar-height));
  margin-top: calc(5vh + var(--status-bar-height));
  position: static;
}

</style>
