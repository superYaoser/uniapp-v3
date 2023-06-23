<template>
  <view class="w100 h100" style="  overflow: hidden;">
    <view class="w100 h100">
      <view class="userConcern__container w100 h100">
        <!--        头部-->
        <view class="userConcern__container__header">

          <view style="height: var(--status-bar-height);"></view>
          <view class="userConcern__container__header--main">
            <view class="userConcern__container__header--button">
              <view @click="pageBack()" style="margin-left: 10px;"><uni-icons type="left" size="20"></uni-icons>
              </view>
            </view>

            <view class="userConcern__container__header--title">{{'全部关注'}}</view>
            <view class="userConcern__container__header--more"></view>
          </view>


        </view>

        <!--        身体-->
        <view class="userConcern__container__body">
          <view class="w100 h100">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #f5f5f5;`">
              <Loading v-if="!loading"></Loading>
              <view v-for="(item, index) in userList" :key="index" style="margin-bottom: 5px;" v-if="loading">
                <UserCard :user-obj="item"></UserCard>
              </view>
              <view class="disF-center" style="color: #a0a0a0;flex-direction: column;"><view>已经到底了...</view></view>
            </scroll-view>
          </view>
        </view>

      </view>
    </view>
  </view>
</template>

<script>

import {useStore} from 'vuex';
import {onMounted, ref, watch, computed} from "vue";
import UserCard from "@/components/user/UserCard";
import {getUserConcernListByUid} from '@/static/api/users'
import {
  onBackPress,onShow,onLoad
} from "@dcloudio/uni-app";
import Loading from "@/components/loading/Loading";


export default {
  components: {
    UserCard,Loading
  },
  setup() {
    let u_id = ref()
    let userList = ref()
    let store = useStore()
    let userObj = store.getters.getUser
    //加载
    let loading =ref(false)

    onLoad(async (option) => {
      loading.value = false
      //用户未登录 抱歉，直接不让你看主页
      if (!userObj.u_id){
        plus.nativeUI.toast(`请先登录`)
        console.log("用户未登录，需要返回")
        pageBack()
        return
      }
      let id = option.id;
      console.log(id)
      u_id.value = id
      let res = await getUserConcernListByUid(u_id.value)
      console.log(res)
      if (res.code ===200){
        userList.value = res.data
        console.log(userList)
      }else {

        //  获取失败
        plus.nativeUI.toast(`获取关注信息失败，原因:${res.message}`)
      }
      loading.value = true

    })
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }

    return {
      pageBack,userList,loading
    }
  }
}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";

.userConcern__container__body {
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 41px - var(--status-bar-height));
  margin-top: calc(41px + var(--status-bar-height));
}
.userConcern__container__header{
  width: 100%;
  background: #f3f3f3;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  &--main{
    height: 40px;
    display: flex;
    justify-items: center;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    view{
      width: 33%;
    }
  }

  &--title{
    display: flex;
    justify-items: center;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  &--more{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    align-content: center;
    margin-right: 10px;
  }
}

</style>
