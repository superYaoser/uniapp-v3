<template>
  <view style="width: 100vw;">

    <view class="user__container">

      <view class="user__container__header">

      </view>
      <view class="user__container__body" style="height: 100vh;overflow: hidden">
        <Loading v-if="!loading"></Loading>
        <UserDetail :user-obj="needUserObj"
                    :need-edit="false"
                    :need-follow="needFollow"
                    :need-break="true"
                    :need-login-out="false"
                    v-if="loading"></UserDetail>
      </view>
    </view>
  </view>
</template>

<script>
import UserDetail from "@/components/user/UserDetail";
import {useStore} from 'vuex';
import {onMounted, ref, watch, computed} from "vue";
import MessageCard from "@/components/message/MessageCard";
import {getUserDetailBy} from '@/static/api/users'
import {formatDate, formatTimestamp, PushMessageNotificationBar} from '@/static/utils/globalConifg'
import {
  onBackPress,onShow,onLoad
} from "@dcloudio/uni-app";
import NoLogin from "@/components/noLogin/NoLogin";
import Loading from "@/components/loading/Loading";
export default {
  components:{
    UserDetail,Loading
  },
  setup(){
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }
    //加载
    let loading =ref(false)

    let u_id = ref()
    let store = useStore()
    let userObj = store.getters.getUser
    let needUserObj = ref()

    //是否需要关注按钮 就是是不是自己
    let needFollow = ref(true)

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
      u_id.value = id
      if (u_id.value ==userObj.u_id){
        needFollow.value = false
      }
      let res = await getUserDetailBy(u_id.value)
      console.log(res)
      if (res.code ===200){
        needUserObj.value = res.data
      }else {
        plus.nativeUI.toast(`获取用户信息失败，原因:${res.message}`)
      }
      loading.value = true
    })


    return{
      needUserObj,needFollow,loading
    }
  }
}
</script>

<style scoped lang="less">

</style>
