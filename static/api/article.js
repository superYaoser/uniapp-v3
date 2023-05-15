import R from "@/static/api/root/request";

// •	POST /api/article 添加文章 （后续需要升级，没有标签和分类功能）
/**
 * 放置新文章
 * @param data title（文章标题）、content（文章内容）、category（类别id）
 * @returns {Promise | Promise<unknown>}
 */
function pushNewArticle(data) {
    return R({
        url: 'article',
        method: 'POST',
        data: data
    });
}
// •	GET /api/ article /detailed-pages 文章详细列表（分页）
/**
 * 文章详细列表 分页
 * @param data page_number、page_size(非必选)
 * @returns {Promise | Promise<unknown>}
 */
function getDetailedArticle(data) {
    return R({
        url: 'article/detailed-pages',
        data: data
    });
}

// •	GET /api/article/:id 获取文章详情
/**
 * 获取文章详情
 * @param id 文章id
 * @returns {Promise | Promise<unknown>}
 */
function getArticleByID(id) {
    return R({
        url: 'article/'+id,
        data: data
    });
}
export {
    pushNewArticle,
    getDetailedArticle,

}
