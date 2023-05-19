<template>
	<view class="w100 h100">
		<view class="actives__container w100 h100">
      <swiper style='width: 100%;height: 100%' :autoplay="false" @change="swiperItemChange($event)" :current="clickNavIndex">

          <swiper-item v-for="(item1, index) in classifyList" :key="index">
            <scroll-view class="scrollview" scroll-y='true' :style="`width: 100%;height: 100%;`">
              <view class="articleList__container__body w100" style="padding-top: 2px;padding-bottom: 5px">
                <view v-for="(item2, index) in item1.articleList" :key="index" style="margin-bottom: 5px;">
<!--                  文章卡片-->
                  <view class="active__cart w100 h100">
                    <view  class="active__cart__container">
<!---------------------------作者栏-->
                      <view class="active__cart__container__title">
                        <view class="active__cart__container__title__container">
                          <view class="active__cart__container__title__container__img">
                            <view class="active__cart__container__title__container__img--path" :style="item2.u_head ? 'background-image: url(' + item2.u_head + ')' : 'background-image: url(' + defaultHeadImgPath + ')'"></view>
                          </view>
                          <view class="active__cart__container__title__container__text">
                            <view>
                            <view class="active__cart__container__title__container__text__basic">
                              <view style="font-size: 0.9375rem;max-width: 80%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;display: inline-block">{{ item2.u_name }}</view>
                              <view class="active__cart__container__title__container__text__basic--level">{{item2.u_sgrade}}</view>
                            </view>

                            <view style="display:flex;align-items: center;flex-direction: row;font-size: 0.8125rem;color: #bcbcbc">
                              <view class="active__cart__container__title__container__text--time">{{ item2.article_create_time }}</view>
                              <view class="active__cart__container__title__container__text--className">{{ item2.class_name }}</view>
                            </view>
                            </view>

                            <view class="active__cart__container__title__container__text__follow">
                              <view style="width: 100%;height: 100%;">
                                <view class="active__cart__container__title__container__text__follow--be" v-show="item2.concern_be===1">已关注</view>
                                <view class="active__cart__container__title__container__text__follow--no" v-show="item2.concern_be===0||!item2.concern_be">+关注</view>
                              </view>
                            </view>

                          </view>
                        </view>
                      </view>

<!--                    主体文本-->
                      <view class="active__cart__container__text w100 h100">
                        <view class="active__cart__container__text__container  w100 h100">
                          <view class="active__cart__container__text__container__title">{{ item2.article_title }}</view>
                          <view class="active__cart__container__text__container__text"><view>{{item2.article_text}}</view></view>

<!--                          封面-->
                          <view class="active__cart__container__text__container__cover" >
                            <view class="active__cart__container__text__container__cover__img" v-if="item2.article_preview1_path"
                                  :style="'background-image: url('+item2.article_preview1_path+');width: '+!item2.article_preview2_path?'100%':'49%'"
                                  style="margin-right: 1%;"></view>
                            <view class="active__cart__container__text__container__cover__img" :style="'background-image: url('+item2.article_preview2_path+')'" v-if="item2.article_preview2_path"></view>
                          </view>

<!--                          点赞 评论 观看数量-->
                          <view class="active__cart__container__text__container__interactInfo" >
                            <view class="active__cart__container__text__container__interactInfo__container" >
                              <view class="active__cart__container__text__container__interactInfo__container--watch">
                                <uni-icons color='#999999' type="eye" size="18"></uni-icons>
                                <text>{{item2.article_watch_num}}</text>
                              </view>

                              <view class="active__cart__container__text__container__interactInfo__container--comment">
                                <uni-icons color='#999999' type="chatbubble" size="18" ></uni-icons>
                                <text>{{item2.article_comment_num}}</text>
                              </view>

                              <view class="active__cart__container__text__container__interactInfo__container--hand">
                                <uni-icons color='#999999' type="hand-up" size="18"></uni-icons>
                                <text>{{item2.article_hand_support_num}}</text>
                              </view>

                            </view>
                          </view>

                        </view >
                      </view>

                    </view>
                    </view>


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
import {getDetailedArticle} from "@/static/api/article";

