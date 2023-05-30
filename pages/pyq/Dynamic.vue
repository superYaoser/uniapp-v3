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
          <Loading :loading="!loading"></Loading>
          <view class="w100 h100" v-if="loading">
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
import {onMounted, ref, watch} from "vue";
import Loading from "@/components/loading/Loading";
	export default {
		components: {
      ArticlesList,Loading
		},
    setup(){
      onMounted(()=>{


      })
      //查看是否登录
      const store = useStore()
      let login_u_id = store.getters.getUser
      login_u_id = login_u_id.u_id
      watch(
          () => login_u_id,
          (newValue) => {
            if (newValue !== null && newValue !== undefined && newValue !== '') {
              loading.value = false;
            }
          }
      );
      //加载状态
      let loading = ref(true)

      return{
        loading
      }
    }
	}
</script>

<style scoped lang="less">
.pyq__container__body{
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 9% - 7% + var(--status-bar-height));
  margin-top: calc(10% + var(--status-bar-height));
  position: static;
}

</style>
