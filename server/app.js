import express from "express";
import {config} from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./database/db.js";
import {errorMiddleware} from "./middleware/errorMiddleware.js"
import authRouter from "./routes/authRouter.js";
import bookRouter from "./routes/bookRouter.js";
import userRouter from "./routes/userRouter.js";
import borrowRouter from "./routes/borrowRouter.js";
import expressFileUpload from "express-fileupload"
import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverfiedAccount.js";

export const app  = express();

config({path : "./config/config.env"});

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    method: ["GET" , "POST", "PUT", "DELETE"],
    credentials : true
}
));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(expressFileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
}));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);


notifyUsers(); // Start the notification service
removeUnverifiedAccounts();

connectDB();

app.use(errorMiddleware)