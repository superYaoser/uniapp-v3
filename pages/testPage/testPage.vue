<template>

	<view style="background: #bebebe;padding: 5px">
    <view class="status-bar-height"></view>
    <Comment></Comment>
	</view>
</template>

<script>
import Comment from "@/components/article/comments/CommentList";
	export default {
    components:{
      Comment
    },
		data() {
			return {

			};
		}
	}
</script>

<style lang="less">

</style>
