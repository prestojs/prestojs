import {
  AsyncChoices,
  BooleanField,
  CharField,
  DateField,
  DateRangeField,
  DateTimeField,
  DateTimeRangeField,
  DecimalField,
  DurationField,
  EmailField,
  FileField,
  FloatField,
  IPAddressField,
  ImageField,
  IntegerField,
  IntegerRangeField,
  SlugField,
  TextField,
  TimeField,
  URLField,
  viewModelFactory
} from "@prestojs/viewmodel";
import {
  PageNumberPaginator,
  usePaginator
} from "@prestojs/util";
import {
  Endpoint,
  paginationMiddleware
} from "@prestojs/rest";
import { UrlPattern } from "@prestojs/routing";

export default class AllFieldsModel extends viewModelFactory(
  {
    id: new IntegerField({
      label: "ID",
      readOnly: true,
      blank: true
    }),
    boolean: new BooleanField({
      label: "Boolean",
      blank: true
    }),
    choices: new IntegerField({
      label: "Choices",
      blank: true,
      blankAsNull: true,
      choices: [
        [1, "Choice 1"],
        [2, "Choice 2"],
        [3, "Choice 3"]
      ]
    }),
    date: new DateField({
      label: "Date",
      blank: true,
      blankAsNull: true
    }),
    dateAndTime: new DateTimeField({
      label: "Date And Time",
      blank: true,
      blankAsNull: true
    }),
    dateRange: new DateRangeField({
      label: "Date Range",
      blank: true,
      blankAsNull: true
    }),
    dateTimeRange: new DateTimeRangeField({
      label: "Date Time Range",
      blank: true,
      blankAsNull: true
    }),
    decimalField: new DecimalField({
      label: "Decimal Field",
      blank: true,
      blankAsNull: true
    }),
    durationField: new DurationField({
      label: "Duration Field",
      blank: true,
      blankAsNull: true
    }),
    emailField: new EmailField({
      label: "Email Field",
      blank: true,
      maxLength: 254
    }),
    file: new FileField({
      label: "File",
      blank: true,
      blankAsNull: true
    }),
    floatField: new FloatField({
      label: "Float Field",
      blank: true,
      blankAsNull: true
    }),
    foreignKey: new IntegerField({
      label: "Foreign Key",
      blank: true,
      blankAsNull: true,
      asyncChoices: new AsyncChoices({
        multiple: false,
        useListProps() {
          const paginator = usePaginator(
            PageNumberPaginator
          );
          return { paginator };
        },
        async list({ query = {}, ...params }) {
          const list = new Endpoint(
            new UrlPattern("/api/server-choices/"),
            {
              middleware: [
                paginationMiddleware(PageNumberPaginator)
              ]
            }
          );
          return (
            await list.execute({
              query: {
                ...query,
                class_name:
                  "f6e3aae686a4455a12ca3f2254cbee11247d084a",
                field_name: "foreign_key"
              },
              ...params
            })
          ).result;
        },
        async retrieve(value, deps) {
          const retrieve = new Endpoint(
            new UrlPattern("/api/server-choices/")
          );
          return (
            (
              await retrieve.execute({
                query: {
                  class_name:
                    "f6e3aae686a4455a12ca3f2254cbee11247d084a",
                  field_name: "foreign_key",
                  pk: value
                },
                ...deps
              })
            ).result || []
          );
        },
        getLabel(item) {
          return item.label;
        },
        getValue(item) {
          return item.key;
        }
      })
    }),
    ipAddressField: new IPAddressField({
      label: "Ip Address Field",
      blank: true,
      blankAsNull: true
    }),
    imageField: new ImageField({
      label: "Image Field",
      blank: true,
      blankAsNull: true
    }),
    integerField: new IntegerField({
      label: "Integer Field",
      blank: true,
      blankAsNull: true,
      minValue: -2147483648,
      maxValue: 2147483647
    }),
    integerRange: new IntegerRangeField({
      label: "Integer Range",
      blank: true,
      blankAsNull: true
    }),
    nullBooleanField: new BooleanField({
      label: "Null Boolean Field",
      blank: true,
      blankAsNull: true
    }),
    positiveIntegerField: new IntegerField({
      label: "Positive Integer Field",
      blank: true,
      blankAsNull: true,
      minValue: 0,
      maxValue: 2147483647
    }),
    positiveSmallIntegerField: new IntegerField({
      label: "Positive Small Integer Field",
      blank: true,
      blankAsNull: true,
      minValue: 0,
      maxValue: 32767
    }),
    slugField: new SlugField({
      label: "Slug Field",
      blank: true,
      maxLength: 50
    }),
    stringChoices: new CharField({
      label: "String Choices",
      blank: true,
      choices: [
        ["choice_1", "Choice 1"],
        ["choice_2", "Choice 2"],
        ["choice_3", "Choice 3"]
      ]
    }),
    textfield: new TextField({
      label: "Textfield",
      blank: true,
      helpText: "Some help text"
    }),
    timeField: new TimeField({
      label: "Time Field",
      blank: true,
      blankAsNull: true
    }),
    urlField: new URLField({
      label: "Url Field",
      blank: true,
      maxLength: 200
    })
  },
  {
    pkFieldName: "id"
  }
) {
  static label = "All Fields Model";
  static labelPlural = "All Fields Models";
}
