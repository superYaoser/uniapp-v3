<template>
	<view class="w100 h100">
		<view class="actives__container w100 h100">
      <swiper style='width: 100%;height: 100%' :autoplay="false" @change="swiperItemChange($event)" :current="clickNavIndex">

          <swiper-item v-for="(item1, index1) in classifyList" :key="index1">


            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #f5f5f5;`"
                         refresher-enabled="true" refresher-background="#f5f5f5" @refresherrefresh="refreshListWithThrottle(item1.categoryID)"
                         :refresher-triggered="refreshOK"
                         @scrolltolower="upRefreshListWithThrottle(item1.categoryID)">
              <view class="articleList__container__body w100" :style="'padding-top: 2px;padding-bottom: 5px;'">
                <view class="articleList__container__body__concern--blank disF-center" v-if="concernArticleNULL" style="flex-direction: column;margin-top: 40%">
                  <image src="./static/images/utils/blank_page.png"></image>
                  <view style="color: #a0a0a0">你还有没有关注任何人~~ 请刷新~</view>
                </view>
                <view v-for="(item2, index2) in item1.articleList" :key="item2.article_id" style="margin-bottom: 10rpx;">
<!--                  文章卡片-->
                              <Loading v-if="!loading" style="height: 350rpx"></Loading>
