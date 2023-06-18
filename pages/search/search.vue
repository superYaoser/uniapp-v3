<template>
  <view>
    <view class="search__container" style="overflow: hidden">
<!--      头部-->
      <view class="search__container__header bg-efefef">
        <view class="status-bar-height"></view>

        <view class="search__container__header__input">
          <!--        搜索图标-->
          <view class="search__container__header__input--icon">
            <uni-icons type="search" size="30rpx" color="#808080" style="margin-left: 20rpx;"></uni-icons>
          </view>
          <input  class="search__container__header__input--sub"
                  v-model="inputSearchDAta"
                     focus="true"
                     placeholder-class="search__container__header__input--sub"
                     :adjust-position="false" placeholder="搜点什么..."
                     @input="inputSearch"
                  @confirm="inputSearchDAta?sendSearch:null"/>
          <view class="search__container__header__input--cancel" @tap.stop="sendSearch">{{ inputSearchDAta? '搜索':'取消' }}</view>
        </view>
      </view>
      <view class="search__container__body">
        <SearchHistory v-if="!searchResult"></SearchHistory>
        <view class="search__container__body__result" v-if="searchResult">
          <SearchResult :search-result="searchResult" v-if="searching"></SearchResult>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  onBackPress
} from "@dcloudio/uni-app";
import SearchHistory from "@/components/home/search/SearchHistory";
import {ref} from "vue";
import {getSearchByTerm} from '@/static/api/search'
import SearchResult from "@/components/home/search/SearchResult";
export default {
  components:{
    SearchHistory,SearchResult
  },
  setup() {
    //用户接收搜索结果
    /*
    article: [
0:{article_id: 1}
1: {article_id: 1680405408108}
2: {article_id: 1680405408110}
]
user: []*/
    // 判断是否处于搜索中
    let searching =ref(true)
    let searchResult = ref()

    // 接收用户输入的搜索词
    let inputSearchDAta = ref()
    //输入的时候 @input
    const inputSearch = (e)=>{
      inputSearchDAta.value = e.detail.value
    }
    // 监听用户点击搜索历史
    uni.$on('searchHistory_tap',async function (e) {
      console.log("监听到用户点击了搜索历史")
      inputSearchDAta.value = e.word
      // await sendSearch()
    })
    //点击搜索
    const sendSearch = async () => {
      console.log("监听到用户点击了搜索历史")
      if (!inputSearchDAta.value) {
        pageBack()
      } else {
        console.log('用户搜索'+inputSearchDAta.value)
        try {
          searching.value = false
          let res = await getSearchByTerm(inputSearchDAta.value)
          if (res.code ===200){
            searchResult.value = res.data
            if (!searchResult.value){
              searchResult.value = ' '
            }
            searching.value = true
            uni.$emit('search_change', {searchResult: searchResult.value})
          }else {
            plus.nativeUI.toast(`搜索错误：${res.message}`)
          }
          inputSearchDAta.value = null
        }catch (e){
          plus.nativeUI.toast(`搜索报错：${e}`)
          inputSearchDAta.value = null
        }
      }
    }

    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }

    //监听用户触发返回后处理请求
    onBackPress((e) => {
      console.log('用户在搜索界面按了返回键盘');
//backbutton 是点击物理按键返回，navigateBack是uniapp中的返回（比如左上角的返回箭头）
      // 触发返回就会调用此方法，这里实现的是禁用物理返回，顶部导航栏的自定义返回 uni.navigateBack 仍可使用
      if (e.from === 'backbutton') {
        pageBack()
        return true;
      } else if (e.from === 'navigateBack') {
        return false;
      }
    })
    return{
      pageBack,inputSearch,sendSearch,inputSearchDAta,searchResult,searching
    }
  }
}
</script>

<style scoped lang="less">
.search__container{
  &__header{
    position: fixed;
  top: 0;
    width: 100vw;
    left: 0;
    &__input{
      height: 5vh;
      display: flex;
      align-items: center;
      width: 95vw;
      margin: 0 auto;

      &--icon{
        margin-left: 20rpx;
        background: #fbfbfb;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        height: 70%;
        border-top-left-radius:  10rpx;
        border-bottom-left-radius:10rpx;
      }
      &--sub{
        background: #fbfbfb;
        font-size: 26rpx;
        height: 70%;
        width: 80%;
        border-top-right-radius:  10rpx;
        border-bottom-right-radius:10rpx;
      }

      &--cancel{
        margin-left: 20rpx;
        font-size: 25rpx;
        right: 0;
      }
    }
  }
  &__body{
    background: #FFFFFF;
    height: calc(100vh - 5vh - var(--status-bar-height));
    margin-top: calc(5vh + var(--status-bar-height));
    &__result{
      width: 100%;
      height: 100%;
    }
  }
}

</style>
