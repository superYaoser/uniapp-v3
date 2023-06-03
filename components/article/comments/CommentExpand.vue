<template>
<view style="height: 100vh;width: 100vw;background: rgba(0,0,0,0.07);position: fixed;z-index: 99;top: 0;left: 0;overflow: hidden" @tap="expandClose()">
  <view class="commentExpand" style="position: relative">
    <view class="commentExpand__container">
      <view class="commentExpand__container__header" @tap.stop>

        <view class="commentExpand__container__header--close" @tap="expandClose()">
          <uni-icons type="closeempty" size="20"></uni-icons>
        </view>
        <view class="commentExpand__container__header--floor">{{floor_num}}楼评论</view>
        <view class="commentExpand__container__header--more">
          <uni-icons type="more" size="20"></uni-icons>
        </view>
      </view>
      <view class="commentExpand__container__body" @tap.stop>
        <scroll-view scroll-y="true" style="height: 100%">

          <view v-for="(item1, index1) in commentList" :key="index1">
            <CommentCard :need_small_window="false" :comment-obj="item1"></CommentCard>
          </view>

        </scroll-view>
      </view>
    </view>
  </view>
</view>
</template>

<script>
import CommentCard from "@/components/article/comments/CommentCard";
import {onMounted, ref} from "vue";
import {getCommentPosterityById,getCommentById} from '@/static/api/act'
export default {
  components: {CommentCard},
  props: {
    commentObj: Object,
    floor_num: Number,
  },
  setup(props){
    //评论对象 props 的
    let commentObj = ref()
    commentObj.value = props.commentObj

    //评论列表
    let commentList = ref()

    //初始化
    const initializeCommentList =async (id) => {
      let res = await getCommentPosterityById(id)
      if (res.code === 200){
        commentList.value = res.data
      }
    }
    //
    //楼层
    let floor_num = ref(0)
    floor_num.value = props.floor_num
    //关闭事件
    const expandClose=()=>{
      console.log('用户在评论回复窗口界面 触发关闭')
      uni.$emit('commentExpand_close')
    }
    onMounted(async () => {
      await initializeCommentList(commentObj.value.comment_id)
    })
    return{
      expandClose,
      floor_num,
      commentList
    }
  }
}
</script>

<style scoped lang="less">
.commentExpand{
  margin-top: calc(41px + var(--status-bar-height));;
  &__container{
    &__header{
      font-size: 0.9rem;
      font-weight: bold;
      background: #FFFFFF;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 40px;
      border-bottom: 0.01875rem #ececec solid;
      view{
        margin: 0 0.725rem;
      }
      &--close{

      }
    }

    &__body{
      background: #FFFFFF;
      //height: 100%;
      height: calc(100vh - var(--status-bar-height) - 42px - 42px);
    }

  }
}

</style>
