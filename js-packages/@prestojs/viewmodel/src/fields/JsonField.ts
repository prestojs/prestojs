import CharField from './CharField';

export type JSON<T> = string & { ' __JSON': T };

/*
 * JSON Field.
 *
 * Parses valid json string into json objects. Invalid input will be treated as if they're already an object and returned as is.
 *
 * @extract-docs
 * @menu-group Fields
 */
export default class JsonField<T> extends CharField {
    static fieldClassName = 'JsonField';
    parse<T>(json: JSON<T>): T {
        try {
            return JSON.parse(json as string) as any;
        } catch (e) {
            return json as any;
        }
    }
}
