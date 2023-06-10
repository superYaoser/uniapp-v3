import R from "@/static/api/root/request";

/**
 * get /api/search/user/:id 获取该用户最新的6条搜索记录
 * 权限：1
 * 参数：:id
 */
function getSearchUser(id) {
    return R({
        url: 'search/user/' + id,
        method: 'GET',
    });
}
/*
get /api/search/system 获取系统最热的的6条搜索记录
权限：1
参数：:
*/
function getSearchSystem() {
    return R({
        url: 'search/system',
        method: 'GET',
    });
}
/*	get/api/search/word/: search_term 用户发起搜索
权限：2
参数：: jwt、search_term
说明： 通过jwt验证身份，发起搜索
*/
function getSearchByTerm(search_term) {
    return R({
        url: 'search/word/'+search_term,
        method: 'GET',
    });
}

export {
    getSearchByTerm,
    getSearchSystem,
    getSearchUser
}
