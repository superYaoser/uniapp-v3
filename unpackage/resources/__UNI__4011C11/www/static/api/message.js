import R from "@/static/api/root/request";


/**
 *    get /api/message/action/user/:id 获取某个用户全部未读的信息
 * 权限：1
 * 参数：:id
 * 说明：
 */
function getNMessageByReceiveUid(id) {
    return R({
        url: 'message/action/user/'+id,
    });
}

function getAllMessageByReceiveUid(id) {
    return R({
        url: 'message/action/all/user/'+id,
    });
}
/*	post /api/message/action/read/user 将某个用户全部互动信息设置为已读
权限：1
参数：u_id
说明：
*/
function updateReadMessageByReceiveId(id) {
    return R({
        url: 'message/action/read/user',
        method:'POST',
        data:{'u_id':id}
    });
}
/*	post /api/message/action 添加一个新的互动信息
权限：1
参数：send_user_id、send_user_name、receive_user_id、receive_user_name、message_content、article_id
说明：
*/
function addActionMessage(data) {
    return R({
        url: 'message/action',
        method:'POST',
        data:{
            'send_user_id':data.send_user_id,
            'send_user_name':data.send_user_name,
            'receive_user_id':data.receive_user_id,
            'receive_user_name':data.receive_user_name,
            'message_content':data.message_content,
            'article_id':data.article_id,
        }
    });
}
export {
    getNMessageByReceiveUid,addActionMessage,updateReadMessageByReceiveId,
    getAllMessageByReceiveUid
}
