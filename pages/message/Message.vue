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
          <view class="w100 h100">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #ffffff;`"
                         refresher-enabled="true" refresher-background="#ffffff">
              <MessageCard :data="{
                headImg:'http://114.115.220.47:3000/api/download/images/action.png',
                name:'互动消息',
                message:actionMessageList?actionMessageList[actionMessageList.length - 1].message_content:'没有最新的信息',
                time:actionMessageList?formatDate(actionMessageList[actionMessageList.length - 1].create_time):'',
                num:actionMessageList?actionMessageList.length:null
              }"
              :id="'action'"></MessageCard>
              <MessageCard :data="{
                headImg:'http://114.115.220.47:3000/api/download/images/action.png',
                name:'气温',
                message:'气温',
                time:'2023-6-19',
                num:4
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
import {formatDate, formatTimestamp} from '@/static/utils/globalConifg'
import {
  onBackPress,onShow
} from "@dcloudio/uni-app";

export default {
  components: {
    MessageCard
  },
  setup() {
    let store
    let login_u_id
//*********************互动消息************************************************
    let actionMessageList = ref()


    //初始化用户信息
    const initializeUserStore =()=>{
      store = useStore()
      login_u_id = store.getters.getUser
      login_u_id = login_u_id.u_id
    }

    //初始化 互动信息
    const initializeInteractiveInformation = async (login_u_id)=>{
      let res =  await getNMessageByReceiveUid(login_u_id)
      console.log(res)
      if (res.code ===200){
        actionMessageList.value = res.data
        console.log(actionMessageList)
      }else {

      }
    }
    onShow(()=>{
      initializeInteractiveInformation(login_u_id)
    })

    onMounted(() => {
      initializeUserStore()

      initializeInteractiveInformation(login_u_id)
    })


    return {
      actionMessageList,formatDate,
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
