import R from "@/static/api/root/request";

/**
 * •    post /api/act/watch 添加用户观看数据
 * 参数：article_id
 */
function addWatchByArticleId(id) {
    return R({
        url: 'act/watch',
        method:'POST',
        data: {"article_id":id}
    });
}
/*•	get /api/act/comment/son/:id 获取评论的子评论（降序）
权限：1
参数：:id
说明：
*/
function getCommentSonById(id) {
    return R({
        url: 'act/comment/son/'+id,
        method:'GET',
    });
}

/*•	get /api/act/comment/article/:id 获取某个文章的评论
权限：1
参数：:id
说明：
*/
function getCommentByArticleId(id) {
    return R({
        url: 'act/comment/article/'+id,
        method:'GET',
    });
}
/*•	post /api/act/comment 添加用户评论的作品数据
权限：2
参数：jwt、comment_article_id、comment_father_id、comment_content
说明：必须是已经登录的用户，所以权限设置了2，用户评论作品，如果有父评论，就是回复别人的评论，如果没有就按时间或者点赞数排序。回复别人的评论同理
*/
function addComment(comment_article_id,comment_father_id,comment_content) {
    return R({
        url: 'act/comment',
        method:'POST',
        data: {
            "comment_article_id":comment_article_id,
            "comment_father_id":comment_father_id,
            "comment_content":comment_content,
        }
    });
}
/* get /api/act/comment/:id 获取该评论信息
权限：1
参数：:id
说明：
*/
function getCommentById(id) {
    return R({
        url: 'act/comment/'+id,
        method:'GET',
    });
}

/* •	get /api/act/comment/posterity/:id 获取所有后代评论
权限：1
参数：:id
说明：
*/
function getCommentPosterityById(id) {
    return R({
        url: 'act/comment/posterity/'+id,
        method:'GET',
    });
}
/*•	post /api/act/hand/article/add 点赞文章
权限：2
参数：jwt、article_id（文章id
*/
function addHandArticleByArticleId(id) {
    return R({
        url: 'act/hand/article/add/'+id,
        method:'POST',
    });
}
/*•	post /api/act/hand/article/remove 取消点赞文章
权限：2
参数：jwt、article_id（文章id
*/
function removeHandArticleByArticleId(id) {
    return R({
        url: 'act/hand/article/remove/'+id,
        method:'POST',
    });
}
export {
    addWatchByArticleId,
    getCommentSonById,
    getCommentByArticleId,
    addComment,
    getCommentById,
    getCommentPosterityById,
    addHandArticleByArticleId,
    removeHandArticleByArticleId
}
