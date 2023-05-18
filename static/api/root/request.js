import {baseUrl} from './set'
const request = (req = '') => {
	console.log(baseUrl)
    console.log(req)
    return new Promise((resolve, reject) => {
        uni.request({
            method: req.method,
            url: baseUrl + req.url,
            data: req.data,
            header: {
                "authorization": uni.getStorageSync('token'),
            },
            dataType: 'json',
        }).then((response) => {
            resolve(response.data);
            setTimeout(function () {
                uni.hideLoading();
            }, 200);
        }).catch(error => {
            let [err, res] = error;
            reject(error)
        })
    });

}
export default request

