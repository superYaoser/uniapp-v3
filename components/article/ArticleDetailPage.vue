<template>
<view>
  <rich-text :nodes="html" preview="true" selectable="true" space="true"></rich-text>
</view>
</template>

<script>
import {
  onLoad
} from "@dcloudio/uni-app";

import {onMounted, ref} from "vue";
import {getArticleByID} from '@/static/api/article'
import App from "@/App";
export default {
  components: {App},
  setup() {
    onMounted(async ()=>{

    })
    let html =ref(`<div style='color:red' class='classTest'>hello world</div>`)
    //记录文章id
    let articleId = ref('1');
    onLoad(async (option) => {
      let id = option.id;
      articleId.value = id
      await getArticleByID(articleId.value).then(res => {
        console.log(res)
        if (res.code === 200) {

          html.value = res.data[0].article_content
          console.log(res.data)
        }
      })
      const regex = new RegExp('<img', 'gi');
      html.value= html.value.replace(regex, `<img style="max-width:100% !important;height:auto;display:block;margin: 0 auto;width:95%;border-radius: 8px;"`);

    })

    //

    return{
      articleId,html
    }
  }
}
</script>

<style scoped lang="less">

</style>
