<template>
<view class="ArticleCard__container w100 h100">
  <!--        单个       文章卡片-->
  <view class="active__cart w100 h100">
    <Loading v-if="articleLoading&&handStateLoading"></Loading>
    <view  class="active__cart__container" @tap="tapArticleCard(articleInfo)" v-else>
      <!---------------------------作者栏-->
      <view class="active__cart__container__title" @tap.stop="tapAuthorCard()">
        <view class="active__cart__container__title__container">
          <view class="active__cart__container__title__container__img">
            <view class="active__cart__container__title__container__img--path" :style="articleInfo.u_head ? 'background-image: url(' + articleInfo.u_head + ')' : 'background-image: url(' + defaultHeadImgPath + ')'"></view>
          </view>
          <view class="active__cart__container__title__container__text">
            <view>
              <view class="active__cart__container__title__container__text__basic">
                <view style="font-size: 0.95rem;max-width: 80%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;display: inline-block">{{ articleInfo.u_name }}</view>
                <view class="active__cart__container__title__container__text__basic--level">{{articleInfo.u_sgrade}}</view>
              </view>

              <view style="display:flex;align-items: center;flex-direction: row;font-size: 0.8125rem;color: #bcbcbc">
                <view class="active__cart__container__title__container__text--time">{{ formatDate(articleInfo.article_create_time) }}</view>
                <view class="active__cart__container__title__container__text--className">{{ articleInfo.class_name }}</view>
              </view>
            </view>

            <view class="active__cart__container__title__container__text__follow" v-if="needFollowModel" v-show="isSelf!=articleInfo.article_user_id" @tap.stop="tapFollowCard(articleInfo)">
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
                  :style="'background-image: url('+ replaceUrlIP(articleInfo.article_preview1_path) +');margin-right: 1%;width:' + (!articleInfo.article_preview2_path ? '98%' : '49%')"></view>
            <view class="active__cart__container__text__container__cover__img" :style="'background-image: url('+replaceUrlIP(articleInfo.article_preview2_path)+')'" v-if="articleInfo.article_preview2_path"></view>
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

              <view class="active__cart__container__text__container__interactInfo__container--hand" @tap.stop="tapHandCard(articleInfo)">
                <uni-icons :color="article_user_handBe===0?'#999999':'#0091ff'" type="hand-up" size="18"></uni-icons>
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
import {onMounted, reactive, ref, watch, watchEffect,computed} from "vue";
import {defaultHeadImgPath,formatDate,replaceUrlIP} from '@/static/utils/globalConifg'
import {setUserAddConcern,setUserRemoveConcern} from '@/static/api/users'
import {addHandArticleByArticleId,removeHandArticleByArticleId} from '@/static/api/act'
import {getArticleUserHandStateById,getArticleUserHandListByUserId} from '@/static/api/article'
import {useStore} from 'vuex';
import Loading from "@/components/loading/Loading";
import ArticleFun from "@/components/article/articleFun";

