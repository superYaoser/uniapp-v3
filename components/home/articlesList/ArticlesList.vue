<template>
	<view class="w100 h100">
		<view class="actives__container w100 h100">
      <swiper style='width: 100%;height: 100%' :autoplay="false" @change="swiperItemChange($event)" :current="clickNavIndex">

          <swiper-item v-for="(item1, index1) in classifyList" :key="index1">

            <Loading :loading="scrollViewLoading"></Loading>

            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;`"  v-if="!scrollViewLoading"
                         refresher-enabled="true" refresher-background="#f5f5f5" @refresherrefresh="refreshListWithThrottle(item1.categoryID)"
                         :refresher-triggered="refreshOK">
              <view class="articleList__container__body w100" style="padding-top: 2px;padding-bottom: 5px">
                <view v-for="(item2, index2) in item1.articleList" :key="item2.article_id" style="margin-bottom: 5px;">
<!--                  文章卡片-->
<ArticleCard :article-data="item2" :need-follow-model="needFollowModel" @update:item="handleItemUpdate(index2, $event)"></ArticleCard>

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
import {getDetailedArticle,getConcernDetailedArticle} from "@/static/api/article";
import ArticleCard from "@/components/article/ArticleCard";
import Loading from "@/components/loading/Loading";
import { computed } from 'vue';
import {getListSetConfig} from "@/components/home/articlesList/functions";
import {useStore} from 'vuex';

export default {
  components:{
    Loading,
    ArticleCard
  },
  props: {
    needFollowModel:Boolean,
    model_str_num:String,
  },
  setup(props){
    //是不是需要关注模型
    const needFollowModel=ref(true)
    needFollowModel.value = props.needFollowModel
    //-----------------------------------------首页-----------------------------------------------------------------------
    // 类别列表
    let classifyList = ref();
    classifyList.value = [

    ]
    // 最新的文章列表
    let lateArticleList=ref([])
    //推荐的文章列表
    let recommendArticleList=ref([])
    //热门的文章列表
    let hotArticleList=ref([])

    //将首页请求文章初始列表 封装
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

    //记录当前页面 左右
    let currentIndex = ref()
    //左右改变
    const swiperItemChange =(e)=>{
      currentIndex.value = e.detail.current
      uni.$emit('home_article_nav_change', {currentNavIndex: currentIndex.value})
    }

    // 初始化首页的数据 的方法
    const initializeHomeData = async () => {
      //初始化classifyList
      for(let i=0;i<3;i++){
        classifyList.value[i] = { categoryID:i,classifyTitle:"",classifyContent:"类别描述",currentPage:1,articleList:[{}] }
      }
      //初始化 列表
      lateArticleList.value = await getDetailedArticleByJsonData({
        "sort": 1,
        "page_number": 1,
        "articleContentMaxWord": 100,
        "select_title_num": 3
      })
      recommendArticleList.value = await getDetailedArticleByJsonData({
        "sort": 0,
        "page_number": 1,
        "articleContentMaxWord": 100,
        "select_title_num": 1
      })
      hotArticleList.value = await getDetailedArticleByJsonData({
        "sort": 1,
        "page_number": 1,
        "articleContentMaxWord": 100,
        "select_title_num": 2
      })
      classifyList.value[0].articleList = lateArticleList.value
      classifyList.value[1].articleList = recommendArticleList.value
      classifyList.value[2].articleList = hotArticleList.value
    }
    //---------------------------------------首页 end-------------------------------------------------------------------------

    //---------------------------------------动态-------------------------------------------------------------------------
    //查看是否登录
    const store = useStore()
    let login_u_id = store.getters.getUser
    login_u_id = login_u_id.u_id
    //文章列表 关注
    let concernArticleList=ref([])
    const getConcernDetailedArticleByJsonData =async (data) => {
      let temp = await getConcernDetailedArticle(data)
      console.log(temp.data)
      let res = temp.data
      return res
    }
    // 初始化朋友圈的数据 的方法
    const initializePyqData = async () => {
      //初始化classifyList
        classifyList.value[0] = { categoryID:0,classifyTitle:"",classifyContent:"类别描述",currentPage:1,articleList:[{}] }
      //初始化 列表
      concernArticleList.value = await getConcernDetailedArticleByJsonData({
        "u_id": login_u_id,
        "articleContentMaxWord": 100,
      })
      console.log(concernArticleList.value)
      classifyList.value[0].articleList = concernArticleList.value
    }
    //---------------------------------------动态 end-------------------------------------------------------------------------

    //----------------------------关键配置-------------------------------------------------------------------------------------------


    //----------------------------刷新-------------------------------------------------------------------------------------------
    //是否下拉刷新完毕
    let refreshOK = ref(false)
    //下拉刷新列表
    let canRefresh = true // 初始状态为true表示可以刷新
    const refreshListWithThrottle = async (index) => {
      // 下面是原有的刷新逻辑，不需要修改
      refreshOK.value = true
      setTimeout(() => { refreshOK.value = false }, 1100) // 1.5秒后将刷新状态重新设置为true
      if (!canRefresh){
        console.log("当前不能刷新")

        return // 如果当前不能刷新，则直接返回
      }

      canRefresh = false // 将刷新状态设置为false
      setTimeout(() => { canRefresh = true }, 1000) // 1.5秒后将刷新状态重新设置为true

      // 下面是原有的刷新逻辑，不需要修改
      console.log("下拉刷新被触发")
      if (set.static === 2) {
        concernArticleList.value = await getConcernDetailedArticleByJsonData({
          "u_id": login_u_id,
          "articleContentMaxWord": 100,
        })
        classifyList.value[index].articleList = concernArticleList.value

      } else {
        console.log(index)
        if (index === 0) {
          console.log('123123123213213122')
          lateArticleList.value = await getDetailedArticleByJsonData({
            "sort": 1,
            "page_number": 1,
            "articleContentMaxWord": 100,
            "select_title_num": 3
          })
          classifyList.value[index].articleList = lateArticleList.value
        } else if (index === 1) {
          recommendArticleList.value = await getDetailedArticleByJsonData({
            "sort": 0,
            "page_number": 1,
            "articleContentMaxWord": 100,
            "select_title_num": 1
          })
          classifyList.value[index].articleList = recommendArticleList.value
        } else if (index === 2) {
          hotArticleList.value = await getDetailedArticleByJsonData({
            "sort": 1,
            "page_number": 1,
            "articleContentMaxWord": 100,
            "select_title_num": 2
          })
          classifyList.value[index].articleList = hotArticleList.value
        }

      }
    }
    //----------------------------刷新 end-------------------------------------------------------------------------------------------


    // 允许左右滑动
    const aroundMove=ref(true)
    //判断当前模型
    let model_str_num='home'
    model_str_num = props.model_str_num
    let set = getListSetConfig(model_str_num)
    onMounted(async () => {

      console.log(set)
      if (set.static===2){
        if (!login_u_id){
          plus.nativeUI.toast(`用户没有登录`)
        }else {
          //禁止移动
          aroundMove.value = set.aroundMove
          await initializePyqData()
        }

      }else {
        await initializeHomeData()
      }

    })

    //----------------------------关键配置 end-------------------------------------------------------------------------------------------



    let scrollViewLoading =ref(true)
    watch(classifyList, (newValue) => {
      // 定义一个变量判断是否所有的articleList都有值
      let allArticleListHaveValue = newValue.every((item) => item.articleList.length > 0);
      //
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
      clickNavIndex,
      needFollowModel,
      handleItemUpdate,
      aroundMove,
      refreshListWithThrottle,
      refreshOK
    }
  },
};
</script>

<style scoped lang="less">
.articleList__container__body{
  background: #f5f5f5;
}
</style>
