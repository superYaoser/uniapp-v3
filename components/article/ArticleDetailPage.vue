<template>
<view style="padding: 5px 5px 10px;background: #FFFFFF;margin-top: 8px;height: 100%;">
  <Loading :loading="false"></Loading>

  <scroll-view scroll-y='true' style="width: 100%;height: 100%;">
    <view class="articleInfo">
      <view class="articleInfo__container">

        <view class="articleInfo__container__header">
          <view class="articleInfo__container__header__authorInfo">

            作者信息
          </view>

          <view class="articleInfo__container__header__title">
            标题信息
          </view>
        </view>

        <view class="articleInfo__container__body">
          <view class="articleInfo__container__body--html">
            <rich-text :nodes="html" preview="true" selectable="true" space="true"></rich-text>
          </view>
        </view>

        <view class="articleInfo__container__footer">

        </view>

      </view>
    </view>

  </scroll-view>
  <view></view>

</view>
</template>

<script>
import { getCurrentInstance } from "vue";
import {
  onLoad
} from "@dcloudio/uni-app";

import {onMounted, ref} from "vue";
import {getArticleByID} from '@/static/api/article'
import App from "@/App";
import {getUserInfoById} from '@/static/api/users'
import {sendMessageToScreen} from'@/static/utils/globalConifg'
import Loading from "@/components/loading/Loading";
export default {
  components: {Loading, App},
  setup() {
    //作者信息
    let authorInfo = ref()
    //文章信息
    let articleInfo = ref()

    //标准写法 获取个人信息
    const getAuthorInfo = async (id)=>{
      try {
        const res = await getUserInfoById(id);
        if (res.code === 200){
          // Process the result here
          return res.data[0]
        } else {
          // Handle error here
          plus.nativeUI.toast(`获取个人信息错误
          代码：${res.code}`,{ duration:'long'})
          // sendMessageToScreen({message:'获取个人信息错误'})
        }
      } catch (error) {
        // Handle any exceptions here
        plus.nativeUI.toast(`获取个人信息错误
          代码：${error}`,{ duration:'long'})
      }
    }


    let html =ref(`<div style='color:red' class='classTest'>文章加载失败</div>`)
    //记录文章id
    let articleId = ref('1');
    onLoad(async (option) => {
      let id = option.id;
      articleId.value = id
      //获取文章信息
      await getArticleByID(articleId.value).then(res => {
        console.log(res)
        if (res.code === 200) {
          //赋值文章信息
          articleInfo.value = res.data[0]
          html.value = articleInfo.value.article_content
        }else {
        }
      })
      const regex = new RegExp('<img', 'gi');
      html.value= html.value.replace(regex, `<img style="max-width:100% !important;height:auto;display:block;margin: 0 auto;width:98%;border-radius: 8px;"`);

      // 赋值作者信息
      authorInfo.value = await getAuthorInfo(articleInfo.value.article_user_id)
    })

    //

    return{
      articleId,html,authorInfo
    }
  }
}
</script>

<style scoped lang="less">
.articleInfo{

  &__container{

    &__header{

      &__authorInfo{
        height: 40px;
        background: #b52424;
      }
      &__title{
        height: 60px;
        background: #73b7f4;
      }
    }

    &__body{
      font-size: 1.08rem;

      &--html{
        padding-bottom: 10px;
      }
    }

  }

}
</style>
