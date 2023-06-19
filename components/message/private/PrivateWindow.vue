<template>
<view style="width: 100%;">
<view class="privateWindow">
  <view class="privateWindow__container">

    <view class="privateWindow__container__header">

    </view>

    <view class="privateWindow__container__body">

      <!-- Left -->
      <view class="User1">
        <view>
          <image src="https://static.runoob.com/images/mix/img_avatar.png"/>
        </view>
        <view>
          <view class="left_triangle"></view>
          <text> hello, man! </text>
        </view>
      </view>
      <!-- Right -->
      <view class="User2">
        <view>
          <image src="https://static.runoob.com/images/mix/img_avatar.png"/>
        </view>
        <view>
          <view class="right_triangle"></view>
          <text> hello world </text>
        </view>
      </view>

    </view>

  </view>
</view>
</view>
</template>

<script>
export default {
  name: "PrivateWindow"
}
</script>

<style scoped>


.User1{
  clear:both;
}
.User1 view:nth-of-type(1){
  float: left;
}
.User1 view:nth-of-type(2){
  background-color: aquamarine;
  float: left;
  margin: 0 20px 10px 15px;
  padding: 10px 10px 10px 0px;
  border-radius:7px;
}

.User2 view:first-child image,
.User1 view:first-child image{
  width:50px;
  height: 50px;
}

.User2{
  clear:both;
}
.User2 view:nth-child(1){
  float: right;
}
.User2 view:nth-of-type(2){
  float:right;
  background-color: gold;
  margin: 0 10px 10px 20px;
  padding: 10px 0px 10px 10px;
  border-radius:7px;
}

.left_triangle{
  height:0px;
  width:0px;
  border-width:8px;
  border-style:solid;
  border-color:transparent aquamarine transparent transparent;
  position: relative;
  left:-16px;
  top:3px;
}

.right_triangle{
  height:0px;
  width:0px;
  border-width:8px;
  border-style:solid;
  border-color:transparent transparent transparent gold;
  position: relative;
  right:-16px;
  top:3px;
}
</style>
