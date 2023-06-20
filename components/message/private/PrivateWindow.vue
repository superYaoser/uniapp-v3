<template>
<view style="margin-top: 30rpx;padding: 20rpx">
<view class="privateWindow">
  <view class="privateWindow__container">

    <view class="privateWindow__container__header">

    </view>

    <view class="privateWindow__container__body">

      <!-- Left -->
      <view :class="position===1?'User1':'User2'">
        <view>
          <view class="privateWindow__container__body--img" style="background-image: url('https://i0.hdslb.com/bfs/face/bd6d1a14ea10a3f7d2ca219544e03c929d2b823d.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp')"/>
        </view>
        <view>
          <view :class="position===1?'left_triangle':'right_triangle'"></view>
          <text> 你好~ </text>
        </view>
      </view>

    </view>

  </view>
</view>
</view>
</template>

<script>
import {ref} from "vue";

export default {
  name: "PrivateWindow",
  props: {
    position: Number,
    user:Object,
    time:String,
  },
  setup(props){
    let position = ref(props.position)

    return{
      position
    }
  }
}
</script>

<style scoped>
.privateWindow__container__body--img{
  width: 70rpx;
  height: 70rpx;
  background-repeat: no-repeat;
  border-radius: 50%;
  border: 0.0375rem silver solid;
  /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
  background-size: cover;
  position: relative;
  background-position: center;
}

.User1{
  clear:both;
}
.User1 view:nth-of-type(1){
  float: left;
}
.User1 view:nth-of-type(2){
  background-color: #f1f1f1;
  float: left;
  margin: 0 20px 10px 15px;
  padding: 10px 10px 10px 0px;
  border-radius:7px;
}

.User2{
  clear:both;
}
.User2 view:nth-child(1){
  float: right;
}
.User2 view:nth-of-type(2){
  float:right;
  background-color: #f1f1f1;
  margin: 0 10px 10px 20px;
  padding: 10px 0px 10px 10px;
  border-radius:7px;
}

.left_triangle{
  height:0px;
  width:0px;
  border-width:8px;
  border-style:solid;
  border-color:transparent #f1f1f1 transparent transparent;
  position: relative;
  left:-16px;
  top:3px;
}

.right_triangle{
  height:0px;
  width:0px;
  border-width:8px;
  border-style:solid;
  border-color:transparent transparent transparent #f1f1f1;
  position: relative;
  right:-16px;
  top:3px;
}
</style>
