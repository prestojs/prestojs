import { EmailField, IntegerField, CharField, ViewModel } from '@prestojs/viewmodel';

export default class BaseUser extends ViewModel {
    static pkFieldName = 'id';
    static label = 'User';
    static labelPlural = 'Users';


    static _fields = {
        id: new IntegerField({
            label: 'ID',
            readOnly: true,
            writeOnly: false,
            helpText: null,
            blank: true,
            blankAsNull: false,
            minValue: null,
            maxValue: null,
        }),
        first_name: new CharField({
            label: 'First name',
            readOnly: false,
            writeOnly: false,
            helpText: null,
            blank: true,
            blankAsNull: false,
            maxLength: 128,
        }),
        last_name: new CharField({
            label: 'Last name',
            readOnly: false,
            writeOnly: false,
            helpText: null,
            blank: true,
            blankAsNull: false,
            maxLength: 128,
        }),
        email: new EmailField({
            label: 'Email',
            readOnly: false,
            writeOnly: false,
            helpText: null,
            blank: false,
            blankAsNull: false,
            maxLength: 254,
        }),
        region: new IntegerField({
            label: 'Region',
            readOnly: false,
            writeOnly: false,
            helpText: null,
            blank: true,
            blankAsNull: true,
            choices: new Map(Object.entries({1: 'Oceania', 2: 'Asia', 3: 'Africa', 4: 'America', 5: 'Europe', 6: 'Antarctica', 7: 'Atlantis'})),
        }),
    };
}


