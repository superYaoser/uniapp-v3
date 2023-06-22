<template>
<view style="width: 100vw;height: 100%;overflow: hidden">

  <scroll-view scroll-y="true" style="height: 100%;overflow: hidden">
    <view class="userDetail__container h100" >

      <view class="userDetail__container__header" style="height: 50%;">

        <view class="userDetail__container__header__bg" style="height: 60%">
          <view class="userDetail__container__header__bg--img" style="height: 85%;">
            <view class="userDetail__container__header__bg__break" @tap.stop="pageBack" v-if="needBreak">
              <uni-icons type="left" size="50rpx" color="#ffffff"></uni-icons>
            </view>
            <view @tap.stop="loginOut" class="loginOut" v-if="needLoginOut">注销登录</view>
          </view>
          <view class="userDetail__container__header__bg__space" style="height: 15%;">

            <view class="userDetail__container__header__bg__space--button" v-if="needFollow" @tap.stop="tapFollowCard(userObj)" v-show="userObj.concern_be===0">
              关注
            </view>
            <view class="userDetail__container__header__bg__space--button" style="border: 1px #929292 solid;color: #929292;" v-if="needFollow" @tap.stop="tapFollowCard(userObj)" v-show="userObj.concern_be===1">
              已关注
            </view>
            <view class="userDetail__container__header__bg__space--button" v-if="needEdit">
              编辑
            </view>
            <view class="userDetail__container__header__bg__space--button" v-if="false">
              私聊
            </view>
          </view>
          <view class="userDetail__container__header__bg__headImg" :style="userObj.u_head ? 'background-image: url(' + userObj.u_head + ')' : 'background-image: url(' + defaultHeadImgPath + ')'">
          </view>

        </view>
        <view class="userDetail__container__header__info " style="height: 40%;padding: 40rpx">
          <view class="userDetail__container__header__info__user">

            <view class="userDetail__container__header__info__user--name">
              {{ userObj.u_name }}
            </view>
            <view class="userDetail__container__header__info__user--nickname">
              <uni-icons type="color-filled" size="30rpx" color="#909090"></uni-icons><text>{{ userObj.u_signature }}</text>
            </view>
            <view class="userDetail__container__header__info__user--ip">
              <uni-icons type="location-filled" size="30rpx" color="#909090"></uni-icons><text>{{ 'IP所属：黑龙江' }}</text>
            </view>
          </view>

          <Loading v-if="!loading"></Loading>
          <view class="userDetail__container__header__info__grades" v-if="loading">

            <view class="userDetail__container__header__info__grades__option">
              <text class="userDetail__container__header__info__grades__option--num">{{ concern_num }}</text>
              <text class="userDetail__container__header__info__grades__option--word">{{ '关注' }}</text>
            </view>
            <view class="userDetail__container__header__info__grades__option">
              <text class="userDetail__container__header__info__grades__option--num">{{ fens_num }}</text>
              <text class="userDetail__container__header__info__grades__option--word">{{ '粉丝' }}</text>
            </view>
            <view class="userDetail__container__header__info__grades__option">
              <text class="userDetail__container__header__info__grades__option--num">{{ userObj.get_hand_num }}</text>
              <text class="userDetail__container__header__info__grades__option--word">{{ '获赞' }}</text>
            </view>
          </view>

        </view>
      </view>

      <view class="userDetail__container__body" style="height: 90%;">
        <view class="header__nav" style="height: 7%">
          <view style="height: 20%;" class="bg-efefef"></view>
          <view class="header__nav__container" style="height: 80%">
            <view class="header__nav__container--option" @tap="changeCurrentNavPage(0)"
                  :style="articleNavIndex===0?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">
              <text>发布</text>
              <view v-if="articleNavIndex===0"></view>
            </view>
            <view class="header__nav__container--option" @tap="changeCurrentNavPage(1)"
                  :style="articleNavIndex===1?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">
              <text>点赞</text>
              <view v-if="articleNavIndex===1"></view>
            </view>
            <view class="header__nav__container--option" @tap="changeCurrentNavPage(2)"
                  :style="articleNavIndex===2?'  color: '+articleNavColor+';':'color: '+unArticleNavColor+';'">
              <text>历史</text>
              <view v-if="articleNavIndex===2"></view>
            </view>
          </view>
        </view>
        <view style="height: 5rpx" class="bg-efefef"></view>
          <swiper style='width: 100%;height: 100%;padding: 0 0' :autoplay="false" @change="swiperItemChange($event)"
                  :current="clickNavIndex">
