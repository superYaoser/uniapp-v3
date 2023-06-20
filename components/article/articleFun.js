
import {addActionMessage} from '@/static/api/message'
import {emitActionMessage} from '@/static/socket/emit'
class ArticleFun {
    /**
     修改文章卡片的交互信息和用户关注状态
     @param {null} u_id 用户id
     @param {null} article_id 文章id
     @param {Object} Obj 包含要修改的交互信息和关注状态的对象，格式如下：
     {
    hand: number, // 是否点赞
    watch: number, // 是否收藏
    comment: number, // 评论内容
    concern_be: number // 是否关注该文章作者
    }
     @return {boolean} 修改是否成功，成功返回true，失败返回false */
    static setArticleCardUpdate(u_id=null, article_id=null, Obj) {
        console.log(Obj)
        try {
            if (article_id != null && Obj.hand!=null) {
                let e = {
                    article_id: article_id,
                    hand: Obj.hand,
                }
                uni.$emit('articleCard_interaction_hand_update', {data: e})
            }
            if (article_id != null && Obj.watch!=null) {
                let e = {
                    article_id: article_id,
                    watch: Obj.watch
                }
                uni.$emit('articleCard_interaction_watch_update', {data: e})
            }
            if (article_id != null && Obj.comment!=null) {
                let e = {
                    article_id: article_id,
                    comment: Obj.comment,
                }
                uni.$emit('articleCard_interaction_comment_update', {data: e})
            }
            if (u_id != null && Obj.concern_be!=null) {
                let e = {
                    u_id: u_id,
                    concern_be: Obj.concern_be,
                }
                uni.$emit('articleCard_concern_update', {data: e})
            }
            return true
        } catch (e) {
            return false
        }
    }

    static addConcernMsg = async (send_user_id,send_user_name,receive_user_id,receive_user_name,article_id)=>{
        if (send_user_id==receive_user_id){
            return true
        }
        let data = {
            send_user_id:send_user_id,
            send_user_name:send_user_name,
            receive_user_id:receive_user_id,
            receive_user_name:receive_user_name,
            message_content:`${send_user_name}关注了你`,
            article_id:article_id
        }
        emitActionMessage(send_user_id,data.message_content,receive_user_id)
        let res = await addActionMessage(data)

        return res.code === 200;
    }
    //添加评论消息 无论是评论文章还是评论评论 通用
    static addCommentMsg = async (send_user_id,send_user_name,receive_user_id,receive_user_name,message_content,article_id)=>{
        if (send_user_id==receive_user_id){
            return true
        }
        let data = {
            send_user_id:send_user_id,
            send_user_name:send_user_name,
            receive_user_id:receive_user_id,
            receive_user_name:receive_user_name,
            message_content:`${send_user_name}评论了你:${message_content}`,
            article_id:article_id
        }
        emitActionMessage(send_user_id,data.message_content,receive_user_id)
        let res = await addActionMessage(data)
        return res.code === 200;
    }

    static addHandMsg = async (send_user_id,send_user_name,receive_user_id,receive_user_name,article_id)=>{
        if (send_user_id==receive_user_id){
            return true
        }
        let data = {
            send_user_id:send_user_id,
            send_user_name:send_user_name,
            receive_user_id:receive_user_id,
            receive_user_name:receive_user_name,
            message_content:`${send_user_name}赞了你的文章`,
            article_id:article_id
        }
        emitActionMessage(send_user_id,data.message_content,receive_user_id)
        let res = await addActionMessage(data)
        return res.code === 200;
    }
}

export default ArticleFun
