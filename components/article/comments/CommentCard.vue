<template>
<!--  这个 模板卡 需要传入 {是否需要关注按钮} {评论id}-->
<view class="w100">
  <view class="commentCard__container">

    <view class="commentCard__container__header">

      <view class="commentCard__container__header--author">
        <view class="commentCard__container__header--author--head">
          <view class="commentCard__container__header--author--head--img">

          </view>
          <view class="commentCard__container__header--author--head--info">
            <view class="commentCard__container__header--author--head--info--top">
              <view class="commentCard__container__header--author--head--info--top--name">
                有心无心
              </view>
              <view class="commentCard__container__header--author--head--info--top--level">
                11
              </view>
            </view>
            <view class="commentCard__container__header--author--head--info--from">
              1F 来自佛罗里达州
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="commentCard__container__body">
      <view class="commentCard__container__body__container">
        <view></view>
        <view class="commentCard__container__body__container__content">
          <view class="commentCard__container__body__container__content--main">
            <view class="commentCard__container__body__container__content--main--reply">
              回复
              <text class="commentCard__container__body__container__content--main--reply--user">
                龟龟：
              </text>
            </view>
            作者写的文章太棒了吧！
          </view>
          <view class="commentCard__container__body__container__content--reply">
            <view class="commentCard__container__body__container__content--reply--common">
              <view class="commentCard__container__body__container__content--reply--common--author">
                太阳
                <view class="commentCard__container__body__container__content--reply--common--author--self">
                  作者
                </view>
              </view>
              ：你说的对1
            </view>
            <view class="commentCard__container__body__container__content--reply--common">
              太阳：你说的对2
            </view>
            <view class="commentCard__container__body__container__content--reply--more">全部5条评论</view>
          </view>
        </view>
        <view class="commentCard__container__body__container__interaction">
          <view class="commentCard__container__body__container__interaction--time">
            16小时前
          </view>
          <view class="commentCard__container__body__container__interaction--act">
            <view class="commentCard__container__body__container__interaction--act--comment">
              <uni-icons color='#999999' type="chatbubble" size="16" ></uni-icons>
<!--              <text>{{articleInfo.article_comment_num}}</text>-->
              <text>0</text>
            </view>

            <view class="commentCard__container__body__container__interaction--act--hand">
              <uni-icons color='#999999' type="hand-up" size="16"></uni-icons>
<!--              <text>{{articleInfo.article_hand_support_num}}</text>-->
              <text>0</text>
            </view>
          </view>
        </view>
      </view>

    </view>

  </view>
</view>
</template>

<script>
export default {

}
</script>

<style scoped lang="less">
.commentCard__container{

  padding: 10px 0 0.03125rem 10px;
  &__header{
    &--author{
      &--head{
        display: flex;
        align-items: center;
        &--img{
          width: 25px;
          height: 25px;
          background-repeat: no-repeat;
          border-radius: 50%;
          border: 0.0375rem silver solid;
          /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
          background-size: cover;
          position: relative;
          background-position: center;
          background: url("https://i0.hdslb.com/bfs/face/00be9d92f58e954a40573f56768fb5828658d148.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp");
        }
        &--info{
          margin-left: 8px;
          &--top{

            display: flex;
            align-items: center;
            color: #7f7f7f;
            &--name{
              font-size: 0.775rem;
            }
            &--level{
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: 10px;
              width: 12px;
              height: 12px;
              background: #ffdc00;
              color: #FFFFFF;
              font-size: 0.4625rem;
              border-radius: 50%;
              text-shadow: 0 0 5px #d1b259, 0 0 5px #d5ba3b;
            }
          }

          &--from{
            color: #7f7f7f;
            font-size: 0.675rem;
          }
        }
      }
    }
  }

  &__body{
    margin-top: 6px;
    width: 100%;
    &__container{
      display: flex;
      padding-left: 33px;
      flex-direction: column;
      &__content{
        font-size: 0.875rem;

        width: 100%;
        padding-right: 5px;
        &--main{
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          &--reply{
            display: flex;
            align-items: center;
            &--user{
              display: flex;
              align-items: center;
              font-weight: inherit;
              color: #6da7cc;
              margin-left: 0.2125rem;
            }
          }

        }
        &--reply{
          //width: 100%;
          background: #f4f4f4;
          border-radius: 5px;
          padding: 8px 6px;

          &--common{
            display: flex;
            align-items: center;
            &--author{
              display: flex;
              align-items: center;
              font-weight: inherit;
              color: #6da7cc;
              &--self{
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 3px;
                margin-right: 3px;
                width: 22px;
                height: 0.9rem;
                background: #ffdc00;
                color: #FFFFFF;
                font-size: 0.5625rem;
                border-radius: 10%;
                text-shadow: 0 0 5px #d1b259, 0 0 5px #d5ba3b;
              }
            }
          }
          &--more{

          }
        }
      }

      &__interaction{
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.75rem;
        color: silver;
        margin-top: 0.3125rem;
        border-bottom: 1px #d5d5d5 solid;
        padding-bottom: 0.2125rem;

        &--time{


        }
        &--act{
          display: flex;
          align-items: center;
          margin-right: 0.5rem;
          view{
            margin-right: 1rem;
          }
          &--comment{

          }
          &--hand{

          }

        }
      }
    }
  }
}

</style>
