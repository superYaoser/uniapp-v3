<template>
  <view id="Publish">
    <view class="publish">
      <view class="publish__header">
        <view class="publish__header__icon--back">
          <uni-icons type="back" size="20" @click="useUniEmitTabBarVisibilityUpdate(true)"></uni-icons>
        </view>
        <view class="publish__header__button">
          <view class="publish__header__button--publish" @click="pushIt($event)">
            发布
          </view>
        </view>
      </view>
<!--      头部结束-->

    </view>
    <view class="publish__body">
      <view>
        <view class="editTools">
          <view class="item" @click="addTitle"><text class="iconfont icon-zitibiaoti"></text></view>
          <view class="item" @click="addUnderline"><text class="iconfont icon-zitixiahuaxian" :style="titleUnderline?'color:#0199fe;':'color:#333333;'"></text></view>
          <view class="item" @click="addBold"><text class="iconfont icon-zitijiacu" :style="titleBold?'color:#0199fe;':'color:#333333;'"></text></view>
          <view class="item" @click="addImage"><text class="iconfont icon-shangchuantupian"></text></view>
        </view>
        <view class="content">
          <editor
              class="myEditor"
              placeholder="写点什么儿~"
              show-img-size
          show-img-toolbar
          show-img-resize
          @ready="onEditorReady"
          ></editor>
        </view>
      </view>
    </view>

  </view>
</template>

<script>
import {ref} from "vue";

export default {
  components: {},
  setup() {

    let currentR = ref('')
    //tabbar的可见性
    const useUniEmitTabBarVisibilityUpdate = (b) => {
      uni.$emit('tabBarVisibilityUpdate', {tabBarVisibility: b})
      //通知返回的界面
      uni.$emit('currentRouterUpdate', {router: currentR.value})
    }
    //点击返回应该展示的界面
    uni.$on('tabBarCurrentRvalue', function (data) {
      currentR.value = data.router;
    })

    //存储编辑器实例
    let editorCtx = ref();
    //在页面进来的时候就要对富文本组件进行一个初始化，获取上下文，将官网获取上下文示例的代码复制粘贴一下
    const onEditorReady = ()=>{
      uni.createSelectorQuery().in(this).select('.myEditor').fields({
        context:true
      },res=>{
        console.log(res);
        editorCtx.value = res.context
      }).exec()
    }

    /*标题*/
    let titleShow = ref(false);
    const addTitle= ()=>{

      titleShow.value=!titleShow.value
      editorCtx.value.format('header',titleShow.value?'H2':false)
    }

    /*下划线*/
    let titleUnderline = ref(false);
    const addUnderline= ()=>{

      titleUnderline.value=!titleUnderline.value
      editorCtx.value.format('underline')
    }
    /*加粗*/
    let titleBold = ref(false);
    const addBold= ()=>{

      titleBold.value=!titleBold.value
      editorCtx.value.format('bold')
    }

    /*上传图片*/
    const addImage=()=>{
      uni.chooseImage({
        success:res=>{
          uni.showLoading({
            title:'loading...'
          })
          for(let i=0;i<res.tempFilePaths.length;i++){
            editorCtx.value.insertImage({
              src:res.tempFilePaths[i]
            })
          }
          uni.hideLoading()
        }
      })
    }

    //发布按钮
    const pushIt = () =>{
      editorCtx.value.getContents({
        success: function(data) {
          //data就是编辑器的数据对象
          console.log(data)
        },
        fail:function (err){
          console.log(err)
        }
      })
    }

    return {
      useUniEmitTabBarVisibilityUpdate,onEditorReady,pushIt,titleShow,addTitle,addUnderline,titleUnderline,addBold,titleBold,addImage
    }
  },
  data() {
    return {
      title: 'Hello'
    }
  },
  onLoad() {

  },
  methods: {}
}
</script>

<style scoped lang="less">
#Publish {
  width: 100%;
  height: 100%;
}

.publish {
  &__header {
    position: fixed;
    left: 0;
    top: var(--status-bar-height);
    z-index: 999;
    width: 100%;
    height: 40px;
    background-color: #f9f9f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    &__icon--back{
      margin-left: 10px;
    }
    &__button{
      &--publish{
        color: #FFFFFF;
        font-size: 0.8rem;
        width: 60px;
        height: 20px;
        border-radius: 6px;
        margin-right: 10px;
        background: #13dbf9;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
  &__body{
    margin-top: 40px;
  }
}
.editTools{
  display: flex;
  .item{
    text{
      color:#333333;
    }
    text:active{
      color:#0199fe;
    }
  }
}
.myEditor{
  background-color: #f9f9f9;
  font-size: 1rem;
}
</style>
