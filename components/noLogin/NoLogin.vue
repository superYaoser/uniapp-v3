<template>
<view>

  <view style="background: #fff;text-align: center;">

    <image mode="widthFix" src="/static/images/noTask.gif" style="width: 100%;height: auto" v-if="imgChangeNumber===1"></image>

    <view style="font-size: 40rpx;color: #585858;margin-bottom: 20rpx">您还没有登录</view>
    <view class="nologin">
      <view class="nologin--button" @tap.stop="login">去登录</view>
    </view>

  </view>

</view>
</template>

<script>
import {ref} from "vue";

export default {
  name: "Nologin",
  methods:{
    login:function (){
      uni.navigateTo({
        url: '/pages/loginRegister/loginRegister'
      })
    }
  },
  props: {
    imgChange: Number,
  },
  setup(props){
    let imgChangeNumber = ref(1)
    if (props.imgChange){
      imgChangeNumber.value = props.imgChange
    }

    return{
      imgChangeNumber
    }
  }

}
</script>

<style scoped lang="less">
.nologin{
  display: flex;
  align-items: center;
  justify-items: center;
  justify-content: center;
  &--button {
    // 样式规则
    background: #13dbf9;
    border-radius: 10rpx;
    color: #FFFFFF;
    font-weight: bolder;
    width: 200rpx;
    height: 60rpx;
    display: flex;
    justify-content: center; /* 水平居中 */
    align-items: center; /* 垂直居中 */
  }
  &--button:active{
    background: #98f2ff;
  }
}

</style>
