<template>
  <view class="w100 h100">
    <view class="w100 h100">
      <view class="message__container w100 h100">
        <!--        头部-->
        <view class="message__container__header bg-efefef pageTitle-height pageTitle-top-fix-zindex999 w100">
          <view class="status-bar-height bg-efefef w100 disF-center"></view>
          <!--          标题-->
          <view class="message__container__header__title my-h3 disF-center w100" style="padding: 5px 0">
            消息
          </view>
        </view>

        <!--        身体-->
        <view class="message__container__body">
          <NoLogin v-if="!loginStatus"></NoLogin>
          <view class="w100 h100" v-else>
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #ffffff;`"
                         refresher-enabled="true" refresher-background="#f5f5f5" @refresherrefresh="refreshListWithThrottle()"
                         :refresher-triggered="refreshOK">
              <MessageCard :data="{
                headImg:'http://43.143.240.217:3000/api/download/images/action.png',
                name:'互动消息',
                message:actionMessageList?actionMessageList[actionMessageList.length - 1].message_content:'没有最新的信息',
                time:actionMessageList?formatDate(actionMessageList[actionMessageList.length - 1].create_time):'',
                num:actionMessageList?actionMessageList.length:null
              }"
              :id="'action'"
              v-if="leading"></MessageCard>
              <MessageCard @click.stop :data="{
                headImg:'http://43.143.240.217:3000/api/download/images/action.png',
                name:'互动消息',
                message:actionMessageList?actionMessageList[actionMessageList.length - 1].message_content:'没有最新的信息',
                time:actionMessageList?formatDate(actionMessageList[actionMessageList.length - 1].create_time):'',
                num:actionMessageList?actionMessageList.length:null
              }"
                           :id="'action'"
                           v-else></MessageCard>
<!--------------互动消息结束------------>

              <MessageCard :data="{
                headImg:'https://i0.hdslb.com/bfs/face/bd6d1a14ea10a3f7d2ca219544e03c929d2b823d.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp',
                name:'Yaoser',
                message:'暂未开放私信功能',
                time:'23-6-20',
                num:1
              }"
              :id="'123'"></MessageCard>
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
import MessageCard from "@/components/message/MessageCard";
import {addActionMessage,getNMessageByReceiveUid,updateReadMessageByReceiveId} from '@/static/api/message'
import {getUserInfoById} from '@/static/api/users'
import {formatDate, formatTimestamp, PushMessageNotificationBar} from '@/static/utils/globalConifg'
import {
  onBackPress,onShow
} from "@dcloudio/uni-app";
import NoLogin from "@/components/noLogin/NoLogin";

export default {
  components: {
    MessageCard,NoLogin
  },
  props: {
    loginStatus: Boolean,
  },
  setup(props){
    let loginStatus = ref(props.loginStatus)
    let store
    store = useStore()
    let login_u_id = store.getters.getUser
    login_u_id = login_u_id.u_id

    //是否下拉刷新完毕
    let refreshOK = ref(false)
    //下拉刷新列表
    let canRefresh = true // 初始状态为true表示可以刷新
    const refreshListWithThrottle = async () => {
      // 下面是原有的刷新逻辑，不需要修改
      refreshOK.value = true
      setTimeout(() => { refreshOK.value = false
        uni.$emit('home_articleList_change', {data: classifyList.value})
      }, 1100) // 1.5秒后将刷新状态重新设置为true
      if (!canRefresh){
        console.log("当前不能刷新")

        return // 如果当前不能刷新，则直接返回
      }

      canRefresh = false // 将刷新状态设置为false
      setTimeout(() => { canRefresh = true }, 1000) // 1.5秒后将刷新状态重新设置为true

      // 下面是原有的刷新逻辑，不需要修改
      console.log("下拉刷新被触发")
      await initializeInteractiveInformation()
      plus.nativeUI.toast(`已刷新`)
    }
//*********************互动消息************************************************
    let actionMessageList = ref()

    //初始化状态
    let leading = ref(false)


    uni.$on('message_action',async (e)=>{
      let res =await getUserInfoById(e.data.send_user_id)
      let head = ''
      if (res.code ===200){
        head = res.data.u_head
      }
      let data = e.data
      console.log(data)
      if (e.data.receive_user_id===login_u_id){
        PushMessageNotificationBar(head,data.content)
        plus.nativeUI.toast(`${data.content}`)
        await initializeInteractiveInformation(login_u_id)
      }
      head=''
    })

    //初始化 互动信息
    const initializeInteractiveInformation = async (login_u_id)=>{
      leading.value = false
      let res =  await getNMessageByReceiveUid(login_u_id)
      console.log(res)
      if (res.code ===200){
        actionMessageList.value = res.data
        console.log(actionMessageList)
        if (actionMessageList.value){
          uni.$emit('received_new_information',{
            data :true
          })
        }else {
          uni.$emit('received_new_information',{
            data :false
          })
        }
      }else {
        uni.$emit('received_new_information',{
          data :false
        })
      }
      leading.value = true
    }
    onShow(()=>{

      initializeInteractiveInformation(login_u_id)
    })

    onMounted(() => {

      initializeInteractiveInformation(login_u_id)
    })


    return {
      actionMessageList,formatDate,leading,loginStatus,
      refreshListWithThrottle,refreshOK
    }
  }
}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";

.message__container__body {
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 5vh - @My-TabBar-H - var(--status-bar-height));
  margin-top: calc(5vh + var(--status-bar-height));
  position: static;
}

</style>
