<template>
  <view style="width: 100%;height: 120rpx;background: #F5F5F5;padding: 10rpx;display: flex;align-items: center;margin: 2rpx 0">
    <view class="reactionMsgCard__body">
      <view class="reactionMsgCard__body__left">
        <view class="reactionMsgCard__body__head">
          <view class="reactionMsgCard__body__head--img" :style="'background-image: url('+ messageCardInfo.headImg +')'"></view>
        </view>
        <view class="reactionMsgCard__body__info">
          <view class="reactionMsgCard__body__info__name">
            <text>{{ messageCardInfo.name }}</text>
          </view>
          <view class="reactionMsgCard__body__info__message">
            <text>{{ messageCardInfo.message }}</text>
          </view>
        </view>
      </view>

      <view class="reactionMsgCard__body__right" @tap.stop="tapArticleCard">

        <view class="reactionMsgCard__body__right--time">
          <text>{{ messageCardInfo.time }}</text>
        </view>

        <view class="reactionMsgCard__body__right--img" v-if="messageCardInfo.article_path1">
          <view class="reactionMsgCard__body__right--img--path" :style="'background-image: url('+ messageCardInfo.article_path1 +')'"></view>
        </view>
        <view class="reactionMsgCard__body__right--text textExceedsTwoLineHiddenReplacedDots" v-else>
          {{ messageCardInfo.article_text }}
        </view>

      </view>
    </view>
  </view>
</template>

<script>
import {onMounted, ref} from "vue";
import {formatDate, formatTimestamp,defaultHeadImgPath,replaceUrlIP} from '@/static/utils/globalConifg'
import {getUserDetailBy} from '@/static/api/users'
import {getArticleDetailByID, getDetailedArticle} from '@/static/api/article'

export default {
  name: "messageCard",
  props: {
    data: Object,
    id: String,
    u_id: String
  },
  setup(props) {
    let data = props.data
    let ex = {
      article_id: 123,
      comment_id: 789,
      create_time: "2023-06-20T01:17:17.000Z",
      hand_article_id: 456,
      id: 1,
      logic_del: 0,
      message_content: "Hello, how are you?",
      message_type: 1,
      readed: 0,
      receive_user_id: 1,
      receive_user_name: "Jane",
      send_user_id: 1,
      send_user_name: "John"
    }
    //记录实体信息的信息
    let messageCardInfo = ref({
      name: data.send_user_name,
      message: data.message_content,
      time: formatDate(data.create_time),
      headImg:defaultHeadImgPath,
      article_path1:null,
      article_text:null,
    });
    // 用户实体
    let user = ref()
    onMounted(async () => {

      let res = await getUserDetailBy(data.send_user_id)
      if (res.code===200){
        user.value = res.data
        if (user.value.u_head){
          messageCardInfo.value.headImg = user.value.u_head
        }
      }
      if(data.article_id){
        let res =await getArticleDetailByID(data.article_id)
        console.log(res)
        if (res.code ===200){
          console.log(res.data.article_preview1_path)
          if (res.data.article_preview1_path){
            messageCardInfo.value.article_path1 =replaceUrlIP(res.data.article_preview1_path)
          }else {
            messageCardInfo.value.article_text = res.data.article_title
          }
        }
      }

    })


    //对话id
    let id = ref(props.id);
    //用户id
    let u_id = ref(props.u_id);

    //点击文章卡片
    const tapArticleCard=()=>{
      if (!data.article_id){
        return
      }
      console.log('点击了文章卡')
      uni.navigateTo({
        url: '/pages/article/detail/ArticleDetailPage?id='+data.article_id
      })
    }

    const tapMessageCard = () => {
      console.log("用户点击信息卡")
      if (id.value === 'action') {
        console.log("打开互动消息")
        uni.navigateTo({
          // url: '/pages/message/ReactionMessage/ReactionMessage?id=' + u_id.value
        })
      } else {
        uni.navigateTo({
          // url: '/pages/message/PrivateMessage/PrivateMessage'
        })
      }
    }


    return {
      messageCardInfo, tapMessageCard, u_id,tapArticleCard
    }
  }
};
</script>


<style scoped lang="less">
.reactionMsgCard__body {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 样式规则 */

  &__left{
    display: flex;
    align-items: center;
  }

  &__head {
    height: 100rpx;
    display: flex;
    align-items: center;
    margin-right: 16rpx;

    /* 样式规则 */

    &--img {
      width: 100rpx;
      height: 100rpx;
      background-repeat: no-repeat;
      border-radius: 50%;
      border: 0.0375rem silver solid;
      /*把背景图扩展至足够大，直至完全覆盖背景区域，
图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
      background-size: cover;
      position: relative;
      background-position: center;
      background-image: url('https://i2.hdslb.com/bfs/face/544c89e68f2b1f12ffcbb8b3c062a3328e8692d9.jpg@96w_96h.webp')
    }
  }

  &__info {
    /* 样式规则 */


    &__name {
      /* 样式规则 */
      font-size: 35rpx;
      font-weight: inherit;
      margin-bottom: 10rpx;
    }

    &__message {
      /* 样式规则 */
      font-size: 25rpx;
      color: #9b9b9b;
    }
  }

  &__right {
    /* 样式规则 */
    margin-right: 40rpx;
    display: flex;
    align-items: center;


    &--time {

      margin-top: 10rpx;
      /* 样式规则 */
      font-size: 25rpx;
      color: #9b9b9b;
      margin-right: 25rpx;
    }
    &--img{
      width: 70rpx;
      height: 100rpx;

      &--path{
        width: 70rpx;
        height: 100rpx;
        background-repeat: no-repeat;
        border-radius: 10rpx;
        border: 0.0375rem silver solid;
        /*把背景图扩展至足够大，直至完全覆盖背景区域，
  图片比例保持不变且不会失真，但某些部分被切割无法显示完整背景图像*/
        background-size: cover;
        position: relative;
        background-position: center;
      }
    }
    &--text {
      width: 70rpx;
      height: 100rpx;
      border: 0.0375rem silver solid;
      border-radius: 10rpx;
      font-size: 5rpx;
    }
  }
}
</style>
