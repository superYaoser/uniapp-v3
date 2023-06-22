<template>
	<view id="Main" style="width: 100%;height: 100vh;overflow: hidden;">
		<view class="main__container" style="width: 100%;height: 100%;overflow: hidden;" v-if="loading">
      <Home v-show="currentR==='Home'"></Home>
      <Dynamic v-show="currentR==='Dynamic'" :login-status="loginStatus"></Dynamic>
      <Message v-show="currentR==='Message'" :login-status="loginStatus"></Message>
      <Mine v-show="currentR==='Mine'" :login-status="loginStatus"></Mine>
    </view>
		<TabBar></TabBar>
	</view>
</template>

<script>
import {useStore} from 'vuex';
	import TabBar from "@/components/common/TabBar.vue";
  import Home from "@/pages/home/Home";
  import Dynamic from "@/pages/pyq/Dynamic";
  import Message from "@/pages/message/Message";
  import Mine from "@/pages/mine/Mine";
import {onMounted, ref} from "vue";
  import {
    onBackPress,onShow
  } from "@dcloudio/uni-app";
  import {loginUseUser} from "@/static/api/users";
import {PushMessageNotificationBar} from "@/static/utils/globalConifg";
	export default {
		components: {
			TabBar,Home,Dynamic,Message,Mine
		},
    setup(){
      const store = useStore()
      //初始化状态
      let loading =ref(false)
      //初始化方法
      const initialize =()=>{
        loading.value = false
        //登录，但是用token，验证用户有没有登录
        loginUseUser({
          email: '测试token',
          password: '测试token'
        }).then(res => {
          console.log(res)
          if (res.code == 200) {
            try {
              // 如果登录成功，则获取当前用户
              const currentUser = res.data;
              if (!saveVuex(currentUser)){
                plus.nativeUI.toast(`MainApp设置缓存出现了错误，请尝试重新启动`)
                uni.removeStorageSync('token');
                return
              }
              uni.setStorageSync('token', res.token);
              plus.nativeUI.toast(`登录成功，当前用户：${res.data.u_id}`)
              loginStatus.value = true
            } catch (e) {
              plus.nativeUI.toast(`MainApp用户信息缓存登录出现了错误：${e}`)
            }
          }else {
            //  说明用户没有登录历史
            plus.nativeUI.toast(`用户未登录`)
            loginStatus.value = false
          }
          loading.value = true
        })
      }

      //登录状态
      let loginStatus = ref(false)

      //监听用户注销事件
      uni.$on('login_out',()=>{
        uni.removeStorageSync('token');
        store.dispatch('resetUser');
        uni.showToast({
          title: '注销成功',
          icon: 'success', // 可选值：'success', 'loading', 'none'
          duration: 1000 // 持续时间，默认为1500ms
        });
        initialize()
      })
      onShow(()=>{

      })

      //初始化
      onMounted(()=>{
        // uni.removeStorageSync('token');
        initialize()
      })

      //保存vuex函数
      const saveVuex =(userData)=>{
        try{
          // 利用 Vuex 的 dispatch 方法将用户信息存储到全局状态中
          store.dispatch('addUser', userData);
          console.log(store.getters.getUser)
          return true
        }catch (e){
          plus.nativeUI.toast(`MainApp报错：${e}`)
          console.log(e)
          return false
        }
      }

      let backButtonPress =ref(0)
      //当前路由
      let currentR = ref('Home')

      //监听路由变化
      uni.$on('currentRouterUpdate',function(data){
        currentR.value = data.router;
      })

      //监听用户触发返回后处理请求
      onBackPress((e) => {
        backButtonPress.value++;
        if (backButtonPress.value > 1) {
          plus.runtime.quit();
        } else {
          plus.nativeUI.toast('再按一次退出应用');
        }
        setTimeout(()=> {
          backButtonPress.value = 0;
        }, 1000);
        return true;
      })
      return{
        currentR,loading,loginStatus
      }
    },
		data() {
			return {
				title: 'Hello'
			}
		},
		created() {

		},
		methods: {

		}
	}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";
#Main .main__container{
  width: 100%;
  height: 100%;
}
</style>
