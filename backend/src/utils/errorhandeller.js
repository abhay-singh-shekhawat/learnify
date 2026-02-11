class api_error extends Error {
    constructor(status,message="something went wrong",error=[],stack=""){
        super(message);
        this.status = status;
        this.message = message;
        this.error = error;
        this.data = null;
        this.success = false;
        if(stack){
            this.stack = stack
        } else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
}
export {api_error}