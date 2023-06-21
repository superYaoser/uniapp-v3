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
                         refresher-enabled="true" refresher-background="#ffffff">
              <MessageCard :data="{
                headImg:'http://114.115.220.47:3000/api/download/images/action.png',
                name:'互动消息',
                message:actionMessageList?actionMessageList[actionMessageList.length - 1].message_content:'没有最新的信息',
                time:actionMessageList?formatDate(actionMessageList[actionMessageList.length - 1].create_time):'',
                num:actionMessageList?actionMessageList.length:null
              }"
              :id="'action'"
              v-if="leading"></MessageCard>
              <MessageCard @click.stop :data="{
                headImg:'http://114.115.220.47:3000/api/download/images/action.png',
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

//*********************互动消息************************************************
    let actionMessageList = ref()

    //初始化状态
    let leading = ref(false)


    uni.$on('message_action',function(e){
      let data = e.data
      console.log(data)
      if (e.data.receive_user_id===login_u_id){
        PushMessageNotificationBar('',data.content)
        plus.nativeUI.toast(`${data.content}`)
        initializeInteractiveInformation(login_u_id)
      }
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
      actionMessageList,formatDate,leading,loginStatus
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
