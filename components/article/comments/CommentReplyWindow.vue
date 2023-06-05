<template>
<view style="height: 100vh;width: 100vw;background: rgba(0,0,0,0.15);position: fixed;z-index: 999;top: 0;left: 0;overflow: hidden" @tap="windowClose">

  <view class="replyWindow" :style="'margin-top:calc(100vh - 175px - '+ keyHeight +')'">
    <view class="replyWindow__container" @tap.stop>
      <view class="replyWindow__container__header">
        <view style="color: silver;font-size: 0.8125rem">
          {{'回复：'}}{{reply_user_name}}
        </view>
      </view>
      <view class="replyWindow__container__body">

        <view class="replyWindow__container__body__input">
          <textarea  class="replyWindow__container__body__input--sub"
                     focus="true"
                 placeholder-class="replyWindow__container__body__input--sub"
                 :adjust-position="false" placeholder="我有话想说..."
          @input="inputComment"/>
        </view>
        <view class="replyWindow__container__body__option">
          <view class="replyWindow__container__body__option--other">

          </view>
          <view class="replyWindow__container__body__option--send" @tap.stop="sendComment()">发布</view>
        </view>

      </view>
    </view>
  </view>

</view>
</template>

<script>
import {onMounted, ref, watchEffect} from "vue";
import {
  onBackPress,onShow,onLoad
} from "@dcloudio/uni-app";
import {getUserInfoById} from '@/static/api/users'
import {getUserNameByUid} from '@/static/utils/globalConifg'
import {addComment, addWatchByArticleId, getCommentPosterityById} from "@/static/api/act";
import ArticleFun from "@/components/article/articleFun";
export default {
  props: {
    article_id: String,
    commentObj: Object,
    articleObj:Object,
  },
  setup(props){
    //键盘高度
    let keyHeight = ref()
    //评论对象
    let commentObj = ref()
    commentObj.value = props.commentObj
    //文章对象
    let articleObj = ref()
    articleObj.value = props.articleObj
    //回复的用户名
    let reply_user_name = ref()

    //判断是否发送中
    let sending = ref(false)

    onMounted(async () => {
      reply_user_name.value = await getUserNameByUid(commentObj.value.comment_user_id)
    })

    //关闭事件
    const windowClose=()=>{
      if (sending.value===true)
        return
      console.log('用户在评论回复窗口界面 触发关闭')
      uni.$emit('comment_reply_window_close', {data: true})
    }

    //接收输入
    let input_value = ref()
    //输入的时候 @input
    const inputComment = (e)=>{
      input_value.value = e.detail.value
    }

    //点击发布
    const sendComment = async ()=>{
      sending.value=true

      let res = await addComment(props.article_id,commentObj.value.comment_id,input_value.value)
      console.log(res)
      if (res.code===200){
        await setCommentByArticleId(props.article_id)
        if (res.data===commentObj.value.comment_id){
          uni.$emit('CommentCard_update', {id: res.data})
          uni.$emit('CommentExpand_update', {id: commentObj.value.comment_id})
        }else {
          uni.$emit('CommentCard_update', {id: commentObj.value.comment_id})
          uni.$emit('CommentCard_update', {id: res.data})
          uni.$emit('CommentExpand_update', {id: commentObj.value.comment_id})
        }

        uni.$emit('CommentList_update', {id: commentObj.value.comment_id})
        plus.nativeUI.toast(`评论成功`)
        sending.value=false
        windowClose()
      }else {
        plus.nativeUI.toast(`评论失败
        错误代码：${res.code}
        message:${res.message}`)
        sending.value=false
        windowClose()
      }
      sending.value=false
    }

//  监听键盘高度变化
    uni.onKeyboardHeightChange((obj)=>{
      // 获取系统信息
      let _sysInfo = uni.getSystemInfoSync();
      let _heightDiff = _sysInfo.screenHeight - _sysInfo.windowHeight
      let _diff = obj.height - _heightDiff
      // 键盘高度
      keyHeight.value = (_diff > 0 ? _diff : 0) - 2 + "px";
    })

    //向文章卡 添加回复数 信息，后台已经添加，前台刷新一下，相当于
    const setCommentByArticleId= async (id)=>{
      try {
        ArticleFun.setArticleCardUpdate(null,id,{comment:++articleObj.value.article_comment_num})
      }catch (e){
        console.log('向文章卡 添加回复数 信息 记录失败')
      }
    }
    return{
      keyHeight,windowClose,getUserNameByUid,reply_user_name
      ,inputComment,input_value,sendComment
    }
  }
}
</script>

<style scoped>
.replyWindow{
  height: 160px;
  margin-top: calc(100vh - 170px);;
}
.replyWindow__container{
  height: 100%;
  background: #FFFFFF;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 5px 10px 8px 10px;
}
.replyWindow__container__header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  border-bottom: 0.01875rem #ececec solid;
}
.replyWindow__container__body{

}
.replyWindow__container__body__input{

}
.replyWindow__container__body__input--sub{
  font-size: 0.9375rem;
  height: 80px;
  margin: 5px 0;
}
.replyWindow__container__body__option{
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-top: 0.01875rem #ececec solid;
}
.replyWindow__container__body__option--send{
  color: #FFFFFF;
  font-size: 1rem;
  width: 50px;
  height: 30px;
  border-radius: 6px;
  margin-right: 10px;
  background: #13dbf9;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
