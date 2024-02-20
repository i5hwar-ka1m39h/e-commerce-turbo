//password checker
export const checkPassword = (userPwd:string |null|undefined , inputPwd : string): boolean=>{
    if(typeof(userPwd)!== 'string') return false;
    else {
        if(userPwd===inputPwd) return true;
        else return false;
    }
}