<template>
  <view class="w100 h100">
    <view class="disF-center" v-if="searchResult===' '" style="flex-direction: column;margin-top: 40%">
      <image src="./static/images/utils/blank_page.png"></image>
      <view style="color: #a0a0a0">没有任何搜索结果~...</view>
    </view>
    <view class="actives__container w100 h100" v-if="searchResult!==' '">
      <!--          导航-->
      <view class="header__nav bg-efefef">
        <view class="header__nav__container">
          <view class="header__nav__container--option" @tap="changeCurrentNavPage(0)"
                :style="articleNavIndex===0?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">
            文章
          </view>
          <view class="header__nav__container--option" @tap="changeCurrentNavPage(1)"
                :style="articleNavIndex===1?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">
            用户
          </view>
        </view>
      </view>
      <swiper style='width: 100%;height: 100%' :autoplay="false" @change="swiperItemChange($event)"
              :current="clickNavIndex" v-if="!loading">

        <swiper-item>
          <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #f5f5f5;`">
            <view class="articleList__container__body w100" :style="'padding-top: 2px;padding-bottom: 5px;'">
              <view class="disF-center" v-if="articleList.length<1" style="flex-direction: column;margin-top: 40%">
                <image src="./static/images/utils/blank_page.png"></image>
                <view style="color: #a0a0a0">没有任何文章搜索结果~...</view>
              </view>
              <view v-for="(item, index) in articleList" :key="index" style="margin-bottom: 5px;">
                <ArticleCard :need-follow-model="true" :article-data="item"></ArticleCard>
              </view>
              <view class="disF-center" style="color: #a0a0a0;flex-direction: column;"><view>已经到底了...</view></view>
            </view>
          </scroll-view>
        </swiper-item>

        <swiper-item>
          <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #f5f5f5;`">
            <view class="articleList__container__body w100" :style="'padding-top: 2px;padding-bottom: 5px;'">
              <view class="disF-center" v-if="userList.length<1" style="flex-direction: column;margin-top: 40%">
                <image src="./static/images/utils/blank_page.png"></image>
                <view style="color: #a0a0a0">没有任何用户搜索结果~...</view>
              </view>
              <view v-for="(item, index) in userList" :key="index" style="margin-bottom: 5px;">
                <UserCard :user-obj="item"></UserCard>
              </view>
              <view class="disF-center" style="color: #a0a0a0;flex-direction: column;"><view>已经到底了...</view></view>
            </view>
          </scroll-view>
        </swiper-item>

      </swiper>
    </view>
  </view>
</template>
<script>
import {onMounted, ref} from "vue";
import {getUserDetailBy,} from '@/static/api/users'
import {getArticleDetailByID,} from '@/static/api/article'
import ArticleCard from "@/components/article/ArticleCard";
import UserCard from "@/components/user/UserCard";
export default {
  props: {
    searchResult: Object
  },
  components:{
    ArticleCard,UserCard
  },
  setup(props) {

    // 父组件给的搜索结果
    let searchResult = ref()
    searchResult.value = props.searchResult
    // 用户信息列表
    let userList = ref([])
    //文章信息列表
    let articleList = ref([])
    // 初始化 目前只考虑到 1.2版本 只搜索  用户 和文章的情况
    const initialize = async ()=>{
      //初始化用户
      for (let i = 0;i<searchResult.value.user.length;i++){
        let res = await getUserDetailBy(searchResult.value.user[i].u_id)
        userList.value.push(res.data)
      }
      //初始化文章
      for (let i = 0;i<searchResult.value.article.length;i++){
        let res = await getArticleDetailByID(searchResult.value.article[i].article_id)
        articleList.value.push(res.data)
      }
      console.log(userList.value)
      console.log(articleList.value)
    }
    let loading = ref(true)
    onMounted(async () => {
      await initialize()
      loading.value = false
    })


    //监听用户是否再次发起搜索
    uni.$on('search_change', async function (e) {
      loading.value = true
      searchResult.value = e.searchResult;
      await initialize()
      loading.value = false
    })



    //监听 导航栏的 index变化 的功能
    let articleNavIndex = ref(0)
    let articleNavColor = '#131313'
    let unArticleNavColor = '#a2a3ab'
    uni.$on('searchResult_follow_nav_change', function (e) {
      articleNavIndex.value = e.currentNavIndex;
    })
    const changeCurrentNavPage = (page) => {
      uni.$emit('searchResult_nav_change', {page: page})
    }
    //用于用户点击了哪个导航跳转到哪个页面
    let clickNavIndex = ref()
    uni.$on('searchResult_nav_change', function (e) {
      clickNavIndex.value = e.page;
      console.log(clickNavIndex.value)
    })
    //记录当前页面 左右
    let currentIndex = ref()
    //左右改变
    const swiperItemChange = (e) => {
      currentIndex.value = e.detail.current
      uni.$emit('searchResult_follow_nav_change', {currentNavIndex: currentIndex.value})
    }
    return {
      articleNavIndex, articleNavColor, unArticleNavColor, changeCurrentNavPage, clickNavIndex, swiperItemChange,searchResult,
      articleList,userList,loading
    }
  }
}
</script>
<style scoped lang="less">
.header__nav {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 0;

  .header__nav__container {
    display: flex;

    view {
      font-size: 1rem;
      font-weight: inherit;
      margin: 0 10px;
    }
  }
}
</style>
