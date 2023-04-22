<template>
	<view id="Main">
    <TopBar></TopBar>
		<view class="main__container">
      <Home v-show="currentR==='Home'"></Home>
      <Dynamic v-show="currentR==='Dynamic'"></Dynamic>
      <Publish v-show="currentR==='Publish'"></Publish>
      <Message v-show="currentR==='Message'"></Message>
      <Mine v-show="currentR==='Mine'"></Mine>
    </view>
		<TabBar></TabBar>
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
      let currentR = ref('Home')
      uni.$on('currentRouterUpdate',function(data){
        currentR.value = data.router;
      })
      return{
        currentR
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
