<template>
  <!--  这个 模板卡 需要传入 {是否需要关注按钮} {评论id}-->
  <view class="w100">
    <Loading v-if="loading"></Loading>
    <view class="commentCard__container" v-if="!loading">
      <view class="commentCard__container__header">

        <view class="commentCard__container__header--author">
          <view class="commentCard__container__header--author--head">
            <view class="commentCard__container__header--author--head--img" :style="commentObj.comment_user_u_head ? 'background-image: url(' + commentObj.comment_user_u_head + ')' : 'background-image: url(' + defaultHeadImgPath + ')'">

            </view>
            <view class="commentCard__container__header--author--head--info">
              <view class="commentCard__container__header--author--head--info--top">
                <view class="commentCard__container__header--author--head--info--top--name">
                  {{ commentObj.comment_user_u_name }}
                </view>
                <view class="commentCard__container__header--author--head--info--top--level">
                  {{ commentObj.comment_user_u_sgrade }}
                </view>
              </view>
              <view class="commentCard__container__header--author--head--info--from">
                <view v-if="floor_num">{{floor_num}}F</view> 来自佛罗里达州
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="commentCard__container__body">
        <view class="commentCard__container__body__container">
          <view></view>
          <view class="commentCard__container__body__container__content">
            <view class="commentCard__container__body__container__content--main" @tap.stop="iReplyYourComment()">
              <view class="commentCard__container__body__container__content--main--reply" v-if="commentObj.comment_father_id!=null">
                回复
                <text class="commentCard__container__body__container__content--main--reply--user">
                  {{ commentObj.comment_user_father_name }}：
                </text>
              </view>
              {{ commentObj.comment_content }}
            </view>
            <view class="commentCard__container__body__container__content--reply" v-if="comment_list[0].comment_list_user_id!=null&&need_small_window"
                  style="margin-right: 10px"
                  @tap.stop="showExpand(floor_num)">
              <view v-for="(item1, index1) in comment_list" :key="index1">
              <view class="commentCard__container__body__container__content--reply--common" v-if="item1.comment_list_user_name">
                <view class="commentCard__container__body__container__content--reply--common--author">
                  {{ item1.comment_list_user_name }}
                  <view class="commentCard__container__body__container__content--reply--common--author--self" v-if="item1.comment_list_user_id===commentObj.comment_user_id">
                    作者
                  </view>
                </view>
                ：{{ item1.comment_list_user_content }}
              </view>
              </view>
              <view class="commentCard__container__body__container__content--reply--more" v-if="comment_list[0].comment_list_user_content!=null">全部{{ commentObj.comment_reply_num }}条评论 >></view>
            </view>
          </view>
          <view class="commentCard__container__body__container__interaction">
            <view class="commentCard__container__body__container__interaction--time">
              {{ formatDate(commentObj.comment_create_time) }}
            </view>
            <view class="commentCard__container__body__container__interaction--act">
              <view class="commentCard__container__body__container__interaction--act--comment">
                <uni-icons color='#999999' type="chatbubble" size="16"></uni-icons>
                <!--              <text>{{articleInfo.article_comment_num}}</text>-->
                <text>{{ commentObj.comment_reply_num }}</text>
              </view>

              <view class="commentCard__container__body__container__interaction--act--hand">
                <uni-icons color='#999999' type="hand-up" size="16"></uni-icons>
                <!--              <text>{{articleInfo.article_hand_support_num}}</text>-->
                <text>{{ commentObj.comment_hand_support_num }}</text>
              </view>
            </view>
          </view>
        </view>

      </view>

    </view>
  </view>
</template>

<script>
import {onMounted, ref} from "vue";
import {getUserNameByUid, getUserObjByUid,defaultHeadImgPath,formatDate} from '@/static/utils/globalConifg'
import {getCommentByArticleId, getCommentSonById} from '@/static/api/act'
import Loading from "@/components/loading/Loading";

