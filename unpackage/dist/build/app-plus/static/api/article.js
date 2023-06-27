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
/*!!!!!!!!!!这个接口的返回值千万不能变，一旦变了前端就炸了*/
function getDetailedArticle(data) {
    return R({
        url: 'article/filterArticleDel-filterUserDel-filterAcross-filterCategoryDel-detailed-pages-create',
        data: data
    });
}
/*•	GET/api/article/filterArticleDel-filterUserDel-filterAcross-filterCategoryDel-detailed-concern-createTime
从文章数据库中获取符合筛选、
返回 根据用户id 关注的用户的 文章、并可以选择按照创建时间排序
可以选择返回内容的字数限制
过滤不存在的作者，类别，删除的文章，审核未通过的文章
详细请看返回结构
权限：1
参数：u_id（用户id）、sort（0或1非必选，默认1降序）、articleContentMaxWord
*/
function getConcernDetailedArticle(data) {
    return R({
        url: 'article/filterArticleDel-filterUserDel-filterAcross-filterCategoryDel-detailed-concern-createTime',
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
    });
}
/*•	GET /api/article/detail/:id 获取文章详情(更细)
可以返回用户的头像，文章的封面，还有用户名和等级
可以返回jwt与文章作者的关注状态
过滤用户不存在或者是文章禁止显示
权限：2
参数：jwt、:id（文章）
说明：这是根据查找结果显示用的
*/
function getArticleDetailByID(id) {
    return R({
        url: 'article/detail/'+id,
    });
}
/*•	GET /api/article/user-hand-state/:id 查询登录用户与该文章id的点赞情况
权限：2
参数：jwt、id（文章）
*/
function getArticleUserHandStateById(id) {
    return R({
        url: 'article/user-hand-state/'+id,
    });
}
/*•	GET /api/article/user-hand-list/user/:id 查询该用户点赞的全部文章列表
权限：1
参数：jwt、id（用户）
*/
function getArticleUserHandListByUserId(id) {
    return R({
        url: 'article/user-hand-list/user/'+id,
    });
}

/*•	GET /api/article/list/user/:id 查询该用户的全部文章列表，可以正常查看的
权限：1
参数：id（用户）
*/
function getArticleListByUserId(id) {
    return R({
        url: 'article/list/user/'+id,
    });
}

export {
    pushNewArticle,
    getDetailedArticle,
    getArticleByID,
    getConcernDetailedArticle,getArticleDetailByID,getArticleUserHandStateById,getArticleUserHandListByUserId
    ,getArticleListByUserId
}
