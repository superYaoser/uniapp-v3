//全局的Url
// const baseUrl = 'http://114.115.220.47:3000/api/'
// const baseUrl = 'http://192.168.85.1:3000/api/'
// const baseUrl = 'http://192.168.0.122:3000/api/'
const baseUrl = 'http://192.168.43.50:3000/api/'

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
/*这个方法会首先将传入的字符串解析成一个时间戳对象 date，然后从中依次提取年月日小时分钟等信息，
并根据当前年与该日期的年份是否相同来决定在字符串中插入横线或者减号。同时，它还计算了传入的日期与当前时间之间的时间跨度，
并根据跨度的不同来选择要展示的时间格式：如果是当天，则显示小时前，否则显示完整的年月日时分。
*/
const formatDate =(dateString)=> {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const diffInMs = new Date() - date;

    if (diffInMs < 86400000 && date.getDate() === new Date().getDate()) {
        // 当天
        if (diffInMs < 3600000 && date.getHours() === new Date().getHours()) {
            // 当小时
            const diffInMinutes = Math.floor(diffInMs / 60000);
            return `${diffInMinutes}分钟前`;
        } else {
            // 非当小时
            const diffInHours = Math.floor(diffInMs / 3600000);
            return `${diffInHours}小时前`;
        }
    } else {
        // 非当天
        return `${month}-${day}`;
    }
}

export{
    baseUrl,
    defaultHeadImgPath,
    enterWord,
    sendMessageToScreen,
    formatDate
}
