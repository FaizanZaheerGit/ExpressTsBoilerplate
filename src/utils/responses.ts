let responses = {
    get_response_object: (statusCode: Number, data: Object | string | null =null, message: String | null =null) => {
        let response: {
            statusCode?: Number,
            data?: Object | string | null,
            message?: String | null
        } = {statusCode: statusCode};
        if (data) {
            response["data"] = data;
        }
        if (message) {
            response["message"] = message;
        }
        return response;
    },
    CODE_SUCCESS: 200,
    CODE_CREATED: 201,
    CODE_UNAUTHORIZED_ACCESS: 401,
    CODE_UNPROCESSABLE_ENTITY: 422,
    CODE_GENERAL_ERROR: 452,
    CODE_MISSING_PARAMETERS: 4001,
    CODE_ALREADY_EXISTS: 4002,
    CODE_VALIDATION_FAILED: 4003,
    CODE_INVALID_CALL: 4004,
    MESSAGE_SUCCESS: "SUCCESS",
    MESSAGE_UNAUTHORIZED_ACCESS: "Unauthorized Access",
    MESSAGE_INVALID_EMAIL_ADDRESS_OR_PASSWORD: "Invalid email address or password",
    MESSAGE_GENERAL_ERROR: "Something Went Wrong",
    MESSAGE_SERVER_ERROR: "Internal Server Error",
    MESSAGE_VALIDATION_FAILED: "Validation failed ",
    MESSAGE_INVALID_CALL: "Invalid Call",
    MESSAGE_INVALID_TOKEN: "Invalid Token",
    MESSAGE_SAME_PASSWORD: "You are using an older password",
    MESSAGE_PASSWORD_UPDATED_SUCCESSFULLY: "Password has been updated successfully",
    MESSAGE_MAIL_SENT_SUCCESSFULLY: "Mail has been sent successfully",
    MESSAGE_ALREADY_EXISTS: (params: Array<String>) => { return `${params[0]} with this ${params[1]} already exists` },
    MESSAGE_CREATED: (collection_name: String) => { return `${collection_name} created successfully` },
    MESSAGE_NOT_FOUND: (params: Array<String>) => { return `${params[0]} with this ${params[1]} is not found` },
    MESSAGE_MISSING_PARAMTERS: (params: Array<String> | []) => { return `Some Paramters Are Missing: ${params}` },
};

export default responses;
