<template>
	<view id="TabBar">
		<view class="tabbar">
			<view><uni-icons type="home" size="30" color="#999797" @click="goHome()"></uni-icons><text>首页</text></view>
			<view><uni-icons type="pyq" size="30" color="#999797"></uni-icons><text>动态</text></view>
			<view><uni-icons type="plus-filled" size="45" color="#13dbf9"></uni-icons></view>
			<view><uni-icons type="chat" size="30" color="#999797"></uni-icons><text>消息</text></view>
			<view><uni-icons type="person" size="30" color="#999797"></uni-icons><text>我的</text></view>
		</view>
	</view>
</template>

<script>
	export default {
		name: "TabBar",
    setup(){
      let staticIconsColor = '#999797';
      let activityIconsColor='#13dbf9';

      //首页
      const goHome = (e)=>{
        console.log(e)
      }
      //动态
      const goDynamic = ()=>{

      }
      //发布
      const goPublish = ()=>{

      }
      //我的
      const goMine = ()=>{

      }

      return{
        staticIconsColor,
        goHome,
        goDynamic,
        goPublish,
        goMine
      }
    }
	}
</script>

<style lang="less" scoped>
	#TabBar {
		position: fixed;
		left: 0;
		bottom: 0;
		z-index: 999;
		width: 100%;
		height: 60px;
		background-color: #f9f9f9;

		.tabbar {
			display: flex;
			justify-content: space-around;
			align-items: center;
			width: 100%;
			height: 100%;
			view{
				  display: flex;
				  flex-direction: column;
				  align-items: center;
				  text{
					    font-size: 12px;
				  }
			}
		}
	}
</style>
