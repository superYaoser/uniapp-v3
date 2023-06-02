<template>
<view class="w100">

  <view class="comment w100">
    <view class="comment__container w100">
      <view class="comment__container__header disF-center">
        <view class="comment__container__header__option disF-center" style="justify-content: space-between;">
          <view class="comment__container__header__option--left disF-center">
            <view style="margin: 0 5px;margin-left: 10px">全部评论</view>
            <view style="margin: 0 5px">只看作者</view>
          </view>
          <view class="comment__container__header__option--right disF-center">
            <view style="margin: 0 5px">热门</view>
            <view style="margin: 0 5px">最早</view>
            <view style="margin: 0 5px;margin-right: 10px">最热</view>
          </view>
        </view>
      </view>

      <view class="comment__container__body">
        <CommentReplyWindow v-if="isReply" :comment-obj="reply_comment_obj" :article_id="article_id"></CommentReplyWindow>
        <CommentExpand v-if="isExpand" :floor_num="expand_floor_num" :comment-obj="expand_comment_obj"></CommentExpand>
        <view v-for="(item1, index1) in article_comment_list" :key="index1">
          <CommentCard :need_small_window="true" :comment-obj="item1" :floor_num="++index1"></CommentCard>
        </view>
      </view>



    </view>
  </view>
</view>
</template>

<script>
import CommentCard from "@/components/article/comments/CommentCard";
import {onMounted, ref} from "vue";
import {getUserNameByUid, getUserObjByUid,defaultHeadImgPath,formatDate} from '@/static/utils/globalConifg'
import {getCommentByArticleId, getCommentSonById} from '@/static/api/act'
import CommentExpand from "@/components/article/comments/CommentExpand";
import CommentReplyWindow from "@/components/article/comments/CommentReplyWindow";
export default {
  components:{
    CommentReplyWindow,
    CommentCard,CommentExpand
  },
  props: {
    article_id: String,
  },
  setup(props){
    //评论详细展开状态
    let isExpand =ref(false)
    //评论 回复功能的开关
    let isReply =ref(false)
    //展开的评论 楼层数
    let expand_floor_num =ref(1)
    //需要扩展的评论体
    let expand_comment_obj = ref()
    //需要 回复的评论体
    let reply_comment_obj = ref()
    //-----------------------------------------------------------------------------------
    uni.$on('commentCard_showExpand',function(e){
      let data = e.data
      expand_comment_obj.value = data
      expand_floor_num.value = e.floor_num
      isExpand.value=!isExpand.value
    })
    uni.$on('commentExpand_close',function(){
      isExpand.value=!isExpand.value
    })
    uni.$on('commentCard_replyComment', function(e){
      let data = e.data
      reply_comment_obj.value = data
      isReply.value=!isReply.value
    })
    uni.$on('comment_reply_window_close',function(){
      isReply.value=!isReply.value
    })
    //-----------------------------------------------------------------------------------
  //  文章id
    let article_id = ref()
    article_id = props.article_id
    //评论列表
    let article_comment_list =ref()
    //空评论
    let empty_comment = ref(false)

    const initialize  = async () => {

      let res = await getCommentByArticleId(article_id)
      console.log(res)
      if (res.code ===200){
        article_comment_list.value = res.data.filter((item) => item.comment_father_id === null)
      }else if (res.code ===404){
        empty_comment.value = true
        plus.nativeUI.toast(`信息:${res.message}<评论>`)
      }else{
        plus.nativeUI.toast(`加载评论列表出错
        代码：${res.code}
        信息:${res.message}`)
      }
    }
    onMounted(async () => {

      await initialize()
    })

    return{
      empty_comment,
      article_comment_list,
      formatDate,
      isExpand,
      expand_floor_num,
      expand_comment_obj,
      isReply,
      reply_comment_obj,
      article_id
    }
  }

}
</script>

<style scoped lang="less">
.comment{
  background: #FFFFFF;
  &__container{

    &__header{


      border-bottom: 1px #d5d5d5 solid;
      height: 40px;
      &__option{

        width: 100%;
        &--left{
          font-size: 0.8375rem;
        }
        &--right{
          font-size: 0.7125rem;
          color: #9e9e9e;
        }
      }

    }
  }
}
</style>
