<template>
<view style="padding: 0 5px 10px;background: #FFFFFF;height: 100%;">
  <Loading :loading="false"></Loading>

  <scroll-view scroll-y='true' style="width: 100%;height: 100%;">
    <view class="articleInfo">
      <view class="articleInfo__container">

        <view class="articleInfo__container__header">
          <view class="articleInfo__container__header__authorInfo">
            <view class="articleInfo__container__header__authorInfo__head" @tap="tapAuthorCard(authorInfo)">

              <view class="articleInfo__container__header__authorInfo__head--img">
                <view class="articleInfo__container__header__authorInfo__head--img--path" :style="authorInfo.u_head ? 'background-image: url(' + authorInfo.u_head + ')' : 'background-image: url(' + defaultHeadImgPath + ')'"></view>
              </view>
              <view class="articleInfo__container__header__authorInfo__head--name">
                {{authorInfo.u_name}}
              </view>
              <view class="articleInfo__container__header__authorInfo__head--level">{{authorInfo.u_sgrade}}</view>
            </view>
            <view class="articleInfo__container__header__authorInfo__follow" v-if="needFollowModel" v-show="selfId!=authorInfo.u_id" @tap="tapFollowCard(authorInfo)">
              <view style="width: 100%;height: 100%;">
                <view class="articleInfo__container__header__authorInfo__follow--be" v-show="concern_be">已关注</view>
                <view class="articleInfo__container__header__authorInfo__follow--no" v-show="!concern_be">+关注</view>
              </view>
            </view>



          </view>

          <view class="articleInfo__container__header__title">
             <view class="articleInfo__container__header__title--text">{{articleInfo.article_title}}</view>
          </view>
          <view class="articleInfo__container__header__time">
            <view>{{'文章发布于：'}}{{formatDate(articleInfo.article_create_time)}}</view>
          </view>
        </view>

        <view class="articleInfo__container__body">
          <view class="articleInfo__container__body--html">
            <rich-text :nodes="html" preview="true" selectable="true" space="true"></rich-text>
          </view>
        </view>

        <view class="articleInfo__container__footer" v-if="false">


        </view>

      </view>
    </view>
    <CommentList :article_id="articleInfo.article_id"></CommentList>

  </scroll-view>
  <view></view>

</view>
</template>

