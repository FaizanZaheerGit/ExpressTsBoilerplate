import cors from 'cors';
import bodyParser from "body-parser";
import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import helmet from "helmet";
import authentication_middleware from './middlewares/authentication_middleware';
import responses from './utils/responses';
import static_data from './config/static_data';
import firebase_utils from './utils/firebaseUtils';

const app: Application = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet());


require('dotenv').config()
const { PORT } = process.env;

// CONNECTING TO DB
require('./database/database_initialization');

const port = PORT || 5000;
import logger from './logger/logger';
const firebase_app = firebase_utils.FIREBASE_APP;

// ROUTES
app.get("/", (req: Request, res: Response) => {
    res.status(200).send(responses.get_response_object(responses.CODE_SUCCESS, null, "Server is Up And Running"))
    logger.info('200: Server is Up and Running')
    return;
});

app.get('/api/static-data', (req: Request, res: Response) => {
    return res.status(responses.CODE_SUCCESS).send(
        responses.get_response_object(responses.CODE_SUCCESS, static_data, responses.MESSAGE_SUCCESS)
    )
})

app.get("/api/logs/:type", authentication_middleware, (req: Request, res: Response) => {
    try {
    if (req.params.type.toLowerCase() != "error" && req.params.type.toLowerCase() != "combined") {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_INVALID_CALL, null, responses.MESSAGE_INVALID_CALL
            ))
        }
    else if ( req.params.type.toLowerCase() == "error") {
           fs.readFile('./error.log', (err, data: Buffer) => {
            if (err) {
                logger.error("ERROR FROM READ LOGS API: " + err + " PARAM DATA: " + req.params);
                return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                    responses.CODE_GENERAL_ERROR, { error: err.message }, responses.MESSAGE_GENERAL_ERROR
                ))
            }
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_SUCCESS, { data: data.toString() }, responses.MESSAGE_SUCCESS
            ))
            })
        }
        else if ( req.params.type.toLowerCase() == "combined") {
            fs.readFile('./combined.log', (err, data: Buffer) => {
            if (err) {
                logger.error("ERROR FROM READ LOGS API: " + err + " PARAM DATA: " + req.params);
                return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                    responses.CODE_GENERAL_ERROR, { error: err.message }, responses.MESSAGE_GENERAL_ERROR
                ))
            }
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_SUCCESS, { data: data.toString() }, responses.MESSAGE_SUCCESS
            ))
            })
        }
    }
    catch (err) {
        logger.error("ERROR FROM READ LOGS API: " + err + " PARAM DATA: " + req.params);
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR
        ))
    }
})

import UserRoutes from './routes/UserRoutes';

app.use('/api/users', UserRoutes);

// SETUP LISTEN FOR APP ON PORT
app.listen(port, () => {
    console.log(`SERVER STARTED:  LISTENTING ON PORT ${port}`)
});
