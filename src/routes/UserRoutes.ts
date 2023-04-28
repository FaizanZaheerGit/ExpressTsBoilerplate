import express, { Request, Response } from 'express';
import usersController from '../controllers/UserController';
import constants from '../utils/constants';
import commonUtils from '../utils/commonUtils';
import authentication_middleware from '../middlewares/authentication_middleware';
import logger from '../logger/logger';
import multer, { Multer } from 'multer';

const router = express.Router();

const Multer: Multer = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 5 * 1024 * 1024},

});

router.post('/create', async (req: Request, res: Response) => {
    let required_list: Array<string> = [constants.NAME, constants.EMAIL_ADDRESS, constants.PASSWORD];
    let optional_list: Array<string> = [constants.IMAGE];
    let response = await commonUtils.validate_request_body(req.body, required_list, optional_list)
    if (response["response_code"] != 200) {
        logger.error(`Missing Paramters: ${JSON.stringify(response["response_message"])}`)
        return res.status(200).send(response)
    }
    req.body = response["response_data"];
    return usersController.createController(req, res);
});

router.get('/read', async (req: Request, res: Response) => {
    let optional_list: Array<string> = [constants.EMAIL_ADDRESS, constants.PAGE, constants.LIMIT];
    let response = await commonUtils.validate_request_body(req.query, [], optional_list)
    if (response["response_code"] != 200) {
        return res.status(200).send(response)
    }
    req.query = response["response_data"];
    return usersController.readController(req, res);
});

router.put('/update', authentication_middleware, async (req: Request, res: Response) => {
    let required_list: Array<string> = [constants.UID];
    let optional_list: Array<string> = [constants.NAME, constants.STATUS, constants.IMAGE];
    let response = await commonUtils.validate_request_body(req.body, required_list, optional_list);
    if (response["response_code"] != 200) {
        logger.error(`Missing Paramters: ${JSON.stringify(response["response_message"])}`)
        return res.status(200).send(response)
    }
    req.body = response["response_data"];
    return usersController.updateController(req, res);
});

router.delete('/delete/:id', async (req: Request, res: Response) => {
    return usersController.deleteController(req, res);
});

router.post('/login', async (req: Request, res: Response) => {
    let required_list: Array<string> = [constants.EMAIL_ADDRESS, constants.PASSWORD];
    let response = await commonUtils.validate_request_body(req.body, required_list, [])
    if (response["response_code"] != 200) {
        logger.error(`Missing Paramters: ${JSON.stringify(response["response_message"])}`)
        return res.status(200).send(response)
    }
    req.body = response["response_data"];
    return usersController.loginController(req, res);
})

router.get('/logout', authentication_middleware, async(req: Request, res: Response) => {
    return usersController.logoutController(req, res);
})

router.post('/forget-password', async (req, res) => {
    let required_list: Array<string> = [constants.EMAIL_ADDRESS];
    let response = await commonUtils.validate_request_body(req.body, required_list, []);
    if (response["response_code"] != 200) {
        return res.status(200).send(response);
    };
    return usersController.forget_password_controller(req, res);
});

router.post('/reset-password', async (req: Request, res: Response) => {
    let required_list: Array<string> = [constants.UID, constants.TOKEN, constants.NEW_PASSWORD];
    let response = await commonUtils.validate_request_body(req.body, required_list, []);
    if (response["response_code"] != 200) {
        return res.status(200).send(response);
    };
    return usersController.reset_passsword_controller(req, res);
});

router.post('/change-password', authentication_middleware, async (req: Request, res: Response) => {
    let required_list: Array<string> = [constants.UID, constants.OLD_PASSWORD, constants.NEW_PASSWORD];
    let response = await commonUtils.validate_request_body(req.body, required_list, []);
    if (response["response_code"] != 200) {
        return res.status(200).send(response);
    };
    return usersController.change_passsword_controller(req, res);
});

router.post('/upload/:type', authentication_middleware, Multer.single('file'), async (req: Request, res: Response) => {
    return usersController.uploadImageController(req, res);
});

router.post('/social/login/:channel', async (req: Request, res: Response) => {
    let required_list: Array<string> = [constants.OAUTH_CODE];
    let optional_list: Array<string> = [constants.NAME];
    let response = await commonUtils.validate_request_body(req.body, required_list, optional_list);
    if (response.response_code != 200) {
      return res.status(200).send(response);
    };
    req.body = response.response_data;
    return usersController.socialLoginController(req, res);
  })

export default router;
