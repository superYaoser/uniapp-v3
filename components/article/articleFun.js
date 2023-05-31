class ArticleFun {
    /**
     * 更新文章卡片信息,原理是触发文章卡片总线
     * @param {null} u_id - 用户ID。
     * @param {null} article_id - 文章ID。
     * @param {number} concern_be - 是否关注（1 表示已关注；0 表示未关注）。
     * @param {*} hand - 手柄（默认为空）。
     * @param {*} comment - 评论（默认为空）。
     * @param {*} watch - 观看（默认为空）。
     * @returns {boolean} 成功为true
     */
    static setArticleCardUpdate(u_id, article_id, concern_be, hand = null, comment = null, watch = null) {
        try {
            if (article_id != null && hand != null && comment != null && watch != null) {
                let e = {
                    article_id:article_id,
                    hand: hand,
                    comment: comment,
                    watch: watch
                }
                uni.$emit('articleCard_interaction_update', {data: e})
            }
            if (u_id!=null&&concern_be!=null){
                let e = {
                    u_id:u_id,
                    concern_be: concern_be,
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