export default {
  name: "ArticleCard",
  components: {Loading},

  props: {
    articleData: Object,
    needFollowModel:Boolean,
  },
  emits: ['update:item'],

  setup(props,{ emit }){
    //记录文章的信息
    let articleInfo = ref({
      ...props.articleData
    });

    //文章卡片加载种
    // 当articleInfo没有值或为空时返回true，否则返回false
    const articleLoading = computed(() => {
      if (!articleInfo.value || Object.keys(articleInfo.value).length === 0) {
        return true;
      } else {
        return false;
      }
    })
    //查看是不是自己
    const store = useStore()
    let isSelf = store.getters.getUser
    isSelf = isSelf.u_id

    //用于接收父组件数据后查找本篇文章 替换-----------------------
    function getArticleById(classifyList, article_id,article_user_id) {
      classifyList.forEach((item) => {
        item.articleList.forEach((article, index) => {
          if (article.article_id === article_id && article.article_user_id === article_user_id) {
           articleInfo.value =article
          }
        });
      });
    }
    //-----------------------------------监听卡片变化---------------------------------------------------------------------------------------
    uni.$on('home_articleList_change',function(e){
      let u_id =e.u_id
      articleInfo.value.concern_be
    })
    uni.$on('articleCard_concern_update',function(e){
      console.log("123123")
      let data = e.data
      if (articleInfo.value.article_user_id == data.u_id){
        articleInfo.value.concern_be=data.concern_be
      }
    })
    uni.$on('articleCard_interaction_hand_update',function(e){
      let data = e.data
      if(articleInfo.value.article_id == data.article_id){
        articleInfo.value.article_hand_support_num=data.hand
        if (article_user_handBe.value===0){
          article_user_handBe.value=1
        }else {
          article_user_handBe.value=0
        }
      }
    })
    uni.$on('articleCard_interaction_watch_update',function(e){
      let data = e.data
      if(articleInfo.value.article_id == data.article_id){
        articleInfo.value.article_watch_num=data.watch
      }
    })
    uni.$on('articleCard_interaction_comment_update',function(e){
      let data = e.data
      if(articleInfo.value.article_id == data.article_id){
        articleInfo.value.article_comment_num=data.comment
      }
    })
    //-----------------------------------监听卡片变化 end--------------------------------------------------------------------------------------------------------
    //用于接收父组件数据后查找本篇文章- 替换---end-------------------


    //------------获取获取点赞状态---------------------------------------------------------------------------------------------------

    // 获取用户点赞 的 初始化加载状态
    let handStateLoading =ref(true)
    let article_user_handBe = ref(0)
    // 初始化点赞
    const initializeHand = async ()=>{
      let res = await getArticleUserHandStateById(articleInfo.value.article_id)
      if (res.code ===200){
        console.log(res.data)

        article_user_handBe.value = res.data.article_user_handBe
      }
    }

    //------------获取获取点赞状态 end-----------------------------------------------------------------------------------------------


    onMounted(async ()=>{
      await initializeHand()
    })
    //是不是需要关注模型
    const needFollowModel=ref(true)
    needFollowModel.value = props.needFollowModel

    //点击文章卡片
    const tapArticleCard=(data)=>{
      console.log('点击了文章卡')
      uni.navigateTo({
        url: '/pages/article/detail/ArticleDetailPage?id='+data.article_id
      })
    }
    //点击作者栏
    const tapAuthorCard=(data)=>{
      console.log('点击了作者栏')
    }
    //点击关注
    let canTapFollow = true
    const tapFollowCard=(data)=>{
      if (!canTapFollow){
        plus.nativeUI.toast(`点的太快啦~`)
        return // 如果当前不能刷新，则直接返回
      }
      canTapFollow = false
      //一秒只能点一次关注
      setTimeout(() => { canTapFollow = true }, 1000)

      if (data.concern_be===0){
        setUserAddConcern({"u_id":data.article_user_id}).then(res=>{
          console.log(res)
          if (res.code===200){
            articleInfo.value.concern_be=1
            ArticleFun.setArticleCardUpdate(data.article_user_id,null,{concern_be:1})
            plus.nativeUI.toast(`关注成功`)
          }else {
          //  关注失败
          }
        })
      }else {
        setUserRemoveConcern({"u_id":data.article_user_id}).then(res=>{
          if (res.code===200){
            articleInfo.value.concern_be=0
            ArticleFun.setArticleCardUpdate(data.article_user_id,null,{concern_be:0})
            plus.nativeUI.toast(`取关成功`)
          }else {
            //  取消关注失败
          }
        })
      }
      console.log('点击了关注')
    }
    //点击点赞
    const tapHandCard=(data)=>{
      if (!canTapFollow){
        plus.nativeUI.toast(`点的太快啦~`)
        return // 如果当前不能刷新，则直接返回
      }
      canTapFollow = false
      //一秒只能点一次关注
      setTimeout(() => { canTapFollow = true }, 1000)

      if (article_user_handBe.value===0){
        addHandArticleByArticleId(data.article_id).then(res=>{
          console.log(res)
          if (res.code===200){

            ArticleFun.setArticleCardUpdate(null,data.article_id,{hand:++articleInfo.value.article_hand_support_num})
            plus.nativeUI.toast(`点赞成功`)
          }else {
            //  点赞失败
          }
        })
      }else {
        removeHandArticleByArticleId(data.article_id).then(res=>{
          console.log(res)
          if (res.code===200){

            ArticleFun.setArticleCardUpdate(null,data.article_id,{hand:--articleInfo.value.article_hand_support_num})
            plus.nativeUI.toast(`取消点赞成功`)
          }else {
            //  点赞失败
          }
        })
      }
      console.log('点击了点赞')
    }
    return{
      articleInfo,defaultHeadImgPath,needFollowModel,
      tapArticleCard,tapAuthorCard,tapFollowCard,tapHandCard,isSelf,formatDate,articleLoading,replaceUrlIP,article_user_handBe,handStateLoading
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
            border: 0.0375rem silver solid;
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
            height: 350rpx;
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
