import R from "@/static/api/root/request";

// POST /api/ upload/image 上传图片
/**
 * 上传图片
 * @param data 'image'=file二进制
 * @returns {Promise | Promise<unknown>}
 */
function pushImage(data) {
    return R({
        url: 'category/list',
        method:'POST',
        data:data
    });
}
export {
    pushImage
}
