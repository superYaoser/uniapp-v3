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
export default {
  components:{
    CommentCard
  },
  props: {
    article_id: String,
  },
  setup(props){
  //  文章id
    let article_id = ref()
    article_id = props.article_id
    //评论列表
    let article_comment_list =ref()
    //空评论
    let empty_comment = ref(false)

    const initialize  = async () => {
      let res = await getCommentByArticleId(1680405408104)
      if (res.code ===200){
        article_comment_list.value = res.data.filter((item) => item.comment_father_id === null)
      }else if (res.code ===404){
        empty_comment.value = true
        plus.nativeUI.toast(`信息:${res.message}`)
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
      formatDate
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
