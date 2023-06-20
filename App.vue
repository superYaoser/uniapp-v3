<script>
import socket from '@/static/socket/main.js';
import {PushMessageNotificationBar} from '@/static/utils/globalConifg'
	export default {
    setup(){
      socket.on('action', function (data) {
        uni.$emit('message_action',{

          data:data
        })
      });
    },
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang='scss'>

	/*每个页面公共css */
	/* 需要放到文件最上面 */
	@import '@/uni_modules/uni-scss/variables.scss';
	@import '@/static/style/main.css';

	/* 发布页需要的素材1 */
	@import url("@/static/iconfont/publish/iconfont.css");
////  字体
//  @font-face {
//    font-family: 'Source Han Serif';
//    src: url('./static/style/Source_Han_Serif_SC_Light_Light.otf'); /* 如果换成woff或者woff2文件格式，请修改后缀名 */
//  }
//  * {
//    font-family: 'Source Han Serif', serif;
//  }
</style>
