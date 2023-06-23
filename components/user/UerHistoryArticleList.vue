<template>
  <view>
    <view class="disF-center" style="color: #a0a0a0;flex-direction: column;" v-if="userObj.u_id!==u_id"><view>无法查看他/她人的历史记录</view></view>
    <view v-for="(item,index) in articleList" :key="index" style="margin-bottom: 10rpx;" v-else>
      <view class="disF-center" style="color: #646464;flex-direction: column;align-items: flex-end;font-size: 32rpx;background: #FFFFFF;"><view style="margin-right:30rpx;">查看时间：{{ item.w_create_time=formatTimestamp(new Date(item.w_create_time)).slice(6, -7)}}</view></view>
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
import {formatTimestamp} from '@/static/utils/globalConifg'
import {useStore} from 'vuex';

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
    let store = useStore()
    let userObj = ref(store.getters.getUser)

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

    onMounted(async ()=>{
      if (userObj.value.u_id === u_id.value)
        await initialize(u_id.value)


    })
    return{
      articleList,formatTimestamp,userObj,u_id
    }
  }
}
</script>

<style scoped>

</style>
