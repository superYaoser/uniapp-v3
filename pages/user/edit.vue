<template>
  <view class="w100 h100" style="  overflow: hidden;">
    <view class="w100 h100">
      <view class="userEdit__container w100 h100">
        <!--        头部-->
        <view class="userEdit__container__header">

          <view style="height: var(--status-bar-height);"></view>
          <view class="userEdit__container__header--main">
            <view class="userEdit__container__header--button">
              <view @click="pageBack()" style="margin-left: 10px;"><uni-icons type="left" size="20"></uni-icons>
              </view>
            </view>

            <view class="userEdit__container__header--title">{{'用户编辑'}}</view>
            <view class="userEdit__container__header--more"></view>
          </view>


        </view>

        <!--        身体-->
        <view class="userEdit__container__body">
          <view class="w100 h100">
              <Loading v-if="!loading"></Loading>
              <view class="userEdit__container__body__main">

                <view class="userEdit__container__body__main__head">
                  <view class="userEdit__container__body__main__head__container" @tap.stop="addImage">
                    <view class="userEdit__container__body__main__head__container--img" :style="headImg ? 'background-image: url(' + headImg + ')' : 'background-image: url(' + defaultHeadImgPath + ')'"></view>
                    <view>点击修改头像</view>
                  </view>



                </view>
                <view class="userEdit__container__body__main__info">
                  <view class="userEdit__container__body__main__info__name">

                    <view>昵称：</view>
                    <input type="text" :maxlength="10" :adjust-position="false" v-model="name"/>
                  </view>

                  <view class="userEdit__container__body__main__info__signature">

                    <view>签名：</view>
                    <input type="text" :maxlength="10" :adjust-position="false" v-model="signature"/>
                  </view>

                  <view class="userEdit__container__body__main__info--button" @tap.stop="ok">提交</view>
                </view>

              </view>
          </view>
        </view>

      </view>
    </view>
  </view>
</template>

<script>

import {useStore} from 'vuex';
import {onMounted, ref, watch, computed} from "vue";
import UserCard from "@/components/user/UserCard";
import {getUserDetailBy,updateUserBasicInfo} from '@/static/api/users'
import {baseUrl, defaultHeadImgPath, replaceUrlIP,validateString} from '@/static/utils/globalConifg'
import {
  onBackPress,onShow,onLoad
} from "@dcloudio/uni-app";
import Loading from "@/components/loading/Loading";


export default {
  components: {
    UserCard,Loading
  },
  setup() {
    let u_id = ref()

    let store = useStore()
    let userObj = store.getters.getUser
    let localUserObj = ref()
    //加载
    let loading =ref(false)

    // 昵称
    let name = ref()
    //签名
    let signature =ref()
    // 头像
    let headImg = ref()

    onLoad(async (option) => {
      loading.value = false
      //用户未登录 抱歉，直接退出
      if (!userObj.u_id){
        plus.nativeUI.toast(`请先登录`)
        console.log("用户未登录，需要返回")
        pageBack()
        return
      }
      let id = option.id;
      console.log(id)
      u_id.value = id
      let res = await getUserDetailBy(u_id.value)
      console.log(res)
      if (res.code ===200){
        localUserObj.value = res.data
        console.log(localUserObj)
        name.value = localUserObj.value.u_name
        signature.value = localUserObj.value.u_signature
        headImg.value = localUserObj.value.u_head
      }else {

        //  获取失败
        plus.nativeUI.toast(`获取用户失败，原因:${res.message}`)
      }
      loading.value = true

    })
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }

    /*上传图片*/
    const addImage = () => {
      uni.chooseImage({
        sizeType: ['original', 'compressed'],
        count: 1,
        crop:{
          width:1024,
          height:1024
        },
        success(res) {
          console.log(res.tempFilePaths[0])
          uni.uploadFile({
            url: baseUrl + 'upload/image', //域名+上传文件的请求接口 (根据你实际的接口来)
            filePath: res.tempFilePaths[0], // tempFilePath可以作为img标签的src属性显示图片 服务器图片的路径
            name: 'image', //上传到服务器的参数，自定义
            header: {
              "Content-Type": "multipart/form-data",
              "authorization": uni.getStorageSync('token'),
            },
            success(res) {
              let data = JSON.parse(res.data)
              console.log(data)
              headImg.value=replaceUrlIP(data.imageUrl)
            }
          })
        }
      })
    }
    const ok=async ()=>{
      if (name.value==''||signature.value==''){
        plus.nativeUI.toast(`未输入任何昵称与姓名`)
        return
      }
      if (!validateString(name.value)||!validateString(signature.value)){
        plus.nativeUI.toast(`不可以包含特殊符号`)
        return
      }

      let res = await updateUserBasicInfo({
        u_head:headImg.value,
        u_name:name.value,
        u_signature:signature.value
      })
      if (res.code ===200){
        plus.nativeUI.toast(`修改成功`)
        pageBack()
      }else {
        plus.nativeUI.toast(`修改失败，原因：${res.message}`)
      }
    }

    return {
      pageBack,localUserObj,loading,
      name,signature,defaultHeadImgPath,headImg,addImage,ok
    }
  }
}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";

.userEdit__container__body {
  background: #FFFFFF;
  width: 100%;
  height: calc(100% - 41px - var(--status-bar-height));
  margin-top: calc(41px + var(--status-bar-height));
}
.userEdit__container__header{
  width: 100%;
  background: #f3f3f3;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  &--main{
    height: 40px;
    display: flex;
    justify-items: center;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    view{
      width: 33%;
    }
  }

  &--title{
    display: flex;
    justify-items: center;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  &--more{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    align-content: center;
    margin-right: 10px;
  }
}
.userEdit__container__body__main{
  &__head{
    height: 250rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    &__container{

      font-size: 30rpx;
      color: silver;
      display: flex;
      flex-direction: column;
      align-items: center;
      &--img{
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
  }
  &__info{
    padding: 40rpx;

    &__name,&__signature{
      display: flex;
      font-size: 30rpx;
      height: 60rpx;
      padding: 20rpx 0;
      border-bottom: 1px #F0F0F0 solid;
      align-items: center;
    }
    &__name input,&__signature input{
      height: 100%;

      color: #000000;
    }
    &__name view,&__signature view{
      color: #787878;

    }
    &--button {
      margin-top: 100rpx;
      // 样式规则
      background: #13dbf9;
      border-radius: 10rpx;
      color: #FFFFFF;
      font-weight: bolder;
      height: 100rpx;
      display: flex;
      justify-content: center; /* 水平居中 */
      align-items: center; /* 垂直居中 */
    }
    &--button:active{
      background: #98f2ff;
    }
  }
}

</style>
