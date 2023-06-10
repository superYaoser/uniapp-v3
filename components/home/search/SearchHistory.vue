<template>
<view style="height: 20vh;width: 100vw;padding: 15rpx">
  <view class="searchHistory__container">
    <view class="searchHistory__container__body">
      <view class="searchHistory__container__body__history">
        <view class="searchHistory__container__body__history__user">
          <view class="searchHistory__container__body__history__user--header searchHistory__container__body__history--header">

            <text>历史搜索</text>
          </view>
          <view class="searchHistory__container__body__history__user--body searchHistory__container__body__history--body">
            <uni-grid :column="3" :showBorder="false"  :square="false" :highlight="false">
              <uni-grid-item v-for="(item, index) in userSearchList" :key="index">
                <view @tap.stop="tapSearchTerms(item.search_terms)" class="searchHistory__container__body__history--word bg-efefef"
                      style="width: 50%;border-radius: 5rpx;height: 1.3rem;display: flex;align-items: center;justify-content: center;justify-items: center;margin-left: 20rpx">
                  <text class="uni-text-truncation">{{item.search_terms}}</text>
                </view>
              </uni-grid-item>
            </uni-grid>
          </view>

        </view>
        <view class="searchHistory__container__body__history__system">
          <view class="searchHistory__container__body__history__system--header searchHistory__container__body__history--header">
            <text>系统热搜</text>
          </view>
          <view class="searchHistory__container__body__history__system--body searchHistory__container__body__history--body">
            <uni-grid :column="3" :showBorder="false"  :square="false" :highlight="false">
              <uni-grid-item v-for="(item, index) in systemHotList" :key="index">
                <view style="display: flex;align-items: center">
                  <view @tap.stop="tapSearchTerms(item.search_terms)" class="searchHistory__container__body__history--word">
                  <text class="uni-text-truncation">{{item.search_terms}}</text><uni-icons type="fire-filled" size="0.8125rem" color="red" style="margin-left: 10rpx;"></uni-icons>
                </view>
                </view>

              </uni-grid-item>
            </uni-grid>
          </view>

        </view>
      </view>
    </view>
  </view>
</view>
</template>

<script>
import {getSearchSystem,getSearchUser,getSearchByTerm} from '@/static/api/search'
import {onMounted, ref} from "vue";
import {useStore} from 'vuex';
export default {
setup(props) {
  const store = useStore()
  // 用户id
  let login_u_id = store.getters.getUser
  let u_id = login_u_id.u_id

  //  系统热搜
  let systemHotList = ref()
  //  用户搜索历史
  let userSearchList = ref()
  //初始化
  const initialize =async ()=>{
    let res1 = await getSearchSystem()
    if (res1.code===200){
      systemHotList.value = res1.data
    }else {
      plus.nativeUI.toast(`获取系统热搜失败`)
    }
    let res2 = await getSearchUser(u_id)
    console.log(res2)
    if (res2.code===200){
      userSearchList.value = res2.data
    }else {
      plus.nativeUI.toast(`获取用户热搜失败`)
    }
    // return
  }
  //点击搜索词
  const tapSearchTerms=(search_terms)=>{
    console.log("点击了搜索栏"+search_terms)
    uni.$emit('searchHistory_tap', {word: search_terms})
  }
  onMounted(async ()=>{
    await initialize()
  })

  return{
    systemHotList,tapSearchTerms,userSearchList
  }
}
}
</script>

<style scoped lang="less">
.searchHistory__container{
  &__body{

    &__history{

      &__user{

        &--header{

        }
        &__body{


        }
      }

      &__system{

        &--header{

        }
        &__body{

        }
      }
      &--word{
        font-size: 0.8125rem;
        color: #2C405A;
        margin-bottom: 15rpx;
        display: flex;
        align-items: center;
      }
      &--header{
        font-size: 0.9125rem;
        margin-bottom: 15rpx;
      }
      &--body{
        margin-bottom: 30rpx;
      }
    }
  }
}
.uni-text-truncation {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
