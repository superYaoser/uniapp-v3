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
}

export default ArticleFun