export default {
  setup(){
    /*****************全局配置*********************************/

    //默认文章封面
    let defaultCoverImgPath = 'https://pics4.baidu.com/feed/5882b2b7d0a20cf429edbfd4b3b56b3aadaf9980.jpeg@f_auto?token=b811138c15892653e907b9d2c913b343'

    //默认头像地址
    let defaultHeadImgPath = 'https://i0.hdslb.com/bfs/medialist/cover/1febf851a41a3b87b400c386771f60fa6d5d7271.jpg@320w_182h_1c.webp'
    /*****************全局配置 end *********************************/

    // 类别列表
    let classifyList = ref();
    classifyList.value = [
      { categoryID:'1yao',classifyTitle: "最新", classifyContent: "类别描述",currentPage:1, articleList:[{}] },
      { categoryID:'2yao',classifyTitle: "推荐", classifyContent: "类别描述",currentPage:1, articleList:[{}] },
      { categoryID:'3yao',classifyTitle: "热门", classifyContent: "类别描述",currentPage:1, articleList:[{}] },
    ]
    // 最新的文章列表
    let lateArticleList=ref([])
    //推荐的文章列表
    let recommendArticleList=ref([])
    //热门的文章列表
    let hotArticleList=ref([])

    //将请求文章初始列表 封装
    const getDetailedArticleByJsonData = async (data)=>{
      let temp = await getDetailedArticle(data)
      let res =temp.data
      return res
    }


    //用于用户点击了哪个导航跳转到哪个页面
    let clickNavIndex = ref()
    uni.$on('home_article_follow_nav_change',function(e){
      clickNavIndex.value = e.page;
      console.log(clickNavIndex.value)
    })

    onMounted(async () => {
      //初始化 列表
      lateArticleList.value = await getDetailedArticleByJsonData({"sort": 1, "page_number": 1, "articleContentMaxWord": 100,"select_title_num":3})
      recommendArticleList.value = await getDetailedArticleByJsonData({"sort": 0, "page_number": 1, "articleContentMaxWord": 100,"select_title_num":1})
      hotArticleList.value = await getDetailedArticleByJsonData({"sort": 1, "page_number": 1, "articleContentMaxWord": 100,"select_title_num":2})
        classifyList.value[0].articleList = lateArticleList.value
        classifyList.value[1].articleList = recommendArticleList.value
        classifyList.value[2].articleList = hotArticleList.value
      console.log(classifyList.value)
    })

    //记录当前页面 左右
    let currentIndex = ref()
    //左右改变
    const swiperItemChange =(e)=>{
      currentIndex.value = e.detail.current
      uni.$emit('home_article_nav_change', {currentNavIndex: currentIndex.value})
    }
    return{
      classifyList,
      swiperItemChange,
      defaultCoverImgPath,
      clickNavIndex,
      defaultHeadImgPath
    }
  },
};
</script>

<style scoped lang="less">
.articleList__container__body{
  background: #f5f5f5;
}
.active__cart{
  background: #FFFFFF;

  &__container {
    padding: 5px 3px 5px 5px;
    //作者栏
    &__title {
      margin-bottom: 8px;

      &__container {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        &__text{

          &__basic{
            display: flex;
            align-items: center;
            width: 200px;
            &--level{
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: 10px;
              width: 15px;
              height: 15px;
              background: #ffdc00;
              color: #FFFFFF;
              font-size: 0.5625rem;
              border-radius: 50%;
              text-shadow: 0 0 5px #d1b259, 0 0 5px #d5ba3b;
            }
          }
        }
        &__img {

          width: 11%;
          height: 35px;
          display: flex;
          justify-content: center;
          align-items: center;
          &--path{
            width: 27px;
            height: 27px;
            background-repeat: no-repeat;
            border-radius: 50%;
            /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
            background-size: cover;
            position: relative;
            cursor: pointer;
          }
        }

        &__text {
          margin-left: 5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 80%;
          &--time {
margin-right: 5px;
          }

          &--className {


          }
          &__follow{
            width: 45px;
            height: 18px;
            font-size: 0.8125rem;

            &--be,&--no{
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 5px;
            }
            &--be{
              border: 1px solid #bcbcbc;

              color: #bcbcbc;

            }

            &--no{
              border: 1px solid #46a7ff;

              color: #46a7ff;



            }

          }
        }
      }
    }

    //  文本
    &__text {
      margin-top: 3px;

      &__container {
        &__title{
          font-weight: inherit;
          font-size: 1rem;
          margin-bottom: 5px;
        }

        &__text {
          color: #787878;
font-size: 0.9375rem;
        }

        &__cover {
display: flex;
          overflow: hidden;
          &__img {
            width: 49%;
            height: 150px;
            background-repeat: no-repeat;
            border-radius: 8px;
            /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
            background-size: cover;
            position: relative;
            cursor: pointer;
          }
        }
        &__interactInfo{
          margin-top: 5px;
          display: flex;
          justify-content: flex-end;


          &__container{
            width: 50%;
            display: flex;
            justify-content: flex-end;
            margin-right: 20px;

            view{
              display: flex;
              align-items: center;
              margin-left: 25px;
            uni-icons{
              color:#f5f5f5;
            }

              text{
                margin-right: 3px;
                font-size: 0.95rem;
                color: #999999;
              }
            }
          }
        }
      }
    }
  }

}
</style>
