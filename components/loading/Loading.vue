<template>
  <view style="background: #fff;text-align: center;">
    <image v-if="loading" mode="widthFix" src="/static/images/utils/list_loading.gif" style="width: 90%;height: 250rpx;"></image>
  </view>
</template>

<script>
export default {
  name:'Loading',
  data() {
    return {};
  },
  /**
   * 组件的属性列表
   */
  props: {
    loading: {
      type: Boolean,
      default: true
    },
    errmsg: {
      type: String,
      default: ''
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {}
};
</script>
