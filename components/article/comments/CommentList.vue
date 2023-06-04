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

      <view class="comment__container__footer" v-if="!isReply&&!isExpand">
        <view class="comment__container__footer--comments">
          <view class="comment__container__footer--comments--search" @tap.stop="iWantSpeak()">

            <view>  我有话想说...</view>
          </view>
        </view>
        <view class="comment__container__footer--util">
          <view><uni-icons type="chatbubble" size="23"></uni-icons>
            {{ articleInfo.article_comment_num }}</view>

          <view><uni-icons type="fire" size="23"></uni-icons>{{ Number(articleInfo.article_hand_support_num) + Number(articleInfo.article_watch_num) + Number(articleInfo.article_comment_num)}}</view>


          <view><uni-icons type="hand-up" size="23"></uni-icons>
            {{ articleInfo.article_hand_support_num }}</view>
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
import {getArticleByID} from "@/static/api/article";
import {
  onBackPress
} from "@dcloudio/uni-app";
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
    //文章信息
    let articleInfo = ref()

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

    //初始化
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

      //获取文章信息
      await getArticleByID(article_id).then(res => {
        console.log(res)
        if (res.code === 200) {
          //赋值文章信息
          articleInfo.value = res.data[0]
        }else {
        }
      })
    }
    //点击我有话想说
    const iWantSpeak=()=>{
      let obj={
        comment_id:null,
        comment_user_id:articleInfo.value.article_user_id,
      }
      uni.$emit('commentCard_replyComment', {
        data: obj
      })
    }
    onMounted(async () => {

      await initialize()
    })
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }
    //监听用户触发返回后处理请求
    onBackPress((e) => {
      console.log(e);
      console.log('用户在详细文章界面按了返回键盘');
//backbutton 是点击物理按键返回，navigateBack是uniapp中的返回（比如左上角的返回箭头）
      // 触发返回就会调用此方法，这里实现的是禁用物理返回，顶部导航栏的自定义返回 uni.navigateBack 仍可使用
      if (e.from === 'backbutton') {
        console.log(isReply.value)
        if (isReply.value){
          uni.$emit('comment_reply_window_close', {data: true})
          return true;
        }
        if (isExpand.value){
          uni.$emit('commentExpand_close',)
          return true;
        }
          pageBack()
          return true;
      } else if (e.from === 'navigateBack') {
        return false;
      }
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
      article_id,articleInfo,iWantSpeak
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
    &__footer{
      display: flex;
      align-items: center;
      background: #f3f3f3;
      height: 40px;
      width: 100%;
      position: fixed;
      z-index: 9;
      bottom: 0;
      left: 0;
      &--comments{

        &--search{

          margin-left: 20px;
          view{
            width: 200px;
            height: 25px;
            background: #FFFFFF;
            border: 1px #efefef solid;
            border-radius: 5px;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            color: silver;
          }
        }
      }
      &--util{
        display: flex;
        align-items: center;

        justify-content: space-around;
        color: #9d9d9d;
        font-size: 0.650rem;
        width: calc(100% - 210px);
        view{
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        view:last-child{
          margin-right: 0.9375rem;
        }
      }
    }
  }
}
</style>
