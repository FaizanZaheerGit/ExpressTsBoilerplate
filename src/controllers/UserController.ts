import { Request, Response } from 'express';
import database_layer from '../database/database_layer';
import responses from '../utils/responses';
import userModel from '../models/UserModel';
import userUtils from '../utils/userUtils';
import constants from '../utils/constants';
import commonUtils from '../utils/commonUtils';
import TokenModel from '../models/TokenModel';
import logger from '../logger/logger';
import config from '../config/config';
import static_data from '../config/static_data';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import firebaseUtils from '../utils/firebaseUtils';


let userController = {
    createController: async (req: Request, res: Response) => {
        /*
            This function will validate and create a new user
            parameters: request, response
            return:
        */
        try {
        let insert_data = req.body;
        if (insert_data.image == null || insert_data.image == '') {
          insert_data[constants.IMAGE] = ' ';
        }
        const { error } = await commonUtils.validate_data(insert_data);
        if (error) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_VALIDATION_FAILED, responses.MESSAGE_VALIDATION_FAILED + " key: " + error.details[0].context?.key
            ))
        }
        if (insert_data.image == ' ') {
          insert_data[constants.IMAGE] = "";
        }
        insert_data[constants.EMAIL_ADDRESS] = await insert_data[constants.EMAIL_ADDRESS].trim().toLowerCase();
        let existing_user = await database_layer.db_read_single_record(userModel, {email_address: insert_data[constants.EMAIL_ADDRESS]}, { email_address: 1 });
        if(existing_user) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_ALREADY_EXISTS, null, responses.MESSAGE_ALREADY_EXISTS([constants.USER, constants.EMAIL_ADDRESS])
            ))
        }
        let password_array = await commonUtils.encrypt_password(insert_data[constants.PASSWORD]);
        insert_data[constants.PASSWORD] = password_array[0];
        insert_data[constants.PASSWORD_SALT] = password_array[1];
        let new_user = await database_layer.db_insert_single_record(userModel, insert_data);
        let new_user_obj: Object | any = await userUtils.get_user_object(new_user);
        return res.status(responses.CODE_CREATED).send(
            responses.get_response_object(responses.CODE_CREATED, {user: new_user_obj}, responses.MESSAGE_CREATED(constants.USER)));
        }
        catch (err) {
            logger.error("ERROR FROM CREATE CONTROLLER: " + err + " POST DATA: " + JSON.stringify(req.body))
            return res.status(200).send(
                responses.get_response_object(responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR)
            )
        }
    },
    readController: async(req: Request, res: Response) => {
        /*
            This function will read a list of all users, based on filters,
            if no filters given, it returns all users
            parameters: request, response
            return:
        */
        try {
        const read_filter: {email_address?: string, page?: string, limit?: string} = req.query || {};
        let pageOptions: { page?: Number, limit?: Number } = {};
        if (read_filter.page && read_filter.limit) {
            pageOptions[constants.PAGE] = parseInt(read_filter[constants.PAGE], 10);
            pageOptions[constants.LIMIT] = parseInt(read_filter[constants.LIMIT], 10);
            delete read_filter.page;
            delete read_filter.limit;
        }
        let users = await database_layer.db_read_multiple_records(userModel, read_filter, {}, pageOptions);
        users = await userUtils.filter_user_object(users);
        return res.status(responses.CODE_SUCCESS).send(
            responses.get_response_object(responses.CODE_SUCCESS, {users: users}, responses.MESSAGE_SUCCESS));
        }
        catch (err) {
            logger.error("ERROR FROM READ CONTROLLER: " + err + " QUERY DATA: " + JSON.stringify(req.query));
            return res.status(200).send(
                responses.get_response_object(responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR)
            )
        }
    },
    updateController: async (req: Request, res: Response) => {
        /*
            This function will validate and update information of a existing user
            parameters: request, response
            return:
        */
        try {
        const read_filter: {_id?: string } = { _id: req.body.id };
        let user = await database_layer.db_read_single_record(userModel, read_filter, { _id: 1 });
        if (!user) {
            let response_obj = responses.get_response_object(responses.CODE_UNPROCESSABLE_ENTITY,
                null, responses.MESSAGE_NOT_FOUND([constants.USER, constants.ID]))
            return res.status(responses.CODE_SUCCESS).send(response_obj);
        }
        if (req["current_user"] != user._id) {
          return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
            responses.CODE_UNAUTHORIZED_ACCESS, null, responses.MESSAGE_UNAUTHORIZED_ACCESS ));
        }
        const update_filter: {_id?: string, name?: string, status?: Object, image?: string} = req.body || {};
        delete update_filter._id;
        if (update_filter.image == null || update_filter.image == '') {
          update_filter[constants.IMAGE] = ' ';
        }
        const { error } = await commonUtils.validate_data(update_filter);
        if (error) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_VALIDATION_FAILED, responses.MESSAGE_VALIDATION_FAILED + ": " + error.details[0].context?.key
            ))
        }
        if (update_filter.image == ' ') {
          update_filter[constants.IMAGE] = ""
        }
        let update_user = await database_layer.db_update_single_record(userModel, read_filter, update_filter);
        update_user = await database_layer.db_read_single_record(userModel, read_filter);
        return res.status(200).send(responses.get_response_object(responses.CODE_SUCCESS,
            {user: await userUtils.get_user_object(update_user)}, responses.MESSAGE_SUCCESS));
        }
        catch (err) {
            logger.error("ERROR FROM UPDATE CONTROLLER: " + err + " POST DATA: " + JSON.stringify(req.body))
            return res.status(200).send(
                responses.get_response_object(responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR)
            )
        }
    },
    deleteController: async (req: Request, res: Response) => {
        /*
            This function will delete a user
            parameters: request, response
            return:
        */
        try {
        const delete_filter: Object | any = { _id: req.params.id };
        let user = await database_layer.db_read_single_record(userModel, delete_filter);
        if (!user) {
            let response_obj = responses.get_response_object(responses.CODE_UNPROCESSABLE_ENTITY,
                null, responses.MESSAGE_NOT_FOUND([constants.USER, constants.ID]))
            return res.status(responses.CODE_SUCCESS).send(response_obj);
        }
        await database_layer.db_delete_record(userModel, delete_filter);
        let users = await database_layer.db_read_multiple_records(userModel, {});
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(responses.CODE_SUCCESS,
            {users: await userUtils.filter_user_object(users)}, responses.MESSAGE_SUCCESS));
        }
        catch (err) {
            logger.error("ERROR FROM DELETE CONTROLLER: " + err + " PARAM DATA: " + req.params)
            return res.status(200).send(
                responses.get_response_object(responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR)
            )
        }
    },
    loginController: async (req: Request, res: Response) => {
        /*
            This function will validate and login a user
            parameters: request, response
            return:
        */
        try {
        let token_data: {email_address?: string, password?: string} = req.body || {};
        const { error } = await commonUtils.validate_data(token_data);
        if (error) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_VALIDATION_FAILED, responses.MESSAGE_VALIDATION_FAILED + " key: " + error.details[0].context?.key
            ))
        }
        token_data[constants.EMAIL_ADDRESS] = await token_data[constants.EMAIL_ADDRESS].trim().toLowerCase();
        let user = await database_layer.db_read_single_record(userModel, {email_address: token_data[constants.EMAIL_ADDRESS]})
        if(!user) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_UNPROCESSABLE_ENTITY, null, responses.MESSAGE_INVALID_EMAIL_ADDRESS_OR_PASSWORD)
                )
        }
        let is_password = commonUtils.compare_password(token_data[constants.PASSWORD], user[constants.PASSWORD]);
        if (!is_password) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_UNPROCESSABLE_ENTITY, null, responses.MESSAGE_INVALID_EMAIL_ADDRESS_OR_PASSWORD)
            )
        }
        delete token_data[constants.EMAIL_ADDRESS];
        delete token_data[constants.PASSWORD];
        token_data[constants.USER] = user;
        await database_layer.db_update_multiple_records(TokenModel, { user: token_data[constants.USER] }, 
            { is_expired: true, expiry_time: commonUtils.get_current_epoch_time(), purpose: "session_management" });
        const user_data: string = JSON.stringify(user);
        let access_token = await commonUtils.create_jwt_token(user_data);
        token_data[constants.TOKEN] = access_token;
        token_data[constants.PURPOSE] = "session_management";
        let token = await database_layer.db_insert_single_record(TokenModel, token_data);
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(responses.CODE_SUCCESS,
            {token: token[constants.TOKEN]}, responses.MESSAGE_SUCCESS));
        }
        catch (err) {
            logger.error("ERROR FROM LOGIN CONTROLLER: " + err + " POST DATA: " + JSON.stringify(req.body))
            return res.status(200).send(
                responses.get_response_object(responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR)
            )
        }
    },
    logoutController: async (req: Request, res: Response) => {
        try {
        const auth_header = req.headers['authorization'];
        const token = auth_header && auth_header.split(' ')[1];
        await database_layer.db_update_single_record(TokenModel, { token: token }, 
            { is_expired: true, expiry_time: commonUtils.get_current_epoch_time() });
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(responses.CODE_SUCCESS, null, 
            responses.MESSAGE_SUCCESS));
        }
        catch (err) {
            logger.error("ERROR FROM LOGOUT CONTROLLER: " + err)
            return res.status(200).send(
                responses.get_response_object(responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR)
            )
        }
    },
    forget_password_controller: async (req: Request, res: Response) => {
        /*
            This function will send an email along with the access token to user to reset there password
            parameters: request, response
            return:
        */
        try {
            const { error } = await commonUtils.validate_data(req.body);
            if (error) {
                return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                    responses.CODE_VALIDATION_FAILED, responses.MESSAGE_VALIDATION_FAILED + ": " + error.details[0].context?.key
                ))
            }
            const read_filter: {email_address?: string} = { email_address: req.body.email_address };
            let user = await database_layer.db_read_single_record(userModel, read_filter);
            if (!user) {
            return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
                responses.CODE_INVALID_CALL, null,
                responses.MESSAGE_NOT_FOUND([constants.USER, constants.EMAIL_ADDRESS])
            ));
            }
            await database_layer.db_update_multiple_records(TokenModel, { user: user, purpose: "Reset Password" }, { is_expired: true, expiry_time: commonUtils.get_current_epoch_time() });
            let insert_token_data: {user?: any, purpose?: string, token?: string} = {};
            let token = uuidv4();
            let url = "https://www.example.com/" + user._id + "/" + token;
            insert_token_data[constants.USER] = user;
            insert_token_data[constants.PURPOSE] = "Reset Password";
            insert_token_data[constants.TOKEN] = token;
            await database_layer.db_insert_single_record(TokenModel, insert_token_data);
            let sender_email = process.env.FROM || "";
            let email_html: string = `<h1 style='font-family: Arial, Helvetica, sans-serif;text-align: center;text-decoration: underline;'>Pre-CTMS</h1><h2 style='font-family: Arial, Helvetica, sans-serif;text-align: center;'>Reset Password</h2><hr style='width: 75%;background: #00466a;height: 4px;'><br /><p style='font-family: Arial, Helvetica, sans-serif;font-size: 17px;'>Hi ${user[constants.NAME]},<br />We have received a request from your account </p><br /><p style='font-family: Arial, Helvetica, sans-serif;font-size: 17px;'>To Reset Your Password click the button below:</p><a href='${url}' target='blank'><button style='background: #00446a;margin: 0 auto;width: max-content;padding: 8px 20px;color: #fff;border-radius: 18px;font-size: 17px;font-family: Arial, Helvetica, sans-serif;'>Reset Password</button></a><br /><br /><p style='font-family: Arial, Helvetica, sans-serif;font-size: 17px;'>or copy and paste the following URL:<br />${url}</p><br /><p style='font-family: Arial, Helvetica, sans-serif;font-size: 17px;'><b>Regards,<br/>Pre-CTMS Team</b></p>`;
            await commonUtils.send_mail_to_user(sender_email, user.email_address, "RESET PASSWORD", email_html);
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_SUCCESS, null, responses.MESSAGE_MAIL_SENT_SUCCESSFULLY ));
      } catch (e) {
        console.log("Error from Forgot Password Controller: " + e + " DATA: " + JSON.stringify(req.body));
        logger.error("Error from Forgot Password Controller: " + e + " DATA: " + JSON.stringify(req.body));
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
          responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR));
      }
    },
    reset_passsword_controller: async (req: Request, res: Response) => {
        /* 
            This function will reset the password and expire old access token
            parameters: request, response
            return:
        */

      try {
        const { error } = await commonUtils.validate_data(req.body);
        if (error) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_VALIDATION_FAILED, responses.MESSAGE_VALIDATION_FAILED + ": " + error.details[0].context?.key
            ))
        }
        let user = await database_layer.db_read_single_record(userModel, { _id: req.body.id }, { _id: 1, password: 1 });
        if (!user) {
          return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_INVALID_CALL, null, responses.MESSAGE_NOT_FOUND([constants.USER, constants.UID])
            ));
        }
        let token = await database_layer.db_read_single_record(TokenModel, { user: user, token: req.body.token, purpose: "Reset Password", is_expired: false }, { _id: 1 });
        if (!token) {
          return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_INVALID_CALL, null, responses.MESSAGE_INVALID_TOKEN ));
        }
        const password: string = req.body.new_password;
        const password_array = await commonUtils.encrypt_password(password);
        let new_password = password_array[0];
        let password_salt = password_array[1];
        let confirm_password = await commonUtils.compare_password( req.body.new_password, user[constants.PASSWORD] );
        if (confirm_password) {
          return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
            responses.CODE_INVALID_CALL, null, responses.MESSAGE_SAME_PASSWORD ));
        }
        user = await database_layer.db_update_single_record( userModel, { _id: req.body.id }, { password: new_password, password_salt: password_salt });
        token = await database_layer.db_update_single_record( TokenModel, { token: req.body.token }, { is_expired: true, expiry_time: commonUtils.get_current_epoch_time() } );
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
          responses.CODE_SUCCESS, null, responses.MESSAGE_PASSWORD_UPDATED_SUCCESSFULLY ));
      } catch (e) {
        console.log("Error from Reset Password Controller: " + e + " DATA: " + JSON.stringify(req.body));
        logger.error("Error from Reset Password Controller: " + e + " DATA: " + JSON.stringify(req.body));
        return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
          responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR ));
      }
    },
    change_passsword_controller: async (req: Request, res: Response) => {
        /*
            This function will change the password of the logged in user
            parameters: request, response
            return:
        */
      try {
        const { error } = await commonUtils.validate_data(req.body);
        if (error) {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_VALIDATION_FAILED, responses.MESSAGE_VALIDATION_FAILED + ": " + error.details[0].context?.key
            ))
        }
        let user = await database_layer.db_read_single_record(userModel, { _id: req.body.id }, { _id: 1, password: 1 });
        if (!user) {
          return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
            responses.CODE_INVALID_CALL, null, responses.MESSAGE_NOT_FOUND([constants.USER, constants.ID])
          ));
        }
        if (req["current_user"] != user._id) {
          return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
            responses.CODE_UNAUTHORIZED_ACCESS, null, responses.MESSAGE_UNAUTHORIZED_ACCESS ));
        }
        let confirm_password = await commonUtils.compare_password( req.body.old_password, user[constants.PASSWORD] );
        if (!confirm_password) {
          return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
            responses.CODE_INVALID_CALL, null, responses.MESSAGE_INVALID_EMAIL_ADDRESS_OR_PASSWORD ));
        }
        const password: string = req.body.new_password;
        const password_array = await commonUtils.encrypt_password(password);
        let new_password = password_array[0];
        let password_salt = password_array[1];
        if (req.body.old_password == password) {
          return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
            responses.CODE_SUCCESS, null, responses.MESSAGE_SAME_PASSWORD ));
        }
        user = await database_layer.db_update_single_record( userModel, { _id: req.body.id }, { password: new_password, password_salt: password_salt } );
        return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
          responses.CODE_SUCCESS, null, responses.MESSAGE_PASSWORD_UPDATED_SUCCESSFULLY ));
      } catch (e) {
        console.log("Error from Change Password Controller: " + e + " DATA: " + JSON.stringify(req.body));
        logger.error("Error from Change Password Controller: " + e + " DATA: " + JSON.stringify(req.body));
        return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
          responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR ));
      }
    },
    uploadImageController: async (req: Request, res: Response) => {
        /*
            This function uploads an image to firebase and returns url
            params: req, res
            return: url
        */
        try {
            if (!req.params.type || req.params.type != 'image') {
                return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_INVALID_CALL, null, responses.MESSAGE_INVALID_CALL
                ))
            }
            const image_url = await firebaseUtils.UPLOAD_IMAGE(req.file);
            if (!image_url) {
                return res.status(200).send(responses.get_response_object( responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR ));
            }
            return res.status(200).send(responses.get_response_object( responses.CODE_SUCCESS, { url: image_url }, responses.MESSAGE_SUCCESS ));
        }
        catch (e) {
            console.log("Error from Upload Image Controller: " + e);
            logger.error("Error from Upload Image Controller: " + e);
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR));
        }
    },
    socialLoginController: async (req: Request, res: Response) => {
        /*
            This function will socially login the account from the third party application's account
            parameters: request, response
            return:
        */
        try {
            const { error } = await commonUtils.validate_data(req.body);
            if (error) {
                return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                    responses.CODE_VALIDATION_FAILED, responses.MESSAGE_VALIDATION_FAILED + ": " + error.details[0].context?.key
                ))
            }
            let oauth_code: string = req.body[constants.OAUTH_CODE];
            req.params.channel = req.params.channel.trim().toLowerCase();
            if (req.params.channel != 'google' && req.params.channel != 'facebook' && req.params.channel != 'apple') {
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object( responses.CODE_INVALID_CALL, null, responses.MESSAGE_INVALID_CALL ));
            }

            else if (req.params.channel == 'google') {
                let google_response: AxiosResponse<any, any> = await axios.post(
                        config.GOOGLE_CONFIG["web"]["token_uri"], {
                        client_id: config.GOOGLE_CONFIG["web"]["client_id"],
                        client_secret: config.GOOGLE_CONFIG["web"]["client_secret"],
                        redirect_uri: (config.GOOGLE_CONFIG["web"]["redirect_uris"][0]),
                        grant_type: "authorization_code",
                        code: oauth_code
                    }
                )
                if (google_response.status != 200) {
                    console.log('RESPONSE FROM GOOGLE TOKEN: ' + JSON.stringify(google_response))
                    logger.info('RESPONSE FROM GOOGLE TOKEN: ' + JSON.stringify(google_response))
                    return res.status(200).send(responses.get_response_object(
                    responses.CODE_UNPROCESSABLE_ENTITY, null, responses.MESSAGE_INVALID_CALL
                    ))
                }
                google_response = google_response?.data
                console.log('RESPONSE FROM GOOGLE TOKEN: ' + JSON.stringify(google_response))
                logger.info('RESPONSE FROM GOOGLE TOKEN: ' + JSON.stringify(google_response))

                let google_user_info_uri: AxiosResponse<any, any> = await axios.get(
                    config.GOOGLE_CONFIG["web"]["get_user_info_uri"], {
                    headers: { Authorization: `Bearer ${google_response["access_token"]}` } }
                )
                if (google_user_info_uri.status != 200) {
                    return res.status(200).send(responses.get_response_object(
                    responses.CODE_UNPROCESSABLE_ENTITY, null, responses.MESSAGE_INVALID_CALL
                    ))
                }
                if (google_user_info_uri.status != 200) {
                    console.log('RESPONSE FROM GOOGLE USER INFO URI: ' + JSON.stringify(google_user_info_uri))
                    logger.info('RESPONSE FROM GOOGLE USER INFO URI: ' + JSON.stringify(google_user_info_uri))
                    return res.status(200).send(responses.get_response_object(
                    responses.CODE_UNPROCESSABLE_ENTITY, null, responses.MESSAGE_INVALID_CALL
                    ))
                }
                google_user_info_uri = google_user_info_uri?.data
                console.log('RESPONSE FROM GOOGLE USER INFO URI: ' + JSON.stringify(google_user_info_uri))
                logger.info('RESPONSE FROM GOOGLE USER INFO URI: ' + JSON.stringify(google_user_info_uri))

                let user = {};
                let existing_user = await database_layer.db_read_single_record(userModel, 
                    { oauth_code: google_user_info_uri["id"], registration_channel: static_data.REGISTRATION_CHANNELS[1], status: static_data.STATUSES[0] })

                if(!existing_user) {
                    let user_insert_data: {
                        name?: string,
                        email_address?: string,
                        oauth_code?: string,
                        registration_channel?: Object,
                        status?: Object
                    } = {
                    name: google_user_info_uri[constants.NAME],
                    email_address: google_user_info_uri["email"],
                    oauth_code: google_user_info_uri["id"],
                    registration_channel: static_data.REGISTRATION_CHANNELS[1],
                    status: static_data.STATUSES[0]
                    }
                    let new_user = await database_layer.db_insert_single_record(userModel, user_insert_data)
                    user = new_user
                }
                else {
                    user = existing_user;
                }
                let token_data: {user?: any, token?: string, purpose?: string} = {};
                token_data[constants.USER] = user;
                await database_layer.db_update_multiple_records(
                    TokenModel,
                    { user: token_data[constants.USER], purpose: "session_management" },
                    { is_expired: true, expiry_time: commonUtils.get_current_epoch_time() }
                );
                let user_data: string = JSON.stringify(user);
                let access_token = await commonUtils.create_jwt_token(user_data);
                token_data[constants.TOKEN] = access_token;
                token_data[constants.PURPOSE] = constants.SESSION_MANAGEMENT;
                let token = await database_layer.db_insert_single_record(TokenModel, token_data);
                return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                    responses.CODE_SUCCESS, 
                    {token: token[constants.TOKEN], user: await userUtils.get_user_object(user) }, 
                    responses.MESSAGE_SUCCESS
                ))
            }

            else if (req.params.channel == 'facebook') {
            let facebook_user_info_uri: AxiosResponse<any, any> = await axios.get(
                config.FACEBOOK_CONFIG["web"]["get_user_info_uri"], {
                params : { 
                    fields: "id,email,name",
                    access_token: oauth_code
                }
                }
            )
            if (facebook_user_info_uri.status != 200) {
                console.log('RESPONSE FROM FACEBOOK USER INFO URI: ' + JSON.stringify(facebook_user_info_uri))
                logger.info('RESPONSE FROM FACEBOOK USER INFO URI' + JSON.stringify(facebook_user_info_uri))
                return res.status(200).send(responses.get_response_object(
                responses.CODE_UNPROCESSABLE_ENTITY, null, responses.MESSAGE_INVALID_CALL
                ))
            }
            facebook_user_info_uri = facebook_user_info_uri?.data
            console.log('RESPONSE FROM FACEBOOK USER INFO URI: ' + JSON.stringify(facebook_user_info_uri))
            logger.info('RESPONSE FROM FACEBOOK USER INFO URI' + JSON.stringify(facebook_user_info_uri))
        
            let user = {};
            if (!facebook_user_info_uri.hasOwnProperty("email")) {
                    let uid = uuidv4().substring(0, 5);
                    facebook_user_info_uri["email"] = "User-" + uid + "@mail.com"
            }
            let existing_user = await database_layer.db_read_single_record(userModel, 
                { oauth_code: facebook_user_info_uri["id"], registration_channel: static_data.REGISTRATION_CHANNELS[2], status: static_data.STATUSES[0] })

            if (!existing_user) {
                let user_insert_data: {
                    name?: string,
                    email_address?: string,
                    oauth_code?: string,
                    registration_channel?: Object,
                    status?: Object
                } = {
                name: facebook_user_info_uri[constants.NAME],
                email_address: facebook_user_info_uri["email"],
                oauth_code: facebook_user_info_uri["id"],
                registration_channel: static_data.REGISTRATION_CHANNELS[2],
                status: static_data.STATUSES[0]
                }
                let new_user = await database_layer.db_insert_single_record(userModel, user_insert_data);
                user = new_user;
            }
            else {
                user = existing_user;
            }
            let token_data: {user?: any, token?: string, purpose?: string} = {};
            token_data[constants.USER] = user
            await database_layer.db_update_multiple_records(
                TokenModel,
                { user: token_data[constants.USER], purpose: "session_management" },
                { is_expired: true, expiry_time: commonUtils.get_current_epoch_time() }
            );
            let user_data: string = JSON.stringify(user);
            let access_token = await commonUtils.create_jwt_token(user_data);
            token_data[constants.TOKEN] = access_token;
            token_data[constants.PURPOSE] = constants.SESSION_MANAGEMENT;
            let token = await database_layer.db_insert_single_record(TokenModel, token_data);
            return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                responses.CODE_SUCCESS, 
                {token: token[constants.TOKEN], user: await userUtils.get_user_object(user) }, 
                responses.MESSAGE_SUCCESS
            ))
            }

            else if (req.params.channel == 'apple') {
            let client_secret: string = jwt.sign({}, config.APPLE_CONFIG["private_key"], {
                algorithm: 'ES256',
                expiresIn: '1h',
                audience: "APPLE_DOMAIN",
                issuer: config.APPLE_CONFIG["team_id"],
                subject: config.APPLE_CONFIG["service_id"],
                keyid: config.APPLE_CONFIG["key_id"]
            });

            console.log('GENERATED CLIENT SECRET: ', client_secret)
            logger.info("GENERATED CLIENT SECRET: ", client_secret)

            config.APPLE_CONFIG["client_secret"] = client_secret;

            let apple_response: AxiosResponse<any, any> = await axios.post(
                'https://appleid.apple.com/auth/token',
                {
                    grant_type: 'authorization_code',
                    oauth_code,
                    client_secret: config.APPLE_CONFIG["client_secret"],
                    client_id: config.APPLE_CONFIG["client_id"],
                    redirect_uri: config.APPLE_CONFIG["redirect_uris"][0]
                },
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, } );
        
                if (apple_response.status != 200) {
                console.log('APPLE TOKEN URI RESPONSE: ' + JSON.stringify(apple_response))
                logger.info('APPLE TOKEN URI RESPONSE: ' + JSON.stringify(apple_response))
                return res.status(200).send(responses.get_response_object(
                    responses.CODE_UNPROCESSABLE_ENTITY, null, responses.MESSAGE_INVALID_CALL
                ))
                }
                apple_response = JSON.parse(apple_response?.data);
                console.log('APPLE TOKEN URI RESPONSE: ' + JSON.stringify(apple_response))
                logger.info("APPLE TOKEN URI RESPONSE: " + JSON.stringify(apple_response))

                let id_token = apple_response["id_token"];
                console.log('ID TOKEN FOR APPLE SIGN: ', id_token)
                logger.info("ID TOKEN FOR APPLE SIGN: : ", id_token)
            
                let apple_user_info: string | jwt.JwtPayload = jwt.decode(id_token) || "";
                console.log('ID TOKEN FOR APPLE SIGN: ', JSON.stringify(apple_user_info))
                logger.info("ID TOKEN FOR APPLE SIGN: : ", JSON.stringify(apple_user_info))
            
                let existing_user = await database_layer.db_read_single_record(userModel, 
                    { oauth_code: apple_user_info["email"], registration_channel: static_data.REGISTRATION_CHANNELS[3], status: static_data.STATUSES[0] })

                let user = {};
                if (!existing_user) {
                    let user_insert_data: {
                        name?: string,
                        email_address?: string,
                        oauth_code?: string | any,
                        registration_channel?: Object,
                        status?: Object
                    } = {
                        name: apple_user_info[constants.NAME],
                        email_address: apple_user_info["email"],
                        oauth_code: apple_user_info["sub"],
                        registration_channel: static_data.REGISTRATION_CHANNELS[3],
                        status: static_data.STATUSES[0]
                    }
                    let new_user = await database_layer.db_insert_single_record(userModel, user_insert_data);
                    user = new_user;
                }
                else {
                    user = existing_user;
                }
                let token_data: {user?: any, token?: string, purpose?: string} = {}
                token_data[constants.USER] = user;
                await database_layer.db_update_multiple_records(
                    TokenModel,
                    { user: token_data[constants.USER], purpose: "session_management" },
                    { is_expired: true, expiry_time: commonUtils.get_current_epoch_time() }
                );
                let user_data: string = JSON.stringify(user);
                let access_token = await commonUtils.create_jwt_token(user_data);
                token_data[constants.TOKEN] = access_token;
                token_data[constants.PURPOSE] = constants.SESSION_MANAGEMENT;
                let token = await database_layer.db_insert_single_record(TokenModel, token_data);
                return res.status(responses.CODE_SUCCESS).send(responses.get_response_object(
                    responses.CODE_SUCCESS, 
                    {token: token[constants.TOKEN], user: await userUtils.get_user_object(user) }, 
                    responses.MESSAGE_SUCCESS
                ))
            }

            return res.status(200).send(responses.get_response_object(
            responses.CODE_SUCCESS, null, responses.MESSAGE_SUCCESS
            ))
        }
        catch(err) {
            console.log('ERROR IN SOCIAL LOGIN CONTROLLER: ' + err)
            logger.error('ERROR IN SOCIAL LOGIN CONTROLLER: ' + err)
            return res.status(responses.CODE_SUCCESS).send( responses.get_response_object(
            responses.CODE_GENERAL_ERROR, null, responses.MESSAGE_GENERAL_ERROR
        ))
        }
    }
}

export default userController;
