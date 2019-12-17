import { IntegerField, CharField, BooleanField, ViewModel } from '@prestojs/viewmodel';

export default class BaseSuga extends ViewModel {
    static pkFieldName = 'id';
    static label = 'Suga';
    static labelPlural = 'Piles Of Suga';


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
        is_unistable: new BooleanField({
            label: 'Most important fact about a candy',
            readOnly: false,
            writeOnly: true,
            helpText: null,
            blank: true,
            blankAsNull: false,
        }),
    };
}


