import commonUtils from '../utils/commonUtils';
import constants from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

let database_layer = {
    db_insert_single_record: async (collection: any, insert_data: Object | any): Promise<any> => {
        insert_data[constants.UID] = uuidv4();
        insert_data[constants.CREATED_AT] = commonUtils.get_current_epoch_time();
        insert_data[constants.UPDATED_AT] = commonUtils.get_current_epoch_time();
        let new_data = await collection.create(insert_data);
        return new_data;
    },
    db_insert_many_records: async (collection: any, insert_data: Array<Object> | any): Promise<any> => {
        insert_data.forEach(item => {
            item[constants.UID] = uuidv4();
            item[constants.CREATED_AT] = commonUtils.get_current_epoch_time();
            item[constants.UPDATED_AT] = commonUtils.get_current_epoch_time();
        });

        let new_data = await collection.insertMany(insert_data);
        return new_data;
    },
    db_read_single_record: async (collection: any, read_filter: Object | any): Promise<any> => {
        return await collection.findOne(read_filter);
    },
    db_read_multiple_records: async (collection: any, read_filter: Object | any, pageOptions: Object | any = {}, is_deleted: Boolean =false) => {
        if (!is_deleted) {
            read_filter[constants.STATUS] = { id: 1, name: "active" }
        }
        if ( Object.keys(pageOptions).length != 0 ) {
            return await collection.find(read_filter).skip( (pageOptions.page * pageOptions.limit) ).limit(pageOptions.limit).sort({ created_at: -1 })
        }
        else {
            return await collection.find(read_filter).sort({ created_at: -1 });
        }
    },
    db_update_single_record: async (collection: any, read_filter: Object | any, update_filter: Object | any): Promise<any> => {
        update_filter[constants.UPDATED_AT] = commonUtils.get_current_epoch_time();
        return await collection.updateOne(read_filter, update_filter);
    },
    db_update_multiple_records: async (collection: any, read_filter: Object | any, update_filter: Object | any): Promise<any> => {
        update_filter[constants.UPDATED_AT] = commonUtils.get_current_epoch_time();
        return await collection.updateMany(read_filter, update_filter);
    },
    db_delete_record: async (collection: any, delete_filter: Object | any): Promise<any> => {
        return await collection.deleteMany(delete_filter);
    }
}

export default database_layer
