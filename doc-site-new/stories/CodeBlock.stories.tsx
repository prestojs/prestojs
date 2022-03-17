import { CodeBlock } from '@prestojs/doc';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'doc/CodeBlock',
    component: CodeBlock,
} as ComponentMeta<typeof CodeBlock>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
export const AllSimpleTypes: ComponentStory<typeof CodeBlock> = () => (
    <CodeBlock>{`const fields = {
    userId: new IntegerField({ label: 'User ID' })
    firstName: new CharField({ label: 'First Name' }),
    // label is optional; will be generated as 'Last name'
    lastName: new CharField(),
};
// Options are all optional and can be omitted entirely
const options = {
    // Only one of pkFieldName or getImplicitPkField can be defined.
    // If neither are provided a default field called 'id' will be created.
    pkFieldName: 'userId',
    // Multiple names can be specified for compound keys
    pkFieldName: ['organisationId', 'departmentId']
    // You can also specify a function to create the primary key
    getImplicitPkField(model, fields) {
         if ('EntityId' in fields) {
             return ['EntityId', fields.EntityId];
         }
         // Generate a name base on model, eg. \`userId\`
         const name = model.name[0].toLowerCase() + model.name.slice(1);
         return [\`\${name}Id\`, new NumberField()];
     },
     // Optionally can specify a baseClass for this model. When using \`augment\`
     // this is automatically set to the class being augmented.
     baseClass: BaseViewModel,
};
class User extends viewModelFactory(fields, options) {
    // Optional; default cache is usually sufficient
    static cache = new MyCustomCache();
    // Used to describe a single user
    static label = 'User';
    // User to describe an indeterminate number of users
    static labelPlural = 'Users';
}`}</CodeBlock>
);
