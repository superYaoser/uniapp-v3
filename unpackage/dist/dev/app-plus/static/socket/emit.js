import socket from "@/static/socket/main";

const emitActionMessage=(send_user_id,content,receive_user_id)=>{
    socket.emit('action', {
        send_user_id:send_user_id,
        content:content,
        receive_user_id:receive_user_id,
    })
}

export {
    emitActionMessage
}
