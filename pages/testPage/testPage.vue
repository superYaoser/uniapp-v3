<template>

	<view style="background: #bebebe;padding: 5px">
    <view class="status-bar-height"></view>
    <Comment></Comment>
<!--驱蚊器问问去为额为邱琦雯顷刻间哈科进士第三空间活动空间哈后快-->
<!--    <CommentExpand></CommentExpand>-->
<!--    <CommentReplyWindow></CommentReplyWindow>-->
	</view>
</template>

<script>
import Comment from "@/components/article/comments/CommentList";
import CommentExpand from "@/components/article/comments/CommentExpand";
import CommentReplyWindow from "@/components/article/comments/CommentReplyWindow";
	export default {
    components:{
      CommentReplyWindow,
      CommentExpand,
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
