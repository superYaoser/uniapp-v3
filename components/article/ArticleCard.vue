<template>
<view class="ArticleCard__container w100 h100">
  <!--        单个       文章卡片-->
  <view class="active__cart w100 h100">
    <view  class="active__cart__container" @tap="tapArticleCard()">
      <!---------------------------作者栏-->
      <view class="active__cart__container__title" @tap.stop="tapAuthorCard()">
        <view class="active__cart__container__title__container">
          <view class="active__cart__container__title__container__img">
            <view class="active__cart__container__title__container__img--path" :style="articleInfo.u_head ? 'background-image: url(' + articleInfo.u_head + ')' : 'background-image: url(' + defaultHeadImgPath + ')'"></view>
          </view>
          <view class="active__cart__container__title__container__text">
            <view>
              <view class="active__cart__container__title__container__text__basic">
                <view style="font-size: 0.9375rem;max-width: 80%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;display: inline-block">{{ articleInfo.u_name }}</view>
                <view class="active__cart__container__title__container__text__basic--level">{{articleInfo.u_sgrade}}</view>
              </view>

              <view style="display:flex;align-items: center;flex-direction: row;font-size: 0.8125rem;color: #bcbcbc">
                <view class="active__cart__container__title__container__text--time">{{ articleInfo.article_create_time }}</view>
                <view class="active__cart__container__title__container__text--className">{{ articleInfo.class_name }}</view>
              </view>
            </view>

            <view class="active__cart__container__title__container__text__follow" v-if="needFollowModel" @tap.stop="tapFollowCard()">
              <view style="width: 100%;height: 100%;">
                <view class="active__cart__container__title__container__text__follow--be" v-show="articleInfo.concern_be===1">已关注</view>
                <view class="active__cart__container__title__container__text__follow--no" v-show="articleInfo.concern_be===0||!articleInfo.concern_be">+关注</view>
              </view>
            </view>

          </view>
        </view>
      </view>

      <!--                    主体文本-->
      <view class="active__cart__container__text w100 h100">
        <view class="active__cart__container__text__container  w100 h100">
          <view class="active__cart__container__text__container__title">{{ articleInfo.article_title }}</view>
          <view class="active__cart__container__text__container__text"><view>{{articleInfo.article_text}}</view></view>
          <!--                          封面-->
          <view class="active__cart__container__text__container__cover" >
            <view class="active__cart__container__text__container__cover__img"
                  v-if="articleInfo.article_preview1_path"
                  :style="'background-image: url('+ articleInfo.article_preview1_path +');margin-right: 1%;width:' + (!articleInfo.article_preview2_path ? '98%' : '49%')"></view>
            <view class="active__cart__container__text__container__cover__img" :style="'background-image: url('+articleInfo.article_preview2_path+')'" v-if="articleInfo.article_preview2_path"></view>
          </view>

          <!--                          点赞 评论 观看数量-->
          <view class="active__cart__container__text__container__interactInfo" >
            <view class="active__cart__container__text__container__interactInfo__container" >
              <view class="active__cart__container__text__container__interactInfo__container--watch">
                <uni-icons color='#999999' type="eye" size="18"></uni-icons>
                <text>{{articleInfo.article_watch_num}}</text>
              </view>

              <view class="active__cart__container__text__container__interactInfo__container--comment">
                <uni-icons color='#999999' type="chatbubble" size="18" ></uni-icons>
                <text>{{articleInfo.article_comment_num}}</text>
              </view>

              <view class="active__cart__container__text__container__interactInfo__container--hand" @tap.stop="tapHandCard()">
                <uni-icons color='#999999' type="hand-up" size="18"></uni-icons>
                <text>{{articleInfo.article_hand_support_num}}</text>
              </view>

            </view>
          </view>

        </view >
      </view>

    </view>
  </view>
</view>
</template>

<script>
import {onMounted, reactive, ref, watch, watchEffect} from "vue";
import {defaultHeadImgPath} from '@/static/utils/globalConifg'

export default {
  name: "ArticleCard",
  props: {
    articleData: Object,
    needFollowModel:Boolean,
  },

  setup(props){
    onMounted(()=>{
    })
    //记录文章的信息
    const articleInfo = reactive({
      ...props.articleData
    });
    //是不是需要关注模型
    const needFollowModel=ref(true)
    needFollowModel.value = props.needFollowModel

    //点击文章卡片
    const tapArticleCard=(data)=>{
      console.log('点击了文章卡')
    }
    //点击作者栏
    const tapAuthorCard=(data)=>{
      console.log('点击了作者栏')
    }
    //点击关注
    const tapFollowCard=(data)=>{
      console.log('点击了关注')
    }
    //点击点赞
    const tapHandCard=(data)=>{
      console.log('点击了点赞')
    }
    return{
      articleInfo,defaultHeadImgPath,needFollowModel,
      tapArticleCard,tapAuthorCard,tapFollowCard,tapHandCard
    }
  }
}
</script>

<style scoped lang="less">
.active__cart{
  background: #FFFFFF;

  &__container {
    padding: 5px 3px 5px 5px;
    //作者栏
    &__title {
      margin-bottom: 8px;

      &__container {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        &__text{

          &__basic{
            display: flex;
            align-items: center;
            width: 200px;
            &--level{
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: 10px;
              width: 15px;
              height: 15px;
              background: #ffdc00;
              color: #FFFFFF;
              font-size: 0.5625rem;
              border-radius: 50%;
              text-shadow: 0 0 5px #d1b259, 0 0 5px #d5ba3b;
            }
          }
        }
        &__img {

          width: 11%;
          height: 35px;
          display: flex;
          justify-content: center;
          align-items: center;
          &--path{
            width: 27px;
            height: 27px;
            background-repeat: no-repeat;
            border-radius: 50%;
            /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
            background-size: cover;
            position: relative;
            background-position: center;
          }
        }

        &__text {
          margin-left: 5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 80%;
          &--time {
            margin-right: 5px;
          }

          &--className {


          }
          &__follow{
            width: 45px;
            height: 18px;
            font-size: 0.8125rem;

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
        }
      }
    }

    //  文本
    &__text {
      margin-top: 3px;

      &__container {
        &__title{
          font-weight: inherit;
          font-size: 1rem;
          margin-bottom: 5px;
        }

        &__text {
          color: #787878;
          font-size: 0.9375rem;
        }

        //封面
        &__cover {
          margin: 5px 0;
          display: flex;
          overflow: hidden;
          &__img {
            width: 49%;
            height: 160px;
            background-repeat: no-repeat;
            border-radius: 8px;
            /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
            background-size: cover;
            position: relative;
            cursor: pointer;
            background-position: center;
          }
        }
        &__interactInfo{
          margin-top: 5px;
          display: flex;
          justify-content: flex-end;


          &__container{
            width: 50%;
            display: flex;
            justify-content: flex-end;
            margin-right: 20px;

            view{
              display: flex;
              align-items: center;
              margin-left: 25px;
              uni-icons{
                color:#f5f5f5;
              }

              text{
                margin-right: 3px;
                font-size: 0.95rem;
                color: #999999;
              }
            }
          }
        }
      }
    }
  }
}
</style>
