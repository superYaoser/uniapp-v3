<template>
	<view id="Main" style="width: 100%;height: 100%;overflow: hidden;">
		<view class="main__container" style="width: 100%;height: 100%;overflow: hidden;">
      <Home v-show="currentR==='Home'"></Home>
      <Dynamic v-show="currentR==='Dynamic'"></Dynamic>
      <Publish v-show="currentR==='Publish'"></Publish>
      <Message v-show="currentR==='Message'"></Message>
      <Mine v-show="currentR==='Mine'"></Mine>
    </view>
		<TabBar v-show="tabBarVisibility"></TabBar>
	</view>
</template>

<script>
	import TabBar from "@/components/common/TabBar.vue";
  import Home from "@/pages/home/Home";
  import Dynamic from "@/pages/pyq/Dynamic";
  import Publish from "@/pages/publish/Publish";
  import Message from "@/pages/message/Message";
  import Mine from "@/pages/mine/Mine";
  import TopBar from "@/components/MainApp/TopBar";
  import {ref} from "vue";
	export default {
		components: {
			TabBar,Home,Dynamic,Publish,Message,Mine,TopBar
		},
    setup(){
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
      return{
        currentR,tabBarVisibility
      }
    },
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {

		},
		methods: {

		}
	}
</script>

<style scoped lang="less">
#Main .main__container{
  width: 100%;
  height: 100%;
}
</style>
