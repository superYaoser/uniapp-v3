<template>
  <view id="Publish">
    <view class="publish">
      <view class="publish__header">
        <view class="publish__header__icon--back">
          <uni-icons type="back" size="20" @click="useUniEmitTabBarVisibilityUpdate(true)"></uni-icons>
        </view>
        <view class="publish__header__button">
          <view class="publish__header__button--publish">
            发布
          </view>
        </view>
      </view>
<!--      头部结束-->

    </view>
    <view class="publish__body">
      这是发布页
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
    return {
      useUniEmitTabBarVisibilityUpdate,
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
</style>
