<template>
<view style="width: 100vw;height: 100vh;">
  <view class="loginRegister__container">

    <view class="loginRegister__container__header status-bar-height">


    </view>

    <view class="loginRegister__container__body">

      <view class="loginRegister__container__body__login">

        <view class="loginRegister__container__body__login__title">

          <text>账号密码登录</text>
        </view>

        <view class="loginRegister__container__body__login__email">

          <input type="text" :maxlength="20" placeholder="账号/邮箱/手机号" :adjust-position="false" v-model="account"/>
        </view>

        <view class="loginRegister__container__body__login__password">
          <input type="safe-password" :maxlength="16" placeholder="密码" :password="true" :adjust-position="false" v-model="password"/>
        </view>

        <view class="loginRegister__container__body__login__option">

          <view class="loginRegister__container__body__login__option__remember">

            <view>
              <radio-group @change="">
              <label><radio :value="true" :checked="true" :color="'#13dbf9'" class="loginRegister__container__body__login__option__remember--radio"></radio></label>
            </radio-group>
            </view>

              <text>自动登录</text>

          </view>
        </view>

        <view class="loginRegister__container__body__login--button" @tap.stop="login">
          登录
        </view>
      </view>
    </view>

  </view>
</view>
</template>

<script>
	import {
		loginUseUser
	} from "@/static/api/users";
  import {useStore} from 'vuex';
  import {onMounted, ref} from "vue";


	export default {
    setup() {
      //账号
      let account = ref()
      //密码
      let password = ref()
      //记住标记
      let remember = true
      const radioChange=(evt) => {
        remember = evt.detail.value
      }
      //点击登录
      const login = ()=>{
        if (!account.value||!password.value){
          plus.nativeUI.toast(`请输入账号或者密码`)
          return
        }
        if (account.value==''||password.value==''){
          plus.nativeUI.toast(`请输入账号或者密码`)
          return
        }
        uni.removeStorageSync('token');
        // 登录成功后跳转到主页，然后将token保存到本地
        loginUseUser({
          email: account.value,
          password: password.value
          // email: '111@qq.com',
          // password: '12312321'
        }).then(res => {
          console.log(res)
          if (res.code == 200) {
            try {
              uni.setStorageSync('token', res.token);
              // plus.nativeUI.toast(`登录成功，当前用户：${store.getters.getUser.u_id}`)
              uni.reLaunch({
                url: '/pages/MainApp'
              });
            } catch (e) {
              plus.nativeUI.toast(`登录发生异常：${e}`)
            }
          }else {
            plus.nativeUI.toast(`登录失败-原因：${res.message}-代码${res.code}`)
          }
        })
      }

      return{
        account,password,login
      }
    }
	}
</script>

<style scoped lang="less">
.loginRegister__container {
  // 样式规则

  &__header {
    // 样式规则
    height: 300rpx;
    background-repeat: no-repeat;
    /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
    background-size: cover;
    position: relative;
    cursor: pointer;
    background-position: center;
    //background-image: url('./../static/images/message/action.png');
    background-image: url('./../../static/images/loginRegisterBG.jpg');
  }

  &__body {
    // 样式规则
    padding: 40rpx;

    &__login {
      // 样式规则

      &__title {
        // 样式规则
        font-size: 40rpx;
        font-weight: bold;
      }

      &__email,&__password{
        height: 70rpx;
        margin: 20rpx 0;
        border-bottom: 1px #F0F0F0 solid;
      }
      &__email input,&__password input{
        height: 100%;
        width: 100%;
      }
      &__email {
        // 样式规则

      }

      &__password {
        // 样式规则

      }

      &__option {
        // 样式规则

        &__remember {
          // 样式规则
          display: flex;
          align-items: center;
          font-size: 30rpx;
          color: #4c4c4c;
          &--radio{
            transform: scale(0.8)
          }
        }

        margin-bottom: 40rpx;
      }

      &--button {
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
}
</style>
