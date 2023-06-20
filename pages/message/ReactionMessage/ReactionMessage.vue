<template>
  <view class="w100 h100" style="  overflow: hidden;">
    <view class="w100 h100">
      <view class="reactionMsg__container w100 h100">
        <!--        头部-->
        <view class="reactionMsg__container__header">

          <view style="height: var(--status-bar-height);"></view>
          <view class="reactionMsg__container__header--main">
            <view class="reactionMsg__container__header--button">
              <view @click="pageBack()" style="margin-left: 10px;"><uni-icons type="left" size="20"></uni-icons>
              </view>
            </view>

            <view class="reactionMsg__container__header--title">{{'全部消息'}}</view>
            <view class="reactionMsg__container__header--more"></view>
          </view>


        </view>

        <!--        身体-->
        <view class="reactionMsg__container__body">
          <view class="w100 h100">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #ffffff;`">
              <ReactionMsgCard v-for="(item,index) in actionMessageList" :data="item" ></ReactionMsgCard>
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
import ReactionMsgCard from "@/components/message/ReactionMsgCard";
import {addActionMessage,getNMessageByReceiveUid,updateReadMessageByReceiveId,getAllMessageByReceiveUid} from '@/static/api/message'
import {
  onBackPress,onShow,onLoad
} from "@dcloudio/uni-app";

export default {
  components: {
    ReactionMsgCard
  },
  setup() {
    let u_id = ref()
    let actionMessageList = ref()
    onMounted(() => {

    })
    onLoad(async (option) => {
      let id = option.id;
      console.log(id)
      u_id.value = id
      let res = await getAllMessageByReceiveUid(id)
      console.log(res)
      if (res.code ===200){
        actionMessageList.value = res.data
        console.log(actionMessageList)
      }else {

      //  获取失败

      }
      let res1 = await updateReadMessageByReceiveId(id)
      if (res1.code ===200){

       // 用户全部互动信息标记为 已读了

      }




    })
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }

    return {
      pageBack,actionMessageList
    }
  }
}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";

.reactionMsg__container__body {
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 41px - var(--status-bar-height));
  margin-top: calc(41px + var(--status-bar-height));
}
.reactionMsg__container__header{
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