<script>
import {
  onLoad
} from "@dcloudio/uni-app";
import ArticleFun from "@/components/article/articleFun";
import {onMounted, ref} from "vue";
import {getArticleByID, getArticleUserHandStateById} from '@/static/api/article'
import App from "@/App";
import {getUserInfoById, getUser1AndUser2Concern, setUserAddConcern, setUserRemoveConcern} from '@/static/api/users'
import {sendMessageToScreen} from'@/static/utils/globalConifg'
import Loading from "@/components/loading/Loading";
import {defaultHeadImgPath,replaceUrlIP} from '@/static/utils/globalConifg'
import {useStore} from 'vuex';
import {formatDate} from '@/static/utils/globalConifg'
import {addHandArticleByArticleId, addWatchByArticleId, removeHandArticleByArticleId} from "@/static/api/act";
import CommentList from "@/components/article/comments/CommentList";
export default {
  props: {
    needFollowModel:Boolean,
  },
  components: {CommentList, Loading, App},
  emits: ['update:item'],
  setup(props,{emit}) {
    //是不是需要关注模型
    const needFollowModel=ref(true)
    needFollowModel.value = props.needFollowModel
    //作者信息
    let authorInfo = ref()
    //文章信息
    let articleInfo = ref()
    //关注信息
    let concern_be = ref(false)
    // 获取登录用户信息
    const store = useStore()
    let selfId = store.getters.getUser
    selfId = selfId.u_id
    let userObj = store.getters.getUser

    //标准写法 获取作者个人信息
    const getAuthorInfo = async (id)=>{
      try {
        const res = await getUserInfoById(id);
        if (res.code === 200){
          // Process the result here
          return res.data[0]
        } else {
          // Handle error here

          // plus.nativeUI.toast(`获取个人信息错误
          // 代码：${res.code}`,{ duration:'long'})

          console.log(`获取个人信息错误
          代码：${res.code}`)
        }
      } catch (error) {
        // Handle any exceptions here
        plus.nativeUI.toast(`获取个人信息错误
          代码：${error}`,{ duration:'long'})
      }
    }
    //获取用户关注信息
    const getUserConcern = async (id1,id2)=>{
      try {
        const res = await getUser1AndUser2Concern({"u_id":id1,"be_u_id":id2});
        if (res.code === 200){
          // Process the result here
          return res.data.concern_be === 1;
        } else {
          // Handle error here

          // plus.nativeUI.toast(`获取关注状态错误
          // 代码：${res.code}`,{ duration:'long'})

          console.log(`获取关注状态错误
          代码：${res.code}`)
        }
      } catch (error) {
        // Handle any exceptions here
        plus.nativeUI.toast(`获取关注状态错误
          代码：${error}`,{ duration:'long'})
      }
    }
    //向服务器添加观看记录数据
    const setWatchByArticleId= async (id)=>{
      if (!userObj.u_id){
        plus.nativeUI.toast(`用户未登录`)
        return
      }
      try {
        await addWatchByArticleId(id)
        ArticleFun.setArticleCardUpdate(null,id,{watch:++articleInfo.value.article_watch_num})
      }catch (e){
        console.log('添加历史观看记录失败')
      }
    }

    let html =ref(`<div style='color:red' class='classTest'>文章加载失败</div>`)
    //记录文章id
    let articleId = ref('1');
    onLoad(async (option) => {
      let id = option.id;
      articleId.value = id
      //获取文章信息
      await getArticleByID(articleId.value).then(res => {
        console.log(res)
        if (res.code === 200) {
          //赋值文章信息
          articleInfo.value = res.data[0]
          html.value = replaceImgSrc(articleInfo.value.article_content)
        }else {
        }
      })
      const regex = new RegExp('<img', 'gi');
      html.value= html.value.replace(regex, `<img style="max-width:100% !important;height:auto;display:block;margin: 10px auto;width:98%;border-radius: 8px;"`);

      // 赋值作者信息
      authorInfo.value = await getAuthorInfo(articleInfo.value.article_user_id)
      //赋值关注信息
      concern_be.value = await getUserConcern(selfId,articleInfo.value.article_user_id)
      await setWatchByArticleId(articleInfo.value.article_id)

    })

    //---------------互动 --------------------------------
    //点击作者栏
    const tapAuthorCard=(data)=>{
      console.log('点击了作者栏')
    }
    //点击关注
    let canTapFollow = true
    const tapFollowCard=(data)=>{
      if (!userObj.u_id){
        plus.nativeUI.toast(`用户未登录`)
        return
      }
      if (!canTapFollow){
        plus.nativeUI.toast(`点的太快啦~`)
        return // 如果当前不能刷新，则直接返回
      }
      canTapFollow = false
      //一秒只能点一次关注
      setTimeout(() => { canTapFollow = true }, 1000)

      if (concern_be.value===false){
        setUserAddConcern({"u_id":data.u_id}).then(res=>{
          console.log(res)
          if (res.code===200){
            concern_be.value=true
            ArticleFun.setArticleCardUpdate(data.u_id,null,{concern_be:1})
            plus.nativeUI.toast(`关注成功`)
            ArticleFun.addConcernMsg(userObj.u_id,userObj.u_name,articleInfo.value.article_user_id,data.u_name,articleInfo.value.article_id)
          }else {
            //  关注失败
          }
        })
      }else {
        setUserRemoveConcern({"u_id":data.u_id}).then(res=>{
          if (res.code===200){
            concern_be.value=false
            ArticleFun.setArticleCardUpdate(data.u_id,null,{concern_be:0})
            plus.nativeUI.toast(`取关成功`)
          }else {
            //  取消关注失败
          }
        })
      }
      console.log('点击了关注')
    }


    //---------------互动 end--------------------------------

    // 替换html内容中所有src
    const replaceImgSrc = (data)=> {
        // 匹配所有img标签的src属性
        const imgSrcReg = /<img.*?src=[\"|\']?(.*?)[\"|\']?\s.*?>/gi;
        // 遍历所有匹配到的img标签
        return data.replace(imgSrcReg, (match, src) => {
          // 使用传入的函数替换IP地址
          const newSrc = replaceUrlIP(src);
          // 返回替换后的img标签
          return match.replace(src, newSrc);
        });
    }
    return{
      articleId,html,authorInfo,defaultHeadImgPath,articleInfo,needFollowModel,concern_be
      ,tapAuthorCard,tapFollowCard,selfId,formatDate
    }
  }
}
</script>

<style scoped lang="less">
.articleInfo{

  &__container{

    &__header{

      &__authorInfo{
        height: 40px;
        background: #FFFFFF;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &__head{
          margin-left: 15px;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          width: 50%;
          &--img{
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

          &--name{

            margin-left: 5px;
            font-size: 0.9rem;
          }
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
        &__follow{
          margin-right: 15px;
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
      &__title{
        background: #FFFFFF;
        padding: 5px;
        &--text{
          font-size: 1.25rem;
          font-weight: bold;
          color: #1f1f1f;
        }
      }
      &__time{
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 30px;
        view{
          color: #c1c1c1;
          font-size: 0.77rem;
        }
      }
    }

    &__body{
      font-size: 1.08rem;

      &--html{
        padding-bottom: 10px;
      }
    }
    &__footer{
      display: flex;
      align-items: center;
      background: #f3f3f3;
      height: 40px;
      width: 100%;
      position: fixed;
      z-index: 99;
      bottom: 0;
      left: 0;
      &--comments{

        &--search{

          margin-left: 20px;
          input{
            width: 200px;
            height: 25px;
            background: #FFFFFF;
            border: 1px #efefef solid;
            border-radius: 5px;
            font-size: 0.75rem;
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