<ArticleCard :article-data="item2" :need-follow-model="needFollowModel" v-else></ArticleCard>

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
      if (temp.data.length<1 || !temp || temp==''){
        plus.nativeUI.toast(`没有更多数据`)
      }
      return res
    }


    //用于用户点击了哪个导航跳转到哪个页面
    let clickNavIndex = ref()
    uni.$on('home_article_follow_nav_change',function(e){
      //2023 6 23 发现一个bug 主页index发生改变，朋友圈也改变，但是朋友圈没有 1 2 页，所以就会空白
      // 如果页面是朋友圈，直接返回，不发生页面左右滚动
      if(model_str_num==='pyq')
        return

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
        "sort": 1,
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
    console.log("ArticleList用户id"+login_u_id)

    //文章列表 关注
    let concernArticleList=ref([])
    const getConcernDetailedArticleByJsonData =async (data) => {
      let temp = await getConcernDetailedArticle(data)
      if (temp.data.length<1 || !temp || temp==''){
        concernArticleNULL.value = true
      }else {
        concernArticleNULL.value = false
      }
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
    let concernArticleNULL = ref(false)
    //---------------------------------------动态 end-------------------------------------------------------------------------

    //----------------------------关键配置-------------------------------------------------------------------------------------------


    //--------------------------下拉--刷新-------------------------------------------------------------------------------------------
    let loading = ref(true)
    //是否下拉刷新完毕
    let refreshOK = ref(false)
    //下拉刷新列表
    let canRefresh = true // 初始状态为true表示可以刷新
    const refreshListWithThrottle = async (index) => {
      // 下面是原有的刷新逻辑，不需要修改
      refreshOK.value = true
      setTimeout(() => { refreshOK.value = false
        uni.$emit('home_articleList_change', {data: classifyList.value})}, 1100) // 1.5秒后将刷新状态重新设置为true
      if (!canRefresh){
        console.log("当前不能刷新")

        return // 如果当前不能刷新，则直接返回
      }

      canRefresh = false // 将刷新状态设置为false
      setTimeout(() => { canRefresh = true }, 1000) // 1.5秒后将刷新状态重新设置为true

      // 下面是原有的刷新逻辑，不需要修改
      console.log("下拉刷新被触发")
      loading.value = false
      indexReFreshPage[index] = 1
      if (set.static === 2) {
        concernArticleList.value = await getConcernDetailedArticleByJsonData({
          "u_id": login_u_id,
          "articleContentMaxWord": 100,
        })
        classifyList.value[index].articleList = concernArticleList.value
        plus.nativeUI.toast(`已刷新`)
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
            "sort": 1,
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
        plus.nativeUI.toast(`已刷新`)
      }
      loading.value = true
    }
    //----------------------------刷新 end-------------------------------------------------------------------------------------------

    //--------------------------上拉---刷新-------------------------------------------------------------------------------------------
    //是否上拉刷新完毕
    let upRefreshOK = ref(false)
    //记录当前索引刷新页数
    let indexReFreshPage=[1,1,1]
    //下拉刷新列表
    let canUpRefresh = true // 初始状态为true表示可以刷新
    const upRefreshListWithThrottle =async (index) =>{
      //动态页不需要刷新，直接返回即可
      if (set.static===2){
        return
      }
      // 下面是原有的刷新逻辑，不需要修改
      upRefreshOK.value = true
      setTimeout(() => { upRefreshOK.value = false
        uni.$emit('home_articleList_change', {data: classifyList.value})}, 1100) // 1.1秒后将刷新状态重新设置为true
      if (!canUpRefresh){
        console.log("当前不能上拉刷新")
        plus.nativeUI.toast(`载入中...`)

        return // 如果当前不能刷新，则直接返回
      }

      canUpRefresh = false // 将刷新状态设置为false
      setTimeout(() => { canUpRefresh = true }, 1000) // 1秒后将刷新状态重新设置为true

      // 下面是原有的刷新逻辑，不需要修改
      console.log("上拉刷新被触发")
      //显示加载中
      sendLoadingLogo()
      // classifyList.value[0] = { categoryID:0,classifyTitle:"",classifyContent:"类别描述",currentPage:1,articleList:[{}] }
      if (index === 0) {
        let lateArticleList = await getDetailedArticleByJsonData({
          "sort": 1,
          "page_number": indexReFreshPage[index]+1,
          "articleContentMaxWord": 100,
          "select_title_num": 3
        })
        if(pushInClassifyListIndexByArticleList(index,lateArticleList)){
          indexReFreshPage[index]++
        }
      } else if (index === 1) {
        let lateArticleList = await getDetailedArticleByJsonData({
          "sort": 1,
          "page_number": indexReFreshPage[index]+1,
          "articleContentMaxWord": 100,
          "select_title_num": 1
        })
        if(pushInClassifyListIndexByArticleList(index,lateArticleList)){
          indexReFreshPage[index]++
        }
      } else if (index === 2) {
        let lateArticleList = await getDetailedArticleByJsonData({
          "sort": 1,
          "page_number": indexReFreshPage[index]+1,
          "articleContentMaxWord": 100,
          "select_title_num": 2
        })
        if(pushInClassifyListIndexByArticleList(index,lateArticleList)){
          indexReFreshPage[index]++
        }
      }
    }
    // 将数据 push到老数组中
    const pushInClassifyListIndexByArticleList= (index,articleList) =>{
      try{
        for (let i=0;i<articleList.length;i++){
          classifyList.value[index].articleList.push(articleList[i])
        }
        return true
      }catch (e){
        return false
      }
    }
    //发送加载
    const sendLoadingLogo = () => {
      uni.showToast({
        icon:'loading',
        title:'加载中',
        duration:350,
        mask:false,
        // position:'bottom'
      });
      // uni.showLoading({
      //   title: '加载中',
      //   mask:true
      // });
    }
    //--------------------------上拉---刷新- end------------------------------------------------------------------------------------------

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
      let allArticleListHaveValue = newValue.every((item) => item.articleList.length > 1);
      //
      // 如果所有articleList都有值，则设置loading为false
      if (allArticleListHaveValue) {
        scrollViewLoading.value = false;
      }
    }, { deep: true });

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
      aroundMove,
      refreshListWithThrottle,
      refreshOK,
      concernArticleNULL,
      upRefreshListWithThrottle,loading
    }
  },
};
</script>

<style scoped lang="less">
.articleList__container__body{
  background: #f5f5f5;
}
</style>
