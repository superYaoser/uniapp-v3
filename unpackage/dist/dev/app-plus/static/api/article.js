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
// •	GET/api/article/filterArticleDel-filterUserDel-filterCategoryDel-detailed-pages-create
// 从文章数据库中获取符合筛选、删除及字数限制条件的文章，并按照指定排序方式进行排序，返回分页数据
/**
 * 文章详细列表 分页
 * 参数：sort（0或1非必选，默认1降序）、page_number、page_size(非必选默认10)、articleContentMaxWord select_title_num 扩展功能1推荐，2热门，3最新（非必选默认1）
 * @param data sort（0或1非必选，默认1降序）、page_number、page_size(非必选默认10)、articleContentMaxWord select_title_num 扩展功能1推荐，2热门，3最新（非必选默认1）
 * @returns {Promise | Promise<unknown>}
 */
function getDetailedArticle(data) {
    return R({
        url: 'article/filterArticleDel-filterUserDel-filterAcross-filterCategoryDel-detailed-pages-create',
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
    getArticleByID

}
