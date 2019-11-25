import CharField from './CharField';

type JSON<T> = string & { ' __JSON': T };

/*
 * json field - parses string into json and formats json into string with JSON.parse and JSON.stringify.
 */

export default class JsonField<T> extends CharField<string> {
    parse<T>(json: JSON<T>): T {
        return JSON.parse(json as string) as any;
    }
}