<!--            发布-->
            <swiper-item>
              <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #f5f5f5;`">
                <UserArticleList :u_id="userObj.u_id"></UserArticleList>
              </scroll-view>
            </swiper-item>

<!--            点赞-->
            <swiper-item>
              <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #f5f5f5;`">
                <UserHandArticleList :u_id="userObj.u_id" v-if="articleNavIndex===1"></UserHandArticleList>
              </scroll-view>
            </swiper-item>

<!--            历史-->
            <swiper-item>
              <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;background: #f5f5f5;`">
                <UerHistoryArticleList :u_id="userObj.u_id" v-if="articleNavIndex===2"></UerHistoryArticleList>
              </scroll-view>
            </swiper-item>
          </swiper>
      </view>

    </view>
  </scroll-view>


</view>
</template>

<script>
import {ref,onMounted} from "vue";
import UserArticleList from "@/components/user/UserArticleList";
import UserHandArticleList from "@/components/user/UserHandArticleList";
import UerHistoryArticleList from "@/components/user/UerHistoryArticleList";
import MessageCard from "@/components/message/MessageCard";
import NoLogin from "@/components/noLogin/NoLogin";
import {defaultHeadImgPath} from '@/static/utils/globalConifg'
import {setUserAddConcern, setUserRemoveConcern,getUserFensListByUid,getUserConcernListByUid} from "@/static/api/users";
import ArticleFun from "@/components/article/articleFun";
import {useStore} from 'vuex';
import Loading from "@/components/loading/Loading";
export default {
  name: "UserDetail",
  components: {
    UserArticleList,UserHandArticleList,UerHistoryArticleList,Loading
  },
  props: {
    userObj: Object,
    needFollow:Boolean,
    needEdit:Boolean,
    needBreak:Boolean,
    needLoginOut:Boolean,
  },
  setup(props){
    //存储用户数据
    let userObj = ref()
    userObj.value = props.userObj
    //需不需要关注按钮
    let needFollow = ref(false)
    needFollow.value = props.needFollow
    //需不需要编辑按钮
    let needEdit = ref(false)
    needEdit.value = props.needEdit
    //需不需要返回按钮
    let needBreak = ref(false)
    needBreak.value = props.needBreak
    //需不需要返回按钮
    let needLoginOut  = ref(false)
    needLoginOut.value = props.needLoginOut
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }
    //粉丝数
    let fens_num = ref()
    //关注数
    let concern_num =ref()
    let loading =ref(false)
    //初始化
    const initialize = async ()=>{
      loading.value =false

      let res = await getUserConcernListByUid(userObj.value.u_id)
      let res1 = await getUserFensListByUid(userObj.value.u_id)
      if (res.code===200&&res1.code===200){
        fens_num.value =res.data.length
        concern_num.value =res1.data.length
      }
      loading.value =true
    }
    onMounted(async()=>{
      await initialize()
    })
    const loginOut = ()=>{
      uni.$emit('login_out',()=>{

      })
    }
    //----------滑动选择功能----------------------------------------------------------
    //监听 导航栏的 index变化 的功能
    let articleNavIndex = ref(0)
    let articleNavColor = '#131313'
    let unArticleNavColor = '#a2a3ab'
    uni.$on('userDetail_follow_nav_change', function (e) {
      articleNavIndex.value = e.currentNavIndex;
    })
    const changeCurrentNavPage = (page) => {
      uni.$emit('userDetail_nav_change', {page: page})
    }
    //用于用户点击了哪个导航跳转到哪个页面
    let clickNavIndex = ref()
    uni.$on('userDetail_nav_change', function (e) {
      clickNavIndex.value = e.page;
      console.log(clickNavIndex.value)
    })
    //记录当前页面 左右
    let currentIndex = ref()
    //左右改变
    const swiperItemChange = (e) => {
      currentIndex.value = e.detail.current
      uni.$emit('userDetail_follow_nav_change', {currentNavIndex: currentIndex.value})
    }
    //----------滑动选择功能 end----------------------------------------------------------

    // 获取本地 用户
    //查看是不是自己
    const store = useStore()
    let Self = store.getters.getUser
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
            ArticleFun.addConcernMsg(Self.u_id,Self.u_name,data.u_id,data.u_name,null)
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
    return{
      articleNavIndex,articleNavColor,unArticleNavColor,changeCurrentNavPage,clickNavIndex,currentIndex,swiperItemChange,
      userObj,needEdit,needFollow,defaultHeadImgPath,pageBack,needBreak,tapFollowCard,
      fens_num,concern_num,loading,loginOut,needLoginOut
    }
  }
}
</script>

