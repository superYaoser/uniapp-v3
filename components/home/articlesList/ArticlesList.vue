<template>
	<view class="w100 h100">
		<view class="actives__container w100 h100">
      <swiper style='width: 100%;height: 100%' :autoplay="false" @change="swiperItemChange($event)" :current="clickNavIndex">

          <swiper-item v-for="(item1, index1) in classifyList" :key="index1">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;`"  v-if="!scrollViewLoading">
              <view class="articleList__container__body w100" style="padding-top: 2px;padding-bottom: 5px">
                <view v-for="(item2, index2) in item1.articleList" :key="item2.article_id" style="margin-bottom: 5px;">
<!--                  文章卡片-->
<ArticleCard :article-data="item2" :need-follow-model="true" @update:item="handleItemUpdate(index2, $event)"></ArticleCard>

                  </view>
                </view>
            </scroll-view>
          </swiper-item>

      </swiper>
    </view>
	</view>
</template>

<script>
import {onMounted, ref, watch} from "vue";
import {getCategoryList}from '@/static/api/category'
import {getDetailedArticle} from "@/static/api/article";
import ArticleCard from "@/components/article/ArticleCard";
import { computed } from 'vue';

export default {
  components:{
    ArticleCard
  },
  setup(){
    /*****************全局配置*********************************/

    //默认文章封面
    let defaultCoverImgPath = 'https://pics4.baidu.com/feed/5882b2b7d0a20cf429edbfd4b3b56b3aadaf9980.jpeg@f_auto?token=b811138c15892653e907b9d2c913b343'

    /*****************全局配置 end *********************************/

    // 类别列表
    let classifyList = ref();
    classifyList.value = [
      { categoryID:'1yao',classifyTitle: "最新", classifyContent: "类别描述",currentPage:1, articleList:[{}] },
      { categoryID:'2yao',classifyTitle: "推荐", classifyContent: "类别描述",currentPage:1, articleList:[{}] },
      { categoryID:'3yao',classifyTitle: "热门", classifyContent: "类别描述",currentPage:1, articleList:[{}] },
    ]
    // 最新的文章列表
    let lateArticleList=ref([])
    //推荐的文章列表
    let recommendArticleList=ref([])
    //热门的文章列表
    let hotArticleList=ref([])

    //将请求文章初始列表 封装
    const getDetailedArticleByJsonData = async (data)=>{
      let temp = await getDetailedArticle(data)
      console.log(temp.data)
      let res =temp.data
      return res
    }


    //用于用户点击了哪个导航跳转到哪个页面
    let clickNavIndex = ref()
    uni.$on('home_article_follow_nav_change',function(e){
      clickNavIndex.value = e.page;
      console.log(clickNavIndex.value)
    })

    onMounted(async () => {
      //初始化 列表
      lateArticleList.value = await getDetailedArticleByJsonData({"sort": 1, "page_number": 1, "articleContentMaxWord": 100,"select_title_num":3})
      recommendArticleList.value = await getDetailedArticleByJsonData({"sort": 0, "page_number": 1, "articleContentMaxWord": 100,"select_title_num":1})
      hotArticleList.value = await getDetailedArticleByJsonData({"sort": 1, "page_number": 1, "articleContentMaxWord": 100,"select_title_num":2})
        classifyList.value[0].articleList = lateArticleList.value
        classifyList.value[1].articleList = recommendArticleList.value
        classifyList.value[2].articleList = hotArticleList.value
      console.log(classifyList.value)
    })

    //记录当前页面 左右
    let currentIndex = ref()
    //左右改变
    const swiperItemChange =(e)=>{
      currentIndex.value = e.detail.current
      uni.$emit('home_article_nav_change', {currentNavIndex: currentIndex.value})
    }

    let scrollViewLoading =ref(true)
    watch(classifyList, (newValue) => {
      // 定义一个变量判断是否所有的articleList都有值
      let allArticleListHaveValue = newValue.every((item) => item.articleList.length > 0);

      // 如果所有articleList都有值，则设置loading为false
      if (allArticleListHaveValue) {
        scrollViewLoading.value = false;
      }
    }, { deep: true });

    //接收文章卡片传递过来的数据变化
    const handleItemUpdate=(index, newValue)=>{
      console.log('文章卡转递了新值')
      updateClassifyList(newValue)
      uni.$emit('home_articleList_change', {data: classifyList.value})
    }
    //更新所有classifyList中的articleList 与文章id和作者id匹配的对象
    //newValue是articleList格式
    function updateClassifyList(newValue) {
      classifyList.value.forEach((item) => {
        item.articleList.forEach((article, index) => {
          //更新该作品信息
          if (article.article_id === newValue.article_id && article.article_user_id === newValue.article_user_id) {
            item.articleList.splice(index, 1, newValue);
          }
          // 更新该 作者关注 信息
          if (article.article_user_id === newValue.article_user_id) {
            item.articleList[index].concern_be=newValue.concern_be;
          }
        });
      });
    }
    return{
      scrollViewLoading,
      classifyList,
      swiperItemChange,
      defaultCoverImgPath,
      clickNavIndex,
      handleItemUpdate
    }
  },
};
</script>

<style scoped lang="less">
.articleList__container__body{
  background: #f5f5f5;
}
</style>
