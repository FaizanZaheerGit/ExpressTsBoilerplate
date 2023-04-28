import firebase_admin, { ServiceAccount } from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { firebaseConfig } from '../config/config';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger/logger';
import responses from '../utils/responses';


export const firebaseApp: App = firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(firebaseConfig as ServiceAccount),
    storageBucket: firebaseConfig.storageBucket
});
export const storage = firebase_admin.storage(firebaseApp).bucket();

export async function uploadImage(file: Buffer | any) {
        /*
            This function will upload images to the firebase
            parameters: file
            return:
        */
    if (!file) {
        return responses.get_response_object(responses.CODE_MISSING_PARAMETERS,
            null, responses.MESSAGE_MISSING_PARAMTERS(["File"]))
    }
    const fileName: string = Date.now() + "-" + uuidv4() + "." + file.originalname.split('.').pop();
    const _file = storage.file(fileName);
    const stream = _file.createWriteStream({
        metadata: {
            contentType: file.mimetype
        }
    });
    stream.on("error", (err) => {
        console.log('COULD NOT UPLOAD IMAGE TO FIREBASE: ' + err);
        logger.error('COULD NOT UPLOAD IMAGE TO FIREBASE: ' + err);
    })
    stream.on("finish", async () => {
        try {
            await _file.makePublic()
            return `https://storage.googleapis.com/${firebaseConfig.storageBucket}/${fileName}`

        } catch (err) {
            console.log('COULD NOT UPLOAD IMAGE TO FIREBASE: ' + err);
            logger.error('COULD NOT UPLOAD IMAGE TO FIREBASE: ' + err);
        }
    })
    stream.end(file.buffer);
    return `https://storage.googleapis.com/${firebaseConfig.storageBucket}/${fileName}`
}

let firebaseUtils = {
    FIREBASE_APP: firebaseApp,
    STORAGE: storage,
    UPLOAD_IMAGE: uploadImage
};

export default firebaseUtils;
