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

/*•	POST /api/user/concern/add 关注用户
23/5/21 这个接口不能单独用来设置super_state超级关注的状态，需要单独写一个特别关注的接口
权限：2
参数：jwt、u_id（用户id）、super_state（默认0）
说明：jwt验证身份后，直接用登录的账号 关注 该id*/
/**getUserInfoPage
 * @param data u_id（用户id）、super_state（默认0）
 * @returns {Promise | Promise<unknown>}
 */
function setUserAddConcern(data){
	return R({
		url: 'user/concern/add',
		method:'POST',
		data:data,
	});
}
/*POST /api/user/concern/remove取消关注
权限：2
参数：jwt、u_id（用户id）
说明：jwt验证身份后，直接用登录的账号 移除 该id
*/
/**getUserInfoPage
 * @param data u_id（用户id）
 * @returns {Promise | Promise<unknown>}
 */
function setUserRemoveConcern(data){
	return R({
		url: 'user/concern/remove',
		method:'POST',
		data:data,
	});
}
export {
	loginUseUser,
	getUserInfoById,
	getUserInfoPageJson,setUserAddConcern,setUserRemoveConcern
}
