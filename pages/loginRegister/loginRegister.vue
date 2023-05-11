<template>
	<view class="login-content">
		<view class="login-title">
			登录
		</view>
		<view class="iphone">
			<input placeholder="输入手机号" :value="iphoneValue" @input="clearInput" />
			<uni-icons type="closeempty" color="#808080" size="25" v-if="showClearIcon" @click="clearIcon"></uni-icons>
		</view>

		<view class="password" v-if="type==2">
			<!-- <input type="password" placeholder="输入密码" /> 要显示密码就不要设置type="password"-->
			<input placeholder="请输入密码" v-model="passwordValue" :password="showPassword" />
			<uni-icons type="eye-filled" color="#808080" size="25" @click="changePassword"></uni-icons>
		</view>
		<view class="test" v-if="type==1">
			<input type="text" placeholder="输入验证码" v-model="testValue" />
			<view class="get-test" type="default" @click="getTest()" v-if="showTimer">获取验证码</view>
			<view class="get-test" type="default" v-else>{{timer+'s'}}</view>
		</view>
		<view class="test-btn" v-if="type==2" @click="setLoginType(1)">手机验证码登录>></view>
		<view class="password-btn" v-if="type==1" @click="setLoginType(2)">密码登录>></view>
		<view class="login-btn" @click="Login()">登录</view>
	</view>
</template>

<script>
	import {
		loginUseUser
	} from "@/static/api/users";

	export default {
		created() {
			console.log('App Launch')
			// token标志来判断
			let token = uni.getStorageSync('token');
			console.log(token);
			if (!token) {
				console.log('没有token'),
					//跳到登录页面.relaunch可以打开任何界面
					uni.reLaunch({
						url: '/pages/loginRegister/loginRegister'
					})
			} else {
				console.log('有token')
				//跳到首页,.relaunch可以打开任何界面
				uni.reLaunch({
					url: '/pages/MainApp'
				})
			}

		},

		data() {
			return {
				iphoneValue: '', //手机号码
				passwordValue: '', //密码
				testValue: '', //验证码
				showPassword: true, //是否显示密码
				showClearIcon: false, //是否显示清除按钮
				type: 2, //登录的状态 - - - 1是验证码登录、2是密码登录
				token: '',
				timer: 0, //验证码时间
				showTimer: true, //是否显示验证码时间
			}
		},

		methods: {
			// 显示隐藏密码
			changePassword: function() {
				this.showPassword = !this.showPassword;
			},
			// 判断是否显示清除按钮
			clearInput: function(event) {
				this.iphoneValue = event.detail.value;
				if (event.detail.value.length > 0) {
					this.showClearIcon = true;
				} else {
					this.showClearIcon = false;
				}
			},
			// 清除内容/隐藏按钮
			clearIcon: function() {
				this.iphoneValue = '';
				this.showClearIcon = false;
			},
			// 切换登录的方式
			setLoginType(type) {
				this.type = type
			},
			// 密码登录
			Login() {
				// 登录成功后跳转到主页，然后将token保存到本地
				loginUseUser({
					email: '1@qq.com',
					password: '1'
				}).then(res => {
					console.log(res)
					if (res.code == 200) {
						try { 
							uni.setStorageSync('token', res.token);
						} catch (e) {
							console.log(e)
						}
						uni.redirectTo({
							url: '/pages/MainApp'
						});
					} else {

					}
				})
			},
			// 获取验证码
			getTest() {

			},
			// 设置验证码时间动态减少
			timeDown(num) {
				let that = this;
				// 当时间为0时,恢复为按钮,清除定时器
				if (num == 0) {
					that.showTimer = true;
					return clearTimeout();
				} else {
					that.showTimer = false;
					setTimeout(function() {
						that.timer = num - 1
						that.timeDown(num - 1)
					}, 1000) //定时每秒减一
				}
			},
			// 下面是可以封装起来引入的部分
			// 判断是否是正确的手机号码
			isMobile(str) {
				// let reg = /^1\d{10}$/;
				// return reg.test(str)
			},
		}
	}
</script>

<style scoped>
	.login-content {
		padding: 70px 10px 35px;
		text-align: center;
		color: #333333;
	}

	.login-title {
		font-size: 26px;
		font-weight: bold;
		margin-bottom: 31px;
	}

	.login-content input {
		height: 50px;
		background: #F8F8F8;
		border-radius: 25px;
		text-align: left;
		padding: 15px;
		box-sizing: border-box;
		font-size: 15px;
	}

	.iphone,
	.password,
	.test {
		position: relative;
		margin-bottom: 30px;
	}

	.iphone .uni-icons,
	.password .uni-icons {
		position: absolute;
		top: 14px;
		right: 30px;
	}

	.test-btn,
	.password-btn {
		color: #ff8b33;
		font-size: 15px;
		text-align: right;
	}

	.get-test {
		color: #ff8b33;
		font-size: 15px;
		width: 122px;
		height: 50px;
		border: 1px solid #FF8B33;
		border-radius: 25px;
		line-height: 50px;
	}

	.test {
		display: flex;
		justify-content: space-between;
	}

	.login-btn {
		width: 355px;
		height: 45px;
		background: #FF8B33;
		border-radius: 36px;
		color: #fff;
		font-size: 20px;
		text-align: center;
		line-height: 45px;
		position: fixed;
		bottom: 60px;
	}
</style>