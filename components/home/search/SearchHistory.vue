<template>
<view style="height: 15vh;width: 100vw">
  <view class="searchHistory__container">
    <view class="searchHistory__container__body">
      <view class="searchHistory__container__body__history">
        <view class="searchHistory__container__body__history__user">
          <view class="searchHistory__container__body__history__user--header">

            <text>历史搜索</text>
          </view>
          <view class="searchHistory__container__body__history__user--body">
            <uni-grid :column="3" :showBorder="false"  :square="false" :highlight="false">
              <uni-grid-item v-for="(item, index) in userSearchList" :key="index">
                <view @tap.stop="tapSearchTerms(item.search_terms)">
                  {{item.search_terms}}
                </view>
              </uni-grid-item>
            </uni-grid>
          </view>

        </view>
        <view class="searchHistory__container__body__history__system">
          <view class="searchHistory__container__body__history__system--header">
            <text>系统热搜</text>
          </view>
          <view class="searchHistory__container__body__history__system--body">
            <uni-grid :column="3" :showBorder="false"  :square="false" :highlight="false">
              <uni-grid-item v-for="(item, index) in systemHotList" :key="index">
                <view @tap.stop="tapSearchTerms(item.search_terms)">
                  {{item.search_terms}}
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
  // let u_id = login_u_id.u_id
  let u_id = 1

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
    console.log("点击了搜索栏")
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
    }
  }
}
</style>
