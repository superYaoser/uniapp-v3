<template>
	<view class="w100 h100">
		<view class="actives__container w100 h100">
      <swiper style='width: 100%;height: 100%' :autoplay="false" @change="swiperItemChange($event)">

          <swiper-item v-for="(item1, index) in classifyList" :key="index">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;`">
              <view class="articleList__container__body" style="padding: 5px;">
                <view v-for="(item2, index) in item1.articleList" :key="index">
                  <view>{{ item2.article_title }}</view>
                  <view>{{item2.article_content}}</view>
                </view>
              </view>
            </scroll-view>
          </swiper-item>

      </swiper>
    </view>
	</view>
</template>

<script>
import {onMounted, ref} from "vue";
import {getCategoryList}from '@/static/api/category'
import {getDetailedArticle}from '@/static/api/article'

export default {
  setup(){
    // 类别列表
    let classifyList = ref();
    classifyList.value = [
      { categoryID:'1',classifyTitle: "推荐", classifyContent: "类别描述",currentPage:1, articleList:[
          {article_across: 1,
            article_class_id: "1",
            article_comment_num: 0,
            article_content: "哈哈哈哈阿松大",
            article_create_time: "2023-03-25T10:28:34.000Z",
            article_hand_support_num: 0,
            article_id: 1,
            article_logic_del: 0,
            article_preview1_path: null,
            article_preview2_path: null,
            article_real_del: 1,
            article_sort: 1,
            article_title: "天台",
            article_user_id: "2",
            article_watch_num: 0,
            class_name: "综合",
            u_name: "",
            u_sgrade: ""}
        ] },
      { categoryID:'2',classifyTitle: "热门", classifyContent: "类别描述",currentPage:1, articleList:[
          {article_across: 1,
            article_class_id: "1",
            article_comment_num: 0,
            article_content: "哈哈哈哈阿松大",
            article_create_time: "2023-03-25T10:28:34.000Z",
            article_hand_support_num: 0,
            article_id: 1,
            article_logic_del: 0,
            article_preview1_path: null,
            article_preview2_path: null,
            article_real_del: 1,
            article_sort: 1,
            article_title: "天台",
            article_user_id: "2",
            article_watch_num: 0,
            class_name: "综合",
            u_name: "",
            u_sgrade: ""}
        ] },
    ]

    onMounted(()=>{
      getDetailedArticle({"page_number":1}).then(res=>{
        classifyList.value[0].articleList=res.data
        console.log(classifyList.value[0].articleList)
      })
    })
    //记录当前页面 左右
    let currentIndex = ref()
    //左右改变
    const swiperItemChange =(e)=>{
      currentIndex.value = e.detail.current
      console.log(currentIndex.value)
    }
    return{
      classifyList,
      swiperItemChange
    }
  },
};
</script>

<style scoped>
.articleList__container__body{
  background: #f5f5f5;
}
</style>
