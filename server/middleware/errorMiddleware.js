
class Errorhandler extends Error{
    constructor(message, statusCode){
        super(message)
        this.statusCode = statusCode
    }
}

export const errorMiddleware = (err,req, res, next) => {
    err.message = err.message || "Internal Error";
    err.statusCode = err.statusCode || 500

    if(err.code === 11000){
        const statusCode = 400;
        const message = `Duplicate Field Message`
        err = new Errorhandler(message,statusCode)
    }

    if(err.name === "JsonWebTokenError"){
        const statusCode = 400;
        const message = `Json Web Token Error`
        err = new Errorhandler(message,statusCode)
    }

    if(err.name === "TokenExpiredError"){
        const statusCode = 400;
        const message = `Token has been Expired`
        err = new Errorhandler(message,statusCode)
    }

    if(err.name === "CastError"){
        const statusCode = 400;
        const message = `Resource Not Found ${err.path}`;
        err = new Errorhandler(message,statusCode)
    }

    const errorMessage = err.errors ? Object.values(err.errors).map((error) => error.message).join(" "): err.message;

      return res.status(err.statusCode).json({
        success: false,
        message : errorMessage,
    });
};

export default Errorhandler;