<template>
	<view id="Home">
		<TabBar></TabBar>
	</view>
</template>

<script>
	import TabBar from "@/components/common/TabBar.vue"
	export default {
		components: {
			TabBar
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

<style scoped>

</style>