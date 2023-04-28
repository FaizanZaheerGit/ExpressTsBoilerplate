require('dotenv').config();

const { MONGODB_URI, ACCOUNT_TYPE, PROJECT_ID, PRIVATE_KEY_ID, PRIVATE_KEY, CLIENT_EMAIL, CLIENT_ID, AUTH_URI, STORAGE_BUCKET, TOKEN_URI, AUTH_PROVIDER_X509_CERT_URL, CLIENT_X509_CERT_URL } = process.env;

if (!MONGODB_URI) { console.log('EMPTY MONGO DB URI!') }

export const firebaseConfig: {
    "type": string,
    "project_id": string,
    "private_key_id": string,
    "private_key": string,
    "client_email": string,
    "client_id": string,
    "auth_uri": string,
    "storageBucket": string,
    "token_uri": string,
    "auth_provider_x509_cert_url": string,
    "client_x509_cert_url": string
} = {
    "type": ACCOUNT_TYPE || "",
    "project_id": PROJECT_ID || "",
    "private_key_id": PRIVATE_KEY_ID || "",
    "private_key": PRIVATE_KEY || "",
    "client_email": CLIENT_EMAIL || "",
    "client_id": CLIENT_ID || "",
    "auth_uri": AUTH_URI || "",
    "storageBucket": STORAGE_BUCKET || "",
    "token_uri": TOKEN_URI || "",
    "auth_provider_x509_cert_url": AUTH_PROVIDER_X509_CERT_URL || "",
    "client_x509_cert_url": CLIENT_X509_CERT_URL || ""
};

const googleConfig: {
    "web": {
        "client_id": string,
        "project_id": string,
        "auth_uri": string,
        "token_uri": string,
        "auth_provider_x509_cert_url": string,
        "client_secret": string,
        "get_user_info_uri": string,
        "redirect_uris": Array<string>,
        "javascript_origins": Array<string>
    }
} = {
    "web": {
        "client_id": "",
        "project_id": "",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "",
        "get_user_info_uri": "https://www.googleapis.com/oauth2/v2/userinfo",
        "redirect_uris": [
            "http://127.0.0.1:3000/social/signup",
        ],
        "javascript_origins": [
            "http://127.0.0.1:3000/"
        ]
    }
}

const facebookConfig: {
    "web": {
        "client_id": string,
        "client_secret": string,
        "token_uri": string,
        "get_user_info_uri": string,
        "redirect_uris": Array<string>
    }
} = {
    "web": {
        "client_id": "",
        "client_secret": "",
        "token_uri": "https://graph.facebook.com/v12.0/oauth/access_token",
        "get_user_info_uri": "https://graph.facebook.com/v12.0/me",
        "redirect_uris": []
    }
}


const appleConfig: {
    "client_id": string,
    "client_secret": string,
    "private_key": string,
    "team_id": string,
    "key_id": string,
    "token_uri": string,
    "client_secret_uri": string,
    "redirect_uris": Array<string>
} = {
    "client_id": "",
    "client_secret": "",
    "private_key": "",
    "team_id": "",
    "key_id": "",
    "token_uri": "https://appleid.apple.com/auth/token",
    "client_secret_uri": 'https://appleid.apple.com',
    "redirect_uris": ['http://127.0.0.1:3000/signup/apple']
}

let config = {
    SALT_WORK_FACTOR: 10,
    MONGO_DB_URI: MONGODB_URI,
    FIREBASE_CONFIG: firebaseConfig,
    GOOGLE_CONFIG: googleConfig,
    FACEBOOK_CONFIG: facebookConfig,
    APPLE_CONFIG: appleConfig
}

export default config;
