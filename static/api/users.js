import R from "@/static/api/root/request";

function loginUseUser(data) {
	return R({
		url: 'user/login',
		method: 'POST',
		data: data
	});
}
//•	GET /api/user/:id 获取用户详情
function getUserInfoById(id){
	return R({
		url: 'user/'+id,
	});
}

// •	GET /api/user/page 用户列表（分页）
/**getUserInfoPage
 * @param data page_number、page_size（默认10）
 * @returns {Promise | Promise<unknown>}
 */
function getUserInfoPageJson(data){
	return R({
		url: 'user/page',
		data:data,
	});
}
export {
	loginUseUser,
	getUserInfoById,
	getUserInfoPageJson
}
