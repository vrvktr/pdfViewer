import _ from 'lodash';


export function hasKeys(obj) {
    if (Object.keys(obj).length > 0) {
        return true;
    } else {
        return false;
    }
}