<template>
  <view style="width: 100%;height: 120rpx;background: #F5F5F5;padding: 10rpx;display: flex;align-items: center">
    <view class="messageCard__body">
      <view class="messageCard__body__left">
        <view class="messageCard__body__head">
          <view class="messageCard__body__head--img"></view>
        </view>
        <view class="messageCard__body__info">
          <view class="messageCard__body__info__name">
            <text>新朋友</text>
          </view>
          <view class="messageCard__body__info__message">
            <text>张三关注了你</text>
          </view>
        </view>
      </view>

      <view class="messageCard__body__right">

        <view class="messageCard__body__right--time">
          <text>5-9</text>
        </view>

        <view class="messageCard__body__right--num">
          <text>99</text>
        </view>

      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "messageCard"
}
</script>

<style scoped lang="less">
.messageCard__body {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 样式规则 */

  &__left{
    display: flex;
    align-items: center;
  }

  &__head {
    height: 100rpx;
    display: flex;
    align-items: center;
    margin-right: 16rpx;

    /* 样式规则 */

    &--img {
      width: 100rpx;
      height: 100rpx;
      background-repeat: no-repeat;
      border-radius: 50%;
      border: 0.0375rem silver solid;
      /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
      background-size: cover;
      position: relative;
      background-position: center;
      background-image: url('https://i2.hdslb.com/bfs/face/544c89e68f2b1f12ffcbb8b3c062a3328e8692d9.jpg@96w_96h.webp')
    }
  }

  &__info {
    /* 样式规则 */


    &__name {
      /* 样式规则 */
      font-size: 35rpx;
      font-weight: inherit;
      margin-bottom: 10rpx;
    }

    &__message {
      /* 样式规则 */
      font-size: 25rpx;
      color: #9b9b9b;
    }
  }

  &__right {
    /* 样式规则 */
    margin-right: 40rpx;

    &--num {
      /* 样式规则 */
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 10px;
      width: 15px;
      height: 15px;
      background: #e33232;
      color: #FFFFFF;
      font-size: 0.5625rem;
      border-radius: 50%;
      text-shadow: 0 0 5px #fb5f5f, 0 0 5px #ff1717;
      margin-top: 20rpx;
    }

    &--time {

      margin-top: 10rpx;
      /* 样式规则 */
      font-size: 25rpx;
      color: #9b9b9b;
    }
  }
}
</style>
