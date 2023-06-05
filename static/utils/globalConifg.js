import {getUserInfoById} from "@/static/api/users";
//全局的Url
const baseUrl = 'http://114.115.220.47:3000/api/'
// const baseUrl = 'http://192.168.85.1:3000/api/'
// const baseUrl = 'http://192.168.0.122:3000/api/'
// const baseUrl = 'http://192.168.43.50:3000/api/'


// const baseUrl = 'http://192.168.0.106:3000/api/'
// const baseUrl = 'http://192.168.5.95:3000/api/'

//提取192.168.0.106:3000
function extractIP(url) {
    let pattern = /http:\/\/([\d\.]+):(\d+)/; 
    let result = url.match(pattern);
    if (result && result.length >= 3) {
        return result[1] + ":" + result[2];
    } else {
        return null;
    }
}
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
//     plus.nativeUI.toast(`关注成功`)
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
/**通过用户ID获取用户名
 @param {number} uid - 用户ID
 @returns {Promise<string>} - 返回一个Promise，包含字符串类型的用户名（如果请求成功），或错误提示字符串"err"（如果请求失败）*/
const getUserNameByUid= async (uid) => {
    let res = await getUserInfoById(uid)
    if (res.code === 200) {
        return res.data[0].u_name
    }
    return 'err'
}
/**通过用户ID 获取用户对象 单个
 @param {number} uid - 用户ID
 @returns {Promise<string>} - 返回一个Promise，包含字符串类型的用户名（如果请求成功），或错误提示字符串"err"（如果请求失败）*/
const getUserObjByUid= async (uid) => {
    let res = await getUserInfoById(uid)
    if (res.code === 200) {
        return res.data[0]
    }
    return 'err'
}
//替换 服务器返回的图片路径
const replaceUrlIP = (url) => {
    let pattern = /http:\/\/([\d\.]+):(\d+)/;
    return url.replace(pattern, `http://${extractIP(baseUrl)}`);
}
// 替换html内容中所有src
const replaceImgSrc = (data)=> {
    // 匹配所有img标签的src属性
    const imgSrcReg = /<img.*?src=[\"|\']?(.*?)[\"|\']?\s.*?>/gi;
    // 遍历所有匹配到的img标签
    return data.replace(imgSrcReg, (match, src) => {
        // 使用传入的函数替换IP地址
        const newSrc = replaceUrlIP(src);
        // 返回替换后的img标签
        return match.replace(src, newSrc);
    });
}
export{
    baseUrl,
    defaultHeadImgPath,
    enterWord,
    sendMessageToScreen,
    formatDate,
    getUserNameByUid,getUserObjByUid,replaceUrlIP,replaceImgSrc
}
