import { Request, Response, NextFunction } from 'express';
import responses from "../utils/responses";
import commonUtils from "../utils/commonUtils";
import database_layer from "../database/database_layer";
import TokenModel from "../models/TokenModel";
import logger from '../logger/logger';

async function authenticateToken(req: Request, res: Response, next: NextFunction) {
    /*
        This function authenticates a users access token
        parameters: req, res, next
        return: 
    */
    const auth_header: string | undefined = req.headers['authorization'];
    const token: string | undefined = auth_header && auth_header.split(' ')[1];
    if (token == null) {
        console.log('Token missing from headers')
        logger.error(`Token missing from headers`);
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_UNAUTHORIZED_ACCESS, null, responses.MESSAGE_UNAUTHORIZED_ACCESS
        ))
    }
    let verified_token = await commonUtils.verify_jwt_token(token);
    if (verified_token["code"] != 200){
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_UNAUTHORIZED_ACCESS, null, responses.MESSAGE_UNAUTHORIZED_ACCESS
        ))
    }
    let valid_token = await database_layer.db_read_single_record(TokenModel, { "token": token, 
      "is_expired": false, "expiry_time": 0 }, { _id: 1 });
    if (!valid_token) {
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_UNAUTHORIZED_ACCESS, null, responses.MESSAGE_UNAUTHORIZED_ACCESS
        ))
    }
    req["current_user"] = verified_token["user"]
    next()
}

export default authenticateToken;
