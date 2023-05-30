//全局的Url
// const baseUrl = 'http://114.115.220.47:3000/api/'
const baseUrl = 'http://192.168.85.1:3000/api/'
// const baseUrl = 'http://192.168.0.122:3000/api/'

//用户的默认头像
const defaultHeadImgPath = 'https://i2.hdslb.com/bfs/face/544c89e68f2b1f12ffcbb8b3c062a3328e8692d9.jpg@96w_96h.webp'

//发布页 需要将text文本中回车替换的文字
const enterWord = ' ';

//在页面上显示信息
const sendMessageToScreen =(data)=>{
    uni.showToast({
        icon:'error',
        title:data.message,
        duration:2000,
        mask:false,
    });
}

export{
    baseUrl,
    defaultHeadImgPath,
    enterWord,
    sendMessageToScreen
}
