<template>
  <view id="Publish">
    <view class="publish">
      <view class="publish__header">
        <view class="publish__header__icon--back">
          <uni-icons type="back" size="20" @tap="pageBack()"></uni-icons>
        </view>
        <view class="publish__header__button">
          <view class="publish__header__button--publish" @tap="pushIt($event)">
            发布
          </view>
        </view>
      </view>
      <!--      头部结束-->

    </view>
    <view class="publish__body" style="padding: 10rpx 33rpx">
      <view>
        <!--        标题-->
        <view class="Title w100">
          <view class="uni-input-wrapper">
            <input class="uni-input" style="height: 3.125rem;" placeholder="标题（必填）"
                   @input="clearInput"
                   v-model="titleValue"
                   :adjust-position="false"
                   :maxlength="30"/>
          </view>

        </view>
        <!--        编辑器-->
        <view class="content">
          <editor
              class="myEditor"
              placeholder="请尽情发挥吧..."
              show-img-size
              show-img-toolbar
              show-img-resize
              @ready="onEditorReady"
              :style="`height: calc(75vh - ${keyHeight}px);`"
          ></editor>
        </view>
        <view class="style__follow displayF displayJCSB border1S-surround" >
          <view class="editorStyle">
            <view class="item" @tap="addTitle">
              <text class="iconfont icon-zitibiaoti"></text>
            </view>
            <view class="item" @tap="addUnderline">
              <text class="iconfont icon-zitixiahuaxian"
                    :style="titleUnderline?'color:#0199fe;':'color:#333333;'"></text>
            </view>
            <view class="item" @tap="addBold">
              <text class="iconfont icon-zitijiacu" :style="titleBold?'color:#0199fe;':'color:#333333;'"></text>
            </view>
            <view class="item" @tap="addImage">
              <text class="iconfont icon-shangchuantupian"></text>
            </view>
          </view>
          <!--          类别-->
          <view class="category__select">
<!--            <uni-data-select-->
<!--                v-model="categoryID"-->
<!--                :localdata="categoryList"-->
<!--                @change="categoryChange"-->
<!--                placeholder="请选择类别"-->
<!--                position="top"-->
<!--            ></uni-data-select>-->
          </view>
        </view>


      </view>
    </view>

  </view>
</template>

<script>
import {onMounted, ref} from "vue";
import {baseUrl, replaceUrlIP} from '@/static/utils/globalConifg'
import {getCategoryList} from '@/static/api/category'
import {pushNewArticle} from '@/static/api/article'
import {enterWord, replaceImgSrc} from "@/static/utils/globalConifg";
import {
  onBackPress
} from "@dcloudio/uni-app";