<style scoped lang="less">
.userDetail__container{

  &__header{

    &__bg{
      position: relative;

      &--img{
        // 样式规则
        background-repeat: no-repeat;
        /*把背景图扩展至足够大，直至完全覆盖背景区域，
    图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
        background-size: cover;
        position: relative;
        cursor: pointer;
        background-position: center;
        //background-image: url('./../static/images/message/action.png');
        background-image: url('/static/images/users/userDefaultBG.jpg');
        border-bottom-right-radius: 25rpx;
        border-bottom-left-radius: 25rpx;
      }
      &__break{
        position: absolute;
        top:20%;
        left: 3%;

      }
      &__space{
        position: relative;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: flex-end;

        &--button{
          // 样式规则
          background: #FFFFFF;
          border-radius: 10rpx;
          border: 1px #13dbf9 solid;
          color: #13dbf9;
          font-size: 25rpx;
          height: 60%;
          width: 13%;
          display: flex;
          justify-content: center; /* 水平居中 */
          align-items: center; /* 垂直居中 */
          margin-right: 40rpx;
        }
      }
      &__headImg{
        position: absolute;
        bottom: 1%;
        left: 6%;
        width: 150rpx;
        height: 150rpx;
        background-repeat: no-repeat;
        border-radius: 50%;
        border: 0.0375rem silver solid;
        /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
        background-size: cover;
        background-position: center;
      }
    }

    &__info{

      &__user{

        &--name{
          font-size: 50rpx;
          font-weight: bold;
          margin-bottom: 10rpx;
        }
        &--nickname,&--ip{
          display: flex;
          align-items: center;
          color: #909090;
          font-size: 25rpx;
          margin-bottom: 7rpx;
        }
      }

      &__grades{
        border-top: 1px #dcdcdc solid;
        padding: 20rpx 0;
        display: flex;
        align-items: center;
        margin-top: 30rpx;
        &__option{
          margin-right: 40rpx;
          display: flex;
          align-items: center;

          &--num{
            font-size: 35rpx;
            margin-right: 10rpx;

          }
          &--word{
            font-size: 25rpx;
            color: #909090;
          }
        }
      }

    }


  }
}
.header__nav {
  width: 100%;

  .header__nav__container {
    padding: 0 40rpx;
    display: flex;
    align-items: center;
    justify-content: space-around;

    view {
      font-size: 1rem;
      font-weight: inherit;
    }
    &--option{
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    &--option view{
      width: 15px;
      height: 4px;
      background: #00daff;
      border-radius: 5rpx;
    }
  }

}
.loginOut{
  position: absolute;
  bottom: 2%;
  left: 30%;
  color: #ffffff;
  font-size: 20rpx;
  padding: 5rpx;
  border: 1px #ff5e5e solid;
  border-radius: 10rpx;
  background: rgba(237, 13, 13, 0.3);
}
.loginOut:active{
  background: rgba(237, 13, 13, 0.7);
}
</style>

