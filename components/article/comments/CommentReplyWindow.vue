<template>
<view style="height: 100vh;width: 100vw;background: rgba(232,22,22,0.3);position: absolute;z-index: 99;top: 0;left: 0;overflow: hidden" @tap="windowClose">

  <view class="replyWindow" :style="'margin-top:calc(100vh - 175px - '+ keyHeight +')'">
    <view class="replyWindow__container" @tap.stop>
      <view class="replyWindow__container__header">
        <view style="color: silver;font-size: 0.8125rem">
          {{'回复：'}}{{getUserNameByUid(commentObj.comment_id)}}
        </view>
      </view>
      <view class="replyWindow__container__body">

        <view class="replyWindow__container__body__input">
          <textarea  class="replyWindow__container__body__input--sub"
                     focus="true"
                 placeholder-class="replyWindow__container__body__input--sub"
                 :adjust-position="false" placeholder="我有话想说..."/>
        </view>
        <view class="replyWindow__container__body__option">
          <view class="replyWindow__container__body__option--other">

          </view>
          <view class="replyWindow__container__body__option--send">发布</view>
        </view>

      </view>
    </view>
  </view>

</view>
</template>

<script>
import {onMounted, ref, watchEffect} from "vue";
import {
  onBackPress,onShow,onLoad
} from "@dcloudio/uni-app";
import {getUserInfoById} from '@/static/api/users'
import {getUserNameByUid} from '@/static/utils/globalConifg'
export default {
  props: {
    commentObj: Object,
  },
  setup(props){
    //键盘高度
    let keyHeight = ref()
    //评论对象
    let commentObj = ref()
    commentObj.value = props.commentObj

    onMounted(async () => {

    })

    //关闭事件
    const windowClose=()=>{
      console.log('用户在评论回复窗口界面 触发关闭')
      uni.$emit('comment_reply_window_close', {data: true})
    }
    //监听用户触发返回后处理请求 返回改为触发关闭事件
    onBackPress((e) => {
//backbutton 是点击物理按键返回，navigateBack是uniapp中的返回（比如左上角的返回箭头）
      // 触发返回就会调用此方法，这里实现的是禁用物理返回，顶部导航栏的自定义返回 uni.navigateBack 仍可使用
      if (e.from === 'backbutton') {
        console.log('用户在评论回复窗口界面按了返回键盘');
        windowClose()
        return true;
      }
    })

//  监听键盘高度变化
    uni.onKeyboardHeightChange((obj)=>{
      // 获取系统信息
      let _sysInfo = uni.getSystemInfoSync();
      let _heightDiff = _sysInfo.screenHeight - _sysInfo.windowHeight
      let _diff = obj.height - _heightDiff
      // 键盘高度
      keyHeight.value = (_diff > 0 ? _diff : 0) - 2 + "px";
    })
    return{
      keyHeight,windowClose,getUserNameByUid,commentObj
    }
  }
}
</script>

<style scoped>
.replyWindow{
  height: 160px;
  margin-top: calc(100vh - 170px);;
}
.replyWindow__container{
  height: 100%;
  background: #FFFFFF;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 5px 10px 8px 10px;
}
.replyWindow__container__header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  border-bottom: 0.01875rem #ececec solid;
}
.replyWindow__container__body{

}
.replyWindow__container__body__input{

}
.replyWindow__container__body__input--sub{
  font-size: 0.9375rem;
  height: 80px;
  margin: 5px 0;
}
.replyWindow__container__body__option{
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-top: 0.01875rem #ececec solid;
}
.replyWindow__container__body__option--send{
  color: #FFFFFF;
  font-size: 1rem;
  width: 50px;
  height: 30px;
  border-radius: 6px;
  margin-right: 10px;
  background: #13dbf9;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
