<template>
	<view class="w100 h100">
		<view class="actives__container w100 h100">
      <swiper style='width: 100%;height: 100%' :autoplay="false" @change="swiperItemChange($event)" :current="clickNavIndex" v-if="!loading">

          <swiper-item v-for="(item1, index) in classifyList" :key="index">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;`">
              <view class="articleList__container__body w100" style="padding-top: 2px;padding-bottom: 5px">
                <view v-for="(item2, index) in item1.articleList" :key="index" style="margin-bottom: 5px;">
<!--                  文章卡片-->
<ArticleCard :article-data="item2" :need-follow-model="true"></ArticleCard>

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

    // 监视 classifyList 数组中每个分类的 articleList 属性
    // 当所有分类都包含一些非空数据时，
    // 将加载状态设置为 false，表示数据已加载
    let loading =ref(true)
    watch(() => classifyList.value, (newVal) => {
      if (newVal.every(item => item.articleList.length > 0)) {
        loading.value = false;
      }
    }, { deep: true });

    return{
      loading,
      classifyList,
      swiperItemChange,
      defaultCoverImgPath,
      clickNavIndex,
    }
  },
};
</script>

<style scoped lang="less">
.articleList__container__body{
  background: #f5f5f5;
}
</style>
