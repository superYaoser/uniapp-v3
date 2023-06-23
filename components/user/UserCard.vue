<template>
  <view style="width: 100%;height: 120rpx;background: #FFFFFF;">
    <view class="userCard__container">

      <view class="userCard__container__body">

        <view class="userCard__container__body__left" @tap.stop="tapAuthorCard(userObj)">
          <view class="userCard__container__body__left__head">
            <view class="userCard__container__body__left__head--img" :style="userObj.u_head ? 'background-image: url(' + userObj.u_head + ')' : 'background-image: url(' + defaultHeadImgPath + ')'"></view>
          </view>
          <view class="userCard__container__body__left__info">
            <view class="userCard__container__body__left__info--name">

              <text>{{ userObj.u_name }}</text>
            </view>
            <view class="userCard__container__body__left__info--signature">
              <text>{{ userObj.u_signature }}</text>
            </view>
            <view class="userCard__container__body__left__info--from">
              <text space="nbsp">来自：黑龙江</text>

            </view>
          </view>
        </view>

        <view class="userCard__container__body__right">
          <view class="userCard__container__body__right__follow" v-show="isSelf!=userObj.u_id" @tap.stop="tapFollowCard(userObj)">
            <view style="width: 100%;height: 100%;">
              <view class="userCard__container__body__right__follow--be" v-show="userObj.concern_be===1">已关注</view>
              <view class="userCard__container__body__right__follow--no" v-show="userObj.concern_be===0||!userObj.concern_be">+关注</view>
            </view>
          </view>
        </view>


      </view>
    </view>

  </view>
</template>

<script>
import {ref} from "vue";
import {useStore} from 'vuex';
import {defaultHeadImgPath,formatDate,replaceUrlIP} from '@/static/utils/globalConifg'
import {setUserAddConcern, setUserRemoveConcern} from "@/static/api/users";
import ArticleFun from "@/components/article/articleFun";
export default {
  props: {
    userObj: Object
  },
  setup(props) {
    //查看是不是自己
    const store = useStore()
    let isSelf = store.getters.getUser
    isSelf = isSelf.u_id
    //登录用户
    let userObj1 = store.getters.getUser
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
        setUserAddConcern({"u_id":data.u_id}).then(res=>{
          console.log(res)
          if (res.code===200){
            userObj.value.concern_be=1
            ArticleFun.setArticleCardUpdate(data.u_id,null,{concern_be:1})
            plus.nativeUI.toast(`关注成功`)
            ArticleFun.addConcernMsg(userObj1.u_id,userObj1.u_name,data.u_id,data.u_name,null)
          }else {
            //  关注失败
          }
        })
      }else {
        setUserRemoveConcern({"u_id":data.u_id}).then(res=>{
          if (res.code===200){
            userObj.value.concern_be=0
            ArticleFun.setArticleCardUpdate(data.u_id,null,{concern_be:0})
            plus.nativeUI.toast(`取关成功`)
          }else {
            //  取消关注失败
          }
        })
      }
      console.log('点击了关注')
    }
    //点击作者栏
    const tapAuthorCard=(data)=>{
      console.log('点击了作者栏')
      uni.navigateTo({
        url: '/pages/user/user?id='+data.u_id
      })
    }

    let userObj =ref()
    userObj.value = props.userObj
    return {
      userObj,isSelf,defaultHeadImgPath,tapFollowCard,tapAuthorCard
    }
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
          // 样式
        }
      }
      &__info {
        max-width: 40vw;
        margin-left: 25rpx;

        &--name {
          font-size: 30rpx;
          font-weight: inherit;
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
