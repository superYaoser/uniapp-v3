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
export {
    addWatchByArticleId
}
