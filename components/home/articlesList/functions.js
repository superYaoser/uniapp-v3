import {getDetailedArticle}from '@/static/api/article'
//模型
let model =[
    { categoryID:'1yao',classifyTitle: "最新", classifyContent: "类别描述",currentPage:1, articleList:[
            {article_across: 1,
                article_class_id: "1",
                article_comment_num: 0,
                article_text:'测试内容text',
                article_content: "哈哈哈哈阿松大",
                article_create_time: "2023-03-25T10:28:34.000Z",
                article_hand_support_num: 0,
                article_id: 1,
                article_logic_del: 0,
                article_preview1_path: null,
                article_preview2_path: null,
                article_real_del: 1,
                article_sort: 1,
                article_title: "天台",
                article_user_id: "2",
                article_watch_num: 0,
                class_name: "综合",
                u_name: "",
                u_sgrade: ""}
        ] },
    { categoryID:'2yao',classifyTitle: "推荐", classifyContent: "类别描述",currentPage:1, articleList:[
            {article_across: 1,
                article_class_id: "1",
                article_comment_num: 0,
                article_text:'测试内容text',
                article_content: "哈哈哈哈阿松大",
                article_create_time: "2023-03-25T10:28:34.000Z",
                article_hand_support_num: 0,
                article_id: 1,
                article_logic_del: 0,
                article_preview1_path: null,
                article_preview2_path: null,
                article_real_del: 1,
                article_sort: 1,
                article_title: "天台",
                article_user_id: "2",
                article_watch_num: 0,
                class_name: "综合",
                u_name: "",
                u_sgrade: ""}
        ] },
    { categoryID:'3yao',classifyTitle: "热门", classifyContent: "类别描述",currentPage:1, articleList:[
            {article_across: 1,
                article_class_id: "1",
                article_comment_num: 0,
                article_text:'测试内容text',
                article_content: "哈哈哈哈阿松大",
                article_create_time: "2023-03-25T10:28:34.000Z",
                article_hand_support_num: 0,
                article_id: 1,
                article_logic_del: 0,
                article_preview1_path: null,
                article_preview2_path: null,
                article_real_del: 1,
                article_sort: 1,
                article_title: "天台",
                article_user_id: "2",
                article_watch_num: 0,
                class_name: "综合",
                u_name: "",
                u_sgrade: ""}
        ] },
]
const getListSetConfig=(e)=>{
    console.log(e)

    const listSetConfig={
        needSwiperSum:3,
        aroundMove:true,
        //1 是首页
        static:1,
    }
    if (e ==='pyq'){
        listSetConfig.needSwiperSum=1
        listSetConfig.aroundMove=false
        listSetConfig.static=2
        return listSetConfig
    }else {
        return listSetConfig
    }

}

export {
    getListSetConfig
}
