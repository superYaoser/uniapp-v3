<template>
	<view id="Home" class="w100 h100">
		<view class="home w100 h100">
      <view class="home__container w100 h100">
<!--        头部-->
        <view class="container__header" :style="'background:'+headerBG">
<!--          搜索-->
          <view class="header__search">
            搜索区域
          </view>
        </view>

<!--        身体-->
        <view class="container__body">

        </view>

      </view>
    </view>
	</view>
</template>

<script>
import {onMounted, ref} from "vue";

  export default {
		components: {

		},
    setup(){
      //头背景
      let headerBG = ref('#016fce')
      //页面渲染完毕
      onMounted(()=>{

      })

      return{
        headerBG
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
.home{
  &__container{
    .container__header{
      width: 100%;
      height: 50px;
    }
  }
}
</style>
