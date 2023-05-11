import R from "@/static/api/root/request";

function loginUseUser(data) {
	return R({
		url: 'user/login',
		method: 'POST',
		data: data
	});
}
export {
	loginUseUser
}
