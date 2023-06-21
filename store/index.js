import {
    createStore
} from "vuex";
export default createStore({
    state: {
        user: {},
    },
    getters: {
        getUser(state) {
            return state.user;
        }
    },
    mutations: {
        addUser(state, user) {
            state.user = user;
        },
        resetUser(state) {
            state.user = {};
        },
    },
    actions: {
        addUser({ commit }, user) {
            commit('addUser', user);
        },
        resetUser({ commit }) {
            commit("resetUser");
        },
    },
    modules: {}
})
