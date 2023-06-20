<template>
  <view style="width: 100%;height: 120rpx;background: #F5F5F5;padding: 10rpx;display: flex;align-items: center" @tap.stop="tapMessageCard">
    <view class="messageCard__body">
      <view class="messageCard__body__left">
        <view class="messageCard__body__head">
          <view class="messageCard__body__head--img" :style="'background-image: url('+ messageCardInfo.headImg +')'"></view>
        </view>
        <view class="messageCard__body__info">
          <view class="messageCard__body__info__name">
            <text>{{ messageCardInfo.name }}</text>
          </view>
          <view class="messageCard__body__info__message">
            <text>{{ messageCardInfo.message }}</text>
          </view>
        </view>
      </view>

      <view class="messageCard__body__right">

        <view class="messageCard__body__right--time">
          <text>{{ messageCardInfo.time }}</text>
        </view>

        <view class="messageCard__body__right--num" v-if="messageCardInfo.num!==null">
          <text>{{ messageCardInfo.num }}</text>
        </view>

      </view>
    </view>
  </view>
</template>

<script>
import {ref} from "vue";
import {useStore} from 'vuex';
import {formatDate} from '@/static/utils/globalConifg'

export default {
  name: "messageCard",
  props: {
    data: Object,
    id:String,
    u_id:String
  },
  setup(props){

    //记录实体信息的信息
    let messageCardInfo = ref(props.data);

    //对话id
    let id = ref(props.id);
    //用户id
    let store = useStore()
   let login_u_id = store.getters.getUser
    login_u_id = login_u_id.u_id



    const tapMessageCard =()=>{
      console.log("用户点击信息卡")
      if (id.value === 'action'){
        console.log("打开互动消息")
        uni.navigateTo({
          url: '/pages/message/ReactionMessage/ReactionMessage?id='+login_u_id
        })
      }else {
        uni.navigateTo({
          url: '/pages/message/PrivateMessage/PrivateMessage'
        })
      }
    }



    return{
      messageCardInfo,tapMessageCard
    }
  }
}
</script>

<style scoped lang="less">
.messageCard__body {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 样式规则 */

  &__left{
    display: flex;
    align-items: center;
  }

  &__head {
    height: 100rpx;
    display: flex;
    align-items: center;
    margin-right: 16rpx;

    /* 样式规则 */

    &--img {
      width: 100rpx;
      height: 100rpx;
      background-repeat: no-repeat;
      border-radius: 50%;
      border: 0.0375rem silver solid;
      /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
      background-size: cover;
      position: relative;
      background-position: center;
      //background-image: url("@/static/images/message/action.png");
    }
  }

  &__info {
    /* 样式规则 */


    &__name {
      /* 样式规则 */
      font-size: 35rpx;
      font-weight: inherit;
      margin-bottom: 10rpx;
    }

    &__message {
      /* 样式规则 */
      font-size: 25rpx;
      color: #9b9b9b;
    }
  }

  &__right {
    /* 样式规则 */
    margin-right: 40rpx;
    display: flex;
    align-items: center;

    &--num {
      /* 样式规则 */
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 10px;
      width: 15px;
      height: 15px;
      background: #e33232;
      color: #FFFFFF;
      font-size: 0.5625rem;
      border-radius: 50%;
      text-shadow: 0 0 5px #fb5f5f, 0 0 5px #ff1717;
    }

    &--time {

      /* 样式规则 */
      font-size: 25rpx;
      color: #9b9b9b;
    }
  }
}
</style>
