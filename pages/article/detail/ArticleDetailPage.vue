<template>
	<view>
		这是文章详细页
	</view>
	<view @click="goMypage()">返回</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		methods: {
			goMypage(){
				uni.navigateBack({
					delta:1
					//返回的页面数，如果 delta 大于现有页面数，则返回到首页。
				})
			},
		}
	}
</script>

<style>

</style>
