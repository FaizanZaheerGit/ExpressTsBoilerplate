import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import commonUtils from '../utils/commonUtils';
import static_data from '../config/static_data';

@modelOptions({
    schemaOptions: {
        versionKey: false
    },
    options: {
        allowMixed: 0
    }
})

export class User {

    @prop({ type: String, default: "" })
    public name!: string

    @prop({ type: String, unique: true, required: true, lowercase: true })
    public email_address!: string

    @prop({ type: String, default: "" })
    public password!: string

    @prop({ type: String, default: "" })
    public password_salt!: string

    @prop({ type: String, default: "" })
    public image!: string

    @prop({ type: String, default: "" })
    public oauth_code!: string

    @prop({ type: Object, default: static_data.REGISTRATION_CHANNELS[0] })
    public registration_channel!: Object

    @prop({ type: Object, default: static_data.STATUSES[0] })
    public status!: Object

    @prop({ type: Number, default: commonUtils.get_current_epoch_time() })
    public created_at!: Number

    @prop({ type: Number, default: commonUtils.get_current_epoch_time() })
    public updated_at!: Number

}

const UserModel = getModelForClass(User);

export default UserModel;
