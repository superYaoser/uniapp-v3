<template>
	<view>
		我是搜索页
	</view>
</template>

<script>
import {
  onBackPress
} from "@dcloudio/uni-app";
	export default {
		setup(){
      //页面返回会触发的方法
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        })
      }
      //监听用户触发返回后处理请求
      onBackPress((e) => {
        console.log('用户在搜索界面按了返回键盘');
//backbutton 是点击物理按键返回，navigateBack是uniapp中的返回（比如左上角的返回箭头）
        // 触发返回就会调用此方法，这里实现的是禁用物理返回，顶部导航栏的自定义返回 uni.navigateBack 仍可使用
        if (e.from === 'backbutton') {
          pageBack()
          return true;
        } else if (e.from === 'navigateBack') {
          return false;
        }
      })
    }
	}
</script>

<style>

</style>
