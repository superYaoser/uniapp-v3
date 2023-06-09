<template>
  <view style="width: 100%;height: 120rpx;background: #FFFFFF;">
    <view class="userCard__container">

      <view class="userCard__container__body">

        <view class="userCard__container__body__left">
          <view class="userCard__container__body__left__head">
            <view class="userCard__container__body__left__head--img"></view>
          </view>
          <view class="userCard__container__body__left__info">
            <view class="userCard__container__body__left__info--name">

              印有之人
            </view>
            <view class="userCard__container__body__left__info--signature">
              我向阿松大
            </view>
            <view class="userCard__container__body__left__info--from">
              <text space="nbsp">来自：黑龙江</text>

            </view>
          </view>
        </view>

        <view class="userCard__container__body__right">
          <view class="userCard__container__body__right__follow">
            <view style="width: 100%;height: 100%;">
              <view class="userCard__container__body__right__follow--be" v-show="true">已关注</view>
              <view class="userCard__container__body__right__follow--no" v-show="false">+关注</view>
            </view>
          </view>
        </view>


      </view>
    </view>

  </view>
</template>

<script>
export default {
  props: {
    userObj: Object
  },
  setup() {

    return {}
  }
}
</script>

<style scoped lang="less">
.userCard__container {
  padding: 10rpx;

  &__body {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &__left {
      display: flex;
      align-items: center;

      &__head {

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
          // 样式
        }
      }
      &__info {
        max-width: 40vw;
        font-size: 27rpx;
        margin-left: 25rpx;

        &--name {

          // 样式
        }
        &--signature {
          font-size: 19rpx;
          // 样式
        }
        &--from {
          margin-top: 13rpx;
          font-size: 17rpx;
          // 样式
        }
      }
    }
    &__right {
      &__follow{
        width: 90rpx;
        height: 47rpx;
        font-size: 0.8125rem;
        margin-right: 30rpx;

        &--be,&--no{
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
        }
        &--be{
          border: 1px solid #bcbcbc;

          color: #bcbcbc;

        }

        &--no{
          border: 1px solid #46a7ff;

          color: #46a7ff;



        }

      }
      // 样式
    }
  }
}
</style>
