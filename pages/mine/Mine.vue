<template>
	<view id="Mine">
		<view class="mine__container" v-if="loading">
      <NoLogin v-if="!loginStatus" :img-change="1"></NoLogin>
      <UserDetail :need-break="false"
                  :need-follow="false"
                  :need-edit="true"
                  :user-obj="user"
                  :need-login-out="true"
                  v-if="loginStatus"></UserDetail>

    </view>
	</view>

</template>

<script>
	import {ref} from "vue";
  import {useStore} from 'vuex';
  import NoLogin from "@/components/noLogin/NoLogin";
  import UserDetail from "@/components/user/UserDetail";
  import {
    onBackPress,onShow
  } from "@dcloudio/uni-app";
  import {getUserDetailBy} from "@/static/api/users";
  export default {
		components: {
      NoLogin,UserDetail
		},
    props: {
      loginStatus: Boolean,
    },
    setup(props){
      let loginStatus = ref(props.loginStatus)
      const loginOut = ()=>{
        uni.$emit('login_out',()=>{

        })
      }
      let store
      let user = ref()
      let loading  =ref(false)
      onShow(async () => {
        loading.value = false
        store = useStore()
        let loginUser = store.getters.getUser
        let res = await getUserDetailBy(loginUser.u_id)
        console.log(res)
        if (res.code === 200) {
          user.value = res.data
        } else {

        }
        loading.value = true
      })

      return{
        loginOut,loginStatus,user,loading
      }
    }
	}
</script>

<style scoped lang="less">
@import "@/static/style/lessMain.less";
#Mine{
  position: relative;
}
.mine__container{
  background: #FFFFFF;
  width: 100vw;
  height: calc(100vh - @My-TabBar-H);
  position: relative;
}
.mine__container__header{
  position: relative;
}
</style>
