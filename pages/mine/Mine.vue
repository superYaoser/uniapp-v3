<template>
	<view id="Mine">
		这是我的页
	</view>
  <view @tap.stop="loginOut">注销登录</view>
</template>

<script>
	import {ref} from "vue";

  export default {
		components: {

		},
    props: {
      loginStatus: Boolean,
    },
    setup(props){
      const loginOut = ()=>{
        uni.$emit('login_out',()=>{

        })
      }

      return{
        loginOut
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

<style scoped>

</style>