export default {
  components: {

  },
  setup() {
    //键盘高度
    let keyHeight = ref(0)
    //  监听键盘高度变化
    uni.onKeyboardHeightChange((obj)=>{
      // 获取系统信息
      let _sysInfo = uni.getSystemInfoSync();
      let _heightDiff = _sysInfo.screenHeight - _sysInfo.windowHeight
      let _diff = obj.height - _heightDiff
      // 键盘高度
      keyHeight.value = (_diff > 0 ? _diff : 0) - 2;
    })
    //页面返回会触发的方法
    const pageBack = () => {
      uni.navigateBack({
        delta: 1
        //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
      })
    }
    let backButtonPress = ref(0)
    //监听用户触发返回后处理请求
    onBackPress((e) => {
      console.log('用户在搜索界面按了返回键盘');
//backbutton 是点击物理按键返回，navigateBack是uniapp中的返回（比如左上角的返回箭头）
      // 触发返回就会调用此方法，这里实现的是禁用物理返回，顶部导航栏的自定义返回 uni.navigateBack 仍可使用
      if (e.from === 'backbutton') {
        backButtonPress.value++;
        if (backButtonPress.value > 1) {
          pageBack()
        } else {
          plus.nativeUI.toast('再按一次退出编辑');
        }
        setTimeout(() => {
          backButtonPress.value = 0;
        }, 1500);
        return true;
      } else if (e.from === 'navigateBack') {
        return false;
      }
    })

    //----------下面全是老代码 上面是新代码--23，6，14--------------------------------------------------------------------------------------------------------

    //组件挂载完成后执行的函数
    onMounted(() => {
      console.log("publish挂载完毕")

      getCategoryList().then(res => {
        if (res.code == 200) {
          let tempList = res.data
          categoryList.value = tempList.map(item => ({
            value: item.class_id,
            text: item.class_name
          }));
          console.log(categoryList.value)
        }
      })
    })

    let currentR = ref('')
    //tabbar的可见性
    const useUniEmitTabBarVisibilityUpdate = (b) => {
      uni.$emit('tabBarVisibilityUpdate', {tabBarVisibility: b})
      //通知返回的界面
      uni.$emit('currentRouterUpdate', {router: currentR.value})
    }

    //存储编辑器实例
    let editorCtx = ref();
    //在页面进来的时候就要对富文本组件进行一个初始化，获取上下文，将官网获取上下文示例的代码复制粘贴一下
    const onEditorReady = () => {
      uni.createSelectorQuery().in(this).select('.myEditor').fields({
        context: true
      }, res => {
        console.log(res);

        editorCtx.value = res.context
      }).exec()
    }

    /*标题*/
    let titleShow = ref(false);
    const addTitle = () => {

      titleShow.value = !titleShow.value
      editorCtx.value.format('header', titleShow.value ? 'H2' : false)
    }

    /*下划线*/
    let titleUnderline = ref(false);
    const addUnderline = () => {

      titleUnderline.value = !titleUnderline.value
      editorCtx.value.format('underline')
    }
    /*加粗*/
    let titleBold = ref(false);
    const addBold = () => {

      titleBold.value = !titleBold.value
      editorCtx.value.format('bold')
    }

    /*上传图片*/
    const addImage = () => {
      uni.chooseImage({
        sizeType: ['original', 'compressed'],
        count: 1,
        success(res) {
          console.log(res.tempFilePaths[0])
          uni.uploadFile({
            url: baseUrl + 'upload/image', //域名+上传文件的请求接口 (根据你实际的接口来)
            filePath: res.tempFilePaths[0], // tempFilePath可以作为img标签的src属性显示图片 服务器图片的路径
            name: 'image', //上传到服务器的参数，自定义
            header: {
              "Content-Type": "multipart/form-data",
              "authorization": uni.getStorageSync('token'),
            },
            success(res) {
              let data = JSON.parse(res.data)
              console.log(data)
              editorCtx.value.insertImage({
                width: '100%', //设置宽度为100%防止宽度溢出手机屏幕
                height: 'auto',
                src: replaceUrlIP(data.imageUrl), //服务端返回的url
                alt: '图像',
                success: function () {
                  console.log('insert image success')
                }
              })
              console.log(editorCtx.value)
            }
          })
        }
      })
    }

    //发布按钮
    const pushIt = () => {
      editorCtx.value.getContents({
        success: function (data) {
          //data就是编辑器的数据对象 这段代码就是将纯文本text中的所有回车替换为一个词
          data.text = data.text.replace(/[\r\n]+/g, enterWord)
          console.log(data.text)
          let articleDataJson = {
            "title": titleValue.value,
            "text": data.text,
            "content": data.html,
            "category": categoryID.value
          }
          pushNewArticle(articleDataJson).then(res => {
            console.log(res)
            if (res.code == 200) {
              plus.nativeUI.toast(`发布成功`)
              pageBack()
            } else {
              plus.nativeUI.toast(`文章发布失败
              错误原因：${res.message}
              错误代码：${res.code}`);
            }
          }).catch(err => {
            plus.nativeUI.toast(`文章发布发生异常
            原因：${err}`)
          })

        },
        fail: function (err) {
          console.log(err)
        }
      })
    }

    //类别
    let categoryID = ref('1')
    let categoryList = ref()
    const categoryChange = (e) => {
      console.log("类别发生了改变")
    }
    //标题
    let titleValue = ref()


    return {
      useUniEmitTabBarVisibilityUpdate, onEditorReady, pushIt, titleShow, addTitle, addUnderline,
      titleUnderline, addBold, titleBold,
      addImage, categoryID, categoryList, categoryChange, titleValue,keyHeight,pageBack
    }
  }
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

    &__icon--back {
      margin-left: 10px;
    }

    &__button {
      &--publish {
        color: #FFFFFF;
        font-size: 0.8rem;
        width: 60px;
        height: 30px;
        border-radius: 6px;
        margin-right: 10px;
        background: #13dbf9;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  &__body {
    margin-top: 40px;
  }
}

.editorStyle {
  display: flex;

  view {
    margin: 0 10px;
  }

  .item {
    text {
      color: #333333;
      font-size: 30px;
    }

    text:active {
      color: #0199fe;
    }
  }
}

.myEditor .Title {
  background-color: #f9f9f9;
  font-size: 1rem;
}
.myEditor{
  border: 1px #f1f1f1 solid;
  border-radius: 10rpx;
  padding: 10rpx;
}

.category__select {
  width: 90px;
  height: 20px;
  margin-right: 20px;
}


.style__follow {
  padding: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 10rpx;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;

  margin-bottom: 10px;
}
</style>
