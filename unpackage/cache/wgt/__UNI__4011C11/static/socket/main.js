import io from '@hyoga/uni-socket.io';
import { formatTimestamp,IP} from '@/static/utils/globalConifg'
const currentTimestamp = Date.now(); // 获取当前时间戳
const formattedTime = formatTimestamp(currentTimestamp); // 格式化当前时间戳并精确到毫秒

const socket = io('ws://'+IP+':3001', {
    query: {},
    transports: [ 'websocket', 'polling' ],
    timeout: 5000,
});
// socket.on('connect', () => {
//     // ws连接已建立，此时可以进行socket.io的事件监听或者数据发送操作
//     // 连接建立后，本插件的功能已完成，接下来的操作参考socket.io官方客户端文档即可
//     console.log('ws 已连接');
//     // socket.io 唯一连接id，可以监控这个id实现点对点通讯
//     const { id } = socket;
//     socket.on(id, (message) => {
//         // 收到服务器推送的消息，可以跟进自身业务进行操作
//         console.log('ws 收到服务器消息：', message);
//     });
//     // 主动向服务器发送数据
//     socket.emit('message', `当前时间：${formattedTime}`);
// });
//
// socket.on('error', (msg) => {
//     console.log('ws error', msg);
// });



export default socket
