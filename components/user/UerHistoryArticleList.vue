<template>
  <view>
    <view v-for="(item,index) in articleList" :key="index" style="margin-bottom: 10rpx;">
      <view class="disF-center" style="color: #646464;flex-direction: column;align-items: flex-end;font-size: 32rpx;background: #FFFFFF;"><view style="margin-right:30rpx;">查看时间：{{ item.w_create_time= item.w_create_time.slice(0, 19).replace('T', '-') }}</view></view>
      <ArticleCard :article-data="item" :need-follow-model="true"></ArticleCard>
    </view>
    <view class="disF-center" style="color: #a0a0a0;flex-direction: column;"><view>历史记录最多显示50条</view></view>
    <view class="disF-center" style="color: #a0a0a0;flex-direction: column;"><view>已经到底了...</view></view>
  </view>
</template>

<script>
import {onMounted, ref} from "vue";
import {getArticleDetailByID} from '@/static/api/article'
import {getWatchByUid} from '@/static/api/act'
import ArticleCard from "@/components/article/ArticleCard";
import {formatDate} from '@/static/utils/globalConifg'

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
    let articleList = ref([])
    // 存储观看数据
    let watchArticleIdData = []

    const initialize =async (u_id)=>{
      let res = await getWatchByUid(u_id)
      if (res.code === 200){

        for (let i =0;i<res.data.length;i++){
          watchArticleIdData.push(res.data[i])
          if(watchArticleIdData.length>50){
            break;
          }
        }
      }

      for (let i =0;i<watchArticleIdData.length;i++){
        let res1 = await getArticleDetailByID(watchArticleIdData[i].w_article_id)
        if (res1.code ===200){
          res1.data.w_create_time = watchArticleIdData[i].w_create_time
          console.log(res1.data.w_create_time)
          articleList.value.push(res1.data)
        }

      }

    }

    onMounted(()=>{
      initialize(u_id.value)
    })
    return{
      articleList,formatDate
    }
  }
}
</script>

<style scoped>

</style>
