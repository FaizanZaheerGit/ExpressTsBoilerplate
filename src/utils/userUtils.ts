import constants from "./constants";

let userUtils = {
    get_user_object: async (user: any): Promise<any> => {
        let user_obj: {
            uid?: string,
            name?: string,
            email_address?: string,
            image?: string,
            status?: Object,
            registration_channel?: Object,
            created_at?: Number,
            updated_at?: Number
        } = {
            uid: user[constants.UID],
            name: user[constants.NAME],
            email_address: user[constants.EMAIL_ADDRESS],
            image: user[constants.IMAGE],
            registration_channel: user[constants.REGISTRATION_CHANNEL],
            status: user[constants.STATUS],
            created_at: user[constants.CREATED_AT],
            updated_at: user[constants.UPDATED_AT]
        }
        return user_obj;
    },
    filter_user_object: async function (users: Array<any>) {
        let user_list: Array<any> = [];
        for (let i = 0; i < users.length; i++) {
            user_list.push( await this.get_user_object(users[i]) );
        }
        return user_list;
    }
}

export default userUtils;
