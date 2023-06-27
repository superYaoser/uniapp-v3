import R from "@/static/api/root/request";

// GET /api/category/list 分类列表
/**
 * 获取类别列表
 * @returns {Promise | Promise<unknown>}
 */
function getCategoryList() {
    return R({
        url: 'category/list',
    });
}
export {
    getCategoryList
}
