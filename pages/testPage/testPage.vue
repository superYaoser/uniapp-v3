<template>

  <view style="background: #bebebe;padding: 5px;">
    <view class="status-bar-height"></view>
    <!--    <Comment></Comment>-->
    <!--驱蚊器问问去为额为邱琦雯顷刻间哈科进士第三空间活动空间哈后快-->
    <!--    <CommentExpand></CommentExpand>-->
    <!--    <CommentReplyWindow></CommentReplyWindow>-->
    <!--    <UserCard></UserCard>-->
<!--    <view @tap="a">qweqweqwe</view>-->

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
</template>

<script>
import Comment from "@/components/article/comments/CommentList";
import CommentExpand from "@/components/article/comments/CommentExpand";
import CommentReplyWindow from "@/components/article/comments/CommentReplyWindow";
import UserCard from "@/components/user/UserCard";
import {onMounted} from "vue";

import socket from '@/static/socket/main.js'

export default {
  setup() {
    let socketTask
    onMounted(() => {
      socket.emit('message', '测试')
    })
    socket.on('allC',data=>{
      console.log(data)
    })

      const a = () => {


        // 发送消息
socket.emit('message', {id:'qweqwe',age:12})
      }
      return {
        a
      }
    }
  }
</script>

<style lang="less">
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
