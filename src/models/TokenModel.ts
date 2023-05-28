import { prop, getModelForClass, modelOptions, Ref } from '@typegoose/typegoose';
import commonUtils from '../utils/commonUtils';
import { User } from './UserModel';

@modelOptions({
    schemaOptions: {
        versionKey: false
    }
})

class Token {

    @prop({ ref: () => User, required: true })
    public user!: Ref<User>

    @prop({ type: String, default: "" })
    public token!: string

    @prop({ type: String, default: "" })
    public purpose!: string

    @prop({ type: Number, default: 0 })
    public expiry_time!: Number

    @prop({ type: Boolean, default: false })
    public is_expired!: Boolean

    @prop({ type: Number, default: commonUtils.get_current_epoch_time() })
    public created_at!: Number

    @prop({ type: Number, default: commonUtils.get_current_epoch_time() })
    public updated_at!: Number
}

const TokenModel = getModelForClass(Token);
export default TokenModel;
