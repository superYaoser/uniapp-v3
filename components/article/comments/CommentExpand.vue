<template>
<view style="height: 100vh;width: 100vw;background: rgba(232,22,22,0.3);position: absolute;z-index: 99;top: 0;left: 0;overflow: hidden">
  <view class="commentExpand" style="position: relative">
    <view class="commentExpand__container">
      <view class="commentExpand__container__header">

        <view class="commentExpand__container__header--close">
          <uni-icons type="closeempty" size="20"></uni-icons>
        </view>
        <view class="commentExpand__container__header--floor">{{'1'}}楼评论</view>
        <view class="commentExpand__container__header--more">
          <uni-icons type="more" size="20"></uni-icons>
        </view>
      </view>
      <view class="commentExpand__container__body">
        <scroll-view scroll-y="true" style="height: 100%">
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
          <CommentCard></CommentCard>
        </scroll-view>
      </view>
    </view>
  </view>
</view>
</template>

<script>
import CommentCard from "@/components/article/comments/CommentCard";
export default {
  components: {CommentCard}
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