export default {
  components: {Loading},
  props: {
    commentObj: Object,
    floor_num: Number,
    province: String,
    need_small_window:Boolean,
  },
  setup(props) {
    //加载情况
    let loading = ref(true)
    //评论对象
    let commentObj = ref()
    commentObj.value = props.commentObj
    //楼层
    let floor_num = ref(0)
    floor_num.value = props.floor_num
    //省份
    let province = ref('')
    province.value = props.province
    //需要小窗口
    let need_small_window = ref(true)
    need_small_window.value = props.need_small_window

    //其评论 的父亲评论的 用户主体
    let father_user = ref()

    //评论 该评论的 数组
    let comment_list = ref([
        {comment_list_user_id: null,comment_list_user_name:null,comment_list_user_content:null},
        {comment_list_user_id: null,comment_list_user_name:null,comment_list_user_content:null},
        {comment_list_user_id: null,comment_list_user_name:null,comment_list_user_content:null},
    ])
    //点击 展开更多 评论
    const showExpand = (floor_num)=>{
      uni.$emit('commentCard_showExpand', {
        data: commentObj.value,
        floor_num:floor_num
      })
    }
    //用户点击回复主体 回复评论
    const iReplyYourComment = ()=>{
      uni.$emit('commentCard_replyComment', {
        data: commentObj.value,
      })
    }

    //通过评论id 获取儿子评论 并赋值给comment_list
    const getSonComment = async (id) => {
      let res = await getCommentSonById(id)
      console.log(res)
      if (res.code === 200) {
        for (let i=0;i<res.data.length;i++){
          if (!res.data[i].comment_user_id){
            continue
          }
          if (i>=3){
            break
          }
          comment_list.value[i].comment_list_user_id = res.data[i].comment_user_id
          comment_list.value[i].comment_list_user_name = res.data[i].comment_user_u_name
          comment_list.value[i].comment_list_user_content = res.data[i].comment_content
        }
      }
    }
    onMounted(async () => {
      await getSonComment(commentObj.value.comment_id)
      loading.value = false
    })
//-------------------------监听--------------------------------------------------------------------------------------------------------------------------------------------
    uni.$on('CommentCard_update',async function (e) {
      if (commentObj.value.comment_id === e.id && e.id!=null){
        console.log("更新"+e.id)
        await getSonComment(commentObj.value.comment_id)
        commentObj.value.comment_reply_num = ++commentObj.value.comment_reply_num
      }
    })

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    return {
      commentObj, floor_num, province,comment_list,defaultHeadImgPath,loading,formatDate,showExpand,father_user
      ,iReplyYourComment
    }
  }
}
</script>

<style scoped lang="less">
.commentCard__container {

  padding: 10px 0 0.03125rem 10px;

  &__header {
    &--author {
      &--head {
        display: flex;
        align-items: center;

        &--img {
          width: 25px;
          height: 25px;
          background-repeat: no-repeat;
          border-radius: 50%;
          border: 0.0375rem silver solid;
          /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
          background-size: cover;
          position: relative;
          background-position: center;
        }

        &--info {
          margin-left: 8px;

          &--top {

            display: flex;
            align-items: center;
            color: #7f7f7f;

            &--name {
              font-size: 0.775rem;
            }

            &--level {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: 10px;
              width: 12px;
              height: 12px;
              background: #ffdc00;
              color: #FFFFFF;
              font-size: 0.4625rem;
              border-radius: 50%;
              text-shadow: 0 0 5px #d1b259, 0 0 5px #d5ba3b;
            }
          }

          &--from {
            display: flex;
            align-items: center;
            color: #7f7f7f;
            font-size: 0.675rem;
          }
        }
      }
    }
  }

  &__body {
    margin-top: 6px;
    width: 100%;

    &__container {
      display: flex;
      padding-left: 33px;
      flex-direction: column;

      &__content {
        font-size: 0.875rem;

        width: 100%;
        padding-right: 5px;

        &--main {
          display: flex;
          align-items: center;
          margin-bottom: 10px;

          &--reply {
            display: flex;
            align-items: center;

            &--user {
              display: flex;
              align-items: center;
              font-weight: inherit;
              color: #6da7cc;
              margin-left: 0.2125rem;
            }
          }

        }

        &--reply {
          //width: 100%;
          background: #f4f4f4;
          border-radius: 5px;
          padding: 8px 6px;

          &--common {
            display: flex;
            align-items: center;

            &--user {
              display: flex;
              align-items: center;
              font-weight: inherit;
              color: #6da7cc;
            }

            &--author {
              display: flex;
              align-items: center;
              font-weight: inherit;
              color: #6da7cc;

              &--self {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 3px;
                margin-right: 3px;
                width: 22px;
                height: 0.9rem;
                background: #ffdc00;
                color: #FFFFFF;
                font-size: 0.5625rem;
                border-radius: 10%;
                text-shadow: 0 0 5px #d1b259, 0 0 5px #d5ba3b;
              }
            }
          }

          &--more {

            margin-top: 10px;
            font-size: 0.7625rem;
            color: silver;
          }
        }
      }

      &__interaction {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.75rem;
        color: silver;
        margin-top: 0.3125rem;
        border-bottom: 0.025rem #d5d5d5 solid;
        padding-bottom: 0.2125rem;

        &--time {


        }

        &--act {
          display: flex;
          align-items: center;
          margin-right: 0.5rem;

          view {
            margin-right: 1rem;
            display: flex;
            align-items: center;
          }

          &--comment {


          }

          &--hand {

          }

        }
      }
    }
  }
}

</style>
