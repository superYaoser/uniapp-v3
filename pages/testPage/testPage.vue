<template>

  <view style="background: #bebebe;padding: 5px;">
    <view class="status-bar-height"></view>
    <!--    <Comment></Comment>-->
    <!--驱蚊器问问去为额为邱琦雯顷刻间哈科进士第三空间活动空间哈后快-->
    <!--    <CommentExpand></CommentExpand>-->
    <!--    <CommentReplyWindow></CommentReplyWindow>-->
    <!--    <UserCard></UserCard>-->
    <view @tap="a">qweqweqwe</view>
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
  components: {
    CommentReplyWindow,
    Comment,
    UserCard
  },
  setup() {
    let socketTask
    onMounted(() => {

      socket.emit('message', {id:'qweqwe',age:12})

    })

      const a = () => {


        // 发送消息
        socketTask.send({
          data: 'ashdasjkdhadsjk',
          success(res) {
            console.log('发送成功')
            console.log(res)
          },
          fail(res) {
            console.log('发送失败')
            console.log(res)
          }
        });
      }
      return {
        a
      }
    }
  }
</script>

<style lang="less">

</style>
