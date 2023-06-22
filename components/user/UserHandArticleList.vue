<template>
  <view>
    <view v-for="(item,index) in articleList" :key="index" style="margin-bottom: 10rpx;">
      <ArticleCard :article-data="item" :need-follow-model="true"></ArticleCard>
    </view>
    <view class="disF-center" style="color: #a0a0a0;flex-direction: column;"><view>已经到底了...</view></view>
  </view>
</template>

<script>
import {onMounted, ref} from "vue";
import {getArticleUserHandListByUserId} from '@/static/api/article'
import ArticleCard from "@/components/article/ArticleCard";

export default {
  props: {
    u_id: String
  },
  components: {
    ArticleCard
  },
  setup(props) {
    //存储用户id
    let u_id = ref()
    u_id.value = props.u_id
    // 存储文章
    let articleList = ref()

    const initialize =async (u_id)=>{
      let res = await getArticleUserHandListByUserId(u_id)
      if (res.code === 200){
        articleList.value = res.data
      }
    }

    onMounted(()=>{
      initialize(u_id.value)
    })
    return{
      articleList
    }
  }
}
</script>

<style scoped>

</style>
