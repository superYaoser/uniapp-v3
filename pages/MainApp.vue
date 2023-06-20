<template>
	<view id="Main" style="width: 100%;height: 100vh;overflow: hidden;">
		<view class="main__container" style="width: 100%;height: 100%;overflow: hidden;">
      <Home v-show="currentR==='Home'"></Home>
      <Dynamic v-show="currentR==='Dynamic'" v-if="loading"></Dynamic>
      <Message v-show="currentR==='Message'" v-if="loading"></Message>
      <Mine v-show="currentR==='Mine'" v-if="loading"></Mine>
    </view>
		<TabBar v-show="tabBarVisibility"></TabBar>
	</view>
</template>

<script>
import {useStore} from 'vuex';
	import TabBar from "@/components/common/TabBar.vue";
  import Home from "@/pages/home/Home";
  import Dynamic from "@/pages/pyq/Dynamic";
  import Message from "@/pages/message/Message";
  import Mine from "@/pages/mine/Mine";
  import TopBar from "@/components/MainApp/TopBar";
import {onMounted, ref} from "vue";
  import {
    onBackPress,onShow
  } from "@dcloudio/uni-app";
  import {loginUseUser} from "@/static/api/users";
import {PushMessageNotificationBar} from "@/static/utils/globalConifg";
	export default {
		components: {
			TabBar,Home,Dynamic,Message,Mine,TopBar
		},
    setup(){
      //初始化状态
      let loading =ref(false)
      //登录初始化
      onShow(()=>{
        if (currentR.value==='Home'){
          uni.$emit('topBarBackgroundColor', {bg: '#016fce'})
        }else {

        }
      })
      //初始化
      onMounted(()=>{


        const store = useStore()
        // 登录成功后跳转到主页，然后将token保存到本地
        loginUseUser({
          email: '1@qq.com',
          password: '1'
          // email: '111@qq.com',
          // password: '12312321'
        }).then(res => {
          console.log(res)
          if (res.code == 200) {
            try {
              uni.setStorageSync('token', res.token);
// 如果登录成功，则获取当前用户
              const currentUser = res.data;
// 利用 Vuex 的 dispatch 方法将用户信息存储到全局状态中
              store.dispatch('addUser', currentUser);
              console.log(store.getters.getUser)
              plus.nativeUI.toast(`登录成功，当前用户：${store.getters.getUser.u_id}`)
            } catch (e) {
              console.log(e)
            }
          }else {
          }
          loading.value = true
        })
      })

      let backButtonPress =ref(0)
      //当前路由
      let currentR = ref('Home')
      //页脚导航的可见性
      let tabBarVisibility = ref(true)

      //监听路由变化
      uni.$on('currentRouterUpdate',function(data){
        currentR.value = data.router;
      })
      //监听页脚的可见性变化
      uni.$on('tabBarVisibilityUpdate',function(b){
        tabBarVisibility.value = b.tabBarVisibility;
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
        currentR,tabBarVisibility,loading
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
