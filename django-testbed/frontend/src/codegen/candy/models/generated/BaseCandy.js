import { IntegerField, CharField, ViewModel } from '@prestojs/viewmodel';

export default class BaseCandy extends ViewModel {
    static pkFieldName = 'id';
    static label = 'Candy';
    static labelPlural = 'Candys';


    static _fields = {
        color: new IntegerField({
            label: 'Color',
            readOnly: false,
            writeOnly: false,
            helpText: null,
            blank: true,
            blankAsNull: false,
            choices: new Map(Object.entries({1: 'orange', 2: 'maple'})),
        }),
        flavor: new CharField({
            label: 'Flavor',
            readOnly: false,
            writeOnly: false,
            helpText: null,
            blank: true,
            blankAsNull: false,
            choices: new Map(Object.entries({'Orange': 'Orange', 'Maple': 'Maple'})),
        }),
    };
}


